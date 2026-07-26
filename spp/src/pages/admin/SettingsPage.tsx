import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../components/ui/ToastContext';
import { Card, Button, InputCurrency, LogoInput } from '../../components/ui';
import { Settings, Save, RefreshCw, Building, Phone, Mail, MapPin, Calendar, CheckCircle2, Image as ImageIcon } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { success } = useToast();

  const [name, setName] = useState(settings.name);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [logoUrl, setLogoUrl] = useState(settings.logo || '');
  const [sppDefault, setSppDefault] = useState(settings.spp_nominal_default);
  const [academicYear, setAcademicYear] = useState(settings.academic_year_current);
  const [isSaving, setIsSaving] = useState(false);

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
      success('Pengaturan Disimpan', 'Identitas pesantren dan logo telah diperbarui ke seluruh sistem (Real-time SSE Sync).');
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

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
            <Settings className="w-6 h-6 text-emerald-primary" />
            <span>Pengaturan & Profil Sekolah</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate mt-1">
            Kelola identitas resmi, logo (mendukung copas URL eksternal / upload), serta nominal SPP default.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Reset Default
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
            Simpan Perubahan
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Logo & Favicon Configuration Section */}
        <Card variant="glass" padding="lg" glow="emerald" className="border-2 border-emerald-primary/30">
          <div className="flex items-center justify-between mb-4 border-b border-slate/10 pb-3">
            <h3 className="font-extrabold text-obsidian text-base flex items-center gap-2 font-heading">
              <ImageIcon className="w-5 h-5 text-emerald-primary" />
              <span>Logo & Branding Sekolah (Real-Time SSE Sync)</span>
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
        <Card variant="glass" padding="lg">
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
        <Card variant="glass" padding="lg">
          <h3 className="font-extrabold text-obsidian text-base mb-4 border-b border-slate/10 pb-3 flex items-center gap-2 font-heading">
            <Calendar className="w-5 h-5 text-emerald-primary" />
            <span>Konfigurasi Tahun Ajaran & SPP</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-obsidian mb-1.5">
                Tahun Ajaran Aktif (Semester Sekarang)
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="contoh: 2025/2026"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate/20 text-sm font-semibold text-obsidian focus:outline-none focus:ring-2 focus:ring-emerald-primary/20 focus:border-emerald-primary shadow-2xs"
                required
              />
              <p className="text-xs text-slate mt-1">
                Akan ditampilkan sebagai filter default pada grid SPP dan laporan keuangan.
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

        {/* Save Footer Button for Mobile */}
        <div className="flex sm:hidden justify-end pt-2">
          <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isSaving} leftIcon={<Save className="w-5 h-5" />}>
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
};
