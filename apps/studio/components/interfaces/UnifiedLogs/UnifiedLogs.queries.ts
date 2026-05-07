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

/**
 * Builds query conditions from search parameters and returns WHERE clause
 */
const buildQueryConditions = (search: QuerySearchParamsType) => {
  const whereConditions: string[] = []

  Object.entries(search).forEach(([key, value]) => {
    // Skip pagination/control parameters
    if ((EXCLUDED_QUERY_PARAMS as readonly string[]).includes(key)) {
      return
    }

    if (Array.isArray(value) && value.length > 0) {
      whereConditions.push(`${key} IN (${value.map((v) => `'${v}'`).join(',')})`)
      return
    }

    if (value !== null && value !== undefined) {
      if (['host', 'pathname'].includes(key)) {
        whereConditions.push(`${key} LIKE '%${value}%'`)
      } else {
        whereConditions.push(`${key} = '${value}'`)
      }
    }
  })

  const finalWhere = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

  return { whereConditions, finalWhere }
}

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
 * Combine the requested log sources into the unified logs CTE.
 *
 * The OTEL endpoint exposes a single `logs` table with rows of the form
 *   { id, timestamp, project, source, event_message, severity_text, log_attributes }
 * where `source` is normalized (e.g. 'edge_logs', 'postgres_logs', ...). We
 * filter by source and project the columns the rest of the studio queries
 * expect (log_type, status, level, pathname, method, ...).
 */
export const getUnifiedLogsCTE = (logTypes: string[] = [...DEFAULT_LOG_TYPES]) => {
  const effectiveLogTypes = logTypes.filter((t) => t in LOG_TYPE_TO_SOURCE)
  const types = effectiveLogTypes.length ? effectiveLogTypes : [...DEFAULT_LOG_TYPES]
  const sources = types.map((t) => `'${LOG_TYPE_TO_SOURCE[t]}'`).join(', ')

  return `
WITH unified_logs AS (
  SELECT
    id,
    null AS source_id,
    timestamp AS timestamp,
    ${sourceCaseExpression()} AS log_type,
    toString(${ATTR.status}) AS status,
    CASE
      WHEN severity_text IN ('TRACE','DEBUG','INFO','LOG','NOTICE') THEN 'success'
      WHEN severity_text IN ('WARN','WARNING') THEN 'warning'
      WHEN severity_text IN ('ERROR','FATAL','CRITICAL','ALERT','EMERGENCY') THEN 'error'
      WHEN ${ATTR.status} != '' AND toInt32OrZero(${ATTR.status}) BETWEEN 200 AND 299 THEN 'success'
      WHEN ${ATTR.status} != '' AND toInt32OrZero(${ATTR.status}) BETWEEN 400 AND 499 THEN 'warning'
      WHEN ${ATTR.status} != '' AND toInt32OrZero(${ATTR.status}) >= 500 THEN 'error'
      ELSE 'success'
    END AS level,
    ${ATTR.path} AS pathname,
    event_message AS event_message,
    ${ATTR.method} AS method,
    null AS log_count,
    null AS logs
  FROM logs
  WHERE source IN (${sources})
)
  `
}

/**
 * Unified logs SQL query
 */
export const getUnifiedLogsQuery = (search: QuerySearchParamsType): string => {
  const { finalWhere } = buildQueryConditions(search)
  const effectiveLogTypes = search.log_type?.length ? search.log_type : [...DEFAULT_LOG_TYPES]

  const sql = `
${getUnifiedLogsCTE(effectiveLogTypes)}
SELECT
    id,
    source_id,
    timestamp,
    log_type,
    status,
    level,
    pathname,
    event_message,
    method,
    log_count,
    logs
FROM unified_logs
${finalWhere}
`

  return sql
}

// Helper function to build WHERE clause excluding a specific field
const buildFacetWhere = (search: QuerySearchParamsType, excludeField: string): string => {
  const conditions: string[] = []

  Object.entries(search).forEach(([key, value]) => {
    if (key === excludeField) return // Skip the field we're getting facets for
    if ((EXCLUDED_QUERY_PARAMS as readonly string[]).includes(key)) return // Skip pagination and special params

    if (Array.isArray(value) && value.length > 0) {
      conditions.push(`${key} IN (${value.map((v) => `'${v}'`).join(',')})`)
      return
    }

    if (value !== null && value !== undefined) {
      if (['host', 'pathname'].includes(key)) {
        conditions.push(`${key} LIKE '%${value}%'`)
      } else {
        conditions.push(`${key} = '${value}'`)
      }
    }
  })

  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
}

export const getFacetCountCTE = ({
  search,
  facet,
  facetSearch,
}: {
  search: QuerySearchParamsType
  facet: string
  facetSearch?: string
}) => {
  const MAX_FACETS_QUANTITY = 20
  const baseWhere = buildFacetWhere(search, `${facet}`)

  return `
${facet}_count AS (
  SELECT '${facet}' as dimension, ${facet} as value, COUNT(*) as count
  FROM unified_logs
  ${baseWhere || `WHERE ${facet} IS NOT NULL`}
  ${baseWhere ? ` AND ${facet} IS NOT NULL` : ''}
  ${!!facetSearch ? `AND ${facet} LIKE '%${facetSearch}%'` : ''}
  GROUP BY ${facet}
  LIMIT ${MAX_FACETS_QUANTITY}
)
`.trim()
}

export const getLogsCountQuery = (search: QuerySearchParamsType): string => {
  const effectiveLogTypes = search.log_type?.length ? search.log_type : [...DEFAULT_LOG_TYPES]
  const logTypeWhere = buildFacetWhere(search, 'log_type') || 'WHERE log_type IS NOT NULL'
  const levelWhere = buildFacetWhere(search, 'level') || 'WHERE level IS NOT NULL'

  const sql = `
${getUnifiedLogsCTE(effectiveLogTypes)},

log_type_counts AS (
  SELECT
    COUNT(*) AS total,
    countIf(log_type = 'edge') AS edge_count,
    countIf(log_type = 'postgrest') AS postgrest_count,
    countIf(log_type = 'storage') AS storage_count,
    countIf(log_type = 'postgres') AS postgres_count,
    countIf(log_type = 'edge function') AS edge_function_count,
    countIf(log_type = 'auth') AS auth_count
  FROM unified_logs
  ${logTypeWhere}
),

level_counts AS (
  SELECT
    countIf(level = 'success') AS success_count,
    countIf(level = 'warning') AS warning_count,
    countIf(level = 'error') AS error_count
  FROM unified_logs
  ${levelWhere}
),

${getFacetCountCTE({ search, facet: 'method' })},
${getFacetCountCTE({ search, facet: 'status' })},
${getFacetCountCTE({ search, facet: 'pathname' })}

SELECT 'total' AS dimension, 'all' AS value, total AS count FROM log_type_counts
UNION ALL SELECT 'log_type', 'edge', edge_count FROM log_type_counts
UNION ALL SELECT 'log_type', 'postgrest', postgrest_count FROM log_type_counts
UNION ALL SELECT 'log_type', 'storage', storage_count FROM log_type_counts
UNION ALL SELECT 'log_type', 'postgres', postgres_count FROM log_type_counts
UNION ALL SELECT 'log_type', 'edge function', edge_function_count FROM log_type_counts
UNION ALL SELECT 'log_type', 'auth', auth_count FROM log_type_counts
UNION ALL SELECT 'level', 'success', success_count FROM level_counts
UNION ALL SELECT 'level', 'warning', warning_count FROM level_counts
UNION ALL SELECT 'level', 'error', error_count FROM level_counts
UNION ALL SELECT dimension, value, count FROM method_count
UNION ALL SELECT dimension, value, count FROM status_count
UNION ALL SELECT dimension, value, count FROM pathname_count
`

  return sql
}

/**
 * Logs chart query with dynamic bucketing based on time range.
 */
export const getLogsChartQuery = (search: QuerySearchParamsType): string => {
  const { finalWhere } = buildQueryConditions(search)
  const truncationLevel = calculateChartBucketing(search)
  const truncFn = truncationFunction(truncationLevel)
  const effectiveLogTypes = search.log_type?.length ? search.log_type : [...DEFAULT_LOG_TYPES]

  return `
${getUnifiedLogsCTE(effectiveLogTypes)}
SELECT
  ${truncFn}(timestamp) as time_bucket,
  countIf(level = 'success') as success,
  countIf(level = 'warning') as warning,
  countIf(level = 'error') as error,
  COUNT(*) as total_per_bucket
FROM unified_logs
${finalWhere}
GROUP BY time_bucket
ORDER BY time_bucket ASC
`
}
