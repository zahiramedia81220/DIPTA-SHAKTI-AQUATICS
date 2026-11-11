import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Tag,
  CheckCircle2,
  Users,
  UserCheck,
  Trophy,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  Activity,
  ArrowRight,
  Percent,
  Check,
} from 'lucide-react';
import { PricePackage } from '../types';
import { sortPricePackages, getStandardFormattedPrice, getStandardTierName } from '../data/defaultData';

interface PricelistSectionProps {
  onSelectPackage: (packageId: string) => void;
}

export const PricelistSection: React.FC<PricelistSectionProps> = ({ onSelectPackage }) => {
  const { pricePackages } = useApp();
  const sortedPackages = sortPricePackages(pricePackages || []);

  // Active selected tier index for each package card
  const [activeTierByPkg, setActiveTierByPkg] = useState<Record<string, number>>({
    'pkg-reguler': 1, // Default to popular 4x disc 5%
    'pkg-privat': 1,  // Default to popular 4x disc 2.5%
    'pkg-prestasi': 0, // Default to group 3x seminggu
  });

  const getOfficialNumber = (pkgId: string, tierIndex: number) => {
    if (pkgId === 'pkg-reguler') return tierIndex + 1; // 1, 2, 3
    if (pkgId === 'pkg-privat') return tierIndex + 4;  // 4, 5
    if (pkgId === 'pkg-prestasi') return tierIndex + 6; // 6
    return tierIndex + 1;
  };

  const getDiscountBadge = (tierName: string) => {
    const lower = tierName.toLowerCase();
    if (lower.includes('5%')) {
      return { text: 'Diskon 5%', color: 'bg-emerald-500 text-white' };
    }
    if (lower.includes('11%')) {
      return { text: 'Diskon 11%', color: 'bg-amber-400 text-slate-950 font-black' };
    }
    if (lower.includes('2.5%') || lower.includes('2,5%')) {
      return { text: 'Diskon 2.5%', color: 'bg-emerald-500 text-white' };
    }
    return null;
  };

  return (
    <section className="py-20 bg-gradient-to-b from-sky-50/60 via-white to-slate-50 relative overflow-hidden" id="biaya-paket-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-200 mb-3 shadow-xs">
            <Tag className="w-3.5 h-3.5 text-cyan-600" />
            <span>Price List & Pilihan Paket Latihan Renang</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-slate-900 tracking-tight">
            Price List DS AQUATICS
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-3 leading-relaxed">
            Belajar renang untuk semua usia dengan bimbingan pelatih berpengalaman. Pilih paket sesuai kebutuhan Anda—mulai dari kelas reguler kelompok, privat intensif satu pelatih satu murid, hingga paket group bulanan.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-heading font-bold text-xs sm:text-sm shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Promo Spesial: Gratis Biaya Pendaftaran!</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 font-semibold text-xs sm:text-sm shadow-xs">
              <Percent className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <span>Hemat hingga Diskon 11% untuk Paket Multi Pertemuan</span>
            </div>
          </div>
        </div>

        {/* 3 Structured Category Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {(sortedPackages || []).map((pkg: PricePackage) => {
            if (!pkg) return null;
            const isPrivat = pkg.category === 'privat';
            const isPrestasi = pkg.category === 'group_prestasi';
            const tiers = pkg.pricingTiers || [];
            const activeIndex = activeTierByPkg[pkg.id] ?? 0;
            const safeActiveIndex = activeIndex < tiers.length ? activeIndex : 0;
            const selectedTier = tiers[safeActiveIndex] || tiers[0];

            return (
              <div
                key={pkg.id}
                className={`group relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 card-3d ${
                  isPrivat
                    ? 'bg-gradient-to-b from-cyan-700 via-sky-700 to-blue-800 text-white shadow-2xl shadow-cyan-900/30 ring-2 ring-cyan-400'
                    : isPrestasi
                    ? 'bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 text-white shadow-xl shadow-indigo-950/40 border border-indigo-500/30'
                    : 'bg-white text-slate-900 border border-cyan-100 shadow-xl shadow-slate-200/50 hover:border-cyan-400'
                }`}
              >
                {/* Popular Pill for Privat */}
                {isPrivat && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider shadow-md whitespace-nowrap flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Paling Diminati & Cepat Mahir</span>
                  </div>
                )}

                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div
                      className={`p-3.5 rounded-2xl ${
                        isPrivat
                          ? 'bg-white/20 text-amber-300'
                          : isPrestasi
                          ? 'bg-indigo-500/20 text-cyan-300'
                          : 'bg-cyan-100 text-cyan-700'
                      }`}
                    >
                      {isPrivat ? (
                        <UserCheck className="w-6 h-6" />
                      ) : isPrestasi ? (
                        <Trophy className="w-6 h-6" />
                      ) : (
                        <Users className="w-6 h-6" />
                      )}
                    </div>

                    <span
                      className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-bold ${
                        isPrivat
                          ? 'bg-white/20 text-white border border-white/30'
                          : isPrestasi
                          ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/30'
                          : 'bg-cyan-100 text-cyan-800'
                      }`}
                    >
                      {pkg.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-heading font-black tracking-tight mb-2">
                    {pkg.title}
                  </h3>
                  <p
                    className={`text-xs sm:text-sm mb-6 leading-relaxed ${
                      isPrivat || isPrestasi ? 'text-slate-200' : 'text-slate-600'
                    }`}
                  >
                    {pkg.subtitle}
                  </p>

                  {/* Interactive Pricing Tiers Selection */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isPrivat || isPrestasi ? 'text-cyan-200' : 'text-slate-500'
                        }`}
                      >
                        Pilihan Paket:
                      </span>
                      <span
                        className={`text-[11px] font-medium ${
                          isPrivat || isPrestasi ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        Pilih untuk mendaftar
                      </span>
                    </div>

                    <div className="space-y-3">
                      {tiers.map((tier, idx) => {
                        const isSelected = safeActiveIndex === idx;
                        const officialNum = getOfficialNumber(pkg.id, idx);
                        const discount = getDiscountBadge(tier.name);
                        const cleanName = getStandardTierName(tier);
                        const displayPrice = getStandardFormattedPrice(tier, pkg.id);

                        return (
                          <div
                            key={idx}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setActiveTierByPkg((prev) => ({ ...prev, [pkg.id]: idx }));
                              onSelectPackage(`${pkg.id}::${idx}`);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                setActiveTierByPkg((prev) => ({ ...prev, [pkg.id]: idx }));
                                onSelectPackage(`${pkg.id}::${idx}`);
                              }
                            }}
                            className={`w-full text-left p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer border flex flex-col justify-between gap-2.5 ${
                              isSelected
                                ? isPrivat
                                  ? 'bg-white text-slate-900 border-amber-400 shadow-lg ring-2 ring-amber-400/50 scale-[1.01]'
                                  : isPrestasi
                                  ? 'bg-slate-800 text-white border-cyan-400 shadow-lg ring-2 ring-cyan-400/50 scale-[1.01]'
                                  : 'bg-cyan-50/90 text-slate-900 border-cyan-500 shadow-md ring-2 ring-cyan-400/40 scale-[1.01]'
                                : isPrivat
                                ? 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                                : isPrestasi
                                ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                                : 'bg-slate-50 hover:bg-slate-100/90 text-slate-800 border-slate-200'
                            }`}
                          >
                            {/* Row 1: Number + Clean Name + Discount Chip */}
                            <div className="flex items-start gap-2.5 w-full">
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-heading font-black shrink-0 mt-0.5 ${
                                  isSelected
                                    ? isPrivat
                                      ? 'bg-cyan-600 text-white'
                                      : isPrestasi
                                      ? 'bg-cyan-400 text-slate-950'
                                      : 'bg-cyan-600 text-white'
                                    : isPrivat || isPrestasi
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {officialNum}
                              </span>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`font-heading font-bold text-sm leading-snug ${
                                      isSelected
                                        ? isPrestasi
                                          ? 'text-white'
                                          : 'text-slate-950'
                                        : isPrivat || isPrestasi
                                        ? 'text-white'
                                        : 'text-slate-900'
                                    }`}
                                  >
                                    {cleanName}
                                  </span>
                                  {discount && (
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shadow-xs shrink-0 ${discount.color}`}
                                    >
                                      {discount.text}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Row 2: Sessions count + Standard Rupiah Price + Action */}
                            <div
                              className={`pt-2 border-t flex items-center justify-between gap-3 w-full ${
                                isPrestasi
                                  ? 'border-white/15'
                                  : isPrivat && isSelected
                                  ? 'border-slate-200'
                                  : isPrivat
                                  ? 'border-white/15'
                                  : 'border-cyan-200/70'
                              }`}
                            >
                              <span
                                className={`text-xs ${
                                  isSelected
                                    ? isPrestasi
                                      ? 'text-slate-300 font-medium'
                                      : 'text-slate-700 font-semibold'
                                    : isPrivat || isPrestasi
                                    ? 'text-slate-200'
                                    : 'text-slate-600 font-medium'
                                }`}
                              >
                                {isPrestasi
                                  ? '3x Seminggu (12 Sesi)'
                                  : `${tier.sessionsCount} Kali Pertemuan`}
                              </span>

                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`font-heading font-black text-sm sm:text-base whitespace-nowrap ${
                                    isSelected
                                      ? isPrestasi
                                        ? 'text-amber-400 font-black'
                                        : 'text-cyan-800 font-black'
                                      : isPrivat || isPrestasi
                                      ? 'text-amber-300 font-bold'
                                      : 'text-slate-900 font-bold'
                                  }`}
                                >
                                  {displayPrice}
                                </span>
                                <span
                                  className={`text-[11px] font-bold ${
                                    isSelected
                                      ? isPrestasi
                                        ? 'text-cyan-300'
                                        : 'text-cyan-700'
                                      : isPrivat || isPrestasi
                                      ? 'text-cyan-200'
                                      : 'text-cyan-600'
                                  }`}
                                >
                                  Daftar &rarr;
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Features bullet list */}
                  <div className="mb-6 pt-4 border-t border-current/15">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider block mb-3 ${
                        isPrivat || isPrestasi ? 'text-cyan-200' : 'text-slate-500'
                      }`}
                    >
                      Fasilitas & Keuntungan:
                    </span>
                    <ul className="space-y-2.5 text-xs sm:text-sm">
                      {(pkg.features || []).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <CheckCircle2
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              isPrivat
                                ? 'text-amber-300'
                                : isPrestasi
                                ? 'text-cyan-400'
                                : 'text-cyan-600'
                            }`}
                          />
                          <span
                            className={
                              isPrivat || isPrestasi ? 'text-slate-200' : 'text-slate-600'
                            }
                          >
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom Card Note */}
                <div className="pt-4 border-t border-current/15">
                  <p
                    className={`text-xs text-center leading-relaxed ${
                      isPrivat || isPrestasi ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {pkg.note}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Join Now! Banner */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border border-cyan-500/30 text-white shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-left sm:max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pendaftaran Online Terbuka Setiap Hari</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-white">
              Siap Belajar Renang Bersama DS AQUATICS?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
              Klik <strong>Join Now!</strong> untuk membuka formulir pendaftaran. Anda dapat memilih paket latihan yang sesuai langsung di dalam formulir.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectPackage('pkg-privat::1')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-heading font-black text-base shadow-xl shadow-amber-400/30 flex items-center justify-center gap-2 shrink-0 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-slate-950" />
            <span>Join Now!</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Value Props Bar */}
        <div className="mt-16 bg-white rounded-3xl p-6 sm:p-8 border border-cyan-100 shadow-lg grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-heading font-bold text-slate-900 text-sm">
              Pelatih Bersertifikat
            </h4>
            <p className="text-xs text-slate-500">Berpengalaman & ramah anak</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <h4 className="font-heading font-bold text-slate-900 text-sm">
              Metode Terstruktur
            </h4>
            <p className="text-xs text-slate-500">Kurikulum bertahap</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-heading font-bold text-slate-900 text-sm">
              Sesuai Usia & Skill
            </h4>
            <p className="text-xs text-slate-500">Mulai balita hingga dewasa</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h4 className="font-heading font-bold text-slate-900 text-sm">
              Bangun Percaya Diri
            </h4>
            <p className="text-xs text-slate-500">Hilangkan rasa takut air</p>
          </div>

          <div className="col-span-2 md:col-span-1 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <h4 className="font-heading font-bold text-slate-900 text-sm">
              Kebugaran & Prestasi
            </h4>
            <p className="text-xs text-slate-500">Siap jenjang kejuaraan</p>
          </div>
        </div>
      </div>
    </section>
  );
};
