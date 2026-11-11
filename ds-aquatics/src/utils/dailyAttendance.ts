/**
 * Presensi harian per tanggal (koleksi Firestore `attendanceRecords`, hanya admin).
 * Dokumen: attendanceRecords/{YYYY-MM-DD}_{memberId}
 * Kuota sesi member (attendedSessions) ikut disesuaikan: +1 saat jadi Hadir, -1 saat Hadir dibatalkan.
 */
import { useEffect, useState } from 'react';
import { db, collection, query, where, onSnapshot, doc, writeBatch, logFirestoreError, OperationType } from '../firebase';
import { Member } from '../types';

export type DailyStatus = 'Hadir' | 'Izin' | 'Sakit';

export interface DailyAttendanceDoc {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  status: DailyStatus;
  note?: string;
  session?: string;
  location?: string;
  updatedAt: string;
}

/** Tanggal lokal hari ini, format YYYY-MM-DD. */
export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDateId(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Listener presensi untuk satu tanggal → map memberId → record. */
export function useDailyAttendance(date: string) {
  const [records, setRecords] = useState<Record<string, DailyAttendanceDoc>>({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(false);
    setRecords({});
    if (!date) return;
    const unsub = onSnapshot(
      query(collection(db, 'attendanceRecords'), where('date', '==', date)),
      (snap) => {
        const map: Record<string, DailyAttendanceDoc> = {};
        snap.docs.forEach((d) => {
          const r = d.data() as DailyAttendanceDoc;
          if (r.memberId) map[r.memberId] = { ...r, id: d.id };
        });
        setRecords(map);
        setLoaded(true);
      },
      (err) => logFirestoreError(err, OperationType.LIST, 'attendanceRecords')
    );
    return () => unsub();
  }, [date]);
  return { records, loaded };
}

/** Set / ubah / hapus (status null) presensi member pada tanggal tertentu. */
export function setDailyAttendance(params: {
  member: Member;
  date: string;
  status: DailyStatus | null;
  prev?: DailyAttendanceDoc;
  note?: string;
  session?: string;
  location?: string;
}): Promise<void> {
  const { member, date, status, prev, note, session, location } = params;
  const ref = doc(db, 'attendanceRecords', `${date}_${member.id}`);
  const wasHadir = prev?.status === 'Hadir';
  const isHadir = status === 'Hadir';
  const delta = isHadir && !wasHadir ? 1 : !isHadir && wasHadir ? -1 : 0;

  const batch = writeBatch(db);
  if (status) {
    batch.set(ref, {
      id: ref.id,
      memberId: member.id,
      memberName: member.fullName,
      date,
      status,
      note: note ?? prev?.note ?? (status === 'Hadir' ? '' : status),
      session: session ?? prev?.session ?? '',
      location: location ?? prev?.location ?? member.location ?? '',
      updatedAt: new Date().toISOString(),
    });
  } else {
    batch.delete(ref);
  }

  const attended = Math.max(0, (member.attendedSessions || 0) + delta);
  const allowed = member.totalSessionsAllowed || 0;
  batch.set(
    doc(db, 'members', member.id),
    {
      attendedSessions: attended,
      cumulativeAttendanceRate: allowed > 0 ? Math.round((attended / allowed) * 100) : 0,
      dailyAttendanceStatus: status || null,
      dailyAttendanceNote: status ? note ?? prev?.note ?? '' : '',
      lastAttendanceDate: date,
    },
    { merge: true }
  );
  return batch.commit().catch((err) => logFirestoreError(err, OperationType.WRITE, ref.path));
}

/** Simpan catatan saja (tanpa mengubah status/kuota). */
export function setDailyAttendanceNote(member: Member, date: string, prev: DailyAttendanceDoc | undefined, note: string) {
  if (!prev) return Promise.resolve();
  const batch = writeBatch(db);
  batch.set(doc(db, 'attendanceRecords', prev.id), { note, updatedAt: new Date().toISOString() }, { merge: true });
  return batch.commit().catch((err) => logFirestoreError(err, OperationType.UPDATE, `attendanceRecords/${prev.id}`));
}

/** Periode bulan, mis. "November 2026" (offset: -1 = bulan lalu). */
export function monthPeriod(offset = 0): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}
