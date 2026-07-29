import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Badge, Button, ReceiptShareCard, EmptyState, Spinner, Modal, formatRupiah, formatMonthYearIndo } from '../../components/ui';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../components/ui/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { CreditCard, Wallet, CheckCircle2, Clock, ShieldCheck, Sparkles, Filter } from 'lucide-react';
import type { Receipt } from '../../types';

export const WaliSppPage: React.FC = () => {
  const { selectedChild } = useOutletContext<{ selectedChild: { id: string | number; name: string; nis: string; grade: string } }>();
  const { settings } = useSettings();
  const { success, error: toastError } = useToast();
  const { user } = useAuth();

  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [billsData, setBillsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchSppBills = async () => {
    if (!selectedChild || selectedChild.id === 'empty') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.get(`/my/bills?child_id=${selectedChild.id}&year=2025`);
      setBillsData(res.data?.spp_bills || []);
    } catch (err: any) {
      toastError('Gagal Memuat SPP', err?.response?.data?.detail || 'Terjadi kesalahan server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSppBills();
  }, [selectedChild?.id]);

  const handleQuickPay = async (month: number, title: string, amount: number) => {
    try {
      success('Membuka Gateway', `Menyiapkan sesi checkout untuk ${title}...`);
      const payload = {
        student_id: Number(selectedChild.id),
        bill_ids: [],
        payment_type: 'spp',
        spp_month: month,
        spp_year: 2025,
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
        <span className="text-xs text-slate font-semibold mt-3">Memuat tagihan SPP...</span>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card variant="glass" padding="md" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
            <CreditCard className="w-6 h-6 text-emerald-primary shrink-0" />
            <span>Tagihan SPP Bulanan ({selectedChild.name})</span>
          </h2>
          <p className="text-xs text-slate mt-1">Daftar tagihan SPP bulanan santri.</p>
        </div>
      </Card>

      {billsData.length === 0 ? (
        <Card variant="glass" padding="lg">
          <EmptyState
            title="Belum Ada Tagihan SPP"
            description="Belum ada tagihan SPP untuk santri ini saat ini."
          />
        </Card>
      ) : (
        <Card variant="glass" padding="none" className="overflow-hidden">
          <div className="divide-y divide-slate/10">
            {billsData.map((item: any) => (
              <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${item.status === 'PAID' ? 'bg-emerald-light text-emerald-primary' : 'bg-rose-light text-rose-danger'}`}>
                    {item.status === 'PAID' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-obsidian font-heading">{formatMonthYearIndo(item.month, item.year)}</h4>
                    <p className="text-xs text-slate mt-1">
                      Sisa Tagihan: <span className="font-mono font-bold text-rose-danger">{formatRupiah(item.remaining_amount)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-0 border-slate/10">
                  <div className="text-right">
                    <span className="text-xs text-slate block">Nominal:</span>
                    <span className="font-mono font-extrabold text-obsidian text-base">{formatRupiah(item.amount)}</span>
                  </div>
                  {item.status !== 'PAID' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleQuickPay(item.month, formatMonthYearIndo(item.month, item.year), item.amount)}
                      className="font-bold text-xs shrink-0"
                    >
                      Bayar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        showCloseButton={false}
        maxWidth="sm"
        className="!bg-transparent !border-0 !shadow-none !p-0 !overflow-visible"
        bodyClassName="!p-0 !overflow-visible"
      >
        {selectedReceipt && (
          <ReceiptShareCard
            receipt={selectedReceipt}
            settings={settings}
            onClose={() => setSelectedReceipt(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default WaliSppPage;
