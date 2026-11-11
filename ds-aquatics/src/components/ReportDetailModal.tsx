import React, { useState } from 'react';
import { X, Award, Clock, Calendar, User, MapPin, CheckCircle2, Printer, FileSpreadsheet } from 'lucide-react';
import { printSingleRapor } from '../utils/reportPrints';
import { exportSingleRaporXlsx } from '../utils/excelExport';
import { DsLogo } from './DsLogo';
import { MemberReport } from '../types';
import { useApp } from '../context/AppContext';

interface ReportDetailModalProps {
  isOpen: boolean;
  report: MemberReport | null;
  onClose: () => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  isOpen,
  report,
  onClose,
}) => {
  const { settings } = useApp();
  const [excelBusy, setExcelBusy] = useState(false);

  if (!isOpen || !report) return null;

  const handlePrint = () => {
    if (!printSingleRapor(report, settings)) alert('Jendela cetak diblokir browser. Izinkan pop-up untuk situs ini lalu coba lagi.');
  };
  const handleExcel = async () => {
    setExcelBusy(true);
    try {
      await exportSingleRaporXlsx(report, settings);
    } catch (err) {
      alert(`Gagal membuat Excel: ${(err as Error).message}`);
    } finally {
      setExcelBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center-safe justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-blue-950 text-white p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <DsLogo size={42} customLogoUrl={settings.logoUrl} showText={false} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                  Rapor Evaluasi & Kemajuan Renang
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
                  {report.period}
                </span>
              </div>
              <h3 className="text-xl font-heading font-black text-white">
                {report.memberName}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
          {/* Metadata Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">ID Siswa</span>
              <strong className="font-mono text-cyan-700">{report.memberId}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Tingkat / Level</span>
              <strong className="text-slate-900">{report.currentLevel}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Tanggal Evaluasi</span>
              <strong className="text-slate-900">{report.evaluationDate}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Pelatih Penilai</span>
              <strong className="text-slate-900">{report.coachName}</strong>
            </div>
          </div>

          {/* Nilai Rata-rata & Predikat */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200 gap-4">
            <div>
              <h4 className="font-heading font-black text-slate-900 text-base">
                Hasil Capaian Rapor Siswa
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Ringkasan Kehadiran: <strong>{report.attendanceSummary || '100%'}</strong>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Rata-rata Skor</span>
                <span className="text-2xl font-heading font-black text-cyan-900">{report.averageScore}</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-heading font-black text-xs shadow-sm">
                {report.overallPredicate}
              </div>
            </div>
          </div>

          {/* Kriteria Penilaian Table */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-600" />
              <span>Rincian Nilai Tiap Indikator & Catatan Waktu</span>
            </h4>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 font-heading font-bold text-slate-700 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Kriteria / Indikator</th>
                    <th className="py-3 px-3 text-center">Catatan Waktu</th>
                    <th className="py-3 px-3 text-center">Skor</th>
                    <th className="py-3 px-3 text-center">Predikat</th>
                    <th className="py-3 px-4">Catatan Pelatih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(report.grades || []).map((grade, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{grade.criterionName}</div>
                        <span className="text-[10px] text-slate-400 uppercase font-medium">{grade.category}</span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {grade.timeRecord && (grade.timeRecord.formatted || grade.timeRecord.hours !== undefined || grade.timeRecord.minutes !== undefined || grade.timeRecord.seconds !== undefined) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono font-bold text-[11px] bg-slate-100 text-slate-800 border border-slate-300">
                            <Clock className="w-3 h-3 text-cyan-600" />
                            <span>
                              {grade.timeRecord.formatted ||
                                `${String(grade.timeRecord.hours || 0).padStart(2, '0')}:${String(grade.timeRecord.minutes || 0).padStart(2, '0')}:${String(grade.timeRecord.seconds || 0).padStart(2, '0')}`}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-sm text-cyan-900 font-mono">
                        {grade.score}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            grade.score >= 88
                              ? 'bg-emerald-100 text-emerald-800'
                              : grade.score >= 75
                              ? 'bg-cyan-100 text-cyan-800'
                              : grade.score >= 60
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {grade.predicate}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {grade.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Catatan Evaluasi & Rekomendasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h5 className="font-heading font-bold text-xs text-slate-800 uppercase tracking-wide">
                Catatan Evaluasi Pelatih
              </h5>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {report.coachEvaluation || 'Siswa menunjukkan kemajuan teknik yang baik dan konsisten dalam setiap sesi.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 space-y-2">
              <h5 className="font-heading font-bold text-xs text-cyan-900 uppercase tracking-wide">
                Rekomendasi Pembelajaran Lanjutan
              </h5>
              <p className="text-xs text-cyan-950 leading-relaxed whitespace-pre-line">
                {report.recommendations || 'Tingkatkan daya tahan aerobik dan perhalus fase meluncur di dalam air.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-end gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-heading font-bold text-xs shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Cetak / Simpan PDF
          </button>
          <button
            onClick={handleExcel}
            disabled={excelBusy}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs shadow-sm inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" /> {excelBusy ? 'Membuat Excel…' : 'Ekspor ke Excel'}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-xs shadow-sm transition-all"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};
