import { safeSql } from '@supabase/pg-meta/src/pg-format'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from '../keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { UseCustomQueryOptions } from '@/types'

export type DbStatsVariables = {
  projectRef?: string
  connectionString?: string | null
}

export interface DbStatsRow {
  database_size: string
  total_index_size: string
  total_table_size: string
  total_toast_size: string
  time_since_stats_reset: string
  index_hit_rate: string
  table_hit_rate: string
  wal_size: string
}

export const dbStatsSql = safeSql`
WITH total_objects AS (
  SELECT c.relkind, pg_size_pretty(SUM(pg_relation_size(c.oid))) AS size
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('i', 'r', 't')
    AND n.nspname NOT LIKE 'pg_%'
    AND n.nspname NOT IN (
      'information_schema','_analytics','_realtime','_supavisor',
      'auth','etl','extensions','pgbouncer','realtime','storage',
      'supabase_functions','supabase_migrations','cron','dbdev',
      'graphql','graphql_public','net','pgmq','pgsodium','pgsodium_masks',
      'pgtle','repack','tiger','tiger_data','topology'
    )
    AND n.nspname NOT LIKE 'timescaledb_%'
    AND n.nspname NOT LIKE '_timescaledb_%'
  GROUP BY c.relkind
), cache_hit AS (
  SELECT
    'i' AS relkind,
    ROUND(SUM(idx_blks_hit)::numeric / NULLIF(SUM(idx_blks_hit + idx_blks_read), 0), 2) AS ratio
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
  UNION
  SELECT
    't' AS relkind,
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
      2
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
)
SELECT
  pg_size_pretty(pg_database_size(current_database())) AS database_size,
  COALESCE((SELECT size FROM total_objects WHERE relkind = 'i'), '0 bytes') AS total_index_size,
  COALESCE((SELECT size FROM total_objects WHERE relkind = 'r'), '0 bytes') AS total_table_size,
  COALESCE((SELECT size FROM total_objects WHERE relkind = 't'), '0 bytes') AS total_toast_size,
  COALESCE((SELECT (now() - stats_reset)::text FROM extensions.pg_stat_statements_info), 'N/A') AS time_since_stats_reset,
  (SELECT COALESCE(ratio::text, 'N/A') FROM cache_hit WHERE relkind = 'i') AS index_hit_rate,
  (SELECT COALESCE(ratio::text, 'N/A') FROM cache_hit WHERE relkind = 't') AS table_hit_rate,
  COALESCE((SELECT pg_size_pretty(SUM(size)) FROM pg_ls_waldir()), '0 bytes') AS wal_size
`

export async function getDbStats(
  { projectRef, connectionString }: DbStatsVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql<DbStatsRow[]>(
    {
      projectRef,
      connectionString,
      sql: dbStatsSql,
      queryKey: ['debugger-db-stats'],
    },
    signal
  )
  return result
}

export type DbStatsData = Awaited<ReturnType<typeof getDbStats>>
export type DbStatsError = ExecuteSqlError

export const useDbStatsQuery = <TData = DbStatsData>(
  { projectRef, connectionString }: DbStatsVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<DbStatsData, DbStatsError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<DbStatsData, DbStatsError, TData>({
    queryKey: databaseKeys.debuggerDbStats(projectRef),
    queryFn: ({ signal }) => getDbStats({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
