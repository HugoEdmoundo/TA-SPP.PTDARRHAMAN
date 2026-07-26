import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Badge, Button, ReceiptShareCard, EmptyState, Spinner, formatRupiah, formatMonthYearIndo, formatDateIndo } from '../../components/ui';
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-100 border border-amber-300 p-4 rounded-2xl text-amber-900 text-xs font-bold">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-700 shrink-0" />
            <span>Mode Showcase Demo: Menampilkan rincian SPP contoh tahun ajaran 2025/2026.</span>
          </div>
        </div>

        <Card variant="glass" padding="md" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
              <CreditCard className="w-6 h-6 text-emerald-primary shrink-0" />
              <span>Tagihan SPP Bulanan ({selectedChild?.name || 'Santri Demo'})</span>
            </h2>
            <p className="text-xs text-slate mt-1">Pantau status pembayaran bulanan dan unduh kuitansi resmi ke WhatsApp Anda.</p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <Filter className="w-4 h-4 text-slate shrink-0 hidden sm:block" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-slate/20 rounded-xl px-3 py-1.5 text-xs font-bold text-obsidian shadow-2xs focus:outline-none focus:border-emerald-primary"
            >
              <option value="ALL">Semua Status ({mockSppBills.length})</option>
              <option value="UNPAID">Belum Bayar ({mockSppBills.filter(b => b.status === 'UNPAID').length})</option>
              <option value="PAID">Lunas ({mockSppBills.filter(b => b.status === 'PAID').length})</option>
            </select>
          </div>
        </Card>

        <Card variant="glass" padding="none" className="overflow-hidden">
          <div className="divide-y divide-slate/10">
            {filteredDemo.map((bill) => {
              const isPaid = bill.status === 'PAID';
              return (
                <div
                  key={bill.id}
                  onClick={() => isPaid && handleOpenReceiptDemo(bill)}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isPaid ? 'hover:bg-emerald-light/40 cursor-pointer' : 'hover:bg-slate/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${isPaid ? 'bg-emerald-light text-emerald-primary' : 'bg-amber-50 text-amber-600'}`}>
                      {isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-obsidian text-sm sm:text-base font-heading">
                        SPP Bulan {formatMonthYearIndo(bill.month, bill.year)}
                      </h4>
                      <p className="text-xs text-slate mt-0.5">
                        Jatuh tempo: {formatDateIndo(bill.due)} • Nominal: <span className="font-mono font-bold text-obsidian">{formatRupiah(bill.nominal)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate/10">
                    <Badge status={bill.status} size="md" />
                    {isPaid ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-emerald-primary font-bold text-xs"
                        leftIcon={<ShieldCheck className="w-4 h-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReceiptDemo(bill);
                        }}
                      >
                        Kuitansi WA
                      </Button>
                    ) : (
                      <Button
                        variant="gold"
                        size="sm"
                        className="font-bold text-xs shadow-sm"
                        leftIcon={<Wallet className="w-3.5 h-3.5" />}
                        onClick={() => handleQuickPay(bill.month, `SPP Bulan ${formatMonthYearIndo(bill.month, bill.year)}`, bill.nominal)}
                      >
                        Bayar Sekarang
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/50 backdrop-blur-xs animate-fade-in">
            <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto">
              <ReceiptShareCard
                receipt={selectedReceipt}
                settings={settings}
                onClose={() => setSelectedReceipt(null)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Live / Real Mode Rendering
  if (!selectedChild || selectedChild.id === 'empty') {
    return (
      <Card variant="glass" padding="lg">
        <EmptyState
          title="Belum Ada Santri Terhubung"
          description="Akun Wali Anda belum dikaitkan dengan data santri. Silakan hubungi Admin pesantren."
        />
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card variant="glass" padding="lg" className="flex flex-col items-center justify-center py-16">
        <Spinner size="lg" color="emerald" />
        <span className="text-xs text-slate font-semibold mt-3">Mengambil tagihan SPP dari database...</span>
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
          <p className="text-xs text-slate mt-1">Daftar tagihan SPP bulanan yang menunggak / belum dilunasi pada database bersih.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSppBills}>Refresh SPP</Button>
      </Card>

      {billsData.length === 0 ? (
        <Card variant="glass" padding="lg">
          <EmptyState
            title="Tidak Ada Tunggakan SPP"
            description="Saat ini tidak ada tagihan SPP bulanan yang menunggak atas santri ini. Semua bulan telah terbayar lunas atau belum diterbitkan oleh Admin."
            action={<Button variant="outline" size="sm" onClick={fetchSppBills}>Periksa Ulang</Button>}
          />
        </Card>
      ) : (
        <Card variant="glass" padding="none" className="overflow-hidden">
          <div className="divide-y divide-slate/10">
            {billsData.map((bill: any, idx: number) => (
              <div key={idx} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate/5 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl shrink-0 mt-0.5 bg-amber-50 text-amber-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-obsidian text-sm sm:text-base font-heading">
                      {bill.label || `SPP Bulan ke-${bill.month} (${bill.year})`}
                    </h4>
                    <p className="text-xs text-slate mt-0.5">
                      Sisa Tagihan: <span className="font-mono font-bold text-rose-danger">{formatRupiah(bill.remaining_amount)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate/10">
                  <Badge status="UNPAID" size="md" />
                  <Button
                    variant="gold"
                    size="sm"
                    className="font-bold text-xs shadow-sm"
                    leftIcon={<Wallet className="w-3.5 h-3.5" />}
                    onClick={() => handleQuickPay(bill.month, bill.label, bill.remaining_amount)}
                  >
                    Bayar Sekarang
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

export default WaliSppPage;
