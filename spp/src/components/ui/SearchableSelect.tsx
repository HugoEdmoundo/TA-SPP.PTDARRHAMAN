import * as React from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { Input } from './Input';

export interface SearchableOption {
  value: string;
  label: string;
}

export interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = 'Pilih...',
  emptyMessage = 'Tidak ada data yang cocok.',
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const selected = options.find((o) => o.value === value);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={() => {
            setQuery('');
            setOpen((v) => !v);
          }}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            className
          )}
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-1" sideOffset={4}>
        <div className="relative p-1.5">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari..."
            className="h-9 pl-9 pr-3 text-sm"
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs font-medium text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onValueChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm outline-none transition-colors',
                  o.value === value
                    ? 'bg-primary/10 font-bold text-primary'
                    : 'text-foreground hover:bg-accent'
                )}
              >
                <span className="truncate">{o.label}</span>
                {o.value === value && <Check className="h-4 w-4 shrink-0" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
