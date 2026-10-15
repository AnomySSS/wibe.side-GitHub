import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import {
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Clock,
  Users,
  Lock,
  Globe,
  Camera,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Crosshair,
  Navigation,
  Calendar as CalendarIcon,
  ChevronUp,
  ChevronDown,
  Bell,
  Sparkles,
  LocateFixed,
  RefreshCw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  EventCategory,
  RegionCity,
  CATEGORY_MAP,
  UserProfile,
  MeetupEvent,
  getDistanceMeters,
} from '../types';
import { EVENT_PHOTOS } from '../data/mockData';
import { CategoryIcon } from './InteractiveRegionMap';
import {
  AlarmCalendarTimePicker,
  getMinimumAllowedTimeSlot,
} from './AlarmCalendarTimePicker';
import {
  checkCreationRateLimit,
  resetCreationHistory,
  RateLimitStatus,
} from '../utils/rateLimit';

import { OpenDataPlace } from '../data/openDataPlaces';

interface CreateEventViewProps {
  currentUser: UserProfile;
  userGps: { lat: number; lng: number; label: string };
  prefilledPlace?: OpenDataPlace | null;
  onToggleVerifiedStatus: (verified: boolean) => void;
  onUpdateUserGps: (lat: number, lng: number, label: string) => void;
  onRequestRealGps: () => void;
  onCreateEvent: (newEvent: Omit<MeetupEvent, 'id'>) => void;
}

const DURATION_OPTIONS = [
  { hours: 1, label: '1 hodina' },
  { hours: 2, label: '2 hodiny' },
  { hours: 3, label: '3 hodiny' },
  { hours: 4, label: '4 hodiny' },
  { hours: 6, label: '6 hodin' },
  { hours: 12, label: '12 hodin' },
  { hours: 24, label: '24 hodin (1 den)' },
  { hours: 48, label: '48 hodin (2 dny - maximum pro běžné uživatele)' },
];

export const CreateEventView: React.FC<CreateEventViewProps> = ({
  currentUser,
  userGps,
  prefilledPlace,
  onToggleVerifiedStatus,
  onUpdateUserGps,
  onRequestRealGps,
  onCreateEvent,
}) => {
  const [phoneVerify, setPhoneVerify] = useState('+420 732 418 902');
  const [idDocumentCode, setIdDocumentCode] = useState('ID-KHK-948201');

  // Event form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('kava');

  const [city, setCity] = useState<RegionCity>('Hradec Králové');

  useEffect(() => {
    if (prefilledPlace) {
      setTitle(`Sraz: ${prefilledPlace.name}`);
      if (prefilledPlace.category === 'hriste') setCategory('sport');
      else if (prefilledPlace.category === 'turistika' || prefilledPlace.category === 'priroda')
        setCategory('prochazky');
      else if (
        prefilledPlace.category === 'knihovna' ||
        prefilledPlace.category === 'muzeum' ||
        prefilledPlace.category === 'kulturak' ||
        prefilledPlace.category === 'kino'
      )
        setCategory('kultura');
      if (prefilledPlace.city) {
        setCity(prefilledPlace.city as RegionCity);
      }
    }
  }, [prefilledPlace]);
  // Coordinates strictly bound to current user active GPS (no manual picking allowed)
  const lat = userGps.lat;
  const lng = userGps.lng;
  // Address is strictly automatically bound to user's active GPS (no manual input)
  const resolvedAddress = userGps.label || `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;

  // Mini-map Leaflet setup
  const miniMapContainerRef = useRef<HTMLDivElement | null>(null);
  const miniMapInstanceRef = useRef<L.Map | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(16);

  useEffect(() => {
    if (!miniMapContainerRef.current) return;

    if (!miniMapInstanceRef.current) {
      const map = L.map(miniMapContainerRef.current, {
        center: [lat, lng],
        zoom: currentZoom,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
      });

      // Reliable OpenStreetMap tile layer with dark styling via wibe-leaflet-container
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 10,
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      miniMapInstanceRef.current = map;

      // Force size recalculations to guarantee map tiles render immediately
      const updateSize = () => {
        if (miniMapInstanceRef.current) {
          miniMapInstanceRef.current.invalidateSize();
        }
      };

      updateSize();
      const raf = requestAnimationFrame(updateSize);
      const timer1 = setTimeout(updateSize, 100);
      const timer2 = setTimeout(updateSize, 300);

      // Observe container resize to keep Leaflet synchronized with DOM rendering
      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined' && miniMapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          updateSize();
        });
        resizeObserver.observe(miniMapContainerRef.current);
      }

      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer1);
        clearTimeout(timer2);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        map.remove();
        miniMapInstanceRef.current = null;
      };
    } else {
      miniMapInstanceRef.current.setView([lat, lng], currentZoom);
      miniMapInstanceRef.current.invalidateSize();
    }
  }, [lat, lng]);

  const handleZoomIn = () => {
    if (miniMapInstanceRef.current) {
      const nextZoom = Math.min(18, currentZoom + 1);
      miniMapInstanceRef.current.setZoom(nextZoom);
      setCurrentZoom(nextZoom);
    }
  };

  const handleZoomOut = () => {
    if (miniMapInstanceRef.current) {
      const nextZoom = Math.max(12, currentZoom - 1);
      miniMapInstanceRef.current.setZoom(nextZoom);
      setCurrentZoom(nextZoom);
    }
  };

  const handleCenterGps = () => {
    onRequestRealGps();
    if (miniMapInstanceRef.current) {
      miniMapInstanceRef.current.setView([lat, lng], currentZoom);
      miniMapInstanceRef.current.invalidateSize();
    }
  };

  // Alarm Clock & Calendar state: starts strictly in the future (rounded +5..15m buffer)
  const initialTimeSlot = getMinimumAllowedTimeSlot();
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(() =>
    initialTimeSlot.isTodayFinished ? 1 : 0
  );
  const [alarmHour, setAlarmHour] = useState<number>(() => initialTimeSlot.minHour);
  const [alarmMinute, setAlarmMinute] = useState<number>(() => initialTimeSlot.minMinute);
  const [durationHours, setDurationHours] = useState<number>(3);

  const getComputedStartTimeString = () => {
    const dayLabel =
      selectedDayOffset === 0
        ? 'Dnes'
        : selectedDayOffset === 1
        ? 'Zítra'
        : 'Pozítří';
    const hh = String(alarmHour).padStart(2, '0');
    const mm = String(alarmMinute).padStart(2, '0');
    return `${dayLabel} v ${hh}:${mm}`;
  };

  const getComputedTimestamps = () => {
    const d = new Date();
    d.setDate(d.getDate() + selectedDayOffset);
    d.setHours(alarmHour, alarmMinute, 0, 0);
    const startsAt = d.getTime();
    const expiresAt = startsAt + durationHours * 3600 * 1000;
    return { startsAt, expiresAt };
  };

  const [description, setDescription] = useState('');
  const [capacityInput, setCapacityInput] = useState<string>('12');
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [coverPhoto, setCoverPhoto] = useState<string>(EVENT_PHOTOS.kava);
  const [formError, setFormError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [missingFieldsList, setMissingFieldsList] = useState<string[]>([]);
  const [rateLimitKey, setRateLimitKey] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const errorBannerRef = useRef<HTMLDivElement | null>(null);

  // Anti-spam Rate Limit Status: Max 1 event/hr, Max 2 events/day
  const rateLimit: RateLimitStatus = checkCreationRateLimit();

  const distanceFromTargetMeters = getDistanceMeters(
    userGps.lat,
    userGps.lng,
    lat,
    lng
  );
  const isGeofenceValid = distanceFromTargetMeters <= 150;

  const handleCategorySelect = (cat: EventCategory) => {
    setCategory(cat);
    setCoverPhoto(EVENT_PHOTOS[cat]);
  };

  const handleCoverPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCoverPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Anti-spam Rate limit validation (2/day, 1/hour)
    if (!rateLimit.canCreate) {
      setFormError(
        rateLimit.reason ||
          'Ochrana před spamem: Můžeš vytvořit max. 1 událost za hodinu a max. 2 za den.'
      );
      return;
    }

    if (!currentUser.isVerifiedHost) {
      setFormError('Pouze ověření hostitelé mohou zakládat nové události.');
      return;
    }

    // 2. Comprehensive validation of all required fields (except photo which has default cover)
    const errors: { [key: string]: string } = {};
    const missing: string[] = [];

    if (!title.trim()) {
      errors.title = 'Zadejte prosím název události';
      missing.push('Název události');
    }

    if (!description.trim()) {
      errors.description = 'Vyplňte prosím popis události a program setkání';
      missing.push('Popis akce');
    }

    const parsedCapacity = parseInt(capacityInput, 10);
    if (!capacityInput.trim() || isNaN(parsedCapacity) || parsedCapacity < 2) {
      errors.capacity = 'Zadejte platný počet osob (minimálně 2 účastníci)';
      missing.push('Počet účastníků (kapacita min. 2)');
    }

    if (!resolvedAddress.trim()) {
      errors.address = 'Upřesněte prosím adresu nebo název místa';
      missing.push('Adresa / místo konání');
    }

    const durationObj =
      DURATION_OPTIONS.find((d) => d.hours === durationHours) || DURATION_OPTIONS[2];
    const { startsAt, expiresAt } = getComputedTimestamps();

    if (durationHours > 48) {
      errors.duration = 'Maximální doba trvání události pro běžné uživatele je 48 hodin';
      missing.push('Doba trvání události');
    }

    // Past time protection: Cannot schedule an event in the past (allow 60s tolerance for filling form)
    if (startsAt < Date.now() - 60 * 1000) {
      errors.time = 'Vybraný čas je v minulosti. Zvolte platný budoucí čas.';
      missing.push('Platný budoucí čas začátku');
    }

    // Geofenced creation check: User must be physically within 150 meters
    if (!isGeofenceValid) {
      errors.geofence = `Vaše GPS poloha je ${distanceFromTargetMeters} m od místa. Musíte být přímo na místě (do 150 m).`;
      missing.push('GPS poloha na místě konání (do 150 m)');
    }

    if (missing.length > 0) {
      setValidationErrors(errors);
      setMissingFieldsList(missing);
      setFormError(
        `Některé povinné položky nejsou vyplněny (${missing.length}). Prosím doplňte chybějící údaje níže.`
      );
      if (errorBannerRef.current) {
        errorBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setValidationErrors({});
    setMissingFieldsList([]);

    const computedStartTime = getComputedStartTimeString();

    onCreateEvent({
      title: title.trim(),
      category,
      city,
      lat,
      lng,
      address: resolvedAddress,
      startTime: computedStartTime,
      startsAtTimestamp: startsAt,
      durationHours,
      durationLabel: durationObj.label.replace(' (2 dny - maximum pro běžné uživatele)', ''),
      expiresAtTimestamp: expiresAt,
      description: description.trim(),
      capacity: parsedCapacity,
      attendeesCount: 1,
      attendeeIds: [currentUser.id],
      isPublic,
      isActive: false, // Nadcházející událost (ještě neaktivní před zahájením)
      likesCount: 1,
      isLikedByMe: true,
      smsAlertSubscribed: true,
      hostId: currentUser.id,
      hostNickname: currentUser.nickname,
      hostRealName: currentUser.realName,
      hostAvatar: currentUser.avatarUrl,
      hostRating: 9.5,
      hostOrganizedCount: currentUser.organizedCount + 1,
      hostVerified: true,
      activityRadiusMeters: 550,
      checkedInByMe: true,
      media: [
        {
          id: `media-${Date.now()}`,
          type: 'photo',
          url: coverPhoto,
          caption: `${title.trim()} — ${resolvedAddress}`,
        },
      ],
      // Organizer cannot give themselves initial rating/review - starts empty!
      comments: [],
    });
  };

  return (
    <div className="w-full h-full overflow-y-auto pb-28 pt-4 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header & Verification Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Královéhradecký kraj</span>
              <span>·</span>
              <span>GPS uzamčené zakládání akcí</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-display mt-1">
              Vytvořit novou událost na mapě
            </h1>
          </div>

          <button
            type="button"
            onClick={() => onToggleVerifiedStatus(!currentUser.isVerifiedHost)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-2 self-start sm:self-auto min-h-[40px] ${
              currentUser.isVerifiedHost
                ? 'bg-emerald-950/70 border-emerald-600/50 text-emerald-300'
                : 'bg-amber-950/70 border-amber-600/50 text-amber-300'
            }`}
          >
            {currentUser.isVerifiedHost ? (
              <>
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Ověřený hostitel (Klepnutím přepnout)</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Neověřený účet (Zobrazit žádost)</span>
              </>
            )}
          </button>
        </div>

        {/* Verification Guard if user is not verified */}
        {!currentUser.isVerifiedHost ? (
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-display">
                  Vyžadováno ověření hostitele
                </h2>
                <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                  Pro zakládání bodů na mapě vyžadujeme ověřený status hostitele. Tím chráníme komunitu před falešnými body a zaručujeme bezpečnost účastníků.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white font-display">
                Ověření totožnosti
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Skutečné jméno (bude viditelné u založených akcí)
                  </label>
                  <input
                    type="text"
                    value={currentUser.realName}
                    readOnly
                    className="w-full h-11 rounded-xl bg-slate-900 border border-slate-800 px-3.5 text-sm text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Telefonní číslo pro ověřovací SMS
                  </label>
                  <input
                    type="text"
                    value={phoneVerify}
                    onChange={(e) => setPhoneVerify(e.target.value)}
                    className="w-full h-11 rounded-xl bg-slate-900 border border-slate-800 px-3.5 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Kód dokladu / BankID
                </label>
                <input
                  type="text"
                  value={idDocumentCode}
                  onChange={(e) => setIdDocumentCode(e.target.value)}
                  className="w-full h-11 rounded-xl bg-slate-900 border border-slate-800 px-3.5 text-sm text-white font-mono-tabular"
                />
              </div>

              <button
                type="button"
                onClick={() => onToggleVerifiedStatus(true)}
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Ověřit účet a odemknout tvorbu akcí</span>
              </button>
            </div>
          </div>
        ) : (
          /* Form for Verified Host */
          <form onSubmit={handleSubmitEvent} className="space-y-6">
            {/* Active GPS Binding Status Banner */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <LocateFixed className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Událost vázána na vaši aktivní polohu</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/60 border border-emerald-500/30 text-emerald-300">
                      <Lock className="w-2.5 h-2.5" />
                      <span>GPS uzamčeno</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {userGps.label} ({lat.toFixed(4)}°N, {lng.toFixed(4)}°E) · Místo konání vznikne přímo na vaší GPS pozici
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={onRequestRealGps}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-emerald-300 flex items-center gap-1.5 border border-emerald-500/30 transition-colors shadow-sm"
                  title="Zaměřit polohu přímo ze satelitu či prohlížeče"
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Aktualizovat GPS</span>
                </button>
              </div>
            </div>

            {/* Prefilled Open Data Place Banner */}
            {prefilledPlace && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-700/80 flex items-center justify-between gap-3 shadow-md animate-in fade-in duration-150">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center text-emerald-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-display">{prefilledPlace.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-[9.5px] font-semibold text-emerald-300">
                        {prefilledPlace.tagLabel}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {prefilledPlace.address} · {prefilledPlace.city}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-lg bg-slate-800/90 text-[10px] text-slate-300 font-semibold border border-slate-700 shrink-0 hidden sm:inline">
                  Otevřená data KHK
                </span>
              </div>
            )}

            {/* Compact Anti-Spam mini-indicator */}
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300 font-medium text-[11px]">Limit tvorby akcí:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950 border border-slate-800 text-emerald-400 font-mono-tabular">
                  {rateLimit.dailyCount} / 2 dnes
                </span>
                {isGeofenceValid && (
                  <span className="text-[11px] text-slate-400 hidden sm:inline">· GPS poloha ověřena</span>
                )}
              </div>
              {!rateLimit.canCreate ? (
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold text-[11px]">Limit 2/den vyčerpán</span>
                  <button
                    type="button"
                    onClick={() => {
                      resetCreationHistory();
                      setRateLimitKey((k) => k + 1);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-bold"
                  >
                    Reset (Demo)
                  </button>
                </div>
              ) : null}
            </div>

            {/* Missing Fields Detailed Warning Banner (as requested) */}
            {missingFieldsList.length > 0 && (
              <div
                ref={errorBannerRef}
                className="rounded-2xl bg-rose-950/80 border-2 border-rose-500/80 p-4 sm:p-5 text-rose-200 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white">
                        ⚠️ Chybí povinné údaje pro vytvoření události
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/30 text-rose-200 border border-rose-500/40 font-mono-tabular">
                        {missingFieldsList.length} {missingFieldsList.length === 1 ? 'položka' : missingFieldsList.length < 5 ? 'položky' : 'položek'}
                      </span>
                    </div>
                    <p className="text-xs text-rose-200 leading-relaxed">
                      Před zveřejněním na mapě je nutné doplnit následující povinné položky (fotografie je volitelná):
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-rose-900/60">
                  {missingFieldsList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-900/40 border border-rose-500/30 text-xs font-semibold text-rose-100"
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 animate-pulse" />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formError && missingFieldsList.length === 0 && (
              <div className="rounded-2xl bg-red-950/60 border border-red-600/60 p-4 text-xs sm:text-sm text-red-200 flex items-start gap-3 shadow-lg">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
                <h2 className="text-base font-bold text-white font-display">Základní údaje</h2>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Název události <span className="text-rose-400">*</span>
                    </label>
                    {validationErrors.title && (
                      <span className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors.title}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (validationErrors.title) {
                        setValidationErrors((prev) => {
                          const next = { ...prev };
                          delete next.title;
                          return next;
                        });
                      }
                    }}
                    placeholder="Např. Podvečerní běh u Labe"
                    className={`w-full h-11 rounded-xl px-3.5 text-sm text-white transition-all focus:outline-none ${
                      validationErrors.title
                        ? 'bg-rose-950/30 border-2 border-rose-500 ring-2 ring-rose-500/30'
                        : 'bg-slate-950 border border-slate-800 focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kategorie
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(CATEGORY_MAP) as EventCategory[]).map((catKey) => {
                      const cat = CATEGORY_MAP[catKey];
                      const active = category === catKey;
                      return (
                        <button
                          key={catKey}
                          type="button"
                          onClick={() => handleCategorySelect(catKey)}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 min-h-[44px] transition-all ${
                            active
                              ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <CategoryIcon category={catKey} className="w-4 h-4 shrink-0" />
                          <span className="text-xs truncate">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ALARM CLOCK & CALENDAR TIME PICKER */}
                <div className={validationErrors.time ? 'rounded-2xl ring-2 ring-rose-500/50 p-1 bg-rose-950/20' : ''}>
                  <AlarmCalendarTimePicker
                    selectedDayOffset={selectedDayOffset}
                    onChangeDayOffset={(d) => {
                      setSelectedDayOffset(d);
                      if (validationErrors.time) {
                        setValidationErrors((prev) => {
                          const next = { ...prev };
                          delete next.time;
                          return next;
                        });
                      }
                    }}
                    alarmHour={alarmHour}
                    onChangeAlarmHour={(h) => {
                      setAlarmHour(h);
                      if (validationErrors.time) {
                        setValidationErrors((prev) => {
                          const next = { ...prev };
                          delete next.time;
                          return next;
                        });
                      }
                    }}
                    alarmMinute={alarmMinute}
                    onChangeAlarmMinute={(m) => {
                      setAlarmMinute(m);
                      if (validationErrors.time) {
                        setValidationErrors((prev) => {
                          const next = { ...prev };
                          delete next.time;
                          return next;
                        });
                      }
                    }}
                    durationHours={durationHours}
                    onChangeDurationHours={setDurationHours}
                  />
                  {validationErrors.time && (
                    <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 rounded-xl mt-2 border border-rose-500/30">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{validationErrors.time}</span>
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Popis akce <span className="text-rose-400">*</span>
                    </label>
                    {validationErrors.description && (
                      <span className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors.description}
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (validationErrors.description) {
                        setValidationErrors((prev) => {
                          const next = { ...prev };
                          delete next.description;
                          return next;
                        });
                      }
                    }}
                    placeholder="Popište sraz, program a pro koho je akce vhodná..."
                    className={`w-full rounded-xl p-3.5 text-sm text-white placeholder:text-slate-500 transition-all focus:outline-none ${
                      validationErrors.description
                        ? 'bg-rose-950/30 border-2 border-rose-500 ring-2 ring-rose-500/30'
                        : 'bg-slate-950 border border-slate-800 focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
                <h2 className="text-base font-bold text-white font-display">Místo, kapacita a foto</h2>

                {/* Compact Real Leaflet Map Preview (~180px) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">
                      Reálný náhled místa (vaše aktivní GPS)
                    </label>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                      <Lock className="w-2.5 h-2.5" />
                      <span>GPS zafixováno</span>
                    </span>
                  </div>

                  {/* Compact Real Map Container */}
                  <div className="relative w-full h-[180px] sm:h-[190px] rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-xl select-none">
                    {/* Actual Leaflet Map Canvas */}
                    <div ref={miniMapContainerRef} className="wibe-leaflet-container absolute inset-0 z-0 w-full h-full" />

                    {/* Top overlay: Active GPS label and Refresh GPS button */}
                    <div className="absolute top-2.5 inset-x-2.5 z-20 flex items-center justify-between gap-2 pointer-events-none">
                      <div className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-[11px] text-slate-300 shadow-md">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span className="font-semibold text-white truncate max-w-[130px] sm:max-w-[180px]">
                          {userGps.label || 'Aktivní GPS'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleCenterGps}
                        title="Znovu zaměřit reálnou GPS polohu"
                        className="pointer-events-auto px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-[11px] font-semibold text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                      >
                        <RefreshCw className="w-3 h-3 text-emerald-400" />
                        <span>Zaměřit GPS</span>
                      </button>
                    </div>

                    {/* Center Overlay: The Pin with pulsing ring and floating event title banner */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="relative flex flex-col items-center">
                        {/* Floating Event Title Banner right above the icon */}
                        <div className="absolute -top-11 flex flex-col items-center pointer-events-none transition-all duration-200">
                          <div
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/95 backdrop-blur-md border text-xs font-bold text-white shadow-xl max-w-[220px]"
                            style={{
                              borderColor: CATEGORY_MAP[category].colorHex,
                              boxShadow: `0 4px 16px rgba(0,0,0,0.7), 0 0 12px ${CATEGORY_MAP[category].colorHex}60`,
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: CATEGORY_MAP[category].colorHex }}
                            />
                            <span className="truncate">{title.trim() || 'Nová událost'}</span>
                          </div>
                          {/* Downward notch pointing directly to the pin */}
                          <div
                            className="w-0 h-0 border-x-4 border-x-transparent border-t-4 -mt-px opacity-95"
                            style={{ borderTopColor: CATEGORY_MAP[category].colorHex }}
                          />
                        </div>

                        {/* Outer pulsing ring with category color */}
                        <span
                          className="absolute w-12 h-12 rounded-full opacity-70 animate-ping pointer-events-none"
                          style={{ backgroundColor: CATEGORY_MAP[category].colorHex }}
                        />
                        {/* Soft halo glow */}
                        <div
                          className="absolute w-16 h-16 rounded-full blur-lg pointer-events-none opacity-40"
                          style={{ backgroundColor: CATEGORY_MAP[category].colorHex }}
                        />
                        {/* Distinct Icon Pin */}
                        <div
                          className="relative w-10 h-10 rounded-xl flex items-center justify-center shadow-2xl border-2 transition-transform duration-200"
                          style={{
                            backgroundColor: '#090d16',
                            borderColor: CATEGORY_MAP[category].colorHex,
                            boxShadow: `0 0 18px ${CATEGORY_MAP[category].colorHex}80`,
                          }}
                        >
                          <CategoryIcon
                            category={category}
                            className="w-5 h-5 text-white transition-transform"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom overlay: Category badge + coordinates and Zoom controls */}
                    <div className="absolute bottom-2 inset-x-2.5 z-20 flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-sm border border-slate-800 text-[10px] text-slate-300 shadow">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: CATEGORY_MAP[category].colorHex }}
                        />
                        <span className="font-semibold text-slate-200">{CATEGORY_MAP[category].name}</span>
                        <span className="text-slate-400 font-mono-tabular">
                          · {lat.toFixed(4)}, {lng.toFixed(4)}
                        </span>
                      </div>

                      {/* Map Zoom Controls */}
                      <div className="flex items-center gap-1 pointer-events-auto">
                        <button
                          type="button"
                          onClick={handleZoomIn}
                          title="Přiblížit mapu"
                          className="w-6 h-6 rounded-md bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-200 hover:text-white transition-colors shadow"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleZoomOut}
                          title="Oddálit mapu"
                          className="w-6 h-6 rounded-md bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-200 hover:text-white transition-colors shadow"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {validationErrors.address && (
                    <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 rounded-xl border border-rose-500/30">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{validationErrors.address}</span>
                    </p>
                  )}
                  {validationErrors.geofence && (
                    <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 rounded-xl border border-rose-500/30">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{validationErrors.geofence}</span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Kapacita / počet osob</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">min. 2 osoby</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min={2}
                          max={1000}
                          value={capacityInput}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          onChange={(e) => {
                            setCapacityInput(e.target.value);
                            if (validationErrors.capacity) {
                              setValidationErrors((prev) => {
                                const next = { ...prev };
                                delete next.capacity;
                                return next;
                              });
                            }
                          }}
                          placeholder="Počet lidí"
                          className={`w-full h-11 rounded-xl px-3.5 pr-14 text-sm font-bold text-white font-mono-tabular transition-all focus:outline-none ${
                            validationErrors.capacity
                              ? 'bg-rose-950/30 border-2 border-rose-500 ring-2 ring-rose-500/30'
                              : 'bg-slate-950 border border-slate-800 focus:border-emerald-500'
                          }`}
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                          osob
                        </span>
                      </div>

                      {/* Stepper buttons - and + */}
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1 h-11 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = parseInt(capacityInput, 10) || 2;
                            const next = Math.max(2, cur - 1);
                            setCapacityInput(String(next));
                            if (validationErrors.capacity) {
                              setValidationErrors((prev) => {
                                const n = { ...prev };
                                delete n.capacity;
                                return n;
                              });
                            }
                          }}
                          className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors active:scale-95"
                          title="Odebrat 1 osobu"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const cur = parseInt(capacityInput, 10) || 0;
                            const next = Math.max(2, cur + 1);
                            setCapacityInput(String(next));
                            if (validationErrors.capacity) {
                              setValidationErrors((prev) => {
                                const n = { ...prev };
                                delete n.capacity;
                                return n;
                              });
                            }
                          }}
                          className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors active:scale-95"
                          title="Přidat 1 osobu"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Quick 1-click preset chips */}
                    <div className="flex items-center flex-wrap gap-1.5 pt-2">
                      <span className="text-[11px] text-slate-500 mr-0.5">Rychle:</span>
                      {[5, 10, 15, 25, 50, 100].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setCapacityInput(String(num));
                            if (validationErrors.capacity) {
                              setValidationErrors((prev) => {
                                const next = { ...prev };
                                delete next.capacity;
                                return next;
                              });
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            capacityInput === String(num)
                              ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold shadow-sm'
                              : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    {validationErrors.capacity && (
                      <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5 pt-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{validationErrors.capacity}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Přístupnost
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsPublic(true)}
                        className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${
                          isPublic ? 'bg-emerald-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Veřejná</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPublic(false)}
                        className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${
                          !isPublic ? 'bg-amber-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Uzavřená</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Titulní fotografie
                  </label>
                  <div className="flex items-center gap-3">
                    <img
                      src={coverPhoto}
                      alt="Titulní foto"
                      referrerPolicy="no-referrer"
                      className="w-24 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div className="space-y-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverPhotoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 border border-slate-700"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Vybrat vlastní foto</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning bar right above submit button if missing fields exist */}
            {missingFieldsList.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-200 shadow-md">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-semibold">
                    Před vytvořením je potřeba doplnit: {missingFieldsList.join(', ')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="px-3 py-1.5 rounded-lg bg-rose-900 hover:bg-rose-800 text-white font-bold text-xs shrink-0 self-start sm:self-auto transition-colors"
                >
                  Přejít na chybějící údaje
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                {!rateLimit.canCreate ? (
                  <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>{rateLimit.reason}</span>
                  </span>
                ) : (
                  <span>
                    Po zveřejnění získáte <strong className="text-emerald-400">+100 KRJ</strong> do žebříčku kraje.
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={!rateLimit.canCreate}
                className="w-full sm:w-auto px-8 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-all"
                title={!rateLimit.canCreate ? rateLimit.reason : 'Zveřejnit událost na mapě'}
              >
                <MapPin className="w-4 h-4" />
                <span>Zveřejnit událost na mapě</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
