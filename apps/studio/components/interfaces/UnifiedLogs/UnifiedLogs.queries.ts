import dayjs from 'dayjs'

import { DEFAULT_LOG_TYPES } from './UnifiedLogs.constants'
import { QuerySearchParamsType, SearchParamsType } from './UnifiedLogs.types'

// Pagination and control parameters
const PAGINATION_PARAMS = ['sort', 'start', 'size', 'uuid', 'cursor', 'direction', 'live'] as const

// Special filter parameters that need custom handling
const SPECIAL_FILTER_PARAMS = ['date'] as const

// Combined list of all parameters to exclude from standard filtering
const EXCLUDED_QUERY_PARAMS = [...PAGINATION_PARAMS, ...SPECIAL_FILTER_PARAMS] as const

// OTEL log_attributes keys for HTTP-style fields. Centralized so they can be
// adjusted in one place if the backend conventions change.
const ATTR = {
  method: `log_attributes['request.method']`,
  status: `log_attributes['response.status_code']`,
  path: `log_attributes['request.path']`,
} as const

// Maps the studio-facing log_type label to the OTEL `source` value the
// /logs.all.otel endpoint normalizes to.
const LOG_TYPE_TO_SOURCE: Record<string, string> = {
  edge: 'edge_logs',
  postgrest: 'postgrest_logs',
  storage: 'storage_logs',
  postgres: 'postgres_logs',
  'edge function': 'function_edge_logs',
  auth: 'auth_logs',
}

const sourceCaseExpression = () => {
  const whens = Object.entries(LOG_TYPE_TO_SOURCE)
    .map(([logType, source]) => `WHEN '${source}' THEN '${logType}'`)
    .join('\n      ')
  return `CASE source\n      ${whens}\n      ELSE source\n    END`
}

// SQL expression for derived `level`. Used inline (not as alias reference)
// because the OTEL endpoint can't resolve aliases inside countIf when the
// alias is not in GROUP BY.
const LEVEL_EXPR = `CASE
      WHEN severity_text IN ('TRACE','DEBUG','INFO','LOG','NOTICE') THEN 'success'
      WHEN severity_text IN ('WARN','WARNING') THEN 'warning'
      WHEN severity_text IN ('ERROR','FATAL','CRITICAL','ALERT','EMERGENCY') THEN 'error'
      WHEN ${ATTR.status} != '' AND toInt32OrZero(${ATTR.status}) BETWEEN 200 AND 299 THEN 'success'
      WHEN ${ATTR.status} != '' AND toInt32OrZero(${ATTR.status}) BETWEEN 400 AND 499 THEN 'warning'
      WHEN ${ATTR.status} != '' AND toInt32OrZero(${ATTR.status}) >= 500 THEN 'error'
      ELSE 'success'
    END`

const sourceListSql = (logTypes: string[]) => {
  const effective = logTypes.filter((t) => t in LOG_TYPE_TO_SOURCE)
  const types = effective.length ? effective : [...DEFAULT_LOG_TYPES]
  return types.map((t) => `'${LOG_TYPE_TO_SOURCE[t]}'`).join(', ')
}

/**
 * Translates a frontend filter key/value pair into an underlying SQL predicate.
 * The OTEL endpoint won't accept queries that reference derived aliases like
 * `log_type` or `level` in WHERE for some shapes, so we always emit raw-column
 * predicates (source/severity_text/log_attributes[…]).
 */
const translateFilter = (key: string, value: unknown): string | null => {
  if (value === null || value === undefined) return null

  const arr = Array.isArray(value) ? (value.length > 0 ? value : null) : null
  if (Array.isArray(value) && !arr) return null

  const inList = (values: readonly unknown[]) => `(${values.map((v) => `'${v}'`).join(',')})`

  switch (key) {
    case 'log_type': {
      const sources = (arr ?? [value]).map((v) => LOG_TYPE_TO_SOURCE[String(v)] ?? String(v))
      return `source IN ${inList(sources)}`
    }
    case 'level': {
      // No simple raw column for level; reference the inline CASE expression.
      const levels = arr ?? [value]
      return `(${LEVEL_EXPR}) IN ${inList(levels.map((v) => String(v)))}`
    }
    case 'method':
      return arr ? `${ATTR.method} IN ${inList(arr)}` : `${ATTR.method} = '${value}'`
    case 'status':
      return arr ? `${ATTR.status} IN ${inList(arr)}` : `${ATTR.status} = '${value}'`
    case 'pathname':
      return arr
        ? `(${arr.map((v) => `${ATTR.path} LIKE '%${v}%'`).join(' OR ')})`
        : `${ATTR.path} LIKE '%${value}%'`
    case 'host':
      // Best-effort: use full request URL since `host` isn't a top-level field.
      return arr
        ? `(${arr.map((v) => `log_attributes['request.url'] LIKE '%${v}%'`).join(' OR ')})`
        : `log_attributes['request.url'] LIKE '%${value}%'`
    default:
      // Unknown filter key — fall back to a generic equality on log_attributes.
      return arr
        ? `log_attributes['${key}'] IN ${inList(arr)}`
        : `log_attributes['${key}'] = '${value}'`
  }
}

/**
 * Builds an array of WHERE predicate strings from search params, optionally
 * skipping a specific facet field (used when computing faceted counts).
 */
const buildPredicates = (search: QuerySearchParamsType, excludeField?: string) => {
  const predicates: string[] = []
  Object.entries(search).forEach(([key, value]) => {
    if (key === excludeField) return
    if ((EXCLUDED_QUERY_PARAMS as readonly string[]).includes(key)) return
    const predicate = translateFilter(key, value)
    if (predicate) predicates.push(predicate)
  })
  return predicates
}

const whereClause = (predicates: string[]) =>
  predicates.length > 0 ? `WHERE ${predicates.join(' AND ')}` : ''

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

const truncationFunction = (level: 'MINUTE' | 'HOUR' | 'DAY') => {
  switch (level) {
    case 'DAY':
      return 'toStartOfDay'
    case 'HOUR':
      return 'toStartOfHour'
    case 'MINUTE':
    default:
      return 'toStartOfMinute'
  }
}

/**
 * Returns the projection list for a unified-logs row. All derivations are
 * inlined so the result can be referenced (or filtered) at the same query
 * level — the OTEL endpoint rejects subqueries.
 */
const rowProjection = () => `
    id,
    null AS source_id,
    timestamp,
    ${sourceCaseExpression()} AS log_type,
    toString(${ATTR.status}) AS status,
    ${LEVEL_EXPR} AS level,
    ${ATTR.path} AS pathname,
    event_message,
    ${ATTR.method} AS method,
    null AS log_count,
    null AS logs
`

/**
 * Unified logs row query — flat SELECT, no subquery wrapper.
 */
export const getUnifiedLogsQuery = (search: QuerySearchParamsType): string => {
  const effectiveLogTypes = search.log_type?.length ? search.log_type : [...DEFAULT_LOG_TYPES]
  const sources = sourceListSql(effectiveLogTypes)
  const predicates = [
    `source IN (${sources})`,
    ...buildPredicates(search).filter((p) => !p.startsWith('source IN ')),
  ]
  return `
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
  logTypes,
}: {
  search: QuerySearchParamsType
  facet: string
  facetSearch?: string
  logTypes?: string[]
}) => {
  const MAX_FACETS_QUANTITY = 20
  const effectiveLogTypes = logTypes?.length ? logTypes : [...DEFAULT_LOG_TYPES]
  const sources = sourceListSql(effectiveLogTypes)

  const facetExpr =
    facet === 'log_type'
      ? sourceCaseExpression()
      : facet === 'level'
        ? LEVEL_EXPR
        : facet === 'method'
          ? ATTR.method
          : facet === 'status'
            ? `toString(${ATTR.status})`
            : facet === 'pathname'
              ? ATTR.path
              : `log_attributes['${facet}']`

  const predicates = [
    `source IN (${sources})`,
    ...buildPredicates(search, facet).filter((p) => !p.startsWith('source IN ')),
    `(${facetExpr}) IS NOT NULL AND (${facetExpr}) != ''`,
  ]
  if (facetSearch) {
    predicates.push(`(${facetExpr}) LIKE '%${facetSearch}%'`)
  }

  return `
SELECT '${facet}' AS dimension, (${facetExpr}) AS value, count() AS count
FROM logs
${whereClause(predicates)}
GROUP BY value
LIMIT ${MAX_FACETS_QUANTITY}
`.trim()
}

/**
 * Bundled count query — UNION ALL of (dimension, value, count) rows so the
 * frontend can render facet counts and total in one round trip.
 */
export const getLogsCountQuery = (search: QuerySearchParamsType): string => {
  const effectiveLogTypes = search.log_type?.length ? search.log_type : [...DEFAULT_LOG_TYPES]
  const sources = sourceListSql(effectiveLogTypes)
  const baseFilters = (excludeField?: string) =>
    [
      `source IN (${sources})`,
      ...buildPredicates(search, excludeField).filter((p) => !p.startsWith('source IN ')),
    ].join(' AND ')

  const totalSql = `
SELECT 'total' AS dimension, 'all' AS value, count() AS count
FROM logs
WHERE ${baseFilters('log_type')}
`.trim()

  // For log_type and level, reuse a single SELECT each with countIf branches
  // expanded via UNION ALL so the response shape stays (dimension, value, count).
  const logTypeBranches = Object.entries(LOG_TYPE_TO_SOURCE)
    .map(([logType, sourceName]) =>
      `
SELECT 'log_type' AS dimension, '${logType}' AS value, countIf(source = '${sourceName}') AS count
FROM logs
WHERE ${baseFilters('log_type')}
`.trim()
    )
    .join('\nUNION ALL\n')

  const levelBranches = ['success', 'warning', 'error']
    .map((lvl) =>
      `
SELECT 'level' AS dimension, '${lvl}' AS value, countIf((${LEVEL_EXPR}) = '${lvl}') AS count
FROM logs
WHERE ${baseFilters('level')}
`.trim()
    )
    .join('\nUNION ALL\n')

  const facetBranches = ['method', 'status', 'pathname']
    .map((facet) => getFacetCountQuery({ search, facet, logTypes: effectiveLogTypes }))
    .join('\nUNION ALL\n')

  return [totalSql, logTypeBranches, levelBranches, facetBranches].join('\nUNION ALL\n')
}

/**
 * Logs chart query with dynamic bucketing based on time range.
 */
export const getLogsChartQuery = (search: QuerySearchParamsType): string => {
  const truncationLevel = calculateChartBucketing(search)
  const truncFn = truncationFunction(truncationLevel)
  const effectiveLogTypes = search.log_type?.length ? search.log_type : [...DEFAULT_LOG_TYPES]
  const sources = sourceListSql(effectiveLogTypes)

  const predicates = [
    `source IN (${sources})`,
    ...buildPredicates(search).filter((p) => !p.startsWith('source IN ')),
  ]

  return `
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
