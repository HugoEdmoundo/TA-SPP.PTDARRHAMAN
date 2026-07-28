import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Badge, Button, ReceiptShareCard, EmptyState, Spinner, Modal, formatRupiah, formatMonthYearIndo } from '../../components/ui';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../components/ui/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { CreditCard, Wallet, HeartHandshake, CheckCircle2, Clock, ShieldCheck, MessageCircle, Sparkles, AlertCircle } from 'lucide-react';
import type { Receipt } from '../../types';

export const WaliDashboardPage: React.FC = () => {
  const { selectedChild } = useOutletContext<{ selectedChild: { id: string | number; name: string; nis: string; grade: string } }>();
  const { settings } = useSettings();
  const { success, error: toastError } = useToast();
  const { user } = useAuth();

  const isDemo = user?.email === 'demo' || user?.email === 'demo_wali' || user?.name?.toLowerCase().includes('demo');

  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [billsData, setBillsData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(!isDemo);

  const fetchBills = async () => {
    if (isDemo || !selectedChild || selectedChild.id === 'empty') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.get(`/my/bills?child_id=${selectedChild.id}&year=2025`);
      setBillsData(res.data);
    } catch (err: any) {
      toastError('Gagal Memuat Tagihan', err?.response?.data?.detail || 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [selectedChild?.id, isDemo]);

  if (isDemo) {
    const mockSppBills = [
      { id: 'bill-07', month: 7, year: 2026, nominal: 1500000, paid: 1500000, status: 'PAID' as const, due: '2026-07-10', invoice: 'INV-2026-0701', verCode: 'PTD-VER-7721' },
      { id: 'bill-08', month: 8, year: 2026, nominal: 1500000, paid: 0, status: 'UNPAID' as const, due: '2026-08-10' },
      { id: 'bill-09', month: 9, year: 2026, nominal: 1500000, paid: 0, status: 'UNPAID' as const, due: '2026-09-10' },
      { id: 'bill-06', month: 6, year: 2026, nominal: 1500000, paid: 1500000, status: 'PAID' as const, due: '2026-06-10', invoice: 'INV-2026-0612', verCode: 'PTD-VER-6532' },
    ];

    const mockActiveEvents = [
      { id: 'ev-01', title: 'Patungan Qurban Idul Adha 1447 H', target: 200000, collected: 200000, status: 'PAID' as const, date: '2026-06-05' },
      { id: 'ev-02', title: 'Infaq Pembangunan Asrama Baru & Masjid', target: 500000, collected: 0, status: 'UNPAID' as const, date: '2026-08-01' },
    ];

    const handleOpenReceiptDemo = (bill: typeof mockSppBills[0]) => {
      if (bill.status !== 'PAID') return;
      const mockReceipt: Receipt = {
        id: `rcp-${bill.id}`,
        receipt_number: `KUITANSI-${bill.year}${String(bill.month).padStart(2, '0')}-${selectedChild.nis}`,
        verification_code: bill.verCode || `PTD-VER-${Math.floor(1000 + Math.random() * 9000)}`,
        created_at: new Date().toISOString(),
        payment_id: `pay-${bill.id}`,
        payment: {
          id: `pay-${bill.id}`,
          invoice_number: bill.invoice || 'INV-2026-XXXX',
          user_id: 'usr-wali-001',
          student_id: String(selectedChild.id),
          student: { id: String(selectedChild.id), nis: selectedChild.nis, name: selectedChild.name, grade: selectedChild.grade, status: 'ACTIVE' },
          total_amount: bill.nominal,
          payment_method: 'QRIS',
          status: 'SUCCESS',
          created_at: new Date().toISOString(),
          items: [
            { id: `itm-${bill.id}`, payment_id: `pay-${bill.id}`, item_type: 'SPP', title: `SPP ${formatMonthYearIndo(bill.month, bill.year)}`, nominal: bill.nominal }
          ],
        },
      };
      setSelectedReceipt(mockReceipt);
    };

    const handleQuickPayDemo = (itemTitle: string, nominal: number) => {
      success(
        'Membuka Checkout Gateway (Simulasi)',
        `Menyiapkan pembayaran untuk "${itemTitle}" senilai ${formatRupiah(nominal)} via QRIS / Virtual Account.`
      );
    };

    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-100 border border-amber-300 p-4 rounded-2xl text-amber-900 text-xs font-bold">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-700 shrink-0" />
            <span>Mode Showcase Demo: Menampilkan data tagihan contoh. Gunakan akun Wali Real untuk melihat tagihan asli santri.</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => success('Simulasi Demo', 'Anda sedang berada dalam mode simulasi interaktif.')}>Akun Simulasi</Button>
        </div>

        {/* Student Profile Overview Card */}
        <Card variant="glass" padding="none" glow="emerald" className="p-4 sm:p-6 md:p-8 bg-gradient-to-r from-white/90 to-emerald-light/30 border-2 border-emerald-primary/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-primary text-white font-extrabold text-lg sm:text-xl flex items-center justify-center shadow-md shrink-0">
                {selectedChild?.name?.charAt(0) || 'S'}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-primary bg-emerald-light px-2 py-0.5 rounded-md inline-block mb-1">
                  Santri Aktif • Kelas {selectedChild?.grade || 'XI'}
                </span>
                <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-obsidian tracking-tight font-heading truncate">
                  {selectedChild?.name || 'Santri Demo'}
                </h2>
                <p className="text-xs text-slate font-medium mt-0.5 truncate">
                  Nomor Induk Santri (NIS): <span className="font-mono font-bold text-obsidian">{selectedChild?.nis || '-'}</span>
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto bg-white/90 p-3 sm:p-3.5 rounded-2xl border border-slate/15 shadow-2xs flex sm:flex-col justify-between items-center sm:items-end shrink-0">
              <span className="text-xs font-semibold text-slate">Status SPP Agustus 2026:</span>
              <Badge status="UNPAID" className="mt-0 sm:mt-1 font-bold text-xs">Belum Bayar</Badge>
            </div>
          </div>
        </Card>

        {/* Grid: SPP Bills & Event Contributions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Card variant="glass" padding="sm" className="bg-white/80">
                <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Total Tunggakan SPP</span>
                <div className="text-lg sm:text-xl md:text-2xl font-extrabold text-rose-danger mt-1 font-numbers">
                  {formatRupiah(3000000)}
                </div>
                <span className="text-[11px] font-semibold text-rose-danger mt-0.5 block">2 Bulan belum dilunasi</span>
              </Card>
              <Card variant="glass" padding="sm" className="bg-white/80">
                <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Infaq / Kegiatan Belum Bayar</span>
                <div className="text-lg sm:text-xl md:text-2xl font-extrabold text-amber-warn mt-1 font-numbers">
                  {formatRupiah(500000)}
                </div>
                <span className="text-[11px] font-semibold text-amber-warn mt-0.5 block">1 Kegiatan aktif</span>
              </Card>
              <Card variant="glass" padding="sm" className="bg-white/80">
                <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Total Lunas Semester Ini</span>
                <div className="text-lg sm:text-xl md:text-2xl font-extrabold text-emerald-primary mt-1 font-numbers">
                  {formatRupiah(3200000)}
                </div>
                <span className="text-[11px] font-semibold text-emerald-primary mt-0.5 block">Terverifikasi sistem QRIS</span>
              </Card>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-obsidian flex items-center gap-2 font-heading">
                <CreditCard className="w-5 h-5 text-emerald-primary" />
                <span>Tagihan SPP Semester Genap / Ganjil</span>
              </h3>
              <span className="text-xs font-semibold text-slate">Klik baris lunas untuk kuitansi</span>
            </div>

            <Card variant="glass" padding="none" className="overflow-hidden">
              <div className="divide-y divide-slate/10">
                {mockSppBills.map((bill) => {
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
                            Nominal Tagihan: <span className="font-mono font-bold text-obsidian">{formatRupiah(bill.nominal)}</span>
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
                            onClick={() => handleQuickPayDemo(`SPP Bulan ${formatMonthYearIndo(bill.month, bill.year)}`, bill.nominal)}
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
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card variant="glass" padding="lg">
              <h3 className="text-base font-extrabold text-obsidian flex items-center gap-2 mb-4 border-b border-slate/10 pb-3 font-heading">
                <HeartHandshake className="w-5 h-5 text-emerald-primary" />
                <span>Event & Infaq Pesantren</span>
              </h3>
              <div className="flex flex-col gap-4">
                {mockActiveEvents.map((ev) => (
                  <div key={ev.id} className="p-3.5 rounded-2xl bg-white border border-slate/15 shadow-2xs flex flex-col gap-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-obsidian text-xs leading-snug">{ev.title}</h4>
                      <Badge status={ev.status} size="sm" />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate">Kontribusi / Target:</span>
                      <span className="font-mono font-bold text-emerald-primary">{formatRupiah(ev.target)}</span>
                    </div>
                    {ev.status !== 'PAID' && (
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        className="mt-1 text-xs font-bold"
                        onClick={() => handleQuickPayDemo(ev.title, ev.target)}
                      >
                        Partisipasi & Bayar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card variant="glass" padding="md" className="bg-slate/5 border-slate/15 text-center">
              <p className="text-xs text-slate font-medium leading-relaxed">
                Ada kendala pembayaran atau nominal tidak sesuai? Silakan hubungi bagian Tata Usaha (Bendahara) di nomor WhatsApp resmi pesantren.
              </p>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<MessageCircle className="w-4 h-4 text-emerald-primary" />}
                className="mt-3 font-bold text-xs w-full justify-center"
                onClick={() => window.open(`https://wa.me/6281234567890?text=Halo%20Bendahara%20PTDARRAHMAN,%20saya%20wali%20dari%20${selectedChild.name}%20ingin%20bertanya%20terkait%20tagihan.`, '_blank')}
              >
                Hubungi Tata Usaha via WA
              </Button>
            </Card>
          </div>
        </div>

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

  // Live / Real Mode Rendering
  if (!selectedChild || selectedChild.id === 'empty') {
    return (
      <Card variant="glass" padding="lg">
        <EmptyState
          title="Belum Ada Santri Terhubung"
          description="Akun Wali Anda saat ini belum dikaitkan (linked) dengan data santri manapun dalam database pesantren. Silakan hubungi Admin / Tata Usaha untuk menautkan nomor HP atau akun Anda ke data putra/putri Anda."
          action={<Button variant="outline" size="sm" onClick={() => window.location.reload()}>Refresh Halaman</Button>}
        />
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card variant="glass" padding="lg" className="flex flex-col items-center justify-center py-16">
        <Spinner size="lg" color="emerald" />
        <span className="text-xs text-slate font-semibold mt-3">Mengambil tagihan santri dari database...</span>
      </Card>
    );
  }

  const sppList = billsData?.spp_bills || [];
  const nonSppList = billsData?.non_spp_bills || [];
  const eventList = billsData?.event_bills || [];
  const summary = billsData?.summary || { total_outstanding: 0, total_paid_all_time: 0, unpaid_bills_count: 0 };

  const handleQuickPayReal = async (billId: string | number, billType: string, title: string, amount: number) => {
    try {
      success('Membuka Gateway', `Menyiapkan sesi checkout untuk ${title} senilai ${formatRupiah(amount)}...`);
      const payload = {
        student_id: Number(selectedChild.id),
        bill_ids: billType !== 'spp' ? [Number(billId)] : [],
        payment_type: billType,
        spp_month: billType === 'spp' ? Number(billId) : undefined,
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

  return (
    <div className="flex flex-col gap-6">
      {/* Student Profile Overview Card */}
      <Card variant="glass" padding="none" glow="emerald" className="p-4 sm:p-6 md:p-8 bg-gradient-to-r from-white/90 to-emerald-light/30 border-2 border-emerald-primary/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-primary text-white font-extrabold text-lg sm:text-xl flex items-center justify-center shadow-md shrink-0">
              {selectedChild.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-primary bg-emerald-light px-2 py-0.5 rounded-md inline-block mb-1">
                Santri Aktif • Kelas {selectedChild.grade}
              </span>
              <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-obsidian tracking-tight font-heading truncate">
                {selectedChild.name}
              </h2>
              <p className="text-xs text-slate font-medium mt-0.5 truncate">
                Nomor Induk Santri (NIS): <span className="font-mono font-bold text-obsidian">{selectedChild.nis}</span>
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto bg-white/90 p-3 sm:p-3.5 rounded-2xl border border-slate/15 shadow-2xs flex sm:flex-col justify-between items-center sm:items-end shrink-0">
            <span className="text-xs font-semibold text-slate">Total Belum Bayar:</span>
            <Badge status={summary.total_outstanding > 0 ? "UNPAID" : "PAID"} className="mt-0 sm:mt-1 font-bold text-xs">
              {summary.total_outstanding > 0 ? formatRupiah(summary.total_outstanding) : 'Lunas Semua'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card variant="glass" padding="sm" className="bg-white/80">
          <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Total Tunggakan Aktif</span>
          <div className="text-lg sm:text-xl md:text-2xl font-extrabold text-rose-danger mt-1 font-numbers">
            {formatRupiah(summary.total_outstanding)}
          </div>
          <span className="text-[11px] font-semibold text-rose-danger mt-0.5 block">{summary.unpaid_bills_count} tagihan belum lunas</span>
        </Card>
        <Card variant="glass" padding="sm" className="bg-white/80">
          <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Total Dibayar (All-Time)</span>
          <div className="text-lg sm:text-xl md:text-2xl font-extrabold text-emerald-primary mt-1 font-numbers">
            {formatRupiah(summary.total_paid_all_time)}
          </div>
          <span className="text-[11px] font-semibold text-emerald-primary mt-0.5 block">Tercatat dalam SQLite</span>
        </Card>
        <Card variant="glass" padding="sm" className="bg-white/80 flex flex-col justify-center items-center text-center">
          <Button variant="outline" size="sm" onClick={fetchBills} className="w-full font-bold">
            Refresh Tagihan
          </Button>
        </Card>
      </div>

      {/* Grid: SPP & Non-SPP / Event */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-obsidian flex items-center gap-2 font-heading">
              <CreditCard className="w-5 h-5 text-emerald-primary" />
              <span>Daftar Tagihan Belum Lunas (SPP / Non-SPP)</span>
            </h3>
          </div>

          {sppList.length === 0 && nonSppList.length === 0 ? (
            <Card variant="glass" padding="lg">
              <EmptyState
                title="Semua Tagihan Lunas / Kosong"
                description="Santri ini tidak memiliki tagihan SPP maupun Non-SPP yang menunggak saat ini di dalam database bersih."
                action={<Button variant="outline" size="sm" onClick={fetchBills}>Periksa Ulang</Button>}
              />
            </Card>
          ) : (
            <Card variant="glass" padding="none" className="overflow-hidden">
              <div className="divide-y divide-slate/10">
                {sppList.map((bill: any, idx: number) => (
                  <div key={`spp-${idx}`} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate/5 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl shrink-0 mt-0.5 bg-amber-50 text-amber-600">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-obsidian text-sm sm:text-base font-heading">
                          {bill.label || `SPP Bulan ${bill.month}`}
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
                        onClick={() => handleQuickPayReal(bill.month, 'spp', bill.label, bill.remaining_amount)}
                      >
                        Bayar Sekarang
                      </Button>
                    </div>
                  </div>
                ))}

                {nonSppList.map((bill: any) => (
                  <div key={`nonspp-${bill.id}`} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate/5 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl shrink-0 mt-0.5 bg-rose-light text-rose-danger">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-obsidian text-sm sm:text-base font-heading">
                          {bill.name || 'Tagihan Non-SPP'}
                        </h4>
                        <p className="text-xs text-slate mt-0.5">
                          Nominal: <span className="font-mono font-bold text-rose-danger">{formatRupiah(bill.amount)}</span>
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
                        onClick={() => handleQuickPayReal(bill.id, 'non_spp', bill.name, bill.amount)}
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

        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card variant="glass" padding="lg">
            <h3 className="text-base font-extrabold text-obsidian flex items-center gap-2 mb-4 border-b border-slate/10 pb-3 font-heading">
              <HeartHandshake className="w-5 h-5 text-emerald-primary" />
              <span>Event & Infaq Pesantren</span>
            </h3>
            {eventList.length === 0 ? (
              <p className="text-xs text-slate text-center py-4 font-medium">Belum ada tagihan kegiatan/infaq yang aktif saat ini.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {eventList.map((ev: any) => (
                  <div key={ev.id} className="p-3.5 rounded-2xl bg-white border border-slate/15 shadow-2xs flex flex-col gap-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-obsidian text-xs leading-snug">{ev.name}</h4>
                      <Badge status="UNPAID" size="sm" />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate">Target / Sisa:</span>
                      <span className="font-mono font-bold text-emerald-primary">{formatRupiah(ev.amount)}</span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      className="mt-1 text-xs font-bold"
                      onClick={() => handleQuickPayReal(ev.id, 'event', ev.name, ev.amount)}
                    >
                      Partisipasi & Bayar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card variant="glass" padding="md" className="bg-slate/5 border-slate/15 text-center">
            <p className="text-xs text-slate font-medium leading-relaxed">
              Ada kendala pembayaran atau nominal tidak sesuai? Silakan hubungi bagian Tata Usaha (Bendahara) di nomor WhatsApp resmi pesantren.
            </p>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<MessageCircle className="w-4 h-4 text-emerald-primary" />}
              className="mt-3 font-bold text-xs w-full justify-center"
              onClick={() => window.open(`https://wa.me/6281234567890?text=Halo%20Bendahara%20PTDARRAHMAN,%20saya%20wali%20dari%20${selectedChild.name}%20ingin%20bertanya%20terkait%20tagihan.`, '_blank')}
            >
              Hubungi Tata Usaha via WA
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WaliDashboardPage;
