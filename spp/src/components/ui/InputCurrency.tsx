import React, { useState, useEffect } from 'react';
import { cn, formatRupiah, parseRupiah } from '@/utils';
import { Coins, Zap } from 'lucide-react';
import { Input } from './Input';
import { Label } from './Label';

export interface InputCurrencyProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'defaultValue'> {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  error?: string;
  maxAmount?: number;
  showQuickChips?: boolean;
  quickChips?: number[];
  allowPayAll?: boolean;
}

const DEFAULT_CHIPS = [50000, 100000, 250000, 500000];

export const InputCurrency: React.FC<InputCurrencyProps> = ({
  value,
  onChange,
  label,
  error,
  maxAmount,
  showQuickChips = true,
  quickChips = DEFAULT_CHIPS,
  allowPayAll = true,
  className,
  disabled,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    setDisplayValue(value > 0 ? formatRupiah(value) : '');
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawStr = e.target.value;
    const num = parseRupiah(rawStr);

    if (maxAmount !== undefined && num > maxAmount) {
      onChange(maxAmount);
      setDisplayValue(formatRupiah(maxAmount));
    } else {
      onChange(num);
      setDisplayValue(num > 0 ? formatRupiah(num) : '');
    }
  };

  const handleAddChip = (amountToAdd: number) => {
    if (disabled) return;
    const newTotal = (value || 0) + amountToAdd;
    if (maxAmount !== undefined && newTotal > maxAmount) {
      onChange(maxAmount);
    } else {
      onChange(newTotal);
    }
  };

  const handlePayAll = () => {
    if (disabled || maxAmount === undefined) return;
    onChange(maxAmount);
  };

  return (
    <div className="w-full">
      {label && (
        <Label className="mb-1.5 flex items-center gap-1.5 text-foreground">
          <Coins className="h-4 w-4 text-primary" />
          {label}
        </Label>
      )}

      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          placeholder="Rp 0"
          value={displayValue}
          onChange={handleInputChange}
          disabled={disabled}
          className={cn(
            'font-bold text-base sm:text-lg md:text-xl bg-background',
            error && 'border-destructive',
            className
          )}
          {...props}
        />
      </div>

      {error && <p className="mt-1.5 text-xs font-semibold text-destructive">{error}</p>}

      {showQuickChips && !disabled && (
        <div className="mt-2.5 flex flex-wrap gap-1.5 sm:gap-2">
          {quickChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleAddChip(chip)}
              className="flex min-h-[34px] items-center justify-center rounded-lg bg-primary/10 px-3 py-1.5 text-xs sm:text-sm font-bold text-primary border border-primary/20 transition-all duration-150 hover:bg-primary hover:text-white active:scale-95 select-none"
            >
              +{formatRupiah(chip)}
            </button>
          ))}
          {allowPayAll && maxAmount !== undefined && maxAmount > 0 && (
            <button
              key="pay-all"
              type="button"
              onClick={handlePayAll}
              className="ml-auto flex min-h-[34px] items-center justify-center gap-1 rounded-lg bg-gold-bg px-3 py-1.5 text-xs sm:text-sm font-bold text-gold-dark border border-gold-accent transition-all duration-150 hover:bg-gold-accent hover:text-foreground active:scale-95 select-none"
            >
              <Zap className="h-3.5 w-3.5" />
              Bayar Semua ({formatRupiah(maxAmount)})
            </button>
          )}
        </div>
      )}
    </div>
  );
};
