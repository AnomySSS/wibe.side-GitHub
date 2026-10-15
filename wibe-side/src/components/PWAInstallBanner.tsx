import React, { useState } from 'react';
import { Download, WifiOff, X, Smartphone, CheckCircle2 } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 min-h-[36px]"
        title="Nainstalovat aplikaci WIBE-SIDE"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden xs:inline">Instalovat</span>
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    Instalace aplikace WIBE-SIDE
                  </h3>
                  <p className="text-xs text-slate-400">
                    Progresivní webová aplikace pro Královéhradecký kraj
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Zavřít"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm text-slate-300">
              {isIOS ? (
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2">
                  <p className="font-semibold text-white">Postup pro iPhone a iPad:</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    1. Klepněte na tlačítko Sdílet v dolní liště prohlížeče Safari.
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    2. Vyberte možnost Přidat na plochu a potvrďte.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2">
                  <p className="font-semibold text-white">Rychlé spuštění z plochy:</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    1. V liště prohlížeče klepněte na možnost Instalovat aplikaci.
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    2. Získáte offline mezipaměť mapy a celoobrazovkový režim.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Service Worker a mezipaměť jsou připraveny</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white transition-colors"
              >
                Rozumím, zavřít
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xl">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Režim offline — používají se uložená data regionu</span>
    </div>
  );
};
