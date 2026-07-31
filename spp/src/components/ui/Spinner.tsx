import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'emerald' | 'gold' | 'white' | 'slate';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'emerald',
  className,
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colors = {
    emerald: 'text-primary',
    gold: 'text-accent',
    white: 'text-white',
    slate: 'text-muted-foreground',
  };

  return (
    <Loader2
      className={cn('animate-spin', sizes[size], colors[color], className)}
      role="status"
      aria-label="Loading"
    />
  );
};
