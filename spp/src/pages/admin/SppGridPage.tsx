import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, EmptyState, Spinner, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../../components/ui';
import { useToast } from '../../components/ui/ToastContext';
import { api } from '../../api/client';
import { CreditCard, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import type { AcademicYear } from '../../types';
import { academicYearMonths, monthName } from '../../utils/academicYear';

export const SppGridPage: React.FC = () => {
  const { error: toastError } = useToast();

  const [gridData, setGridData] = useState<any[]>([]);
  const [academicYearsList, setAcademicYearsList] = useState<AcademicYear[]>([]);
  const [academicYearId, setAcademicYearId] = useState<number | undefined>(undefined);
  const [semester, setSemester] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api
      .get('/settings/academic-years')
      .then((res) => {
        const list: AcademicYear[] = res.data || [];
        setAcademicYearsList(list);
        const active = list.find((a) => a.is_active);
        const current = list.find((a) => a.id === academicYearId);
        if (!current) {
          setAcademicYearId(active?.id || list[0]?.id);
        }
      })
      .catch(() => {});
  }, []);

  const selectedAy = useMemo(
    () => academicYearsList.find((a) => a.id === academicYearId) || null,
    [academicYearsList, academicYearId]
  );

  const months = useMemo(
    () => (selectedAy ? academicYearMonths(selectedAy, semester) : []),
    [selectedAy, semester]
  );

  const fetchGrid = async () => {
    if (!academicYearId) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/spp/grid?academic_year_id=${academicYearId}&semester=${semester}`);
      setGridData(res.data || []);
    } catch (err: any) {
      toastError('Gagal Memuat Grid SPP', err?.response?.data?.detail || 'Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (academicYearId !== undefined) {
      fetchGrid();
    }
  }, [academicYearId, semester]);

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
            <p className="text-xs text-slate mt-1">Pantau status pembayaran bulanan seluruh santri secara mudah dan cepat per tahun ajaran atau semester.</p>
          </div>
          <div className="flex gap-2 items-center shrink-0">
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchGrid}>
              Refresh Grid
            </Button>
          </div>
        </div>

        {/* Filters Academic Year & Semester */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-obsidian">Tahun Ajaran:</span>
            <Select
              value={academicYearId != null ? String(academicYearId) : undefined}
              onValueChange={(v) => setAcademicYearId(Number(v))}
            >
              <SelectTrigger className="font-semibold text-xs">
                <SelectValue placeholder="Pilih tahun ajaran..." />
              </SelectTrigger>
              <SelectContent>
                {academicYearsList.map((ay) => (
                  <SelectItem key={ay.id} value={String(ay.id)}>
                    {ay.name}
                    {ay.is_active ? ' (Aktif)' : ''}
                  </SelectItem>
                ))}
                {academicYearsList.length === 0 && <SelectItem value="0">Memuat...</SelectItem>}
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
            description="Belum ada data santri aktif pada tahun ajaran ini. Silakan daftarkan santri terlebih dahulu di menu Data Siswa."

          />
        </Card>
      ) : (
        <Card variant="glass" padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate/10 font-bold text-slate border-b border-slate/20 uppercase text-[10px] tracking-wider">
                  <th className="p-3 pl-5 min-w-[180px]">Santri / NIS</th>
                  <th className="p-3">Tahun Ajaran</th>
                  {months.map((m) => (
                    <th key={`${m.month}-${m.year}`} className="p-3 text-center min-w-[100px]">
                      {monthName(m.month)} {m.year}
                    </th>
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
                    <td className="p-3 font-semibold text-slate">
                      {row.academic_year || '-'}
                    </td>
                    {months.map((m, monthIdx) => {
                      const monthData = row.months?.[monthIdx];
                      const status = monthData?.status || 'unpaid';
                      const isPaid = status === 'paid' || status === 'PAID' || status === 'lunas' || status === 'LUNAS';
                      const isPartial = status === 'partial' || status === 'PARTIAL';

                      return (
                        <td key={`${m.month}-${m.year}`} className="p-3 text-center">
                          {isPaid ? (
                            <span className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-emerald-light/60 text-emerald-primary font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3" /> LUNAS
                            </span>
                          ) : isPartial ? (
                            <span className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-sky-50 text-sky-700 font-bold text-[10px] border border-sky-200/50">
                              <AlertCircle className="w-3 h-3" /> CICILAN
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
    </div>
  );
};

export default SppGridPage;
