import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Modal, ReceiptShareCard, EmptyState, Spinner, formatRupiah, formatDateIndo } from '../../components/ui';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../components/ui/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { HeartHandshake, Plus, ArrowUpRight, ArrowDownRight, Wallet, Trash2, ShieldCheck } from 'lucide-react';
import type { Receipt } from '../../types';

export const InfaqPage: React.FC = () => {
  const { settings } = useSettings();
  const { success, error: toastError } = useToast();
  const { user } = useAuth();

  const isDemo = user?.email === 'demo' || user?.email === 'admin_clean@ptdarrahman.sch.id' || user?.name?.toLowerCase().includes('demo');

  const [activeTab, setActiveTab] = useState<'inflow' | 'outflow'>('inflow');
  const [inflowData, setInflowData] = useState<any[]>([]);
  const [outflowData, setOutflowData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // Modal Outflow State
  const [showOutflowModal, setShowOutflowModal] = useState(false);
  const [outflowTitle, setOutflowTitle] = useState('');
  const [outflowAmount, setOutflowAmount] = useState(500000);
  const [outflowNotes, setOutflowNotes] = useState('');
  const [outflowDate, setOutflowDate] = useState(new Date().toISOString().substring(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInfaqData = async () => {
    if (isDemo) {
      // Mock Inflow (Uang Masuk Infaq dari pembayaran)
      setInflowData([
        { id: 'inf-in-01', receipt_number: 'KUITANSI-202607-001', student_name: 'Ahmad Fauzi', nis: '20240101', grade: 'X-A', invoice: 'INV-2026-0701', infaq_amount: 50000, date: '2026-07-27T10:15:00Z', payment_type: 'SPP Juli 2026' },
        { id: 'inf-in-02', receipt_number: 'KUITANSI-202607-015', student_name: 'Siti Aminah', nis: '20240102', grade: 'XI-IPA-1', invoice: 'INV-2026-0715', infaq_amount: 100000, date: '2026-07-26T14:30:00Z', payment_type: 'SPP Juli 2026' },
        { id: 'inf-in-03', receipt_number: 'KUITANSI-202607-023', student_name: 'Muhammad Ridwan', nis: '20240103', grade: 'XII-IPS-2', invoice: 'INV-2026-0723', infaq_amount: 25000, date: '2026-07-25T09:45:00Z', payment_type: 'Seragam Sekolah' },
        { id: 'inf-in-04', receipt_number: 'KUITANSI-202606-088', student_name: 'Zahra Putri', nis: '20240104', grade: 'X-B', invoice: 'INV-2026-0688', infaq_amount: 50000, date: '2026-06-28T16:10:00Z', payment_type: 'SPP Juni 2026' }
      ]);
      // Mock Outflow (Uang Keluar / Penyaluran Infaq)
      setOutflowData([
        { id: 'inf-out-01', title: 'Perbaikan AC Masjid Utama & Pembersihan Filter', amount: 850000, notes: 'Dibayarkan kepada teknisi CV Berkah Dingin untuk 4 unit AC masjid.', date: '2026-07-20T11:00:00Z', pic: 'Ust. Hasyim' },
        { id: 'inf-out-02', title: 'Santunan Rutin Yatim & Dhuafa Sekitar Pesantren', amount: 1500000, notes: 'Penyaluran dana santunan bulanan untuk 15 anak yatim di sekitar lingkungan pesantren.', date: '2026-07-15T09:30:00Z', pic: 'Ust. Hasyim' },
        { id: 'inf-out-03', title: 'Pembelian Karpet Sujud Tambahan Shalat Jumat', amount: 1200000, notes: '4 gulung karpet sajadah hijau turki untuk saf tambahan selasar masjid.', date: '2026-06-30T14:15:00Z', pic: 'Bendahara Sekolah' }
      ]);
      return;
    }

    setIsLoading(true);
    try {
      // Ambil transaksi pembayaran yang memiliki infaq_amount > 0
      const res = await api.get('/payments?limit=200');
      const payments = res.data || [];
      const inflows = payments
        .filter((p: any) => Number(p.infaq_amount || 0) > 0)
        .map((p: any) => ({
          id: p.id,
          receipt_number: p.receipt?.receipt_number || `PMT-${p.id}`,
          student_name: p.student?.name || p.user?.name || 'Santri',
          nis: p.student?.nis || '-',
          grade: p.student?.grade || '-',
          invoice: p.invoice_number || '-',
          infaq_amount: Number(p.infaq_amount),
          date: p.created_at,
          payment_type: p.items?.[0]?.title || 'Pembayaran SPP/Non-SPP',
          raw_payment: p
        }));
      setInflowData(inflows);

      // Simpan outflow di localStorage jika backend belum punya table khusus
      const savedOutflows = localStorage.getItem('ptdarrahman_infaq_outflows');
      if (savedOutflows) {
        setOutflowData(JSON.parse(savedOutflows));
      } else {
        setOutflowData([]);
      }
    } catch (err: any) {
      toastError('Gagal Memuat Kas Infaq', err?.response?.data?.detail || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInfaqData();
  }, [isDemo]);

  const totalInflow = inflowData.reduce((acc, curr) => acc + (Number(curr.infaq_amount) || 0), 0);
  const totalOutflow = outflowData.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const currentBalance = totalInflow - totalOutflow;

  const handleAddOutflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outflowTitle || outflowAmount <= 0) return;
    setIsSubmitting(true);

    const newOutflow = {
      id: `out-${Date.now()}`,
      title: outflowTitle,
      amount: outflowAmount,
      notes: outflowNotes,
      date: new Date(outflowDate).toISOString(),
      pic: user?.name || 'Admin Bendahara'
    };

    const updated = [newOutflow, ...outflowData];
    setOutflowData(updated);
    if (!isDemo) {
      localStorage.setItem('ptdarrahman_infaq_outflows', JSON.stringify(updated));
    }

    success('Pengeluaran Infaq Dicatat', `Penyaluran dana sebesar ${formatRupiah(outflowAmount)} berhasil disimpan ke buku kas infaq.`);
    setShowOutflowModal(false);
    setOutflowTitle('');
    setOutflowAmount(500000);
    setOutflowNotes('');
    setIsSubmitting(false);
  };

  const handleDeleteOutflow = (id: string) => {
    const updated = outflowData.filter(item => item.id !== id);
    setOutflowData(updated);
    if (!isDemo) {
      localStorage.setItem('ptdarrahman_infaq_outflows', JSON.stringify(updated));
    }
    success('Pengeluaran Dihapus', 'Catatan pengeluaran dana infaq telah dihapus dari ledger.');
  };

  const handleOpenReceipt = (item: any) => {
    const mockReceipt: Receipt = {
      id: `rcp-inf-${item.id}`,
      receipt_number: item.receipt_number,
      verification_code: `VER-INF-${item.id}`,
      created_at: item.date || new Date().toISOString(),
      payment_id: String(item.id),
      payment: item.raw_payment || {
        id: String(item.id),
        invoice_number: item.invoice,
        user_id: 'usr-01',
        student_id: 'std-01',
        student: { id: 'std-01', nis: item.nis, name: item.student_name, grade: item.grade, status: 'ACTIVE' },
        total_amount: item.infaq_amount,
        payment_method: 'Transfer / Gateway',
        status: 'SUCCESS',
        created_at: item.date,
        items: [{ id: `itm-${item.id}`, payment_id: String(item.id), item_type: 'INFAQ', title: `Infaq Sukarela (${item.payment_type})`, nominal: item.infaq_amount }]
      },
      is_void: false
    };
    setSelectedReceipt(mockReceipt);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <Card variant="glass" padding="md" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
            <HeartHandshake className="w-6 h-6 text-emerald-primary shrink-0" />
            <span>Kas Infaq (Buku Kas & Ledger)</span>
          </h2>
          <p className="text-xs text-slate mt-1">Pencatatan transparan uang masuk infaq dari tagihan dan penyaluran/pengeluaran dana infaq.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowOutflowModal(true)}
          className="shadow-md"
        >
          Catat Pengeluaran Infaq
        </Button>
      </Card>

      {/* Summary Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="elevated" padding="md" className="bg-gradient-to-br from-emerald-primary to-emerald-dark text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-light uppercase tracking-wider">Saldo Kas Infaq Terkini</span>
            <Wallet className="w-5 h-5 text-gold-light" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black mt-2 text-white">
            {formatRupiah(currentBalance)}
          </div>
          <p className="text-[10px] text-emerald-light/80 mt-1">Dana siap disalurkan untuk kegiatan & fasilitas pesantren</p>
        </Card>

        <Card variant="glass" padding="md" className="border border-emerald-primary/20 bg-white/90">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate uppercase tracking-wider">Total Uang Masuk (Kredit)</span>
            <div className="p-1.5 rounded-lg bg-emerald-light text-emerald-primary">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-mono font-black text-emerald-primary mt-2">
            {formatRupiah(totalInflow)}
          </div>
          <p className="text-[10px] text-slate mt-1">Terkumpul dari {inflowData.length} transaksi pembayaran bergandeng infaq</p>
        </Card>

        <Card variant="glass" padding="md" className="border border-rose-danger/20 bg-white/90">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate uppercase tracking-wider">Total Uang Keluar (Debit)</span>
            <div className="p-1.5 rounded-lg bg-rose-light text-rose-danger">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-mono font-black text-rose-danger mt-2">
            {formatRupiah(totalOutflow)}
          </div>
          <p className="text-[10px] text-slate mt-1">Telah disalurkan dalam {outflowData.length} program kegiatan & renovasi</p>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate/20 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('inflow')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'inflow'
              ? 'bg-emerald-primary text-white shadow-md scale-[1.02]'
              : 'bg-white/60 text-slate hover:bg-white text-obsidian'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>Riwayat Uang Masuk Infaq ({inflowData.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('outflow')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'outflow'
              ? 'bg-rose-danger text-white shadow-md scale-[1.02]'
              : 'bg-white/60 text-slate hover:bg-white text-obsidian'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Pencatatan Uang Keluar / Debit ({outflowData.length})</span>
        </button>
      </div>

      {/* Tab Content 1: Inflow (Uang Masuk) */}
      {activeTab === 'inflow' && (
        <Card variant="glass" padding="none" className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center"><Spinner size="lg" color="emerald" /><span className="text-xs text-slate font-semibold mt-3">Memuat data infaq...</span></div>
          ) : inflowData.length === 0 ? (
            <EmptyState
              title="Belum Ada Uang Masuk Infaq"
              description="Belum ada transaksi pembayaran santri yang menyertakan nominal infaq sukarela."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate/15 bg-slate/5 text-slate font-bold uppercase text-[11px]">
                    <th className="p-3.5 pl-5">No Kuitansi / Tanggal & Jam</th>
                    <th className="p-3.5">Santri & Kelas</th>
                    <th className="p-3.5">Sumber Pembayaran</th>
                    <th className="p-3.5 text-right">Nominal Infaq</th>
                    <th className="p-3.5 pr-5 text-right">Kuitansi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate/10">
                  {inflowData.map((item) => (
                    <tr key={item.id} onClick={() => handleOpenReceipt(item)} className="hover:bg-white/70 transition-colors cursor-pointer">
                      <td className="p-3.5 pl-5">
                        <div className="font-mono font-bold text-obsidian">{item.receipt_number}</div>
                        <div className="text-[10px] text-slate font-medium mt-0.5">{formatDateIndo(item.date, true)}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-obsidian">{item.student_name}</div>
                        <div className="text-[10px] text-slate font-mono">NIS: {item.nis} • Kelas {item.grade}</div>
                      </td>
                      <td className="p-3.5 font-medium text-slate">
                        <span>{item.payment_type}</span>
                        <span className="block text-[10px] text-slate/80 font-mono">Inv: {item.invoice}</span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-primary text-sm">
                        + {formatRupiah(item.infaq_amount)}
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-primary" />}
                          onClick={(e) => { e.stopPropagation(); handleOpenReceipt(item); }}
                        >
                          Lihat
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab Content 2: Outflow (Uang Keluar) */}
      {activeTab === 'outflow' && (
        <Card variant="glass" padding="none" className="overflow-hidden">
          {outflowData.length === 0 ? (
            <EmptyState
              title="Belum Ada Catatan Pengeluaran Infaq"
              description="Buku kas penyaluran atau penggunaan dana infaq pesantren masih kosong."
              action={<Button variant="primary" size="sm" onClick={() => setShowOutflowModal(true)}>+ Catat Pengeluaran Pertama</Button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate/15 bg-slate/5 text-slate font-bold uppercase text-[11px]">
                    <th className="p-3.5 pl-5">Tanggal & Jam Penyaluran</th>
                    <th className="p-3.5">Keterangan / Tujuan Pengeluaran</th>
                    <th className="p-3.5">Penanggung Jawab (PIC)</th>
                    <th className="p-3.5 text-right">Nominal Keluar (Debit)</th>
                    <th className="p-3.5 pr-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate/10">
                  {outflowData.map((item) => (
                    <tr key={item.id} className="hover:bg-white/70 transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="font-bold text-obsidian">{formatDateIndo(item.date, true)}</div>
                      </td>
                      <td className="p-3.5 max-w-md">
                        <div className="font-bold text-obsidian text-sm">{item.title}</div>
                        {item.notes && <p className="text-xs text-slate mt-0.5 leading-relaxed">{item.notes}</p>}
                      </td>
                      <td className="p-3.5 font-medium text-slate">
                        <Badge status="INFO" size="sm">{item.pic}</Badge>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-rose-danger text-sm">
                        - {formatRupiah(item.amount)}
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOutflow(item.id)}
                          className="text-rose-danger hover:bg-rose-light/50"
                          title="Hapus Catatan Pengeluaran"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Modal Add Outflow */}
      <Modal
        isOpen={showOutflowModal}
        onClose={() => setShowOutflowModal(false)}
        title="Catat Pengeluaran / Penyaluran Dana Infaq"
      >
        <form onSubmit={handleAddOutflow} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="font-bold text-obsidian block mb-1">Judul / Tujuan Penyaluran Infaq *</label>
            <input
              type="text"
              required
              placeholder="Misal: Perbaikan Sound System Masjid, Santunan Yatim..."
              value={outflowTitle}
              onChange={(e) => setOutflowTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate/25 font-bold text-obsidian focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-obsidian block mb-1">Nominal Pengeluaran (Rp) *</label>
              <input
                type="number"
                required
                min={1000}
                step={1000}
                value={outflowAmount}
                onChange={(e) => setOutflowAmount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate/25 font-mono font-bold text-rose-danger focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
              />
            </div>
            <div>
              <label className="font-bold text-obsidian block mb-1">Tanggal Pengeluaran</label>
              <input
                type="date"
                required
                value={outflowDate}
                onChange={(e) => setOutflowDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate/25 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-obsidian block mb-1">Catatan Tambahan / Rincian Penerima (Opsional)</label>
            <textarea
              rows={3}
              placeholder="Jelaskan detail penerima manfaat atau vendor penyedia barang/jasa..."
              value={outflowNotes}
              onChange={(e) => setOutflowNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate/25 focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
            />
          </div>

          <div className="bg-emerald-light/40 p-3 rounded-xl border border-emerald-primary/20 text-slate text-[11px]">
            ℹ️ Pengeluaran yang dicatat akan mengurangi saldo kas infaq secara real-time pada laporan akuntansi pesantren.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate/15">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowOutflowModal(false)}>Batal</Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>Simpan Pengeluaran Infaq</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Receipt Share */}
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
