import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { normalizeRole } from '@/utils/role';
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
  UsersRound,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Grid,
  User,
  History,
  HeartHandshake,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { BottomSheet } from '@/components/ui/BottomSheet';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('spp_admin_sidebar_collapsed') === 'true';
  });
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('spp_admin_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    setIsMoreMenuOpen(false);
  }, [location.pathname]);

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

  const isSuperadmin = normalizeRole(user?.role) === 'SUPERADMIN';

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
    { label: 'Data Wali', path: '/admin/wali', icon: UsersRound },
    ...(isSuperadmin ? [{ label: 'Manajemen Pengguna', path: '/admin/users', icon: ShieldAlert }] : []),
    { label: 'Pengaturan Sekolah', path: '/admin/settings', icon: Settings },
  ];

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

  const currentTitle =
    menuItems.find((m) =>
      m.exact ? location.pathname === m.path : location.pathname.startsWith(m.path)
    )?.label || 'SPP Admin Panel';

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const isActive = (item: (typeof menuItems)[number]) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans select-none">
      <aside
        className={cn(
          'hidden md:flex fixed top-0 left-0 z-40 h-screen flex-col shrink-0 border-r bg-card transition-all duration-300',
          isSidebarCollapsed ? 'w-20' : 'w-64'
        )}
      >
        <div
          className={cn(
            'relative flex items-center border-b h-16',
            isSidebarCollapsed ? 'justify-center px-2' : 'px-5'
          )}
        >
          <div
            className={cn(
              'flex items-center gap-3 min-w-0 cursor-pointer',
              isSidebarCollapsed && 'justify-center'
            )}
            onClick={() => navigate('/admin')}
          >
            <img
              src={settings.logo || '/download.png'}
              alt="PTDARRAHMAN"
              className="w-9 h-9 object-contain shrink-0 rounded-xl bg-muted p-0.5 border"
            />
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <div className="text-sm font-bold text-foreground truncate font-heading tracking-tight">
                  PTDARRAHMAN
                </div>
                <div className="text-[11px] text-primary font-bold tracking-wide uppercase">
                  SPP Admin
                </div>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-card border shadow-sm p-0 hover:bg-card hover:text-foreground"
            title={isSidebarCollapsed ? 'Buka Sidebar' : 'Lipat Sidebar'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="h-3.5 w-3.5 text-primary" />
            ) : (
              <PanelLeftClose className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={isSidebarCollapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3.5 rounded-lg text-sm transition-all duration-200 group relative',
                  isSidebarCollapsed ? 'justify-center p-3' : 'px-3.5 py-2.5',
                  active
                    ? 'bg-primary/10 text-primary font-bold border-l-4 border-primary'
                    : 'text-muted-foreground font-medium hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-primary' : '')} />
                {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t flex items-center justify-center">
          <span className="text-[11px] font-bold text-muted-foreground tracking-wider font-mono select-none">
            {isSidebarCollapsed ? 'v2.0' : 'PTDARRAHMAN v2.0'}
          </span>
        </div>
      </aside>

      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 pb-20 md:pb-0 transition-all duration-300',
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        )}
      >
        <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur">
          <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 h-14 sm:h-16">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="md:hidden flex items-center gap-2 cursor-pointer" onClick={() => navigate('/admin')}>
                <img
                  src={settings.logo || '/download.png'}
                  alt="Logo"
                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg bg-muted p-0.5 border shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-wider leading-none">
                    PTDARRAHMAN
                  </div>
                  <h1 className="font-heading text-xs sm:text-sm font-extrabold text-foreground truncate mt-0.5">
                    {currentTitle}
                  </h1>
                </div>
              </div>

              <h1 className="hidden md:block font-heading text-lg lg:text-xl font-extrabold text-foreground tracking-tight">
                {currentTitle}
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSearchOpen(true)}
                className="gap-2 h-9 px-3 text-xs font-medium text-muted-foreground"
              >
                <Search className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="hidden sm:inline">Cari Fitur...</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-muted rounded border">
                  ⌘K
                </kbd>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2.5 px-1.5 h-auto py-1.5 sm:px-2.5 rounded-xl">
                    <Avatar className="h-7 w-7 rounded-xl bg-primary text-primary-foreground">
                      <AvatarFallback className="text-xs font-bold">
                        {user?.name?.[0] || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-left">
                      <span className="block text-xs font-bold leading-tight max-w-[110px] truncate">
                        {user?.name || 'Admin SPP'}
                      </span>
                      <span className="block text-[9px] font-extrabold text-primary uppercase tracking-wider">
                        {user?.role || 'ADMIN'}
                      </span>
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="text-sm font-bold text-foreground truncate">{user?.name || 'Admin SPP'}</p>
                    <p className="text-xs font-normal text-muted-foreground truncate">
                      {user?.email || 'admin@ptdarrahman.sch.id'}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/admin/profile')}>
                    <User className="h-4 w-4 text-primary" />
                    <span>Profil Saya</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                    <Settings className="h-4 w-4 text-primary" />
                    <span>Pengaturan Sekolah</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" />
                    <span>Keluar / Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

      <nav
        className="md:hidden telegram-floating-dock pb-safe"
        aria-label="Navigasi Bawah Telegram Style"
      >
        <div className="flex items-center justify-around gap-1">
          {mobileTabItems.map((item) => {
            const Icon = item.icon;
            const active = item.isAction
              ? isMoreMenuOpen
              : item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

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
                  'flex flex-col items-center justify-center py-1.5 px-1 min-w-[54px] flex-1 rounded-xl transition-all duration-300 group active:scale-95',
                  active ? 'text-telegram-blue font-extrabold' : 'text-slate-500 hover:text-foreground'
                )}
              >
                <div className={cn('relative p-1 rounded-lg transition-all duration-300', active && 'bg-telegram-blue/15 scale-105')}>
                  <Icon
                    fill={active ? 'currentColor' : 'none'}
                    className={cn(
                      'w-5 h-5 sm:w-[22px] sm:h-[22px] transition-transform duration-300 group-hover:scale-110',
                      active ? 'text-telegram-blue stroke-[2.25]' : 'text-slate-500 stroke-[1.75]'
                    )}
                  />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1.5 px-1 py-0 min-w-[14px] h-[14px] rounded-full bg-destructive text-white text-[8px] font-extrabold flex items-center justify-center border animate-pulse z-10">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  'text-[9px] sm:text-[10px] mt-0.5 leading-none tracking-tight truncate max-w-[62px] transition-colors duration-300',
                  active ? 'font-extrabold text-telegram-blue' : 'font-medium text-slate-500 group-hover:text-foreground'
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <BottomSheet
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        title="Semua Fitur Admin SPP"
        subtitle="Pilih menu navigasi dengan cepat"
        className="sm:max-w-xl"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    navigate(item.path);
                  }}
                  className={cn(
                    'p-3 sm:p-3.5 rounded-xl flex flex-col items-center text-center gap-2 border transition-all active:scale-95 group min-h-[85px] justify-center',
                    active
                      ? 'bg-primary/15 border-primary shadow-sm'
                      : 'bg-card border-border hover:bg-accent hover:border-primary/40'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-sm shrink-0',
                    active ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    'text-[11px] sm:text-xs leading-tight line-clamp-2 font-bold',
                    active ? 'text-primary font-extrabold' : 'text-foreground group-hover:text-primary'
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-center gap-2.5 py-3.5 h-auto rounded-xl text-destructive font-bold hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Keluar dari Akun</span>
            </Button>
          </div>
        </div>
      </BottomSheet>

      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 top-[15%] translate-y-0 sm:rounded-xl">
          <DialogHeader className="border-b px-4 py-4">
            <DialogTitle className="sr-only">Cari Fitur</DialogTitle>
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-primary shrink-0" />
              <Input
                type="text"
                placeholder="Cari fitur (contoh: SPP, Siswa, Laporan, Pembayaran Manual)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </DialogHeader>
          <div className="p-3 max-h-80 overflow-y-auto flex flex-col gap-1">
            {filteredMenuItems.length === 0 ? (
              <p className="text-xs text-center py-8 text-muted-foreground font-medium">
                Tak ada fitur yang cocok dengan pencarian.
              </p>
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
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {item.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
