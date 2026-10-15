import React from 'react';
import {
  ShieldCheck,
  Award,
  Users,
  MessageSquare,
  Edit3,
  Lock,
  UserPlus,
} from 'lucide-react';
import {
  UserProfile,
  MeetupEvent,
  AVAILABLE_INTEREST_TAGS,
  CATEGORY_MAP,
  calculateEventRating,
} from '../types';

interface ProfileViewProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  events: MeetupEvent[];
  userGps?: { lat: number; lng: number; label: string };
  isRegistered?: boolean;
  onToggleRegistration?: () => void;
  onRequestRealGps?: () => void;
  onToggleTag: (tag: string) => void;
  onToggleVerifiedHost: (verified: boolean) => void;
  onOpenAuthModal: () => void;
  onOpenChatWithUser: (userId: string) => void;
  onInspectUser: (userId: string) => void;
  onAddFriend: (userId: string) => void;
  onSelectEventFromHistory: (event: MeetupEvent) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  allUsers,
  events,
  userGps,
  isRegistered = true,
  onToggleRegistration,
  onRequestRealGps,
  onToggleTag,
  onToggleVerifiedHost,
  onOpenAuthModal,
  onOpenChatWithUser,
  onInspectUser,
  onAddFriend,
  onSelectEventFromHistory,
}) => {
  const confirmedFriends = allUsers.filter((u) =>
    currentUser.friendIds.includes(u.id)
  );
  const suggestedUsers = allUsers.filter(
    (u) => u.id !== currentUser.id && !currentUser.friendIds.includes(u.id)
  );

  const visitedEvents = events.filter(
    (ev) => currentUser.visitedEventIds.includes(ev.id) || ev.checkedInByMe
  );
  const organizedEvents = events.filter((ev) => ev.hostId === currentUser.id);

  return (
    <div className="w-full h-full overflow-y-auto pb-28 pt-4 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Profile Card */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.nickname}
                referrerPolicy="no-referrer"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-500/50 shrink-0"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-white font-display">
                    {currentUser.nickname}
                  </h1>
                  <span className="text-xs text-slate-400">·</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isRegistered
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {isRegistered ? 'Registrovaný účet' : 'Neregistrovaný host'}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-semibold text-emerald-400">
                    {currentUser.isVerifiedHost ? 'Ověřený hostitel' : 'Základní účet'}
                  </span>
                </div>

                <p className="text-sm text-slate-300 mt-0.5">
                  Skutečné jméno:{' '}
                  <strong className="text-white">{currentUser.realName}</strong>{' '}
                  <span className="text-xs text-slate-400">
                    (skryto před cizími, viditelné přátelům a u vašich akcí)
                  </span>
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                  <span className="text-emerald-300 font-medium">
                    Domov (GPS): {userGps?.label || currentUser.city}
                  </span>
                  <span>·</span>
                  <span>
                    Účet: {currentUser.authProvider === 'google' ? 'Google' : currentUser.authProvider === 'phone' ? 'SMS Telefon' : 'Email'} ({currentUser.email || currentUser.phoneNumber || 'nepřihlášen'})
                  </span>
                  {onRequestRealGps && (
                    <button
                      type="button"
                      onClick={onRequestRealGps}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline ml-1"
                    >
                      Aktualizovat GPS
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center justify-center gap-2 min-h-[42px] shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
              >
                <Edit3 className="w-4 h-4 shrink-0" />
                <span>{isRegistered ? 'Upravit profil' : 'Zaregistrovat se'}</span>
              </button>

              {onToggleRegistration && (
                <button
                  type="button"
                  onClick={onToggleRegistration}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 min-h-[42px] transition-colors"
                  title="Přepnout stav registrace pro testování brány na lajky a SMS"
                >
                  {isRegistered ? 'Odhlásit (Režim hosta)' : 'Simulovat přihlášení'}
                </button>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-300 mt-4 pt-4 border-t border-slate-800/80">
            {currentUser.bio}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5">
              <p className="text-xs text-slate-400">Celkem KRJ</p>
              <p className="text-xl font-bold text-white font-mono-tabular mt-0.5">
                {currentUser.xpPoints} KRJ
              </p>
            </div>
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5">
              <p className="text-xs text-slate-400">Tento týden</p>
              <p className="text-xl font-bold text-emerald-400 font-mono-tabular mt-0.5">
                +{currentUser.weeklyXpPoints} KRJ
              </p>
            </div>
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5">
              <p className="text-xs text-slate-400">Navštíveno akcí</p>
              <p className="text-xl font-bold text-white font-mono-tabular mt-0.5">
                {visitedEvents.length}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5">
              <p className="text-xs text-slate-400">Pořádáno akcí</p>
              <p className="text-xl font-bold text-amber-400 font-mono-tabular mt-0.5">
                {organizedEvents.length}
              </p>
            </div>
          </div>
        </div>

        {/* Privacy & Badges */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Lock className="w-4 h-4 shrink-0" />
              <span>Pravidla soukromí skutečného jména</span>
            </div>
            <h2 className="text-base font-bold text-white font-display">
              Jak chráníme vaše jméno ({currentUser.realName})
            </h2>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-white">1. Veřejný pohled:</strong> Zobrazuje se pouze přezdívka ({currentUser.nickname}).
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-white">2. Zakladatel akce:</strong> U vašich akcí je jméno odhaleno pro důvěru účastníků.
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-white">3. Přátelé:</strong> Potvrzení přátelé vidí vaše skutečné jméno.
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white font-display">Odznaky a trofeje</h2>
                <p className="text-xs text-slate-400">Získané z žebříčku a aktivity</p>
              </div>
              <button
                type="button"
                onClick={() => onToggleVerifiedHost(!currentUser.isVerifiedHost)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  currentUser.isVerifiedHost
                    ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-300'
                    : 'bg-amber-950/60 border-amber-600/40 text-amber-300'
                }`}
              >
                {currentUser.isVerifiedHost ? 'Ověřený hostitel' : 'Aktivovat ověření'}
              </button>
            </div>

            <div className="space-y-2.5">
              {currentUser.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{badge.title}</p>
                      <p className="text-xs text-slate-400">{badge.subtitle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <h2 className="text-base font-bold text-white font-display">Zájmy a tagy profilu</h2>
          <div className="flex flex-wrap gap-2 pt-1">
            {AVAILABLE_INTEREST_TAGS.map((tag) => {
              const isSelected = currentUser.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleTag(tag)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors min-h-[38px] ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Friends & Messages */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <h2 className="text-base font-bold text-white font-display">
            Potvrzení přátelé ({confirmedFriends.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {confirmedFriends.map((friend) => (
              <div
                key={friend.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div
                  onClick={() => onInspectUser(friend.id)}
                  className="flex items-center gap-3 cursor-pointer min-w-0"
                >
                  <img
                    src={friend.avatarUrl}
                    alt={friend.nickname}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-2xl object-cover border border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{friend.realName}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {friend.nickname} · {friend.city}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenChatWithUser(friend.id)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 shrink-0 min-h-[40px]"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Zprávy</span>
                </button>
              </div>
            ))}
          </div>

          {suggestedUsers.length > 0 && (
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <p className="text-xs font-semibold text-slate-400">
                Další lidé v kraji (Skutečné jméno je skryto před přidáním do přátel):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedUsers.map((person) => (
                  <div
                    key={person.id}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3"
                  >
                    <div
                      onClick={() => onInspectUser(person.id)}
                      className="flex items-center gap-3 cursor-pointer min-w-0"
                    >
                      <img
                        src={person.avatarUrl}
                        alt={person.nickname}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{person.nickname}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          Skutečné jméno skryto · {person.city}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAddFriend(person.id)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 border border-slate-700 shrink-0 min-h-[38px]"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Přidat</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Histories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
            <h2 className="text-base font-bold text-white font-display">
              Historie navštívených akcí ({visitedEvents.length})
            </h2>
            <div className="space-y-2.5">
              {visitedEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => onSelectEventFromHistory(ev)}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">{CATEGORY_MAP[ev.category].name} · {ev.city}</p>
                    <p className="text-sm font-bold text-white truncate mt-0.5">{ev.title}</p>
                  </div>
                  <span className="text-xs font-mono-tabular font-bold text-emerald-400 shrink-0 px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-600/30">
                    ✓ Odbaveno (+50 KRJ)
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
            <h2 className="text-base font-bold text-white font-display">
              Mnou pořádané akce ({organizedEvents.length})
            </h2>
            <div className="space-y-2.5">
              {organizedEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => onSelectEventFromHistory(ev)}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Hodnocení: {calculateEventRating(ev.comments).toFixed(1)} / 10</p>
                    <p className="text-sm font-bold text-white truncate mt-0.5">{ev.title}</p>
                  </div>
                  <span className="text-xs font-bold text-amber-400 shrink-0">Hostitel</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
