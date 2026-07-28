import React, { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../components/ui/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, InputCurrency, LogoInput } from '../../components/ui';
import { api } from '../../api/client';
import type { AcademicYear, BillCategory } from '../../types';
import { Settings, Save, RefreshCw, Building, Phone, Mail, MapPin, Calendar, CheckCircle2, Image as ImageIcon, Sparkles, Plus, Trash2, Tag, GraduationCap, Layers, Check, X } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { success, error: toastError } = useToast();
  const { user } = useAuth();

  const isDemo = user?.email === 'demo' || user?.email === 'admin_demo' || user?.name?.toLowerCase().includes('demo');

  // Basic Identity & Logo State
  const [name, setName] = useState(settings.name);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [logoUrl, setLogoUrl] = useState(settings.logo || '');
  const [sppDefault, setSppDefault] = useState(settings.spp_nominal_default);
  const [academicYear, setAcademicYear] = useState(settings.academic_year_current);
  const [isSaving, setIsSaving] = useState(false);

  // Master Tahun Ajaran State
  const [academicYearsList, setAcademicYearsList] = useState<AcademicYear[]>([
    { id: 1, name: '2024/2025', is_active: true },
    { id: 2, name: '2025/2026', is_active: true },
  ]);
  const [newAyName, setNewAyName] = useState('');
  const [isAddingAy, setIsAddingAy] = useState(false);

  // Master Kategori Tagihan State
  const [billCategoriesList, setBillCategoriesList] = useState<BillCategory[]>([
    { id: 1, code: 'seragam', name: 'Seragam Sekolah', default_amount: 500000, is_active: true },
    { id: 2, code: 'buku', name: 'Buku Pelajaran & LKS', default_amount: 350000, is_active: true },
    { id: 3, code: 'kegiatan', name: 'Kegiatan & Ekskul', default_amount: 250000, is_active: true },
    { id: 4, code: 'denda', name: 'Denda & Administrasi', default_amount: 50000, is_active: true },
  ]);
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatAmount, setNewCatAmount] = useState<number>(0);
  const [isAddingCat, setIsAddingCat] = useState(false);

  // Fetch Master Data from Backend API
  useEffect(() => {
    if (!isDemo) {
      api.get('/settings/academic-years')
        .then(res => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setAcademicYearsList(res.data);
          }
        })
        .catch(() => {});

      api.get('/settings/bill-categories')
        .then(res => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setBillCategoriesList(res.data);
          }
        })
        .catch(() => {});
    }
  }, [isDemo]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      updateSettings({
        name,
        address,
        phone,
        email,
        logo: logoUrl,
        favicon: logoUrl,
        spp_nominal_default: sppDefault,
        academic_year_current: academicYear,
      });
      setIsSaving(false);
      success('Pengaturan Disimpan', 'Identitas pesantren dan konfigurasi telah diperbarui ke seluruh sistem .');
    }, 600);
  };

  const handleReset = () => {
    setName('PTDARRAHMAN');
    setAddress('Jl. Raya Pesantren No. 99, Cibinong, Bogor, Jawa Barat 16914');
    setPhone('(021) 8765-4321');
    setEmail('info@ptdarrahman.sch.id');
    setLogoUrl('/download.png');
    setSppDefault(1500000);
    setAcademicYear('2025/2026');
    success('Direset ke Default', 'Pengaturan telah dikembalikan ke standar awal PTDARRAHMAN.');
  };

  // Handlers for Academic Years
  const handleAddAcademicYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAyName.trim()) return;
    setIsAddingAy(true);
    try {
      if (!isDemo) {
        const res = await api.post('/settings/academic-years', { name: newAyName, is_active: true });
        setAcademicYearsList(prev => [res.data, ...prev]);
      } else {
        const newAy: AcademicYear = { id: Date.now(), name: newAyName, is_active: true };
        setAcademicYearsList(prev => [newAy, ...prev]);
      }
      setNewAyName('');
      success('Tahun Ajaran Ditambahkan', `Tahun ajaran ${newAyName} berhasil ditambahkan ke sistem.`);
    } catch (err: any) {
      toastError('Gagal Menambahkan', err?.response?.data?.detail || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setIsAddingAy(false);
    }
  };

  const handleDeleteAcademicYear = async (id: number, name: string) => {
    try {
      if (!isDemo) {
        await api.delete(`/settings/academic-years/${id}`);
      }
      setAcademicYearsList(prev => prev.filter(item => item.id !== id));
      success('Tahun Ajaran Dinonaktifkan', `Tahun ajaran ${name} berhasil dinonaktifkan dari daftar.`);
    } catch (err: any) {
      toastError('Gagal Menghapus', err?.response?.data?.detail || 'Terjadi kesalahan saat menghapus.');
    }
  };

  const handleToggleAcademicYear = async (id: number, name: string, isActive: boolean) => {
    try {
      if (!isDemo) {
        await api.put(`/settings/academic-years/${id}`, { is_active: isActive });
      }
      setAcademicYearsList(prev => prev.map(item => ({
        ...item,
        is_active: item.id === id ? isActive : (isActive ? false : item.is_active)
      })));
      success('Tahun Ajaran Diaktifkan', `Tahun ajaran ${name} sekarang menjadi periode aktif.`);
    } catch (err: any) {
      toastError('Gagal Mengubah', err?.response?.data?.detail || 'Terjadi kesalahan saat mengubah status.');
    }
  };

  // Handlers for Bill Categories
  const handleAddBillCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatCode.trim() || !newCatName.trim()) return;
    setIsAddingCat(true);
    try {
      if (!isDemo) {
        const res = await api.post('/settings/bill-categories', {
          code: newCatCode.toLowerCase().replace(/\s+/g, '_'),
          name: newCatName,
          default_amount: newCatAmount,
          is_active: true
        });
        setBillCategoriesList(prev => [...prev, res.data]);
      } else {
        const newCat: BillCategory = {
          id: Date.now(),
          code: newCatCode.toLowerCase().replace(/\s+/g, '_'),
          name: newCatName,
          default_amount: newCatAmount,
          is_active: true
        };
        setBillCategoriesList(prev => [...prev, newCat]);
      }
      setNewCatCode('');
      setNewCatName('');
      setNewCatAmount(0);
      success('Kategori Tagihan Ditambahkan', `Kategori "${newCatName}" berhasil disimpan.`);
    } catch (err: any) {
      toastError('Gagal Menambahkan', err?.response?.data?.detail || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setIsAddingCat(false);
    }
  };

  const handleDeleteBillCategory = async (id: number, name: string) => {
    try {
      if (!isDemo) {
        await api.delete(`/settings/bill-categories/${id}`);
      }
      setBillCategoriesList(prev => prev.filter(item => item.id !== id));
      success('Kategori Dinonaktifkan', `Kategori "${name}" berhasil dinonaktifkan.`);
    } catch (err: any) {
      toastError('Gagal Menghapus', err?.response?.data?.detail || 'Terjadi kesalahan saat menghapus.');
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
      {isDemo && (
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Logo & Favicon Configuration Section */}
        <Card variant="glass" padding="lg" glow="emerald" className="border-2 border-emerald-primary/30 shadow-md">
          <div className="flex items-center justify-between mb-4 border-b border-slate/10 pb-3">
            <h3 className="font-extrabold text-obsidian text-base flex items-center gap-2 font-heading">
              <ImageIcon className="w-5 h-5 text-emerald-primary" />
              <span>Logo & Branding Sekolah </span>
            </h3>
            <div className="text-xs font-bold text-emerald-primary bg-emerald-light px-2.5 py-1 rounded-lg flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Harmonisasi Superadmin</span>
            </div>
          </div>

          <LogoInput
            value={logoUrl}
            onChange={(newUrl) => setLogoUrl(newUrl)}
            label="Upload Logo Baru atau Copas URL Gambar"
            helpText="Perubahan logo otomatis sinkron dengan modul Superadmin, PPDB, dan seluruh portal tanpa reload!"
          />
        </Card>

        {/* Identity Section */}
        <Card variant="glass" padding="lg" className="shadow-sm">
          <h3 className="font-extrabold text-obsidian text-base mb-4 border-b border-slate/10 pb-3 flex items-center gap-2 font-heading">
            <Building className="w-5 h-5 text-emerald-primary" />
            <span>Identitas Resmi Pesantren</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-obsidian mb-1.5">
                Nama Sekolah / Yayasan
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-light absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate/20 text-sm font-semibold text-obsidian focus:outline-none focus:ring-2 focus:ring-emerald-primary/20 focus:border-emerald-primary shadow-2xs"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-obsidian mb-1.5">
                Alamat Lengkap (Untuk Kuitansi & Laporan)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-light absolute left-3.5 top-3.5" />
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate/20 text-sm font-semibold text-obsidian focus:outline-none focus:ring-2 focus:ring-emerald-primary/20 focus:border-emerald-primary shadow-2xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-obsidian mb-1.5">
                Nomor Telepon / WhatsApp Kontak
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-light absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate/20 text-sm font-semibold text-obsidian focus:outline-none focus:ring-2 focus:ring-emerald-primary/20 focus:border-emerald-primary shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-obsidian mb-1.5">
                Email Resmi
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-light absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate/20 text-sm font-semibold text-obsidian focus:outline-none focus:ring-2 focus:ring-emerald-primary/20 focus:border-emerald-primary shadow-2xs"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Academic & Financial Settings */}
        <Card variant="glass" padding="lg" className="shadow-sm">
          <h3 className="font-extrabold text-obsidian text-base mb-4 border-b border-slate/10 pb-3 flex items-center gap-2 font-heading">
            <Calendar className="w-5 h-5 text-emerald-primary" />
            <div>
              <InputCurrency
                label="Nominal SPP Bulanan (Berlaku untuk seluruh siswa)"
                value={sppDefault}
                onChange={(val) => setSppDefault(val)}
                showQuickChips={true}
                quickChips={[100000, 250000, 300000, 500000]}
                allowPayAll={false}
              />
              <p className="text-xs text-slate mt-1">
                Nominal ini adalah besaran SPP global yang akan berlaku dan ditagihkan ke seluruh siswa.
              </p>
            </div>

            <div>
              <InputCurrency
                label="Nominal SPP Bulanan Default (Per Santri)"
                value={sppDefault}
                onChange={(val) => setSppDefault(val)}
                showQuickChips={true}
                quickChips={[1000000, 1500000, 2000000, 2500000]}
                allowPayAll={false}
              />
              <p className="text-xs text-slate mt-1">
                Nominal standar ini akan dipakai otomatis oleh sistem saat membuat tagihan bulanan massal.
              </p>
            </div>
          </div>
        </Card>
      </form>

      {/* NEW: Master Tahun Ajaran Management */}
      <Card variant="glass" padding="lg" className="shadow-sm border border-emerald-primary/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-slate/10 pb-4">
          <div>
            <h3 className="font-extrabold text-obsidian text-base flex items-center gap-2 font-heading">
              <GraduationCap className="w-5 h-5 text-emerald-primary" />
              <span>Master Tahun Ajaran (Academic Years)</span>
            </h3>
            <p className="text-xs text-slate mt-0.5">
              Daftar tahun ajaran yang tersedia untuk dikaitkan ke siswa, kelas, dan tagihan SPP.
            </p>
          </div>
          <form onSubmit={handleAddAcademicYear} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Contoh: 2026/2027"
              value={newAyName}
              onChange={(e) => setNewAyName(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate/20 text-xs font-semibold text-obsidian focus:outline-none focus:ring-2 focus:ring-emerald-primary/20 focus:border-emerald-primary w-40 sm:w-48 shadow-2xs"
            />
            <Button type="submit" variant="primary" size="sm" isLoading={isAddingAy} leftIcon={<Plus className="w-4 h-4" />}>
              Tambah
            </Button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate/10 text-[11px] font-extrabold uppercase text-slate tracking-wider">
                <th className="py-3 px-4">Nama Tahun Ajaran</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate/5 text-sm font-medium">
              {academicYearsList.map((ay) => (
                <tr key={ay.id} className="hover:bg-slate/5 transition-colors">
                  <td className="py-3 px-4 font-bold text-obsidian flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-primary" />
                    <span>{ay.name}</span>
                    {ay.name === academicYear && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-light text-emerald-primary text-[10px] font-extrabold">
                        Aktif Saat Ini
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${ay.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                      {ay.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {ay.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      {!ay.is_active && (
                        <button
                          onClick={() => handleToggleAcademicYear(ay.id, ay.name, true)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-primary text-white text-xs font-bold hover:bg-emerald-600 transition-colors"
                          title="Jadikan Aktif"
                        >
                          Jadikan Aktif
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAcademicYear(ay.id, ay.name)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-danger hover:bg-rose-danger hover:text-white transition-colors"
                        title="Hapus / Nonaktifkan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {academicYearsList.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-xs font-semibold text-slate">
                    Belum ada data Master Tahun Ajaran. Silakan tambahkan di atas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>


    </div>
  );
};

