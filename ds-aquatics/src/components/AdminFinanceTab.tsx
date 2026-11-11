import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  FileSpreadsheet,
  X,
  Plus,
  Receipt,
  Search,
  Check,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Edit2,
  Trash2,
  BarChart3,
  PieChart,
  ArrowUpRight,
  TrendingDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { monthPeriod } from '../utils/dailyAttendance';
import { ClubInvoice } from '../types';
import { InvoiceHeaderModal } from './InvoiceHeaderModal';
import { ResetFinanceModal } from './ResetFinanceModal';
import { printFinanceReport } from '../utils/reportPrints';
import { exportFinanceXlsx } from '../utils/excelExport';
import { getInvoiceHeader, printElement } from '../utils/printHtml';
import { terbilangRupiah } from '../utils/terbilang';
import { getAllPricelistOptions } from '../data/defaultData';

export const AdminFinanceTab: React.FC = () => {
  const {
    clubInvoices,
    addClubInvoice,
    updateClubInvoice,
    recordInvoicePayment,
    deleteClubInvoice,
    members,
    pricePackages,
    settings,
  } = useApp();
  const [showHeaderModal, setShowHeaderModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const kop = getInvoiceHeader(settings);
  const [excelBusy, setExcelBusy] = useState(false);

  const pricelistOptions = getAllPricelistOptions(pricePackages);

  const [selectedMonth, setSelectedMonth] = useState<string>(monthPeriod());
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Lunas' | 'Menunggu Pembayaran'>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [activeReceipt, setActiveReceipt] = useState<ClubInvoice | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<ClubInvoice | null>(null);
  const [paymentMethodSelect, setPaymentMethodSelect] = useState<string>('Transfer BCA');
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState<boolean>(false);

  // Edit & Delete State
  const [editingInvoice, setEditingInvoice] = useState<ClubInvoice | null>(null);
  const [editFormData, setEditFormData] = useState<{
    amount: number;
    monthPeriod: string;
    dueDate: string;
    packageName: string;
    status: 'Lunas' | 'Menunggu Pembayaran';
    paymentMethod: string;
    notes: string;
  }>({
    amount: 0,
    monthPeriod: '',
    dueDate: '',
    packageName: '',
    status: 'Menunggu Pembayaran',
    paymentMethod: 'Transfer BCA',
    notes: '',
  });
  const [deletingInvoice, setDeletingInvoice] = useState<ClubInvoice | null>(null);
  const [financeToast, setFinanceToast] = useState<string | null>(null);
  const [graphTimeframe, setGraphTimeframe] = useState<'all' | '3m' | 'month'>('all');

  // New Invoice Form State
  const [newMemberId, setNewMemberId] = useState<string>('');
  const [newPackageId, setNewPackageId] = useState<string>('');
  const [newPeriod, setNewPeriod] = useState<string>(monthPeriod());
  const [newDueDate, setNewDueDate] = useState<string>(`10 ${monthPeriod()}`);
  const [newInitialStatus, setNewInitialStatus] = useState<'Menunggu Pembayaran' | 'Lunas'>('Menunggu Pembayaran');
  const [newPaymentMethod, setNewPaymentMethod] = useState<string>('Transfer BCA');

  // Filtered invoices
  const filteredInvoices = (clubInvoices || []).filter((inv) => {
    if (!inv) return false;
    const matchMonth =
      selectedMonth === 'Semua' ||
      (inv.monthPeriod || '').toLowerCase().includes(selectedMonth.toLowerCase());
    const matchStatus = statusFilter === 'Semua' || inv.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchSearch =
      !query ||
      (inv.memberName || '').toLowerCase().includes(query) ||
      (inv.id || '').toLowerCase().includes(query) ||
      (inv.packageName || '').toLowerCase().includes(query);
    return matchMonth && matchStatus && matchSearch;
  });

  const financeScopeLabel = [
    selectedMonth === 'Semua' ? 'Semua Periode' : `Periode ${selectedMonth}`,
    statusFilter !== 'Semua' ? `Status ${statusFilter}` : '',
    searchQuery ? `Pencarian "${searchQuery}"` : '',
  ]
    .filter(Boolean)
    .join(' • ');

  // Financial Metrics
  const currentPeriodInvoices = (clubInvoices || []).filter(
    (inv) =>
      inv &&
      (selectedMonth === 'Semua' ||
        (inv.monthPeriod || '').toLowerCase().includes(selectedMonth.toLowerCase()))
  );

  const totalTagihan = currentPeriodInvoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  const totalLunas = currentPeriodInvoices
    .filter((inv) => inv && inv.status === 'Lunas')
    .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  const totalTunggakan = totalTagihan - totalLunas;
  const kolektibilitas = totalTagihan > 0 ? Math.round((totalLunas / totalTagihan) * 100) : 100;

  const countLunas = currentPeriodInvoices.filter((inv) => inv && inv.status === 'Lunas').length;
  const countTunggakan = currentPeriodInvoices.filter((inv) => inv && inv.status !== 'Lunas').length;

  const handleConfirmPayment = () => {
    if (!payingInvoice) return;
    recordInvoicePayment(payingInvoice.id, paymentMethodSelect);
    setPayingInvoice(null);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const member = members.find((m) => m.id === newMemberId);
    if (!member) {
      setFinanceToast('Pilih member terlebih dahulu!');
      setTimeout(() => setFinanceToast(null), 3000);
      return;
    }

    const opt =
      pricelistOptions.find((o) => o.id === newPackageId) ||
      pricelistOptions.find((o) => o.packageId === newPackageId);
    const packageName = opt ? opt.shortName : 'Paket Reguler 1 Kali Pertemuan';
    const amount = opt ? opt.price : 75000;
    const resolvedPkgId = opt ? opt.packageId : newPackageId || 'pkg-reguler';

    const newInv = addClubInvoice({
      memberId: member.id,
      memberName: member.fullName,
      monthPeriod: newPeriod,
      packageId: resolvedPkgId,
      packageName,
      amount,
      status: newInitialStatus,
      paymentMethod: newInitialStatus === 'Lunas' ? newPaymentMethod : undefined,
      dueDate: newDueDate,
      notes: `Tagihan iuran latihan ${packageName} periode ${newPeriod}`,
    });

    if (newInitialStatus === 'Lunas') {
      recordInvoicePayment(newInv.id, newPaymentMethod);
    }

    setShowNewInvoiceModal(false);
    setFinanceToast(`Tagihan ${newInv.id} untuk ${member.fullName} berhasil diterbitkan.`);
    setTimeout(() => setFinanceToast(null), 3500);
  };

  // Row Edit Handlers
  const handleOpenEdit = (inv: ClubInvoice) => {
    setEditingInvoice(inv);
    setEditFormData({
      amount: inv.amount || 0,
      monthPeriod: inv.monthPeriod || monthPeriod(),
      dueDate: inv.dueDate || `10 ${monthPeriod()}`,
      packageName: inv.packageName || '',
      status: inv.status,
      paymentMethod: inv.paymentMethod || 'Transfer BCA',
      notes: inv.notes || '',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    updateClubInvoice(editingInvoice.id, {
      amount: Number(editFormData.amount),
      monthPeriod: editFormData.monthPeriod,
      dueDate: editFormData.dueDate,
      packageName: editFormData.packageName,
      status: editFormData.status,
      paymentMethod: editFormData.status === 'Lunas' ? editFormData.paymentMethod : undefined,
      notes: editFormData.notes,
    });

    setFinanceToast(`Tagihan ${editingInvoice.id} (${editingInvoice.memberName}) berhasil diperbarui.`);
    setTimeout(() => setFinanceToast(null), 3500);
    setEditingInvoice(null);
  };

  // Row Delete Handler
  const handleConfirmDelete = () => {
    if (!deletingInvoice) return;
    deleteClubInvoice(deletingInvoice.id);
    setFinanceToast(`Tagihan ${deletingInvoice.id} untuk ${deletingInvoice.memberName} telah berhasil dihapus.`);
    setTimeout(() => setFinanceToast(null), 3500);
    setDeletingInvoice(null);
  };

  // Memoized Revenue Graph Data
  const monthlyRevenueData = useMemo(() => {
    // Get unique months in order
    const defaultMonths = [monthPeriod(-2), monthPeriod(-1), monthPeriod()];
    const monthsFound = Array.from(
      new Set(
        (clubInvoices || [])
          .map((inv) => inv && inv.monthPeriod)
          .filter(Boolean) as string[]
      )
    );
    const allMonths = Array.from(new Set([...defaultMonths, ...monthsFound]));

    return allMonths.map((month) => {
      const monthInvoices = (clubInvoices || []).filter(
        (inv) =>
          inv &&
          (inv.monthPeriod || '').toLowerCase() === (month || '').toLowerCase()
      );
      const billed = monthInvoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
      const paid = monthInvoices
        .filter((inv) => inv && inv.status === 'Lunas')
        .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
      const pending = billed - paid;
      const rate = billed > 0 ? Math.round((paid / billed) * 100) : 100;
      const totalAthletes = monthInvoices.length;

      return {
        month,
        billed,
        paid,
        pending,
        rate,
        totalAthletes,
      };
    });
  }, [clubInvoices]);

  // Max billed value for scaling graph bars
  const maxMonthlyBilled = useMemo(() => {
    const maxVal = Math.max(...monthlyRevenueData.map((d) => d.billed), 10000000);
    return maxVal;
  }, [monthlyRevenueData]);

  // Total Lifetime & Annual Metrics for the Chart Header
  const totalLifetimePaid = useMemo(() => {
    return (clubInvoices || [])
      .filter((inv) => inv && inv.status === 'Lunas')
      .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  }, [clubInvoices]);

  const totalLifetimeBilled = useMemo(() => {
    return (clubInvoices || []).reduce((sum, inv) => sum + Number(inv?.amount || 0), 0);
  }, [clubInvoices]);

  // Package distribution breakdown
  const packageBreakdown = useMemo(() => {
    const pkgMap: Record<string, { name: string; amount: number; count: number }> = {};
    (clubInvoices || []).forEach((inv) => {
      if (!inv) return;
      const name = inv.packageName || 'Lainnya';
      if (!pkgMap[name]) {
        pkgMap[name] = { name, amount: 0, count: 0 };
      }
      if (inv.status === 'Lunas') {
        pkgMap[name].amount += Number(inv.amount || 0);
      }
      pkgMap[name].count += 1;
    });
    return Object.values(pkgMap).sort((a, b) => b.amount - a.amount);
  }, [clubInvoices]);

  // Convert number to Indonesian Words (Terbilang Resmi Indonesia)
  const terbilang = (angka: number): string => {
    return terbilangRupiah(angka);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 p-6 rounded-3xl border border-slate-700 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              Keuangan Klub DS Aquatics
            </span>
          </div>
          <h3 className="text-2xl font-heading font-black text-white">
            Administrasi Iuran & Keuangan Klub
          </h3>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
            Manajemen tagihan bulanan / paket latihan resmi, sewa lintasan kolam, dan penerbitan bukti kuitansi digital DS Aquatics Club.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowHeaderModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            <span>Kop Invoice</span>
          </button>
          <button
            onClick={() => {
              if (!printFinanceReport(filteredInvoices, settings, financeScopeLabel)) alert('Jendela cetak diblokir browser. Izinkan pop-up untuk situs ini lalu coba lagi.');
            }}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4 text-cyan-700" />
            <span>Cetak / Simpan PDF</span>
          </button>
          <button
            onClick={async () => {
              setExcelBusy(true);
              try {
                await exportFinanceXlsx(filteredInvoices, settings, financeScopeLabel);
              } catch (err) {
                alert(`Gagal membuat Excel: ${(err as Error).message}`);
              } finally {
                setExcelBusy(false);
              }
            }}
            disabled={excelBusy}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{excelBusy ? 'Membuat Excel…' : 'Ekspor ke Excel'}</span>
          </button>

          <button
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white border border-rose-300 hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Keuangan</span>
          </button>
          <button
            onClick={() => setShowNewInvoiceModal(true)}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Tagihan Baru</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards (Exact match to screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tagihan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Tagihan ({selectedMonth})
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-heading font-black text-slate-900">
              Rp {totalTagihan.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <span>{currentPeriodInvoices.length} Atlet Terdaftar</span>
          </div>
        </div>

        {/* Card 2: Total Pembayaran Masuk (Lunas) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pembayaran Masuk (Lunas)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-heading font-black text-emerald-600">
              Rp {totalLunas.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{countLunas} Atlet Lunas</span>
          </div>
        </div>

        {/* Card 3: Sisa Piutang / Tunggakan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sisa Piutang / Tunggakan
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-heading font-black text-amber-600">
              Rp {totalTunggakan.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{countTunggakan} Belum Terbayar</span>
          </div>
        </div>

        {/* Card 4: Tingkat Kolektibilitas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tingkat Kolektibilitas
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-heading font-black text-purple-600">
              {kolektibilitas}%
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span>Periode Berjalan</span>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {financeToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{financeToast}</span>
          </div>
          <button onClick={() => setFinanceToast(null)} className="text-emerald-200 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Visual Revenue Graph Section (Positioned directly under Administrasi Iuran & Keuangan grid) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Graph Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h4 className="font-heading font-black text-base text-slate-900">
                Visualisasi Grafik Pendapatan & Arus Kas Iuran
              </h4>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Data grafik pendapatan terhubung secara dinamis dan real-time dengan seluruh catatan tagihan serta status pelunasan atlet.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs">
              <span className="text-emerald-700 block text-[10px] uppercase font-bold">Total Kas Masuk (Lunas)</span>
              <span className="font-heading font-black text-emerald-700 text-sm">
                Rp {totalLifetimePaid.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Terbit Tagihan</span>
              <span className="font-heading font-black text-slate-800 text-sm">
                Rp {totalLifetimeBilled.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Chart Body: Grid with Bar Chart & Package Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visual Bar Chart */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700">
                Grafik Batang Perbandingan Realisasi Per Bulan
              </span>
              <div className="flex items-center gap-4 text-[11px] font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block shadow-xs" />
                  <span className="text-slate-600">Pendapatan Masuk (Lunas)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-amber-400 inline-block shadow-xs" />
                  <span className="text-slate-600">Sisa Piutang</span>
                </div>
              </div>
            </div>

            {/* Monthly Bars */}
            <div className="space-y-4 pt-2">
              {monthlyRevenueData.map((item) => {
                const paidWidth = maxMonthlyBilled > 0 ? (item.paid / maxMonthlyBilled) * 100 : 0;
                const pendingWidth = maxMonthlyBilled > 0 ? (item.pending / maxMonthlyBilled) * 100 : 0;

                return (
                  <div
                    key={item.month}
                    className="space-y-2 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-900">{item.month}</span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          • {item.totalAthletes} Atlet
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono flex-wrap">
                        <span className="font-bold text-emerald-600">
                          Rp {item.paid.toLocaleString('id-ID')}
                        </span>
                        {item.pending > 0 && (
                          <span className="text-slate-400 text-[11px]">
                            / Tagihan: Rp {item.billed.toLocaleString('id-ID')}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.rate === 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.rate}% Lunas
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="h-4 w-full bg-slate-200 rounded-lg overflow-hidden flex shadow-inner">
                      <div
                        style={{ width: `${Math.min(100, paidWidth)}%` }}
                        className="bg-emerald-500 hover:bg-emerald-400 transition-all relative group"
                        title={`Lunas: Rp ${item.paid.toLocaleString('id-ID')}`}
                      />
                      <div
                        style={{ width: `${Math.min(100 - paidWidth, pendingWidth)}%` }}
                        className="bg-amber-400 hover:bg-amber-300 transition-all relative group"
                        title={`Tunggakan: Rp ${item.pending.toLocaleString('id-ID')}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Package / Category Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h5 className="font-heading font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-cyan-600" />
              <span>Distribusi Pendapatan Paket</span>
            </h5>
            <div className="divide-y divide-slate-200 text-xs">
              {packageBreakdown.length === 0 ? (
                <div className="py-4 text-center text-slate-400">Belum ada paket</div>
              ) : (
                packageBreakdown.map((pkg) => {
                  const percentage =
                    totalLifetimePaid > 0 ? Math.round((pkg.amount / totalLifetimePaid) * 100) : 0;
                  return (
                    <div key={pkg.name} className="py-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 truncate max-w-[150px]">{pkg.name}</span>
                        <span className="font-mono font-bold text-emerald-600">
                          Rp {pkg.amount.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{pkg.count} invoice tercatat</span>
                        <span className="font-bold text-slate-600">{percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-600 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Sub Header & Filter Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="font-heading font-black text-base text-slate-900">
              Daftar Tagihan Iuran Bulanan Atlet
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Jatuh Tempo: Tanggal 10 Setiap Bulan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari atlet atau nomor invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden w-52"
              />
            </div>

            {/* Filter Status */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold max-w-full">
              {(['Semua', 'Lunas', 'Menunggu Pembayaran'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Month Filter */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
            >
              {Array.from(
                new Set([
                  ...[0, -1, -2, -3, -4, -5].map((o) => monthPeriod(o)),
                  ...(clubInvoices || []).map((inv) => inv && inv.monthPeriod).filter(Boolean),
                ])
              ).map((mp) => (
                <option key={mp as string} value={mp as string}>
                  {mp as string}
                </option>
              ))}
              <option value="Semua">Semua Periode</option>
            </select>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 font-heading font-bold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Invoice</th>
                <th className="py-3 px-4">Nama Atlet</th>
                <th className="py-3 px-4">Periode Bulan</th>
                <th className="py-3 px-4">Jumlah Tagihan (Pricelist)</th>
                <th className="py-3 px-4">Status Bayar</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada data tagihan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isLunas = inv.status === 'Lunas';
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {inv.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {inv.memberName}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          ID: {inv.memberId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {inv.monthPeriod}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {inv.formattedAmount}
                        </div>
                        <div className="text-[11px] text-cyan-700 font-semibold mt-0.5">
                          {inv.packageName}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isLunas ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Lunas ({inv.paymentMethod || 'Transfer'})</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Menunggu Pembayaran</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isLunas ? (
                            <button
                              type="button"
                              onClick={() => setActiveReceipt(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                              title="Lihat Kwitansi Digital"
                            >
                              <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="hidden sm:inline">Kwitansi</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setPayingInvoice(inv);
                                setPaymentMethodSelect('Transfer BCA');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                              title="Catat Pembayaran Masuk"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Bayar</span>
                            </button>
                          )}

                          {/* Edit Row Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(inv)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-cyan-50 text-slate-600 hover:text-cyan-700 transition-colors cursor-pointer border border-slate-200"
                            title="Edit Data Tagihan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Row Button */}
                          <button
                            type="button"
                            onClick={() => setDeletingInvoice(inv)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer border border-slate-200"
                            title="Hapus Data Tagihan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Invoice Confirmation Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 overflow-y-auto z-50 bg-slate-950/70 backdrop-blur-xs flex items-center-safe justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-heading font-black text-lg text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Konfirmasi Pembayaran</span>
              </h4>
              <button
                onClick={() => setPayingInvoice(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor Invoice:</span>
                <span className="font-bold text-slate-900">{payingInvoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Atlet:</span>
                <span className="font-bold text-slate-900">{payingInvoice.memberName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paket Latihan:</span>
                <span className="font-bold text-cyan-700">{payingInvoice.packageName}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black">
                <span className="text-slate-700">Total Biaya:</span>
                <span className="text-emerald-600">{payingInvoice.formattedAmount}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700 block">Metode Pembayaran:</label>
              <select
                value={paymentMethodSelect}
                onChange={(e) => setPaymentMethodSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Transfer BCA">Transfer BCA ({settings.paymentBca})</option>
                <option value="Transfer Mandiri">Transfer Mandiri ({settings.paymentMandiri})</option>
                <option value="QRIS">QRIS Statis DS Aquatics</option>
                <option value="Tunai / Cash">Tunai (Kasir Kolam)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setPayingInvoice(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPayment}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
              >
                Verifikasi & Simpan Lunas
              </button>
            </div>
          </div>
        </div>
      )}

      {showHeaderModal && <InvoiceHeaderModal onClose={() => setShowHeaderModal(false)} />}
      {showResetModal && <ResetFinanceModal currentPeriod={selectedMonth} onClose={() => setShowResetModal(false)} />}

      {/* Kwitansi Digital Resmi DS AQUATICS (Printable Modal) */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center-safe justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-cyan-600" />
                Bukti Pembayaran Digital
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!printElement(document.getElementById('receipt-paper'), `Kuitansi ${activeReceipt.receiptNumber || activeReceipt.id}`))
                      alert('Jendela cetak diblokir browser. Izinkan pop-up untuk situs ini lalu coba lagi.');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  onClick={() => setActiveReceipt(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Receipt Paper */}
            <div id="receipt-paper" className="p-6 rounded-2xl border-2 border-slate-800 bg-amber-50/20 relative overflow-hidden">
              {/* Stamp LUNAS Watermark */}
              <div className="absolute right-12 bottom-16 pointer-events-none select-none rotate-[-18deg] border-4 border-emerald-600 text-emerald-600 font-black px-6 py-2 rounded-xl text-3xl opacity-30 tracking-widest uppercase">
                LUNAS • VERIFIED
              </div>

              {/* Header Letterhead */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  {kop.logoDataUrl ? (
                    <img src={kop.logoDataUrl} alt="Logo" className="w-12 h-12 object-contain rounded-xl bg-white" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-cyan-400 flex items-center justify-center font-heading font-black text-xl">
                      DS
                    </div>
                  )}
                  <div>
                    <h3 className="font-heading font-black text-lg text-slate-900 tracking-tight">{kop.clubName}</h3>
                    <p className="text-[10px] text-slate-600 uppercase font-semibold">{kop.tagline}</p>
                    <p className="text-[10px] text-slate-500">{kop.contactLine}</p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-[10px] text-slate-500 font-sans font-bold uppercase">Kwitansi No:</div>
                  <div className="text-xs font-black text-cyan-800">{activeReceipt.receiptNumber || activeReceipt.id}</div>
                  <div className="text-[10px] text-slate-500 font-sans mt-0.5">{activeReceipt.paidAt || 'Lunas'}</div>
                </div>
              </div>

              {/* Receipt Title */}
              <div className="py-4 text-center">
                <h4 className="font-heading font-black text-base text-slate-900 uppercase tracking-widest underline decoration-cyan-500 decoration-2 underline-offset-4">
                  Kwitansi Pembayaran Resmi
                </h4>
              </div>

              {/* Receipt Content Rows */}
              <div className="space-y-3 text-xs text-slate-800">
                <div className="flex items-start gap-4">
                  <span className="w-36 text-slate-500 shrink-0 font-medium">Telah Diterima Dari :</span>
                  <span className="font-bold text-slate-900 text-sm">{activeReceipt.memberName}</span>
                </div>

                <div className="flex items-start gap-4">
                  <span className="w-36 text-slate-500 shrink-0 font-medium">Uang Sejumlah :</span>
                  <span className="font-bold italic text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 w-full text-xs">
                    "{terbilang(activeReceipt.amount)}"
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  <span className="w-36 text-slate-500 shrink-0 font-medium">Untuk Pembayaran :</span>
                  <div className="font-semibold text-slate-800">
                    Iuran Latihan Renang - <strong>{activeReceipt.packageName}</strong> Periode {activeReceipt.monthPeriod}
                    <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                      Status: Lunas via {activeReceipt.paymentMethod || 'Transfer Rekening Bank'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount Box and Signature */}
              <div className="mt-8 pt-4 border-t border-slate-300 flex items-center justify-between">
                <div className="px-5 py-3 rounded-xl bg-slate-900 text-white font-mono font-black text-lg shadow-inner">
                  {activeReceipt.formattedAmount}
                </div>

                <div className="text-center w-48">
                  <span className="text-[10px] text-slate-500 block">
                    {kop.city}, {activeReceipt.monthPeriod}
                  </span>
                  <div className="h-14 flex items-center justify-center">
                    <span className="font-serif italic text-cyan-800 text-xl font-bold">{kop.signatureText}</span>
                  </div>
                  <div className="border-t border-slate-400 pt-1">
                    <p className="text-[10px] font-bold text-slate-900">{kop.signerName}</p>
                    <p className="text-[9px] text-slate-500">{kop.signerTitle}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buat Tagihan Baru */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 overflow-y-auto z-50 bg-slate-950/70 backdrop-blur-xs flex items-center-safe justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-heading font-black text-lg text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-600" />
                <span>+ Buat Tagihan Iuran Baru</span>
              </h4>
              <button
                onClick={() => setShowNewInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Atlet / Member:</label>
                <select
                  required
                  value={newMemberId}
                  onChange={(e) => setNewMemberId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                >
                  <option value="">-- Pilih Atlet --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.id} - {m.currentLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Paket / Pricelist Resmi:</label>
                <select
                  required
                  value={newPackageId}
                  onChange={(e) => setNewPackageId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                >
                  <option value="">-- Pilih Pricelist --</option>
                  {pricelistOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Periode Bulan:</label>
                  <input
                    type="text"
                    required
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    placeholder="Contoh: September 2026"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jatuh Tempo:</label>
                  <input
                    type="text"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    placeholder="Contoh: 10 September 2026"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Awal:</label>
                  <select
                    value={newInitialStatus}
                    onChange={(e) => setNewInitialStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  >
                    <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
                    <option value="Lunas">Langsung Lunas</option>
                  </select>
                </div>

                {newInitialStatus === 'Lunas' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Metode Bayar:</label>
                    <select
                      value={newPaymentMethod}
                      onChange={(e) => setNewPaymentMethod(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    >
                      <option value="Transfer BCA">Transfer BCA</option>
                      <option value="Transfer Mandiri">Transfer Mandiri</option>
                      <option value="QRIS">QRIS</option>
                      <option value="Tunai / Cash">Tunai / Cash</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  Terbitkan Tagihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Tagihan */}
      {editingInvoice && (
        <div className="fixed inset-0 overflow-y-auto z-50 bg-slate-950/70 backdrop-blur-xs flex items-center-safe justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-black text-base text-slate-900">
                    Edit Data Tagihan Iuran
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    No. Invoice: <span className="font-mono font-bold text-cyan-700">{editingInvoice.id}</span> • {editingInvoice.memberName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingInvoice(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Sesuaikan Cepat dari Pricelist Resmi (Opsional):
                </label>
                <select
                  value=""
                  onChange={(e) => {
                    const chosen = pricelistOptions.find((o) => o.id === e.target.value);
                    if (chosen) {
                      setEditFormData({
                        ...editFormData,
                        packageName: chosen.shortName,
                        amount: chosen.price,
                      });
                    }
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-cyan-300 bg-cyan-50/40 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                >
                  <option value="">-- Pilih Pricelist untuk Mengisi Otomatis --</option>
                  {pricelistOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jumlah Tagihan (Rp):</label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    required
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData({ ...editFormData, amount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Paket Latihan:</label>
                  <input
                    type="text"
                    required
                    value={editFormData.packageName}
                    onChange={(e) => setEditFormData({ ...editFormData, packageName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Periode Bulan:</label>
                  <input
                    type="text"
                    required
                    value={editFormData.monthPeriod}
                    onChange={(e) => setEditFormData({ ...editFormData, monthPeriod: e.target.value })}
                    placeholder="Contoh: September 2026"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jatuh Tempo:</label>
                  <input
                    type="text"
                    required
                    value={editFormData.dueDate}
                    onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                    placeholder="Contoh: 10 September 2026"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Pembayaran:</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  >
                    <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </div>

                {editFormData.status === 'Lunas' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Metode Bayar:</label>
                    <select
                      value={editFormData.paymentMethod}
                      onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    >
                      <option value="Transfer BCA">Transfer BCA</option>
                      <option value="Transfer Mandiri">Transfer Mandiri</option>
                      <option value="QRIS">QRIS</option>
                      <option value="Tunai / Cash">Tunai / Cash</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Tagihan:</label>
                <input
                  type="text"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Catatan tambahan tagihan..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus Tagihan */}
      {deletingInvoice && (
        <div className="fixed inset-0 overflow-y-auto z-50 bg-slate-950/70 backdrop-blur-xs flex items-center-safe justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-black text-base text-slate-900">
                  Hapus Data Tagihan?
                </h4>
                <p className="text-xs text-slate-500">
                  Konfirmasi penghapusan catatan invoice keuangan klub.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Invoice:</span>
                <span className="font-mono font-bold text-slate-900">{deletingInvoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Atlet:</span>
                <span className="font-bold text-slate-900">{deletingInvoice.memberName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Periode:</span>
                <span className="font-semibold text-slate-800">{deletingInvoice.monthPeriod}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black">
                <span className="text-slate-700">Jumlah:</span>
                <span className="text-rose-600">{deletingInvoice.formattedAmount}</span>
              </div>
            </div>

            <p className="text-[11px] text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
              Perhatian: Data tagihan akan dihapus permanen dan seluruh grafik pendapatan bulanan akan langsung terbarukan.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingInvoice(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
              >
                Hapus Tagihan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
