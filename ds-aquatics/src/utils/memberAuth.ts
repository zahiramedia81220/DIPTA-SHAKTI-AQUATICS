/**
 * Sinkronisasi akun login member (koleksi `memberAccounts`) ke Firebase Auth.
 *
 * - Semua operasi berjalan di instance Auth terisolasi (in-memory), sehingga
 *   sesi admin yang sedang login tidak terganggu.
 * - Setelah berhasil, dokumen `memberAuth/{uid}` ditulis. Dokumen inilah yang
 *   dipakai Firestore Rules & aplikasi untuk mengenali member yang login.
 * - Operasi diantrikan (serial) karena memakai satu instance Auth sekunder.
 */
import {
  Auth,
} from 'firebase/auth';
import {
  db,
  getIsolatedAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
  deleteUser,
  signOut,
  doc,
  setDoc,
  writeBatch,
} from '../firebase';
import { MemberAccount } from '../types';

export interface MemberAuthDoc {
  uid: string;
  email: string;
  memberId: string;
  accountId: string;
  fullName: string;
  status: 'Aktif' | 'Nonaktif';
}

let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/weak-password':
      return 'Password minimal 6 karakter.';
    case 'auth/invalid-email':
      return 'Format email tidak valid.';
    case 'auth/email-already-in-use':
      return 'Email sudah dipakai akun lain di Firebase Auth.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email atau password salah.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.';
    case 'auth/operation-not-allowed':
      return 'Metode login Email/Password belum diaktifkan di Firebase Console.';
    case 'auth/unauthorized-domain':
      return 'Domain ini belum diizinkan. Tambahkan domain website/preview ke Firebase Console → Authentication → Settings → Authorized domains.';
    case 'auth/internal-error':
    case 'auth/network-request-failed':
      return 'Gagal terhubung ke server login Google/Firebase. Periksa koneksi internet lalu coba lagi.';
    default:
      return (err as Error)?.message || 'Terjadi kesalahan autentikasi.';
  }
}

async function withSecondary<T>(fn: (a: Auth) => Promise<T>): Promise<T> {
  const a = getIsolatedAuth('member-admin');
  try {
    return await fn(a);
  } finally {
    await signOut(a).catch(() => {});
  }
}

/** Buat user Auth baru, atau klaim user lama jika password-nya cocok. */
async function createOrClaim(a: Auth, email: string, password: string): Promise<string> {
  try {
    const cred = await createUserWithEmailAndPassword(a, email, password);
    return cred.user.uid;
  } catch (e) {
    if ((e as { code?: string })?.code === 'auth/email-already-in-use') {
      try {
        const cred = await signInWithEmailAndPassword(a, email, password);
        return cred.user.uid;
      } catch {
        throw new Error(
          'Email ini sudah terdaftar di Firebase Auth dengan password lain (mis. akun Google). Ganti email/password akun ini.'
        );
      }
    }
    throw new Error(authErrorMessage(e));
  }
}

function buildAuthDoc(uid: string, acc: MemberAccount, memberId: string): MemberAuthDoc {
  return {
    uid,
    email: acc.email.trim().toLowerCase(),
    memberId: memberId || '',
    accountId: acc.id,
    fullName: acc.fullName,
    status: acc.status,
  };
}

/** Akun yang belum punya user Firebase Auth → buatkan. */
export function syncAccountToAuth(acc: MemberAccount, memberId: string): Promise<void> {
  return enqueue(async () => {
    try {
      const uid = await withSecondary((a) => createOrClaim(a, acc.email, acc.password));
      const batch = writeBatch(db);
      batch.set(doc(db, 'memberAuth', uid), buildAuthDoc(uid, acc, memberId));
      batch.set(doc(db, 'memberAccounts', acc.id), { authUid: uid, authSyncError: '' }, { merge: true });
      await batch.commit();
    } catch (e) {
      await setDoc(
        doc(db, 'memberAccounts', acc.id),
        { authSyncError: (e as Error).message || 'Gagal sinkron' },
        { merge: true }
      ).catch(() => {});
    }
  });
}

/** Simpan perubahan akun + terapkan ke Firebase Auth (email/password/status). */
export function applyAccountChange(prev: MemberAccount, next: MemberAccount, memberId: string): Promise<void> {
  return enqueue(async () => {
    const accRef = doc(db, 'memberAccounts', next.id);

    // Belum tersinkron → cukup simpan; efek sinkronisasi admin akan membuatkan user Auth.
    if (!prev.authUid) {
      await setDoc(accRef, { ...next, authSyncError: '' }, { merge: true });
      return;
    }

    const emailChanged = prev.email.toLowerCase() !== next.email.toLowerCase();
    const pwChanged = prev.password !== next.password;
    let uid = prev.authUid;

    try {
      if (emailChanged || pwChanged) {
        uid = await withSecondary(async (a) => {
          if (emailChanged) {
            const newUid = await createOrClaim(a, next.email, next.password);
            try {
              const old = await signInWithEmailAndPassword(a, prev.email, prev.password);
              await deleteUser(old.user);
            } catch {
              /* user lama tidak bisa dihapus; aksesnya tetap dicabut lewat memberAuth */
            }
            return newUid;
          }
          const cred = await signInWithEmailAndPassword(a, prev.email, prev.password);
          await updatePassword(cred.user, next.password);
          return cred.user.uid;
        });
      }

      const batch = writeBatch(db);
      if (uid !== prev.authUid) batch.delete(doc(db, 'memberAuth', prev.authUid));
      batch.set(doc(db, 'memberAuth', uid), buildAuthDoc(uid, next, memberId));
      batch.set(accRef, { ...next, authUid: uid, authSyncError: '' }, { merge: true });
      await batch.commit();
    } catch (e) {
      // Perubahan login gagal → pertahankan email/password lama agar tetap konsisten dengan Auth
      await setDoc(
        accRef,
        {
          ...next,
          email: prev.email,
          password: prev.password,
          authUid: prev.authUid,
          authSyncError: `Perubahan email/password gagal: ${(e as Error).message}`,
        },
        { merge: true }
      ).catch(() => {});
    }
  });
}

/** Hapus akun beserta user Firebase Auth & dokumen memberAuth. */
export function removeAccount(acc: MemberAccount): Promise<void> {
  return enqueue(async () => {
    if (acc.authUid) {
      await withSecondary(async (a) => {
        try {
          const cred = await signInWithEmailAndPassword(a, acc.email, acc.password);
          await deleteUser(cred.user);
        } catch {
          /* abaikan; akses tetap dicabut dengan menghapus memberAuth */
        }
      });
    }
    const batch = writeBatch(db);
    if (acc.authUid) batch.delete(doc(db, 'memberAuth', acc.authUid));
    batch.delete(doc(db, 'memberAccounts', acc.id));
    await batch.commit();
  });
}
