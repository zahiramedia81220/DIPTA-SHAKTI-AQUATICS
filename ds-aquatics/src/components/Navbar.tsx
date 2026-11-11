import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DsLogo } from './DsLogo';
import {
  Menu,
  X,
  UserCheck,
  Shield,
  ShoppingBag,
  Calendar,
  Sparkles,
  LogOut,
  ChevronRight,
} from 'lucide-react';

interface NavbarProps {
  onOpenJoinModal: () => void;
  onOpenLoginModal: () => void;
  onOpenSwimGearModal: () => void;
  onNavigateToSchedule?: () => void;
  onOpenScheduleModal?: () => void;
  onOpenAdminPanel?: () => void;
  onOpenAdminModal?: () => void;
  onOpenMemberPanel?: () => void;
  onOpenMemberModal?: () => void;
  onScrollToSection?: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenJoinModal,
  onOpenLoginModal,
  onOpenSwimGearModal,
  onNavigateToSchedule,
  onOpenScheduleModal,
  onOpenAdminPanel,
  onOpenAdminModal,
  onOpenMemberPanel,
  onOpenMemberModal,
  onScrollToSection,
}) => {
  const { settings, currentUser, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const triggerAdminPanel = () => {
    if (onOpenAdminModal) onOpenAdminModal();
    else if (onOpenAdminPanel) onOpenAdminPanel();
    setMobileMenuOpen(false);
  };

  const triggerMemberPanel = () => {
    if (onOpenMemberModal) onOpenMemberModal();
    else if (onOpenMemberPanel) onOpenMemberPanel();
    setMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const handleScheduleClick = () => {
    if (onScrollToSection) {
      onScrollToSection('jadwal-section');
    } else if (onNavigateToSchedule) {
      onNavigateToSchedule();
    }
    setMobileMenuOpen(false);
  };

  const handleGearClick = () => {
    onOpenSwimGearModal();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-cyan-100 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Name */}
          <div
            onClick={scrollToTop}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none min-w-0"
            id="navbar-brand"
          >
            <DsLogo
              size={42}
              customLogoUrl={settings?.logoUrl}
              showText={false}
            />
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-black text-base sm:text-2xl text-slate-900 tracking-tight leading-none group-hover:text-cyan-700 transition-colors truncate max-w-[220px] sm:max-w-none">
                {settings?.clubName || 'DS AQUATICS'}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-cyan-600 tracking-wide mt-0.5 sm:mt-1 truncate max-w-[220px] sm:max-w-none">
                {settings?.slogan || 'Learn to Swim, Learn for Life.'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2" id="desktop-nav">
            <button
              onClick={scrollToTop}
              id="nav-btn-beranda"
              className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-cyan-700 hover:bg-cyan-50/70 rounded-lg transition-colors"
            >
              Beranda
            </button>

            <button
              onClick={handleScheduleClick}
              id="nav-btn-jadwal"
              className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-cyan-700 hover:bg-cyan-50/70 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4 text-cyan-600" />
              <span>Jadwal Latihan</span>
            </button>

            <button
              onClick={handleGearClick}
              id="nav-btn-gear"
              className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-cyan-700 hover:bg-cyan-50/70 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4 text-cyan-600" />
              <span>Perlengkapan Renang</span>
            </button>
          </nav>

          {/* Right Action Buttons: Login / User status */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Login / Profile Button */}
            {currentUser.role === 'admin' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerAdminPanel}
                  id="nav-btn-admin"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all"
                >
                  <Shield className="w-4 h-4" />
                  <span>Panel Coach</span>
                </button>
                <button
                  onClick={logout}
                  title="Keluar Akun Coach"
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : currentUser.role === 'member' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerMemberPanel}
                  id="nav-btn-member"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-cyan-700 hover:bg-cyan-800 text-white shadow-sm transition-all"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Portal Member</span>
                </button>
                <button
                  onClick={logout}
                  title="Keluar Akun Member"
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLoginModal}
                id="nav-btn-login"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all active:scale-95"
              >
                <span>Login</span>
              </button>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              id="mobile-menu-toggle"
              className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-hidden border border-slate-200/60"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-cyan-100 bg-white/98 px-4 pt-3 pb-6 shadow-xl space-y-3 animate-in slide-in-from-top duration-200">
          <button
            onClick={scrollToTop}
            className="w-full flex items-center justify-between px-3 py-2 text-left font-semibold text-slate-800 hover:bg-cyan-50 rounded-lg"
          >
            <span>Beranda</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={handleScheduleClick}
            className="w-full flex items-center justify-between px-3 py-2 text-left font-semibold text-slate-800 hover:bg-cyan-50 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-600" />
              <span>Jadwal Latihan</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={handleGearClick}
            className="w-full flex items-center justify-between px-3 py-2 text-left font-semibold text-slate-800 hover:bg-cyan-50 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-cyan-600" />
              <span>Perlengkapan Renang</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                onOpenJoinModal();
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 rounded-xl font-heading font-bold text-center text-white bg-gradient-to-r from-cyan-600 to-blue-700 shadow-md"
            >
              Join Now!
            </button>

            {currentUser.role === 'admin' ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={triggerAdminPanel}
                  className="py-2.5 rounded-xl font-semibold text-center text-white bg-amber-500"
                >
                  Panel Coach
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 rounded-xl font-semibold text-center text-red-600 bg-red-50"
                >
                  Keluar
                </button>
              </div>
            ) : currentUser.role === 'member' ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={triggerMemberPanel}
                  className="py-2.5 rounded-xl font-semibold text-center text-white bg-cyan-700"
                >
                  Portal Member
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 rounded-xl font-semibold text-center text-red-600 bg-red-50"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenLoginModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl font-semibold text-center text-slate-700 bg-slate-100 border border-slate-200"
              >
                Login Akun
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
