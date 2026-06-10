import { safeSql } from '@supabase/pg-meta/src/pg-format'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from '../keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { UseCustomQueryOptions } from '@/types'

export type VacuumStatsVariables = {
  projectRef?: string
  connectionString?: string | null
}

export interface VacuumStatsRow {
  name: string
  last_vacuum: string
  last_autovacuum: string
  last_analyze: string
  last_autoanalyze: string
  rowcount: string
  dead_rowcount: string
  autovacuum_threshold: string
  expect_autovacuum: string
  autoanalyze_threshold: string
  expect_autoanalyze: string
}

export const vacuumStatsSql = safeSql`
WITH table_opts AS (
  SELECT
    pg_class.oid, relname, nspname, array_to_string(reloptions, '') AS relopts
  FROM
    pg_class INNER JOIN pg_namespace ns ON relnamespace = ns.oid
), vacuum_settings AS (
  SELECT
    oid, relname, nspname,
    CASE
      WHEN relopts LIKE '%autovacuum_vacuum_threshold%'
        THEN substring(relopts, '.*autovacuum_vacuum_threshold=([0-9.]+).*')::integer
        ELSE current_setting('autovacuum_vacuum_threshold')::integer
      END AS autovacuum_vacuum_threshold,
    CASE
      WHEN relopts LIKE '%autovacuum_vacuum_scale_factor%'
        THEN substring(relopts, '.*autovacuum_vacuum_scale_factor=([0-9.]+).*')::real
        ELSE current_setting('autovacuum_vacuum_scale_factor')::real
      END AS autovacuum_vacuum_scale_factor,
    CASE
      WHEN relopts LIKE '%autovacuum_analyze_threshold%'
        THEN substring(relopts, '.*autovacuum_analyze_threshold=([0-9.]+).*')::integer
        ELSE current_setting('autovacuum_analyze_threshold')::integer
      END AS autovacuum_analyze_threshold,
    CASE
      WHEN relopts LIKE '%autovacuum_analyze_scale_factor%'
        THEN substring(relopts, '.*autovacuum_analyze_scale_factor=([0-9.]+).*')::real
        ELSE current_setting('autovacuum_analyze_scale_factor')::real
      END AS autovacuum_analyze_scale_factor
  FROM
    table_opts
)
SELECT
  FORMAT('%I.%I', vacuum_settings.nspname, vacuum_settings.relname) AS name,
  coalesce(to_char(psut.last_vacuum, 'YYYY-MM-DD HH24:MI'), '') AS last_vacuum,
  coalesce(to_char(psut.last_autovacuum, 'YYYY-MM-DD HH24:MI'), '') AS last_autovacuum,
  coalesce(to_char(psut.last_analyze, 'YYYY-MM-DD HH24:MI'), '') AS last_analyze,
  coalesce(to_char(psut.last_autoanalyze, 'YYYY-MM-DD HH24:MI'), '') AS last_autoanalyze,
  to_char(pg_class.reltuples, '9G999G999G999') AS rowcount,
  to_char(psut.n_dead_tup, '9G999G999G999') AS dead_rowcount,
  to_char(autovacuum_vacuum_threshold
       + (autovacuum_vacuum_scale_factor::numeric * pg_class.reltuples), '9G999G999G999') AS autovacuum_threshold,
  CASE
    WHEN autovacuum_vacuum_threshold + (autovacuum_vacuum_scale_factor::numeric * pg_class.reltuples) < psut.n_dead_tup
    THEN 'yes'
    ELSE 'no'
  END AS expect_autovacuum,
  to_char(autovacuum_analyze_threshold
       + (autovacuum_analyze_scale_factor::numeric * pg_class.reltuples), '9G999G999G999') AS autoanalyze_threshold,
  CASE
    WHEN autovacuum_analyze_threshold + (autovacuum_analyze_scale_factor::numeric * pg_class.reltuples) < psut.n_dead_tup
    THEN 'yes'
    ELSE 'no'
  END AS expect_autoanalyze
FROM
  pg_stat_user_tables psut INNER JOIN pg_class ON psut.relid = pg_class.oid
INNER JOIN vacuum_settings ON pg_class.oid = vacuum_settings.oid
WHERE vacuum_settings.nspname NOT LIKE 'pg_%'
  AND vacuum_settings.nspname NOT IN (
    'information_schema','_analytics','_realtime','_supavisor',
    'auth','etl','extensions','pgbouncer','realtime','storage',
    'supabase_functions','supabase_migrations','cron','dbdev',
    'graphql','graphql_public','net','pgmq','pgsodium','pgsodium_masks',
    'pgtle','repack','tiger','tiger_data','topology'
  )
  AND vacuum_settings.nspname NOT LIKE 'timescaledb_%'
  AND vacuum_settings.nspname NOT LIKE '_timescaledb_%'
ORDER BY
  case
    when pg_class.reltuples = -1 then 1
    else 0
  end,
  1
`

export async function getVacuumStats(
  { projectRef, connectionString }: VacuumStatsVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql<VacuumStatsRow[]>(
    {
      projectRef,
      connectionString,
      sql: vacuumStatsSql,
      queryKey: ['debugger-vacuum-stats'],
    },
    signal
  )
  return result
}

export type VacuumStatsData = Awaited<ReturnType<typeof getVacuumStats>>
export type VacuumStatsError = ExecuteSqlError

export const useVacuumStatsQuery = <TData = VacuumStatsData>(
  { projectRef, connectionString }: VacuumStatsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<VacuumStatsData, VacuumStatsError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<VacuumStatsData, VacuumStatsError, TData>({
    queryKey: databaseKeys.debuggerVacuumStats(projectRef),
    queryFn: ({ signal }) => getVacuumStats({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
