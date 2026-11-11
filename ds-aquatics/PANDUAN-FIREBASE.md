# Panduan Aktivasi Firebase — DS AQUATICS (v20)

Aplikasi kini **100% memakai Firebase** (Firestore + Authentication). Tidak ada lagi data
aplikasi di localStorage/sessionStorage. Lakukan langkah berikut SATU KALI di Firebase Console
(project `ds-aquatics`):

1. **Authentication → Sign-in method**: aktifkan **Email/Password** dan **Google**.
2. **Authentication → Settings → Authorized domains**: tambahkan domain hosting (mis. `xxx.vercel.app`).
3. **Firestore → Rules**: salin isi `firestore.rules` lalu **Publish**
   (atau `npx firebase-tools deploy --only firestore:rules --project ds-aquatics`).
4. Admin login sekali dengan tombol **"Masuk dengan Google (Admin)"**. Saat itu aplikasi otomatis:
   - membuat akun login Firebase untuk semua akun member (tab *Manajemen Akun*, status ✓ hijau),
   - mengisi data katalog awal jika Firestore masih kosong,
   - memperbarui statistik jumlah member aktif di halaman depan.

## Cara login
- **Admin**: tombol Google (email admin harus terverifikasi). Daftar admin ada di
  `src/context/AppContext.tsx` (ADMIN_ACCOUNTS) **dan** `firestore.rules` (isAdmin) — ubah keduanya bersamaan.
- **Member**: email + password akun (default `renang123`, minimal 6 karakter).
  Ubah email/password member hanya lewat tab *Manajemen Akun* agar ikut diperbarui di Firebase Auth.

## Koleksi Firestore baru
- `memberAuth/{uid}` — pemetaan akun login → member (ditulis otomatis oleh admin).
- `publicStats/main` — jumlah member aktif untuk halaman depan.
- `appMeta/seed` — penanda data awal sudah diisi.

## Anti-bot & anti-spam (App Check)
1. Buat key di https://www.google.com/recaptcha/admin → tipe **reCAPTCHA v3**, domain = domain Vercel Anda.
   Anda mendapat **Site key** dan **Secret key**.
2. Firebase Console → **App Check** → pilih Web App → **reCAPTCHA v3** → tempel **Secret key** → Save.
3. Vercel → Project Settings → Environment Variables: `VITE_RECAPTCHA_SITE_KEY` = **Site key**, lalu Redeploy.
4. Tunggu 1–2 hari, cek grafik App Check (permintaan "Verified" harus dominan), lalu klik
   **Enforce** untuk **Cloud Firestore** saja (jangan untuk Authentication).
   Setelah di-enforce, skrip/bot di luar website tidak bisa lagi menulis ke database.

Lapisan lain yang sudah aktif tanpa setting:
- Formulir pendaftaran: kolom jebakan bot (honeypot), waktu isi minimal 4 detik, jeda 30 detik antar kirim.
- Rules: pengajuan jadwal dari tamu hanya bisa bersamaan dengan pendaftaran baru; panjang isian dibatasi.

## Absen mandiri member
Rules hanya mengizinkan member menambah kehadiran **+1 per pengajuan jadwal yang sudah Disetujui
dan belum diabsen**, dan tidak bisa melebihi kuota `totalSessionsAllowed`. Koreksi lain tetap lewat admin.

## Riwayat login & status online (v22)
- Tab admin **"Riwayat Login & Online"**: daftar member/admin yang sedang online, terakhir aktif,
  dan riwayat login/logout/auto-logout/login gagal (500 catatan terbaru, filter nama/kejadian/tanggal).
- Koleksi baru: `loginLogs` (riwayat; tidak bisa diubah/dihapus) dan `presence/{uid}` (status online).
- Online = aplikasi sedang terbuka dan mengirim sinyal dalam 2,5 menit terakhir (sinyal tiap 60 detik,
  waktu diambil dari server sehingga tidak bisa dipalsukan).
- **Wajib publish ulang `firestore.rules`** dari versi ini.
