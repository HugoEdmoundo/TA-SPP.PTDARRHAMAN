import React from 'react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './Sheet';

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
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className={cn(
          'w-full rounded-t-xl flex flex-col gap-0 p-0 overflow-hidden sm:max-w-xl sm:mx-auto sm:rounded-b-xl',
          maxHeight,
          className
        )}
      >
        {title && (
          <SheetHeader className="flex-row items-center justify-between border-b px-5 py-4 text-left shrink-0">
            <div className="min-w-0 pr-8">
              <SheetTitle className="text-base sm:text-lg font-extrabold tracking-tight leading-snug">
                {title}
              </SheetTitle>
              {subtitle && (
                <SheetDescription className="mt-0.5 text-xs sm:text-sm leading-normal">
                  {subtitle}
                </SheetDescription>
              )}
            </div>
          </SheetHeader>
        )}
        <div className="overflow-y-auto flex-1 no-scrollbar p-5 sm:p-6 pb-safe">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
};
