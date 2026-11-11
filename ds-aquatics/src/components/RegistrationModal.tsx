import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Sparkles,
  Send,
  CreditCard,
  Copy,
  Check,
  AlertCircle,
  MessageCircle,
  Calendar,
  Clock,
  MapPin,
  Heart,
  FileCheck2,
} from 'lucide-react';
import { DAYS_OF_WEEK, TIME_SLOTS, getAllPricelistOptions } from '../data/defaultData';
import { DayOfWeek } from '../types';
import { copyToClipboard } from '../utils/clipboard';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPackageId?: string;
  prefilledName?: string;
  prefilledEmail?: string;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  preselectedPackageId,
  prefilledName,
  prefilledEmail,
}) => {
  const { settings, pricePackages, addMember } = useApp();
  const pricelistOptions = getAllPricelistOptions(pricePackages);

  const resolveOptionId = (inputId?: string) => {
    if (!inputId) return pricelistOptions[3]?.id || pricelistOptions[0]?.id || 'pkg-privat::0';
    if (pricelistOptions.some((o) => o.id === inputId)) return inputId;
    const byPkg = pricelistOptions.find((o) => o.packageId === inputId);
    return byPkg ? byPkg.id : pricelistOptions[0]?.id || 'pkg-privat::0';
  };

  // Form Fields matching the exact prompt structure
  const [fullName, setFullName] = useState(prefilledName || '');
  const [email, setEmail] = useState(prefilledEmail || '');
  const [ageOrDob, setAgeOrDob] = useState('');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [school, setSchool] = useState('');

  const [currentLevel, setCurrentLevel] = useState<'Pemula' | 'Menengah' | 'Lanjutan'>('Pemula');
  const [goal, setGoal] = useState('Belajar teknik dasar renang & percaya diri di air');

  const [preferredDay, setPreferredDay] = useState<DayOfWeek>('Sabtu');
  const [preferredTime, setPreferredTime] = useState<string>('08:00 - 09:00');
  const [location, setLocation] = useState<string>('Kolam Renang Lestarindo');

  const [specialConditions, setSpecialConditions] = useState('');

  const [whatsapp, setWhatsapp] = useState('');
  const [parentName, setParentName] = useState('');
  const [address, setAddress] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState<string>(() =>
    resolveOptionId(preselectedPackageId)
  );

  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [submittedMemberId, setSubmittedMemberId] = useState('');
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  // Anti-bot: honeypot (kolom tersembunyi) + waktu minimal pengisian + jeda antar kirim
  const [honeypot, setHoneypot] = useState('');
  const openedAtRef = useRef(Date.now());
  const lastSubmitRef = useRef(0);

  useEffect(() => {
    if (preselectedPackageId) {
      setSelectedOptionId(resolveOptionId(preselectedPackageId));
    }
  }, [preselectedPackageId]);

  useEffect(() => {
    if (prefilledName && !fullName) {
      setFullName(prefilledName);
    }
    if (prefilledEmail && !email) {
      setEmail(prefilledEmail);
    }
  }, [prefilledName, prefilledEmail]);

  if (!isOpen) return null;

  const selectedOpt =
    pricelistOptions.find((o) => o.id === selectedOptionId) || pricelistOptions[0];

  const handleCopy = (text: string, bank: string) => {
    copyToClipboard(text);
    setCopiedBank(bank);
    setTimeout(() => setCopiedBank(null), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!fullName || !whatsapp) {
      setFormError('Mohon isi nama lengkap ananda dan nomor WhatsApp aktif!');
      return;
    }

    const now = Date.now();
    if (honeypot || now - openedAtRef.current < 4000) {
      // Terindikasi bot: tampilkan seolah berhasil tanpa menyimpan apa pun
      setSubmittedMemberId('-');
      setShowPaymentDetails(true);
      return;
    }
    if (now - lastSubmitRef.current < 30000) {
      setFormError('Formulir baru saja dikirim. Mohon tunggu sebentar sebelum mengirim lagi.');
      return;
    }
    lastSubmitRef.current = now;

    const pkgId = selectedOpt?.packageId || 'pkg-privat';
    const sessionsCount = selectedOpt?.sessionsCount || 4;
    const tierName = selectedOpt?.shortName || 'Paket Renang';

    const newMember = addMember({
      fullName,
      email: email.trim().toLowerCase(),
      ageOrDob,
      gender,
      school,
      currentLevel,
      goal,
      preferredDay,
      preferredTime,
      location,
      specialConditions: specialConditions || 'Tidak ada riwayat penyakit',
      whatsapp,
      parentName,
      address,
      selectedPackageId: pkgId,
      status: 'Verifikasi',
      source: 'form_online',
      totalSessionsAllowed: sessionsCount,
      attendedSessions: 0,
      notes: `Pilihan Paket: ${tierName} (${selectedOpt?.formattedPrice || ''}). Pengajuan formulir member baru via website (${new Date().toLocaleDateString('id-ID')}).`,
    });

    setSubmittedMemberId(newMember.id);
    setShowPaymentDetails(true);
  };

  // WhatsApp Confirmation message
  const generateWaMessage = () => {
    const labelText = selectedOpt
      ? `${selectedOpt.shortName} (${selectedOpt.formattedPrice})`
      : selectedOptionId;
    return `Halo Admin DS AQUATICS🙌 Saya sudah mengisi formulir pendaftaran kelas renang:

*DATA ANANDA*
• Nama: ${fullName}
• Tanggal Lahir: ${ageOrDob}
• Jenis Kelamin: ${gender}
• Sekolah: ${school || '-'}

*KEMAMPUAN & TUJUAN*
• Level: ${currentLevel}
• Tujuan: ${goal}

*JADWAL & LOKASI*
• Hari: ${preferredDay}
• Jam: ${preferredTime}
• Lokasi: ${location}

*KONDISI KHUSUS*
• Catatan: ${specialConditions || '-'}

*KONTAK & PAKET*
• No. WhatsApp: ${whatsapp}
• Nama Orang Tua: ${parentName || '-'}
• Alamat: ${address || '-'}
• Paket: ${labelText}

_Saya melampirkan foto bukti transfer pembayaran terlampir. Mohon konfirmasi ketersediaan jadwal ya Coach. Terima kasih!🤗_`;
  };

  const cleanPhone = (settings?.phoneWa || '0859-5900-4884').replace(/[^0-9]/g, '');
  const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
  const waConfirmUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(generateWaMessage())}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center-safe justify-center p-2.5 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-cyan-100 my-3 sm:my-8">
        {/* Header with DS branding */}
        <div className="bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 p-5 sm:p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-cyan-200 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Formulir Pendaftaran Resmi DS AQUATICS</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-heading font-black text-white">
            Pendaftaran Kelas Renang
          </h3>

          <p className="text-xs sm:text-sm text-cyan-100 mt-1 italic leading-relaxed">
            "Halo, sissy ! Terima kasih sudah menghubungi DS🙌 Silakan isi form pendaftaran kelas privat/reguler renang berikut."
          </p>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-8 max-h-[78vh] sm:max-h-[75vh] overflow-y-auto space-y-6">
          <div className="p-3.5 rounded-2xl bg-cyan-50/70 border border-cyan-200 text-xs text-cyan-900 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-700 shrink-0" />
            <span>
              <strong>Pendaftaran Siswa Baru:</strong> Data formulir ini langsung masuk ke sistem Data Member DS AQUATICS dengan status awal <em>Verifikasi</em>. Admin akan memverifikasi jadwal dan mengaktifkan akun Anda.
            </span>
          </div>

          {!showPaymentDetails ? (
            <form onSubmit={handleSubmit} className="space-y-6 text-slate-800">
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
              {/* 1. Data Ananda */}
              <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <h4 className="font-heading font-bold text-cyan-800 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs flex items-center justify-center font-black">
                    1
                  </span>
                  <span>Data Ananda</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Lengkap Ananda *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Contoh: Muhammad Fatih"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Lahir *
                    </label>
                    <input
                      type="date"
                      required
                      value={ageOrDob}
                      onChange={(e) => setAgeOrDob(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden bg-white"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sekolah
                    </label>
                    <input
                      type="text"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="Contoh: SDIT Bina Insani"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Kemampuan & Tujuan */}
              <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <h4 className="font-heading font-bold text-cyan-800 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs flex items-center justify-center font-black">
                    2
                  </span>
                  <span>Kemampuan & Tujuan</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Level Saat Ini
                    </label>
                    <select
                      value={currentLevel}
                      onChange={(e) => setCurrentLevel(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden bg-white"
                    >
                      <option value="Pemula">Pemula</option>
                      <option value="Menengah">Menengah</option>
                      <option value="Lanjutan">Lanjutan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tujuan Latihan
                    </label>
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="Misal: belajar dasar, teknik gaya dada, persiapan lomba"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Jadwal & Lokasi */}
              <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <h4 className="font-heading font-bold text-cyan-800 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs flex items-center justify-center font-black">
                    3
                  </span>
                  <span>Jadwal & Lokasi</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pilihan Hari
                    </label>
                    <select
                      value={preferredDay}
                      onChange={(e) => setPreferredDay(e.target.value as DayOfWeek)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pilihan Jam
                    </label>
                    <select
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Lokasi Latihan
                    </label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="Kolam Renang Lestarindo">Kolam Renang Lestarindo</option>
                      <option value="Front One Boutique Adria Boyolali">
                        Front One Boutique Adria Boyolali
                      </option>
                    </select>
                  </div>
                </div>

                {location !== 'Kolam Renang Lestarindo' && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      *(Dikenakan biaya tambahan tiket masuk pelatih sesuai tarif kolam renang yang dipilih)*
                    </span>
                  </div>
                )}
              </div>

              {/* 4. Kondisi Khusus */}
              <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <h4 className="font-heading font-bold text-cyan-800 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs flex items-center justify-center font-black">
                    4
                  </span>
                  <span>Kondisi Khusus (jika ada)</span>
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Riwayat Kesehatan / Catatan Penting
                  </label>
                  <input
                    type="text"
                    value={specialConditions}
                    onChange={(e) => setSpecialConditions(e.target.value)}
                    placeholder="Contoh: Takut air dalam, asma ringan, alergi kaporit, dll. (Kosongkan jika sehat)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 5. Kontak & Paket */}
              <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <h4 className="font-heading font-bold text-cyan-800 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs flex items-center justify-center font-black">
                    5
                  </span>
                  <span>Kontak & Pilihan Paket</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      No. WhatsApp Aktif *
                    </label>
                    <input
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email / Akun Gmail Siswa/Wali *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@gmail.com (Untuk akses login setelah diinput Admin)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Orang Tua (jika anak)
                    </label>
                    <input
                      type="text"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="Contoh: Bunda Rina / Ayah Hendra"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alamat Tinggal
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Contoh: Jl. Pandanaran No. 45, Boyolali"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Paket yang Dipilih *
                    </label>
                    <select
                      value={selectedOptionId}
                      onChange={(e) => setSelectedOptionId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-cyan-300 text-sm font-semibold text-cyan-900 bg-cyan-50/50 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    >
                      {pricelistOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    {selectedOpt && (
                      <div className="mt-2.5 p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 border border-cyan-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-cyan-700 text-white text-[11px] font-black shrink-0">
                              #{selectedOpt.number}
                            </span>
                            <span className="font-heading font-black text-slate-900 text-xs sm:text-sm">
                              {selectedOpt.shortName}
                            </span>
                            {selectedOpt.discountText && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 uppercase shadow-xs shrink-0">
                                {selectedOpt.discountText}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Total Kuota: <strong>{selectedOpt.sessionsCount} Kali Pertemuan</strong> &bull; Jadwal {preferredDay} {preferredTime}
                          </p>
                        </div>
                        <div className="text-left sm:text-right shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-cyan-200/50">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block leading-tight">Biaya Paket:</span>
                          <span className="font-heading font-black text-cyan-800 text-sm sm:text-base">
                            {selectedOpt.formattedPrice}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Validation Error Banner */}
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Notice & Submit Button */}
              <p className="text-xs text-slate-500 italic text-center">
                Setelah mengisi, mohon ditunggu konfirmasi jadwal & ketersediaan 🙏☺️ Terima kasih!🤗
              </p>

              <button
                type="submit"
                id="btn-submit-registration"
                className="w-full py-4 px-6 rounded-2xl font-heading font-black text-base text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-xl shadow-amber-400/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Lanjut ke Pembayaran & Konfirmasi</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* SECTION G: SISTEM PEMBAYARAN & KONFIRMASI WA */
            <div className="space-y-6 text-slate-800 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center mb-2 shadow-md">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <h4 className="font-heading font-black text-emerald-900 text-lg">
                  Pendaftaran Berhasil Disimpan!
                </h4>
                <p className="text-xs text-emerald-700">
                  ID Member Ananda: <strong className="font-mono">{submittedMemberId}</strong>
                </p>
                <p className="text-xs text-slate-600">
                  Data langsung terintegrasi ke database member & jadwal DS AQUATICS.
                </p>
              </div>

              {/* Payment Account Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-cyan-600" />
                  <h4 className="font-heading font-bold text-slate-900 text-base">
                    Informasi Rekening Pembayaran
                  </h4>
                </div>

                <div className="p-3.5 rounded-2xl bg-cyan-50/70 border border-cyan-200 text-xs text-cyan-900">
                  Silakan transfer biaya paket ke salah satu rekening resmi di bawah ini:
                  <div className="mt-1 font-bold text-sm text-slate-900">
                    A/N {settings.paymentAccountName}
                  </div>
                </div>

                {/* Bank List */}
                <div className="grid grid-cols-1 gap-3">
                  {/* BRI */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-xs font-bold text-blue-700">Bank BRI</span>
                      <div className="font-mono text-base font-black text-slate-900 tracking-wide">
                        {settings.paymentBri}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        a/n {settings.paymentAccountName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(settings.paymentBri, 'bri')}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 border border-slate-200 flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
                    >
                      {copiedBank === 'bri' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin No. Rek</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* BCA */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-xs font-bold text-blue-800">Bank BCA</span>
                      <div className="font-mono text-base font-black text-slate-900 tracking-wide">
                        {settings.paymentBca}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        a/n {settings.paymentAccountName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(settings.paymentBca, 'bca')}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 border border-slate-200 flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
                    >
                      {copiedBank === 'bca' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin No. Rek</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Mandiri */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-xs font-bold text-amber-700">Bank Mandiri</span>
                      <div className="font-mono text-base font-black text-slate-900 tracking-wide">
                        {settings.paymentMandiri}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        a/n {settings.paymentAccountName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(settings.paymentMandiri, 'mandiri')}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 border border-slate-200 flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
                    >
                      {copiedBank === 'mandiri' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin No. Rek</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification to send transfer receipt via WhatsApp */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Penting: Notifikasi Bukti Pembayaran</span>
                </div>
                <p>
                  Setelah melakukan transfer, silakan klik tombol hijau di bawah untuk mengirim konfirmasi dan <strong>lampirkan foto bukti transfer via WhatsApp</strong> ke Coach Dewi Setyaningsih.
                </p>
              </div>

              {/* WhatsApp Confirmation Button */}
              <div className="space-y-3 pt-2">
                <a
                  href={waConfirmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="btn-confirm-payment-wa"
                  className="w-full py-4 px-6 rounded-2xl font-heading font-black text-base text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Konfirmasi Pembayaran via WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
