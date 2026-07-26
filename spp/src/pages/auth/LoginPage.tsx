import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../components/ui/ToastContext';
import { Button, Card } from '../../components/ui';
import { Lock, User, ArrowRight, Sparkles, Rocket, Users } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { settings } = useSettings();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const executeLogin = async (userVal: string, passVal: string) => {
    if (!userVal || !passVal) {
      error('Input Tidak Lengkap', 'Mohon masukkan username dan kata sandi.');
      return;
    }

    setIsLoading(true);
    try {
      const loggedUser = await login(userVal, passVal);
      success('Login Berhasil', `Selamat datang kembali, ${loggedUser.name}.`);
      
      // Automatic Role-Based Navigation (Unified Auth)
      if (loggedUser.role === 'WALI') {
        navigate('/wali');
      } else {
        navigate('/admin');
      }
    } catch (err: any) {
      error('Gagal Masuk', err.message || 'Username atau password salah.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeLogin(username, password);
  };

  const handleDemoLogin = (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
    executeLogin(demoUser, demoPass);
  };

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold-accent/15 rounded-full blur-3xl pointer-events-none" />

      <Card variant="glass" padding="lg" className="max-w-md w-full z-10 shadow-2xl border-2 border-white">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white p-2 mx-auto mb-4 shadow-md border border-slate/10 flex items-center justify-center">
            <img
              src={settings.logo || `${window.location.origin}/download.png`}
              alt="Logo Sekolah"
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-obsidian tracking-tight leading-tight mb-1 font-heading">
            {settings.name || 'PTD AR-RAHMAN'}
          </h1>
          <p className="text-xs sm:text-sm text-slate font-medium">
            Sistem Pembayaran SPP & Keuangan Pesantren
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-obsidian mb-1.5">
              Username / Email
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-light absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="contoh: admin atau admin_demo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate/20 text-sm font-semibold text-obsidian placeholder:text-slate-light focus:outline-none focus:ring-2 focus:ring-emerald-primary/20 focus:border-emerald-primary shadow-2xs transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-obsidian mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-light absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Masukkan sandi Anda"
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

        <div className="mt-8 pt-6 border-t border-dashed border-slate/20 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-3 text-xs font-extrabold text-gold-dark uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-gold-accent" />
            <span>Akses Instan Mode Showcase (Demo)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin_demo', 'admin123')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-light/60 hover:bg-emerald-primary hover:text-white text-emerald-primary text-xs font-bold border border-emerald-primary/20 transition-all active:scale-95 text-center shadow-2xs group"
            >
              <Rocket className="w-3.5 h-3.5 text-emerald-primary group-hover:text-white transition-colors" />
              <span>Demo Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('demo_wali', 'wali123')}
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

export default LoginPage;
