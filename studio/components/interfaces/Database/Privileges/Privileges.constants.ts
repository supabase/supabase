export const COLUMN_PRIVILEGE_TYPES = ['SELECT', 'INSERT', 'UPDATE'] as const
export type ColumnPrivilegeType = (typeof COLUMN_PRIVILEGE_TYPES)[number]

export const TABLE_PRIVILEGE_TYPES = [...COLUMN_PRIVILEGE_TYPES] as const
export type TablePrivilegeType = (typeof TABLE_PRIVILEGE_TYPES)[number]
