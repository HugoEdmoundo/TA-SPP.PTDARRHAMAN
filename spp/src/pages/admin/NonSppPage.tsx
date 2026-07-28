import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, EmptyState, Spinner, InputCurrency, formatRupiah, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { FileText, Plus, Search, Edit2, Trash2, CheckCircle2, AlertCircle, Clock, Users, Tag } from 'lucide-react';
import type { Student, BillCategory } from '../../types';

export const NonSppPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const isDemo = user?.email === 'demo' || user?.email === 'admin_demo' || user?.name?.toLowerCase().includes('demo');

  const [bills, setBills] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [categoriesList, setCategoriesList] = useState<BillCategory[]>([
    { id: 1, code: 'seragam', name: 'Seragam', default_amount: 500000, is_active: true },
    { id: 2, code: 'buku', name: 'Buku', default_amount: 350000, is_active: true },
    { id: 3, code: 'kegiatan', name: 'Kegiatan', default_amount: 250000, is_active: true },
    { id: 4, code: 'denda', name: 'Denda', default_amount: 50000, is_active: true },
    { id: 5, code: 'lainnya', name: 'Lainnya', default_amount: 100000, is_active: true },
  ]);
  const [isLoading, setIsLoading] = useState(!isDemo);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any | null>(null);

  // Form States
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [selectAllStudents, setSelectAllStudents] = useState(false);
  const [category, setCategory] = useState('Seragam');
  const [categoryId, setCategoryId] = useState<number | undefined>(1);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(500000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (isDemo) return;
    setIsLoading(true);
    try {
      let url = `/bills/non-spp?limit=500`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (filterCategory !== 'all') url += `&category=${encodeURIComponent(filterCategory)}`;

      const [billsRes, studentsRes, categoriesRes] = await Promise.all([
        api.get(url),
        api.get('/students/?limit=500&is_active=true'),
        api.get('/settings/bill-categories').catch(() => ({ data: null })),
      ]);

      setBills(billsRes.data || []);
      setAllStudents(studentsRes.data || []);
      if (Array.isArray(categoriesRes.data) && categoriesRes.data.length > 0) {
        setCategoriesList(categoriesRes.data);
      }
    } catch (err: any) {
      toastError('Gagal Memuat Tagihan', err?.response?.data?.detail || 'Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, filterCategory, isDemo]);

  const handleCategoryChange = (catName: string, isAdd: boolean = true) => {
    setCategory(catName);
    const found = categoriesList.find(c => c.name.toLowerCase() === catName.toLowerCase() || c.code.toLowerCase() === catName.toLowerCase());
    if (found) {
      setCategoryId(found.id);
      if (isAdd && found.default_amount && found.default_amount > 0) {
        setAmount(found.default_amount);
      }
    } else {
      setCategoryId(undefined);
    }
  };

  const handleOpenAdd = () => {
    setSelectedStudentIds(allStudents.map(s => Number(s.id)));
    setSelectAllStudents(true);
    const firstCat = categoriesList[0]?.name || 'Seragam';
    handleCategoryChange(firstCat, true);
    setLabel('');
    setDescription('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (bill: any) => {
    setSelectedBill(bill);
    const catName = bill.category || categoriesList[0]?.name || 'Seragam';
    setCategory(catName);
    const found = categoriesList.find(c => c.name.toLowerCase() === catName.toLowerCase() || c.id === bill.category_id);
    setCategoryId(found?.id || bill.category_id);
    setLabel(bill.label);
    setDescription(bill.description || '');
    setAmount(Number(bill.amount) || 0);
    setShowEditModal(true);
  };

  const handleToggleSelectAll = () => {
    if (selectAllStudents) {
      setSelectedStudentIds([]);
      setSelectAllStudents(false);
    } else {
      setSelectedStudentIds(allStudents.map(s => Number(s.id)));
      setSelectAllStudents(true);
    }
  };

  const handleToggleStudent = (sid: number) => {
    if (selectedStudentIds.includes(sid)) {
      setSelectedStudentIds(selectedStudentIds.filter(id => id !== sid));
      setSelectAllStudents(false);
    } else {
      const next = [...selectedStudentIds, sid];
      setSelectedStudentIds(next);
      if (next.length === allStudents.length) setSelectAllStudents(true);
    }
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || amount <= 0 || selectedStudentIds.length === 0) {
      toastError('Form Tidak Lengkap', 'Judul tagihan, nominal, dan minimal 1 siswa wajib dipilih.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/bills/non-spp', {
        student_ids: selectedStudentIds,
        category,
        category_id: categoryId,
        label,
        description,
        amount,
      });
      success('Tagihan Diterbitkan', `Tagihan "${label}" senilai ${formatRupiah(amount)} berhasil dibuat untuk ${selectedStudentIds.length} santri.`);
      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      toastError('Gagal Menerbitkan Tagihan', err?.response?.data?.detail || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || !label || amount <= 0) return;
    setIsSubmitting(true);
    try {
      await api.put(`/bills/non-spp/${selectedBill.id}`, {
        category,
        category_id: categoryId,
        label,
        description,
        amount,
      });
      success('Tagihan Diperbarui', `Informasi tagihan "${label}" berhasil disimpan.`);
      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      toastError('Gagal Memperbarui', err?.response?.data?.detail || 'Tagihan sudah dibayar sehingga tidak bisa diubah.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBill = async (bill: any) => {
    try {
      await api.delete(`/bills/non-spp/${bill.id}`);
      success('Tagihan Dihapus', `Tagihan "${bill.label}" berhasil dihapus dari database.`);
      fetchData();
    } catch (err: any) {
      toastError('Gagal Menghapus Tagihan', err?.response?.data?.detail || 'Tagihan yang sudah dibayar sebagian/lunas tidak dapat dihapus.');
    }
  };

  if (isDemo) {
    return (
      <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 border-b border-slate/10 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
              <span>Manajemen Tagihan Non-SPP</span>
            </h2>
            <p className="text-xs text-slate mt-1">Kelola tagihan buku, seragam, ujian, dan kegiatan khusus santri terintegrasi Master Kategori.</p>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => success('Simulasi Tambah Tagihan', 'Beralih ke akun Admin Real untuk menerbitkan tagihan ad-hoc secara live.')} className="shrink-0 w-full sm:w-auto justify-center">Tambah Tagihan Non-SPP</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card variant="elevated" padding="sm" className="p-4 bg-white/90 border border-slate/15">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs font-extrabold text-obsidian block">Seragam Olahraga & Batik Kelas 10</span>
                <span className="text-[11px] text-slate font-medium">Kategori: Seragam</span>
              </div>
              <Badge status="UNPAID">Tagihan Aktif</Badge>
            </div>
            <div className="text-sm font-mono font-bold text-emerald-primary my-2">Rp 750.000</div>
            <div className="text-[11px] text-slate/80 bg-slate/5 p-2 rounded-lg border border-slate/10">
              Diterbitkan untuk 120 santri baru kelas 10. Terkumpul: Rp 45.000.000 (60%).
            </div>
          </Card>

          <Card variant="elevated" padding="sm" className="p-4 bg-white/90 border border-slate/15">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs font-extrabold text-obsidian block">Ujian Akhir Semester & Raport</span>
                <span className="text-[11px] text-slate font-medium">Kategori: Kegiatan</span>
              </div>
              <Badge status="PAID">Lunas 95%</Badge>
            </div>
            <div className="text-sm font-mono font-bold text-emerald-primary my-2">Rp 350.000</div>
            <div className="text-[11px] text-slate/80 bg-slate/5 p-2 rounded-lg border border-slate/10">
              Diterbitkan untuk seluruh 480 santri aktif. Terkumpul: Rp 159.600.000.
            </div>
          </Card>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate/10 pb-4 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
              <span>Manajemen Tagihan Non-SPP</span>
            </h2>
            <p className="text-xs text-slate mt-1">Terbitkan tagihan ad-hoc (seragam, buku, ujian, denda) terintegrasi dengan Master Kategori Tagihan.</p>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd} className="shrink-0 w-full sm:w-auto justify-center">
            Buat Tagihan Baru
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate/50" />
            <input
              type="text"
              placeholder="Cari label tagihan atau deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate/20 bg-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
            />
          </div>

          <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['all', ...categoriesList.map(c => c.name)].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize whitespace-nowrap ${filterCategory === cat ? 'bg-emerald-primary text-white shadow-sm' : 'bg-slate/5 text-slate hover:bg-slate/10'}`}
              >
                {cat === 'all' ? `Semua (${bills.length})` : cat}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card variant="glass" padding="lg" className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" color="emerald" />
          <span className="text-xs text-slate mt-3 font-semibold">Memuat tagihan Non-SPP dari database...</span>
        </Card>
      ) : bills.length === 0 ? (
        <Card variant="glass" padding="lg">
          <EmptyState
            title="Belum Ada Tagihan Non-SPP"
            description={searchTerm ? `Tidak ditemukan tagihan dengan kata kunci "${searchTerm}".` : "Database tagihan Non-SPP saat ini masih bersih (0 record). Klik tombol Buat Tagihan Baru di atas untuk menerbitkan tagihan seragam, buku, atau kegiatan."}
            action={!searchTerm ? <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>Terbitkan Tagihan Sekarang</Button> : undefined}
          />
        </Card>
      ) : (
        <Card variant="glass" padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate/15 bg-slate/5 text-slate font-bold uppercase text-[11px]">
                  <th className="p-3.5 pl-5">Label Tagihan / Kategori</th>
                  <th className="p-3.5">Santri Penerima</th>
                  <th className="p-3.5">Nominal (Rp)</th>
                  <th className="p-3.5">Status Bayar</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate/10">
                {bills.map((bill: any) => {
                  const isPaid = bill.status === 'paid' || bill.status === 'PAID';
                  const isPartial = bill.status === 'partial' || bill.status === 'PARTIAL';
                  
                  return (
                    <tr key={bill.id} className="hover:bg-white/60 transition-colors">
                      <td className="p-3.5 pl-5 font-bold text-obsidian">
                        <div className="text-sm font-heading">{bill.label}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-2 py-0.5 rounded bg-slate/10 text-slate text-[10px] font-bold uppercase flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5 text-emerald-primary" />
                            <span>{bill.category || 'Umum'}</span>
                          </span>
                          {bill.description && <span className="text-[10px] text-slate truncate max-w-[200px] font-normal">{bill.description}</span>}
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-obsidian">
                        {bill.student ? (
                          <div>
                            <span>{bill.student.full_name || bill.student.name}</span>
                            <span className="block text-[10px] font-mono text-slate font-normal">NIS: {bill.student.nis}</span>
                          </div>
                        ) : (
                          <span className="text-slate italic">Santri ID {bill.student_id}</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-emerald-primary text-sm">
                        {formatRupiah(Number(bill.amount))}
                      </td>
                      <td className="p-3.5">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-light text-emerald-primary text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Lunas
                          </span>
                        ) : isPartial ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold">
                            <Clock className="w-3 h-3" /> Sebagian
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-light text-rose-danger text-[10px] font-bold">
                            <AlertCircle className="w-3 h-3" /> Belum Bayar
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(bill)}
                            disabled={isPaid || isPartial}
                            className={`p-1.5 rounded-lg transition-colors ${isPaid || isPartial ? 'bg-slate/5 text-slate/30 cursor-not-allowed' : 'bg-slate/5 text-slate hover:text-emerald-primary hover:bg-emerald-light/50'}`}
                            title={isPaid || isPartial ? "Tagihan sudah dibayar, tidak bisa diubah" : "Edit Tagihan"}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBill(bill)}
                            disabled={isPaid || isPartial}
                            className={`p-1.5 rounded-lg transition-colors ${isPaid || isPartial ? 'bg-slate/5 text-slate/30 cursor-not-allowed' : 'bg-slate/5 text-slate hover:text-rose-danger hover:bg-rose-light/50'}`}
                            title={isPaid || isPartial ? "Tagihan sudah dibayar, tidak bisa dihapus" : "Hapus Tagihan"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Modal Add Non-SPP */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={
          <>
            <Plus className="w-5 h-5 text-emerald-primary" />
            <span>Terbitkan Tagihan Non-SPP Baru</span>
          </>
        }
        maxWidth="lg"
      >
            <form onSubmit={handleCreateBill} className="flex flex-col gap-3.5 text-xs">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="font-bold text-obsidian block mb-1">Kategori Tagihan (Master Kategori) *</label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value, true)}
                    className="w-full p-2.5 rounded-xl border border-slate/25 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name} {cat.default_amount ? `(Default: Rp ${cat.default_amount.toLocaleString('id-ID')})` : ''}
                      </option>
                    ))}
                    {categoriesList.length === 0 && <option value="Seragam">Seragam</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-obsidian block mb-1">Judul / Label Tagihan *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Buku Modul Semester 1, Seragam Batik..."
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate/25 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                />
              </div>

              <div>
                <label className="font-bold text-obsidian block mb-1">Nominal per Siswa (Rp) *</label>
                <InputCurrency
                  value={amount}
                  onChange={(val) => setAmount(val)}
                  placeholder="Rp 0"
                />
              </div>

              <div>
                <label className="font-bold text-obsidian block mb-1">Deskripsi Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Opsional: Keterangan singkat mengenai tagihan..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate/25 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-primary/50 resize-none"
                />
              </div>

              {/* Selector Santri */}
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-obsidian flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-primary" />
                    <span>Pilih Target Santri ({selectedStudentIds.length} terpilih) *</span>
                  </label>
                  <Button type="button" variant="ghost" size="sm" onClick={handleToggleSelectAll} className="text-[11px] py-0.5 px-2 h-auto">
                    {selectAllStudents ? 'Batal Semua' : 'Pilih Semua'}
                  </Button>
                </div>

                {allStudents.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate/30 text-center text-slate">
                    Belum ada data siswa aktif.
                  </div>
                ) : (
                  <div className="max-h-36 overflow-y-auto pr-1 flex flex-col gap-1.5">
                    {allStudents.map((st: any) => {
                      const sid = Number(st.id);
                      const isSelected = selectedStudentIds.includes(sid);
                      return (
                        <label
                          key={st.id}
                          className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-emerald-light/40 border-emerald-primary/30 font-bold' : 'bg-white border-slate/15 hover:bg-slate/5'}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleStudent(sid)}
                              className="rounded text-emerald-primary focus:ring-0"
                            />
                            <span className="truncate">{st.full_name || st.name}</span>
                          </div>
                          <span className="font-mono text-[10px] text-slate shrink-0">NIS: {st.nis} ({st.academic_year || '2025/2026'})</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 mt-2 pt-3 border-t border-slate/15 shrink-0">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>Batal</Button>
                <Button type="submit" variant="primary" size="sm" disabled={selectedStudentIds.length === 0 || amount <= 0} isLoading={isSubmitting}>
                  Terbitkan untuk {selectedStudentIds.length} Santri
                </Button>
              </div>
            </form>
      </Modal>

      {/* Modal Edit Non-SPP */}
      <Modal
        isOpen={showEditModal && !!selectedBill}
        onClose={() => setShowEditModal(false)}
        title={
          <>
            <Edit2 className="w-5 h-5 text-emerald-primary" />
            <span>Edit Tagihan Non-SPP</span>
          </>
        }
        maxWidth="md"
      >
            <form onSubmit={handleUpdateBill} className="flex flex-col gap-3.5 text-xs">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="font-bold text-obsidian block mb-1">Kategori Tagihan (Master Kategori) *</label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value, false)}
                    className="w-full p-2.5 rounded-xl border border-slate/25 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                    {categoriesList.length === 0 && <option value="Seragam">Seragam</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-obsidian block mb-1">Judul / Label Tagihan *</label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate/25 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                />
              </div>

              <div>
                <label className="font-bold text-obsidian block mb-1">Nominal (Rp) *</label>
                <InputCurrency
                  value={amount}
                  onChange={(val) => setAmount(val)}
                  placeholder="Rp 0"
                />
              </div>

              <div>
                <label className="font-bold text-obsidian block mb-1">Deskripsi Tambahan</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate/25 focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                />
              </div>

              <div className="flex justify-end gap-2.5 mt-2 pt-3 border-t border-slate/15">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowEditModal(false)}>Batal</Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>Simpan Perubahan</Button>
              </div>
            </form>
      </Modal>
    </div>
  );
};

export default NonSppPage;
