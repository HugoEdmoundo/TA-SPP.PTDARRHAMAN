import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Modal, ReceiptShareCard, EmptyState, Spinner, Input, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, formatRupiah, formatDateIndo } from '../../components/ui';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../components/ui/ToastContext';
import { api } from '../../api/client';
import { History, Search, ArrowLeft, User, Phone, Mail, GraduationCap, ShieldCheck, CheckCircle2, XCircle, Filter, Calendar } from 'lucide-react';
import type { Student, Receipt } from '../../types';

export const StudentHistoryPage: React.FC = () => {
  const { settings } = useSettings();
  const { error: toastError } = useToast();

  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');

  // Detailed View State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchHistory, setSearchHistory] = useState('');

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const fetchStudents = async () => {

    setIsLoadingStudents(true);
    try {
      const res = await api.get('/students?limit=300');
      setStudentsList(res.data || []);
    } catch (err: any) {
      toastError('Gagal Memuat Data Santri', err?.response?.data?.detail || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudentHistory = async (student: Student) => {
    setSelectedStudent(student);

    setIsLoadingHistory(true);
    try {
      const res = await api.get(`/payments?student_id=${student.id}&limit=200`);
      const raw = res.data || [];
      const mapped = raw.map((p: any) => ({
        id: p.id,
        receipt_number: p.receipt?.receipt_number || `PMT-${p.id}`,
        invoice_number: p.invoice_number || `INV-${p.id}`,
        title: p.items?.[0]?.title || `Pembayaran ${p.payment_method}`,
        type: p.items?.[0]?.item_type || 'SPP',
        amount: Number(p.total_amount),
        date: p.created_at,
        method: p.payment_method?.replace('_', ' ') || 'Manual / Gateway',
        status: p.receipt?.is_void ? 'VOID' : 'SUCCESS',
        infaq: Number(p.infaq_amount || 0),
        raw_payment: p
      }));
      setHistoryData(mapped);
    } catch (err: any) {
      toastError('Gagal Memuat Riwayat', err?.response?.data?.detail || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleOpenReceipt = (item: any) => {
    if (!selectedStudent) return;
    const mockReceipt = {
      id: `rcp-${item.id}`,
      receipt_number: item.receipt_number,
      verification_code: `VER-PTD-${item.id}`,
      created_at: item.date || new Date().toISOString(),
      payment_id: String(item.id),
      payment: item.raw_payment || {
        id: String(item.id),
        invoice_number: item.invoice_number,
        user_id: 'usr-wali',
        student_id: String(selectedStudent.id),
        student: { id: String(selectedStudent.id), nis: selectedStudent.nis, name: selectedStudent.name, status: 'ACTIVE' },
        total_amount: item.amount,
        payment_method: item.method,
        status: item.status === 'VOID' ? 'VOID' : 'SUCCESS',
        created_at: item.date,
        items: [{ id: `itm-${item.id}`, payment_id: String(item.id), item_type: item.type, title: item.title, nominal: item.amount }]
      },
      is_void: item.status === 'VOID'
    } as unknown as Receipt;
    setSelectedReceipt(mockReceipt);
  };

  const filteredStudents = studentsList.filter(s => 
    (s.name || '').toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.nis.includes(searchStudent)
  );

  const filteredHistory = historyData.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchHistory.toLowerCase()) ||
                          item.receipt_number.toLowerCase().includes(searchHistory.toLowerCase()) ||
                          item.invoice_number.toLowerCase().includes(searchHistory.toLowerCase());
    const matchesType = filterType === 'all' || item.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const totalPaidSum = historyData.reduce((acc, curr) => curr.status !== 'VOID' ? acc + (Number(curr.amount) || 0) : acc, 0);

  const linkedParents = (selectedStudent as any)?.parents || (selectedStudent as any)?.parent ? [(selectedStudent as any).parent] : [];
  const primaryParent = linkedParents[0];
  const parentName = primaryParent?.full_name || primaryParent?.name || '-';
  const parentPhone = primaryParent?.phone || '-';
  const parentUsername = primaryParent?.username || '-';

  // STATE 1: Student Card Grid / Feed View
  if (!selectedStudent) {
    return (
      <div className="flex flex-col gap-6">
        <Card variant="glass" padding="md" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
              <History className="w-6 h-6 text-emerald-primary shrink-0" />
              <span>Log Transaksi & Riwayat per Santri</span>
            </h2>
            <p className="text-xs text-slate mt-1">Pilih kartu nama santri untuk memantau langsung riwayat aktivitas transaksi secara lengkap dari awal hingga akhir.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Input
              type="text"
              placeholder="Cari nama santri atau NIS..."
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="w-full pl-9 pr-3 text-xs font-bold"
            />
            <Search className="w-4 h-4 text-slate absolute left-3 top-2.5" />
          </div>
        </Card>

        {isLoadingStudents ? (
          <Card variant="glass" padding="lg" className="flex flex-col items-center justify-center py-16">
            <Spinner size="lg" color="emerald" />
            <span className="text-xs text-slate font-semibold mt-3">Memuat daftar santri...</span>
          </Card>
        ) : filteredStudents.length === 0 ? (
          <EmptyState title="Santri Tidak Ditemukan" description="Tidak ada data santri yang cocok dengan kata kunci pencarian." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredStudents.map((std) => (
              <Card
                key={std.id}
                variant="elevated"
                padding="md"
                onClick={() => fetchStudentHistory(std)}
                className="hover:border-emerald-primary/50 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between bg-white"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-light text-emerald-primary font-black text-sm flex items-center justify-center group-hover:bg-emerald-primary group-hover:text-white transition-colors">
                      {std.name?.[0]?.toUpperCase() || 'S'}
                    </div>
                    <Badge status="INFO" size="sm">{std.status || 'ACTIVE'}</Badge>
                  </div>
                  <h4 className="font-extrabold text-obsidian text-sm font-heading group-hover:text-emerald-primary transition-colors line-clamp-1">{std.name}</h4>
                  <p className="text-[11px] text-slate font-mono mt-0.5">NIS: {std.nis}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate/10 flex items-center justify-between text-xs text-slate-dark font-semibold">
                  <span className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-emerald-primary" />
                    <span>Pantau Log Transaksi</span>
                  </span>
                  <span className="text-emerald-primary group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // STATE 2: Detailed 2-Column Split View (Kiri: Profil Santri, Kanan: Full Timeline Transaksi)
  return (
    <div className="flex flex-col gap-6">
      {/* Top Back Navigation Banner */}
      <Card variant="glass" padding="sm" className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSelectedStudent(null)}
          className="flex items-center gap-2 text-xs font-extrabold text-obsidian hover:text-emerald-primary transition-colors px-2 py-1 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-primary" />
          <span>Kembali ke Daftar Santri</span>
        </button>
        <span className="text-xs font-mono text-slate font-semibold">
          Memantau Log Akses & Transaksi Santri • PTDARRAHMAN
        </span>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* KOLOM KIRI (w-1/3 on large): Profil Lengkap Si Santri */}
        <Card variant="elevated" padding="lg" className="lg:col-span-1 flex flex-col gap-5 sticky top-20 bg-white">
          <div className="flex flex-col items-center text-center pb-4 border-b border-slate/15">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-primary to-emerald-light text-white text-3xl font-black flex items-center justify-center shadow-lg mb-3">
              {selectedStudent.name?.[0]?.toUpperCase() || 'S'}
            </div>
            <h3 className="font-extrabold text-obsidian text-lg font-heading">{selectedStudent.name}</h3>
            <span className="text-xs font-mono text-emerald-primary font-bold mt-0.5">NIS: {selectedStudent.nis}</span>
            <div className="flex items-center gap-2 mt-2">
              <Badge status="INFO">{selectedStudent.academic_year || 'Aktif'}</Badge>
              <Badge status="INFO">{selectedStudent.status || 'ACTIVE'}</Badge>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate/10">
              <span className="text-slate font-medium flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-primary" /> Tahun Ajaran:
              </span>
              <span className="font-bold text-obsidian">{selectedStudent.academic_year || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate/10">
              <span className="text-slate font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-primary" /> Nama Parents / Ortu:
              </span>
              <span className="font-bold text-obsidian">{parentName}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate/10">
              <span className="text-slate font-medium flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-primary" /> No. WhatsApp Parents:
              </span>
              <span className="font-mono font-bold text-obsidian">{parentPhone}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate/10">
              <span className="text-slate font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-primary" /> Username Akun Parents:
              </span>
              <span className="font-mono font-semibold text-slate truncate max-w-[150px]">{parentUsername}</span>
            </div>
          </div>

          <div className="bg-emerald-light/40 p-3.5 rounded-2xl border border-emerald-primary/20 flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Rekapitulasi Pembayaran</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xs text-slate">Total Transaksi Lunas:</span>
              <span className="font-mono font-black text-emerald-primary text-base">{formatRupiah(totalPaidSum)}</span>
            </div>
            <span className="text-[10px] text-slate/80">Tercatat {historyData.length} riwayat aktivitas sejak awal masuk pesantren.</span>
          </div>
        </Card>

        {/* KOLOM KANAN (w-2/3 on large): Full Aktivitas Pembayaran & Log */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Search & Filter Bar */}
          <Card variant="glass" padding="sm" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/90">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Cari transaksi, no kuitansi, atau invoice..."
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                className="w-full pl-9 pr-3 text-xs font-semibold"
              />
              <Search className="w-4 h-4 text-slate absolute left-3 top-2.5" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate shrink-0" />
              <Select
                value={filterType}
                onValueChange={(v) => setFilterType(v)}
              >
                <SelectTrigger className="text-xs font-bold text-obsidian">
                  <SelectValue placeholder="Semua Jenis Tagihan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis Tagihan</SelectItem>
                  <SelectItem value="spp">SPP Bulanan</SelectItem>
                  <SelectItem value="non_spp">Tagihan Non-SPP</SelectItem>
                  <SelectItem value="event">Event & Kegiatan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Timeline Feed */}
          {isLoadingHistory ? (
            <Card variant="glass" padding="lg" className="flex flex-col items-center justify-center py-16">
              <Spinner size="lg" color="emerald" />
              <span className="text-xs text-slate font-semibold mt-3">Mengambil riwayat transaksi lengkap...</span>
            </Card>
          ) : filteredHistory.length === 0 ? (
            <Card variant="glass" padding="lg">
              <EmptyState title="Riwayat Transaksi Kosong" description="Belum ada catatan aktivitas pembayaran yang cocok untuk santri ini." />
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredHistory.map((item) => (
                <Card
                  key={item.id}
                  variant="elevated"
                  padding="md"
                  onClick={() => handleOpenReceipt(item)}
                  className="hover:border-emerald-primary/50 transition-all cursor-pointer group bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`p-3 rounded-2xl shrink-0 mt-0.5 group-hover:scale-105 transition-transform ${item.status === 'VOID' ? 'bg-rose-light text-rose-danger' : 'bg-emerald-light text-emerald-primary'}`}>
                      {item.status === 'VOID' ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-obsidian group-hover:text-emerald-primary transition-colors font-heading">{item.title}</span>
                        <Badge status={item.status === 'VOID' ? 'VOID' : 'PAID'} size="sm" />
                        {item.infaq > 0 && <span className="text-[10px] font-bold text-emerald-primary bg-emerald-light px-1.5 py-0.5 rounded">+ Infaq {formatRupiah(item.infaq)}</span>}
                      </div>
                      <p className="text-xs text-slate mt-1 font-mono">
                        No Kuitansi: <b>{item.receipt_number}</b> • Inv: {item.invoice_number}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] font-semibold text-slate-dark">
                        <span className="flex items-center gap-1 text-emerald-primary font-bold">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDateIndo(item.date, true)}</span> {/* MENAMPILKAN TANGGAL BESERTA JAM / WAKTU */}
                        </span>
                        <span>• Metode: {item.method}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-0 border-slate/10 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate block font-semibold uppercase">Nominal Transaksi:</span>
                      <span className="font-mono font-black text-obsidian text-base">{formatRupiah(item.amount)}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<ShieldCheck className="w-4 h-4 text-emerald-primary" />}
                      className="font-bold text-xs shrink-0 bg-white shadow-2xs group-hover:border-emerald-primary group-hover:text-emerald-primary"
                      onClick={(e) => { e.stopPropagation(); handleOpenReceipt(item); }}
                    >
                      Lihat Kuitansi
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Receipt Share */}
      <Modal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        showCloseButton={false}
        maxWidth="sm"
        className="!bg-transparent !border-0 !shadow-none !overflow-visible"
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
