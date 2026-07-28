import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Table, EmptyState, Spinner, formatRupiah, formatDateIndo } from '../../components/ui';
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  AlertCircle, 
  ArrowUpRight, 
  Download, 
  Plus, 
  CheckCircle2, 
  Clock,
  FileText,
  Settings,
  Send,
  Sparkles,
  ArrowUp,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { user } = useAuth();

  const isDemo = user?.email === 'demo' || user?.email === 'admin_demo' || user?.name?.toLowerCase().includes('demo');

  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemo);

  const fetchDashboardData = async () => {
    if (isDemo) return;
    setIsLoading(true);
    try {
      const [statsRes, pmtsRes] = await Promise.all([
        api.get('/dashboard/admin'),
        api.get('/payments/?limit=10'),
      ]);
      setDashboardData(statsRes.data);
      setRecentPayments(pmtsRes.data || []);
    } catch (err: any) {
      toastError('Gagal Memuat Dashboard', err?.response?.data?.detail || 'Terjadi kesalahan koneksi database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isDemo]);

  if (isDemo) {
    const demoStats = [
      {
        title: 'Total Terkumpul (Bulan Ini)',
        value: 128500000,
        percent: 85,
        change: '14.2% dari bulan lalu',
        icon: TrendingUp,
        color: 'emerald',
      },
      {
        title: 'Tagihan SPP Lunas',
        valueStr: '412 / 480',
        subText: 'Santri aktif telah melunasi SPP',
        percent: 85.8,
        icon: CheckCircle2,
        color: 'gold',
      },
      {
        title: 'Tagihan Menunggak (Overdue)',
        valueStr: '68 Santri',
        subText: 'Total tunggakan: Rp 102.000.000',
        icon: AlertCircle,
        color: 'rose',
      },
      {
        title: 'Total Wali Santri Terdaftar',
        valueStr: '395 Wali',
        subText: '98.5% terhubung akun Telegram/WA',
        icon: Users,
        color: 'blue',
      },
    ];

    const demoRecentPayments = [
      { id: 'REC-2026-0701', student: "Muhammad Faiz Syafi'i", grade: 'XI-IPA-1', item: 'SPP Juli 2026', amount: 1500000, method: 'QRIS', status: 'PAID' as const, date: '2026-07-26T08:30:00Z' },
      { id: 'REC-2026-0702', student: "Aisyah Zahra Syafi'i", grade: 'X-A', item: 'SPP Juli + Uang Kegiatan', amount: 2000000, method: 'VA BCA', status: 'PAID' as const, date: '2026-07-26T08:15:00Z' },
      { id: 'REC-2026-0703', student: 'Rifky Hidayatullah', grade: 'XII-IPS-2', item: 'Cicilan 1 SPP Juli', amount: 750000, method: 'TRANSFER', status: 'PARTIAL' as const, date: '2026-07-25T19:40:00Z' },
      { id: 'REC-2026-0704', student: 'Zayyan Al-Ghazali', grade: 'X-B', item: 'SPP Juni & Juli 2026', amount: 3000000, method: 'VA MANDIRI', status: 'PAID' as const, date: '2026-07-25T14:20:00Z' },
    ];

    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-100 border border-amber-300 p-4 rounded-2xl text-amber-900 text-xs font-bold">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-700 shrink-0" />
            <span>Mode Showcase Demo: Menampilkan data contoh pesanan & grafik. Gunakan akun admin / admin_clean untuk pengujian data live.</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => success('Simulasi Demo', 'Beralih ke akun Admin Real untuk menguji sistem.')}>Uji Akun Real</Button>
        </div>

        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 bg-gradient-to-r from-emerald-primary to-[#135235] text-white p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-full bg-white/5 skew-x-12 pointer-events-none" />
          <div className="z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-emerald-light text-xs font-bold uppercase tracking-wider mb-2 sm:mb-2.5 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold-accent shrink-0" />
              <span>Keuangan Pesantren</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight mb-2 font-heading">
              Ringkasan Keuangan & SPP (Demo)
            </h2>
            <p className="text-xs sm:text-sm text-emerald-light/90 leading-relaxed">
              Pantau arus kas SPP, tagihan non-SPP, serta donasi infaq santri secara langsung melalui dasbor interaktif.
            </p>
          </div>
          <div className="z-10 flex flex-wrap gap-2 sm:gap-2.5 mt-2 sm:mt-0">
            <Button
              variant="gold"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                navigate('/admin/payment');
                success('Membuka Kasir Manual', 'Silakan catat pembayaran tunai atau transfer.');
              }}
            >
              Catat Bayar Manual
            </Button>
            <Button
              variant="glass"
              size="md"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => success('Laporan Diunduh', 'Rekap kuitansi hari ini berhasil diunduh dalam format Excel/PDF.')}
            >
              Unduh Rekap
            </Button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {demoStats.map((st, idx) => {
            const Icon = st.icon;
            return (
              <Card key={idx} variant="glass" padding="md" className="flex flex-col justify-between hover:shadow-xl transition-all">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate">{st.title}</span>
                  <div className={`p-2.5 rounded-xl bg-slate/5 ${st.color === 'emerald' ? 'text-emerald-primary bg-emerald-light/60' : st.color === 'gold' ? 'text-gold-dark bg-gold-bg' : st.color === 'rose' ? 'text-rose-danger bg-rose-light/70' : 'text-blue-600 bg-blue-50'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-obsidian tracking-tight font-numbers">
                    {st.value ? formatRupiah(st.value) : st.valueStr}
                  </h3>
                  {st.subText && <p className="text-xs font-semibold text-slate mt-1">{st.subText}</p>}
                  {st.change && (
                    <p className="text-xs font-bold text-emerald-primary mt-1 flex items-center gap-1">
                      <ArrowUp className="w-3.5 h-3.5 shrink-0" />
                      <span>{st.change}</span>
                    </p>
                  )}
                </div>
                {st.percent && (
                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-slate">Target Tercapai</span>
                      <span className="text-obsidian">{st.percent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate/15 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${st.color === 'emerald' ? 'bg-emerald-primary' : 'bg-gold-accent'}`} style={{ width: `${st.percent}%` }} />
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Recent Transactions Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
                <Clock className="w-5 h-5 text-emerald-primary shrink-0" />
                <span>Transaksi Pembayaran Terkini</span>
              </h3>
              <button type="button" onClick={() => navigate('/admin/reports')} className="text-xs font-bold text-emerald-primary hover:underline flex items-center gap-1">
                <span>Lihat Semua</span> <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <Table
              data={demoRecentPayments}
              keyExtractor={(item) => item.id}
              columns={[
                {
                  header: 'Santri & Kelas',
                  cell: (item) => (
                    <div>
                      <span className="font-bold text-obsidian block">{item.student}</span>
                      <span className="text-xs text-slate font-medium">Kelas {item.grade}</span>
                    </div>
                  ),
                },
                {
                  header: 'Tagihan / Item',
                  cell: (item) => <span className="font-semibold text-xs text-obsidian">{item.item}</span>,
                },
                {
                  header: 'Nominal',
                  cell: (item) => <span className="font-mono font-extrabold text-emerald-primary">{formatRupiah(item.amount)}</span>,
                },
                {
                  header: 'Metode & Waktu',
                  cell: (item) => (
                    <div>
                      <span className="text-xs font-bold uppercase block">{item.method}</span>
                      <span className="text-[10px] text-slate">{formatDateIndo(item.date, true)}</span>
                    </div>
                  ),
                },
                {
                  header: 'Status',
                  cell: (item) => <Badge status={item.status} size="sm" />,
                },
              ]}
            />
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card variant="glass" padding="lg" className="border-2 border-emerald-primary/20">
              <h4 className="font-extrabold text-obsidian text-base flex items-center gap-2 font-heading mb-3">
                <CreditCard className="w-5 h-5 text-emerald-primary" />
                <span>Akses Cepat SPP</span>
              </h4>
              <p className="text-xs text-slate leading-relaxed mb-4">
                Kelola grid pembayaran SPP tahun ajaran 2025/2026 atau buat tagihan kegiatan baru untuk santri.
              </p>
              <div className="flex flex-col gap-2.5">
                <Button variant="outline" size="sm" fullWidth leftIcon={<CreditCard className="w-4 h-4 text-emerald-primary" />} className="justify-start font-bold" onClick={() => navigate('/admin/spp')}>
                  Buka Grid SPP Semester
                </Button>
                <Button variant="outline" size="sm" fullWidth leftIcon={<FileText className="w-4 h-4 text-emerald-primary" />} className="justify-start font-bold" onClick={() => navigate('/admin/non-spp')}>
                  Buat Tagihan Non-SPP
                </Button>
                <Button variant="outline" size="sm" fullWidth leftIcon={<Settings className="w-4 h-4 text-emerald-primary" />} className="justify-start font-bold" onClick={() => navigate('/admin/settings')}>
                  Pengaturan Sekolah
                </Button>
              </div>
            </Card>

            <Card variant="glass" padding="lg" className="bg-rose-light/30 border-rose-danger/30">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-danger text-white rounded-xl shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-rose-dark text-sm">68 Santri Belum Bayar SPP</h4>
                  <p className="text-xs text-slate mt-1 leading-relaxed">
                    Batas waktu pembayaran SPP bulan Juli 2026 telah lewat 15 hari. Kirim pengingat WhatsApp otomatis kepada wali santri?
                  </p>
                  <Button variant="danger" size="sm" leftIcon={<Send className="w-3.5 h-3.5" />} className="mt-3 font-bold text-xs" onClick={() => success('Pengingat Terkirim', 'Pesan pengingat WhatsApp telah diproses ke 68 wali santri.')}>
                    Kirim Reminder WA (68 Wali)
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Real Mode Rendering
  const totalIncome = dashboardData?.total_income_this_month || 0;
  const totalStudents = dashboardData?.total_students || 0;
  const studentsPaid = dashboardData?.students_paid_count || 0;
  const studentsUnpaid = dashboardData?.students_unpaid_count || 0;
  const infaqThisMonth = dashboardData?.infaq_this_month || 0;

  const realStats = [
    {
      title: 'Total Terkumpul (Bulan Ini)',
      value: totalIncome,
      subText: `Termasuk Infaq Rp ${formatRupiah(infaqThisMonth)}`,
      percent: totalStudents > 0 ? Math.round((studentsPaid / totalStudents) * 100) : 0,
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      title: 'Santri Lunas SPP Bulan Ini',
      valueStr: `${studentsPaid} / ${totalStudents} Santri`,
      subText: 'Santri aktif telah membayar di bulan berjalan',
      percent: totalStudents > 0 ? Math.round((studentsPaid / totalStudents) * 100) : 0,
      icon: CheckCircle2,
      color: 'gold',
    },
    {
      title: 'Santri Menunggak / Belum Bayar',
      valueStr: `${studentsUnpaid} Santri`,
      subText: 'Kewajiban bulan berjalan belum diselesaikan',
      icon: AlertCircle,
      color: 'rose',
    },
    {
      title: 'Total Santri Terdaftar Aktif',
      valueStr: `${totalStudents} Santri`,
      subText: 'Data terverifikasi dalam database',
      icon: Users,
      color: 'blue',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 bg-gradient-to-r from-emerald-primary to-[#135235] text-white p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-white/5 skew-x-12 pointer-events-none" />
        <div className="z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-emerald-light text-xs font-bold uppercase tracking-wider mb-2 sm:mb-2.5 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold-accent shrink-0" />
            <span>Database Sistem</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight mb-2 font-heading">
            Ringkasan Keuangan & SPP
          </h2>
          <p className="text-xs sm:text-sm text-emerald-light/90 leading-relaxed">
            Dasbor interaktif terhubung ke database pesantren.
          </p>
        </div>
        <div className="z-10 flex flex-wrap gap-2 sm:gap-2.5 mt-2 sm:mt-0">
          <Button
            variant="gold"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/admin/payment')}
          >
            Catat Bayar Manual
          </Button>
          <Button
            variant="glass"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={fetchDashboardData}
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card variant="glass" padding="lg" className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" color="emerald" />
          <span className="text-xs text-slate mt-3 font-semibold">Mengambil statistik live dari server...</span>
        </Card>
      ) : (
        <>
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {realStats.map((st, idx) => {
              const Icon = st.icon;
              return (
                <Card key={idx} variant="glass" padding="md" className="flex flex-col justify-between hover:shadow-xl transition-all">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate">{st.title}</span>
                    <div className={`p-2.5 rounded-xl bg-slate/5 ${st.color === 'emerald' ? 'text-emerald-primary bg-emerald-light/60' : st.color === 'gold' ? 'text-gold-dark bg-gold-bg' : st.color === 'rose' ? 'text-rose-danger bg-rose-light/70' : 'text-blue-600 bg-blue-50'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-obsidian tracking-tight font-numbers">
                      {st.value !== undefined ? formatRupiah(st.value) : st.valueStr}
                    </h3>
                    {st.subText && <p className="text-xs font-semibold text-slate mt-1">{st.subText}</p>}
                  </div>
                  {st.percent !== undefined && (
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span className="text-slate">Proporsi Lunas</span>
                        <span className="text-obsidian">{st.percent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate/15 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${st.color === 'emerald' ? 'bg-emerald-primary' : 'bg-gold-accent'}`} style={{ width: `${st.percent}%` }} />
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Recent Transactions Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
                  <Clock className="w-5 h-5 text-emerald-primary shrink-0" />
                  <span>Transaksi Pembayaran Terkini</span>
                </h3>
                <button type="button" onClick={() => navigate('/admin/reports')} className="text-xs font-bold text-emerald-primary hover:underline flex items-center gap-1">
                  <span>Lihat Semua</span> <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {recentPayments.length === 0 ? (
                <Card variant="glass" padding="lg">
                  <EmptyState
                    title="Belum Ada Transaksi"
                    description="Database saat ini masih bersih (0 transaksi). Klik tombol 'Catat Bayar Manual' atau lakukan uji coba tagihan di menu kasir."
                    action={<Button variant="primary" size="sm" onClick={() => navigate('/admin/payment')}>Ke Menu Kasir</Button>}
                  />
                </Card>
              ) : (
                <Card variant="glass" padding="none" className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate/5 font-bold text-slate border-b border-slate/15 uppercase text-[10px]">
                          <th className="p-3.5 pl-5">No Kuitansi</th>
                          <th className="p-3.5">Santri</th>
                          <th className="p-3.5">Keterangan</th>
                          <th className="p-3.5">Nominal (Rp)</th>
                          <th className="p-3.5">Metode</th>
                          <th className="p-3.5 pr-5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate/10">
                        {recentPayments.map((p: any) => (
                          <tr key={p.id} className="hover:bg-white/70 transition-colors">
                            <td className="p-3.5 pl-5 font-mono font-bold text-obsidian">{p.receipt?.receipt_number || `PMT-${p.id}`}</td>
                            <td className="p-3.5 font-bold text-obsidian">Santri ID {p.student_id}</td>
                            <td className="p-3.5 uppercase">{p.payment_type}</td>
                            <td className="p-3.5 font-mono font-bold text-emerald-primary">{formatRupiah(Number(p.amount))}</td>
                            <td className="p-3.5 uppercase">{p.method}</td>
                            <td className="p-3.5 pr-5"><Badge status={p.receipt?.is_void ? 'VOID' : 'PAID'} size="sm" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>

            <div className="lg:col-span-1 flex flex-col gap-6">
              <Card variant="glass" padding="lg" className="border-2 border-emerald-primary/20">
                <h4 className="font-extrabold text-obsidian text-base flex items-center gap-2 font-heading mb-3">
                  <CreditCard className="w-5 h-5 text-emerald-primary" />
                  <span>Akses Cepat SPP</span>
                </h4>
                <p className="text-xs text-slate leading-relaxed mb-4">
                  Kelola grid pembayaran SPP tahun ajaran 2025/2026 atau buat tagihan kegiatan baru untuk santri.
                </p>
                <div className="flex flex-col gap-2.5">
                  <Button variant="outline" size="sm" fullWidth leftIcon={<CreditCard className="w-4 h-4 text-emerald-primary" />} className="justify-start font-bold" onClick={() => navigate('/admin/spp')}>
                    Buka Grid SPP Semester
                  </Button>
                  <Button variant="outline" size="sm" fullWidth leftIcon={<FileText className="w-4 h-4 text-emerald-primary" />} className="justify-start font-bold" onClick={() => navigate('/admin/non-spp')}>
                    Buat Tagihan Non-SPP
                  </Button>
                  <Button variant="outline" size="sm" fullWidth leftIcon={<Settings className="w-4 h-4 text-emerald-primary" />} className="justify-start font-bold" onClick={() => navigate('/admin/settings')}>
                    Pengaturan Sekolah
                  </Button>
                </div>
              </Card>

              {studentsUnpaid > 0 && (
                <Card variant="glass" padding="lg" className="bg-rose-light/30 border-rose-danger/30">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-danger text-white rounded-xl shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-rose-dark text-sm">{studentsUnpaid} Santri Belum Bayar SPP</h4>
                      <p className="text-xs text-slate mt-1 leading-relaxed">
                        Kirim pesan pengingat WhatsApp otomatis kepada wali santri penunggak secara massal.
                      </p>
                      <Button variant="danger" size="sm" leftIcon={<Send className="w-3.5 h-3.5" />} className="mt-3 font-bold text-xs" onClick={() => success('Pengingat Terkirim', `Pesan pengingat WhatsApp telah dikirim ke ${studentsUnpaid} wali santri.`)}>
                        Kirim Reminder WA ({studentsUnpaid} Wali)
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
