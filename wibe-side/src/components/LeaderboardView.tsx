import React, { useState } from 'react';
import {
  Trophy,
  Award,
  ShieldCheck,
  UserPlus,
  MessageSquare,
  Lock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Crown,
  Check,
  MapPin,
} from 'lucide-react';
import { UserProfile } from '../types';

interface LeaderboardViewProps {
  users: UserProfile[];
  currentUser: UserProfile;
  onInspectUser: (userId: string) => void;
  onAddFriend: (userId: string) => void;
  onOpenChatWithUser: (userId: string) => void;
  onAwardHostHighRatingBonus: () => void;
  hostBonusClaimed: boolean;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  users,
  currentUser,
  onInspectUser,
  onAddFriend,
  onOpenChatWithUser,
  onAwardHostHighRatingBonus,
  hostBonusClaimed,
}) => {
  const [boardMode, setBoardMode] = useState<'weekly' | 'total'>('weekly');
  const [showRules, setShowRules] = useState(false);

  const sortedUsers = [...users].sort((a, b) =>
    boardMode === 'weekly'
      ? b.weeklyXpPoints - a.weeklyXpPoints
      : b.xpPoints - a.xpPoints
  );

  const topThree = sortedUsers.slice(0, 3);
  const myRank = sortedUsers.findIndex((u) => u.id === currentUser.id) + 1;
  const myPoints = boardMode === 'weekly' ? currentUser.weeklyXpPoints : currentUser.xpPoints;

  // Ordering for visual podium: [2nd, 1st, 3rd]
  const podiumOrder = topThree.length >= 3
    ? [topThree[1], topThree[0], topThree[2]]
    : topThree;

  return (
    <div className="w-full h-full overflow-y-auto pb-28 pt-4 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header & Controls */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Královéhradecký kraj</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white font-display mt-0.5 tracking-tight">
                Žebříček
              </h1>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setBoardMode('weekly')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  boardMode === 'weekly'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tento týden
              </button>
              <button
                type="button"
                onClick={() => setBoardMode('total')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  boardMode === 'total'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Celkově (KRJ)
              </button>
            </div>
          </div>

          {/* Compact Rules & Bonus Toggle */}
          <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowRules((prev) => !prev)}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-800/60"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Jak získat KRJ a bonusy</span>
              {!hostBonusClaimed && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
              {showRules ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {/* Quick user position pill */}
            <div className="text-xs text-slate-400 hidden sm:flex items-center gap-2">
              <span>Vaše pozice:</span>
              <span className="font-bold text-emerald-400 font-mono-tabular">
                #{myRank}
              </span>
              <span>({myPoints} KRJ)</span>
            </div>
          </div>

          {/* Collapsible Rules Content */}
          {showRules && (
            <div className="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in duration-200">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> GPS Check-in
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    +50 KRJ za ověřenou účast do 100 metrů od události.
                  </p>
                </div>
                <span className="px-2 py-1 rounded-md bg-emerald-950/80 text-emerald-300 font-mono font-bold text-xs shrink-0 border border-emerald-800/40">
                  +50 KRJ
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                      <Award className="w-3 h-3" /> Bonus hostitele
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      +100 KRJ za zorganizovanou událost s hodnocením 8.0+.
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-amber-950/80 text-amber-300 font-mono font-bold text-xs shrink-0 border border-amber-800/40">
                    +100 KRJ
                  </span>
                </div>
                <button
                  type="button"
                  disabled={hostBonusClaimed}
                  onClick={onAwardHostHighRatingBonus}
                  className={`w-full py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                    hostBonusClaimed
                      ? 'bg-slate-800 text-slate-400 cursor-default'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {hostBonusClaimed ? 'Bonus +100 KRJ již připsán' : 'Připsat bonus hostitele (+100 KRJ)'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Compact Visual Podium for Top 3 */}
        {topThree.length >= 3 && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-4">
              Stupně vítězů {boardMode === 'weekly' ? 'tento týden' : 'celkově'}
            </h2>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-2 max-w-lg mx-auto">
              {/* 2nd place (Left) */}
              {(() => {
                const u = topThree[1];
                if (!u) return null;
                const isMe = u.id === currentUser.id;
                const pts = boardMode === 'weekly' ? u.weeklyXpPoints : u.xpPoints;
                return (
                  <div
                    onClick={() => onInspectUser(u.id)}
                    className="flex flex-col items-center cursor-pointer group transition-transform hover:-translate-y-1"
                  >
                    <div className="relative mb-2">
                      <img
                        src={u.avatarUrl}
                        alt={u.nickname}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-slate-300 shadow-md group-hover:border-slate-100"
                      />
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-300 text-slate-900 font-bold text-[11px] sm:text-xs flex items-center justify-center font-mono shadow">
                        2
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[85px] sm:max-w-[110px] text-center">
                      {u.nickname}
                    </span>
                    {isMe && (
                      <span className="text-[10px] text-emerald-400 font-semibold">(Vy)</span>
                    )}
                    <span className="text-[11px] font-mono font-bold text-slate-300 mt-0.5">
                      {pts} KRJ
                    </span>
                    <div className="w-full mt-2 h-14 sm:h-18 bg-gradient-to-t from-slate-800 to-slate-700/80 rounded-t-xl border-t border-x border-slate-700/60 flex items-center justify-center">
                      <span className="text-xs font-bold text-slate-300">2. místo</span>
                    </div>
                  </div>
                );
              })()}

              {/* 1st place (Center - elevated) */}
              {(() => {
                const u = topThree[0];
                if (!u) return null;
                const isMe = u.id === currentUser.id;
                const pts = boardMode === 'weekly' ? u.weeklyXpPoints : u.xpPoints;
                return (
                  <div
                    onClick={() => onInspectUser(u.id)}
                    className="flex flex-col items-center cursor-pointer group transition-transform hover:-translate-y-1 -mt-4"
                  >
                    <div className="relative mb-2">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Crown className="w-5 h-5 text-amber-400 fill-amber-400 animate-bounce duration-1000" />
                      </div>
                      <img
                        src={u.avatarUrl}
                        alt={u.nickname}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] group-hover:border-amber-300"
                      />
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center font-mono shadow">
                        1
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[90px] sm:max-w-[120px] text-center">
                      {u.nickname}
                    </span>
                    {isMe && (
                      <span className="text-[10px] text-emerald-400 font-semibold">(Vy)</span>
                    )}
                    <span className="text-xs font-mono font-bold text-amber-300 mt-0.5">
                      {pts} KRJ
                    </span>
                    <div className="w-full mt-2 h-20 sm:h-24 bg-gradient-to-t from-amber-950/60 to-amber-600/30 rounded-t-xl border-t border-x border-amber-500/50 flex flex-col items-center justify-center">
                      <Trophy className="w-4 h-4 text-amber-400 mb-0.5" />
                      <span className="text-xs font-bold text-amber-300">1. místo</span>
                    </div>
                  </div>
                );
              })()}

              {/* 3rd place (Right) */}
              {(() => {
                const u = topThree[2];
                if (!u) return null;
                const isMe = u.id === currentUser.id;
                const pts = boardMode === 'weekly' ? u.weeklyXpPoints : u.xpPoints;
                return (
                  <div
                    onClick={() => onInspectUser(u.id)}
                    className="flex flex-col items-center cursor-pointer group transition-transform hover:-translate-y-1"
                  >
                    <div className="relative mb-2">
                      <img
                        src={u.avatarUrl}
                        alt={u.nickname}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-amber-700 shadow-md group-hover:border-amber-600"
                      />
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-700 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center font-mono shadow">
                        3
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[85px] sm:max-w-[110px] text-center">
                      {u.nickname}
                    </span>
                    {isMe && (
                      <span className="text-[10px] text-emerald-400 font-semibold">(Vy)</span>
                    )}
                    <span className="text-[11px] font-mono font-bold text-slate-300 mt-0.5">
                      {pts} KRJ
                    </span>
                    <div className="w-full mt-2 h-10 sm:h-14 bg-gradient-to-t from-slate-800 to-amber-900/30 rounded-t-xl border-t border-x border-slate-700/60 flex items-center justify-center">
                      <span className="text-xs font-bold text-amber-600/90">3. místo</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Clean Participant List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Kompletní pořadí ({sortedUsers.length})
            </span>
            <span className="text-[11px] text-slate-400">
              Klepnutím zobrazíte profil
            </span>
          </div>

          <div className="divide-y divide-slate-800/70">
            {sortedUsers.map((user, index) => {
              const rank = index + 1;
              const isMe = user.id === currentUser.id;
              const isFriend = currentUser.friendIds.includes(user.id);
              const showRealName = isMe || isFriend;
              const userPoints = boardMode === 'weekly' ? user.weeklyXpPoints : user.xpPoints;

              return (
                <div
                  key={user.id}
                  className={`px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                    isMe
                      ? 'bg-emerald-950/30 border-l-4 border-l-emerald-500'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Left: Rank + Avatar + Name Info */}
                  <div
                    onClick={() => onInspectUser(user.id)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                  >
                    <div
                      className={`w-6 text-center font-mono font-bold text-xs shrink-0 ${
                        rank === 1
                          ? 'text-amber-400'
                          : rank === 2
                          ? 'text-slate-300'
                          : rank === 3
                          ? 'text-amber-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                    </div>

                    <img
                      src={user.avatarUrl}
                      alt={user.nickname}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-white truncate max-w-[140px] sm:max-w-[200px]">
                          {user.nickname}
                        </span>
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/50">
                            Vy
                          </span>
                        )}
                        {user.isVerifiedHost && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate mt-0.5">
                        <span className="truncate">{user.city}</span>
                        {showRealName ? (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="text-emerald-400/90 truncate">
                              {user.realName}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-500 flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" />
                              <span className="text-[10px]">skryto</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Points + Compact Action */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-sm sm:text-base font-bold font-mono text-white">
                        {userPoints}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1 font-semibold">
                        KRJ
                      </span>
                    </div>

                    {!isMe && (
                      <div>
                        {isFriend ? (
                          <button
                            type="button"
                            onClick={() => onOpenChatWithUser(user.id)}
                            title="Napsat zprávu"
                            className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1 text-xs font-semibold"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Zpráva</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAddFriend(user.id)}
                            title="Přidat do přátel"
                            className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Přidat</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

