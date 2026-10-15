import React, { useState, useEffect, useRef } from 'react';
import {
  Map,
  PlusCircle,
  Trophy,
  User,
  MessageSquare,
  CheckCircle2,
  X,
  Lock,
  UserPlus,
  Clock,
} from 'lucide-react';
import {
  MeetupEvent,
  EventCategory,
  UserProfile,
  DirectMessage,
  EventChatMessage,
  calculateEventRating,
} from './types';
import {
  INITIAL_EVENTS,
  INITIAL_USERS,
  INITIAL_CURRENT_USER,
  INITIAL_MESSAGES,
  INITIAL_EVENT_CHATS,
} from './data/mockData';
import { generateRealisticReply } from './data/chatResponses';
import { OpenDataPlace } from './data/openDataPlaces';
import { RouteDestination } from './utils/routing';
import { recordNewCreation, checkCreationRateLimit } from './utils/rateLimit';
import { getSavedGpsHome, saveGpsHome } from './utils/gpsHomeStorage';
import { InteractiveRegionMap } from './components/InteractiveRegionMap';
import { EventDetailModal } from './components/EventDetailModal';
import { CreateEventView } from './components/CreateEventView';
import { LeaderboardView } from './components/LeaderboardView';
import { ProfileView } from './components/ProfileView';
import { FriendsChatView } from './components/FriendsChatView';
import {
  UserInspectModal,
  DirectMessagesModal,
  AuthOnboardingModal,
} from './components/SocialModals';
import { SmsPaletteReminderModal } from './components/SmsPaletteReminderModal';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallBanner';

type ActiveTab = 'map' | 'create' | 'chat' | 'leaderboard' | 'profile';

function getSavedClaimedEventIds(): string[] {
  try {
    const raw = localStorage.getItem('wibe_claimed_events');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function saveClaimedEventId(eventId: string) {
  try {
    const existing = getSavedClaimedEventIds();
    if (!existing.includes(eventId)) {
      localStorage.setItem('wibe_claimed_events', JSON.stringify([...existing, eventId]));
    }
  } catch {
    // ignore
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [events, setEvents] = useState<MeetupEvent[]>(() => {
    const claimed = getSavedClaimedEventIds();
    if (claimed.length === 0) return INITIAL_EVENTS;
    return INITIAL_EVENTS.map((ev) => {
      if (claimed.includes(ev.id)) {
        return {
          ...ev,
          checkedInByMe: true,
          attendeeIds: ev.attendeeIds.includes(INITIAL_CURRENT_USER.id)
            ? ev.attendeeIds
            : [...ev.attendeeIds, INITIAL_CURRENT_USER.id],
        };
      }
      return ev;
    });
  });
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const claimed = getSavedClaimedEventIds();
    if (claimed.length === 0) return INITIAL_USERS;
    return INITIAL_USERS.map((u) => {
      if (u.id === INITIAL_CURRENT_USER.id) {
        const mergedVisited = Array.from(new Set([...u.visitedEventIds, ...claimed]));
        const extraPoints = claimed.filter((id) => !u.visitedEventIds.includes(id)).length * 50;
        return {
          ...u,
          visitedEventIds: mergedVisited,
          xpPoints: u.xpPoints + extraPoints,
          weeklyXpPoints: u.weeklyXpPoints + extraPoints,
        };
      }
      return u;
    });
  });
  const [currentUserId] = useState<string>(INITIAL_CURRENT_USER.id);

  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');

  // User GPS location starts from persisted saved GPS home (or default Hradec Králové)
  const [userGps, setUserGps] = useState<{ lat: number; lng: number; label: string }>(
    () => getSavedGpsHome()
  );

  // Modals and chat state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [inspectedUserId, setInspectedUserId] = useState<string | null>(null);
  const [showMessagesModal, setShowMessagesModal] = useState<boolean>(false);
  const [activeChatFriendId, setActiveChatFriendId] = useState<string>('user-klara');
  const [activeEventChatId, setActiveEventChatId] = useState<string>('evt-hk-kava');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalReason, setAuthModalReason] = useState<'like' | 'sms' | null>(null);
  const [pendingLikeEventId, setPendingLikeEventId] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('wibe_is_registered');
      return saved === 'true'; // Default to false (unregistered guest) unless registered
    } catch {
      return false;
    }
  });
  const [messages, setMessages] = useState<DirectMessage[]>(INITIAL_MESSAGES);
  const [typingFriendId, setTypingFriendId] = useState<string | null>(null);
  const [prefilledPlace, setPrefilledPlace] = useState<OpenDataPlace | null>(null);
  const [activeNavDestination, setActiveNavDestination] = useState<RouteDestination | null>(null);
  const replyTimeoutsRef = useRef<{ [friendId: string]: number }>({});
  const typingTimeoutsRef = useRef<{ [friendId: string]: number }>({});
  const [eventChats, setEventChats] = useState<EventChatMessage[]>(INITIAL_EVENT_CHATS);
  const [hostBonusClaimed, setHostBonusClaimed] = useState<boolean>(false);
  const [smsReminderEvent, setSmsReminderEvent] = useState<MeetupEvent | null>(null);
  const [userPhone, setUserPhone] = useState<string>(() => {
    try {
      return localStorage.getItem('wibe_user_phone') || '+420 732 418 902';
    } catch {
      return '+420 732 418 902';
    }
  });

  // Real event auto-expiration with live ticker and time simulator state
  const [timeOffsetHours, setTimeOffsetHours] = useState<number>(0);
  const [showTimeSimulator, setShowTimeSimulator] = useState<boolean>(false);
  const [currentTimeTick, setCurrentTimeTick] = useState<number>(Date.now());

  // Real-time ticker: checks every 10 seconds so expired events disappear live!
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeTick(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const currentEffectiveTimeMs = currentTimeTick + timeOffsetHours * 3600 * 1000;

  // Real expiration: events past their expiration timestamp disappear from the map!
  const visibleEvents = events.filter(
    (ev) => ev.expiresAtTimestamp > currentEffectiveTimeMs
  );
  const expiredCount = events.length - visibleEvents.length;

  // Non-blocking Czech Toast Alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Retrieve user's physical GPS location on startup and save as Home
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const saved = saveGpsHome(
            pos.coords.latitude,
            pos.coords.longitude,
            'Skutečná GPS poloha (Uložený domov)'
          );
          setUserGps(saved);
        },
        () => {
          // If permission denied or timeout, keep persisted saved GPS home
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const currentUser =
    users.find((u) => u.id === currentUserId) || INITIAL_CURRENT_USER;

  const selectedEvent =
    events.find((e) => e.id === selectedEventId) || null;

  const inspectedUser =
    users.find((u) => u.id === inspectedUserId) || null;

  const handleRequestRealGps = () => {
    if (!('geolocation' in navigator)) {
      showToast('Prohlížeč nepodporuje geolokaci.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const saved = saveGpsHome(
          pos.coords.latitude,
          pos.coords.longitude,
          'Skutečná GPS poloha (Uložený domov)'
        );
        setUserGps(saved);
        showToast('GPS poloha načtena a uložena jako váš domov.');
      },
      () => {
        showToast('Přístup k poloze nebyl povolen. Ponechán stávající GPS domov.');
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const executeLike = (eventId: string) => {
    let targetEvent: MeetupEvent | undefined;
    let nextLiked = false;

    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        nextLiked = !ev.isLikedByMe;
        // If event is inactive and liked, enable smsAlertSubscribed
        const smsSubscribed = !ev.isActive ? nextLiked : false;
        const updated: MeetupEvent = {
          ...ev,
          isLikedByMe: nextLiked,
          smsAlertSubscribed: smsSubscribed,
          likesCount: nextLiked ? ev.likesCount + 1 : Math.max(0, ev.likesCount - 1),
        };
        targetEvent = updated;
        return updated;
      })
    );

    if (targetEvent) {
      if (nextLiked) {
        if (!targetEvent.isActive) {
          // Event is NOT active yet: open Palette SMS Reminder modal!
          setSmsReminderEvent(targetEvent);
          showToast(
            `Lajknuto! Událost začíná ${targetEvent.startTime} — otevírá se Paleta SMS připomínky.`
          );
        } else {
          // Event is already active: normal like
          showToast(`To se mi líbí přidáno! Událost právě probíhá.`);
        }
      } else {
        showToast(
          targetEvent.isActive
            ? 'Lajk byl odebrán.'
            : 'Lajk a SMS připomínka byly zrušeny.'
        );
      }
    }
  };

  const handleToggleLike = (eventId: string) => {
    // User requirement: User MUST be registered to like an event
    if (!isRegistered) {
      setPendingLikeEventId(eventId);
      setAuthModalReason('like');
      setShowAuthModal(true);
      showToast('Pro lajkování událostí se musíte nejprve zaregistrovat.');
      return;
    }

    executeLike(eventId);
  };

  const handleRequireRegistration = (reason: 'like' | 'sms') => {
    setAuthModalReason(reason);
    setShowAuthModal(true);
    showToast(
      reason === 'like'
        ? 'Pro lajkování událostí se musíte nejprve zaregistrovat.'
        : 'Pro aktivaci SMS radaru se musíte nejprve zaregistrovat.'
    );
  };

  const handleCheckIn = (eventId: string) => {
    const savedClaimed = getSavedClaimedEventIds();
    const alreadyClaimed =
      currentUser.visitedEventIds.includes(eventId) ||
      savedClaimed.includes(eventId);

    if (alreadyClaimed) {
      showToast('Body za tuto akci již byly vybrány. Z každé akce lze získat KRJ pouze jednou.');
      return;
    }

    // Persist to localStorage
    saveClaimedEventId(eventId);

    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        return {
          ...ev,
          checkedInByMe: true,
          attendeesCount: Math.min(ev.capacity, ev.attendeesCount + 1),
          attendeeIds: ev.attendeeIds.includes(currentUser.id)
            ? ev.attendeeIds
            : [...ev.attendeeIds, currentUser.id],
        };
      })
    );

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== currentUser.id) return u;
        return {
          ...u,
          xpPoints: u.xpPoints + 50,
          weeklyXpPoints: u.weeklyXpPoints + 50,
          visitedEventIds: Array.from(new Set([...u.visitedEventIds, eventId])),
        };
      })
    );

    showToast('Potvrzena přítomnost na místě přes GPS! Získáváte +50 KRJ (1× za tuto akci).');
  };

  const handleAddComment = (
    eventId: string,
    rating: number,
    text: string,
    attachedPhotoUrl?: string
  ) => {
    const newComment = {
      id: `comment-${Date.now()}`,
      userId: currentUser.id,
      userNickname: currentUser.nickname,
      userAvatar: currentUser.avatarUrl,
      rating,
      text,
      timestamp: 'právě teď',
      attachedPhotoUrl,
    };

    let hostEarnedBonus = false;
    let targetHostId = '';

    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        const updatedComments = [newComment, ...ev.comments];
        const newAvg = calculateEventRating(updatedComments);
        if (newAvg >= 8.0 && !ev.highRatingBonusAwarded) {
          hostEarnedBonus = true;
          targetHostId = ev.hostId;
        }
        return {
          ...ev,
          comments: updatedComments,
          highRatingBonusAwarded: ev.highRatingBonusAwarded || newAvg >= 8.0,
        };
      })
    );

    if (hostEarnedBonus && targetHostId) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetHostId
            ? {
                ...u,
                xpPoints: u.xpPoints + 100,
                weeklyXpPoints: u.weeklyXpPoints + 100,
              }
            : u
        )
      );
      showToast('Komentář přidán. Událost má vysoké hodnocení (8.0+) — hostitel získává +100 KRJ!');
    } else {
      showToast('Vaše hodnocení a komentář byly uloženy.');
    }
  };

  const handleAwardHostHighRatingBonus = () => {
    if (hostBonusClaimed) return;
    setHostBonusClaimed(true);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              xpPoints: u.xpPoints + 100,
              weeklyXpPoints: u.weeklyXpPoints + 100,
            }
          : u
      )
    );
    showToast('Získali jste +100 KRJ za pořádání vysoce hodnocené události.');
  };

  const handleAddFriend = (targetUserId: string) => {
    if (targetUserId === currentUser.id) return;
    const targetUser = users.find((u) => u.id === targetUserId);
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === currentUser.id && !u.friendIds.includes(targetUserId)) {
          return { ...u, friendIds: [...u.friendIds, targetUserId] };
        }
        if (u.id === targetUserId && !u.friendIds.includes(currentUser.id)) {
          return { ...u, friendIds: [...u.friendIds, currentUser.id] };
        }
        return u;
      })
    );
    showToast(
      `Uživatel ${targetUser?.nickname || ''} byl přidán do přátel. Skutečné jméno (${targetUser?.realName || ''}) a chat jsou odemčeny.`
    );
  };

  const handleOpenChatWithUser = (friendId: string) => {
    setActiveChatFriendId(friendId);
    setActiveTab('chat');
  };

  const handleSendMessage = (receiverId: string, text: string, mediaUrl?: string, isVoiceNote?: boolean) => {
    const now = Date.now();
    const timeStr = new Date(now).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });

    const myMsg: DirectMessage = {
      id: `msg-${now}`,
      senderId: currentUser.id,
      receiverId,
      text,
      timestamp: timeStr,
      createdAt: now,
      mediaUrl,
      isVoiceNote,
    };
    setMessages((prev) => [...prev, myMsg]);

    const friend = users.find((u) => u.id === receiverId);
    if (!friend) return;

    // Clear previous pending timeouts for this friend so replies don't collide
    if (typingTimeoutsRef.current[receiverId]) {
      clearTimeout(typingTimeoutsRef.current[receiverId]);
    }
    if (replyTimeoutsRef.current[receiverId]) {
      clearTimeout(replyTimeoutsRef.current[receiverId]);
    }

    const { text: replyText, delayMs } = generateRealisticReply(friend, text);

    // Show typing status after natural hesitation
    typingTimeoutsRef.current[receiverId] = window.setTimeout(() => {
      setTypingFriendId(receiverId);
    }, 350);

    // Deliver response after realistic delay
    replyTimeoutsRef.current[receiverId] = window.setTimeout(() => {
      setTypingFriendId((prev) => (prev === receiverId ? null : prev));
      const replyNow = Date.now();
      const replyTimeStr = new Date(replyNow).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });

      const replyMsg: DirectMessage = {
        id: `msg-reply-${replyNow}`,
        senderId: receiverId,
        receiverId: currentUser.id,
        text: replyText,
        timestamp: replyTimeStr,
        createdAt: replyNow,
      };
      setMessages((prev) => [...prev, replyMsg]);
    }, delayMs);
  };

  const handleToggleLikeDirectMessage = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const currentLikes = msg.likes || [];
        const isLiked = currentLikes.includes(currentUser.id) || !!msg.liked;
        const newLikes = isLiked
          ? currentLikes.filter((id) => id !== currentUser.id)
          : [...currentLikes, currentUser.id];
        return {
          ...msg,
          liked: !isLiked,
          likes: newLikes,
        };
      })
    );
  };

  const handleReactDirectMessage = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const reactions = msg.reactions ? [...msg.reactions] : [];
        const existingIdx = reactions.findIndex((r) => r.emoji === emoji);
        if (existingIdx >= 0) {
          const existing = reactions[existingIdx];
          const hasUser = existing.users.includes(currentUser.id);
          if (hasUser) {
            const newUsers = existing.users.filter((u) => u !== currentUser.id);
            if (newUsers.length === 0) {
              reactions.splice(existingIdx, 1);
            } else {
              reactions[existingIdx] = { ...existing, count: newUsers.length, users: newUsers };
            }
          } else {
            reactions[existingIdx] = {
              ...existing,
              count: existing.count + 1,
              users: [...existing.users, currentUser.id],
            };
          }
        } else {
          reactions.push({ emoji, count: 1, users: [currentUser.id] });
        }
        return { ...msg, reactions };
      })
    );
  };

  const handleSendEventChatMessage = (eventId: string, text: string, mediaUrl?: string) => {
    const targetEvent = events.find((e) => e.id === eventId);
    const newMsg: EventChatMessage = {
      id: `echat-${Date.now()}`,
      eventId,
      eventTitle: targetEvent?.title || 'Událost',
      senderId: currentUser.id,
      senderNickname: currentUser.nickname,
      senderAvatar: currentUser.avatarUrl,
      text,
      timestamp: 'Právě teď',
      mediaUrl,
    };
    setEventChats((prev) => [...prev, newMsg]);
    showToast('Zpráva odeslána do chatu události.');
  };

  const handleToggleLikeEventChatMessage = (messageId: string) => {
    setEventChats((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const currentLikes = msg.likes || [];
        const isLiked = currentLikes.includes(currentUser.id) || !!msg.liked;
        const newLikes = isLiked
          ? currentLikes.filter((id) => id !== currentUser.id)
          : [...currentLikes, currentUser.id];
        return { ...msg, liked: !isLiked, likes: newLikes };
      })
    );
  };

  const handleReactEventChatMessage = (messageId: string, emoji: string) => {
    setEventChats((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const reactions = msg.reactions ? [...msg.reactions] : [];
        const existingIdx = reactions.findIndex((r) => r.emoji === emoji);
        if (existingIdx >= 0) {
          const existing = reactions[existingIdx];
          const hasUser = existing.users.includes(currentUser.id);
          if (hasUser) {
            const newUsers = existing.users.filter((u) => u !== currentUser.id);
            if (newUsers.length === 0) {
              reactions.splice(existingIdx, 1);
            } else {
              reactions[existingIdx] = { ...existing, count: newUsers.length, users: newUsers };
            }
          } else {
            reactions[existingIdx] = {
              ...existing,
              count: existing.count + 1,
              users: [...existing.users, currentUser.id],
            };
          }
        } else {
          reactions.push({ emoji, count: 1, users: [currentUser.id] });
        }
        return { ...msg, reactions };
      })
    );
  };

  const handleOpenEventChat = (eventId: string) => {
    setActiveEventChatId(eventId);
    setActiveTab('chat');
  };

  const handleCreateEvent = (newEventData: Omit<MeetupEvent, 'id'>) => {
    // 1. Anti-spam Rate Limit check: 1/hour, 2/day
    const rateLimit = checkCreationRateLimit();
    if (!rateLimit.canCreate) {
      showToast(rateLimit.reason || 'Dosažen limit pro tvorbu událostí.');
      return;
    }

    // 2. Record new creation in rate limit history
    recordNewCreation();

    const created: MeetupEvent = {
      ...newEventData,
      id: `evt-${Date.now()}`,
    };
    setEvents((prev) => [created, ...prev]);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              organizedCount: u.organizedCount + 1,
              xpPoints: u.xpPoints + 100,
              weeklyXpPoints: u.weeklyXpPoints + 100,
            }
          : u
      )
    );
    setPrefilledPlace(null);
    setActiveTab('map');
    setSelectedEventId(created.id);
    showToast(`Událost "${created.title}" byla zveřejněna na mapě!`);
  };

  const handleCreateEventAtPlace = (place: OpenDataPlace) => {
    setPrefilledPlace(place);
    const saved = saveGpsHome(place.lat, place.lng, `${place.name}, ${place.city}`);
    setUserGps(saved);
    setActiveTab('create');
    showToast(`Místo vybráno: ${place.name}. Dokončete vytvoření srazu.`);
  };

  const handleStartRouteNavigation = (dest: RouteDestination) => {
    setActiveNavDestination(dest);
    setSelectedEventId(null);
    setActiveTab('map');
    showToast(`Navigace zahájena: ${dest.title}`);
  };

  const handleToggleVerifiedStatus = (verified: boolean) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, isVerifiedHost: verified } : u))
    );
    showToast(
      verified
        ? 'Status změněn na Ověřený hostitel. Můžete zakládat události.'
        : 'Status změněn na neověřeného uživatele.'
    );
  };

  const handleToggleTag = (tag: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== currentUser.id) return u;
        const exists = u.tags.includes(tag);
        return {
          ...u,
          tags: exists ? u.tags.filter((t) => t !== tag) : [...u.tags, tag],
        };
      })
    );
  };

  const handleSaveProfile = (updated: Partial<UserProfile>) => {
    setIsRegistered(true);
    try {
      localStorage.setItem('wibe_is_registered', 'true');
      if (updated.phoneNumber) {
        localStorage.setItem('wibe_user_phone', updated.phoneNumber);
        setUserPhone(updated.phoneNumber);
      }
    } catch {
      // ignore
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...updated, isRegistered: true } : u))
    );
    showToast('Registrace dokončena! Nyní můžete volně lajkovat akce a přijímat SMS radar.');

    if (pendingLikeEventId) {
      const targetId = pendingLikeEventId;
      setPendingLikeEventId(null);
      setTimeout(() => {
        executeLike(targetId);
      }, 250);
    }
  };

  const handleToggleRegistrationStatus = () => {
    const next = !isRegistered;
    setIsRegistered(next);
    try {
      localStorage.setItem('wibe_is_registered', String(next));
    } catch {
      // ignore
    }
    showToast(
      next
        ? 'Přepnuto: Nyní jste v režimu registrovaného uživatele.'
        : 'Přepnuto: Jste v režimu anonymního hosta (lajky a SMS vyžadují registraci).'
    );
  };

  const confirmedFriends = users.filter((u) =>
    currentUser.friendIds.includes(u.id)
  );

  return (
    <div className="relative w-screen h-screen flex flex-col bg-[#090d16] text-slate-100 overflow-hidden">
      <OfflineIndicator />

      {/* Brand 5-Color Palette Strip from User Image */}
      <div className="grid grid-cols-5 h-1 w-full shrink-0 z-50">
        <div style={{ backgroundColor: '#c9e8ff' }} />
        <div style={{ backgroundColor: '#f6fbff' }} />
        <div style={{ backgroundColor: '#a7c7e7' }} />
        <div style={{ backgroundColor: '#ffd9e8' }} />
        <div style={{ backgroundColor: '#8fb7ff' }} />
      </div>

      {/* Top Header: Brand Wordmark + Real Expiration Simulator + Registration */}
      <header className="h-13 px-3.5 sm:px-6 bg-[#0f172a]/95 backdrop-blur-md border-b border-[#1e2d4a] flex items-center justify-between gap-3 shrink-0 z-40">
        <div className="flex items-center gap-2.5">
          <a
            href="#mapa"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('map');
            }}
            className="text-base sm:text-lg font-extrabold tracking-tight text-white font-display whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <span className="bg-gradient-to-r from-[#c9e8ff] via-[#ffd9e8] to-[#8fb7ff] bg-clip-text text-transparent">
              WIBE-SIDE
            </span>
          </a>

          {/* Real Event Expiration Tracker Button */}
          <button
            type="button"
            onClick={() => setShowTimeSimulator((prev) => !prev)}
            className={`px-2.5 py-1 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
              timeOffsetHours > 0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-900 text-[#a7c7e7] border-slate-800 hover:text-white'
            }`}
            title="Sledovat reálné automatické mizení událostí po vypršení času"
          >
            <Clock className="w-3.5 h-3.5 text-[#8fb7ff]" />
            <span className="hidden sm:inline">
              {timeOffsetHours > 0
                ? `Čas: +${timeOffsetHours}h (${expiredCount} zmizelo)`
                : `Mizení akcí (${expiredCount} zmizelo)`}
            </span>
            <span className="sm:hidden font-mono-tabular">
              {timeOffsetHours > 0 ? `+${timeOffsetHours}h` : 'Čas'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton />

          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#8fb7ff] to-[#a7c7e7] hover:from-[#c9e8ff] hover:to-[#8fb7ff] text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#8fb7ff]/20 active:scale-95 whitespace-nowrap shrink-0 min-h-[36px]"
            title="Registrace a správa profilu"
          >
            <UserPlus className="w-3.5 h-3.5 text-slate-950" />
            <span>Registrace</span>
          </button>
        </div>
      </header>

      {/* Time Simulation & Auto-Expiration Popover */}
      {showTimeSimulator && (
        <div className="fixed top-14 left-4 sm:left-auto sm:right-4 z-50 w-72 rounded-2xl bg-[#0f172a] border border-[#1e2d4a] p-3.5 shadow-2xl space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#8fb7ff]" />
              Reálné mizení akcí z mapy
            </span>
            <button
              onClick={() => setShowTimeSimulator(false)}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Události po uplynutí své doby trvání <strong>reálně zmizí z mapy</strong>. Můžete posunout čas a sledovat to:
          </p>
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[0, 2, 6, 24].map((offset) => (
              <button
                key={offset}
                type="button"
                onClick={() => {
                  setTimeOffsetHours(offset);
                  showToast(offset === 0 ? 'Nastaven reálný čas.' : `Čas posunut o +${offset} hod.`);
                }}
                className={`py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  timeOffsetHours === offset
                    ? 'bg-[#8fb7ff] text-slate-950 border-white shadow-md'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {offset === 0 ? 'Nyní' : `+${offset}h`}
              </button>
            ))}
          </div>
          <div className="pt-1.5 border-t border-slate-800 text-[10px] text-[#a7c7e7] flex items-center justify-between font-mono-tabular">
            <span>Aktivních na mapě: <strong className="text-white">{visibleEvents.length}</strong></span>
            <span>Ukončeno (zmizelo): <strong className="text-amber-400">{expiredCount}</strong></span>
          </div>
        </div>
      )}

      {/* Non-blocking System Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-md rounded-2xl bg-[#0f172a]/95 backdrop-blur-md border border-[#8fb7ff]/40 px-4 py-3 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5 text-xs font-medium text-slate-100">
            <CheckCircle2 className="w-4 h-4 text-[#8fb7ff] shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 shrink-0"
            aria-label="Zavřít"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main View Port */}
      <main className="flex-1 relative overflow-hidden pb-15">
        {activeTab === 'map' && (
          <InteractiveRegionMap
            events={visibleEvents}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onSelectEvent={(ev) => setSelectedEventId(ev.id)}
            onToggleLike={handleToggleLike}
            userGps={userGps}
            isRegistered={isRegistered}
            onRequireRegistration={handleRequireRegistration}
            onUpdateUserGps={(lat, lng, label) => {
              const saved = saveGpsHome(lat, lng, label);
              setUserGps(saved);
              showToast(`Poloha uložena jako domov: ${label}`);
            }}
            onRequestRealGps={handleRequestRealGps}
            onEmptyMapClick={() => setSelectedEventId(null)}
            userPhone={userPhone}
            onUpdatePhone={(phone) => {
              setUserPhone(phone);
              showToast(`Telefon ${phone} byl uložen pro SMS radar.`);
            }}
            onCreateEventAtPlace={handleCreateEventAtPlace}
            activeNavigationDestination={activeNavDestination}
            onClearNavigation={() => setActiveNavDestination(null)}
          />
        )}

        {activeTab === 'create' && (
          <CreateEventView
            currentUser={currentUser}
            userGps={userGps}
            prefilledPlace={prefilledPlace}
            onToggleVerifiedStatus={handleToggleVerifiedStatus}
            onUpdateUserGps={(lat, lng, label) => {
              const saved = saveGpsHome(lat, lng, label);
              setUserGps(saved);
              showToast(`Poloha synchronizována: ${label}`);
            }}
            onRequestRealGps={handleRequestRealGps}
            onCreateEvent={handleCreateEvent}
          />
        )}

        {activeTab === 'chat' && (
          <FriendsChatView
            currentUser={currentUser}
            users={users}
            messages={messages}
            eventChats={eventChats}
            events={visibleEvents}
            activeFriendId={activeChatFriendId}
            initialEventChatId={activeEventChatId}
            typingFriendId={typingFriendId}
            onSelectFriend={(fid) => setActiveChatFriendId(fid)}
            onSendMessage={handleSendMessage}
            onSendEventChatMessage={handleSendEventChatMessage}
            onToggleLikeDirectMessage={handleToggleLikeDirectMessage}
            onReactDirectMessage={handleReactDirectMessage}
            onToggleLikeEventChatMessage={handleToggleLikeEventChatMessage}
            onReactEventChatMessage={handleReactEventChatMessage}
            onAddFriend={handleAddFriend}
            onInspectUser={(uid) => setInspectedUserId(uid)}
            onSelectEvent={(eid) => setSelectedEventId(eid)}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView
            users={users}
            currentUser={currentUser}
            onInspectUser={(uid) => setInspectedUserId(uid)}
            onAddFriend={handleAddFriend}
            onOpenChatWithUser={handleOpenChatWithUser}
            onAwardHostHighRatingBonus={handleAwardHostHighRatingBonus}
            hostBonusClaimed={hostBonusClaimed}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            allUsers={users}
            events={events}
            userGps={userGps}
            isRegistered={isRegistered}
            onToggleRegistration={handleToggleRegistrationStatus}
            onRequestRealGps={handleRequestRealGps}
            onToggleTag={handleToggleTag}
            onToggleVerifiedHost={handleToggleVerifiedStatus}
            onOpenAuthModal={() => {
              setAuthModalReason(null);
              setShowAuthModal(true);
            }}
            onOpenChatWithUser={handleOpenChatWithUser}
            onInspectUser={(uid) => setInspectedUserId(uid)}
            onAddFriend={handleAddFriend}
            onSelectEventFromHistory={(ev) => setSelectedEventId(ev.id)}
          />
        )}
      </main>

      {/* 5-Item Fixed Bottom Navigation Bar in Teen Minimalist Dark Mode */}
      <nav
        aria-label="Hlavní navigace"
        className="fixed bottom-0 left-0 right-0 z-40 h-15 bg-[#0b0f17]/95 backdrop-blur-md border-t border-[#1e2d4a] grid grid-cols-5 items-center px-1"
      >
        <button
          type="button"
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors ${
            activeTab === 'map'
              ? 'text-[#8fb7ff] font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Map className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
            Mapa
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors relative ${
            activeTab === 'create'
              ? 'text-[#8fb7ff] font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            <PlusCircle className="w-5 h-5" />
            {!currentUser.isVerifiedHost && (
              <Lock className="w-3 h-3 text-amber-400 absolute -top-1 -right-2" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
            Vytvořit
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors relative ${
            activeTab === 'chat'
              ? 'text-[#ffd9e8] font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#ffd9e8] ring-2 ring-slate-950" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
            Chat
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors ${
            activeTab === 'leaderboard'
              ? 'text-[#8fb7ff] font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
            Žebříček
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors ${
            activeTab === 'profile'
              ? 'text-[#8fb7ff] font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
            Můj profil
          </span>
        </button>
      </nav>

      {/* Event Details Sheet */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          currentUser={currentUser}
          userGps={userGps}
          onClose={() => setSelectedEventId(null)}
          onCheckIn={handleCheckIn}
          onToggleLike={handleToggleLike}
          onAddComment={handleAddComment}
          onMoveGpsNearEvent={(lat, lng, label) => {
            setUserGps({ lat, lng, label });
            showToast('GPS poloha posunuta do 25 m od akce. Tlačítko odbavení je aktivní.');
          }}
          onInspectUser={(uid) => setInspectedUserId(uid)}
          onAddFriend={handleAddFriend}
          onOpenChatWithUser={(uid) => {
            setSelectedEventId(null);
            handleOpenChatWithUser(uid);
          }}
          onOpenEventChat={handleOpenEventChat}
          onStartRouteNavigation={handleStartRouteNavigation}
        />
      )}

      {/* User Inspection & Name Privacy Modal */}
      {inspectedUser && (
        <UserInspectModal
          user={inspectedUser}
          currentUser={currentUser}
          userHostedEvents={events.filter((e) => e.hostId === inspectedUser.id)}
          onClose={() => setInspectedUserId(null)}
          onAddFriend={handleAddFriend}
          onOpenChat={handleOpenChatWithUser}
          onSelectEvent={(ev) => setSelectedEventId(ev.id)}
        />
      )}

      {/* Private Chat Modal */}
      {showMessagesModal && (
        <DirectMessagesModal
          currentUser={currentUser}
          friends={confirmedFriends}
          activeFriendId={activeChatFriendId}
          messages={messages}
          onSelectFriend={(fid) => setActiveChatFriendId(fid)}
          onSendMessage={handleSendMessage}
          onClose={() => setShowMessagesModal(false)}
        />
      )}

      {/* Registration & Login Modal */}
      {showAuthModal && (
        <AuthOnboardingModal
          currentUser={currentUser}
          authReason={authModalReason}
          onSaveProfile={handleSaveProfile}
          onClose={() => {
            setShowAuthModal(false);
            setAuthModalReason(null);
          }}
        />
      )}

      {/* Palette SMS Reminder Modal for Upcoming/Inactive Events */}
      {smsReminderEvent && (
        <SmsPaletteReminderModal
          event={smsReminderEvent}
          defaultPhone={userPhone}
          onConfirmPhone={(phone) => {
            setUserPhone(phone);
            showToast(`Telefonní číslo ${phone} bylo uloženo pro SMS připomínku.`);
          }}
          onClose={() => setSmsReminderEvent(null)}
        />
      )}
    </div>
  );
}
