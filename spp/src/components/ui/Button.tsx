import React from 'react';
import { cn } from '../../utils/cn';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'outline' | 'ghost' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  ...props
}) => {
  const baseStyles = "relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 select-none active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 focus:outline-none focus:ring-2 focus:ring-emerald-primary/30";

  const variants = {
    primary: "bg-gradient-to-r from-emerald-primary to-[#145337] text-white shadow-[0_8px_20px_rgba(26,107,71,0.3)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] hover:shadow-[0_12px_28px_rgba(26,107,71,0.45)] hover:from-[#1E7B52] hover:to-[#176140]",
    gold: "bg-gradient-to-r from-gold-accent to-[#C2933C] text-obsidian font-extrabold shadow-[0_8px_20px_rgba(212,168,83,0.3)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_12px_28px_rgba(212,168,83,0.45)]",
    outline: "border-2 border-emerald-primary/40 text-emerald-primary bg-white/40 backdrop-blur-md hover:bg-white/80 hover:border-emerald-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]",
    ghost: "text-slate-dark hover:bg-white/60 hover:text-emerald-primary backdrop-blur-xs",
    danger: "bg-gradient-to-r from-rose-danger to-[#C92A20] text-white shadow-[0_8px_20px_rgba(255,59,48,0.3)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] hover:shadow-[0_12px_28px_rgba(255,59,48,0.45)]",
    glass: "bg-white/75 backdrop-blur-xl border border-white/90 text-obsidian shadow-[0_8px_24px_rgba(0,0,0,0.06)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)] hover:bg-white hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)]",
  };

  const sizes = {
    sm: "text-xs sm:text-sm px-3 py-2 sm:px-3.5 sm:py-2 min-h-[38px] sm:min-h-[36px]",
    md: "text-xs sm:text-sm md:text-base px-3.5 py-2.5 sm:px-4 sm:py-2.5 min-h-[44px] min-w-[44px]", // 44x44px min hit target for touch accessibility
    lg: "text-sm sm:text-base md:text-lg px-5 py-3 sm:px-6 sm:py-3.5 min-h-[50px] sm:min-h-[52px]",
    icon: "p-2 sm:p-2.5 min-h-[42px] min-w-[42px] sm:min-h-[44px] sm:min-w-[44px] rounded-xl",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" className="mr-2 shrink-0" color={variant === 'outline' || variant === 'ghost' ? 'emerald' : 'white'} />
          <span className="truncate">Memproses...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-1.5 sm:mr-2 flex items-center shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-1.5 sm:ml-2 flex items-center shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
