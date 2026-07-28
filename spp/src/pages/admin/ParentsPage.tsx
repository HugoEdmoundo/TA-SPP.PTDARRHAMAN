import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, EmptyState, Spinner, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { UserCheck, Plus, Search, Link2, Unlink, UserPlus, Phone, Mail, Users, CheckCircle2 } from 'lucide-react';
import type { User, Student } from '../../types';

export const ParentsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const isDemo = user?.email === 'demo' || user?.email === 'admin_demo' || user?.name?.toLowerCase().includes('demo');

  const [parents, setParents] = useState<User[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [parentStudentsMap, setParentStudentsMap] = useState<Record<string, Student[]>>({});
  const [isLoading, setIsLoading] = useState(!isDemo);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<User | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Form Add Wali
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('wali123');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (isDemo) return;
    setIsLoading(true);
    try {
      let url = `/users/?role=wali`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      
      const [parentsRes, studentsRes] = await Promise.all([
        api.get(url),
        api.get('/students/?limit=500'),
      ]);

      const parentList = parentsRes.data || [];
      const studentList = studentsRes.data || [];
      
      setParents(parentList);
      setAllStudents(studentList);

      // Build map of students linked to each parent
      const map: Record<string, Student[]> = {};
      studentList.forEach((st: any) => {
        if (st.parents && Array.isArray(st.parents)) {
          st.parents.forEach((p: any) => {
            const pid = String(p.id);
            if (!map[pid]) map[pid] = [];
            map[pid].push(st);
          });
        }
      });
      setParentStudentsMap(map);

    } catch (err: any) {
      toastError('Gagal Memuat Data', err?.response?.data?.detail || 'Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, isDemo]);

  const handleOpenAdd = () => {
    setUsername('');
    setFullName('');
    setPassword('wali123');
    setPhone('');
    setEmail('');
    setShowAddModal(true);
  };

  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !fullName || !password) {
      toastError('Form Tidak Lengkap', 'Username, Nama, dan Password wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/users/', {
        username,
        full_name: fullName,
        password,
        role: 'wali',
        phone,
        email,
        is_active: true,
      });
      success('Akun Wali Dibuat', `Akun wali atas nama ${fullName} (${username}) berhasil didaftarkan.`);
      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      toastError('Gagal Membuat Akun', err?.response?.data?.detail || 'Username mungkin sudah digunakan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenLink = (parent: User) => {
    setSelectedParent(parent);
    setSelectedStudentId(allStudents[0]?.id ? String(allStudents[0].id) : '');
    setShowLinkModal(true);
  };

  const handleConfirmLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParent || !selectedStudentId) return;
    setIsSubmitting(true);
    try {
      await api.post(`/students/${selectedStudentId}/parents`, {
        parent_id: Number(selectedParent.id),
      });
      const stName = allStudents.find(s => String(s.id) === String(selectedStudentId))?.name || 'Santri';
      success('Tautan Berhasil', `Akun wali ${selectedParent.name || selectedParent.email} berhasil ditautkan dengan santri ${stName}.`);
      setShowLinkModal(false);
      fetchData();
    } catch (err: any) {
      toastError('Gagal Menautkan', err?.response?.data?.detail || 'Siswa mungkin sudah terhubung dengan wali ini.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlink = async (parentId: string | number, studentId: string | number, studentName: string) => {
    try {
      await api.delete(`/students/${studentId}/parents/${parentId}`);
      success('Tautan Dihapus', `Koneksi wali dengan santri ${studentName} telah dicabut.`);
      fetchData();
    } catch (err: any) {
      toastError('Gagal Melepas Tautan', err?.response?.data?.detail || 'Terjadi kesalahan.');
    }
  };

  if (isDemo) {
    return (
      <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 border-b border-slate/10 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
              <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
              <span>Manajemen Akun Wali Santri</span>
            </h2>
            <p className="text-xs text-slate mt-1">Kelola pertautan (linking) data wali santri dengan satu atau banyak anak sekaligus .</p>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Link2 className="w-4 h-4" />} onClick={() => success('Simulasi Tautkan Wali', 'Beralih ke akun Admin Real untuk menautkan anak angkat secara live.')} className="shrink-0 w-full sm:w-auto justify-center">Tautkan Akun Wali</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card variant="elevated" padding="sm" className="p-4 bg-white/90 border border-slate/15">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs font-bold text-obsidian block">Bapak Ahmad Syafi'i</span>
                <span className="text-[11px] font-mono text-slate">Username: wali_syafii</span>
              </div>
              <Badge status="PAID">Terhubung WA</Badge>
            </div>
            <div className="mt-3 pt-3 border-t border-slate/10 text-xs">
              <span className="text-[11px] font-semibold text-slate block mb-1.5">Anak yang Ditautkan (2 Santri):</span>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-1 rounded-lg bg-emerald-light/60 text-emerald-primary font-bold text-[10px]">Muhammad Faiz Syafi'i (XI-IPA-1)</span>
                <span className="px-2 py-1 rounded-lg bg-emerald-light/60 text-emerald-primary font-bold text-[10px]">Aisyah Zahra Syafi'i (X-A)</span>
              </div>
            </div>
          </Card>
          <Card variant="elevated" padding="sm" className="p-4 bg-white/90 border border-slate/15">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs font-bold text-obsidian block">Ibu Hj. Khadijah</span>
                <span className="text-[11px] font-mono text-slate">Username: wali_rifky</span>
              </div>
              <Badge status="PAID">Terhubung WA</Badge>
            </div>
            <div className="mt-3 pt-3 border-t border-slate/10 text-xs">
              <span className="text-[11px] font-semibold text-slate block mb-1.5">Anak yang Ditautkan (1 Santri):</span>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-1 rounded-lg bg-emerald-light/60 text-emerald-primary font-bold text-[10px]">Rifky Hidayatullah (XII-IPS-2)</span>
              </div>
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
              <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
              <span>Manajemen Akun Wali Santri</span>
            </h2>
            <p className="text-xs text-slate mt-1">Buat akun portal untuk orang tua / wali santri, lalu tautkan dengan satu atau banyak santri sekaligus.</p>
          </div>
          <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-4 h-4" />} onClick={handleOpenAdd} className="shrink-0 w-full sm:w-auto justify-center">
            Buat Akun Wali Baru
          </Button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate/50" />
          <input
            type="text"
            placeholder="Cari nama wali atau username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate/20 bg-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
          />
        </div>
      </Card>

      {isLoading ? (
        <Card variant="glass" padding="lg" className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" color="emerald" />
          <span className="text-xs text-slate mt-3 font-semibold">Memuat akun wali santri dari database...</span>
        </Card>
      ) : parents.length === 0 ? (
        <Card variant="glass" padding="lg">
          <EmptyState
            title="Belum Ada Akun Wali Santri"
            description={searchTerm ? `Tidak ada wali dengan kata kunci "${searchTerm}".` : "Database wali saat ini masih kosong (0 record). Klik tombol Buat Akun Wali Baru di atas untuk mulai menambahkan akun portal orang tua."}
            action={!searchTerm ? <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-4 h-4" />} onClick={handleOpenAdd}>Buat Akun Wali Sekarang</Button> : undefined}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parents.map((p: any) => {
            const linkedStudents = parentStudentsMap[String(p.id)] || [];
            return (
              <Card key={p.id} variant="elevated" padding="sm" className="p-5 bg-white/95 border border-slate/15 flex flex-col justify-between hover:shadow-lg transition-all">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-extrabold text-obsidian text-sm font-heading">{p.full_name || p.name}</h4>
                      <span className="text-[11px] font-mono font-bold text-emerald-primary bg-emerald-light/50 px-2 py-0.5 rounded-md inline-block mt-1">
                        @{p.username || p.email}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-light text-emerald-primary text-[10px] font-bold shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Aktif
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 text-[11px] text-slate mt-3 border-t border-slate/10 pt-2.5">
                    {p.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate/70" />
                        <span className="font-mono">{p.phone}</span>
                      </div>
                    )}
                    {p.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate/70 shrink-0" />
                        <span className="truncate">{p.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-obsidian flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-emerald-primary" />
                        <span>Anak Terhubung ({linkedStudents.length}):</span>
                      </span>
                      <button
                        onClick={() => handleOpenLink(p)}
                        className="text-[11px] font-bold text-emerald-primary hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Tautkan Siswa
                      </button>
                    </div>

                    {linkedStudents.length === 0 ? (
                      <div className="p-2.5 rounded-xl bg-slate/5 border border-dashed border-slate/20 text-center text-[11px] text-slate/70 font-medium">
                        Belum ada siswa ditautkan dengan akun ini.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {linkedStudents.map((st: any) => (
                          <div key={st.id} className="p-2 rounded-xl bg-emerald-light/30 border border-emerald-primary/15 flex items-center justify-between gap-2 text-xs">
                            <div className="min-w-0">
                              <span className="font-bold text-obsidian block truncate text-[11px]">{st.full_name || st.name}</span>
                              <span className="text-[10px] font-mono text-slate">NIS: {st.nis} • {st.academic_year || '2025/2026'}</span>
                            </div>
                            <button
                              onClick={() => handleUnlink(p.id, st.id, st.full_name || st.name)}
                              className="p-1 rounded-lg text-slate/60 hover:text-rose-danger hover:bg-rose-light/50 transition-colors shrink-0"
                              title="Lepas Tautan Siswa Ini"
                            >
                              <Unlink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Add Parent */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={
          <>
            <UserPlus className="w-5 h-5 text-emerald-primary" />
            <span>Buat Akun Wali Santri Baru</span>
          </>
        }
        maxWidth="md"
      >
        <form onSubmit={handleCreateParent} className="flex flex-col gap-3.5 text-xs">
          <div>
            <label className="font-bold text-obsidian block mb-1">Username Portal *</label>
            <input
              type="text"
              required
              placeholder="Misal: wali_ahmad"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              className="w-full p-2.5 rounded-xl border border-slate/25 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
            />
          </div>
          <div>
            <label className="font-bold text-obsidian block mb-1">Nama Lengkap Wali *</label>
            <input
              type="text"
              required
              placeholder="Nama orang tua / wali..."
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate/25 focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-obsidian block mb-1">Password Awal *</label>
              <input
                type="password"
                required
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate/25 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
              />
            </div>
            <div>
              <label className="font-bold text-obsidian block mb-1">No. WhatsApp / HP</label>
              <input
                type="tel"
                placeholder="081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate/25 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
              />
            </div>
          </div>
          <div>
            <label className="font-bold text-obsidian block mb-1">Alamat Email (Opsional)</label>
            <input
              type="email"
              placeholder="contoh@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate/25 focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
            />
          </div>
          <div className="flex justify-end gap-2.5 mt-2 pt-3 border-t border-slate/15">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>Batal</Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>Buat Akun</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Link Student */}
      <Modal
        isOpen={showLinkModal && !!selectedParent}
        onClose={() => setShowLinkModal(false)}
        title={
          <>
            <Link2 className="w-5 h-5 text-emerald-primary" />
            <span>Tautkan Siswa dengan Wali</span>
          </>
        }
        maxWidth="md"
      >
            {selectedParent && (
              <p className="text-xs text-slate mb-4">
                Menautkan santri dengan akun <b>{selectedParent.full_name || selectedParent.name}</b> (@{selectedParent.username || selectedParent.email}).
              </p>
            )}
            
            <form onSubmit={handleConfirmLink} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-bold text-obsidian block mb-1.5">Pilih Siswa (Santri) *</label>
                {allStudents.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs font-semibold">
                    Belum ada data siswa di database. Silakan daftarkan santri terlebih dahulu di menu Data Siswa.
                  </div>
                ) : (
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate/25 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
                  >
                    {allStudents.map((st: any) => (
                      <option key={st.id} value={st.id}>
                        {st.nis} - {st.full_name || st.name} ({st.academic_year || '2025/2026'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-2.5 mt-2 pt-3 border-t border-slate/15">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowLinkModal(false)}>Batal</Button>
                <Button type="submit" variant="primary" size="sm" disabled={allStudents.length === 0 || !selectedStudentId} isLoading={isSubmitting}>
                  Simpan Tautan
                </Button>
              </div>
            </form>
      </Modal>
    </div>
  );
};

export default ParentsPage;
