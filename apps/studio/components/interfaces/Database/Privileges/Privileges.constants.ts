export const COLUMN_PRIVILEGE_TYPES = ['SELECT', 'INSERT', 'UPDATE'] as const
export type ColumnPrivilegeType = (typeof COLUMN_PRIVILEGE_TYPES)[number]
