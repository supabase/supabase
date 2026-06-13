import { safeSql } from '@supabase/pg-meta/src/pg-format'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from '../keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { UseCustomQueryOptions } from '@/types'

export type TrafficProfileVariables = {
  projectRef?: string
  connectionString?: string | null
}

export interface TrafficProfileRow {
  schemaname: string
  table_name: string
  blocks_read: number
  write_tuples: number
  blocks_write: number
  activity_ratio: string
}

export const trafficProfileSql = safeSql`
WITH
ratio_target AS (SELECT 5 AS ratio),
table_list AS (
  SELECT
    s.schemaname,
    s.relname AS table_name,
    si.heap_blks_read + si.idx_blks_read AS blocks_read,
    s.n_tup_ins + s.n_tup_upd + s.n_tup_del AS write_tuples,
    relpages * (s.n_tup_ins + s.n_tup_upd + s.n_tup_del) / (CASE WHEN reltuples = 0 THEN 1 ELSE reltuples END) AS blocks_write
  FROM pg_stat_user_tables AS s
  JOIN pg_statio_user_tables AS si ON s.relid = si.relid
  JOIN pg_class c ON c.oid = s.relid
  WHERE (s.n_tup_ins + s.n_tup_upd + s.n_tup_del) > 0
    AND (si.heap_blks_read + si.idx_blks_read) > 0
)
SELECT
  schemaname,
  table_name,
  blocks_read,
  write_tuples,
  blocks_write,
  CASE
    WHEN blocks_read = 0 AND blocks_write = 0 THEN 'No Activity'
    WHEN blocks_write * ratio > blocks_read THEN
      CASE
        WHEN blocks_read = 0 THEN 'Write-Only'
        ELSE ROUND(blocks_write::numeric / blocks_read::numeric, 1)::text || ':1 (Write-Heavy)'
      END
    WHEN blocks_read > blocks_write * ratio THEN
      CASE
        WHEN blocks_write = 0 THEN 'Read-Only'
        ELSE '1:' || ROUND(blocks_read::numeric / blocks_write::numeric, 1)::text || ' (Read-Heavy)'
      END
    ELSE '1:1 (Balanced)'
  END AS activity_ratio
FROM table_list, ratio_target
ORDER BY (blocks_read + blocks_write) DESC
`

export async function getTrafficProfile(
  { projectRef, connectionString }: TrafficProfileVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql<TrafficProfileRow[]>(
    {
      projectRef,
      connectionString,
      sql: trafficProfileSql,
      queryKey: ['debugger-traffic-profile'],
    },
    signal
  )
  return result
}

export type TrafficProfileData = Awaited<ReturnType<typeof getTrafficProfile>>
export type TrafficProfileError = ExecuteSqlError

export const useTrafficProfileQuery = <TData = TrafficProfileData>(
  { projectRef, connectionString }: TrafficProfileVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<TrafficProfileData, TrafficProfileError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<TrafficProfileData, TrafficProfileError, TData>({
    queryKey: databaseKeys.debuggerTrafficProfile(projectRef),
    queryFn: ({ signal }) => getTrafficProfile({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
