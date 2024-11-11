import { QueryClient, QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { useRouter } from 'next/router'

import { handleError as handleErrorFetchers, post } from 'data/fetchers'
import {
  ROLE_IMPERSONATION_NO_RESULTS,
  ROLE_IMPERSONATION_SQL_LINE_COUNT,
} from 'lib/role-impersonation'
import type { ResponseError } from 'types'
import { sqlKeys } from './keys'
import { MB } from 'lib/constants'
import sqlExecutionsStoreState, { type SqlExecution } from 'state/sql-executions'
import { Router } from 'lucide-react'

export type ExecuteSqlVariables = {
  projectRef?: string
  connectionString?: string
  sql: string
  queryKey?: QueryKey
  handleError?: (error: ResponseError) => { result: any }
  isRoleImpersonationEnabled?: boolean
  autoLimit?: number
  url?: string
}

export async function executeSql(
  {
    projectRef,
    connectionString,
    sql,
    queryKey,
    handleError,
    isRoleImpersonationEnabled = false,
    url,
  }: Pick<
    ExecuteSqlVariables,
    | 'projectRef'
    | 'connectionString'
    | 'sql'
    | 'queryKey'
    | 'handleError'
    | 'isRoleImpersonationEnabled'
    | 'url'
  >,
  signal?: AbortSignal
): Promise<{ result: any }> {
  if (!projectRef) throw new Error('projectRef is required')

  const execution: SqlExecution = {
    queryKey,
    sql,
    startedAt: Date.now(),
    status: 'running',
    url,
  }
  var executionIndex = sqlExecutionsStoreState.addExecution(execution)

  const sqlSize = new Blob([sql]).size
  if (sqlSize > 0.98 * MB) {
    throw new Error('Query is too large to be run via the SQL Editor')
  }

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  try {
    let { data, error } = await post('/platform/pg-meta/{ref}/query', {
      signal,
      params: {
        header: { 'x-connection-encrypted': connectionString ?? '' },
        path: { ref: projectRef },
        query: {
          key:
            queryKey
              ?.filter((seg) => typeof seg === 'string' || typeof seg === 'number')
              .join('-') ?? '',
        },
      },
      body: { query: sql },
      headers: Object.fromEntries(headers),
    } as any)

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

    // Update execution status before any returns
    sqlExecutionsStoreState.updateExecution(executionIndex, {
      ...execution,
      completedAt: Date.now(),
      duration: Date.now() - execution.startedAt,
      status: 'completed',
    })

    if (
      isRoleImpersonationEnabled &&
      Array.isArray(data) &&
      data?.[0]?.[ROLE_IMPERSONATION_NO_RESULTS] === 1
    ) {
      return { result: [] }
    }

    return { result: data }
  } catch (error: any) {
    // Update execution status before throwing
    sqlExecutionsStoreState.updateExecution(executionIndex, {
      ...execution,
      completedAt: Date.now(),
      duration: Date.now() - execution.startedAt,
      status: 'error',
      error: error?.message || 'Unknown error occurred',
    })

    throw error
  }
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
) => {
  const router = useRouter()

  return useQuery<ExecuteSqlData, ExecuteSqlError, TData>(
    sqlKeys.query(projectRef, queryKey ?? [btoa(sql)]),
    ({ signal }) =>
      executeSql(
        {
          projectRef,
          connectionString,
          sql,
          queryKey,
          handleError,
          isRoleImpersonationEnabled,
          url: router.asPath,
        },
        signal
      ),
    { enabled: enabled && typeof projectRef !== 'undefined', staleTime: 0, ...options }
  )
}
