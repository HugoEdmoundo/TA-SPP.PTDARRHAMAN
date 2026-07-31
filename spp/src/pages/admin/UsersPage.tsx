import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, EmptyState, Spinner, Modal, Input, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../../components/ui';
import { useToast } from '../../components/ui/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { ShieldAlert, Plus, Search, UserCheck, Shield, Key, Edit, Trash2 } from 'lucide-react';
import type { User } from '../../types';

export const UsersPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    password: '',
    role: 'admin',
    is_active: true,
  });
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let url = '/users/?';
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
      if (filterRole) url += `role=${encodeURIComponent(filterRole)}&`;
      
      const res = await api.get(url);
      setUsersList(res.data || []);
    } catch (err: any) {
      toastError('Gagal Memuat Data', err.response?.data?.detail || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, filterRole]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      await api.post('/users/', formData);
      success('Berhasil', `Akun ${formData.username} berhasil dibuat.`);
      setShowAddModal(false);
      setFormData({ username: '', full_name: '', password: '', role: 'admin', is_active: true });
      fetchUsers();
    } catch (err: any) {
      toastError('Gagal', err.response?.data?.detail || 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    try {
      await api.put(`/users/${selectedUser.id}`, {
        full_name: formData.full_name,
        role: formData.role,
        is_active: formData.is_active,
      });
      success('Berhasil', 'Data pengguna berhasil diperbarui.');
      setShowEditModal(false);
      fetchUsers();
    } catch (err: any) {
      toastError('Gagal', err.response?.data?.detail || 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    try {
      await api.post(`/users/${selectedUser.id}/reset-password`, { new_password: newPassword });
      success('Berhasil', 'Password berhasil direset.');
      setShowResetModal(false);
      setNewPassword('');
    } catch (err: any) {
      toastError('Gagal', err.response?.data?.detail || 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    try {
      await api.delete(`/users/${selectedUser.id}`);
      success('Berhasil', 'Pengguna berhasil dinonaktifkan.');
      setShowDeleteModal(false);
      fetchUsers();
    } catch (err: any) {
      toastError('Gagal', err.response?.data?.detail || 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (u: User) => {
    setSelectedUser(u);
    setFormData({
      username: u.email || '',
      full_name: u.name,
      password: '',
      role: u.role.toLowerCase(),
      is_active: u.is_active ?? true,
    });
    setShowEditModal(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role.toUpperCase()) {
      case 'SUPERADMIN': return <Badge variant="info">Superadmin</Badge>;
      case 'ADMIN': return <Badge variant="success">Admin</Badge>;
      default: return <Badge variant="default">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-obsidian tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-purple-600" />
            Manajemen Pengguna (Superadmin)
          </h1>
          <p className="text-sm text-slate font-medium mt-1">
            Kelola akses login untuk seluruh ekosistem aplikasi PTDARRAHMAN.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setFormData({ username: '', full_name: '', password: '', role: 'admin', is_active: true });
            setShowAddModal(true);
          }}
          className="shadow-md bg-purple-600 hover:bg-purple-700 border-none"
        >
          Buat Akun Baru
        </Button>
      </div>

      <Card variant="glass" padding="md" className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-light absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari username atau nama lengkap..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 text-sm font-semibold text-obsidian"
          />
        </div>
        <Select value={filterRole || '__all__'} onValueChange={(v) => setFilterRole(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-48 font-bold">
            <SelectValue placeholder="Semua Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Semua Role</SelectItem>
            <SelectItem value="superadmin">Superadmin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" color="emerald" />
        </div>
      ) : usersList.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="Tidak ada pengguna ditemukan"
          description="Coba ubah kata kunci pencarian atau filter role."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {usersList.map((u) => (
            <Card key={u.id} variant="glass" padding="md" className="border-l-4 border-l-purple-600">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-obsidian">{u.name}</h3>
                    <p className="text-xs text-slate font-medium">@{u.email || u.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {getRoleBadge(u.role)}
                      {u.is_active === false && <Badge variant="danger">Nonaktif</Badge>}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setSelectedUser(u); setShowResetModal(true); }}
                    className="p-2 rounded-lg bg-gold-bg text-gold-dark hover:bg-gold-accent hover:text-white transition-colors"
                    title="Reset Password"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(u)}
                    className="p-2 rounded-lg bg-emerald-light text-emerald-primary hover:bg-emerald-primary hover:text-white transition-colors"
                    title="Edit Pengguna"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setSelectedUser(u); setShowDeleteModal(true); }}
                    disabled={u.is_active === false || u.id === user?.id}
                    className="p-2 rounded-lg bg-rose-50 text-rose-danger hover:bg-rose-danger hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Nonaktifkan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Buat Akun Baru">
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Username <span className="text-rose-danger">*</span></label>
            <Input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
              placeholder="contoh: budi_admin"
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
              placeholder="contoh: Budi Santoso"
              className="text-sm font-semibold text-obsidian"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Password <span className="text-rose-danger">*</span></label>
            <Input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimal 6 karakter"
              className="text-sm font-semibold text-obsidian"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Role <span className="text-rose-danger">*</span></label>
            <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
              <SelectTrigger className="font-bold">
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superadmin">Superadmin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Batal</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="bg-purple-600 hover:bg-purple-700 border-none">Simpan Akun</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Pengguna">
        <form onSubmit={handleEditUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-1.5">Username (Tidak Bisa Diubah)</label>
            <Input
              type="text"
              disabled
              value={formData.username}
              className="text-sm font-semibold text-slate-dark"
            />
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
          <div>
            <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Role <span className="text-rose-danger">*</span></label>
            <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
              <SelectTrigger className="font-bold">
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superadmin">Superadmin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded border-slate/30 accent-purple-600"
            />
            <label htmlFor="isActive" className="text-sm font-bold text-obsidian">Akun Aktif (Dapat Login)</label>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Batal</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="bg-purple-600 hover:bg-purple-700 border-none">Update Profil</Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="Reset Password">
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="p-3 bg-gold-bg/30 border border-gold-accent/30 rounded-xl">
            <p className="text-xs font-medium text-obsidian">
              Anda akan mereset password untuk <span className="font-bold">{selectedUser?.name}</span> (@{selectedUser?.email}).
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-obsidian uppercase tracking-wider mb-1.5">Password Baru <span className="text-rose-danger">*</span></label>
            <Input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Masukkan password baru"
              className="text-sm font-semibold text-obsidian"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowResetModal(false)}>Batal</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="bg-gold-dark hover:bg-gold-dark/90 text-white border-none">Simpan Password</Button>
          </div>
        </form>
      </Modal>

      {/* Delete/Deactivate Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Konfirmasi Penonaktifan">
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-danger/20 rounded-xl">
            <p className="text-sm font-medium text-rose-900">
              Apakah Anda yakin ingin menonaktifkan pengguna <span className="font-bold">{selectedUser?.name}</span>? 
              Mereka tidak akan bisa login ke dalam sistem lagi.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Batal</Button>
            <Button variant="danger" isLoading={isSubmitting} onClick={handleDeleteUser}>Ya, Nonaktifkan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
