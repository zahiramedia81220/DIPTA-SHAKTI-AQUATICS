import React, { useState } from 'react';
import { X, Upload, Trash2, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { compressImageFile } from '../utils/imageCompressor';
import { getInvoiceHeader } from '../utils/printHtml';
import { InvoiceHeaderSettings } from '../types';

const MAX_LOGO_KB = 200;

export const InvoiceHeaderModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { settings, updateSettings } = useApp();
  const [form, setForm] = useState<Required<InvoiceHeaderSettings>>(getInvoiceHeader(settings));
  const [logoInfo, setLogoInfo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: keyof InvoiceHeaderSettings, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleLogo = async (file?: File) => {
    setError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, atau WEBP).');
      return;
    }
    setBusy(true);
    try {
      // Kompres otomatis: maks. 200KB, sisi terpanjang 400px
      const res = await compressImageFile(file, { maxSizeKB: MAX_LOGO_KB, maxWidthOrHeight: 400 });
      if (res.sizeKB > MAX_LOGO_KB) {
        setError(`Logo masih ${res.sizeKB}KB setelah dikompres. Gunakan gambar yang lebih sederhana.`);
        return;
      }
      set('logoDataUrl', res.dataUrl);
      setLogoInfo(`Logo dikompres dari ${Math.round(file.size / 1024)}KB menjadi ${res.sizeKB}KB.`);
    } catch {
      setError('Gagal membaca gambar. Coba file lain.');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = () => {
    updateSettings({ invoiceHeader: { ...form } });
    onClose();
  };

  const field = (k: keyof InvoiceHeaderSettings, label: string, placeholder = '') => (
    <div>
      <label className="block font-bold text-slate-700 mb-1">{label}</label>
      <input
        value={form[k]}
        onChange={(e) => set(k, e.target.value)}
        placeholder={placeholder}
        maxLength={160}
        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 overflow-y-auto z-50 bg-slate-950/70 flex items-center-safe justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 space-y-4 text-xs text-slate-700 my-6">
        <div className="flex items-center justify-between">
          <h4 className="font-heading font-black text-base text-slate-900">Pengaturan Kop Invoice & Kuitansi</h4>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer" aria-label="Tutup">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 bg-slate-50">
          {form.logoDataUrl ? (
            <img src={form.logoDataUrl} alt="Logo" className="w-16 h-16 object-contain rounded-lg bg-white border border-slate-200" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-slate-900 text-cyan-400 flex items-center justify-center font-black text-xl">DS</div>
          )}
          <div className="space-y-1.5">
            <p className="font-bold text-slate-800">Logo Invoice</p>
            <p className="text-[11px] text-slate-500">JPG/PNG/WEBP. Otomatis dikompres maksimal {MAX_LOGO_KB}KB.</p>
            <div className="flex gap-2">
              <label className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer inline-flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" /> {busy ? 'Mengompres…' : 'Pilih Logo'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogo(e.target.files?.[0])} disabled={busy} />
              </label>
              {form.logoDataUrl && (
                <button
                  type="button"
                  onClick={() => {
                    set('logoDataUrl', '');
                    setLogoInfo('');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              )}
            </div>
            {logoInfo && <p className="text-emerald-700 font-semibold">{logoInfo}</p>}
            {error && <p className="text-rose-600 font-semibold">{error}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field('clubName', 'Nama Klub (judul kop)', 'DS AQUATICS CLUB')}
          {field('tagline', 'Baris Kedua (slogan / alamat singkat)')}
          <div className="sm:col-span-2">{field('contactLine', 'Baris Kontak', 'WhatsApp: 0859-... • Instagram: @...')}</div>
          {field('city', 'Kota Tanda Tangan', 'Boyolali')}
          {field('signatureText', 'Tulisan Tanda Tangan', 'Dewi Setyaningsih')}
          {field('signerName', 'Nama Penanda Tangan', 'Coach Dewi Setyaningsih')}
          {field('signerTitle', 'Jabatan Penanda Tangan', 'Kepala Pelatih & Founder')}
        </div>

        {/* Pratinjau */}
        <div className="p-4 rounded-xl border-2 border-slate-800 bg-amber-50/20">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Pratinjau Kop</p>
          <div className="flex items-center gap-3 border-b-2 border-slate-800 pb-3">
            {form.logoDataUrl ? (
              <img src={form.logoDataUrl} alt="" className="w-12 h-12 object-contain rounded-xl bg-white" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-cyan-400 flex items-center justify-center font-black text-lg">DS</div>
            )}
            <div className="min-w-0">
              <p className="font-heading font-black text-base text-slate-900 truncate">{form.clubName}</p>
              <p className="text-[10px] uppercase font-semibold text-slate-600">{form.tagline}</p>
              <p className="text-[10px] text-slate-500">{form.contactLine}</p>
            </div>
          </div>
          <div className="text-center w-48 ml-auto mt-3">
            <p className="text-[10px] text-slate-500">{form.city}, (tanggal)</p>
            <p className="font-serif italic text-cyan-800 text-lg font-bold py-2">{form.signatureText}</p>
            <p className="border-t border-slate-400 pt-1 text-[10px] font-bold text-slate-900">{form.signerName}</p>
            <p className="text-[9px] text-slate-500">{form.signerTitle}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-300 font-bold cursor-pointer">
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={busy}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> Simpan Kop
          </button>
        </div>
      </div>
    </div>
  );
};
