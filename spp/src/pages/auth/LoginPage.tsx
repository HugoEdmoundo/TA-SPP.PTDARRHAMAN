import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../components/ui/ToastContext';
import { Button, Card } from '../../components/ui';
import type { Role } from '../../types';
import { Lock, Mail, Shield, UserCheck, Sparkles, ArrowRight, Rocket, Users } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('ADMIN');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { settings } = useSettings();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      error('Input Tidak Lengkap', 'Mohon masukkan email/username dan kata sandi Anda.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, selectedRole);
      success('Login Berhasil', `Selamat datang kembali di portal SPP ${settings.name}.`);
      if (selectedRole === 'WALI') {
        navigate('/wali');
      } else {
        navigate('/admin');
      }
    } catch {
      error('Gagal Masuk', 'Email atau kata sandi tidak sesuai. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Auto-Fill & Login
  const handleDemoLogin = (demoEmail: string, demoRole: Role) => {
    setEmail(demoEmail);
    setPassword('pesantrendemo123');
    setSelectedRole(demoRole);
  };

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Decorative Background Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold-accent/15 rounded-full blur-3xl pointer-events-none" />

      <Card variant="glass" padding="lg" className="max-w-md w-full z-10 shadow-2xl border-2 border-white">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white p-2 mx-auto mb-4 shadow-md border border-slate/10 flex items-center justify-center">
            <img
              src={settings.logo || '/download.png'}
              alt="Logo Sekolah"
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-obsidian tracking-tight leading-tight mb-1 font-heading">
            {settings.name || 'PTDARRAHMAN'}
          </h1>
          <p className="text-xs sm:text-sm text-slate font-medium">
            Sistem Pembayaran SPP & Keuangan Pesantren
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate/10 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setSelectedRole('ADMIN')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              selectedRole === 'ADMIN' || selectedRole === 'SUPERADMIN'
                ? 'bg-white text-emerald-primary shadow-sm scale-[1.02]'
                : 'text-slate-dark hover:text-obsidian'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Staf / Admin</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('WALI')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              selectedRole === 'WALI'
                ? 'bg-white text-emerald-primary shadow-sm scale-[1.02]'
                : 'text-slate-dark hover:text-obsidian'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Wali Santri</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-obsidian mb-1.5">
              Email atau Username
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-light absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="contoh: admin@ptdarrahman.sch.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate/20 text-sm font-semibold text-obsidian placeholder:text-slate-light focus:outline-none focus:ring-2 focus:ring-emerald-primary/20 focus:border-emerald-primary shadow-2xs transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-obsidian">
                Kata Sandi
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Hubungi Superadmin / Tata Usaha untuk reset sandi.'); }} className="text-xs font-semibold text-emerald-primary hover:underline">
                Lupa Sandi?
              </a>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-light absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate/20 text-sm font-semibold text-obsidian placeholder:text-slate-light focus:outline-none focus:ring-2 focus:ring-emerald-primary/20 focus:border-emerald-primary shadow-2xs transition-all"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            className="mt-2 font-extrabold shadow-lg"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Masuk ke Portal
          </Button>
        </form>

        {/* Quick Demo Login Banner */}
        <div className="mt-8 pt-6 border-t border-dashed border-slate/20 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-3 text-xs font-extrabold text-gold-dark uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-gold-accent" />
            <span>Akses Cepat Demo</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin@ptdarrahman.sch.id', 'ADMIN')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-light/60 hover:bg-emerald-primary hover:text-white text-emerald-primary text-xs font-bold border border-emerald-primary/20 transition-all active:scale-95 text-center shadow-2xs group"
            >
              <Rocket className="w-3.5 h-3.5 text-emerald-primary group-hover:text-white transition-colors" />
              <span>Demo Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('wali@ptdarrahman.sch.id', 'WALI')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gold-bg hover:bg-gold-accent hover:text-obsidian text-gold-dark text-xs font-bold border border-gold-accent/40 transition-all active:scale-95 text-center shadow-2xs group"
            >
              <Users className="w-3.5 h-3.5 text-gold-dark group-hover:text-obsidian transition-colors" />
              <span>Demo Wali</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
