import { safeSql } from '@supabase/pg-meta/src/pg-format'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from '../keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { UseCustomQueryOptions } from '@/types'

export type BloatVariables = {
  projectRef?: string
  connectionString?: string | null
}

export interface BloatRow {
  type: string
  name: string
  bloat: string
  waste: string
}

/**
 * Schema patterns excluded from bloat analysis, matching the CLI's InternalSchemas list.
 * Uses SQL LIKE syntax so pg_* covers all pg_ prefixed schemas.
 */
export const bloatSql = safeSql`
WITH constants AS (
  SELECT current_setting('block_size')::numeric AS bs, 23 AS hdr, 4 AS ma
), bloat_info AS (
  SELECT
    ma,bs,schemaname,tablename,
    (datawidth+(hdr+ma-(case when hdr%ma=0 THEN ma ELSE hdr%ma END)))::numeric AS datahdr,
    (maxfracsum*(nullhdr+ma-(case when nullhdr%ma=0 THEN ma ELSE nullhdr%ma END))) AS nullhdr2
  FROM (
    SELECT
      schemaname, tablename, hdr, ma, bs,
      SUM((1-null_frac)*avg_width) AS datawidth,
      MAX(null_frac) AS maxfracsum,
      hdr+(
        SELECT 1+count(*)/8
        FROM pg_stats s2
        WHERE null_frac<>0 AND s2.schemaname = s.schemaname AND s2.tablename = s.tablename
      ) AS nullhdr
    FROM pg_stats s, constants
    GROUP BY 1,2,3,4,5
  ) AS foo
), table_bloat AS (
  SELECT
    schemaname, tablename, cc.relpages, bs,
    CEIL((cc.reltuples*((datahdr+ma-
      (CASE WHEN datahdr%ma=0 THEN ma ELSE datahdr%ma END))+nullhdr2+4))/(bs-20::float)) AS otta
  FROM bloat_info
  JOIN pg_class cc ON cc.relname = bloat_info.tablename
  JOIN pg_namespace nn ON cc.relnamespace = nn.oid AND nn.nspname = bloat_info.schemaname
  WHERE nn.nspname NOT LIKE 'pg_%'
    AND nn.nspname NOT IN (
      'information_schema','_analytics','_realtime','_supavisor',
      'auth','etl','extensions','pgbouncer','realtime','storage',
      'supabase_functions','supabase_migrations','cron','dbdev',
      'graphql','graphql_public','net','pgmq','pgsodium','pgsodium_masks',
      'pgtle','repack','tiger','tiger_data','topology'
    )
    AND nn.nspname NOT LIKE 'timescaledb_%'
    AND nn.nspname NOT LIKE '_timescaledb_%'
), index_bloat AS (
  SELECT
    schemaname, tablename, bs,
    COALESCE(c2.relname,'?') AS iname, COALESCE(c2.reltuples,0) AS ituples, COALESCE(c2.relpages,0) AS ipages,
    COALESCE(CEIL((c2.reltuples*(datahdr-12))/(bs-20::float)),0) AS iotta
  FROM bloat_info
  JOIN pg_class cc ON cc.relname = bloat_info.tablename
  JOIN pg_namespace nn ON cc.relnamespace = nn.oid AND nn.nspname = bloat_info.schemaname
  JOIN pg_index i ON indrelid = cc.oid
  JOIN pg_class c2 ON c2.oid = i.indexrelid
  WHERE nn.nspname NOT LIKE 'pg_%'
    AND nn.nspname NOT IN (
      'information_schema','_analytics','_realtime','_supavisor',
      'auth','etl','extensions','pgbouncer','realtime','storage',
      'supabase_functions','supabase_migrations','cron','dbdev',
      'graphql','graphql_public','net','pgmq','pgsodium','pgsodium_masks',
      'pgtle','repack','tiger','tiger_data','topology'
    )
    AND nn.nspname NOT LIKE 'timescaledb_%'
    AND nn.nspname NOT LIKE '_timescaledb_%'
), bloat_summary AS (
  SELECT
    'table' as type,
    FORMAT('%I.%I', schemaname, tablename) AS name,
    ROUND(CASE WHEN otta=0 THEN 0.0 ELSE table_bloat.relpages/otta::numeric END,1)::text AS bloat,
    CASE WHEN relpages < otta THEN '0' ELSE (bs*(table_bloat.relpages-otta)::bigint)::bigint END AS raw_waste
  FROM table_bloat
  UNION
  SELECT
    'index' as type,
    FORMAT('%I.%I::%I', schemaname, tablename, iname) AS name,
    ROUND(CASE WHEN iotta=0 OR ipages=0 THEN 0.0 ELSE ipages/iotta::numeric END,1)::text AS bloat,
    CASE WHEN ipages < iotta THEN '0' ELSE (bs*(ipages-iotta))::bigint END AS raw_waste
  FROM index_bloat
)
SELECT type, name, bloat, pg_size_pretty(raw_waste) as waste
FROM bloat_summary
ORDER BY raw_waste DESC, bloat DESC
`

export async function getBloat(
  { projectRef, connectionString }: BloatVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql<BloatRow[]>(
    {
      projectRef,
      connectionString,
      sql: bloatSql,
      queryKey: ['debugger-bloat'],
    },
    signal
  )
  return result
}

export type BloatData = Awaited<ReturnType<typeof getBloat>>
export type BloatError = ExecuteSqlError

export const useBloatQuery = <TData = BloatData>(
  { projectRef, connectionString }: BloatVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<BloatData, BloatError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<BloatData, BloatError, TData>({
    queryKey: databaseKeys.debuggerBloat(projectRef),
    queryFn: ({ signal }) => getBloat({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
