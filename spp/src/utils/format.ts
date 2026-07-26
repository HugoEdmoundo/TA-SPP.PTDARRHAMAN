/**
 * Formats a number into standard Indonesian Rupiah format (e.g. Rp 1.500.000)
 */
export function formatRupiah(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === '') return 'Rp 0';
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount;
  if (isNaN(num)) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num).replace('IDR', 'Rp');
}

/**
 * Parses a Rupiah formatted string back to a clean number
 */
export function parseRupiah(value: string): number {
  const cleanStr = value.replace(/[^0-9]/g, '');
  return cleanStr ? parseInt(cleanStr, 10) : 0;
}

/**
 * Formats a date string into standard Indonesian date format (e.g. 26 Juli 2026)
 */
export function formatDateIndo(dateStr: string | Date | undefined | null, includeTime = false): string {
  if (!dateStr) return '-';
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return '-';

    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
    };
    return new Intl.DateTimeFormat('id-ID', options).format(date);
  } catch {
    return '-';
  }
}

/**
 * Formats a month and year into Indonesian format (e.g. Juli 2026)
 */
export function formatMonthYearIndo(month: number, year: number): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const m = months[month - 1] || '';
  return `${m} ${year}`;
}
