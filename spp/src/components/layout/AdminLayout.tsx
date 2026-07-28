import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../utils';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { 
  LayoutDashboard, 
  CreditCard, 
  FileText, 
  Calendar, 
  Wallet, 
  BarChart3, 
  ShieldAlert, 
  Settings, 
  Users, 
  UserCheck, 
  Search, 
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  CheckCircle2,
  Grid,
  User,
  History,
  HeartHandshake
} from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { settings, isConnectedSSE } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('spp_admin_sidebar_collapsed') === 'true';
  });
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const profileRef = useRef<HTMLDivElement>(null);

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem('spp_admin_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile more menu on route change
  useEffect(() => {
    setIsMoreMenuOpen(false);
  }, [location.pathname]);

  // Global Spotlight shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isSuperadmin = user?.role === 'SUPERADMIN' || user?.role === 'superadmin' || user?.role === 'SUPER_ADMIN';

  const menuItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'SPP', path: '/admin/spp', icon: CreditCard },
    { label: 'Tagihan Non-SPP', path: '/admin/non-spp', icon: FileText },
    { label: 'Event (Kegiatan)', path: '/admin/event', icon: Calendar },
    { label: 'Kas Infaq', path: '/admin/infaq', icon: HeartHandshake },
    { label: 'Pembayaran Manual', path: '/admin/payment', icon: Wallet },
    { label: 'Log Transaksi Santri', path: '/admin/student-history', icon: History },
    { label: 'Laporan Keuangan', path: '/admin/reports', icon: BarChart3 },
    ...(isSuperadmin ? [{ label: 'Audit Log & History', path: '/admin/audit', icon: ShieldAlert }] : []),
    { label: 'Data Siswa', path: '/admin/students', icon: Users },
    { label: 'Data Wali Santri', path: '/admin/parents', icon: UserCheck },
    ...(isSuperadmin ? [{ label: 'Manajemen Pengguna', path: '/admin/users', icon: ShieldAlert }] : []),
    { label: 'Pengaturan Sekolah', path: '/admin/settings', icon: Settings },
  ];

  // Mobile Telegram 5-Tab Bar items
  const mobileTabItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true, isAction: false },
    { label: 'SPP', path: '/admin/spp', icon: CreditCard, exact: false, isAction: false },
    { label: 'Bayar', path: '/admin/payment', icon: Wallet, exact: false, isAction: false, badge: '3' },
    { label: 'Riwayat', path: '/admin/student-history', icon: History, exact: false, isAction: false },
    { label: 'Semua Menu', path: '#', icon: Grid, exact: false, isAction: true, badge: 'NEW' },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentTitle = menuItems.find((m) => 
    m.exact ? location.pathname === m.path : location.pathname.startsWith(m.path)
  )?.label || 'SPP Admin Panel';

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen text-obsidian flex font-sans select-none bg-[#F7F5F0]">
      {/* Sleek Modern Desktop & Tablet Sidebar (Hidden on Mobile) */}
      <aside
        className={cn(
          "hidden md:flex fixed top-0 left-0 z-40 h-screen glass-sidebar transition-all duration-300 flex-col shrink-0",
          isSidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Sidebar Header with Integrated Modern Toggle Button */}
        <div className={cn(
          "flex items-center border-b border-white/60 relative bg-white/40 backdrop-blur-md transition-all h-16",
          isSidebarCollapsed ? "justify-center px-2" : "px-5 justify-between"
        )}>
          <div 
            className={cn("flex items-center gap-3 min-w-0 cursor-pointer", isSidebarCollapsed && "justify-center")} 
            onClick={() => navigate('/admin')}
          >
            <img 
              src={settings.logo || '/download.png'} 
              alt="PTDARRAHMAN" 
              className="w-9 h-9 object-contain shrink-0 rounded-xl bg-white/80 p-0.5 border border-white/90 shadow-2xs" 
            />
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <div className="text-sm font-bold text-obsidian truncate font-heading tracking-tight">PTDARRAHMAN</div>
                <div className="text-[11px] text-emerald-primary font-bold tracking-wide uppercase">SPP Admin</div>
              </div>
            )}
          </div>

          {/* Integrated Sleek Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-xl text-slate hover:text-obsidian hover:bg-white/80 transition-all border border-transparent hover:border-white/90 hover:shadow-2xs shrink-0",
              isSidebarCollapsed ? "absolute -bottom-3 bg-white/90 shadow-sm border-white z-50 rounded-full w-6 h-6" : ""
            )}
            title={isSidebarCollapsed ? 'Buka Sidebar' : 'Lipat Sidebar'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-emerald-primary transition-transform duration-300" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-slate-dark transition-transform duration-300" />
            )}
          </button>
        </div>

        {/* Navigation Links with Sleek Luxury Pill Style */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={isSidebarCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3.5 rounded-xl text-sm transition-all duration-200 group relative",
                  isSidebarCollapsed ? "justify-center p-3" : "px-3.5 py-2.5",
                  isActive 
                    ? "sidebar-item-active scale-[1.01]" 
                    : "text-slate-dark font-medium hover:bg-white/60 hover:text-obsidian hover:shadow-2xs"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4 shrink-0 transition-all duration-200 group-hover:scale-110", 
                  isActive ? "text-emerald-primary stroke-[2.25]" : "text-slate-dark stroke-[1.75] group-hover:text-obsidian"
                )} />
                {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer / Minimal Version Indicator */}
        <div className="p-3 border-t border-white/60 bg-white/30 backdrop-blur-md flex items-center justify-center">
          <span className="text-[11px] font-bold text-slate/80 tracking-wider font-mono select-none">
            {isSidebarCollapsed ? 'v2.0' : 'PTDARRAHMAN v2.0'}
          </span>
        </div>
      </aside>

      {/* Main Container */}
      <div className={cn("flex-1 flex flex-col min-w-0 pb-20 md:pb-0 transition-all duration-300", isSidebarCollapsed ? "md:ml-20" : "md:ml-64")}>
        {/* Sleek Universal Glass Navbar */}
        <header className="sticky top-0 z-30 glass-navbar">
          <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 h-14 sm:h-16">
            {/* Left: Title & Mobile Brand Display */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {/* Mobile Brand / Page Title */}
              <div className="md:hidden flex items-center gap-2 cursor-pointer" onClick={() => navigate('/admin')}>
                <img 
                  src={settings.logo || '/download.png'} 
                  alt="Logo" 
                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg bg-white/80 p-0.5 border border-white/90 shadow-2xs shrink-0" 
                />
                <div className="min-w-0">
                  <div className="text-[9px] sm:text-[10px] font-bold text-emerald-primary uppercase tracking-wider leading-none">PTDARRAHMAN</div>
                  <h1 className="font-heading text-xs sm:text-sm font-extrabold text-obsidian truncate mt-0.5">{currentTitle}</h1>
                </div>
              </div>

              {/* Desktop Title */}
              <h1 className="hidden md:block font-heading text-lg lg:text-xl font-extrabold text-obsidian tracking-tight">
                {currentTitle}
              </h1>
            </div>

            {/* Right Controls: Command Palette Search & Profile Pill */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Sleek Spotlight Trigger */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/60 hover:bg-white/90 text-slate-dark text-xs font-medium transition-all duration-200 border border-white/80 shadow-2xs hover:shadow-md active:scale-95"
              >
                <Search className="w-3.5 h-3.5 text-emerald-primary shrink-0" />
                <span className="hidden sm:inline">Cari Fitur...</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white/90 text-obsidian rounded border border-white shadow-2xs">
                  ⌘K
                </kbd>
              </button>

              {/* SSE Live Sync Badge */}
              {isConnectedSSE && (
                <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-bold text-emerald-primary bg-white/70 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/90 shadow-2xs" title="Real-Time SSE Sync Tersambung">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-primary" />
                  <span>Live Sync</span>
                </div>
              )}

              {/* Profile Dropdown Pill */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl bg-white/40 hover:bg-white/80 transition-all border border-white/60 hover:border-white shadow-2xs active:scale-95"
                >
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-primary to-emerald-light flex items-center justify-center text-xs font-bold text-white shadow-xs shrink-0">
                    {user?.name?.[0] || 'A'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-obsidian leading-tight max-w-[110px] truncate">{user?.name || 'Admin SPP'}</div>
                    <div className="text-[9px] font-extrabold text-emerald-primary uppercase tracking-wider">{user?.role || 'ADMIN'}</div>
                  </div>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 glass-modal rounded-2xl overflow-hidden animate-fade-in z-50 shadow-xl border border-white">
                    <div className="px-4 py-3 border-b border-white/60 bg-white/50">
                      <p className="text-sm font-bold text-obsidian truncate">{user?.name || 'Admin SPP'}</p>
                      <p className="text-xs text-slate truncate">{user?.email || 'admin@ptdarrahman.sch.id'}</p>
                    </div>
                    <div className="py-1.5 px-1">
                      <button
                        type="button"
                        onClick={() => { setIsProfileOpen(false); navigate('/admin/profile'); }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-dark hover:bg-white/90 hover:text-emerald-primary transition-all flex items-center gap-2.5"
                      >
                        <User className="w-4 h-4 text-emerald-primary" />
                        <span>Profil Saya</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsProfileOpen(false); navigate('/admin/settings'); }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-dark hover:bg-white/90 hover:text-emerald-primary transition-all flex items-center gap-2.5"
                      >
                        <Settings className="w-4 h-4 text-emerald-primary" />
                        <span>Pengaturan Sekolah</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-danger hover:bg-rose-danger/10 transition-all flex items-center gap-2.5 mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Keluar / Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Mobile Telegram Translucent Floating Dock Navigation Bar */}
      <nav
        className="md:hidden telegram-floating-dock pb-safe"
        aria-label="Navigasi Bawah Telegram Style"
      >
        <div className="flex items-center justify-around gap-1">
          {mobileTabItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isAction 
              ? isMoreMenuOpen 
              : (item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path));
            
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.isAction) {
                    setIsMoreMenuOpen(true);
                  } else {
                    setIsMoreMenuOpen(false);
                    navigate(item.path);
                  }
                }}
                className={cn(
                  "flex flex-col items-center justify-center py-1.5 px-1 min-w-[54px] flex-1 rounded-xl transition-all duration-300 group active:scale-95",
                  isActive ? "text-telegram-blue font-extrabold" : "text-slate-500 hover:text-obsidian"
                )}
              >
                <div className={cn("relative p-1 rounded-lg transition-all duration-300", isActive && "bg-telegram-blue/15 scale-105 shadow-2xs")}>
                  <Icon 
                    fill={isActive ? 'currentColor' : 'none'}
                    className={cn(
                      "w-5 h-5 sm:w-[22px] sm:h-[22px] transition-transform duration-300 group-hover:scale-110", 
                      isActive ? "text-telegram-blue stroke-[2.25]" : "text-slate-500 stroke-[1.75]"
                    )} 
                  />
                  {/* Badge Unread Count / Status */}
                  {item.badge && (
                    <span className="absolute -top-1 -right-1.5 px-1 py-0 min-w-[14px] h-[14px] rounded-full bg-rose-danger text-white text-[8px] font-extrabold flex items-center justify-center border border-white shadow-2xs animate-pulse-subtle z-10">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[9px] sm:text-[10px] mt-0.5 leading-none tracking-tight truncate max-w-[62px] transition-colors duration-300", 
                  isActive ? "font-extrabold text-telegram-blue" : "font-medium text-slate-500 group-hover:text-obsidian"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Telegram-style Bottom Sheet Grid Menu for 'Semua Menu / Lainnya' */}
      <BottomSheet
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        title="Semua Fitur Admin SPP"
        subtitle="Pilih menu navigasi dengan cepat"
        className="sm:max-w-xl"
      >
        <div className="flex flex-col gap-4">

          {/* Grid Menu items (3-column on mobile, 4-column on wider screen) */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact 
                ? location.pathname === item.path 
                : location.pathname.startsWith(item.path);

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    navigate(item.path);
                  }}
                  className={cn(
                    "p-3 sm:p-3.5 rounded-2xl flex flex-col items-center text-center gap-2 border transition-all active:scale-95 group min-h-[85px] justify-center",
                    isActive 
                      ? "bg-emerald-primary/15 border-emerald-primary shadow-sm" 
                      : "bg-white/60 border-white/80 hover:bg-white hover:border-emerald-primary/40 hover:shadow-2xs"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-2xs shrink-0",
                    isActive ? "bg-emerald-primary text-white" : "bg-emerald-primary/10 text-emerald-primary group-hover:bg-emerald-primary group-hover:text-white"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "text-[11px] sm:text-xs leading-tight line-clamp-2 font-bold",
                    isActive ? "text-emerald-primary font-extrabold" : "text-obsidian group-hover:text-emerald-primary"
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Logout inside BottomSheet for Mobile */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-rose-danger/8 hover:bg-rose-danger/15 border border-rose-danger/20 text-rose-danger font-bold text-sm transition-all duration-200 active:scale-[0.98] group"
            >
              <LogOut className="w-4 h-4 shrink-0 group-hover:-translate-x-0.5 transition-transform duration-200" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Spotlight Search Modal (Ctrl+K / Cmd+K) via Portal */}
      {isSearchOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4 animate-fade-in">
          <div className="fixed inset-0 bg-obsidian/40 backdrop-blur-xs" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-lg glass-modal rounded-2xl overflow-hidden z-10 border border-white shadow-2xl">
            <div className="p-4 border-b border-white/60 flex items-center gap-3 bg-white/60">
              <Search className="w-5 h-5 text-emerald-primary shrink-0" />
              <input
                type="text"
                placeholder="Cari fitur (contoh: SPP, Siswa, Laporan, Kasir)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent text-sm text-obsidian font-semibold focus:outline-none placeholder:text-slate"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-[10px] font-bold text-slate hover:text-obsidian px-2 py-1 rounded-lg bg-white/80 border border-white shadow-2xs cursor-pointer"
              >
                ESC
              </button>
            </div>
            <div className="p-3 max-h-80 overflow-y-auto flex flex-col gap-1 bg-white/40">
              {filteredMenuItems.length === 0 ? (
                <p className="text-xs text-center py-8 text-slate font-medium">Tak ada fitur yang cocok dengan pencarian.</p>
              ) : (
                filteredMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsSearchOpen(false);
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/90 cursor-pointer transition-all group border border-transparent hover:border-white hover:shadow-2xs"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-primary/10 text-emerald-primary flex items-center justify-center group-hover:bg-emerald-primary group-hover:text-white transition-colors shadow-2xs">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-obsidian group-hover:text-emerald-primary transition-colors">{item.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
