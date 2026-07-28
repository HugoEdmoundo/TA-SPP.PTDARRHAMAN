import React, { useState, useEffect } from 'react';
import { Card, Button, EmptyState, Spinner, formatRupiah } from '../../components/ui';
import { useToast } from '../../components/ui/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { FileBarChart, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const isDemo = user?.email === 'demo' || user?.email === 'admin_demo' || user?.name?.toLowerCase().includes('demo');

  const [reportType, setReportType] = useState<'monthly' | 'spp-semester' | 'infaq' | 'events'>('monthly');
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(!isDemo);

  // Filters
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(2026);
  const [semester, setSemester] = useState<number>(1);

  const fetchReport = async () => {
    if (isDemo) return;
    setIsLoading(true);
    try {
      let url = '';
      if (reportType === 'monthly') {
        url = `/reports/monthly?month=${month}&year=${year}&format=json`;
      } else if (reportType === 'spp-semester') {
        url = `/reports/spp-semester?year=${year}&semester=${semester}&format=json`;
      } else if (reportType === 'infaq') {
        url = `/reports/infaq?year=${year}&format=json`;
      } else if (reportType === 'events') {
        url = `/reports/events?format=json`;
      }

      const res = await api.get(url);
      setReportData(res.data);
    } catch (err: any) {
      toastError('Gagal Memuat Laporan', err?.response?.data?.detail || 'Terjadi kesalahan koneksi.');
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, month, year, semester, isDemo]);

  const handleDownload = async (format: 'excel' | 'pdf') => {
    try {
      let url = `/reports/${reportType}?format=${format}`;
      if (reportType === 'monthly') url += `&month=${month}&year=${year}`;
      if (reportType === 'spp-semester') url += `&year=${year}&semester=${semester}`;
      if (reportType === 'infaq') url += `&year=${year}`;

      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Laporan_${reportType.toUpperCase()}_${year}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      success('Unduh Laporan Selesai', `File laporan dengan format .${format.toUpperCase()} berhasil diunduh ke komputer Anda.`);
    } catch (err: any) {
      toastError('Gagal Mengunduh File', 'Terjadi kesalahan saat memproses ekspor dokumen.');
    }
  };

  const monthsList = [
    { num: 1, name: 'Januari' }, { num: 2, name: 'Februari' }, { num: 3, name: 'Maret' },
    { num: 4, name: 'April' }, { num: 5, name: 'Mei' }, { num: 6, name: 'Juni' },
    { num: 7, name: 'Juli' }, { num: 8, name: 'Agustus' }, { num: 9, name: 'September' },
    { num: 10, name: 'Oktober' }, { num: 11, name: 'November' }, { num: 12, name: 'Desember' }
  ];

  if (isDemo) {
    return (
      <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 border-b border-slate/10 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
              <FileBarChart className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
              <span>Laporan Keuangan & Ekspor Resmi</span>
            </h2>
            <p className="text-xs text-slate mt-1">Rekapitulasi kas masuk, tunggakan SPP, donasi, dan ekspor dokumen Excel (.xlsx) serta PDF .</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-primary" />} onClick={() => success('Simulasi Ekspor Excel', 'Dalam sistem, sistem mensimulasikan pengunduhan file Laporan_Bulanan_Juli_2026.xlsx.')}>Unduh Excel (.XLSX)</Button>
            <Button variant="primary" size="sm" leftIcon={<FileText className="w-4 h-4" />} onClick={() => success('Simulasi Ekspor PDF', 'Dalam sistem, sistem mensimulasikan cetak dokumen Laporan_Bulanan_Juli_2026.pdf.')}>Unduh PDF (.PDF)</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card variant="elevated" padding="sm" className="p-4 bg-emerald-light/30 border border-emerald-primary/20">
            <span className="text-xs text-slate font-semibold block">Total Penerimaan Juli</span>
            <span className="text-lg font-mono font-bold text-obsidian block mt-1">Rp 64.750.000</span>
            <span className="text-[10px] text-emerald-primary font-bold mt-1 inline-block">SPP + Non-SPP + Infaq</span>
          </Card>
          <Card variant="elevated" padding="sm" className="p-4 bg-slate/5 border border-slate/15">
            <span className="text-xs text-slate font-semibold block">Koleksi SPP Semester 1</span>
            <span className="text-lg font-mono font-bold text-obsidian block mt-1">Rp 1.250.000.000</span>
            <span className="text-[10px] text-slate font-medium mt-1 inline-block">Target: Rp 1.440.000.000 (86%)</span>
          </Card>
          <Card variant="elevated" padding="sm" className="p-4 bg-slate/5 border border-slate/15">
            <span className="text-xs text-slate font-semibold block">Donasi Infaq & Sedekah</span>
            <span className="text-lg font-mono font-bold text-emerald-primary block mt-1">Rp 45.500.000</span>
            <span className="text-[10px] text-slate font-medium mt-1 inline-block">142 Transaksi Sukarela</span>
          </Card>
          <Card variant="elevated" padding="sm" className="p-4 bg-slate/5 border border-slate/15">
            <span className="text-xs text-slate font-semibold block">Tunggakan Aktif</span>
            <span className="text-lg font-mono font-bold text-rose-danger block mt-1">Rp 190.000.000</span>
            <span className="text-[10px] text-rose-danger font-medium mt-1 inline-block">14% Santri Menunggak</span>
          </Card>
        </div>

        <div className="overflow-x-auto border border-slate/20 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate/5 font-bold text-slate border-b border-slate/20">
                <th className="p-3">No</th>
                <th className="p-3">Tanggal / Kuitansi</th>
                <th className="p-3">Santri Pembayar</th>
                <th className="p-3">Keterangan Item</th>
                <th className="p-3">Metode</th>
                <th className="p-3 text-right">Total (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate/10">
              <tr>
                <td className="p-3 font-mono">1</td>
                <td className="p-3 font-mono">26-07-2026 <span className="block font-bold text-obsidian">REC-001</span></td>
                <td className="p-3 font-bold text-obsidian">Muhammad Faiz Syafi'i</td>
                <td className="p-3">SPP Bulan Juli 2026</td>
                <td className="p-3">TRANSFER (XENDIT)</td>
                <td className="p-3 font-mono font-bold text-right text-emerald-primary">500.000</td>
              </tr>
              <tr>
                <td className="p-3 font-mono">2</td>
                <td className="p-3 font-mono">26-07-2026 <span className="block font-bold text-obsidian">REC-002</span></td>
                <td className="p-3 font-bold text-obsidian">Aisyah Zahra Syafi'i</td>
                <td className="p-3">Seragam Batik & Olahraga</td>
                <td className="p-3">CASH (LOKET)</td>
                <td className="p-3 font-mono font-bold text-right text-emerald-primary">800.000</td>
              </tr>
            </tbody>
          </table>
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
              <FileBarChart className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
              <span>Laporan Keuangan & Ekspor Resmi</span>
            </h2>
            <p className="text-xs text-slate mt-1">Pilih jenis laporan dan unduh dokumen rekapitulasi secara akurat dalam format Excel (.xlsx) atau PDF.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-primary" />}
              onClick={() => handleDownload('excel')}
              disabled={!reportData || !reportData.data || reportData.data.length === 0}
            >
              Unduh Excel (.XLSX)
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FileText className="w-4 h-4" />}
              onClick={() => handleDownload('pdf')}
              disabled={!reportData || !reportData.data || reportData.data.length === 0}
            >
              Unduh PDF (.PDF)
            </Button>
          </div>
        </div>

        {/* Report Tabs */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'monthly', label: 'Kas Masuk Bulanan' },
              { id: 'spp-semester', label: 'Matriks SPP Semester' },
              { id: 'infaq', label: 'Rekap Infaq & Donasi' },
              { id: 'events', label: 'Progres Event Patungan' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${reportType === tab.id ? 'bg-emerald-primary text-white shadow-md' : 'bg-slate/5 text-slate hover:bg-slate/10'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dynamic Filter Controls */}
          <div className="flex items-center gap-2">
            {reportType === 'monthly' && (
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="p-2 rounded-xl border border-slate/20 bg-white font-semibold text-xs focus:outline-none"
              >
                {monthsList.map(m => (
                  <option key={m.num} value={m.num}>{m.name}</option>
                ))}
              </select>
            )}

            {reportType === 'spp-semester' && (
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="p-2 rounded-xl border border-slate/20 bg-white font-semibold text-xs focus:outline-none"
              >
                <option value={1}>Semester 1 (Jul-Des)</option>
                <option value={2}>Semester 2 (Jan-Jun)</option>
              </select>
            )}

            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="p-2 rounded-xl border border-slate/20 bg-white font-mono text-xs focus:outline-none"
            >
              <option value={2026}>Tahun 2026</option>
              <option value={2025}>Tahun 2025</option>
            </select>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card variant="glass" padding="lg" className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" color="emerald" />
          <span className="text-xs text-slate mt-3 font-semibold">Mengkalkulasi laporan dari database...</span>
        </Card>
      ) : !reportData || !reportData.data || reportData.data.length === 0 ? (
        <Card variant="glass" padding="lg">
          <EmptyState
            title="Data Laporan Kosong"
            description="Belum ada transaksi pembayaran atau aktivitas keuangan pada periode yang dipilih (0 record)."
            action={<Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchReport}>Coba Muat Ulang</Button>}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Summary Box */}
          {reportData.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Object.entries(reportData.summary).map(([key, val]: [string, any], idx: number) => {
                const isCurrency = typeof val === 'number' && (key.toLowerCase().includes('rp') || key.toLowerCase().includes('total') || key.toLowerCase().includes('penerimaan'));
                return (
                  <Card key={idx} variant="elevated" padding="sm" className="p-3.5 bg-white/90 border border-slate/15">
                    <span className="text-[11px] text-slate font-medium block truncate" title={key}>{key}</span>
                    <span className="text-sm sm:text-base font-extrabold text-obsidian font-mono block mt-0.5 truncate">
                      {isCurrency ? formatRupiah(val) : String(val)}
                    </span>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Data Table */}
          <Card variant="glass" padding="none" className="overflow-hidden">
            <div className="p-4 bg-slate/5 border-b border-slate/15 flex justify-between items-center text-xs font-bold text-obsidian">
              <span>{reportData.title || 'Rekapitulasi Laporan'}</span>
              <span className="text-slate font-normal">{reportData.subtitle}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate/10 font-bold text-slate border-b border-slate/20 uppercase text-[10px]">
                    {Object.keys(reportData.data[0] || {}).map((header, idx) => (
                      <th key={idx} className={`p-3 ${idx === 0 ? 'pl-5' : ''}`}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate/10">
                  {reportData.data.map((row: any, rIdx: number) => (
                    <tr key={rIdx} className="hover:bg-white/70 transition-colors">
                      {Object.values(row).map((val: any, cIdx: number) => {
                        const isNum = typeof val === 'number' && val > 1000;
                        return (
                          <td key={cIdx} className={`p-3 ${cIdx === 0 ? 'pl-5 font-mono' : ''} ${isNum ? 'font-mono font-bold text-emerald-primary' : ''}`}>
                            {isNum ? formatRupiah(val) : String(val ?? '-')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
