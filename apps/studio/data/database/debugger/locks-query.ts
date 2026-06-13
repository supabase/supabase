import { safeSql } from '@supabase/pg-meta/src/pg-format'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from '../keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { UseCustomQueryOptions } from '@/types'

export type LocksVariables = {
  projectRef?: string
  connectionString?: string | null
}

export interface LocksRow {
  pid: number
  relname: string
  transactionid: string
  granted: boolean
  stmt: string
  age: string
}

export const locksSql = safeSql`
SELECT
  pg_stat_activity.pid,
  COALESCE(pg_class.relname, 'null') AS relname,
  COALESCE(pg_locks.transactionid::text, 'null') AS transactionid,
  pg_locks.granted,
  pg_stat_activity.query AS stmt,
  age(now(), pg_stat_activity.query_start)::text AS age
FROM pg_stat_activity, pg_locks LEFT OUTER JOIN pg_class ON (pg_locks.relation = pg_class.oid)
WHERE pg_stat_activity.query <> '<insufficient privilege>'
AND pg_locks.pid = pg_stat_activity.pid
AND pg_locks.mode = 'ExclusiveLock'
ORDER BY query_start
`

export async function getLocks(
  { projectRef, connectionString }: LocksVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql<LocksRow[]>(
    {
      projectRef,
      connectionString,
      sql: locksSql,
      queryKey: ['debugger-locks'],
    },
    signal
  )
  return result
}

export type LocksData = Awaited<ReturnType<typeof getLocks>>
export type LocksError = ExecuteSqlError

export const useLocksQuery = <TData = LocksData>(
  { projectRef, connectionString }: LocksVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<LocksData, LocksError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<LocksData, LocksError, TData>({
    queryKey: databaseKeys.debuggerLocks(projectRef),
    queryFn: ({ signal }) => getLocks({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
