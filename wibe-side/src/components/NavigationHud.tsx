import React from 'react';
import {
  Navigation,
  Footprints,
  Car,
  ExternalLink,
  X,
  Crosshair,
  MapPin,
  Compass,
} from 'lucide-react';
import {
  RouteResult,
  RouteDestination,
  RouteMode,
  formatDistance,
  formatDuration,
  getGoogleMapsUrl,
  getMapyCzUrl,
} from '../utils/routing';

interface NavigationHudProps {
  destination: RouteDestination;
  userGps: { lat: number; lng: number; label: string };
  route: RouteResult | null;
  isLoading: boolean;
  onModeChange: (mode: RouteMode) => void;
  onFitRoute: () => void;
  onClose: () => void;
}

export const NavigationHud: React.FC<NavigationHudProps> = ({
  destination,
  userGps,
  route,
  isLoading,
  onModeChange,
  onFitRoute,
  onClose,
}) => {
  const currentMode = route?.mode || 'walking';
  const googleMapsUrl = getGoogleMapsUrl(
    destination.lat,
    destination.lng,
    userGps.lat,
    userGps.lng,
    currentMode
  );
  const mapyCzUrl = getMapyCzUrl(
    destination.lat,
    destination.lng,
    userGps.lat,
    userGps.lng
  );

  return (
    <div
      className="absolute bottom-16 sm:bottom-18 left-3 right-3 sm:left-6 sm:right-auto sm:w-[440px] z-30 pointer-events-auto animate-in slide-in-from-bottom-3 fade-in duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="rounded-2xl bg-[#090d1a]/95 backdrop-blur-xl border border-sky-500/40 shadow-2xl p-3.5 sm:p-4 text-white">
        {/* Top line: destination title + close button */}
        <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-400/40 text-sky-300 flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-sky-400">
                  Aktivní navigace
                </span>
                {route?.isRealRoute && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-950 border border-sky-500/30 text-sky-300 font-mono-tabular">
                    OSRM silnice
                  </span>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white truncate font-display">
                {destination.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Ukončit navigaci"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Middle: Metrics (Distance & Duration) + Mode Toggle */}
        <div className="py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <span className="text-xs text-sky-300 animate-pulse">Počítám trasu...</span>
            ) : route ? (
              <>
                <span className="text-lg sm:text-xl font-extrabold text-white font-mono-tabular">
                  {formatDistance(route.distanceMeters)}
                </span>
                <span className="text-xs font-semibold text-sky-300 font-mono-tabular">
                  · {formatDuration(route.durationMinutes)}
                </span>
              </>
            ) : (
              <span className="text-xs text-slate-400">Trasa nedostupná</span>
            )}
          </div>

          {/* Mode Pill Toggle (Pěšky / Autem) */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => onModeChange('walking')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentMode === 'walking'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Pěší trasa"
            >
              <Footprints className="w-3.5 h-3.5" />
              <span className="text-[11px]">Pěšky</span>
            </button>

            <button
              type="button"
              onClick={() => onModeChange('driving')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentMode === 'driving'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Trasa autem"
            >
              <Car className="w-3.5 h-3.5" />
              <span className="text-[11px]">Autem</span>
            </button>
          </div>
        </div>

        {/* Address and Origin hint */}
        {destination.address && (
          <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mb-2.5">
            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
            <span>{destination.address}</span>
          </p>
        )}

        {/* Bottom Actions: Fit Route + Google Maps + Mapy.cz */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onFitRoute}
            className="h-8.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1.5 border border-slate-700/80 transition-colors cursor-pointer"
            title="Zobrazit celou trasu na mapě"
          >
            <Compass className="w-3 h-3 text-sky-400" />
            <span>Zobrazit</span>
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 border border-slate-700 transition-colors shadow-sm"
            title="Otevřít v aplikaci Google Maps"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
          </a>

          <a
            href={mapyCzUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors shadow-sm shadow-emerald-900/30"
            title="Otevřít v aplikaci Mapy.cz"
          >
            <span>Mapy.cz</span>
            <ExternalLink className="w-2.5 h-2.5 text-emerald-200" />
          </a>
        </div>
      </div>
    </div>
  );
};
