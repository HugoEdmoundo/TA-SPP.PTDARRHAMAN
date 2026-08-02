import React from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './Dialog';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
  className?: string;
  showCloseButton?: boolean;
  headerClassName?: string;
  bodyClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = 'lg',
  className,
  showCloseButton = true,
  headerClassName,
  bodyClassName,
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-[calc(100%-2rem)]',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          'max-h-[90vh] flex flex-col gap-0 overflow-hidden',
          maxWidthClasses[maxWidth],
          className
        )}
        hideCloseButton={!showCloseButton}
      >
        {title && (
          <DialogHeader
            className={cn(
              'flex-row items-center gap-3 border-b px-6 py-4 pr-14 text-left shrink-0',
              headerClassName
            )}
          >
            {icon && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-light text-emerald-primary">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <DialogTitle className="text-sm font-extrabold">{title}</DialogTitle>
              {subtitle && <p className="mt-0.5 text-[11px] font-medium text-slate">{subtitle}</p>}
            </div>
          </DialogHeader>
        )}
        {!title && <DialogTitle className="sr-only">Detail</DialogTitle>}
        <div className={cn('p-6 overflow-y-auto flex-1 min-h-0', bodyClassName)}>{children}</div>
      </DialogContent>
    </Dialog>
  );
};
