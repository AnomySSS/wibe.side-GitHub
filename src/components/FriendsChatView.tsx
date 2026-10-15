import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  Heart,
  Smile,
  Camera,
  Mic,
  Image as ImageIcon,
  Phone,
  Video,
  Info,
  ChevronLeft,
  Plus,
  X,
  Sparkles,
  Calendar,
  Play,
  Pause,
  Flame,
  ThumbsUp,
  UserPlus,
  MapPin,
  Check,
  CheckCheck,
} from 'lucide-react';
import {
  UserProfile,
  DirectMessage,
  EventChatMessage,
  MeetupEvent,
  CATEGORY_MAP,
  StoryOrNoteItem,
} from '../types';
import { CategoryIcon } from './InteractiveRegionMap';

interface FriendsChatViewProps {
  currentUser: UserProfile;
  users: UserProfile[];
  messages: DirectMessage[];
  eventChats?: EventChatMessage[];
  events?: MeetupEvent[];
  activeFriendId: string;
  initialEventChatId?: string;
  onSelectFriend: (friendId: string) => void;
  onSendMessage: (receiverId: string, text: string, mediaUrl?: string, isVoiceNote?: boolean) => void;
  onSendEventChatMessage?: (eventId: string, text: string, mediaUrl?: string) => void;
  onToggleLikeDirectMessage?: (messageId: string) => void;
  onReactDirectMessage?: (messageId: string, emoji: string) => void;
  onToggleLikeEventChatMessage?: (messageId: string) => void;
  onReactEventChatMessage?: (messageId: string, emoji: string) => void;
  onAddFriend: (targetUserId: string) => void;
  onInspectUser: (userId: string) => void;
  typingFriendId?: string | null;
  onSelectEvent?: (eventId: string) => void;
}

// Preset quick emojis in Instagram Direct reaction pill
const QUICK_EMOJIS = ['❤️', '😂', '😮', '😢', '👏', '🔥'];

// Helper for strict chronological sorting of messages
export const getMessageTime = (m: DirectMessage): number => {
  if (typeof m.createdAt === 'number' && !isNaN(m.createdAt) && m.createdAt > 0) {
    return m.createdAt;
  }
  const digits = m.id.match(/(\d+)/g);
  if (digits && digits.length > 0) {
    const lastNum = parseInt(digits[digits.length - 1], 10);
    if (lastNum > 1000000000) return lastNum;
    return 1700000000000 + lastNum * 60000;
  }
  return 0;
};

export const FriendsChatView: React.FC<FriendsChatViewProps> = ({
  currentUser,
  users,
  messages,
  eventChats = [],
  events = [],
  activeFriendId,
  initialEventChatId,
  typingFriendId,
  onSelectFriend,
  onSendMessage,
  onSendEventChatMessage,
  onToggleLikeDirectMessage,
  onReactDirectMessage,
  onToggleLikeEventChatMessage,
  onReactEventChatMessage,
  onAddFriend,
  onInspectUser,
  onSelectEvent,
}) => {
  const [chatType, setChatType] = useState<'friends' | 'events'>(
    initialEventChatId ? 'events' : 'friends'
  );
  const [selectedEventId, setSelectedEventId] = useState<string>(
    initialEventChatId || events[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Reaction popover & double tap animations
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [animatingHeartMsgId, setAnimatingHeartMsgId] = useState<string | null>(null);
  const lastTapTimeRef = useRef<{ [msgId: string]: number }>({});

  // Audio voice note simulator state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // Active Story modal viewer
  const [activeStoryItem, setActiveStoryItem] = useState<StoryOrNoteItem | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);

  // Note editor modal for current user
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [currentUserNote, setCurrentUserNote] = useState<string>(
    'Dneska na srazu v HK! 👋'
  );
  const [tempNoteText, setTempNoteText] = useState('');

  // Call simulator modal (audio / video)
  const [callModalType, setCallModalType] = useState<'audio' | 'video' | null>(null);

  // Confirmed friends
  const friends = useMemo(
    () => users.filter((u) => currentUser.friendIds.includes(u.id)),
    [users, currentUser.friendIds]
  );

  // Non-friends for discovery
  const nonFriends = useMemo(
    () => users.filter((u) => u.id !== currentUser.id && !currentUser.friendIds.includes(u.id)),
    [users, currentUser]
  );

  // Currently active friend
  const activeFriend = useMemo(() => {
    if (activeFriendId) {
      const foundInFriends = friends.find((f) => f.id === activeFriendId);
      if (foundInFriends) return foundInFriends;
      const foundInAll = users.find((u) => u.id === activeFriendId && u.id !== currentUser.id);
      if (foundInAll) return foundInAll;
    }
    return friends[0] || users.find((u) => u.id !== currentUser.id) || null;
  }, [friends, users, activeFriendId, currentUser.id]);

  // Direct messages with active friend (strictly sorted by timestamp)
  const activeDirectMessages = useMemo(() => {
    if (!activeFriend) return [];
    return messages
      .filter(
        (m) =>
          (m.senderId === currentUser.id && m.receiverId === activeFriend.id) ||
          (m.senderId === activeFriend.id && m.receiverId === currentUser.id)
      )
      .sort((a, b) => getMessageTime(a) - getMessageTime(b));
  }, [messages, currentUser.id, activeFriend]);

  // Selected event
  const activeEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || events[0] || null;
  }, [events, selectedEventId]);

  // Event messages
  const activeEventMessages = useMemo(() => {
    if (!activeEvent) return [];
    return eventChats.filter((c) => c.eventId === activeEvent.id);
  }, [eventChats, activeEvent]);

  // Stories and Notes data
  const storiesList: StoryOrNoteItem[] = useMemo(() => {
    const list: StoryOrNoteItem[] = [
      {
        id: 'story-me',
        userId: currentUser.id,
        userName: currentUser.realName,
        userNickname: currentUser.nickname,
        userAvatar: currentUser.avatarUrl,
        noteText: currentUserNote,
        hasStory: false,
        isCurrentUser: true,
        isOnline: true,
      },
    ];

    // Friends stories and notes
    const friendNotes: Record<string, { note: string; hasStory: boolean }> = {
      'user-klara': { note: 'Výběrová káva na náměstí ☕', hasStory: true },
      'user-tomas': { note: 'Běhám na Bojišti 🌲🏃', hasStory: true },
      'user-anezka': { note: 'Vinyl set na terase 🎧', hasStory: true },
      'user-viky': { note: 'Malšovice skate session 🛹', hasStory: true },
      'user-eliska': { note: 'Kreslení u Labe 🎨', hasStory: true },
      'user-ondrej': { note: 'Orlické hory víkend ⛰️', hasStory: false },
    };

    friends.forEach((friend) => {
      const preset = friendNotes[friend.id] || { note: `${friend.city} 📍`, hasStory: true };
      list.push({
        id: `story-${friend.id}`,
        userId: friend.id,
        userName: friend.realName,
        userNickname: friend.nickname,
        userAvatar: friend.avatarUrl,
        noteText: preset.note,
        hasStory: preset.hasStory,
        isCurrentUser: false,
        isOnline: true,
      });
    });

    return list;
  }, [currentUser, currentUserNote, friends]);

  // Filtered conversation users (friends + active user + users with messages)
  const conversationUsers = useMemo(() => {
    const list = [...friends];
    if (activeFriend && !list.some((u) => u.id === activeFriend.id)) {
      list.unshift(activeFriend);
    }
    users.forEach((u) => {
      if (u.id === currentUser.id) return;
      if (list.some((existing) => existing.id === u.id)) return;
      const hasMsgs = messages.some(
        (m) =>
          (m.senderId === currentUser.id && m.receiverId === u.id) ||
          (m.senderId === u.id && m.receiverId === currentUser.id)
      );
      if (hasMsgs) {
        list.push(u);
      }
    });

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (f) =>
        f.realName.toLowerCase().includes(q) ||
        f.nickname.toLowerCase().includes(q) ||
        f.city.toLowerCase().includes(q)
    );
  }, [friends, activeFriend, users, currentUser.id, messages, searchQuery]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(
      (e) => e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  // Auto-scroll messages to bottom on new messages or typing status
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeDirectMessages.length, typingFriendId, activeFriend?.id, activeEventMessages.length, selectedEventId]);

  // Open chat pane automatically on mobile when activeFriendId is specified
  useEffect(() => {
    if (activeFriendId) {
      setMobileShowChat(true);
    }
  }, [activeFriendId]);

  // Story progress timer
  useEffect(() => {
    if (!activeStoryItem) {
      setStoryProgress(0);
      return;
    }
    setStoryProgress(0);
    const interval = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setActiveStoryItem(null);
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStoryItem]);

  // Handle Send text message
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    if (chatType === 'friends') {
      if (!activeFriend) return;
      onSendMessage(activeFriend.id, text);
    } else {
      if (!activeEvent || !onSendEventChatMessage) return;
      onSendEventChatMessage(activeEvent.id, text);
    }
    setInputText('');
  };

  // Quick Send Heart button (Instagram Direct classic)
  const handleSendQuickHeart = () => {
    if (chatType === 'friends') {
      if (!activeFriend) return;
      onSendMessage(activeFriend.id, '❤️');
    } else {
      if (!activeEvent || !onSendEventChatMessage) return;
      onSendEventChatMessage(activeEvent.id, '❤️');
    }
  };

  // Send voice note simulation
  const handleSendVoiceNote = () => {
    const simulatedNoteText = '🎤 Hlasová zpráva (0:12)';
    if (chatType === 'friends') {
      if (!activeFriend) return;
      onSendMessage(activeFriend.id, simulatedNoteText, undefined, true);
    } else {
      if (!activeEvent || !onSendEventChatMessage) return;
      onSendEventChatMessage(activeEvent.id, simulatedNoteText);
    }
  };

  // Send photo attachment simulation
  const handleSendPhoto = () => {
    const photoUrl = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80';
    if (chatType === 'friends') {
      if (!activeFriend) return;
      onSendMessage(activeFriend.id, '📸 Fotka ze srazu', photoUrl);
    } else {
      if (!activeEvent || !onSendEventChatMessage) return;
      onSendEventChatMessage(activeEvent.id, '📸 Fotka z akce', photoUrl);
    }
  };

  // Double click / tap handler for heart burst
  const handleMessageDoubleTap = (msgId: string, isEventChat = false) => {
    const now = Date.now();
    const lastTap = lastTapTimeRef.current[msgId] || 0;
    lastTapTimeRef.current[msgId] = now;

    // Trigger visual pop animation
    setAnimatingHeartMsgId(msgId);
    window.setTimeout(() => {
      setAnimatingHeartMsgId((curr) => (curr === msgId ? null : curr));
    }, 850);

    // Toggle heart reaction
    if (isEventChat) {
      if (onToggleLikeEventChatMessage) {
        onToggleLikeEventChatMessage(msgId);
      } else if (onReactEventChatMessage) {
        onReactEventChatMessage(msgId, '❤️');
      }
    } else {
      if (onToggleLikeDirectMessage) {
        onToggleLikeDirectMessage(msgId);
      } else if (onReactDirectMessage) {
        onReactDirectMessage(msgId, '❤️');
      }
    }
  };

  // Quick Emoji reaction click
  const handleEmojiClick = (msgId: string, emoji: string, isEventChat = false) => {
    setHoveredMessageId(null);
    if (isEventChat) {
      onReactEventChatMessage?.(msgId, emoji);
    } else {
      onReactDirectMessage?.(msgId, emoji);
    }
  };

  return (
    <div className="w-full h-full flex bg-[#000000] text-[#f5f5f5] overflow-hidden select-none font-sans">
      {/* ================= LEFT COLUMN: INSTAGRAM DIRECT CHAT LIST ================= */}
      <div
        className={`w-full md:w-88 lg:w-96 flex flex-col border-r border-[#262626] bg-[#000000] shrink-0 ${
          mobileShowChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Instagram Direct Top Header */}
        <div className="p-3.5 border-b border-[#262626] flex flex-col gap-3 shrink-0 bg-[#000000]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 cursor-pointer">
              <span className="text-base font-bold text-white tracking-tight flex items-center gap-1">
                @{currentUser.nickname}
                <span className="text-[11px] text-neutral-400">⌵</span>
              </span>
            </div>

            {/* Switcher pills: Direct Přátelé vs Srazy */}
            <div className="flex items-center gap-1 bg-[#181818] border border-[#2c2c2c] p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChatType('friends')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  chatType === 'friends'
                    ? 'bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white font-bold shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Přátelé ({friends.length})
              </button>
              <button
                type="button"
                onClick={() => setChatType('events')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  chatType === 'events'
                    ? 'bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white font-bold shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Srazy ({events.length})
              </button>
            </div>
          </div>

          {/* Search Bar - Instagram Direct Pill Style */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={chatType === 'friends' ? 'Hledat přátele v Directu...' : 'Hledat skupinový chat srazu...'}
              className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl pl-9 pr-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-[#7c3aed] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ================= STORIES & NOTES TRAY (Instagram Style) ================= */}
        {chatType === 'friends' && (
          <div className="border-b border-[#262626] py-3.5 px-3 bg-[#0a0a0a] overflow-x-auto no-scrollbar shrink-0">
            <div className="flex items-center gap-3.5 min-w-max">
              {storiesList.map((item) => {
                const isMe = item.isCurrentUser;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col items-center group relative cursor-pointer"
                    onClick={() => {
                      if (isMe) {
                        setTempNoteText(currentUserNote);
                        setShowNoteEditor(true);
                      } else {
                        setActiveStoryItem(item);
                        onSelectFriend(item.userId);
                      }
                    }}
                  >
                    {/* Speech Bubble Note hovering above avatar */}
                    {item.noteText ? (
                      <div className="max-w-[80px] bg-[#262626] border border-[#383838] px-2 py-1 rounded-2xl text-[10px] text-white shadow-lg text-center truncate mb-1 relative animate-in fade-in">
                        <span className="truncate block font-medium">{item.noteText}</span>
                        {/* Little triangle tail of speech bubble */}
                        <div className="w-1.5 h-1.5 bg-[#262626] border-r border-b border-[#383838] rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                      </div>
                    ) : (
                      <div className="h-6 flex items-center justify-center mb-1">
                        {isMe && (
                          <span className="text-[10px] text-neutral-400 font-medium">+ Poznámka</span>
                        )}
                      </div>
                    )}

                    {/* Avatar with Instagram Gradient Ring */}
                    <div className="relative">
                      <div
                        className={`rounded-full p-[2.5px] ${
                          item.hasStory
                            ? 'bg-gradient-to-tr from-[#f59e0b] via-[#ef4444] to-[#d946ef]'
                            : isMe
                            ? 'bg-neutral-800'
                            : 'bg-neutral-700'
                        }`}
                      >
                        <div className="p-[1.5px] bg-[#000000] rounded-full">
                          <img
                            src={item.userAvatar}
                            alt={item.userName}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Plus icon on current user avatar */}
                      {isMe && (
                        <div className="w-4 h-4 rounded-full bg-[#0095f6] border-2 border-black absolute bottom-0 right-0 flex items-center justify-center text-white">
                          <Plus className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}

                      {/* Online dot for friends */}
                      {!isMe && item.isOnline && (
                        <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-black absolute bottom-0.5 right-0.5 shadow-sm" />
                      )}
                    </div>

                    {/* Label below avatar */}
                    <span className="text-[11px] text-neutral-300 mt-1 max-w-[64px] truncate text-center">
                      {isMe ? 'Váš profil' : item.userNickname}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= CONVERSATIONS LIST (FRIENDS OR EVENTS) ================= */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#1e1e1e]/60">
          {chatType === 'friends' ? (
            conversationUsers.length > 0 ? (
              conversationUsers.map((friend) => {
                const isSelected = activeFriend?.id === friend.id;
                const isFriendTyping = typingFriendId === friend.id;
                // Get last message with this friend strictly sorted by timestamp
                const friendMsgs = messages
                  .filter(
                    (m) =>
                      (m.senderId === currentUser.id && m.receiverId === friend.id) ||
                      (m.senderId === friend.id && m.receiverId === currentUser.id)
                  )
                  .sort((a, b) => getMessageTime(a) - getMessageTime(b));
                const lastMsg = friendMsgs.slice(-1)[0];

                return (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => {
                      onSelectFriend(friend.id);
                      setMobileShowChat(true);
                    }}
                    className={`w-full p-3.5 flex items-center gap-3 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#181818] border-l-2 border-[#8b5cf6]'
                        : 'hover:bg-[#121212]'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="rounded-full p-[2px] bg-gradient-to-tr from-[#f59e0b] via-[#ef4444] to-[#d946ef]">
                        <div className="p-[1px] bg-black rounded-full">
                          <img
                            src={friend.avatarUrl}
                            alt={friend.nickname}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        </div>
                      </div>
                      <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-black absolute bottom-0 right-0 shadow" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-semibold text-white truncate">
                          {friend.realName}
                        </span>
                        {lastMsg && (
                          <span className="text-[10px] text-neutral-400 font-mono-tabular shrink-0">
                            {lastMsg.timestamp}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 truncate mt-0.5">
                        <span className="text-[#a78bfa] truncate">@{friend.nickname}</span>
                        <span>·</span>
                        <span className="truncate">{friend.city}</span>
                      </div>
                      {isFriendTyping ? (
                        <p className="text-xs text-[#c084fc] font-medium truncate mt-1 flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc]" />
                          <span>píše zprávu...</span>
                        </p>
                      ) : lastMsg ? (
                        <p className="text-xs text-neutral-300 truncate mt-1 flex items-center gap-1">
                          {lastMsg.senderId === currentUser.id ? (
                            <span className="text-neutral-400">Vy: </span>
                          ) : null}
                          <span className="truncate">{lastMsg.text}</span>
                        </p>
                      ) : null}
                    </div>

                    <Camera className="w-5 h-5 text-neutral-500 hover:text-white transition-colors shrink-0" />
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-neutral-400">
                Žádné konverzace neodpovídají hledání.
              </div>
            )
          ) : (
            filteredEvents.length > 0 ? (
              filteredEvents.map((ev) => {
                const isSelected = activeEvent?.id === ev.id;
                const catMeta = CATEGORY_MAP[ev.category];
                const countMsgs = eventChats.filter((c) => c.eventId === ev.id).length;

                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => {
                      setSelectedEventId(ev.id);
                      setMobileShowChat(true);
                      onSelectEvent?.(ev.id);
                    }}
                    className={`w-full p-3.5 flex items-center gap-3 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#181818] border-l-2 border-[#8b5cf6]'
                        : 'hover:bg-[#121212]'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-[#333333] shadow-md"
                      style={{
                        backgroundColor: '#121212',
                        borderColor: catMeta.colorHex,
                        color: catMeta.colorHex,
                      }}
                    >
                      <CategoryIcon category={ev.category} className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-semibold text-white truncate">{ev.title}</span>
                        <span className="text-[10px] text-purple-400 font-mono-tabular shrink-0">
                          {ev.startTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 truncate mt-0.5">
                        <span style={{ color: catMeta.colorHex }}>{catMeta.name}</span>
                        <span>·</span>
                        <span>{ev.city}</span>
                      </div>
                      <span className="text-[11px] text-neutral-400 mt-1 block font-mono-tabular">
                        {countMsgs} zpráv ve skupině · {ev.attendeesCount} účastníků
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-neutral-400">
                Žádné srazy neodpovídají hledání.
              </div>
            )
          )}

          {/* Discovery for non-friends */}
          {chatType === 'friends' && nonFriends.length > 0 && searchQuery && (
            <div className="p-3.5 bg-[#0a0a0a]">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-2 px-1">
                Lidé v kraji ({nonFriends.length})
              </span>
              <div className="space-y-1.5">
                {nonFriends.slice(0, 3).map((u) => (
                  <div
                    key={u.id}
                    className="p-2.5 rounded-xl bg-[#181818] border border-[#2c2c2c] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={u.avatarUrl}
                        alt={u.nickname}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-white block truncate">
                          @{u.nickname}
                        </span>
                        <span className="text-[10px] text-neutral-400 block truncate">{u.city}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAddFriend(u.id)}
                      className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white font-bold text-[10px] flex items-center gap-1 hover:opacity-90 transition-opacity shrink-0"
                    >
                      <UserPlus className="w-3 h-3" />
                      Přidat
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= RIGHT COLUMN: INSTAGRAM DIRECT CONVERSATION PANE ================= */}
      <div
        className={`flex-1 flex flex-col bg-[#000000] overflow-hidden ${
          !mobileShowChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {chatType === 'friends' && activeFriend ? (
          <>
            {/* Direct Top Bar - Friend */}
            <div className="h-16 px-4 border-b border-[#262626] bg-[#000000] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden p-1.5 rounded-full bg-[#181818] text-neutral-300 hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div
                  className="relative shrink-0 cursor-pointer"
                  onClick={() => onInspectUser(activeFriend.id)}
                >
                  <div className="rounded-full p-[2px] bg-gradient-to-tr from-[#f59e0b] via-[#ef4444] to-[#d946ef]">
                    <div className="p-[1px] bg-black rounded-full">
                      <img
                        src={activeFriend.avatarUrl}
                        alt={activeFriend.nickname}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-black absolute bottom-0 right-0" />
                </div>

                <div className="min-w-0">
                  <h3
                    className="text-sm font-bold text-white flex items-center gap-2 truncate cursor-pointer hover:underline"
                    onClick={() => onInspectUser(activeFriend.id)}
                  >
                    <span>{activeFriend.realName}</span>
                    <span className="text-xs font-normal text-[#a78bfa]">
                      @{activeFriend.nickname}
                    </span>
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                    {typingFriendId === activeFriend.id ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc] animate-ping shrink-0" />
                        <span className="text-[#c084fc] font-medium">píše zprávu...</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>Aktivní nyní · {activeFriend.city}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Instagram Direct Actions (Audio call, Video call, Details) */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setCallModalType('audio')}
                  className="w-9 h-9 rounded-full hover:bg-[#181818] text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
                  title="Hlasový hovor"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCallModalType('video')}
                  className="w-9 h-9 rounded-full hover:bg-[#181818] text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
                  title="Video hovor"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onInspectUser(activeFriend.id)}
                  className="w-9 h-9 rounded-full hover:bg-[#181818] text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
                  title="Detaily uživatele"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Direct Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#000000]">
              {/* Instagram Profile Greeting Header inside Chat */}
              <div className="flex flex-col items-center justify-center pt-8 pb-6 text-center">
                <div className="rounded-full p-[3px] bg-gradient-to-tr from-[#f59e0b] via-[#ef4444] to-[#d946ef] mb-3">
                  <div className="p-[2px] bg-black rounded-full">
                    <img
                      src={activeFriend.avatarUrl}
                      alt={activeFriend.nickname}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  </div>
                </div>
                <h4 className="text-base font-bold text-white">{activeFriend.realName}</h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  @{activeFriend.nickname} · Královéhradecký kraj
                </p>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs">{activeFriend.bio}</p>
                <button
                  type="button"
                  onClick={() => onInspectUser(activeFriend.id)}
                  className="mt-3 px-4 py-1.5 rounded-lg bg-[#262626] hover:bg-[#363636] text-white text-xs font-semibold transition-colors"
                >
                  Zobrazit profil
                </button>
                {!currentUser.friendIds.includes(activeFriend.id) && (
                  <div className="mt-3 px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between gap-3 text-left">
                    <span className="text-[11px] text-purple-200">
                      Zatím nejste v přátelích.
                    </span>
                    <button
                      type="button"
                      onClick={() => onAddFriend(activeFriend.id)}
                      className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white text-[11px] font-bold flex items-center gap-1 hover:opacity-90 transition-opacity"
                    >
                      <UserPlus className="w-3 h-3" />
                      Přidat
                    </button>
                  </div>
                )}
                <div className="w-full flex items-center gap-3 my-4">
                  <div className="h-[1px] bg-[#262626] flex-1" />
                  <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">
                    Dnes
                  </span>
                  <div className="h-[1px] bg-[#262626] flex-1" />
                </div>
              </div>

              {/* Message Items with Double Click & Reactions */}
              {activeDirectMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                const isHeartAnimating = animatingHeartMsgId === msg.id;
                const isHovered = hoveredMessageId === msg.id;
                const isLiked = !!msg.liked || (msg.likes && msg.likes.length > 0);

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col group relative ${isMe ? 'items-end' : 'items-start'}`}
                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                  >
                    {/* Floating Reaction Pill (Instagram Direct Style) on Hover */}
                    {isHovered && (
                      <div
                        className={`absolute -top-9 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-[#181818] border border-[#333333] shadow-2xl animate-reaction-pop ${
                          isMe ? 'right-0' : 'left-0'
                        }`}
                      >
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleEmojiClick(msg.id, emoji, false)}
                            className="w-6 h-6 flex items-center justify-center text-sm hover:scale-130 active:scale-95 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="relative max-w-[85%] sm:max-w-md">
                      {/* Double tap heart burst overlay */}
                      {isHeartAnimating && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                          <span className="text-5xl animate-insta-heart drop-shadow-lg">
                            ❤️
                          </span>
                        </div>
                      )}

                      {/* Photo Attachment if present */}
                      {msg.mediaUrl && (
                        <div
                          onDoubleClick={() => handleMessageDoubleTap(msg.id, false)}
                          className="rounded-[22px] overflow-hidden mb-1.5 border border-[#2a2a2a] cursor-pointer"
                        >
                          <img
                            src={msg.mediaUrl}
                            alt="Media attachment"
                            className="w-full max-h-64 object-cover"
                          />
                        </div>
                      )}

                      {/* Main Message Bubble */}
                      <div
                        onDoubleClick={() => handleMessageDoubleTap(msg.id, false)}
                        className={`relative px-4 py-2.5 text-sm leading-relaxed shadow-sm cursor-pointer select-none transition-transform active:scale-[0.99] ${
                          isMe
                            ? 'bg-gradient-to-r from-[#3b82f6] via-[#6366f1] to-[#a855f7] text-white rounded-[22px] rounded-br-[5px]'
                            : 'bg-[#262626] text-neutral-100 border border-[#333333] rounded-[22px] rounded-bl-[5px]'
                        }`}
                      >
                        {/* Voice Note Pill Player */}
                        {msg.isVoiceNote ? (
                          <div className="flex items-center gap-3 py-1 min-w-[180px]">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPlayingVoiceId((prev) => (prev === msg.id ? null : msg.id));
                              }}
                              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white shrink-0"
                            >
                              {playingVoiceId === msg.id ? (
                                <Pause className="w-4 h-4 fill-white" />
                              ) : (
                                <Play className="w-4 h-4 fill-white ml-0.5" />
                              )}
                            </button>
                            <div className="flex-1 flex items-center gap-0.5 h-6">
                              {[35, 60, 90, 45, 80, 100, 70, 50, 85, 40, 65, 30].map((h, i) => (
                                <div
                                  key={i}
                                  className={`flex-1 rounded-full transition-all ${
                                    playingVoiceId === msg.id ? 'bg-white' : 'bg-white/60'
                                  }`}
                                  style={{ height: `${h}%` }}
                                />
                              ))}
                            </div>
                            <span className="text-[11px] font-mono-tabular opacity-90">0:12</span>
                          </div>
                        ) : (
                          <span>{msg.text}</span>
                        )}
                      </div>

                      {/* Heart Badge at bottom-right corner of bubble */}
                      {isLiked && (
                        <button
                          type="button"
                          onClick={() => handleMessageDoubleTap(msg.id, false)}
                          className={`absolute -bottom-2.5 ${
                            isMe ? '-left-1' : '-right-1'
                          } z-10 px-1.5 py-0.5 rounded-full bg-[#1e1e1e] border border-[#363636] shadow-md flex items-center gap-1 text-[11px] hover:scale-110 active:scale-95 transition-transform`}
                          title="Líbí se vám"
                        >
                          <span>❤️</span>
                          {msg.likes && msg.likes.length > 1 && (
                            <span className="text-[9px] text-white font-bold">{msg.likes.length}</span>
                          )}
                        </button>
                      )}

                      {/* Emoji reaction pills list */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div
                          className={`flex items-center gap-1 mt-1 ${
                            isMe ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {msg.reactions.map((r, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleEmojiClick(msg.id, r.emoji, false)}
                              className="px-2 py-0.5 rounded-full bg-[#181818] border border-[#333333] text-[11px] flex items-center gap-1 text-white hover:bg-[#262626] transition-colors"
                            >
                              <span>{r.emoji}</span>
                              <span className="text-[10px] text-neutral-400 font-bold">{r.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-mono-tabular mt-1 px-1">
                      <span>{msg.timestamp}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-[#a78bfa]" />}
                    </div>
                  </div>
                );
              })}
              {/* Instagram Direct Typing Bubble Indicator */}
              {typingFriendId === activeFriend.id && (
                <div className="flex items-center gap-2 text-neutral-400 py-1">
                  <div className="relative shrink-0">
                    <img
                      src={activeFriend.avatarUrl}
                      alt={activeFriend.nickname}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  </div>
                  <div className="px-3.5 py-2.5 rounded-[20px] rounded-bl-[4px] bg-[#262626] border border-[#333333] flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 animate-bounce" />
                  </div>
                  <span className="text-[11px] text-neutral-400 italic">
                    {activeFriend.realName.split(' ')[0]} píše...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ================= INSTAGRAM DIRECT PILL INPUT BAR ================= */}
            <form
              onSubmit={handleSend}
              className="p-3 border-t border-[#262626] bg-[#000000] flex items-center gap-2 shrink-0"
            >
              <div className="flex-1 bg-[#262626] border border-[#363636] rounded-full px-3 py-1.5 flex items-center gap-2">
                {/* Blue Camera icon button */}
                <button
                  type="button"
                  onClick={handleSendPhoto}
                  className="w-7 h-7 rounded-full bg-[#0095f6] hover:bg-[#1877f2] text-white flex items-center justify-center transition-colors shrink-0"
                  title="Poslat fotku"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Zpráva..."
                  className="flex-1 bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none"
                />

                {/* Right actions when input is empty vs non-empty */}
                {inputText.trim() ? (
                  <button
                    type="submit"
                    className="text-[#0095f6] hover:text-[#3897f0] font-bold text-sm px-2 transition-colors cursor-pointer"
                  >
                    Odeslat
                  </button>
                ) : (
                  <div className="flex items-center gap-1 text-neutral-400">
                    <button
                      type="button"
                      onClick={handleSendVoiceNote}
                      className="p-1.5 hover:text-white transition-colors"
                      title="Nahrát hlasovou zprávu"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleSendPhoto}
                      className="p-1.5 hover:text-white transition-colors"
                      title="Přidat fotku"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleSendQuickHeart}
                      className="p-1.5 hover:scale-120 active:scale-95 transition-transform"
                      title="Rychlé srdce"
                    >
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                    </button>
                  </div>
                )}
              </div>
            </form>
          </>
        ) : chatType === 'events' && activeEvent ? (
          <>
            {/* Event Group Chat Header */}
            <div className="h-16 px-4 border-b border-[#262626] bg-[#000000] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden p-1.5 rounded-full bg-[#181818] text-neutral-300 hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-md"
                  style={{
                    backgroundColor: '#121212',
                    borderColor: CATEGORY_MAP[activeEvent.category].colorHex,
                    color: CATEGORY_MAP[activeEvent.category].colorHex,
                  }}
                >
                  <CategoryIcon category={activeEvent.category} className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{activeEvent.title}</h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                    <Calendar className="w-3 h-3 text-[#a78bfa]" />
                    <span>
                      {activeEvent.city} · {activeEvent.startTime} · Skupinový chat ({activeEvent.attendeesCount} lidí)
                    </span>
                  </div>
                </div>
              </div>

              {onSelectEvent && (
                <button
                  type="button"
                  onClick={() => onSelectEvent(activeEvent.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#262626] hover:bg-[#363636] text-white text-xs font-semibold border border-[#383838] transition-colors shrink-0"
                >
                  Detail srazu
                </button>
              )}
            </div>

            {/* Event Group Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#000000]">
              {/* Event Header Greeting */}
              <div className="flex flex-col items-center justify-center pt-6 pb-4 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2 border shadow-lg"
                  style={{
                    backgroundColor: '#121212',
                    borderColor: CATEGORY_MAP[activeEvent.category].colorHex,
                    color: CATEGORY_MAP[activeEvent.category].colorHex,
                  }}
                >
                  <CategoryIcon category={activeEvent.category} className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-white">{activeEvent.title}</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                  Skupinová konverzace účastníků srazu v {activeEvent.city}. Domluvte si sraz, příchod a program!
                </p>
                <div className="w-full flex items-center gap-3 my-4">
                  <div className="h-[1px] bg-[#262626] flex-1" />
                  <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">
                    Sraz zahájen
                  </span>
                  <div className="h-[1px] bg-[#262626] flex-1" />
                </div>
              </div>

              {activeEventMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                const isHeartAnimating = animatingHeartMsgId === msg.id;
                const isHovered = hoveredMessageId === msg.id;
                const isLiked = !!msg.liked || (msg.likes && msg.likes.length > 0);

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col group relative ${isMe ? 'items-end' : 'items-start'}`}
                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                  >
                    {/* Hover Reaction Bar */}
                    {isHovered && (
                      <div
                        className={`absolute -top-9 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-[#181818] border border-[#333333] shadow-2xl animate-reaction-pop ${
                          isMe ? 'right-0' : 'left-0'
                        }`}
                      >
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleEmojiClick(msg.id, emoji, true)}
                            className="w-6 h-6 flex items-center justify-center text-sm hover:scale-130 active:scale-95 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {!isMe && (
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderNickname}
                          referrerPolicy="no-referrer"
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="text-[11px] text-[#a78bfa] font-semibold">
                          @{msg.senderNickname}
                        </span>
                      </div>
                    )}

                    <div className="relative max-w-[85%] sm:max-w-md">
                      {/* Double tap heart burst overlay */}
                      {isHeartAnimating && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                          <span className="text-5xl animate-insta-heart drop-shadow-lg">
                            ❤️
                          </span>
                        </div>
                      )}

                      {/* Main Message Bubble */}
                      <div
                        onDoubleClick={() => handleMessageDoubleTap(msg.id, true)}
                        className={`relative px-4 py-2.5 text-sm leading-relaxed shadow-sm cursor-pointer select-none transition-transform active:scale-[0.99] ${
                          isMe
                            ? 'bg-gradient-to-r from-[#3b82f6] via-[#6366f1] to-[#a855f7] text-white rounded-[22px] rounded-br-[5px]'
                            : 'bg-[#262626] text-neutral-100 border border-[#333333] rounded-[22px] rounded-bl-[5px]'
                        }`}
                      >
                        {msg.text}
                      </div>

                      {/* Heart Badge at bottom corner */}
                      {isLiked && (
                        <button
                          type="button"
                          onClick={() => handleMessageDoubleTap(msg.id, true)}
                          className={`absolute -bottom-2.5 ${
                            isMe ? '-left-1' : '-right-1'
                          } z-10 px-1.5 py-0.5 rounded-full bg-[#1e1e1e] border border-[#363636] shadow-md flex items-center gap-1 text-[11px] hover:scale-110 active:scale-95 transition-transform`}
                        >
                          <span>❤️</span>
                          {msg.likes && msg.likes.length > 1 && (
                            <span className="text-[9px] text-white font-bold">{msg.likes.length}</span>
                          )}
                        </button>
                      )}

                      {/* Reactions */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div
                          className={`flex items-center gap-1 mt-1 ${
                            isMe ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {msg.reactions.map((r, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleEmojiClick(msg.id, r.emoji, true)}
                              className="px-2 py-0.5 rounded-full bg-[#181818] border border-[#333333] text-[11px] flex items-center gap-1 text-white hover:bg-[#262626]"
                            >
                              <span>{r.emoji}</span>
                              <span className="text-[10px] text-neutral-400 font-bold">{r.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-neutral-500 font-mono-tabular mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Event Chat Input Form */}
            <form
              onSubmit={handleSend}
              className="p-3 border-t border-[#262626] bg-[#000000] flex items-center gap-2 shrink-0"
            >
              <div className="flex-1 bg-[#262626] border border-[#363636] rounded-full px-3 py-1.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendPhoto}
                  className="w-7 h-7 rounded-full bg-[#0095f6] hover:bg-[#1877f2] text-white flex items-center justify-center transition-colors shrink-0"
                  title="Poslat fotku do chatu akce"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Napište zprávu pro účastníky srazu..."
                  className="flex-1 bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none"
                />

                {inputText.trim() ? (
                  <button
                    type="submit"
                    className="text-[#0095f6] hover:text-[#3897f0] font-bold text-sm px-2 transition-colors cursor-pointer"
                  >
                    Odeslat
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendQuickHeart}
                    className="p-1.5 hover:scale-120 active:scale-95 transition-transform"
                    title="Rychlé srdce"
                  >
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  </button>
                )}
              </div>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400 bg-[#000000]">
            <div className="w-16 h-16 rounded-full bg-[#181818] border border-[#333333] flex items-center justify-center text-[#a78bfa] mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Vaše zprávy</h4>
            <p className="text-xs max-w-xs text-neutral-400">
              Posílejte soukromé zprávy nebo chatujte se všemi účastníky srazů v Královéhradeckém kraji.
            </p>
          </div>
        )}
      </div>

      {/* ================= INSTAGRAM STORY VIEWER MODAL ================= */}
      {activeStoryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-sm h-[82vh] max-h-[680px] bg-neutral-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative border border-[#333333]">
            {/* Top Instagram Progress Bar */}
            <div className="absolute top-3 left-4 right-4 z-20 flex gap-1">
              <div className="h-1 bg-white/30 flex-1 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{ width: `${storyProgress}%` }}
                />
              </div>
            </div>

            {/* Top User Info & Close */}
            <div className="absolute top-7 left-4 right-4 z-20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={activeStoryItem.userAvatar}
                  alt={activeStoryItem.userName}
                  className="w-8 h-8 rounded-full object-cover border border-white/60"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    {activeStoryItem.userName}
                  </span>
                  <span className="text-[10px] text-white/70 block">Před 2 h</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveStoryItem(null)}
                className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Story Visual Content */}
            <div className="flex-1 relative bg-gradient-to-br from-[#1e1b4b] via-[#311042] to-[#0f172a] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-[#f59e0b] via-[#ef4444] to-[#d946ef] mb-6 shadow-2xl">
                <img
                  src={activeStoryItem.userAvatar}
                  alt={activeStoryItem.userName}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <p className="text-lg font-bold text-white leading-relaxed max-w-xs drop-shadow">
                "{activeStoryItem.noteText || 'Těším se na další sraz v kraji!'}"
              </p>
              <div className="mt-4 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs text-white">
                📍 Královéhradecký kraj
              </div>
            </div>

            {/* Bottom Story Reply Bar */}
            <div className="p-3 bg-black/80 backdrop-blur border-t border-white/10 flex items-center gap-2 z-20">
              <input
                type="text"
                placeholder={`Odpovědět uživateli @${activeStoryItem.userNickname}...`}
                className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-white/50 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    onSendMessage(activeStoryItem.userId, `K příběhu: ${e.currentTarget.value.trim()}`);
                    e.currentTarget.value = '';
                    setActiveStoryItem(null);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  onSendMessage(activeStoryItem.userId, '❤️');
                  setActiveStoryItem(null);
                }}
                className="p-2 text-rose-500 hover:scale-120 transition-transform"
              >
                <Heart className="w-5 h-5 fill-rose-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= INSTAGRAM NOTE EDITOR MODAL ================= */}
      {showNoteEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-[#181818] rounded-3xl p-5 border border-[#333333] shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Sdílet poznámku</h3>
              <button
                type="button"
                onClick={() => setShowNoteEditor(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center my-2">
              {/* Bubble preview */}
              <div className="bg-[#262626] border border-[#383838] px-3 py-1.5 rounded-2xl text-xs text-white shadow-lg mb-2 relative">
                <span>{tempNoteText || 'Sdílejte myšlenku...'}</span>
                <div className="w-2 h-2 bg-[#262626] border-r border-b border-[#383838] rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
              </div>
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.realName}
                className="w-16 h-16 rounded-full object-cover border-2 border-neutral-700"
              />
            </div>

            <input
              type="text"
              maxLength={60}
              value={tempNoteText}
              onChange={(e) => setTempNoteText(e.target.value)}
              placeholder="Sdílejte, co máte v plánu (max 60 znaků)..."
              className="w-full bg-[#262626] border border-[#383838] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#a855f7]"
            />

            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span>Viditelné pro přátele po dobu 24 hodin</span>
              <span>{tempNoteText.length}/60</span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNoteEditor(false)}
                className="flex-1 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-neutral-300 text-xs font-semibold"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentUserNote(tempNoteText.trim());
                  setShowNoteEditor(false);
                }}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] hover:opacity-90 text-white text-xs font-bold"
              >
                Sdílet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= INSTAGRAM AUDIO / VIDEO CALL SIMULATOR MODAL ================= */}
      {callModalType && activeFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-sm h-[75vh] max-h-[580px] bg-neutral-950 rounded-3xl p-6 border border-[#333333] shadow-2xl flex flex-col items-center justify-between text-center relative">
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={() => setCallModalType(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-[#6366f1] to-[#a855f7] animate-pulse">
                  <img
                    src={activeFriend.avatarUrl}
                    alt={activeFriend.realName}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <h3 className="text-lg font-bold text-white">{activeFriend.realName}</h3>
              <p className="text-xs text-[#a78bfa] mt-0.5">@{activeFriend.nickname}</p>
              <p className="text-xs text-neutral-400 mt-2 flex items-center gap-1.5 animate-pulse">
                <span>Vyzvánění {callModalType === 'video' ? 'video hovoru' : 'audio hovoru'}...</span>
              </p>
            </div>

            <div className="flex items-center gap-6 pb-4">
              <button
                type="button"
                onClick={() => setCallModalType(null)}
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
                title="Zavěsit"
              >
                <Phone className="w-6 h-6 rotate-135" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
