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
