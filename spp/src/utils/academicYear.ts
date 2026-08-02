import type { AcademicYear } from '../types';

export const MONTH_NAMES = [
  { num: 1, name: 'Januari' },
  { num: 2, name: 'Februari' },
  { num: 3, name: 'Maret' },
  { num: 4, name: 'April' },
  { num: 5, name: 'Mei' },
  { num: 6, name: 'Juni' },
  { num: 7, name: 'Juli' },
  { num: 8, name: 'Agustus' },
  { num: 9, name: 'September' },
  { num: 10, name: 'Oktober' },
  { num: 11, name: 'November' },
  { num: 12, name: 'Desember' },
];

const MONTH_NAME_MAP: Record<number, string> = Object.fromEntries(
  MONTH_NAMES.map((m) => [m.num, m.name])
);

export function monthName(month: number): string {
  return MONTH_NAME_MAP[month] || String(month);
}

/** Tahun mulai tahun ajaran: pakai start_date bila ada, fallback parse nama "YYYY/YYYY+1". */
export function academicYearStartYear(ay: AcademicYear): number {
  if (ay.start_date) {
    const parsed = new Date(ay.start_date);
    if (!Number.isNaN(parsed.getTime())) return parsed.getFullYear();
  }
  if (ay.name) {
    const match = ay.name.trim().match(/^(\d{4})/);
    if (match) return Number(match[1]);
  }
  return new Date().getFullYear();
}

/** Label tahun ajaran berjalan dari tanggal sekarang: Jul-Des = "YYYY/YYYY+1", Jan-Jun = "YYYY-1/YYYY". */
export function currentAcademicYearLabel(date: Date = new Date()): string {
  const year = date.getFullYear();
  return date.getMonth() >= 6 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

/**
 * Daftar bulan kalender milik satu semester pada AY (mirror backend `ay_months`).
 * Semester 1 = 6 bulan pertama dari start_date, Semester 2 = 6 bulan terakhir.
 */
export function academicYearMonths(ay: AcademicYear, semester: 1 | 2): { month: number; year: number }[] {
  const startYear = academicYearStartYear(ay);
  const startMonth = 7;
  const idxs = semester === 1 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11];
  return idxs.map((i) => {
    const total = startYear * 12 + (startMonth - 1) + i;
    return { month: (total % 12) + 1, year: Math.floor(total / 12) };
  });
}
