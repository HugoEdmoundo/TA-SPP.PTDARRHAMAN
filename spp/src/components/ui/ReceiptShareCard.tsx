import React from 'react';
import { cn, formatRupiah, formatDateIndo } from '@/utils';
import type { Receipt, SchoolSettings } from '@/types';
import { Button } from './Button';
import { Share2, Download, ShieldCheck } from 'lucide-react';
import { useToast } from './ToastContext';

export interface ReceiptShareCardProps {
  receipt: Receipt;
  settings: SchoolSettings;
  className?: string;
  onClose?: () => void;
}

export const ReceiptShareCard: React.FC<ReceiptShareCardProps> = ({
  receipt,
  settings,
  className,
  onClose,
}) => {
  const { success } = useToast();
  const payment = receipt.payment;

  const handleShareWhatsApp = () => {
    if (!payment) return;
    const itemsText = (payment.items || [])
      .map((it) => `• ${it.title}: ${formatRupiah(it.nominal)}`)
      .join('\n');
    const msg = `*BUKTI PEMBAYARAN RESMI - ${settings.name.toUpperCase()}*\n\n` +
      `No. Kuitansi: *${receipt.receipt_number}*\n` +
      `Tanggal: ${formatDateIndo(receipt.created_at, true)}\n` +
      `Nama Siswa: *${payment.student?.name || payment.user?.name || '-'}* (NIS ${payment.student?.nis || '-'})\n\n` +
      `*Rincian Pembayaran:*\n${itemsText}\n\n` +
      `*TOTAL DIBAYAR: ${formatRupiah(payment.total_amount)}*\n` +
      `Metode: ${(payment.payment_method || 'Transfer').replace('_', ' ')}\n` +
      `Status: *LUNAS (TERVERIFIKASI)*\n\n` +
      `Kode Verifikasi: \`${receipt.verification_code}\`\n\n` +
      `_Terima kasih atas kepedulian dan partisipasi Bapak/Ibu Parents Santri dalam mendukung pendidikan di ${settings.name}._`;

    const encodedMsg = encodeURIComponent(msg);
    const waUrl = `https://api.whatsapp.com/send?text=${encodedMsg}`;
    window.open(waUrl, '_blank');
    success('Berhasil Membuka WhatsApp', 'Rincian kuitansi siap dikirim melalui pesan WhatsApp.');
  };

  const handlePrintOrSave = () => {
    window.print();
  };

  if (!payment) return null;

  return (
    <div className={cn('flex flex-col items-center max-w-sm w-full mx-auto', className)}>
      <div className="relative w-full select-none overflow-hidden rounded-2xl border-2 border-primary/30 bg-white shadow-2xl print:border-none print:shadow-none">
        <div className="relative overflow-hidden bg-primary p-6 pb-8 text-center text-white">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-accent/20 blur-xl" />

          <div className="mb-3 flex items-center justify-center gap-3">
            {settings.logo && (
              <img
                src={settings.logo}
                alt="Logo Sekolah"
                className="h-12 w-12 rounded-xl bg-white p-1 object-contain shadow-md"
              />
            )}
            <div className="text-left">
              <h4 className="text-sm font-extrabold leading-tight tracking-wide text-white">{settings.name}</h4>
              <p className="line-clamp-1 text-[10px] text-emerald-light/80">{settings.address}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-4 text-xs">
            <span className="font-medium text-emerald-light">No. Kuitansi:</span>
            <span className="font-mono font-bold tracking-wider text-gold-light">{receipt.receipt_number}</span>
          </div>
        </div>

        <div className="pointer-events-none absolute right-6 top-28 z-10 rotate-12 opacity-90">
          <div className="rounded-xl border-4 border-emerald-bright bg-white/90 px-4 py-1 text-xl font-black uppercase tracking-widest text-emerald-bright shadow-sm backdrop-blur-xs">
            LUNAS
          </div>
        </div>

        <div className="relative z-0 -mt-4 flex flex-col gap-4 rounded-t-2xl bg-ivory p-6 text-sm">
          <div className="rounded-xl border border-border bg-white p-3.5 shadow-sm">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="block text-[10px] font-bold uppercase text-muted-foreground">Nama Santri</span>
                <span className="text-sm font-bold text-foreground">{payment.student?.name || payment.user?.name || '-'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-muted-foreground">NIS</span>
                <span className="text-sm font-bold text-foreground">{payment.student?.nis || '-'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-white p-4 shadow-sm">
            <span className="block border-b border-border pb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Rincian Pembayaran
            </span>
            <div className="flex flex-col gap-2">
              {(payment.items || []).map((item, idx) => (
                <div key={idx} className="flex items-start justify-between gap-2 text-xs">
                  <span className="flex-1 font-medium text-foreground">{item.title}</span>
                  <span className="font-mono font-bold text-foreground">{formatRupiah(item.nominal)}</span>
                </div>
              ))}
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-dashed pt-2.5">
              <span className="text-xs font-bold text-foreground">TOTAL DIBAYAR</span>
              <span className="font-mono text-base font-extrabold text-primary">{formatRupiah(payment.total_amount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-border bg-white p-3">
              <span className="block text-[10px] text-muted-foreground">Metode Bayar</span>
              <span className="font-bold capitalize text-foreground">{(payment.payment_method || 'Transfer').replace('_', ' ')}</span>
            </div>
            <div className="rounded-lg border border-border bg-white p-3">
              <span className="block text-[10px] text-muted-foreground">Waktu Bayar</span>
              <span className="font-bold text-foreground">{formatDateIndo(receipt.created_at, true)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1 text-[11px]">
              <span className="block font-bold text-primary">Kuitansi Digital Terverifikasi</span>
              <span className="block truncate font-mono text-[10px] text-muted-foreground">Ver ID: {receipt.verification_code}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex w-full flex-col gap-2.5 sm:flex-row print:hidden">
        <Button
          variant="primary"
          className="flex-1 bg-[#25D366] text-white shadow-md hover:bg-[#128C7E] font-bold"
          leftIcon={<Share2 className="h-4 w-4" />}
          onClick={handleShareWhatsApp}
        >
          Kirim ke WhatsApp
        </Button>
        <Button
          variant="outline"
          className="flex-1 border-input text-foreground font-bold hover:bg-muted"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={handlePrintOrSave}
        >
          Cetak / Simpan PDF
        </Button>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="mt-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground print:hidden"
        >
          Tutup Jendela
        </button>
      )}
    </div>
  );
};
