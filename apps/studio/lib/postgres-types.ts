import type { PGColumn, PGTable, SafeSqlFragment } from '@supabase/pg-meta'

export type SafePostgresColumn = PGColumn & {
  check: SafeSqlFragment | null
  // Present when sourced from pg-meta's SQL queries (e.g. `pgMeta.tables.retrieve`), absent
  // from the legacy `/platform/pg-meta/{ref}/tables` REST endpoint.
  format_schema?: string
}

export type SafePostgresTable = Omit<PGTable, 'columns'> & {
  columns?: SafePostgresColumn[] | undefined
}
