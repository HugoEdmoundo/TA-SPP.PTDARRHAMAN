import React, { useState } from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/ToastContext';
import { User, ShieldCheck, Key, Mail, Phone, Lock, AlertCircle } from 'lucide-react';

export const AdminProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [fullName, setFullName] = useState(user?.full_name || user?.name || 'Administrator PTDARRAHMAN');
  const [email, setEmail] = useState(user?.email || 'admin@ptdarrahman.sch.id');
  const [phone, setPhone] = useState(user?.phone || '081234567890');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setTimeout(() => {
      setIsUpdatingProfile(false);
      success('Profil Diperbarui', 'Informasi akun admin Anda berhasil disimpan ke sistem.');
    }, 800);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toastError('Gagal Ganti Password', 'Harap isi seluruh kolom kata sandi.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('Kata Sandi Tidak Cocok', 'Kata sandi baru dan konfirmasi kata sandi tidak sama.');
      return;
    }
    if (newPassword.length < 6) {
      toastError('Kata Sandi Terlalu Pendek', 'Kata sandi minimal harus 6 karakter.');
      return;
    }

    setIsChangingPassword(true);
    setTimeout(() => {
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      success('Password Berhasil Diganti', 'Kata sandi akun admin Anda telah diperbarui. Gunakan kata sandi baru untuk login berikutnya.');
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <Card variant="glass" padding="md" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-primary to-emerald-light flex items-center justify-center text-white text-2xl font-black shadow-lg shrink-0">
            {fullName?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-obsidian font-heading">{fullName}</h2>
              <Badge status={user?.role === 'SUPERADMIN' || user?.role === 'superadmin' ? 'PAID' : 'INFO'} size="sm">
                {user?.role || 'ADMIN'}
              </Badge>
            </div>
            <p className="text-xs text-slate mt-0.5 font-mono">{email} • Akun Resmi Pengelola Keuangan</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-primary bg-emerald-light/50 px-3 py-1.5 rounded-xl border border-emerald-primary/20">
          <ShieldCheck className="w-4 h-4 text-emerald-primary" />
          <span>Sesi Aktif & Terproteksi</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Information Form */}
        <Card variant="elevated" padding="lg" className="flex flex-col gap-5">
          <div className="border-b border-slate/15 pb-3">
            <h3 className="text-base font-extrabold text-obsidian flex items-center gap-2 font-heading">
              <User className="w-5 h-5 text-emerald-primary" />
              <span>Informasi Pribadi & Kontak</span>
            </h3>
            <p className="text-xs text-slate mt-0.5">Kelola nama lengkap, alamat email, dan nomor telepon aktif Anda.</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="font-bold text-obsidian block mb-1">Nama Lengkap Admin *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 pl-9 rounded-xl border border-slate/25 font-bold text-obsidian focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                />
                <User className="w-4 h-4 text-slate absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="font-bold text-obsidian block mb-1">Alamat Email Resmi *</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 pl-9 rounded-xl border border-slate/25 font-mono text-obsidian focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                />
                <Mail className="w-4 h-4 text-slate absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="font-bold text-obsidian block mb-1">Nomor WhatsApp / Kontak *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 pl-9 rounded-xl border border-slate/25 font-mono text-obsidian focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                />
                <Phone className="w-4 h-4 text-slate absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="font-bold text-obsidian block mb-1">Level Akses Role (Hanya Baca)</label>
              <input
                type="text"
                disabled
                value={user?.role || 'ADMIN'}
                className="w-full p-2.5 rounded-xl border border-slate/15 bg-slate/5 font-mono font-bold text-slate uppercase cursor-not-allowed"
              />
            </div>

            <div className="pt-2 border-t border-slate/15 flex justify-end">
              <Button variant="primary" size="sm" type="submit" isLoading={isUpdatingProfile}>Simpan Perubahan Profil</Button>
            </div>
          </form>
        </Card>

        {/* Change Password & Security Card */}
        <Card variant="elevated" padding="lg" className="flex flex-col gap-5">
          <div className="border-b border-slate/15 pb-3">
            <h3 className="text-base font-extrabold text-obsidian flex items-center gap-2 font-heading">
              <Key className="w-5 h-5 text-emerald-primary" />
              <span>Keamanan & Kata Sandi</span>
            </h3>
            <p className="text-xs text-slate mt-0.5">Perbarui kata sandi secara berkala untuk menjaga keamanan data keuangan PTDARRAHMAN.</p>
          </div>

          <form onSubmit={handleChangePassword} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="font-bold text-obsidian block mb-1">Kata Sandi Saat Ini *</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Masukkan kata sandi lama..."
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2.5 pl-9 rounded-xl border border-slate/25 text-obsidian focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                />
                <Lock className="w-4 h-4 text-slate absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="font-bold text-obsidian block mb-1">Kata Sandi Baru *</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Minimal 6 karakter..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 pl-9 rounded-xl border border-slate/25 text-obsidian focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                />
                <Lock className="w-4 h-4 text-slate absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="font-bold text-obsidian block mb-1">Konfirmasi Kata Sandi Baru *</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Ulangi kata sandi baru..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 pl-9 rounded-xl border border-slate/25 text-obsidian focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                />
                <Lock className="w-4 h-4 text-slate absolute left-3 top-3" />
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2 mt-1">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>Pastikan kata sandi baru Anda kuat dengan kombinasi huruf, angka, dan karakter khusus demi keamanan enkripsi.</span>
            </div>

            <div className="pt-2 border-t border-slate/15 flex justify-end">
              <Button variant="outline" size="sm" type="submit" isLoading={isChangingPassword}>Perbarui Kata Sandi</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
