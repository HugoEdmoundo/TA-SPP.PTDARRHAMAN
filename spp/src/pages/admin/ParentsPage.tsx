import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, EmptyState, Spinner, Modal, Input, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../../components/ui';
import { useToast } from '../../components/ui/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { UsersRound, Plus, Search, Key, Edit, Trash2, Link2, Unlink, GraduationCap, UserPlus, Dices } from 'lucide-react';
import type { User, Student } from '../../types';

interface WaliWithStudents extends User {
  linked_students: Student[];
}

interface StudentWithParents extends Student {
  parents?: Array<{ id: number; full_name?: string; username?: string }>;
}

const generatePassword = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let pass = '';
  for (let i = 0; i < 8; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
};

export const ParentsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [waliList, setWaliList] = useState<WaliWithStudents[]>([]);
  const [studentsAll, setStudentsAll] = useState<StudentWithParents[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  const [selectedWali, setSelectedWali] = useState<WaliWithStudents | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    phone: '',
    email: '',
    password: '',
    is_active: true,
  });
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manage (Kelola Santri) State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const buildLinkedMap = (walies: User[], students: StudentWithParents[]): Record<number, Student[]> => {
    const map: Record<number, Student[]> = {};
    for (const w of walies) map[w.id] = [];
    for (const s of students) {
      for (const p of s.parents || []) {
        if (map[p.id]) map[p.id].push(s);
      }
    }
    return map;
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [waliesRes, studentsRes] = await Promise.all([
        api.get('/users/?role=wali'),
        api.get('/students/?limit=500'),
      ]);
      const walies: User[] = waliesRes.data || [];
      const students: StudentWithParents[] = studentsRes.data || [];
      setStudentsAll(students);
      const map = buildLinkedMap(walies, students);
      setWaliList(walies.map((w) => ({ ...w, linked_students: map[w.id] || [] })));
    } catch (err: any) {
      toastError('Gagal Memuat Data', err.response?.data?.detail || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = waliList.filter((w) => {
    const q = searchTerm.toLowerCase();
    return !q || (w.full_name || '').toLowerCase().includes(q) || (w.username || '').toLowerCase().includes(q);
  });

  const handleAddWali = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.full_name || !formData.password) {
      toastError('Form Tidak Lengkap', 'Username, Nama Lengkap, dan Password wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/users/', { ...formData, role: 'wali' });
      success('Berhasil', `Akun wali ${formData.username} berhasil dibuat.`);
      setShowAddModal(false);
      setFormData({ username: '', full_name: '', phone: '', email: '', password: '', is_active: true });
      fetchData();
    } catch (err: any) {
      toastError('Gagal', err.response?.data?.detail || 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditWali = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWali) return;
    setIsSubmitting(true);
    try {
      await api.put(`/users/${selectedWali.id}`, {
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        is_active: formData.is_active,
      });
      success('Berhasil', 'Data wali berhasil diperbarui.');
      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      toastError('Gagal', err.response?.data?.detail || 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWali) return;
    setIsSubmitting(true);
    try {
      await api.post(`/users/${selectedWali.id}/reset-password`, { new_password: newPassword });
      success('Berhasil', 'Password wali berhasil direset.');
      setShowResetModal(false);
      setNewPassword('');
    } catch (err: any) {
      toastError('Gagal', err.response?.data?.detail || 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedWali) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/users/${selectedWali.id}`);
      success('Berhasil', 'Akun wali berhasil dinonaktifkan.');
      setShowDeleteModal(false);
      fetchData();
    } catch (err: any) {
      toastError('Gagal', err.response?.data?.detail || 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openManageModal = (w: WaliWithStudents) => {
    setSelectedWali(w);
    setSelectedStudentId('');
    setShowManageModal(true);
  };

  const unlinkedStudents = selectedWali
    ? studentsAll.filter((s) => !selectedWali.linked_students.some((ls) => ls.id === s.id))
    : [];

  const handleLinkStudent = async () => {
    if (!selectedWali || !selectedStudentId) return;
    setIsSubmitting(true);
    try {
      await api.post(`/students/${selectedStudentId}/parents`, { parent_id: selectedWali.id });
      success('Berhasil', 'Siswa berhasil dihubungkan.');
      setSelectedStudentId('');
      fetchData();
    } catch (err: any) {
      toastError('Gagal', err.response?.data?.detail || 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlinkStudent = async (studentId: number) => {
    if (!selectedWali) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/students/${studentId}/parents/${selectedWali.id}`);
      success('Berhasil', 'Hubungan wali dan siswa berhasil diputuskan.');
      fetchData();
    } catch (err: any) {
      toastError('Gagal', err.response?.data?.detail || 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (w: WaliWithStudents) => {
    setSelectedWali(w);
    setFormData({
      username: w.username || '',
      full_name: w.full_name || '',
      phone: w.phone || '',
      email: w.email || '',
      password: '',
      is_active: w.is_active ?? true,
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-obsidian tracking-tight flex items-center gap-2">
            <UsersRound className="w-7 h-7 text-amber-600" />
            Data Wali Murid
          </h1>
          <p className="text-sm text-slate font-medium mt-1">
            Kelola akun wali murid beserta koneksi ke siswa (orang tua / wali santri).
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => {
            setFormData({ username: '', full_name: '', phone: '', email: '', password: generatePassword(), is_active: true });
            setShowAddModal(true);
          }}
          className="shadow-md bg-amber-600 hover:bg-amber-700 border-none"
        >
          Tambah Wali
        </Button>
      </div>

      <Card variant="glass" padding="md" className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-light absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari nama atau username wali..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 text-sm font-semibold text-obsidian"
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" color="gold" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="Belum ada akun wali"
          description="Klik 'Tambah Wali' untuk membuat akun wali murid lalu hubungkan dengan siswa."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((w) => (
            <Card key={w.id} variant="glass" padding="md" className="border-l-4 border-l-amber-500">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-obsidian">{w.full_name}</h3>
                    <p className="text-xs text-slate font-medium">@{w.username}</p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <Badge variant="gold">Wali Murid</Badge>
                      {w.is_active === false && <Badge variant="danger">Nonaktif</Badge>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openManageModal(w)}
                    className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
                    title="Kelola Santri"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setSelectedWali(w); setShowResetModal(true); }}
                    className="p-2 rounded-lg bg-gold-bg text-gold-dark hover:bg-gold-accent hover:text-white transition-colors"
                    title="Reset Password"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(w)}
                    className="p-2 rounded-lg bg-emerald-light text-emerald-primary hover:bg-emerald-primary hover:text-white transition-colors"
                    title="Edit Wali"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setSelectedWali(w); setShowDeleteModal(true); }}
                    disabled={w.is_active === false || w.id === user?.id}
                    className="p-2 rounded-lg bg-rose-50 text-rose-danger hover:bg-rose-danger hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Nonaktifkan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-600" /> Anak Terhubung
                  </span>
                  <Badge variant={w.linked_students.length > 0 ? 'info' : 'default'}>
                    {w.linked_students.length} Siswa
                  </Badge>
                </div>
                {w.linked_students.length === 0 ? (
                  <p className="text-xs text-slate font-medium italic">
                    Belum ada siswa terhubung. Klik ikon link untuk menghubungkan.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {w.linked_students.map((s) => (
                      <span key={s.id} className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-blue-50 text-blue-800">
                        <GraduationCap className="w-3 h-3" />
                        {s.nis} · {s.full_name}
                      </span>
                    ))}
                  </div>
                )}
                {w.phone && <p className="text-xs text-slate font-medium mt-2">📞 {w.phone}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Wali Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah Akun Wali Murid">
        <form onSubmit={handleAddWali} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Username <span className="text-rose-danger">*</span></label>
            <Input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              placeholder="contoh: wali_ahmad"
              className="text-sm font-semibold text-obsidian"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Nama Lengkap <span className="text-rose-danger">*</span></label>
            <Input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="contoh: H. Ahmad Syafi'i"
              className="text-sm font-semibold text-obsidian"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">No. WhatsApp</label>
              <Input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="contoh: 08123456789"
                className="text-sm font-semibold text-obsidian"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contoh: ahmad@gmail.com"
                className="text-sm font-semibold text-obsidian"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Password <span className="text-rose-danger">*</span></label>
            <div className="flex gap-2">
              <Input
                type="text"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimal 6 karakter"
                className="text-sm font-semibold text-obsidian flex-1"
              />
              <Button type="button" variant="outline" size="sm" leftIcon={<Dices className="w-4 h-4" />} onClick={() => setFormData({ ...formData, password: generatePassword() })}>
                Generate
              </Button>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Batal</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="bg-amber-600 hover:bg-amber-700 border-none">Simpan Wali</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Data Wali">
        <form onSubmit={handleEditWali} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-1.5">Username (Tidak Bisa Diubah)</label>
            <Input type="text" disabled value={formData.username} className="text-sm font-semibold text-slate-dark" />
          </div>
          <div>
            <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Nama Lengkap <span className="text-rose-danger">*</span></label>
            <Input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="text-sm font-semibold text-obsidian"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">No. WhatsApp</label>
              <Input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="text-sm font-semibold text-obsidian" />
            </div>
            <div>
              <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Email</label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="text-sm font-semibold text-obsidian" />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded border-slate/30 accent-amber-600"
            />
            <label htmlFor="isActive" className="text-sm font-bold text-obsidian">Akun Aktif (Dapat Login)</label>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Batal</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="bg-amber-600 hover:bg-amber-700 border-none">Update Data</Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="Reset Password Wali">
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="p-3 bg-gold-bg/30 border border-gold-accent/30 rounded-xl">
            <p className="text-xs font-medium text-obsidian">
              Anda akan mereset password untuk <span className="font-bold">{selectedWali?.full_name}</span> (@{selectedWali?.username}).
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Password Baru <span className="text-rose-danger">*</span></label>
            <div className="flex gap-2">
              <Input
                type="text"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan password baru"
                className="text-sm font-semibold text-obsidian flex-1"
              />
              <Button type="button" variant="outline" size="sm" leftIcon={<Dices className="w-4 h-4" />} onClick={() => setNewPassword(generatePassword())}>
                Generate
              </Button>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowResetModal(false)}>Batal</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="bg-gold-dark hover:bg-gold-dark/90 text-white border-none">Simpan Password</Button>
          </div>
        </form>
      </Modal>

      {/* Kelola Santri Modal */}
      <Modal isOpen={showManageModal} onClose={() => setShowManageModal(false)} title={`Kelola Santri — ${selectedWali?.full_name || ''}`} maxWidth="2xl">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-2">Siswa Terhubung</label>
            {selectedWali && selectedWali.linked_students.length === 0 ? (
              <p className="text-xs text-slate font-medium italic">Belum ada siswa terhubung.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedWali?.linked_students.map((s) => (
                  <span key={s.id} className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {s.nis} · {s.full_name}
                    <button
                      onClick={() => handleUnlinkStudent(s.id)}
                      className="ml-1 text-rose-danger hover:bg-rose-100 rounded-md p-0.5 transition-colors"
                      title="Lepaskan siswa ini"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate/10">
            <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-2">Hubungkan Siswa Baru</label>
            {unlinkedStudents.length === 0 ? (
              <p className="text-xs text-slate font-medium italic">Semua siswa sudah terhubung dengan wali ini.</p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger className="flex-1 font-bold">
                    <SelectValue placeholder="Pilih siswa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unlinkedStudents.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.nis} — {s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="primary"
                  leftIcon={<Link2 className="w-4 h-4" />}
                  disabled={!selectedStudentId}
                  isLoading={isSubmitting}
                  onClick={handleLinkStudent}
                  className="bg-blue-600 hover:bg-blue-700 border-none"
                >
                  Hubungkan
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete/Deactivate Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Konfirmasi Penonaktifan">
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-danger/20 rounded-xl">
            <p className="text-sm font-medium text-rose-900">
              Apakah Anda yakin ingin menonaktifkan akun wali <span className="font-bold">{selectedWali?.full_name}</span>?
              Mereka tidak akan bisa login ke dalam sistem lagi.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Batal</Button>
            <Button variant="danger" isLoading={isSubmitting} onClick={handleDeactivate}>Ya, Nonaktifkan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
