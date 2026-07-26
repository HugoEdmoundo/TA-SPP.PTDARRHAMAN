import React, { useRef } from 'react';
import { cn, formatRupiah, formatDateIndo } from '../../utils';
import type { Receipt, SchoolSettings } from '../../types';
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
  const cardRef = useRef<HTMLDivElement>(null);
  const { success } = useToast();
  const payment = receipt.payment;

  // Generate WhatsApp Share text and link
  const handleShareWhatsApp = () => {
    if (!payment) return;
    const itemsText = payment.items.map((it) => `• ${it.title}: ${formatRupiah(it.nominal)}`).join('\n');
    const msg = `*BUKTI PEMBAYARAN RESMI - ${settings.name.toUpperCase()}*\n\n` +
      `No. Kuitansi: *${receipt.receipt_number}*\n` +
      `Tanggal: ${formatDateIndo(receipt.created_at, true)}\n` +
      `Nama Siswa: *${payment.student?.name || payment.user?.name || '-'}* (${payment.student?.nis || '-'}) - Kelas ${payment.student?.grade || '-'}\n\n` +
      `*Rincian Pembayaran:*\n${itemsText}\n\n` +
      `*TOTAL DIBAYAR: ${formatRupiah(payment.total_amount)}*\n` +
      `Metode: ${payment.payment_method.replace('_', ' ')}\n` +
      `Status: *LUNAS (TERVERIFIKASI)*\n\n` +
      `Kode Verifikasi: \`${receipt.verification_code}\`\n\n` +
      `_Terima kasih atas kepedulian dan partisipasi Bapak/Ibu Wali Santri dalam mendukung pendidikan di ${settings.name}._`;

    const encodedMsg = encodeURIComponent(msg);
    const waUrl = `https://api.whatsapp.com/send?text=${encodedMsg}`;
    window.open(waUrl, '_blank');
    success('Berhasil Membuka WhatsApp', 'Rincian kuitansi siap dikirim melalui pesan WhatsApp.');
  };

  // Simpan / Print Kuitansi
  const handlePrintOrSave = () => {
    window.print();
  };

  if (!payment) return null;

  return (
    <div className={cn("flex flex-col items-center max-w-sm w-full mx-auto", className)}>
      {/* Printable / Shareable Card Area (Aspect Ratio friendly) */}
      <div
        ref={cardRef}
        className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-emerald-primary/30 relative select-none print:shadow-none print:border-none"
      >
        {/* Top Header Banner with Islamic Pattern feel */}
        <div className="bg-emerald-primary text-white p-6 pb-8 text-center relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-gold-accent/20 blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-center gap-3 mb-3">
            {settings.logo && (
              <img
                src={settings.logo}
                alt="Logo Sekolah"
                className="w-12 h-12 object-contain bg-white rounded-xl p-1 shadow-md"
              />
            )}
            <div className="text-left">
              <h4 className="font-extrabold text-sm tracking-wide text-white leading-tight">{settings.name}</h4>
              <p className="text-[10px] text-emerald-light/80 line-clamp-1">{settings.address}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-xs">
            <span className="text-emerald-light font-medium">No. Kuitansi:</span>
            <span className="font-mono font-bold tracking-wider text-gold-light">{receipt.receipt_number}</span>
          </div>
        </div>

        {/* Emerald Stamp Overlay (LUNAS) */}
        <div className="absolute top-28 right-6 transform rotate-12 z-10 pointer-events-none opacity-90">
          <div className="border-4 border-emerald-bright text-emerald-bright px-4 py-1 rounded-2xl font-black text-xl uppercase tracking-widest shadow-sm bg-white/90 backdrop-blur-xs">
            LUNAS
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 -mt-4 bg-ivory rounded-t-3xl relative z-0 flex flex-col gap-4 text-sm">
          {/* Santri Info */}
          <div className="bg-white p-3.5 rounded-2xl shadow-2xs border border-slate/10">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate block text-[10px] uppercase font-bold">Nama Santri</span>
                <span className="font-bold text-obsidian text-sm">{payment.student?.name || payment.user?.name || '-'}</span>
              </div>
              <div>
                <span className="text-slate block text-[10px] uppercase font-bold">Kelas / NIS</span>
                <span className="font-bold text-obsidian text-sm">{payment.student?.grade || '-'} ({payment.student?.nis || '-'})</span>
              </div>
            </div>
          </div>

          {/* Rincian Tagihan */}
          <div className="bg-white p-4 rounded-2xl shadow-2xs border border-slate/10 flex flex-col gap-2.5">
            <span className="text-[11px] font-extrabold text-slate uppercase tracking-wider block border-b border-slate/10 pb-1.5">
              Rincian Pembayaran
            </span>
            <div className="flex flex-col gap-2">
              {payment.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start gap-2 text-xs">
                  <span className="text-obsidian font-medium flex-1">{item.title}</span>
                  <span className="font-mono font-bold text-obsidian">{formatRupiah(item.nominal)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-slate/20 pt-2.5 mt-1 flex justify-between items-center">
              <span className="font-bold text-obsidian text-xs">TOTAL DIBAYAR</span>
              <span className="font-mono font-extrabold text-base text-emerald-primary">{formatRupiah(payment.total_amount)}</span>
            </div>
          </div>

          {/* Payment Details & Verification */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate/10">
              <span className="text-slate block text-[10px]">Metode Bayar</span>
              <span className="font-bold text-obsidian capitalize">{payment.payment_method.replace('_', ' ')}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate/10">
              <span className="text-slate block text-[10px]">Waktu Bayar</span>
              <span className="font-bold text-obsidian">{formatDateIndo(receipt.created_at, true)}</span>
            </div>
          </div>

          {/* Verification Code Footer */}
          <div className="bg-emerald-light/60 border border-emerald-primary/20 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-primary text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1 text-[11px]">
              <span className="font-bold text-emerald-primary block">Kuitansi Digital Terverifikasi</span>
              <span className="text-slate font-mono text-[10px] truncate block">Ver ID: {receipt.verification_code}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons (1-click WhatsApp & Print/PNG) */}
      <div className="mt-5 w-full flex flex-col sm:flex-row gap-2.5 print:hidden">
        <Button
          variant="primary"
          className="flex-1 bg-[#25D366] hover:bg-[#128C7E] shadow-md font-bold text-white py-3"
          leftIcon={<Share2 className="w-4 h-4" />}
          onClick={handleShareWhatsApp}
        >
          Kirim ke WhatsApp
        </Button>
        <Button
          variant="outline"
          className="flex-1 border-slate/30 text-obsidian hover:bg-slate/10 py-3 font-bold"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={handlePrintOrSave}
        >
          Cetak / Simpan PDF
        </Button>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="mt-3 text-xs font-semibold text-slate hover:text-obsidian transition-colors print:hidden"
        >
          Tutup Jendela
        </button>
      )}
    </div>
  );
};
