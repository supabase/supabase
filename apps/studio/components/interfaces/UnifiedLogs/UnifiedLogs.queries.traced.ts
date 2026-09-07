import {
  ATTR,
  AUTH_USER_EXPR,
  buildBaseWhere,
  LEVEL_EXPR,
  LOG_TYPE_EXPR,
  STATUS_EXPR,
  whereClause,
} from './UnifiedLogs.queries'
import { QuerySearchParamsType } from './UnifiedLogs.types'
import { safeSql, type SafeLogSqlFragment } from '@/data/logs/safe-analytics-sql'

// Sources eligible for "traced logs" grouping — a request may hop through any
// subset of these three; a bundle with just one or two is still valid (e.g. a
// Storage upload with no separate Auth-service call).
const TRACED_SOURCES: SafeLogSqlFragment = safeSql`source IN ('edge_logs', 'auth_logs', 'storage_logs')`

// Picks which row's fields represent the bundle when they disagree: the
// gateway's own HTTP response is the most complete picture of the request's
// outcome, so it wins; Storage is the next most specific, Auth last.
const SOURCE_PRIORITY_EXPR: SafeLogSqlFragment = safeSql`CASE source
      WHEN 'edge_logs' THEN 0
      WHEN 'storage_logs' THEN 1
      ELSE 2
    END`

/**
 * Row-list query for "traced logs" mode — one row per `request_id`, bundling
 * every edge/auth/storage log line that shares it. Unlike the single-log-line
 * `getUnifiedLogsQuery`, this aggregates with `GROUP BY` (no subquery, so it
 * stays compatible with the OTEL endpoint) and represents each bundle with the
 * highest-priority row's fields via `argMin`. The individual log lines
 * themselves are fetched separately, on demand, by `getTracedLogBundleQuery`.
 */
export const getTracedLogsQuery = (search: QuerySearchParamsType): SafeLogSqlFragment => {
  // `excludeField: 'log_type'` drops the normal log-type filter/default-types
  // restriction entirely — traced mode always scopes to TRACED_SOURCES instead
  // — while keeping every other active filter (level, status, method, etc.)
  // and view option (show_connection_logs, user, edge_* toggles).
  const conditions = [
    TRACED_SOURCES,
    safeSql`log_attributes['request_id'] != ''`,
    ...buildBaseWhere(search, 'log_type'),
  ]

  return safeSql`-- traced logs: request_id bundles across gateway/auth/storage
SELECT
  log_attributes['request_id'] AS id,
  min(timestamp) AS timestamp,
  count() AS log_count,
  argMin((${LOG_TYPE_EXPR}), (${SOURCE_PRIORITY_EXPR})) AS log_type,
  argMin((${STATUS_EXPR}), (${SOURCE_PRIORITY_EXPR})) AS status,
  argMin((${LEVEL_EXPR}), (${SOURCE_PRIORITY_EXPR})) AS level,
  argMin(${ATTR.path}, (${SOURCE_PRIORITY_EXPR})) AS pathname,
  argMin(event_message, (${SOURCE_PRIORITY_EXPR})) AS event_message,
  argMin(${ATTR.method}, (${SOURCE_PRIORITY_EXPR})) AS method,
  argMin((${AUTH_USER_EXPR}), (${SOURCE_PRIORITY_EXPR})) AS auth_user,
  null AS logs
FROM logs
${whereClause(conditions)}
GROUP BY id
`
}
