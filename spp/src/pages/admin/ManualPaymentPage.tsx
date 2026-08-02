import React, { useState, useEffect } from 'react';
import { Card, Button, EmptyState, Spinner, InputCurrency, Input, Textarea, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, formatRupiah, formatDateIndo, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/ToastContext';
import { api } from '../../api/client';
import { DollarSign, Plus, Search, Printer, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { Student } from '../../types';
import { currentAcademicYearLabel } from '../../utils/academicYear';

export const ManualPaymentPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [payments, setPayments] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [studentBills, setStudentBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
  const [sppYear, setSppYear] = useState<number>(new Date().getFullYear());
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [amount, setAmount] = useState<number>(500000);
  const [infaqAmount, setInfaqAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [notes, setNotes] = useState('');
  const [voidReason, setVoidReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
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
  }, [filterMethod]);

  // Load bills when student changes for non_spp or event
  useEffect(() => {
    if (!selectedStudentId || paymentType === 'spp') {
      setStudentBills([]);
      return;
    }
    const fetchStudentBills = async () => {
      try {
        const res = await api.get(`/bills/non-spp?student_id=${selectedStudentId}&status=unpaid`);
        setStudentBills(res.data || []);
      } catch {
        setStudentBills([]);
      }
    };
    fetchStudentBills();
  }, [selectedStudentId, paymentType]);

  const handleOpenAdd = () => {
    setSelectedStudentId(allStudents[0]?.id ? String(allStudents[0].id) : '');
    setPaymentType('spp');
    setSppMonth(new Date().getMonth() + 1);
    setSppYear(new Date().getFullYear());
    setSelectedBillId('');
    setAmount(500000);
    setInfaqAmount(0);
    setPaymentMethod('cash');
    setNotes('Pembayaran manual');
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

  return (
    <div className="flex flex-col gap-6">
      <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate/10 pb-4 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
              <span>Pembayaran Manual</span>
            </h2>
            <p className="text-xs text-slate mt-1">
              Catat pembayaran langsung dari orang tua/parents santri yang membayar cash (atau transfer manual) di loket. Admin cukup menginput nominal ke sistem, kuitansi digital otomatis terbit.
            </p>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd} className="shrink-0 w-full sm:w-auto justify-center">
            Catat Pembayaran
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate/50" />
            <Input
              type="text"
              placeholder="Cari nama santri, NIS, atau no kuitansi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 text-xs"
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
          <span className="text-xs text-slate mt-3 font-semibold">Memuat riwayat pembayaran...</span>
        </Card>
      ) : filteredPayments.length === 0 ? (
        <Card variant="glass" padding="lg">
          <EmptyState
            title="Belum Ada Transaksi Pembayaran"
            description={searchTerm ? `Tidak ditemukan transaksi dengan kata kunci "${searchTerm}".` : "Belum ada catatan pembayaran. Klik Catat Pembayaran untuk menambahkan."}
            action={!searchTerm ? <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>Catat Pembayaran</Button> : undefined}
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
                            aria-label="Lihat dan cetak kuitansi"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {!isVoid && (
                            <button
                              onClick={() => handleOpenVoid(p)}
                              className="p-1.5 rounded-lg bg-slate/5 text-slate hover:text-rose-danger hover:bg-rose-light/50 transition-colors"
                              title="Batalkan / Void Transaksi Ini"
                              aria-label="Batalkan transaksi"
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

      {/* Modal Add Manual Payment */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Catat Pembayaran Manual"
        icon={<Plus className="w-5 h-5" />}
        maxWidth="lg"
      >
            <form onSubmit={handleCreatePayment} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Pilih Santri Pembayar *</label>
                {allStudents.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-800 font-semibold">Belum ada data santri.</div>
                ) : (
                  <Select
                    value={selectedStudentId}
                    onValueChange={(v) => setSelectedStudentId(v)}
                  >
                    <SelectTrigger className="w-full font-bold text-xs">
                      <SelectValue placeholder="Pilih santri..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allStudents.map((st: any) => (
                        <SelectItem key={st.id} value={String(st.id)}>
                          {st.nis} - {st.full_name || st.name} ({st.academic_year || currentAcademicYearLabel()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Jenis Pembayaran *</label>
                  <Select
                    value={paymentType}
                    onValueChange={(v) => setPaymentType(v as 'spp' | 'non_spp' | 'event')}
                  >
                    <SelectTrigger className="w-full font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spp">SPP Bulanan</SelectItem>
                      <SelectItem value="non_spp">Tagihan Non-SPP (Buku/Seragam)</SelectItem>
                      <SelectItem value="event">Donasi / Event Patungan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Metode Pembayaran</label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as 'cash' | 'transfer')}
                  >
                    <SelectTrigger className="w-full font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Tunai</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dynamic Fields depending on paymentType */}
              {paymentType === 'spp' ? (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate/5 border border-slate/15">
                  <div>
                    <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Bulan SPP (1-12) *</label>
                    <Select
                      value={sppMonth != null ? String(sppMonth) : undefined}
                      onValueChange={(v) => setSppMonth(Number(v))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monthsList.map(m => (
                          <SelectItem key={m.num} value={String(m.num)}>{m.name} ({m.num})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Tahun SPP *</label>
                    <Select
                      value={sppYear != null ? String(sppYear) : undefined}
                      onValueChange={(v) => setSppYear(Number(v))}
                    >
                      <SelectTrigger className="w-full font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate/5 border border-slate/15">
                  <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Pilih Tagihan Belum Lunas *</label>
                  {studentBills.length === 0 ? (
                    <div className="text-slate italic py-2 text-center">Santri ini tidak memiliki tagihan Non-SPP/Event yang belum lunas.</div>
                  ) : (
                    <Select
                      value={selectedBillId}
                      onValueChange={(v) => {
                        setSelectedBillId(v);
                        const b = studentBills.find(x => String(x.id) === v);
                        if (b) setAmount(Number(b.remaining_amount || b.amount));
                      }}
                    >
                      <SelectTrigger className="w-full font-bold">
                        <SelectValue placeholder="-- Pilih Tagihan --" />
                      </SelectTrigger>
                      <SelectContent>
                        {studentBills.map(b => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.label} — Sisa Rp {formatRupiah(Number(b.remaining_amount || b.amount))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Nominal Pembayaran (Rp) *</label>
                  <InputCurrency
                    value={amount}
                    onChange={(val) => setAmount(val)}
                    placeholder="Rp 0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Infaq / Sedekah Sukarela (Rp)</label>
                  <InputCurrency
                    value={infaqAmount}
                    onChange={(val) => setInfaqAmount(val)}
                    placeholder="Rp 0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Catatan / Keterangan Loket</label>
                <Input
                  type="text"
                  placeholder="Misal: Pembayaran langsung oleh Ibu santri..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-light/20 border border-emerald-primary/20 flex items-center justify-between text-xs font-bold text-obsidian mt-1">
                <span>Total Dana Diterima:</span>
                <span className="text-sm font-mono text-emerald-primary">{formatRupiah(amount + infaqAmount)}</span>
              </div>

              <div className="flex justify-end gap-2.5 mt-1 pt-4 border-t border-slate/15 shrink-0">
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
        title="Kuitansi Digital Resmi"
        icon={<Printer className="w-5 h-5" />}
        maxWidth="md"
      >
            {isReceiptLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Spinner size="md" color="emerald" />
                <span className="text-xs text-slate mt-2">Memuat kuitansi...</span>
              </div>
            ) : receiptDetail ? (
              <div className="flex flex-col gap-4 text-xs">
                <div className="print-area p-4 rounded-2xl bg-slate/5 border border-slate/20 flex flex-col gap-2 relative overflow-hidden">
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
                    onClick={() => window.print()}
                    className="w-full justify-center"
                  >
                    Cetak / Simpan PDF
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
        title="Batalkan (Void) Transaksi Pembayaran"
        icon={<AlertTriangle className="w-5 h-5" />}
        maxWidth="md"
      >
            {selectedPayment && (
              <p className="text-xs text-slate mb-4">
                Pembatalan transaksi ID <b>{selectedPayment.id}</b> senilai <b>{formatRupiah(Number(selectedPayment.amount))}</b> akan membatalkan kuitansi, mengembalikan sisa tagihan santri, dan dicatat dalam log keamanan (Audit Trail B-25 & B-27).
              </p>
            )}

            <form onSubmit={handleConfirmVoid} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Alasan Pembatalan / Void *</label>
                <Textarea
                  rows={2}
                  required
                  placeholder="Misal: Salah input nominal / duplikasi bayar / permintaan parents..."
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end gap-2.5 mt-1 pt-4 border-t border-slate/15">
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

export default ManualPaymentPage;
