/**
 * Ekspor Excel (.xlsx) dengan judul, header berwarna & lebar kolom.
 * ExcelJS dimuat hanya saat dipakai (dynamic import) agar website tetap ringan.
 */
import { ClubSettings, Member, MemberReport } from '../types';
import { getInvoiceHeader } from './printHtml';

export interface XlsxColumn {
  header: string;
  key: string;
  width?: number;
  type?: 'text' | 'number';
}

export interface XlsxSheet {
  name: string;
  title: string;
  subtitle?: string;
  columns: XlsxColumn[];
  rows: Record<string, string | number>[];
}

const safeSheetName = (n: string) => n.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Sheet';

export async function exportXlsx(fileName: string, settings: ClubSettings, sheets: XlsxSheet[]): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  const kop = getInvoiceHeader(settings);
  wb.creator = kop.clubName;
  wb.created = new Date();

  sheets.forEach((sh) => {
    const ws = wb.addWorksheet(safeSheetName(sh.name), { views: [{ state: 'frozen', ySplit: 4 }] });
    const n = sh.columns.length;
    ws.columns = sh.columns.map((c) => ({ key: c.key, width: c.width || 16 }));

    ws.mergeCells(1, 1, 1, n);
    ws.getCell(1, 1).value = `${kop.clubName} — ${sh.title}`;
    ws.getCell(1, 1).font = { bold: true, size: 14 };
    ws.mergeCells(2, 1, 2, n);
    ws.getCell(2, 1).value = sh.subtitle || `${kop.tagline} • Diekspor ${new Date().toLocaleString('id-ID')}`;
    ws.getCell(2, 1).font = { italic: true, size: 9, color: { argb: 'FF64748B' } };

    const header = ws.getRow(4);
    sh.columns.forEach((c, i) => {
      const cell = header.getCell(i + 1);
      cell.value = c.header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7490' } };
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF94A3B8' } } };
    });
    header.height = 22;

    sh.rows.forEach((r, ri) => {
      const row = ws.getRow(5 + ri);
      sh.columns.forEach((c, ci) => {
        const cell = row.getCell(ci + 1);
        const v = r[c.key];
        // Kolom teks (mis. No. HP) disimpan sebagai teks agar angka 0 di depan tidak hilang
        cell.value =
          c.type === 'number'
            ? Number(v || 0)
            : c.type !== 'text' && typeof v === 'number'
            ? v
            : v === undefined || v === null
            ? ''
            : String(v);
        if (c.type === 'text') cell.numFmt = '@';
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFCBD5E1' } } };
      });
      if (ri % 2 === 1) {
        row.eachCell((cell) => (cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }));
      }
    });
    if (sh.rows.length) ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + sh.rows.length, column: n } };
  });

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const stamp = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Laporan Rekap Kehadiran → Excel. */
export function exportAttendanceXlsx(members: Member[], settings: ClubSettings, statusLabel: string) {
  const period = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  return exportXlsx(`Laporan-Absensi-${stamp()}`, settings, [
    {
      name: 'Laporan Absensi',
      title: `Laporan Rekap Kehadiran & Sesi Member (${period})`,
      subtitle: `Status: ${statusLabel} • ${members.length} siswa • Diekspor ${new Date().toLocaleString('id-ID')}`,
      columns: [
        { header: 'No', key: 'no', width: 6, type: 'number' },
        { header: 'ID Member', key: 'id', width: 13, type: 'text' },
        { header: 'Nama Siswa', key: 'name', width: 30 },
        { header: 'Level', key: 'level', width: 14 },
        { header: 'Usia / TTL', key: 'age', width: 14 },
        { header: 'Hari Latihan', key: 'day', width: 12 },
        { header: 'Jam Latihan', key: 'time', width: 15 },
        { header: 'Hadir (Sesi)', key: 'att', width: 11, type: 'number' },
        { header: 'Kuota (Sesi)', key: 'quota', width: 11, type: 'number' },
        { header: 'Sisa (Sesi)', key: 'rest', width: 11, type: 'number' },
        { header: 'Kehadiran %', key: 'pct', width: 12, type: 'number' },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Orang Tua / Wali', key: 'parent', width: 24 },
        { header: 'No. WhatsApp', key: 'wa', width: 16, type: 'text' },
      ],
      rows: members.map((m, i) => {
        const att = m.attendedSessions || 0;
        const quota = m.totalSessionsAllowed || 0;
        return {
          no: i + 1,
          id: m.id,
          name: m.fullName,
          level: m.currentLevel || 'Pemula',
          age: m.ageOrDob || '',
          day: m.preferredDay || '',
          time: m.preferredTime || '',
          att,
          quota,
          rest: Math.max(0, quota - att),
          pct: quota ? Math.round((att / quota) * 100) : 0,
          status: m.status || '',
          parent: m.parentName || '',
          wa: m.whatsapp || '',
        };
      }),
    },
  ]);
}

/** Arsip Rapor → Excel (sheet Ringkasan + sheet Rincian Nilai). */
export function exportRaporXlsx(reports: MemberReport[], settings: ClubSettings, fileName?: string) {
  const details: Record<string, string | number>[] = [];
  reports.forEach((r) =>
    (r.grades || []).forEach((g) =>
      details.push({
        name: r.memberName,
        id: r.memberId,
        period: r.period,
        criterion: g.criterionName,
        category: g.category,
        score: g.score,
        predicate: g.predicate,
        time: g.timeRecord?.formatted && g.timeRecord.formatted !== '00:00:00' ? g.timeRecord.formatted : '',
        notes: g.notes || '',
      })
    )
  );
  return exportXlsx(fileName || `Arsip-Rapor-${stamp()}`, settings, [
    {
      name: 'Ringkasan Rapor',
      title: 'Arsip Riwayat Rapor Ujian Siswa',
      columns: [
        { header: 'No', key: 'no', width: 6, type: 'number' },
        { header: 'ID Member', key: 'id', width: 13, type: 'text' },
        { header: 'Nama Siswa', key: 'name', width: 28 },
        { header: 'Periode', key: 'period', width: 18 },
        { header: 'Tgl Ujian', key: 'date', width: 12, type: 'text' },
        { header: 'Tingkat / Level', key: 'level', width: 26 },
        { header: 'Nilai Rata-rata', key: 'avg', width: 13, type: 'number' },
        { header: 'Predikat', key: 'pred', width: 16 },
        { header: 'Kehadiran', key: 'att', width: 22 },
        { header: 'Coach', key: 'coach', width: 22 },
        { header: 'Evaluasi Coach', key: 'eval', width: 45 },
        { header: 'Rekomendasi', key: 'rec', width: 45 },
      ],
      rows: reports.map((r, i) => ({
        no: i + 1,
        id: r.memberId,
        name: r.memberName,
        period: r.period,
        date: r.evaluationDate,
        level: r.currentLevel,
        avg: r.averageScore,
        pred: r.overallPredicate,
        att: r.attendanceSummary || '',
        coach: r.coachName || '',
        eval: r.coachEvaluation || '',
        rec: r.recommendations || '',
      })),
    },
    {
      name: 'Rincian Nilai',
      title: 'Rincian Nilai & Catatan Waktu per Kriteria',
      columns: [
        { header: 'Nama Siswa', key: 'name', width: 26 },
        { header: 'ID Member', key: 'id', width: 13, type: 'text' },
        { header: 'Periode', key: 'period', width: 18 },
        { header: 'Kriteria', key: 'criterion', width: 30 },
        { header: 'Kategori', key: 'category', width: 14 },
        { header: 'Nilai', key: 'score', width: 8, type: 'number' },
        { header: 'Predikat', key: 'predicate', width: 14 },
        { header: 'Catatan Waktu', key: 'time', width: 14, type: 'text' },
        { header: 'Catatan', key: 'notes', width: 45 },
      ],
      rows: details,
    },
  ]);
}

/** Database Member → Excel. */
export function exportMembersXlsx(members: Member[], settings: ClubSettings) {
  return exportXlsx(`Database-Member-${stamp()}`, settings, [
    {
      name: 'Database Member',
      title: 'Database Member & Atlet',
      columns: [
        { header: 'No', key: 'no', width: 6, type: 'number' },
        { header: 'ID Member', key: 'id', width: 13, type: 'text' },
        { header: 'Nama Lengkap', key: 'name', width: 30 },
        { header: 'Jenis Kelamin', key: 'gender', width: 12 },
        { header: 'Usia / TTL', key: 'age', width: 14 },
        { header: 'Level', key: 'level', width: 14 },
        { header: 'Sekolah', key: 'school', width: 22 },
        { header: 'Orang Tua / Wali', key: 'parent', width: 24 },
        { header: 'No. WhatsApp', key: 'wa', width: 16, type: 'text' },
        { header: 'Alamat', key: 'address', width: 36 },
        { header: 'Lokasi Kolam', key: 'loc', width: 24 },
        { header: 'Hari', key: 'day', width: 10 },
        { header: 'Jam', key: 'time', width: 14 },
        { header: 'Hadir', key: 'att', width: 8, type: 'number' },
        { header: 'Kuota', key: 'quota', width: 8, type: 'number' },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Tgl Daftar', key: 'reg', width: 12, type: 'text' },
      ],
      rows: members.map((m, i) => ({
        no: i + 1,
        id: m.id,
        name: m.fullName,
        gender: m.gender || '',
        age: m.ageOrDob || '',
        level: m.currentLevel || '',
        school: m.school || '',
        parent: m.parentName || '',
        wa: m.whatsapp || '',
        address: m.address || '',
        loc: m.location || '',
        day: m.preferredDay || '',
        time: m.preferredTime || '',
        att: m.attendedSessions || 0,
        quota: m.totalSessionsAllowed || 0,
        status: m.status || '',
        reg: m.registrationDate || '',
      })),
    },
  ]);
}

/** Rapor satu siswa → Excel. */
export function exportSingleRaporXlsx(r: MemberReport, settings: ClubSettings) {
  const slug = `${r.memberName}-${r.period}`.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return exportRaporXlsx([r], settings, `Rapor-${slug}`);
}

import type { ClubInvoice } from '../types';
import { summarizeFinance, DashboardSnapshot } from './reportPrints';

/** Keuangan → Excel (Tagihan, Rekap per Periode, Distribusi Paket). */
export function exportFinanceXlsx(invoices: ClubInvoice[], settings: ClubSettings, scopeLabel: string) {
  const s = summarizeFinance(invoices);
  const slug = scopeLabel.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return exportXlsx(`Laporan-Keuangan-${slug || stamp()}`, settings, [
    {
      name: 'Daftar Tagihan',
      title: `Laporan Keuangan — ${scopeLabel}`,
      subtitle: `Total ${invoices.length} invoice • Tagihan Rp ${s.total.toLocaleString('id-ID')} • Lunas Rp ${s.paid.toLocaleString('id-ID')} • Piutang Rp ${s.outstanding.toLocaleString('id-ID')} • Kolektibilitas ${s.rate}%`,
      columns: [
        { header: 'No', key: 'no', width: 6, type: 'number' },
        { header: 'No. Invoice', key: 'id', width: 12, type: 'text' },
        { header: 'Nama', key: 'name', width: 28 },
        { header: 'Paket', key: 'pkg', width: 34 },
        { header: 'Periode', key: 'period', width: 16 },
        { header: 'Jatuh Tempo', key: 'due', width: 18, type: 'text' },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Tgl Bayar', key: 'paid', width: 26, type: 'text' },
        { header: 'Metode', key: 'method', width: 18 },
        { header: 'No. Kuitansi', key: 'kw', width: 22, type: 'text' },
        { header: 'Nominal (Rp)', key: 'amount', width: 14, type: 'number' },
      ],
      rows: invoices.map((i, idx) => ({
        no: idx + 1,
        id: i.id,
        name: i.memberName,
        pkg: i.packageName,
        period: i.monthPeriod,
        due: i.dueDate || '',
        status: i.status,
        paid: i.paidAt || '',
        method: i.paymentMethod || '',
        kw: i.receiptNumber || '',
        amount: Number(i.amount || 0),
      })),
    },
    {
      name: 'Rekap per Periode',
      title: 'Rekap Pendapatan per Periode',
      columns: [
        { header: 'Periode', key: 'period', width: 18 },
        { header: 'Jumlah Invoice', key: 'count', width: 14, type: 'number' },
        { header: 'Total Tagihan (Rp)', key: 'total', width: 18, type: 'number' },
        { header: 'Lunas (Rp)', key: 'paid', width: 16, type: 'number' },
        { header: 'Piutang (Rp)', key: 'out', width: 16, type: 'number' },
      ],
      rows: s.byPeriod.map((p) => ({ period: p.period, count: p.count, total: p.total, paid: p.paid, out: p.total - p.paid })),
    },
    {
      name: 'Distribusi Paket',
      title: 'Distribusi Pendapatan per Paket (Lunas)',
      columns: [
        { header: 'Paket', key: 'pkg', width: 38 },
        { header: 'Jumlah Invoice', key: 'count', width: 14, type: 'number' },
        { header: 'Pendapatan Lunas (Rp)', key: 'total', width: 20, type: 'number' },
        { header: 'Porsi (%)', key: 'pct', width: 10, type: 'number' },
      ],
      rows: s.byPackage.map((p) => ({ pkg: p.pkg, count: p.count, total: p.total, pct: s.paid ? Math.round((p.total / s.paid) * 100) : 0 })),
    },
  ]);
}

/** Dashboard → Excel (Ringkasan, Presensi Hari Ini, Iuran Bulan Ini). */
export function exportDashboardXlsx(d: DashboardSnapshot, settings: ClubSettings) {
  const fin = summarizeFinance(d.monthInvoices);
  const hadir = d.activeMembers.filter((m) => d.todayStatus[m.id] === 'Hadir').length;
  const izin = d.activeMembers.filter((m) => d.todayStatus[m.id] === 'Izin' || d.todayStatus[m.id] === 'Sakit').length;
  return exportXlsx(`Dashboard-${stamp()}`, settings, [
    {
      name: 'Ringkasan',
      title: `Ringkasan Operasional Klub — ${d.dateLabel}`,
      columns: [
        { header: 'Indikator', key: 'k', width: 36 },
        { header: 'Nilai', key: 'v', width: 30 },
      ],
      rows: [
        { k: 'Atlet aktif', v: d.activeMembers.length },
        { k: 'Hadir hari ini', v: hadir },
        { k: 'Izin / sakit hari ini', v: izin },
        { k: 'Belum diisi presensi', v: d.activeMembers.length - hadir - izin },
        { k: `Total tagihan ${d.monthLabel} (Rp)`, v: fin.total },
        { k: `Terkumpul ${d.monthLabel} (Rp)`, v: fin.paid },
        { k: 'Kolektibilitas iuran (%)', v: fin.rate },
        { k: 'Rapor terbit', v: d.reportsCount },
        { k: 'Periode rapor terakhir', v: d.latestReportPeriod || '-' },
        { k: 'Pengajuan jadwal menunggu validasi', v: d.pendingRequests },
      ],
    },
    {
      name: 'Presensi Hari Ini',
      title: `Status Kehadiran ${d.dateLabel}`,
      columns: [
        { header: 'No', key: 'no', width: 6, type: 'number' },
        { header: 'ID Member', key: 'id', width: 13, type: 'text' },
        { header: 'Nama Atlet', key: 'name', width: 30 },
        { header: 'Skuad / Level', key: 'squad', width: 18 },
        { header: 'Sesi Hadir', key: 'att', width: 10, type: 'number' },
        { header: 'Kuota', key: 'quota', width: 8, type: 'number' },
        { header: 'Status Hari Ini', key: 'st', width: 16 },
      ],
      rows: d.activeMembers.map((m, i) => ({
        no: i + 1,
        id: m.id,
        name: m.fullName,
        squad: m.squad || m.currentLevel || '',
        att: m.attendedSessions || 0,
        quota: m.totalSessionsAllowed || 0,
        st: d.todayStatus[m.id] || 'Belum diisi',
      })),
    },
    {
      name: 'Iuran Bulan Ini',
      title: `Iuran ${d.monthLabel}`,
      columns: [
        { header: 'Nama', key: 'name', width: 28 },
        { header: 'Paket', key: 'pkg', width: 34 },
        { header: 'Status', key: 'st', width: 12 },
        { header: 'Nominal (Rp)', key: 'amt', width: 14, type: 'number' },
      ],
      rows: d.monthInvoices.map((i) => ({ name: i.memberName, pkg: i.packageName, st: i.status, amt: Number(i.amount || 0) })),
    },
  ]);
}
