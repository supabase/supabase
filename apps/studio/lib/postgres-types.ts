import type { SafeSqlFragment } from '@supabase/pg-meta'
import type { PostgresColumn, PostgresTable } from '@supabase/postgres-meta'

export type SafePostgresColumn = PostgresColumn & {
  check: SafeSqlFragment | null
}

export type SafePostgresTable = Omit<PostgresTable, 'columns'> & {
  columns?: SafePostgresColumn[] | undefined
}
