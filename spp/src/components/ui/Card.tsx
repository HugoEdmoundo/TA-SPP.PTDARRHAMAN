import * as React from 'react';
import { cn } from '@/lib/utils';

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
    glass: 'rounded-2xl bg-white/70 backdrop-blur border border-white/80 shadow-[0_8px_32px_0_rgba(26,107,71,0.06)] transition-all duration-300',
    elevated: 'rounded-2xl bg-white shadow-md border border-border transition-all duration-300',
    interactive:
      'rounded-2xl bg-white/70 backdrop-blur border border-white/80 shadow-[0_8px_32px_0_rgba(26,107,71,0.06)] transition-all duration-300 hover:bg-white/85 hover:shadow-[0_16px_40px_0_rgba(26,107,71,0.12)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.99] cursor-pointer',
    bordered: 'rounded-2xl bg-white/60 backdrop-blur border-2 border-primary/30 shadow-sm',
  };

  const paddings = {
    none: '',
    sm: 'p-3 sm:p-4 md:p-5',
    md: 'p-4 sm:p-5 md:p-6',
    lg: 'p-5 sm:p-6 md:p-8',
  };

  const glows = {
    none: '',
    emerald: 'shadow-glow-emerald border-primary/40',
    gold: 'shadow-glow-gold border-gold-accent/40',
  };

  return (
    <div className={cn(variants[variant], paddings[padding], glows[glow], className)} {...props}>
      {children}
    </div>
  );
};

// shadcn/ui Card sub-components (standard API, paired with the shadcn Card look)
const CardShadcn = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  )
);
CardShadcn.displayName = 'CardShadcn';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export {
  CardShadcn,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
