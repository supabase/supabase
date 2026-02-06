import { DEFAULT_PLATFORM_APPLICATION_NAME } from '@supabase/pg-meta/src/constants'
import { QueryKey, useQuery } from '@tanstack/react-query'
import { handleError as handleErrorFetchers, post } from 'data/fetchers'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { MB, PROJECT_STATUS } from 'lib/constants'
import {
  ROLE_IMPERSONATION_NO_RESULTS,
  ROLE_IMPERSONATION_SQL_LINE_COUNT,
} from 'lib/role-impersonation'
import type { ResponseError, UseCustomQueryOptions } from 'types'

import { sqlKeys } from './keys'
import {
  calculateSummary,
  createNodeTree,
} from '@/components/interfaces/ExplainVisualizer/ExplainVisualizer.parser'

/**
 * [Joshen] Done a bit of stress testing and experimentation, tho we should still observe and tweak where necessary
 * From what I understand a query cost of 100,000 is considered to be "heavy", and 1M is "potentially dangerous"
 * Reckon we ensure that the dashboard just caps query costs at "heavy", so that it doesn't impact the DB for other queries
 * (e.g from the user's application)
 */
const COST_THRESHOLD = 100_000
export const COST_THRESHOLD_ERROR = 'Query cost exceeds threshold'

export type ExecuteSqlVariables = {
  projectRef?: string
  connectionString?: string | null
  sql: string
  queryKey?: QueryKey
  handleError?: (error: ResponseError) => { result: any }
  isRoleImpersonationEnabled?: boolean
  /**
   * Disables transaction mode - should be used only for manual queries ran via the SQL Editor
   * */
  isStatementTimeoutDisabled?: boolean
  /**
   * Runs an EXPLAIN before actually running the query, rejects the query if cost exceeds a threshold.
   * Intended to be used for interfaces that heavily rely on queries on the DB
   * */
  preflightCheck?: boolean
}

/**
 * Executes a SQL query against the user's instance.
 *
 * @throws {Error}
 */
export async function executeSql<T = any>(
  {
    projectRef,
    connectionString,
    sql,
    queryKey,
    handleError,
    isRoleImpersonationEnabled = false,
    isStatementTimeoutDisabled = false,
    preflightCheck = false,
  }: ExecuteSqlVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit,
  fetcherOverride?: (options: {
    query: string
    headers?: HeadersInit
  }) => Promise<{ data: T } | { error: ResponseError }>
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
    const result = await fetcherOverride({ query: sql, headers })
    if ('data' in result) {
      data = result.data
    } else {
      error = result.error
    }
  } else {
    const options = {
      signal,
      headers,
      params: {
        path: { ref: projectRef },
        header: {
          'x-connection-encrypted': connectionString ?? '',
          'x-pg-application-name': isStatementTimeoutDisabled
            ? 'supabase/dashboard-query-editor'
            : DEFAULT_PLATFORM_APPLICATION_NAME,
        },
      },
    }

    if (preflightCheck) {
      /**
       * [Joshen] Note that I've intentionally omitted error handling here as I'm opting
       * to NOT block the UI if the preflight check fails for any reason.
       */

      const { data: costCheck } = await post('/platform/pg-meta/{ref}/query', {
        ...options,
        body: {
          query: `explain ${sql}`,
          disable_statement_timeout: isStatementTimeoutDisabled,
        },
      })
      const parsedTree = !!costCheck ? createNodeTree(costCheck) : undefined
      const summary = !!parsedTree ? calculateSummary(parsedTree) : undefined
      const cost = summary?.totalCost ?? 0

      if (cost >= COST_THRESHOLD) {
        return handleErrorFetchers({
          message: COST_THRESHOLD_ERROR,
          code: cost,
          metadata: { cost, sql },
        })
      }
    }

    const key =
      queryKey?.filter((seg) => typeof seg === 'string' || typeof seg === 'number').join('-') ?? ''
    const result = await post('/platform/pg-meta/{ref}/query', {
      ...options,
      body: { query: sql, disable_statement_timeout: isStatementTimeoutDisabled },
      params: {
        ...options.params,
        // @ts-expect-error: This is just a client side thing to identify queries better
        query: { key },
      },
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
  { enabled = true, ...options }: UseCustomQueryOptions<ExecuteSqlData, ExecuteSqlError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<ExecuteSqlData, ExecuteSqlError, TData>({
    queryKey: sqlKeys.query(projectRef, queryKey ?? [btoa(sql)]),
    queryFn: ({ signal }) =>
      executeSql(
        { projectRef, connectionString, sql, queryKey, handleError, isRoleImpersonationEnabled },
        signal
      ),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    staleTime: 0,
    ...options,
  })
}
