import React, { useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  Users,
  AlertTriangle,
  Award,
  Calendar,
  MapPin,
  Clock,
  Search,
  Check,
  Save,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Member } from '../types';
import { useDailyAttendance, setDailyAttendance, setDailyAttendanceNote, todayLocal, DailyStatus } from '../utils/dailyAttendance';

export const AdminAttendanceTab: React.FC = () => {
  const { members, settings, scheduleSlots, updateSettings } = useApp();

  // Pilihan sesi: bawaan + jam dari Matriks Jadwal + jam kustom tersimpan
  const DEFAULT_SESSIONS = [
    'Sesi Sore (16:00 - 18:30 WIB)',
    'Sesi Pagi (06:00 - 08:30 WIB)',
    'Sesi Siang (14:00 - 16:00 WIB)',
  ];
  const customSessions = settings.customSessions || [];
  const slotSessions = Array.from(
    new Set((scheduleSlots || []).map((s) => (s && s.timeRange ? `Jadwal (${s.timeRange} WIB)` : '')).filter(Boolean))
  ).sort();
  const sessionOptions = Array.from(new Set([...DEFAULT_SESSIONS, ...slotSessions, ...customSessions]));
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState('19:00');
  const [customEnd, setCustomEnd] = useState('20:30');
  const [customLabel, setCustomLabel] = useState('');
  const [customError, setCustomError] = useState('');

  const handleAddCustomSession = () => {
    setCustomError('');
    if (!customStart || !customEnd || customEnd <= customStart) {
      setCustomError('Jam selesai harus lebih besar dari jam mulai.');
      return;
    }
    const label = `${customLabel.trim() || 'Kustom'} (${customStart} - ${customEnd} WIB)`;
    if (!customSessions.includes(label)) {
      updateSettings({ customSessions: [...customSessions, label] });
    }
    setSelectedSession(label);
    setShowCustom(false);
    setCustomLabel('');
  };

  const handleRemoveCustomSession = (label: string) => {
    updateSettings({ customSessions: customSessions.filter((c) => c !== label) });
    if (selectedSession === label) setSelectedSession(DEFAULT_SESSIONS[0]);
  };

  const [selectedDate, setSelectedDate] = useState<string>(todayLocal());
  const [selectedSession, setSelectedSession] = useState<string>('Sesi Sore (16:00 - 18:30 WIB)');
  const [selectedLocation, setSelectedLocation] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Active athlete list (focusing on active members)
  // Member aktif + yang masih verifikasi/pending tetap bisa diabsen
  const activeMembers = (members || []).filter(
    (m) => m && ['Aktif', 'Verifikasi', 'Pending'].includes(m.status)
  );
  const { records } = useDailyAttendance(selectedDate);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  // Filter members with safe null checks
  const filteredMembers = activeMembers.filter((m) => {
    const matchLocation =
      selectedLocation === 'Semua' ||
      (m.location && m.location.toLowerCase().includes(selectedLocation.toLowerCase()));
    const query = searchQuery.toLowerCase();
    const matchSearch =
      !query ||
      (m.fullName && m.fullName.toLowerCase().includes(query)) ||
      (m.id && m.id.toLowerCase().includes(query)) ||
      (m.squad && m.squad.toLowerCase().includes(query)) ||
      (m.currentLevel && m.currentLevel.toLowerCase().includes(query));
    return matchLocation && matchSearch;
  });

  // Calculate stats for today
  const countHadir = activeMembers.filter((m) => records[m.id]?.status === 'Hadir').length;
  const countIzin = activeMembers.filter((m) => records[m.id]?.status === 'Izin').length;
  const countSakit = activeMembers.filter((m) => records[m.id]?.status === 'Sakit').length;
  const countIzinSakit = countIzin + countSakit;
  const totalAtlet = activeMembers.length;
  const tingkatKehadiran = totalAtlet > 0 ? Math.round((countHadir / totalAtlet) * 100) : 0;

  // Set presensi per tanggal. Klik status yang sama lagi = batalkan.
  const handleSetStatus = (memberId: string, status: DailyStatus) => {
    const member = (members || []).find((m) => m && m.id === memberId);
    if (!member) return;
    const prev = records[memberId];
    setDailyAttendance({
      member,
      date: selectedDate,
      status: prev?.status === status ? null : status,
      prev,
      session: selectedSession,
      note: noteDrafts[memberId],
    });
  };

  const handleSaveNote = (member: Member) => {
    const draft = noteDrafts[member.id];
    if (draft === undefined) return;
    setDailyAttendanceNote(member, selectedDate, records[member.id], draft);
  };

  const handleSaveAll = () => {
    const filled = activeMembers.filter((m) => records[m.id]).length;
    setSaveToast(`Presensi ${selectedDate} tersimpan otomatis: ${filled} dari ${activeMembers.length} atlet sudah diisi.`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {saveToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveToast}</span>
          </div>
          <button onClick={() => setSaveToast(null)} className="text-emerald-200 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* 4 Summary Stat Cards (Exact match to screenshots 2026-09-23_152556.png and 2026-09-23_152456.png) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tingkat Kehadiran Sesi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Tingkat Kehadiran Sesi
          </span>
          <div className="mt-3">
            <span className="text-3xl font-heading font-black text-emerald-600">
              {tingkatKehadiran}%
            </span>
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500">
            <span>{countHadir} dari {totalAtlet} Atlet</span>
          </div>
        </div>

        {/* Card 2: Hadir di Kolam */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Hadir di Kolam
          </span>
          <div className="mt-3">
            <span className="text-3xl font-heading font-black text-slate-900">
              {countHadir}
            </span>
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500">
            <span>Atlet Sesi Aktif</span>
          </div>
        </div>

        {/* Card 3: Izin / Sakit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Izin / Sakit
          </span>
          <div className="mt-3">
            <span className="text-3xl font-heading font-black text-amber-500">
              {countIzinSakit}
            </span>
          </div>
          <div className="mt-2 text-xs font-medium text-amber-600 font-semibold">
            <span>Disertai konfirmasi orang tua</span>
          </div>
        </div>

        {/* Card 4: Standar Minimum Klub */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Standar Minimum Klub
          </span>
          <div className="mt-3">
            <span className="text-3xl font-heading font-black text-cyan-600">
              85%
            </span>
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500">
            <span>Syarat mengikuti Kejuaraan KRAP</span>
          </div>
        </div>
      </div>

      {/* Main Attendance Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Controls Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h4 className="font-heading font-black text-base text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-cyan-600" />
              <span>Presensi Kehadiran Terintegrasi Sesi Latihan</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih status kehadiran atlet hari ini. Rasio kumulatif akan otomatis terkalkulasi ke rapor & database rekor atlet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Picker */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent focus:outline-hidden font-bold cursor-pointer"
              />
            </div>

            {/* Session Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedSession}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setShowCustom(true);
                    return;
                  }
                  setSelectedSession(e.target.value);
                }}
                className="bg-transparent focus:outline-hidden font-bold cursor-pointer max-w-[230px]"
              >
                {!sessionOptions.includes(selectedSession) && <option value={selectedSession}>{selectedSession}</option>}
                {sessionOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option value="__custom__">+ Atur jam kustom…</option>
              </select>
            </div>

            {/* Save All Button */}
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Presensi</span>
            </button>
          </div>
          {showCustom && (
            <div className="w-full mt-3 p-3 rounded-xl border border-cyan-200 bg-cyan-50/60 flex flex-wrap items-end gap-2.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama sesi (opsional)</label>
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="Mis. Sesi Malam"
                  maxLength={40}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white w-40"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jam mulai</label>
                <input type="time" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jam selesai</label>
                <input type="time" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white" />
              </div>
              <button type="button" onClick={handleAddCustomSession} className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer">
                Simpan & Pakai
              </button>
              <button type="button" onClick={() => setShowCustom(false)} className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold cursor-pointer">
                Batal
              </button>
              {customError && <p className="w-full text-rose-600 font-semibold">{customError}</p>}
              {customSessions.length > 0 && (
                <div className="w-full flex flex-wrap gap-1.5 pt-1">
                  <span className="font-bold text-slate-600">Jam kustom tersimpan:</span>
                  {customSessions.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-cyan-200 font-semibold">
                      {c}
                      <button type="button" onClick={() => handleRemoveCustomSession(c)} className="text-rose-500 hover:text-rose-700 cursor-pointer" title="Hapus">
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter / Search Sub-Bar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Lokasi Kolam:</span>
            {(['Semua', 'Lestarindo', 'Front One'] as const).map((loc) => (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  selectedLocation === loc
                    ? 'bg-cyan-700 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari atlet atau skuad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden w-48"
            />
          </div>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/70 font-heading font-bold text-slate-700 uppercase border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Nama Atlet & Data</th>
                <th className="py-3.5 px-4">Level & Kategori</th>
                <th className="py-3.5 px-4 text-center">Status Kehadiran (klik lagi = batal)</th>
                <th className="py-3.5 px-4">Rasio Kumulatif</th>
                <th className="py-3.5 px-4">Catatan Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada atlet yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const status = records[m.id]?.status;
                  const attended = m.attendedSessions ?? 0;
                  const allowed = m.totalSessionsAllowed ?? 12;
                  const rate = m.cumulativeAttendanceRate ?? (allowed > 0 ? Math.round((attended / allowed) * 100) : 100);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      {/* Athlete Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {m.photoUrl ? (
                            <img
                              src={m.photoUrl}
                              alt={m.fullName || 'Member'}
                              className="w-9 h-9 rounded-full object-cover border border-slate-300 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-800 text-cyan-400 font-black text-xs flex items-center justify-center shrink-0">
                              {(m.fullName || 'A').charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 text-xs">
                              {m.fullName || 'Member'}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <span className="font-mono text-cyan-700 font-semibold">{m.id}</span>
                              {m.status !== 'Aktif' && (
                                <span className="px-1.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold">
                                  {m.status}
                                </span>
                              )}
                              <span>•</span>
                              <span>{m.gender} ({m.ageOrDob})</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Level & Kategori */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 block w-max">
                          {m.currentLevel || 'Pemula'}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block font-medium">
                          {m.squad || 'DS Aquatics'}
                        </span>
                      </td>

                      {/* Interactive Toggle Buttons: [Hadir] [Izin] [Sakit] */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 gap-1 shadow-inner">
                          {/* Hadir */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(m.id, 'Hadir')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              status === 'Hadir'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {status === 'Hadir' && <Check className="w-3 h-3" />}
                            <span>Hadir</span>
                          </button>

                          {/* Izin */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(m.id, 'Izin')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              status === 'Izin'
                                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {status === 'Izin' && <Check className="w-3 h-3 text-slate-950" />}
                            <span>Izin</span>
                          </button>

                          {/* Sakit */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(m.id, 'Sakit')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              status === 'Sakit'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {status === 'Sakit' && <Check className="w-3 h-3" />}
                            <span>Sakit</span>
                          </button>
                        </div>
                      </td>

                      {/* Cumulative Ratio */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-xs ${
                            rate >= 85 ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                            {rate}%
                          </span>
                          <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                rate >= 85 ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, rate)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          {attended} dari {allowed} sesi kuota
                          {allowed > 0 && attended > allowed && (
                            <span className="ml-1 text-rose-600 font-bold">• melebihi kuota</span>
                          )}
                        </span>
                      </td>

                      {/* Notes / Keterangan */}
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={noteDrafts[m.id] ?? records[m.id]?.note ?? ''}
                          onChange={(e) => setNoteDrafts((d) => ({ ...d, [m.id]: e.target.value }))}
                          onBlur={() => handleSaveNote(m)}
                          disabled={!records[m.id]}
                          placeholder={records[m.id] ? 'Keterangan izin / sakit...' : 'Pilih status dulu'}
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 placeholder:text-slate-300 focus:ring-1 focus:ring-cyan-500 focus:outline-hidden"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
