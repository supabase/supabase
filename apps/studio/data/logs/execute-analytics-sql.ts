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
import { get, handleError, post } from '@/data/fetchers'

/**
 * Analytics endpoints that accept `{ sql, iso_timestamp_start, iso_timestamp_end }`
 * either as a POST body or GET query string. Extend this union as additional
 * endpoints are migrated to the safe-analytics-sql pattern.
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
  /** Defaults to 'post'. Use 'get' to preserve wire behavior when migrating legacy GET callers. */
  method?: 'get' | 'post'
  /**
   * Optional query-string key for network-tool identification.
   * Not part of the OpenAPI schema; accepted by the server and visible in DevTools.
   */
  key?: string
  signal?: AbortSignal
  headers?: HeadersInit
}

export async function executeAnalyticsSql({
  projectRef,
  endpoint,
  sql,
  iso_timestamp_start,
  iso_timestamp_end,
  method = 'post',
  key,
  signal,
  headers: headersInit,
}: ExecuteAnalyticsSqlVariables) {
  const headers = headersInit !== undefined ? new Headers(headersInit) : undefined

  if (method === 'get') {
    const { data, error } = await get(endpoint, {
      params: {
        path: { ref: projectRef },
        query: { sql, iso_timestamp_start, iso_timestamp_end, ...(key ? { key } : {}) },
      },
      signal,
      headers,
    })
    if (error) handleError(error)
    return data
  }

  const { data, error } = await post(endpoint, {
    // @ts-ignore key is not in the OpenAPI schema; included only for network-tool identification
    params: { path: { ref: projectRef }, ...(key ? { query: { key } } : {}) },
    body: { sql, iso_timestamp_start, iso_timestamp_end },
    signal,
    headers,
  })
  if (error) handleError(error)
  return data
}
