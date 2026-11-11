import {
  ClubSettings,
  ScheduleSlot,
  PricePackage,
  Member,
  MemberAccount,
  DocumentationItem,
  TestimonialItem,
  SwimGearProduct,
  EvaluationCriterion,
  MemberReport,
  ScheduleRequest,
  ClubInvoice,
} from '../types';

export const DEFAULT_CLUB_SETTINGS: ClubSettings = {
  clubName: 'DS AQUATICS',
  slogan: 'Learn to Swim, Learn for Life.',
  hookText: 'Klub Renang Profesional untuk Semua Usia. Belajar Berenang dengan Aman, Nyaman, Percaya Diri & Menyenangkan Bersama Pelatih Bersertifikat.',
  logoUrl: '/logo.png',
  heroBgUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=1920&auto=format&fit=crop',
  phoneWa: '0859-5900-4884',
  instagramUrl: 'https://www.instagram.com/dsaquatics.official?stkn=Z2xmbmpxeDAxNnZv',
  lestarindoName: 'Lestarindo Swimming Pool, Boyolali',
  lestarindoAddress: 'Gatak, Kebonbimo, Kec. Boyolali, Kabupaten Boyolali, Jawa Tengah 57316',
  lestarindoCoords: { lat: -7.530457639055548, lng: 110.58726665380655 },
  frontOneName: 'Front One Boutique Adria Boyolali',
  frontOneAddress: 'Jl. Merbabu No.88, Lorjurang, Kemiri, Kec. Mojosongo, Boyolali, Jawa Tengah 57322',
  frontOneCoords: { lat: -7.536697061083158, lng: 110.60095182867704 },
  paymentBri: '125301000388569',
  paymentBca: '7455295955',
  paymentMandiri: '1090018864777',
  paymentAccountName: 'DEWI SETYANINGSIH',
  announcementTitle: 'Informasi Latihan Renang & Ketentuan Perlengkapan',
  announcementContent: 'Selamat datang di klub renang DS AQUATICS! Harap hadir 10 menit sebelum jadwal latihan dimulai, membawa pakaian renang standar, kacamata renang, serta handuk pribadi. Untuk konfirmasi kehadiran dan perubahan jadwal latihan, mohon ajukan melalui sistem atau hubungi Coach Dewi.',
  announcementDate: 'Update Terbaru',
  announcementIsActive: true,
  contactWaMessage: 'Halo DS AQUATICS! Saya tertarik untuk mendaftar kelas renang / konsultasi jadwal. Mohon informasinya. Terima kasih!',
  gearWaTemplate: 'Halo Admin DS AQUATICS🙌 Saya berminat membeli produk perlengkapan renang berikut:\n\n*{productName}*\n• Kategori: {category}\n• Harga: {price}\n\nApakah stok masih tersedia? Terima kasih!',
};

export interface PricelistOption {
  id: string;
  packageId: string;
  number: number;
  label: string;
  shortName: string;
  sessionsCount: number;
  price: number;
  formattedPrice: string;
  discountText?: string;
}

export const DEFAULT_PRICE_PACKAGES: PricePackage[] = [
  {
    id: 'pkg-reguler',
    category: 'reguler',
    title: 'Paket Reguler',
    subtitle: 'Belajar berenang dengan aman, nyaman, dan menyenangkan bersama teman sebaya',
    badge: 'Maksimal 4 Orang',
    maxPeople: 'Maksimal 4 Orang',
    pricingTiers: [
      { name: '1. Paket Reguler 1 Kali Pertemuan', sessionsCount: 1, price: 75000, formattedPrice: 'Rp 75.000' },
      { name: '2. Paket Reguler 4 Kali Pertemuan (Diskon 5%)', sessionsCount: 4, price: 285000, formattedPrice: 'Rp 285.000' },
      { name: '3. Paket Reguler 12 Kali Pertemuan (Diskon 11%)', sessionsCount: 12, price: 800000, formattedPrice: 'Rp 800.000' },
    ],
    features: [
      'Maksimal 4 peserta per kelompok belajar',
      'Pelatih bersertifikat, sabar, dan ramah anak',
      'Durasi latihan 60 hingga 90 menit per sesi',
      'Metode belajar terstruktur dan menyenangkan',
      'Gratis biaya pendaftaran',
    ],
    note: 'Sangat cocok untuk anak dan pemula yang ingin bersosialisasi dan belajar secara bertahap.',
    accentColor: 'cyan',
  },
  {
    id: 'pkg-privat',
    category: 'privat',
    title: 'Paket Privat',
    subtitle: 'Pendampingan eksklusif satu lawan satu untuk hasil dan percepatan maksimal',
    badge: '1 Pelatih 1 Murid',
    maxPeople: '1 Pelatih 1 Murid (Privat)',
    pricingTiers: [
      { name: '4. Paket Privat 1 Kali Pertemuan', sessionsCount: 1, price: 100000, formattedPrice: 'Rp 100.000' },
      { name: '5. Paket Privat 4 Kali Pertemuan (Diskon 2.5%)', sessionsCount: 4, price: 390000, formattedPrice: 'Rp 390.000' },
    ],
    features: [
      'Pendampingan penuh 1 pelatih untuk 1 murid',
      'Kecepatan materi disesuaikan dengan kemampuan anak',
      'Analisis teknik dan koreksi gerakan secara langsung',
      'Jadwal lebih fleksibel (disepakati bersama pelatih)',
      'Gratis biaya pendaftaran',
    ],
    note: 'Pilihan paling direkomendasikan bagi pemula yang takut air atau membutuhkan percepatan belajar.',
    accentColor: 'teal',
  },
  {
    id: 'pkg-prestasi',
    category: 'group_prestasi',
    title: 'Paket Group',
    subtitle: 'Program latihan rutin 3 kali seminggu untuk pengembangan teknik dan prestasi',
    badge: '3 Kali Seminggu',
    maxPeople: 'Grup (3 Kali Seminggu)',
    pricingTiers: [
      { name: '6. Paket Group (3 Kali Seminggu)', sessionsCount: 12, price: 200000, formattedPrice: 'Rp 200.000 / bulan' },
    ],
    features: [
      'Jadwal latihan rutin 3 kali seminggu (Selasa, Kamis, Minggu)',
      'Khusus bagi perenang yang sudah lulus teknik dasar',
      'Pembentukan daya tahan fisik dan kecepatan gaya renang',
      'Persiapan kejuaraan dan perlombaan renang resmi',
      'Gratis biaya pendaftaran',
    ],
    note: 'Program intensif 3 kali seminggu untuk kelompok binaan dan calon atlet berprestasi.',
    accentColor: 'indigo',
  },
];

export const OFFICIAL_PRICELIST_ITEMS: PricelistOption[] = [
  {
    id: 'pkg-reguler::0',
    packageId: 'pkg-reguler',
    number: 1,
    label: '1. Paket Reguler 1 Kali Pertemuan - Rp 75.000',
    shortName: 'Paket Reguler 1 Kali Pertemuan',
    sessionsCount: 1,
    price: 75000,
    formattedPrice: 'Rp 75.000',
  },
  {
    id: 'pkg-reguler::1',
    packageId: 'pkg-reguler',
    number: 2,
    label: '2. Paket Reguler 4 Kali Pertemuan (Diskon 5%) - Rp 285.000',
    shortName: 'Paket Reguler 4 Kali Pertemuan',
    sessionsCount: 4,
    price: 285000,
    formattedPrice: 'Rp 285.000',
    discountText: 'Diskon 5%',
  },
  {
    id: 'pkg-reguler::2',
    packageId: 'pkg-reguler',
    number: 3,
    label: '3. Paket Reguler 12 Kali Pertemuan (Diskon 11%) - Rp 800.000',
    shortName: 'Paket Reguler 12 Kali Pertemuan',
    sessionsCount: 12,
    price: 800000,
    formattedPrice: 'Rp 800.000',
    discountText: 'Diskon 11%',
  },
  {
    id: 'pkg-privat::0',
    packageId: 'pkg-privat',
    number: 4,
    label: '4. Paket Privat 1 Kali Pertemuan - Rp 100.000',
    shortName: 'Paket Privat 1 Kali Pertemuan',
    sessionsCount: 1,
    price: 100000,
    formattedPrice: 'Rp 100.000',
  },
  {
    id: 'pkg-privat::1',
    packageId: 'pkg-privat',
    number: 5,
    label: '5. Paket Privat 4 Kali Pertemuan (Diskon 2.5%) - Rp 390.000',
    shortName: 'Paket Privat 4 Kali Pertemuan',
    sessionsCount: 4,
    price: 390000,
    formattedPrice: 'Rp 390.000',
    discountText: 'Diskon 2.5%',
  },
  {
    id: 'pkg-prestasi::0',
    packageId: 'pkg-prestasi',
    number: 6,
    label: '6. Paket Group (3 Kali Seminggu) - Rp 200.000 / bulan',
    shortName: 'Paket Group 3 Kali Seminggu',
    sessionsCount: 12,
    price: 200000,
    formattedPrice: 'Rp 200.000 / bulan',
  },
];

export const PACKAGE_CANONICAL_ORDER = ['pkg-reguler', 'pkg-privat', 'pkg-prestasi'];

export function getStandardFormattedPrice(tier: { price?: number; formattedPrice?: string }, pkgId?: string): string {
  if (tier.price === 200000 || pkgId === 'pkg-prestasi') {
    return 'Rp 200.000 / bulan';
  }
  if (tier.price && tier.price > 0) {
    return `Rp ${tier.price.toLocaleString('id-ID')}`;
  }
  if (tier.formattedPrice) {
    return tier.formattedPrice
      .replace(/@\d+k/gi, '')
      .replace(/\d+k\/bulan/gi, 'Rp 200.000 / bulan')
      .replace(/\d+k/gi, '')
      .replace(/\(\s*Rp/gi, 'Rp')
      .replace(/\)/g, '')
      .trim();
  }
  return 'Rp 0';
}

export function getStandardTierName(tier: { name: string }, fallback?: string): string {
  const raw = tier.name.replace(/^\d+\.\s*/, '').trim();
  const lower = raw.toLowerCase();
  if (lower.includes('group') || lower.includes('prestasi') || lower.includes('200k')) {
    return 'Paket Group (3 Kali Seminggu)';
  }
  if (lower.includes('privat')) {
    if (lower.includes('4') || lower.includes('2.5') || lower.includes('390')) {
      return 'Paket Privat 4 Kali Pertemuan (Diskon 2.5%)';
    }
    return 'Paket Privat 1 Kali Pertemuan';
  }
  if (lower.includes('reguler') || lower.includes('12') || lower.includes('11%') || lower.includes('800')) {
    if (lower.includes('12') || lower.includes('11%') || lower.includes('800')) {
      return 'Paket Reguler 12 Kali Pertemuan (Diskon 11%)';
    }
    if (lower.includes('4') || lower.includes('5%') || lower.includes('285')) {
      return 'Paket Reguler 4 Kali Pertemuan (Diskon 5%)';
    }
    return 'Paket Reguler 1 Kali Pertemuan';
  }
  return fallback || raw;
}

export function sortPricePackages(packages: PricePackage[]): PricePackage[] {
  if (!packages || !Array.isArray(packages)) return [];
  return [...packages].sort((a, b) => {
    const idxA = PACKAGE_CANONICAL_ORDER.indexOf(a.id);
    const idxB = PACKAGE_CANONICAL_ORDER.indexOf(b.id);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    if (a.category === 'reguler') return -1;
    if (b.category === 'reguler') return 1;
    if (a.category === 'privat') return -1;
    if (b.category === 'privat') return 1;
    return 0;
  });
}

export function getAllPricelistOptions(packages?: PricePackage[]): PricelistOption[] {
  const rawPackages = packages && packages.length > 0 ? packages : DEFAULT_PRICE_PACKAGES;
  const safePackages = sortPricePackages(rawPackages);
  const list: PricelistOption[] = [];
  let counter = 1;

  for (const pkg of safePackages) {
    if (!pkg || !pkg.pricingTiers || pkg.pricingTiers.length === 0) continue;
    pkg.pricingTiers.forEach((tier, idx) => {
      if (!tier) return;
      const optionId = `${pkg.id}::${idx}`;
      const matchDefault = OFFICIAL_PRICELIST_ITEMS.find(
        (item) => item.id === optionId && item.price === tier.price
      );
      if (matchDefault) {
        list.push({
          ...matchDefault,
          number: counter++,
        });
      } else {
        const cleanTierName = getStandardTierName(tier);
        const stdPrice = getStandardFormattedPrice(tier, pkg.id);
        list.push({
          id: optionId,
          packageId: pkg.id,
          number: counter,
          label: `${counter}. ${cleanTierName} - ${stdPrice}`,
          shortName: cleanTierName,
          sessionsCount: tier.sessionsCount || 4,
          price: tier.price || 0,
          formattedPrice: stdPrice,
        });
        counter++;
      }
    });
  }

  return list.length > 0 ? list : OFFICIAL_PRICELIST_ITEMS;
}

export const TIME_SLOTS: string[] = [
  '07:30 - 09:00',
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '15:30 - 17:00',
];

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
}

/**
 * Mengurutkan jam latihan secara kronologis dan logis tanpa loncatan terbalik:
 * 1. Sesi Pagi Prestasi (07:30 - 09:00)
 * 2. Sesi Pagi Reguler (08:00 - 09:00, 09:00 - 10:00, 10:00 - 11:00)
 * 3. Sesi Sore Reguler (14:00 - 15:00, 15:00 - 16:00, 16:00 - 17:00)
 * 4. Sesi Sore Khusus Prestasi (15:30 - 17:00)
 */
export function sortTimeSlots(slots: string[]): string[] {
  const orderWeight: Record<string, number> = {
    '07:30 - 09:00': 10,
    '08:00 - 09:00': 20,
    '09:00 - 10:00': 30,
    '10:00 - 11:00': 40,
    '14:00 - 15:00': 50,
    '15:00 - 16:00': 60,
    '16:00 - 17:00': 70,
    '15:30 - 17:00': 80,
  };

  return Array.from(new Set(slots)).sort((a, b) => {
    const wA = orderWeight[a.trim()];
    const wB = orderWeight[b.trim()];
    if (wA !== undefined && wB !== undefined) {
      return wA - wB;
    }
    const [startA] = a.split('-');
    const [startB] = b.split('-');
    return parseTimeToMinutes(startA) - parseTimeToMinutes(startB);
  });
}

export const DAYS_OF_WEEK = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'] as const;

/**
 * Jadwal mingguan resmi DS AQUATICS (sesuai matriks jadwal Nov 2026).
 * Satu entri = satu blok "C. Dewi" di matriks. 'OFF' = slot tidak melatih.
 */
const WEEKLY_SCHEDULE: [string, string, string[]][] = [
  // [hari, jam, peserta per blok]
  ['Selasa', '08:00 - 09:00', ['Ms Salimah', 'Ms Riri']],
  ['Rabu', '08:00 - 09:00', ['OFF', 'OFF', 'OFF', 'OFF']],
  ['Kamis', '08:00 - 09:00', ['Ms Eti', 'Ms Riri', 'Ms Salimah']],
  ['Jumat', '08:00 - 09:00', ['Ms Lina', 'Ms Eti']],
  ['Sabtu', '08:00 - 09:00', ['Shanum', 'Keynara ZM']],
  ['Minggu', '08:00 - 09:00', ['(GROUP) Luna', '(GROUP) Alisa', '(GROUP) Afra', '(GROUP) Fatih']],

  ['Senin', '09:00 - 10:00', ['Ms Eti', 'Ms Novi', 'Ms Nanik', 'Ms Melani']],
  ['Selasa', '09:00 - 10:00', ['Ms Novi', 'Ms Nanik', 'Ms Eti', 'Ms Melani']],
  ['Rabu', '09:00 - 10:00', ['OFF', 'OFF', 'OFF', 'OFF']],
  ['Kamis', '09:00 - 10:00', ['Ms Novi', 'Ms Nanik', 'Ms Melani']],
  ['Jumat', '09:00 - 10:00', ['Ms Melani', 'Ms Nanik', 'Ms Novi']],
  ['Sabtu', '09:00 - 10:00', ['Kenzo', 'Keynara']],
  ['Minggu', '09:00 - 10:00', ['Keynara ZM', 'Shanum']],

  ['Rabu', '10:00 - 11:00', ['OFF']],

  ['Sabtu', '14:00 - 15:00', ['(Privat) Reya']],

  ['Selasa', '15:00 - 16:00', ['Ms Lina', 'Ms Intan']],
  ['Jumat', '15:00 - 16:00', ['(Privat) Ameera']],
  ['Sabtu', '15:00 - 16:00', ['Baari']],

  ['Selasa', '16:00 - 17:00', ['(GROUP) Luna', '(GROUP) Alisa', '(GROUP) Afra', '(GROUP) Fatih']],
  ['Rabu', '16:00 - 17:00', ['Ms Intan', 'Ms Lina']],
  ['Kamis', '16:00 - 17:00', ['(GROUP) Luna', '(GROUP) Alisa', '(GROUP) Afra', '(GROUP) Fatih']],
  ['Jumat', '16:00 - 17:00', ['(Privat) Atikah']],
  ['Sabtu', '16:00 - 17:00', ['OFF']],
];

export const DEFAULT_SCHEDULE_SLOTS: ScheduleSlot[] = WEEKLY_SCHEDULE.flatMap(([day, timeRange, people]) =>
  people.map((name, idx) => ({
    id: `jdw-${day.toLowerCase()}-${timeRange.slice(0, 5).replace(':', '')}-${idx + 1}`,
    day: day as ScheduleSlot['day'],
    timeRange,
    coach: 'C. Dewi',
    status: (name === 'OFF' ? 'off' : 'tersedia') as ScheduleSlot['status'],
    participants: [name],
    location: 'Kolam Renang Lestarindo',
  }))
);

export const DEFAULT_MEMBERS: Member[] = [
  {
    id: 'DSA-2024-001',
    fullName: 'Raffi Pratama Putra',
    email: 'raffi.pratama@gmail.com',
    ageOrDob: '15 Thn',
    gender: 'Laki-laki',
    school: 'SMP Negeri 1 Boyolali',
    currentLevel: 'Lanjutan',
    goal: 'Persiapan Kejuaraan KRAP & limit Kejurnas 50m & 100m Bebas',
    preferredDay: 'Selasa',
    preferredTime: '16:00 - 18:30',
    location: 'Kolam Renang Lestarindo',
    specialConditions: 'Atlet inti skuad prestasi',
    whatsapp: '0812-4455-6677',
    parentName: 'Bambang Pratama',
    address: 'Jl. Merapi No. 18, Boyolali',
    selectedPackageId: 'pkg-prestasi',
    status: 'Aktif',
    source: 'manual_admin',
    registrationDate: '2024-02-10',
    totalSessionsAllowed: 12,
    attendedSessions: 11,
    squad: 'Prestasi Utama',
    spesialisasi: 'Gaya Bebas & Kupu-kupu (Sprint)',
    kelompokUmur: 'KU II (14-15 thn)',
    nisn: '0091245671',
    personalBests: [
      { event: '50m Gaya Bebas', time: '00:25.84', previousTime: '00:26.68', dateRecorded: '2026-09-12' },
      { event: '100m Gaya Bebas', time: '00:56.90', previousTime: '00:58.12', dateRecorded: '2026-09-10' },
      { event: '50m Gaya Kupu-kupu', time: '00:27.40', previousTime: '00:28.15', dateRecorded: '2026-08-25' },
    ],
    cumulativeAttendanceRate: 94,
    dailyAttendanceStatus: 'Hadir',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'DSA-2024-002',
    fullName: 'Nayla Zahra Putri',
    email: 'nayla.zahra@gmail.com',
    ageOrDob: '13 Thn',
    gender: 'Perempuan',
    school: 'SMP Islam Terpadu Boyolali',
    currentLevel: 'Lanjutan',
    goal: 'Target medali emas gaya dada 50m & 100m di Kejurda',
    preferredDay: 'Rabu',
    preferredTime: '16:00 - 18:30',
    location: 'Kolam Renang Lestarindo',
    specialConditions: 'Fisik prima, endurance tinggi',
    whatsapp: '0813-8899-1122',
    parentName: 'H. Sudirman',
    address: 'Komp. Pondok Asri No. 4, Boyolali',
    selectedPackageId: 'pkg-prestasi',
    status: 'Aktif',
    source: 'manual_admin',
    registrationDate: '2024-05-15',
    totalSessionsAllowed: 12,
    attendedSessions: 12,
    squad: 'Prestasi Utama',
    spesialisasi: 'Gaya Dada & Individual Medley',
    kelompokUmur: 'KU III (12-13 thn)',
    nisn: '0112349870',
    personalBests: [
      { event: '50m Gaya Dada', time: '00:35.12', previousTime: '00:36.40', dateRecorded: '2026-09-14' },
      { event: '100m Gaya Dada', time: '01:17.30', previousTime: '01:18.90', dateRecorded: '2026-08-30' },
    ],
    cumulativeAttendanceRate: 98,
    dailyAttendanceStatus: 'Hadir',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'DSA-2024-003',
    fullName: 'Dimas Aditya Nugraha',
    email: 'dimas.aditya@gmail.com',
    ageOrDob: '16 Thn',
    gender: 'Laki-laki',
    school: 'SMA Negeri 1 Boyolali',
    currentLevel: 'Lanjutan',
    goal: 'Penyempurnaan rotasi tubuh & start block gaya punggung',
    preferredDay: 'Kamis',
    preferredTime: '16:00 - 18:30',
    location: 'Kolam Renang Lestarindo',
    specialConditions: 'Latihan beban mandiri 2x seminggu',
    whatsapp: '0856-7788-3344',
    parentName: 'Ir. Nugroho',
    address: 'Jl. Merbabu No. 33, Boyolali',
    selectedPackageId: 'pkg-prestasi',
    status: 'Aktif',
    source: 'manual_admin',
    registrationDate: '2024-03-01',
    totalSessionsAllowed: 12,
    attendedSessions: 10,
    squad: 'Prestasi Utama',
    spesialisasi: 'Gaya Punggung & 200m Bebas',
    kelompokUmur: 'KU I (16-18 thn)',
    nisn: '0087654321',
    personalBests: [
      { event: '50m Gaya Punggung', time: '00:28.10', previousTime: '00:28.95', dateRecorded: '2026-09-08' },
      { event: '100m Gaya Punggung', time: '01:00.40', previousTime: '01:01.80', dateRecorded: '2026-08-20' },
    ],
    cumulativeAttendanceRate: 88,
    dailyAttendanceStatus: 'Hadir',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'DSA-2025-014',
    fullName: 'Alena Keisha Ramadhani',
    email: 'alena.keisha@gmail.com',
    ageOrDob: '10 Thn',
    gender: 'Perempuan',
    school: 'SD Islam Al-Azhar Boyolali',
    currentLevel: 'Menengah',
    goal: 'Pembinaan usia dini KU IV dan daya tahan kayuhan',
    preferredDay: 'Jumat',
    preferredTime: '16:00 - 18:00',
    location: 'Kolam Renang Lestarindo',
    specialConditions: 'Disertai konfirmasi orang tua (ada ujian sekolah)',
    whatsapp: '0812-9988-7766',
    parentName: 'Dra. Endang Sulastri',
    address: 'Perumahan Griya Indah Blok B, Boyolali',
    selectedPackageId: 'pkg-pemula',
    status: 'Aktif',
    source: 'form_online',
    registrationDate: '2025-01-10',
    totalSessionsAllowed: 8,
    attendedSessions: 7,
    squad: 'Development (KU)',
    spesialisasi: 'Gaya Bebas & Dada (All Rounder)',
    kelompokUmur: 'KU IV (10-11 thn)',
    nisn: '0145678901',
    personalBests: [
      { event: '50m Gaya Bebas', time: '00:32.40', previousTime: '00:33.80', dateRecorded: '2026-09-02' },
      { event: '50m Gaya Dada', time: '00:42.80', previousTime: '00:44.10', dateRecorded: '2026-08-15' },
    ],
    cumulativeAttendanceRate: 92,
    dailyAttendanceStatus: 'Izin',
    dailyAttendanceNote: 'Disertai konfirmasi orang tua (ada ujian sekolah)',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'DSA-2025-021',
    fullName: 'Kenzo Alvaro Setiawan',
    email: 'kenzo.alvaro@gmail.com',
    ageOrDob: '10 Thn',
    gender: 'Laki-laki',
    school: 'SD Tarakanita',
    currentLevel: 'Menengah',
    goal: 'Meningkatkan stroke frequency & aerobil base 200m',
    preferredDay: 'Sabtu',
    preferredTime: '15:30 - 17:00',
    location: 'Kolam Renang Lestarindo',
    specialConditions: 'Disertai konfirmasi orang tua (demam/flu)',
    whatsapp: '0857-3344-5566',
    parentName: 'dr. Setiawan Sp.A',
    address: 'Jl. Pemuda No. 7, Boyolali',
    selectedPackageId: 'pkg-pemula',
    status: 'Aktif',
    source: 'form_online',
    registrationDate: '2025-02-15',
    totalSessionsAllowed: 8,
    attendedSessions: 6,
    squad: 'Development (KU)',
    spesialisasi: 'Gaya Bebas Jarak Menengah',
    kelompokUmur: 'KU IV (10-11 thn)',
    nisn: '0149876543',
    personalBests: [
      { event: '50m Gaya Bebas', time: '00:33.20', previousTime: '00:34.50', dateRecorded: '2026-09-01' },
      { event: '100m Gaya Bebas', time: '01:14.50', previousTime: '01:16.20', dateRecorded: '2026-08-10' },
    ],
    cumulativeAttendanceRate: 85,
    dailyAttendanceStatus: 'Sakit',
    dailyAttendanceNote: 'Disertai konfirmasi orang tua (istirahat demam)',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'MEM-001',
    fullName: 'Fatih Al-Ghifari',
    email: 'fatih.alghifari@gmail.com',
    ageOrDob: '2018-05-14',
    gender: 'Laki-laki',
    school: 'SDIT Bina Insani Boyolali',
    currentLevel: 'Pemula',
    goal: 'Belajar dasar renang, meluncur dan gaya dada',
    preferredDay: 'Sabtu',
    preferredTime: '08:00 - 09:00',
    location: 'Front One Boutique Adria Boyolali',
    specialConditions: 'Tidak ada riwayat asma',
    whatsapp: '0812-3456-7890',
    parentName: 'Bunda Rina',
    address: 'Jl. Pandanaran No. 45, Boyolali',
    selectedPackageId: 'pkg-privat',
    status: 'Aktif',
    source: 'form_online',
    registrationDate: '2026-08-10',
    totalSessionsAllowed: 4,
    attendedSessions: 3,
  },
  {
    id: 'MEM-002',
    fullName: 'Hilwa Nasyitha',
    email: 'hilwa.nasyitha@gmail.com',
    ageOrDob: '2016-07-22',
    gender: 'Perempuan',
    school: 'SDN 1 Boyolali',
    currentLevel: 'Menengah',
    goal: 'Persiapan kejuaraan renang O2SN tingkat kabupaten',
    preferredDay: 'Selasa',
    preferredTime: '15:30 - 17:00',
    location: 'Kolam Renang Lestarindo',
    specialConditions: 'Sehat, fisik prima',
    whatsapp: '0821-9876-5432',
    parentName: 'Ayah Hendra',
    address: 'Perumahan Griya Permata Asri Blok C, Boyolali',
    selectedPackageId: 'pkg-prestasi',
    status: 'Aktif',
    source: 'manual_admin',
    registrationDate: '2026-07-01',
    totalSessionsAllowed: 12,
    attendedSessions: 9,
  },
  {
    id: 'MEM-003',
    fullName: 'Albirru Dirgantara',
    email: 'albirru.dirgantara@gmail.com',
    ageOrDob: '2019-01-04',
    gender: 'Laki-laki',
    school: 'SD Kristen Manahan',
    currentLevel: 'Pemula',
    goal: 'Percaya diri di air, menghilangkan rasa takut',
    preferredDay: 'Sabtu',
    preferredTime: '14:00 - 15:00',
    location: 'Kolam Renang Lestarindo',
    specialConditions: 'Kulit sensitif kaporit tinggi',
    whatsapp: '0857-1122-3344',
    parentName: 'Ibu Ratna',
    address: 'Gatak, Kebonbimo, Boyolali',
    selectedPackageId: 'pkg-reguler',
    status: 'Aktif',
    source: 'form_online',
    registrationDate: '2026-08-20',
    totalSessionsAllowed: 4,
    attendedSessions: 2,
  },
  {
    id: 'MEM-004',
    fullName: 'Keynara Putri',
    email: 'keynara.putri@gmail.com',
    ageOrDob: '2017-11-11',
    gender: 'Perempuan',
    school: 'SD Islam Terpadu Insan Cendekia',
    currentLevel: 'Menengah',
    goal: 'Memperbaiki kayuhan tangan gaya bebas',
    preferredDay: 'Sabtu',
    preferredTime: '09:00 - 10:00',
    location: 'Front One Boutique Adria Boyolali',
    specialConditions: 'Tidak ada',
    whatsapp: '0813-5566-7788',
    parentName: 'Ibu Sarah',
    address: 'Mojosongo, Boyolali',
    selectedPackageId: 'pkg-reguler',
    status: 'Verifikasi',
    source: 'form_online',
    registrationDate: '2026-09-02',
    totalSessionsAllowed: 4,
    attendedSessions: 1,
  },
  {
    id: 'MEM-005',
    fullName: 'Zea Azzahra',
    email: 'zea.azzahra@gmail.com',
    ageOrDob: '2015-03-09',
    gender: 'Perempuan',
    school: 'SDN 3 Siswodipuran',
    currentLevel: 'Lanjutan',
    goal: 'Penyempurnaan gaya kupu-kupu & ketahanan fisik',
    preferredDay: 'Minggu',
    preferredTime: '07:30 - 09:00',
    location: 'Kolam Renang Lestarindo',
    specialConditions: 'Tidak ada',
    whatsapp: '0852-7788-9900',
    parentName: 'Pak Wahyu',
    address: 'Jl. Merbabu No. 12, Boyolali',
    selectedPackageId: 'pkg-prestasi',
    status: 'Aktif',
    source: 'manual_admin',
    registrationDate: '2026-06-15',
    totalSessionsAllowed: 12,
    attendedSessions: 11,
  },
];

export const DEFAULT_MEMBER_ACCOUNTS: MemberAccount[] = [
  {
    id: 'ACC-001',
    memberId: 'MEM-001',
    fullName: 'Fatih Al-Ghifari',
    email: 'fatih.alghifari@gmail.com',
    password: 'renang123',
    whatsapp: '0812-3456-7890',
    status: 'Aktif',
    createdAt: '2026-08-01',
    notes: 'Akun resmi member reguler',
  },
  {
    id: 'ACC-002',
    memberId: 'MEM-002',
    fullName: 'Hilwa Nasyitha',
    email: 'hilwa.nasyitha@gmail.com',
    password: 'renang123',
    whatsapp: '0821-9876-5432',
    status: 'Aktif',
    createdAt: '2026-07-01',
    notes: 'Akun member tim prestasi',
  },
  {
    id: 'ACC-003',
    memberId: 'MEM-003',
    fullName: 'Albirru Dirgantara',
    email: 'albirru.dirgantara@gmail.com',
    password: 'renang123',
    whatsapp: '0857-1122-3344',
    status: 'Aktif',
    createdAt: '2026-08-15',
    notes: 'Akun member pemula',
  },
  {
    id: 'ACC-004',
    memberId: 'MEM-004',
    fullName: 'Keynara Putri',
    email: 'keynara.putri@gmail.com',
    password: 'renang123',
    whatsapp: '0813-5566-7788',
    status: 'Aktif',
    createdAt: '2026-09-02',
    notes: 'Akun member reguler verifikasi',
  },
  {
    id: 'ACC-005',
    memberId: 'MEM-005',
    fullName: 'Zea Azzahra',
    email: 'zea.azzahra@gmail.com',
    password: 'renang123',
    whatsapp: '0852-7788-9900',
    status: 'Aktif',
    createdAt: '2026-06-15',
    notes: 'Akun member tim prestasi',
  },
];

export const DEFAULT_DOCUMENTATION: DocumentationItem[] = [
  {
    id: 'doc-1',
    title: 'Latihan Dasar Meluncur & Water Safety',
    description: 'Anak-anak berlatih posisi streamline dan teknik mengapung rileks dengan bimbingan Coach Dewi.',
    imageUrl: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?q=80&w=900&auto=format&fit=crop',
    date: '15 September 2026',
  },
  {
    id: 'doc-2',
    title: 'Sesi Privat 1 on 1 Coach Dewi',
    description: 'Fokus intensif koreksi posisi kepala saat pengambilan napas gaya bebas pada murid privat.',
    imageUrl: 'https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?q=80&w=900&auto=format&fit=crop',
    date: '12 September 2026',
  },
  {
    id: 'doc-3',
    title: 'Group Prestasi Pagi Hari di Lestarindo',
    description: 'Semangat latihan sprint 50m dan latihan pembalikan (flip turn) kelompok prestasi DS AQUATICS.',
    imageUrl: 'https://images.unsplash.com/photo-1560090995-01632a28895b?q=80&w=900&auto=format&fit=crop',
    date: '08 September 2026',
  },
  {
    id: 'doc-4',
    title: 'Evaluasi & Pemberian Rapor Kemampuan',
    description: 'Momen bangga saat adik-adik berhasil lulus tes renang gaya dada 25 meter tanpa henti!',
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?q=80&w=900&auto=format&fit=crop',
    date: '01 September 2026',
  },
  {
    id: 'doc-5',
    title: 'Latihan Fun Game & Keberanian Menyelam',
    description: 'Membangun rasa nyaman di dalam air melalui permainan cincin selam di Front One Boutique Adria.',
    imageUrl: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?q=80&w=900&auto=format&fit=crop',
    date: '28 Agustus 2026',
  },
];

export const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'testi-1',
    name: 'Bunda Rina (Mama Fatih)',
    role: 'Orang Tua Murid Kelas Privat',
    quote: 'Awalnya Fatih trauma dan takut sekali masuk air. Berkat kesabaran Coach Dewi di DS AQUATICS, dalam 4 pertemuan Fatih sudah berani meluncur dan senang sekali setiap jadwal berenang tiba!',
    rating: 5,
  },
  {
    id: 'testi-2',
    name: 'Ayah Hendra (Papa Hilwa)',
    role: 'Orang Tua Kelas Group Prestasi',
    quote: 'Metode latihan sangat terstruktur, tidak asal berenang. Ada evaluasi rutin dan rapor perkembangan. Catatan waktu renang Hilwa berkembang pesat dan siap ikut O2SN!',
    rating: 5,
  },
  {
    id: 'testi-3',
    name: 'Ibu Ratna (Mama Albirru)',
    role: 'Orang Tua Kelas Reguler',
    quote: 'Fasilitas kolam renang Lestarindo bersih dan nyaman. Pelatihnya sangat ramah, disiplin tapi penuh senyum sehingga anak-anak betah dan cepat bisa.',
    rating: 5,
  },
  {
    id: 'testi-4',
    name: 'Kak Dania',
    role: 'Member Dewasa Pemula',
    quote: 'Sebagai orang dewasa yang baru belajar renang dari nol, saya merasa sangat dihargai dan tidak canggung. Teknik pernapasan yang diajarkan sangat membantu daya tahan tubuh saya.',
    rating: 5,
  },
];

export const DEFAULT_SWIM_GEAR: SwimGearProduct[] = [
  {
    id: 'gear-1',
    name: 'Kacamata Renang DS Elite Anti-Fog UV',
    category: 'Kacamata Renang',
    price: 135000,
    formattedPrice: 'Rp 135.000',
    imageUrl: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?q=80&w=800&auto=format&fit=crop',
    description: 'Kacamata renang dengan lapisan anti-fog tahan lama, perlindungan UV 400, dan bantalan silikon lembut anti bocor.',
    stockStatus: 'Tersedia',
    specifications: ['Anti-Fog Coating', 'Silicone Seal Soft Fit', 'Adjustable Strap', 'Case Hardcover Gratis'],
  },
  {
    id: 'gear-2',
    name: 'Papan Luncur (Kickboard) DS Aquatics Pro',
    category: 'Alat Latihan',
    price: 85000,
    formattedPrice: 'Rp 85.000',
    imageUrl: 'https://images.unsplash.com/photo-1560090995-01632a28895b?q=80&w=800&auto=format&fit=crop',
    description: 'Papan luncur busa EVA kepadatan tinggi dengan pegangan ergonomis, ideal untuk melatih tendangan kaki gaya dada & bebas.',
    stockStatus: 'Tersedia',
    specifications: ['High Density EVA Foam', 'Dual Grip Handle', 'Ringan & Mengapung Kuat', 'Ukuran Anak & Remaja'],
  },
  {
    id: 'gear-3',
    name: 'Pull Buoy Ergonomis DS Training',
    category: 'Alat Latihan',
    price: 70000,
    formattedPrice: 'Rp 70.000',
    imageUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=800&auto=format&fit=crop',
    description: 'Pull buoy kontur 4 lapis untuk menjepit di paha, memaksimalkan kekuatan kayuhan tangan dan menjaga posisi tubuh tetap horizontal.',
    stockStatus: 'Tersedia',
    specifications: ['4-Layer Contour Design', 'Busa Tidak Menyerap Air', 'Melatih Otot Lengan'],
  },
  {
    id: 'gear-4',
    name: 'Fin Kaki Katak Silikon Training Fin',
    category: 'Kaki Katak / Fin',
    price: 245000,
    formattedPrice: 'Rp 245.000',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop',
    description: 'Fin pendek terbuat dari 100% silikon elastis tinggi, melatih fleksibilitas pergelangan kaki dan kecepatan kayuhan tanpa kram.',
    stockStatus: 'Tersedia',
    specifications: ['Short Blade Training', '100% Pure Silicone', 'Tersedia Size 30-42'],
  },
  {
    id: 'gear-5',
    name: 'Topi Renang Silikon Resmi DS Aquatics',
    category: 'Topi Renang',
    price: 55000,
    formattedPrice: 'Rp 55.000',
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?q=80&w=800&auto=format&fit=crop',
    description: 'Swim cap silikon elastis tebal dengan sablon logo emas DS AQUATICS. Melindungi rambut dari kaporit kolam renang.',
    stockStatus: 'Tersedia',
    specifications: ['Bahan Silikon Premium', 'Logo DS Aquatics Gold Edition', 'Tidak Mudah Sobek'],
  },
  {
    id: 'gear-6',
    name: 'Tas Renang Serbaguna Waterproof Mesh Bag',
    category: 'Aksesoris',
    price: 95000,
    formattedPrice: 'Rp 95.000',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop',
    description: 'Tas jaring berfuring kedap air untuk menyimpan baju basah, handuk, kacamata, dan kickboard dengan ventilasi sirkulasi udara.',
    stockStatus: 'Pre-Order',
    specifications: ['Dry & Wet Separation Compartment', 'Jaring Cepat Kering', 'Kapasitas 20 Liter'],
  },
];

export const DEFAULT_EVALUATION_CRITERIA: EvaluationCriterion[] = [
  {
    id: 'crit-1',
    category: 'Dasar & Keselamatan',
    name: 'Keberanian & Pengenalan Air',
    description: 'Kemampuan beradaptasi di kedalaman, rileks, dan tidak panik.',
    maxScore: 100,
  },
  {
    id: 'crit-2',
    category: 'Dasar & Keselamatan',
    name: 'Teknik Pernapasan (Blowing & Inhale)',
    description: 'Pengambilan napas lewat mulut dan pembuangan udara lewat hidung/mulut di air.',
    maxScore: 100,
  },
  {
    id: 'crit-3',
    category: 'Dasar & Keselamatan',
    name: 'Meluncur (Streamline)',
    description: 'Kelurusan tubuh, kepala di antara kedua lengan saat mendorong dinding kolam.',
    maxScore: 100,
  },
  {
    id: 'crit-4',
    category: 'Gaya Dada (Breaststroke)',
    name: 'Tendangan Kaki Gaya Dada',
    description: 'Gerakan tekuk, tendang memutar, dan rapat kembali (whip kick) bertenaga.',
    maxScore: 100,
  },
  {
    id: 'crit-5',
    category: 'Gaya Dada (Breaststroke)',
    name: 'Koordinasi Napas & Tangan Dada',
    description: 'Irama kayuhan tangan, angkat kepala untuk bernapas, dan meluncur sempurna.',
    maxScore: 100,
  },
  {
    id: 'crit-6',
    category: 'Gaya Bebas (Freestyle)',
    name: 'Kayuhan Tangan & Napas Samping Bebas',
    description: 'Rotasi tubuh, kayuhan memutar teratur, dan pengambilan napas satu sisi.',
    maxScore: 100,
  },
  {
    id: 'crit-7',
    category: 'Sikap & Kebugaran',
    name: 'Ketahanan Fisik (Stamina)',
    description: 'Daya tahan berenang bolak-balik tanpa berhenti atau memegang tepi kolam.',
    maxScore: 100,
  },
  {
    id: 'crit-8',
    category: 'Sikap & Kebugaran',
    name: 'Disiplin & Ketepatan Waktu',
    description: 'Kedisiplinan mendengarkan instruksi pelatih dan kehadiran latihan.',
    maxScore: 100,
  },
];

export const DEFAULT_REPORTS: MemberReport[] = [
  {
    id: 'REP-2026-001',
    memberId: 'MEM-001',
    memberName: 'Fatih Al-Ghifari',
    period: 'Triwulan III / 2026',
    evaluationDate: '2026-09-15',
    coachName: 'Coach Dewi Setyaningsih',
    currentLevel: 'Pemula Menuju Tingkat Lanjut',
    grades: [
      { criterionId: 'crit-1', criterionName: 'Keberanian & Pengenalan Air', category: 'Dasar', score: 92, predicate: 'Sangat Baik', notes: 'Sangat percaya diri dan berani menyelam mencari koin.' },
      { criterionId: 'crit-2', criterionName: 'Teknik Pernapasan', category: 'Dasar', score: 88, predicate: 'Baik', notes: 'Irama napas ritmis sudah stabil.' },
      { criterionId: 'crit-3', criterionName: 'Meluncur (Streamline)', category: 'Dasar', score: 90, predicate: 'Sangat Baik', notes: 'Posisi streamline sangat lurus dan menjangkau lebih dari 6 meter.' },
      { criterionId: 'crit-4', criterionName: 'Tendangan Kaki Gaya Dada', category: 'Gaya Dada', score: 85, predicate: 'Baik', notes: 'Hentakan kaki semakin kuat dan dorongan maju jelas terlihat.' },
      { criterionId: 'crit-5', criterionName: 'Koordinasi Napas & Tangan Dada', category: 'Gaya Dada', score: 82, predicate: 'Baik', notes: 'Terkadang masih agak buru-buru, perlu sedikit waktu jeda glide.' },
      { criterionId: 'crit-7', criterionName: 'Ketahanan Fisik (Stamina)', category: 'Sikap', score: 86, predicate: 'Baik', notes: 'Mampu menyelesaikan 2 lap lintasan 25m berturut-turut.' },
      { criterionId: 'crit-8', criterionName: 'Disiplin & Ketepatan Waktu', category: 'Sikap', score: 95, predicate: 'Sangat Baik', notes: 'Selalu hadir 10 menit sebelum jam latihan dimulai.' },
    ],
    averageScore: 88.3,
    overallPredicate: 'Sangat Baik (A)',
    coachEvaluation: 'Ananda Fatih menunjukkan kemajuan yang luar biasa sejak pertama kali bergabung. Rasa takut pada air telah hilang sepenuhnya berganti antusiasme tinggi. Penguasaan teknik dasar renang gaya dada sudah sangat matang.',
    recommendations: 'Disarankan untuk melanjutkan ke program pengenalan teknik kayuhan gaya bebas (freestyle) dan melatih interval pernapasan samping pada periode berikutnya.',
    attendanceSummary: '3 dari 4 Sesi Hadir (75%)',
  },
];

export const DEFAULT_SCHEDULE_REQUESTS: ScheduleRequest[] = [
  {
    id: 'REQ-101',
    memberId: 'MEM-001',
    memberName: 'Fatih Al-Ghifari',
    whatsapp: '0812-3456-7890',
    day: 'Sabtu',
    timeRange: '08:00 - 09:00',
    location: 'Front One Boutique Adria Boyolali',
    packageId: 'pkg-privat',
    status: 'disetujui',
    coachNote: 'Jadwal disetujui. Mohon hadir 10 menit sebelum sesi dimulai.',
    requestDate: '18 Sep 2026',
    createdAt: '18 Sep 2026, 10:15',
  },
  {
    id: 'REQ-102',
    memberId: 'MEM-004',
    memberName: 'Keynara Putri',
    whatsapp: '0813-5566-7788',
    day: 'Sabtu',
    timeRange: '09:00 - 10:00',
    location: 'Front One Boutique Adria Boyolali',
    packageId: 'pkg-reguler',
    status: 'pending',
    coachNote: '',
    requestDate: '20 Sep 2026',
    createdAt: '20 Sep 2026, 14:30',
  },
];

export const DEFAULT_CLUB_INVOICES: ClubInvoice[] = [
  {
    id: 'INV-001',
    memberId: 'DSA-2024-001',
    memberName: 'Raffi Pratama Putra',
    monthPeriod: 'September 2026',
    packageId: 'pkg-prestasi',
    packageName: 'Paket Group (3 Kali Seminggu)',
    amount: 200000,
    formattedAmount: 'Rp 200.000',
    status: 'Lunas',
    paymentMethod: 'Transfer BCA',
    paidAt: '2026-09-08 10:30 WIB',
    dueDate: '10 September 2026',
    receiptNumber: 'KW-DSA-202609-001',
    notes: 'Iuran bulanan Paket Group 3 Kali Seminggu periode September 2026',
  },
  {
    id: 'INV-002',
    memberId: 'DSA-2024-002',
    memberName: 'Nayla Zahra Putri',
    monthPeriod: 'September 2026',
    packageId: 'pkg-reguler',
    packageName: 'Paket Reguler 12 Kali Pertemuan (Diskon 11%)',
    amount: 800000,
    formattedAmount: 'Rp 800.000',
    status: 'Lunas',
    paymentMethod: 'Transfer Mandiri',
    paidAt: '2026-09-07 14:15 WIB',
    dueDate: '10 September 2026',
    receiptNumber: 'KW-DSA-202609-002',
    notes: 'Iuran Paket Reguler 12 Kali Pertemuan periode September 2026',
  },
  {
    id: 'INV-003',
    memberId: 'DSA-2024-003',
    memberName: 'Dimas Aditya Nugraha',
    monthPeriod: 'September 2026',
    packageId: 'pkg-privat',
    packageName: 'Paket Privat 4 Kali Pertemuan (Diskon 2.5%)',
    amount: 390000,
    formattedAmount: 'Rp 390.000',
    status: 'Lunas',
    paymentMethod: 'QRIS',
    paidAt: '2026-09-09 09:20 WIB',
    dueDate: '10 September 2026',
    receiptNumber: 'KW-DSA-202609-003',
    notes: 'Iuran Paket Privat 4 Kali Pertemuan periode September 2026',
  },
  {
    id: 'INV-004',
    memberId: 'DSA-2025-014',
    memberName: 'Alena Keisha Ramadhani',
    monthPeriod: 'September 2026',
    packageId: 'pkg-reguler',
    packageName: 'Paket Reguler 4 Kali Pertemuan (Diskon 5%)',
    amount: 285000,
    formattedAmount: 'Rp 285.000',
    status: 'Menunggu Pembayaran',
    dueDate: '10 September 2026',
    notes: 'Tagihan Paket Reguler 4 Kali Pertemuan periode September 2026',
  },
  {
    id: 'INV-005',
    memberId: 'DSA-2025-021',
    memberName: 'Kenzo Alvaro Setiawan',
    monthPeriod: 'September 2026',
    packageId: 'pkg-privat',
    packageName: 'Paket Privat 1 Kali Pertemuan',
    amount: 100000,
    formattedAmount: 'Rp 100.000',
    status: 'Lunas',
    paymentMethod: 'Transfer BCA',
    paidAt: '2026-09-06 16:45 WIB',
    dueDate: '10 September 2026',
    receiptNumber: 'KW-DSA-202609-005',
    notes: 'Tagihan Paket Privat 1 Kali Pertemuan periode September 2026',
  },
];
