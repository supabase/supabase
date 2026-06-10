import { safeSql } from '@supabase/pg-meta/src/pg-format'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from '../keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { UseCustomQueryOptions } from '@/types'

export type TableRecordCountsVariables = {
  projectRef?: string
  connectionString?: string | null
}

export interface TableRecordCountsRow {
  name: string
  estimated_row_count: number
}

/**
 * Returns estimated live row counts per user table, excluding internal Supabase schemas.
 * Uses pg_stat_user_tables.n_live_tup for a fast estimate (same source as table_stats).
 */
export const tableRecordCountsSql = safeSql`
SELECT
  FORMAT('%I.%I', schemaname, relname) AS name,
  n_live_tup AS estimated_row_count
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
ORDER BY n_live_tup DESC
`

export async function getTableRecordCounts(
  { projectRef, connectionString }: TableRecordCountsVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql<TableRecordCountsRow[]>(
    {
      projectRef,
      connectionString,
      sql: tableRecordCountsSql,
      queryKey: ['debugger-table-record-counts'],
    },
    signal
  )
  return result
}

export type TableRecordCountsData = Awaited<ReturnType<typeof getTableRecordCounts>>
export type TableRecordCountsError = ExecuteSqlError

export const useTableRecordCountsQuery = <TData = TableRecordCountsData>(
  { projectRef, connectionString }: TableRecordCountsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<TableRecordCountsData, TableRecordCountsError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<TableRecordCountsData, TableRecordCountsError, TData>({
    queryKey: databaseKeys.debuggerTableRecordCounts(projectRef),
    queryFn: ({ signal }) => getTableRecordCounts({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
