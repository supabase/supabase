import { safeSql } from '@supabase/pg-meta/src/pg-format'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from '../keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { UseCustomQueryOptions } from '@/types'

export type CacheHitVariables = {
  projectRef?: string
  connectionString?: string | null
}

export interface CacheHitRow {
  name: string
  ratio: string
}

/**
 * Reports buffer cache hit ratio for tables and indexes.
 * Values close to 1.00 are healthy; values below 0.99 may indicate memory pressure.
 */
export const cacheHitSql = safeSql`
SELECT
  'index hit rate' AS name,
  COALESCE(
    ROUND(
      SUM(idx_blks_hit)::numeric / NULLIF(SUM(idx_blks_hit + idx_blks_read), 0),
      4
    )::text,
    'N/A'
  ) AS ratio
FROM pg_statio_user_indexes
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
UNION ALL
SELECT
  'table hit rate' AS name,
  COALESCE(
    ROUND(
      SUM(
        COALESCE(
          (to_jsonb(s) ->> 'rel_blks_hit')::bigint,
          (to_jsonb(s) ->> 'heap_blks_hit')::bigint,
          0
        )
      )::numeric
      /
      NULLIF(
        SUM(
          COALESCE(
            (to_jsonb(s) ->> 'rel_blks_hit')::bigint,
            (to_jsonb(s) ->> 'heap_blks_hit')::bigint,
            0
          )
          +
          COALESCE(
            (to_jsonb(s) ->> 'rel_blks_read')::bigint,
            (to_jsonb(s) ->> 'heap_blks_read')::bigint,
            0
          )
        ),
        0
      ),
      4
    )::text,
    'N/A'
  ) AS ratio
FROM pg_statio_user_tables s
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
`

export async function getCacheHit(
  { projectRef, connectionString }: CacheHitVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql<CacheHitRow[]>(
    {
      projectRef,
      connectionString,
      sql: cacheHitSql,
      queryKey: ['debugger-cache-hit'],
    },
    signal
  )
  return result
}

export type CacheHitData = Awaited<ReturnType<typeof getCacheHit>>
export type CacheHitError = ExecuteSqlError

export const useCacheHitQuery = <TData = CacheHitData>(
  { projectRef, connectionString }: CacheHitVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<CacheHitData, CacheHitError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<CacheHitData, CacheHitError, TData>({
    queryKey: databaseKeys.debuggerCacheHit(projectRef),
    queryFn: ({ signal }) => getCacheHit({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
