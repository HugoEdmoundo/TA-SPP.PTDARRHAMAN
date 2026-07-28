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

  const isDemo = user?.email === 'demo' || user?.email === 'demo_wali' || user?.name?.toLowerCase().includes('demo');

  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [billsData, setBillsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemo);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchSppBills = async () => {
    if (isDemo || !selectedChild || selectedChild.id === 'empty') {
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
  }, [selectedChild?.id, isDemo]);

  const handleQuickPay = async (month: number, title: string, amount: number) => {
    if (isDemo) {
      success('Checkout Gateway (Simulasi)', `Menyiapkan pembayaran untuk "${title}" senilai ${formatRupiah(amount)} via QRIS / VA.`);
      return;
    }
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

  if (isDemo) {
    const mockSppBills = [
      { id: 'bill-07', month: 7, year: 2026, nominal: 1500000, paid: 1500000, status: 'PAID' as const, due: '2026-07-10', invoice: 'INV-2026-0701', verCode: 'PTD-VER-7721' },
      { id: 'bill-08', month: 8, year: 2026, nominal: 1500000, paid: 0, status: 'UNPAID' as const, due: '2026-08-10' },
      { id: 'bill-09', month: 9, year: 2026, nominal: 1500000, paid: 0, status: 'UNPAID' as const, due: '2026-09-10' },
      { id: 'bill-10', month: 10, year: 2026, nominal: 1500000, paid: 0, status: 'UNPAID' as const, due: '2026-10-10' },
      { id: 'bill-06', month: 6, year: 2026, nominal: 1500000, paid: 1500000, status: 'PAID' as const, due: '2026-06-10', invoice: 'INV-2026-0612', verCode: 'PTD-VER-6532' },
      { id: 'bill-05', month: 5, year: 2026, nominal: 1500000, paid: 1500000, status: 'PAID' as const, due: '2026-05-10', invoice: 'INV-2026-0504', verCode: 'PTD-VER-5412' },
    ];

    const filteredDemo = filterStatus === 'ALL' ? mockSppBills : mockSppBills.filter(b => b.status === filterStatus);

    const handleOpenReceiptDemo = (bill: typeof mockSppBills[0]) => {
      if (bill.status !== 'PAID') return;
      const mockReceipt: Receipt = {
        id: `rcp-${bill.id}`,
        receipt_number: `KUITANSI-${bill.year}${String(bill.month).padStart(2, '0')}-${selectedChild?.nis || '20240105'}`,
        verification_code: bill.verCode || `PTD-VER-9981`,
        created_at: new Date().toISOString(),
        payment_id: `pay-${bill.id}`,
        payment: {
          id: `pay-${bill.id}`,
          invoice_number: bill.invoice || 'INV-2026-XXXX',
          user_id: 'usr-wali-001',
          student_id: String(selectedChild?.id || 'std-01'),
          student: { id: String(selectedChild?.id || 'std-01'), nis: selectedChild?.nis || '20240105', name: selectedChild?.name || 'Santri Demo', grade: selectedChild?.grade || 'XI', status: 'ACTIVE' },
          total_amount: bill.nominal,
          payment_method: 'QRIS',
          status: 'SUCCESS',
          created_at: new Date().toISOString(),
          items: [{ id: `itm-${bill.id}`, payment_id: `pay-${bill.id}`, item_type: 'SPP', title: `SPP ${formatMonthYearIndo(bill.month, bill.year)}`, nominal: bill.nominal }],
        },
      };
      setSelectedReceipt(mockReceipt);
    };

    return (
      <div className="flex flex-col gap-6">
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default WaliSppPage;
