import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CreditCard,
  Award,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Timer,
  ChevronRight,
  Flame,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { printDashboardReport, DashboardSnapshot } from '../utils/reportPrints';
import { exportDashboardXlsx } from '../utils/excelExport';
import { Printer, FileSpreadsheet } from 'lucide-react';
import { useDailyAttendance, setDailyAttendance, todayLocal, formatDateId, DailyStatus, monthPeriod } from '../utils/dailyAttendance';

interface AdminDashboardTabProps {
  onNavigateTab: (tabKey: any) => void;
  onOpenStopwatchModal: () => void;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  onNavigateTab,
  onOpenStopwatchModal,
}) => {
  const {
    members,
    updateMember,
    clubInvoices,
    scheduleSlots,
    scheduleRequests,
    reviewScheduleRequest,
    memberReports,
    settings,
  } = useApp();

  // Metrics with safe fallbacks
  const activeMembers = (members || []).filter((m) => m && m.status === 'Aktif');
  const totalActiveAthletes = activeMembers.length;
  const prestasiAthletes = activeMembers.filter((m) => m.squad && m.squad.includes('Prestasi')).length;

  const today = todayLocal();
  const { records: todayRecords } = useDailyAttendance(today);
  const countHadir = activeMembers.filter((m) => todayRecords[m.id]?.status === 'Hadir').length;
  const countIzinSakit = activeMembers.filter(
    (m) => todayRecords[m.id]?.status === 'Izin' || todayRecords[m.id]?.status === 'Sakit'
  ).length;
  const quickSet = (m: (typeof activeMembers)[number], status: DailyStatus) => {
    const prev = todayRecords[m.id];
    setDailyAttendance({ member: m, date: today, status: prev?.status === status ? null : status, prev });
  };
  const todayAttendanceRate = totalActiveAthletes > 0 ? Math.round((countHadir / totalActiveAthletes) * 100) : 0;

  // Invoices for current month - safe guard for monthPeriod
  const currentMonthInvoices = (clubInvoices || []).filter((inv) =>
    inv && (inv.monthPeriod || '').toLowerCase() === monthPeriod().toLowerCase()
  );
  const totalBilled = currentMonthInvoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  const totalPaid = currentMonthInvoices
    .filter((inv) => inv && inv.status === 'Lunas')
    .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 100;

  // Pending requests (case-insensitive & null-safe)
  const pendingRequests = (scheduleRequests || []).filter((r) => {
    if (!r) return false;
    const raw = (r.status || 'pending').toLowerCase();
    return raw === 'pending';
  });

  const [excelBusy, setExcelBusy] = useState(false);
  const latestReport = [...(memberReports || [])].sort((a, b) => (a.evaluationDate < b.evaluationDate ? 1 : -1))[0];
  const snapshot = (): DashboardSnapshot => ({
    dateLabel: formatDateId(today),
    monthLabel: monthPeriod(),
    activeMembers,
    todayStatus: Object.fromEntries(activeMembers.map((m) => [m.id, todayRecords[m.id]?.status])),
    monthInvoices: currentMonthInvoices,
    reportsCount: (memberReports || []).length,
    latestReportPeriod: latestReport?.period || '',
    pendingRequests: pendingRequests.length,
  });

  return (
    <div className="space-y-6">
      {/* Welcome & Command Bar Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 p-6 rounded-3xl border border-slate-700 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Overview Eksekutif Klub
            </span>
          </div>
          <h2 className="text-2xl font-heading font-black text-white">
            Dashboard Ringkasan Operasional & Prestasi Klub
          </h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
            Ringkasan metrik klub renang DS Aquatics: status atlet, jadwal latihan mingguan, persentase kehadiran, dan performa keuangan terkini.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenStopwatchModal}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Timer className="w-4 h-4" />
            <span>Mulai Stopwatch Pool</span>
          </button>

          <button
            onClick={() => onNavigateTab('absensi')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-400" />
            <span>Input Presensi</span>
          </button>

          <button
            onClick={() => {
              if (!printDashboardReport(snapshot(), settings)) alert('Jendela cetak diblokir browser. Izinkan pop-up untuk situs ini lalu coba lagi.');
            }}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4 text-cyan-700" />
            <span>Cetak / Simpan PDF</span>
          </button>
          <button
            onClick={async () => {
              setExcelBusy(true);
              try {
                await exportDashboardXlsx(snapshot(), settings);
              } catch (err) {
                alert(`Gagal membuat Excel: ${(err as Error).message}`);
              } finally {
                setExcelBusy(false);
              }
            }}
            disabled={excelBusy}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{excelBusy ? 'Membuat Excel…' : 'Ekspor ke Excel'}</span>
          </button>
        </div>
      </div>

      {/* Top 4 Key Metric Cards (Matching reference screenshot 2026-09-23_153724.png) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Atlet */}
        <div
          onClick={() => onNavigateTab('database_member')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Atlet Terdaftar
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-black text-slate-900">
              {totalActiveAthletes}
            </span>
            <span className="text-xs font-semibold text-slate-500">Atlet Aktif</span>
          </div>
          <div className="mt-2 text-xs font-medium text-cyan-700 font-semibold flex items-center justify-between">
            <span>{prestasiAthletes} Skuad Prestasi Utama</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Metric 2: Presensi Sesi */}
        <div
          onClick={() => onNavigateTab('absensi')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Presensi Sesi Hari Ini
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-black text-emerald-600">
              {todayAttendanceRate}%
            </span>
            <span className="text-xs font-semibold text-slate-500">Hadir di Kolam</span>
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>{countHadir} Hadir, {countIzinSakit} Izin/Sakit</span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
          </div>
        </div>

        {/* Metric 3: Kolektibilitas Iuran */}
        <div
          onClick={() => onNavigateTab('keuangan')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kolektibilitas Iuran Bulanan
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-black text-purple-600">
              {collectionRate}%
            </span>
            <span className="text-xs font-semibold text-slate-500">{monthPeriod()}</span>
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500 flex items-center justify-between">
            <span className="text-emerald-600 font-bold">
              Rp {totalPaid.toLocaleString('id-ID')} Lunas
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-purple-600" />
          </div>
        </div>

        {/* Metric 4: Rapor & Prestasi */}
        <div
          onClick={() => onNavigateTab('rapor')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rapor & Evaluasi Atlet
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-black text-slate-900">
              {memberReports.length}
            </span>
            <span className="text-xs font-semibold text-slate-500">Rapor Terbit</span>
          </div>
          <div className="mt-2 text-xs font-medium text-amber-700 font-semibold flex items-center justify-between">
            <span>Triwulan III / 2026</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Presensi Hari Ini & Personal Best Atlet */}
        <div className="lg:col-span-2 space-y-6">
          {/* Widget 1: Presensi Atlet Hari Ini */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-heading font-black text-base text-slate-900 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                  <span>Status Kehadiran Hari Ini (Sesi Sore)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kolam Lestarindo & Front One Adria • {formatDateId(today)}
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('absensi')}
                className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Kelola Presensi Lengkap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {activeMembers.map((m) => {
                const status = todayRecords[m.id]?.status;
                return (
                  <div key={m.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {m.photoUrl ? (
                        <img
                          src={m.photoUrl}
                          alt={m.fullName || 'Member'}
                          className="w-10 h-10 rounded-full object-cover border border-slate-300 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-cyan-400 font-black text-xs flex items-center justify-center shrink-0">
                          {(m.fullName || 'A').charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{m.fullName || 'Member'}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="font-mono text-cyan-700">{m.id}</span>
                          <span>•</span>
                          <span>{m.squad || 'Skuad Prestasi'}</span>
                          <span>•</span>
                          <span className="text-slate-400">{m.attendedSessions || 0}/{m.totalSessionsAllowed || 12} Sesi</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => quickSet(m, 'Hadir')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          status === 'Hadir'
                            ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-500'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                        title="Tandai Hadir"
                      >
                        ✓ Hadir
                      </button>
                      <button
                        type="button"
                        onClick={() => quickSet(m, 'Izin')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          status === 'Izin'
                            ? 'bg-amber-500 text-white shadow-xs ring-1 ring-amber-400'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                        title="Tandai Izin"
                      >
                        Izin
                      </button>
                      <button
                        type="button"
                        onClick={() => quickSet(m, 'Sakit')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          status === 'Sakit'
                            ? 'bg-rose-500 text-white shadow-xs ring-1 ring-rose-400'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                        title="Tandai Sakit"
                      >
                        Sakit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Widget 2: Rekor Personal Best (PB) Atlet */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-heading font-black text-base text-slate-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <span>Catatan Rekor Waktu Terbaik (Personal Best) Atlet</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rekor waktu resmi atlet dalam sesi simulasi time trial & kejuaraan KRAP
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('database_member')}
                className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Semua Atlet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeMembers.flatMap((m) =>
                (m.personalBests || []).slice(0, 1).map((pb, i) => (
                  <div
                    key={`${m.id}-${i}`}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-cyan-400 transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs truncate max-w-[140px]">
                        {m.fullName}
                      </span>
                      <span className="font-mono text-cyan-700 font-black text-sm bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {pb.time}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-semibold flex items-center justify-between">
                      <span>{pb.event}</span>
                      <span className="text-[10px] text-slate-400">{pb.meetName || 'Time Trial'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Keuangan, Jadwal Latihan & Request */}
        <div className="space-y-6">
          {/* Widget 3: Ringkasan Tagihan & Keuangan */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-heading font-black text-base text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-600" />
                <span>Iuran Periode Ini</span>
              </h4>
              <button
                onClick={() => onNavigateTab('keuangan')}
                className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Detail</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Terkumpul:</span>
                  <span className="font-bold text-emerald-600">Rp {totalPaid.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Total Tagihan:</span>
                  <span className="font-bold text-slate-800">Rp {totalBilled.toLocaleString('id-ID')}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 text-right">
                  Kolektibilitas: <strong className="text-slate-700">{collectionRate}%</strong>
                </div>
              </div>

              {/* Invoices status overview */}
              <div className="space-y-2 text-xs">
                {currentMonthInvoices.slice(0, 3).map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{inv.memberName}</div>
                      <div className="text-[10px] text-slate-400">{inv.packageName}</div>
                    </div>
                    {inv.status === 'Lunas' ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        ✓ Lunas
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                        ⏳ Menunggu
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Widget 4: Permintaan Jadwal Member Pending */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-heading font-black text-base text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                <span>Permintaan Jadwal Baru</span>
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                {pendingRequests.length} Baru
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Tidak ada permintaan jadwal yang tertunda.
              </p>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-1.5 text-xs"
                  >
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{req.memberName}</span>
                      <span className="text-[10px] text-amber-700">{req.day}, {req.timeRange}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">{req.location}</div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => reviewScheduleRequest(req.id, 'Disetujui')}
                        className="flex-1 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors cursor-pointer text-center"
                        title="Setujui jadwal ini langsung"
                      >
                        ✓ Setujui
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigateTab('validasi')}
                        className="flex-1 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-colors cursor-pointer text-center"
                        title="Buka halaman validasi pengajuan"
                      >
                        Validasi →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
