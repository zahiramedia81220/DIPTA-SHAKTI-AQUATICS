import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Clock,
  Calendar as CalendarIcon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Waves,
} from 'lucide-react';

interface HeroSectionProps {
  onOpenJoinModal: () => void;
  onOpenScheduleRequest: () => void;
  onNavigateToSchedule: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenJoinModal,
  onOpenScheduleRequest,
  onNavigateToSchedule,
}) => {
  const { settings, activeMembersCount } = useApp();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Real-time clock updating every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Indonesian date and time
  const formattedDate = currentDateTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = currentDateTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });


  return (
    <section className="relative overflow-hidden bg-slate-900 min-h-[580px] lg:min-h-[640px] flex items-center">
      {/* 16:9 Compressible / Dynamic Hero Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={
            settings?.heroBgUrl ||
            'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=1920&auto=format&fit=crop'
          }
          alt="Hero Background DS Aquatics"
          className="w-full h-full object-cover object-center transform scale-105 duration-1000 ease-out"
          referrerPolicy="no-referrer"
        />
        {/* Modern Bright/Navy Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-cyan-950/60 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-black/30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Main Hero Text & CTAs */}
          <div className="lg:col-span-8 text-white space-y-6">
            {/* Real-time Date and Clock Live Badge */}
            <div className="inline-flex flex-wrap items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg text-xs sm:text-sm text-cyan-200 max-w-full">
              <div className="flex items-center gap-1.5 font-medium">
                <CalendarIcon className="w-4 h-4 text-cyan-400" />
                <span className="text-white">{formattedDate}</span>
              </div>
              <span className="text-cyan-400 font-bold">•</span>
              <div className="flex items-center gap-1.5 font-mono font-semibold tracking-wider text-amber-300">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{formattedTime} WIB</span>
              </div>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-cyan-500/30 text-cyan-200 border border-cyan-400/30">
                Realtime
              </span>
            </div>

            {/* Club Name & Hook */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-cyan-300 font-heading font-extrabold text-sm sm:text-base uppercase tracking-widest">
                <Waves className="w-5 h-5 text-cyan-400" />
                <span>{settings?.clubName || 'DS AQUATICS'} — {settings?.slogan || 'Learn to Swim, Learn for Life.'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-heading font-black text-white leading-tight tracking-tight drop-shadow-md">
                Belajar Renang untuk Hidup Lebih Baik Bersama{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300">
                  DS AQUATICS
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-200 max-w-2xl font-normal leading-relaxed">
                {settings?.hookText || 'Klub Renang Profesional untuk Semua Usia.'}
              </p>
            </div>

            {/* Primary CTAs: "Join Now!" & "Pengajuan Jadwal Latihan" */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={onOpenJoinModal}
                id="hero-btn-join"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl font-heading font-bold text-base text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-xl shadow-amber-400/25 active:scale-95 transition-all transform hover:-translate-y-0.5"
              >
                <Sparkles className="w-5 h-5 text-slate-900" />
                <span>Join Now!</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenScheduleRequest}
                id="hero-btn-request-schedule"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-heading font-semibold text-base text-white bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 shadow-lg active:scale-95 transition-all"
              >
                <CalendarIcon className="w-5 h-5 text-cyan-300" />
                <span>Pengajuan Jadwal Latihan</span>
              </button>
            </div>

            {/* Micro Badges */}
            <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Pelatih Berpengalaman & Bersertifikat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Tersedia Kelas Privat & Prestasi</span>
              </div>
            </div>
          </div>

          {/* Right Floating 3D Stats Cards */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4">
            {/* Realtime Members Counter */}
            <div className="flex-1 p-6 rounded-3xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl card-3d">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-cyan-200 uppercase tracking-wider">
                  Member Terdaftar
                </span>
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl lg:text-5xl font-heading font-black text-white tracking-tight">
                  {activeMembersCount}+
                </span>
                <span className="text-sm font-medium text-slate-300">Member Aktif</span>
              </div>
              <p className="text-xs text-slate-300 mt-2">
                Tersebar di kelas Reguler, Privat 1-on-1, dan Group Prestasi Boyolali.
              </p>
            </div>

            {/* Quick Schedule Preview Pill */}
            <div
              onClick={onNavigateToSchedule}
              className="flex-1 p-6 rounded-3xl bg-gradient-to-br from-cyan-600/30 to-blue-900/40 backdrop-blur-xl border border-cyan-400/30 shadow-2xl cursor-pointer hover:border-cyan-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                  Lokasi & Jadwal
                </span>
                <span className="text-xs text-cyan-300 group-hover:translate-x-1 transition-transform">
                  Lihat Matriks →
                </span>
              </div>
              <p className="text-white font-heading font-bold text-base">
                Lestarindo & Front One Adria
              </p>
              <p className="text-xs text-slate-300 mt-1">
                Latihan dibuka setiap hari dengan slot pagi & sore terstruktur.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
