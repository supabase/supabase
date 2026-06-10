import { safeSql } from '@supabase/pg-meta/src/pg-format'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from '../keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { UseCustomQueryOptions } from '@/types'

export type IndexStatsVariables = {
  projectRef?: string
  connectionString?: string | null
}

export interface IndexStatsRow {
  name: string
  size: string
  percent_used: string
  index_scans: number
  seq_scans: number
  unused: boolean
}

export const indexStatsSql = safeSql`
WITH idx_sizes AS (
  SELECT
    i.indexrelid AS oid,
    FORMAT('%I.%I', n.nspname, c.relname) AS name,
    pg_relation_size(i.indexrelid) AS index_size_bytes
  FROM pg_stat_user_indexes ui
  JOIN pg_index i ON ui.indexrelid = i.indexrelid
  JOIN pg_class c ON ui.indexrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
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
),
idx_usage AS (
  SELECT
    indexrelid AS oid,
    idx_scan::bigint AS idx_scans
  FROM pg_stat_user_indexes ui
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
),
seq_usage AS (
  SELECT
    relid AS oid,
    seq_scan::bigint AS seq_scans
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
),
usage_pct AS (
  SELECT
    u.oid,
    CASE
      WHEN u.idx_scans IS NULL OR u.idx_scans = 0 THEN 0
      WHEN s.seq_scans IS NULL THEN 100
      ELSE ROUND(100.0 * u.idx_scans / (s.seq_scans + u.idx_scans), 1)
    END AS percent_used
  FROM idx_usage u
  LEFT JOIN seq_usage s ON s.oid = u.oid
)
SELECT
  s.name,
  pg_size_pretty(s.index_size_bytes) AS size,
  COALESCE(up.percent_used, 0)::text || '%' AS percent_used,
  COALESCE(u.idx_scans, 0) AS index_scans,
  COALESCE(sq.seq_scans, 0) AS seq_scans,
  CASE WHEN COALESCE(u.idx_scans, 0) = 0 THEN true ELSE false END AS unused
FROM idx_sizes s
LEFT JOIN idx_usage u ON u.oid = s.oid
LEFT JOIN seq_usage sq ON sq.oid = s.oid
LEFT JOIN usage_pct up ON up.oid = s.oid
ORDER BY s.index_size_bytes DESC
`

export async function getIndexStats(
  { projectRef, connectionString }: IndexStatsVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql<IndexStatsRow[]>(
    {
      projectRef,
      connectionString,
      sql: indexStatsSql,
      queryKey: ['debugger-index-stats'],
    },
    signal
  )
  return result
}

export type IndexStatsData = Awaited<ReturnType<typeof getIndexStats>>
export type IndexStatsError = ExecuteSqlError

export const useIndexStatsQuery = <TData = IndexStatsData>(
  { projectRef, connectionString }: IndexStatsVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<IndexStatsData, IndexStatsError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<IndexStatsData, IndexStatsError, TData>({
    queryKey: databaseKeys.debuggerIndexStats(projectRef),
    queryFn: ({ signal }) => getIndexStats({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
