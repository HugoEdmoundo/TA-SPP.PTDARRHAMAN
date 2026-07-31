import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, EmptyState, Spinner, Modal, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../../components/ui';
import { useToast } from '../../components/ui/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { CreditCard, Plus, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const SppGridPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [gridData, setGridData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [year, setYear] = useState<number>(2026);
  const [semester, setSemester] = useState<number>(1);
  const [showMassModal, setShowMassModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGrid = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/spp/grid?year=${year}&semester=${semester}`);
      setGridData(res.data || []);
    } catch (err: any) {
      toastError('Gagal Memuat Grid SPP', err?.response?.data?.detail || 'Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGrid();
  }, [year, semester]);

  const months = semester === 1 
    ? [{ num: 7, name: 'Juli' }, { num: 8, name: 'Agustus' }, { num: 9, name: 'September' }, { num: 10, name: 'Oktober' }, { num: 11, name: 'November' }, { num: 12, name: 'Desember' }]
    : [{ num: 1, name: 'Januari' }, { num: 2, name: 'Februari' }, { num: 3, name: 'Maret' }, { num: 4, name: 'April' }, { num: 5, name: 'Mei' }, { num: 6, name: 'Juni' }];

  const handleGenerateMass = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowMassModal(false);
      success('Tagihan SPP Diaktifkan', `Tagihan SPP semester ${semester} tahun ${year} aktif secara virtual untuk seluruh santri.`);
      fetchGrid();
    }, 600);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate/10 pb-4 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
              <span>Daftar Tagihan SPP Bulanan</span>
            </h2>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <p className="text-xs text-slate mt-1">Pantau status pembayaran bulanan seluruh santri secara mudah dan cepat per kelas atau semester.</p>
          </div>
          <div className="flex gap-2 items-center shrink-0">
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchGrid}>
              Refresh Grid
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowMassModal(true)}>
              Buat Tagihan Massal
            </Button>
          </div>
        </div>

        {/* Filters Year & Semester */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-obsidian">Tahun SPP:</span>
            <Select
              value={year != null ? String(year) : undefined}
              onValueChange={(v) => setYear(Number(v))}
            >
              <SelectTrigger className="font-semibold text-xs">
                <SelectValue placeholder="Pilih tahun..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setSemester(1)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${semester === 1 ? 'bg-emerald-primary text-white shadow-md' : 'bg-slate/5 text-slate hover:bg-slate/10'}`}
            >
              Semester 1 (Juli - Desember)
            </button>
            <button
              onClick={() => setSemester(2)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${semester === 2 ? 'bg-emerald-primary text-white shadow-md' : 'bg-slate/5 text-slate hover:bg-slate/10'}`}
            >
              Semester 2 (Januari - Juni)
            </button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card variant="glass" padding="lg" className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" color="emerald" />
          <span className="text-xs text-slate mt-3 font-semibold">Memuat data tagihan SPP santri...</span>
        </Card>
      ) : gridData.length === 0 ? (
        <Card variant="glass" padding="lg">
          <EmptyState
            title="Data SPP Kosong"
            description="Belum ada data santri aktif untuk ditampilkan dalam grid SPP ini. Silakan daftarkan santri terlebih dahulu di menu Data Siswa."

          />
        </Card>
      ) : (
        <Card variant="glass" padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate/10 font-bold text-slate border-b border-slate/20 uppercase text-[10px] tracking-wider">
                  <th className="p-3 pl-5 min-w-[180px]">Santri / NIS</th>
                  <th className="p-3">Kelas / Tahun</th>
                  {months.map((m) => (
                    <th key={m.num} className="p-3 text-center min-w-[100px]">{m.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate/10">
                {gridData.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-white/70 transition-colors">
                    <td className="p-3 pl-5 font-bold text-obsidian">
                      <div>{row.student_name || row.full_name || 'Santri'}</div>
                      <span className="text-[10px] font-mono text-slate font-normal">NIS: {row.nis}</span>
                    </td>
                    <td className="p-3 font-semibold text-slate">{row.academic_year || '2025/2026'}</td>
                    {months.map((m) => {
                      const monthData = row.months ? row.months[String(m.num)] || row.months[m.num] : null;
                      const status = monthData?.status || 'UNPAID';
                      const isPaid = status === 'paid' || status === 'PAID' || status === 'lunas' || status === 'LUNAS';
                      
                      return (
                        <td key={m.num} className="p-3 text-center">
                          {isPaid ? (
                            <span className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-emerald-light/60 text-emerald-primary font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3" /> LUNAS
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200/50">
                              <AlertCircle className="w-3 h-3" /> BELUM
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal Mass Generate */}
      <Modal
        isOpen={showMassModal}
        onClose={() => setShowMassModal(false)}
        title={
          <>
            <Plus className="w-5 h-5 text-emerald-primary" />
            <span>Aktivasi Tagihan SPP Massal</span>
          </>
        }
        maxWidth="md"
      >
            <p className="text-xs text-slate mb-4">
              Tagihan bulanan otomatis berlaku untuk seluruh santri aktif sesuai nominal standar pesantren.
            </p>
            
            <div className="p-3.5 rounded-2xl bg-emerald-light/30 border border-emerald-primary/20 text-xs text-obsidian font-semibold mb-4">
              ✨ Konfirmasi aktivasi notifikasi tagihan SPP untuk Semester {semester} Tahun {year}.
            </div>

            <div className="flex justify-end gap-2.5 mt-2 pt-3 border-t border-slate/15">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowMassModal(false)}>Batal</Button>
              <Button type="button" variant="primary" size="sm" isLoading={isSubmitting} onClick={handleGenerateMass}>
                Aktifkan Sekarang
              </Button>
            </div>
      </Modal>
    </div>
  );
};

export default SppGridPage;
