/**
 * Wire-boundary for analytics SQL execution.
 *
 * This is the analytics-path analog of pg-meta's `executeSql`. It accepts only
 * `SafeLogSqlFragment` — plain strings are rejected at compile time — so any
 * value flowing from URL parameters, UI inputs, or LLM output must pass through
 * a sanitization helper in safe-analytics-sql.ts before reaching the wire.
 *
 * See .claude/skills/safe-sql-execution/SKILL.md for the full security model.
 */
import type { SafeLogSqlFragment } from './safe-analytics-sql'
import { handleError, post } from '@/data/fetchers'

/**
 * Analytics endpoints that accept a POST body with `{ sql, iso_timestamp_start, iso_timestamp_end }`.
 * Extend this union as additional endpoints are migrated to the safe-analytics-sql pattern.
 */
export type AnalyticsSqlEndpoint =
  | '/platform/projects/{ref}/analytics/endpoints/logs.all'
  | '/platform/projects/{ref}/analytics/endpoints/logs.all.otel'

export interface ExecuteAnalyticsSqlVariables {
  projectRef: string
  endpoint: AnalyticsSqlEndpoint
  /** Must carry the `SafeLogSqlFragment` brand — plain strings are rejected at compile time. */
  sql: SafeLogSqlFragment
  iso_timestamp_start: string
  iso_timestamp_end: string
  signal?: AbortSignal
  headers?: HeadersInit
}

export async function executeAnalyticsSql({
  projectRef,
  endpoint,
  sql,
  iso_timestamp_start,
  iso_timestamp_end,
  signal,
  headers: headersInit,
}: ExecuteAnalyticsSqlVariables) {
  const { data, error } = await post(endpoint, {
    params: { path: { ref: projectRef } },
    body: { sql, iso_timestamp_start, iso_timestamp_end },
    signal,
    headers: headersInit !== undefined ? new Headers(headersInit) : undefined,
  })
  if (error) handleError(error)
  return data
}
