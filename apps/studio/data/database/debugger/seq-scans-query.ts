import { safeSql } from '@supabase/pg-meta/src/pg-format'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from '../keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { UseCustomQueryOptions } from '@/types'

export type SeqScansVariables = {
  projectRef?: string
  connectionString?: string | null
}

export interface SeqScansRow {
  name: string
  count: number
}

/**
 * Tables ordered by sequential scan count. High seq_scan on large tables
 * typically indicates a missing index.
 */
export const seqScansSql = safeSql`
SELECT
  FORMAT('%I.%I', schemaname, relname) AS name,
  seq_scan AS count
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
ORDER BY seq_scan DESC
`

export async function getSeqScans(
  { projectRef, connectionString }: SeqScansVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql<SeqScansRow[]>(
    {
      projectRef,
      connectionString,
      sql: seqScansSql,
      queryKey: ['debugger-seq-scans'],
    },
    signal
  )
  return result
}

export type SeqScansData = Awaited<ReturnType<typeof getSeqScans>>
export type SeqScansError = ExecuteSqlError

export const useSeqScansQuery = <TData = SeqScansData>(
  { projectRef, connectionString }: SeqScansVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<SeqScansData, SeqScansError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<SeqScansData, SeqScansError, TData>({
    queryKey: databaseKeys.debuggerSeqScans(projectRef),
    queryFn: ({ signal }) => getSeqScans({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
