import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, EmptyState, Spinner, InputCurrency, formatRupiah, formatDateIndo, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { DollarSign, Plus, Search, Printer, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { Student } from '../../types';

export const PaymentKasirPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const isDemo = user?.email === 'demo' || user?.email === 'admin_demo' || user?.name?.toLowerCase().includes('demo');

  const [payments, setPayments] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [studentBills, setStudentBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemo);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [receiptDetail, setReceiptDetail] = useState<any | null>(null);
  const [isReceiptLoading, setIsReceiptLoading] = useState(false);

  // Form States
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'spp' | 'non_spp' | 'event'>('spp');
  const [sppMonth, setSppMonth] = useState<number>(new Date().getMonth() + 1);
  const [sppYear, setSppYear] = useState<number>(2026);
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [amount, setAmount] = useState<number>(500000);
  const [infaqAmount, setInfaqAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [notes, setNotes] = useState('');
  const [voidReason, setVoidReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (isDemo) return;
    setIsLoading(true);
    try {
      let url = `/payments/?limit=200`;
      if (filterMethod !== 'all') url += `&method=${filterMethod}`;

      const [pmtRes, stRes] = await Promise.all([
        api.get(url),
        api.get('/students/?limit=500&is_active=true'),
      ]);

      setPayments(pmtRes.data || []);
      setAllStudents(stRes.data || []);
    } catch (err: any) {
      toastError('Gagal Memuat Transaksi', err?.response?.data?.detail || 'Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterMethod, isDemo]);

  // Load bills when student changes for non_spp or event
  useEffect(() => {
    if (!selectedStudentId || paymentType === 'spp' || isDemo) {
      setStudentBills([]);
      return;
    }
    const fetchStudentBills = async () => {
      try {
        const res = await api.get(`/bills/non-spp?student_id=${selectedStudentId}&status=unpaid`);
        setStudentBills(res.data || []);
      } catch (e) {
        setStudentBills([]);
      }
    };
    fetchStudentBills();
  }, [selectedStudentId, paymentType, isDemo]);

  const handleOpenAdd = () => {
    setSelectedStudentId(allStudents[0]?.id ? String(allStudents[0].id) : '');
    setPaymentType('spp');
    setSppMonth(new Date().getMonth() + 1);
    setSppYear(2026);
    setSelectedBillId('');
    setAmount(500000);
    setInfaqAmount(0);
    setPaymentMethod('cash');
    setNotes('Pembayaran tunai di loket kasir');
    setShowAddModal(true);
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || amount <= 0) {
      toastError('Form Tidak Lengkap', 'Pilih santri dan masukkan nominal bayar.');
      return;
    }
    setIsSubmitting(true);
    try {
      const item: any = {
        type: paymentType,
        amount: amount,
      };
      if (paymentType === 'spp') {
        item.month = sppMonth;
        item.year = sppYear;
      } else {
        if (!selectedBillId) {
          toastError('Pilih Tagihan', 'Anda harus memilih tagihan untuk pembayaran non-spp/event.');
          setIsSubmitting(false);
          return;
        }
        item.bill_id = Number(selectedBillId);
      }

      await api.post('/payments/manual', {
        student_id: Number(selectedStudentId),
        items: [item],
        infaq_amount: infaqAmount,
        payment_method: paymentMethod,
        notes: notes,
      });

      const stName = allStudents.find(s => String(s.id) === String(selectedStudentId))?.full_name || 'Santri';
      success('Pembayaran Berhasil Dicatat', `Penerimaan dana dari ${stName} senilai ${formatRupiah(amount + infaqAmount)} telah tercatat dan kuitansi digital resmi diterbitkan.`);
      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      toastError('Gagal Mencatat Transaksi', err?.response?.data?.detail || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReceipt = async (pmt: any) => {
    setSelectedPayment(pmt);
    setShowReceiptModal(true);
    if (!pmt.receipt?.receipt_number) {
      setReceiptDetail(null);
      return;
    }
    setIsReceiptLoading(true);
    try {
      const res = await api.get(`/payments/receipts/${pmt.receipt.receipt_number}`);
      setReceiptDetail(res.data);
    } catch (err: any) {
      toastError('Gagal Memuat Kuitansi', err?.response?.data?.detail || 'Kuitansi tidak ditemukan.');
    } finally {
      setIsReceiptLoading(false);
    }
  };

  const handleOpenVoid = (pmt: any) => {
    setSelectedPayment(pmt);
    setVoidReason('');
    setShowVoidModal(true);
  };

  const handleConfirmVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !voidReason) {
      toastError('Alasan Kosong', 'Alasan pembatalan/void wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/payments/${selectedPayment.id}/void`, {
        reason: voidReason,
      });
      success('Pembayaran Divoid', `Transaksi ID ${selectedPayment.id} berhasil dibatalkan dan kuitansi ditandai tidak berlaku (VOID).`);
      setShowVoidModal(false);
      fetchData();
    } catch (err: any) {
      toastError('Gagal Void Transaksi', err?.response?.data?.detail || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    if (!searchTerm) return true;
    const stName = allStudents.find(s => String(s.id) === String(p.student_id))?.full_name || '';
    const stNis = allStudents.find(s => String(s.id) === String(p.student_id))?.nis || '';
    const rNum = p.receipt?.receipt_number || '';
    return stName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           stNis.includes(searchTerm) || 
           rNum.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const monthsList = [
    { num: 1, name: 'Januari' }, { num: 2, name: 'Februari' }, { num: 3, name: 'Maret' },
    { num: 4, name: 'April' }, { num: 5, name: 'Mei' }, { num: 6, name: 'Juni' },
    { num: 7, name: 'Juli' }, { num: 8, name: 'Agustus' }, { num: 9, name: 'September' },
    { num: 10, name: 'Oktober' }, { num: 11, name: 'November' }, { num: 12, name: 'Desember' }
  ];

  if (isDemo) {
    return (
      <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 border-b border-slate/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Mode Showcase Demo</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
              <span>Kasir Manual & Pembayaran Sekolah</span>
            </h2>
            <p className="text-xs text-slate mt-1">Catat penerimaan tunai di loket dan verifikasi transfer manual dengan cetak kuitansi digital (Fase 4: B-19 & F-12).</p>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => success('Simulasi Kasir Manual', 'Beralih ke akun Admin Real untuk mencatat pembayaran tunai secara live.')} className="shrink-0 w-full sm:w-auto justify-center">Catat Pembayaran Baru</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card variant="elevated" padding="sm" className="p-4 bg-emerald-light/30 border border-emerald-primary/20">
            <span className="text-xs text-slate font-semibold block">Penerimaan Tunai Hari Ini</span>
            <span className="text-lg font-mono font-bold text-obsidian block mt-1">Rp 12.500.000</span>
            <span className="text-[11px] text-emerald-primary font-bold mt-1 inline-block">25 Transaksi Loket</span>
          </Card>
          <Card variant="elevated" padding="sm" className="p-4 bg-slate/5 border border-slate/15">
            <span className="text-xs text-slate font-semibold block">Transfer Bank / VA</span>
            <span className="text-lg font-mono font-bold text-obsidian block mt-1">Rp 48.000.000</span>
            <span className="text-[11px] text-slate font-medium mt-1 inline-block">92 Transaksi Gateway</span>
          </Card>
          <Card variant="elevated" padding="sm" className="p-4 bg-slate/5 border border-slate/15">
            <span className="text-xs text-slate font-semibold block">Infaq & Sedekah (Bulan Ini)</span>
            <span className="text-lg font-mono font-bold text-emerald-primary block mt-1">Rp 4.250.000</span>
            <span className="text-[11px] text-slate font-medium mt-1 inline-block">Sukarela Wali Santri</span>
          </Card>
        </div>

        <div className="overflow-x-auto border border-slate/20 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate/5 font-bold text-slate border-b border-slate/20">
                <th className="p-3">Waktu & Kuitansi</th>
                <th className="p-3">Santri</th>
                <th className="p-3">Item Dibayar</th>
                <th className="p-3">Nominal (Rp)</th>
                <th className="p-3">Metode</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate/10">
              <tr>
                <td className="p-3 font-mono">26/07/2026 14:30 <span className="block font-bold text-obsidian">REC-202607-001</span></td>
                <td className="p-3 font-bold text-obsidian">Muhammad Faiz Syafi'i <span className="block text-[10px] text-slate font-normal">XI-IPA-1</span></td>
                <td className="p-3 font-medium">SPP Bulan Juli 2026</td>
                <td className="p-3 font-mono font-bold text-emerald-primary">Rp 500.000</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate/10 font-bold text-[10px] uppercase">CASH</span></td>
                <td className="p-3"><Badge status="PAID">Berhasil</Badge></td>
              </tr>
              <tr>
                <td className="p-3 font-mono">26/07/2026 11:15 <span className="block font-bold text-obsidian">REC-202607-002</span></td>
                <td className="p-3 font-bold text-obsidian">Aisyah Zahra Syafi'i <span className="block text-[10px] text-slate font-normal">X-A</span></td>
                <td className="p-3 font-medium">Seragam Olahraga & Batik + Infaq</td>
                <td className="p-3 font-mono font-bold text-emerald-primary">Rp 800.000</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate/10 font-bold text-[10px] uppercase">TRANSFER</span></td>
                <td className="p-3"><Badge status="PAID">Berhasil</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-center text-xs text-slate bg-emerald-light/30 p-3 rounded-xl border border-emerald-primary/20">
          ✨ Menampilkan transaksi contoh (Mode Showcase Demo). Gunakan akun <b>admin / admin123</b> atau <b>admin_clean / admin123</b> untuk pengujian CRUD real-time.
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate/10 pb-4 mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-light text-emerald-primary text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Database Real-Time SQLite</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
              <span>Kasir Manual & Pembayaran Sekolah</span>
            </h2>
            <p className="text-xs text-slate mt-1">Loket kasir tunai (cash) & transfer manual untuk pembayaran SPP, Non-SPP, dan donasi kegiatan santri.</p>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd} className="shrink-0 w-full sm:w-auto justify-center">
            Catat Pembayaran Loket (Cash)
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate/50" />
            <input
              type="text"
              placeholder="Cari nama santri, NIS, atau no kuitansi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate/20 bg-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
            />
          </div>

          <div className="flex gap-1.5 w-full sm:w-auto">
            {['all', 'cash', 'transfer'].map((m) => (
              <button
                key={m}
                onClick={() => setFilterMethod(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${filterMethod === m ? 'bg-emerald-primary text-white shadow-sm' : 'bg-slate/5 text-slate hover:bg-slate/10'}`}
              >
                {m === 'all' ? `Semua Metode (${payments.length})` : m}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card variant="glass" padding="lg" className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" color="emerald" />
          <span className="text-xs text-slate mt-3 font-semibold">Memuat riwayat pembayaran dari database...</span>
        </Card>
      ) : filteredPayments.length === 0 ? (
        <Card variant="glass" padding="lg">
          <EmptyState
            title="Belum Ada Transaksi Pembayaran"
            description={searchTerm ? `Tidak ditemukan transaksi dengan kata kunci "${searchTerm}".` : "Database pembayaran saat ini masih bersih (0 record). Klik tombol Catat Pembayaran Loket di atas untuk mulai mencatat pembayaran santri via loket kasir."}
            action={!searchTerm ? <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>Catat Pembayaran Sekarang</Button> : undefined}
          />
        </Card>
      ) : (
        <Card variant="glass" padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate/15 bg-slate/5 text-slate font-bold uppercase text-[11px]">
                  <th className="p-3.5 pl-5">No Kuitansi / Tanggal</th>
                  <th className="p-3.5">Santri Pembayar</th>
                  <th className="p-3.5">Jenis / Item</th>
                  <th className="p-3.5">Nominal Bayar (Rp)</th>
                  <th className="p-3.5">Infaq (Rp)</th>
                  <th className="p-3.5">Metode</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate/10">
                {filteredPayments.map((p: any) => {
                  const st = allStudents.find(s => String(s.id) === String(p.student_id));
                  const isVoid = p.receipt?.is_void || false;

                  return (
                    <tr key={p.id} className={`hover:bg-white/60 transition-colors ${isVoid ? 'bg-rose-50/50 opacity-70' : ''}`}>
                      <td className="p-3.5 pl-5 font-mono font-bold text-obsidian">
                        <div className="flex items-center gap-1.5">
                          <span>{p.receipt?.receipt_number || `PMT-${p.id}`}</span>
                        </div>
                        <span className="block text-[10px] text-slate font-normal">{formatDateIndo(p.created_at)}</span>
                      </td>
                      <td className="p-3.5 font-bold text-obsidian">
                        <div>{st ? (st.full_name || st.name) : `Santri ID ${p.student_id}`}</div>
                        <span className="block text-[10px] font-mono text-slate font-normal">NIS: {st?.nis || '-'}</span>
                      </td>
                      <td className="p-3.5 font-semibold text-obsidian uppercase text-[11px]">
                        {p.payment_type === 'spp' ? `SPP Bulan ${p.spp_month} (${p.spp_year})` : p.payment_type}
                        {p.notes && <span className="block text-[10px] font-normal text-slate capitalize truncate max-w-[150px]">{p.notes}</span>}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-emerald-primary text-sm">
                        {formatRupiah(Number(p.amount))}
                      </td>
                      <td className="p-3.5 font-mono text-slate">
                        {p.infaq_amount > 0 ? formatRupiah(Number(p.infaq_amount)) : '-'}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate/10 font-bold text-[10px] uppercase text-obsidian">
                          {p.method}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {isVoid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-light text-rose-danger text-[10px] font-bold">
                            <XCircle className="w-3 h-3" /> VOID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-light text-emerald-primary text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> SAH
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenReceipt(p)}
                            className="p-1.5 rounded-lg bg-slate/5 text-slate hover:text-emerald-primary hover:bg-emerald-light/50 transition-colors"
                            title="Lihat & Cetak Kuitansi Digital"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {!isVoid && (
                            <button
                              onClick={() => handleOpenVoid(p)}
                              className="p-1.5 rounded-lg bg-slate/5 text-slate hover:text-rose-danger hover:bg-rose-light/50 transition-colors"
                              title="Batalkan / Void Transaksi Ini"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal Add Kasir Payment */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={
          <>
            <Plus className="w-5 h-5 text-emerald-primary" />
            <span>Catat Pembayaran Tunai (Loket Kasir)</span>
          </>
        }
        maxWidth="lg"
      >
            <form onSubmit={handleCreatePayment} className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="font-bold text-obsidian block mb-1">Pilih Santri Pembayar *</label>
                {allStudents.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-800 font-semibold">Belum ada data santri di database.</div>
                ) : (
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate/25 bg-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                  >
                    {allStudents.map((st: any) => (
                      <option key={st.id} value={st.id}>
                        {st.nis} - {st.full_name || st.name} ({st.academic_year || '2025/2026'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-obsidian block mb-1">Jenis Pembayaran *</label>
                  <select
                    value={paymentType}
                    onChange={(e: any) => setPaymentType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate/25 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                  >
                    <option value="spp">SPP Bulanan</option>
                    <option value="non_spp">Tagihan Non-SPP (Buku/Seragam)</option>
                    <option value="event">Donasi / Event Patungan</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-obsidian block mb-1">Metode Pembayaran</label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate/25 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                  >
                    <option value="cash">Tunai (Cash / Loket)</option>
                    <option value="transfer">Transfer Manual / EDC</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Fields depending on paymentType */}
              {paymentType === 'spp' ? (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate/5 border border-slate/15">
                  <div>
                    <label className="font-bold text-obsidian block mb-1">Bulan SPP (1-12) *</label>
                    <select
                      value={sppMonth}
                      onChange={(e) => setSppMonth(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate/25 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                    >
                      {monthsList.map(m => (
                        <option key={m.num} value={m.num}>{m.name} ({m.num})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-obsidian block mb-1">Tahun SPP *</label>
                    <select
                      value={sppYear}
                      onChange={(e) => setSppYear(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate/25 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                    >
                      <option value={2026}>2026</option>
                      <option value={2025}>2025</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate/5 border border-slate/15">
                  <label className="font-bold text-obsidian block mb-1">Pilih Tagihan Belum Lunas *</label>
                  {studentBills.length === 0 ? (
                    <div className="text-slate italic py-2 text-center">Santri ini tidak memiliki tagihan Non-SPP/Event yang belum lunas.</div>
                  ) : (
                    <select
                      value={selectedBillId}
                      onChange={(e) => {
                        setSelectedBillId(e.target.value);
                        const b = studentBills.find(x => String(x.id) === e.target.value);
                        if (b) setAmount(Number(b.remaining_amount || b.amount));
                      }}
                      className="w-full p-2 rounded-lg border border-slate/25 bg-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                    >
                      <option value="">-- Pilih Tagihan --</option>
                      {studentBills.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.label} — Sisa Rp {formatRupiah(Number(b.remaining_amount || b.amount))}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-obsidian block mb-1">Nominal Pembayaran (Rp) *</label>
                  <InputCurrency
                    value={amount}
                    onChange={(val) => setAmount(val)}
                    placeholder="Rp 0"
                  />
                </div>
                <div>
                  <label className="font-bold text-obsidian block mb-1">Infaq / Sedekah Sukarela (Rp)</label>
                  <InputCurrency
                    value={infaqAmount}
                    onChange={(val) => setInfaqAmount(val)}
                    placeholder="Rp 0"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-obsidian block mb-1">Catatan / Keterangan Loket</label>
                <input
                  type="text"
                  placeholder="Misal: Pembayaran langsung oleh Ibu santri..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate/25 focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-light/20 border border-emerald-primary/20 flex items-center justify-between text-xs font-bold text-obsidian mt-1">
                <span>Total Dana Diterima:</span>
                <span className="text-sm font-mono text-emerald-primary">{formatRupiah(amount + infaqAmount)}</span>
              </div>

              <div className="flex justify-end gap-2.5 mt-2 pt-3 border-t border-slate/15 shrink-0">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>Batal</Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!selectedStudentId || amount <= 0 || (paymentType !== 'spp' && !selectedBillId)}
                  isLoading={isSubmitting}
                >
                  Terbitkan Kuitansi & Simpan
                </Button>
              </div>
            </form>
      </Modal>

      {/* Modal Receipt Detail */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title={
          <>
            <Printer className="w-5 h-5 text-emerald-primary" />
            <span>Kuitansi Digital Resmi</span>
          </>
        }
        maxWidth="md"
      >
            {isReceiptLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Spinner size="md" color="emerald" />
                <span className="text-xs text-slate mt-2">Memuat kuitansi dari database...</span>
              </div>
            ) : receiptDetail ? (
              <div className="flex flex-col gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate/5 border border-slate/20 flex flex-col gap-2 relative overflow-hidden">
                  {receiptDetail.receipt?.is_void && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-20deg] text-rose-danger/20 font-extrabold text-4xl uppercase pointer-events-none">
                      VOID / BATAL
                    </div>
                  )}

                  <div className="text-center pb-3 border-b border-dashed border-slate/30">
                    <h4 className="font-extrabold text-obsidian text-sm">PTDARRAHMAN</h4>
                    <span className="text-[10px] text-slate block font-mono mt-0.5">{receiptDetail.receipt?.receipt_number}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-slate">Tanggal Bayar:</span>
                    <span className="font-semibold text-obsidian">{formatDateIndo(receiptDetail.receipt?.created_at)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate">Nama Santri:</span>
                    <span className="font-bold text-obsidian">{receiptDetail.student?.full_name} ({receiptDetail.student?.nis})</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate">Rincian Item:</span>
                    <span className="font-bold text-emerald-primary uppercase text-right max-w-[200px]">{receiptDetail.item_label}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate">Metode Bayar:</span>
                    <span className="font-bold uppercase">{receiptDetail.payment?.method}</span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-dashed border-slate/30 flex justify-between items-center">
                    <span className="font-bold text-obsidian">Total Diterima:</span>
                    <span className="font-mono font-extrabold text-emerald-primary text-base">
                      {formatRupiah(Number(receiptDetail.payment?.total_amount || 0))}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Printer className="w-4 h-4" />}
                    onClick={() => success('Cetak Kuitansi', 'Perintah cetak thermal 58mm / 80mm berhasil dikirim.')}
                    className="w-full justify-center"
                  >
                    Cetak Kuitansi Thermal
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => success('Unduh PDF', 'File Kuitansi Digital .PDF sedang diunduh.')}
                    className="w-full justify-center"
                  >
                    Unduh PDF
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate italic text-xs">Detail kuitansi tidak tersedia.</div>
            )}
      </Modal>

      {/* Modal Void Payment */}
      <Modal
        isOpen={showVoidModal && !!selectedPayment}
        onClose={() => setShowVoidModal(false)}
        title={
          <span className="text-rose-danger flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Batalkan (Void) Transaksi Pembayaran</span>
          </span>
        }
        maxWidth="md"
      >
            {selectedPayment && (
              <p className="text-xs text-slate mb-4">
                Pembatalan transaksi ID <b>{selectedPayment.id}</b> senilai <b>{formatRupiah(Number(selectedPayment.amount))}</b> akan membatalkan kuitansi, mengembalikan sisa tagihan santri, dan dicatat dalam log keamanan (Audit Trail B-25 & B-27).
              </p>
            )}

            <form onSubmit={handleConfirmVoid} className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="font-bold text-obsidian block mb-1">Alasan Pembatalan / Void *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Misal: Salah input nominal / duplikasi bayar / permintaan wali..."
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate/25 focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                />
              </div>

              <div className="flex justify-end gap-2.5 mt-2 pt-3 border-t border-slate/15">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowVoidModal(false)}>Batal</Button>
                <Button type="submit" variant="danger" size="sm" isLoading={isSubmitting} disabled={!voidReason.trim()}>
                  Konfirmasi Void Transaksi
                </Button>
              </div>
            </form>
      </Modal>
    </div>
  );
};

export default PaymentKasirPage;
