<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e3dadfa1-5ba9-4f38-957a-f9e62c56a317

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Firebase (wajib dibaca)

Aplikasi memakai project Firebase **ds-aquatics** (`firebase-applet-config.json`) untuk seluruh data
dan login — tidak ada localStorage/sessionStorage. Langkah aktivasi ada di **PANDUAN-FIREBASE.md**,
model keamanan di **security_spec.md**, rules di **firestore.rules**.

### Catatan untuk AI Studio
- Preview AI Studio berjalan di domain berbeda dari Vercel. Jika login muncul pesan
  "Domain ini belum diizinkan", tambahkan domain preview tersebut di
  Firebase Console → Authentication → Settings → Authorized domains.
- Saat meminta agen AI Studio mengubah fitur, tambahkan instruksi:
  *"Jangan ubah firestore.rules, AppContext.tsx bagian login, dan jangan pakai localStorage."*
- File inti keamanan: `firestore.rules`, `src/context/AppContext.tsx`, `src/utils/memberAuth.ts`,
  `src/components/LoginModal.tsx`, `src/firebase.ts`.
