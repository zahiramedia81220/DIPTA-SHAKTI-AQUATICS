import React, { useMemo, useState } from 'react';
import { X, Printer, AlertTriangle, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { printFinanceReport } from '../utils/reportPrints';

const rupiah = (n: number) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

export const ResetFinanceModal: React.FC<{ onClose: () => void; currentPeriod: string }> = ({ onClose, currentPeriod }) => {
  const { clubInvoices, settings, resetClubInvoices } = useApp();
  const periods = useMemo(
    () => Array.from(new Set((clubInvoices || []).map((i) => i && i.monthPeriod).filter(Boolean))) as string[],
    [clubInvoices]
  );
  const [scope, setScope] = useState<string>(periods.includes(currentPeriod) ? currentPeriod : 'Semua');
  const [printed, setPrinted] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const selected = (clubInvoices || []).filter((i) => i && (scope === 'Semua' || i.monthPeriod === scope));
  const totalTagihan = selected.reduce((a, i) => a + Number(i.amount || 0), 0);
  const totalLunas = selected.filter((i) => i.status === 'Lunas').reduce((a, i) => a + Number(i.amount || 0), 0);
  const piutang = totalTagihan - totalLunas;
  const scopeLabel = scope === 'Semua' ? 'Semua Periode' : `Periode ${scope}`;

  const handlePrint = () => {
    const ok = printFinanceReport(selected, settings, scopeLabel, 'Arsip sebelum reset data keuangan');
    if (ok) setPrinted(true);
    else setMessage('Jendela cetak diblokir browser. Izinkan pop-up untuk situs ini lalu coba lagi.');
  };

  const handleReset = async () => {
    setBusy(true);
    setMessage('');
    try {
      await resetClubInvoices(selected.map((i) => i.id));
      setMessage(`Berhasil: ${selected.length} invoice (${scopeLabel}) telah dihapus.`);
      setConfirmText('');
      setTimeout(onClose, 1500);
    } catch (e) {
      setMessage(`Gagal mereset: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const canReset = selected.length > 0 && printed && confirmText.trim().toUpperCase() === 'RESET' && !busy;

  return (
    <div className="fixed inset-0 overflow-y-auto z-50 bg-slate-950/70 flex items-center-safe justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 text-xs text-slate-700 my-6">
        <div className="flex items-center justify-between">
          <h4 className="font-heading font-black text-base text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" /> Reset Data Keuangan
          </h4>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer" aria-label="Tutup">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Data yang direset</label>
          <select
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              setPrinted(false);
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                Periode {p}
              </option>
            ))}
            <option value="Semua">Semua Periode (seluruh data keuangan)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl border border-slate-200">Jumlah invoice<b className="block text-base text-slate-900">{selected.length}</b></div>
          <div className="p-3 rounded-xl border border-slate-200">Total tagihan<b className="block text-base text-slate-900">{rupiah(totalTagihan)}</b></div>
          <div className="p-3 rounded-xl border border-emerald-200">Lunas<b className="block text-base text-emerald-700">{rupiah(totalLunas)}</b></div>
          <div className="p-3 rounded-xl border border-amber-200">Piutang<b className="block text-base text-amber-700">{rupiah(piutang)}</b></div>
        </div>

        <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 space-y-2">
          <p className="font-bold text-cyan-900">Langkah 1 — Simpan laporan dulu</p>
          <button
            type="button"
            onClick={handlePrint}
            disabled={!selected.length}
            className="w-full px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" /> Cetak / Simpan PDF Laporan
          </button>
          <p className="text-[11px] text-cyan-800">Di jendela cetak, pilih tujuan <b>"Simpan sebagai PDF"</b>.</p>
          {printed && <p className="text-emerald-700 font-bold">✓ Laporan sudah dibuka untuk dicetak/disimpan.</p>}
        </div>

        <div className={`p-3 rounded-xl border space-y-2 ${printed ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
          <p className="font-bold text-rose-800">Langkah 2 — Hapus data (tidak bisa dibatalkan)</p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={!printed}
            placeholder='Ketik "RESET" untuk konfirmasi'
            className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white font-bold"
          />
          <button
            type="button"
            onClick={handleReset}
            disabled={!canReset}
            className="w-full px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" /> {busy ? 'Menghapus…' : `Hapus ${selected.length} Invoice`}
          </button>
        </div>
        {message && (
          <p className={`font-bold ${message.startsWith('Berhasil') ? 'text-emerald-700' : 'text-rose-600'}`}>{message}</p>
        )}
      </div>
    </div>
  );
};
