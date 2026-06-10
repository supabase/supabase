import { safeSql } from '@supabase/pg-meta/src/pg-format'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from '../keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { UseCustomQueryOptions } from '@/types'

export type IndexUsageVariables = {
  projectRef?: string
  connectionString?: string | null
}

export interface IndexUsageRow {
  name: string
  percent_of_times_index_used: string
  rows_in_table: number
}

/**
 * Shows the percentage of table scans that used an index vs a sequential scan.
 * Tables with low index usage and high row counts may benefit from new indexes.
 */
export const indexUsageSql = safeSql`
SELECT
  FORMAT('%I.%I', schemaname, relname) AS name,
  CASE idx_scan
    WHEN 0 THEN 'Insufficient data'
    ELSE ROUND(100.0 * idx_scan / (seq_scan + idx_scan), 1)::text || '%'
  END AS percent_of_times_index_used,
  n_live_tup AS rows_in_table
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
ORDER BY
  n_live_tup DESC,
  relname ASC
`

export async function getIndexUsage(
  { projectRef, connectionString }: IndexUsageVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql<IndexUsageRow[]>(
    {
      projectRef,
      connectionString,
      sql: indexUsageSql,
      queryKey: ['debugger-index-usage'],
    },
    signal
  )
  return result
}

export type IndexUsageData = Awaited<ReturnType<typeof getIndexUsage>>
export type IndexUsageError = ExecuteSqlError

export const useIndexUsageQuery = <TData = IndexUsageData>(
  { projectRef, connectionString }: IndexUsageVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<IndexUsageData, IndexUsageError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<IndexUsageData, IndexUsageError, TData>({
    queryKey: databaseKeys.debuggerIndexUsage(projectRef),
    queryFn: ({ signal }) => getIndexUsage({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
