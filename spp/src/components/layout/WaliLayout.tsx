import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../utils';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { api } from '../../api/client';
import { 
  Home, 
  CreditCard, 
  History, 
  User as UserIcon, 
  LogOut, 
  WifiOff, 
  ChevronDown, 
  Sparkles,
  HeartHandshake
} from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';

export const WaliLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { settings, isConnectedSSE } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const isDemo = user?.email === 'demo' || user?.email === 'demo_wali' || user?.name?.toLowerCase().includes('demo');

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isChildSelectorOpen, setIsChildSelectorOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  const mockChildren = [
    { id: 'std-01', name: "Muhammad Faiz Syafi'i", nis: '20240105', grade: 'XI-IPA-1' },
    { id: 'std-02', name: "Aisyah Zahra Syafi'i", nis: '20250218', grade: 'X-A' },
  ];

  const [childrenList, setChildrenList] = useState<any[]>(isDemo ? mockChildren : []);
  const [selectedChild, setSelectedChild] = useState<any>(isDemo ? mockChildren[0] : {
    id: 'empty',
    name: 'Belum Ada Santri Terhubung',
    nis: '-',
    grade: '-',
  });

  useEffect(() => {
    if (isDemo) {
      setChildrenList(mockChildren);
      setSelectedChild(mockChildren[0]);
      return;
    }
    const fetchChildren = async () => {
      try {
        const res = await api.get('/my/children');
        const list = res.data || [];
        setChildrenList(list);
        if (list.length > 0) {
          setSelectedChild(list[0]);
        } else {
          setSelectedChild({ id: 'empty', name: 'Belum Ada Santri Terhubung', nis: '-', grade: '-' });
        }
      } catch (err) {
        console.error('Failed to fetch wali children:', err);
      }
    };
    fetchChildren();
  }, [isDemo]);

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

  // Offline network status listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { label: 'Beranda', path: '/wali', icon: Home, exact: true },
    { label: 'Tagihan SPP', path: '/wali/spp', icon: CreditCard, badge: '1' },
    { label: 'Event & Infaq', path: '/wali/event', icon: HeartHandshake, badge: 'NEW' },
    { label: 'Riwayat', path: '/wali/history', icon: History },
    { label: 'Profil', path: '/wali/profile', icon: UserIcon },
  ];

  const currentTitle = navItems.find((m) => 
    m.exact ? location.pathname === m.path : location.pathname.startsWith(m.path)
  )?.label || 'Portal Wali Santri';

  return (
    <div className="min-h-screen text-obsidian flex flex-col font-sans select-none pb-20 md:pb-8 bg-[#F7F5F0]">
      {/* Offline Resilience Banner */}
      {isOffline && (
        <div className="bg-gradient-to-r from-rose-danger to-[#C92A20] text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md animate-slide-down">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Koneksi terputus. Menampilkan data tersimpan dalam mode offline.</span>
        </div>
      )}

      {/* Sleek Liquid Glass Header Bar (Universal & Responsive) */}
      <header className="sticky top-0 z-30 glass-navbar">
        <div className="max-w-6xl mx-auto px-2.5 sm:px-4 md:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0 flex-1 md:flex-initial" onClick={() => navigate('/wali')}>
            <div className="relative shrink-0">
              <img
                src={settings.logo || '/download.png'}
                alt="Logo"
                className="w-7 h-7 sm:w-9 sm:h-9 object-contain rounded-xl bg-white/80 p-0.5 border border-white/90 shadow-2xs"
              />
              {isConnectedSSE && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2 sm:w-2.5 h-2 sm:h-2.5 bg-emerald-bright border-2 border-white rounded-full" title="Real-time SSE Tersambung" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xs sm:text-sm md:text-base font-extrabold text-obsidian leading-tight tracking-tight truncate font-heading">PTDARRAHMAN</h1>
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate font-medium truncate">
                <span className="hidden sm:inline">Portal Wali • </span>
                <span className="text-emerald-primary font-bold truncate">{currentTitle}</span>
              </div>
            </div>
          </div>

          {/* Tablet & Desktop Widescreen Sleek Pill Navigation (Hidden on Mobile) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/80 shadow-2xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact 
                ? location.pathname === item.path 
                : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200",
                    isActive 
                      ? "bg-emerald-primary text-white shadow-sm scale-[1.02]" 
                      : "text-slate-dark hover:text-obsidian hover:bg-white/70"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "stroke-[2.25]" : "stroke-[1.75]")} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Controls: Interactive Child Selector & Profile Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-3 ml-auto md:ml-0 shrink-0">
            <button
              type="button"
              onClick={() => setIsChildSelectorOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/70 backdrop-blur-md border border-white hover:border-emerald-primary/40 text-emerald-primary text-xs font-bold hover:bg-white hover:shadow-md transition-all active:scale-95 shadow-2xs shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold-accent shrink-0" />
              <span className="max-w-[70px] sm:max-w-[150px] truncate">{selectedChild.name.split(' ')[0]} <span className="hidden sm:inline">({selectedChild.grade})</span></span>
              {childrenList.length > 1 && <ChevronDown className="w-3.5 h-3.5 opacity-80 shrink-0" />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative shrink-0" ref={profileRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl bg-white/40 hover:bg-white/80 transition-all border border-white/60 hover:border-white shadow-2xs active:scale-95"
              >
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-primary to-emerald-light flex items-center justify-center text-xs font-bold text-white shadow-xs shrink-0">
                  {user?.name?.[0] || 'W'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-obsidian leading-tight truncate max-w-[110px]">{user?.name || 'Wali Santri'}</div>
                  <div className="text-[9px] font-extrabold text-emerald-primary uppercase tracking-wider">WALI</div>
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 glass-modal rounded-2xl overflow-hidden animate-fade-in z-50 shadow-xl border border-white">
                  <div className="px-4 py-3 border-b border-white/60 bg-white/50">
                    <p className="text-sm font-bold text-obsidian truncate">{user?.name || 'Wali Santri'}</p>
                    <p className="text-xs text-slate truncate">{user?.email || 'wali@ptdarrahman.sch.id'}</p>
                  </div>
                  <div className="py-1.5 px-1">
                    <button
                      type="button"
                      onClick={() => { setIsProfileOpen(false); navigate('/wali/profile'); }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-dark hover:bg-white/90 hover:text-emerald-primary transition-all flex items-center gap-2.5"
                    >
                      <UserIcon className="w-4 h-4 text-emerald-primary" />
                      <span>Profil Saya</span>
                    </button>
                    <button
                      type="button"
                      onClick={logout}
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 animate-fade-in">
        <Outlet context={{ selectedChild }} />
      </main>

      {/* Mobile Telegram Translucent Floating Dock Navigation Bar */}
      <nav
        className="md:hidden telegram-floating-dock pb-safe"
        aria-label="Navigasi Bawah Telegram Style"
      >
        <div className="flex items-center justify-around gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={item.label}
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
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Child Selector BottomSheet */}
      <BottomSheet
        isOpen={isChildSelectorOpen}
        onClose={() => setIsChildSelectorOpen(false)}
        title="Pilih Santri"
        subtitle="Tampilkan tagihan dan riwayat pembayaran"
        className="sm:max-w-md"
      >
        <div className="flex flex-col gap-2.5">
          {childrenList.map((child) => {
            const isSelected = child.id === selectedChild.id;
            return (
              <div
                key={child.id}
                onClick={() => {
                  setSelectedChild(child);
                  setIsChildSelectorOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3.5 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer active:scale-[0.99] group",
                  isSelected
                    ? "bg-emerald-primary/10 border-emerald-primary shadow-sm"
                    : "bg-white/60 border-white/80 hover:border-emerald-primary/40 hover:bg-white hover:shadow-sm"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-base shrink-0 transition-all duration-200",
                  isSelected
                    ? "bg-emerald-primary text-white shadow-sm"
                    : "bg-emerald-primary/10 text-emerald-primary group-hover:bg-emerald-primary group-hover:text-white"
                )}>
                  {child.name.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    "text-sm font-bold leading-snug truncate transition-colors duration-200",
                    isSelected ? "text-emerald-primary" : "text-obsidian group-hover:text-emerald-primary"
                  )}>{child.name}</h4>
                  <span className="text-[11px] text-slate font-medium">
                    NIS: {child.nis} &nbsp;•&nbsp; Kelas {child.grade}
                  </span>
                </div>

                {/* Check Indicator */}
                <div className={cn(
                  "w-6 h-6 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 transition-all duration-200",
                  isSelected
                    ? "bg-emerald-primary text-white shadow-2xs scale-100 opacity-100"
                    : "opacity-0 scale-75"
                )}>
                  ✓
                </div>
              </div>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
};
