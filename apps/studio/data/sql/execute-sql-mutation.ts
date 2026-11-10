import {
  ROLE_IMPERSONATION_NO_RESULTS,
  ROLE_IMPERSONATION_SQL_LINE_COUNT,
  type SafeSqlFragment,
  type WriteSqlFragment,
} from '@supabase/pg-meta'
import { DEFAULT_PLATFORM_APPLICATION_NAME } from '@supabase/pg-meta/src/constants'
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  calculateSummary,
  createNodeTree,
} from '@/components/interfaces/ExplainVisualizer/ExplainVisualizer.parser'
import { classifySqlResponseError } from '@/data/error-classification'
import { handleError as handleErrorFetchers, post, type Unguarded } from '@/data/fetchers'
import { QUERY_SOURCE_REGISTRY } from '@/data/query-sources/query-source-registry'
import { MB } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { Grant, GrantForVariants } from '@/lib/grants'
import { sqlEventParser } from '@/lib/sql-event-parser'
import { useTrack } from '@/lib/telemetry/track'
import { UseCustomMutationOptions } from '@/types'

// [Joshen] Intention is that we invalidate all database related keys whenever running a mutation related query
// So we attempt to ignore all the non-related query keys. We could probably look into grouping our query keys better
// actually to not make this too hacky here
const INVALIDATION_KEYS_IGNORE = ['branches', 'settings-v2', 'addons', 'custom-domains', 'content']

/**
 * [Joshen] Done a bit of stress testing and experimentation, tho we should still observe and tweak where necessary
 * From what I understand a query cost of 100,000 is considered to be "heavy", and 1M is "potentially dangerous"
 * Reckon we ensure that the dashboard just caps query costs at "heavy", so that it doesn't impact the DB for other queries
 * (e.g from the user's application)
 */
const COST_THRESHOLD = 200_000
export const COST_THRESHOLD_ERROR = 'Query cost exceeds threshold'

export type QueryResponseError = {
  code: string
  message: string
  error: string
  file: string
  length: number
  line: string
  name: string
  position: string
  routine: string
  severity: string
}

/**
 * Who wrote the SQL, and for Studio SQL, its name in error reports.
 *
 * - `'user'`: SQL the user or an AI agent wrote, in whole or in part (SQL editor, AI tools, policy
 *   and function editors). Its errors are never sent to Sentry.
 * - `'studio'`: SQL Studio composes. Its errors are reported without the Postgres message, which can
 *   contain user data, so `queryName` identifies the query instead. Use a static kebab-case name
 *   (`table-rows`, `trigger-update`), never a value that includes IDs, schemas, or user input.
 */
type SqlSource =
  | { sqlOrigin: 'user'; queryName?: string }
  | { sqlOrigin: 'studio'; queryName: string }

type PgMetaQuery = 'POST /platform/pg-meta/{ref}/query'
export type PgMetaReadGrant = GrantForVariants<'post', '/platform/pg-meta/{ref}/query'>
export type PgMetaWriteGrant = Grant<PgMetaQuery, 'write'>

/** A plain `SafeSqlFragment` is read SQL. The optional brand lets it be assigned here. */
type ReadSqlFragment = SafeSqlFragment & { readonly __sqlIntent?: 'read' }

type BaseVariables = SqlSource & {
  projectRef?: string
  connectionString?: string | null
  queryKey?: QueryKey
  handleError?: (error: StudioError) => { result: any }
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

/** Read SQL runs with a read grant or a write grant. */
type ReadSqlVariables = BaseVariables & {
  sql: ReadSqlFragment
  grant: PgMetaReadGrant | Unguarded
}

/** SQL marked with `asWriteSql` needs a `write` grant. */
type WriteSqlVariables = BaseVariables & {
  sql: WriteSqlFragment
  grant: PgMetaWriteGrant | Unguarded
}

export type ExecuteSqlMutationVariables = (ReadSqlVariables | WriteSqlVariables) & {
  autoLimit?: number
  contextualInvalidation?: boolean
}

/**
 * Executes a SQL query against the user's instance.
 *
 * @throws {Error}
 */
export async function executeSql<T = any>(
  variables: WriteSqlVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit,
  fetcherOverride?: (options: {
    query: string
    headers?: HeadersInit
  }) => Promise<{ data: T } | { error: Error }>
): Promise<{ result: T }>
export async function executeSql<T = any>(
  variables: ReadSqlVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit,
  fetcherOverride?: (options: {
    query: string
    headers?: HeadersInit
  }) => Promise<{ data: T } | { error: Error }>
): Promise<{ result: T }>
export async function executeSql<T = any>(
  {
    projectRef,
    connectionString,
    sql,
    sqlOrigin,
    queryName,
    grant,
    queryKey,
    handleError,
    isRoleImpersonationEnabled = false,
    isStatementTimeoutDisabled = false,
    preflightCheck = false,
  }: ReadSqlVariables | WriteSqlVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit,
  fetcherOverride?: (options: {
    query: string
    headers?: HeadersInit
  }) => Promise<{ data: T } | { error: Error }>
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
      grant,
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
        params: {
          ...options.params,
          // @ts-expect-error: This is just a client side thing to identify queries better
          query: { key: 'preflight-check' },
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
    const result = await post(QUERY_SOURCE_REGISTRY.database.endpoint, {
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

    const classified = classifySqlResponseError(error, {
      origin: sqlOrigin,
      queryName,
    })
    if (handleError !== undefined) return handleError(classified)
    handleErrorFetchers(classified)
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

type ExecuteSqlData = Awaited<ReturnType<typeof executeSql<any[]>>>

export const useExecuteSqlMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<ExecuteSqlData, QueryResponseError, ExecuteSqlMutationVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  const track = useTrack()

  return useMutation<ExecuteSqlData, QueryResponseError, ExecuteSqlMutationVariables>({
    // args is ReadSqlVariables | WriteSqlVariables, already checked at mutate().
    // TS can't match a union against separate overloads, so pick one; the runtime path is identical.
    mutationFn: (args) => executeSql(args as ReadSqlVariables),
    async onSuccess(data, variables, context) {
      const { contextualInvalidation, sql, projectRef } = variables

      try {
        const tableEvents = sqlEventParser.getTableEvents(sql)
        tableEvents.forEach((event) => {
          if (projectRef) {
            track(
              event.type,
              {
                method: 'sql_editor',
                schema_name: event.schema,
                table_name: event.tableName,
              },
              { project: projectRef }
            )
          }
        })
      } catch (error) {
        console.error('Failed to parse SQL for telemetry:', error)
      }

      // [Joshen] Default to false for now, only used for SQL editor to dynamically invalidate
      const sqlLower = sql.toLowerCase()
      const isMutationSQL =
        sqlLower.includes('create ') || sqlLower.includes('alter ') || sqlLower.includes('drop ')
      if (contextualInvalidation && projectRef && isMutationSQL) {
        const databaseRelatedKeys = queryClient
          .getQueryCache()
          .findAll({ queryKey: ['projects', projectRef] })
          .map((x) => x.queryKey)
          .filter((x) => !INVALIDATION_KEYS_IGNORE.some((a) => x.includes(a)))
        await Promise.all(
          databaseRelatedKeys.map((key) => queryClient.invalidateQueries({ queryKey: key }))
        )
      }
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to execute SQL: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
