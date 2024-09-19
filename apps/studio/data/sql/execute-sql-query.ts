import { QueryClient, QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query'

import { handleError as handleErrorFetchers, post } from 'data/fetchers'
import {
  ROLE_IMPERSONATION_NO_RESULTS,
  ROLE_IMPERSONATION_SQL_LINE_COUNT,
} from 'lib/role-impersonation'
import type { ResponseError } from 'types'
import { sqlKeys } from './keys'
import { MB } from 'lib/constants'

export type ExecuteSqlVariables = {
  projectRef?: string
  connectionString?: string
  sql: string
  queryKey?: QueryKey
  handleError?: (error: ResponseError) => { result: any }
  isRoleImpersonationEnabled?: boolean
  autoLimit?: number
}

export async function executeSql(
  {
    projectRef,
    connectionString,
    sql,
    queryKey,
    handleError,
    isRoleImpersonationEnabled = false,
  }: Pick<
    ExecuteSqlVariables,
    | 'projectRef'
    | 'connectionString'
    | 'sql'
    | 'queryKey'
    | 'handleError'
    | 'isRoleImpersonationEnabled'
  >,
  signal?: AbortSignal
): Promise<{ result: any }> {
  if (!projectRef) throw new Error('projectRef is required')

  const sqlSize = new Blob([sql]).size
  // [Joshen] I think the limit is around 1MB from testing, but its not exactly 1MB it seems
  if (sqlSize > 0.98 * MB) {
    throw new Error('Query is too large to be run via the SQL Editor')
  }

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  let { data, error } = await post('/platform/pg-meta/{ref}/query', {
    signal,
    params: {
      header: { 'x-connection-encrypted': connectionString ?? '' },
      path: { ref: projectRef },
      // @ts-ignore: This is just a client side thing to identify queries better
      query: { key: queryKey?.filter((seg) => typeof seg === 'string').join('-') ?? '' },
    },
    body: { query: sql },
    headers: Object.fromEntries(headers),
  } as any) // Needed to fix generated api types for now

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
    return { result: [] }
  }

  return { result: data }
}

export type ExecuteSqlData = Awaited<ReturnType<typeof executeSql>>
export type ExecuteSqlError = ResponseError

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
) =>
  useQuery<ExecuteSqlData, ExecuteSqlError, TData>(
    sqlKeys.query(projectRef, queryKey ?? [btoa(sql)]),
    ({ signal }) =>
      executeSql(
        { projectRef, connectionString, sql, queryKey, handleError, isRoleImpersonationEnabled },
        signal
      ),
    { enabled: enabled && typeof projectRef !== 'undefined', staleTime: 0, ...options }
  )

export const prefetchExecuteSql = (
  client: QueryClient,
  { projectRef, connectionString, sql, queryKey, handleError }: ExecuteSqlVariables
) => {
  return client.prefetchQuery(sqlKeys.query(projectRef, queryKey ?? [btoa(sql)]), ({ signal }) =>
    executeSql({ projectRef, connectionString, sql, queryKey, handleError }, signal)
  )
}
