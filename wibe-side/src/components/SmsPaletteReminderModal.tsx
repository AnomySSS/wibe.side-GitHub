import React, { useState } from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  Phone,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Palette,
  Heart,
  Send,
} from 'lucide-react';
import { MeetupEvent, CATEGORY_MAP, WIBE_PALETTE } from '../types';
import { CategoryIcon } from './InteractiveRegionMap';

interface SmsPaletteReminderModalProps {
  event: MeetupEvent;
  onClose: () => void;
  onConfirmPhone: (phone: string) => void;
  defaultPhone?: string;
}

export const SmsPaletteReminderModal: React.FC<SmsPaletteReminderModalProps> = ({
  event,
  onClose,
  onConfirmPhone,
  defaultPhone = '+420 732 418 902',
}) => {
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
  const [isSaved, setIsSaved] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const categoryMeta = CATEGORY_MAP[event.category];

  // The 5 colors from user's uploaded image palette
  const userPalette = [
    { hex: '#c9e8ff', name: 'Pastel Sky', textDark: true },
    { hex: '#f6fbff', name: 'Ice White', textDark: true },
    { hex: '#a7c7e7', name: 'Steel Blue', textDark: true },
    { hex: '#ffd9e8', name: 'Sakura Pink', textDark: true },
    { hex: '#8fb7ff', name: 'Periwinkle', textDark: true },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmPhone(phoneNumber);
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleSendTestSms = () => {
    setTestSent(true);
    setTimeout(() => {
      setTestSent(false);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg rounded-3xl bg-[#090d16] border border-[#1e2d4a] shadow-2xl overflow-hidden flex flex-col">
        {/* Exact User Color Palette 5-Band Strip at Top */}
        <div className="grid grid-cols-5 h-5 w-full">
          {userPalette.map((p, idx) => (
            <div
              key={idx}
              className="h-full relative group transition-transform"
              style={{ backgroundColor: p.hex }}
              title={p.hex}
            />
          ))}
        </div>

        {/* Modal Header in Teen Minimalist Dark Mode */}
        <div className="relative p-5 bg-[#0f172a] border-b border-[#1e2d4a] text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#8fb7ff]/20 to-[#ffd9e8]/20 border border-[#c9e8ff]/30 flex items-center justify-center text-[#c9e8ff] shadow-md">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase bg-[#1e2d4a] px-2 py-0.5 rounded-full text-[#c9e8ff] border border-[#8fb7ff]/30">
                    Paleta WIBE-SIDE
                  </span>
                  <span className="text-[10px] font-mono-tabular text-[#ffd9e8]">
                    Dark Mode
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-white font-display mt-0.5 tracking-tight">
                  SMS připomínka 30 min předem
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center transition-colors border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Color Palette Visual Swatches Preview with HEX codes */}
          <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
            {userPalette.map((p, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center gap-1 p-1 rounded-lg bg-slate-950/60 border border-slate-800 shrink-0"
              >
                <div
                  className="w-6 h-4 rounded-md shadow-sm border border-white/20"
                  style={{ backgroundColor: p.hex }}
                />
                <span className="text-[9px] font-mono-tabular text-slate-400 font-semibold">
                  {p.hex}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[72vh] bg-[#090d16]">
          {/* Status Alert */}
          <div className="p-3.5 rounded-2xl bg-[#131e33] border border-[#8fb7ff]/30 flex items-start gap-3">
            <Bell className="w-5 h-5 text-[#8fb7ff] shrink-0 mt-0.5 animate-bounce" />
            <div className="text-xs text-slate-200 leading-relaxed">
              <p className="font-bold text-white flex items-center gap-1.5">
                <span>Tato akce ještě není aktivní</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ffd9e8]/20 text-[#ffd9e8] border border-[#ffd9e8]/30">
                  {event.startTime}
                </span>
              </p>
              <p className="mt-1 text-[11px] text-[#a7c7e7]">
                Označili jste ji lajkem — pošleme vám bezplatnou SMS přesně <strong>30 minut před začátkem</strong>, abyste nezmeškali sraz!
              </p>
            </div>
          </div>

          {/* Event Details Card */}
          <div className="p-3.5 rounded-2xl bg-[#0f172a] border border-[#1e2d4a] space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-[#c9e8ff] border border-[#c9e8ff]/20 text-xs font-semibold flex items-center gap-1.5">
                <CategoryIcon category={event.category} className="w-3.5 h-3.5 text-[#8fb7ff]" />
                {categoryMeta.name}
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-300 font-medium">{event.city}</span>
            </div>
            <h4 className="text-sm font-bold text-white font-display">
              {event.title}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1 border-t border-slate-800/60">
              <div className="flex items-center gap-1.5 text-[#8fb7ff]">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Začátek: {event.startTime}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 truncate">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-[#ffd9e8]" />
                <span className="truncate">{event.address}</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Telefonní číslo pro doručení SMS:</span>
                <span className="text-[10px] text-[#a7c7e7]">Zdarma</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Phone className="w-4 h-4 text-[#8fb7ff]" />
                </div>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+420 732 418 902"
                  className="w-full h-11 rounded-xl bg-slate-950 border border-[#1e2d4a] pl-10 pr-4 text-sm text-white font-mono-tabular placeholder:text-slate-500 focus:outline-none focus:border-[#8fb7ff]"
                />
              </div>
            </div>

            {/* Simulated SMS Preview Bubble */}
            <div className="rounded-2xl bg-[#0f172a] border border-[#1e2d4a] p-3 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-[#c9e8ff]">Náhled SMS v mobilu:</span>
                <span className="text-[10px] text-[#ffd9e8] font-mono-tabular">Přijde: 30 min předem</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 text-xs text-slate-200 border border-slate-800 font-mono-tabular leading-relaxed">
                „[WIBE-SIDE 🔔] Ahoj! Za 30 minut začíná sraz {event.title} na adrese {event.address}. Těšíme se na tebe!“
              </div>
            </div>

            {testSent && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-semibold text-emerald-300 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Simulovaná testovací SMS byla odeslána na {phoneNumber}.</span>
              </div>
            )}

            {isSaved && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-semibold text-emerald-300 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>SMS připomínka uložena. Okno se zavírá...</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleSendTestSms}
                className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-[#ffd9e8]" />
                <span>Testovat SMS</span>
              </button>

              <button
                type="submit"
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#8fb7ff] to-[#a7c7e7] hover:from-[#c9e8ff] hover:to-[#8fb7ff] text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#8fb7ff]/20 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Uložit připomínku</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
