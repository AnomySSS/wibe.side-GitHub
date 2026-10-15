import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  Radio,
  Navigation,
  MessageSquare,
  Sparkles,
  Volume2,
  X,
  ExternalLink,
  ChevronRight,
  Shield,
  Smartphone,
  Check,
} from 'lucide-react';
import { MeetupEvent, getDistanceMeters, CATEGORY_MAP } from '../types';

interface SmsRadar5KmProps {
  events: MeetupEvent[];
  userGps: { lat: number; lng: number; label: string };
  defaultPhone: string;
  isRegistered?: boolean;
  onRequireRegistration?: (reason: 'sms') => void;
  onSelectEvent: (event: MeetupEvent) => void;
  onFlyToEvent?: (event: MeetupEvent) => void;
  onUpdatePhone?: (phone: string) => void;
  onRequestGpsUpdate?: () => void;
}

const STORAGE_KEY_RADAR_ENABLED = 'wibe_sms_radar_5km_enabled';

// Simple Web Audio API beep for realistic SMS notification sound
function playSmsNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    osc.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.08); // E6 note

    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.32);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch {
    // Audio context may be restricted by browser policy before first interaction
  }
}

export const SmsRadar5Km: React.FC<SmsRadar5KmProps> = ({
  events,
  userGps,
  defaultPhone,
  isRegistered,
  onRequireRegistration,
  onSelectEvent,
  onFlyToEvent,
  onUpdatePhone,
  onRequestGpsUpdate,
}) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RADAR_ENABLED);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const [showPreviewBanner, setShowPreviewBanner] = useState<boolean>(true);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>(defaultPhone);
  const [isEditingPhone, setIsEditingPhone] = useState<boolean>(false);
  const [lastSimulatedSmsTime, setLastSimulatedSmsTime] = useState<string | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState<number>(0);

  // Persist radar toggle
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RADAR_ENABLED, String(isEnabled));
    } catch {
      // ignore
    }
  }, [isEnabled]);

  // Find all events within 5,000 meters from userGps (Saved GPS home)
  const eventsWithin5Km = events
    .map((ev) => {
      const dist = getDistanceMeters(userGps.lat, userGps.lng, ev.lat, ev.lng);
      return { event: ev, distMeters: dist };
    })
    .filter((item) => item.distMeters <= 5000)
    .sort((a, b) => a.distMeters - b.distMeters);

  const nearestItem = eventsWithin5Km[activeBannerIndex % Math.max(1, eventsWithin5Km.length)] || null;

  const handleToggle = () => {
    if (!isRegistered) {
      onRequireRegistration?.('sms');
      return;
    }

    const next = !isEnabled;
    setIsEnabled(next);
    if (next) {
      setShowPreviewBanner(true);
      playSmsNotificationSound();

      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        } else if (Notification.permission === 'granted' && nearestItem) {
          try {
            new Notification('WIBE-SIDE SMS Radar (5 km)', {
              body: `Nová akce v dosahu 5 km: ${nearestItem.event.title} (${nearestItem.event.city})`,
            });
          } catch {
            // ignore
          }
        }
      }
    }
  };

  const handleSendTestSms = () => {
    playSmsNotificationSound();
    setLastSimulatedSmsTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setShowPreviewBanner(true);
  };

  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.trim()) {
      setIsEditingPhone(false);
      onUpdatePhone?.(phoneNumber.trim());
    }
  };

  return (
    <>
      {/* 1. Radar Control Button in Top Bar (Compact Teen Aesthetic) */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleToggle}
          className={`h-9 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
            isEnabled
              ? 'bg-gradient-to-r from-emerald-600/90 to-teal-700/90 text-white border-emerald-400/60 shadow-emerald-500/20'
              : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:text-white'
          }`}
          title="SMS Radar 5 km: Automatické SMS notifikace při akci do 5 km od vašeho domova"
        >
          <div className="relative">
            {isEnabled ? (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
              </>
            ) : (
              <BellOff className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>
          <span className="whitespace-nowrap font-medium text-[11px] sm:text-xs">
            {isEnabled ? `Radar 5 km (${eventsWithin5Km.length})` : 'Radar 5 km: Vypnuto'}
          </span>
        </button>

        {isEnabled && (
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="h-9 px-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] flex items-center justify-center transition-colors"
            title="Nastavení SMS radaru a telefonního čísla"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 2. Instant SMS Alert Preview Banner (Top Floating) */}
      {isEnabled && showPreviewBanner && nearestItem && (
        <div className="pointer-events-auto absolute top-14 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-md z-40 animate-in slide-in-from-top-3 fade-in duration-200">
          <div className="rounded-2xl bg-[#0f172a]/95 backdrop-blur-md border border-emerald-500/40 p-3 shadow-2xl shadow-emerald-950/40 text-slate-100">
            {/* Header of the SMS banner */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-[10px] font-mono uppercase tracking-wider border border-emerald-500/30">
                  SMS RADAR 5 KM
                </span>
                <span className="text-slate-400 font-normal">
                  pro {phoneNumber}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {eventsWithin5Km.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveBannerIndex((i) => (i + 1) % eventsWithin5Km.length)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white font-mono-tabular"
                    title="Další blízká akce"
                  >
                    {(activeBannerIndex % eventsWithin5Km.length) + 1}/{eventsWithin5Km.length} další →
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPreviewBanner(false)}
                  className="text-slate-400 hover:text-white p-0.5 ml-1"
                  title="Skrýt SMS banner"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Message Body */}
            <div className="pt-2 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shrink-0 shadow-md">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-200 leading-snug font-sans">
                  <strong className="text-white">📍 {(nearestItem.distMeters / 1000).toFixed(1)} km od domova:</strong>{' '}
                  „Akce <span className="text-emerald-300 font-semibold">{nearestItem.event.title}</span> ({CATEGORY_MAP[nearestItem.event.category].name}) začíná {nearestItem.event.startTime}. Přijď pokecat!“
                </p>

                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      onFlyToEvent?.(nearestItem.event);
                      onSelectEvent(nearestItem.event);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                  >
                    <span>Otevřít na mapě</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSendTestSms}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
                    title="Přehrát cvičný SMS zvuk a vibraci"
                  >
                    <Volume2 className="w-3 h-3 text-emerald-400" />
                    <span>Test zvuku</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(true)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 underline ml-auto"
                  >
                    Upravit číslo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Settings & Status Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#0f172a] border border-[#1e2d4a] p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-display">
                    SMS Proximity Radar (5 km)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Okamžitá upozornění na akce v okolí domova
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* GPS Home Status */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Zapamatovaný GPS domov:</span>
                <span className="text-emerald-400 font-mono-tabular font-bold">
                  {userGps.lat.toFixed(4)}° N, {userGps.lng.toFixed(4)}° E
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                Poloha: <strong className="text-white">{userGps.label}</strong>
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Akcí do 5 km: <strong className="text-white">{eventsWithin5Km.length}</strong>
                </span>
                {onRequestGpsUpdate && (
                  <button
                    type="button"
                    onClick={() => {
                      onRequestGpsUpdate();
                      setShowSettingsModal(false);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Aktualizovat GPS</span>
                  </button>
                )}
              </div>
            </div>

            {/* Phone Number Form */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Telefon pro SMS radar:
              </label>
              {isEditingPhone ? (
                <form onSubmit={handleSavePhone} className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 h-9 rounded-xl bg-slate-900 border border-slate-700 px-3 text-xs text-white"
                    placeholder="+420 732 418 902"
                  />
                  <button
                    type="submit"
                    className="px-3 h-9 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                  >
                    Uložit
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold font-mono text-white">
                    {phoneNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(true)}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Změnit
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleSendTestSms}
                className="w-full h-10 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulovat doručení SMS ({phoneNumber})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsEnabled(!isEnabled);
                  setShowSettingsModal(false);
                }}
                className={`w-full h-10 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                  isEnabled
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                    : 'bg-emerald-600 text-white border-emerald-500'
                }`}
              >
                {isEnabled ? 'Vypnout SMS Radar' : 'Zapnout SMS Radar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
