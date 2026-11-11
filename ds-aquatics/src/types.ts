export type DayOfWeek = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';

export type UserRole = 'guest' | 'member' | 'admin';

export interface UserSession {
  role: UserRole;
  memberId?: string;
  name: string;
  whatsapp?: string;
  email?: string;
  adminRoleTitle?: string;
}

export interface InvoiceHeaderSettings {
  clubName?: string; // Judul kop, mis. "DS AQUATICS CLUB"
  tagline?: string; // Baris kedua kop
  contactLine?: string; // Baris kontak (WA, IG, alamat)
  logoDataUrl?: string; // Logo terkompresi (maks. 200KB)
  city?: string; // Kota tanda tangan, mis. "Boyolali"
  signatureText?: string; // Tulisan tanda tangan (miring)
  signerName?: string; // Nama penanda tangan
  signerTitle?: string; // Jabatan penanda tangan
}

export interface ClubSettings {
  publicSiteUrl?: string; // Alamat website resmi untuk link yang dibagikan
  invoiceHeader?: InvoiceHeaderSettings;
  customSessions?: string[]; // Jam latihan kustom untuk presensi, mis. "Kustom (19:00 - 20:30 WIB)"
  clubName: string;
  slogan: string;
  hookText: string;
  logoUrl: string; // Custom uploaded image URL or empty to use default SVG
  heroBgUrl: string; // 16:9 ratio image URL
  phoneWa: string;
  instagramUrl: string;
  lestarindoName: string;
  lestarindoAddress: string;
  lestarindoCoords: { lat: number; lng: number };
  frontOneName: string;
  frontOneAddress: string;
  frontOneCoords: { lat: number; lng: number };
  paymentBri: string;
  paymentBca: string;
  paymentMandiri: string;
  paymentAccountName: string;
  announcementTitle?: string;
  announcementContent?: string;
  announcementDate?: string;
  announcementIsActive?: boolean;
  contactWaMessage?: string;
  gearWaTemplate?: string;
}

export interface MemberPersonalBest {
  event: string;
  time: string;
  previousTime?: string;
  dateRecorded?: string;
  dateAchieved?: string;
  meetName?: string;
}

export interface Member {
  id: string;
  fullName: string;
  email?: string;
  ageOrDob: string;
  gender: 'Laki-laki' | 'Perempuan';
  school: string;
  currentLevel: 'Pemula' | 'Menengah' | 'Lanjutan' | string;
  goal: string;
  preferredDay: DayOfWeek;
  preferredTime: string;
  location: string;
  specialConditions: string;
  whatsapp: string;
  parentName: string;
  address: string;
  selectedPackageId: string;
  status: 'Verifikasi' | 'Aktif' | 'Tidak Aktif' | 'Ditolak' | 'Pending' | 'Nonaktif' | 'Cuti' | 'Alumni';
  registrationDate: string;
  totalSessionsAllowed: number;
  attendedSessions: number;
  notes?: string;
  source?: 'form_online' | 'manual_admin';
  photoUrl?: string;
  nisn?: string;
  squad?: 'Prestasi Utama' | 'Development (KU)' | 'Reguler' | 'Privat' | string;
  spesialisasi?: string;
  kelompokUmur?: 'KU V (<9 thn)' | 'KU IV (10-11 thn)' | 'KU III (12-13 thn)' | 'KU II (14-15 thn)' | 'KU I (16-18 thn)' | 'Senior' | string;
  personalBests?: MemberPersonalBest[];
  cumulativeAttendanceRate?: number;
  dailyAttendanceStatus?: 'Hadir' | 'Izin' | 'Sakit';
  dailyAttendanceNote?: string;
}

export interface MemberAccount {
  id: string; // e.g. "ACC-001"
  memberId?: string; // Optional linked Member ID
  fullName: string;
  email: string; // Used as USERNAME for member login
  password: string; // Custom password set by admin or generated
  whatsapp?: string;
  status: 'Aktif' | 'Nonaktif';
  createdAt: string;
  notes?: string;
  authUid?: string; // UID Firebase Auth hasil sinkronisasi
  authSyncError?: string; // Pesan jika akun gagal disinkronkan ke Firebase Auth
}

export type SlotStatus = 'tersedia' | 'hadir' | 'off';

export interface ScheduleSlot {
  id: string;
  timeRange: string; // e.g. "07:30 - 09:00"
  day: DayOfWeek;
  coach: string; // e.g. "C. Dewi"
  status: SlotStatus; // hadir (hijau), belum absen (netral/tersedia), off (merah: admin sibuk/tidak bisa melatih)
  participants: string[];
  isGroup?: boolean;
  location?: string;
  notes?: string;
}

export type RequestStatus =
  | 'pending'
  | 'disetujui'
  | 'ditolak'
  | 'atur_ulang'
  | 'Pending'
  | 'Disetujui'
  | 'Ditolak'
  | 'Atur Ulang';

export interface ScheduleRequest {
  id: string;
  memberId?: string;
  memberName: string;
  whatsapp: string;
  day: DayOfWeek;
  timeRange: string;
  location: string;
  packageId?: string;
  status: RequestStatus;
  coachNote?: string;
  adminNotes?: string;
  createdAt: string;
  requestDate?: string;
  attended?: boolean;
}

export interface PackageTier {
  name: string;
  sessionsCount: number;
  price: number;
  formattedPrice: string;
}

export interface PricePackage {
  id: string;
  category: 'reguler' | 'privat' | 'group_prestasi';
  title: string;
  subtitle: string;
  badge: string;
  maxPeople: string;
  pricingTiers: PackageTier[];
  features: string[];
  note: string;
  accentColor: string;
}

export interface DocumentationItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  quote: string;
  rating: number;
}

export interface TestimonialSubmission {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
  createdAtMs: number;
}

export interface SwimGearProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  formattedPrice: string;
  imageUrl: string;
  description: string;
  stockStatus: 'Tersedia' | 'Pre-Order' | 'Habis';
  specifications?: string[];
}

export interface EvaluationCriterion {
  id: string;
  category: string;
  name: string;
  description: string;
  maxScore: number;
}

export interface CriterionGrade {
  criterionId: string;
  criterionName: string;
  category: string;
  score: number;
  predicate: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Latihan';
  notes: string;
  timeRecord?: {
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
    formatted?: string;
  };
}

export interface ClubInvoice {
  id: string; // e.g. "INV-001"
  memberId: string;
  memberName: string;
  monthPeriod: string; // e.g. "September 2026"
  packageId?: string;
  packageName: string; // Price package title from pricelist
  amount: number;
  formattedAmount: string;
  status: 'Lunas' | 'Menunggu Pembayaran';
  paymentMethod?: string; // "Transfer BCA" | "Transfer Mandiri" | "QRIS" | "Tunai"
  paidAt?: string;
  dueDate: string;
  receiptNumber?: string;
  notes?: string;
}

export interface MemberReport {
  id: string;
  memberId: string;
  memberName: string;
  period: string;
  evaluationDate: string;
  coachName: string;
  currentLevel: string;
  grades: CriterionGrade[];
  averageScore: number;
  overallPredicate: string;
  coachEvaluation: string;
  recommendations: string;
  attendanceSummary: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  timeRange: string;
  day: DayOfWeek;
  location: string;
  coach: string;
  status: 'Hadir' | 'Izin' | 'Alpha' | 'Admin Libur';
  notes?: string;
}

export interface ZipEocd {
  offset?: number;
  signature?: number;
  diskNumber: number;
  centralDirStartDisk: number;
  entriesThisDisk?: number;
  entriesOnThisDisk?: number;
  totalEntries: number;
  centralDirSize: number;
  centralDirOffset: number;
  commentLength: number;
  comment: string;
}

export interface ZipCentralDirectoryEntry {
  offset?: number;
  signature?: number;
  versionMadeBy: number;
  versionNeeded: number;
  flags: number;
  compressionMethod: number;
  lastModTime: number;
  lastModDate: number;
  crc32: number;
  compressedSize: number;
  uncompressedSize: number;
  fileNameLength: number;
  extraFieldLength: number;
  fileCommentLength: number;
  diskNumberStart: number;
  internalAttributes: number;
  externalAttributes: number;
  localHeaderOffset: number;
  fileName: string;
  fileComment: string;
}

export interface ZipLocalHeader {
  offset: number;
  signature?: number;
  versionNeeded: number;
  flags: number;
  compressionMethod: number;
  lastModTime: number;
  lastModDate: number;
  crc32: number;
  compressedSize: number;
  uncompressedSize: number;
  fileNameLength: number;
  extraFieldLength: number;
  fileName: string;
  extraField: Uint8Array;
  dataOffset: number;
  compressedData?: Uint8Array;
  hasDataDescriptor: boolean;
  actualCompressedSize?: number;
  actualCrc32?: number;
  decompressedData?: Uint8Array;
  status: 'healthy' | 'warning' | 'corrupted';
  issues: string[];
}

export interface ZipDiagnosticIssue {
  level: 'info' | 'warning' | 'error';
  code: string;
  message: string;
  detail?: string;
}

export interface ZipDiagnosticReport {
  fileName: string;
  fileSizeBytes: number;
  hasValidEocd: boolean;
  eocd?: ZipEocd;
  localHeadersFound: ZipLocalHeader[];
  centralDirEntriesFound: ZipCentralDirectoryEntry[];
  garbageAtStartBytes: number;
  garbageAtEndBytes: number;
  issues: ZipDiagnosticIssue[];
  healthScore: number;
  canRebuildCentralDir: boolean;
  canRepackExtracted: boolean;
  repairedFileCount: number;
}

// ---------- Riwayat login & status online ----------
export type LoginEvent = 'login' | 'logout' | 'auto_logout' | 'login_failed';

export interface LoginLog {
  id: string;
  uid?: string;
  email: string;
  name?: string;
  role: UserRole | 'unknown';
  event: LoginEvent;
  method?: 'google' | 'password';
  reason?: string;
  device: string;
  createdAtMs: number;
}

export interface PresenceRecord {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  memberId?: string;
  state: 'online' | 'offline';
  lastSeenMs: number;
  device: string;
}
