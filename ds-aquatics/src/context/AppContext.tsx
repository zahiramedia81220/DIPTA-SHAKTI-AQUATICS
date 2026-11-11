import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  ClubSettings,
  Member,
  MemberAccount,
  ScheduleSlot,
  ScheduleRequest,
  PricePackage,
  DocumentationItem,
  TestimonialItem,
  SwimGearProduct,
  EvaluationCriterion,
  MemberReport,
  UserSession,
  UserRole,
  RequestStatus,
  AttendanceRecord,
  ClubInvoice,
  LoginLog,
  LoginEvent,
  PresenceRecord,
  TestimonialSubmission,
} from '../types';
import {
  DEFAULT_CLUB_SETTINGS,
  DEFAULT_SCHEDULE_SLOTS,
  DEFAULT_PRICE_PACKAGES,
  DEFAULT_DOCUMENTATION,
  DEFAULT_TESTIMONIALS,
  DEFAULT_SWIM_GEAR,
  DEFAULT_EVALUATION_CRITERIA,
  sortPricePackages,
  getStandardFormattedPrice,
  getStandardTierName,
} from '../data/defaultData';
import {
  db,
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  writeBatch,
  addDoc,
  orderBy,
  limit,
  serverTimestamp,
  logFirestoreError,
  OperationType,
  User,
} from '../firebase';
import { parseAndFormatRequestDateTime } from '../utils/dateFormatter';
import {
  MemberAuthDoc,
  authErrorMessage,
  syncAccountToAuth,
  applyAccountChange,
  removeAccount,
} from '../utils/memberAuth';

export interface AdminAccount {
  email: string;
  name: string;
  roleTitle: string;
}

/**
 * Daftar admin resmi. Jika diubah, ubah juga daftar email di firestore.rules (fungsi isAdmin).
 */
export const ADMIN_ACCOUNTS: AdminAccount[] = [
  { email: 'alisastore.ceria@gmail.com', name: 'Alisa Zahira Destyana', roleTitle: 'Admin Club' },
  { email: 'dewisetyaningsih17@gmail.com', name: 'Dewi Setyaningsih', roleTitle: 'Kepala Pelatih & Founder' },
  { email: 'ewm.dsn@gmail.com', name: 'Elfan Wahyu Mulyana', roleTitle: 'Admin Operasional' },
  { email: 'berlianbusinesspartner@gmail.com', name: 'Berlian El-Shanum Destyana', roleTitle: 'Admin Partner' },
];
const ADMIN_EMAILS = ADMIN_ACCOUNTS.map((a) => a.email.toLowerCase());

export interface LoginResult {
  success: boolean;
  role?: UserRole;
  email?: string;
  name?: string;
  adminRoleTitle?: string;
  unregistered?: boolean;
  popupBlocked?: boolean;
  errorReason?: string;
}

interface AppContextType {
  settings: ClubSettings;
  updateSettings: (newSettings: Partial<ClubSettings>) => void;

  currentUser: UserSession;
  authReady: boolean;
  loginWithEmail: (email: string, password: string) => Promise<LoginResult>;
  loginWithGoogle: (emailHint?: string) => Promise<LoginResult>;
  logout: () => void;
  sessionTimeoutWarning: string | null;
  clearSessionTimeoutWarning: () => void;

  members: Member[];
  activeMembersCount: number;
  addMember: (member: Omit<Member, 'id' | 'attendanceCount' | 'registrationDate'>) => Member;
  updateMember: (id: string, member: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  importMembers: (
    rows: { id: string; fullName: string; parentName: string; whatsapp: string; address: string }[],
    defaults: { status: Member['status']; selectedPackageId: string; totalSessionsAllowed: number; location: string }
  ) => Promise<{ created: number; updated: number }>;

  memberAccounts: MemberAccount[];
  addMemberAccount: (account: Omit<MemberAccount, 'id' | 'createdAt'> & { id?: string }) => MemberAccount;
  updateMemberAccount: (id: string, updates: Partial<MemberAccount>) => void;
  deleteMemberAccount: (id: string) => void;

  scheduleSlots: ScheduleSlot[];
  addScheduleSlot: (slot: Omit<ScheduleSlot, 'id'>) => ScheduleSlot;
  deleteScheduleSlot: (id: string) => void;
  updateScheduleSlot: (id: string, slot: Partial<ScheduleSlot>) => void;
  toggleSlotAttendance: (id: string) => void;
  toggleSlotOff: (id: string) => void;
  setSlotStatus: (id: string, status: 'tersedia' | 'hadir' | 'off') => void;
  importScheduleSlots: (slots: ScheduleSlot[], mode: 'replace' | 'merge') => Promise<void>;

  scheduleRequests: ScheduleRequest[];
  addScheduleRequest: (req: {
    memberId?: string;
    memberName: string;
    whatsapp: string;
    day: any;
    timeRange: string;
    location: string;
    packageId?: string;
  }) => ScheduleRequest;
  updateScheduleRequestStatus: (id: string, status: RequestStatus, coachNote?: string) => void;
  reviewScheduleRequest: (id: string, status: any, coachNote?: string) => void;
  deleteScheduleRequest: (id: string) => void;
  markAttendance: (requestIdOrMemberId: string, memberId?: string) => void;
  attendanceRecords: AttendanceRecord[];

  pricePackages: PricePackage[];
  addPricePackage: (pkg: Omit<PricePackage, 'id'>) => void;
  updatePricePackage: (id: string, pkg: Partial<PricePackage>) => void;
  deletePricePackage: (id: string) => void;

  documentation: DocumentationItem[];
  addDocumentation: (item: Omit<DocumentationItem, 'id'>) => void;
  updateDocumentation: (id: string, item: Partial<DocumentationItem>) => void;
  deleteDocumentation: (id: string) => void;

  testimonials: TestimonialItem[];
  addTestimonial: (item: Omit<TestimonialItem, 'id'>) => void;
  updateTestimonial: (id: string, item: Partial<TestimonialItem>) => void;
  deleteTestimonial: (id: string) => void;
  submitTestimonial: (data: { name: string; role: string; quote: string; rating: number }) => Promise<void>;
  testimonialSubmissions: TestimonialSubmission[];
  approveTestimonialSubmission: (sub: TestimonialSubmission) => Promise<void>;
  deleteTestimonialSubmission: (id: string) => void;

  swimGear: SwimGearProduct[];
  addSwimGear: (item: Omit<SwimGearProduct, 'id'>) => void;
  updateSwimGear: (id: string, item: Partial<SwimGearProduct>) => void;
  deleteSwimGear: (id: string) => void;

  evaluationCriteria: EvaluationCriterion[];
  addEvaluationCriterion: (item: Omit<EvaluationCriterion, 'id'>) => void;
  updateEvaluationCriterion: (id: string, item: Partial<EvaluationCriterion>) => void;
  deleteEvaluationCriterion: (id: string) => void;

  memberReports: MemberReport[];
  addMemberReport: (report: Omit<MemberReport, 'id'>) => MemberReport;
  updateMemberReport: (id: string, report: Partial<MemberReport>) => void;
  deleteMemberReport: (id: string) => void;

  clubInvoices: ClubInvoice[];
  addClubInvoice: (invoice: Omit<ClubInvoice, 'id' | 'formattedAmount'>) => ClubInvoice;
  updateClubInvoice: (id: string, updates: Partial<ClubInvoice>) => void;
  deleteClubInvoice: (id: string) => void;
  recordInvoicePayment: (id: string, paymentMethod: string, customReceiptNumber?: string) => void;
  resetClubInvoices: (ids: string[]) => Promise<void>;

  isFirebaseConnected: boolean;

  // Khusus admin
  loginLogs: LoginLog[];
  presence: PresenceRecord[];
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const GUEST: UserSession = { role: 'guest', name: 'Tamu' };

// ---------- Helpers ----------
const write = (p: Promise<unknown>, op: OperationType, path: string) =>
  p.catch((err) => logFirestoreError(err, op, path));

/** ID berurutan yang dijamin tidak bentrok dengan ID yang sudah ada (mis. MEM-007). */
function nextSeqId(prefix: string, existingIds: string[]): string {
  const re = new RegExp(`^${prefix}-(\\d+)$`, 'i');
  const taken = new Set(existingIds.map((i) => i.toUpperCase()));
  let n = existingIds.reduce((max, i) => {
    const m = re.exec(i);
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);
  let id = '';
  do {
    n += 1;
    id = `${prefix}-${String(n).padStart(3, '0')}`;
  } while (taken.has(id));
  return id;
}

/** ID unik untuk penulis yang tidak bisa membaca seluruh koleksi (pendaftar tamu). */
const uniqueId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

function normalizeRequest(r: ScheduleRequest): ScheduleRequest {
  const parsed = parseAndFormatRequestDateTime(r.requestDate, r.createdAt);
  return { ...r, requestDate: parsed.date, createdAt: parsed.fullDisplay };
}

function hasLegacyPricing(pkg: PricePackage) {
  return (pkg.pricingTiers || []).some(
    (t) =>
      t.formattedPrice.includes('k') ||
      t.formattedPrice.includes('@') ||
      t.name.includes('disc') ||
      t.name.includes('200k') ||
      t.name.includes('3x')
  );
}

function sanitizePackages(items: PricePackage[]): PricePackage[] {
  return sortPricePackages(items).map((pkg) => {
    const defaultMatch = DEFAULT_PRICE_PACKAGES.find((dp) => dp.id === pkg.id);
    if (hasLegacyPricing(pkg) && defaultMatch) return defaultMatch;
    return {
      ...pkg,
      pricingTiers: (pkg.pricingTiers || []).map((t) => ({
        ...t,
        name: getStandardTierName(t),
        formattedPrice: getStandardFormattedPrice(t, pkg.id),
      })),
    };
  });
}

/** Ringkasan perangkat, mis. "Chrome · Android". */
function getDeviceLabel(): string {
  if (typeof navigator === 'undefined') return '-';
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
    ? 'Opera'
    : /SamsungBrowser/.test(ua)
    ? 'Samsung Internet'
    : /Chrome\//.test(ua)
    ? 'Chrome'
    : /Firefox\//.test(ua)
    ? 'Firefox'
    : /Safari\//.test(ua)
    ? 'Safari'
    : 'Browser';
  const os = /Android/.test(ua)
    ? 'Android'
    : /iPhone|iPad|iPod/.test(ua)
    ? 'iOS'
    : /Windows/.test(ua)
    ? 'Windows'
    : /Mac OS X/.test(ua)
    ? 'macOS'
    : /Linux/.test(ua)
    ? 'Linux'
    : 'Lainnya';
  return `${browser} · ${os}`;
}
const DEVICE = getDeviceLabel();

/** Catat kejadian login/logout ke koleksi loginLogs (hanya bisa dibaca admin, tidak bisa diubah/dihapus). */
function logAuthEvent(entry: {
  uid?: string;
  email: string;
  name?: string;
  role: UserRole | 'unknown';
  event: LoginEvent;
  method?: 'google' | 'password';
  reason?: string;
}): Promise<unknown> {
  return addDoc(collection(db, 'loginLogs'), {
    ...entry,
    email: (entry.email || '-').trim().toLowerCase().slice(0, 120),
    reason: entry.reason ? entry.reason.slice(0, 300) : undefined,
    device: DEVICE,
    createdAt: serverTimestamp(),
  }).catch((err) => logFirestoreError(err, OperationType.CREATE, 'loginLogs'));
}

function writePresence(uid: string, s: UserSession, state: 'online' | 'offline'): Promise<unknown> {
  if (s.role === 'guest') return Promise.resolve();
  return setDoc(doc(db, 'presence', uid), {
    uid,
    email: (s.email || '').toLowerCase(),
    name: s.name || '',
    role: s.role,
    memberId: s.memberId || '',
    state,
    lastSeen: serverTimestamp(),
    device: DEVICE,
  }).catch((err) => logFirestoreError(err, OperationType.WRITE, `presence/${uid}`));
}

const withTimeout = (p: Promise<unknown>, ms: number) =>
  Promise.race([p, new Promise((r) => setTimeout(r, ms))]);

type SessionCheck = { session?: UserSession; error?: string; unverifiedAdmin?: boolean };

/** Tentukan peran pengguna dari akun Firebase Auth. */
async function resolveSession(user: User): Promise<SessionCheck> {
  const email = (user.email || '').trim().toLowerCase();
  const admin = ADMIN_ACCOUNTS.find((a) => a.email.toLowerCase() === email);
  if (admin) {
    if (!user.emailVerified) {
      return { unverifiedAdmin: true, error: 'Email admin belum terverifikasi.' };
    }
    return {
      session: { role: 'admin', name: admin.name, email: admin.email, adminRoleTitle: admin.roleTitle },
    };
  }
  try {
    const snap = await getDoc(doc(db, 'memberAuth', user.uid));
    if (!snap.exists()) {
      return { error: 'Akun ini belum terdaftar atau belum diaktifkan oleh admin DS AQUATICS.' };
    }
    const d = snap.data() as MemberAuthDoc;
    if (d.status !== 'Aktif') {
      return { error: 'Akun member ini sedang dinonaktifkan oleh administrator.' };
    }
    return { session: { role: 'member', memberId: d.memberId, name: d.fullName, email: d.email } };
  } catch (e) {
    logFirestoreError(e, OperationType.GET, `memberAuth/${user.uid}`);
    return { error: 'Gagal memverifikasi akun. Periksa koneksi internet Anda.' };
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Semua data berasal dari Firestore (tanpa localStorage / sessionStorage)
  const [settings, setSettings] = useState<ClubSettings>(DEFAULT_CLUB_SETTINGS);
  const [session, setSession] = useState<UserSession>(GUEST);
  const [authReady, setAuthReady] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberAccounts, setMemberAccounts] = useState<MemberAccount[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [scheduleRequests, setScheduleRequests] = useState<ScheduleRequest[]>([]);
  const [pricePackages, setPricePackages] = useState<PricePackage[]>([]);
  const [documentation, setDocumentation] = useState<DocumentationItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [swimGear, setSwimGear] = useState<SwimGearProduct[]>([]);
  const [evaluationCriteria, setEvaluationCriteria] = useState<EvaluationCriterion[]>([]);
  const [memberReports, setMemberReports] = useState<MemberReport[]>([]);
  const [clubInvoices, setClubInvoices] = useState<ClubInvoice[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [presence, setPresence] = useState<PresenceRecord[]>([]);
  const [testimonialSubmissions, setTestimonialSubmissions] = useState<TestimonialSubmission[]>([]);
  const [publicActiveCount, setPublicActiveCount] = useState<number | null>(null);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [accountsLoaded, setAccountsLoaded] = useState(false);

  const [sessionTimeoutWarning, setSessionTimeoutWarning] = useState<string | null>(null);
  const clearSessionTimeoutWarning = () => setSessionTimeoutWarning(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  const role = session.role;
  const isAdmin = role === 'admin';
  const loginInProgress = useRef(false);
  const authSeq = useRef(0);
  const seededRef = useRef(false);
  const syncingRef = useRef<Set<string>>(new Set());

  // ---------- Firebase Auth: sumber tunggal sesi login ----------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      const seq = ++authSeq.current;
      if (!user) {
        setSession(GUEST);
        setAuthReady(true);
        return;
      }
      const res = await resolveSession(user);
      if (seq !== authSeq.current) return; // ada perubahan auth yang lebih baru
      if (res.session) {
        setSession(res.session);
      } else {
        setSession(GUEST);
        if (!loginInProgress.current) firebaseSignOut(auth).catch(() => {});
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const loginWithEmail = async (email: string, password: string): Promise<LoginResult> => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, errorReason: 'Email dan password wajib diisi.' };
    }
    if (ADMIN_EMAILS.includes(cleanEmail)) {
      return {
        success: false,
        errorReason: 'Akun admin masuk lewat tombol "Masuk dengan Google", memakai password akun Gmail masing-masing.',
      };
    }
    loginInProgress.current = true;
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const res = await resolveSession(cred.user);
      if (res.session) {
        setSession(res.session);
        logAuthEvent({ uid: cred.user.uid, email: cleanEmail, name: res.session.name, role: res.session.role, event: 'login', method: 'password' });
        return { success: true, ...res.session };
      }
      if (res.unverifiedAdmin) {
        await sendEmailVerification(cred.user).catch(() => {});
      }
      await withTimeout(
        logAuthEvent({ uid: cred.user.uid, email: cleanEmail, role: 'unknown', event: 'login_failed', method: 'password', reason: res.error }),
        2000
      );
      await firebaseSignOut(auth).catch(() => {});
      return {
        success: false,
        unregistered: !res.unverifiedAdmin,
        errorReason: res.unverifiedAdmin
          ? `Email admin belum terverifikasi. Link verifikasi telah dikirim ke ${cleanEmail}, atau gunakan tombol "Masuk dengan Google".`
          : res.error,
      };
    } catch (e) {
      const code = (e as { code?: string })?.code || '';
      const reason =
        code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password'
          ? 'Email atau password salah. Jika akun baru dibuat, minta admin membuka panel admin sekali agar akun login aktif, lalu coba lagi.'
          : authErrorMessage(e);
      logAuthEvent({ email: cleanEmail, role: 'unknown', event: 'login_failed', method: 'password', reason });
      return { success: false, errorReason: reason };
    } finally {
      loginInProgress.current = false;
    }
  };

  const loginWithGoogle = async (emailHint?: string): Promise<LoginResult> => {
    loginInProgress.current = true;
    // login_hint: langsung arahkan ke akun Google yang emailnya diketik
    googleProvider.setCustomParameters(
      emailHint ? { prompt: 'select_account', login_hint: emailHint } : { prompt: 'select_account' }
    );
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const res = await resolveSession(cred.user);
      const gEmail = cred.user.email || '-';
      if (res.session) {
        setSession(res.session);
        logAuthEvent({ uid: cred.user.uid, email: gEmail, name: res.session.name, role: res.session.role, event: 'login', method: 'google' });
        return { success: true, ...res.session };
      }
      await withTimeout(
        logAuthEvent({
          uid: cred.user.uid,
          email: gEmail,
          name: cred.user.displayName || undefined,
          role: 'unknown',
          event: 'login_failed',
          method: 'google',
          reason: res.error,
        }),
        2000
      );
      await firebaseSignOut(auth).catch(() => {});
      return {
        success: false,
        unregistered: true,
        email: cred.user.email || undefined,
        name: cred.user.displayName || undefined,
        errorReason: res.error,
      };
    } catch (e: any) {
      const code = e?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return { success: false, errorReason: 'Login Google dibatalkan.' };
      }
      return {
        success: false,
        popupBlocked: code === 'auth/popup-blocked',
        errorReason:
          code === 'auth/popup-blocked'
            ? 'Popup login diblokir browser. Izinkan popup untuk situs ini lalu coba lagi.'
            : authErrorMessage(e),
      };
    } finally {
      loginInProgress.current = false;
    }
  };

  const doLogout = async (event: 'logout' | 'auto_logout') => {
    const u = auth.currentUser;
    const prev = session;
    authSeq.current++;
    setSession(GUEST);
    if (u && prev.role !== 'guest') {
      // Catat dulu selagi masih terautentikasi, baru keluar
      await withTimeout(
        Promise.all([
          logAuthEvent({ uid: u.uid, email: prev.email || u.email || '-', name: prev.name, role: prev.role, event }),
          writePresence(u.uid, prev, 'offline'),
        ]),
        2500
      );
    }
    await firebaseSignOut(auth).catch(() => {});
  };
  const logout = () => void doLogout('logout');

  // Auto-logout setelah 15 menit tanpa aktivitas
  useEffect(() => {
    if (role === 'guest') return;
    const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    const performAutoLogout = () => {
      void doLogout('auto_logout');
      setSessionTimeoutWarning(
        'Sesi Anda telah berakhir secara otomatis karena tidak ada respons / aktivitas selama 15 menit. Silakan login kembali.'
      );
    };
    const resetTimer = () => {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(performAutoLogout, INACTIVITY_TIMEOUT_MS);
    };
    let last = Date.now();
    const onActivity = () => {
      const now = Date.now();
      if (now - last > 1500) {
        last = now;
        resetTimer();
      }
    };
    const events: Array<keyof WindowEventMap> = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));
    resetTimer();
    return () => {
      if (timerId) clearTimeout(timerId);
      events.forEach((evt) => window.removeEventListener(evt, onActivity));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // ---------- Status online: sinyal aktif tiap 60 detik selama login ----------
  useEffect(() => {
    if (role === 'guest') return;
    const u = auth.currentUser;
    if (!u) return;
    const s = session;
    const beat = () => writePresence(u.uid, s, 'online');
    beat();
    const timer = setInterval(beat, 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') beat();
    };
    const onHide = () => {
      writePresence(u.uid, s, 'offline');
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pagehide', onHide);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pagehide', onHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, session.memberId, session.email]);

  // ---------- Listener data publik (semua pengunjung) ----------
  useEffect(() => {
    const listen = <T,>(path: string, apply: (items: T[]) => void) =>
      onSnapshot(
        collection(db, path),
        (snap) => {
          setIsFirebaseConnected(true);
          apply(snap.docs.map((d) => ({ ...(d.data() as object), id: (d.data() as any).id || d.id }) as T));
        },
        (err) => logFirestoreError(err, OperationType.LIST, path)
      );

    const unsubs = [
      onSnapshot(
        doc(db, 'clubSettings', 'main'),
        (snap) => {
          setIsFirebaseConnected(true);
          if (!snap.exists()) return;
          const data = (snap.data() || {}) as Partial<ClubSettings>;
          setSettings({
            ...DEFAULT_CLUB_SETTINGS,
            ...data,
            clubName: data.clubName || DEFAULT_CLUB_SETTINGS.clubName,
            slogan: data.slogan || DEFAULT_CLUB_SETTINGS.slogan,
            hookText: data.hookText || DEFAULT_CLUB_SETTINGS.hookText,
          });
        },
        (err) => {
          setIsFirebaseConnected(false);
          logFirestoreError(err, OperationType.GET, 'clubSettings/main');
        }
      ),
      listen<ScheduleSlot>('scheduleSlots', setScheduleSlots),
      listen<PricePackage>('pricePackages', (items) => setPricePackages(sanitizePackages(items))),
      listen<DocumentationItem>('documentation', setDocumentation),
      listen<TestimonialItem>('testimonials', setTestimonials),
      listen<SwimGearProduct>('swimGear', setSwimGear),
      listen<EvaluationCriterion>('evaluationCriteria', setEvaluationCriteria),
      onSnapshot(
        doc(db, 'publicStats', 'main'),
        (snap) => setPublicActiveCount(snap.exists() ? Number(snap.data()?.activeMembers || 0) : null),
        () => {}
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  // ---------- Listener data privat (sesuai peran) ----------
  useEffect(() => {
    // Bersihkan data sesi sebelumnya agar tidak bocor antar pengguna
    setMembers([]);
    setMemberAccounts([]);
    setScheduleRequests([]);
    setMemberReports([]);
    setClubInvoices([]);
    setLoginLogs([]);
    setPresence([]);
    setTestimonialSubmissions([]);
    setMembersLoaded(false);
    setAccountsLoaded(false);

    const mapDocs = <T,>(snap: { docs: { id: string; data: () => any }[] }) =>
      snap.docs.map((d) => ({ ...d.data(), id: d.data().id || d.id }) as T);
    const onErr = (path: string) => (err: unknown) => logFirestoreError(err, OperationType.LIST, path);

    // KETAT: Hanya lampirkan listener data privat jika autentikasi sudah siap dan pengguna terautentikasi (bukan tamu)
    if (!authReady || !auth.currentUser || role === 'guest') {
      return undefined;
    }

    if (role === 'admin') {
      const unsubs = [
        onSnapshot(
          collection(db, 'members'),
          (s) => {
            setMembers(mapDocs<Member>(s).sort((a, b) => (a.id > b.id ? 1 : -1)));
            setMembersLoaded(true);
          },
          onErr('members')
        ),
        onSnapshot(
          collection(db, 'memberAccounts'),
          (s) => {
            setMemberAccounts(mapDocs<MemberAccount>(s));
            setAccountsLoaded(true);
          },
          onErr('memberAccounts')
        ),
        onSnapshot(
          collection(db, 'scheduleRequests'),
          (s) => setScheduleRequests(mapDocs<ScheduleRequest>(s).map(normalizeRequest)),
          onErr('scheduleRequests')
        ),
        onSnapshot(collection(db, 'memberReports'), (s) => setMemberReports(mapDocs<MemberReport>(s)), onErr('memberReports')),
        onSnapshot(collection(db, 'clubInvoices'), (s) => setClubInvoices(mapDocs<ClubInvoice>(s)), onErr('clubInvoices')),
        onSnapshot(
          query(collection(db, 'loginLogs'), orderBy('createdAt', 'desc'), limit(500)),
          (s) =>
            setLoginLogs(
              s.docs.map((d) => {
                const x = d.data({ serverTimestamps: 'estimate' }) as any;
                return { ...x, id: d.id, createdAtMs: x.createdAt?.toMillis?.() ?? Date.now() } as LoginLog;
              })
            ),
          onErr('loginLogs')
        ),
        onSnapshot(
          collection(db, 'testimonialSubmissions'),
          (s) =>
            setTestimonialSubmissions(
              s.docs
                .map((d) => {
                  const x = d.data({ serverTimestamps: 'estimate' }) as any;
                  return { ...x, id: d.id, createdAtMs: x.createdAt?.toMillis?.() ?? Date.now() } as TestimonialSubmission;
                })
                .sort((a, b) => b.createdAtMs - a.createdAtMs)
            ),
          onErr('testimonialSubmissions')
        ),
        onSnapshot(
          collection(db, 'presence'),
          (s) =>
            setPresence(
              s.docs.map((d) => {
                const x = d.data({ serverTimestamps: 'estimate' }) as any;
                return { ...x, uid: d.id, lastSeenMs: x.lastSeen?.toMillis?.() ?? 0 } as PresenceRecord;
              })
            ),
          onErr('presence')
        ),
      ];
      return () => unsubs.forEach((u) => u());
    }

    if (role === 'member' && session.memberId) {
      const mid = session.memberId;
      const unsubs = [
        onSnapshot(
          doc(db, 'members', mid),
          (s) => {
            setMembers(s.exists() ? [{ ...(s.data() as Member), id: mid }] : []);
            setMembersLoaded(true);
          },
          onErr(`members/${mid}`)
        ),
        onSnapshot(
          query(collection(db, 'scheduleRequests'), where('memberId', '==', mid)),
          (s) => setScheduleRequests(mapDocs<ScheduleRequest>(s).map(normalizeRequest)),
          onErr('scheduleRequests')
        ),
        onSnapshot(
          query(collection(db, 'memberReports'), where('memberId', '==', mid)),
          (s) => setMemberReports(mapDocs<MemberReport>(s)),
          onErr('memberReports')
        ),
      ];
      return () => unsubs.forEach((u) => u());
    }
    return undefined;
  }, [authReady, role, session.memberId, auth.currentUser?.uid]);

  // ---------- Admin: isi data katalog awal sekali saja jika Firestore masih kosong ----------
  useEffect(() => {
    if (!isAdmin || seededRef.current) return;
    seededRef.current = true;
    (async () => {
      const metaRef = doc(db, 'appMeta', 'seed');
      const meta = ((await getDoc(metaRef)).data() || {}) as Record<string, boolean>;
      const marks: Record<string, boolean> = {};

      if (!meta.clubSettings) {
        const s = await getDoc(doc(db, 'clubSettings', 'main'));
        if (!s.exists()) await setDoc(doc(db, 'clubSettings', 'main'), DEFAULT_CLUB_SETTINGS);
        marks.clubSettings = true;
      }
      const catalogs: [string, { id: string }[]][] = [
        ['scheduleSlots', DEFAULT_SCHEDULE_SLOTS],
        ['pricePackages', DEFAULT_PRICE_PACKAGES],
        ['documentation', DEFAULT_DOCUMENTATION],
        ['testimonials', DEFAULT_TESTIMONIALS],
        ['swimGear', DEFAULT_SWIM_GEAR],
        ['evaluationCriteria', DEFAULT_EVALUATION_CRITERIA],
      ];
      for (const [name, items] of catalogs) {
        if (meta[name]) continue;
        const snap = await getDocs(collection(db, name));
        if (snap.empty) {
          const batch = writeBatch(db);
          items.forEach((it) => batch.set(doc(db, name, it.id), it));
          await batch.commit();
        } else if (name === 'pricePackages') {
          // Migrasi harga format lama → format standar
          const batch = writeBatch(db);
          let changed = false;
          snap.docs.forEach((d) => {
            const pkg = d.data() as PricePackage;
            const def = DEFAULT_PRICE_PACKAGES.find((dp) => dp.id === pkg.id);
            if (def && hasLegacyPricing(pkg)) {
              batch.set(d.ref, def);
              changed = true;
            }
          });
          if (changed) await batch.commit();
        }
        marks[name] = true;
      }
      if (Object.keys(marks).length) await setDoc(metaRef, marks, { merge: true });
    })().catch((e) => {
      seededRef.current = false;
      logFirestoreError(e, OperationType.WRITE, 'appMeta/seed');
    });
  }, [isAdmin]);

  // ---------- Admin: statistik publik (jumlah member aktif untuk Hero) ----------
  const adminActiveCount = useMemo(() => members.filter((m) => m && m.status === 'Aktif').length, [members]);
  useEffect(() => {
    if (!isAdmin || !membersLoaded || publicActiveCount === adminActiveCount) return;
    write(
      setDoc(doc(db, 'publicStats', 'main'), { activeMembers: adminActiveCount, updatedAt: new Date().toISOString() }),
      OperationType.WRITE,
      'publicStats/main'
    );
  }, [isAdmin, membersLoaded, adminActiveCount, publicActiveCount]);

  // ---------- Admin: sinkronkan akun member ke Firebase Auth ----------
  const resolveMemberId = (acc: MemberAccount) =>
    acc.memberId ||
    members.find((m) => m.email && m.email.trim().toLowerCase() === acc.email.trim().toLowerCase())?.id ||
    '';

  useEffect(() => {
    if (!isAdmin || !accountsLoaded || !membersLoaded) return;
    const emailCount: Record<string, number> = {};
    memberAccounts.forEach((a) => {
      const e = (a.email || '').trim().toLowerCase();
      emailCount[e] = (emailCount[e] || 0) + 1;
    });
    memberAccounts.forEach((acc) => {
      if (acc.authUid || acc.authSyncError || syncingRef.current.has(acc.id)) return;
      const email = (acc.email || '').trim().toLowerCase();
      const flag = (msg: string) =>
        write(setDoc(doc(db, 'memberAccounts', acc.id), { authSyncError: msg }, { merge: true }), OperationType.UPDATE, `memberAccounts/${acc.id}`);
      if (!email || !acc.password) return void flag('Email/password akun kosong.');
      if (ADMIN_EMAILS.includes(email)) return void flag('Email admin tidak boleh dipakai sebagai akun member.');
      if (emailCount[email] > 1) return void flag('Email ini dipakai lebih dari satu akun member.');
      if (acc.password.length < 6) return void flag('Password minimal 6 karakter. Ubah password akun ini.');
      syncingRef.current.add(acc.id);
      syncAccountToAuth(acc, resolveMemberId(acc)).finally(() => syncingRef.current.delete(acc.id));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, accountsLoaded, membersLoaded, memberAccounts]);

  // ---------- Sesi yang diekspos ke komponen ----------
  const currentUser: UserSession = useMemo(() => {
    if (session.role === 'admin') return { ...session, whatsapp: settings.phoneWa };
    if (session.role === 'member') {
      const me = members.find((m) => m.id === session.memberId);
      return { ...session, name: me?.fullName || session.name, whatsapp: me?.whatsapp || session.whatsapp };
    }
    return session;
  }, [session, settings.phoneWa, members]);

  const activeMembersCount = isAdmin ? adminActiveCount : publicActiveCount ?? 0;

  // ================= ACTIONS (tulis ke Firestore; UI diperbarui oleh listener) =================
  const updateSettings = (newSettings: Partial<ClubSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    write(setDoc(doc(db, 'clubSettings', 'main'), newSettings, { merge: true }), OperationType.WRITE, 'clubSettings/main');
  };

  // --- Members ---
  const addMember = (data: Omit<Member, 'id' | 'attendanceCount' | 'registrationDate'>): Member => {
    const newId = isAdmin ? nextSeqId('MEM', members.map((m) => m.id)) : uniqueId('MEM');
    const newMember: Member = {
      ...data,
      id: newId,
      status: isAdmin ? data.status || 'Verifikasi' : 'Verifikasi',
      registrationDate: new Date().toISOString().split('T')[0],
      attendedSessions: 0,
    } as Member;

    const batch = writeBatch(db);
    batch.set(doc(db, 'members', newId), newMember);

    if (data.preferredDay && data.preferredTime) {
      const reqId = `REQ-${Date.now()}`;
      batch.set(doc(db, 'scheduleRequests', reqId), {
        id: reqId,
        memberId: newId,
        memberName: data.fullName,
        whatsapp: data.whatsapp,
        day: data.preferredDay,
        timeRange: data.preferredTime,
        location: data.location || 'Kolam Renang Lestarindo',
        packageId: data.selectedPackageId,
        status: 'Pending',
        createdAt: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
      } as ScheduleRequest);
    }

    // Akun login member otomatis (password default renang123); disinkronkan ke Firebase Auth oleh admin
    const cleanEmail = (data.email || '').trim().toLowerCase();
    if (cleanEmail && !ADMIN_EMAILS.includes(cleanEmail)) {
      const exists = memberAccounts.some((a) => a.email.toLowerCase() === cleanEmail);
      if (!exists) {
        const accId = isAdmin ? nextSeqId('ACC', memberAccounts.map((a) => a.id)) : uniqueId('ACC');
        batch.set(doc(db, 'memberAccounts', accId), {
          id: accId,
          memberId: newId,
          fullName: data.fullName,
          email: cleanEmail,
          password: 'renang123',
          whatsapp: data.whatsapp,
          status: 'Aktif',
          createdAt: new Date().toISOString().split('T')[0],
          notes: 'Akun otomatis dibuat dari pendaftaran member',
        } as MemberAccount);
      }
    }

    write(batch.commit(), OperationType.CREATE, `members/${newId}`);
    return newMember;
  };

  const updateMember = (id: string, fields: Partial<Member>) => {
    write(setDoc(doc(db, 'members', id), fields, { merge: true }), OperationType.UPDATE, `members/${id}`);

    if (fields.fullName || fields.email || fields.whatsapp) {
      memberAccounts
        .filter((acc) => acc.memberId === id)
        .forEach((acc) => {
          const next: MemberAccount = {
            ...acc,
            ...(fields.fullName ? { fullName: fields.fullName } : {}),
            ...(fields.email ? { email: fields.email.trim().toLowerCase() } : {}),
            ...(fields.whatsapp ? { whatsapp: fields.whatsapp } : {}),
          };
          applyAccountChange(acc, next, id);
        });
    }
  };

  /** Impor banyak member (CSV). Cocok nama/ID yang sudah ada → diperbarui, sisanya dibuat baru. */
  const importMembers: AppContextType['importMembers'] = async (rows, defaults) => {
    const byId = new Map(members.map((m) => [m.id, m]));
    const byName = new Map(members.map((m) => [(m.fullName || '').trim().toLowerCase(), m]));
    const today = new Date().toISOString().split('T')[0];
    let created = 0;
    let updated = 0;
    const writes: Array<[string, Record<string, unknown>, boolean]> = [];
    rows.forEach((r) => {
      const existing = (r.id && byId.get(r.id)) || byName.get(r.fullName.trim().toLowerCase());
      const contact = {
        fullName: r.fullName,
        ...(r.parentName ? { parentName: r.parentName } : {}),
        ...(r.whatsapp ? { whatsapp: r.whatsapp } : {}),
        ...(r.address ? { address: r.address } : {}),
      };
      if (existing) {
        writes.push([existing.id, contact, true]);
        updated++;
      } else {
        const id = r.id || nextSeqId('MEM', [...members.map((m) => m.id), ...writes.map((w) => w[0])]);
        writes.push([
          id,
          {
            id,
            fullName: r.fullName,
            parentName: r.parentName,
            whatsapp: r.whatsapp,
            address: r.address,
            email: '',
            ageOrDob: '',
            gender: '',
            school: '',
            currentLevel: 'Pemula',
            goal: '',
            preferredDay: '',
            preferredTime: '',
            location: defaults.location,
            specialConditions: '',
            selectedPackageId: defaults.selectedPackageId,
            status: defaults.status,
            registrationDate: today,
            totalSessionsAllowed: defaults.totalSessionsAllowed,
            attendedSessions: 0,
            source: 'manual_admin',
            notes: 'Diimpor dari file CSV',
          },
          false,
        ]);
        created++;
      }
    });
    for (let i = 0; i < writes.length; i += 450) {
      const batch = writeBatch(db);
      writes.slice(i, i + 450).forEach(([id, data, merge]) =>
        merge ? batch.set(doc(db, 'members', id), data, { merge: true }) : batch.set(doc(db, 'members', id), data)
      );
      await batch.commit();
    }
    return { created, updated };
  };

  const deleteMember = (id: string) => {
    write(deleteDoc(doc(db, 'members', id)), OperationType.DELETE, `members/${id}`);
  };

  // --- Member accounts ---
  const addMemberAccount = (account: Omit<MemberAccount, 'id' | 'createdAt'> & { id?: string }): MemberAccount => {
    const newAcc: MemberAccount = {
      id: account.id || nextSeqId('ACC', memberAccounts.map((a) => a.id)),
      memberId: account.memberId || '',
      fullName: account.fullName,
      email: account.email.trim().toLowerCase(),
      password: account.password || 'renang123',
      whatsapp: account.whatsapp || '',
      status: account.status || 'Aktif',
      createdAt: new Date().toISOString().split('T')[0],
      notes: account.notes || '',
    };
    write(setDoc(doc(db, 'memberAccounts', newAcc.id), newAcc), OperationType.CREATE, `memberAccounts/${newAcc.id}`);
    return newAcc;
  };

  const updateMemberAccount = (id: string, updates: Partial<MemberAccount>) => {
    const prev = memberAccounts.find((a) => a.id === id);
    if (!prev) return;
    const next: MemberAccount = {
      ...prev,
      ...updates,
      memberId: 'memberId' in updates ? updates.memberId || '' : prev.memberId || '',
      email: (updates.email ?? prev.email).trim().toLowerCase(),
    };
    applyAccountChange(prev, next, resolveMemberId(next)).catch((e) =>
      logFirestoreError(e, OperationType.UPDATE, `memberAccounts/${id}`)
    );
  };

  const deleteMemberAccount = (id: string) => {
    const prev = memberAccounts.find((a) => a.id === id);
    if (!prev) return;
    removeAccount(prev).catch((e) => logFirestoreError(e, OperationType.DELETE, `memberAccounts/${id}`));
  };

  // --- Schedule slots ---
  const updateScheduleSlot = (id: string, updated: Partial<ScheduleSlot>) => {
    write(setDoc(doc(db, 'scheduleSlots', id), updated, { merge: true }), OperationType.UPDATE, `scheduleSlots/${id}`);
  };

  const toggleSlotAttendance = (id: string) => {
    const slot = scheduleSlots.find((s) => s.id === id);
    if (slot) updateScheduleSlot(id, { status: slot.status === 'hadir' ? 'tersedia' : 'hadir' });
  };

  const toggleSlotOff = (id: string) => {
    const slot = scheduleSlots.find((s) => s.id === id);
    if (slot) updateScheduleSlot(id, { status: slot.status === 'off' ? 'tersedia' : 'off' });
  };

  const setSlotStatus = (id: string, status: 'tersedia' | 'hadir' | 'off') => updateScheduleSlot(id, { status });

  const addScheduleSlot = (slotData: Omit<ScheduleSlot, 'id'>): ScheduleSlot => {
    const newSlot: ScheduleSlot = { ...slotData, id: `slot-manual-${Date.now()}` };
    write(setDoc(doc(db, 'scheduleSlots', newSlot.id), newSlot), OperationType.CREATE, `scheduleSlots/${newSlot.id}`);
    return newSlot;
  };

  /** Impor jadwal mingguan sekaligus. replace = hapus semua slot lama dulu. */
  const importScheduleSlots = async (slots: ScheduleSlot[], mode: 'replace' | 'merge') => {
    const ops: Array<(b: ReturnType<typeof writeBatch>) => void> = [];
    if (mode === 'replace') {
      const keep = new Set(slots.map((x) => x.id));
      scheduleSlots.filter((x) => !keep.has(x.id)).forEach((x) => ops.push((b) => b.delete(doc(db, 'scheduleSlots', x.id))));
    }
    slots.forEach((x) => ops.push((b) => b.set(doc(db, 'scheduleSlots', x.id), x)));
    // Batas Firestore 500 operasi per batch
    for (let i = 0; i < ops.length; i += 450) {
      const batch = writeBatch(db);
      ops.slice(i, i + 450).forEach((fn) => fn(batch));
      await batch.commit();
    }
  };

  const deleteScheduleSlot = (id: string) => {
    write(deleteDoc(doc(db, 'scheduleSlots', id)), OperationType.DELETE, `scheduleSlots/${id}`);
  };

  // --- Schedule requests ---
  const addScheduleRequest: AppContextType['addScheduleRequest'] = (req) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const newReq: ScheduleRequest = {
      ...req,
      id: `REQ-${Date.now()}`,
      status: 'pending',
      requestDate: formattedDate,
      createdAt: `${formattedDate}, ${formattedTime}`,
    };
    write(setDoc(doc(db, 'scheduleRequests', newReq.id), newReq), OperationType.CREATE, `scheduleRequests/${newReq.id}`);
    return newReq;
  };

  const updateScheduleRequestStatus = (id: string, status: RequestStatus, coachNote?: string) => {
    const raw = String(status || '').toLowerCase();
    const isApproved = raw === 'disetujui' || raw === 'approved';
    const isRejected = raw === 'ditolak' || raw === 'rejected';
    const isAturUlang = raw === 'atur_ulang' || raw === 'atur ulang';
    const normalizedStatus: RequestStatus = isApproved
      ? 'Disetujui'
      : isRejected
      ? 'Ditolak'
      : isAturUlang
      ? 'Atur Ulang'
      : 'Pending';

    const target = scheduleRequests.find((r) => r.id === id);
    const batch = writeBatch(db);
    batch.set(
      doc(db, 'scheduleRequests', id),
      {
        status: normalizedStatus,
        ...(coachNote !== undefined ? { coachNote, adminNotes: coachNote } : {}),
      },
      { merge: true }
    );

    if (target) {
      const { memberId } = target;
      const memberName = target.memberName || '';
      const isPendingMember = (st?: string) => st === 'Verifikasi' || st === 'Pending';
      // Member terkait: utamakan memberId, fallback ke nama (data lama)
      const linkedMembers = members.filter((m) =>
        memberId
          ? m.id === memberId
          : !!memberName && (m.fullName || '').trim().toLowerCase() === memberName.trim().toLowerCase()
      );
      if (isApproved) {
        // Disetujui → jadwal member diperbarui & pendaftar baru otomatis Aktif
        linkedMembers.forEach((m) =>
          batch.set(
            doc(db, 'members', m.id),
            {
              preferredDay: target.day,
              preferredTime: target.timeRange,
              location: target.location,
              ...(isPendingMember(m.status) ? { status: 'Aktif' } : {}),
            },
            { merge: true }
          )
        );

        // Cocokkan hari, jam, DAN kolam (Lestarindo / Front One) agar tidak tercampur
        const poolKey = (loc?: string) => {
          const l = (loc || '').toLowerCase();
          return l.includes('front') ? 'front' : l.includes('lestarindo') ? 'lestarindo' : l.trim();
        };
        const sameTime = scheduleSlots.filter((s) => s.day === target.day && s.timeRange === target.timeRange);
        const slot =
          sameTime.find((s) => poolKey(s.location) === poolKey(target.location)) ||
          (target.location ? sameTime.find((s) => !s.location) : sameTime[0]);
        if (slot) {
          const cleanParts = (slot.participants || []).filter((p) => p !== 'OFF');
          if (!cleanParts.includes(memberName)) {
            batch.set(
              doc(db, 'scheduleSlots', slot.id),
              {
                status: slot.status === 'off' ? 'tersedia' : slot.status,
                participants: [...cleanParts, memberName],
                location: target.location || slot.location,
              },
              { merge: true }
            );
          }
        } else {
          const newSlot: ScheduleSlot = {
            id: `slot-${Date.now()}`,
            day: target.day,
            timeRange: target.timeRange,
            coach: 'C. Dewi',
            status: 'tersedia',
            participants: [memberName],
            location: target.location,
          };
          batch.set(doc(db, 'scheduleSlots', newSlot.id), newSlot);
        }
      } else if (isRejected || isAturUlang) {
        // Ditolak → pendaftar baru (masih Verifikasi) ikut berstatus Ditolak
        if (isRejected) {
          linkedMembers
            .filter((m) => isPendingMember(m.status))
            .forEach((m) => batch.set(doc(db, 'members', m.id), { status: 'Ditolak' }, { merge: true }));
        }
        scheduleSlots
          .filter((s) => (s.participants || []).includes(memberName))
          .forEach((s) =>
            batch.set(
              doc(db, 'scheduleSlots', s.id),
              { participants: s.participants.filter((p) => p !== memberName) },
              { merge: true }
            )
          );
      }
    }
    write(batch.commit(), OperationType.UPDATE, `scheduleRequests/${id}`);
  };

  const reviewScheduleRequest = (id: string, status: any, coachNote?: string) =>
    updateScheduleRequestStatus(id, status, coachNote);

  const deleteScheduleRequest = (id: string) => {
    write(deleteDoc(doc(db, 'scheduleRequests', id)), OperationType.DELETE, `scheduleRequests/${id}`);
  };

  const markAttendance = (requestIdOrMemberId: string, memberId?: string) => {
    const req = scheduleRequests.find((r) => r.id === requestIdOrMemberId);

    // Absen mandiri member: wajib terikat ke 1 pengajuan jadwal disetujui yang belum diabsen,
    // ditulis dalam satu batch agar bisa divalidasi Firestore Rules (anti manipulasi kuota).
    if (role === 'member') {
      const me = members.find((x) => x.id === session.memberId);
      if (!req || !me || req.memberId !== me.id || req.attended) return;
      const batch = writeBatch(db);
      batch.update(doc(db, 'scheduleRequests', req.id), { attended: true });
      const current = me.attendedSessions || 0;
      if (current < (me.totalSessionsAllowed || 0)) {
        batch.update(doc(db, 'members', me.id), { attendedSessions: current + 1, lastAttendanceRequestId: req.id });
      }
      write(batch.commit(), OperationType.UPDATE, `scheduleRequests/${req.id}`);
      scheduleSlots
        .filter((s) => s.day === req.day && s.timeRange === req.timeRange && s.status === 'tersedia')
        .forEach((s) =>
          write(updateDoc(doc(db, 'scheduleSlots', s.id), { status: 'hadir' }), OperationType.UPDATE, `scheduleSlots/${s.id}`)
        );
      return;
    }

    const targetMemberId = memberId || req?.memberId || requestIdOrMemberId;
    const m = members.find((x) => x.id === targetMemberId);
    if (m) {
      const current = m.attendedSessions || 0;
      const max = typeof m.totalSessionsAllowed === 'number' ? m.totalSessionsAllowed : Infinity;
      const next = Math.min(current + 1, max);
      if (next !== current) {
        write(updateDoc(doc(db, 'members', m.id), { attendedSessions: next }), OperationType.UPDATE, `members/${m.id}`);
      }
    }
    if (req) {
      if (!req.attended) {
        write(updateDoc(doc(db, 'scheduleRequests', req.id), { attended: true }), OperationType.UPDATE, `scheduleRequests/${req.id}`);
      }
      scheduleSlots
        .filter((s) => s.day === req.day && s.timeRange === req.timeRange && s.status !== 'hadir')
        .forEach((s) =>
          write(updateDoc(doc(db, 'scheduleSlots', s.id), { status: 'hadir' }), OperationType.UPDATE, `scheduleSlots/${s.id}`)
        );
    }
  };

  const attendanceRecords: AttendanceRecord[] = members.map((m) => ({
    id: `att-${m.id}`,
    memberId: m.id,
    memberName: m.fullName,
    date: new Date().toISOString().split('T')[0],
    timeRange: m.preferredTime,
    day: m.preferredDay,
    location: m.location,
    coach: 'C. Dewi',
    status: (m.attendedSessions || 0) > 0 ? 'Hadir' : 'Alpha',
    notes: `${m.attendedSessions || 0} dari ${m.totalSessionsAllowed} sesi terlaksana`,
  }));

  // --- Generic CRUD untuk koleksi katalog ---
  function crud<T extends { id: string }>(path: string, prefix: string) {
    return {
      add: (item: Omit<T, 'id'>): T => {
        const created = { ...item, id: `${prefix}-${Date.now()}` } as T;
        write(setDoc(doc(db, path, created.id), created), OperationType.CREATE, `${path}/${created.id}`);
        return created;
      },
      update: (id: string, updated: Partial<T>) =>
        write(setDoc(doc(db, path, id), updated, { merge: true }), OperationType.UPDATE, `${path}/${id}`),
      remove: (id: string) => write(deleteDoc(doc(db, path, id)), OperationType.DELETE, `${path}/${id}`),
    };
  }

  const pkgCrud = crud<PricePackage>('pricePackages', 'pkg');
  const docCrud = crud<DocumentationItem>('documentation', 'doc');
  const testiCrud = crud<TestimonialItem>('testimonials', 'testi');
  const gearCrud = crud<SwimGearProduct>('swimGear', 'gear');
  const critCrud = crud<EvaluationCriterion>('evaluationCriteria', 'crit');
  const reportCrud = crud<MemberReport>('memberReports', 'REP');

  // --- Testimoni dari formulir publik (menunggu persetujuan admin) ---
  const submitTestimonial: AppContextType['submitTestimonial'] = async (data) => {
    const id = uniqueId('TSUB');
    await setDoc(doc(db, 'testimonialSubmissions', id), {
      id,
      name: data.name.trim().slice(0, 80),
      role: data.role.trim().slice(0, 80),
      quote: data.quote.trim().slice(0, 600),
      rating: Math.min(5, Math.max(1, Math.round(data.rating))),
      createdAt: serverTimestamp(),
    });
  };

  const approveTestimonialSubmission = async (sub: TestimonialSubmission) => {
    const id = `testi-${Date.now()}`;
    const batch = writeBatch(db);
    batch.set(doc(db, 'testimonials', id), { id, name: sub.name, role: sub.role, quote: sub.quote, rating: sub.rating });
    batch.delete(doc(db, 'testimonialSubmissions', sub.id));
    await batch.commit();
  };

  const deleteTestimonialSubmission = (id: string) =>
    void write(deleteDoc(doc(db, 'testimonialSubmissions', id)), OperationType.DELETE, `testimonialSubmissions/${id}`);

  // --- Invoices ---
  const addClubInvoice = (inv: Omit<ClubInvoice, 'id' | 'formattedAmount'>): ClubInvoice => {
    const id = nextSeqId('INV', clubInvoices.map((i) => i.id));
    const newInvoice: ClubInvoice = {
      ...inv,
      id,
      formattedAmount: `Rp ${Number(inv.amount || 0).toLocaleString('id-ID')}`,
    };
    write(setDoc(doc(db, 'clubInvoices', id), newInvoice), OperationType.CREATE, `clubInvoices/${id}`);
    return newInvoice;
  };

  const updateClubInvoice = (id: string, updates: Partial<ClubInvoice>) => {
    const formatted = {
      ...updates,
      ...(updates.amount !== undefined ? { formattedAmount: `Rp ${Number(updates.amount).toLocaleString('id-ID')}` } : {}),
    };
    write(setDoc(doc(db, 'clubInvoices', id), formatted, { merge: true }), OperationType.UPDATE, `clubInvoices/${id}`);
  };

  const deleteClubInvoice = (id: string) => {
    write(deleteDoc(doc(db, 'clubInvoices', id)), OperationType.DELETE, `clubInvoices/${id}`);
  };

  /** Hapus banyak invoice sekaligus (fitur Reset Keuangan). */
  const resetClubInvoices = async (ids: string[]) => {
    for (let i = 0; i < ids.length; i += 450) {
      const batch = writeBatch(db);
      ids.slice(i, i + 450).forEach((id) => batch.delete(doc(db, 'clubInvoices', id)));
      await batch.commit();
    }
  };

  const recordInvoicePayment = (id: string, paymentMethod: string, customReceiptNumber?: string) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const receiptNumber = customReceiptNumber || `KW-DSA-${dateStr}-${id.replace('INV-', '')}`;
    const paidAt =
      now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) +
      ' WIB';
    write(
      setDoc(doc(db, 'clubInvoices', id), { status: 'Lunas', paymentMethod, paidAt, receiptNumber }, { merge: true }),
      OperationType.UPDATE,
      `clubInvoices/${id}`
    );
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        currentUser,
        authReady,
        loginWithEmail,
        loginWithGoogle,
        logout,
        sessionTimeoutWarning,
        clearSessionTimeoutWarning,
        members,
        activeMembersCount,
        addMember,
        updateMember,
        deleteMember,
        importMembers,
        memberAccounts,
        addMemberAccount,
        updateMemberAccount,
        deleteMemberAccount,
        scheduleSlots,
        addScheduleSlot,
        deleteScheduleSlot,
        updateScheduleSlot,
        toggleSlotAttendance,
        toggleSlotOff,
        setSlotStatus,
        importScheduleSlots,
        scheduleRequests,
        addScheduleRequest,
        updateScheduleRequestStatus,
        reviewScheduleRequest,
        deleteScheduleRequest,
        markAttendance,
        attendanceRecords,
        pricePackages,
        addPricePackage: (p) => void pkgCrud.add(p),
        updatePricePackage: pkgCrud.update,
        deletePricePackage: pkgCrud.remove,
        documentation,
        addDocumentation: (d) => void docCrud.add(d),
        updateDocumentation: docCrud.update,
        deleteDocumentation: docCrud.remove,
        testimonials,
        addTestimonial: (t) => void testiCrud.add(t),
        updateTestimonial: testiCrud.update,
        deleteTestimonial: testiCrud.remove,
        submitTestimonial,
        testimonialSubmissions,
        approveTestimonialSubmission,
        deleteTestimonialSubmission,
        swimGear,
        addSwimGear: (g) => void gearCrud.add(g),
        updateSwimGear: gearCrud.update,
        deleteSwimGear: gearCrud.remove,
        evaluationCriteria,
        addEvaluationCriterion: (c) => void critCrud.add(c),
        updateEvaluationCriterion: critCrud.update,
        deleteEvaluationCriterion: critCrud.remove,
        memberReports,
        addMemberReport: reportCrud.add,
        updateMemberReport: reportCrud.update,
        deleteMemberReport: reportCrud.remove,
        clubInvoices,
        addClubInvoice,
        updateClubInvoice,
        deleteClubInvoice,
        recordInvoicePayment,
        resetClubInvoices,
        isFirebaseConnected,
        loginLogs,
        presence,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
