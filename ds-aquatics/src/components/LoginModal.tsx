import React, { useState, useEffect } from 'react';
import { useApp, ADMIN_ACCOUNTS } from '../context/AppContext';
import { DsLogo } from './DsLogo';
import {
  X,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessAdmin: () => void;
  onSuccessMember: () => void;
  onPushJoinNow: (prefill?: { fullName?: string; email?: string }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccessAdmin,
  onSuccessMember,
  onPushJoinNow,
}) => {
  const { settings, loginWithEmail, loginWithGoogle } = useApp();

  // Username and password only
  const [usernameOrId, setUsernameOrId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // Seed acak setiap modal dibuka agar browser tidak mengenali input sebagai kredensial tersimpan
  const [fieldSeed, setFieldSeed] = useState(() => Date.now().toString(36));

  // Pastikan setelah logout atau saat modal dibuka, input selalu bersih kembali ke teks bayangan (placeholder)
  useEffect(() => {
    if (isOpen) {
      const nextSeed = Date.now().toString(36);
      setFieldSeed(nextSeed);
      setUsernameOrId('');
      setPassword('');
      setShowPassword(false);
      setErrorMsg('');
      setIsLoading(false);

      // Bersihkan juga jika browser mencoba menyuntikkan autofill tertunda (50ms & 150ms)
      const t1 = setTimeout(() => {
        setUsernameOrId('');
        setPassword('');
      }, 50);
      const t2 = setTimeout(() => {
        setUsernameOrId('');
        setPassword('');
      }, 150);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isOpen]);

  const handleClose = () => {
    setUsernameOrId('');
    setPassword('');
    setShowPassword(false);
    setErrorMsg('');
    onClose();
  };

  if (!isOpen) return null;

  const finishLogin = (res: Awaited<ReturnType<typeof loginWithEmail>>) => {
    setIsLoading(false);
    if (res.success) {
      handleClose();
      if (res.role === 'admin') onSuccessAdmin();
      else onSuccessMember();
      return;
    }
    setErrorMsg(
      res.errorReason ||
        'Login gagal. Pastikan email dan password sudah benar. Untuk calon siswa, silakan lakukan pendaftaran baru melalui tombol di bawah.'
    );
  };

  // Login dengan Email & Password (Firebase Authentication)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanInput = usernameOrId.trim().toLowerCase();
    if (!cleanInput || !cleanInput.includes('@')) {
      setErrorMsg('Silakan masukkan alamat email akun Anda.');
      return;
    }
    // Email admin → langsung buka login Google (dipanggil seketika agar popup tidak diblokir)
    if (ADMIN_ACCOUNTS.some((a) => a.email.toLowerCase() === cleanInput)) {
      setIsLoading(true);
      finishLogin(await loginWithGoogle(cleanInput));
      return;
    }
    if (!password) {
      setErrorMsg('Password wajib diisi.');
      return;
    }
    setIsLoading(true);
    finishLogin(await loginWithEmail(cleanInput, password));
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setIsLoading(true);
    finishLogin(await loginWithGoogle());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center-safe justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-cyan-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-blue-950 p-6 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <DsLogo size={46} customLogoUrl={settings.logoUrl} showText={false} />
            <div>
              <div className="flex items-center gap-1.5 text-cyan-300 text-[11px] font-bold uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Portal Resmi DS AQUATICS</span>
              </div>
              <h3 className="text-xl font-heading font-black text-white leading-tight">
                Masuk ke Akun Anda
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2.5">
            Member: masuk dengan Email &amp; Password akun. Admin: cukup ketik email admin lalu tekan Masuk (login Google).
          </p>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium leading-relaxed">
            {errorMsg}
          </div>
        )}

        {/* Login Form (Username & Password ONLY) */}
        <div className="p-6 space-y-5 text-slate-800">
          <form onSubmit={handleLogin} className="space-y-4" autoComplete="off" noValidate>
            {/* Decoy inputs tersembunyi untuk menangkap autofill browser agar tidak mengisi kolom formulir nyata */}
            <input
              type="text"
              name="fake_autofill_username"
              tabIndex={-1}
              autoComplete="username"
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 1, width: 1, pointerEvents: 'none' }}
            />
            <input
              type="password"
              name="fake_autofill_password"
              tabIndex={-1}
              autoComplete="current-password"
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 1, width: 1, pointerEvents: 'none' }}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Email Akun</span>
                <span className="text-[10px] text-slate-400 font-normal">Username</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  name={`dsa_usr_${fieldSeed}`}
                  id={`dsa_usr_${fieldSeed}`}
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                  required
                  value={usernameOrId}
                  onChange={(e) => setUsernameOrId(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden font-medium placeholder:text-slate-400 shadow-inner bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Password</span>
                <span className="text-[10px] text-slate-400 font-normal">Kata sandi akun</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name={`dsa_pwd_${fieldSeed}`}
                  id={`dsa_pwd_${fieldSeed}`}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden font-medium placeholder:text-slate-400 shadow-inner bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer rounded-md"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              id="btn-submit-unified-login"
              className="w-full py-3.5 px-4 rounded-xl font-heading font-black text-sm text-white bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
              </svg>
              <span>Masuk dengan Google (Admin)</span>
            </button>

            {/* Tombol Push ke Join Now! */}
            <div className="pt-3 text-center border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-2">
                Calon siswa baru belum memiliki akun?
              </p>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onPushJoinNow(usernameOrId.includes('@') ? { email: usernameOrId.trim() } : undefined);
                }}
                id="btn-login-to-join-now"
                className="w-full py-2.5 px-3 rounded-xl border border-cyan-500/50 bg-cyan-50 hover:bg-cyan-100/70 text-cyan-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                <span>Pengajuan Siswa Baru (Join Now!)</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
