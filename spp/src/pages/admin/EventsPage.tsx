import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, EmptyState, Spinner, InputCurrency, Input, Textarea, formatRupiah, formatDateIndo, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { Calendar, Plus, Search, CheckCircle2, Eye, Users, TrendingUp } from 'lucide-react';
import type { Student } from '../../types';

export const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [events, setEvents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingData, setTrackingData] = useState<any | null>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [perStudentAmount, setPerStudentAmount] = useState(1500000);
  const [deadline, setDeadline] = useState('2026-11-30');
  const [allowInstallment, setAllowInstallment] = useState(true);
  const [minInstallmentAmount, setMinInstallmentAmount] = useState(300000);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [selectAllStudents, setSelectAllStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [eventsRes, studentsRes] = await Promise.all([
        api.get('/events/'),
        api.get('/students/?limit=500&is_active=true'),
      ]);
      setEvents(eventsRes.data || []);
      setAllStudents(studentsRes.data || []);
    } catch (err: any) {
      toastError('Gagal Memuat Event', err?.response?.data?.detail || 'Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setName('');
    setDescription('');
    setPerStudentAmount(1500000);
    setDeadline('2026-11-30');
    setAllowInstallment(true);
    setMinInstallmentAmount(300000);
    setSelectedStudentIds(allStudents.map(s => Number(s.id)));
    setSelectAllStudents(true);
    setShowAddModal(true);
  };

  const handleToggleSelectAll = () => {
    if (selectAllStudents) {
      setSelectedStudentIds([]);
      setSelectAllStudents(false);
    } else {
      setSelectedStudentIds(allStudents.map(s => Number(s.id)));
      setSelectAllStudents(true);
    }
  };

  const handleToggleStudent = (sid: number) => {
    if (selectedStudentIds.includes(sid)) {
      setSelectedStudentIds(selectedStudentIds.filter(id => id !== sid));
      setSelectAllStudents(false);
    } else {
      const next = [...selectedStudentIds, sid];
      setSelectedStudentIds(next);
      if (next.length === allStudents.length) setSelectAllStudents(true);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || perStudentAmount <= 0 || selectedStudentIds.length === 0) {
      toastError('Form Tidak Lengkap', 'Nama event, nominal per siswa, dan minimal 1 peserta wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/events/', {
        name,
        description,
        per_student_amount: perStudentAmount,
        student_ids: selectedStudentIds,
        deadline: deadline || null,
        allow_installment: allowInstallment,
        min_installment_amount: allowInstallment ? minInstallmentAmount : null,
      });
      success('Event Patungan Diterbitkan', `Kegiatan "${name}" berhasil dibuat dan tagihan otomatis dikirim ke ${selectedStudentIds.length} santri.`);
      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      toastError('Gagal Menerbitkan Event', err?.response?.data?.detail || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenTracking = async (event: any) => {
    setShowTrackingModal(true);
    setIsTrackingLoading(true);
    try {
      const res = await api.get(`/events/${event.id}/tracking`);
      setTrackingData(res.data);
    } catch (err: any) {
      toastError('Gagal Memuat Progres', err?.response?.data?.detail || 'Terjadi kesalahan.');
      setShowTrackingModal(false);
    } finally {
      setIsTrackingLoading(false);
    }
  };

  const handleCompleteEvent = async (eventId: number, eventName: string) => {
    try {
      await api.post(`/events/${eventId}/complete`);
      success('Event Selesai', `Kegiatan "${eventName}" resmi ditandai selesai/lunas.`);
      setShowTrackingModal(false);
      fetchData();
    } catch (err: any) {
      toastError('Gagal Menyelesaikan Event', err?.response?.data?.detail || 'Hanya event aktif yang dapat diselesaikan.');
    }
  };

  const filteredEvents = events.filter(ev => 
    !searchTerm || ev.name.toLowerCase().includes(searchTerm.toLowerCase()) || ev.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <Card variant="glass" padding="sm" className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate/10 pb-4 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-obsidian flex items-center gap-2 font-heading">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-primary shrink-0" />
              <span>Event & Patungan Sekolah</span>
            </h2>
            <p className="text-xs text-slate mt-1">Buat kegiatan patungan (study tour, infaq, kurban) dan pantau progres dana terkumpul secara transparan.</p>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd} className="shrink-0 w-full sm:w-auto justify-center">
            Buat Event Baru
          </Button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate/50" />
          <Input
            type="text"
            placeholder="Cari nama kegiatan atau deskripsi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 text-xs"
          />
        </div>
      </Card>

      {isLoading ? (
        <Card variant="glass" padding="lg" className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" color="emerald" />
          <span className="text-xs text-slate mt-3 font-semibold">Memuat event dan patungan...</span>
        </Card>
      ) : filteredEvents.length === 0 ? (
        <Card variant="glass" padding="lg">
          <EmptyState
            title="Belum Ada Event Patungan"
            description={searchTerm ? `Tidak ada kegiatan dengan kata kunci "${searchTerm}".` : "Belum ada event. Klik tombol Buat Event Baru di atas untuk memulai kampanye patungan study tour, kurban, atau infaq."}
            action={!searchTerm ? <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>Buat Event Sekarang</Button> : undefined}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((ev: any) => {
            const isCompleted = ev.status === 'completed' || ev.status === 'COMPLETED';
            return (
              <Card key={ev.id} variant="elevated" padding="sm" className="p-5 bg-white/95 border border-slate/15 flex flex-col justify-between hover:shadow-xl transition-all">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="text-base font-extrabold text-obsidian font-heading leading-snug">{ev.name}</h4>
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate/15 text-slate text-[10px] font-bold shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Selesai
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-light text-emerald-primary text-[10px] font-bold shrink-0">
                        <TrendingUp className="w-3 h-3" /> Aktif
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate mb-4 line-clamp-2 min-h-[32px]">{ev.description || 'Tidak ada deskripsi rinci.'}</p>

                  <div className="p-3 rounded-xl bg-slate/5 border border-slate/10 flex flex-col gap-1.5 text-xs mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate">Target Total:</span>
                      <span className="font-mono font-bold text-obsidian">{formatRupiah(Number(ev.total_target))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate">Per Siswa:</span>
                      <span className="font-mono font-bold text-emerald-primary">{formatRupiah(Number(ev.per_student_amount))}</span>
                    </div>
                    {ev.deadline && (
                      <div className="flex justify-between pt-1 border-t border-slate/10">
                        <span className="text-slate">Batas Waktu:</span>
                        <span className="font-semibold text-obsidian">{formatDateIndo(ev.deadline)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Eye className="w-4 h-4" />}
                  onClick={() => handleOpenTracking(ev)}
                  className="w-full justify-center"
                >
                  Lihat Progres Kontribusi
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={
          <>
            <Plus className="w-5 h-5 text-emerald-primary" />
            <span>Buat Event Patungan Baru</span>
          </>
        }
        maxWidth="lg"
      >
        <form onSubmit={handleCreateEvent} className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="font-bold text-obsidian block mb-1">Nama Kegiatan / Event *</label>
                <Input
                  type="text"
                  required
                  placeholder="Misal: Patungan Study Tour Bandung Kelas 11..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-obsidian block mb-1">Nominal per Siswa (Rp) *</label>
                  <InputCurrency
                    value={perStudentAmount}
                    onChange={(val) => setPerStudentAmount(val)}
                    placeholder="Rp 0"
                  />
                </div>
                <div>
                  <label className="font-bold text-obsidian block mb-1">Batas Waktu (Deadline)</label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-obsidian block mb-1">Deskripsi Tambahan</label>
                <Textarea
                  rows={2}
                  placeholder="Opsional: Keterangan singkat mengenai event..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="font-bold resize-none"
                />
              </div>

              {/* Selector Santri */}
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-obsidian flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-primary" />
                    <span>Pilih Target Santri ({selectedStudentIds.length} terpilih) *</span>
                  </label>
                  <Button type="button" variant="ghost" size="sm" onClick={handleToggleSelectAll} className="text-[11px] py-0.5 px-2 h-auto">
                    {selectedStudentIds.length === allStudents.length ? 'Batal Semua' : 'Pilih Semua'}
                  </Button>
                </div>

                {allStudents.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate/30 text-center text-slate">
                    Belum ada data siswa aktif.
                  </div>
                ) : (
                  <div className="max-h-36 overflow-y-auto pr-1 flex flex-col gap-1.5">
                    {allStudents.map((st: any) => {
                      const sid = Number(st.id);
                      const isSelected = selectedStudentIds.includes(sid);
                      return (
                        <label
                          key={st.id}
                          className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-emerald-light/40 border-emerald-primary/30 font-bold' : 'bg-white border-slate/15 hover:bg-slate/5'}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleStudent(sid)}
                              className="rounded accent-emerald-primary"
                            />
                            <span className="truncate">{st.full_name || st.name}</span>
                          </div>
                          <span className="font-mono text-[10px] text-slate shrink-0">NIS: {st.nis}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 mt-2 pt-3 border-t border-slate/15 shrink-0">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>Batal</Button>
                <Button type="submit" variant="primary" size="sm" disabled={selectedStudentIds.length === 0 || perStudentAmount <= 0} isLoading={isSubmitting}>
                  Terbitkan Event & Tagihan ({selectedStudentIds.length} Siswa)
                </Button>
              </div>
        </form>
      </Modal>

      {/* Modal Tracking Progres */}
      <Modal
        isOpen={showTrackingModal}
        onClose={() => setShowTrackingModal(false)}
        title={
          <div className="flex flex-col">
            <span>Progres Kontribusi Santri</span>
            <span className="text-xs text-slate font-normal mt-0.5">{trackingData?.event?.name || 'Memuat...'}</span>
          </div>
        }
        maxWidth="3xl"
      >
            {isTrackingLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Spinner size="md" color="emerald" />
                <span className="text-xs text-slate mt-2">Menghitung akumulasi cicilan...</span>
              </div>
            ) : trackingData ? (
              <div className="flex flex-col gap-4">
                {/* Stats Ketercapaian */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate/5 rounded-xl border border-slate/15">
                    <span className="text-[10px] font-bold text-slate block">Target Terkumpul</span>
                    <span className="text-sm font-black font-mono text-obsidian">{formatRupiah(trackingData.summary.target)}</span>
                  </div>
                  <div className="p-3 bg-emerald-light/40 rounded-xl border border-emerald-primary/30">
                    <span className="text-[10px] font-bold text-emerald-dark block">Sudah Masuk (Cicilan)</span>
                    <span className="text-sm font-black font-mono text-emerald-primary">{formatRupiah(trackingData.summary.collected)}</span>
                  </div>
                  <div className="p-3 bg-amber/10 rounded-xl border border-amber/30">
                    <span className="text-[10px] font-bold text-amber block">Sisa Kurang</span>
                    <span className="text-sm font-black font-mono text-amber">{formatRupiah(trackingData.summary.remaining)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-bold text-obsidian">Rincian Siswa Peserta Event:</span>
                  <Badge variant="info">{trackingData.students.length} Siswa Terdaftar</Badge>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-slate/10 rounded-full overflow-hidden shrink-0">
                  <div className="h-full bg-emerald-primary rounded-full transition-all duration-500" style={{ width: `${Math.min(100, trackingData.progress_pct)}%` }}></div>
                </div>

                {/* Students Table */}
                <div className="overflow-x-auto border border-slate/20 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate/10 font-bold text-slate border-b border-slate/20">
                        <th className="p-2.5 pl-4">NIS / Nama Santri</th>
                        <th className="p-2.5 text-right">Target</th>
                        <th className="p-2.5 text-right">Dibayar</th>
                        <th className="p-2.5 text-right">Sisa</th>
                        <th className="p-2.5 text-center">Cicilan</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate/10">
                      {trackingData.students && trackingData.students.length > 0 ? (
                        trackingData.students.map((st: any) => {
                          const isPaid = st.status === 'paid' || st.status === 'PAID';
                          return (
                            <tr key={st.student_id} className="hover:bg-slate/5">
                              <td className="p-2.5 pl-4 font-bold text-obsidian">
                                <div>{st.name}</div>
                                <span className="text-[10px] font-mono text-slate font-normal">NIS: {st.nis}</span>
                              </td>
                              <td className="p-2.5 font-mono text-right">{formatRupiah(Number(st.target))}</td>
                              <td className="p-2.5 font-mono font-bold text-emerald-primary text-right">{formatRupiah(Number(st.paid))}</td>
                              <td className="p-2.5 font-mono text-slate text-right">{formatRupiah(Number(st.remaining))}</td>
                              <td className="p-2.5 font-mono text-center">{st.installment_count}x</td>
                              <td className="p-2.5 text-center">
                                {isPaid ? (
                                  <span className="px-2 py-0.5 rounded bg-emerald-light text-emerald-primary font-bold text-[10px]">Lunas</span>
                                ) : st.paid > 0 ? (
                                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold text-[10px]">Nyicil</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-rose-light text-rose-danger font-bold text-[10px]">Belum</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate italic">Belum ada siswa terdaftar pada event ini.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {trackingData && trackingData.event?.status === 'active' && (
              <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-slate/15 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleCompleteEvent(trackingData.event.id, trackingData.event.name)}
                >
                  Tandai Event Selesai / Lunas
                </Button>
              </div>
            )}
      </Modal>
    </div>
  );
};

export default EventsPage;
