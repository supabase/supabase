import { literal, safeSql } from '@supabase/pg-meta/src/pg-format'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from '../keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { UseCustomQueryOptions } from '@/types'

export type LongRunningQueriesVariables = {
  projectRef?: string
  connectionString?: string | null
  /** Postgres interval string, e.g. '5 minutes'. Defaults to '5 minutes'. */
  threshold?: string
}

export interface LongRunningQueriesRow {
  pid: number
  duration: string
  query: string
}

export function buildLongRunningQueriesSql(threshold = '5 minutes') {
  return safeSql`
SELECT
  pid,
  age(now(), pg_stat_activity.query_start)::text AS duration,
  query AS query
FROM
  pg_stat_activity
WHERE
  pg_stat_activity.query <> ''::text
  AND state <> 'idle'
  AND age(now(), pg_stat_activity.query_start) > interval ${literal(threshold)}
ORDER BY
  age(now(), pg_stat_activity.query_start) DESC
`
}

export async function getLongRunningQueries(
  { projectRef, connectionString, threshold }: LongRunningQueriesVariables,
  signal?: AbortSignal
) {
  const sql = buildLongRunningQueriesSql(threshold)
  const { result } = await executeSql<LongRunningQueriesRow[]>(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['debugger-long-running-queries', threshold ?? '5 minutes'],
    },
    signal
  )
  return result
}

export type LongRunningQueriesData = Awaited<ReturnType<typeof getLongRunningQueries>>
export type LongRunningQueriesError = ExecuteSqlError

export const useLongRunningQueriesQuery = <TData = LongRunningQueriesData>(
  { projectRef, connectionString, threshold }: LongRunningQueriesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<LongRunningQueriesData, LongRunningQueriesError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<LongRunningQueriesData, LongRunningQueriesError, TData>({
    queryKey: databaseKeys.debuggerLongRunningQueries(projectRef, threshold),
    queryFn: ({ signal }) =>
      getLongRunningQueries({ projectRef, connectionString, threshold }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
