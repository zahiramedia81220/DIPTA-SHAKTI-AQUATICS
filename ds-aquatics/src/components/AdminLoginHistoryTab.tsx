import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { LoginEvent, LoginLog } from '../types';
import { Activity, Search, Wifi, WifiOff, LogIn, LogOut, Clock, ShieldAlert, Smartphone } from 'lucide-react';

const ONLINE_WINDOW_MS = 150 * 1000; // dianggap online jika sinyal terakhir < 2,5 menit

const EVENT_META: Record<LoginEvent, { label: string; cls: string }> = {
  login: { label: 'Login', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  logout: { label: 'Logout', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  auto_logout: { label: 'Auto-logout', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  login_failed: { label: 'Login gagal', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

function formatDateTime(ms: number) {
  return new Date(ms).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function relativeTime(ms: number, now: number) {
  if (!ms) return 'belum pernah';
  const diff = Math.max(0, now - ms);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'baru saja';
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} hari lalu`;
  return formatDateTime(ms);
}

interface StatusRow {
  key: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  online: boolean;
  lastSeenMs: number;
  device: string;
}

export const AdminLoginHistoryTab: React.FC = () => {
  const { loginLogs, presence, memberAccounts } = useApp();
  const [now, setNow] = useState(Date.now());
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [statusSearch, setStatusSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [eventFilter, setEventFilter] = useState<'all' | LoginEvent>('all');
  const [dateFilter, setDateFilter] = useState('');

  // Segarkan status online tiap 30 detik
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(t);
  }, []);

  const statusRows: StatusRow[] = useMemo(() => {
    const isOnline = (state: string, lastSeenMs: number) => state === 'online' && now - lastSeenMs < ONLINE_WINDOW_MS;
    const byUid = new Map(presence.map((p) => [p.uid, p]));
    const byEmail = new Map(presence.map((p) => [p.email, p]));
    const usedUids = new Set<string>();

    // Semua akun member (termasuk yang belum pernah login)
    const rows: StatusRow[] = memberAccounts.map((acc) => {
      const p = (acc.authUid && byUid.get(acc.authUid)) || byEmail.get(acc.email.toLowerCase());
      if (p) usedUids.add(p.uid);
      return {
        key: acc.id,
        name: acc.fullName,
        email: acc.email,
        role: 'member',
        online: p ? isOnline(p.state, p.lastSeenMs) : false,
        lastSeenMs: p?.lastSeenMs || 0,
        device: p?.device || '-',
      };
    });
    // Admin & presence lain yang tidak terhubung ke akun member
    presence
      .filter((p) => !usedUids.has(p.uid))
      .forEach((p) =>
        rows.push({
          key: p.uid,
          name: p.name || p.email,
          email: p.email,
          role: p.role === 'admin' ? 'admin' : 'member',
          online: isOnline(p.state, p.lastSeenMs),
          lastSeenMs: p.lastSeenMs,
          device: p.device || '-',
        })
      );
    return rows.sort((a, b) => Number(b.online) - Number(a.online) || b.lastSeenMs - a.lastSeenMs);
  }, [presence, memberAccounts, now]);

  const onlineCount = statusRows.filter((r) => r.online).length;

  const filteredStatus = statusRows.filter((r) => {
    if (statusFilter === 'online' && !r.online) return false;
    if (statusFilter === 'offline' && r.online) return false;
    const q = statusSearch.trim().toLowerCase();
    return !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
  });

  const filteredLogs = loginLogs.filter((l: LoginLog) => {
    if (eventFilter !== 'all' && l.event !== eventFilter) return false;
    if (dateFilter) {
      const d = new Date(l.createdAtMs);
      const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (local !== dateFilter) return false;
    }
    const q = logSearch.trim().toLowerCase();
    return !q || (l.name || '').toLowerCase().includes(q) || (l.email || '').toLowerCase().includes(q);
  });

  const failedToday = loginLogs.filter(
    (l) => l.event === 'login_failed' && now - l.createdAtMs < 24 * 60 * 60 * 1000
  ).length;

  return (
    <div className="space-y-6 text-slate-800">
      {/* Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-emerald-200 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
            <Wifi className="w-4 h-4" /> Sedang Online
          </div>
          <div className="text-2xl font-black mt-1">{onlineCount}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <WifiOff className="w-4 h-4" /> Offline
          </div>
          <div className="text-2xl font-black mt-1">{statusRows.length - onlineCount}</div>
        </div>
        <div className="bg-white rounded-2xl border border-cyan-200 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-700">
            <LogIn className="w-4 h-4" /> Login 24 jam
          </div>
          <div className="text-2xl font-black mt-1">
            {loginLogs.filter((l) => l.event === 'login' && now - l.createdAtMs < 86400000).length}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-rose-200 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-700">
            <ShieldAlert className="w-4 h-4" /> Login gagal 24 jam
          </div>
          <div className="text-2xl font-black mt-1">{failedToday}</div>
        </div>
      </div>

      {/* Status online */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <h3 className="font-heading font-black text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-600" /> Status Online Member & Admin
          </h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={statusSearch}
                onChange={(e) => setStatusSearch(e.target.value)}
                placeholder="Cari nama / email"
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs w-44"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
            >
              <option value="all">Semua</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {filteredStatus.length === 0 && <p className="p-4 text-xs text-slate-500">Tidak ada data.</p>}
          {filteredStatus.map((r) => (
            <div key={r.key} className="px-4 py-2.5 flex items-center gap-3 text-xs">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${r.online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold truncate">
                  {r.name}{' '}
                  {r.role === 'admin' && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Admin
                    </span>
                  )}
                </div>
                <div className="text-slate-500 truncate">{r.email}</div>
              </div>
              <div className="text-right shrink-0">
                <div className={`font-bold ${r.online ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {r.online ? 'Online' : 'Offline'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {r.online ? r.device : `Terakhir aktif: ${relativeTime(r.lastSeenMs, now)}`}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="px-4 py-2 text-[10px] text-slate-400 border-t border-slate-100">
          Online = halaman aplikasi sedang terbuka & mengirim sinyal dalam 2,5 menit terakhir.
        </p>
      </div>

      {/* Riwayat login */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <h3 className="font-heading font-black text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-600" /> Riwayat Login ({filteredLogs.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Cari nama / email"
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs w-44"
              />
            </div>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value as typeof eventFilter)}
              className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
            >
              <option value="all">Semua kejadian</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="auto_logout">Auto-logout</option>
              <option value="login_failed">Login gagal</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs cursor-pointer hover:bg-slate-50"
              >
                Reset tanggal
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-600 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 font-bold">Waktu</th>
                <th className="text-left px-4 py-2 font-bold">Pengguna</th>
                <th className="text-left px-4 py-2 font-bold">Kejadian</th>
                <th className="text-left px-4 py-2 font-bold">Metode</th>
                <th className="text-left px-4 py-2 font-bold">Perangkat</th>
                <th className="text-left px-4 py-2 font-bold">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-slate-500">
                    Belum ada riwayat.
                  </td>
                </tr>
              )}
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2 whitespace-nowrap font-mono text-[11px]">{formatDateTime(l.createdAtMs)}</td>
                  <td className="px-4 py-2">
                    <div className="font-bold">{l.name || '-'}</div>
                    <div className="text-slate-500">
                      {l.email}
                      {l.role === 'admin' && <span className="ml-1 text-indigo-600 font-bold">(Admin)</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-md border font-bold ${EVENT_META[l.event]?.cls || ''}`}>
                      {l.event === 'logout' || l.event === 'auto_logout' ? (
                        <LogOut className="w-3 h-3 inline mr-1" />
                      ) : (
                        <LogIn className="w-3 h-3 inline mr-1" />
                      )}
                      {EVENT_META[l.event]?.label || l.event}
                    </span>
                  </td>
                  <td className="px-4 py-2">{l.method === 'google' ? 'Google' : l.method === 'password' ? 'Email' : '-'}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Smartphone className="w-3 h-3 inline mr-1 text-slate-400" />
                    {l.device}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{l.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-2 text-[10px] text-slate-400 border-t border-slate-100">
          Menampilkan 500 catatan terbaru. Catatan riwayat tidak dapat diubah atau dihapus.
        </p>
      </div>
    </div>
  );
};
