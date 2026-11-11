import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  Lock,
  Sparkles,
  Info,
  MapPin,
  Clock,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { DAYS_OF_WEEK, TIME_SLOTS, sortTimeSlots } from '../data/defaultData';
import { ScheduleSlot, DayOfWeek } from '../types';

interface ScheduleSectionProps {
  onOpenScheduleRequest: () => void;
  onPromptAuthRequired: () => void;
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  onOpenScheduleRequest,
  onPromptAuthRequired,
}) => {
  const { scheduleSlots, currentUser } = useApp();
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [publicLocationFilter, setPublicLocationFilter] = useState<'all' | string>('all');

  const isAuthorized = currentUser.role === 'member' || currentUser.role === 'admin';

  // Urutkan slot waktu secara kronologis dan logis (Pagi -> Sore -> Sesi Prestasi)
  // Halaman publik hanya menampilkan jam yang benar-benar punya jadwal
  const usedTimes = (scheduleSlots || []).map((s) => s && s.timeRange).filter(Boolean) as string[];
  const allTimeSlots = sortTimeSlots(usedTimes.length ? Array.from(new Set(usedTimes)) : [...TIME_SLOTS]);

  const handleRequestClick = () => {
    if (isAuthorized) {
      onOpenScheduleRequest();
    } else {
      onPromptAuthRequired();
    }
  };

  const normalizeLocationName = (loc?: string): string => {
    if (!loc) return '';
    const l = loc.toLowerCase().trim();
    if (l.includes('front') || l.includes('adria')) return 'Front One Boutique Adria';
    if (l.includes('lestarindo')) return 'Kolam Renang Lestarindo';
    return loc.trim();
  };

  const matchLocationFilter = (slotLocation: string | undefined, filter: string): boolean => {
    if (!filter || filter === 'all') return true;
    const normSlot = normalizeLocationName(slotLocation);
    const normFilter = normalizeLocationName(filter);
    return normSlot.toLowerCase().includes(normFilter.toLowerCase()) || normFilter.toLowerCase().includes(normSlot.toLowerCase());
  };

  const getSlotsForCell = (day: DayOfWeek, timeRange: string, filterLocation: string = 'all'): ScheduleSlot[] => {
    return (scheduleSlots || []).filter((s) => {
      if (!s || s.day !== day || s.timeRange !== timeRange) return false;
      if (filterLocation === 'all') return true;
      return matchLocationFilter(s.location, filterLocation);
    });
  };

  return (
    <section className="py-16 lg:py-24 bg-slate-900 text-white relative overflow-hidden" id="jadwal-section">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 mb-3">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Matriks Jadwal Latihan Mingguan</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-white tracking-tight">
              Jadwal Sesi Renang DS AQUATICS
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Jadwal terstruktur mingguan di Kolam Renang Lestarindo & Front One Boutique Adria Boyolali.
            </p>
          </div>

          {/* Action Buttons: Pengajuan Jadwal */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Locked/Unlocked Pengajuan Button */}
            <button
              onClick={handleRequestClick}
              id="schedule-btn-pengajuan"
              className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-heading font-bold text-sm transition-all shadow-md active:scale-95 ${
                isAuthorized
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-amber-400/40'
              }`}
            >
              {isAuthorized ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Pengajuan Jadwal Latihan</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Pengajuan Jadwal Latihan (Terkunci)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Legend & Filter Lokasi Bar */}
        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          {/* Filter Lokasi Kolam */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5 mr-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              Lokasi Kolam:
            </span>

            <button
              type="button"
              onClick={() => setPublicLocationFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                publicLocationFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <span>Semua Lokasi</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-current">
                {scheduleSlots.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPublicLocationFilter('Kolam Renang Lestarindo')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                publicLocationFilter === 'Kolam Renang Lestarindo'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <span>Kolam Renang Lestarindo</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-current">
                {(scheduleSlots || []).filter((s) => s && matchLocationFilter(s.location, 'Lestarindo')).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPublicLocationFilter('Front One Boutique Adria')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                publicLocationFilter === 'Front One Boutique Adria'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <span>Front One Boutique Adria</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-current">
                {(scheduleSlots || []).filter((s) => s && matchLocationFilter(s.location, 'Front One')).length}
              </span>
            </button>
          </div>

          {/* Status Indicators */}
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 border border-emerald-400 inline-block shadow-xs shadow-emerald-500/50" />
              <span className="text-emerald-300 font-medium">Hadir</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-slate-700/80 border border-slate-600 inline-block" />
              <span className="text-slate-300">Netral</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-rose-600 border border-rose-500 inline-block shadow-xs shadow-rose-600/50" />
              <span className="text-rose-300 font-medium">OFF</span>
            </div>
          </div>
        </div>

        {/* Mobile Swipe Hint for Smartphone / Tablet */}
        <div className="flex items-center justify-between text-xs text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 rounded-xl px-3 py-2 mb-3 lg:hidden">
          <span className="flex items-center gap-1.5 font-medium">
            <span>👉</span>
            <span>Geser tabel ke samping untuk melihat jadwal hari lainnya (Senin s.d Minggu)</span>
          </span>
        </div>

        {/* Matrix Table Matching 2026-09-21_092142.png */}
        <div className="rounded-2xl border border-slate-700/80 bg-slate-950/60 shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-cyan-700 scrollbar-track-slate-900">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider font-heading">
                  <th className="py-4 px-4 text-center w-36 bg-slate-900/90 sticky left-0 z-10 border-r border-slate-800">
                    WAKTU
                  </th>
                  {DAYS_OF_WEEK.map((day) => (
                    <th key={day} className="py-4 px-3 text-center border-r border-slate-800/80 last:border-r-0">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {allTimeSlots.map((time) => (
                  <tr key={time} className="hover:bg-slate-900/40 transition-colors">
                    {/* Time Slot Column */}
                    <td className="py-3 px-3 text-center font-mono font-semibold text-cyan-300 bg-slate-900/90 sticky left-0 z-10 border-r border-slate-800 align-middle">
                      {time}
                    </td>

                    {/* Day Columns */}
                    {DAYS_OF_WEEK.map((day) => {
                      const slots = getSlotsForCell(day, time, publicLocationFilter);

                      return (
                        <td
                          key={`${day}-${time}`}
                          className="py-2 px-2 border-r border-slate-800/80 last:border-r-0 align-top"
                        >
                          {slots.length === 0 ? (
                            <div className="min-h-[58px] flex items-center justify-center text-slate-700">
                              -
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              {slots.map((slot) => {
                                const isOff = slot.status === 'off';
                                const isHadir = slot.status === 'hadir';
                                const isLestarindo = normalizeLocationName(slot.location).includes('Lestarindo');

                                return (
                                  <div
                                    key={slot.id}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`p-2 rounded-xl border text-[11px] transition-all cursor-pointer hover:scale-[1.02] ${
                                      isOff
                                        ? 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-800/50 text-rose-200'
                                        : isHadir
                                        ? 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-800/50 text-emerald-200'
                                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className="text-[10px] font-semibold text-slate-400 truncate">
                                        {slot.coach}
                                      </span>
                                      {isHadir && (
                                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                          Hadir
                                        </span>
                                      )}
                                      {isOff && (
                                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-600/30 text-rose-300 border border-rose-500/40">
                                          OFF
                                        </span>
                                      )}
                                    </div>

                                    <div className="text-[11px] font-medium leading-snug mb-1">
                                      {isOff ? (
                                        <span className="text-rose-400/90 italic font-mono text-[10px]">OFF</span>
                                      ) : (
                                        <div>
                                          {slot.isGroup && (
                                            <span className="text-amber-400 font-bold block text-[9px]">
                                              (GROUP PRESTASI)
                                            </span>
                                          )}
                                          <span className="line-clamp-2 text-slate-200">
                                            {Array.isArray(slot.participants) && slot.participants.length > 0
                                              ? slot.participants.join(', ')
                                              : '(Belum ada peserta)'}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {slot.location && !isOff && (
                                      <div className="pt-1 border-t border-white/5 flex items-center justify-between">
                                        <span
                                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                            isLestarindo
                                              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/50'
                                              : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/50'
                                          }`}
                                        >
                                          📍 {slot.location.replace('Kolam Renang ', '').replace(' Boutique Adria Boyolali', '')}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slot Detail Modal if user clicks on a table cell */}
        {selectedSlot && (
          <div className="fixed inset-0 overflow-y-auto z-50 flex items-center-safe justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="bg-slate-900 rounded-3xl border border-slate-700 p-6 max-w-md w-full shadow-2xl text-white space-y-4">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Detail Sesi Latihan
                  </span>
                  <h3 className="text-xl font-heading font-black text-white mt-1">
                    {selectedSlot.day}, {selectedSlot.timeRange}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Pelatih:</span>
                  <span className="font-semibold text-white">{selectedSlot.coach}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Status Sesi:</span>
                  {selectedSlot.status === 'hadir' ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      Hadir (Telah Absen)
                    </span>
                  ) : selectedSlot.status === 'off' ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      OFF (Admin Sibuk / Tidak Melatih)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      Terjadwal (Belum Absen)
                    </span>
                  )}
                </div>

                <div className="py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 block mb-1">Peserta Terdaftar:</span>
                  <div className="font-medium text-cyan-200">
                    {Array.isArray(selectedSlot.participants) && selectedSlot.participants.length > 0
                      ? selectedSlot.participants.join(', ')
                      : 'Belum ada peserta'}
                  </div>
                </div>

                {selectedSlot.location && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">Lokasi:</span>
                    <span className="font-semibold text-slate-200 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      {selectedSlot.location}
                    </span>
                  </div>
                )}
              </div>

              {selectedSlot.status === 'off' && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Slot waktu ini sedang <strong>OFF</strong>. Member tidak dapat mengajukan sesi latihan pada hari dan jam ini.
                  </span>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                {isAuthorized && selectedSlot.status !== 'off' && (
                  <button
                    onClick={() => {
                      setSelectedSlot(null);
                      onOpenScheduleRequest();
                    }}
                    className="flex-1 py-2.5 rounded-xl font-heading font-bold text-sm text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                  >
                    Ajukan di Slot Ini
                  </button>
                )}
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
