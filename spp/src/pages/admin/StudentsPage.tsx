import React, { useState, useEffect } from 'react';
import { Card, Button, EmptyState, Spinner, Modal, Input, Textarea, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../../components/ui';
import { useToast } from '../../components/ui/ToastContext';
import { api } from '../../api/client';
import { Users, Plus, FileSpreadsheet, Search, Edit2, Trash2, CheckCircle2, XCircle, Upload, AlertCircle, GraduationCap, ArrowRightLeft, UserX } from 'lucide-react';
import type { Student, AcademicYear } from '../../types';

export const StudentsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [academicYearsList, setAcademicYearsList] = useState<AcademicYear[]>([
    { id: 1, name: '2025/2026', is_active: true },
    { id: 2, name: '2024/2025', is_active: false },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

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
  const [academicYearId, setAcademicYearId] = useState<number | undefined>(1);
  const [studentStatus, setStudentStatus] = useState('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoCleared, setPhotoCleared] = useState(false);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      let url = `/students/?limit=500`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (filterStatus === 'active') url += `&is_active=true&status=active`;
      else if (filterStatus === 'inactive') url += `&is_active=false`;
      else if (filterStatus !== 'all') url += `&status=${filterStatus}`;

      const [studentsRes, ayRes] = await Promise.all([
        api.get(url),
        api.get('/settings/academic-years').catch(() => ({ data: null })),
      ]);

      setStudents(studentsRes.data || []);
      if (Array.isArray(ayRes.data) && ayRes.data.length > 0) {
        setAcademicYearsList(ayRes.data);
      }
    } catch (err: any) {
      toastError('Gagal Memuat Siswa', err?.response?.data?.detail || 'Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [searchTerm, filterStatus]);

  const handleAcademicYearChange = (ayName: string) => {
    setAcademicYear(ayName);
    const found = academicYearsList.find((a) => a.name === ayName);
    setAcademicYearId(found?.id);
  };

  const handleOpenAdd = () => {
    setNis('');
    setFullName('');
    setGender('Laki-laki');
    setBirthPlace('');
    setAddress('');
    setPhone('');
    setPhotoFile(null);
    setPhotoPreview('');
    setPhotoCleared(false);
    const defaultAy = academicYearsList.find((a) => a.is_active)?.name || academicYearsList[0]?.name || '2025/2026';
    handleAcademicYearChange(defaultAy);
    setStudentStatus('active');
    setShowAddModal(true);
  };

  const resolvePhotoUrl = (url?: string | null) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${api.defaults.baseURL}${url}`;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toastError('File Tidak Valid', 'Mohon pilih file gambar (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toastError('File Terlalu Besar', 'Ukuran foto maksimal 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result && typeof ev.target.result === 'string') {
        setPhotoPreview(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
    setPhotoFile(file);
  };

  const handleOpenEdit = (st: any) => {
    setSelectedStudent(st);
    setNis(st.nis);
    setFullName(st.full_name || st.name);
    setGender(st.gender || 'Laki-laki');
    setBirthPlace(st.birth_place || '');
    setAddress(st.address || '');
    setPhone(st.phone || '');
    setPhotoFile(null);
    setPhotoPreview(resolvePhotoUrl(st.photo_url));
    setPhotoCleared(false);
    const ayName = st.academic_year || academicYearsList[0]?.name || '2025/2026';
    setAcademicYear(ayName);
    const found = academicYearsList.find((a) => a.name === ayName || a.id === st.academic_year_id);
    setAcademicYearId(found?.id || st.academic_year_id);
    setStudentStatus(st.status || (st.is_active ? 'active' : 'inactive'));
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
      const res = await api.post('/students/', {
        nis,
        full_name: fullName,
        gender,
        birth_place: birthPlace,
        address,
        phone,
        academic_year: academicYear,
        academic_year_id: academicYearId,
        status: studentStatus,
        is_active: studentStatus === 'active',
      });
      if (photoFile && res.data?.id) {
        const formData = new FormData();
        formData.append('file', photoFile);
        await api.post(`/students/${res.data.id}/photo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      success('Siswa Ditambahkan', `Santri atas nama ${fullName} (${nis}) berhasil didaftarkan ke sistem.`);
      setShowAddModal(false);
      setPhotoFile(null);
      setPhotoPreview('');
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
        academic_year_id: academicYearId,
        status: studentStatus,
        is_active: studentStatus === 'active',
        ...(photoCleared ? { photo_url: null } : {}),
      });
      if (photoFile && selectedStudent.id) {
        const formData = new FormData();
        formData.append('file', photoFile);
        await api.post(`/students/${selectedStudent.id}/photo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      success('Data Diperbarui', `Informasi santri ${fullName} berhasil disimpan.`);
      setShowEditModal(false);
      setPhotoFile(null);
      setPhotoPreview('');
      fetchStudents();
    } catch (err: any) {
      toastError('Gagal Memperbarui', err?.response?.data?.detail || 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (st: any) => {
    try {
      if (st.is_active || st.status === 'active') {
        await api.delete(`/students/${st.id}`);
        success('Siswa Dinonaktifkan', `Status santri ${st.full_name || st.name} diubah menjadi nonaktif.`);
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
        status: 'active',
        is_active: true,
      }));
      await api.post('/students/import/confirm', { data: validRows });
      success('Impor Selesai', `${validRows.length} santri berhasil diimpor.`);
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

  const str = (val: any) => String(val || '');

  const renderStatusBadge = (st: any) => {
    const statusVal = st.status || (st.is_active ? 'active' : 'inactive');
    switch (statusVal) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-light text-emerald-primary text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3" /> Aktif
          </span>
        );
      case 'graduated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
            <GraduationCap className="w-3 h-3" /> Lulus (Alumni)
          </span>
        );
      case 'transferred':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
            <ArrowRightLeft className="w-3 h-3" /> Pindah Sekolah
          </span>
        );
      case 'dropout':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
            <UserX className="w-3 h-3" /> Dropout (DO)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
            <XCircle className="w-3 h-3" /> Nonaktif
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate/10 pb-4 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
              <span>Manajemen Data Siswa (Santri)</span>
            </h2>
            <p className="text-xs text-slate mt-1">Kelola pendaftaran santri baru, status akademis (aktif, lulus, pindah, DO), dan impor massal dari Excel/CSV.</p>
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
            <Input
              type="text"
              placeholder="Cari nama santri atau NIS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 text-xs"
            />
          </div>
          <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'all', label: `Semua (${students.length})` },
              { key: 'active', label: 'Aktif' },
              { key: 'graduated', label: 'Lulus' },
              { key: 'transferred', label: 'Pindah' },
              { key: 'dropout', label: 'DO' },
              { key: 'inactive', label: 'Nonaktif' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filterStatus === tab.key ? 'bg-emerald-primary text-white shadow-sm' : 'bg-slate/5 text-slate hover:bg-slate/10'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Table / Empty State */}
      {isLoading ? (
        <Card variant="glass" padding="lg" className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" color="emerald" />
          <span className="text-xs text-slate mt-3 font-semibold">Memuat data santri...</span>
        </Card>
      ) : students.length === 0 ? (
        <Card variant="glass" padding="lg">
          <EmptyState
            title="Belum Ada Data Santri"
            description={searchTerm ? `Tidak ditemukan santri dengan kata kunci "${searchTerm}". Coba reset pencarian.` : "Belum ada data santri. Klik tombol Tambah Santri atau Impor Excel di atas untuk mulai mendaftar."}
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
                      <div className="flex items-center gap-2.5">
                        {st.photo_url ? (
                          <img
                            src={resolvePhotoUrl(st.photo_url)}
                            alt={st.full_name || st.name}
                            className="h-9 w-9 shrink-0 rounded-full object-cover border border-slate/15 bg-slate/10"
                          />
                        ) : (
                          <span className="h-9 w-9 shrink-0 rounded-full bg-emerald-light text-emerald-primary font-black flex items-center justify-center text-xs">
                            {(st.full_name || st.name || 'S')?.[0]?.toUpperCase() || 'S'}
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="truncate">{st.full_name || st.name}</div>
                          {st.address && <div className="text-[10px] text-slate font-normal truncate max-w-[200px]">{st.address}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate">{st.gender || '-'}</td>
                    <td className="p-3.5 font-semibold">{st.academic_year || '2025/2026'}</td>
                    <td className="p-3.5 font-mono">{st.phone || '-'}</td>
                    <td className="p-3.5">
                      {renderStatusBadge(st)}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(st)}
                          className="p-1.5 rounded-lg bg-slate/5 text-slate hover:text-emerald-primary hover:bg-emerald-light/50 transition-colors"
                          title="Edit Biodata & Status"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(st)}
                          className={`p-1.5 rounded-lg transition-colors ${st.is_active || st.status === 'active' ? 'bg-slate/5 text-slate hover:text-rose-danger hover:bg-rose-light/50' : 'bg-slate/5 text-slate hover:text-emerald-primary hover:bg-emerald-light/50'}`}
                          title={st.is_active || st.status === 'active' ? "Nonaktifkan Santri" : "Aktifkan Kembali"}
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
                <Input
                  type="text"
                  required
                  maxLength={20}
                  placeholder="Misal: 2026001"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  className="w-full font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-obsidian block mb-1">Nama Lengkap Santri *</label>
                <Input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Nama sesuai ijazah/akta..."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full"
                />
              </div>
              <StudentPhotoField
                preview={photoPreview}
                onFileChange={handlePhotoChange}
                onClear={() => {
                  setPhotoFile(null);
                  setPhotoPreview('');
                }}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-obsidian block mb-1">Jenis Kelamin</label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-bold text-obsidian block mb-1">Tahun Ajaran</label>
                  <Select value={academicYear} onValueChange={handleAcademicYearChange}>
                    <SelectTrigger className="w-full font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYearsList.map((ay) => (
                        <SelectItem key={ay.id} value={ay.name}>
                          {ay.name} {ay.is_active ? '(Aktif)' : ''}
                        </SelectItem>
                      ))}
                      {academicYearsList.length === 0 && <SelectItem value="2025/2026">2025/2026</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-obsidian block mb-1">Tempat Lahir</label>
                  <Input
                    type="text"
                    maxLength={100}
                    placeholder="Misal: Jakarta"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="font-bold text-obsidian block mb-1">No. HP / WA</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={20}
                    placeholder="08123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 20))}
                    className="w-full font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-obsidian block mb-1">Status Santri</label>
                <Select value={studentStatus} onValueChange={setStudentStatus}>
                  <SelectTrigger className="w-full font-bold text-emerald-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif (Sedang Belajar)</SelectItem>
                    <SelectItem value="graduated">Lulus / Alumni</SelectItem>
                    <SelectItem value="transferred">Pindah Sekolah</SelectItem>
                    <SelectItem value="dropout">Dropout (Putus Sekolah)</SelectItem>
                    <SelectItem value="inactive">Nonaktif / Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-bold text-obsidian block mb-1">Alamat Domisili</label>
                <Textarea
                  rows={2}
                  placeholder="Alamat lengkap tempat tinggal..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full"
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
            <span>Edit Data & Status Santri</span>
          </>
        }
        maxWidth="md"
      >
            <form onSubmit={handleUpdateStudent} className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="font-bold text-obsidian block mb-1">Nomor Induk Santri (NIS) *</label>
                <Input
                  type="text"
                  required
                  maxLength={20}
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  className="w-full font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-obsidian block mb-1">Nama Lengkap Santri *</label>
                <Input
                  type="text"
                  required
                  maxLength={100}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full"
                />
              </div>
              <StudentPhotoField
                preview={photoPreview}
                onFileChange={handlePhotoChange}
                onClear={() => {
                  setPhotoFile(null);
                  setPhotoPreview('');
                  setPhotoCleared(true);
                }}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-obsidian block mb-1">Jenis Kelamin</label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-bold text-obsidian block mb-1">Tahun Ajaran</label>
                  <Select value={academicYear} onValueChange={handleAcademicYearChange}>
                    <SelectTrigger className="w-full font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYearsList.map((ay) => (
                        <SelectItem key={ay.id} value={ay.name}>
                          {ay.name} {ay.is_active ? '(Aktif)' : ''}
                        </SelectItem>
                      ))}
                      {academicYearsList.length === 0 && <SelectItem value="2025/2026">2025/2026</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-obsidian block mb-1">Tempat Lahir</label>
                  <Input
                    type="text"
                    maxLength={100}
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="font-bold text-obsidian block mb-1">No. HP / WA</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={20}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 20))}
                    className="w-full font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-obsidian block mb-1">Status Santri</label>
                <Select value={studentStatus} onValueChange={setStudentStatus}>
                  <SelectTrigger className="w-full font-bold text-emerald-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif (Sedang Belajar)</SelectItem>
                    <SelectItem value="graduated">Lulus / Alumni</SelectItem>
                    <SelectItem value="transferred">Pindah Sekolah</SelectItem>
                    <SelectItem value="dropout">Dropout (Putus Sekolah)</SelectItem>
                    <SelectItem value="inactive">Nonaktif / Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-bold text-obsidian block mb-1">Alamat Domisili</label>
                <Textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full"
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
        maxWidth="lg"
      >
            <div className="flex flex-col gap-4 text-xs">
              <div className="p-4 bg-emerald-light/40 border border-emerald-primary/30 rounded-xl text-obsidian">
                <p className="font-bold mb-1.5 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-emerald-primary" />
                  <span>Petunjuk Format File Impor:</span>
                </p>
                <p className="text-slate mb-2">
                  Unggah file dengan kolom: <code>nis</code>, <code>full_name</code>, <code>gender</code>, <code>phone</code>, <code>academic_year</code>. Sistem akan melakukan pratinjau dan validasi error otomatis.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const csvContent = "data:text/csv;charset=utf-8,nis,full_name,gender,birth_place,phone,address,academic_year\n2026001,Ahmad Zaki,Laki-laki,Jakarta,08123456789,Jl. Merdeka No 1,2025/2026\n2026002,Nadia Rahma,Perempuan,Bogor,08198765432,Jl. Mawar No 5,2025/2026";
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", "template_impor_santri.csv");
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    Unduh Template CSV
                  </Button>
                </div>
              </div>

              {/* Upload Input */}
              <div className="border-2 border-dashed border-slate/30 hover:border-emerald-primary/50 rounded-2xl p-6 text-center bg-slate/5 transition-colors">
                <input
                  type="file"
                  id="import-file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="import-file" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-emerald-primary animate-bounce" />
                  <span className="font-extrabold text-obsidian text-sm">
                    {importFile ? importFile.name : 'Klik untuk Memilih File Excel atau CSV'}
                  </span>
                  <span className="text-slate text-[11px]">Maksimal ukuran file 5MB</span>
                </label>
              </div>

              {isImporting && (
                <div className="flex items-center justify-center gap-2 py-4 text-emerald-primary font-bold">
                  <Spinner size="sm" color="emerald" />
                  <span>Sedang memproses dan memvalidasi baris data...</span>
                </div>
              )}

              {/* Preview Table */}
              {importPreview.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center justify-between font-bold text-obsidian">
                    <span>Hasil Pratinjau ({importPreview.length} Baris):</span>
                    <span className="text-emerald-primary">
                      {importPreview.filter((r) => r.is_valid).length} Baris Valid
                    </span>
                  </div>
                  <div className="max-h-52 overflow-y-auto border border-slate/15 rounded-xl">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate/10 border-b border-slate/15 font-bold uppercase text-slate">
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">NIS</th>
                          <th className="p-2.5">Nama Santri</th>
                          <th className="p-2.5">Gender</th>
                          <th className="p-2.5">TA</th>
                          <th className="p-2.5">Keterangan Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate/10 font-medium">
                        {importPreview.map((row, idx) => (
                          <tr key={idx} className={row.is_valid ? 'bg-white' : 'bg-rose-50 text-rose-800 font-semibold'}>
                            <td className="p-2.5">
                              {row.is_valid ? (
                                <span className="text-emerald-600 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Valid
                                </span>
                              ) : (
                                <span className="text-rose-600 font-bold flex items-center gap-1">
                                  <XCircle className="w-3 h-3" /> Error
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 font-mono">{str(row.nis)}</td>
                            <td className="p-2.5">{row.full_name || '-'}</td>
                            <td className="p-2.5">{row.gender || '-'}</td>
                            <td className="p-2.5 font-mono">{row.academic_year || '2025/2026'}</td>
                            <td className="p-2.5 text-rose-600 font-normal">
                              {row.errors && row.errors.length > 0 ? row.errors.join(', ') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2.5 mt-2 pt-3 border-t border-slate/15">
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowImportModal(false); setImportPreview([]); setImportFile(null); }}>
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={!importPreview.some((r) => r.is_valid)}
                  isLoading={isSubmitting}
                  onClick={handleConfirmImport}
                >
                  Konfirmasi Impor ({importPreview.filter((r) => r.is_valid).length} Santri)
                </Button>
              </div>
            </div>
      </Modal>
    </div>
  );
};

const StudentPhotoField: React.FC<{
  preview: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}> = ({ preview, onFileChange, onClear }) => (
  <div>
    <label className="font-bold text-obsidian block mb-1">Foto Santri</label>
    <div className="flex items-center gap-3">
      <div className="h-16 w-16 shrink-0 rounded-2xl overflow-hidden border border-slate/20 bg-slate/10 flex items-center justify-center">
        {preview ? (
          <img src={preview} alt="Foto Santri" className="h-full w-full object-cover" />
        ) : (
          <Users className="w-6 h-6 text-slate/50" />
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-light text-emerald-primary hover:bg-emerald-primary hover:text-white transition-colors w-fit">
          <Upload className="w-3.5 h-3.5" />
          {preview ? 'Ganti Foto' : 'Unggah Foto'}
          <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        </label>
        {preview && (
          <button type="button" onClick={onClear} className="text-[11px] font-bold text-rose-danger hover:underline w-fit">
            Hapus Foto
          </button>
        )}
        <span className="text-[10px] text-slate">JPG/PNG/WebP, maks 2MB</span>
      </div>
    </div>
  </div>
);

export default StudentsPage;
