import { safeSql } from '@supabase/pg-meta/src/pg-format'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from '../keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { UseCustomQueryOptions } from '@/types'

export type BlockingVariables = {
  projectRef?: string
  connectionString?: string | null
}

export interface BlockingRow {
  blocked_pid: number
  blocking_statement: string
  blocking_duration: string
  blocking_pid: number
  blocked_statement: string
  blocked_duration: string
}

export const blockingSql = safeSql`
SELECT
  bl.pid AS blocked_pid,
  ka.query AS blocking_statement,
  age(now(), ka.query_start)::text AS blocking_duration,
  kl.pid AS blocking_pid,
  a.query AS blocked_statement,
  age(now(), a.query_start)::text AS blocked_duration
FROM pg_catalog.pg_locks bl
JOIN pg_catalog.pg_stat_activity a
  ON bl.pid = a.pid
JOIN pg_catalog.pg_locks kl
JOIN pg_catalog.pg_stat_activity ka
  ON kl.pid = ka.pid
  ON bl.transactionid = kl.transactionid AND bl.pid != kl.pid
WHERE NOT bl.granted
`

export async function getBlocking(
  { projectRef, connectionString }: BlockingVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql<BlockingRow[]>(
    {
      projectRef,
      connectionString,
      sql: blockingSql,
      queryKey: ['debugger-blocking'],
    },
    signal
  )
  return result
}

export type BlockingData = Awaited<ReturnType<typeof getBlocking>>
export type BlockingError = ExecuteSqlError

export const useBlockingQuery = <TData = BlockingData>(
  { projectRef, connectionString }: BlockingVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<BlockingData, BlockingError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<BlockingData, BlockingError, TData>({
    queryKey: databaseKeys.debuggerBlocking(projectRef),
    queryFn: ({ signal }) => getBlocking({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
