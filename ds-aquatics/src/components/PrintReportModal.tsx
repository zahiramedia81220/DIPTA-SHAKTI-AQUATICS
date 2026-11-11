import React from 'react';
import { useApp } from '../context/AppContext';
import { printElement } from '../utils/printHtml';
import { X, Printer, Award, Sparkles, CheckCircle2, User, Calendar, MapPin } from 'lucide-react';
import { DsLogo } from './DsLogo';
import { MemberReport } from '../types';

interface PrintReportModalProps {
  isOpen: boolean;
  report: MemberReport | null;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  report,
  onClose,
}) => {
  const { settings } = useApp();

  if (!isOpen || !report) return null;

  const handlePrint = () => {
    if (!printElement(document.getElementById('print-rapor-doc'), `Rapor ${report.memberName}`, 'portrait'))
      alert('Jendela cetak diblokir browser. Izinkan pop-up untuk situs ini lalu coba lagi.');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center-safe justify-center p-2 sm:p-4 print:p-0 print:bg-white print-rapor-target">
      <div className="relative w-full max-w-[850px] bg-white rounded-3xl shadow-2xl overflow-hidden print:rounded-none print:shadow-none print:border-0 my-4 flex flex-col max-h-[96vh] print:max-h-none print:overflow-visible">
        {/* Toolbar (hidden on print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-heading font-bold text-sm sm:text-base">
              Pratinjau Cetak / PDF Rapor Ujian Renang (A4 Portrait)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              id="btn-trigger-print-report"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
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

        {/* Printable Area - Formatted for A4 Portrait */}
        <div id="print-rapor-doc" className="printable-area printable-document p-8 sm:p-10 overflow-y-auto print:overflow-visible bg-white text-slate-900 text-[12px] leading-relaxed">
          {/* Kop Surat Resmi */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-5">
            <div className="flex items-center gap-4">
              <DsLogo size={65} customLogoUrl={settings.logoUrl} showText={false} />
              <div>
                <h1 className="font-heading font-black text-2xl tracking-tight text-slate-950 leading-none">
                  {settings.clubName}
                </h1>
                <p className="text-xs font-bold text-cyan-700 tracking-wide mt-1 uppercase">
                  LEMBAGA PELATIHAN RENANG PROFESIONAL BOYOLALI
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Home Base: {settings.lestarindoName} & {settings.frontOneName}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1.5 rounded-lg bg-slate-900 font-heading font-black text-xs text-white uppercase tracking-wider">
                RAPOR UJIAN & EVALUASI
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                No. Rapor: {report.id}
              </p>
              <p className="text-[10px] text-cyan-800 font-semibold">
                WhatsApp: {settings.phoneWa}
              </p>
            </div>
          </div>

          {/* Judul Rapor */}
          <div className="text-center mb-6">
            <h2 className="font-heading font-black text-lg text-slate-900 uppercase tracking-wide">
              LAPORAN CAPAIAN KOMPETENSI RENANG
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Periode Evaluasi: <strong className="text-slate-900">{report.period}</strong>
            </p>
          </div>

          {/* Student Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 grid grid-cols-2 gap-y-2 gap-x-6 text-xs">
            <div>
              <span className="text-slate-500 text-[11px] block">Nama Lengkap Siswa:</span>
              <strong className="text-slate-900 text-sm font-heading">{report.memberName}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">ID Member / Registrasi:</span>
              <strong className="text-slate-900 font-mono">{report.memberId}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Tingkatan / Level Belajar:</span>
              <strong className="text-cyan-800 font-bold">{report.currentLevel}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Tanggal Ujian / Evaluasi:</span>
              <strong className="text-slate-800">
                {new Date(report.evaluationDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Pelatih / Coach Penguji:</span>
              <strong className="text-slate-900">{report.coachName}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Kehadiran Latihan:</span>
              <strong className="text-emerald-700">{report.attendanceSummary || '100% Mengikuti Sesi'}</strong>
            </div>
          </div>

          {/* Evaluation Criteria Table */}
          <div className="mb-6">
            <h3 className="font-heading font-black text-xs text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
              I. HASIL UJIAN MATERI & INDIKATOR KEMAMPUAN
            </h3>
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 font-heading font-bold text-slate-800 text-[11px] border-b border-slate-300 uppercase">
                    <th className="py-2.5 px-3 w-10 text-center border-r border-slate-300">No</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Indikator Kriteria Penilaian</th>
                    <th className="py-2.5 px-3 w-32 border-r border-slate-300">Kategori</th>
                    <th className="py-2.5 px-3 w-20 text-center border-r border-slate-300">Nilai (0-100)</th>
                    <th className="py-2.5 px-3 w-28 text-center border-r border-slate-300">Predikat</th>
                    <th className="py-2.5 px-3">Catatan Observasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {report.grades.map((grade, index) => (
                    <tr key={grade.criterionId || index} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center font-mono text-slate-500 border-r border-slate-200">
                        {index + 1}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                        {grade.criterionName}
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-[11px] border-r border-slate-200">
                        {grade.category}
                      </td>
                      <td className="py-2 px-3 text-center font-bold font-mono text-slate-950 border-r border-slate-200">
                        {grade.score}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            grade.score >= 85
                              ? 'bg-emerald-100 text-emerald-800'
                              : grade.score >= 75
                              ? 'bg-cyan-100 text-cyan-800'
                              : grade.score >= 65
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {grade.predicate}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 italic text-[11px]">
                        {grade.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Average & Overall Predicate Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 mb-6 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[11px] text-slate-300 block uppercase tracking-wider font-semibold">
                Kompilasi Nilai Akhir Ujian
              </span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-3xl font-heading font-black text-amber-400">
                  {report.averageScore}
                </span>
                <span className="text-xs text-slate-300">/ 100</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-300 block uppercase tracking-wider font-semibold">
                Predikat Kelulusan
              </span>
              <span className="inline-block mt-1 px-4 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-heading font-black text-sm uppercase shadow-sm">
                {report.overallPredicate}
              </span>
            </div>
          </div>

          {/* Evaluation & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <h4 className="font-heading font-bold text-xs text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>CATATAN EVALUASI PELATIH</span>
              </h4>
              <p className="text-slate-700 text-xs leading-relaxed italic">
                "{report.coachEvaluation || 'Ananda menunjukkan kemauan belajar dan kedisiplinan yang sangat baik selama program pelatihan.'}"
              </p>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
              <h4 className="font-heading font-bold text-xs text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>REKOMENDASI TAHAP BERIKUTNYA</span>
              </h4>
              <p className="text-amber-950 text-xs leading-relaxed">
                {report.recommendations || 'Siap melanjutkan ke materi teknik gaya renang berikutnya dengan jadwal reguler.'}
              </p>
            </div>
          </div>

          {/* Signature Box */}
          <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <p className="text-slate-500 mb-1">Mengetahui,</p>
              <p className="font-bold text-slate-800">Orang Tua / Wali Siswa</p>
              <div className="h-16 flex items-end justify-center">
                <span className="text-slate-300 text-[10px] italic">(Tanda Tangan)</span>
              </div>
              <p className="font-bold text-slate-800 pt-1 border-t border-slate-300 mx-10">
                ..........................................
              </p>
            </div>

            <div>
              <p className="text-slate-500 mb-1">
                Boyolali,{' '}
                {new Date(report.evaluationDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="font-bold text-slate-900">Head Coach DS AQUATICS</p>
              <div className="h-16 flex items-center justify-center">
                <div className="px-3 py-1 rounded-md border border-cyan-300 bg-cyan-50/50 text-cyan-800 text-[11px] font-mono font-bold">
                  VERIFIED BY DS AQUATICS
                </div>
              </div>
              <p className="font-heading font-black text-slate-950 pt-1 border-t border-slate-900 mx-8">
                {report.coachName || 'Coach Dewi Setyaningsih'}
              </p>
              <p className="text-[10px] text-slate-500">Pelatih Kepala / Pendiri Klub</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
