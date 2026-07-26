import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, EmptyState, Spinner, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { Users, Plus, FileSpreadsheet, Search, Edit2, Trash2, CheckCircle2, XCircle, Upload, AlertCircle } from 'lucide-react';
import type { Student } from '../../types';

export const StudentsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const isDemo = user?.email === 'demo' || user?.email === 'admin_demo' || user?.name?.toLowerCase().includes('demo');

  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemo);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form States
  const [nis, setNis] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Laki-laki');
  const [birthPlace, setBirthPlace] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const fetchStudents = async () => {
    if (isDemo) return;
    setIsLoading(true);
    try {
      let url = `/students/?limit=500`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (filterActive === 'active') url += `&is_active=true`;
      if (filterActive === 'inactive') url += `&is_active=false`;

      const res = await api.get(url);
      setStudents(res.data || []);
    } catch (err: any) {
      toastError('Gagal Memuat Siswa', err?.response?.data?.detail || 'Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [searchTerm, filterActive, isDemo]);

  const handleOpenAdd = () => {
    setNis('');
    setFullName('');
    setGender('Laki-laki');
    setBirthPlace('');
    setAddress('');
    setPhone('');
    setAcademicYear('2025/2026');
    setShowAddModal(true);
  };

  const handleOpenEdit = (st: any) => {
    setSelectedStudent(st);
    setNis(st.nis);
    setFullName(st.full_name || st.name);
    setGender(st.gender || 'Laki-laki');
    setBirthPlace(st.birth_place || '');
    setAddress(st.address || '');
    setPhone(st.phone || '');
    setAcademicYear(st.academic_year || '2025/2026');
    setShowEditModal(true);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis || !fullName) {
      toastError('Form Tidak Lengkap', 'NIS dan Nama Siswa wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/students/', {
        nis,
        full_name: fullName,
        gender,
        birth_place: birthPlace,
        address,
        phone,
        academic_year: academicYear,
        is_active: true,
      });
      success('Siswa Ditambahkan', `Santri atas nama ${fullName} (${nis}) berhasil didaftarkan ke sistem.`);
      setShowAddModal(false);
      fetchStudents();
    } catch (err: any) {
      toastError('Gagal Menambahkan Siswa', err?.response?.data?.detail || 'NIS mungkin sudah terdaftar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !nis || !fullName) return;
    setIsSubmitting(true);
    try {
      await api.put(`/students/${selectedStudent.id}`, {
        nis,
        full_name: fullName,
        gender,
        birth_place: birthPlace,
        address,
        phone,
        academic_year: academicYear,
      });
      success('Data Diperbarui', `Informasi santri ${fullName} berhasil disimpan.`);
      setShowEditModal(false);
      fetchStudents();
    } catch (err: any) {
      toastError('Gagal Memperbarui', err?.response?.data?.detail || 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (st: any) => {
    try {
      if (st.is_active) {
        await api.delete(`/students/${st.id}`);
        success('Siswa Dinonaktifkan', `Status santri ${st.full_name || st.name} diubah menjadi non-aktif/lulus.`);
      } else {
        await api.put(`/students/${st.id}/activate`);
        success('Siswa Diaktifkan', `Status santri ${st.full_name || st.name} kembali aktif.`);
      }
      fetchStudents();
    } catch (err: any) {
      toastError('Gagal Mengubah Status', err?.response?.data?.detail || 'Terjadi kesalahan.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImportFile(file);
      setIsImporting(true);
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await api.post('/students/import/preview', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setImportPreview(res.data.data || []);
      } catch (err: any) {
        toastError('Gagal Membaca File', err?.response?.data?.detail || 'Pastikan format file Excel/CSV sesuai.');
      } finally {
        setIsImporting(false);
      }
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview.length) return;
    setIsSubmitting(true);
    try {
      const validRows = importPreview.filter((r) => r.is_valid).map((r) => ({
        nis: str(r.nis),
        full_name: r.full_name,
        gender: r.gender || 'Laki-laki',
        birth_place: r.birth_place || '',
        address: r.address || '',
        phone: r.phone || '',
        academic_year: r.academic_year || '2025/2026',
        is_active: true,
      }));
      await api.post('/students/import/confirm', { data: validRows });
      success('Impor Selesai', `${validRows.length} santri berhasil diimpor ke dalam database real-time.`);
      setShowImportModal(false);
      setImportPreview([]);
      setImportFile(null);
      fetchStudents();
    } catch (err: any) {
      toastError('Gagal Impor Massal', err?.response?.data?.detail || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper string safe
  const str = (val: any) => String(val || '');

  // Render Demo Mode
  if (isDemo) {
    return (
      <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 border-b border-slate/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Mode Showcase Demo</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
              <span>Manajemen Data Siswa (Santri)</span>
            </h2>
            <p className="text-xs text-slate mt-1">Daftar santri aktif, kenaikan kelas, dan impor data cepat via file Excel / CSV (Fase 2: B-08, B-09 & F-07).</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
            <Button variant="outline" size="sm" leftIcon={<FileSpreadsheet className="w-4 h-4" />} onClick={() => success('Simulasi Impor Excel', 'Dalam mode Demo, fitur impor menampilkan simulasi data 480 santri.')} className="w-full sm:w-auto justify-center">Impor Excel / CSV</Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => success('Simulasi Tambah Santri', 'Beralih ke akun Admin Real (admin / admin123) untuk menyimpan data asli.')} className="w-full sm:w-auto justify-center">Tambah Santri</Button>
          </div>
        </div>
        
        {/* Mock Demo Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate/20 bg-slate/5 text-slate font-bold uppercase">
                <th className="p-3">NIS</th>
                <th className="p-3">Nama Santri</th>
                <th className="p-3">Kelas / Tahun</th>
                <th className="p-3">Gender</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate/10">
              <tr>
                <td className="p-3 font-mono font-bold">2025001</td>
                <td className="p-3 font-bold text-obsidian">Muhammad Faiz Syafi'i</td>
                <td className="p-3">XI-IPA-1 (2025/2026)</td>
                <td className="p-3">Laki-laki</td>
                <td className="p-3"><Badge status="PAID">Aktif</Badge></td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold">2025002</td>
                <td className="p-3 font-bold text-obsidian">Aisyah Zahra Syafi'i</td>
                <td className="p-3">X-A (2025/2026)</td>
                <td className="p-3">Perempuan</td>
                <td className="p-3"><Badge status="PAID">Aktif</Badge></td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold">2025003</td>
                <td className="p-3 font-bold text-obsidian">Rifky Hidayatullah</td>
                <td className="p-3">XII-IPS-2 (2025/2026)</td>
                <td className="p-3">Laki-laki</td>
                <td className="p-3"><Badge status="PAID">Aktif</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-center text-xs text-slate bg-emerald-light/30 p-3 rounded-xl border border-emerald-primary/20">
          ✨ Menampilkan 3 dari 480 santri aktif (Data Showcase Demo). Gunakan akun <b>admin / admin123</b> atau <b>admin_clean / admin123</b> untuk pengujian CRUD real-time.
        </div>
      </Card>
    );
  }

  // Render Real Live System
  return (
    <div className="flex flex-col gap-6">
      {/* Top Bar */}
      <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate/10 pb-4 mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-light text-emerald-primary text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Database Real-Time SQLite</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
              <span>Manajemen Data Siswa (Santri)</span>
            </h2>
            <p className="text-xs text-slate mt-1">Kelola pendaftaran santri baru, edit biodata, status aktif, dan impor massal dari Excel/CSV.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Button variant="outline" size="sm" leftIcon={<FileSpreadsheet className="w-4 h-4" />} onClick={() => { setImportPreview([]); setImportFile(null); setShowImportModal(true); }}>
              Impor Excel / CSV
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>
              Tambah Santri
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate/50" />
            <input
              type="text"
              placeholder="Cari nama santri atau NIS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate/20 bg-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
            />
          </div>
          <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterActive('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterActive === 'all' ? 'bg-emerald-primary text-white shadow-sm' : 'bg-slate/5 text-slate hover:bg-slate/10'}`}
            >
              Semua Santri ({students.length})
            </button>
            <button
              onClick={() => setFilterActive('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterActive === 'active' ? 'bg-emerald-primary text-white shadow-sm' : 'bg-slate/5 text-slate hover:bg-slate/10'}`}
            >
              Aktif
            </button>
            <button
              onClick={() => setFilterActive('inactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterActive === 'inactive' ? 'bg-emerald-primary text-white shadow-sm' : 'bg-slate/5 text-slate hover:bg-slate/10'}`}
            >
              Non-Aktif / Lulus
            </button>
          </div>
        </div>
      </Card>

      {/* Main Table / Empty State */}
      {isLoading ? (
        <Card variant="glass" padding="lg" className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" color="emerald" />
          <span className="text-xs text-slate mt-3 font-semibold">Memuat data santri dari database...</span>
        </Card>
      ) : students.length === 0 ? (
        <Card variant="glass" padding="lg">
          <EmptyState
            title="Belum Ada Data Santri"
            description={searchTerm ? `Tidak ditemukan santri dengan kata kunci "${searchTerm}". Coba reset pencarian.` : "Database santri saat ini masih bersih (0 record). Klik tombol Tambah Santri atau Impor Excel di atas untuk mulai mendaftar."}
            action={!searchTerm ? <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>Tambah Santri Sekarang</Button> : undefined}
          />
        </Card>
      ) : (
        <Card variant="glass" padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate/15 bg-slate/5 text-slate font-bold uppercase text-[11px]">
                  <th className="p-3.5 pl-5">NIS</th>
                  <th className="p-3.5">Nama Lengkap</th>
                  <th className="p-3.5">Gender</th>
                  <th className="p-3.5">Tahun Ajaran</th>
                  <th className="p-3.5">No. Telepon / WA</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate/10">
                {students.map((st: any) => (
                  <tr key={st.id} className="hover:bg-white/60 transition-colors">
                    <td className="p-3.5 pl-5 font-mono font-bold text-obsidian">{st.nis}</td>
                    <td className="p-3.5 font-bold text-obsidian">
                      <div>{st.full_name || st.name}</div>
                      {st.address && <div className="text-[10px] text-slate font-normal truncate max-w-[200px]">{st.address}</div>}
                    </td>
                    <td className="p-3.5 text-slate">{st.gender || '-'}</td>
                    <td className="p-3.5 font-semibold">{st.academic_year || '2025/2026'}</td>
                    <td className="p-3.5 font-mono">{st.phone || '-'}</td>
                    <td className="p-3.5">
                      {st.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-light text-emerald-primary text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-light text-rose-danger text-[10px] font-bold">
                          <XCircle className="w-3 h-3" /> Non-Aktif
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(st)}
                          className="p-1.5 rounded-lg bg-slate/5 text-slate hover:text-emerald-primary hover:bg-emerald-light/50 transition-colors"
                          title="Edit Biodata"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(st)}
                          className={`p-1.5 rounded-lg transition-colors ${st.is_active ? 'bg-slate/5 text-slate hover:text-rose-danger hover:bg-rose-light/50' : 'bg-slate/5 text-slate hover:text-emerald-primary hover:bg-emerald-light/50'}`}
                          title={st.is_active ? "Nonaktifkan Santri" : "Aktifkan Kembali"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal Add Student */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={
          <>
            <Plus className="w-5 h-5 text-emerald-primary" />
            <span>Daftarkan Santri Baru</span>
          </>
        }
        maxWidth="md"
      >
            <form onSubmit={handleCreateStudent} className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="font-bold text-obsidian block mb-1">Nomor Induk Santri (NIS) *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: 2026001"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate/25 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                />
              </div>
              <div>
                <label className="font-bold text-obsidian block mb-1">Nama Lengkap Santri *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama sesuai ijazah/akta..."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate/25 focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-obsidian block mb-1">Jenis Kelamin</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate/25 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-obsidian block mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate/25 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-obsidian block mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    placeholder="Misal: Jakarta"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate/25 focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                  />
                </div>
                <div>
                  <label className="font-bold text-obsidian block mb-1">No. HP / WA</label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate/25 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-obsidian block mb-1">Alamat Domisili</label>
                <textarea
                  rows={2}
                  placeholder="Alamat lengkap tempat tinggal..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate/25 focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                />
              </div>
              <div className="flex justify-end gap-2.5 mt-2 pt-3 border-t border-slate/15">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>Batal</Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>Simpan Santri</Button>
              </div>
            </form>
      </Modal>

      {/* Modal Edit Student */}
      <Modal
        isOpen={showEditModal && !!selectedStudent}
        onClose={() => setShowEditModal(false)}
        title={
          <>
            <Edit2 className="w-5 h-5 text-emerald-primary" />
            <span>Edit Data Santri</span>
          </>
        }
        maxWidth="md"
      >
            <form onSubmit={handleUpdateStudent} className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="font-bold text-obsidian block mb-1">Nomor Induk Santri (NIS) *</label>
                <input
                  type="text"
                  required
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate/25 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                />
              </div>
              <div>
                <label className="font-bold text-obsidian block mb-1">Nama Lengkap Santri *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate/25 focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-obsidian block mb-1">Jenis Kelamin</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate/25 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-obsidian block mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate/25 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-obsidian block mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate/25 focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                  />
                </div>
                <div>
                  <label className="font-bold text-obsidian block mb-1">No. HP / WA</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate/25 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-obsidian block mb-1">Alamat Domisili</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate/25 focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                />
              </div>
              <div className="flex justify-end gap-2.5 mt-2 pt-3 border-t border-slate/15">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowEditModal(false)}>Batal</Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>Simpan Perubahan</Button>
              </div>
            </form>
      </Modal>

      {/* Modal Import Excel / CSV */}
      <Modal
        isOpen={showImportModal}
        onClose={() => { setShowImportModal(false); setImportPreview([]); setImportFile(null); }}
        title={
          <>
            <FileSpreadsheet className="w-5 h-5 text-emerald-primary" />
            <span>Impor Santri Massal dari Excel / CSV</span>
          </>
        }
        maxWidth="2xl"
      >
            <p className="text-xs text-slate mb-4 shrink-0">
              Unggah file dengan kolom: <code>nis</code>, <code>full_name</code>, <code>gender</code>, <code>phone</code>, <code>academic_year</code>. Sistem akan melakukan pratinjau dan validasi error otomatis.
            </p>

            <div className="flex flex-col gap-4 overflow-y-auto pr-1 flex-1 min-h-0">
              <label className="border-2 border-dashed border-emerald-primary/40 hover:border-emerald-primary bg-emerald-light/20 p-6 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all shrink-0">
                <Upload className="w-8 h-8 text-emerald-primary mb-2" />
                <span className="text-xs font-bold text-obsidian">{importFile ? importFile.name : 'Klik atau Drag & Drop File Excel / CSV di sini'}</span>
                <span className="text-[10px] text-slate mt-1">Format didukung: .xlsx, .xls, .csv</span>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
              </label>

              {isImporting && (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate">
                  <Spinner size="sm" color="emerald" /> Membaca dan memvalidasi file...
                </div>
              )}

              {importPreview.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Pratinjau Data ({importPreview.length} Baris):</span>
                    <div className="flex gap-2">
                      <span className="text-emerald-primary">Valid: {importPreview.filter(r => r.is_valid).length}</span>
                      <span className="text-rose-danger">Error: {importPreview.filter(r => !r.is_valid).length}</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto border border-slate/20 rounded-xl max-h-60">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate/10 font-bold text-slate border-b border-slate/20">
                          <th className="p-2">Baris</th>
                          <th className="p-2">NIS</th>
                          <th className="p-2">Nama Lengkap</th>
                          <th className="p-2">Status Validasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate/10">
                        {importPreview.map((row: any, idx: number) => (
                          <tr key={idx} className={row.is_valid ? '' : 'bg-rose-50'}>
                            <td className="p-2 font-mono">{row.row_index}</td>
                            <td className="p-2 font-mono font-bold">{row.nis}</td>
                            <td className="p-2 font-semibold">{row.full_name}</td>
                            <td className="p-2">
                              {row.is_valid ? (
                                <span className="text-emerald-primary font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Siap Impor</span>
                              ) : (
                                <span className="text-rose-danger font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {row.errors?.join(', ')}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-slate/15 shrink-0">
              <Button type="button" variant="outline" size="sm" onClick={() => { setShowImportModal(false); setImportPreview([]); setImportFile(null); }}>Batal</Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={!importPreview.some(r => r.is_valid)}
                isLoading={isSubmitting}
                onClick={handleConfirmImport}
              >
                Impor {importPreview.filter(r => r.is_valid).length} Santri Valid
              </Button>
            </div>
      </Modal>
    </div>
  );
};

export default StudentsPage;
