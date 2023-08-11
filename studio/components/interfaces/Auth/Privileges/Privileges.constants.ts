export const COLUMN_PRIVILEGE_TYPES = ['SELECT', 'INSERT', 'UPDATE', 'REFERENCES'] as const
export type ColumnPrivilegeType = (typeof COLUMN_PRIVILEGE_TYPES)[number]

export const TABLE_PRIVILEGE_TYPES = [
  ...COLUMN_PRIVILEGE_TYPES,
  'DELETE',
  'TRUNCATE',
  'TRIGGER',
] as const
export type TablePrivilegeType = (typeof TABLE_PRIVILEGE_TYPES)[number]
