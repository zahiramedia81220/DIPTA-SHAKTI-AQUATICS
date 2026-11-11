import { ClubSettings, Member, MemberReport } from '../types';
import { escapeHtml as e, letterheadHtml, printHtml, signatureHtml } from './printHtml';

const todayLong = () => new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

/** Laporan Rekap Kehadiran & Sesi Member → PDF. */
export function printAttendanceReport(members: Member[], settings: ClubSettings, statusLabel: string): boolean {
  const rows = members
    .map((m, i) => {
      const allowed = m.totalSessionsAllowed || 0;
      const att = m.attendedSessions || 0;
      return `<tr><td class="num">${i + 1}</td><td><b>${e(m.fullName)}</b><div class="muted" style="font-size:9px">${e(m.id)}</div></td>
      <td>${e(m.currentLevel || 'Pemula')}${m.ageOrDob ? ` (${e(m.ageOrDob)})` : ''}</td>
      <td>${e([m.preferredDay, m.preferredTime].filter(Boolean).join(', ') || '-')}</td>
      <td class="num"><b>${att}</b></td><td class="num">${allowed}</td><td class="num">${Math.max(0, allowed - att)}</td>
      <td>${e(m.status || '-')}</td></tr>`;
    })
    .join('');
  const totalHadir = members.reduce((a, m) => a + (m.attendedSessions || 0), 0);
  const totalKuota = members.reduce((a, m) => a + (m.totalSessionsAllowed || 0), 0);
  const period = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  return printHtml(
    `Laporan Absensi Siswa ${period}`,
    `${letterheadHtml(settings)}
    <h1>Laporan Rekapitulasi Kehadiran &amp; Sesi Member</h1>
    <div class="muted">Periode ${e(period)} • Status: ${e(statusLabel)} • Dicetak ${e(todayLong())}</div>
    <div class="sum"><div>Jumlah Siswa<b>${members.length}</b></div><div>Total Sesi Hadir<b>${totalHadir}</b></div>
    <div>Total Kuota Sesi<b>${totalKuota}</b></div><div>Rata-rata Kehadiran<b>${totalKuota ? Math.round((totalHadir / totalKuota) * 100) : 0}%</b></div></div>
    <table><thead><tr><th class="num">No</th><th>Nama Siswa</th><th>Level / Usia</th><th>Hari &amp; Jam</th>
    <th class="num">Hadir</th><th class="num">Kuota</th><th class="num">Sisa</th><th>Status</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="8">Tidak ada data.</td></tr>'}</tbody></table>
    ${signatureHtml(settings, todayLong())}`
  );
}

/** Arsip Rapor Ujian → PDF (daftar, opsional dengan rincian nilai tiap siswa). */
export function printRaporArchive(reports: MemberReport[], settings: ClubSettings, withDetails: boolean): boolean {
  const times = (r: MemberReport) =>
    (r.grades || [])
      .filter((g) => g.timeRecord?.formatted && g.timeRecord.formatted !== '00:00:00')
      .map((g) => `${e(g.criterionName)}: ${e(g.timeRecord?.formatted)}`)
      .join('<br>') || '-';
  const list = reports
    .map(
      (r, i) => `<tr><td class="num">${i + 1}</td><td><b>${e(r.memberName)}</b><div class="muted" style="font-size:9px">${e(r.memberId)}</div></td>
      <td>${e(r.period)}<div class="muted" style="font-size:9px">${e(r.evaluationDate)}</div></td><td>${e(r.currentLevel)}</td>
      <td style="font-size:10px">${times(r)}</td><td class="num"><b>${e(r.averageScore)}</b></td><td>${e(r.overallPredicate)}</td></tr>`
    )
    .join('');
  const details = withDetails ? reports.map((r) => `<div style="page-break-before:always">${raporDetailHtml(r, settings)}</div>`).join('') : '';
  return printHtml(
    'Arsip Rapor Ujian Siswa',
    `${letterheadHtml(settings)}
    <h1>Arsip Riwayat Rapor Ujian Siswa</h1>
    <div class="muted">${reports.length} rapor • Dicetak ${e(todayLong())}</div>
    <table><thead><tr><th class="num">No</th><th>Nama Siswa</th><th>Periode &amp; Tgl Ujian</th><th>Tingkat / Level</th>
    <th>Catatan Waktu</th><th class="num">Nilai</th><th>Predikat</th></tr></thead>
    <tbody>${list || '<tr><td colspan="7">Tidak ada data.</td></tr>'}</tbody></table>
    ${signatureHtml(settings, todayLong())}${details}`
  );
}

/** Halaman rapor lengkap satu siswa (HTML). */
function raporDetailHtml(r: MemberReport, settings: ClubSettings): string {
  return `${letterheadHtml(settings)}
          <h1>Rapor Ujian Renang — ${e(r.memberName)}</h1>
          <div class="muted">${e(r.memberId)} • ${e(r.period)} • Tgl ujian ${e(r.evaluationDate)} • Level: ${e(r.currentLevel)} • Coach: ${e(r.coachName)}</div>
          <table><thead><tr><th>Kriteria</th><th>Kategori</th><th class="num">Nilai</th><th>Predikat</th><th>Catatan Waktu</th><th>Catatan</th></tr></thead><tbody>
          ${(r.grades || [])
            .map(
              (g) => `<tr><td>${e(g.criterionName)}</td><td>${e(g.category)}</td><td class="num">${e(g.score)}</td><td>${e(g.predicate)}</td>
              <td>${e(g.timeRecord?.formatted && g.timeRecord.formatted !== '00:00:00' ? g.timeRecord.formatted : '-')}</td><td>${e(g.notes || '-')}</td></tr>`
            )
            .join('')}</tbody></table>
          <div class="sum"><div>Nilai Rata-rata<b>${e(r.averageScore)}</b></div><div>Predikat<b>${e(r.overallPredicate)}</b></div>
          <div>Kehadiran<b style="font-size:11px">${e(r.attendanceSummary || '-')}</b></div></div>
          <p><b>Evaluasi Coach:</b> ${e(r.coachEvaluation || '-')}</p>
          <p><b>Rekomendasi:</b> ${e(r.recommendations || '-')}</p>
          ${signatureHtml(settings, r.evaluationDate || todayLong())}`;
}

/** Cetak / Simpan PDF rapor satu siswa. */
export function printSingleRapor(r: MemberReport, settings: ClubSettings): boolean {
  return printHtml(`Rapor ${r.memberName} - ${r.period}`, raporDetailHtml(r, settings));
}

// ======================= KEUANGAN =======================
import type { ClubInvoice } from '../types';

const rp = (n: number) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

export interface FinanceSummary {
  total: number;
  paid: number;
  outstanding: number;
  rate: number;
  byPeriod: { period: string; count: number; total: number; paid: number }[];
  byPackage: { pkg: string; count: number; total: number }[];
}

export function summarizeFinance(invoices: ClubInvoice[]): FinanceSummary {
  const total = invoices.reduce((a, i) => a + Number(i.amount || 0), 0);
  const paid = invoices.filter((i) => i.status === 'Lunas').reduce((a, i) => a + Number(i.amount || 0), 0);
  const per = new Map<string, { period: string; count: number; total: number; paid: number }>();
  const pkg = new Map<string, { pkg: string; count: number; total: number }>();
  invoices.forEach((i) => {
    const p = per.get(i.monthPeriod || '-') || { period: i.monthPeriod || '-', count: 0, total: 0, paid: 0 };
    p.count++;
    p.total += Number(i.amount || 0);
    if (i.status === 'Lunas') p.paid += Number(i.amount || 0);
    per.set(p.period, p);
    const k = pkg.get(i.packageName || '-') || { pkg: i.packageName || '-', count: 0, total: 0 };
    k.count++;
    if (i.status === 'Lunas') k.total += Number(i.amount || 0);
    pkg.set(k.pkg, k);
  });
  return {
    total,
    paid,
    outstanding: total - paid,
    rate: total ? Math.round((paid / total) * 100) : 100,
    byPeriod: Array.from(per.values()),
    byPackage: Array.from(pkg.values()).sort((a, b) => b.total - a.total),
  };
}

/** Laporan Keuangan → PDF (dipakai tab Keuangan & Reset Keuangan). */
export function printFinanceReport(invoices: ClubInvoice[], settings: ClubSettings, scopeLabel: string, note = ''): boolean {
  const s = summarizeFinance(invoices);
  const rows = invoices
    .map(
      (i, idx) => `<tr><td class="num">${idx + 1}</td><td>${e(i.id)}</td><td>${e(i.memberName)}</td><td>${e(i.packageName)}</td>
      <td>${e(i.monthPeriod)}</td><td>${e(i.status)}</td><td>${e(i.paidAt || '-')}</td><td>${e(i.paymentMethod || '-')}</td>
      <td class="num">${rp(i.amount)}</td></tr>`
    )
    .join('');
  const periodRows = s.byPeriod
    .map((p) => `<tr><td>${e(p.period)}</td><td class="num">${p.count}</td><td class="num">${rp(p.total)}</td><td class="num">${rp(p.paid)}</td><td class="num">${rp(p.total - p.paid)}</td></tr>`)
    .join('');
  const pkgRows = s.byPackage
    .map((p) => `<tr><td>${e(p.pkg)}</td><td class="num">${p.count}</td><td class="num">${rp(p.total)}</td><td class="num">${s.paid ? Math.round((p.total / s.paid) * 100) : 0}%</td></tr>`)
    .join('');
  return printHtml(
    `Laporan Keuangan ${scopeLabel}`,
    `${letterheadHtml(settings)}
    <h1>Laporan Keuangan — ${e(scopeLabel)}</h1>
    <div class="muted">Dicetak ${e(new Date().toLocaleString('id-ID'))}${note ? ` • ${e(note)}` : ''}</div>
    <div class="sum"><div>Total Tagihan<b>${rp(s.total)}</b></div><div>Pembayaran Masuk (Lunas)<b>${rp(s.paid)}</b></div>
    <div>Sisa Piutang<b>${rp(s.outstanding)}</b></div><div>Kolektibilitas<b>${s.rate}% (${invoices.length} invoice)</b></div></div>
    <table><thead><tr><th>Periode</th><th class="num">Invoice</th><th class="num">Tagihan</th><th class="num">Lunas</th><th class="num">Piutang</th></tr></thead>
    <tbody>${periodRows || '<tr><td colspan="5">-</td></tr>'}</tbody></table>
    <table><thead><tr><th>Distribusi Pendapatan Paket</th><th class="num">Invoice</th><th class="num">Pendapatan Lunas</th><th class="num">Porsi</th></tr></thead>
    <tbody>${pkgRows || '<tr><td colspan="4">-</td></tr>'}</tbody></table>
    <table><thead><tr><th class="num">No</th><th>No. Invoice</th><th>Nama</th><th>Paket</th><th>Periode</th><th>Status</th>
    <th>Tgl Bayar</th><th>Metode</th><th class="num">Nominal</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="9">Tidak ada data.</td></tr>'}</tbody></table>
    ${signatureHtml(settings, todayLong())}`
  );
}

// ======================= DASHBOARD =======================
export interface DashboardSnapshot {
  dateLabel: string;
  monthLabel: string;
  activeMembers: Member[];
  todayStatus: Record<string, string | undefined>;
  monthInvoices: ClubInvoice[];
  reportsCount: number;
  latestReportPeriod: string;
  pendingRequests: number;
}

export function printDashboardReport(d: DashboardSnapshot, settings: ClubSettings): boolean {
  const hadir = d.activeMembers.filter((m) => d.todayStatus[m.id] === 'Hadir').length;
  const izin = d.activeMembers.filter((m) => d.todayStatus[m.id] === 'Izin' || d.todayStatus[m.id] === 'Sakit').length;
  const fin = summarizeFinance(d.monthInvoices);
  const att = d.activeMembers
    .map(
      (m, i) => `<tr><td class="num">${i + 1}</td><td><b>${e(m.fullName)}</b><div class="muted" style="font-size:9px">${e(m.id)}</div></td>
      <td>${e(m.squad || m.currentLevel || '-')}</td><td class="num">${m.attendedSessions || 0}/${m.totalSessionsAllowed || 0}</td>
      <td>${e(d.todayStatus[m.id] || 'Belum diisi')}</td></tr>`
    )
    .join('');
  const inv = d.monthInvoices
    .map((i) => `<tr><td>${e(i.memberName)}</td><td>${e(i.packageName)}</td><td>${e(i.status)}</td><td class="num">${rp(i.amount)}</td></tr>`)
    .join('');
  return printHtml(
    `Ringkasan Dashboard ${d.dateLabel}`,
    `${letterheadHtml(settings)}
    <h1>Ringkasan Operasional Klub</h1>
    <div class="muted">${e(d.dateLabel)} • Dicetak ${e(new Date().toLocaleString('id-ID'))}</div>
    <div class="sum"><div>Atlet Aktif<b>${d.activeMembers.length}</b></div>
    <div>Presensi Hari Ini<b>${hadir} hadir • ${izin} izin/sakit</b></div>
    <div>Iuran ${e(d.monthLabel)}<b>${fin.rate}% • ${rp(fin.paid)}</b></div>
    <div>Rapor Terbit<b>${d.reportsCount}${d.latestReportPeriod ? ` (${e(d.latestReportPeriod)})` : ''}</b></div></div>
    <p class="muted">Pengajuan jadwal menunggu validasi: <b>${d.pendingRequests}</b></p>
    <table><thead><tr><th class="num">No</th><th>Atlet</th><th>Skuad / Level</th><th class="num">Sesi</th><th>Status Hari Ini</th></tr></thead>
    <tbody>${att || '<tr><td colspan="5">-</td></tr>'}</tbody></table>
    <table><thead><tr><th>Iuran ${e(d.monthLabel)} — Nama</th><th>Paket</th><th>Status</th><th class="num">Nominal</th></tr></thead>
    <tbody>${inv || '<tr><td colspan="4">Belum ada tagihan.</td></tr>'}</tbody>
    <tfoot><tr><th colspan="3">Terkumpul / Total Tagihan</th><th class="num">${rp(fin.paid)} / ${rp(fin.total)}</th></tr></tfoot></table>
    ${signatureHtml(settings, todayLong())}`
  );
}
