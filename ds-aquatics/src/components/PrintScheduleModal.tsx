import React from 'react';
import { useApp } from '../context/AppContext';
import { printElement } from '../utils/printHtml';
import { X, Printer, Download, Sparkles, MapPin, Phone } from 'lucide-react';
import { DsLogo } from './DsLogo';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../data/defaultData';
import { DayOfWeek } from '../types';

interface PrintScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintScheduleModal: React.FC<PrintScheduleModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { settings, scheduleSlots } = useApp();

  if (!isOpen) return null;

  const handlePrint = () => {
    if (!printElement(document.getElementById('print-schedule-doc'), 'Jadwal Latihan Mingguan', 'landscape'))
      alert('Jendela cetak diblokir browser. Izinkan pop-up untuk situs ini lalu coba lagi.');
  };

  // Dynamically include any custom time slots added manually by coach
  const allTimeSlots = Array.from(
    new Set([...TIME_SLOTS, ...scheduleSlots.map((s) => s.timeRange)])
  );

  const getSlot = (day: DayOfWeek, timeRange: string) => {
    return scheduleSlots.find((s) => s.day === day && s.timeRange === timeRange);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center-safe justify-center p-2 sm:p-4 print:p-0 print:bg-white print-schedule-target">
      <div className="relative w-full max-w-[1100px] bg-white rounded-3xl shadow-2xl overflow-hidden print:rounded-none print:shadow-none print:border-0 my-4 flex flex-col max-h-[96vh] print:max-h-none print:overflow-visible">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-cyan-400" />
            <span className="font-heading font-bold text-sm sm:text-base">
              Pratinjau Cetak / Ekspor PDF Jadwal (A4 Landscape)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              id="btn-trigger-print-schedule"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area - Formatted specifically for A4 Landscape */}
        <div id="print-schedule-doc" className="printable-area printable-document p-6 sm:p-8 overflow-y-auto print:overflow-visible bg-white text-slate-900 text-[11px] leading-tight">
          {/* Document Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <DsLogo size={60} customLogoUrl={settings.logoUrl} showText={false} />
              <div>
                <h1 className="font-heading font-black text-2xl tracking-tight text-slate-950 leading-none">
                  {settings.clubName}
                </h1>
                <p className="text-xs font-bold text-cyan-700 tracking-wide mt-0.5">
                  {settings.slogan}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Lokasi Latihan: {settings.lestarindoName} & {settings.frontOneName}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 rounded-md bg-slate-100 font-heading font-black text-xs text-slate-800 uppercase tracking-wider border border-slate-300">
                MATRIKS JADWAL LATIHAN RESMI
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                Dicetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
              </p>
              <p className="text-[10px] text-cyan-700 font-bold">
                WhatsApp: {settings.phoneWa}
              </p>
            </div>
          </div>

          {/* Color Indicators Legend for the Print Document */}
          <div className="flex items-center justify-between p-2 mb-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px]">
            <div className="flex items-center gap-4">
              <span className="font-bold text-slate-700">Keterangan Warna Notifikasi:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 border border-emerald-600 inline-block" />
                <span className="font-bold text-emerald-800">HIJAU = Hadir / Telah Absen</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-slate-100 border border-slate-300 inline-block" />
                <span className="text-slate-600">PUTIH / NETRAL = Belum Absen / Terjadwal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-rose-500 border border-rose-600 inline-block" />
                <span className="font-bold text-rose-800">MERAH = OFF / Pelatih Sibuk (Tidak Ada Latihan)</span>
              </div>
            </div>
            <span className="text-slate-500 italic">Pelatih: Coach Dewi Setyaningsih</span>
          </div>

          {/* Printable Matrix Table */}
          <div className="border border-slate-400 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white font-heading font-black text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-2 text-center w-28 border-r border-slate-600">
                    WAKTU
                  </th>
                  {DAYS_OF_WEEK.map((d) => (
                    <th key={d} className="py-2.5 px-2 text-center border-r border-slate-600 last:border-r-0">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {allTimeSlots.map((time) => (
                  <tr key={time} className="border-b border-slate-300">
                    <td className="py-2 px-2 text-center font-mono font-bold text-slate-800 bg-slate-100 border-r border-slate-300">
                      {time}
                    </td>

                    {DAYS_OF_WEEK.map((day) => {
                      const slot = getSlot(day, time);
                      const isOff = slot?.status === 'off';
                      const isHadir = slot?.status === 'hadir';

                      return (
                        <td
                          key={`${day}-${time}`}
                          className={`py-1.5 px-2 border-r border-slate-300 last:border-r-0 align-top ${
                            isOff
                              ? 'bg-rose-100 text-rose-900'
                              : isHadir
                              ? 'bg-emerald-100 text-emerald-950 font-medium'
                              : slot && slot.participants.length > 0
                              ? 'bg-white text-slate-800'
                              : 'bg-slate-50/50 text-slate-400'
                          }`}
                        >
                          {slot ? (
                            <div className="flex flex-col justify-between min-h-[46px]">
                              <div className="flex items-center justify-between text-[9px] mb-0.5">
                                <span className="font-semibold text-slate-500">
                                  {slot.coach}
                                </span>
                                {isHadir && (
                                  <span className="px-1 py-0.2 rounded-xs bg-emerald-600 text-white text-[8px] font-bold">
                                    HADIR
                                  </span>
                                )}
                                {isOff && (
                                  <span className="px-1 py-0.2 rounded-xs bg-rose-600 text-white text-[8px] font-bold">
                                    OFF
                                  </span>
                                )}
                              </div>

                              <div className="text-[10px] leading-tight font-medium">
                                {isOff ? (
                                  <span className="font-bold text-rose-700 italic">OFF</span>
                                ) : (
                                  <div>
                                    {slot.isGroup && (
                                      <span className="text-amber-700 font-bold block text-[8px]">
                                        (GROUP)
                                      </span>
                                    )}
                                    <span>{slot.participants.join(', ')}</span>
                                  </div>
                                )}
                              </div>

                              {slot.location && !isOff && (
                                <span className="text-[8px] text-slate-500 truncate block mt-0.5">
                                  {slot.location.replace('Kolam Renang ', '')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="min-h-[46px] flex items-center justify-center text-slate-300">
                              -
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

          {/* Document Signoff Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-end justify-between">
            <div className="space-y-1 text-[10px] text-slate-600">
              <p className="font-semibold text-slate-800">Catatan Penting:</p>
              <p>• Harap hadir 10 menit sebelum jam sesi latihan dimulai untuk pemanasan.</p>
              <p>• Jadwal berstatus MERAH merupakan hari libur/off pelatih dan tidak diadakan sesi.</p>
              <p>• Notifikasi warna hijau menandakan kehadiran resmi member.</p>
            </div>

            <div className="text-center w-52">
              <p className="text-[10px] text-slate-600 mb-10">
                Boyolali, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
                <br />
                <strong>Kepala Pelatih DS AQUATICS</strong>
              </p>
              <p className="font-heading font-black text-xs text-slate-900 border-t border-slate-900 pt-1">
                Dewi Setyaningsih
              </p>
              <span className="text-[9px] text-slate-500">Pelatih Renang Bersertifikat</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
