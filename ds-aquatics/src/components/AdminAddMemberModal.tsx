import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, UserPlus, Mail, Phone, Calendar, Clock, MapPin, Award, CheckCircle2, Shield } from 'lucide-react';
import { DayOfWeek, Member } from '../types';
import { DAYS_OF_WEEK, getAllPricelistOptions } from '../data/defaultData';

interface AdminAddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (memberName: string) => void;
}

export const AdminAddMemberModal: React.FC<AdminAddMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { members, addMember, pricePackages } = useApp();
  const pricelistOptions = getAllPricelistOptions(pricePackages);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [ageOrDob, setAgeOrDob] = useState('');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [parentName, setParentName] = useState('');
  const [school, setSchool] = useState('');
  const [address, setAddress] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState(
    pricelistOptions[1]?.id || pricelistOptions[0]?.id || 'pkg-reguler::1'
  );
  const [totalSessionsAllowed, setTotalSessionsAllowed] = useState(4);
  const [preferredDay, setPreferredDay] = useState<DayOfWeek>('Sabtu');
  const [preferredTime, setPreferredTime] = useState('08:00 - 09:00');
  const [location, setLocation] = useState('Kolam Renang Lestarindo');
  const [currentLevel, setCurrentLevel] = useState<'Pemula' | 'Menengah' | 'Lanjutan'>('Pemula');
  const [memberStatus, setMemberStatus] = useState<'Aktif' | 'Verifikasi' | 'Tidak Aktif' | 'Ditolak'>('Aktif');
  const [goal, setGoal] = useState('Kebugaran & Penguasaan Teknik Dasar');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanWa = whatsapp.trim();

    if (!cleanName) {
      setErrorMsg('Nama Lengkap Siswa wajib diisi!');
      return;
    }

    // Check if email already registered if provided
    if (cleanEmail) {
      const existing = members.find((m) => m.email && m.email.trim().toLowerCase() === cleanEmail);
      if (existing) {
        setErrorMsg(`Email ${cleanEmail} sudah terdaftar atas nama ${existing.fullName} (ID: ${existing.id})!`);
        return;
      }
    }

    // Generate unique ID
    const nextNum = members.length + 1;
    const generatedId = `MBR-${String(nextNum).padStart(3, '0')}`;

    const chosenOpt =
      pricelistOptions.find((o) => o.id === selectedOptionId) || pricelistOptions[0];
    const resolvedPackageId = chosenOpt?.packageId || 'pkg-reguler';

    const newMember: Member = {
      id: generatedId,
      fullName: cleanName,
      email: cleanEmail || undefined,
      whatsapp: cleanWa || '0859-5900-4884',
      ageOrDob: ageOrDob.trim() || '2015-01-01',
      gender,
      parentName: parentName.trim() || 'Wali Siswa',
      school: school.trim() || '-',
      address: address.trim() || 'Boyolali',
      selectedPackageId: resolvedPackageId,
      totalSessionsAllowed: Number(totalSessionsAllowed) || 4,
      attendedSessions: 0,
      preferredDay,
      preferredTime,
      location,
      currentLevel,
      goal: goal.trim() || 'Teknik Renang',
      specialConditions: '-',
      registrationDate: new Date().toISOString().split('T')[0],
      status: memberStatus,
      source: 'manual_admin',
      notes:
        notes.trim() ||
        `Paket: ${chosenOpt?.shortName || 'Paket Renang'}. Akun member diinput langsung oleh Admin Klub DS AQUATICS.`,
    };

    addMember(newMember);

    if (onSuccess) {
      onSuccess(cleanName);
    }

    // Reset form
    setFullName('');
    setEmail('');
    setWhatsapp('');
    setAgeOrDob('');
    setParentName('');
    setSchool('');
    setAddress('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center-safe justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-lg text-white">
                  Input Akun Member Baru (Admin Only)
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-bold uppercase border border-amber-400/40">
                  Manual Entry
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Member terdaftar manual di sini langsung memiliki hak akses login ke Panel Member.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="bg-cyan-50/70 border border-cyan-200 rounded-xl p-3 flex items-start gap-2.5 text-cyan-950">
            <Shield className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Ketentuan Akses Login:</strong> Member login menggunakan <strong>Username / ID Member</strong> dan Password. Pastikan nomor WhatsApp dan data tanggal lahir diisi dengan akurat.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama Lengkap */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Lengkap Siswa: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Muhammad Kevin Pratama"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Email Siswa / Wali:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh.siswa@email.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                No. WhatsApp (Aktif): <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="0859-xxxx-xxxx"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Tanggal Lahir */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Lahir:</label>
              <input
                type="date"
                value={ageOrDob}
                onChange={(e) => setAgeOrDob(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden bg-white font-medium"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin:</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Laki-laki' | 'Perempuan')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            {/* Nama Wali */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Orang Tua / Wali:</label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Contoh: Bapak Hendra"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
              />
            </div>

            {/* Asal Sekolah */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Asal Sekolah:</label>
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Contoh: SD Negeri 1 Boyolali"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
              />
            </div>

            {/* Tingkat Level */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tingkat Level Renang:</label>
              <select
                value={currentLevel}
                onChange={(e) => setCurrentLevel(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium"
              >
                <option value="Pemula">Pemula</option>
                <option value="Menengah">Menengah</option>
                <option value="Lanjutan">Lanjutan</option>
              </select>
            </div>

            {/* Status Member */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status Keanggotaan:</label>
              <select
                value={memberStatus}
                onChange={(e) => setMemberStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800"
              >
                <option value="Aktif">Aktif</option>
                <option value="Verifikasi">Verifikasi (Menunggu Validasi)</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>

            {/* Pilihan Paket */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Paket Renang (Price List):</label>
              <select
                value={selectedOptionId}
                onChange={(e) => {
                  setSelectedOptionId(e.target.value);
                  const opt = pricelistOptions.find((o) => o.id === e.target.value);
                  if (opt) {
                    setTotalSessionsAllowed(opt.sessionsCount);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium"
              >
                {pricelistOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Kuota Sesi Allowed */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Kuota Sesi (Sesi):</label>
              <input
                type="number"
                min={1}
                max={30}
                value={totalSessionsAllowed}
                onChange={(e) => setTotalSessionsAllowed(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            {/* Hari Latihan */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hari Latihan:</label>
              <select
                value={preferredDay}
                onChange={(e) => setPreferredDay(e.target.value as DayOfWeek)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Jam Latihan */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jam Latihan:</label>
              <input
                type="text"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                placeholder="Contoh: 08:00 - 09:00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium"
              />
            </div>

            {/* Lokasi Kolam */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Lokasi Kolam Renang:</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium"
              >
                <option value="Kolam Renang Lestarindo">Kolam Renang Lestarindo (Boyolali)</option>
                <option value="Front One Boutique Adria Boyolali">Front One Boutique Adria Boyolali</option>
              </select>
            </div>

            {/* Alamat */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Alamat Domisili:</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Contoh: Kebonbimo, Boyolali"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-heading font-black text-xs bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Daftarkan Member</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
