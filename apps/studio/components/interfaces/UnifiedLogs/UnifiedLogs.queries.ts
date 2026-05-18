import dayjs from 'dayjs'

import { DEFAULT_LOG_TYPES } from './UnifiedLogs.constants'
import { QuerySearchParamsType, SearchParamsType } from './UnifiedLogs.types'
import {
  joinSqlFragments,
  analyticsLiteral as lit,
  safeSql,
  type SafeLogSqlFragment,
} from '@/data/logs/safe-analytics-sql'

// Pagination and control parameters
const PAGINATION_PARAMS = ['sort', 'start', 'size', 'uuid', 'cursor', 'direction', 'live'] as const

// Special filter parameters that need custom handling
const SPECIAL_FILTER_PARAMS = ['date'] as const

// Combined list of all parameters to exclude from standard filtering
const EXCLUDED_QUERY_PARAMS = [...PAGINATION_PARAMS, ...SPECIAL_FILTER_PARAMS] as const

// Facets the count query is allowed to be invoked for. Reject anything else
// at the entry point rather than letting an unsupported value reach
// `log_attributes[…]` lookups.
const FACET_FIELDS = ['log_type', 'level', 'method', 'status', 'pathname'] as const

// OTEL log_attributes keys for HTTP-style fields. Centralized so they can be
// adjusted in one place if the backend conventions change.
const ATTR = {
  method: safeSql`log_attributes['request.method']`,
  status: safeSql`log_attributes['response.status_code']`,
  path: safeSql`log_attributes['request.path']`,
} as const

/**
 * Predicate that matches rows belonging to a given log_type. Mirrors the
 * shape of the original BigQuery unified-logs CTEs: edge gateway traffic
 * (`source = 'edge_logs'`) is split between `edge`, `postgrest` and `storage`
 * based on URL path. Other types map straight to a single source.
 *
 * The OTEL `postgrest_logs` and `storage_logs` sources contain process-level
 * logs from postgREST / storage-api and are intentionally not part of unified
 * logs; the UI surfaces gateway HTTP traffic for those buckets.
 */
const LOG_TYPE_PREDICATE: Record<string, SafeLogSqlFragment> = {
  edge: safeSql`source = 'edge_logs' AND ${ATTR.path} NOT LIKE '%/rest/%' AND ${ATTR.path} NOT LIKE '%/storage/%'`,
  postgrest: safeSql`source = 'edge_logs' AND ${ATTR.path} LIKE '%/rest/%'`,
  storage: safeSql`source = 'edge_logs' AND ${ATTR.path} LIKE '%/storage/%'`,
  postgres: safeSql`source = 'postgres_logs'`,
  'edge function': safeSql`source = 'function_edge_logs'`,
  auth: safeSql`source = 'auth_logs'`,
}

// Derived `log_type` column for SELECT / GROUP BY / countIf use.
const LOG_TYPE_EXPR: SafeLogSqlFragment = safeSql`CASE
      WHEN source = 'edge_logs' AND ${ATTR.path} LIKE '%/rest/%' THEN 'postgrest'
      WHEN source = 'edge_logs' AND ${ATTR.path} LIKE '%/storage/%' THEN 'storage'
      WHEN source = 'edge_logs' THEN 'edge'
      WHEN source = 'postgres_logs' THEN 'postgres'
      WHEN source = 'function_edge_logs' THEN 'edge function'
      WHEN source = 'auth_logs' THEN 'auth'
      ELSE source
    END`

// Status code is sourced from the HTTP response for gateway-style rows and
// from the Postgres `parsed.sql_state_code` (e.g. `42P01`) for postgres rows.
const STATUS_EXPR: SafeLogSqlFragment = safeSql`CASE
      WHEN source = 'postgres_logs' THEN toString(log_attributes['parsed.sql_state_code'])
      ELSE toString(${ATTR.status})
    END`

// SQL expression for derived `level`. Used inline (not as alias reference)
// because the OTEL endpoint can't resolve aliases inside countIf when the
// alias is not in GROUP BY.
//
// HTTP status is checked first so gateway rows (which always carry an
// `severity_text` of `INFO` regardless of response code) bucket as
// success/warning/error by status. Postgres-style severity is the
// fallback for rows without a status code.
const LEVEL_EXPR: SafeLogSqlFragment = safeSql`CASE
      WHEN ${ATTR.status} != '' AND toInt32OrZero(${ATTR.status}) >= 500 THEN 'error'
      WHEN ${ATTR.status} != '' AND toInt32OrZero(${ATTR.status}) BETWEEN 400 AND 499 THEN 'warning'
      WHEN ${ATTR.status} != '' AND toInt32OrZero(${ATTR.status}) BETWEEN 200 AND 299 THEN 'success'
      WHEN severity_text IN ('ERROR','FATAL','CRITICAL','ALERT','EMERGENCY') THEN 'error'
      WHEN severity_text IN ('WARN','WARNING') THEN 'warning'
      WHEN severity_text IN ('TRACE','DEBUG','INFO','LOG','NOTICE') THEN 'success'
      ELSE 'success'
    END`

const logTypeWherePredicate = (logTypes: string[]): SafeLogSqlFragment => {
  const effective = logTypes.filter((t) => t in LOG_TYPE_PREDICATE)
  const types = effective.length ? effective : [...DEFAULT_LOG_TYPES]
  const branches = types.map((t) => safeSql`(${LOG_TYPE_PREDICATE[t]})`)
  return safeSql`(${joinSqlFragments(branches, ' OR ')})`
}

/**
 * Translates a frontend filter key/value pair into an underlying SQL predicate.
 * The OTEL endpoint won't accept queries that reference derived aliases like
 * `log_type` or `level` in WHERE for some shapes, so we always emit raw-column
 * predicates (source/severity_text/log_attributes[…]).
 */
const translateFilter = (key: string, value: unknown): SafeLogSqlFragment | null => {
  if (value === null || value === undefined) return null

  const arr = Array.isArray(value) ? (value.length > 0 ? value : null) : null
  if (Array.isArray(value) && !arr) return null

  const inList = (values: readonly unknown[]): SafeLogSqlFragment =>
    safeSql`(${joinSqlFragments(
      values.map((v) => lit(String(v))),
      ','
    )})`

  switch (key) {
    case 'log_type': {
      const types = (arr ?? [value]).map((v) => String(v))
      const branches = types.map(
        (t) => safeSql`(${LOG_TYPE_PREDICATE[t] ?? safeSql`source = ${lit(t)}`})`
      )
      return safeSql`(${joinSqlFragments(branches, ' OR ')})`
    }
    case 'level': {
      // No simple raw column for level; reference the inline CASE expression.
      const levels = arr ?? [value]
      return safeSql`(${LEVEL_EXPR}) IN ${inList(levels.map((v) => String(v)))}`
    }
    case 'method':
      return arr
        ? safeSql`${ATTR.method} IN ${inList(arr)}`
        : safeSql`${ATTR.method} = ${lit(String(value))}`
    case 'status':
      return arr
        ? safeSql`${ATTR.status} IN ${inList(arr)}`
        : safeSql`${ATTR.status} = ${lit(String(value))}`
    case 'pathname':
      return arr
        ? safeSql`(${joinSqlFragments(
            arr.map((v) => safeSql`${ATTR.path} LIKE ${lit('%' + String(v) + '%')}`),
            ' OR '
          )})`
        : safeSql`${ATTR.path} LIKE ${lit('%' + String(value) + '%')}`
    case 'host':
      // Best-effort: use full request URL since `host` isn't a top-level field.
      return arr
        ? safeSql`(${joinSqlFragments(
            arr.map(
              (v) => safeSql`log_attributes['request.url'] LIKE ${lit('%' + String(v) + '%')}`
            ),
            ' OR '
          )})`
        : safeSql`log_attributes['request.url'] LIKE ${lit('%' + String(value) + '%')}`
    default:
      // Unknown filter key — fall back to a generic equality on log_attributes.
      return arr
        ? safeSql`log_attributes[${lit(key)}] IN ${inList(arr)}`
        : safeSql`log_attributes[${lit(key)}] = ${lit(String(value))}`
  }
}

/**
 * Builds an array of WHERE predicate fragments from search params, optionally
 * skipping a specific facet field (used when computing faceted counts).
 * `log_type` is always handled separately (see `logTypeWherePredicate`).
 */
const buildPredicates = (
  search: QuerySearchParamsType,
  excludeField?: string
): SafeLogSqlFragment[] => {
  const predicates: SafeLogSqlFragment[] = []
  Object.entries(search).forEach(([key, value]) => {
    if (key === excludeField) return
    if (key === 'log_type') return
    if ((EXCLUDED_QUERY_PARAMS as readonly string[]).includes(key)) return
    try {
      const predicate = translateFilter(key, value)
      if (predicate) predicates.push(predicate)
    } catch {
      // analyticsLiteral rejected an unsupported input — drop the predicate.
    }
  })
  return predicates
}

const whereClause = (predicates: SafeLogSqlFragment[]): SafeLogSqlFragment =>
  predicates.length > 0 ? safeSql`WHERE ${joinSqlFragments(predicates, ' AND ')}` : safeSql``

/**
 * Calculates the chart bucketing level (minute/hour/day) given the date range.
 */
const calculateChartBucketing = (
  search: SearchParamsType | Record<string, unknown>
): 'MINUTE' | 'HOUR' | 'DAY' => {
  const dateRange = (search.date as Array<Date | string | number | null | undefined>) || []

  const convertToMillis = (timestamp: Date | string | number | null | undefined) => {
    if (!timestamp) return null
    if (timestamp instanceof Date) return timestamp.getTime()
    if (typeof timestamp === 'string') return dayjs(timestamp).valueOf()
    if (typeof timestamp === 'number') {
      const str = timestamp.toString()
      if (str.length >= 16) return Math.floor(timestamp / 1000)
      return timestamp
    }
    return null
  }

  let startMillis = convertToMillis(dateRange[0])
  let endMillis = convertToMillis(dateRange[1])

  if (!startMillis) startMillis = dayjs().subtract(1, 'hour').valueOf()
  if (!endMillis) endMillis = dayjs().valueOf()

  const startTime = dayjs(startMillis)
  const endTime = dayjs(endMillis)

  const hourDiff = endTime.diff(startTime, 'hour')
  const dayDiff = endTime.diff(startTime, 'day')

  if (dayDiff >= 2) return 'DAY'
  if (hourDiff >= 12) return 'HOUR'
  return 'MINUTE'
}

const truncationFunction = (level: 'MINUTE' | 'HOUR' | 'DAY'): SafeLogSqlFragment => {
  switch (level) {
    case 'DAY':
      return safeSql`toStartOfDay`
    case 'HOUR':
      return safeSql`toStartOfHour`
    case 'MINUTE':
    default:
      return safeSql`toStartOfMinute`
  }
}

/**
 * Returns the projection list for a unified-logs row. All derivations are
 * inlined so the result can be referenced (or filtered) at the same query
 * level — the OTEL endpoint rejects subqueries.
 */
const rowProjection = (): SafeLogSqlFragment => safeSql`
    id,
    null AS source_id,
    timestamp,
    ${LOG_TYPE_EXPR} AS log_type,
    ${STATUS_EXPR} AS status,
    ${LEVEL_EXPR} AS level,
    ${ATTR.path} AS pathname,
    event_message,
    ${ATTR.method} AS method,
    null AS log_count,
    null AS logs
`

const buildBaseWhere = (
  search: QuerySearchParamsType,
  excludeField?: string
): SafeLogSqlFragment[] => {
  const effectiveLogTypes = search.log_type?.length ? search.log_type : [...DEFAULT_LOG_TYPES]
  const parts: SafeLogSqlFragment[] = []
  if (excludeField !== 'log_type') {
    parts.push(logTypeWherePredicate(effectiveLogTypes))
  }
  parts.push(...buildPredicates(search, excludeField))
  return parts
}

/**
 * Unified logs row query — flat SELECT, no subquery wrapper.
 */
export const getUnifiedLogsQuery = (search: QuerySearchParamsType): SafeLogSqlFragment => {
  const predicates = buildBaseWhere(search)
  return safeSql`
SELECT ${rowProjection()}
FROM logs
${whereClause(predicates)}
`
}

/**
 * Single-facet count query — a complete flat SELECT with GROUP BY.
 */
export const getFacetCountQuery = ({
  search,
  facet,
  facetSearch,
}: {
  search: QuerySearchParamsType
  facet: string
  facetSearch?: string
}): SafeLogSqlFragment => {
  if (!(FACET_FIELDS as readonly string[]).includes(facet)) {
    throw new Error('Invalid unified logs facet')
  }

  const MAX_FACETS_QUANTITY = 20

  const facetExpr: SafeLogSqlFragment =
    facet === 'log_type'
      ? LOG_TYPE_EXPR
      : facet === 'level'
        ? LEVEL_EXPR
        : facet === 'method'
          ? ATTR.method
          : facet === 'status'
            ? STATUS_EXPR
            : facet === 'pathname'
              ? ATTR.path
              : safeSql`log_attributes[${lit(facet)}]`

  const predicates: SafeLogSqlFragment[] = [
    ...buildBaseWhere(search, facet),
    safeSql`(${facetExpr}) IS NOT NULL AND (${facetExpr}) != ''`,
  ]
  if (facetSearch) {
    predicates.push(safeSql`(${facetExpr}) LIKE ${lit('%' + facetSearch + '%')}`)
  }

  return safeSql`
SELECT ${lit(facet)} AS dimension, (${facetExpr}) AS value, count() AS count
FROM logs
${whereClause(predicates)}
GROUP BY value
LIMIT ${lit(MAX_FACETS_QUANTITY)}
`
}

/**
 * Bundled count query — UNION ALL of (dimension, value, count) rows so the
 * frontend can render facet counts and total in one round trip.
 */
export const getLogsCountQuery = (search: QuerySearchParamsType): SafeLogSqlFragment => {
  // When no predicates remain, fall back to `1` so we emit a valid
  // tautology rather than a bare `WHERE`.
  const baseFiltersFor = (excludeField?: string): SafeLogSqlFragment => {
    const predicates = buildBaseWhere(search, excludeField)
    return predicates.length > 0 ? joinSqlFragments(predicates, ' AND ') : safeSql`1`
  }

  // The "total" badge should reflect the user's *current* filter set,
  // including any active log_type filter. Pass no excludeField so the
  // log_type predicate is included.
  const totalSql = safeSql`
SELECT 'total' AS dimension, 'all' AS value, count() AS count
FROM logs
WHERE ${baseFiltersFor()}
`

  const logTypeBranches = joinSqlFragments(
    Object.entries(LOG_TYPE_PREDICATE).map(
      ([logType, predicate]) =>
        safeSql`
SELECT 'log_type' AS dimension, ${lit(logType)} AS value, countIf(${predicate}) AS count
FROM logs
WHERE ${baseFiltersFor('log_type')}
`
    ),
    ' UNION ALL '
  )

  const levelBranches = joinSqlFragments(
    (['success', 'warning', 'error'] as const).map(
      (lvl) =>
        safeSql`
SELECT 'level' AS dimension, ${lit(lvl)} AS value, countIf((${LEVEL_EXPR}) = ${lit(lvl)}) AS count
FROM logs
WHERE ${baseFiltersFor('level')}
`
    ),
    ' UNION ALL '
  )

  const facetBranches = joinSqlFragments(
    (['method', 'status', 'pathname'] as const).map((facet) =>
      getFacetCountQuery({ search, facet })
    ),
    ' UNION ALL '
  )

  return joinSqlFragments([totalSql, logTypeBranches, levelBranches, facetBranches], ' UNION ALL ')
}

/**
 * Logs chart query with dynamic bucketing based on time range.
 */
export const getLogsChartQuery = (search: QuerySearchParamsType): SafeLogSqlFragment => {
  const truncationLevel = calculateChartBucketing(search)
  const truncFn = truncationFunction(truncationLevel)
  const predicates = buildBaseWhere(search)

  return safeSql`
SELECT
  ${truncFn}(timestamp) AS time_bucket,
  countIf((${LEVEL_EXPR}) = 'success') AS success,
  countIf((${LEVEL_EXPR}) = 'warning') AS warning,
  countIf((${LEVEL_EXPR}) = 'error') AS error,
  count() AS total_per_bucket
FROM logs
${whereClause(predicates)}
GROUP BY time_bucket
ORDER BY time_bucket ASC
`
}
