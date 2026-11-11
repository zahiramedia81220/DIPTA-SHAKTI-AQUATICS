import React, { useState } from 'react';
import { Link2, Copy, Check, MessageCircle, Star, Trash2, ThumbsUp } from 'lucide-react';
import { useApp } from '../context/AppContext';

/** Panel admin: salin/bagikan link langsung ke formulir Join Now & Testimoni + antrean testimoni masuk. */
export const ShareFormLinks: React.FC = () => {
  const { settings, updateSettings, testimonialSubmissions, approveTestimonialSubmission, deleteTestimonialSubmission } = useApp();
  const fallbackBase = `${window.location.origin}${window.location.pathname}`.replace(/\/$/, '');
  const [base, setBase] = useState(settings.publicSiteUrl || fallbackBase);
  const [copied, setCopied] = useState('');
  const isPreview = /ai\.studio|localhost|127\.0\.0\.1|usercontent|webcontainer/i.test(base);

  const cleanBase = base.trim().replace(/\/+$/, '');
  const links = [
    {
      key: 'join',
      title: 'Formulir Join Now (Pendaftaran)',
      url: `${cleanBase}/?form=join`,
      message: `Halo! Silakan isi formulir pendaftaran kelas renang ${settings.clubName || 'DS AQUATICS'} di link berikut:`,
    },
    {
      key: 'testimoni',
      title: 'Formulir Testimoni Member',
      url: `${cleanBase}/?form=testimoni`,
      message: `Halo Ayah/Bunda, kami ingin mendengar pengalaman berlatih di ${settings.clubName || 'DS AQUATICS'}. Mohon berkenan mengisi testimoni singkat di link berikut:`,
    },
    {
      key: 'perlengkapan',
      title: 'Katalog Produk Perlengkapan Renang',
      url: `${cleanBase}/?form=perlengkapan`,
      message: `Halo! Berikut katalog perlengkapan renang ${settings.clubName || 'DS AQUATICS'} (kacamata, baju renang, dll). Lihat & pesan di link ini:`,
    },
  ];

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const saveBase = () => {
    if (cleanBase && cleanBase !== settings.publicSiteUrl) updateSettings({ publicSiteUrl: cleanBase });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-cyan-200 space-y-4 text-xs">
      <div>
        <h4 className="font-heading font-black text-lg text-slate-900 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-cyan-600" /> Link Formulir untuk Dibagikan
        </h4>
        <p className="text-slate-500 mt-0.5">Salin link lalu kirim ke calon member atau wali murid. Link langsung membuka formulir / katalognya.</p>
      </div>

      <div>
        <label className="block font-bold text-slate-700 mb-1">Alamat website resmi</label>
        <input
          value={base}
          onChange={(e) => setBase(e.target.value)}
          onBlur={saveBase}
          placeholder="https://ds-aquatics.vercel.app"
          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
        />
        {isPreview && (
          <p className="text-amber-700 font-semibold mt-1">
            ⚠ Ini alamat preview/pengembangan. Ganti dengan alamat website resmi (mis. domain Vercel) agar link bisa dibuka klien.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {links.map((l) => (
          <div key={l.key} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2 min-w-0">
            <p className="font-bold text-slate-900">{l.title}</p>
            <p className="font-mono text-[11px] text-cyan-800 bg-white border border-slate-200 rounded-lg px-2 py-1.5 break-all">{l.url}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copy(l.key, l.url)}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer inline-flex items-center gap-1"
              >
                {copied === l.key ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === l.key ? 'Tersalin!' : 'Salin Link'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${l.message}\n${l.url}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Kirim via WhatsApp
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Antrean testimoni dari formulir */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <p className="font-bold text-slate-900">
          Testimoni masuk menunggu persetujuan{' '}
          <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{testimonialSubmissions.length}</span>
        </p>
        {testimonialSubmissions.length === 0 && <p className="text-slate-400">Belum ada testimoni baru dari formulir.</p>}
        {testimonialSubmissions.map((t) => (
          <div key={t.id} className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row sm:items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900">
                {t.name} <span className="font-normal text-slate-500">• {t.role}</span>
              </p>
              <p className="flex gap-0.5 my-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                ))}
              </p>
              <p className="text-slate-700 italic break-words">"{t.quote}"</p>
              <p className="text-[10px] text-slate-400 mt-1">{new Date(t.createdAtMs).toLocaleString('id-ID')}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => approveTestimonialSubmission(t)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer inline-flex items-center gap-1"
              >
                <ThumbsUp className="w-3.5 h-3.5" /> Tampilkan
              </button>
              <button
                type="button"
                onClick={() => deleteTestimonialSubmission(t.id)}
                className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 font-bold cursor-pointer inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
