import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Search,
  UserCheck,
  ChevronDown,
  Clock,
  FileSpreadsheet,
  ExternalLink,
  Loader2,
  Play,
  Pause,
  Timer,
  Check,
  Printer,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { printRaporArchive, printSingleRapor } from '../utils/reportPrints';
import { exportRaporXlsx, exportSingleRaporXlsx } from '../utils/excelExport';
import { Member, EvaluationCriterion, MemberReport, CriterionGrade } from '../types';
import { DEFAULT_EVALUATION_CRITERIA } from '../data/defaultData';
import { exportReportsToGoogleSheets } from '../utils/googleWorkspace';

interface AdminRaporTabProps {
  members: Member[];
  evaluationCriteria: EvaluationCriterion[];
  addEvaluationCriterion: (item: Omit<EvaluationCriterion, 'id'>) => void;
  updateEvaluationCriterion: (id: string, item: Partial<EvaluationCriterion>) => void;
  deleteEvaluationCriterion: (id: string) => void;
  memberReports: MemberReport[];
  addMemberReport: (report: Omit<MemberReport, 'id'>) => MemberReport;
  deleteMemberReport: (id: string) => void;
  onPreviewReport: (report: MemberReport) => void;
}

export const AdminRaporTab: React.FC<AdminRaporTabProps> = ({
  members = [],
  evaluationCriteria = [],
  addEvaluationCriterion,
  updateEvaluationCriterion,
  deleteEvaluationCriterion,
  memberReports = [],
  addMemberReport,
  deleteMemberReport,
  onPreviewReport,
}) => {
  // Sub tab: 'terbitkan' | 'kriteria' | 'arsip'
  const [subTab, setSubTab] = useState<'terbitkan' | 'kriteria' | 'arsip'>('terbitkan');

  // Modal states for criteria
  const [showCritModal, setShowCritModal] = useState(false);
  const [editingCrit, setEditingCrit] = useState<EvaluationCriterion | null>(null);
  const [critCategory, setCritCategory] = useState('Dasar & Keselamatan');
  const [critName, setCritName] = useState('');
  const [critDesc, setCritDesc] = useState('');
  const [critMaxScore, setCritMaxScore] = useState(100);

  // Form states for creating a new report
  const [selectedMemberId, setSelectedMemberId] = useState<string>((members || [])[0]?.id || '');
  const [period, setPeriod] = useState('Triwulan III / 2026');
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().split('T')[0]);
  const [coachName, setCoachName] = useState('Coach Dewi Setyaningsih');
  const [currentLevel, setCurrentLevel] = useState('Pemula Menuju Tingkat Lanjut');
  const [attendanceSummary, setAttendanceSummary] = useState('4 dari 4 Sesi Hadir (100%)');
  const [coachEvaluation, setCoachEvaluation] = useState('');
  const [recommendations, setRecommendations] = useState('');

  // Individual criterion scores: { [id: string]: { score: number; notes: string; hours?: number; minutes?: number; seconds?: number; milliseconds?: number; formatted?: string } }
  const [gradesMap, setGradesMap] = useState<{
    [id: string]: {
      score: number;
      notes: string;
      hours?: number;
      minutes?: number;
      seconds?: number;
      milliseconds?: number;
      formatted?: string;
    };
  }>(() => {
    const initial: {
      [id: string]: {
        score: number;
        notes: string;
        hours?: number;
        minutes?: number;
        seconds?: number;
        milliseconds?: number;
        formatted?: string;
      };
    } = {};
    evaluationCriteria.forEach((c) => {
      initial[c.id] = { score: 85, notes: '', hours: 0, minutes: 0, seconds: 0 };
    });
    return initial;
  });

  // Stopwatch state per criterion
  const [stopwatchStates, setStopwatchStates] = useState<{
    [critId: string]: {
      isRunning: boolean;
      elapsedMs: number;
      mode: 'stopwatch' | 'manual';
    };
  }>({});
  const lastTickRef = useRef<number>(Date.now());
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      setStopwatchStates((prev) => {
        let hasRunning = false;
        const next = { ...prev };
        for (const id in next) {
          if (next[id]?.isRunning) {
            hasRunning = true;
            next[id] = { ...next[id], elapsedMs: (next[id].elapsedMs || 0) + delta };
          }
        }
        return hasRunning ? next : prev;
      });

      animRef.current = requestAnimationFrame(tick);
    };

    lastTickRef.current = Date.now();
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const formatStopwatchTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  };

  const toggleStopwatch = (critId: string) => {
    lastTickRef.current = Date.now();
    setStopwatchStates((prev) => {
      const current = prev[critId] || { isRunning: false, elapsedMs: 0, mode: 'stopwatch' };
      return {
        ...prev,
        [critId]: {
          ...current,
          isRunning: !current.isRunning,
        },
      };
    });
  };

  const resetStopwatch = (critId: string) => {
    setStopwatchStates((prev) => ({
      ...prev,
      [critId]: {
        ...(prev[critId] || { mode: 'stopwatch' }),
        isRunning: false,
        elapsedMs: 0,
      },
    }));
  };

  const setTimingMode = (critId: string, mode: 'stopwatch' | 'manual') => {
    setStopwatchStates((prev) => ({
      ...prev,
      [critId]: {
        ...(prev[critId] || { isRunning: false, elapsedMs: 0 }),
        mode,
      },
    }));
  };

  const applyStopwatchToCriterion = (critId: string) => {
    const state = stopwatchStates[critId];
    if (!state) return;
    const ms = state.elapsedMs;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    const formatted = formatStopwatchTime(ms);

    setGradesMap((prev) => ({
      ...prev,
      [critId]: {
        ...(prev[critId] || { score: 85, notes: '' }),
        hours: 0,
        minutes,
        seconds,
        milliseconds,
        formatted,
      },
    }));
    showToast(`Waktu stopwatch ${formatted} berhasil diterapkan ke kriteria!`);
  };

  const [searchReportQuery, setSearchReportQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [sheetsExportSuccessUrl, setSheetsExportSuccessUrl] = useState<string | null>(null);
  const [raporConfirmAction, setRaporConfirmAction] = useState<{
    type: 'criteria' | 'report' | 'reset-criteria';
    id?: string;
    name: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setErrorToast(null);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const showErrorToast = (msg: string) => {
    setErrorToast(msg);
    setSuccessToast(null);
    setTimeout(() => setErrorToast(null), 6000);
  };

  const handleExportToSheets = async () => {
    if (memberReports.length === 0) {
      showErrorToast('Belum ada data rapor ujian untuk diekspor.');
      return;
    }
    setIsExportingSheets(true);
    try {
      const res = await exportReportsToGoogleSheets(memberReports, 'DS AQUATICS');
      if (res.spreadsheetUrl) {
        setSheetsExportSuccessUrl(res.spreadsheetUrl);
        showToast('Rapor & Catatan Waktu berhasil diekspor ke Google Sheets!');
        const link = document.createElement('a');
        link.href = res.spreadsheetUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      showErrorToast(`Gagal mengekspor ke Google Sheets: ${err.message || err}`);
    } finally {
      setIsExportingSheets(false);
    }
  };

  // Helper for grade predicate calculation
  const getPredicate = (score: number): 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Latihan' => {
    if (score >= 88) return 'Sangat Baik';
    if (score >= 75) return 'Baik';
    if (score >= 60) return 'Cukup';
    return 'Perlu Latihan';
  };

  // Calculate live average score
  const criterionIds = evaluationCriteria.map((c) => c.id);
  const totalScore = criterionIds.reduce((sum, id) => {
    const val = gradesMap[id]?.score ?? 80;
    return sum + Number(val);
  }, 0);
  const averageScore = criterionIds.length > 0 ? Number((totalScore / criterionIds.length).toFixed(1)) : 0;

  const getOverallPredicate = (avg: number) => {
    if (avg >= 88) return 'Sangat Baik (A)';
    if (avg >= 78) return 'Baik (B)';
    if (avg >= 65) return 'Cukup (C)';
    return 'Perlu Bimbingan (D)';
  };

  // Open Add Criteria Modal
  const openAddCritModal = () => {
    setEditingCrit(null);
    setCritCategory('Dasar & Keselamatan');
    setCritName('');
    setCritDesc('');
    setCritMaxScore(100);
    setShowCritModal(true);
  };

  // Open Edit Criteria Modal
  const openEditCritModal = (crit: EvaluationCriterion) => {
    setEditingCrit(crit);
    setCritCategory(crit.category);
    setCritName(crit.name);
    setCritDesc(crit.description);
    setCritMaxScore(crit.maxScore || 100);
    setShowCritModal(true);
  };

  // Save Criteria
  const handleSaveCriteria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!critName.trim()) {
      showErrorToast('Nama kriteria penilaian wajib diisi!');
      return;
    }

    if (editingCrit) {
      updateEvaluationCriterion(editingCrit.id, {
        category: critCategory,
        name: critName.trim(),
        description: critDesc.trim(),
        maxScore: Number(critMaxScore) || 100,
      });
      showToast('Kriteria penilaian berhasil diperbarui.');
    } else {
      addEvaluationCriterion({
        category: critCategory,
        name: critName.trim(),
        description: critDesc.trim(),
        maxScore: Number(critMaxScore) || 100,
      });
      showToast('Kriteria penilaian baru berhasil ditambahkan.');
    }
    setShowCritModal(false);
  };

  // Handle Score Change
  const handleScoreChange = (id: string, score: number) => {
    setGradesMap((prev) => ({
      ...prev,
      [id]: {
        score: Math.min(100, Math.max(0, score)),
        notes: prev[id]?.notes || '',
        hours: prev[id]?.hours || 0,
        minutes: prev[id]?.minutes || 0,
        seconds: prev[id]?.seconds || 0,
      },
    }));
  };

  // Handle Note Change
  const handleNoteChange = (id: string, notes: string) => {
    setGradesMap((prev) => ({
      ...prev,
      [id]: {
        score: prev[id]?.score ?? 80,
        notes,
        hours: prev[id]?.hours || 0,
        minutes: prev[id]?.minutes || 0,
        seconds: prev[id]?.seconds || 0,
      },
    }));
  };

  // Handle Time Change
  const handleTimeChange = (
    id: string,
    field: 'hours' | 'minutes' | 'seconds',
    val: number
  ) => {
    setGradesMap((prev) => {
      const current = prev[id] || { score: 80, notes: '', hours: 0, minutes: 0, seconds: 0 };
      return {
        ...prev,
        [id]: {
          ...current,
          [field]: Math.max(0, Number(val) || 0),
        },
      };
    });
  };

  // Submit New Report
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    const member = members.find((m) => m.id === selectedMemberId) || members[0];
    if (!member) {
      showErrorToast('Gagal Menerbitkan Rapor: Silakan pilih data siswa / member terlebih dahulu.');
      return;
    }

    if (!period.trim()) {
      showErrorToast('Gagal Menerbitkan Rapor: Kolom Periode / Siklus Ujian wajib diisi.');
      return;
    }

    if (!coachEvaluation.trim()) {
      showErrorToast('Gagal Menerbitkan Rapor: Kolom "Catatan Evaluasi Pelatih" wajib diisi sebelum menerbitkan rapor!');
      return;
    }

    try {
      const grades: CriterionGrade[] = evaluationCriteria.map((crit) => {
        const g = gradesMap[crit.id] || { score: 80, notes: '', hours: 0, minutes: 0, seconds: 0 };
        const h = Number(g.hours || 0);
        const m = Number(g.minutes || 0);
        const s = Number(g.seconds || 0);
        const ms = Number(g.milliseconds || 0);
        const hasTime = h > 0 || m > 0 || s > 0 || ms > 0 || Boolean(g.formatted);

        return {
          criterionId: crit.id,
          criterionName: crit.name,
          category: crit.category,
          score: g.score,
          predicate: getPredicate(g.score),
          notes: g.notes,
          timeRecord: hasTime
            ? {
                hours: h,
                minutes: m,
                seconds: s,
                milliseconds: ms,
                formatted:
                  g.formatted ||
                  (h > 0
                    ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
                    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(Math.floor(ms / 10)).padStart(2, '0')}`),
              }
            : undefined,
        };
      });

      const newReport = addMemberReport({
        memberId: member.id,
        memberName: member.fullName,
        period: period.trim(),
        evaluationDate,
        coachName: coachName.trim(),
        currentLevel: currentLevel.trim(),
        grades,
        averageScore,
        overallPredicate: getOverallPredicate(averageScore),
        coachEvaluation: coachEvaluation.trim(),
        recommendations: recommendations.trim(),
        attendanceSummary: attendanceSummary.trim(),
      });

      showToast(`Berhasil! Rapor Ujian atas nama ${member.fullName} (${period.trim()}) berhasil diterbitkan dan tersimpan secara otomatis.`);
      onPreviewReport(newReport);
    } catch (err: any) {
      showErrorToast(`Gagal Menerbitkan Rapor: Terjadi kesalahan (${err?.message || err})`);
    }
  };

  // Group criteria by category
  const categoriesList = Array.from(new Set(evaluationCriteria.map((c) => c.category)));

  // Filtered reports with safe string guards
  const q = searchReportQuery.toLowerCase();
  const { settings } = useApp();
  const [printWithDetails, setPrintWithDetails] = useState(false);
  const [excelBusy, setExcelBusy] = useState(false);
  const filteredReports = (memberReports || []).filter((r) => {
    if (!r) return false;
    return (
      (r.memberName || '').toLowerCase().includes(q) ||
      (r.period || '').toLowerCase().includes(q) ||
      (r.memberId || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notifications (Success & Error) */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-full bg-emerald-500 text-white">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 hover:text-emerald-950 text-base font-bold px-2">
            ×
          </button>
        </div>
      )}

      {errorToast && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-950 text-xs font-bold rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-full bg-rose-600 text-white">
              <AlertCircle className="w-4 h-4" />
            </div>
            <span>{errorToast}</span>
          </div>
          <button onClick={() => setErrorToast(null)} className="text-rose-700 hover:text-rose-950 text-base font-bold px-2">
            ×
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-blue-950 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase mb-2 border border-amber-400/30">
            <Award className="w-3.5 h-3.5" />
            <span>Modul Rapor Ujian & Penilaian Kompetensi</span>
          </div>
          <h3 className="text-2xl font-heading font-black text-white">
            Rapor Ujian & Kategori Penilaian Coach
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Atur kriteria penilaian standar, kelola catatan waktu jam/menit/detik, dan terbitkan evaluasi berkala siswa dengan predikat kompetensi renang DS AQUATICS.
          </p>
        </div>

        {/* Sub Tab Navigation */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-800/80 rounded-2xl border border-slate-700">
          <button
            type="button"
            onClick={() => setSubTab('terbitkan')}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all ${
              subTab === 'terbitkan'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            + Terbitkan Rapor
          </button>
          <button
            type="button"
            onClick={() => setSubTab('kriteria')}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all ${
              subTab === 'kriteria'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Kategori Default ({evaluationCriteria.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('arsip')}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all ${
              subTab === 'arsip'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Arsip Rapor ({memberReports.length})
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUB TAB 1: FORM PENERBITAN RAPOR BARU                     */}
      {/* ======================================================== */}
      {subTab === 'terbitkan' && (
        <form onSubmit={handleSubmitReport} className="space-y-6">
          {/* Identitas Siswa & Periode */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-heading font-black text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserCheck className="w-5 h-5 text-cyan-600" />
              <span>1. Identitas Siswa & Waktu Ujian</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Siswa / Member: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => {
                    setSelectedMemberId(e.target.value);
                    const found = members.find((m) => m.id === e.target.value);
                    if (found) {
                      setCurrentLevel(found.currentLevel || 'Pemula');
                      setAttendanceSummary(`${found.attendedSessions || 3} dari ${found.totalSessionsAllowed || 4} Sesi Hadir`);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.id} - {m.school || 'Murid'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Periode Ujian / Ujian Tingkat: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="Contoh: Triwulan III / 2026 atau Ujian Kenaikan Tingkat Level 1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium placeholder:text-slate-400 placeholder:italic focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tanggal Ujian / Evaluasi: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={evaluationDate}
                  onChange={(e) => setEvaluationDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tingkatan / Level Belajar:
                </label>
                <input
                  type="text"
                  value={currentLevel}
                  onChange={(e) => setCurrentLevel(e.target.value)}
                  placeholder="Contoh: Pemula / Menengah / Mahir / Prestasi Junior"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium placeholder:text-slate-400 placeholder:italic focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Coach / Pelatih Penguji:
                </label>
                <input
                  type="text"
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  placeholder="Contoh: Coach Dewi Setyaningsih"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium placeholder:text-slate-400 placeholder:italic focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ringkasan Kehadiran Sesi:
                </label>
                <input
                  type="text"
                  value={attendanceSummary}
                  onChange={(e) => setAttendanceSummary(e.target.value)}
                  placeholder="Contoh: 4 dari 4 Sesi Hadir (100%)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium placeholder:text-slate-400 placeholder:italic focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Matriks Nilai Tiap Kriteria */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-heading font-black text-base text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>2. Penilaian Tiap Kriteria & Capaian Teknik</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Masukkan skor nilai (0 - 100) dan catatan khusus untuk setiap indikator materi.
                </p>
              </div>

              {/* Live Score Summary */}
              <div className="flex items-center gap-4 bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-sm">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Rata-rata Nilai</span>
                  <span className="text-xl font-heading font-black text-amber-400">{averageScore}</span>
                </div>
                <div className="h-8 w-px bg-slate-700" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Predikat</span>
                  <span className="text-xs font-heading font-bold text-cyan-300">{getOverallPredicate(averageScore)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-2">
              {categoriesList.map((cat) => {
                const criteriaInCat = evaluationCriteria.filter((c) => c.category === cat);
                return (
                  <div key={cat} className="space-y-3">
                    <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 font-heading font-bold text-xs text-slate-800 uppercase tracking-wide inline-block border border-slate-200">
                      {cat}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {criteriaInCat.map((crit) => {
                        const currentScore = gradesMap[crit.id]?.score ?? 85;
                        const currentNote = gradesMap[crit.id]?.notes || '';
                        const pred = getPredicate(currentScore);

                        return (
                          <div
                            key={crit.id}
                            className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 hover:border-cyan-300 transition-all space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="font-heading font-bold text-xs text-slate-900">
                                  {crit.name}
                                </h5>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                  {crit.description}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                                  currentScore >= 88
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : currentScore >= 75
                                    ? 'bg-cyan-100 text-cyan-800'
                                    : currentScore >= 60
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {pred}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min={40}
                                max={100}
                                step={1}
                                value={currentScore}
                                onChange={(e) => handleScoreChange(crit.id, Number(e.target.value))}
                                className="flex-1 accent-cyan-600 cursor-pointer"
                              />
                              <div className="w-16">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={currentScore}
                                  onChange={(e) => handleScoreChange(crit.id, Number(e.target.value))}
                                  className="w-full text-center font-mono font-bold text-sm py-1 px-1.5 rounded-lg border border-slate-300 bg-white"
                                />
                              </div>
                            </div>

                            {/* Stop Watch Terintegrasi Otomatis & Fitur Edit Manual */}
                            <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
                              {/* Header & Mode Switcher */}
                              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                                  <Timer className="w-3.5 h-3.5 text-cyan-600" />
                                  <span>Catatan Waktu Renang:</span>
                                </div>

                                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                                  <button
                                    type="button"
                                    onClick={() => setTimingMode(crit.id, 'stopwatch')}
                                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                      (stopwatchStates[crit.id]?.mode || 'stopwatch') === 'stopwatch'
                                        ? 'bg-cyan-700 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                  >
                                    ⏱ Stopwatch
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTimingMode(crit.id, 'manual')}
                                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                      stopwatchStates[crit.id]?.mode === 'manual'
                                        ? 'bg-slate-800 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                  >
                                    ✏️ Edit Manual
                                  </button>
                                </div>
                              </div>

                              {/* MODE 1: STOPWATCH TERINTEGRASI */}
                              {(stopwatchStates[crit.id]?.mode || 'stopwatch') === 'stopwatch' ? (
                                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 text-white p-2.5 rounded-xl">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-lg font-black text-cyan-300 tracking-wider">
                                      {formatStopwatchTime(stopwatchStates[crit.id]?.elapsedMs || 0)}
                                    </span>
                                    {gradesMap[crit.id]?.formatted && (
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        (Tersimpan: {gradesMap[crit.id]?.formatted})
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => toggleStopwatch(crit.id)}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                                        stopwatchStates[crit.id]?.isRunning
                                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-black'
                                          : 'bg-emerald-600 text-white hover:bg-emerald-500'
                                      }`}
                                    >
                                      {stopwatchStates[crit.id]?.isRunning ? (
                                        <>
                                          <Pause className="w-3 h-3 fill-slate-950" />
                                          <span>Pause</span>
                                        </>
                                      ) : (
                                        <>
                                          <Play className="w-3 h-3 fill-white" />
                                          <span>Start</span>
                                        </>
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => resetStopwatch(crit.id)}
                                      title="Reset Stopwatch"
                                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => applyStopwatchToCriterion(crit.id)}
                                      disabled={!stopwatchStates[crit.id]?.elapsedMs}
                                      className="px-2 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>Terapkan</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* MODE 2: EDIT MANUAL */
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        min={0}
                                        max={23}
                                        placeholder="00"
                                        value={gradesMap[crit.id]?.hours || ''}
                                        onChange={(e) =>
                                          handleTimeChange(
                                            crit.id,
                                            'hours',
                                            Math.max(0, Math.min(23, Number(e.target.value)))
                                          )
                                        }
                                        className="w-10 text-center py-1 px-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 text-xs focus:ring-1 focus:ring-cyan-500"
                                      />
                                      <span className="text-[10px] text-slate-400 font-sans font-semibold">jam</span>
                                    </div>
                                    <span className="text-slate-300 font-bold">:</span>
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        min={0}
                                        max={59}
                                        placeholder="00"
                                        value={gradesMap[crit.id]?.minutes || ''}
                                        onChange={(e) =>
                                          handleTimeChange(
                                            crit.id,
                                            'minutes',
                                            Math.max(0, Math.min(59, Number(e.target.value)))
                                          )
                                        }
                                        className="w-10 text-center py-1 px-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 text-xs focus:ring-1 focus:ring-cyan-500"
                                      />
                                      <span className="text-[10px] text-slate-400 font-sans font-semibold">mnt</span>
                                    </div>
                                    <span className="text-slate-300 font-bold">:</span>
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        min={0}
                                        max={59}
                                        placeholder="00"
                                        value={gradesMap[crit.id]?.seconds || ''}
                                        onChange={(e) =>
                                          handleTimeChange(
                                            crit.id,
                                            'seconds',
                                            Math.max(0, Math.min(59, Number(e.target.value)))
                                          )
                                        }
                                        className="w-10 text-center py-1 px-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 text-xs focus:ring-1 focus:ring-cyan-500"
                                      />
                                      <span className="text-[10px] text-slate-400 font-sans font-semibold">dtk</span>
                                    </div>
                                    <span className="text-slate-300 font-bold">.</span>
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        min={0}
                                        max={99}
                                        placeholder="00"
                                        value={gradesMap[crit.id]?.milliseconds !== undefined ? Math.floor((gradesMap[crit.id]?.milliseconds || 0) / 10) : ''}
                                        onChange={(e) =>
                                          setGradesMap((prev) => ({
                                            ...prev,
                                            [crit.id]: {
                                              ...(prev[crit.id] || { score: 85, notes: '' }),
                                              milliseconds: Math.min(990, Math.max(0, Number(e.target.value) * 10)),
                                            },
                                          }))
                                        }
                                        className="w-10 text-center py-1 px-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 text-xs focus:ring-1 focus:ring-cyan-500"
                                      />
                                      <span className="text-[10px] text-slate-400 font-sans font-semibold">ms</span>
                                    </div>
                                  </div>

                                  {/* Format cepat manual string */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">Format Teks:</span>
                                    <input
                                      type="text"
                                      placeholder="Contoh: 00:25.84"
                                      value={gradesMap[crit.id]?.formatted || ''}
                                      onChange={(e) =>
                                        setGradesMap((prev) => ({
                                          ...prev,
                                          [crit.id]: {
                                            ...(prev[crit.id] || { score: 85, notes: '' }),
                                            formatted: e.target.value,
                                          },
                                        }))
                                      }
                                      className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono font-bold text-slate-800 placeholder:font-sans placeholder:font-normal focus:bg-white focus:ring-1 focus:ring-cyan-500"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            <div>
                              <input
                                type="text"
                                value={currentNote}
                                onChange={(e) => handleNoteChange(crit.id, e.target.value)}
                                placeholder="Teks catatan pengamatan pelatih (contoh: gerakan kaki sangat kuat)..."
                                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 placeholder:italic focus:outline-hidden focus:border-cyan-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kolom Evaluasi & Rekomendasi Pelatih */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-heading font-black text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>3. CATATAN PELATIH & Rekomendasi Lanjutan</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  CATATAN PELATIH (Evaluasi Menyeluruh): <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={coachEvaluation}
                  onChange={(e) => setCoachEvaluation(e.target.value)}
                  placeholder="Contoh: Ananda menunjukkan kemajuan yang luar biasa pada ketenangan mengapung dan penguasaan teknik tendangan kaki dada. Rasa cemas di kedalaman sudah hilang sepenuhnya..."
                  className="w-full p-3.5 rounded-2xl border border-slate-300 leading-relaxed placeholder:text-slate-400 placeholder:italic focus:ring-2 focus:ring-cyan-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  REKOMENDASI TAHAP BERIKUTNYA:
                </label>
                <textarea
                  rows={4}
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="Contoh: Disarankan melanjutkan ke materi kayuhan tangan gaya bebas (freestyle) dan melatih pernapasan samping pada paket berikutnya..."
                  className="w-full p-3.5 rounded-2xl border border-slate-300 leading-relaxed placeholder:text-slate-400 placeholder:italic focus:ring-2 focus:ring-cyan-500 focus:outline-hidden font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                id="btn-submit-rapor"
                className="px-6 py-3.5 rounded-2xl font-heading font-black text-sm text-white bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terbitkan & Simpan Rapor Ujian</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* SUB TAB 2: PENGATURAN KATEGORI PENILAIAN DEFAULT           */}
      {/* ======================================================== */}
      {subTab === 'kriteria' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-heading font-black text-lg text-slate-900">
                Kategori & Kriteria Penilaian Default
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Kriteria ini menjadi standar acuan penilaian otomatis saat Coach mengisi rapor ujian siswa.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setRaporConfirmAction({
                    type: 'reset-criteria',
                    name: 'Format Standar DS AQUATICS',
                  });
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Default Standar</span>
              </button>

              <button
                type="button"
                onClick={openAddCritModal}
                id="btn-add-evaluation-criterion"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Kriteria Baru</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evaluationCriteria.map((crit, idx) => (
              <div
                key={crit.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-cyan-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">
                      {crit.category}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 font-semibold">
                      Max: {crit.maxScore || 100} poin
                    </span>
                  </div>

                  <h5 className="font-heading font-black text-sm text-slate-900">
                    {idx + 1}. {crit.name}
                  </h5>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {crit.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openEditCritModal(crit)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-cyan-700" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRaporConfirmAction({
                        type: 'criteria',
                        id: crit.id,
                        name: crit.name,
                      });
                    }}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB TAB 3: ARSIP RAPOR MEMBER YANG TELAH DITERBITKAN     */}
      {/* ======================================================== */}
      {subTab === 'arsip' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-heading font-black text-lg text-slate-900">
                Arsip Riwayat Rapor Siswa ({memberReports.length})
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Daftar seluruh rapor ujian renang dan catatan waktu yang telah resmi diterbitkan oleh Coach.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                <input type="checkbox" checked={printWithDetails} onChange={(e) => setPrintWithDetails(e.target.checked)} />
                Sertakan rincian nilai
              </label>
              <button
                type="button"
                onClick={() => {
                  if (!printRaporArchive(filteredReports, settings, printWithDetails))
                    alert('Jendela cetak diblokir browser. Izinkan pop-up untuk situs ini lalu coba lagi.');
                }}
                disabled={!filteredReports.length}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
              <button
                    type="button"
                    onClick={async () => {
                  setExcelBusy(true);
                  try {
                    await exportRaporXlsx(filteredReports, settings);
                  } catch (err) {
                    alert(`Gagal membuat Excel: ${(err as Error).message}`);
                  } finally {
                    setExcelBusy(false);
                  }
                }}
                disabled={excelBusy || !filteredReports.length}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> {excelBusy ? 'Membuat Excel…' : 'Ekspor ke Excel'}
                  </button>

              <button
                type="button"
                onClick={handleExportToSheets}
                disabled={isExportingSheets}
                id="btn-export-reports-sheets"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                title="Buka data rapor dan rincian waktu di Google Sheets"
              >
                {isExportingSheets ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                )}
                <span>{isExportingSheets ? 'Mengekspor...' : 'Ekspor ke Google Sheets'}</span>
              </button>

              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchReportQuery}
                  onChange={(e) => setSearchReportQuery(e.target.value)}
                  placeholder="Cari nama siswa / periode..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden font-medium placeholder:text-slate-400 placeholder:italic"
                />
              </div>
            </div>
          </div>

          {sheetsExportSuccessUrl && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-950">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Spreadsheet Rapor & Catatan Waktu berhasil dibuat dan siap diakses!</span>
              </div>
              <a
                href={sheetsExportSuccessUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-1 shrink-0"
              >
                <span>Buka Google Sheets</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-100 font-heading font-bold text-slate-700 uppercase border-b border-slate-200 text-[11px]">
                    <th className="py-3.5 px-4">Nama Siswa / ID</th>
                    <th className="py-3.5 px-4">Periode & Tgl Ujian</th>
                    <th className="py-3.5 px-4">Tingkat / Level</th>
                    <th className="py-3.5 px-4 text-center">Catatan Waktu</th>
                    <th className="py-3.5 px-4 text-center">Nilai Rata-rata</th>
                    <th className="py-3.5 px-4 text-center">Predikat Kelulusan</th>
                    <th className="py-3.5 px-4 text-center">Aksi Rapor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredReports.map((report) => {
                    const timedGrades = (report.grades || []).filter(
                      (g) => g.timeRecord?.formatted && g.timeRecord.formatted !== '00:00:00'
                    );

                    return (
                      <tr key={report.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4">
                          <strong className="text-slate-900 block text-sm font-heading">{report.memberName}</strong>
                          <span className="font-mono text-[10px] text-slate-400">{report.memberId}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 block">{report.period}</span>
                          <span className="text-[10px] text-slate-500">{report.evaluationDate}</span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-cyan-800">
                          {report.currentLevel}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {timedGrades.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] bg-cyan-50 text-cyan-800 border border-cyan-200">
                              <Clock className="w-3 h-3 text-cyan-600" />
                              <span>{timedGrades[0].timeRecord?.formatted}</span>
                              {timedGrades.length > 1 && (
                                <span className="text-[9px] text-cyan-600 font-sans">
                                  (+{timedGrades.length - 1})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-heading font-black text-sm text-cyan-900">
                          {report.averageScore}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-3 py-1 rounded-full font-heading font-black text-[11px] bg-amber-100 text-amber-900 border border-amber-300">
                            {report.overallPredicate}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => onPreviewReport(report)}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                              title="Lihat rincian lengkap rapor ujian dan catatan waktu"
                            >
                              <FileText className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Lihat Detail Rapor</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!printSingleRapor(report, settings))
                                  alert('Jendela cetak diblokir browser. Izinkan pop-up untuk situs ini lalu coba lagi.');
                              }}
                              className="p-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 cursor-pointer"
                              title={`Cetak / Simpan PDF rapor ${report.memberName}`}
                              aria-label="Cetak / Simpan PDF"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                exportSingleRaporXlsx(report, settings).catch((err) =>
                                  alert(`Gagal membuat Excel: ${(err as Error).message}`)
                                )
                              }
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer"
                              title={`Ekspor ke Excel rapor ${report.memberName}`}
                              aria-label="Ekspor ke Excel"
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRaporConfirmAction({
                                  type: 'report',
                                  id: report.id,
                                  name: report.memberName,
                                });
                              }}
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                              title="Hapus Rapor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredReports.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 italic">
                        Belum ada arsip rapor yang cocok dengan pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TAMBAH / EDIT KRITERIA PENILAIAN                   */}
      {/* ======================================================== */}
      {showCritModal && (
        <div className="fixed inset-0 overflow-y-auto z-50 bg-black/60 backdrop-blur-xs flex items-center-safe justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-heading font-black text-slate-900 text-base">
                {editingCrit ? 'Edit Kriteria Penilaian' : 'Tambah Kriteria Penilaian Baru'}
              </h4>
              <button onClick={() => setShowCritModal(false)} className="text-slate-400 hover:text-slate-700">
                ×
              </button>
            </div>

            <form onSubmit={handleSaveCriteria} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori:</label>
                <input
                  type="text"
                  required
                  value={critCategory}
                  onChange={(e) => setCritCategory(e.target.value)}
                  placeholder="Contoh: Dasar & Keselamatan / Gaya Dada / Gaya Bebas"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Indikator / Kriteria:</label>
                <input
                  type="text"
                  required
                  value={critName}
                  onChange={(e) => setCritName(e.target.value)}
                  placeholder="Contoh: Tendangan Kaki Gaya Dada (Whip Kick)"
                  className="w-full px-3 py-2 border rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi / Tolok Ukur:</label>
                <textarea
                  rows={3}
                  value={critDesc}
                  onChange={(e) => setCritDesc(e.target.value)}
                  placeholder="Contoh: Gerakan melipat, menendang memutar, dan merapatkan kembali kedua kaki dengan dorongan kuat..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Skor Maksimal:</label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={critMaxScore}
                  onChange={(e) => setCritMaxScore(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCritModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-sm"
                >
                  Simpan Kriteria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rapor Confirm Action Modal */}
      {raporConfirmAction && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center-safe justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-200 text-center space-y-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-sm ${
                raporConfirmAction.type === 'reset-criteria'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-rose-100 text-rose-600'
              }`}
            >
              {raporConfirmAction.type === 'reset-criteria' ? (
                <RotateCcw className="w-6 h-6" />
              ) : (
                <Trash2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <h4 className="font-heading font-black text-slate-900 text-lg">
                {raporConfirmAction.type === 'reset-criteria'
                  ? 'Reset Kriteria Penilaian?'
                  : raporConfirmAction.type === 'criteria'
                  ? 'Hapus Kriteria Penilaian?'
                  : 'Hapus Dokumen Rapor?'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {raporConfirmAction.type === 'reset-criteria' &&
                  'Kembalikan seluruh parameter kriteria penilaian ke format standar DS AQUATICS? Kriteria standar yang belum ada akan ditambahkan.'}
                {raporConfirmAction.type === 'criteria' &&
                  `Yakin ingin menghapus kriteria "${raporConfirmAction.name}"? Kriteria ini tidak akan muncul lagi pada formulir penilaian baru.`}
                {raporConfirmAction.type === 'report' &&
                  `Yakin ingin menghapus arsip rapor ujian untuk siswa ${raporConfirmAction.name}? Dokumen tidak dapat dipulihkan kembali.`}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRaporConfirmAction(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (raporConfirmAction.type === 'reset-criteria') {
                    DEFAULT_EVALUATION_CRITERIA.forEach((dc) => {
                      if (!evaluationCriteria.some((c) => c.id === dc.id)) {
                        addEvaluationCriterion(dc);
                      }
                    });
                    showToast('Kriteria standar berhasil dimuat ulang.');
                  } else if (raporConfirmAction.type === 'criteria' && raporConfirmAction.id) {
                    deleteEvaluationCriterion(raporConfirmAction.id);
                    showToast(`Kriteria "${raporConfirmAction.name}" berhasil dihapus.`);
                  } else if (raporConfirmAction.type === 'report' && raporConfirmAction.id) {
                    deleteMemberReport(raporConfirmAction.id);
                    showToast('Rapor berhasil dihapus dari arsip.');
                  }
                  setRaporConfirmAction(null);
                }}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer ${
                  raporConfirmAction.type === 'reset-criteria'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {raporConfirmAction.type === 'reset-criteria' ? 'Ya, Muat Ulang' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
