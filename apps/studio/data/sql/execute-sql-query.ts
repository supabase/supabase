import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query'

import { handleError as handleErrorFetchers, post } from 'data/fetchers'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { MB, PROJECT_STATUS } from 'lib/constants'
import {
  ROLE_IMPERSONATION_NO_RESULTS,
  ROLE_IMPERSONATION_SQL_LINE_COUNT,
} from 'lib/role-impersonation'
import type { ResponseError } from 'types'
import { sqlKeys } from './keys'
import { DEFAULT_PLATFORM_APPLICATION_NAME } from '@supabase/pg-meta/src/constants'

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

export async function executeSql<T = any>(
  {
    projectRef,
    connectionString,
    sql,
    queryKey,
    handleError,
    isRoleImpersonationEnabled = false,
    isStatementTimeoutDisabled = false,
  }: Pick<
    ExecuteSqlVariables,
    | 'projectRef'
    | 'connectionString'
    | 'sql'
    | 'queryKey'
    | 'handleError'
    | 'isRoleImpersonationEnabled'
    | 'isStatementTimeoutDisabled'
  >,
  signal?: AbortSignal,
  headersInit?: HeadersInit,
  fetcherOverride?: (
    sql: string,
    headers?: HeadersInit
  ) => Promise<{ data: T } | { error: ResponseError }>
): Promise<{ result: T }> {
  if (!projectRef) throw new Error('projectRef is required')

  const sqlSize = new Blob([sql]).size
  // [Joshen] I think the limit is around 1MB from testing, but its not exactly 1MB it seems
  if (sqlSize > 0.98 * MB) {
    throw new Error('Query is too large to be run via the SQL Editor')
  }

  let headers = new Headers(headersInit)
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  let data
  let error

  if (fetcherOverride) {
    const result = await fetcherOverride(sql, headers)
    if ('data' in result) {
      data = result.data
    } else {
      error = result.error
    }
  } else {
    const result = await post('/platform/pg-meta/{ref}/query', {
      signal,
      params: {
        header: {
          'x-connection-encrypted': connectionString ?? '',
          'x-pg-application-name': isStatementTimeoutDisabled
            ? 'supabase/dashboard-query-editor'
            : DEFAULT_PLATFORM_APPLICATION_NAME,
        },
        path: { ref: projectRef },
        // @ts-expect-error: This is just a client side thing to identify queries better
        query: {
          key:
            queryKey
              ?.filter((seg) => typeof seg === 'string' || typeof seg === 'number')
              .join('-') ?? '',
        },
      },
      body: { query: sql, disable_statement_timeout: isStatementTimeoutDisabled },
      headers,
    })

    data = result.data
    error = result.error
  }

  if (error) {
    if (
      isRoleImpersonationEnabled &&
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      'formattedError' in error
    ) {
      let updatedError = error as { error: string; formattedError: string }

      const regex = /LINE (\d+):/im
      const [, lineNumberStr] = regex.exec(updatedError.error) ?? []
      const lineNumber = Number(lineNumberStr)
      if (!isNaN(lineNumber)) {
        updatedError = {
          ...updatedError,
          error: updatedError.error.replace(
            regex,
            `LINE ${lineNumber - ROLE_IMPERSONATION_SQL_LINE_COUNT}:`
          ),
          formattedError: updatedError.formattedError.replace(
            regex,
            `LINE ${lineNumber - ROLE_IMPERSONATION_SQL_LINE_COUNT}:`
          ),
        }
      }

      error = updatedError as any
    }

    if (handleError !== undefined) return handleError(error as any)
    else handleErrorFetchers(error)
  }

  if (
    isRoleImpersonationEnabled &&
    Array.isArray(data) &&
    data?.[0]?.[ROLE_IMPERSONATION_NO_RESULTS] === 1
  ) {
    return { result: [] as T }
  }

  return { result: data as T }
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
  const project = useSelectedProject()
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
