# Perbaikan Struktur & Susunan Sub-Section Price List serta Penyelarasan Pendaftaran

Rencana penyempurnaan menyeluruh pada sub-section Price List DS AQUATICS agar tersusun rapi dalam 3 kartu kategori utama tanpa elemen visual yang tumpang tindih, menampilkan rincian diskon dan sesi secara transparan, serta menyelaraskan pilihan paket ke formulir pendaftaran dan memastikan tampilan sempurna di layar mobile.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan konfirmasi pada tahap klarifikasi:
> - **Konsep Tampilan**: Menggunakan kartu kategori terstruktur yang memuat rincian paket 1 sampai 6 beserta persentase diskon hematnya.
> - **Navigasi**: Menampilkan seluruh paket sekaligus berdampingan (tanpa tab filter terpisah) agar calon member dapat membandingkan paket reguler, privat, dan group secara transparan dalam satu pandangan.
> - **Prioritas Utama**: Keselarasan pilihan paket dari klik kartu langsung ke dropdown formulir pendaftaran online (`RegistrationModal`) dan kenyamanan tampilan di perangkat mobile (*mobile-first touch ergonomics*).

---

## 1. Overview & Core Concept

- **Tujuan Utama**: Merapikan sub-section Price List dengan menghilangkan duplikasi blok yang bertumpuk, menata 3 kartu kategori utama (*Paket Reguler*, *Paket Privat*, *Paket Group*) dengan hierarki tipografi bersih, badge diskon yang menonjol (*Disc. 5%*, *Disc. 11%*, *Disc. 2.5%*), serta menghubungkan pemilihan setiap baris sesi langsung ke formulir pendaftaran member.
- **Target Pengguna**: Calon member renang (orang tua anak balita/pemula, dewasa pemula, dan siswa kelompok prestasi) yang mengakses via smartphone maupun desktop.
- **Nilai Tambah**: Pengalaman pengguna yang mulus tanpa kebingungan saat memilih paket, kejelasan harga per sesi, dan formulir pendaftaran yang langsung terisi otomatis sesuai paket yang diklik.

---

## 2. User Experience & Visual Design

### A. Alur Interaksi Pengguna (User Flow)
1. **Melihat Price List**: Pengguna melihat 3 kartu paket terstruktur:
   - **Kartu 1: Paket Reguler (Maks. 4 Orang)**:
     - 1. Paket reguler 1x @75k (`Rp 75.000`)
     - 2. Paket 4X (`Rp 285.000`) · *Badge: Hemat 5%*
     - 3. Paket 12x (`Rp 800.000`) · *Badge: Hemat 11%*
   - **Kartu 2: Paket Privat (1 on 1 - Paling Direkomendasikan)**:
     - 4. Paket privat 1x @100k (`Rp 100.000`)
     - 5. Paket Privat 4x (`Rp 390.000`) · *Badge: Hemat 2.5%*
   - **Kartu 3: Paket Group (Rutin 3x Seminggu)**:
     - 6. Paket group 200k/bulan (3x seminggu · 12 Sesi) (`Rp 200.000 / bln`)
2. **Memilih Sesi / Paket**: Pengguna dapat mengklik langsung salah satu opsi sesi di dalam kartu atau menekan tombol *"Daftar Sekarang"*. Baris yang diklik memiliki status aktif visual yang jelas (*highlighted selection ring/border*).
3. **Membuka Formulir Pendaftaran**: Modal `RegistrationModal` terbuka dengan dropdown paket yang langsung otomatis memilih paket & sesi yang dipilih pengguna, menampilkan rincian harga, kuota sesi, dan pesan WhatsApp konfirmasi yang akurat.

### B. Desain Responsif & Ergonomi Mobile
- **Desktop (1440px / $\ge$ 1024px)**: Grid 3 kolom seimbang (`grid-cols-1 lg:grid-cols-3 gap-8 items-stretch`), tinggi kartu seragam, tata letak tombol CTA sejajar di bagian bawah kartu.
- **Mobile (390px - 768px)**: Kartu tersusun vertikal dengan jarak napas yang proporsional (`gap-6`), ukuran font adaptif (`text-sm` hingga `text-xl`), target sentuh baris sesi $\ge 44\text{px}$ agar mudah diklik dengan jempol, serta tidak ada teks yang terpotong (*no clipping / no horizontal scroll*).
- **Indikator Diskon**: Tag diskon didesain kontras dan elegan menggunakan warna amber/emerald berlatar gelap atau terang yang mudah dibaca tanpa mengaburkan nama paket.

---

## 3. Key Product Decisions & Trade-Offs

- **Penyatuan Ringkasan ke dalam Kartu Kategori (Bukan Dua Blok Terpisah)**:
  - *Keputusan*: Menghapus blok hitam duplikat di atas grid kartu, dan mengintegrasikan rincian nomor 1 sampai 6 beserta badge diskon langsung ke dalam masing-masing kartu kategori.
  - *Alasan*: Menghilangkan redundansi visual (*anti-slop*), mengurangi panjang scroll, dan membuat setiap kartu mandiri dan utuh.
- **Sinkronisasi Parameter ID Antara Kartu dan Modal Pendaftaran**:
  - *Keputusan*: Menggunakan format ID unik berbasis paket dan tier (misal: `pkg-reguler::1` untuk Paket 4X), dengan fallback otomatis ke ID paket utama (`pkg-reguler`).
  - *Alasan*: Memastikan kompatibilitas mundur dengan database Firestore dan modul admin keuangan tanpa merusak relasi data yang ada.

---

## 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                    PricelistSection.tsx                      │
│  ┌──────────────────────┐ ┌────────────────┐ ┌─────────────┐ │
│  │    Paket Reguler     │ │  Paket Privat  │ │ Paket Group │ │
│  │  1. 1x @75k          │ │  4. 1x @100k   │ │  6. 200k/bln│ │
│  │  2. 4X (Disc 5%)     │ │  5. 4x (D 2.5%)│ │  (3x/minggu)│ │
│  │  3. 12x (Disc 11%)   │ │                │ │             │ │
│  └──────────┬───────────┘ └───────┬────────┘ └──────┬──────┘ │
└─────────────┼─────────────────────┼─────────────────┼────────┘
              │                     │                 │
              ▼                     ▼                 ▼
      onSelectPackage('pkg-reguler::1') / ('pkg-privat::1')
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                   RegistrationModal.tsx                      │
│  - Pre-selected dropdown matches exact tier & discount       │
│  - Sets correct sessions quota (1, 4, 12 sessions)           │
│  - Generates clear WhatsApp order text with exact price      │
│  - Mobile viewport optimized (<768px touch friendly)         │
└──────────────────────────────────────────────────────────────┘
```

### Rincian Perubahan Kode yang Direncanakan:
1. **`src/components/PricelistSection.tsx`**:
   - Menghapus blok duplikat ringkasan gelap di atas grid kartu.
   - Merapikan struktur kartu kategori menjadi 3 pilar yang proporsional (*Reguler*, *Privat*, *Group*).
   - Menambahkan status pilihan sesi di dalam kartu (state `selectedTierByPackage`) dan tag diskon yang rapi.
   - Menyesuaikan tombol CTA pada setiap kartu agar mengirimkan tier yang sedang dipilih ke fungsi pendaftaran.
2. **`src/components/RegistrationModal.tsx`**:
   - Memastikan pemetaan `resolveOptionId` berjalan mulus untuk semua input ID (`pkg-id` maupun `pkg-id::index`).
   - Merapikan tampilan dropdown paket di mobile agar nomor paket (1–6), nama, sesi, dan harga terbaca jelas.
   - Menjamin padding dan jarak form nyaman digunakan pada smartphone layar sempit.
3. **Penyelarasan Data & Komponen Terkait**:
   - Memverifikasi fungsi `getAllPricelistOptions` di `src/data/defaultData.ts`.
   - Memastikan tidak ada console warning atau error tipe TypeScript.
