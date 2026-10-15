import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Bell,
  Clock,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Zap,
  Timer,
  Check,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface AlarmCalendarTimePickerProps {
  selectedDayOffset: number; // 0 = today, 1 = tomorrow, 2 = day after tomorrow, etc.
  onChangeDayOffset: (offset: number) => void;
  alarmHour: number;
  onChangeAlarmHour: (hour: number) => void;
  alarmMinute: number;
  onChangeAlarmMinute: (minute: number) => void;
  durationHours: number;
  onChangeDurationHours: (hours: number) => void;
}

// Calculate the earliest permissible start time for today (at least ~5-15 min in the future, rounded to 5 min)
export function getMinimumAllowedTimeSlot(now = new Date()) {
  const target = new Date(now.getTime() + 5 * 60 * 1000);
  const minutes = target.getMinutes();
  const roundedM = Math.ceil(minutes / 5) * 5;
  if (roundedM >= 60) {
    target.setHours(target.getHours() + 1);
    target.setMinutes(0, 0, 0);
  } else {
    target.setMinutes(roundedM, 0, 0);
  }
  const isTodayFinished = target.getDate() !== now.getDate();
  return {
    minHour: target.getHours(),
    minMinute: target.getMinutes(),
    isTodayFinished,
    targetDate: target,
  };
}

export const AlarmCalendarTimePicker: React.FC<AlarmCalendarTimePickerProps> = ({
  selectedDayOffset,
  onChangeDayOffset,
  alarmHour,
  onChangeAlarmHour,
  alarmMinute,
  onChangeAlarmMinute,
  durationHours,
  onChangeDurationHours,
}) => {
  const [activeTab, setActiveTab] = useState<'alarm' | 'presets'>('alarm');
  const [showHourGrid, setShowHourGrid] = useState(false);

  // Time boundaries for today
  const { minHour, minMinute, isTodayFinished } = getMinimumAllowedTimeSlot();

  // Auto-adjust if selected day is today and time is currently in the past
  useEffect(() => {
    if (selectedDayOffset === 0) {
      if (isTodayFinished) {
        onChangeDayOffset(1);
        return;
      }
      if (alarmHour < minHour) {
        onChangeAlarmHour(minHour);
        onChangeAlarmMinute(minMinute);
      } else if (alarmHour === minHour && alarmMinute < minMinute) {
        onChangeAlarmMinute(minMinute);
      }
    }
  }, [selectedDayOffset, minHour, minMinute, isTodayFinished]);

  // Generate 7 days starting from today
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayNames = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
    const monthNames = [
      'led',
      'úno',
      'bře',
      'dub',
      'kvě',
      'čvn',
      'čvc',
      'srp',
      'zář',
      'říj',
      'lis',
      'pro',
    ];
    return {
      offset: i,
      dayName: i === 0 ? 'Dnes' : i === 1 ? 'Zítra' : dayNames[d.getDay()],
      dayNumber: d.getDate(),
      month: monthNames[d.getMonth()],
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    };
  });

  const getComputedStartTimeString = () => {
    const d = new Date();
    d.setDate(d.getDate() + selectedDayOffset);
    const dayLabel =
      selectedDayOffset === 0
        ? 'Dnes'
        : selectedDayOffset === 1
        ? 'Zítra'
        : `${days[selectedDayOffset]?.dayName || ''} ${d.getDate()}.${d.getMonth() + 1}.`;
    const hh = String(alarmHour).padStart(2, '0');
    const mm = String(alarmMinute).padStart(2, '0');
    return `${dayLabel} v ${hh}:${mm}`;
  };

  const getComputedEndTimeString = () => {
    const d = new Date();
    d.setDate(d.getDate() + selectedDayOffset);
    d.setHours(alarmHour, alarmMinute, 0, 0);
    const end = new Date(d.getTime() + durationHours * 3600 * 1000);
    const endDay =
      end.getDate() === d.getDate()
        ? 'stejný den'
        : `${end.getDate()}.${end.getMonth() + 1}.`;
    const hh = String(end.getHours()).padStart(2, '0');
    const mm = String(end.getMinutes()).padStart(2, '0');
    return `${hh}:${mm} (${endDay})`;
  };

  // Hour validation checks
  const canDecrementHour =
    selectedDayOffset > 0 ? true : alarmHour > minHour;
  const canIncrementHour =
    selectedDayOffset > 0 ? true : alarmHour < 23;

  const adjustHour = (delta: number) => {
    if (selectedDayOffset === 0) {
      const nextH = alarmHour + delta;
      if (nextH < minHour) return;
      if (nextH > 23) return;
      onChangeAlarmHour(nextH);
      if (nextH === minHour && alarmMinute < minMinute) {
        onChangeAlarmMinute(minMinute);
      }
    } else {
      onChangeAlarmHour((alarmHour + delta + 24) % 24);
    }
  };

  // Minute validation checks
  const canDecrementMinute =
    selectedDayOffset > 0
      ? true
      : alarmHour > minHour || (alarmHour === minHour && alarmMinute > minMinute);
  const canIncrementMinute =
    selectedDayOffset > 0
      ? true
      : alarmHour < 23 || alarmMinute < 55;

  const adjustMinute = (delta: number) => {
    if (selectedDayOffset === 0) {
      if (delta < 0) {
        if (alarmHour === minHour && alarmMinute <= minMinute) {
          return;
        }
        if (alarmMinute - 5 < 0) {
          if (alarmHour > minHour) {
            const nextH = alarmHour - 1;
            onChangeAlarmHour(nextH);
            if (nextH === minHour) {
              onChangeAlarmMinute(Math.max(minMinute, 55));
            } else {
              onChangeAlarmMinute(55);
            }
          }
        } else {
          const nextM = alarmMinute - 5;
          if (alarmHour === minHour && nextM < minMinute) {
            onChangeAlarmMinute(minMinute);
          } else {
            onChangeAlarmMinute(nextM);
          }
        }
      } else {
        // delta > 0
        if (alarmMinute + 5 >= 60) {
          if (alarmHour < 23) {
            onChangeAlarmHour(alarmHour + 1);
            onChangeAlarmMinute(0);
          }
        } else {
          onChangeAlarmMinute(alarmMinute + 5);
        }
      }
    } else {
      // Future days
      if (delta < 0) {
        if (alarmMinute - 5 < 0) {
          onChangeAlarmHour((alarmHour - 1 + 24) % 24);
          onChangeAlarmMinute(55);
        } else {
          onChangeAlarmMinute(alarmMinute - 5);
        }
      } else {
        if (alarmMinute + 5 >= 60) {
          onChangeAlarmHour((alarmHour + 1) % 24);
          onChangeAlarmMinute(0);
        } else {
          onChangeAlarmMinute(alarmMinute + 5);
        }
      }
    }
  };

  // Presets based on current actual time and future boundaries
  const now = new Date();

  const calculateOffsetPreset = (mins: number) => {
    const d = new Date(now.getTime() + mins * 60 * 1000);
    const roundedM = Math.ceil(d.getMinutes() / 5) * 5;
    if (roundedM >= 60) {
      d.setHours(d.getHours() + 1);
      d.setMinutes(0, 0, 0);
    } else {
      d.setMinutes(roundedM, 0, 0);
    }
    const isNextDay = d.getDate() !== now.getDate();
    return {
      h: d.getHours(),
      m: d.getMinutes(),
      offset: isNextDay ? 1 : 0,
    };
  };

  const isEveningPastToday = now.getHours() >= 18;
  const isLateNightPastToday = now.getHours() >= 20 && now.getMinutes() >= 30;

  const presets = [
    {
      label: `⏱️ Nejbližší možný (${String(minHour).padStart(2, '0')}:${String(minMinute).padStart(2, '0')})`,
      h: minHour,
      m: minMinute,
      offset: isTodayFinished ? 1 : 0,
    },
    {
      label: '⚡ Za 15 min',
      ...calculateOffsetPreset(15),
    },
    {
      label: '⚡ Za 30 min',
      ...calculateOffsetPreset(30),
    },
    {
      label: '⏳ Za 1 hodinu',
      ...calculateOffsetPreset(60),
    },
    {
      label: isEveningPastToday ? '☕ Zítra podvečer (18:00)' : '☕ Podvečer (18:00)',
      h: 18,
      m: 0,
      offset: isEveningPastToday ? 1 : 0,
    },
    {
      label: isLateNightPastToday ? '🌙 Zítra večer (20:30)' : '🌙 Večer (20:30)',
      h: 20,
      m: 30,
      offset: isLateNightPastToday ? 1 : 0,
    },
    {
      label: '🌅 Zítra odpoledne (15:00)',
      h: 15,
      m: 0,
      offset: 1,
    },
  ];

  const durationOptions = [
    { h: 1, label: '1 hod.' },
    { h: 2, label: '2 hod.' },
    { h: 3, label: '3 hod.' },
    { h: 4, label: '4 hod.' },
    { h: 6, label: '6 hod.' },
    { h: 12, label: '12 hod.' },
    { h: 24, label: '24 hod.' },
    { h: 48, label: '48 hod. (Max)' },
  ];

  return (
    <div className="rounded-2xl bg-[#090d16] border border-[#1e2d4a] p-4 sm:p-5 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e2d4a] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8fb7ff]/20 to-[#ffd9e8]/20 border border-[#8fb7ff]/40 flex items-center justify-center text-[#8fb7ff]">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <span>Čas v kalendáři a budíku</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#ffd9e8]/15 text-[#ffd9e8] border border-[#ffd9e8]/30">
                Budík srazu
              </span>
            </h3>
            <p className="text-[11px] text-[#a7c7e7]">
              Vyber den na liště a nastav čas začátku — čas v minulosti je chráněn a zablokován
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('alarm')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeTab === 'alarm'
                ? 'bg-[#8fb7ff] text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Budík
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeTab === 'presets'
                ? 'bg-[#ffd9e8] text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Předvolby
          </button>
        </div>
      </div>

      {/* 1. Interactive 7-Day Calendar Strip */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-[#8fb7ff]" />
            <span>1. Kalendář — Vyber den události</span>
          </span>
          <span className="text-[11px] text-[#8fb7ff] font-mono-tabular font-bold">
            {selectedDayOffset === 0
              ? 'Dnes'
              : selectedDayOffset === 1
              ? 'Zítra'
              : `Za ${selectedDayOffset} dny`}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 overflow-x-auto no-scrollbar py-1">
          {days.map((item) => {
            const isSelected = selectedDayOffset === item.offset;
            return (
              <button
                key={item.offset}
                type="button"
                onClick={() => onChangeDayOffset(item.offset)}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all border ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#8fb7ff] to-[#a7c7e7] text-slate-950 border-[#c9e8ff] shadow-lg shadow-[#8fb7ff]/25 scale-[1.02]'
                    : 'bg-[#0f172a] text-slate-300 border-[#1e2d4a] hover:border-slate-600 hover:bg-slate-900'
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-tight ${
                    isSelected
                      ? 'text-slate-950 font-black'
                      : item.isWeekend
                      ? 'text-[#ffd9e8]'
                      : 'text-slate-400'
                  }`}
                >
                  {item.dayName}
                </span>
                <span
                  className={`text-sm sm:text-base font-extrabold font-mono-tabular my-0.5 ${
                    isSelected ? 'text-slate-950' : 'text-white'
                  }`}
                >
                  {item.dayNumber}
                </span>
                <span
                  className={`text-[9px] ${
                    isSelected ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {item.month}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Alarm Clock Visual Face */}
      {activeTab === 'alarm' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#ffd9e8]" />
              <span>2. Digitální budík — Nastav přesnou hodinu a minutu</span>
            </span>
            <button
              type="button"
              onClick={() => setShowHourGrid((prev) => !prev)}
              className="text-[11px] text-[#ffd9e8] hover:underline font-semibold"
            >
              {showHourGrid ? 'Skrýt číselník' : 'Rychlý číselník'}
            </button>
          </div>

          {/* Alarm Digital Face */}
          <div className="rounded-2xl bg-[#06090e] border border-[#1e2d4a] p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            {/* Soft Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#8fb7ff]/5 via-transparent to-[#ffd9e8]/5 pointer-events-none" />

            <div className="flex items-center justify-center gap-3 sm:gap-5 z-10">
              {/* Hours Controller */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  disabled={!canIncrementHour}
                  onClick={() => adjustHour(1)}
                  className={`w-12 h-8 rounded-xl flex items-center justify-center border transition-all ${
                    canIncrementHour
                      ? 'bg-slate-900 hover:bg-[#8fb7ff]/20 text-[#c9e8ff] border-slate-800 active:scale-95'
                      : 'bg-slate-950 text-slate-700 border-slate-900 opacity-30 cursor-not-allowed'
                  }`}
                  title={canIncrementHour ? '+1 hodina' : 'Maximální hodina dne'}
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <div
                  onClick={() => setShowHourGrid(true)}
                  className="w-20 sm:w-24 h-16 sm:h-20 rounded-2xl bg-slate-950 border-2 border-[#8fb7ff]/60 flex items-center justify-center text-3xl sm:text-4xl font-black text-[#c9e8ff] font-mono-tabular shadow-2xl my-2 cursor-pointer hover:border-[#c9e8ff] transition-all"
                  title="Klikni pro výběr hodiny"
                >
                  {String(alarmHour).padStart(2, '0')}
                </div>
                <button
                  type="button"
                  disabled={!canDecrementHour}
                  onClick={() => adjustHour(-1)}
                  className={`w-12 h-8 rounded-xl flex items-center justify-center border transition-all ${
                    canDecrementHour
                      ? 'bg-slate-900 hover:bg-[#8fb7ff]/20 text-[#c9e8ff] border-slate-800 active:scale-95'
                      : 'bg-slate-950 text-slate-700 border-slate-900 opacity-30 cursor-not-allowed'
                  }`}
                  title={canDecrementHour ? '-1 hodina' : 'Nelze vybrat minulou hodinu pro dnešní den'}
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
                <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                  Hodin
                </span>
              </div>

              {/* Pulsing Colon */}
              <div className="text-4xl sm:text-5xl font-black text-[#8fb7ff] animate-pulse pb-6 select-none">
                :
              </div>

              {/* Minutes Controller */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  disabled={!canIncrementMinute}
                  onClick={() => adjustMinute(5)}
                  className={`w-12 h-8 rounded-xl flex items-center justify-center border transition-all ${
                    canIncrementMinute
                      ? 'bg-slate-900 hover:bg-[#ffd9e8]/20 text-[#ffd9e8] border-slate-800 active:scale-95'
                      : 'bg-slate-950 text-slate-700 border-slate-900 opacity-30 cursor-not-allowed'
                  }`}
                  title={canIncrementMinute ? '+5 minut' : 'Konec dne'}
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <div
                  className="w-20 sm:w-24 h-16 sm:h-20 rounded-2xl bg-slate-950 border-2 border-[#ffd9e8]/60 flex items-center justify-center text-3xl sm:text-4xl font-black text-[#ffd9e8] font-mono-tabular shadow-2xl my-2"
                >
                  {String(alarmMinute).padStart(2, '0')}
                </div>
                <button
                  type="button"
                  disabled={!canDecrementMinute}
                  onClick={() => adjustMinute(-5)}
                  className={`w-12 h-8 rounded-xl flex items-center justify-center border transition-all ${
                    canDecrementMinute
                      ? 'bg-slate-900 hover:bg-[#ffd9e8]/20 text-[#ffd9e8] border-slate-800 active:scale-95'
                      : 'bg-slate-950 text-slate-700 border-slate-900 opacity-30 cursor-not-allowed'
                  }`}
                  title={canDecrementMinute ? '-5 minut' : 'Nelze vybrat minulý čas pro dnešní den'}
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
                <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                  Minut
                </span>
              </div>
            </div>

            {/* Quick minute buttons */}
            <div className="flex items-center gap-1.5 mt-3 z-10 flex-wrap justify-center">
              {[0, 15, 30, 45].map((m) => {
                const isPast =
                  selectedDayOffset === 0 &&
                  (alarmHour < minHour || (alarmHour === minHour && m < minMinute));
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={isPast}
                    onClick={() => {
                      if (!isPast) onChangeAlarmMinute(m);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-mono-tabular font-bold transition-all border ${
                      isPast
                        ? 'bg-slate-950/40 text-slate-600 border-slate-900 cursor-not-allowed opacity-30 line-through'
                        : alarmMinute === m
                        ? 'bg-[#ffd9e8] text-slate-950 border-white shadow-sm'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600'
                    }`}
                    title={isPast ? 'Minulá minuta (nelze vybrat dnes)' : undefined}
                  >
                    :{String(m).padStart(2, '0')}
                  </button>
                );
              })}
            </div>

            {/* Past time prevention notice banner for Today */}
            {selectedDayOffset === 0 && (
              <div className="mt-3.5 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-[11px] text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  Ochrana času: nejbližší volný čas dnes je{' '}
                  <strong className="text-emerald-300 font-mono-tabular font-bold">
                    {String(minHour).padStart(2, '0')}:{String(minMinute).padStart(2, '0')}
                  </strong>
                </span>
              </div>
            )}

            {/* Tappable 24-hour Grid popup */}
            {showHourGrid && (
              <div className="w-full mt-4 pt-3 border-t border-slate-800/80 z-10">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center mb-2">
                  Klepni na požadovanou hodinu (00 – 23):
                </p>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
                  {Array.from({ length: 24 }, (_, h) => {
                    const isPast = selectedDayOffset === 0 && h < minHour;
                    return (
                      <button
                        key={h}
                        type="button"
                        disabled={isPast}
                        onClick={() => {
                          if (!isPast) {
                            onChangeAlarmHour(h);
                            if (selectedDayOffset === 0 && h === minHour && alarmMinute < minMinute) {
                              onChangeAlarmMinute(minMinute);
                            }
                            setShowHourGrid(false);
                          }
                        }}
                        className={`py-1.5 rounded-lg text-xs font-mono-tabular font-bold border transition-colors ${
                          isPast
                            ? 'bg-slate-950/40 text-slate-600 border-slate-900 cursor-not-allowed opacity-30 line-through'
                            : alarmHour === h
                            ? 'bg-[#8fb7ff] text-slate-950 border-white shadow-md'
                            : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
                        }`}
                        title={isPast ? 'Tato hodina už dnes proběhla (nelze vybrat)' : undefined}
                      >
                        {String(h).padStart(2, '0')}h
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Presets Tab */
        <div className="space-y-2">
          <p className="text-xs text-slate-400">
            Vyber si z oblíbených časů setkání jedním klepnutím (pouze budoucí časy):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onChangeDayOffset(p.offset);
                  onChangeAlarmHour(p.h);
                  onChangeAlarmMinute(p.m);
                  setActiveTab('alarm');
                }}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-[#8fb7ff] text-left transition-all group"
              >
                <span className="text-xs font-bold text-white group-hover:text-[#8fb7ff] block">
                  {p.label}
                </span>
                <span className="text-[11px] text-slate-400 font-mono-tabular">
                  {String(p.h).padStart(2, '0')}:{String(p.m).padStart(2, '0')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Duration Selector (1h to 48h) & Real Auto-Expiration */}
      <div className="space-y-2 pt-2 border-t border-[#1e2d4a]">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-emerald-400" />
            <span>3. Doba trvání akce (Automatické vypršení)</span>
          </span>
          <span className="text-[11px] font-bold text-emerald-400 font-mono-tabular">
            Trvá {durationHours} hod.
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {durationOptions.map((opt) => {
            const active = durationHours === opt.h;
            return (
              <button
                key={opt.h}
                type="button"
                onClick={() => onChangeDurationHours(opt.h)}
                className={`py-2 rounded-xl text-xs font-bold font-mono-tabular border transition-all ${
                  active
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 font-black'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Live Calculation & Auto-Expiration Confirmation Box */}
      <div className="p-3.5 rounded-xl bg-[#0f172a] border border-[#1e2d4a] space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#c9e8ff] flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-[#8fb7ff]" />
            Začátek akce (budík):
          </span>
          <strong className="text-white font-mono-tabular text-sm">
            {getComputedStartTimeString()}
          </strong>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-bold text-amber-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Konec a reálné zmizení:
          </span>
          <strong className="text-amber-300 font-mono-tabular">
            {getComputedEndTimeString()}
          </strong>
        </div>

        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Reálné mizení z mapy:</strong> Jakmile nastane čas konce, událost automaticky zmizí z mapy a ze seznamu aktivit. Žádné staré a neaktuální akce nezůstávají!
          </span>
        </div>
      </div>
    </div>
  );
};
