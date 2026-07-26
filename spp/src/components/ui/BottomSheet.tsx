import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className,
  maxHeight = 'max-h-[88vh]',
}) => {
  // Lock body scroll when open on mobile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const sheetContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-obsidian/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div
        className={cn(
          // Base layout & glass
          "relative w-full sm:max-w-xl",
          "bg-white/90 backdrop-blur-2xl",
          // Borders & shadow
          "border-t border-white/80 sm:border sm:border-white/80",
          "shadow-[0_-8px_40px_rgba(0,0,0,0.18)] sm:shadow-[0_24px_64px_rgba(0,0,0,0.22)]",
          // Shape
          "rounded-t-[28px] sm:rounded-3xl",
          // Animation
          "animate-slide-up sm:animate-scale-in",
          // Layout
          "z-10 overflow-hidden flex flex-col",
          maxHeight,
          className
        )}
      >
        {/* Drag Handle (mobile only) */}
        <div className="sm:hidden flex justify-center pt-3.5 pb-1 cursor-pointer shrink-0" onClick={onClose}>
          <div className="w-10 h-1 bg-slate/30 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-start justify-between px-5 sm:px-6 pt-4 pb-3.5 sm:pt-5 border-b border-slate/10 shrink-0">
            <div className="min-w-0 pr-3">
              <h3 className="text-base sm:text-lg font-extrabold text-obsidian tracking-tight font-heading leading-snug">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate mt-0.5 leading-normal">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-2 rounded-xl text-slate hover:text-obsidian hover:bg-slate/10 active:scale-95 transition-all duration-150 -mr-1"
            >
              <X className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className={cn("overflow-y-auto flex-1 no-scrollbar", title ? "p-5 sm:p-6" : "pt-3 px-5 sm:px-6 pb-5 sm:pb-6")}>
          {children}
        </div>

        {/* Safe area footer spacer (iOS home indicator) */}
        <div className="shrink-0 pb-safe sm:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
      </div>
    </div>
  );

  return createPortal(sheetContent, document.body);
};
