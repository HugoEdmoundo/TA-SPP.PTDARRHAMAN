import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'elevated' | 'interactive' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glow?: 'none' | 'emerald' | 'gold';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'glass',
  padding = 'md',
  glow = 'none',
  ...props
}) => {
  const variants = {
    glass: "bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_0_rgba(26,107,71,0.06)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)] rounded-2xl sm:rounded-3xl transition-all duration-300",
    elevated: "bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_rgba(0,0,0,0.08)] border border-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]",
    interactive: "bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_0_rgba(26,107,71,0.06)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)] rounded-2xl sm:rounded-3xl transition-all duration-300 hover:bg-white/85 hover:shadow-[0_16px_40px_0_rgba(26,107,71,0.12)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.99] cursor-pointer",
    bordered: "bg-white/60 backdrop-blur-xl border-2 border-emerald-primary/30 rounded-2xl sm:rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]",
  };

  const paddings = {
    none: "",
    sm: "p-3 sm:p-4 md:p-5",
    md: "p-4 sm:p-5 md:p-6",
    lg: "p-5 sm:p-6 md:p-8",
  };

  const glows = {
    none: "",
    emerald: "shadow-glow-emerald border-emerald-primary/40",
    gold: "shadow-glow-gold border-gold-accent/40",
  };

  return (
    <div
      className={cn(
        variants[variant],
        paddings[padding],
        glows[glow],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
