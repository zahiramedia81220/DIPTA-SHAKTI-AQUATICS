import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { printSingleRapor } from '../utils/reportPrints';
import {
  User,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Award,
  X,
  PlusCircle,
  ArrowRight,
  ArrowLeft,
  LogOut,
  Printer,
  ClipboardCheck,
  FileText,
  ChevronRight,
  Megaphone,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { ScheduleRequest, MemberReport, Member } from '../types';

interface MemberPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScheduleRequest: () => void;
  onOpenAdminPanel?: () => void;
}

export const MemberPanel: React.FC<MemberPanelProps> = ({
  isOpen,
  onClose,
  onOpenScheduleRequest,
  onOpenAdminPanel,
}) => {
  const { currentUser, members, scheduleRequests, markAttendance, pricePackages, memberReports, settings, logout } = useApp();
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'jadwal' | 'rapor' | 'profil'>('ringkasan');

  const currentMember: Member =
    (members || []).find((m) => m && m.id === currentUser.memberId) ||
    (members || [])[0] || {
      id: currentUser.memberId || 'MEM-001',
      fullName: currentUser.name || 'Member',
      email: currentUser.email || '',
      whatsapp: currentUser.whatsapp || '',
      status: 'Aktif',
      attendedSessions: 0,
      totalSessionsAllowed: 4,
      category: 'reguler',
      selectedPackageId: 'pkg-reguler',
      registrationDate: '2026-09-01',
    };

  const memberRequests = (scheduleRequests || []).filter((r) => {
    if (!r) return false;
    if (currentMember.id && r.memberId === currentMember.id) return true;
    if (currentMember.fullName && currentMember.fullName.trim()) {
      return (r.memberName || '').toLowerCase().includes(currentMember.fullName.toLowerCase().trim());
    }
    return false;
  });

  const selectedPkg = (pricePackages || []).find(
    (p) => p && p.id === currentMember.selectedPackageId
  );

  const myReports = (memberReports || []).filter((rep) => {
    if (!rep) return false;
    if (currentMember.id && rep.memberId === currentMember.id) return true;
    if (currentMember.fullName && currentMember.fullName.trim()) {
      return (rep.memberName || '').toLowerCase().includes(currentMember.fullName.toLowerCase().trim());
    }
    return false;
  });

  const [selectedReport, setSelectedReport] = useState<MemberReport | null>(null);
  const [attendanceSuccessMsg, setAttendanceSuccessMsg] = useState<string | null>(null);
  const [attendanceErrorMsg, setAttendanceErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelfAttendance = (req: ScheduleRequest) => {
    if (req.attended) {
      setAttendanceErrorMsg('Sesi latihan ini sudah diabsensi sebelumnya!');
      setTimeout(() => setAttendanceErrorMsg(null), 4000);
      return;
    }

    markAttendance(req.id, currentMember.id);
    setAttendanceSuccessMsg(`Berhasil! Absensi kehadiran latihan ${req.day}, ${req.timeRange} telah tercatat.`);
    setTimeout(() => setAttendanceSuccessMsg(null), 4000);
  };

  const progressPercent = Math.min(
    100,
    Math.round((currentMember.attendedSessions / (currentMember.totalSessionsAllowed || 1)) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden min-h-screen w-full bg-slate-100 text-slate-900 flex flex-col print:bg-white print:text-black">
      {/* Top Main Navigation Header */}
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer group shadow-xs"
              title="Kembali ke Beranda Website DS Aquatics"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Kembali ke Website</span>
            </button>

            <div className="h-5 w-px bg-slate-700 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-black text-white text-xs shadow-xs">
                DS
              </span>
              <div>
                <h1 className="text-sm font-heading font-black text-white flex items-center gap-2">
                  <span>Portal Member DS AQUATICS</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 font-mono">
                    {currentMember?.id || 'MEMBER'}
                  </span>
                </h1>
                <p className="text-[11px] text-cyan-300">
                  {currentMember?.fullName} • {currentMember?.currentLevel || 'Siswa Renang'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser.role === 'admin' && onOpenAdminPanel && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdminPanel();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Panel Admin</span>
              </button>
            )}

            <button
              onClick={onOpenScheduleRequest}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-heading font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-all active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Pengajuan Jadwal</span>
            </button>

            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-2 border-t border-slate-800/80 pt-2 pb-1 text-xs">
          <button
            onClick={() => setActiveTab('ringkasan')}
            className={`px-4 py-2 font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'ringkasan'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ringkasan & Kuota</span>
          </button>

          <button
            onClick={() => setActiveTab('jadwal')}
            className={`px-4 py-2 font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'jadwal'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Jadwal Latihan & Absen ({memberRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rapor')}
            className={`px-4 py-2 font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'rapor'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Rapor Ujian & Kompetensi ({myReports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profil')}
            className={`px-4 py-2 font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'profil'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profil & Data Siswa</span>
          </button>
        </div>
      </header>

      {/* Main Page Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Success Alert */}
        {attendanceSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-top duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{attendanceSuccessMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {attendanceErrorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-top duration-300">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{attendanceErrorMsg}</span>
          </div>
        )}

        {/* Member Profile Banner */}
        <div className="bg-gradient-to-r from-cyan-700 via-sky-700 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-cyan-200 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Dashboard Resmi Siswa DS AQUATICS</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-white flex flex-wrap items-center gap-3">
                <span>{currentMember?.fullName}</span>
                <span className="text-xs px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-mono font-bold">
                  {currentMember?.id}
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/40 text-cyan-100 border border-cyan-300/40 font-medium">
                  {currentMember?.currentLevel}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-cyan-100 mt-2 font-medium">
                Sekolah / Instansi: {currentMember?.school || '-'} • Target Latihan: {currentMember?.goal || 'Kebugaran & Prestasi'}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={onOpenScheduleRequest}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-heading font-bold text-xs sm:text-sm bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-md active:scale-95 transition-all"
              >
                <PlusCircle className="w-4 h-4 text-slate-950" />
                <span>Ajukan Jadwal Baru</span>
              </button>
            </div>
          </div>
        </div>

        {/* Admin Switcher Banner if Coach/Admin is logged in */}
        {currentUser.role === 'admin' && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-amber-300">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-slate-950 shrink-0" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-950">
                  Akun Pelatih / Admin Terdeteksi ({currentUser.name})
                </p>
                <p className="text-xs font-semibold text-slate-900">
                  Anda memiliki hak akses penuh sebagai Pelatih. Masuk ke Panel Admin untuk mengelola jadwal, member, absensi & keuangan.
                </p>
              </div>
            </div>
            {onOpenAdminPanel && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdminPanel();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-heading font-bold text-xs shrink-0 flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Buka Panel Admin Coach</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Papan Pengumuman Pelatih */}
        {settings.announcementIsActive !== false && (settings.announcementContent || settings.announcementTitle) && (
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-100/50 border border-amber-200 shadow-xs relative overflow-hidden">
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-200/70 text-amber-900 text-xs font-black font-heading tracking-wide">
                  <Megaphone className="w-3.5 h-3.5 text-amber-700" />
                  <span>PAPAN PENGUMUMAN PELATIH</span>
                </div>
                {settings.announcementDate && (
                  <span className="text-[11px] font-bold text-amber-900/80 bg-white/80 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {settings.announcementDate}
                  </span>
                )}
              </div>

              <h4 className="font-heading font-black text-slate-900 text-base sm:text-lg mb-2">
                {settings.announcementTitle || 'Informasi Penting Latihan Renang'}
              </h4>

              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium">
                {settings.announcementContent}
              </p>

              <div className="mt-3 pt-3 border-t border-amber-200/70 flex items-center justify-between text-xs text-amber-900 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Coach Dewi Setyaningsih • Pelatih Kepala DS AQUATICS</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: RINGKASAN */}
        {activeTab === 'ringkasan' && (
          <div className="space-y-6">
            {/* Status & Package Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Quota Progress */}
              <div className="p-6 rounded-3xl bg-white border border-cyan-200 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Sisa Kuota Sesi Latihan
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-heading font-black text-slate-900">
                      {currentMember?.attendedSessions}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">
                      / {currentMember?.totalSessionsAllowed} Sesi Selesai
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-semibold">
                    <span>Sisa: {(currentMember?.totalSessionsAllowed || 0) - currentMember.attendedSessions} Sesi</span>
                    <span className="font-bold text-cyan-700">{progressPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Current Package */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Paket Terdaftar
                  </span>
                  <h4 className="text-xl font-heading font-bold text-slate-900 mt-2">
                    {selectedPkg?.title || 'Paket Renang DS'}
                  </h4>
                  <p className="text-xs text-cyan-700 font-semibold mt-1">
                    "{selectedPkg?.subtitle || 'Belajar renang dengan nyaman dan terarah'}"
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Target: {currentMember?.goal}</span>
                </div>
              </div>

              {/* Preferred Schedule & Location */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Jadwal Rutin Siswa
                  </span>
                  <div className="flex items-center gap-2 mt-2 text-base font-bold text-slate-900">
                    <Calendar className="w-4 h-4 text-cyan-600" />
                    <span>{currentMember?.preferredDay}, {currentMember?.preferredTime}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600">
                    <MapPin className="w-4 h-4 text-cyan-600" />
                    <span>{currentMember?.location}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Status Keanggotaan:</span>
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
                    {currentMember?.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Preview of Reports & Schedules */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rapor Ujian Terbaru */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-cyan-600 text-white">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-black text-slate-900 text-base">
                        Rapor Ujian & Kompetensi Terkini
                      </h4>
                      <p className="text-xs text-slate-500">Hasil evaluasi renang berkala siswa</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('rapor')}
                    className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1"
                  >
                    <span>Lihat Semua</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {myReports.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                    Belum ada rapor ujian yang diterbitkan oleh Coach.
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider">
                        {myReports[0].period}
                      </span>
                      <h5 className="font-bold text-slate-900 text-sm mt-0.5">{myReports[0].currentLevel}</h5>
                      <p className="text-xs text-slate-500">Penilai: {myReports[0].coachName}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                        {myReports[0].overallPredicate} ({myReports[0].averageScore})
                      </span>
                      <button
                        onClick={() => setSelectedReport(myReports[0])}
                        className="px-3 py-1 text-xs font-bold rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 shadow-xs"
                      >
                        Buka Rapor
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Pengajuan Jadwal Terbaru */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-cyan-600 text-white">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-black text-slate-900 text-base">
                        Pengajuan Jadwal Terkini
                      </h4>
                      <p className="text-xs text-slate-500">Status jadwal dan verifikasi kehadiran</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('jadwal')}
                    className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1"
                  >
                    <span>Kelola Jadwal</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {memberRequests.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                    Belum ada riwayat jadwal yang diajukan.
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {memberRequests[0].day}, {memberRequests[0].timeRange}
                      </div>
                      <div className="text-[11px] text-slate-500">{memberRequests[0].location}</div>
                    </div>
                    <div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          memberRequests[0].status === 'Disetujui'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : memberRequests[0].status === 'Ditolak'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {memberRequests[0].status}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: JADWAL & PENGAJUAN SESI */}
        {activeTab === 'jadwal' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-heading font-black text-xl text-slate-900 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-cyan-600" />
                  <span>Riwayat Jadwal & Status Persetujuan Pelatih</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Lihat status persetujuan jadwal latihan dari Coach serta lakukan absensi kehadiran mandiri.
                </p>
              </div>
              <button
                onClick={onOpenScheduleRequest}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all w-fit"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Ajukan Jadwal Baru</span>
              </button>
            </div>

            {memberRequests.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-medium text-slate-600">
                  Belum ada riwayat pengajuan jadwal latihan untuk akun Anda.
                </p>
                <button
                  onClick={onOpenScheduleRequest}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 inline-flex items-center gap-1.5 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Ajukan Jadwal Sekarang</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {memberRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      req.status === 'Disetujui'
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : req.status === 'Ditolak'
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-amber-50/30 border-amber-200'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        {req.status === 'Disetujui' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Disetujui oleh Coach</span>
                          </span>
                        ) : req.status === 'Ditolak' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Ditolak</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pending (Menunggu Persetujuan)</span>
                          </span>
                        )}

                        <span className="text-xs font-mono text-slate-400">
                          {req.requestDate}
                        </span>
                      </div>

                      <div className="text-base font-heading font-bold text-slate-900 flex items-center gap-2">
                        <span>{req.day}, {req.timeRange}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600 font-normal">{req.location}</span>
                      </div>

                      {req.adminNotes && (
                        <p className="text-xs text-slate-700 bg-white/90 p-2.5 rounded-xl border border-slate-200 inline-block mt-1">
                          <strong>CATATAN PELATIH:</strong> {req.adminNotes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === 'Disetujui' && (
                        <div>
                          {req.attended ? (
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-xs">
                              <ClipboardCheck className="w-4 h-4" />
                              <span>Sudah Absen Hadir</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSelfAttendance(req)}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-95 transition-all shadow-md"
                              title="Absensi hanya dapat dilakukan 1 kali setelah latihan selesai"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Absen Latihan Sekarang</span>
                            </button>
                          )}
                        </div>
                      )}

                      {req.status === 'Ditolak' && (
                        <button
                          onClick={onOpenScheduleRequest}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 inline-flex items-center gap-1.5 shadow-xs"
                        >
                          <span>Ajukan Jadwal Baru</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RAPOR UJIAN & KOMPETENSI */}
        {activeTab === 'rapor' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-heading font-black text-xl text-slate-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-cyan-600" />
                  <span>Rapor Ujian & Evaluasi Berenang</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Nilai kompetensi, teknik renang, dan catatan evaluasi resmi dari Coach.
                </p>
              </div>
              <span className="text-xs font-bold text-cyan-800 bg-cyan-100 px-3 py-1 rounded-full w-fit">
                {myReports.length} Rapor Diterbitkan
              </span>
            </div>

            {myReports.length === 0 ? (
              <div className="p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-medium text-slate-600">
                  Belum ada rapor ujian yang diterbitkan oleh Coach untuk periode ini.
                </p>
                <p className="text-xs text-slate-400">
                  Rapor akan otomatis muncul di sini begitu Pelatih selesai menginput evaluasi ujian Anda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-4 hover:border-cyan-400 transition-all hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">{rep.period}</span>
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {rep.overallPredicate}
                        </span>
                      </div>
                      <h4 className="font-heading font-bold text-base text-slate-900 mt-2">{rep.currentLevel}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Penilai: {rep.coachName} • {rep.evaluationDate}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="text-xs">
                        <span className="text-slate-400">Rata-rata Nilai: </span>
                        <span className="font-black text-slate-900 text-sm">{rep.averageScore}</span>
                      </div>
                      <button
                        onClick={() => setSelectedReport(rep)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 shadow-xs"
                      >
                        <span>Lihat Rapor</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROFIL & DATA SISWA */}
        {activeTab === 'profil' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-heading font-black text-xl text-slate-900 flex items-center gap-2">
                <User className="w-6 h-6 text-cyan-600" />
                <span>Profil & Data Lengkap Siswa</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Data keanggotaan terdaftar resmi di Club Renang DS AQUATICS Boyolali.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold block">ID Member / Akun</span>
                <span className="text-sm font-mono font-bold text-slate-900">{currentMember?.id}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold block">Nama Lengkap Siswa</span>
                <span className="text-sm font-bold text-slate-900">{currentMember?.fullName}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold block">Jenis Kelamin & Usia/Tgl Lahir</span>
                <span className="text-sm font-semibold text-slate-900">
                  {currentMember?.gender} • {currentMember?.ageOrDob}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold block">Sekolah / Instansi</span>
                <span className="text-sm font-semibold text-slate-900">{currentMember?.school || '-'}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold block">Nomor WhatsApp & Orang Tua</span>
                <span className="text-sm font-semibold text-slate-900">
                  {currentMember?.whatsapp} (Wali: {currentMember?.parentName})
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold block">Alamat Tinggal</span>
                <span className="text-sm font-semibold text-slate-900">{currentMember?.address || '-'}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold block">Tingkat Kemahiran Saat Ini</span>
                <span className="text-sm font-bold text-cyan-700">{currentMember?.currentLevel}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold block">Lokasi & Jadwal Pilihan</span>
                <span className="text-sm font-semibold text-slate-900">
                  {currentMember?.location} ({currentMember?.preferredDay}, {currentMember?.preferredTime})
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-6 px-4 border-t border-slate-800 text-xs text-center no-print space-y-2 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Portal Member Resmi DS AQUATICS Boyolali • Pelatih Kepala Dewi Setyaningsih</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            Kembali ke Beranda Website
          </button>
        </div>
      </footer>

      {/* Modal Detail Rapor Ujian Member */}
      {selectedReport && (
        <div className="fixed inset-0 overflow-y-auto z-60 bg-black/70 backdrop-blur-xs flex items-center-safe justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[11px] font-bold text-cyan-600 uppercase tracking-wider">
                  Rapor Hasil Evaluasi & Ujian Renang
                </span>
                <h4 className="font-heading font-black text-xl text-slate-900">
                  {selectedReport.memberName}
                </h4>
                <p className="text-xs text-slate-500">
                  Periode: {selectedReport.period} • Tanggal: {selectedReport.evaluationDate}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Header info badge */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Tingkat</span>
                <span className="font-bold text-slate-900">{selectedReport.currentLevel}</span>
              </div>
              <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200">
                <span className="text-cyan-700 block text-[10px]">Nilai Rata-rata</span>
                <span className="font-black text-cyan-900 text-base">{selectedReport.averageScore}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-emerald-700 block text-[10px]">Predikat</span>
                <span className="font-bold text-emerald-900">{selectedReport.overallPredicate}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Pelatih Penilai</span>
                <span className="font-bold text-slate-900">{selectedReport.coachName}</span>
              </div>
            </div>

            {/* Table of Grades */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-bold text-slate-700 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Kriteria Penilaian</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3 text-center">Nilai</th>
                    <th className="py-2.5 px-3">Predikat</th>
                    <th className="py-2.5 px-3">Waktu & Catatan Khusus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedReport.grades.map((g, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-900">{g.criterionName}</td>
                      <td className="py-2 px-3 text-slate-500">{g.category}</td>
                      <td className="py-2 px-3 text-center font-bold text-cyan-800">{g.score}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                          {g.predicate}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">
                        {g.timeRecord && (g.timeRecord.hours || g.timeRecord.minutes || g.timeRecord.seconds) ? (
                          <div className="font-mono text-cyan-800 font-semibold mb-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-600" />
                            <span>
                              {g.timeRecord.hours ? `${g.timeRecord.hours}j ` : ''}
                              {g.timeRecord.minutes || 0}m {g.timeRecord.seconds || 0}d
                            </span>
                          </div>
                        ) : null}
                        <span className="italic">{g.notes || '-'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes & Recommendations */}
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Catatan Evaluasi Coach:</span>
                <p className="text-slate-700 leading-relaxed">{selectedReport.coachEvaluation}</p>
              </div>
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-900 block mb-1">Rekomendasi Tahap Berikutnya:</span>
                <p className="text-amber-800 leading-relaxed">{selectedReport.recommendations}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!printSingleRapor(selectedReport, settings)) alert('Jendela cetak diblokir browser. Izinkan pop-up untuk situs ini lalu coba lagi.');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / Simpan PDF</span>
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
              >
                Tutup Rapor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
