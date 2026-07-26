import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './components/ui/ToastContext';
import { WaliLayout, AdminLayout } from './components/layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { WaliDashboardPage } from './pages/wali/WaliDashboardPage';
import { Card, Button, Badge, EmptyState, formatRupiah } from './components/ui';
import { 
  CreditCard, 
  FileText, 
  Calendar, 
  Wallet, 
  BarChart3, 
  ShieldAlert, 
  Users, 
  UserCheck, 
  Plus, 
  Download, 
  FileSpreadsheet, 
  Link2 
} from 'lucide-react';

// --- Placeholder / Demo Components for Admin Navigation (Using clean Lucide icons, no inline emojis) ---
// --- Placeholder / Demo Components for Admin Navigation (Using clean Lucide icons, no inline emojis) ---
const SppGridDemo = () => (
  <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 border-b border-slate/10 pb-4">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
          <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
          <span>Grid Tagihan SPP (Tahun Ajaran 2025/2026)</span>
        </h2>
        <p className="text-xs text-slate mt-1">Pantau status lunas/menunggak santri secara matriks per semester (Fase 3: B-12 & F-09).</p>
      </div>
      <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} className="shrink-0 w-full sm:w-auto justify-center">Buat Tagihan SPP Massal</Button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 text-center">
      <div className="p-3.5 sm:p-4 bg-emerald-light/50 rounded-2xl border border-emerald-primary/20"><span className="text-xs text-slate font-bold block">Juli 2026</span><Badge status="PAID" className="mt-1 font-bold text-xs">85% Lunas</Badge></div>
      <div className="p-3.5 sm:p-4 bg-amber-50 rounded-2xl border border-amber-200"><span className="text-xs text-slate font-bold block">Agustus 2026</span><Badge status="UNPAID" className="mt-1 font-bold text-xs">Tagihan Aktif</Badge></div>
      <div className="p-3.5 sm:p-4 bg-slate/5 rounded-2xl border border-slate/15"><span className="text-xs text-slate font-bold block">September 2026</span><Badge status="PENDING" className="mt-1 font-bold text-xs">Terjadwal</Badge></div>
      <div className="p-3.5 sm:p-4 bg-slate/5 rounded-2xl border border-slate/15"><span className="text-xs text-slate font-bold block">Oktober 2026</span><Badge status="PENDING" className="mt-1 font-bold text-xs">Terjadwal</Badge></div>
    </div>
    <EmptyState title="Matriks Semester Santri" description="Daftar lengkap 480 santri beserta status kolom per bulan akan ditampilkan di sini saat data API dihubungkan." />
  </Card>
);

const NonSppDemo = () => (
  <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 border-b border-slate/10 pb-4">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
          <span>Manajemen Tagihan Non-SPP</span>
        </h2>
        <p className="text-xs text-slate mt-1">Kelola tagihan buku, seragam, ujian, dan kegiatan khusus santri (Fase 3: B-13 & F-10).</p>
      </div>
      <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} className="shrink-0 w-full sm:w-auto justify-center">Tambah Tagihan Non-SPP</Button>
    </div>
    <EmptyState title="Belum Ada Tagihan Non-SPP Tambahan" description="Klik tombol tambah di atas untuk membuat tagihan baru (misal: Uang Pangkal atau Seragam Santri Baru)." />
  </Card>
);

const EventDemo = () => (
  <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 border-b border-slate/10 pb-4">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
          <span>Event, Patungan & Donasi Infaq</span>
        </h2>
        <p className="text-xs text-slate mt-1">Pantau target dana terkumpul dan riwayat donasi dari wali santri (Fase 3: B-14 & F-11).</p>
      </div>
      <Button variant="gold" size="sm" leftIcon={<Plus className="w-4 h-4" />} className="shrink-0 w-full sm:w-auto justify-center">Buat Event / Infaq Baru</Button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
      <Card variant="elevated" padding="sm" className="p-4 sm:p-5 border-l-4 border-l-emerald-primary">
        <h4 className="font-bold text-obsidian text-sm sm:text-base">Qurban Idul Adha 1447 H</h4>
        <p className="text-xs text-slate mt-1">Terkumpul: <span className="font-mono font-bold text-emerald-primary">{formatRupiah(45000000)}</span> dari target Rp 50.000.000 (90%)</p>
      </Card>
      <Card variant="elevated" padding="sm" className="p-4 sm:p-5 border-l-4 border-l-gold-accent">
        <h4 className="font-bold text-obsidian text-sm sm:text-base">Renovasi Masjid Pesantren</h4>
        <p className="text-xs text-slate mt-1">Terkumpul: <span className="font-mono font-bold text-gold-dark">{formatRupiah(82000000)}</span> dari target Rp 150.000.000 (54%)</p>
      </Card>
    </div>
  </Card>
);

const PaymentKasirDemo = () => (
  <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 border-b border-slate/10 pb-4">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
          <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
          <span>Kasir Manual & Verifikasi Pembayaran</span>
        </h2>
        <p className="text-xs text-slate mt-1">Catat pembayaran tunai (cash) atau verifikasi bukti transfer bank manual dari wali santri (Fase 4: B-19 & F-13).</p>
      </div>
      <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} className="shrink-0 w-full sm:w-auto justify-center">Catat Pembayaran Tunai</Button>
    </div>
    <EmptyState title="Semua Pembayaran Telah Terverifikasi" description="Antrean verifikasi transfer bank kosong. Kasir siap mencatat transaksi baru." />
  </Card>
);

const ReportsDemo = () => (
  <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 border-b border-slate/10 pb-4">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
          <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
          <span>Laporan Keuangan & Rekap Kuitansi</span>
        </h2>
        <p className="text-xs text-slate mt-1">Unduh laporan kas masuk/keluar harian, bulanan, dan semester dalam format Excel / PDF (Fase 5: B-24 & F-18).</p>
      </div>
      <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} className="shrink-0 w-full sm:w-auto justify-center">Unduh Laporan Excel</Button>
    </div>
    <div className="p-5 sm:p-6 bg-slate/5 rounded-2xl text-center">
      <h3 className="text-sm sm:text-base font-bold text-obsidian">Total Penerimaan Juli 2026: {formatRupiah(128500000)}</h3>
      <p className="text-xs text-slate mt-1">Dari 412 transaksi SPP dan 35 donasi infaq terverifikasi.</p>
    </div>
  </Card>
);

const AuditLogDemo = () => (
  <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
    <div className="flex items-center justify-between mb-5 sm:mb-6 border-b border-slate/10 pb-4">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
          <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
          <span>Audit Trail & Riwayat Aktivitas</span>
        </h2>
        <p className="text-xs text-slate mt-1">Catatan keamanan tak terhapuskan atas semua perubahan tarif, pembatalan (void) kuitansi, dan login sistem (Fase 5: B-25 & F-19).</p>
      </div>
    </div>
    <div className="flex flex-col gap-2 font-mono text-[11px] sm:text-xs">
      <div className="p-3 bg-white rounded-xl border border-slate/10 flex flex-col sm:flex-row sm:justify-between gap-1"><span className="text-emerald-primary font-bold">[2026-07-26 09:15:00] Admin Ahmad</span><span className="text-slate/80">Login sukses dari IP 192.168.1.10</span></div>
      <div className="p-3 bg-white rounded-xl border border-slate/10 flex flex-col sm:flex-row sm:justify-between gap-1"><span className="text-blue-600 font-bold">[2026-07-26 08:30:12] System Gateway</span><span className="text-slate/80">Verifikasi otomatis QRIS INV-2026-0701 (Rp 1.500.000)</span></div>
      <div className="p-3 bg-white rounded-xl border border-slate/10 flex flex-col sm:flex-row sm:justify-between gap-1"><span className="text-amber-600 font-bold">[2026-07-25 16:20:00] Superadmin</span><span className="text-slate/80">Memperbarui konfigurasi logo sekolah & nomor telepon</span></div>
    </div>
  </Card>
);

const StudentsDemo = () => (
  <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 border-b border-slate/10 pb-4">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
          <span>Manajemen Data Siswa (Santri)</span>
        </h2>
        <p className="text-xs text-slate mt-1">Daftar santri aktif, kenaikan kelas, dan impor data cepat via file Excel / CSV (Fase 2: B-08, B-09 & F-07).</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
        <Button variant="outline" size="sm" leftIcon={<FileSpreadsheet className="w-4 h-4" />} className="w-full sm:w-auto justify-center">Impor Excel / CSV</Button>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} className="w-full sm:w-auto justify-center">Tambah Santri</Button>
      </div>
    </div>
    <EmptyState title="480 Santri Aktif Terdaftar" description="Gunakan kotak pencarian (Ctrl+K) atau tombol impor di atas untuk memperbarui data kelas santri." />
  </Card>
);

const ParentsDemo = () => (
  <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 border-b border-slate/10 pb-4">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
          <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
          <span>Manajemen Akun Wali Santri</span>
        </h2>
        <p className="text-xs text-slate mt-1">Kelola pertautan (linking) data wali santri dengan satu atau banyak anak sekaligus (Fase 2: B-10 & F-08).</p>
      </div>
      <Button variant="primary" size="sm" leftIcon={<Link2 className="w-4 h-4" />} className="shrink-0 w-full sm:w-auto justify-center">Tautkan Akun Wali</Button>
    </div>
    <EmptyState title="395 Wali Santri Terhubung" description="Akun wali otomatis terhubung dengan nomor WhatsApp untuk pengiriman kuitansi digital instant." />
  </Card>
);

export function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Default redirect to login or admin */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="spp" element={<SppGridDemo />} />
                <Route path="non-spp" element={<NonSppDemo />} />
                <Route path="event" element={<EventDemo />} />
                <Route path="payment" element={<PaymentKasirDemo />} />
                <Route path="reports" element={<ReportsDemo />} />
                <Route path="audit" element={<AuditLogDemo />} />
                <Route path="students" element={<StudentsDemo />} />
                <Route path="parents" element={<ParentsDemo />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Wali Santri Protected Routes */}
              <Route
                path="/wali"
                element={
                  <ProtectedRoute allowedRoles={['WALI']}>
                    <WaliLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<WaliDashboardPage />} />
                <Route path="spp" element={<WaliDashboardPage />} />
                <Route path="event" element={<WaliDashboardPage />} />
                <Route path="history" element={<WaliDashboardPage />} />
                <Route path="profile" element={<WaliDashboardPage />} />
              </Route>

              {/* Fallback wildcard route */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
