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
          </div>
        </Card>
      )}
    </div>
  );
};

export default WaliSppPage;
