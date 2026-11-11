import { getIsolatedAuth, signInWithPopup, signOut } from '../firebase';
import { authErrorMessage } from './memberAuth';
import { GoogleAuthProvider } from 'firebase/auth';
import {
  Member,
  MemberAccount,
  AttendanceRecord,
  ScheduleSlot,
  ScheduleRequest,
  MemberReport,
  ClubSettings,
  PricePackage,
  ClubInvoice,
  TestimonialItem,
  TestimonialSubmission,
  SwimGearProduct,
  DocumentationItem,
  EvaluationCriterion,
  LoginLog,
} from '../types';

// Scope minimal & non-sensitif: aplikasi hanya membuat/menulis file miliknya sendiri
// (Sheets API & Drive upload menerima drive.file untuk file yang dibuat aplikasi).
export const WORKSPACE_SCOPES = ['https://www.googleapis.com/auth/drive.file'];

/** Rentang A1 yang aman untuk nama sheet berspasi / simbol (&, #, .). */
const a1 = (sheetName: string) => encodeURIComponent(`'${sheetName.replace(/'/g, "''")}'!A1`);

/** fetch ke Google API yang selalu melempar pesan jelas jika gagal. */
async function gfetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, init);
  if (res.ok) return res;
  let detail = '';
  try {
    const j = await res.clone().json();
    detail = j?.error?.message || '';
  } catch {
    detail = await res.text().catch(() => '');
  }
  if (res.status === 401) clearGoogleAccessToken();
  if (/has not been used|is disabled|SERVICE_DISABLED/i.test(detail)) {
    throw new Error(
      'Google Sheets API / Google Drive API belum diaktifkan di project Firebase "ds-aquatics". Aktifkan keduanya di Google Cloud Console → APIs & Services → Library, tunggu 1–2 menit, lalu coba lagi.'
    );
  }
  throw new Error(`Google API error (${res.status}): ${detail || res.statusText}`);
}

// Provider terpisah khusus Workspace, agar login biasa tidak meminta izin Drive/Sheets
const workspaceProvider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => workspaceProvider.addScope(scope));

// Token hanya disimpan di memori (tidak di localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Request or retrieve Google OAuth Access Token for Sheets & Drive operations.
 * Memakai instance Auth terisolasi supaya sesi login admin tidak berganti akun.
 */
export async function getGoogleAccessToken(forceNew = false): Promise<string> {
  const now = Date.now();
  if (!forceNew && cachedAccessToken && tokenExpiresAt > now) {
    return cachedAccessToken;
  }

  const wsAuth = getIsolatedAuth('workspace');
  let result;
  try {
    result = await signInWithPopup(wsAuth, workspaceProvider);
  } catch (e) {
    const code = (e as { code?: string })?.code || '';
    if (code === 'auth/popup-blocked') {
      throw new Error('Popup Google diblokir browser. Izinkan popup untuk situs ini lalu klik lagi.');
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new Error('Proses izin Google dibatalkan.');
    }
    throw new Error(authErrorMessage(e));
  }
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;
  signOut(wsAuth).catch(() => {});

  if (!token) {
    throw new Error('Gagal mendapatkan Google Access Token. Pastikan izin akses disetujui.');
  }

  cachedAccessToken = token;
  tokenExpiresAt = now + 50 * 60 * 1000; // ~50 minutes
  return token;
}

export function clearGoogleAccessToken() {
  cachedAccessToken = null;
  tokenExpiresAt = 0;
}

export interface GoogleExportResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  fileId?: string;
  fileUrl?: string;
  title: string;
  timestamp: string;
  error?: string;
}

/**
 * Export all members to a new Google Sheet
 */
export async function exportMembersToGoogleSheets(
  members: Member[],
  clubName = 'DS AQUATICS'
): Promise<GoogleExportResult> {
  const token = await getGoogleAccessToken();
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const title = `${clubName} - Data Siswa Renang (${dateStr})`;

  // 1. Create Spreadsheet
  const createRes = await gfetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Data Siswa',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Google Sheets API Error (${createRes.status}): ${errText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare Rows
  const headers = [
    'ID Member',
    'Nama Lengkap',
    'Tanggal Lahir',
    'Jenis Kelamin',
    'Tingkat / Level',
    'Paket Latihan',
    'Jadwal Pilihan',
    'Lokasi Kolam',
    'Status Member',
    'Sumber Pendaftaran',
    'No. WhatsApp',
    'Nama Wali / Ortu',
    'Asal Sekolah',
    'Alamat',
    'Tujuan Latihan',
    'Kondisi Khusus',
    'Tanggal Daftar',
    'Sesi Diambil',
    'Total Kuota Sesi',
  ];

  const rows = members.map((m) => [
    m.id,
    m.fullName,
    m.ageOrDob || '-',
    m.gender,
    m.currentLevel,
    m.selectedPackageId,
    `${m.preferredDay}, ${m.preferredTime}`,
    m.location,
    m.status,
    m.source === 'manual_admin' ? 'Input Manual Admin' : 'Formulir Online',
    m.whatsapp,
    m.parentName || '-',
    m.school || '-',
    m.address || '-',
    m.goal || '-',
    m.specialConditions || '-',
    m.registrationDate,
    m.attendedSessions,
    m.totalSessionsAllowed,
  ]);

  const values = [headers, ...rows];

  // 3. Append Values
  const appendRes = await gfetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${a1('Data Siswa')}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'Data Siswa'!A1`,
        majorDimension: 'ROWS',
        values,
      }),
    }
  );

  if (!appendRes.ok) {
    const errText = await appendRes.text();
    throw new Error(`Gagal menulis baris ke Google Sheets: ${errText}`);
  }

  return {
    success: true,
    spreadsheetId,
    spreadsheetUrl,
    title,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Export Attendance Records & Schedule Slots to Google Sheets
 */
export async function exportAttendanceToGoogleSheets(
  records: AttendanceRecord[],
  slots: ScheduleSlot[],
  clubName = 'DS AQUATICS'
): Promise<GoogleExportResult> {
  const token = await getGoogleAccessToken();
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const title = `${clubName} - Rekapitulasi Absensi & Jadwal (${dateStr})`;

  const createRes = await gfetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          properties: {
            title: 'Rekap Absensi',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Matriks Jadwal',
            gridProperties: { frozenRowCount: 1 },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Google Sheets API Error (${createRes.status}): ${errText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Write sheet 1: Absensi
  const attendanceHeaders = [
    'ID Absensi',
    'Tanggal',
    'Hari',
    'Jam Latihan',
    'ID Siswa',
    'Nama Siswa',
    'Lokasi Kolam',
    'Coach',
    'Status Kehadiran',
    'Keterangan',
  ];
  const attendanceRows = records.map((r) => [
    r.id,
    r.date,
    r.day,
    r.timeRange,
    r.memberId,
    r.memberName,
    r.location,
    r.coach,
    r.status,
    r.notes || '-',
  ]);

  await gfetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${a1('Rekap Absensi')}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [attendanceHeaders, ...attendanceRows],
      }),
    }
  );

  // Write sheet 2: Matriks Jadwal
  const slotHeaders = ['Hari', 'Jam Sesi', 'Coach', 'Lokasi', 'Status Slot', 'Daftar Siswa'];
  const slotRows = slots.map((s) => [
    s.day,
    s.timeRange,
    s.coach,
    s.location,
    s.status,
    s.participants.join(', '),
  ]);

  await gfetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${a1('Matriks Jadwal')}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [slotHeaders, ...slotRows],
      }),
    }
  );

  return {
    success: true,
    spreadsheetId,
    spreadsheetUrl,
    title,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Backup Complete Club Data directly to Google Drive as a JSON Archive
 */
export async function backupClubDataToGoogleDrive(
  data: {
    members: Member[];
    memberReports: MemberReport[];
    attendanceRecords: AttendanceRecord[];
    scheduleSlots: ScheduleSlot[];
    settings: ClubSettings;
  },
  clubName = 'DS AQUATICS'
): Promise<GoogleExportResult> {
  const token = await getGoogleAccessToken();
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `Backup_${clubName.replace(/\s+/g, '_')}_${dateStr}.json`;

  const fileContent = JSON.stringify(
    {
      backupVersion: '1.0',
      exportedAt: new Date().toISOString(),
      club: clubName,
      data,
    },
    null,
    2
  );

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: `Cadangan data resmi ${clubName} yang diekspor pada ${new Date().toLocaleString('id-ID')}`,
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const res = await gfetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Drive API Error (${res.status}): ${errText}`);
  }

  const uploadedFile = await res.json();
  const fileId = uploadedFile.id;
  const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;

  return {
    success: true,
    fileId,
    fileUrl,
    title: fileName,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Export Member Reports and Time Records to Google Sheets
 */
export async function exportReportsToGoogleSheets(
  reports: MemberReport[],
  clubName = 'DS AQUATICS'
): Promise<GoogleExportResult> {
  const token = await getGoogleAccessToken();
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const title = `${clubName} - Rapor Ujian & Catatan Waktu (${dateStr})`;

  const createRes = await gfetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          properties: {
            title: 'Ringkasan Rapor',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Detail Kriteria & Waktu',
            gridProperties: { frozenRowCount: 1 },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Google Sheets API Error (${createRes.status}): ${errText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 1. Ringkasan Rapor
  const summaryHeaders = [
    'ID Rapor',
    'ID Member',
    'Nama Siswa',
    'Periode',
    'Tanggal Ujian',
    'Level Saat Ini',
    'Pelatih Penguji',
    'Nilai Rata-rata',
    'Predikat',
    'Ringkasan Kehadiran',
    'Evaluasi Pelatih',
    'Rekomendasi',
  ];

  const summaryRows = reports.map((r) => [
    r.id,
    r.memberId,
    r.memberName,
    r.period,
    r.evaluationDate,
    r.currentLevel,
    r.coachName,
    r.averageScore,
    r.overallPredicate,
    r.attendanceSummary || '-',
    r.coachEvaluation,
    r.recommendations,
  ]);

  await gfetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${a1('Ringkasan Rapor')}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [summaryHeaders, ...summaryRows],
      }),
    }
  );

  // 2. Detail Kriteria & Waktu
  const detailHeaders = [
    'ID Rapor',
    'Nama Siswa',
    'Periode',
    'Kategori Kriteria',
    'Nama Indikator',
    'Skor (0-100)',
    'Predikat',
    'Catatan Waktu (Jam)',
    'Catatan Waktu (Menit)',
    'Catatan Waktu (Detik)',
    'Format Waktu',
    'Catatan Pelatih',
  ];

  const detailRows: any[] = [];
  reports.forEach((r) => {
    (r.grades || []).forEach((g) => {
      detailRows.push([
        r.id,
        r.memberName,
        r.period,
        g.category,
        g.criterionName,
        g.score,
        g.predicate,
        g.timeRecord?.hours ?? '-',
        g.timeRecord?.minutes ?? '-',
        g.timeRecord?.seconds ?? '-',
        g.timeRecord?.formatted || '-',
        g.notes || '-',
      ]);
    });
  });

  if (detailRows.length > 0) {
    await gfetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${a1('Detail Kriteria & Waktu')}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [detailHeaders, ...detailRows],
        }),
      }
    );
  }

  return {
    success: true,
    spreadsheetId,
    spreadsheetUrl,
    title,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Export all Member Accounts to a dedicated Google Sheet
 */
export async function exportMemberAccountsToGoogleSheets(
  accounts: MemberAccount[],
  clubName = 'DS AQUATICS'
): Promise<GoogleExportResult> {
  const token = await getGoogleAccessToken();
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const title = `${clubName} - Data Akun Member & Login (${dateStr})`;

  const createRes = await gfetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [{ properties: { title: 'Akun Member' } }],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Gagal membuat Google Sheet: ${errText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl;

  const headers = [
    'ID Akun',
    'ID Member Terkait',
    'Nama Lengkap',
    'Email (Username Login)',
    'Password Kustom',
    'No. WhatsApp',
    'Status Akun',
    'Tanggal Registrasi Akun',
    'Catatan Akun',
  ];

  const rows = accounts.map((a) => [
    a.id,
    a.memberId || '-',
    a.fullName,
    a.email,
    a.password || 'renang123',
    a.whatsapp || '-',
    a.status,
    a.createdAt || '-',
    a.notes || '-',
  ]);

  await gfetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${a1('Akun Member')}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [headers, ...rows] }),
    }
  );

  return {
    success: true,
    spreadsheetId,
    spreadsheetUrl,
    title,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Export ALL Club data (Members, Accounts, Schedules, Attendance, Reports, Packages, Settings)
 * into a single comprehensive Master Google Spreadsheet with multiple tabbed sheets!
 */
export async function exportAllClubDataToMasterGoogleSheet(params: {
  clubName?: string;
  members: Member[];
  memberAccounts: MemberAccount[];
  scheduleSlots: ScheduleSlot[];
  scheduleRequests: ScheduleRequest[];
  attendanceRecords: AttendanceRecord[];
  memberReports: MemberReport[];
  pricePackages: PricePackage[];
  settings: ClubSettings;
  // Data tambahan agar Master benar-benar mencakup seluruh database
  clubInvoices?: ClubInvoice[];
  testimonials?: TestimonialItem[];
  testimonialSubmissions?: TestimonialSubmission[];
  swimGear?: SwimGearProduct[];
  documentation?: DocumentationItem[];
  evaluationCriteria?: EvaluationCriterion[];
  loginLogs?: LoginLog[];
  /** Dipanggil SETELAH izin Google didapat (agar popup tidak diblokir). */
  loadDailyAttendance?: () => Promise<
    { date: string; memberId: string; memberName: string; status: string; session?: string; location?: string; note?: string }[]
  >;
}): Promise<GoogleExportResult> {
  const token = await getGoogleAccessToken();
  const dailyAttendance = params.loadDailyAttendance ? await params.loadDailyAttendance().catch(() => []) : [];

  // Tab tambahan (8 dst.)
  const extraSheets: { title: string; values: (string | number)[][] }[] = [
    {
      title: '8. Keuangan - Tagihan',
      values: [
        ['No. Invoice', 'Nama', 'Paket', 'Periode', 'Nominal (Rp)', 'Status', 'Jatuh Tempo', 'Tgl Bayar', 'Metode', 'No. Kuitansi'],
        ...(params.clubInvoices || []).map((i) => [
          i.id, i.memberName, i.packageName, i.monthPeriod, Number(i.amount || 0), i.status,
          i.dueDate || '-', i.paidAt || '-', i.paymentMethod || '-', i.receiptNumber || '-',
        ]),
      ],
    },
    {
      title: '9. Rincian Nilai Rapor',
      values: [
        ['ID Rapor', 'Nama Siswa', 'Periode', 'Kriteria', 'Kategori', 'Nilai', 'Predikat', 'Catatan Waktu', 'Catatan'],
        ...params.memberReports.flatMap((r) =>
          (r.grades || []).map((g) => [
            r.id, r.memberName, r.period, g.criterionName, g.category, g.score, g.predicate,
            g.timeRecord?.formatted && g.timeRecord.formatted !== '00:00:00' ? g.timeRecord.formatted : '-', g.notes || '-',
          ])
        ),
      ],
    },
    {
      title: '10. Kriteria Penilaian',
      values: [
        ['ID', 'Kategori', 'Nama Kriteria', 'Deskripsi', 'Nilai Maks'],
        ...(params.evaluationCriteria || []).map((c) => [c.id, c.category, c.name, c.description, c.maxScore]),
      ],
    },
    {
      title: '11. Testimoni',
      values: [
        ['Status', 'Nama', 'Keterangan', 'Bintang', 'Isi Testimoni'],
        ...(params.testimonials || []).map((t) => ['Tampil di website', t.name, t.role, t.rating, t.quote]),
        ...(params.testimonialSubmissions || []).map((t) => ['Menunggu persetujuan', t.name, t.role, t.rating, t.quote]),
      ],
    },
    {
      title: '12. Perlengkapan Renang',
      values: [
        ['ID', 'Nama Produk', 'Kategori', 'Harga (Rp)', 'Stok', 'Deskripsi'],
        ...(params.swimGear || []).map((g) => [g.id, g.name, g.category, Number(g.price || 0), g.stockStatus, g.description]),
      ],
    },
    {
      title: '13. Galeri Dokumentasi',
      values: [
        ['ID', 'Judul', 'Tanggal', 'Deskripsi'],
        ...(params.documentation || []).map((d) => [d.id, d.title, d.date, d.description]),
      ],
    },
    {
      title: '14. Riwayat Login',
      values: [
        ['Waktu', 'Nama', 'Email', 'Peran', 'Kejadian', 'Metode', 'Perangkat', 'Keterangan'],
        ...(params.loginLogs || []).map((l) => [
          new Date(l.createdAtMs).toLocaleString('id-ID'), l.name || '-', l.email, l.role, l.event, l.method || '-', l.device, l.reason || '-',
        ]),
      ],
    },
  ];
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const title = `${params.clubName || 'DS AQUATICS'} - Master Database Terpadu (${dateStr})`;

  const createRes = await gfetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        { properties: { title: '1. Data Siswa Renang' } },
        { properties: { title: '2. Akun Login Member' } },
        { properties: { title: '3. Jadwal & Matriks' } },
        { properties: { title: '4. Pengajuan Jadwal' } },
        { properties: { title: '5. Absensi Kehadiran' } },
        { properties: { title: '6. Rapor Ujian Siswa' } },
        { properties: { title: '7. Paket & Profil Club' } },
        ...extraSheets.map((x) => ({ properties: { title: x.title } })),
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Gagal membuat Master Google Sheet: ${errText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl;

  // 1. Data Siswa Renang
  const membersHeaders = [
    'ID Siswa', 'Nama Lengkap', 'Email', 'No. WhatsApp', 'Tanggal Lahir/Usia',
    'Jenis Kelamin', 'Sekolah', 'Tingkat Kemampuan', 'Paket Terpilih',
    'Hari Pilihan', 'Jam Pilihan', 'Lokasi Latihan', 'Status', 'Sesi Diambil',
    'Total Kuota Sesi', 'Target/Tujuan', 'Nama Orang Tua/Wali', 'Alamat',
  ];
  const membersRows = params.members.map((m) => [
    m.id, m.fullName, m.email || '-', m.whatsapp, m.ageOrDob, m.gender,
    m.school, m.currentLevel, m.selectedPackageId, m.preferredDay || '-',
    m.preferredTime || '-', m.location || '-', m.status, m.attendedSessions,
    m.totalSessionsAllowed, m.goal, m.parentName, m.address,
  ]);
  await gfetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${a1('1. Data Siswa Renang')}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [membersHeaders, ...membersRows] }),
    }
  );

  // 2. Akun Login Member
  const accountsHeaders = [
    'ID Akun', 'ID Member Terkait', 'Nama Siswa', 'Email (Username Login)',
    'Password Kustom', 'No. WhatsApp', 'Status Akun', 'Dibuat Pada', 'Catatan',
  ];
  const accountsRows = params.memberAccounts.map((a) => [
    a.id, a.memberId || '-', a.fullName, a.email, a.password || 'renang123',
    a.whatsapp || '-', a.status, a.createdAt || '-', a.notes || '-',
  ]);
  await gfetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${a1('2. Akun Login Member')}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [accountsHeaders, ...accountsRows] }),
    }
  );

  // 3. Jadwal & Matriks
  const scheduleHeaders = ['ID Slot', 'Hari', 'Jam Latihan', 'Pelatih / Coach', 'Status', 'Peserta', 'Lokasi'];
  const scheduleRows = params.scheduleSlots.map((s) => [
    s.id, s.day, s.timeRange, s.coach, s.status, s.participants.join(', '), s.location,
  ]);
  await gfetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${a1('3. Jadwal & Matriks')}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [scheduleHeaders, ...scheduleRows] }),
    }
  );

  // 4. Pengajuan Jadwal
  const reqHeaders = ['ID Pengajuan', 'Nama Siswa', 'WhatsApp', 'Hari Diajukan', 'Jam Diajukan', 'Lokasi', 'Status', 'Catatan Coach', 'Diajukan Pada'];
  const reqRows = params.scheduleRequests.map((r) => [
    r.id, r.memberName, r.whatsapp, r.day, r.timeRange, r.location, r.status, r.coachNote || '-', r.createdAt,
  ]);
  await gfetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${a1('4. Pengajuan Jadwal')}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [reqHeaders, ...reqRows] }),
    }
  );

  // 5. Absensi Kehadiran
  const attHeaders = ['ID Rekor', 'ID Member', 'Nama Siswa', 'Hari Latihan', 'Jam Latihan', 'Status Kehadiran', 'Tanggal Rekor', 'Lokasi & Pelatih'];
  const attRows = dailyAttendance.length
    ? dailyAttendance
        .sort((x, y) => (x.date < y.date ? 1 : -1))
        .map((a) => [`${a.date}_${a.memberId}`, a.memberId, a.memberName, '-', a.session || '-', a.status, a.date, `${a.location || '-'}${a.note ? ` • ${a.note}` : ''}`])
    : params.attendanceRecords.map((a) => [
        a.id, a.memberId, a.memberName, a.day, a.timeRange, a.status, a.date || '-', `${a.location || '-'} (${a.coach || '-'})`,
      ]);
  await gfetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${a1('5. Absensi Kehadiran')}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [attHeaders, ...attRows] }),
    }
  );

  // 6. Rapor Ujian Siswa
  const reportHeaders = ['ID Rapor', 'Nama Siswa', 'Tingkatan/Level', 'Periode', 'Pelatih Penilai', 'Rata-rata Nilai', 'Predikat', 'Evaluasi Pelatih', 'Tanggal Ujian'];
  const reportRows = params.memberReports.map((rp) => {
    const avgScore = rp.averageScore || (rp.grades && rp.grades.length > 0
      ? Math.round(rp.grades.reduce((sum, g) => sum + g.score, 0) / rp.grades.length)
      : 0);
    return [rp.id, rp.memberName, rp.currentLevel, rp.period, rp.coachName, avgScore, rp.overallPredicate || '-', rp.coachEvaluation || rp.recommendations || '-', rp.evaluationDate];
  });
  await gfetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${a1('6. Rapor Ujian Siswa')}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [reportHeaders, ...reportRows] }),
    }
  );

  // 7. Paket & Profil Club
  const clubHeaders = ['Kunci Pengaturan', 'Nilai Konfigurasi'];
  const clubRows = [
    ['Nama Klub', params.settings.clubName],
    ['Slogan / Subtitle', params.settings.slogan],
    ['Nomor WhatsApp Utama', params.settings.phoneWa],
    ['Instagram Resmi', params.settings.instagramUrl],
    ['Kolam Cabang 1', `${params.settings.lestarindoName} (${params.settings.lestarindoAddress})`],
    ['Kolam Cabang 2', `${params.settings.frontOneName} (${params.settings.frontOneAddress})`],
    ['Rekening Pembayaran', `${params.settings.paymentAccountName} - BCA: ${params.settings.paymentBca}, BRI: ${params.settings.paymentBri}`],
    ['Total Paket Latihan Terdaftar', `${params.pricePackages.length} paket`],
  ];
  params.pricePackages.forEach((pkg) => {
    clubRows.push([`Paket: ${pkg.title}`, `${pkg.subtitle} | Kategori: ${pkg.category}`]);
  });
  await gfetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${a1('7. Paket & Profil Club')}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [clubHeaders, ...clubRows] }),
    }
  );

  for (const x of extraSheets) {
    await gfetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${a1(x.title)}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: x.values }),
      }
    );
  }

  return {
    success: true,
    spreadsheetId,
    spreadsheetUrl,
    title,
    timestamp: new Date().toISOString(),
  };
}
