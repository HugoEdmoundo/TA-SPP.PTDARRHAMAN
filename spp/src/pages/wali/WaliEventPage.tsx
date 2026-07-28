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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WaliEventPage;
