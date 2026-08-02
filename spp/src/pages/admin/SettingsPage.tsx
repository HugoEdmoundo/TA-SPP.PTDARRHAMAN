import React, { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../components/ui/ToastContext';
import { Card, Button, InputCurrency, LogoInput, Input, Textarea, formatRupiah, formatDateIndo, Spinner } from '../../components/ui';
import { api } from '../../api/client';
import type { AcademicYear, SppSetting, SppSettingLog } from '../../types';
import { academicYearMonths, monthName } from '../../utils/academicYear';
import {
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  Image as ImageIcon,
  GraduationCap,
  History as HistoryIcon,
  TrendingUp,
  Save,
  RefreshCw,
  Info,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { success, error: toastError } = useToast();

  // Basic Identity & Logo State
  const [name, setName] = useState(settings.name);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [logoUrl, setLogoUrl] = useState(settings.logo || '');
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);

  // SPP Nominal State (diambil dari backend, satu-satunya sumber kebenaran)
  const [sppSetting, setSppSetting] = useState<SppSetting | null>(null);
  const [sppNominal, setSppNominal] = useState<number>(500000);
  const [dueDay, setDueDay] = useState<number>(10);
  const [nominalHistory, setNominalHistory] = useState<SppSettingLog[]>([]);
  const [activeAy, setActiveAy] = useState<AcademicYear | null>(null);
  const [isLoadingSpp, setIsLoadingSpp] = useState(true);
  const [isSavingNominal, setIsSavingNominal] = useState(false);

  const loadSppData = async () => {
    setIsLoadingSpp(true);
    try {
      const [sppRes, histRes, ayRes] = await Promise.all([
        api.get('/settings/spp-settings/active'),
        api.get('/settings/spp-settings/history'),
        api.get('/settings/academic-years'),
      ]);
      const spp: SppSetting = sppRes.data;
      setSppSetting(spp);
      setSppNominal(Number(spp.monthly_nominal) || 500000);
      setDueDay(spp.due_day || 10);
      setNominalHistory(histRes.data || []);
      const list: AcademicYear[] = ayRes.data || [];
      const active = list.find((a) => a.is_active) || list[0] || null;
      setActiveAy(active);
    } catch (err: any) {
      toastError('Gagal Memuat Pengaturan SPP', err?.response?.data?.detail || 'Terjadi kesalahan koneksi.');
    } finally {
      setIsLoadingSpp(false);
    }
  };

  useEffect(() => {
    loadSppData();
  }, []);

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingIdentity(true);
    try {
      await api.put('/settings', {
        school_name: name,
        school_address: address,
        school_phone: phone,
      });
      updateSettings({ name, address, phone, email, logo: logoUrl, favicon: logoUrl });
      success('Pengaturan Disimpan', 'Identitas pesantren berhasil diperbarui.');
    } catch (err: any) {
      toastError('Gagal Menyimpan', err?.response?.data?.detail || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setIsSavingIdentity(false);
    }
  };

  const handleSaveNominal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sppNominal <= 0) {
      toastError('Nominal Tidak Valid', 'Nominal SPP harus lebih besar dari 0.');
      return;
    }
    setIsSavingNominal(true);
    try {
      const res = await api.put('/settings/spp-settings/nominal', {
        monthly_nominal: sppNominal,
        due_day: dueDay,
      });
      setSppSetting(res.data);
      success(
        'Nominal SPP Diperbarui',
        `Tagihan SPP bulan berikutnya akan memakai nominal ${formatRupiah(sppNominal)}. Perubahan tercatat di riwayat.`
      );
      loadSppData();
    } catch (err: any) {
      toastError('Gagal Menyimpan Nominal', err?.response?.data?.detail || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setIsSavingNominal(false);
    }
  };

  const sem1 = activeAy ? academicYearMonths(activeAy, 1) : [];
  const sem2 = activeAy ? academicYearMonths(activeAy, 2) : [];

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
      <form onSubmit={handleSaveIdentity} className="flex flex-col gap-6">
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
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 text-sm font-semibold text-obsidian"
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
                <Textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-10 text-sm font-semibold text-obsidian"
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
                <Input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 text-sm font-semibold text-obsidian"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-obsidian mb-1.5">
                Email Resmi
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-light absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 text-sm font-semibold text-obsidian"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-5 pt-4 border-t border-slate/10">
            <Button type="submit" variant="primary" size="sm" leftIcon={<Save className="w-4 h-4" />} isLoading={isSavingIdentity}>
              Simpan Identitas Pesantren
            </Button>
          </div>
        </Card>
      </form>

      {/* Nominal SPP Bulanan */}
      <Card variant="glass" padding="lg" className="shadow-sm border border-emerald-primary/20">
        <div className="flex items-start justify-between gap-3 mb-5 border-b border-slate/10 pb-4">
          <div>
            <h3 className="font-extrabold text-obsidian text-base flex items-center gap-2 font-heading">
              <TrendingUp className="w-5 h-5 text-emerald-primary" />
              <span>Nominal SPP Bulanan</span>
            </h3>
            <p className="text-xs text-slate mt-0.5">
              Satu nominal berlaku untuk seluruh santri, tanpa membedakan kelas.
            </p>
          </div>
          {isLoadingSpp && <Spinner size="sm" color="emerald" />}
        </div>

        <form onSubmit={handleSaveNominal} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-3">
              <InputCurrency
                label="Nominal SPP Bulanan"
                value={sppNominal}
                onChange={(val) => setSppNominal(val)}
                showQuickChips={true}
                quickChips={[200000, 300000, 500000, 1000000]}
                allowPayAll={false}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-obsidian mb-1.5">
                Jatuh Tempo (Tgl)
              </label>
              <Input
                type="number"
                min={1}
                max={31}
                value={dueDay}
                onChange={(e) => setDueDay(Number(e.target.value) || 10)}
                className="w-full text-sm font-semibold text-obsidian"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-light/25 border border-emerald-primary/20 flex items-start gap-3">
            <Info className="w-4 h-4 text-emerald-primary shrink-0 mt-0.5" />
            <p className="text-xs text-obsidian font-medium leading-relaxed">
              Setiap awal bulan, sistem <b>otomatis membuat tagihan SPP</b> untuk seluruh santri yang berstatus aktif.
              Nominal yang dipakai adalah nominal terbaru di sini (tagihan bulan yang sudah dibuat tidak diubah).
              Setiap perubahan nominal tercatat di riwayat di bawah.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<Save className="w-4 h-4" />}
              isLoading={isSavingNominal}
              disabled={isLoadingSpp}
            >
              Simpan Nominal SPP
            </Button>
          </div>
        </form>

        {/* Riwayat Perubahan Nominal */}
        <div className="mt-7">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h4 className="font-extrabold text-obsidian text-sm flex items-center gap-2 font-heading">
              <HistoryIcon className="w-4 h-4 text-emerald-primary" />
              <span>Riwayat Perubahan Nominal</span>
            </h4>
            <button
              type="button"
              onClick={loadSppData}
              className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-primary hover:underline"
            >
              <RefreshCw className="w-3 h-3" />
              Muat Ulang
            </button>
          </div>

          {nominalHistory.length === 0 ? (
            <div className="text-center py-6 bg-slate/5 rounded-xl text-xs font-semibold text-slate italic">
              Belum ada perubahan nominal. Nominal saat ini: {sppSetting ? formatRupiah(Number(sppSetting.monthly_nominal)) : formatRupiah(sppNominal)}.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate/15">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate/15 bg-slate/5 text-slate font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3 pl-4">Tanggal</th>
                    <th className="p-3">Nominal Lama</th>
                    <th className="p-3">Nominal Baru</th>
                    <th className="p-3 pr-4">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate/10">
                  {nominalHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-white/70 transition-colors">
                      <td className="p-3 pl-4 font-semibold text-obsidian whitespace-nowrap">
                        {formatDateIndo(h.changed_at)}
                      </td>
                      <td className="p-3 font-mono text-slate">
                        {h.old_nominal != null ? formatRupiah(Number(h.old_nominal)) : '-'}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-primary">
                        {formatRupiah(Number(h.new_nominal))}
                      </td>
                      <td className="p-3 pr-4 text-slate capitalize">{h.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Tahun Akademik (Otomatis) */}
      <Card variant="glass" padding="lg" className="shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-4 border-b border-slate/10 pb-4">
          <div>
            <h3 className="font-extrabold text-obsidian text-base flex items-center gap-2 font-heading">
              <GraduationCap className="w-5 h-5 text-emerald-primary" />
              <span>Tahun Akademik</span>
            </h3>
            <p className="text-xs text-slate mt-0.5">
              Dihitung otomatis dari kalender. Tidak perlu dikelola manual.
            </p>
          </div>
          {activeAy && (
            <span className="px-3 py-1.5 rounded-full bg-emerald-light text-emerald-primary text-xs font-extrabold flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {activeAy.name}
            </span>
          )}
        </div>

        {isLoadingSpp ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Spinner size="sm" color="emerald" />
            <span className="text-xs text-slate mt-2">Memuat tahun akademik...</span>
          </div>
        ) : activeAy ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate/5 border border-slate/15">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-emerald-primary" />
                <span className="text-xs font-extrabold text-obsidian uppercase tracking-wider">Periode</span>
              </div>
              <p className="text-sm font-bold text-obsidian">{activeAy.name}</p>
              <p className="text-xs text-slate mt-1">
                {activeAy.start_date ? `${activeAy.start_date} — ${activeAy.end_date || 'berlanjut'}` : 'Periode Juli — Juni'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate/5 border border-slate/15">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-emerald-primary" />
                <span className="text-xs font-extrabold text-obsidian uppercase tracking-wider">Semester</span>
              </div>
              <div className="flex flex-col gap-1.5 text-xs font-semibold text-slate">
                <span>
                  Semester 1:{' '}
                  <b className="text-obsidian">
                    {sem1.map((m, i) => (i === 0 ? monthName(m.month) + ' ' + m.year : monthName(m.month))).join(' — ')}
                  </b>
                </span>
                <span>
                  Semester 2:{' '}
                  <b className="text-obsidian">
                    {sem2.map((m, i) => (i === 0 ? monthName(m.month) + ' ' + m.year : monthName(m.month))).join(' — ')}
                  </b>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs font-semibold text-slate italic">
            Tahun akademik aktif belum tersedia. Sistem akan membuatnya otomatis.
          </div>
        )}

        <div className="mt-4 p-3.5 rounded-xl bg-slate/5 border border-slate/15 flex items-start gap-3">
          <Info className="w-4 h-4 text-slate shrink-0 mt-0.5" />
          <p className="text-xs text-slate leading-relaxed">
            Tagihan SPP & pembayaran dicatat berdasarkan tahun akademik berjalan (mulai Juli).
            Semester 1 = Juli – Desember, Semester 2 = Januari – Juni. Periode ini disesuaikan secara otomatis oleh sistem.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;
