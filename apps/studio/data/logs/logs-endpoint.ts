/**
 * Shared helpers for routing unified-logs requests between the legacy
 * BigQuery endpoint (`/logs.all`) and the new ClickHouse-backed OTEL
 * endpoint (`/logs.all.otel`).
 *
 * Each hook reads `useFlag('otelUnifiedLogs')`, forwards a `useOtel`
 * boolean to its bare fetcher, and uses these helpers to pick the
 * endpoint URL and SQL builder pair. Keeping the routing in one place
 * means the eventual flag removal is a search-and-delete operation.
 */

export const logsAllEndpointUrl = (useOtel: boolean) =>
  useOtel
    ? ('/platform/projects/{ref}/analytics/endpoints/logs.all.otel' as const)
    : ('/platform/projects/{ref}/analytics/endpoints/logs.all' as const)

/**
 * Convenience picker for a (bq, otel) pair. Preserves the input type so
 * callers keep the original signature.
 */
export const pickLogsQueryBuilder = <T>(useOtel: boolean, otel: T, bq: T): T =>
  useOtel ? otel : bq
