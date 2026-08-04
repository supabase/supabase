/**
 * Execution data layer for user-authored logs SQL run from the SQL editor.
 *
 * This is the logs-path analog of `data/sql/execute-sql-mutation.ts`. It wraps
 * the analytics wire boundary (`executeAnalyticsSql`) and:
 * - accepts only a `SafeLogSqlFragment` (promoted from `UntrustedLogSqlFragment`
 *   at an explicit user run gesture — see `safe-analytics-sql.ts`),
 * - attaches the resolved time range as request params
 *   (`iso_timestamp_start`/`iso_timestamp_end`), never spliced into the SQL,
 * - normalizes the response to `{ rows, error? }`.
 *
 * There are two ways a logs query can fail, and the layer keeps them distinct
 * only at the pure-function level:
 * - Transport failures (non-2xx) throw out of `executeAnalyticsSql` via
 *   `handleError`.
 * - The analytics backend also returns a *200 body* carrying a structured error
 *   (`{ code, errors, message, status }`) — the same shape `useLogsQuery`
 *   reads. `mapLogsError` normalizes that into the `{ message }` shape the SQL
 *   editor's result pane renders, returned in `executeLogsSql`'s `error` field.
 *
 * `useExecuteLogsSqlMutation` then collapses both into React Query's single
 * `onError` path so consumers handle one normalized error shape in one place.
 */
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeAnalyticsSql, type AnalyticsSqlEndpoint } from './execute-analytics-sql'
import type { SafeLogSqlFragment } from './safe-analytics-sql'
import type { ResolvedLogDateRange } from '@/components/interfaces/Settings/Logs/logsDateRange'
import type { UseCustomMutationOptions } from '@/types'

/**
 * Normalized logs query error in the shape the SQL editor result pane reads
 * (`{ message }`). Produced by `mapLogsError` from either a transport error or
 * the analytics backend's structured 200-body error.
 */
export interface LogsQueryError {
  message: string
}

/**
 * Structured error the analytics backend returns inside a 200 response body.
 * Mirrors `LFResponse['error']` from the Logs types; every field is optional
 * here because the value crosses the wire and must be treated defensively.
 */
interface RawLogsResponseError {
  code?: number
  errors?: Array<{ domain?: string; message?: string; reason?: string }>
  message?: string
  status?: string
}

const UNKNOWN_LOGS_ERROR_MESSAGE = 'An unexpected error occurred while running the logs query.'

/**
 * Normalizes an analytics backend error into the `{ message }` shape the SQL
 * editor result pane renders. Follows `useLogsQuery`'s extraction: prefer the
 * top-level `message`, then the first nested `errors[].message`. Returns
 * `undefined` when there is no error, and a generic fallback message when an
 * error is present but carries no usable text.
 */
export function mapLogsError(error: unknown): LogsQueryError | undefined {
  if (error === undefined || error === null) return undefined

  if (typeof error === 'string') {
    return { message: error.length > 0 ? error : UNKNOWN_LOGS_ERROR_MESSAGE }
  }

  if (typeof error === 'object') {
    const structured = error as RawLogsResponseError
    const nestedMessage = Array.isArray(structured.errors)
      ? structured.errors.find(
          (entry) => typeof entry?.message === 'string' && entry.message.length > 0
        )?.message
      : undefined
    const message = structured.message || nestedMessage
    if (typeof message === 'string' && message.length > 0) {
      return { message }
    }
  }

  return { message: UNKNOWN_LOGS_ERROR_MESSAGE }
}

export interface ExecuteLogsSqlVariables {
  projectRef: string
  /** Must carry the `SafeLogSqlFragment` brand — promote at the run gesture. */
  sql: SafeLogSqlFragment
  /** Resolved (absolute) time range; relative ranges re-resolve at each run. */
  range: ResolvedLogDateRange
  /**
   * Analytics endpoint to run against. The SQL editor pins this to the OTEL
   * (ClickHouse) endpoint; kept as a param so callers stay explicit.
   */
  endpoint: AnalyticsSqlEndpoint
  signal?: AbortSignal
}

export interface ExecuteLogsSqlResult {
  rows: unknown[]
  /** Present when the backend returned a 200 body carrying a structured error. */
  error?: LogsQueryError
}

/**
 * Runs a logs SQL query against the analytics backend and normalizes the
 * response. Transport failures throw; a structured 200-body error is returned
 * in `error` alongside empty `rows`.
 *
 * @throws {ResponseError} on transport failure (via `executeAnalyticsSql`).
 */
export async function executeLogsSql({
  projectRef,
  sql,
  range,
  endpoint,
  signal,
}: ExecuteLogsSqlVariables): Promise<ExecuteLogsSqlResult> {
  const data = await executeAnalyticsSql({
    projectRef,
    endpoint,
    sql,
    iso_timestamp_start: range.from,
    iso_timestamp_end: range.to,
    key: 'sql-editor',
    signal,
  })

  const body = (data ?? {}) as { result?: unknown[]; error?: unknown }
  const error = mapLogsError(body.error)

  return { rows: body.result ?? [], ...(error ? { error } : {}) }
}

/**
 * React Query mutation wrapping `executeLogsSql`.
 *
 * Collapses both failure modes into React Query's single `onError` path: a
 * transport failure (thrown by `executeAnalyticsSql`) and the analytics
 * backend's structured 200-body error are both normalized to `LogsQueryError`
 * before they reach `onError`, so callers only ever handle one error shape in
 * one place. `onSuccess` therefore always receives a genuinely successful
 * result.
 */
export const useExecuteLogsSqlMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<ExecuteLogsSqlResult, LogsQueryError, ExecuteLogsSqlVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ExecuteLogsSqlResult, LogsQueryError, ExecuteLogsSqlVariables>({
    async mutationFn(variables) {
      let result: ExecuteLogsSqlResult
      try {
        result = await executeLogsSql(variables)
      } catch (error) {
        // Transport failure — normalize to the same shape as a query error.
        throw mapLogsError(error) ?? { message: UNKNOWN_LOGS_ERROR_MESSAGE }
      }
      // 200-body query error — route through onError alongside transport errors.
      if (result.error) throw result.error
      return result
    },
    onSuccess,
    async onError(error, variables, context) {
      if (onError === undefined) {
        toast.error(error.message)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
