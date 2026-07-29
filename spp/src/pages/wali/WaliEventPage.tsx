import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Badge, Button, EmptyState, Spinner, formatRupiah, formatDateIndo } from '../../components/ui';
import { useToast } from '../../components/ui/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { HeartHandshake, Wallet, CheckCircle2, Sparkles } from 'lucide-react';

export const WaliEventPage: React.FC = () => {
  const { selectedChild } = useOutletContext<{ selectedChild: { id: string | number; name: string; nis: string; grade: string } }>();
  const { success, error: toastError } = useToast();
  const { user } = useAuth();

  const [eventsData, setEventsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEvents = async () => {
    if (!selectedChild || selectedChild.id === 'empty') {
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
  }, [selectedChild?.id]);

  const handleQuickPay = async (eventId: string | number, title: string, amount: number) => {
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
        <span className="text-xs text-slate font-semibold mt-3">Memuat tagihan event...</span>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card variant="glass" padding="md" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
            <HeartHandshake className="w-6 h-6 text-emerald-primary shrink-0" />
            <span>Tagihan Event & Patungan ({selectedChild.name})</span>
          </h2>
          <p className="text-xs text-slate mt-1">Tagihan kegiatan, event, dan patungan santri.</p>
        </div>
      </Card>

      {eventsData.length === 0 ? (
        <Card variant="glass" padding="lg">
          <EmptyState
            title="Belum Ada Tagihan Event"
            description="Belum ada tagihan event atau patungan untuk santri ini saat ini."
          />
        </Card>
      ) : (
        <Card variant="glass" padding="none" className="overflow-hidden">
          <div className="divide-y divide-slate/10">
            {eventsData.map((item: any) => (
              <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-2xl bg-gold-bg text-gold-dark shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-obsidian group-hover:text-emerald-primary transition-colors font-heading">{item.name || 'Tagihan Event'}</h4>
                    <p className="text-xs text-slate mt-1">
                      Deadline: {item.deadline ? formatDateIndo(item.deadline, true) : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-0 border-slate/10">
                  <div className="text-right">
                    <span className="text-xs text-slate block">Nominal:</span>
                    <span className="font-mono font-extrabold text-obsidian text-base">{formatRupiah(item.amount)}</span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleQuickPay(item.id, item.name, item.amount)}
                    className="font-bold text-xs shrink-0"
                  >
                    Bayar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default WaliEventPage;
