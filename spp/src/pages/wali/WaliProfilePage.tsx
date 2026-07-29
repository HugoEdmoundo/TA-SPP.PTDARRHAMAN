import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, EmptyState, Spinner } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { Phone, Mail, LogOut, Users, School, MessageCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export const WaliProfilePage: React.FC = () => {
  const { user, logout } = useAuth();

  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {isDemo && (
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
          Aplikasi Sistem Pembayaran SPP PTDARRAHMAN dikembangkan dengan arsitektur masa depan untuk memudahkan komunikasi keuangan santri dan wali secara transparan dan instan.
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
