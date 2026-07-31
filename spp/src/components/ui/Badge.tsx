import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { BillStatus, PaymentStatus } from '@/types';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/10 text-primary',
        success: 'border-transparent bg-emerald-light text-emerald-primary',
        warning: 'border-transparent bg-amber-50 text-amber-700',
        danger: 'border-transparent bg-rose-light text-rose-danger',
        info: 'border-transparent bg-blue-50 text-blue-700',
        gold: 'border-transparent bg-gold-bg text-gold-dark',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  status?: BillStatus | PaymentStatus | string;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

function Badge({ className, variant, status, pulse = false, size = 'md', children, ...props }: BadgeProps) {
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

  return (
    <span
      className={cn(
        badgeVariants({ variant: determinedVariant }),
        size === 'sm' && 'px-2 py-0.5 text-[10px]',
        isOverdue && 'animate-pulse ring-2 ring-rose-danger/30',
        className
      )}
      {...props}
    >
      {isOverdue && (
        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-rose-danger animate-ping" />
      )}
      {label}
    </span>
  );
}

export { Badge, badgeVariants };
