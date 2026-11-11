import React, { useRef, useState } from 'react';
import { X, Star, Send, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

/** Formulir testimoni publik (dibuka dari link ?form=testimoni). Masuk antrean persetujuan admin. */
export const TestimonialFormModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { submitTestimonial, settings } = useApp();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [quote, setQuote] = useState('');
  const [rating, setRating] = useState(5);
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const openedAt = useRef(Date.now());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Nama wajib diisi.');
    if (quote.trim().length < 10) return setError('Testimoni minimal 10 karakter.');
    // Anti-bot: kolom jebakan terisi atau dikirim terlalu cepat → tampil sukses tanpa menyimpan
    if (honeypot || Date.now() - openedAt.current < 4000) {
      setDone(true);
      return;
    }
    setBusy(true);
    try {
      await submitTestimonial({ name, role: role || 'Wali Murid / Member', quote, rating });
      setDone(true);
    } catch {
      setError('Gagal mengirim. Periksa koneksi internet lalu coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-y-auto z-[60] bg-slate-950/80 flex items-center-safe justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 text-sm text-slate-700 my-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-700">{settings.clubName || 'DS AQUATICS'}</p>
            <h3 className="font-heading font-black text-xl text-slate-900">Tulis Testimoni Anda</h3>
            <p className="text-xs text-slate-500 mt-1">Ceritakan pengalaman berlatih bersama kami. Testimoni tampil setelah disetujui admin.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer" aria-label="Tutup">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-900">Terima kasih atas testimoninya!</p>
            <p className="text-xs text-slate-500">Testimoni Anda akan ditampilkan di website setelah diperiksa admin.</p>
            <button onClick={onClose} className="px-5 py-2 rounded-xl bg-cyan-600 text-white font-bold cursor-pointer">
              Tutup
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
            />
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Contoh: Bunda Fatih" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Keterangan</label>
              <input value={role} onChange={(e) => setRole(e.target.value)} maxLength={80} placeholder="Contoh: Wali murid kelas Reguler" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Penilaian</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} onClick={() => setRating(n)} className="p-0.5 cursor-pointer" aria-label={`${n} bintang`}>
                    <Star className={`w-7 h-7 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Testimoni *</label>
              <textarea value={quote} onChange={(e) => setQuote(e.target.value)} maxLength={600} rows={4} placeholder="Tuliskan pengalaman Anda…" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden" />
              <p className="text-right text-[10px] text-slate-400">{quote.length}/600</p>
            </div>
            {error && <p className="text-rose-600 font-bold">{error}</p>}
            <button type="submit" disabled={busy} className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-60">
              <Send className="w-4 h-4" /> {busy ? 'Mengirim…' : 'Kirim Testimoni'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
