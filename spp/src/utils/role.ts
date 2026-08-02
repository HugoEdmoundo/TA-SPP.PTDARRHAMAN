export type Role = 'ADMIN' | 'SUPERADMIN' | 'WALI' | string;

export function normalizeRole(role: string | null | undefined): Role {
  if (!role) return 'ADMIN';
  const upper = String(role).toUpperCase();
  if (upper === 'SUPER_ADMIN' || upper === 'SUPERADMIN') return 'SUPERADMIN';
  if (upper === 'WALI') return 'WALI';
  return 'ADMIN';
}
