import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MemberAccount } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import {
  Users,
  UserPlus,
  Search,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit2,
  Trash2,
  Share2,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Lock,
} from 'lucide-react';
import { exportMemberAccountsToGoogleSheets } from '../utils/googleWorkspace';

export const AdminMemberAccountsTab: React.FC = () => {
  const {
    memberAccounts,
    addMemberAccount,
    updateMemberAccount,
    deleteMemberAccount,
    members,
    settings,
  } = useApp();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Aktif' | 'Nonaktif'>('all');

  // Password visibility map (acc.id -> boolean)
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State: Tambah & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<MemberAccount | null>(null);

  // Form fields
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('renang123');
  const [whatsapp, setWhatsapp] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [notes, setNotes] = useState('');
  const [showPasswordInModal, setShowPasswordInModal] = useState(true);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    url?: string;
  } | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<MemberAccount | null>(null);

  // Toggle password visibility in list
  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy password to clipboard
  const handleCopyPassword = (id: string, pass: string) => {
    copyToClipboard(pass);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingAccount(null);
    setSelectedMemberId('');
    setFullName('');
    setEmail('');
    setPassword('renang123');
    setWhatsapp('');
    setStatus('Aktif');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (acc: MemberAccount) => {
    setEditingAccount(acc);
    setSelectedMemberId(acc.memberId || '');
    setFullName(acc.fullName);
    setEmail(acc.email);
    setPassword(acc.password);
    setWhatsapp(acc.whatsapp || '');
    setStatus(acc.status);
    setNotes(acc.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // When admin selects an existing member from dropdown, autofill name & email & WA
  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    if (!memberId) return;
    const found = members.find((m) => m.id === memberId);
    if (found) {
      if (!fullName) setFullName(found.fullName);
      if (!email && found.email) setEmail(found.email);
      if (!whatsapp && found.whatsapp) setWhatsapp(found.whatsapp);
    }
  };

  // Generate random strong password
  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let res = 'ds-';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  // Save Account (Create / Update)
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const cleanEmail = email.trim().toLowerCase();

    if (!fullName.trim() || !cleanEmail) {
      setFormError('Nama lengkap dan alamat email wajib diisi!');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setFormError('Format alamat email tidak valid!');
      return;
    }

    if (!password.trim()) {
      setFormError('Password / kata sandi akun tidak boleh kosong!');
      return;
    }

    if (password.trim().length < 6) {
      setFormError('Password minimal 6 karakter (syarat Firebase Authentication).');
      return;
    }

    // Check duplicate email
    const duplicate = memberAccounts.find(
      (a) => a.email.toLowerCase() === cleanEmail && a.id !== editingAccount?.id
    );
    if (duplicate) {
      setFormError(`Alamat email ${cleanEmail} sudah digunakan oleh akun "${duplicate.fullName}". Silakan gunakan email lain.`);
      return;
    }

    if (editingAccount) {
      updateMemberAccount(editingAccount.id, {
        memberId: selectedMemberId || undefined,
        fullName: fullName.trim(),
        email: cleanEmail,
        password: password.trim(),
        whatsapp: whatsapp.trim(),
        status,
        notes: notes.trim(),
      });
    } else {
      addMemberAccount({
        memberId: selectedMemberId || undefined,
        fullName: fullName.trim(),
        email: cleanEmail,
        password: password.trim(),
        whatsapp: whatsapp.trim(),
        status,
        notes: notes.trim(),
      });
    }

    setIsModalOpen(false);
  };

  // Share credentials via WhatsApp
  const handleShareViaWA = (acc: MemberAccount) => {
    const waNumber = (acc.whatsapp || '').replace(/[^0-9]/g, '');
    const cleanPhone = waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber;

    const message = `Halo Kak ${acc.fullName}! 👋\n\nBerikut adalah akun login resmi Anda di Portal Siswa ${settings.clubName}:\n\n` +
      `🌐 Link Login: ${window.location.origin}\n` +
      `📧 Username (Email): *${acc.email}*\n` +
      `🔑 Password Akun: *${acc.password}*\n` +
      `👤 ID Member: *${acc.memberId || '-'}*\n\n` +
      `Gunakan akun ini untuk melihat jadwal renang, absensi kehadiran, dan rapor ujian siswa. Harap simpan informasi akun ini dengan baik.\n\n` +
      `Salam hangat,\n*Tim Pelatih ${settings.clubName}*`;

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Google Sheets
  const handleExportGoogleSheets = async () => {
    setIsExporting(true);
    setExportFeedback(null);
    try {
      const res = await exportMemberAccountsToGoogleSheets(memberAccounts, settings.clubName);
      if (res.success && res.spreadsheetUrl) {
        setExportFeedback({
          type: 'success',
          message: 'Berhasil diexport ke Google Sheets!',
          url: res.spreadsheetUrl,
        });
      }
    } catch (err: any) {
      setExportFeedback({
        type: 'error',
        message: err.message || 'Gagal export ke Google Sheets. Periksa izin akun Google Anda.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Download CSV fallback
  const handleDownloadCSV = () => {
    const headers = ['ID Akun', 'ID Member', 'Nama Lengkap', 'Email (Username)', 'Password', 'WhatsApp', 'Status', 'Dibuat Pada', 'Catatan'];
    const rows = memberAccounts.map((a) => [
      `"${a.id}"`,
      `"${a.memberId || ''}"`,
      `"${a.fullName.replace(/"/g, '""')}"`,
      `"${a.email}"`,
      `"${a.password.replace(/"/g, '""')}"`,
      `"${a.whatsapp || ''}"`,
      `"${a.status}"`,
      `"${a.createdAt || ''}"`,
      `"${(a.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DS_AQUATICS_Akun_Member_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Accounts
  const filteredAccounts = memberAccounts.filter((a) => {
    const matchesSearch =
      a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.whatsapp && a.whatsapp.includes(searchTerm)) ||
      (a.memberId && a.memberId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = memberAccounts.filter((a) => a.status === 'Aktif').length;
  const nonactiveCount = memberAccounts.length - activeCount;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-600 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-cyan-600" />
            <span>Pengaturan Kredensial & Hak Akses Portal</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-heading font-black text-slate-900">
            Manajemen Akun Member
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Kelola data akun member resmi. Akun menggunakan <strong>alamat email sebagai username</strong> dengan <strong>password kustom</strong> yang dapat disetel dan dibagikan langsung via WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportGoogleSheets}
            disabled={isExporting}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Sinkronisasi / Export ke Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExporting ? 'Mengekspor...' : 'Export Google Sheets'}</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download cadangan data CSV"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Akun Baru</span>
          </button>
        </div>
      </div>

      {/* Export Feedback Banner */}
      {exportFeedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold border animate-in fade-in ${
            exportFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {exportFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{exportFeedback.message}</span>
          </div>
          {exportFeedback.url && (
            <a
              href={exportFeedback.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shrink-0"
            >
              Buka Google Sheet ↗
            </a>
          )}
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Akun Member</span>
            <div className="text-2xl font-heading font-black text-slate-900">
              {memberAccounts.length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Akun Status Aktif</span>
            <div className="text-2xl font-heading font-black text-emerald-600">
              {activeCount}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Akun Nonaktif</span>
            <div className="text-2xl font-heading font-black text-amber-600">
              {nonactiveCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, email username, atau WA member..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            {(['all', 'Aktif', 'Nonaktif'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === s
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'all' ? 'Semua' : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accounts Table List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Member & ID</th>
                <th className="py-3.5 px-4">Username (Email)</th>
                <th className="py-3.5 px-4">Password Kustom</th>
                <th className="py-3.5 px-4">No. WhatsApp</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold">Tidak ada akun member yang sesuai filter.</p>
                    <p className="text-xs text-slate-400 mt-0.5">Klik tombol "Tambah Akun Baru" untuk mendaftarkan akun login.</p>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => {
                  const isPassVisible = !!showPasswordMap[acc.id];
                  const isCopied = copiedId === acc.id;

                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {acc.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong className="text-slate-900 block font-heading font-bold">
                              {acc.fullName}
                            </strong>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {acc.memberId && (
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900">
                                  {acc.memberId}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono">
                                {acc.id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                          <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                            {acc.email}
                          </span>
                        </div>
                        <div className="mt-1 text-[10px] font-semibold">
                          {acc.authSyncError ? (
                            <span className="text-rose-600" title={acc.authSyncError}>
                              ⚠ Login belum aktif: {acc.authSyncError}
                            </span>
                          ) : acc.authUid ? (
                            <span className="text-emerald-600">✓ Login Firebase aktif</span>
                          ) : (
                            <span className="text-amber-600">⏳ Menyinkronkan login…</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-mono text-xs text-slate-900 select-all font-semibold">
                            {isPassVisible ? acc.password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(acc.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            title={isPassVisible ? 'Sembunyikan password' : 'Lihat password'}
                          >
                            {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyPassword(acc.id, acc.password)}
                            className="p-1 text-slate-400 hover:text-cyan-700 transition-colors cursor-pointer"
                            title="Salin password"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {acc.whatsapp ? (
                          <span className="text-slate-700 font-mono text-xs">
                            {acc.whatsapp}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            acc.status === 'Aktif'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {acc.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleShareViaWA(acc)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Bagikan username & password ke WhatsApp member"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(acc)}
                            className="p-1.5 rounded-lg text-cyan-600 hover:bg-cyan-50 transition-colors cursor-pointer"
                            title="Edit akun"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setAccountToDelete(acc)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus akun"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Modal: Input / Edit Akun Member */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center-safe justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-6 animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-cyan-600 to-blue-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-300" />
                <h4 className="font-heading font-bold text-lg text-white">
                  {editingAccount ? 'Edit Akun Member' : 'Input Akun Member Baru'}
                </h4>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-6 space-y-4 text-xs sm:text-sm">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Hubungkan dengan Data Member Terdaftar */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Hubungkan dengan Siswa Renang (Opsional):
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => handleSelectMember(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                >
                  <option value="">-- Buat Akun Lepas / Pilih Member Terdaftar --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id} - {m.fullName} ({m.email || 'belum ada email'})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pilih member untuk mengisi otomatis nama, email, dan nomor WhatsApp.
                </p>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Member <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Fatih Al-Ghifari"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                />
              </div>

              {/* Alamat Email (Username Login) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alamat Email (Sebagai Username Login) <span className="text-rose-500">*</span>:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama.member@gmail.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Member menggunakan alamat email ini untuk login ke Panel Member.
                </p>
              </div>

              {/* Password Kustom */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Password / Kata Sandi Kustom <span className="text-rose-500">*</span>:
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPassword('renang123')}
                      className="text-cyan-700 hover:underline font-semibold cursor-pointer"
                    >
                      Default: renang123
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-cyan-700 hover:underline font-semibold cursor-pointer"
                    >
                      Acak Sandi
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPasswordInModal ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi kustom..."
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPasswordInModal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Password dapat diketik kustom sesuai permintaan wali murid/member.
                </p>
              </div>

              {/* Nomor WhatsApp */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor WhatsApp Member:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="0812-3456-7890"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-mono"
                  />
                </div>
              </div>

              {/* Status Akun */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Status Akun:
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                >
                  <option value="Aktif">Aktif (Dapat Login ke Portal)</option>
                  <option value="Nonaktif">Nonaktif (Login Diblokir)</option>
                </select>
              </div>

              {/* Catatan Akun */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Admin (Opsional):
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan tambahan seputar akun member..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingAccount ? 'Perbarui Akun' : 'Simpan Akun Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center-safe justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-heading font-black text-slate-900 text-lg">
                Hapus Akun Member?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus akun login untuk <strong>{accountToDelete.fullName}</strong> ({accountToDelete.email})? Member tidak akan dapat login lagi menggunakan akun ini.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteMemberAccount(accountToDelete.id);
                  setAccountToDelete(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
