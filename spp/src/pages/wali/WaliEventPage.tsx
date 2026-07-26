import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Badge, Button, EmptyState, Spinner, formatRupiah } from '../../components/ui';
import { useToast } from '../../components/ui/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { HeartHandshake, Wallet, CheckCircle2, Sparkles } from 'lucide-react';

export const WaliEventPage: React.FC = () => {
  const { selectedChild } = useOutletContext<{ selectedChild: { id: string | number; name: string; nis: string; grade: string } }>();
  const { success, error: toastError } = useToast();
  const { user } = useAuth();

  const isDemo = user?.email === 'demo' || user?.email === 'demo_wali' || user?.name?.toLowerCase().includes('demo');

  const [eventsData, setEventsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemo);

  const fetchEvents = async () => {
    if (isDemo || !selectedChild || selectedChild.id === 'empty') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.get(`/my/bills?child_id=${selectedChild.id}&year=2025`);
      setEventsData(res.data?.event_bills || []);
    } catch (err: any) {
      toastError('Gagal Memuat Event', err?.response?.data?.detail || 'Terjadi kesalahan server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedChild?.id, isDemo]);

  const handleQuickPay = async (eventId: string | number, title: string, amount: number) => {
    if (isDemo) {
      success('Checkout Gateway (Simulasi)', `Menyiapkan partisipasi donasi/infaq "${title}" senilai ${formatRupiah(amount)}.`);
      return;
    }
    try {
      success('Membuka Gateway', `Menyiapkan sesi checkout untuk ${title}...`);
      const payload = {
        student_id: Number(selectedChild.id),
        bill_ids: [Number(eventId)],
        payment_type: 'event',
        channel: 'virtual_account',
      };
      const res = await api.post('/my/checkout', payload);
      if (res.data?.checkout_url) {
        window.open(res.data.checkout_url, '_blank');
      } else {
        success('Checkout Berhasil Dibuat', `Order ID: ${res.data?.order_id || 'ORD-LIVE'}. Silakan lanjutkan pembayaran.`);
      }
    } catch (err: any) {
      toastError('Gagal Checkout', err?.response?.data?.detail || 'Gagal memulai transaksi online.');
    }
  };

  if (isDemo) {
    const mockEvents = [
      { id: 'ev-01', title: 'Patungan Qurban Idul Adha 1447 H', target: 200000, collected: 200000, status: 'PAID' as const, desc: 'Donasi patungan hewan qurban untuk santri dan masyarakat sekitar pesantren.' },
      { id: 'ev-02', title: 'Infaq Pembangunan Asrama Baru & Masjid', target: 500000, collected: 0, status: 'UNPAID' as const, desc: 'Wakaf dan infaq perbaikan fasilitas asrama santri putra/putri tahap 2.' },
      { id: 'ev-03', title: 'Kegiatan Rihlah & Eduwisata Santri Tahfidh', target: 350000, collected: 350000, status: 'PAID' as const, desc: 'Kunjungan edukatif tahunan santri kelas XI ke museum dan observatorium.' },
      { id: 'ev-04', title: 'Dana Kesehatan & Sosial Santri (Semester Ganjil)', target: 150000, collected: 0, status: 'UNPAID' as const, desc: 'Dana gotong royong kesehatan pesantren untuk penanganan medis darurat.' },
    ];

    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-100 border border-amber-300 p-4 rounded-2xl text-amber-900 text-xs font-bold">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-700 shrink-0" />
            <span>Mode Showcase Demo: Menampilkan kegiatan, patungan, dan infaq pesantren contoh.</span>
          </div>
        </div>

        <Card variant="glass" padding="md">
          <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
            <HeartHandshake className="w-6 h-6 text-emerald-primary shrink-0" />
            <span>Event & Infaq Pesantren ({selectedChild?.name || 'Santri Demo'})</span>
          </h2>
          <p className="text-xs text-slate mt-1">Ikuti kegiatan pesantren dan salurkan infaq/donasi dengan mudah melalui sistem pembayaran online transparan.</p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockEvents.map((ev) => (
            <Card key={ev.id} variant="glass" padding="md" className="flex flex-col justify-between border-2 hover:border-emerald-primary/40 transition-all">
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-light text-emerald-primary">
                    Kegiatan & Wakaf
                  </span>
                  <Badge status={ev.status} size="sm" />
                </div>
                <h3 className="text-base font-extrabold text-obsidian font-heading mb-1.5">{ev.title}</h3>
                <p className="text-xs text-slate leading-relaxed mb-4">{ev.desc}</p>
              </div>

              <div className="pt-4 border-t border-slate/10 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate font-bold block">Kontribusi / Target:</span>
                  <span className="font-mono font-extrabold text-emerald-primary text-base">{formatRupiah(ev.target)}</span>
                </div>

                {ev.status === 'PAID' ? (
                  <div className="flex items-center gap-1.5 text-emerald-primary font-extrabold text-xs bg-emerald-light/60 px-3 py-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Telah Berpartisipasi</span>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Wallet className="w-4 h-4" />}
                    onClick={() => handleQuickPay(ev.id, ev.title, ev.target)}
                    className="font-bold text-xs"
                  >
                    Salurkan Donasi
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Live Mode Rendering
  if (!selectedChild || selectedChild.id === 'empty') {
    return (
      <Card variant="glass" padding="lg">
        <EmptyState title="Belum Ada Santri Terhubung" description="Akun Wali Anda belum dikaitkan dengan data santri." />
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card variant="glass" padding="lg" className="flex flex-col items-center justify-center py-16">
        <Spinner size="lg" color="emerald" />
        <span className="text-xs text-slate font-semibold mt-3">Mengambil data kegiatan & infaq dari database...</span>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card variant="glass" padding="md" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
            <HeartHandshake className="w-6 h-6 text-emerald-primary shrink-0" />
            <span>Event & Infaq Pesantren ({selectedChild.name})</span>
          </h2>
          <p className="text-xs text-slate mt-1">Daftar kegiatan khusus atau tagihan event pesantren yang aktif untuk santri ini.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchEvents}>Refresh Event</Button>
      </Card>

      {eventsData.length === 0 ? (
        <Card variant="glass" padding="lg">
          <EmptyState
            title="Belum Ada Event / Kegiatan Aktif"
            description="Saat ini tidak ada tagihan event atau kegiatan partisipasi/infaq wajib yang terbuka untuk santri ini di database bersih."
            action={<Button variant="outline" size="sm" onClick={fetchEvents}>Periksa Ulang</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {eventsData.map((ev: any, idx: number) => (
            <Card key={idx} variant="glass" padding="md" className="flex flex-col justify-between border-2 hover:border-emerald-primary/40 transition-all">
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-light text-emerald-primary">
                    Event Pesantren
                  </span>
                  <Badge status="UNPAID" size="sm" />
                </div>
                <h3 className="text-base font-extrabold text-obsidian font-heading mb-1.5">{ev.name || 'Kegiatan Pesantren'}</h3>
                <p className="text-xs text-slate leading-relaxed mb-4">{ev.description || 'Tagihan partisipasi kegiatan sekolah.'}</p>
              </div>

              <div className="pt-4 border-t border-slate/10 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate font-bold block">Nominal Tagihan:</span>
                  <span className="font-mono font-extrabold text-emerald-primary text-base">{formatRupiah(ev.amount)}</span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Wallet className="w-4 h-4" />}
                  onClick={() => handleQuickPay(ev.id, ev.name, ev.amount)}
                  className="font-bold text-xs"
                >
                  Bayar Sekarang
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WaliEventPage;
