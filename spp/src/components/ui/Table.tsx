import React from 'react';
import { cn } from '../../utils/cn';

export interface Column<T> {
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  cell?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  rowClassName?: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
}

export function Table<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'Belum ada data tersedia',
  className,
  rowClassName,
  onRowClick,
}: TableProps<T>) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="sm:hidden flex items-center justify-between text-[11px] text-slate/80 font-medium px-1 select-none animate-pulse-subtle">
        <span>← Geser tabel secara horizontal →</span>
        <span className="text-emerald-primary font-bold">Responsive</span>
      </div>
      <div className={cn("w-full overflow-x-auto no-scrollbar rounded-2xl sm:rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_12px_40px_0_rgba(26,107,71,0.06)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)]", className)}>
        <table className="w-full text-left border-collapse min-w-[540px] sm:min-w-full">
          <thead>
            <tr className="border-b border-white/60 bg-white/40 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-dark backdrop-blur-md">
              {columns.map((col, idx) => (
                <th key={idx} className={cn("py-3 px-3.5 sm:py-3.5 sm:px-6 font-bold select-none whitespace-nowrap", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/40 text-xs sm:text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-emerald-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium">Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate">
                  <p className="text-sm font-medium">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const key = keyExtractor(item, index);
                const isClickable = !!onRowClick;
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={cn(
                      "transition-all duration-200",
                      isClickable ? "cursor-pointer hover:bg-white/80 active:bg-white/95" : "hover:bg-white/50",
                      rowClassName && rowClassName(item, index)
                    )}
                  >
                    {columns.map((col, colIdx) => {
                      let content: React.ReactNode = null;
                      if (col.cell) {
                        content = col.cell(item, index);
                      } else if (col.accessorKey) {
                        content = item[col.accessorKey] as unknown as React.ReactNode;
                      }
                      return (
                        <td key={colIdx} className={cn("py-3 px-3.5 sm:py-3.5 sm:px-6 text-obsidian", col.className)}>
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
