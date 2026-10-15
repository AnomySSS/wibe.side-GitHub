import React, { useState, useRef } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  UserPlus,
  MessageSquare,
  Send,
  Camera,
  CheckCircle2,
  Mail,
  Globe,
  Eye,
  Smartphone,
} from 'lucide-react';
import {
  UserProfile,
  DirectMessage,
  MeetupEvent,
  AVAILABLE_INTEREST_TAGS,
  RegionCity,
  REGION_CITIES,
} from '../types';
import { createAvatarSvg } from '../data/mockData';

/* 1. USER PROFILE INSPECTION MODAL */
interface UserInspectModalProps {
  user: UserProfile;
  currentUser: UserProfile;
  userHostedEvents: MeetupEvent[];
  onClose: () => void;
  onAddFriend: (userId: string) => void;
  onOpenChat: (userId: string) => void;
  onSelectEvent: (event: MeetupEvent) => void;
}

export const UserInspectModal: React.FC<UserInspectModalProps> = ({
  user,
  currentUser,
  userHostedEvents,
  onClose,
  onAddFriend,
  onOpenChat,
  onSelectEvent,
}) => {
  const isMe = user.id === currentUser.id;
  const isFriend = currentUser.friendIds.includes(user.id);
  const [founderTrustPreview, setFounderTrustPreview] = useState(false);

  const canViewRealName = isMe || isFriend || founderTrustPreview;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={user.avatarUrl}
              alt={user.nickname}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover border border-slate-700 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-display">
                  {user.nickname}
                </h3>
                {user.isVerifiedHost && (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Ověřený</span>
                  </span>
                )}
              </div>

              {canViewRealName ? (
                <p className="text-sm font-semibold text-emerald-400 mt-0.5">
                  Skutečné jméno: {user.realName}{' '}
                  <span className="text-xs text-slate-400 font-normal">
                    ({isFriend ? 'Přítel' : isMe ? 'Vy' : 'Zakladatel akce'})
                  </span>
                </p>
              ) : (
                <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-1">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>Skutečné jméno skryto (veřejný profil)</span>
                </p>
              )}

              <p className="text-xs text-slate-400 mt-1">
                {user.city} · {user.xpPoints} KRJ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
            aria-label="Zavřít"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">{user.bio}</p>

        {!isMe && !isFriend && userHostedEvents.length > 0 && (
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-300">
              Uživatel pořádá akci v kraji ({userHostedEvents[0].title}).
            </div>
            <button
              type="button"
              onClick={() => setFounderTrustPreview((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 flex items-center gap-1.5 shrink-0"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>
                {founderTrustPreview ? 'Veřejný pohled' : 'Pohled zakladatele akce'}
              </span>
            </button>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-slate-400 mb-2">Zájmy a tagy:</p>
          <div className="flex flex-wrap gap-1.5 text-xs text-slate-300">
            {user.tags.map((t, i) => (
              <React.Fragment key={t}>
                {i > 0 && <span className="text-slate-600">·</span>}
                <span className="font-medium text-slate-200">{t}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {userHostedEvents.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400">
              Pořádané akce tohoto hostitele:
            </p>
            {userHostedEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => {
                  onClose();
                  onSelectEvent(ev);
                }}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 cursor-pointer flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-white truncate">{ev.title}</span>
                <span className="text-emerald-400 shrink-0 ml-2">Detail</span>
              </div>
            ))}
          </div>
        )}

        {!isMe && (
          <div className="pt-2 border-t border-slate-800 flex items-center gap-3">
            {isFriend ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenChat(user.id);
                }}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Napsat soukromou zprávu ({user.realName})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onAddFriend(user.id)}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Přidat do přátel (Odhalí skutečné jméno)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* 2. PRIVATE DIRECT MESSAGING MODAL */
interface DirectMessagesModalProps {
  currentUser: UserProfile;
  friends: UserProfile[];
  activeFriendId: string;
  messages: DirectMessage[];
  onSelectFriend: (friendId: string) => void;
  onSendMessage: (receiverId: string, text: string) => void;
  onClose: () => void;
}

export const DirectMessagesModal: React.FC<DirectMessagesModalProps> = ({
  currentUser,
  friends,
  activeFriendId,
  messages,
  onSelectFriend,
  onSendMessage,
  onClose,
}) => {
  const [inputText, setInputText] = useState('');
  const activeFriend =
    friends.find((f) => f.id === activeFriendId) || friends[0] || null;

  const conversation = activeFriend
    ? messages
        .filter(
          (m) =>
            (m.senderId === currentUser.id && m.receiverId === activeFriend.id) ||
            (m.senderId === activeFriend.id && m.receiverId === currentUser.id)
        )
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    : [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFriend || !inputText.trim()) return;
    onSendMessage(activeFriend.id, inputText.trim());
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl h-[80vh] rounded-3xl bg-[#000000] border border-[#262626] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-5 py-3.5 border-b border-[#262626] flex items-center justify-between bg-[#000000]">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Instagram Direct</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white font-medium">
                Zprávy
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              {activeFriend ? `@${activeFriend.nickname} · ${activeFriend.realName}` : 'Vyberte přítele'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#181818] hover:bg-[#262626] flex items-center justify-center text-neutral-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Friends Stories row */}
        <div className="px-4 py-2.5 bg-[#0a0a0a] border-b border-[#262626] flex items-center gap-2.5 overflow-x-auto no-scrollbar shrink-0">
          {friends.map((f) => {
            const isSelected = activeFriend?.id === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectFriend(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border transition-all whitespace-nowrap shrink-0 min-h-[36px] ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white border-transparent shadow-md'
                    : 'bg-[#181818] text-neutral-300 border-[#2a2a2a] hover:bg-[#222222]'
                }`}
              >
                <img
                  src={f.avatarUrl}
                  alt={f.realName}
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span>
                  {f.realName} (@{f.nickname})
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#000000]">
          {activeFriend ? (
            <>
              <div className="text-center py-2">
                <span className="text-[11px] text-neutral-500">
                  Konverzace s přítelem: <strong className="text-neutral-200">{activeFriend.realName}</strong> ({activeFriend.city})
                </span>
              </div>
              {conversation.map((m) => {
                const isMine = m.senderId === currentUser.id;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-[20px] px-4 py-2.5 text-sm ${
                        isMine
                          ? 'bg-gradient-to-r from-[#3b82f6] via-[#6366f1] to-[#a855f7] text-white rounded-br-[4px]'
                          : 'bg-[#262626] text-white rounded-bl-[4px] border border-[#333333]'
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1 px-1 font-mono-tabular">
                      {m.timestamp}
                    </span>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-neutral-400">
              Nemáte zatím žádné potvrzené přátele.
            </div>
          )}
        </div>

        {activeFriend && (
          <form onSubmit={handleSend} className="p-3 bg-[#000000] border-t border-[#262626] flex items-center gap-2">
            <div className="flex-1 bg-[#262626] border border-[#363636] rounded-full px-4 py-2 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Zpráva..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="text-[#0095f6] hover:text-[#3897f0] font-bold text-sm disabled:opacity-40"
              >
                Odeslat
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/* 3. PROMINENT REGISTRATION & ONBOARDING MODAL */
interface AuthOnboardingModalProps {
  currentUser: UserProfile;
  authReason?: 'like' | 'sms' | null;
  onSaveProfile: (updated: Partial<UserProfile>) => void;
  onClose: () => void;
}

export const AuthOnboardingModal: React.FC<AuthOnboardingModalProps> = ({
  currentUser,
  authReason,
  onSaveProfile,
  onClose,
}) => {
  const [authProvider, setAuthProvider] = useState<'google' | 'email' | 'phone'>(
    currentUser.authProvider || 'google'
  );
  const [email, setEmail] = useState(currentUser.email || 'jan.novak@gmail.com');
  const [password, setPassword] = useState('••••••••');
  const [phone, setPhone] = useState(currentUser.phoneNumber || '+420 732 418 902');
  const [realName, setRealName] = useState(currentUser.realName || 'Jan Novák');
  const [nickname, setNickname] = useState(currentUser.nickname || 'Honza_HK');
  const [city, setCity] = useState<RegionCity>(currentUser.city || 'Hradec Králové');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl);
  const [selectedTags, setSelectedTags] = useState<string[]>(currentUser.tags || ['Kavárenský typ', 'Sportovec']);
  const [bio, setBio] = useState(currentUser.bio || 'Aktivní návštěvník akcí v kraji.');
  
  // Phone SMS verification code state
  const [smsSent, setSmsSent] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('4829');
  const [smsError, setSmsError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSendVerificationSms = () => {
    const randomCode = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedCode(randomCode);
    setSmsSent(true);
    setSmsError(null);
  };

  const handleFastGoogleRegister = () => {
    onSaveProfile({
      authProvider: 'google',
      email: email.trim() || 'user.google@gmail.com',
      realName: realName.trim() || 'Ověřený Uživatel',
      nickname: nickname.trim() || 'WibeUser',
      phoneNumber: phone.trim() || '+420 732 418 902',
      isRegistered: true,
      city,
      avatarUrl: avatarUrl || createAvatarSvg('GU', '#10B981', '#059669'),
      tags: selectedTags,
      bio: bio.trim(),
    });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authProvider === 'phone' && smsSent && smsCode.trim() !== generatedCode) {
      setSmsError(`Nesprávný SMS kód. Zadejte kód ${generatedCode}.`);
      return;
    }

    if (!realName.trim() || !nickname.trim()) return;

    onSaveProfile({
      authProvider,
      email: email.trim(),
      phoneNumber: phone.trim(),
      realName: realName.trim(),
      nickname: nickname.trim(),
      isRegistered: true,
      city,
      avatarUrl,
      tags: selectedTags,
      bio: bio.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0b1120] border border-slate-800 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                Účet WIBE-SIDE
              </span>
              <span className="text-xs text-slate-400 font-medium">Královéhradecký kraj</span>
            </div>
            <h3 className="text-lg font-bold text-white font-display mt-1">
              Registrace pro plný přístup
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reason banner if redirected from like or sms */}
        {authReason === 'like' && (
          <div className="rounded-2xl bg-red-950/40 border border-red-500/40 p-3.5 flex items-start gap-3 text-xs text-red-200">
            <span className="text-lg">❤️</span>
            <div>
              <p className="font-bold text-white">Pro lajkování událostí je nutná registrace</p>
              <p className="text-red-300/90 mt-0.5">
                Zaregistrujte se během několika vteřin emailem, Googlem nebo telefonem pro ukládání akcí a odběr novinek.
              </p>
            </div>
          </div>
        )}

        {authReason === 'sms' && (
          <div className="rounded-2xl bg-emerald-950/40 border border-emerald-500/40 p-3.5 flex items-start gap-3 text-xs text-emerald-200">
            <span className="text-lg">📡</span>
            <div>
              <p className="font-bold text-white">Pro aktivaci SMS radaru (do 5 km) je nutná registrace</p>
              <p className="text-emerald-300/90 mt-0.5">
                Propojte svůj účet s telefonním číslem a získejte okamžité SMS alerty při nové akci v okolí vašeho domova.
              </p>
            </div>
          </div>
        )}

        {/* 3 Auth Provider Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setAuthProvider('google')}
            className={`h-11 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              authProvider === 'google'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-300" />
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() => setAuthProvider('email')}
            className={`h-11 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              authProvider === 'email'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900'
            }`}
          >
            <Mail className="w-4 h-4 text-teal-300" />
            <span>Email</span>
          </button>

          <button
            type="button"
            onClick={() => setAuthProvider('phone')}
            className={`h-11 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              authProvider === 'phone'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-amber-300" />
            <span>SMS Telefon</span>
          </button>
        </div>

        {/* Google Fast 1-Click option */}
        {authProvider === 'google' && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Rychlé přihlášení jedním kliknutím</span>
                <span className="text-[11px] text-slate-400">Automaticky synchronizuje Google profil a telefon</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleFastGoogleRegister}
              className="w-full h-11 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Pokračovat přes Google účet</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Skutečné jméno (vidí přátelé po potvrzení)
              </label>
              <input
                type="text"
                required
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                placeholder="Např. Jan Novák"
                className="w-full h-11 rounded-xl bg-slate-950 border border-slate-800 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Přezdívka / Nick (veřejný na mapě)
              </label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Např. Honza_HK"
                className="w-full h-11 rounded-xl bg-slate-950 border border-slate-800 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Telefonní číslo pro SMS notifikace
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+420 732 418 902"
                className="w-full h-11 rounded-xl bg-slate-950 border border-slate-800 px-3.5 text-sm text-white font-mono-tabular focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jan.novak@gmail.com"
                className="w-full h-11 rounded-xl bg-slate-950 border border-slate-800 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* SMS Verification Section if phone provider chosen */}
          {authProvider === 'phone' && (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">SMS ověření čísla</span>
                {!smsSent ? (
                  <button
                    type="button"
                    onClick={handleSendVerificationSms}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors"
                  >
                    Odeslat ověřovací SMS
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-400 font-mono-tabular font-bold">
                    SMS odeslána! (Kód: {generatedCode})
                  </span>
                )}
              </div>

              {smsSent && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Zadejte 4-místný kód z přijaté SMS:
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    placeholder={generatedCode}
                    className="w-32 h-11 rounded-xl bg-slate-950 border border-slate-700 text-center font-mono-tabular text-lg tracking-widest text-emerald-300 focus:outline-none focus:border-emerald-500"
                  />
                  {smsError && <p className="text-xs text-red-400 mt-1">{smsError}</p>}
                </div>
              )}
            </div>
          )}

          {/* Password field for email provider */}
          {authProvider === 'email' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Heslo
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 znaků"
                className="w-full h-11 rounded-xl bg-slate-950 border border-slate-800 px-3.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Profile photo avatar */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Profilová fotka / Avatar
            </label>
            <div className="flex items-center gap-4">
              <img
                src={avatarUrl}
                alt="Foto"
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shrink-0"
              />
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 border border-slate-700"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nahrát fotku</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAvatarUrl(
                      createAvatarSvg(
                        realName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'WS',
                        '#059669',
                        '#10B981'
                      )
                    )
                  }
                  className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800"
                >
                  Generovat monogram
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Zájmy a tagy
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_INTEREST_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
            >
              Zrušit
            </button>
            <button
              type="submit"
              className="px-6 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Dokončit registraci</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
