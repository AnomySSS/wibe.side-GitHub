import React, { useState, useRef } from 'react';
import {
  X,
  MapPin,
  Clock,
  Calendar,
  ShieldCheck,
  Navigation,
  CheckCircle2,
  Heart,
  Users,
  Camera,
  Send,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Star,
  Footprints,
  Bike,
  Car,
  ExternalLink,
  UserPlus,
  MessageSquare,
  Crosshair,
} from 'lucide-react';
import {
  MeetupEvent,
  CATEGORY_MAP,
  calculateEventRating,
  getRatingBadgeColor,
  getDistanceMeters,
  UserProfile,
} from '../types';
import { EVENT_PHOTOS } from '../data/mockData';
import { CategoryIcon } from './InteractiveRegionMap';
import { RouteDestination } from '../utils/routing';

interface EventDetailModalProps {
  event: MeetupEvent;
  currentUser: UserProfile;
  userGps: { lat: number; lng: number; label: string };
  onClose: () => void;
  onCheckIn: (eventId: string) => void;
  onToggleLike: (eventId: string) => void;
  onAddComment: (
    eventId: string,
    rating: number,
    text: string,
    attachedPhotoUrl?: string
  ) => void;
  onMoveGpsNearEvent: (lat: number, lng: number, label: string) => void;
  onInspectUser: (userId: string) => void;
  onAddFriend: (userId: string) => void;
  onOpenChatWithUser: (userId: string) => void;
  onOpenEventChat?: (eventId: string) => void;
  onStartRouteNavigation?: (destination: RouteDestination) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  currentUser,
  userGps,
  onClose,
  onCheckIn,
  onToggleLike,
  onAddComment,
  onMoveGpsNearEvent,
  onInspectUser,
  onAddFriend,
  onOpenChatWithUser,
  onOpenEventChat,
  onStartRouteNavigation,
}) => {
  const [mediaIndex, setMediaIndex] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(true);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeMode, setRouteMode] = useState<'walk' | 'bike' | 'car'>('walk');

  const [ratingInput, setRatingInput] = useState<number>(9.0);
  const [commentText, setCommentText] = useState<string>('');
  const [attachedPhoto, setAttachedPhoto] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const categoryMeta = CATEGORY_MAP[event.category];
  const overallRating = calculateEventRating(event.comments);
  const ratingBadge = getRatingBadgeColor(overallRating);
  const distanceMeters = getDistanceMeters(
    userGps.lat,
    userGps.lng,
    event.lat,
    event.lng
  );
  const isWithin100Meters = distanceMeters <= 100;
  const isClaimed = !!event.checkedInByMe || currentUser.visitedEventIds?.includes(event.id);
  const isHostFriend = currentUser.friendIds.includes(event.hostId);
  const isMeHost = currentUser.id === event.hostId;

  // Real Auto-Expiration Countdown calculation
  const nowMs = Date.now();
  const msUntilExpiration = event.expiresAtTimestamp - nowMs;
  const hoursLeft = Math.floor(msUntilExpiration / (3600 * 1000));
  const minutesLeft = Math.floor((msUntilExpiration % (3600 * 1000)) / (60 * 1000));
  const expirationLabel =
    msUntilExpiration <= 0
      ? 'Událost již vypršela a automaticky mizí z mapy'
      : hoursLeft > 0
      ? `Zbývá ${hoursLeft} hod. ${minutesLeft} min. do automatického vypršení a zmizení`
      : `Zbývá ${Math.max(1, minutesLeft)} minut do vypršení a zmizení`;

  const activeMedia = event.media[mediaIndex] || event.media[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachedPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMeHost) return;
    if (!commentText.trim()) return;
    onAddComment(event.id, ratingInput, commentText.trim(), attachedPhoto);
    setCommentText('');
    setAttachedPhoto(undefined);
  };

  const googleMapsTravelMode =
    routeMode === 'walk' ? 'walking' : routeMode === 'bike' ? 'bicycling' : 'driving';
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userGps.lat},${userGps.lng}&destination=${event.lat},${event.lng}&travelmode=${googleMapsTravelMode}`;
  const mapyCzUrl = `https://mapy.cz/zakladni?planovani-trasy&x=${event.lng}&y=${event.lat}&z=15`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-800 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <CategoryIcon category={event.category} className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-white">{categoryMeta.name}</span>
                <span>·</span>
                <span>{event.city}</span>
                <span>·</span>
                <span>{event.isPublic ? 'Veřejná akce' : 'Uzavřená skupina'}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white truncate font-display">
                {event.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono-tabular ${ratingBadge.bgClass}`}>
              {overallRating.toFixed(1)} / 10
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
              aria-label="Zavřít"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-6">
          {/* Media Carousel */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
            <div className="relative h-60 sm:h-72 w-full overflow-hidden">
              <img
                src={activeMedia.url}
                alt={activeMedia.caption}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  activeMedia.type === 'video' && isPlayingVideo ? 'scale-105' : 'scale-100'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

              {activeMedia.type === 'video' && (
                <div className="absolute inset-0 flex flex-col justify-between p-4">
                  <span className="px-2.5 py-1 rounded-md bg-slate-950/85 text-xs font-semibold text-emerald-400 border border-emerald-500/30 self-start">
                    Video od hostitele · {activeMedia.videoDurationLabel || '0:15'}
                  </span>
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setIsPlayingVideo((prev) => !prev)}
                      className="w-14 h-14 rounded-full bg-slate-950/80 hover:bg-emerald-600 text-white border border-white/20 flex items-center justify-center shadow-2xl transition-colors"
                    >
                      {isPlayingVideo ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                    </button>
                  </div>
                  <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                    <div className={`bg-emerald-500 h-full transition-all duration-500 ${isPlayingVideo ? 'w-2/3' : 'w-1/3'}`} />
                  </div>
                </div>
              )}

              {event.media.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setMediaIndex((prev) => (prev - 1 + event.media.length) % event.media.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/75 hover:bg-slate-900 text-white flex items-center justify-center border border-slate-700"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaIndex((prev) => (prev + 1) % event.media.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/75 hover:bg-slate-900 text-white flex items-center justify-center border border-slate-700"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-slate-200">
                <span className="truncate font-medium">{activeMedia.caption}</span>
                <span className="font-mono-tabular text-slate-400 shrink-0">
                  {mediaIndex + 1} / {event.media.length}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80">
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Čas a doba trvání</p>
                <p className="text-sm font-semibold text-white">
                  {event.startTime} · Trvání: {event.durationLabel}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Přesná adresa</p>
                <p className="text-sm font-semibold text-white">{event.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Obsazenost kapacity</p>
                <p className="text-sm font-semibold text-white font-mono-tabular">
                  {event.attendeesCount} z {event.capacity} účastníků
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">
                  {event.isActive
                    ? 'Stav: Probíhá teď · Lajk'
                    : 'Stav: Zatím neaktivní · Lajk & SMS'}
                </p>
                <button
                  type="button"
                  onClick={() => onToggleLike(event.id)}
                  className="text-sm font-semibold text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors"
                >
                  <Heart className={`w-3.5 h-3.5 ${event.isLikedByMe ? 'fill-current' : ''}`} />
                  <span>
                    {event.isLikedByMe
                      ? (event.isActive
                          ? `To se mi líbí (${event.likesCount})`
                          : `Lajknuto + SMS připomínka aktivní (${event.likesCount})`)
                      : (event.isActive
                          ? `Dát lajk (${event.likesCount})`
                          : `Lajk + SMS 30 min předem (${event.likesCount})`)}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-bold text-white font-display mb-1">O této události</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{event.description}</p>
          </div>

          {/* Verified Host Card — Real Name Revealed for Event Founder View */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Ověřený hostitel (Skutečné jméno odhaleno pro důvěru)</span>
              </div>
              <span className="text-xs text-slate-400 font-mono-tabular">
                Hodnocení: {event.hostRating.toFixed(1)} / 10
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div
                onClick={() => onInspectUser(event.hostId)}
                className="flex items-center gap-3.5 cursor-pointer group"
              >
                <img
                  src={event.hostAvatar}
                  alt={event.hostRealName}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors font-display">
                      {event.hostRealName}
                    </span>
                    <span className="text-xs text-slate-400">({event.hostNickname})</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Zorganizováno akcí:{' '}
                    <strong className="text-slate-200 font-mono-tabular">
                      {event.hostOrganizedCount}
                    </strong>
                  </p>
                </div>
              </div>

              {!isMeHost && (
                <div className="flex items-center gap-2 shrink-0">
                  {isHostFriend ? (
                    <button
                      type="button"
                      onClick={() => onOpenChatWithUser(event.hostId)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5 min-h-[40px]"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Zpráva</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAddFriend(event.hostId)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 border border-slate-700 min-h-[40px]"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Přidat do přátel</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Real Auto-Expiration Countdown Card */}
          <div className="rounded-2xl bg-[#090d16] border border-[#1e2d4a] p-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-white block truncate">
                  {event.isActive ? '⚡ Probíhá právě teď' : '⏳ Nadcházející sraz'}
                </span>
                <span className="text-[11px] text-amber-300 font-mono-tabular truncate block">
                  {expirationLabel}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
              Mizení z mapy
            </span>
          </div>

          {/* Navigation, Event Chat & 100m GPS Check-in */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  if (onStartRouteNavigation) {
                    onStartRouteNavigation({
                      lat: event.lat,
                      lng: event.lng,
                      title: event.title,
                      category: event.category,
                      address: event.address,
                    });
                    onClose();
                  } else {
                    setShowRouteModal(true);
                  }
                }}
                className="flex-1 h-12 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Navigation className="w-4 h-4 shrink-0" />
                <span>Navigovat na mapě</span>
              </button>

              {onOpenEventChat && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenEventChat(event.id);
                  }}
                  className="h-12 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                  title="Otevřít skupinový chat pro účastníky této akce"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>Chat srazu</span>
                </button>
              )}

              {isClaimed ? (
                <button
                  type="button"
                  disabled={true}
                  className="flex-1 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 cursor-default select-none shadow-inner"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Odbaveno · Body již vybrány (+50 KRJ)</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!isWithin100Meters}
                  onClick={() => onCheckIn(event.id)}
                  className={`flex-1 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    isWithin100Meters
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-[0.98] cursor-pointer'
                      : 'bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Jsem na místě (+50 KRJ)</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
              {isClaimed ? (
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Účast ověřena · Body z této akce můžete získat pouze jednou (zapsáno)</span>
                </div>
              ) : (
                <>
                  <span className="text-slate-400">
                    Vzdálenost vaší GPS:{' '}
                    <strong className={`font-mono-tabular ${isWithin100Meters ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {distanceMeters} metrů
                    </strong>{' '}
                    (pro odbavení musíte být do 100 m)
                  </span>

                  {!isWithin100Meters && (
                    <button
                      type="button"
                      onClick={() =>
                        onMoveGpsNearEvent(
                          event.lat + 0.00018,
                          event.lng + 0.00018,
                          `Na místě: ${event.title}`
                        )
                      }
                      className="text-emerald-400 hover:underline font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                    >
                      <Crosshair className="w-3.5 h-3.5 shrink-0" />
                      <span>Simulovat příchod (přesunout GPS do 25 m)</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Comments & Rating */}
          {/* Comments & Rating */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-display">
                Hodnocení a recenze ({event.comments.length})
              </h3>
              <span className="text-xs text-slate-400 font-mono-tabular">
                {event.comments.length > 0 ? (
                  <>
                    Průměr: <strong className="text-white">{overallRating.toFixed(1)}</strong> / 10.0
                  </>
                ) : (
                  <span className="text-slate-400">Zatím nehodnoceno</span>
                )}
              </span>
            </div>

            {isMeHost ? (
              <div className="rounded-2xl bg-slate-950/70 border border-slate-800/90 p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-emerald-400 mt-0.5 shadow-sm">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">Hodnocení organizátorem není povoleno</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Jako organizátor nemůžete hodnotit svou vlastní událost ani k ní psát recenze. Hodnocení a zpětnou vazbu mohou udělovat pouze ostatní účastníci a návštěvníci po příchodu.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitComment} className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>Bodové hodnocení akce:</span>
                  </label>
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold font-mono-tabular ${getRatingBadgeColor(ratingInput).bgClass}`}>
                    {ratingInput.toFixed(1)} / 10.0
                  </span>
                </div>

                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.5"
                  value={ratingInput}
                  onChange={(e) => setRatingInput(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />

                <textarea
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Napište aktuální stav z místa nebo přiložte fotku..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />

                {attachedPhoto && (
                  <div className="relative inline-block">
                    <img
                      src={attachedPhoto}
                      alt="Přiložená fotografie"
                      referrerPolicy="no-referrer"
                      className="h-24 w-36 object-cover rounded-xl border border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setAttachedPhoto(undefined)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs shadow-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 border border-slate-700 min-h-[38px]"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Nahrát fotku</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttachedPhoto(EVENT_PHOTOS[event.category])}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-800 min-h-[38px]"
                    >
                      Přiložit živý snímek
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 min-h-[38px]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Odeslat</span>
                  </button>
                </div>
              </form>
            )}

            {event.comments.length === 0 ? (
              <div className="rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 p-6 text-center space-y-2">
                <MessageSquare className="w-6 h-6 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">Zatím žádná hodnocení</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Tato akce zatím nemá žádné recenze od účastníků. První návštěvníci budou moci ohodnotit průběh po začátku setkání.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {event.comments.map((c) => {
                  const cBadge = getRatingBadgeColor(c.rating);
                  return (
                    <div key={c.id} className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div
                          onClick={() => onInspectUser(c.userId)}
                          className="flex items-center gap-2.5 cursor-pointer group"
                        >
                          <img
                            src={c.userAvatar}
                            alt={c.userNickname}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {c.userNickname}
                            </span>
                            <span className="text-[11px] text-slate-500 ml-2">{c.timestamp}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold font-mono-tabular ${cBadge.bgClass}`}>
                          {c.rating.toFixed(1)}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{c.text}</p>

                      {c.attachedPhotoUrl && (
                        <div className="pt-1">
                          <img
                            src={c.attachedPhotoUrl}
                            alt="Fotografie z místa"
                            referrerPolicy="no-referrer"
                            className="h-36 w-56 object-cover rounded-xl border border-slate-800"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Route Modal */}
        {showRouteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white font-display">Zvolte způsob dopravy</h3>
                  <p className="text-xs text-slate-400">{event.address}</p>
                </div>
                <button
                  onClick={() => setShowRouteModal(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRouteMode('walk')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all ${
                    routeMode === 'walk'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Footprints className="w-5 h-5" />
                  <span>Pěšky</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRouteMode('bike')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all ${
                    routeMode === 'bike'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Bike className="w-5 h-5" />
                  <span>Na kole</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRouteMode('car')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all ${
                    routeMode === 'car'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Car className="w-5 h-5" />
                  <span>Autem</span>
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {onStartRouteNavigation && (
                  <button
                    type="button"
                    onClick={() => {
                      onStartRouteNavigation({
                        lat: event.lat,
                        lng: event.lng,
                        title: event.title,
                        category: event.category,
                        address: event.address,
                      });
                      setShowRouteModal(false);
                      onClose();
                    }}
                    className="w-full h-11 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-sky-600/20"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Zobrazit trasu na mapě aplikace</span>
                  </button>
                )}

                <a
                  href={mapyCzUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Otevřít v Mapy.cz</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  <span>Otevřít v Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
