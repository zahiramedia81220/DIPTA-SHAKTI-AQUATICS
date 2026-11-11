import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  browserSessionPersistence,
  setPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
  deleteUser,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  Auth,
  User,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  doc,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  writeBatch,
  addDoc,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import firebaseConfig from '../firebase-applet-config.json';

// 1. Firebase App (satu-satunya backend data aplikasi)
const app = getApps().some((a) => a.name === '[DEFAULT]') ? getApp() : initializeApp(firebaseConfig);

// 1b. App Check (reCAPTCHA v3) — memblokir bot/skrip yang menembak Firestore langsung.
//     Isi site key di VITE_RECAPTCHA_SITE_KEY (env) atau "recaptchaSiteKey" di firebase-applet-config.json.
const recaptchaSiteKey = (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined) || firebaseConfig.recaptchaSiteKey;
if (typeof window !== 'undefined' && recaptchaSiteKey) {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    // Mode pengembangan: token debug dicetak di console, daftarkan di Firebase Console → App Check
    (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    console.warn('App Check tidak aktif:', err);
  }
}

if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported && firebaseConfig.measurementId) {
        try {
          getAnalytics(app);
        } catch {
          /* analytics opsional */
        }
      }
    })
    .catch(() => {});
}

// 2. Firestore — tanpa cache lokal (memory only) & abaikan field undefined
//    (sebelumnya setDoc gagal diam-diam jika ada field bernilai undefined)
const configWithDb = firebaseConfig as typeof firebaseConfig & { firestoreDatabaseId?: string };
const dbId =
  configWithDb.firestoreDatabaseId && configWithDb.firestoreDatabaseId !== '(default)'
    ? configWithDb.firestoreDatabaseId
    : undefined;

function createDb(): Firestore {
  try {
    return dbId
      ? initializeFirestore(app, { ignoreUndefinedProperties: true }, dbId)
      : initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    // Sudah diinisialisasi (HMR)
    return dbId ? getFirestore(app, dbId) : getFirestore(app);
  }
}
export const db = createDb();

// 3. Firebase Auth — sesi login dikelola Firebase (berakhir saat tab ditutup)
export const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence).catch(() => {});
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// 4. Auth sekunder (in-memory) untuk admin mengelola akun login member
//    tanpa mengganggu sesi admin yang sedang aktif.
//    'workspace' dipakai khusus untuk token Google Sheets/Drive.
const isolatedAuths: Record<string, Auth> = {};
export function getIsolatedAuth(name: 'member-admin' | 'workspace'): Auth {
  if (!isolatedAuths[name]) {
    const secApp: FirebaseApp = getApps().find((a) => a.name === name) || initializeApp(firebaseConfig, name);
    try {
      // popupRedirectResolver wajib untuk signInWithPopup (tanpa ini → auth/argument-error)
      isolatedAuths[name] = initializeAuth(secApp, {
        persistence: inMemoryPersistence,
        popupRedirectResolver: browserPopupRedirectResolver,
      });
    } catch {
      isolatedAuths[name] = getAuth(secApp);
    }
  }
  return isolatedAuths[name];
}

// 5. Error helper
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function logFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  // Log dengan format bersih tanpa crash unhandled exception
  console.warn(`[Firestore ${operationType.toUpperCase()}] ${path || 'unknown'}:`, errMsg);
}

export {
  app,
  firebaseConfig,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
  deleteUser,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  writeBatch,
  addDoc,
  orderBy,
  limit,
  serverTimestamp,
};
export type { User };
