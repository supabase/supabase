import { groupLogsFiltersByColumn, parseLogsFilterUrlParams } from './UnifiedLogs.filters'
import type { QuerySearchParamsType } from './UnifiedLogs.types'
import { wrapIlikePattern } from './UnifiedLogs.utils'
import {
  joinSqlFragments,
  analyticsLiteral as lit,
  safeSql,
  type SafeLogSqlFragment,
} from '@/data/logs/safe-analytics-sql'

// Logflare's Postgres translator requires separate queries when combining
// sources with nested metadata. Each query keeps the fixed function scope.
function functionSources(search: QuerySearchParamsType) {
  const filters = search.scope?.filters ?? []
  const identities = filters.filter((filter) => filter.column === 'function_id')
  if (
    identities.length !== 1 ||
    identities[0].operator !== '=' ||
    filters.some(
      (filter) => !['function_id', 'log_type'].includes(filter.column) || filter.operator !== '='
    )
  )
    throw new Error('Legacy scoped logs require one function ID and equality filters')
  const types = filters
    .filter((filter) => filter.column === 'log_type')
    .map((filter) => filter.value)
  if (
    types.length === 0 ||
    types.some((type) => !['edge function', 'edge function runtime'].includes(type))
  ) {
    throw new Error('Legacy scoped logs only support function logs')
  }
  return [...new Set(types)].map((type) => {
    const isRequest = type === 'edge function'
    const row = isRequest ? safeSql`request_log` : safeSql`runtime_log`
    const metadata = isRequest ? safeSql`request_metadata` : safeSql`runtime_metadata`
    const columns: Record<string, SafeLogSqlFragment> = {
      log_type: lit(type),
      level: isRequest
        ? safeSql`CASE WHEN response.status_code >= 500 THEN 'error' WHEN response.status_code >= 300 THEN 'warning' ELSE 'success' END`
        : safeSql`CASE WHEN runtime_metadata.level = 'error' THEN 'error' WHEN runtime_metadata.level IN ('warn', 'warning') THEN 'warning' ELSE 'success' END`,
      status: isRequest ? safeSql`CAST(response.status_code AS TEXT)` : safeSql`CAST(NULL AS TEXT)`,
      method: isRequest ? safeSql`request.method` : safeSql`CAST(NULL AS TEXT)`,
      pathname: isRequest ? safeSql`request.pathname` : safeSql`CAST(NULL AS TEXT)`,
      event_message: safeSql`${row}.event_message`,
    }
    const from = isRequest
      ? safeSql`FROM function_edge_logs AS request_log CROSS JOIN UNNEST(request_log.metadata) AS request_metadata
          CROSS JOIN UNNEST(request_metadata.request) AS request CROSS JOIN UNNEST(request_metadata.response) AS response`
      : safeSql`FROM function_logs AS runtime_log CROSS JOIN UNNEST(runtime_log.metadata) AS runtime_metadata`
    const conditions = (exclude?: string) => {
      const clauses = [safeSql`${metadata}.function_id = ${lit(identities[0].value)}`]
      const grouped = groupLogsFiltersByColumn(parseLogsFilterUrlParams(search.filter))
      for (const [key, { operator, values }] of Object.entries(grouped)) {
        if (key === exclude || values.length === 0) continue
        const col = columns[key]
        if (!col) throw new Error(`Unsupported function log filter: ${key}`)
        if (operator === '~~*' || operator === '!~~*') {
          const op = operator === '~~*' ? safeSql`LIKE` : safeSql`NOT LIKE`
          clauses.push(
            safeSql`(${joinSqlFragments(
              values.map(
                (value) => safeSql`LOWER(${col}) ${op} LOWER(${lit(wrapIlikePattern(value))})`
              ),
              operator === '~~*' ? ' OR ' : ' AND '
            )})`
          )
        } else {
          const op = operator === '<>' ? safeSql`NOT IN` : safeSql`IN`
          clauses.push(safeSql`(${col}) ${op} (${joinSqlFragments(values.map(lit), ',')})`)
        }
      }
      return safeSql`WHERE ${joinSqlFragments(clauses, ' AND ')}`
    }
    return { columns, from, conditions, row }
  })
}

export function getFunctionLogsQuery(
  search: QuerySearchParamsType,
  pagination?: SafeLogSqlFragment
) {
  return functionSources(search).map(
    ({ columns, from, conditions, row }) => safeSql`
    SELECT ${row}.id, ${row}.timestamp, ${columns.log_type} AS log_type, ${columns.status} AS status,
      ${columns.level} AS level, ${columns.pathname} AS pathname, ${row}.event_message,
      ${columns.method} AS method, NULL AS log_count, NULL AS logs, ${row}.metadata
    ${from} ${conditions()} ${pagination ? safeSql`AND (${pagination})` : safeSql``}
  `
  )
}

export function getFunctionLogsCountQuery(search: QuerySearchParamsType) {
  const queries = functionSources(search).flatMap(({ columns, from, conditions }) => [
    safeSql`SELECT 'total' AS facet, 'all' AS value, COUNT(*) AS count ${from} ${conditions()}`,
    ...['log_type', 'level'].map(
      (facet) => safeSql`
      SELECT ${lit(facet)} AS facet, ${columns[facet]} AS value, COUNT(*) AS count
      ${from} ${conditions(facet)} GROUP BY 2
    `
    ),
  ])
  return queries.map((query) => safeSql`${query} LIMIT 1000`)
}

export function getFunctionLogsChartQuery(search: QuerySearchParamsType) {
  const duration =
    search.date?.length === 2
      ? new Date(search.date[1]).getTime() - new Date(search.date[0]).getTime()
      : 3600000
  let bucket = safeSql`MINUTE`
  if (duration >= 48 * 3600000) bucket = safeSql`DAY`
  else if (duration > 12 * 3600000) bucket = safeSql`HOUR`
  const queries = functionSources(search).map(
    ({ columns, from, conditions, row }) => safeSql`
    SELECT TIMESTAMP_TRUNC(${row}.timestamp, ${bucket}) AS time_bucket,
      COUNTIF((${columns.level}) = 'success') AS success,
      COUNTIF((${columns.level}) = 'warning') AS warning,
      COUNTIF((${columns.level}) = 'error') AS error
    ${from} ${conditions()} GROUP BY 1
  `
  )
  return queries.map((query) => safeSql`${query} LIMIT 2000`)
}

export function getFunctionLogsFacetQuery(
  search: QuerySearchParamsType,
  facet: string,
  text?: string
) {
  const queries = functionSources(search).map(({ columns, from, conditions }) => {
    const col = columns[facet]
    if (!col) throw new Error(`Unsupported function log facet: ${facet}`)
    return safeSql`SELECT ${col} AS value, COUNT(*) AS count ${from} ${conditions(facet)}
      AND ${col} IS NOT NULL ${text ? safeSql`AND LOWER(${col}) LIKE LOWER(${lit(wrapIlikePattern(text))})` : safeSql``}
      GROUP BY 1`
  })
  return queries.map((query) => safeSql`${query} ORDER BY 2 DESC LIMIT 20`)
}
