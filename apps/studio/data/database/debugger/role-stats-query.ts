import { safeSql } from '@supabase/pg-meta/src/pg-format'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from '../keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { UseCustomQueryOptions } from '@/types'

export type RoleStatsVariables = {
  projectRef?: string
  connectionString?: string | null
}

export interface RoleStatsRow {
  role_name: string
  active_connections: number
  connection_limit: number
  custom_config: string
}

export const roleStatsSql = safeSql`
SELECT
  rolname AS role_name,
  (
    SELECT count(*)
    FROM pg_stat_activity
    WHERE pg_roles.rolname = pg_stat_activity.usename
  ) AS active_connections,
  CASE WHEN rolconnlimit = -1
    THEN current_setting('max_connections')::int8
    ELSE rolconnlimit
  END AS connection_limit,
  array_to_string(rolconfig, ',', '*') AS custom_config
FROM pg_roles
ORDER BY 1 DESC
`

export async function getRoleStats(
  { projectRef, connectionString }: RoleStatsVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql<RoleStatsRow[]>(
    {
      projectRef,
      connectionString,
      sql: roleStatsSql,
      queryKey: ['debugger-role-stats'],
    },
    signal
  )
  return result
}

export type RoleStatsData = Awaited<ReturnType<typeof getRoleStats>>
export type RoleStatsError = ExecuteSqlError

export const useRoleStatsQuery = <TData = RoleStatsData>(
  { projectRef, connectionString }: RoleStatsVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<RoleStatsData, RoleStatsError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<RoleStatsData, RoleStatsError, TData>({
    queryKey: databaseKeys.debuggerRoleStats(projectRef),
    queryFn: ({ signal }) => getRoleStats({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
