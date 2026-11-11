import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  ClipboardCheck,
  Users,
  FileText,
  Settings as SettingsIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  X,
  Sparkles,
  Upload,
  Image as ImageIcon,
  MessageCircle,
  Search,
  RefreshCw,
  ShoppingBag,
  Tag,
  MessageSquareQuote,
  Shield,
  Clock,
  MapPin,
  Check,
  Save,
  Award,
  Megaphone,
  RotateCcw,
  UserPlus,
  Mail,
  UserCheck,
  ArrowLeft,
  LogOut,
  Key,
  FileSpreadsheet,
  LayoutDashboard,
  CreditCard,
  Timer,
  Database,
  Copy,
} from 'lucide-react';
import { DAYS_OF_WEEK, TIME_SLOTS, DEFAULT_CLUB_SETTINGS, DEFAULT_SCHEDULE_SLOTS, sortTimeSlots } from '../data/defaultData';
import { parseScheduleCsv } from '../utils/csvImport';
import { ShareFormLinks } from './ShareFormLinks';
import { db, collection, getDocs } from '../firebase';
import { printAttendanceReport } from '../utils/reportPrints';
import { exportAttendanceXlsx } from '../utils/excelExport';
import { DayOfWeek, ScheduleSlot, ScheduleRequest, RequestStatus, Member, DocumentationItem, PricePackage, PackageTier, TestimonialItem, SwimGearProduct, MemberReport } from '../types';
import { compressImageFile } from '../utils/imageCompressor';
import { ADMIN_ACCOUNTS } from '../context/AppContext';
import { AdminRaporTab } from './AdminRaporTab';
import { ReportDetailModal } from './ReportDetailModal';
import { AdminAddMemberModal } from './AdminAddMemberModal';
import { AdminMemberAccountsTab } from './AdminMemberAccountsTab';
import { AdminLoginHistoryTab } from './AdminLoginHistoryTab';
import { Activity as ActivityIcon, Printer } from 'lucide-react';
import { AdminDashboardTab } from './AdminDashboardTab';
import { AdminFinanceTab } from './AdminFinanceTab';
import { AdminAttendanceTab } from './AdminAttendanceTab';
import { AdminMemberDatabaseTab } from './AdminMemberDatabaseTab';
import { PoolStopwatchModal } from './PoolStopwatchModal';
import { exportAllClubDataToMasterGoogleSheet } from '../utils/googleWorkspace';
import { parseAndFormatRequestDateTime } from '../utils/dateFormatter';
import { copyToClipboard } from '../utils/clipboard';

interface AdminPanelProps {
  isOpen?: boolean;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen = true,
  onClose,
}) => {
  const {
    settings,
    updateSettings,
    members,
    addMember,
    updateMember,
    deleteMember,
    scheduleSlots,
    addScheduleSlot,
    updateScheduleSlot,
    deleteScheduleSlot,
    scheduleRequests,
    reviewScheduleRequest,
    importScheduleSlots,
    deleteScheduleRequest,
    markAttendance,
    documentation,
    addDocumentation,
    updateDocumentation,
    deleteDocumentation,
    pricePackages,
    addPricePackage,
    updatePricePackage,
    deletePricePackage,
    testimonials,
    addTestimonial,
    updateTestimonial,
    deleteTestimonial,
    swimGear,
    addSwimGear,
    updateSwimGear,
    deleteSwimGear,
    attendanceRecords,
    evaluationCriteria,
    clubInvoices,
    testimonialSubmissions,
    loginLogs,
    addEvaluationCriterion,
    updateEvaluationCriterion,
    deleteEvaluationCriterion,
    memberReports,
    addMemberReport,
    deleteMemberReport,
    currentUser,
    memberAccounts,
    logout,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'keuangan'
    | 'jadwal'
    | 'validasi'
    | 'absensi'
    | 'database_member'
    | 'akun'
    | 'riwayat'
    | 'rapor'
    | 'laporan'
    | 'pengaturan'
  >('dashboard');

  const [isStopwatchModalOpen, setIsStopwatchModalOpen] = useState(false);

  // Testimonial edit state
  const [editingTesti, setEditingTesti] = useState<TestimonialItem | null>(null);

  // Master Google Sheets Sync state
  const [isExportingMaster, setIsExportingMaster] = useState(false);
  const [masterExportToast, setMasterExportToast] = useState<{
    success: boolean;
    message: string;
    url?: string;
  } | null>(null);

  // Modal / local states for editing
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);
  const [editingRequest, setEditingRequest] = useState<ScheduleRequest | null>(null);
  const [adminNoteText, setAdminNoteText] = useState('');
  const [validationToast, setValidationToast] = useState<string | null>(null);
  const [copiedReqWaId, setCopiedReqWaId] = useState<string | null>(null);
  const [scheduleReqFilterStatus, setScheduleReqFilterStatus] = useState<
    'Semua' | 'Pending' | 'Disetujui' | 'Ditolak' | 'Atur Ulang'
  >('Semua');
  const [scheduleReqSearch, setScheduleReqSearch] = useState('');
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);

  const handleCopyReqWa = (id: string, wa: string) => {
    copyToClipboard(wa);
    setCopiedReqWaId(id);
    setTimeout(() => setCopiedReqWaId(null), 2000);
  };

  // Member management states
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'Semua' | 'Verifikasi' | 'Aktif' | 'Tidak Aktif' | 'Ditolak'>('Semua');
  const [memberSourceFilter, setMemberSourceFilter] = useState<'Semua' | 'form_online' | 'manual_admin'>('Semua');

  // Manual Member Input state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [manualMemberToast, setManualMemberToast] = useState<string | null>(null);

  // Manual Schedule Slot creation state
  const [manualSlotDay, setManualSlotDay] = useState<DayOfWeek>('Senin');
  const [manualSlotTime, setManualSlotTime] = useState('');
  const [manualSlotCoach, setManualSlotCoach] = useState('Coach Dewi');
  const [manualSlotParticipants, setManualSlotParticipants] = useState('');
  const [manualSlotLocation, setManualSlotLocation] = useState('Kolam Renang Lestarindo');
  const [manualSlotStatus, setManualSlotStatus] = useState<'tersedia' | 'hadir' | 'off'>('tersedia');
  const [manualSlotSuccess, setManualSlotSuccess] = useState<string | null>(null);
  const [manualSlotError, setManualSlotError] = useState<string | null>(null);

  // Flexible Schedule Location Filter state
  const [scheduleLocationFilter, setScheduleLocationFilter] = useState<'all' | string>('all');

  const normalizeLocationName = (loc?: string): string => {
    if (!loc) return '';
    const l = loc.toLowerCase().trim();
    if (l.includes('front') || l.includes('adria')) return 'Front One Boutique Adria';
    if (l.includes('lestarindo')) return 'Kolam Renang Lestarindo';
    return loc.trim();
  };

  const matchLocationFilter = (slotLocation: string | undefined, filter: string): boolean => {
    if (!filter || filter === 'all') return true;
    const normSlot = normalizeLocationName(slotLocation);
    const normFilter = normalizeLocationName(filter);
    return normSlot.toLowerCase().includes(normFilter.toLowerCase()) || normFilter.toLowerCase().includes(normSlot.toLowerCase());
  };

  const getSlotsForCell = (day: DayOfWeek, timeRange: string, filterLocation: string = 'all'): ScheduleSlot[] => {
    return scheduleSlots.filter((s) => {
      if (s.day !== day || s.timeRange !== timeRange) return false;
      if (filterLocation === 'all') return true;
      return matchLocationFilter(s.location, filterLocation);
    });
  };

  // Settings form states
  const [clubNameInput, setClubNameInput] = useState(settings.clubName);
  const [sloganInput, setSloganInput] = useState(settings.slogan);
  const [hookInput, setHookInput] = useState(settings.hookText);
  const [heroBgInput, setHeroBgInput] = useState(settings.heroBgUrl);
  const [logoInput, setLogoInput] = useState(settings.logoUrl);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Announcement state (Papan Pengumuman untuk Member)
  const [announcementTitleInput, setAnnouncementTitleInput] = useState(settings.announcementTitle || '');
  const [announcementContentInput, setAnnouncementContentInput] = useState(settings.announcementContent || '');
  const [announcementDateInput, setAnnouncementDateInput] = useState(settings.announcementDate || '');
  const [announcementIsActiveInput, setAnnouncementIsActiveInput] = useState(settings.announcementIsActive !== false);
  const [announcementSaved, setAnnouncementSaved] = useState(false);

  // New Doc item form state
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentationItem | null>(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocDesc, setNewDocDesc] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');

  // New Swim Gear state
  const [showAddGearModal, setShowAddGearModal] = useState(false);
  const [editingGear, setEditingGear] = useState<SwimGearProduct | null>(null);
  const [newGearName, setNewGearName] = useState('');
  const [newGearCategory, setNewGearCategory] = useState('Kacamata Renang');
  const [newGearPrice, setNewGearPrice] = useState(150000);
  const [newGearUrl, setNewGearUrl] = useState('');

  // Package Management state
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PricePackage | null>(null);
  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgSubtitle, setPkgSubtitle] = useState('');
  const [pkgBadge, setPkgBadge] = useState('');
  const [pkgCategory, setPkgCategory] = useState<'reguler' | 'privat' | 'group_prestasi'>('reguler');
  const [pkgMaxPeople, setPkgMaxPeople] = useState('');
  const [pkgPrice, setPkgPrice] = useState(250000);
  const [pkgSessions, setPkgSessions] = useState(4);
  const [pkgFeatures, setPkgFeatures] = useState('');
  const [pkgNote, setPkgNote] = useState('');

  // New Testimonial state
  const [showAddTestiModal, setShowAddTestiModal] = useState(false);
  const [newTestiName, setNewTestiName] = useState('');
  const [newTestiRole, setNewTestiRole] = useState('Wali Murid');
  const [newTestiQuote, setNewTestiQuote] = useState('');

  // Report detail modal state
  const [selectedReportForDetail, setSelectedReportForDetail] = useState<MemberReport | null>(null);
  const [isReportDetailModalOpen, setIsReportDetailModalOpen] = useState(false);

  // Custom Delete Confirmation Modal State
  const [adminDeleteItem, setAdminDeleteItem] = useState<{
    type: 'slot' | 'doc' | 'package' | 'gear';
    id: string;
    title: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      clubName: clubNameInput,
      slogan: sloganInput,
      hookText: hookInput,
      heroBgUrl: heroBgInput,
      logoUrl: logoInput,
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      announcementTitle: announcementTitleInput,
      announcementContent: announcementContentInput,
      announcementDate: announcementDateInput,
      announcementIsActive: announcementIsActiveInput,
    });
    setAnnouncementSaved(true);
    setTimeout(() => setAnnouncementSaved(false), 3500);
  };

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setHeroBgInput(result);
        updateSettings({ heroBgUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, { maxWidthOrHeight: 400, maxSizeKB: 150 });
        setLogoInput(compressed.dataUrl);
        updateSettings({ logoUrl: compressed.dataUrl });
      } catch {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          const result = uploadEvent.target?.result as string;
          setLogoInput(result);
          updateSettings({ logoUrl: result });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleResetLogoToDefault = () => {
    const defaultLogo = DEFAULT_CLUB_SETTINGS.logoUrl;
    setLogoInput(defaultLogo);
    updateSettings({ logoUrl: defaultLogo });
  };

  const handleResetHeroBgToDefault = () => {
    const defaultHeroBg = DEFAULT_CLUB_SETTINGS.heroBgUrl;
    setHeroBgInput(defaultHeroBg);
    updateSettings({ heroBgUrl: defaultHeroBg });
  };

  const [timeToDelete, setTimeToDelete] = useState<string | null>(null);
  const [reportStatusFilter, setReportStatusFilter] = useState('Semua');
  const [excelBusy, setExcelBusy] = useState(false);
  const reportMembers = (members || []).filter(
    (m) => m && (reportStatusFilter === 'Semua' || m.status === reportStatusFilter)
  );
  const [showImportModal, setShowImportModal] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [csvSlots, setCsvSlots] = useState<ScheduleSlot[] | null>(null);
  const [csvName, setCsvName] = useState('');
  const handleScheduleCsv = async (file?: File) => {
    setImportResult(null);
    if (!file) return;
    const parsed = parseScheduleCsv(await file.text(), 'Kolam Renang Lestarindo');
    if (parsed.error) {
      setCsvSlots(null);
      setCsvName('');
      setImportResult(`Gagal: ${parsed.error}`);
      return;
    }
    setCsvSlots(parsed.slots);
    setCsvName(file.name);
  };
  const importSource = csvSlots || DEFAULT_SCHEDULE_SLOTS;
  const runImport = async (mode: 'replace' | 'merge') => {
    setImportBusy(true);
    setImportResult(null);
    try {
      await importScheduleSlots(importSource, mode);
      setImportResult(`Berhasil: ${importSource.length} blok jadwal tersimpan di Matriks Jadwal.`);
      setTimeout(() => setShowImportModal(false), 1500);
    } catch (e) {
      setImportResult(`Gagal menyimpan: ${(e as Error).message}`);
    } finally {
      setImportBusy(false);
    }
  };

  const handleScheduleAction = (req: ScheduleRequest, action: RequestStatus, note?: string) => {
    const currentNote = editingRequest?.id === req.id ? adminNoteText : (note !== undefined ? note : req.adminNotes || req.coachNote || '');
    reviewScheduleRequest(req.id, action, currentNote);
    setEditingRequest(null);
    setValidationToast(`Status pengajuan jadwal ${req.memberName} (${req.day}, ${req.timeRange}) berhasil diubah menjadi: ${action}`);
    setTimeout(() => setValidationToast(null), 4000);
  };

  const getSlot = (day: DayOfWeek, timeRange: string) => {
    return scheduleSlots.find((s) => s.day === day && s.timeRange === timeRange);
  };

  const handleExportMasterSheets = async () => {
    setIsExportingMaster(true);
    setMasterExportToast(null);
    try {
      const res = await exportAllClubDataToMasterGoogleSheet({
        clubName: settings.clubName,
        members,
        memberAccounts,
        scheduleSlots,
        scheduleRequests,
        attendanceRecords,
        memberReports,
        pricePackages,
        settings,
        clubInvoices,
        testimonials,
        testimonialSubmissions,
        swimGear,
        documentation,
        evaluationCriteria,
        loginLogs,
        // Riwayat presensi per tanggal diambil langsung dari Firestore
        loadDailyAttendance: async () => {
          const snap = await getDocs(collection(db, 'attendanceRecords'));
          return snap.docs.map((d) => d.data() as any);
        },
      });
      if (res.success) {
        setMasterExportToast({
          success: true,
          message: 'Seluruh database DS AQUATICS berhasil disinkronkan ke Master Google Sheets!',
          url: res.spreadsheetUrl,
        });
      }
    } catch (err: any) {
      setMasterExportToast({
        success: false,
        message: err.message || 'Gagal export ke Google Sheets. Pastikan popup izin Google diizinkan.',
      });
    } finally {
      setIsExportingMaster(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col print:bg-white print:text-black">
      {/* Top Main Portal Header */}
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer group shadow-xs"
              title="Kembali ke Beranda Website DS Aquatics"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Kembali ke Website</span>
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
              <Shield className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="font-heading font-black text-base sm:text-lg text-white tracking-tight">
                  Panel Pengelola Admin & Pelatih
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 uppercase">
                  {currentUser?.name || 'Dewi Setyaningsih'}
                </span>
                <span className="text-[10px] font-mono text-slate-400 hidden lg:inline">
                  ({currentUser?.email || 'dewisetyaningsih17@gmail.com'})
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {settings.clubName} • Halaman Web Khusus Pengelolaan Klub Renang
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto flex-wrap">
            {/* Multi-lane Pool Stopwatch Quick Button */}
            <button
              onClick={() => setIsStopwatchModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Buka Stopwatch Kolam Renang (Akurasi 1/100 Detik)"
            >
              <Timer className="w-4 h-4 text-cyan-200" />
              <span>Stopwatch Pool</span>
            </button>

            {/* Master Google Sheets Sync Button */}
            <button
              onClick={handleExportMasterSheets}
              disabled={isExportingMaster}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Sinkronkan seluruh data (Siswa, Akun, Jadwal, Absensi, Rapor, Paket) ke Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>{isExportingMaster ? 'Menyinkronkan...' : 'Master Google Sheets'}</span>
            </button>

            {/* Admin accounts badge */}
            <div className="hidden xl:flex items-center gap-1 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-slate-800 text-[10px]">
              <span className="text-slate-400 font-semibold mr-1">Admin:</span>
              {(ADMIN_ACCOUNTS || []).map((acc) => {
                const isCurrent =
                  currentUser?.email &&
                  acc.email &&
                  currentUser.email.toLowerCase() === acc.email.toLowerCase();
                return (
                  <span
                    key={acc.email}
                    className={`px-1.5 py-0.5 rounded-md font-medium transition-all ${
                      isCurrent
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {(acc.name || '').split(' ')[0]} {isCurrent && '✓'}
                  </span>
                );
              })}
            </div>

            {/* Logout button */}
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-300 text-xs font-semibold border border-slate-700 hover:border-red-800 transition-colors cursor-pointer"
              title="Keluar dari Akun Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Master Export Toast Banner */}
        {masterExportToast && (
          <div className={`px-4 py-2.5 text-xs flex items-center justify-between border-t ${
            masterExportToast.success
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
              : 'bg-rose-950/90 text-rose-200 border-rose-800'
          }`}>
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {masterExportToast.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span>{masterExportToast.message}</span>
                {masterExportToast.url && (
                  <a
                    href={masterExportToast.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline text-emerald-300 hover:text-white ml-2"
                  >
                    Buka Spreadsheet Baru →
                  </a>
                )}
              </div>
              <button
                onClick={() => setMasterExportToast(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Horizontal Navigation Tab Bar */}
        <div className="bg-slate-900 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto no-scrollbar">
            {/* 1. Dashboard Ringkasan */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-3 px-3.5 font-heading font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-800/80'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-cyan-400" />
              <span>Dashboard</span>
            </button>

            {/* 2. Keuangan Club DS Aquatics */}
            <button
              onClick={() => setActiveTab('keuangan')}
              className={`py-3 px-3.5 font-heading font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'keuangan'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-800/80'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Keuangan Club</span>
            </button>

            {/* 3. Matriks Jadwal */}
            <button
              onClick={() => setActiveTab('jadwal')}
              className={`py-3 px-3.5 font-heading font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'jadwal'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-800/80'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Matriks Jadwal</span>
            </button>

            {/* 4. Validasi Pengajuan */}
            <button
              onClick={() => setActiveTab('validasi')}
              className={`py-3 px-3.5 font-heading font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'validasi'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-800/80'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Validasi Pengajuan</span>
              {(scheduleRequests || []).filter((r) => r && (r.status || '').toLowerCase() === 'pending').length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                  {(scheduleRequests || []).filter((r) => r && (r.status || '').toLowerCase() === 'pending').length}
                </span>
              )}
            </button>

            {/* 5. Presensi Atlet (Fitur Absensi Baru) */}
            <button
              onClick={() => setActiveTab('absensi')}
              className={`py-3 px-3.5 font-heading font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'absensi'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-800/80'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-400" />
              <span>Presensi Atlet</span>
            </button>

            {/* 6. Database Member (Persis di sebelah kiri Manajemen Akun) */}
            <button
              onClick={() => setActiveTab('database_member')}
              className={`py-3 px-3.5 font-heading font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'database_member'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-800/80'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Database Member ({(members || []).length})</span>
            </button>

            {/* 7. Manajemen Akun */}
            <button
              onClick={() => setActiveTab('akun')}
              className={`py-3 px-3.5 font-heading font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'akun'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-800/80'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-4 h-4 text-cyan-400" />
              <span>Manajemen Akun ({(memberAccounts || []).length})</span>
            </button>

            {/* 7b. Riwayat Login & Status Online */}
            <button
              onClick={() => setActiveTab('riwayat')}
              className={`py-3 px-3.5 font-heading font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'riwayat'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-800/80'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <ActivityIcon className="w-4 h-4 text-cyan-400" />
              <span>Riwayat Login & Online</span>
            </button>

            {/* 8. Rapor Ujian */}
            <button
              onClick={() => setActiveTab('rapor')}
              className={`py-3 px-3.5 font-heading font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'rapor'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-800/80'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Rapor Ujian ({(memberReports || []).length})</span>
            </button>

            {/* 9. Laporan Rekap */}
            <button
              onClick={() => setActiveTab('laporan')}
              className={`py-3 px-3.5 font-heading font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'laporan'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-800/80'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Laporan Rekap</span>
            </button>

            {/* 10. Pengaturan Situs */}
            <button
              onClick={() => setActiveTab('pengaturan')}
              className={`py-3 px-3.5 font-heading font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'pengaturan'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-800/80'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Pengaturan Situs</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Content Body */}
      <main className="flex-1 w-full bg-slate-100 text-slate-800 print:bg-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto w-full">
          {/* ======================================================== */}
          {/* TAB 0: DASHBOARD RINGKASAN                               */}
          {/* ======================================================== */}
          {activeTab === 'dashboard' && (
            <AdminDashboardTab
              onNavigateTab={(tabKey) => {
                if (tabKey === 'presensi' || tabKey === 'absensi') {
                  setActiveTab('absensi');
                } else {
                  setActiveTab(tabKey);
                }
              }}
              onOpenStopwatchModal={() => setIsStopwatchModalOpen(true)}
            />
          )}

          {/* ======================================================== */}
          {/* TAB 1: KEUANGAN CLUB DS AQUATICS                         */}
          {/* ======================================================== */}
          {activeTab === 'keuangan' && <AdminFinanceTab />}

          {/* ======================================================== */}
          {/* TAB 2: MATRIKS JADWAL LATIHAN (FULL DASHBOARD)           */}
          {/* ======================================================== */}
          {activeTab === 'jadwal' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="font-heading font-black text-xl text-slate-900">
                    Matriks Jadwal Latihan Keseluruhan
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Atur status slot mingguan: <strong>Hijau</strong> (Hadir/Sudah Absen), <strong>Netral</strong> (Belum Absen), atau <strong>Merah</strong> (OFF / Coach Sibuk).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImportResult(null);
                    setShowImportModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Impor Jadwal Mingguan ({DEFAULT_SCHEDULE_SLOTS.length} blok)</span>
                </button>
              </div>

              {timeToDelete && (
                <div className="fixed inset-0 overflow-y-auto z-50 bg-black/60 flex items-center-safe justify-center p-4">
                  <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 text-xs text-slate-700">
                    <h5 className="font-heading font-black text-base text-slate-900">Hapus jam {timeToDelete}?</h5>
                    <p>
                      Semua <strong>{scheduleSlots.filter((s) => s.timeRange === timeToDelete).length} slot</strong> pada jam ini
                      (Senin–Minggu, semua kolam) akan dihapus dari Matriks Jadwal. Data member tidak ikut terhapus.
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setTimeToDelete(null)}
                        className="px-4 py-2 rounded-xl border border-slate-300 font-bold cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          scheduleSlots.filter((s) => s.timeRange === timeToDelete).forEach((s) => deleteScheduleSlot(s.id));
                          setTimeToDelete(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                      >
                        Ya, hapus jam ini
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showImportModal && (
                <div className="fixed inset-0 overflow-y-auto z-50 bg-black/60 flex items-center-safe justify-center p-4">
                  <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3 text-xs text-slate-700">
                    <h5 className="font-heading font-black text-base text-slate-900">Impor Jadwal Mingguan Resmi</h5>
                    <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-cyan-300 bg-cyan-50/50 font-bold text-cyan-800 cursor-pointer">
                      {csvName ? `File: ${csvName}` : 'Pakai file CSV matriks jadwal (opsional)'}
                      <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => handleScheduleCsv(e.target.files?.[0])} />
                    </label>
                    <p>
                      Memasukkan <strong>{importSource.length} blok jadwal</strong>
                      {csvSlots ? ' dari file CSV' : ' (jadwal mingguan resmi bawaan)'}, termasuk{' '}
                      {importSource.filter((x) => x.status === 'off').length} slot OFF, ke Matriks Jadwal. Lokasi awal: Kolam Renang Lestarindo
                      (bisa diubah per slot).
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        disabled={importBusy}
                        onClick={() => runImport('replace')}
                        className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer disabled:opacity-60"
                      >
                        Ganti seluruh jadwal ({scheduleSlots.length} slot lama dihapus)
                      </button>
                      <button
                        type="button"
                        disabled={importBusy}
                        onClick={() => runImport('merge')}
                        className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer disabled:opacity-60"
                      >
                        Tambahkan saja (slot lama tetap ada)
                      </button>
                      <button
                        type="button"
                        disabled={importBusy}
                        onClick={() => setShowImportModal(false)}
                        className="px-4 py-2 rounded-xl border border-slate-300 font-bold cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                    {importBusy && <p className="text-cyan-700 font-bold">Menyimpan ke Firebase…</p>}
                    {importResult && (
                      <p className={`font-bold ${importResult.startsWith('Gagal') ? 'text-rose-600' : 'text-emerald-700'}`}>{importResult}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Pengaturan Waktu Manual Jam Latihan (Permintaan A. Matrik Jadwal) */}
              <div className="bg-white p-5 rounded-2xl border border-cyan-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-600" />
                    <div>
                      <h5 className="font-heading font-black text-sm text-slate-900">
                        Pengaturan Waktu Manual Jam Latihan (Coach)
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        Tambahkan jam latihan kustom manual ke dalam matriks secara langsung.
                      </p>
                    </div>
                  </div>
                  {manualSlotSuccess && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 animate-in fade-in flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {manualSlotSuccess}
                    </span>
                  )}
                  {manualSlotError && (
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200 animate-in fade-in flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {manualSlotError}
                    </span>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setManualSlotError(null);
                    if (!manualSlotTime.trim()) {
                      setManualSlotError('Kolom Jam Latihan wajib diisi!');
                      setTimeout(() => setManualSlotError(null), 3500);
                      return;
                    }
                    const parts = manualSlotParticipants
                      .split(',')
                      .map((p) => p.trim())
                      .filter(Boolean);

                    addScheduleSlot({
                      day: manualSlotDay,
                      timeRange: manualSlotTime.trim(),
                      coach: manualSlotCoach.trim() || 'Coach Dewi',
                      participants: parts,
                      location: manualSlotLocation,
                      status: manualSlotStatus,
                      isGroup: false,
                    });

                    setManualSlotSuccess(`Slot ${manualSlotDay} (${manualSlotTime}) berhasil ditambahkan ke matriks!`);
                    setTimeout(() => setManualSlotSuccess(null), 3500);
                    setManualSlotTime('');
                    setManualSlotParticipants('');
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs"
                >
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Hari Latihan:</label>
                    <select
                      value={manualSlotDay}
                      onChange={(e) => setManualSlotDay(e.target.value as DayOfWeek)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Jam Latihan (Manual): <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={manualSlotTime}
                      onChange={(e) => setManualSlotTime(e.target.value)}
                      placeholder="Contoh: 06:00 - 07:30 atau 15:30 - 17:00"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium placeholder:text-slate-400 placeholder:italic focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Coach:</label>
                    <input
                      type="text"
                      value={manualSlotCoach}
                      onChange={(e) => setManualSlotCoach(e.target.value)}
                      placeholder="Contoh: Coach Dewi"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium placeholder:text-slate-400 placeholder:italic focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Peserta (Pisahkan koma):</label>
                    <input
                      type="text"
                      value={manualSlotParticipants}
                      onChange={(e) => setManualSlotParticipants(e.target.value)}
                      placeholder="Contoh: Fatih, Rafka, Zea"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium placeholder:text-slate-400 placeholder:italic focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lokasi Kolam:</label>
                    <select
                      value={manualSlotLocation}
                      onChange={(e) => setManualSlotLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium truncate"
                    >
                      <option value="Kolam Renang Lestarindo">Kolam Renang Lestarindo</option>
                      <option value="Front One Boutique Adria Boyolali">Front One Boutique Adria Boyolali</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <button
                      type="submit"
                      id="btn-add-manual-schedule-slot"
                      className="w-full py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-heading font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tambah Slot Jam</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Legend & Filter Lokasi Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                {/* Filter Lokasi Kolam */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-slate-700 text-xs mr-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                    Lokasi:
                  </span>
                  <button
                    type="button"
                    onClick={() => setScheduleLocationFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      scheduleLocationFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>Semua Lokasi (Gabungan)</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-current">
                      {scheduleSlots.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setScheduleLocationFilter('Kolam Renang Lestarindo');
                      setManualSlotLocation('Kolam Renang Lestarindo');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      scheduleLocationFilter === 'Kolam Renang Lestarindo'
                        ? 'bg-cyan-700 text-white shadow-xs'
                        : 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200/60'
                    }`}
                  >
                    <span>Kolam Renang Lestarindo</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/30 text-current font-black">
                      {scheduleSlots.filter((s) => matchLocationFilter(s.location, 'Lestarindo')).length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setScheduleLocationFilter('Front One Boutique Adria');
                      setManualSlotLocation('Front One Boutique Adria Boyolali');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      scheduleLocationFilter === 'Front One Boutique Adria'
                        ? 'bg-indigo-700 text-white shadow-xs'
                        : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200/60'
                    }`}
                  >
                    <span>Front One Boutique Adria</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/30 text-current font-black">
                      {scheduleSlots.filter((s) => matchLocationFilter(s.location, 'Front One')).length}
                    </span>
                  </button>
                </div>

                {/* Status Legend */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-xs bg-emerald-500 border border-emerald-600 inline-block" />
                    <span className="font-semibold text-emerald-800">Hadir</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-xs bg-white border border-slate-300 inline-block" />
                    <span>Netral</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-xs bg-rose-500 border border-rose-600 inline-block" />
                    <span className="font-semibold text-rose-800">OFF (Libur)</span>
                  </div>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px] text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 font-heading font-bold text-slate-700 uppercase">
                        <th className="py-3 px-3 text-center w-32 border-r border-slate-200">Waktu</th>
                        {DAYS_OF_WEEK.map((day) => (
                          <th key={day} className="py-3 px-2 text-center border-r border-slate-200 last:border-r-0">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {sortTimeSlots(
                        // Hanya jam yang punya slot (jam bawaan kosong tidak ditampilkan)
                        scheduleSlots.length
                          ? Array.from(new Set(scheduleSlots.map((s) => s.timeRange).filter(Boolean)))
                          : [...TIME_SLOTS]
                      ).map((time) => (
                        <tr key={time} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700 bg-slate-50/90 border-r border-slate-200 align-middle">
                            <div>{time}</div>
                            {scheduleSlots.some((s) => s.timeRange === time) && (
                              <button
                                type="button"
                                onClick={() => setTimeToDelete(time)}
                                className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 cursor-pointer font-sans"
                                title={`Hapus semua slot jam ${time}`}
                              >
                                <Trash2 className="w-3 h-3" /> Hapus jam
                              </button>
                            )}
                          </td>
                          {DAYS_OF_WEEK.map((day) => {
                            const slots = getSlotsForCell(day, time, scheduleLocationFilter);

                            return (
                              <td
                                key={`${day}-${time}`}
                                className="py-2 px-2 border-r border-slate-200 last:border-r-0 align-top bg-white"
                              >
                                {slots.length === 0 ? (
                                  <div
                                    onClick={() => {
                                      setManualSlotDay(day);
                                      setManualSlotTime(time);
                                      if (scheduleLocationFilter !== 'all') {
                                        setManualSlotLocation(
                                          scheduleLocationFilter.includes('Front')
                                            ? 'Front One Boutique Adria Boyolali'
                                            : 'Kolam Renang Lestarindo'
                                        );
                                      }
                                    }}
                                    className="min-h-[56px] flex flex-col items-center justify-center text-slate-300 hover:text-cyan-700 hover:bg-cyan-50/60 rounded-xl transition-all p-1 cursor-pointer group border border-transparent hover:border-cyan-200"
                                    title={`Klik untuk menambahkan slot ${day} jam ${time}`}
                                  >
                                    <span className="text-xs group-hover:hidden">-</span>
                                    <span className="text-[10px] font-bold hidden group-hover:inline-flex items-center gap-0.5 text-cyan-700">
                                      <Plus className="w-3 h-3" /> Tambah
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-2">
                                    {slots.map((slot) => {
                                      const isOff = slot.status === 'off';
                                      const isHadir = slot.status === 'hadir';
                                      const isLestarindo = normalizeLocationName(slot.location).includes('Lestarindo');

                                      return (
                                        <div
                                          key={slot.id}
                                          onClick={() => setEditingSlot(slot)}
                                          className={`p-2 rounded-xl border text-[11px] transition-all cursor-pointer hover:shadow-md ${
                                            isOff
                                              ? 'bg-rose-50/80 border-rose-200 hover:bg-rose-100 text-rose-950'
                                              : isHadir
                                              ? 'bg-emerald-50/80 border-emerald-300 hover:bg-emerald-100 text-emerald-950'
                                              : 'bg-white border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/40 text-slate-900'
                                          }`}
                                          title="Klik untuk mengedit slot, ubah status, atau hapus"
                                        >
                                          {/* Baris Coach & Badge Status */}
                                          <div className="flex items-center justify-between gap-1 mb-1">
                                            <span className="font-bold text-[10px] text-slate-600 truncate">
                                              {slot.coach}
                                            </span>
                                            <div className="flex items-center gap-1 shrink-0">
                                              {isHadir && (
                                                <span className="px-1.5 py-0.2 rounded-xs bg-emerald-600 text-white font-bold text-[9px]">
                                                  Hadir
                                                </span>
                                              )}
                                              {isOff && (
                                                <span className="px-1.5 py-0.2 rounded-xs bg-rose-600 text-white font-bold text-[9px]">
                                                  OFF
                                                </span>
                                              )}
                                              {!isHadir && !isOff && (
                                                <span className="px-1.5 py-0.2 rounded-xs bg-slate-100 text-slate-700 font-bold text-[9px]">
                                                  Netral
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          {/* Daftar Peserta */}
                                          <div className="leading-tight mb-1.5">
                                            {isOff ? (
                                              <span className="font-mono font-bold text-rose-700 italic text-[10px]">
                                                OFF (Libur)
                                              </span>
                                            ) : (
                                              <div>
                                                {slot.isGroup && (
                                                  <span className="text-amber-600 font-black block text-[9px]">
                                                    (GROUP PRESTASI)
                                                  </span>
                                                )}
                                                <span className="font-semibold text-slate-800 line-clamp-2">
                                                  {slot.participants.length > 0
                                                    ? slot.participants.join(', ')
                                                    : '(Belum ada peserta)'}
                                                </span>
                                              </div>
                                            )}
                                          </div>

                                          {/* Badge Lokasi Kolam */}
                                          {slot.location && (
                                            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                              <span
                                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                                                  isLestarindo
                                                    ? 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                                                    : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                                }`}
                                              >
                                                <span>📍</span>
                                                <span className="truncate">
                                                  {slot.location
                                                    .replace('Kolam Renang ', '')
                                                    .replace(' Boutique Adria Boyolali', '')
                                                    .replace(' Boutique Adria', '')}
                                                </span>
                                              </span>
                                              <span className="text-[9px] text-slate-400 font-medium">Edit</span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}

                                    {/* Tombol Tambah di Lokasi Lain jika ada slot di jam ini */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setManualSlotDay(day);
                                        setManualSlotTime(time);
                                        const existingLoc = slots[0]?.location || '';
                                        if (existingLoc.toLowerCase().includes('lestarindo')) {
                                          setManualSlotLocation('Front One Boutique Adria Boyolali');
                                        } else {
                                          setManualSlotLocation('Kolam Renang Lestarindo');
                                        }
                                      }}
                                      className="w-full py-1 text-[9px] text-cyan-700 hover:text-cyan-900 hover:bg-cyan-50 rounded-lg border border-dashed border-cyan-200 flex items-center justify-center gap-0.5 font-bold transition-colors cursor-pointer"
                                      title="Tambah sesi latihan di lokasi kolam lain pada jam ini"
                                    >
                                      <Plus className="w-2.5 h-2.5" />
                                      <span>+ Lokasi Lain</span>
                                    </button>
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
              </div>

              {/* Edit Slot Drawer / Modal */}
              {editingSlot && (
                <div className="fixed inset-0 overflow-y-auto z-50 bg-black/60 backdrop-blur-xs flex items-center-safe justify-center p-4">
                  <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <span className="text-xs font-bold text-cyan-600 uppercase">Ubah Status Jadwal</span>
                        <h4 className="font-heading font-black text-lg text-slate-900">
                          {editingSlot.day}, {editingSlot.timeRange}
                        </h4>
                      </div>
                      <button onClick={() => setEditingSlot(null)} className="p-1.5 text-slate-400 hover:text-slate-700">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Status Kehadiran / Jadwal:</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              updateScheduleSlot(editingSlot.id, { status: 'hadir' });
                              setEditingSlot({ ...editingSlot, status: 'hadir' });
                            }}
                            className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                              editingSlot.status === 'hadir'
                                ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            Hijau (Hadir)
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              updateScheduleSlot(editingSlot.id, { status: 'tersedia' });
                              setEditingSlot({ ...editingSlot, status: 'tersedia' });
                            }}
                            className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                              editingSlot.status === 'tersedia'
                                ? 'bg-slate-800 text-white border-slate-900 shadow-sm'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            Netral (Belum Absen)
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              updateScheduleSlot(editingSlot.id, { status: 'off' });
                              setEditingSlot({ ...editingSlot, status: 'off' });
                            }}
                            className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                              editingSlot.status === 'off'
                                ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            Merah (OFF)
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Hari Latihan:</label>
                        <select
                          value={editingSlot.day}
                          onChange={(e) => {
                            const d = e.target.value as DayOfWeek;
                            updateScheduleSlot(editingSlot.id, { day: d });
                            setEditingSlot({ ...editingSlot, day: d });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                        >
                          {DAYS_OF_WEEK.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Waktu / Jam Latihan:</label>
                        <input
                          type="text"
                          value={editingSlot.timeRange}
                          onChange={(e) => {
                            updateScheduleSlot(editingSlot.id, { timeRange: e.target.value });
                            setEditingSlot({ ...editingSlot, timeRange: e.target.value });
                          }}
                          placeholder="Contoh: 06:00 - 07:30 atau 15:30 - 17:00"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Nama Coach:</label>
                        <input
                          type="text"
                          value={editingSlot.coach}
                          onChange={(e) => {
                            updateScheduleSlot(editingSlot.id, { coach: e.target.value });
                            setEditingSlot({ ...editingSlot, coach: e.target.value });
                          }}
                          placeholder="Contoh: Coach Dewi"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Nama Peserta (Pisahkan koma):</label>
                        <input
                          type="text"
                          value={editingSlot.participants.join(', ')}
                          onChange={(e) => {
                            const list = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                            updateScheduleSlot(editingSlot.id, { participants: list });
                            setEditingSlot({ ...editingSlot, participants: list });
                          }}
                          placeholder="Contoh: Fatih, Zea, Bilal"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Lokasi Kolam:</label>
                        <select
                          value={
                            editingSlot.location?.toLowerCase().includes('front') || editingSlot.location?.toLowerCase().includes('adria')
                              ? 'Front One Boutique Adria Boyolali'
                              : 'Kolam Renang Lestarindo'
                          }
                          onChange={(e) => {
                            updateScheduleSlot(editingSlot.id, { location: e.target.value });
                            setEditingSlot({ ...editingSlot, location: e.target.value });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                        >
                          <option value="Kolam Renang Lestarindo">Kolam Renang Lestarindo</option>
                          <option value="Front One Boutique Adria Boyolali">Front One Boutique Adria Boyolali</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-3 border-t flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAdminDeleteItem({
                            type: 'slot',
                            id: editingSlot.id,
                            title: `${editingSlot.day} (${editingSlot.timeRange})`,
                          });
                        }}
                        className="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-heading font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Slot</span>
                      </button>

                      <button
                        onClick={() => setEditingSlot(null)}
                        className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-heading font-bold text-xs hover:bg-slate-800"
                      >
                        Simpan & Tutup
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: VALIDASI PENGAJUAN JADWAL (PENDING FLOW)          */}
          {/* ======================================================== */}
          {activeTab === 'validasi' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-heading font-black text-xl text-slate-900">
                    Validasi Pengajuan Jadwal Latihan Member
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Kelola pengajuan jadwal member dengan tombol aksi: <strong>Disetujui</strong> (otomatis masuk slot matriks), <strong>Ditolak</strong>, atau <strong>Atur Ulang</strong> serta input catatan pelatih.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari atlet atau nomor WA..."
                      value={scheduleReqSearch}
                      onChange={(e) => setScheduleReqSearch(e.target.value)}
                      className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden w-52"
                    />
                  </div>

                  {/* Filter Status */}
                  <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold max-w-full">
                    {(['Semua', 'Pending', 'Disetujui', 'Ditolak', 'Atur Ulang'] as const).map((st) => {
                      const count = st === 'Semua'
                        ? (scheduleRequests || []).length
                        : (scheduleRequests || []).filter((r) => {
                            if (!r) return false;
                            const raw = (r.status || 'pending').toLowerCase();
                            if (st === 'Pending') return raw === 'pending';
                            if (st === 'Disetujui') return raw === 'disetujui' || raw === 'approved';
                            if (st === 'Ditolak') return raw === 'ditolak' || raw === 'rejected';
                            if (st === 'Atur Ulang') return raw === 'atur_ulang' || raw === 'atur ulang';
                            return false;
                          }).length;

                      return (
                        <button
                          key={st}
                          onClick={() => setScheduleReqFilterStatus(st)}
                          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                            scheduleReqFilterStatus === st
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <span>{st}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                              scheduleReqFilterStatus === st ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {validationToast && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{validationToast}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValidationToast(null)}
                    className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
                  >
                    Tutup
                  </button>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 font-heading font-bold text-slate-700 uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Tgl Pengajuan</th>
                        <th className="py-3.5 px-4">Nama Member</th>
                        <th className="py-3.5 px-4">Jadwal & Lokasi</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">CATATAN PELATIH</th>
                        <th className="py-3.5 px-4 text-center">Aksi Keputusan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(() => {
                        const filtered = (scheduleRequests || []).filter((req) => {
                          if (!req) return false;
                          const rawStatus = (req.status || 'pending').toLowerCase();
                          const matchesFilter =
                            scheduleReqFilterStatus === 'Semua' ||
                            (scheduleReqFilterStatus === 'Pending' && rawStatus === 'pending') ||
                            (scheduleReqFilterStatus === 'Disetujui' && (rawStatus === 'disetujui' || rawStatus === 'approved')) ||
                            (scheduleReqFilterStatus === 'Ditolak' && (rawStatus === 'ditolak' || rawStatus === 'rejected')) ||
                            (scheduleReqFilterStatus === 'Atur Ulang' && (rawStatus === 'atur_ulang' || rawStatus === 'atur ulang'));

                          const query = scheduleReqSearch.toLowerCase();
                          const matchesSearch =
                            !query ||
                            (req.memberName || '').toLowerCase().includes(query) ||
                            (req.whatsapp && req.whatsapp.includes(query)) ||
                            (req.id || '').toLowerCase().includes(query) ||
                            (req.location && req.location.toLowerCase().includes(query));

                          return matchesFilter && matchesSearch;
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                                Belum ada pengajuan jadwal yang sesuai dengan filter.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((req) => {
                          const parsedDt = parseAndFormatRequestDateTime(req.requestDate, req.createdAt);
                          const stLower = (req.status || 'pending').toLowerCase();
                          const isApproved = stLower === 'disetujui' || stLower === 'approved';
                          const isRejected = stLower === 'ditolak' || stLower === 'rejected';
                          const isAturUlang = stLower === 'atur_ulang' || stLower === 'atur ulang';
                          const isPending = !isApproved && !isRejected && !isAturUlang;

                          return (
                            <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                                <div className="font-bold text-slate-800 text-xs">
                                  {parsedDt.date}
                                </div>
                                <div className="text-[10px] text-slate-500 font-medium">
                                  {parsedDt.time}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-slate-900">
                                <div className="font-bold text-slate-900">{req.memberName}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[11px] font-mono text-slate-500 font-normal">
                                    {req.whatsapp}
                                  </span>
                                  {req.whatsapp && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopyReqWa(req.id, req.whatsapp)}
                                      className="px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-[10px] font-bold inline-flex items-center gap-1 border border-slate-300 transition-colors cursor-pointer"
                                      title="Salin Nomor WhatsApp"
                                    >
                                      {copiedReqWaId === req.id ? (
                                        <>
                                          <Check className="w-2.5 h-2.5 text-emerald-600" />
                                          <span className="text-emerald-700 font-bold text-[9px]">Tersalin</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-2.5 h-2.5 text-slate-500" />
                                          <span className="text-[9px]">Salin</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-800">
                                  {req.day}, {req.timeRange}
                                </div>
                                <div className="text-[11px] text-cyan-700">
                                  📍 {req.location}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                {isApproved ? (
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Disetujui</span>
                                  </span>
                                ) : isRejected ? (
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                                    <X className="w-3 h-3 text-rose-600" />
                                    <span>Ditolak</span>
                                  </span>
                                ) : isAturUlang ? (
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                                    <RotateCcw className="w-3 h-3 text-amber-600" />
                                    <span>Atur Ulang</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300 animate-pulse inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-sky-600" />
                                    <span>Pending</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 max-w-xs">
                                {editingRequest?.id === req.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={adminNoteText}
                                      onChange={(e) => setAdminNoteText(e.target.value)}
                                      placeholder="Ketik Catatan Pelatih..."
                                      className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 w-full placeholder:text-slate-400"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => {
                                        handleScheduleAction(req, req.status, adminNoteText);
                                      }}
                                      className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                                      title="Simpan Catatan"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingRequest(null)}
                                      className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300"
                                      title="Batal"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => {
                                      setEditingRequest(req);
                                      setAdminNoteText(req.adminNotes || req.coachNote || '');
                                    }}
                                    className="cursor-pointer text-slate-600 hover:text-cyan-700 italic text-[11px] p-1.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200"
                                    title="Klik untuk mengedit catatan pelatih"
                                  >
                                    {req.adminNotes || req.coachNote || '(Klik untuk tambah catatan)'}
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleScheduleAction(req, 'Disetujui')}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                      isApproved
                                        ? 'bg-emerald-700 text-white ring-2 ring-emerald-400 shadow-xs'
                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    }`}
                                    title="Setujui jadwal ini dan masukkan ke matriks jadwal"
                                  >
                                    Disetujui
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleScheduleAction(req, 'Ditolak', req.adminNotes || 'Mohon maaf, slot kolam penuh')}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                      isRejected
                                        ? 'bg-rose-700 text-white ring-2 ring-rose-400 shadow-xs'
                                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                                    }`}
                                    title="Tolak pengajuan jadwal"
                                  >
                                    Ditolak
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleScheduleAction(req, 'Atur Ulang', req.adminNotes || 'Mohon atur ulang jadwal pada slot jam yang tersedia')}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                      isAturUlang
                                        ? 'bg-amber-600 text-white ring-2 ring-amber-300 shadow-xs'
                                        : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                                    }`}
                                    title="Minta member mengatur ulang jadwal"
                                  >
                                    Atur Ulang
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingRequestId(req.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Hapus Pengajuan"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Confirm Delete Schedule Request Modal */}
              {deletingRequestId && (
                <div className="fixed inset-0 overflow-y-auto z-50 bg-slate-950/70 backdrop-blur-xs flex items-center-safe justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-3 text-rose-600">
                      <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-heading font-black text-base text-slate-900">
                          Hapus Pengajuan?
                        </h4>
                        <p className="text-xs text-slate-500">
                          Data pengajuan ini akan dihapus dari antrian.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => setDeletingRequestId(null)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => {
                          deleteScheduleRequest(deletingRequestId);
                          setDeletingRequestId(null);
                          setValidationToast('Pengajuan jadwal berhasil dihapus');
                          setTimeout(() => setValidationToast(null), 3000);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 cursor-pointer"
                      >
                        Ya, Hapus
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: HALAMAN ABSENSI (PRESENSI ATLET TERINTEGRASI)     */}
          {/* ======================================================== */}
          {(activeTab === 'absensi' || (activeTab as string) === 'presensi') && <AdminAttendanceTab />}

          {/* ======================================================== */}
          {/* TAB 4: DATABASE MEMBER (SATU PINTU DATA SISWA & ATLET)   */}
          {/* ======================================================== */}
          {activeTab === 'database_member' && (
            <AdminMemberDatabaseTab
              onNavigateToRapor={(memberId) => {
                setActiveTab('rapor');
              }}
            />
          )}



          {/* ======================================================== */}
          {/* TAB AKUN: MANAJEMEN AKUN MEMBER (EMAIL + CUSTOM PASSWORD)*/}
          {/* ======================================================== */}
          {activeTab === 'akun' && <AdminMemberAccountsTab />}
          {activeTab === 'riwayat' && <AdminLoginHistoryTab />}

          {/* ======================================================== */}
          {/* TAB 5: HALAMAN RAPOR UJIAN & KATEGORI PENILAIAN         */}
          {/* ======================================================== */}
          {activeTab === 'rapor' && (
            <AdminRaporTab
              members={members}
              evaluationCriteria={evaluationCriteria}
              addEvaluationCriterion={addEvaluationCriterion}
              updateEvaluationCriterion={updateEvaluationCriterion}
              deleteEvaluationCriterion={deleteEvaluationCriterion}
              memberReports={memberReports}
              addMemberReport={addMemberReport}
              deleteMemberReport={deleteMemberReport}
              onPreviewReport={(report) => {
                setSelectedReportForDetail(report);
                setIsReportDetailModalOpen(true);
              }}
            />
          )}

          {/* ======================================================== */}
          {/* TAB 6: HALAMAN LAPORAN REKAPITULASI KEHADIRAN            */}
          {/* ======================================================== */}
          {activeTab === 'laporan' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-heading font-black text-xl text-slate-900">
                    Laporan Rekapitulasi Kehadiran & Sesi Member
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Rekapitulasi lengkap status kehadiran dan kuota sesi latihan siswa DS AQUATICS.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <select
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="Semua">Semua status</option>
                    <option value="Aktif">Aktif saja</option>
                    <option value="Verifikasi">Verifikasi saja</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!printAttendanceReport(reportMembers, settings, reportStatusFilter === 'Semua' ? 'Semua status' : reportStatusFilter))
                        alert('Jendela cetak diblokir browser. Izinkan pop-up untuk situs ini lalu coba lagi.');
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Cetak / Simpan PDF
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setExcelBusy(true);
                      try {
                        await exportAttendanceXlsx(reportMembers, settings, reportStatusFilter === 'Semua' ? 'Semua status' : reportStatusFilter);
                      } catch (err) {
                        alert(`Gagal membuat Excel: ${(err as Error).message}`);
                      } finally {
                        setExcelBusy(false);
                      }
                    }}
                    disabled={excelBusy}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> {excelBusy ? 'Membuat Excel…' : 'Ekspor ke Excel'}
                  </button>
                </div>
              </div>

              {/* Printable Report Preview in A4 Format */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm printable-area">
                <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="font-heading font-black text-2xl text-slate-950">
                      {settings.clubName} - LAPORAN ABSENSI SISWA
                    </h2>
                    <p className="text-xs font-semibold text-cyan-800 mt-0.5">
                      {settings.slogan}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Periode: {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-slate-600">
                    <p>Total Siswa: <strong>{reportMembers.length} Member</strong></p>
                    <p className="font-mono text-[10px]">Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
                  </div>
                </div>

                <div className="w-full overflow-x-auto print:overflow-visible">
                <table className="w-full text-left text-xs border-collapse border border-slate-300">
                  <thead className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3 border-r border-slate-300 w-12 text-center">No</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">Nama Siswa</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">Level / Usia</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">Hari & Jam Sesi</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 text-center">Hadir</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 text-center">Belum Hadir</th>
                      <th className="py-2.5 px-3 text-center">Status Sesi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {reportMembers.map((m, index) => {
                      if (!m) return null;
                      const absentCount = Math.max(0, (m.totalSessionsAllowed || 12) - (m.attendedSessions || 0));
                      return (
                        <tr key={m.id}>
                          <td className="py-2 px-3 border-r border-slate-300 text-center font-mono">{index + 1}</td>
                          <td className="py-2 px-3 border-r border-slate-300 font-bold">{m.fullName || 'Member'}</td>
                          <td className="py-2 px-3 border-r border-slate-300">{m.currentLevel || 'Pemula'} ({m.ageOrDob || '-'})</td>
                          <td className="py-2 px-3 border-r border-slate-300">{m.preferredDay || '-'}, {m.preferredTime || '-'}</td>
                          <td className="py-2 px-3 border-r border-slate-300 text-center font-bold text-emerald-700 bg-emerald-50/50">
                            {m.attendedSessions || 0} Sesi
                          </td>
                          <td className="py-2 px-3 border-r border-slate-300 text-center text-slate-600">
                            {absentCount} Sesi
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                              {m.status || 'Aktif'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end">
                  <div className="text-center w-56 text-xs text-slate-700">
                    <p>Boyolali, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                    <p className="mt-1 font-semibold">Kepala Pelatih DS AQUATICS</p>
                    <div className="h-14" />
                    <p className="font-heading font-black underline">Dewi Setyaningsih</p>
                    <span className="text-[10px] text-slate-500">Coach & Founder DS AQUATICS</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: PENGATURAN SITUS                                  */}
          {/* ======================================================== */}
          {activeTab === 'pengaturan' && (
            <div className="space-y-8">
              {settingsSaved && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Pengaturan situs berhasil diperbarui dan diterapkan ke seluruh landing page!</span>
                </div>
              )}

              {/* Link Formulir (Join Now & Testimoni) */}
              <ShareFormLinks />

              {/* 1. Identitas Klub & Hero Section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5">
                <h4 className="font-heading font-black text-lg text-slate-900 flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-cyan-600" />
                  <span>Identitas Klub & Background Hero Section (16:9)</span>
                </h4>

                <form onSubmit={handleSaveGeneralSettings} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nama Club:</label>
                      <input
                        type="text"
                        value={clubNameInput}
                        onChange={(e) => setClubNameInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Sub Nama / Slogan:</label>
                      <input
                        type="text"
                        value={sloganInput}
                        onChange={(e) => setSloganInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Hook Club Renang (Deskripsi Hero):</label>
                      <textarea
                        rows={2}
                        value={hookInput}
                        onChange={(e) => setHookInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      />
                    </div>

                    {/* Logo & Hero Background Image Uploader */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-slate-700">Logo DS AQUATICS:</label>
                        <button
                          type="button"
                          onClick={handleResetLogoToDefault}
                          className="text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                          title="Kembalikan logo ke logo bawaan resmi DS AQUATICS"
                        >
                          <RotateCcw className="w-3 h-3 text-slate-500" />
                          <span>Kembalikan ke Default</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="text-xs file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Format disarankan: PNG transparan atau SVG resolusi tinggi.
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-slate-700">
                          Foto Background Hero (16:9):
                        </label>
                        <button
                          type="button"
                          onClick={handleResetHeroBgToDefault}
                          className="text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                          title="Kembalikan foto hero ke gambar latar default"
                        >
                          <RotateCcw className="w-3 h-3 text-slate-500" />
                          <span>Kembalikan ke Default</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleHeroImageUpload}
                          className="text-xs file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Otomatis dikompresi agar web cepat diakses di perangkat mobile.
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl font-heading font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan Identitas</span>
                  </button>
                </form>
              </div>

              {/* 2. Fitur Input Member Manual pada Pengaturan Panel Admin */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center shrink-0">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-black text-lg text-slate-900">
                        Input Akun Member Baru (Admin Only)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Sesuai aturan klub, calon siswa tidak dapat mendaftar mandiri. Admin menginput akun member baru agar langsung aktif dan dapat login via Google.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(true)}
                    className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Buka Formulir Input Member Baru</span>
                  </button>
                </div>
              </div>

              {/* 2. Pengaturan Papan Pengumuman & Informasi Pelatih untuk Member */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-black text-lg text-slate-900">
                        Papan Pengumuman & Informasi Pelatih
                      </h4>
                      <p className="text-xs text-slate-500">
                        Tuliskan pengumuman, ketentuan perlengkapan, atau arahan latihan yang langsung tampil di dashboard Panel Member.
                      </p>
                    </div>
                  </div>
                  {announcementSaved && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 animate-in fade-in self-start sm:self-auto">
                      <Check className="w-4 h-4" /> Pengumuman Tersimpan!
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveAnnouncement} className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Judul Informasi / Pengumuman:
                      </label>
                      <input
                        type="text"
                        value={announcementTitleInput}
                        onChange={(e) => setAnnouncementTitleInput(e.target.value)}
                        placeholder="Contoh: Informasi Latihan Renang & Ketentuan Perlengkapan"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Label Waktu / Tanggal Update:
                      </label>
                      <input
                        type="text"
                        value={announcementDateInput}
                        onChange={(e) => setAnnouncementDateInput(e.target.value)}
                        placeholder="Contoh: Update Minggu Ini / 21 September 2026"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Isi Arahan / Pesan Lengkap dari Pelatih:
                    </label>
                    <textarea
                      rows={4}
                      value={announcementContentInput}
                      onChange={(e) => setAnnouncementContentInput(e.target.value)}
                      placeholder="Tuliskan arahan pelatih, tata tertib, perlengkapan yang wajib dibawa, jadwal khusus, atau informasi penting lainnya..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden leading-relaxed"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={announcementIsActiveInput}
                        onChange={(e) => setAnnouncementIsActiveInput(e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300"
                      />
                      <span>Aktifkan dan tampilkan di Panel Member</span>
                    </label>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl font-heading font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan Pengumuman Pelatih</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* 3. Pengaturan Galeri Dokumentasi (Sub Section 1) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-heading font-black text-lg text-slate-900">
                      Galeri Dokumentasi Foto Kegiatan
                    </h4>
                    <p className="text-xs text-slate-500">Kelola foto dan deskripsi kegiatan latihan renang (Auto-kompresi &lt; 200KB).</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingDoc(null);
                      setNewDocTitle('');
                      setNewDocDesc('');
                      setNewDocUrl('');
                      setShowAddDocModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-500 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Dokumentasi</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documentation.map((doc) => (
                    <div key={doc.id} className="p-3 rounded-xl border border-slate-200 flex flex-col justify-between bg-white shadow-xs">
                      <div className="h-32 w-full rounded-lg overflow-hidden mb-2 bg-slate-100">
                        <img src={doc.imageUrl} alt={doc.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-slate-900">{doc.title}</h5>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{doc.description}</p>
                      </div>
                      <div className="pt-2 mt-2 border-t flex justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingDoc(doc);
                            setNewDocTitle(doc.title);
                            setNewDocDesc(doc.description);
                            setNewDocUrl(doc.imageUrl);
                            setShowAddDocModal(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-cyan-700 hover:bg-cyan-50 rounded-lg flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setAdminDeleteItem({
                              type: 'doc',
                              id: doc.id,
                              title: doc.title,
                            });
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Pengaturan Pricelist & Paket Renang (Sub Section 3) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-heading font-black text-lg text-slate-900">
                      Pengaturan Paket & Pricelist
                    </h4>
                    <p className="text-xs text-slate-500">
                      Kelola paket latihan renang yang tampil di landing page. Tekan Edit, Input, atau Hapus kapan saja.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingPackage(null);
                      setPkgTitle('');
                      setPkgSubtitle('');
                      setPkgBadge('');
                      setPkgCategory('reguler');
                      setPkgMaxPeople('Maks 1 Orang');
                      setPkgPrice(250000);
                      setPkgSessions(4);
                      setPkgFeatures('4 Sesi Latihan @60 Menit\nPelatih Profesional Bersertifikat\nEvaluasi & Rapor Perkembangan Siswa');
                      setPkgNote('Tiket masuk kolam belum termasuk');
                      setShowPackageModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-500 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Paket Baru</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {pricePackages.map((pkg) => (
                    <div key={pkg.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">{pkg.title}</span>
                          {pkg.badge && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold">
                              {pkg.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs italic text-slate-500 mt-1">"{pkg.subtitle}"</p>
                        <div className="space-y-1 text-xs pt-2">
                          {pkg.pricingTiers.map((t, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>{t.name}</span>
                              <span className="font-bold text-cyan-700">{t.formattedPrice}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingPackage(pkg);
                            setPkgTitle(pkg.title);
                            setPkgSubtitle(pkg.subtitle);
                            setPkgBadge(pkg.badge || '');
                            setPkgCategory(pkg.category);
                            setPkgMaxPeople(pkg.maxPeople || '');
                            const firstTier = pkg.pricingTiers[0];
                            setPkgPrice(firstTier ? firstTier.price : 250000);
                            setPkgSessions(firstTier ? firstTier.sessionsCount : 4);
                            setPkgFeatures(pkg.features.join('\n'));
                            setPkgNote(pkg.note || '');
                            setShowPackageModal(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-cyan-700 hover:bg-cyan-100/60 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setAdminDeleteItem({
                              type: 'package',
                              id: pkg.id,
                              title: pkg.title,
                            });
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100/60 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Pengaturan Testimoni (Sub Section 4) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-heading font-black text-lg text-slate-900">
                      Pengaturan Testimonial
                    </h4>
                    <p className="text-xs text-slate-500">Ulasan wali murid dan peserta latihan.</p>
                  </div>
                  <button
                    onClick={() => setShowAddTestiModal(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-500 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Testimoni</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {testimonials.map((t) => (
                    <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                      <p className="text-xs italic text-slate-700">"{t.quote}"</p>
                      <div className="pt-3 mt-3 border-t flex items-center justify-between">
                        <div>
                          <strong className="text-xs block text-slate-900">{t.name}</strong>
                          <span className="text-[10px] text-cyan-700 font-semibold">{t.role}</span>
                        </div>
                        <button
                          onClick={() => deleteTestimonial(t.id)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Pengaturan Perlengkapan Renang (Navbar B.3) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-heading font-black text-lg text-slate-900">
                      Pengaturan Produk Perlengkapan Renang
                    </h4>
                    <p className="text-xs text-slate-500">Katalog perlengkapan renang yang dapat dipesan oleh member & pengunjung (Auto-kompresi &lt; 200KB).</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingGear(null);
                      setNewGearName('');
                      setNewGearCategory('Kacamata Renang');
                      setNewGearPrice(150000);
                      setNewGearUrl('');
                      setShowAddGearModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-500 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Produk</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {swimGear.map((g) => (
                    <div key={g.id} className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col justify-between shadow-xs">
                      <div className="h-28 w-full rounded-lg overflow-hidden bg-slate-100 mb-2">
                        <img src={g.imageUrl} alt={g.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-cyan-600 block">{g.category}</span>
                        <h6 className="font-bold text-xs text-slate-900">{g.name}</h6>
                        <span className="font-mono text-xs font-black text-cyan-700">{g.formattedPrice}</span>
                      </div>
                      <div className="pt-2 mt-2 border-t flex justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingGear(g);
                            setNewGearName(g.name);
                            setNewGearCategory(g.category);
                            setNewGearPrice(g.price);
                            setNewGearUrl(g.imageUrl);
                            setShowAddGearModal(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-cyan-700 hover:bg-cyan-50 rounded-lg flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setAdminDeleteItem({
                              type: 'gear',
                              id: g.id,
                              title: g.name,
                            });
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-50 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Tambah / Edit Dokumentasi */}
        {showAddDocModal && (
          <div className="fixed inset-0 overflow-y-auto z-50 bg-black/60 flex items-center-safe justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
              <h4 className="font-heading font-bold text-slate-900">
                {editingDoc ? 'Edit Foto Dokumentasi' : 'Tambah Foto Dokumentasi'}
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Judul Dokumentasi:</label>
                  <input
                    type="text"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="Contoh: Latihan Gaya Dada Lestarindo"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">URL Gambar atau Upload Foto:</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newDocUrl}
                      onChange={(e) => setNewDocUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... atau upload file"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer text-xs border border-slate-300 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Pilih Foto (Auto-kompres &lt; 200KB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressed = await compressImageFile(file, { maxWidthOrHeight: 1200, maxSizeKB: 200 });
                                setNewDocUrl(compressed.dataUrl);
                              } catch {
                                const reader = new FileReader();
                                reader.onload = (ev) => setNewDocUrl(ev.target?.result as string);
                                reader.readAsDataURL(file);
                              }
                            }
                          }}
                        />
                      </label>
                      {newDocUrl && (
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Foto terpasang
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Deskripsi:</label>
                  <textarea
                    rows={2}
                    value={newDocDesc}
                    onChange={(e) => setNewDocDesc(e.target.value)}
                    placeholder="Deskripsi kegiatan..."
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowAddDocModal(false);
                    setEditingDoc(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (!newDocTitle) return;
                    if (editingDoc) {
                      updateDocumentation(editingDoc.id, {
                        title: newDocTitle,
                        description: newDocDesc,
                        imageUrl: newDocUrl || editingDoc.imageUrl,
                      });
                    } else {
                      addDocumentation({
                        title: newDocTitle,
                        description: newDocDesc || 'Aktivitas latihan bersama DS AQUATICS Boyolali',
                        imageUrl: newDocUrl || 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?q=80&w=800&auto=format&fit=crop',
                        date: new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
                      });
                    }
                    setShowAddDocModal(false);
                    setEditingDoc(null);
                    setNewDocTitle('');
                    setNewDocDesc('');
                    setNewDocUrl('');
                  }}
                  className="px-4 py-2 text-xs font-bold bg-cyan-600 text-white rounded-xl hover:bg-cyan-500"
                >
                  {editingDoc ? 'Perbarui Dokumentasi' : 'Simpan Dokumentasi'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Tambah / Edit Perlengkapan Renang */}
        {showAddGearModal && (
          <div className="fixed inset-0 overflow-y-auto z-50 bg-black/60 flex items-center-safe justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
              <h4 className="font-heading font-bold text-slate-900">
                {editingGear ? 'Edit Produk Perlengkapan Renang' : 'Tambah Produk Perlengkapan Renang'}
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Nama Produk:</label>
                  <input
                    type="text"
                    value={newGearName}
                    onChange={(e) => setNewGearName(e.target.value)}
                    placeholder="Contoh: Kacamata Renang Anti-Fog"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Kategori:</label>
                  <select
                    value={newGearCategory}
                    onChange={(e) => setNewGearCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="Kacamata Renang">Kacamata Renang</option>
                    <option value="Alat Latihan">Alat Latihan</option>
                    <option value="Kaki Katak / Fins">Kaki Katak / Fins</option>
                    <option value="Topi Renang">Topi Renang</option>
                    <option value="Aksesoris">Aksesoris</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Harga (Rp):</label>
                  <input
                    type="number"
                    value={newGearPrice}
                    onChange={(e) => setNewGearPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">URL Gambar atau Upload Foto:</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newGearUrl}
                      onChange={(e) => setNewGearUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... atau upload file"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer text-xs border border-slate-300 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Pilih Foto (Auto-kompres &lt; 200KB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressed = await compressImageFile(file, { maxWidthOrHeight: 800, maxSizeKB: 200 });
                                setNewGearUrl(compressed.dataUrl);
                              } catch {
                                const reader = new FileReader();
                                reader.onload = (ev) => setNewGearUrl(ev.target?.result as string);
                                reader.readAsDataURL(file);
                              }
                            }
                          }}
                        />
                      </label>
                      {newGearUrl && (
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Foto terpasang
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowAddGearModal(false);
                    setEditingGear(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (!newGearName) return;
                    if (editingGear) {
                      updateSwimGear(editingGear.id, {
                        name: newGearName,
                        category: newGearCategory,
                        price: newGearPrice,
                        formattedPrice: `Rp ${newGearPrice.toLocaleString('id-ID')}`,
                        imageUrl: newGearUrl || editingGear.imageUrl,
                      });
                    } else {
                      addSwimGear({
                        name: newGearName,
                        category: newGearCategory,
                        price: newGearPrice,
                        formattedPrice: `Rp ${newGearPrice.toLocaleString('id-ID')}`,
                        imageUrl: newGearUrl || 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=800&auto=format&fit=crop',
                        description: 'Perlengkapan renang berkualitas standar klub DS AQUATICS.',
                        stockStatus: 'Tersedia',
                      });
                    }
                    setShowAddGearModal(false);
                    setEditingGear(null);
                    setNewGearName('');
                    setNewGearUrl('');
                  }}
                  className="px-4 py-2 text-xs font-bold bg-cyan-600 text-white rounded-xl hover:bg-cyan-500"
                >
                  {editingGear ? 'Perbarui Produk' : 'Simpan Produk'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Tambah / Edit Paket Renang (Pricelist) */}
        {showPackageModal && (
          <div className="fixed inset-0 overflow-y-auto z-50 bg-black/60 flex items-center-safe justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
              <h4 className="font-heading font-bold text-slate-900 text-lg">
                {editingPackage ? 'Edit Paket Latihan Renang' : 'Tambah Paket Latihan Renang'}
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Judul Paket:</label>
                  <input
                    type="text"
                    value={pkgTitle}
                    onChange={(e) => setPkgTitle(e.target.value)}
                    placeholder="Contoh: Paket Kelas Privat Intensif"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Subtitle / Slogan Paket:</label>
                  <input
                    type="text"
                    value={pkgSubtitle}
                    onChange={(e) => setPkgSubtitle(e.target.value)}
                    placeholder="Contoh: 1 Siswa 1 Coach, cepat bisa berenang"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Kategori Paket:</label>
                    <select
                      value={pkgCategory}
                      onChange={(e) => setPkgCategory(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-xl bg-white"
                    >
                      <option value="reguler">Reguler</option>
                      <option value="privat">Privat</option>
                      <option value="group_prestasi">Group / Prestasi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Badge / Label (Opsional):</label>
                    <input
                      type="text"
                      value={pkgBadge}
                      onChange={(e) => setPkgBadge(e.target.value)}
                      placeholder="Contoh: Terpopuler / Paling Hemat"
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Harga (Rp):</label>
                    <input
                      type="number"
                      value={pkgPrice}
                      onChange={(e) => setPkgPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Jumlah Sesi:</label>
                    <input
                      type="number"
                      value={pkgSessions}
                      onChange={(e) => setPkgSessions(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Kapasitas:</label>
                    <input
                      type="text"
                      value={pkgMaxPeople}
                      onChange={(e) => setPkgMaxPeople(e.target.value)}
                      placeholder="Contoh: Maks 1 Orang"
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Fasilitas / Fitur Paket (1 baris per poin):</label>
                  <textarea
                    rows={4}
                    value={pkgFeatures}
                    onChange={(e) => setPkgFeatures(e.target.value)}
                    placeholder="4 Sesi Latihan @60 Menit&#10;Pelatih Profesional Bersertifikat&#10;Evaluasi & Rapor Perkembangan"
                    className="w-full px-3 py-2 border rounded-xl font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Catatan Tambahan (Opsional):</label>
                  <input
                    type="text"
                    value={pkgNote}
                    onChange={(e) => setPkgNote(e.target.value)}
                    placeholder="Contoh: Tiket masuk kolam belum termasuk"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowPackageModal(false);
                    setEditingPackage(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (!pkgTitle || !pkgPrice) return;
                    const featuresList = pkgFeatures
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    const tier: PackageTier = {
                      name: `${pkgSessions} Sesi / Bulan`,
                      sessionsCount: pkgSessions,
                      price: pkgPrice,
                      formattedPrice: `Rp ${pkgPrice.toLocaleString('id-ID')}`,
                    };

                    if (editingPackage) {
                      const updatedTiers =
                        editingPackage.pricingTiers && editingPackage.pricingTiers.length > 1
                          ? editingPackage.pricingTiers.map((t, idx) =>
                              idx === 0
                                ? {
                                    ...t,
                                    sessionsCount: pkgSessions,
                                    price: pkgPrice,
                                    formattedPrice:
                                      t.price === pkgPrice
                                        ? t.formattedPrice
                                        : `Rp ${pkgPrice.toLocaleString('id-ID')}`,
                                  }
                                : t
                            )
                          : [tier];

                      updatePricePackage(editingPackage.id, {
                        title: pkgTitle,
                        subtitle: pkgSubtitle,
                        badge: pkgBadge || '',
                        category: pkgCategory,
                        maxPeople: pkgMaxPeople,
                        pricingTiers: updatedTiers,
                        features: featuresList.length > 0 ? featuresList : ['Pelatih Bersertifikat'],
                        note: pkgNote,
                        accentColor: pkgCategory === 'privat' ? 'amber' : pkgCategory === 'group_prestasi' ? 'emerald' : 'cyan',
                      });
                    } else {
                      addPricePackage({
                        title: pkgTitle,
                        subtitle: pkgSubtitle,
                        badge: pkgBadge || '',
                        category: pkgCategory,
                        maxPeople: pkgMaxPeople,
                        pricingTiers: [tier],
                        features: featuresList.length > 0 ? featuresList : ['Pelatih Bersertifikat'],
                        note: pkgNote,
                        accentColor: pkgCategory === 'privat' ? 'amber' : pkgCategory === 'group_prestasi' ? 'emerald' : 'cyan',
                      });
                    }
                    setShowPackageModal(false);
                    setEditingPackage(null);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-cyan-600 text-white rounded-xl hover:bg-cyan-500"
                >
                  {editingPackage ? 'Perbarui Paket' : 'Simpan Paket Baru'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Tambah Testimoni */}
        {showAddTestiModal && (
          <div className="fixed inset-0 overflow-y-auto z-50 bg-black/60 flex items-center-safe justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
              <h4 className="font-heading font-bold text-slate-900">Tambah Testimonial</h4>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Nama Orang Tua / Siswa:</label>
                  <input
                    type="text"
                    value={newTestiName}
                    onChange={(e) => setNewTestiName(e.target.value)}
                    placeholder="Contoh: Ibu Rina (Mama Arka)"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Role / Status:</label>
                  <input
                    type="text"
                    value={newTestiRole}
                    onChange={(e) => setNewTestiRole(e.target.value)}
                    placeholder="Contoh: Wali Murid Kelas Privat"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Ulasan / Testimoni:</label>
                  <textarea
                    rows={3}
                    value={newTestiQuote}
                    onChange={(e) => setNewTestiQuote(e.target.value)}
                    placeholder="Ceritakan pengalaman belajar di DS Aquatics..."
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAddTestiModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (!newTestiName || !newTestiQuote) return;
                    addTestimonial({
                      name: newTestiName,
                      role: newTestiRole || 'Wali Murid',
                      quote: newTestiQuote,
                      rating: 5,
                    });
                    setShowAddTestiModal(false);
                    setNewTestiName('');
                    setNewTestiQuote('');
                  }}
                  className="px-4 py-2 text-xs font-bold bg-cyan-600 text-white rounded-xl hover:bg-cyan-500"
                >
                  Simpan Testimoni
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Detail Rapor Evaluasi Siswa */}
        <ReportDetailModal
          isOpen={isReportDetailModalOpen}
          report={selectedReportForDetail}
          onClose={() => setIsReportDetailModalOpen(false)}
        />

        {/* Modal: Input Akun Member Baru Manual (Admin Only) */}
        <AdminAddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          onSuccess={(name) => {
            setManualMemberToast(`Akun siswa ${name} berhasil didaftarkan secara resmi! Member sekarang dapat login ke Panel Member.`);
            setTimeout(() => setManualMemberToast(null), 5000);
          }}
        />

        {/* Modal: Multi-Lane Pool Stopwatch Terintegrasi */}
        <PoolStopwatchModal
          isOpen={isStopwatchModalOpen}
          onClose={() => setIsStopwatchModalOpen(false)}
        />

        {/* Modal: Custom Delete Confirmation Modal */}
        {adminDeleteItem && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center-safe justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-heading font-black text-slate-900 text-lg">
                  {adminDeleteItem.type === 'slot' && 'Hapus Slot Jadwal Latihan?'}
                  {adminDeleteItem.type === 'doc' && 'Hapus Foto Dokumentasi?'}
                  {adminDeleteItem.type === 'package' && 'Hapus Paket Kursus?'}
                  {adminDeleteItem.type === 'gear' && 'Hapus Produk Perlengkapan?'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus <strong>"{adminDeleteItem.title}"</strong>? Tindakan ini akan segera memperbarui tampilan klub.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdminDeleteItem(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (adminDeleteItem.type === 'slot') {
                      deleteScheduleSlot(adminDeleteItem.id);
                      setEditingSlot(null);
                    } else if (adminDeleteItem.type === 'doc') {
                      deleteDocumentation(adminDeleteItem.id);
                    } else if (adminDeleteItem.type === 'package') {
                      deletePricePackage(adminDeleteItem.id);
                    } else if (adminDeleteItem.type === 'gear') {
                      deleteSwimGear(adminDeleteItem.id);
                    }
                    setAdminDeleteItem(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
