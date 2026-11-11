import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { DAYS_OF_WEEK, TIME_SLOTS, sortTimeSlots } from '../data/defaultData';
import { DayOfWeek } from '../types';

interface ScheduleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleRequestModal: React.FC<ScheduleRequestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, members, scheduleSlots, addScheduleRequest } = useApp();

  // Daftar jam latihan tersusun rapi secara kronologis
  const availableTimeSlots = sortTimeSlots([
    ...TIME_SLOTS,
    ...(scheduleSlots || []).map((s) => s && s.timeRange).filter(Boolean) as string[],
  ]);

  const currentMember =
    currentUser.role === 'member'
      ? (members || []).find((m) => m && m.id === currentUser.memberId) || (members || [])[0]
      : (members || [])[0];

  const [selectedMemberId, setSelectedMemberId] = useState(
    currentMember?.id || (members || [])[0]?.id || ''
  );
  const [day, setDay] = useState<DayOfWeek>('Sabtu');
  const [timeRange, setTimeRange] = useState<string>('08:00 - 09:00');
  const [location, setLocation] = useState<string>('Kolam Renang Lestarindo');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  // Check if slot is OFF in matrix
  const existingSlot = (scheduleSlots || []).find((s) => s && s.day === day && s.timeRange === timeRange);
  const isSlotOff = existingSlot?.status === 'off';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSlotOff) {
      return;
    }

    const memberObj = (members || []).find((m) => m && m.id === selectedMemberId) || currentMember;

    addScheduleRequest({
      memberId: memberObj?.id,
      memberName: memberObj?.fullName || currentUser.name,
      whatsapp: memberObj?.whatsapp || '',
      day,
      timeRange,
      location,
      packageId: memberObj?.selectedPackageId,
    });

    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center-safe justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-cyan-100">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-cyan-200 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Fitur Khusus Member Terdaftar & Coach</span>
          </div>
          <h3 className="text-xl font-heading font-black text-white">
            Pengajuan Jadwal Latihan Renang
          </h3>
          <p className="text-xs text-cyan-100 mt-1">
            Silakan pilih waktu dan lokasi latihan yang diinginkan. Pengajuan akan divalidasi oleh Coach Dewi.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-5 text-slate-800">
              {/* Member Selector (if admin) or Fixed Member Info */}
              {currentUser.role === 'admin' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilih Member:
                  </label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white"
                  >
                    {(members || []).map((m) => {
                      if (!m || !m.id) return null;
                      return (
                        <option key={m.id} value={m.id}>
                          {m.fullName || 'Member'} ({m.id} - {m.currentLevel || 'Pemula'})
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block">Member Terdaftar:</span>
                    <strong className="text-cyan-950 font-bold text-sm">
                      {currentMember?.fullName || currentUser.name}
                    </strong>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-cyan-200/60 text-cyan-900 font-bold text-[11px]">
                    {currentMember?.id || 'MEMBER'}
                  </span>
                </div>
              )}

              {/* Form Section a: Jadwal & Lokasi */}
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Hari :</span>
                  </label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value as DayOfWeek)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Jam :</span>
                  </label>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    {availableTimeSlots.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Lokasi Latihan (Fitur Pilihan) :</span>
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="Kolam Renang Lestarindo">Kolam Renang Lestarindo</option>
                    <option value="Front One Boutique Adria Boyolali">
                      Front One Boutique Adria Boyolali
                    </option>
                  </select>
                </div>

                {/* Additional Fee Notice (khusus selain Kolam Renang Lestarindo) */}
                {location !== 'Kolam Renang Lestarindo' && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      *(Dikenakan biaya tambahan tiket masuk pelatih)*
                    </span>
                  </div>
                )}

                {/* Slot OFF Validation Warning */}
                {isSlotOff && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-800 flex items-start gap-2 animate-shake">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Slot Berstatus MERAH (OFF):</strong>
                      <span>
                        Admin/Pelatih sedang sibuk atau tidak bisa melatih pada <strong>{day}, {timeRange}</strong>. Member tidak dapat mengajukan jadwal pada hari dan jam ini. Silakan ganti jam/hari lain.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSlotOff}
                className={`w-full py-3.5 px-6 rounded-2xl font-heading font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                  isSlotOff
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white active:scale-95'
                }`}
              >
                <span>Kirim Pengajuan Jadwal</span>
              </button>
            </form>
          ) : (
            <div className="text-center py-6 space-y-4 text-slate-800">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-heading font-black text-xl text-slate-900">
                Pengajuan Terkirim!
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                Pengajuan jadwal untuk <strong>{day}, {timeRange}</strong> di <strong>{location}</strong> telah masuk ke antrean validasi Admin DS AQUATICS dengan status <strong>Pending</strong>.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    onClose();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
