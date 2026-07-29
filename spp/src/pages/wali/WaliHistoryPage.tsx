import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Badge, Button, ReceiptShareCard, EmptyState, Spinner, Modal, formatRupiah, formatDateIndo } from '../../components/ui';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../components/ui/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { History, ShieldCheck, Sparkles, CheckCircle2, XCircle, Search } from 'lucide-react';
import type { Receipt } from '../../types';

export const WaliHistoryPage: React.FC = () => {
  const { selectedChild } = useOutletContext<{ selectedChild: { id: string | number; name: string; nis: string; grade: string } }>();
  const { settings } = useSettings();
  const { error: toastError } = useToast();
  const { user } = useAuth();

  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [paymentsData, setPaymentsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async () => {
    if (isDemo || !selectedChild || selectedChild.id === 'empty') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.get(`/my/payments?child_id=${selectedChild.id}`);
      setPaymentsData(res.data || []);
    } catch (err: any) {
      toastError('Gagal Memuat Riwayat', err?.response?.data?.detail || 'Terjadi kesalahan server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedChild?.id]);
          </div>
        </Card>

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
        <span className="text-xs text-slate font-semibold mt-3">Mengambil riwayat pembayaran santri...</span>
      </Card>
    );
  }

  const handleOpenReceiptReal = (item: any) => {
    const mockReceipt: Receipt = {
      id: `rcp-${item.id}`,
      receipt_number: item.receipt_number || `KUITANSI-${item.id}`,
      verification_code: item.verification_code || `PTD-VER-${item.id}`,
      created_at: item.created_at || new Date().toISOString(),
      payment_id: `pay-${item.id}`,
      payment: {
        id: `pay-${item.id}`,
        invoice_number: item.invoice_number || `INV-${item.id}`,
        user_id: String(user?.id || 'usr-wali'),
        student_id: String(selectedChild.id),
        student: { id: String(selectedChild.id), nis: selectedChild.nis, name: selectedChild.name, grade: selectedChild.grade, status: 'ACTIVE' },
        total_amount: item.total_amount || item.amount,
        payment_method: item.method || 'Transfer Bank',
        status: item.status === 'VOID' ? 'VOID' : 'SUCCESS',
        created_at: item.created_at || new Date().toISOString(),
        items: [{ id: `itm-${item.id}`, payment_id: `pay-${item.id}`, item_type: item.payment_type || 'SPP', title: `Pembayaran ${item.payment_type || 'SPP'}`, nominal: item.amount }],
      },
      is_void: item.status === 'VOID',
    };
    setSelectedReceipt(mockReceipt);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card variant="glass" padding="md" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
            <History className="w-6 h-6 text-emerald-primary shrink-0" />
            <span>Riwayat Pembayaran ({selectedChild.name})</span>
          </h2>
          <p className="text-xs text-slate mt-1">Daftar transaksi pembayaran yang tercatat.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHistory}>Refresh Riwayat</Button>
      </Card>

      {paymentsData.length === 0 ? (
        <Card variant="glass" padding="lg">
          <EmptyState
            title="Belum Ada Riwayat Pembayaran"
            description="Belum tercatat transaksi pembayaran atas santri ini saat ini."
            action={<Button variant="outline" size="sm" onClick={fetchHistory}>Periksa Ulang</Button>}
          />
        </Card>
      ) : (
        <Card variant="glass" padding="none" className="overflow-hidden">
          <div className="divide-y divide-slate/10">
            {paymentsData.map((item: any) => (
              <div key={item.id} onClick={() => handleOpenReceiptReal(item)} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate/5 transition-colors cursor-pointer">
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${item.status === 'VOID' ? 'bg-rose-light text-rose-danger' : 'bg-emerald-light text-emerald-primary'}`}>
                    {item.status === 'VOID' ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-obsidian">Pembayaran {item.payment_type || 'SPP'}</span>
                      <Badge status={item.status === 'VOID' ? 'VOID' : 'PAID'} size="sm" />
                    </div>
                    <p className="text-xs text-slate mt-1 font-mono">
                      Inv: {item.invoice_number} • No. Kuitansi: {item.receipt_number}
                    </p>
                    {item.created_at && <span className="text-[10px] text-slate font-semibold mt-0.5 block">{formatDateIndo(item.created_at, true)}</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-0 border-slate/10">
                  <div className="text-right">
                    <span className="text-xs text-slate block">Total:</span>
                    <span className="font-mono font-extrabold text-obsidian text-base">{formatRupiah(item.total_amount || item.amount)}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<ShieldCheck className="w-4 h-4 text-emerald-primary" />}
                    className="font-bold text-xs shrink-0"
                    onClick={(e) => { e.stopPropagation(); handleOpenReceiptReal(item); }}
                  >
                    Lihat Kuitansi
                  </Button>
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

export default WaliHistoryPage;
