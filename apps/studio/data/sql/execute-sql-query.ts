import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query'

import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import type { ResponseError } from 'types'
import { executeSql } from './execute-sql'
import { sqlKeys } from './keys'

export type ExecuteSqlVariables = {
  projectRef?: string
  connectionString?: string | null
  sql: string
  queryKey?: QueryKey
  handleError?: (error: ResponseError) => { result: any }
  isRoleImpersonationEnabled?: boolean
  isStatementTimeoutDisabled?: boolean
  autoLimit?: number
  contextualInvalidation?: boolean
}

export type ExecuteSqlData = Awaited<ReturnType<typeof executeSql<any[]>>>
export type ExecuteSqlError = ResponseError

/**
 * @deprecated Use the regular useQuery with a function that calls executeSql() instead
 */
export const useExecuteSqlQuery = <TData = ExecuteSqlData>(
  {
    projectRef,
    connectionString,
    sql,
    queryKey,
    handleError,
    isRoleImpersonationEnabled,
  }: ExecuteSqlVariables,
  { enabled = true, ...options }: UseQueryOptions<ExecuteSqlData, ExecuteSqlError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<ExecuteSqlData, ExecuteSqlError, TData>(
    sqlKeys.query(projectRef, queryKey ?? [btoa(sql)]),
    ({ signal }) =>
      executeSql(
        { projectRef, connectionString, sql, queryKey, handleError, isRoleImpersonationEnabled },
        signal
      ),
    { enabled: enabled && typeof projectRef !== 'undefined' && isActive, staleTime: 0, ...options }
  )
}
