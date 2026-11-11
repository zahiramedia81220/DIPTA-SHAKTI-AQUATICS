/**
 * Pembaca CSV untuk impor data member & matriks jadwal (format ekspor AI Studio / Google Sheets).
 */
import { DayOfWeek, ScheduleSlot } from '../types';

/** Parser CSV sederhana yang mendukung tanda kutip, koma & baris baru di dalam kutip. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

const clean = (v?: string) => {
  const t = (v || '').trim();
  return t === '-' ? '' : t;
};
const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');

export interface ImportedMemberRow {
  id: string;
  fullName: string;
  parentName: string;
  whatsapp: string;
  address: string;
}

/** CSV member: kolom ID Anggota, Nama Member, Nama Wali, No HP, Alamat (urutan bebas). */
export function parseMembersCsv(text: string): { rows: ImportedMemberRow[]; error?: string } {
  const data = parseCsv(text);
  if (data.length < 2) return { rows: [], error: 'File CSV kosong.' };
  const header = data[0].map(norm);
  const col = (...names: string[]) => header.findIndex((h) => names.some((n) => h.includes(n)));
  const iId = col('idanggota', 'idmember', 'id');
  const iName = col('namamember', 'namalengkap', 'namasiswa', 'namaatlet', 'nama');
  const iParent = col('namawali', 'wali', 'orangtua');
  const iPhone = col('nohp', 'whatsapp', 'nowa', 'telepon', 'hp');
  const iAddr = col('alamat', 'domisili');
  if (iName < 0) return { rows: [], error: 'Kolom "Nama Member" tidak ditemukan di baris judul CSV.' };
  const rows = data
    .slice(1)
    .map((r) => ({
      id: clean(r[iId]).replace(/[^A-Za-z0-9_-]/g, ''),
      fullName: clean(r[iName]),
      parentName: iParent >= 0 && iParent !== iName ? clean(r[iParent]) : '',
      whatsapp: iPhone >= 0 ? clean(r[iPhone]) : '',
      address: iAddr >= 0 ? clean(r[iAddr]) : '',
    }))
    .filter((r) => r.fullName);
  return { rows };
}

const DAY_NAMES: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

/** CSV matriks: kolom Waktu + Senin..Minggu, isi sel "Nama (Coach); Nama (Coach)". */
export function parseScheduleCsv(text: string, location: string): { slots: ScheduleSlot[]; error?: string } {
  const data = parseCsv(text);
  if (data.length < 2) return { slots: [], error: 'File CSV kosong.' };
  const header = data[0].map((h) => h.trim().toLowerCase());
  const dayCols = DAY_NAMES.map((d) => header.indexOf(d.toLowerCase()));
  const timeCol = header.findIndex((h) => h.includes('waktu') || h.includes('jam'));
  if (timeCol < 0 || dayCols.every((c) => c < 0)) {
    return { slots: [], error: 'Format CSV jadwal harus berisi kolom "Waktu" dan nama hari (Senin–Minggu).' };
  }
  const slots: ScheduleSlot[] = [];
  data.slice(1).forEach((r) => {
    const timeRange = clean(r[timeCol]).replace(/\s*[-–]\s*/, ' - ');
    if (!timeRange) return;
    DAY_NAMES.forEach((day, di) => {
      const c = dayCols[di];
      if (c < 0) return;
      clean(r[c])
        .split(';')
        .map((e) => e.trim())
        .filter(Boolean)
        .forEach((entry, idx) => {
          const m = entry.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
          const name = (m ? m[1] : entry).trim() || 'OFF';
          const coachRaw = m ? m[2].trim() : 'C. Dewi';
          const coach = coachRaw.replace(/^C\.\s*/i, 'C. ');
          const isOff = name.toUpperCase() === 'OFF';
          slots.push({
            id: `jdw-${day.toLowerCase()}-${timeRange.slice(0, 5).replace(':', '')}-${idx + 1}`,
            day,
            timeRange,
            coach,
            status: isOff ? 'off' : 'tersedia',
            participants: [isOff ? 'OFF' : name],
            location,
          });
        });
    });
  });
  if (!slots.length) return { slots, error: 'Tidak ada jadwal yang terbaca dari file CSV.' };
  return { slots };
}
