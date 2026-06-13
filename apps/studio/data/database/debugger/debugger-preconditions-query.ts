import { safeSql } from '@supabase/pg-meta/src/pg-format'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from '../keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { UseCustomQueryOptions } from '@/types'

export type DebuggerPreconditionsVariables = {
  projectRef?: string
  connectionString?: string | null
}

export interface DebuggerPreconditionsResult {
  /** Whether pg_stat_statements extension is installed and enabled. */
  hasPgStatStatements: boolean
  /**
   * Whether the current role can read pg_stat_activity and pg_locks.
   * Best-effort: false when a permission error is caught, true otherwise.
   */
  canReadStats: boolean
}

const pgStatStatementsCheckSql = safeSql`
SELECT EXISTS (
  SELECT 1
  FROM pg_extension
  WHERE extname = 'pg_stat_statements'
) AS has_pg_stat_statements
`

const statsReadCheckSql = safeSql`
SELECT count(*) AS accessible_rows FROM pg_stat_activity LIMIT 1
`

export async function getDebuggerPreconditions(
  { projectRef, connectionString }: DebuggerPreconditionsVariables,
  signal?: AbortSignal
): Promise<DebuggerPreconditionsResult> {
  const [extensionResult, statsResult] = await Promise.all([
    executeSql<{ has_pg_stat_statements: boolean }[]>(
      {
        projectRef,
        connectionString,
        sql: pgStatStatementsCheckSql,
        queryKey: ['debugger-preconditions-pg-stat-statements'],
      },
      signal
    ).catch(() => ({ result: [{ has_pg_stat_statements: false }] })),
    executeSql<{ accessible_rows: number }[]>(
      {
        projectRef,
        connectionString,
        sql: statsReadCheckSql,
        queryKey: ['debugger-preconditions-stats-read'],
      },
      signal
    ).catch(() => null),
  ])

  return {
    hasPgStatStatements: extensionResult.result?.[0]?.has_pg_stat_statements === true,
    canReadStats: statsResult !== null,
  }
}

export type DebuggerPreconditionsData = Awaited<ReturnType<typeof getDebuggerPreconditions>>
export type DebuggerPreconditionsError = ExecuteSqlError

export const useDebuggerPreconditionsQuery = <TData = DebuggerPreconditionsData>(
  { projectRef, connectionString }: DebuggerPreconditionsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<DebuggerPreconditionsData, DebuggerPreconditionsError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<DebuggerPreconditionsData, DebuggerPreconditionsError, TData>({
    queryKey: databaseKeys.debuggerPreconditions(projectRef),
    queryFn: ({ signal }) => getDebuggerPreconditions({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
