import { safeSql } from '@supabase/pg-meta/src/pg-format'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from '../keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { UseCustomQueryOptions } from '@/types'

export type TableStatsVariables = {
  projectRef?: string
  connectionString?: string | null
}

export interface TableStatsRow {
  name: string
  table_size: string
  index_size: string
  total_size: string
  estimated_row_count: number
  seq_scans: number
}

export const tableStatsSql = safeSql`
SELECT
  ts.name,
  pg_size_pretty(ts.table_size_bytes) AS table_size,
  pg_size_pretty(ts.index_size_bytes) AS index_size,
  pg_size_pretty(ts.total_size_bytes) AS total_size,
  COALESCE(rc.estimated_row_count, 0) AS estimated_row_count,
  COALESCE(rc.seq_scans, 0) AS seq_scans
FROM (
  SELECT
    FORMAT('%I.%I', n.nspname, c.relname) AS name,
    pg_table_size(c.oid) AS table_size_bytes,
    pg_indexes_size(c.oid) AS index_size_bytes,
    pg_total_relation_size(c.oid) AS total_size_bytes
  FROM pg_class c
  LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname NOT LIKE 'pg_%'
    AND n.nspname NOT IN (
      'information_schema','_analytics','_realtime','_supavisor',
      'auth','etl','extensions','pgbouncer','realtime','storage',
      'supabase_functions','supabase_migrations','cron','dbdev',
      'graphql','graphql_public','net','pgmq','pgsodium','pgsodium_masks',
      'pgtle','repack','tiger','tiger_data','topology'
    )
    AND n.nspname NOT LIKE 'timescaledb_%'
    AND n.nspname NOT LIKE '_timescaledb_%'
    AND c.relkind = 'r'
) ts
LEFT JOIN (
  SELECT
    FORMAT('%I.%I', schemaname, relname) AS name,
    n_live_tup AS estimated_row_count,
    seq_scan AS seq_scans
  FROM pg_stat_user_tables
  WHERE schemaname NOT LIKE 'pg_%'
    AND schemaname NOT IN (
      'information_schema','_analytics','_realtime','_supavisor',
      'auth','etl','extensions','pgbouncer','realtime','storage',
      'supabase_functions','supabase_migrations','cron','dbdev',
      'graphql','graphql_public','net','pgmq','pgsodium','pgsodium_masks',
      'pgtle','repack','tiger','tiger_data','topology'
    )
    AND schemaname NOT LIKE 'timescaledb_%'
    AND schemaname NOT LIKE '_timescaledb_%'
) rc ON rc.name = ts.name
ORDER BY ts.total_size_bytes DESC
`

export async function getTableStats(
  { projectRef, connectionString }: TableStatsVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql<TableStatsRow[]>(
    {
      projectRef,
      connectionString,
      sql: tableStatsSql,
      queryKey: ['debugger-table-stats'],
    },
    signal
  )
  return result
}

export type TableStatsData = Awaited<ReturnType<typeof getTableStats>>
export type TableStatsError = ExecuteSqlError

export const useTableStatsQuery = <TData = TableStatsData>(
  { projectRef, connectionString }: TableStatsVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<TableStatsData, TableStatsError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<TableStatsData, TableStatsError, TData>({
    queryKey: databaseKeys.debuggerTableStats(projectRef),
    queryFn: ({ signal }) => getTableStats({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
