import {
  QueryClient,
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query'
import md5 from 'blueimp-md5'
import { useCallback } from 'react'

import { post } from 'data/fetchers'
import {
  ROLE_IMPERSONATION_NO_RESULTS,
  ROLE_IMPERSONATION_SQL_LINE_COUNT,
} from 'lib/role-impersonation'
import { sqlKeys } from './keys'

export type Error = { code: number; message: string; requestId: string }

export type ExecuteSqlVariables = {
  projectRef?: string
  connectionString?: string
  sql: string
  queryKey?: QueryKey
  handleError?: (error: { code: number; message: string; requestId: string }) => any
  isRoleImpersonationEnabled?: boolean
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
  })

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
    else throw error
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
export type ExecuteSqlError = unknown

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
    sqlKeys.query(projectRef, queryKey ?? [md5(sql)]),
    ({ signal }) =>
      executeSql(
        { projectRef, connectionString, sql, queryKey, handleError, isRoleImpersonationEnabled },
        signal
      ),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )

export const prefetchExecuteSql = (
  client: QueryClient,
  { projectRef, connectionString, sql, queryKey, handleError }: ExecuteSqlVariables
) => {
  return client.prefetchQuery(sqlKeys.query(projectRef, queryKey ?? [md5(sql)]), ({ signal }) =>
    executeSql({ projectRef, connectionString, sql, queryKey, handleError }, signal)
  )
}

/**
 * useExecuteSqlPrefetch is used for prefetching a SQL query. For example, starting a query loading before a page is navigated to.
 *
 * @example
 * const prefetch = useExecuteSqlPrefetch()
 *
 * return (
 *   <Link onMouseEnter={() => prefetch({ ...args })}>
 *     Start loading on hover
 *   </Link>
 * )
 */
export const useExecuteSqlPrefetch = () => {
  const client = useQueryClient()

  return useCallback(
    ({ projectRef, connectionString, sql, queryKey, handleError }: ExecuteSqlVariables) => {
      if (projectRef) {
        return prefetchExecuteSql(client, {
          projectRef,
          connectionString,
          sql,
          queryKey,
          handleError,
        })
      }

      return Promise.resolve()
    },
    [client]
  )
}
