import React from 'react';
import { cn } from '../../utils/cn';
import type { BillStatus, PaymentStatus } from '../../types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold';
  status?: BillStatus | PaymentStatus | string;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant,
  status,
  pulse = false,
  size = 'md',
  ...props
}) => {
  // Map status to variant and label if status is provided
  let determinedVariant = variant || 'default';
  let label = children;

  if (status) {
    switch (status) {
      case 'PAID':
      case 'SUCCESS':
      case 'ACTIVE':
        determinedVariant = 'success';
        label = label || (status === 'PAID' ? 'Lunas' : status === 'ACTIVE' ? 'Aktif' : 'Berhasil');
        break;
      case 'PARTIAL':
        determinedVariant = 'gold';
        label = label || 'Cicilan / Sebagian';
        break;
      case 'OVERDUE':
        determinedVariant = 'danger';
        label = label || 'Menunggak (Overdue)';
        break;
      case 'UNPAID':
      case 'PENDING':
        determinedVariant = 'warning';
        label = label || (status === 'UNPAID' ? 'Belum Bayar' : 'Menunggu');
        break;
      case 'VOID':
      case 'FAILED':
      case 'EXPIRED':
      case 'REFUNDED':
        determinedVariant = 'default';
        label = label || status;
        break;
    }
  }

  const isOverdue = status === 'OVERDUE' || pulse;

  const variants = {
    default: "bg-slate/10 text-slate-dark border border-slate/20",
    success: "bg-emerald-light text-emerald-primary border border-emerald-primary/30 font-semibold",
    warning: "bg-amber-50 text-amber-700 border border-amber-300",
    danger: "bg-rose-light text-rose-danger border border-rose-danger/30 font-bold",
    info: "bg-blue-50 text-blue-700 border border-blue-200",
    gold: "bg-gold-bg text-gold-dark border border-gold-accent/40 font-semibold",
  };

  const sizes = {
    sm: "text-[10px] sm:text-xs px-2 py-0.5 rounded-md font-bold",
    md: "text-xs sm:text-sm px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg font-bold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all select-none",
        variants[determinedVariant],
        sizes[size],
        isOverdue && "animate-pulse-subtle ring-2 ring-rose-danger/30",
        className
      )}
      {...props}
    >
      {isOverdue && (
        <span className="w-1.5 h-1.5 rounded-full bg-rose-danger mr-1.5 animate-ping" />
      )}
      {label}
    </span>
  );
};
