import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
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
  children,
  maxWidth = 'lg',
  className,
  showCloseButton = true,
  headerClassName,
  bodyClassName,
}) => {
  // Handle ESC key press to close modal & Lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-obsidian/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={(e) => {
        // Close modal only when clicking precisely on the outer backdrop overlay
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={cn(
          "w-full bg-white rounded-3xl border border-slate/20 shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden animate-scale-up my-auto",
          maxWidthClasses[maxWidth],
          className
        )}
      >
        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div
            className={cn(
              "flex items-center justify-between px-6 py-4 border-b border-slate/10 shrink-0 bg-slate/5",
              headerClassName
            )}
          >
            <div className="text-base font-extrabold text-obsidian font-heading flex items-center gap-2">
              {title}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate hover:text-obsidian hover:bg-slate/10 transition-colors shrink-0 cursor-pointer"
                aria-label="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className={cn("p-6 overflow-y-auto flex-1 min-h-0", bodyClassName)}>
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
