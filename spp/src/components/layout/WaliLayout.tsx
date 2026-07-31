import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { api } from '@/api/client';
import {
  Home,
  CreditCard,
  History,
  User as UserIcon,
  LogOut,
  WifiOff,
  ChevronDown,
  Sparkles,
  HeartHandshake,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import { BottomSheet } from '@/components/ui/BottomSheet';

export const WaliLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isChildSelectorOpen, setIsChildSelectorOpen] = useState(false);

  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>({
    id: 'empty',
    name: 'Belum Ada Santri Terhubung',
    nis: '-',
    grade: '-',
  });

  useEffect(() => {
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
  }, []);

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

  const currentTitle =
    navItems.find((m) =>
      m.exact ? location.pathname === m.path : location.pathname.startsWith(m.path)
    )?.label || 'Portal Wali Santri';

  const isActive = (item: (typeof navItems)[number]) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none pb-20 md:pb-8">
      {isOffline && (
        <div className="bg-gradient-to-r from-destructive to-[#C92A20] text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md animate-slide-down">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Koneksi terputus. Menampilkan data tersimpan dalam mode offline.</span>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-2.5 sm:px-4 md:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0 flex-1 md:flex-initial" onClick={() => navigate('/wali')}>
            <img
              src={settings.logo || '/download.png'}
              alt="Logo"
              className="w-7 h-7 sm:w-9 sm:h-9 object-contain rounded-xl bg-muted p-0.5 border shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-xs sm:text-sm md:text-base font-extrabold text-foreground leading-tight tracking-tight truncate font-heading">
                PTDARRAHMAN
              </h1>
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-muted-foreground font-medium truncate">
                <span className="hidden sm:inline">Portal Wali • </span>
                <span className="text-primary font-bold truncate">{currentTitle}</span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1.5 bg-muted/60 backdrop-blur p-1.5 rounded-xl border">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', active && 'stroke-[2.25]')} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3 ml-auto md:ml-0 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsChildSelectorOpen(true)}
              className="gap-1.5 h-8 px-2 sm:h-9 sm:px-3 text-xs font-bold text-primary"
            >
              <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
              <span className="max-w-[70px] sm:max-w-[150px] truncate">
                {selectedChild.name.split(' ')[0]}{' '}
                <span className="hidden sm:inline">({selectedChild.grade})</span>
              </span>
              {childrenList.length > 1 && <ChevronDown className="h-3.5 w-3.5 opacity-80 shrink-0" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2.5 px-1.5 py-1.5 h-auto sm:px-2.5 rounded-xl">
                  <Avatar className="h-7 w-7 rounded-xl bg-primary text-primary-foreground">
                    <AvatarFallback className="text-xs font-bold">
                      {user?.name?.[0] || 'W'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:block text-left">
                    <span className="block text-xs font-bold leading-tight truncate max-w-[110px]">
                      {user?.name || 'Wali Santri'}
                    </span>
                    <span className="block text-[9px] font-extrabold text-primary uppercase tracking-wider">
                      WALI
                    </span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-bold text-foreground truncate">{user?.name || 'Wali Santri'}</p>
                  <p className="text-xs font-normal text-muted-foreground truncate">
                    {user?.email || 'wali@ptdarrahman.sch.id'}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/wali/profile')}>
                  <UserIcon className="h-4 w-4 text-primary" />
                  <span>Profil Saya</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  <span>Keluar / Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 animate-fade-in">
        <Outlet context={{ selectedChild }} />
      </main>

      <nav
        className="md:hidden telegram-floating-dock pb-safe"
        aria-label="Navigasi Bawah Telegram Style"
      >
        <div className="flex items-center justify-around gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={item.label}
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
              </NavLink>
            );
          })}
        </div>
      </nav>

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
                  'flex items-center gap-3.5 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer active:scale-[0.99] group',
                  isSelected
                    ? 'bg-primary/10 border-primary shadow-sm'
                    : 'bg-card border-border hover:border-primary/40 hover:bg-accent'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-base shrink-0 transition-all duration-200',
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                  )}
                >
                  {child.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    'text-sm font-bold leading-snug truncate transition-colors duration-200',
                    isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
                  )}>
                    {child.name}
                  </h4>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    NIS: {child.nis} &nbsp;•&nbsp; Kelas {child.grade}
                  </span>
                </div>
                <div
                  className={cn(
                    'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 transition-all duration-200',
                    isSelected
                      ? 'bg-primary text-primary-foreground scale-100 opacity-100'
                      : 'opacity-0 scale-75'
                  )}
                >
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
