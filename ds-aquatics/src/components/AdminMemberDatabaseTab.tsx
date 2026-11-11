import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Camera,
  Upload,
  X,
  Phone,
  Calendar,
  Award,
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle2,
  ShieldCheck,
  User,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Download,
  FileSpreadsheet,
  ExternalLink,
  Filter,
  Copy,
  Check,
  MessageCircle,
  Timer,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Member, MemberPersonalBest, DayOfWeek } from '../types';
import { DAYS_OF_WEEK, getAllPricelistOptions } from '../data/defaultData';
import { ImportMembersModal } from './ImportMembersModal';
import { exportMembersXlsx } from '../utils/excelExport';
import { copyToClipboard } from '../utils/clipboard';

interface AdminMemberDatabaseTabProps {
  onNavigateToRapor?: (memberId: string) => void;
}

export const AdminMemberDatabaseTab: React.FC<AdminMemberDatabaseTabProps> = ({
  onNavigateToRapor,
}) => {
  const { members, addMember, updateMember, deleteMember, pricePackages, settings } = useApp();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'Semua' | 'Pemula' | 'Menengah' | 'Lanjutan'>('Semua');
  const [genderFilter, setGenderFilter] = useState<'Semua' | 'Laki-laki' | 'Perempuan'>('Semua');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [locationFilter, setLocationFilter] = useState<string>('Semua');

  // Copy WhatsApp state & handler
  const [copiedWaId, setCopiedWaId] = useState<string | null>(null);

  const handleCopyWa = (id: string, waText: string) => {
    copyToClipboard(waText);
    setCopiedWaId(id);
    setTimeout(() => {
      setCopiedWaId(null);
    }, 2000);
  };

  // View Mode: Grid (Kartu Profil) vs Table (Tabel Spreadsheet)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [ageOrDob, setAgeOrDob] = useState('');
  const [school, setSchool] = useState('');
  const [parentName, setParentName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [currentLevel, setCurrentLevel] = useState<'Pemula' | 'Menengah' | 'Lanjutan'>('Menengah');
  const [location, setLocation] = useState('Lestarindo Sport Garden Boyolali');
  const [status, setStatus] = useState<Member['status']>('Aktif');
  const [totalSessionsAllowed, setTotalSessionsAllowed] = useState(12);
  const [attendedSessions, setAttendedSessions] = useState(0);
  // Paket & jadwal latihan
  const pricelistOptions = getAllPricelistOptions(pricePackages);
  const [showImportModal, setShowImportModal] = useState(false);
  const [excelBusy, setExcelBusy] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [preferredDay, setPreferredDay] = useState<DayOfWeek>('Sabtu');
  const [preferredTime, setPreferredTime] = useState('08:00 - 09:00');
  const selectedOption = pricelistOptions.find((o) => o.id === selectedOptionId);
  const handleSelectOption = (optionId: string) => {
    setSelectedOptionId(optionId);
    const opt = pricelistOptions.find((o) => o.id === optionId);
    if (opt) setTotalSessionsAllowed(opt.sessionsCount);
  };
  const [photoUrl, setPhotoUrl] = useState('');
  const [personalBests, setPersonalBests] = useState<MemberPersonalBest[]>([]);

  // PB quick inputs
  const [newPbEvent, setNewPbEvent] = useState('50m Gaya Bebas');
  const [newPbTime, setNewPbTime] = useState('00:26.50');
  const [newPbMeet, setNewPbMeet] = useState('Simulasi Waktu Time Trial');

  // Custom Toast & Deletion Modal states
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<{ id: string; name: string } | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<{ id: string; name: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered members
  const filteredMembers = (members || []).filter((m) => {
    if (!m) return false;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      (m.fullName || '').toLowerCase().includes(q) ||
      (m.id || '').toLowerCase().includes(q) ||
      (m.school && m.school.toLowerCase().includes(q)) ||
      (m.parentName && m.parentName.toLowerCase().includes(q)) ||
      (m.whatsapp && m.whatsapp.includes(searchQuery));

    const matchLevel =
      levelFilter === 'Semua' ||
      (m.currentLevel && m.currentLevel.toLowerCase().includes(levelFilter.toLowerCase()));

    const matchGender = genderFilter === 'Semua' || m.gender === genderFilter;
    const matchStatus = statusFilter === 'Semua' || m.status === statusFilter;
    const matchLocation =
      locationFilter === 'Semua' || (m.location && m.location.includes(locationFilter));

    return matchSearch && matchLevel && matchGender && matchStatus && matchLocation;
  });

  // Summary Metrics based on Level: Pemula, Menengah, Lanjutan
  const totalActive = (members || []).filter((m) => m && m.status === 'Aktif').length;
  const countPemula = (members || []).filter((m) => m && (m.currentLevel || '').toLowerCase().includes('pemula')).length;
  const countMenengah = (members || []).filter((m) => m && (m.currentLevel || '').toLowerCase().includes('menengah')).length;
  const countLanjutan = (members || []).filter(
    (m) =>
      m &&
      ((m.currentLevel || '').toLowerCase().includes('lanjutan') ||
        (m.currentLevel || '').toLowerCase().includes('prestasi'))
  ).length;

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      showToast('Ukuran foto terlalu besar. Maksimal 4MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setPhotoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Remove photo
  const handleRemovePhoto = () => {
    setPhotoUrl('');
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingMemberId(null);
    setFullName('');
    setGender('Laki-laki');
    setAgeOrDob('12 Tahun');
    setSchool('SD / SMP Boyolali');
    setParentName('');
    setWhatsapp('0812-');
    setEmail('');
    setAddress('Boyolali');
    setCurrentLevel('Pemula');
    setLocation('Lestarindo Sport Garden Boyolali');
    setStatus('Aktif');
    const defaultOpt =
      pricelistOptions.find((o) => o.packageId === 'pkg-reguler' && o.sessionsCount === 4) || pricelistOptions[0];
    setSelectedOptionId(defaultOpt?.id || '');
    setTotalSessionsAllowed(defaultOpt?.sessionsCount || 4);
    setPreferredDay('Sabtu');
    setPreferredTime('08:00 - 09:00');
    setAttendedSessions(0);
    setPhotoUrl('');
    setPersonalBests([]);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (m: Member) => {
    setEditingMemberId(m.id);
    setFullName(m.fullName);
    setGender(m.gender);
    setAgeOrDob(m.ageOrDob);
    setSchool(m.school || '');
    setParentName(m.parentName || '');
    setWhatsapp(m.whatsapp);
    setEmail(m.email || '');
    setAddress(m.address || '');

    // Normalize level to Pemula, Menengah, or Lanjutan
    const lvlLower = (m.currentLevel || '').toLowerCase();
    if (lvlLower.includes('pemula')) {
      setCurrentLevel('Pemula');
    } else if (lvlLower.includes('menengah')) {
      setCurrentLevel('Menengah');
    } else {
      setCurrentLevel('Lanjutan');
    }

    setLocation(m.location);
    setStatus(m.status);
    setTotalSessionsAllowed(m.totalSessionsAllowed || 12);
    setAttendedSessions(m.attendedSessions || 0);
    const pkgOpts = pricelistOptions.filter((o) => o.packageId === m.selectedPackageId);
    const matchOpt = pkgOpts.find((o) => o.sessionsCount === m.totalSessionsAllowed) || pkgOpts[0];
    setSelectedOptionId(matchOpt?.id || '');
    setPreferredDay((m.preferredDay as DayOfWeek) || 'Sabtu');
    setPreferredTime(m.preferredTime || '08:00 - 09:00');
    setPhotoUrl(m.photoUrl || '');
    setPersonalBests(m.personalBests || []);
    setIsModalOpen(true);
  };

  // Quick photo edit trigger on card
  const handleDirectPhotoChange = (memberId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      showToast('Ukuran foto terlalu besar. Maksimal 4MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      updateMember(memberId, { photoUrl: result });
      showToast('Foto profil atlet berhasil diperbarui!');
    };
    reader.readAsDataURL(file);
  };

  // Quick photo remove
  const handleDirectPhotoRemove = (memberId: string, memberName: string) => {
    setPhotoToDelete({ id: memberId, name: memberName });
  };

  // Save member
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Nama member wajib diisi!', 'error');
      return;
    }

    const calcRate =
      totalSessionsAllowed > 0
        ? Math.round((attendedSessions / totalSessionsAllowed) * 100)
        : 90;

    if (editingMemberId) {
      updateMember(editingMemberId, {
        fullName: fullName.trim(),
        gender,
        ageOrDob,
        school,
        parentName,
        whatsapp,
        email,
        address,
        currentLevel,
        location,
        status,
        ...(selectedOption ? { selectedPackageId: selectedOption.packageId } : {}),
        preferredDay,
        preferredTime,
        totalSessionsAllowed,
        attendedSessions,
        cumulativeAttendanceRate: calcRate,
        photoUrl: photoUrl || undefined,
        personalBests,
      });
    } else {
      addMember({
        fullName: fullName.trim(),
        gender,
        ageOrDob,
        school,
        parentName,
        whatsapp,
        email,
        address,
        goal: 'Pembinaan Renang & Prestasi',
        preferredDay,
        preferredTime,
        specialConditions: '-',
        currentLevel,
        location,
        status,
        selectedPackageId: selectedOption?.packageId || 'pkg-reguler',
        notes: selectedOption ? `Paket: ${selectedOption.shortName} (${selectedOption.formattedPrice}). Diinput manual oleh admin.` : undefined,
        totalSessionsAllowed,
        attendedSessions,
        cumulativeAttendanceRate: calcRate,
        photoUrl: photoUrl || undefined,
        personalBests,
      });
    }

    setIsModalOpen(false);
  };

  const handleAddPb = () => {
    if (!newPbEvent.trim() || !newPbTime.trim()) return;
    setPersonalBests((prev) => [
      ...prev,
      {
        event: newPbEvent.trim(),
        time: newPbTime.trim(),
        meetName: newPbMeet.trim(),
        dateAchieved: new Date().toISOString().slice(0, 7),
      },
    ]);
  };

  const handleDeletePb = (idx: number) => {
    setPersonalBests((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDeleteMember = (id: string, name: string) => {
    setMemberToDelete({ id, name });
  };

  // Export CSV functionality
  const handleExportCSV = () => {
    const headers = [
      'ID Member',
      'Nama Lengkap',
      'Gender',
      'Usia/TTL',
      'Level Kemahiran',
      'Asal Sekolah',
      'Orang Tua/Wali',
      'No. WhatsApp',
      'Lokasi Kolam',
      'Sesi Terlaksana',
      'Total Kuota Sesi',
      'Status',
    ];

    const rows = filteredMembers.map((m) => [
      m.id,
      `"${m.fullName}"`,
      m.gender,
      `"${m.ageOrDob}"`,
      m.currentLevel,
      `"${m.school || '-'}"`,
      `"${m.parentName || '-'}"`,
      `"${m.whatsapp}"`,
      `"${m.location}"`,
      m.attendedSessions,
      m.totalSessionsAllowed,
      m.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Database_Member_DSAquatics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {showImportModal && <ImportMembersModal onClose={() => setShowImportModal(false)} />}
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-300 ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 p-6 rounded-3xl border border-slate-700 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Satu Pintu Data Member Klub
            </span>
          </div>
          <h3 className="text-2xl font-heading font-black text-white">
            Database Member & Atlet DS Aquatics
          </h3>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
            Pusat database seluruh siswa & atlet renang: foto profil resmi, tingkat kemahiran (<strong>Pemula</strong>, <strong>Menengah</strong>, <strong>Lanjutan</strong>), kontak wali, lokasi latihan, dan catatan waktu terbaik.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
            title="Ekspor Seluruh Data Member ke File CSV/Excel"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={async () => {
              setExcelBusy(true);
              try {
                await exportMembersXlsx(filteredMembers, settings);
              } catch (err) {
                alert(`Gagal membuat Excel: ${(err as Error).message}`);
              } finally {
                setExcelBusy(false);
              }
            }}
            disabled={excelBusy}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs disabled:opacity-50"
            title="Ekspor data member (sesuai pencarian) ke file Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{excelBusy ? 'Membuat Excel…' : 'Ekspor ke Excel'}</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
            title="Impor data member dari file CSV"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Impor CSV</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Member Baru</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards Berdasarkan Level Pemula, Menengah, Lanjutan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Total Member Aktif
          </span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-black text-slate-900">
              {totalActive}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ {members.length} Siswa</span>
          </div>
          <div className="mt-2 text-xs font-medium text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Terdaftar Resmi Klub</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Tingkat Pemula
          </span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-black text-emerald-600">
              {countPemula}
            </span>
            <span className="text-xs font-semibold text-slate-500">Siswa</span>
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500">
            <span>Dasar & Pengenalan Air</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Tingkat Menengah
          </span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-black text-cyan-600">
              {countMenengah}
            </span>
            <span className="text-xs font-semibold text-slate-500">Siswa</span>
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500">
            <span>Penyempurnaan Gaya & Drill</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Tingkat Lanjutan
          </span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-black text-purple-600">
              {countLanjutan}
            </span>
            <span className="text-xs font-semibold text-slate-500">Atlet</span>
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500">
            <span>Prestasi & Simulasi Waktu</span>
          </div>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama member, ID, sekolah, wali, no WA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden text-xs bg-slate-50/50"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Level Filter (Pemula, Menengah, Lanjutan) */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden text-xs"
          >
            <option value="Semua">Semua Level</option>
            <option value="Pemula">Level: Pemula</option>
            <option value="Menengah">Level: Menengah</option>
            <option value="Lanjutan">Level: Lanjutan</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden text-xs"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Status: Aktif</option>
            <option value="Cuti">Status: Cuti</option>
            <option value="Alumni">Status: Alumni</option>
            <option value="Verifikasi">Status: Verifikasi</option>
          </select>

          {/* Gender Filter */}
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden text-xs"
          >
            <option value="Semua">Semua Gender</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>

          {/* View Switcher Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-cyan-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Kartu Profil & Foto"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kartu</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-cyan-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel Rinci (Spreadsheet)"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
          </div>
        </div>
      </div>

      {/* MEMBER CONTENT: View Mode Switcher */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-600">Tidak ada data member yang sesuai.</p>
          <p className="text-xs">Coba sesuaikan kata kunci pencarian atau filter di atas.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* MODE 1: GRID KARTU PROFIL LENGKAP DENGAN FOTO */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMembers.map((m) => {
            const rate =
              m.cumulativeAttendanceRate ||
              (m.totalSessionsAllowed > 0
                ? Math.round((m.attendedSessions / m.totalSessionsAllowed) * 100)
                : 90);

            // Clean Level Display
            const levelClean = (m.currentLevel || '').toLowerCase().includes('pemula')
              ? 'Pemula'
              : (m.currentLevel || '').toLowerCase().includes('menengah')
              ? 'Menengah'
              : 'Lanjutan';

            return (
              <div
                key={m.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden"
              >
                {/* Header Profil Atlet & Foto */}
                <div className="flex items-start gap-4">
                  {/* Foto Profil dengan Hover Quick Upload / Hapus */}
                  <div className="relative group shrink-0">
                    {m.photoUrl ? (
                      <img
                        src={m.photoUrl}
                        alt={m.fullName || 'Member'}
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-cyan-500 shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-cyan-400 font-heading font-black text-2xl flex items-center justify-center border-2 border-slate-700 shadow-md">
                        {(m.fullName || 'A').charAt(0)}
                      </div>
                    )}

                    {/* Quick photo overlay actions */}
                    <div className="absolute inset-0 bg-slate-950/70 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
                      <label className="text-[10px] font-bold text-cyan-300 hover:text-white cursor-pointer flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Ganti Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleDirectPhotoChange(m.id, e)}
                          className="hidden"
                        />
                      </label>
                      {m.photoUrl && (
                        <button
                          type="button"
                          onClick={() => handleDirectPhotoRemove(m.id, m.fullName)}
                          className="text-[10px] font-bold text-rose-300 hover:text-rose-100 cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Identitas Member */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                        {m.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === 'Aktif'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : m.status === 'Cuti'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : m.status === 'Alumni'
                            ? 'bg-slate-100 text-slate-700 border border-slate-300'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                    {m.status !== 'Aktif' && (
                      <button
                        type="button"
                        onClick={() => {
                          updateMember(m.id, { status: 'Aktif' });
                          showToast(`${m.fullName} sekarang berstatus Aktif.`);
                        }}
                        className="mt-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer"
                      >
                        ✓ Aktifkan Member
                      </button>
                    )}

                    <h4 className="font-heading font-black text-base text-slate-900 mt-1 truncate">
                      {m.fullName}
                    </h4>

                    <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5 font-medium">
                      <span>{m.gender}</span>
                      <span>•</span>
                      <span>{m.ageOrDob}</span>
                      {m.school && (
                        <>
                          <span>•</span>
                          <span className="truncate">{m.school}</span>
                        </>
                      )}
                    </div>

                    {/* Level Kemahiran Badge */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 ${
                          levelClean === 'Pemula'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : levelClean === 'Menengah'
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}
                      >
                        <Award className="w-3 h-3" />
                        <span>Level: {levelClean}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Detail Sesuai Formulir Tambah Member Baru */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2">
                  {/* Orang Tua / Wali */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Orang Tua / Wali:</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[190px]">
                      {m.parentName || '-'}
                    </span>
                  </div>

                  {/* No. WhatsApp Wali dengan Tombol Salin */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-200/70">
                    <span className="text-slate-500 font-medium">No. WhatsApp Wali:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900 text-xs bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {m.whatsapp || '-'}
                      </span>
                      {m.whatsapp && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopyWa(m.id, m.whatsapp)}
                            className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10px] inline-flex items-center gap-1 border border-slate-300 shadow-2xs transition-all active:scale-95 cursor-pointer"
                            title="Salin Nomor WhatsApp"
                          >
                            {copiedWaId === m.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-500" />
                                <span>Salin</span>
                              </>
                            )}
                          </button>
                          <a
                            href={`https://wa.me/${m.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] inline-flex items-center gap-1 border border-emerald-200 shadow-2xs transition-all active:scale-95"
                            title="Buka Chat WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>Chat</span>
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Lokasi Kolam Latihan */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/70">
                    <span className="text-slate-500 font-medium">Lokasi Kolam:</span>
                    <span className="font-semibold text-slate-700 text-right truncate max-w-[200px]" title={m.location}>
                      {m.location}
                    </span>
                  </div>

                  {/* Alamat / Domisili */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/70">
                    <span className="text-slate-500 font-medium">Alamat / Domisili:</span>
                    <span className="font-medium text-slate-700 text-right truncate max-w-[200px]" title={m.address || '-'}>
                      {m.address || '-'}
                    </span>
                  </div>
                </div>

                {/* Catatan Waktu Terbaik (Personal Best) */}
                <div className="bg-cyan-50/40 p-3 rounded-2xl border border-cyan-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-cyan-950 uppercase tracking-wider flex items-center gap-1">
                      <Timer className="w-3.5 h-3.5 text-cyan-700" />
                      <span>Catatan Waktu Terbaik (PB):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(m)}
                      className="text-[10px] text-cyan-700 hover:text-cyan-900 font-bold cursor-pointer hover:underline"
                    >
                      {m.personalBests && m.personalBests.length > 0 ? '+ Tambah Rekor' : '+ Catat PB'}
                    </button>
                  </div>

                  {m.personalBests && m.personalBests.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      {m.personalBests.slice(0, 4).map((pb, idx) => (
                        <div key={idx} className="bg-white p-2 rounded-xl border border-cyan-200 shadow-2xs">
                          <div className="text-[10px] text-slate-600 truncate font-semibold">{pb.event}</div>
                          <div className="flex items-baseline justify-between mt-0.5">
                            <span className="font-mono font-black text-cyan-800 text-xs">{pb.time}</span>
                            <span className="text-[9px] text-slate-400 truncate max-w-[65px]">{pb.meetName || 'Trial'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic py-0.5">
                      Belum ada catatan waktu PB. Klik '+ Catat PB' untuk menambahkan.
                    </p>
                  )}
                </div>

                {/* Attendance & Kuota Sesi dengan Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Kuota & Presensi Sesi:</span>
                    </span>
                    <span className="font-mono font-black text-emerald-700">
                      {rate}% ({m.attendedSessions}/{m.totalSessionsAllowed} Sesi)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        rate >= 75 ? 'bg-emerald-500' : rate >= 40 ? 'bg-cyan-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(rate, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                  {onNavigateToRapor && (
                    <button
                      onClick={() => onNavigateToRapor(m.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 transition-colors cursor-pointer"
                    >
                      Buka Rapor Atlet
                    </button>
                  )}

                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      onClick={() => handleOpenEdit(m)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit & Foto</span>
                    </button>

                    <button
                      onClick={() => handleDeleteMember(m.id, m.fullName)}
                      className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* MODE 2: TABEL DATA DETAIL (SPREADSHEET VIEW) */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 font-heading font-bold text-slate-700 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Member / Foto</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Gender & Usia</th>
                  <th className="py-3 px-4">Sekolah</th>
                  <th className="py-3 px-4">Wali & No. WA</th>
                  <th className="py-3 px-4">Lokasi Kolam</th>
                  <th className="py-3 px-4">Alamat / Domisili</th>
                  <th className="py-3 px-4">Rekor PB</th>
                  <th className="py-3 px-4">Kuota Sesi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMembers.map((m) => {
                  const levelClean = (m.currentLevel || '').toLowerCase().includes('pemula')
                    ? 'Pemula'
                    : (m.currentLevel || '').toLowerCase().includes('menengah')
                    ? 'Menengah'
                    : 'Lanjutan';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-3">
                          {m.photoUrl ? (
                            <img
                              src={m.photoUrl}
                              alt={m.fullName || 'Member'}
                              className="w-10 h-10 rounded-xl object-cover border border-cyan-400 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-cyan-400 font-bold text-xs flex items-center justify-center shrink-0">
                              {(m.fullName || 'A').charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{m.fullName || 'Member'}</div>
                            <span className="font-mono text-[10px] text-cyan-700 font-bold">{m.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            levelClean === 'Pemula'
                              ? 'bg-emerald-100 text-emerald-800'
                              : levelClean === 'Menengah'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {levelClean}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{m.gender}</div>
                        <div className="text-[10px] text-slate-400">{m.ageOrDob}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-[140px] truncate" title={m.school || '-'}>
                        {m.school || '-'}
                      </td>

                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{m.parentName || '-'}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[11px] text-slate-700 font-bold">
                            {m.whatsapp}
                          </span>
                          {m.whatsapp && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleCopyWa(m.id, m.whatsapp)}
                                className="px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[9px] inline-flex items-center gap-0.5 border border-slate-300 transition-colors cursor-pointer"
                                title="Salin Nomor WhatsApp"
                              >
                                {copiedWaId === m.id ? (
                                  <>
                                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                                    <span className="text-emerald-700">Tersalin</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-2.5 h-2.5 text-slate-500" />
                                    <span>Salin</span>
                                  </>
                                )}
                              </button>
                              <a
                                href={`https://wa.me/${m.whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-1.5 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[9px] inline-flex items-center gap-0.5 border border-emerald-200"
                                title="Chat WhatsApp"
                              >
                                <MessageCircle className="w-2.5 h-2.5" />
                                <span>WA</span>
                              </a>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-[150px] truncate" title={m.location}>
                        {m.location}
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-[150px] truncate" title={m.address || '-'}>
                        {m.address || '-'}
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        {m.personalBests && m.personalBests.length > 0 ? (
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-cyan-800 text-[11px] block">
                              {m.personalBests[0].event}: {m.personalBests[0].time}
                            </span>
                            {m.personalBests.length > 1 && (
                              <span className="text-[10px] text-slate-400">
                                +{m.personalBests.length - 1} rekor lain
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                        <div>{m.attendedSessions} / {m.totalSessionsAllowed} Sesi</div>
                        <div className="text-[10px] text-emerald-600 font-normal">
                          Presensi: {Math.round(((m.attendedSessions || 0) / (m.totalSessionsAllowed || 1)) * 100)}%
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.status === 'Aktif'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : m.status === 'Cuti'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : m.status === 'Alumni'
                              ? 'bg-slate-100 text-slate-700 border border-slate-300'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                            title="Edit Data & Foto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(m.id, m.fullName)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Hapus Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL LENGKAP: Tambah / Edit Member + Upload, Ganti, Hapus Foto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center-safe justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-heading font-black text-lg text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-600" />
                <span>{editingMemberId ? 'Edit Data & Foto Member' : 'Tambah Member Baru'}</span>
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* SECTION: Foto Profil & Upload, Ganti, Hapus Foto */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative shrink-0">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Preview"
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-cyan-500 shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-slate-200 border-2 border-dashed border-slate-400 flex flex-col items-center justify-center text-slate-500">
                      <ImageIcon className="w-8 h-8 text-slate-400 mb-1" />
                      <span className="text-[10px] font-bold">Tanpa Foto</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <span className="font-bold text-slate-800 text-xs block">
                    Foto Resmi Atlet / Member
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Format JPG, PNG, atau WEBP. Maksimal 4MB. Foto akan ditampilkan di kartu member, rapor atlet, dan cetak laporan.
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <label className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{photoUrl ? 'Ganti Foto' : 'Pilih File Foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>

                    {photoUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs flex items-center gap-1 border border-rose-200 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Foto</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Identitas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Member:</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Raffi Pratama Putra"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jenis Kelamin:</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Usia / Tanggal Lahir:</label>
                  <input
                    type="text"
                    required
                    value={ageOrDob}
                    onChange={(e) => setAgeOrDob(e.target.value)}
                    placeholder="Contoh: 12 Tahun (12 Mei 2014)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Asal Sekolah:</label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="Contoh: SMP Negeri 1 Boyolali"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Tingkat Kemahiran (Level Pemula, Menengah, Lanjutan) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tingkat Kemahiran (Level):
                  </label>
                  <select
                    value={currentLevel}
                    onChange={(e) => setCurrentLevel(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-cyan-300 bg-cyan-50/50 font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  >
                    <option value="Pemula">Pemula (Pengenalan Air & Dasar Renang)</option>
                    <option value="Menengah">Menengah (Penyempurnaan 4 Gaya Renang)</option>
                    <option value="Lanjutan">Lanjutan (Prestasi Atlet & Drill Waktu)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Keanggotaan:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Cuti">Cuti Sementara</option>
                    <option value="Alumni">Alumni</option>
                    <option value="Verifikasi">Verifikasi Pendaftaran</option>
                    <option value="Tidak Aktif">Tidak Aktif</option>
                  </select>
                </div>
              </div>

              {/* Paket Renang, Kuota & Jadwal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Paket Renang (Price List):</label>
                  <select
                    value={selectedOptionId}
                    onChange={(e) => handleSelectOption(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  >
                    <option value="">— Pilih paket —</option>
                    {pricelistOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kuota Sesi:</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={totalSessionsAllowed}
                    onChange={(e) => setTotalSessionsAllowed(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
                {editingMemberId ? (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Sesi Sudah Hadir:</label>
                    <input
                      type="number"
                      min={0}
                      max={totalSessionsAllowed}
                      value={attendedSessions}
                      onChange={(e) => setAttendedSessions(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    />
                  </div>
                ) : (
                  <div className="hidden sm:block" />
                )}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hari Latihan:</label>
                  <select
                    value={preferredDay}
                    onChange={(e) => setPreferredDay(e.target.value as DayOfWeek)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jam Latihan:</label>
                  <input
                    type="text"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    placeholder="Contoh: 08:00 - 09:00"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Kontak Wali & Lokasi Kolam */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Orang Tua / Wali:</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Contoh: Bapak Bambang Pratama"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">No. WhatsApp Wali:</label>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Contoh: 0812-3456-7890"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lokasi Kolam Latihan:</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  >
                    <option value="Lestarindo Sport Garden Boyolali">Lestarindo Sport Garden Boyolali</option>
                    <option value="Front One Boutique Adria Boyolali">Front One Boutique Adria Boyolali</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Alamat / Domisili:</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Contoh: Boyolali Kota"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Catatan Waktu Terbaik (Personal Best) */}
              <div className="border-t border-slate-200 pt-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-cyan-600" />
                    <span>Catatan Waktu Terbaik (Personal Best / PB):</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Opsional untuk rekor atlet</span>
                </div>

                {/* Quick Event Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 mr-1">Pilihan Cepat:</span>
                  {[
                    '50m Gaya Bebas',
                    '50m Gaya Dada',
                    '50m Gaya Punggung',
                    '50m Gaya Kupu',
                    '100m Gaya Bebas',
                    '100m Gaya Dada',
                  ].map((evt) => (
                    <button
                      key={evt}
                      type="button"
                      onClick={() => setNewPbEvent(evt)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${
                        newPbEvent === evt
                          ? 'bg-cyan-600 text-white border-cyan-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-400 hover:text-cyan-700'
                      }`}
                    >
                      {evt}
                    </button>
                  ))}
                </div>

                {/* Form Tambah PB */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">Nomor / Gaya:</span>
                      <input
                        type="text"
                        placeholder="Contoh: 50m Gaya Bebas"
                        value={newPbEvent}
                        onChange={(e) => setNewPbEvent(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">Catatan Waktu:</span>
                      <input
                        type="text"
                        placeholder="Contoh: 00:26.50"
                        value={newPbTime}
                        onChange={(e) => setNewPbTime(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">Kejuaraan / Sesi:</span>
                      <input
                        type="text"
                        placeholder="Contoh: Simulasi Waktu Time Trial"
                        value={newPbMeet}
                        onChange={(e) => setNewPbMeet(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddPb}
                      className="px-4 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambahkan ke Rekor PB</span>
                    </button>
                  </div>
                </div>

                {/* List PB Tersimpan */}
                {personalBests.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-600 block">
                      Daftar Rekor PB Tersimpan ({personalBests.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {personalBests.map((pb, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-800">{pb.event}</div>
                            <div className="text-[10px] text-slate-400">{pb.meetName || 'Trial'}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-cyan-800 font-black text-xs bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                              {pb.time}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeletePb(i)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus Rekor Ini"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  Simpan Data Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Member Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center-safe justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-heading font-black text-slate-900 text-lg">
                Hapus Data Member?
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Yakin ingin menghapus data member <strong>"{memberToDelete.name}"</strong> ({memberToDelete.id})? Seluruh riwayat presensi dan profil akan dihapus dari sistem. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteMember(memberToDelete.id);
                  showToast(`Data member "${memberToDelete.name}" berhasil dihapus.`);
                  setMemberToDelete(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Photo Confirmation Modal */}
      {photoToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center-safe justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-heading font-black text-slate-900 text-lg">
                Hapus Foto Profil Atlet?
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Hapus foto profil resmi untuk atlet <strong>"{photoToDelete.name}"</strong>? Foto akan digantikan dengan avatar inisial nama.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPhotoToDelete(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  updateMember(photoToDelete.id, { photoUrl: undefined });
                  showToast(`Foto profil atlet "${photoToDelete.name}" berhasil dihapus.`);
                  setPhotoToDelete(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Hapus Foto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
