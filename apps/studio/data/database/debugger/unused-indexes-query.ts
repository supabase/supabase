import { safeSql } from '@supabase/pg-meta/src/pg-format'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from '../keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { UseCustomQueryOptions } from '@/types'

export type UnusedIndexesVariables = {
  projectRef?: string
  connectionString?: string | null
}

export interface UnusedIndexesRow {
  name: string
  index: string
  index_size: string
  index_scans: number
}

export const unusedIndexesSql = safeSql`
SELECT
  FORMAT('%I.%I', schemaname, relname) AS name,
  indexrelname AS index,
  pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
  idx_scan AS index_scans
FROM pg_stat_user_indexes ui
JOIN pg_index i ON ui.indexrelid = i.indexrelid
WHERE NOT indisunique
  AND idx_scan < 50
  AND pg_relation_size(relid) > 5 * 8192
  AND schemaname NOT LIKE 'pg_%'
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
  pg_relation_size(i.indexrelid) / NULLIF(idx_scan, 0) DESC NULLS FIRST,
  pg_relation_size(i.indexrelid) DESC
`

export async function getUnusedIndexes(
  { projectRef, connectionString }: UnusedIndexesVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql<UnusedIndexesRow[]>(
    {
      projectRef,
      connectionString,
      sql: unusedIndexesSql,
      queryKey: ['debugger-unused-indexes'],
    },
    signal
  )
  return result
}

export type UnusedIndexesData = Awaited<ReturnType<typeof getUnusedIndexes>>
export type UnusedIndexesError = ExecuteSqlError

export const useUnusedIndexesQuery = <TData = UnusedIndexesData>(
  { projectRef, connectionString }: UnusedIndexesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<UnusedIndexesData, UnusedIndexesError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<UnusedIndexesData, UnusedIndexesError, TData>({
    queryKey: databaseKeys.debuggerUnusedIndexes(projectRef),
    queryFn: ({ signal }) => getUnusedIndexes({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
