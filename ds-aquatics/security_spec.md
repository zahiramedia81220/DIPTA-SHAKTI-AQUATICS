# Security Specification for DS Aquatics (Firebase / Firestore) — v23

> CATATAN UNTUK AGEN AI STUDIO: model keamanan di bawah ini SUDAH diterapkan di `firestore.rules`
> dan `src/context/AppContext.tsx`. Jangan mengganti rules menjadi `allow read, write: if true`,
> jangan memakai localStorage/sessionStorage untuk data atau sesi, dan jangan mengembalikan
> login tanpa password. Semua data aplikasi wajib lewat Firestore + Firebase Authentication.

## 1. Peran
- **Admin**: Firebase Auth dengan email terverifikasi (Google) yang ada di daftar `isAdmin()` di
  `firestore.rules` dan `ADMIN_ACCOUNTS` di `AppContext.tsx` (keduanya harus sama).
- **Member**: Firebase Auth email/password. Dikenali lewat dokumen `memberAuth/{uid}` (status `Aktif`)
  yang ditulis admin secara otomatis (`src/utils/memberAuth.ts`).
- **Tamu**: tidak login.

## 2. Akses per koleksi
| Koleksi | Baca | Tulis |
|---|---|---|
| clubSettings, pricePackages, documentation, testimonials, swimGear, evaluationCriteria, publicStats | publik | admin |
| scheduleSlots | publik | admin; member hanya `tersedia → hadir` |
| members | admin, member pemilik | admin; tamu create (status `Verifikasi`); member +1 `attendedSessions` terikat pengajuan disetujui, ≤ kuota |
| memberAccounts (berisi password) | admin | admin; tamu create hanya bersama member baru di batch yang sama |
| memberAuth | admin, pemilik (get) | admin |
| scheduleRequests | admin, member pemilik | admin; member untuk dirinya; tamu hanya bersama pendaftaran baru; member set `attended=true` sekali |
| memberReports | admin, member pemilik | admin |
| loginLogs | admin | create saja (append-only), waktu dari server |
| presence | admin | pemilik, `lastSeen == request.time` |
| clubInvoices, attendanceRecords, admins, appMeta | admin | admin |
| lainnya | ditolak | ditolak |

## 3. Ancaman yang ditangani
1. Login tanpa password / bypass nama → semua login lewat Firebase Auth.
2. Baca/tulis anonim seluruh database → rules per peran, default deny.
3. Pencurian password member → `memberAccounts` hanya admin.
4. Eskalasi member ke admin → admin dicek dari token email terverifikasi.
5. Manipulasi kuota absensi → +1 per pengajuan disetujui, ≤ `totalSessionsAllowed`.
6. Spam pendaftaran/pengajuan → batasan panjang isian, pengajuan tamu wajib satu batch dengan pendaftaran, honeypot + jeda di formulir, App Check (opsional, `VITE_RECAPTCHA_SITE_KEY`).
7. Pemalsuan riwayat login/status online → append-only, uid & email harus cocok dengan token, waktu dari server.
