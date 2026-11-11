import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { DocumentationSection } from './components/DocumentationSection';
import { ScheduleSection } from './components/ScheduleSection';
import { PricelistSection } from './components/PricelistSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { ContactSection } from './components/ContactSection';
import { RegistrationModal } from './components/RegistrationModal';
import { ScheduleRequestModal } from './components/ScheduleRequestModal';
import { SwimGearModal } from './components/SwimGearModal';
import { LoginModal } from './components/LoginModal';
import { MemberPanel } from './components/MemberPanel';
import { AdminPanel } from './components/AdminPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TestimonialFormModal } from './components/TestimonialFormModal';
import { Lock, UserCheck, Sparkles, X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser, sessionTimeoutWarning, clearSessionTimeoutWarning } = useApp();

  // Modal display states
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [preselectedPackageId, setPreselectedPackageId] = useState<string | undefined>(undefined);
  const [joinPrefill, setJoinPrefill] = useState<{ fullName?: string; email?: string }>({});

  const [isScheduleRequestOpen, setIsScheduleRequestOpen] = useState(false);
  const [isSwimGearOpen, setIsSwimGearOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMemberPanelOpen, setIsMemberPanelOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isAuthAlertOpen, setIsAuthAlertOpen] = useState(false);
  const [isTestimonialFormOpen, setIsTestimonialFormOpen] = useState(false);

  // Link langsung: ?form=join | testimoni | perlengkapan (juga #join / #testimoni / #perlengkapan)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = (params.get('form') || window.location.hash.replace('#', '')).toLowerCase();
    if (target === 'join' || target === 'daftar') setIsJoinModalOpen(true);
    else if (target === 'testimoni' || target === 'testimonial') setIsTestimonialFormOpen(true);
    else if (target === 'perlengkapan' || target === 'produk' || target === 'gear') setIsSwimGearOpen(true);
    else return;
    // Bersihkan URL agar refresh tidak membuka formulir lagi
    params.delete('form');
    const qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }, []);

  // Close authenticated panels if session logged out (including 15-min auto logout)
  useEffect(() => {
    if (currentUser.role === 'guest') {
      setIsMemberPanelOpen(false);
      setIsAdminPanelOpen(false);
    }
  }, [currentUser.role]);

  // Smooth scroll handler
  const handleScrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Open Join modal with optional specific package
  const handleOpenJoin = (packageId?: string) => {
    setPreselectedPackageId(packageId);
    setIsJoinModalOpen(true);
  };

  const handlePushJoinNow = (prefill?: { fullName?: string; email?: string }) => {
    if (prefill) {
      setJoinPrefill(prefill);
    }
    setIsLoginOpen(false);
    setIsJoinModalOpen(true);
  };

  // Handlers for locked schedule request
  const handleScheduleRequestClick = () => {
    if (currentUser.role === 'member' || currentUser.role === 'admin') {
      setIsScheduleRequestOpen(true);
    } else {
      setIsAuthAlertOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col selection:bg-cyan-500 selection:text-white overflow-x-hidden w-full max-w-full">
      {/* 1. Header / Navbar */}
      <Navbar
        onOpenJoinModal={() => handleOpenJoin()}
        onOpenScheduleModal={handleScheduleRequestClick}
        onOpenSwimGearModal={() => setIsSwimGearOpen(true)}
        onOpenLoginModal={() => setIsLoginOpen(true)}
        onOpenAdminModal={() => setIsAdminPanelOpen(true)}
        onOpenMemberModal={() => setIsMemberPanelOpen(true)}
        onScrollToSection={handleScrollTo}
      />

      <main className="flex-1">
        {/* A.1 Hero Section */}
        <HeroSection
          onOpenJoinModal={() => handleOpenJoin()}
          onOpenScheduleRequest={handleScheduleRequestClick}
          onNavigateToSchedule={() => handleScrollTo('jadwal-section')}
        />

        {/* A.2 Sub Section 1: Dokumentasi Bergerak 60s */}
        <DocumentationSection />

        {/* A.3 Sub Section 2: Jadwal Latihan Mingguan & Matriks */}
        <ScheduleSection
          onOpenScheduleRequest={handleScheduleRequestClick}
          onPromptAuthRequired={() => setIsAuthAlertOpen(true)}
        />

        {/* A.4 Sub Section 3: Biaya & Pilihan Paket Latihan */}
        <PricelistSection onSelectPackage={(pkgId) => handleOpenJoin(pkgId)} />

        {/* A.5 Sub Section 4: Testimonial Slider */}
        <TestimonialsSection />

        {/* A.6 Sub Section 5: Kontak Kami, Maps & Footnote */}
        <ContactSection />
      </main>

      {/* ======================================================== */}
      {/* MODALS & OVERLAYS                                        */}
      {/* ======================================================== */}

      {/* Registration / Join Now Modal */}
      {isJoinModalOpen && (
        <RegistrationModal
          isOpen={isJoinModalOpen}
          onClose={() => {
            setIsJoinModalOpen(false);
            setJoinPrefill({});
          }}
          preselectedPackageId={preselectedPackageId}
          prefilledName={joinPrefill.fullName}
          prefilledEmail={joinPrefill.email}
        />
      )}

      {isTestimonialFormOpen && <TestimonialFormModal onClose={() => setIsTestimonialFormOpen(false)} />}

      {/* Schedule Request Modal (for authorized member or admin) */}
      {isScheduleRequestOpen && (
        <ScheduleRequestModal
          isOpen={isScheduleRequestOpen}
          onClose={() => setIsScheduleRequestOpen(false)}
        />
      )}

      {/* Swim Gear Product Catalog Modal (Navbar B.3) */}
      {isSwimGearOpen && (
        <SwimGearModal
          isOpen={isSwimGearOpen}
          onClose={() => setIsSwimGearOpen(false)}
        />
      )}

      {/* Login Modal (Top Right of Landing Page) */}
      {isLoginOpen && (
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onPushJoinNow={handlePushJoinNow}
          onSuccessAdmin={() => {
            setIsLoginOpen(false);
            setIsMemberPanelOpen(false);
            setIsAdminPanelOpen(true);
          }}
          onSuccessMember={() => {
            setIsLoginOpen(false);
            setIsAdminPanelOpen(false);
            setIsMemberPanelOpen(true);
          }}
        />
      )}

      {/* Member Dashboard Panel Modal */}
      {isMemberPanelOpen && (
        <ErrorBoundary>
          <MemberPanel
            isOpen={isMemberPanelOpen}
            onClose={() => setIsMemberPanelOpen(false)}
            onOpenScheduleRequest={() => {
              setIsMemberPanelOpen(false);
              setIsScheduleRequestOpen(true);
            }}
            onOpenAdminPanel={() => {
              setIsMemberPanelOpen(false);
              setIsAdminPanelOpen(true);
            }}
          />
        </ErrorBoundary>
      )}

      {/* Admin Dashboard Panel Modal */}
      {isAdminPanelOpen && (
        <ErrorBoundary>
          <AdminPanel
            isOpen={isAdminPanelOpen}
            onClose={() => setIsAdminPanelOpen(false)}
          />
        </ErrorBoundary>
      )}

      {/* Friendly Auth Required Modal for Guest attempting to request schedule */}
      {isAuthAlertOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50 bg-black/75 backdrop-blur-xs flex items-center-safe justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-amber-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-xl font-heading font-black text-slate-900">
                Fitur Khusus Member Terdaftar
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Pengajuan jadwal latihan renang terkunci untuk pengunjung umum. Silakan login menggunakan akun member/admin Anda, atau daftar sebagai member baru.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setIsAuthAlertOpen(false);
                  setIsLoginOpen(true);
                }}
                className="w-full py-3 rounded-xl font-heading font-bold text-sm text-white bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 shadow-md transition-all flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Login Member / Admin</span>
              </button>

              <button
                onClick={() => {
                  setIsAuthAlertOpen(false);
                  handleOpenJoin();
                }}
                className="w-full py-3 rounded-xl font-heading font-bold text-sm text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Daftar Member Baru (Join Now!)</span>
              </button>

              <button
                onClick={() => setIsAuthAlertOpen(false)}
                className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 15-Minute Inactivity Auto-Logout Modal */}
      {sessionTimeoutWarning && (
        <div className="fixed inset-0 overflow-y-auto z-70 bg-black/75 backdrop-blur-xs flex items-center-safe justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-rose-200 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-xl font-heading font-black text-slate-900">
                Sesi Otomatis Berakhir
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                {sessionTimeoutWarning}
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  clearSessionTimeoutWarning();
                  setIsLoginOpen(true);
                }}
                className="w-full py-3 rounded-xl font-heading font-bold text-sm text-white bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Login Kembali</span>
              </button>

              <button
                onClick={() => clearSessionTimeoutWarning()}
                className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Tutup Notifikasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
