import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, EmptyState, Spinner } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { Phone, Mail, LogOut, Users, School, MessageCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export const WaliProfilePage: React.FC = () => {
  const { user, logout } = useAuth();

  const isDemo = user?.email === 'demo' || user?.email === 'demo_wali' || user?.name?.toLowerCase().includes('demo');

  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemo);

  useEffect(() => {
    if (isDemo) {
      setChildrenList([
        { id: 'std-01', name: "Muhammad Faiz Syafi'i", nis: '20240105', grade: 'XI-IPA-1', status: 'ACTIVE' },
        { id: 'std-02', name: "Aisyah Zahra Syafi'i", nis: '20250218', grade: 'X-A', status: 'ACTIVE' },
      ]);
      setIsLoading(false);
      return;
    }
    const fetchChildren = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/my/children');
        setChildrenList(res.data || []);
      } catch (err) {
        console.error('Failed to load children:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChildren();
  }, [isDemo]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {isDemo && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-100 border border-amber-300 p-4 rounded-2xl text-amber-900 text-xs font-bold">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-700 shrink-0" />
            <span>Mode Showcase Demo: Menampilkan profil akun wali dan data anak santri contoh.</span>
          </div>
        </div>
      )}

      {/* Main Profile Info Card */}
      <Card variant="glass" padding="lg" className="relative overflow-hidden border-2 border-emerald-primary/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-light/50 to-transparent rounded-bl-full pointer-events-none -z-10" />
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-emerald-primary to-emerald-light flex items-center justify-center text-white font-extrabold text-3xl shadow-lg shrink-0 border-4 border-white">
            {user?.name?.charAt(0) || 'W'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-obsidian font-heading truncate">
                {user?.name || 'H. Ahmad Syafi\'i'}
              </h2>
              <Badge status="ACTIVE" className="w-fit mx-auto sm:mx-0">Wali Santri Resmi</Badge>
            </div>
            
            <p className="text-xs text-slate font-medium flex items-center justify-center sm:justify-start gap-1.5 mt-1">
              <Mail className="w-3.5 h-3.5 text-emerald-primary" />
              <span>{user?.email || 'wali_faiz@ptdarrahman.sch.id'}</span>
            </p>

            <p className="text-xs text-slate font-medium flex items-center justify-center sm:justify-start gap-1.5 mt-1">
              <Phone className="w-3.5 h-3.5 text-emerald-primary" />
              <span>+62 812-3456-7890 (Terhubung WhatsApp Kuitansi)</span>
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<LogOut className="w-4 h-4 text-rose-danger" />}
            onClick={logout}
            className="text-rose-danger border-rose-200 hover:bg-rose-50 hover:border-rose-300 font-bold text-xs shrink-0"
          >
            Keluar Aplikasi
          </Button>
        </div>
      </Card>

      {/* Linked Children Card */}
      <Card variant="glass" padding="lg">
        <div className="flex items-center justify-between mb-4 border-b border-slate/10 pb-3">
          <h3 className="text-base font-extrabold text-obsidian flex items-center gap-2 font-heading">
            <Users className="w-5 h-5 text-emerald-primary" />
            <span>Santri Terhubung (Putra / Putri)</span>
          </h3>
          <span className="text-xs font-bold text-slate bg-slate/10 px-2.5 py-1 rounded-full">
            {childrenList.length} Santri
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Spinner size="md" color="emerald" />
            <span className="text-xs text-slate mt-2">Memuat data santri...</span>
          </div>
        ) : childrenList.length === 0 ? (
          <EmptyState
            title="Belum Ada Santri Terhubung"
            description="Akun Wali Anda saat ini belum ditautkan (linked) dengan data santri dalam sistem pesantren."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {childrenList.map((child) => (
              <div key={child.id} className="p-4 rounded-2xl bg-white border border-slate/15 shadow-2xs flex items-center justify-between gap-3 hover:border-emerald-primary/40 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-light text-emerald-primary font-extrabold text-base flex items-center justify-center shrink-0">
                    {child.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-obsidian text-sm truncate">{child.name}</h4>
                    <p className="text-xs text-slate font-medium mt-0.5">
                      NIS: <span className="font-mono font-bold text-obsidian">{child.nis}</span> • Kelas {child.grade}
                    </p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-emerald-primary/10 text-emerald-primary flex items-center justify-center shrink-0" title="Terverifikasi Aktif">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* School Contact Info & Support */}
      <Card variant="glass" padding="lg" className="bg-gradient-to-r from-slate/5 to-white">
        <h3 className="text-base font-extrabold text-obsidian flex items-center gap-2 mb-3 font-heading">
          <School className="w-5 h-5 text-emerald-primary" />
          <span>Informasi & Bantuan Pesantren</span>
        </h3>
        <p className="text-xs text-slate leading-relaxed mb-4">
          Aplikasi Sistem Pembayaran SPP Pesantren Tahfidh Darur Rahman (PTD AR-RAHMAN) dikembangkan dengan arsitektur masa depan untuk memudahkan komunikasi keuangan santri dan wali secara transparan dan instan.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-slate/15 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-light text-emerald-primary shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate font-bold uppercase block">Layanan Tata Usaha / Bendahara</span>
              <span className="text-xs font-mono font-bold text-obsidian truncate block">+62 812-3456-7890</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate/15 flex items-center gap-3 cursor-pointer hover:border-emerald-primary/40 transition-all" onClick={() => window.open('https://wa.me/6281234567890?text=Halo%20Admin%20PTDARRAHMAN,%20saya%20butuh%20bantuan%20terkait%20akun%20Wali.', '_blank')}>
            <div className="p-2.5 rounded-xl bg-emerald-primary text-white shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate font-bold uppercase block">Customer Support 24/7</span>
              <span className="text-xs font-bold text-emerald-primary truncate block">Chat WhatsApp Resmi</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WaliProfilePage;
