/**
 * Wire-boundary for analytics SQL execution.
 *
 * This is the analytics-path analog of pg-meta's `executeSql`. It accepts only
 * `SafeLogSqlFragment` — plain strings are rejected at compile time — so any
 * value flowing from URL parameters, UI inputs, or LLM output must pass through
 * a sanitization helper in safe-analytics-sql.ts before reaching the wire.
 *
 * See .agents/skills/safe-sql-execution/SKILL.md for the full security model.
 */
import type { platformComponents } from 'api-types'

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
  sql: SafeLogSqlFragment | readonly SafeLogSqlFragment[]
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
}: ExecuteAnalyticsSqlVariables): Promise<
  platformComponents['schemas']['AnalyticsResponse_Output']
> {
  if (typeof sql !== 'string') {
    const responses = await Promise.all(
      sql.map((query) =>
        executeAnalyticsSql({
          projectRef,
          endpoint,
          sql: query,
          iso_timestamp_start,
          iso_timestamp_end,
          method,
          key,
          signal,
          headers: headersInit,
        })
      )
    )
    for (const response of responses) {
      if (response.error)
        handleError(typeof response.error === 'string' ? new Error(response.error) : response.error)
    }
    return { result: responses.flatMap((response) => response.result ?? []) }
  }

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
