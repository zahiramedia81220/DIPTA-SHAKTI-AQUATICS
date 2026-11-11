import React, { useMemo, useState } from 'react';
import { X, Upload, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { parseMembersCsv, ImportedMemberRow } from '../utils/csvImport';
import { getAllPricelistOptions } from '../data/defaultData';
import { Member } from '../types';

export const ImportMembersModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { members, pricePackages, importMembers } = useApp();
  const options = getAllPricelistOptions(pricePackages);
  const [rows, setRows] = useState<ImportedMemberRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<Member['status']>('Aktif');
  // Bawaan: Paket Reguler 4x (paket paling umum)
  const defaultOpt = options.find((o) => o.packageId === 'pkg-reguler' && o.sessionsCount === 4) || options[0];
  const [optionId, setOptionId] = useState(defaultOpt?.id || '');
  const [location, setLocation] = useState('Kolam Renang Lestarindo');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');

  const matchInfo = useMemo(() => {
    const ids = new Set(members.map((m) => m.id));
    const names = new Set(members.map((m) => (m.fullName || '').trim().toLowerCase()));
    return rows.map((r) => (ids.has(r.id) || names.has(r.fullName.trim().toLowerCase()) ? 'update' : 'new'));
  }, [rows, members]);
  const newCount = matchInfo.filter((x) => x === 'new').length;
  const updCount = matchInfo.length - newCount;

  const handleFile = async (file?: File) => {
    setError('');
    setResult('');
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    const parsed = parseMembersCsv(text);
    if (parsed.error) {
      setError(parsed.error);
      setRows([]);
      return;
    }
    setRows(parsed.rows);
  };

  const handleImport = async () => {
    const opt = options.find((o) => o.id === optionId);
    setBusy(true);
    setError('');
    try {
      const res = await importMembers(rows, {
        status,
        selectedPackageId: opt?.packageId || 'pkg-reguler',
        totalSessionsAllowed: opt?.sessionsCount || 4,
        location,
      });
      setResult(`Berhasil: ${res.created} member baru ditambahkan, ${res.updated} member lama diperbarui.`);
      setRows([]);
    } catch (e) {
      setError(`Gagal menyimpan: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-y-auto z-50 bg-slate-950/70 flex items-center-safe justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-5 space-y-4 text-xs text-slate-700 my-6">
        <div className="flex items-center justify-between">
          <h4 className="font-heading font-black text-base text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-600" /> Impor Member dari File CSV
          </h4>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer" aria-label="Tutup">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-slate-500">
          Kolom yang dibaca: <b>ID Anggota, Nama Member, Nama Wali, No HP, Alamat</b>. Member yang ID atau namanya sudah ada akan
          diperbarui (tidak dobel).
        </p>

        <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-cyan-300 bg-cyan-50/50 hover:bg-cyan-50 font-bold text-cyan-800 cursor-pointer">
          <Upload className="w-4 h-4" /> {fileName || 'Pilih file .csv'}
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        </label>

        {rows.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold mb-1">Status member baru</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as Member['status'])} className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white">
                  <option value="Aktif">Aktif</option>
                  <option value="Verifikasi">Verifikasi</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Paket awal member baru</label>
                <select value={optionId} onChange={(e) => setOptionId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white">
                  {options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Lokasi kolam</label>
                <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white">
                  <option value="Kolam Renang Lestarindo">Kolam Renang Lestarindo</option>
                  <option value="Front One Boutique Adria Boyolali">Front One Boutique Adria Boyolali</option>
                </select>
              </div>
            </div>

            <p className="font-bold text-slate-800">
              {rows.length} baris terbaca • <span className="text-emerald-700">{newCount} baru</span> •{' '}
              <span className="text-amber-700">{updCount} diperbarui</span>
            </p>
            <div className="max-h-72 overflow-auto rounded-xl border border-slate-200">
              <table className="w-full text-[11px]">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-1.5">ID</th>
                    <th className="text-left px-2 py-1.5">Nama</th>
                    <th className="text-left px-2 py-1.5">Wali</th>
                    <th className="text-left px-2 py-1.5">No HP</th>
                    <th className="text-left px-2 py-1.5">Alamat</th>
                    <th className="text-left px-2 py-1.5">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r, i) => (
                    <tr key={`${r.id}-${i}`}>
                      <td className="px-2 py-1 font-mono">{r.id || '(otomatis)'}</td>
                      <td className="px-2 py-1 font-semibold">{r.fullName}</td>
                      <td className="px-2 py-1">{r.parentName || '-'}</td>
                      <td className="px-2 py-1 font-mono">{r.whatsapp || '-'}</td>
                      <td className="px-2 py-1">{r.address || '-'}</td>
                      <td className="px-2 py-1">
                        {matchInfo[i] === 'new' ? (
                          <span className="text-emerald-700 font-bold">Baru</span>
                        ) : (
                          <span className="text-amber-700 font-bold">Perbarui</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {error && <p className="text-rose-600 font-bold">{error}</p>}
        {result && <p className="text-emerald-700 font-bold">{result}</p>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-300 font-bold cursor-pointer">
            {result ? 'Tutup' : 'Batal'}
          </button>
          <button
            onClick={handleImport}
            disabled={!rows.length || busy}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer disabled:opacity-50"
          >
            {busy ? 'Menyimpan…' : `Simpan ${rows.length} Member ke Firebase`}
          </button>
        </div>
      </div>
    </div>
  );
};
