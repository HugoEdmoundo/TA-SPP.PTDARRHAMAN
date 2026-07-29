import React, { useState, useEffect } from 'react';
import { Card, Button, EmptyState, Spinner, formatDateIndo } from '../../components/ui';
import { useToast } from '../../components/ui/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { ShieldAlert, Search, RefreshCw, Shield } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [logs, setLogs] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterEntity, setFilterEntity] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let url = `/audit-logs/?limit=150`;
      if (filterAction) url += `&action=${filterAction}`;
      if (filterEntity) url += `&entity_type=${filterEntity}`;
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;

      const res = await api.get(url);
      setLogs(res.data?.data || []);
      setTotalCount(res.data?.total || 0);
    } catch (err: any) {
      toastError('Gagal Memuat Audit Trail', err?.response?.data?.detail || 'Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction, filterEntity, startDate, endDate]);

  const handleResetFilters = () => {
    setFilterAction('');
    setFilterEntity('');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  const filteredLogs = logs.filter(l => 
    !searchTerm || 
    l.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.detail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.entity_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('VOID') || act.includes('DELETE') || act.includes('FAIL')) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-light text-rose-danger font-bold text-[10px]">{act}</span>;
    }
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('PAY') || act.includes('SUCCESS')) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-light text-emerald-primary font-bold text-[10px]">{act}</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate/10 text-obsidian font-bold text-[10px]">{act}</span>;
  };

  return (
    <div className="flex flex-col gap-6">
      <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate/10 pb-4 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
              <span>Keamanan & Audit Trail Keuangan</span>
            </h2>
            <p className="text-xs text-slate mt-1">Pantau seluruh aktivitas pengguna, pencatatan transaksi, serta pembatalan (void) untuk transparansi pesantren.</p>
          </div>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchLogs} className="shrink-0">
            Muat Ulang Log ({totalCount})
          </Button>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate/50" />
            <input
              type="text"
              placeholder="Cari rincian atau aksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate/20 bg-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-primary/50"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="p-2 rounded-xl border border-slate/20 bg-white font-semibold focus:outline-none"
          >
            <option value="">-- Semua Aksi (Action) --</option>
            <option value="CREATE_MANUAL_PAYMENT">CREATE_MANUAL_PAYMENT</option>
            <option value="VOID_PAYMENT">VOID_PAYMENT</option>
            <option value="VOID_RECEIPT">VOID_RECEIPT</option>
            <option value="CREATE_EVENT">CREATE_EVENT</option>
            <option value="UPDATE_EVENT">UPDATE_EVENT</option>
            <option value="COMPLETE_EVENT">COMPLETE_EVENT</option>
          </select>

          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="p-2 rounded-xl border border-slate/20 bg-white font-semibold focus:outline-none capitalize"
          >
            <option value="">-- Semua Entitas --</option>
            <option value="payment">Payment</option>
            <option value="receipt">Receipt</option>
            <option value="event">Event</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </select>

          <input
            type="date"
            placeholder="Dari Tanggal"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 rounded-xl border border-slate/20 bg-white font-mono text-xs focus:outline-none"
          />

          <div className="flex gap-1.5">
            <input
              type="date"
              placeholder="Sampai Tanggal"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate/20 bg-white font-mono text-xs focus:outline-none"
            />
            {(filterAction || filterEntity || startDate || endDate || searchTerm) && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-2 rounded-xl bg-slate/10 text-slate hover:bg-rose-light hover:text-rose-danger font-bold transition-colors shrink-0"
                title="Reset Filter"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card variant="glass" padding="lg" className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" color="emerald" />
          <span className="text-xs text-slate mt-3 font-semibold">Mengambil log keamanan...</span>
        </Card>
      ) : filteredLogs.length === 0 ? (
        <Card variant="glass" padding="lg">
          <EmptyState
            title="Tidak Ada Catatan Audit"
            description={searchTerm || filterAction || filterEntity || startDate ? "Tidak ada aktivitas log yang cocok dengan kriteria filter Anda." : "Belum ada catatan aktivitas keamanan. Melakukan pembuatan siswa, pembayaran loket, atau pembatalan (void) akan otomatis terekam di sini."}
            action={(searchTerm || filterAction || filterEntity || startDate) ? <Button variant="outline" size="sm" onClick={handleResetFilters}>Reset Semua Filter</Button> : undefined}
          />
        </Card>
      ) : (
        <Card variant="glass" padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate/5 font-bold text-slate border-b border-slate/15 uppercase text-[10px]">
                  <th className="p-3.5 pl-5">ID / Waktu Kejadian</th>
                  <th className="p-3.5">Aksi Keamanan</th>
                  <th className="p-3.5">Entitas Terkait</th>
                  <th className="p-3.5">ID Entitas</th>
                  <th className="p-3.5">Rincian Aktivitas (Audit Trail)</th>
                  <th className="p-3.5 pr-5 text-center">User ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate/10">
                {filteredLogs.map((l: any) => (
                  <tr key={l.id} className="hover:bg-white/60 transition-colors">
                    <td className="p-3.5 pl-5 font-mono text-slate">
                      <div className="font-bold text-obsidian">LOG-#{l.id}</div>
                      <span className="text-[10px]">{formatDateIndo(l.created_at, true)}</span>
                    </td>
                    <td className="p-3.5">
                      {getActionBadge(l.action)}
                    </td>
                    <td className="p-3.5 font-bold uppercase text-obsidian font-mono text-[11px]">
                      {l.entity_type || '-'}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-emerald-primary">
                      {l.entity_id ? `#${l.entity_id}` : '-'}
                    </td>
                    <td className="p-3.5 font-sans font-medium text-obsidian leading-relaxed max-w-md">
                      {l.detail || 'Tidak ada keterangan detail.'}
                    </td>
                    <td className="p-3.5 pr-5 text-center font-mono text-slate">
                      {l.user_id ? `User ID #${l.user_id}` : 'System'}
                    </td>
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

export default AuditLogPage;
