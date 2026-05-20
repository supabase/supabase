// Legacy BigQuery unified-logs queries. Kept side-by-side with
// UnifiedLogs.queries.ts (the OTEL/ClickHouse version) so the
// `otelUnifiedLogs` feature flag can route traffic between the two paths
// during the migration. This file should be deleted once the flag is
// removed.

import dayjs from 'dayjs'

import { DEFAULT_LOG_TYPES } from './UnifiedLogs.constants'
import { QuerySearchParamsType, SearchParamsType } from './UnifiedLogs.types'
import {
  bqIdent,
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

/**
 * Builds WHERE-clause fragments from a search-param map. Identifier-position
 * keys are validated via `bqIdent()` (regex allowlist) and value-position
 * inputs via `analyticsLiteral` — both throw on disallowed input, in which
 * case we drop the predicate rather than emit unsafe SQL.
 *
 * @param search Search params (URL-derived filter values)
 * @param excludeKey Optional key to skip — used by facet-count branches that
 *                   need every filter applied *except* the one being faceted
 * @returns Array of SafeLogSqlFragment predicates ready to be AND-joined
 */
const buildConditions = (
  search: QuerySearchParamsType,
  excludeKey?: string
): SafeLogSqlFragment[] => {
  const conditions: SafeLogSqlFragment[] = []

  Object.entries(search).forEach(([key, value]) => {
    if (key === excludeKey) return
    if ((EXCLUDED_QUERY_PARAMS as readonly string[]).includes(key)) return

    try {
      // `key` is interpolated as a column identifier. `bqIdent()` rejects
      // anything outside `[A-Za-z_][A-Za-z0-9_]*` (notably no spaces, so a
      // crafted URL key like `level OR id IS NOT NULL` is dropped rather
      // than emitted into the WHERE clause).
      const col = bqIdent(key)

      if (Array.isArray(value) && value.length > 0) {
        const inList = joinSqlFragments(
          value.map((v) => lit(String(v))),
          ','
        )
        conditions.push(safeSql`${col} IN (${inList})`)
        return
      }

      if (value !== null && value !== undefined) {
        if (key === 'host' || key === 'pathname') {
          conditions.push(safeSql`${col} LIKE ${lit('%' + String(value) + '%')}`)
        } else {
          conditions.push(safeSql`${col} = ${lit(String(value))}`)
        }
      }
    } catch {
      // bqIdent() or analyticsLiteral() rejected the input — drop the predicate.
    }
  })

  return conditions
}

const whereClause = (conditions: SafeLogSqlFragment[]): SafeLogSqlFragment =>
  conditions.length > 0 ? safeSql`WHERE ${joinSqlFragments(conditions, ' AND ')}` : safeSql``

/**
 * Calculates how much the chart start datetime should be offset given the current datetime filter params
 * and determines the appropriate bucketing level (minute, hour, day)
 * Ported from the older implementation (apps/studio/components/interfaces/Settings/Logs/Logs.utils.ts)
 */
type TruncationLevel = 'MINUTE' | 'HOUR' | 'DAY'

const TRUNCATION_LEVEL_SQL: Record<TruncationLevel, SafeLogSqlFragment> = {
  MINUTE: safeSql`MINUTE`,
  HOUR: safeSql`HOUR`,
  DAY: safeSql`DAY`,
}

const calculateChartBucketing = (
  search: SearchParamsType | Record<string, unknown>
): TruncationLevel => {
  // Extract start and end times from the date array if available
  const dateRange = (search.date as Array<Date | string | number | null | undefined>) || []

  // Handle timestamps that could be in various formats
  const convertToMillis = (timestamp: Date | string | number | null | undefined) => {
    if (!timestamp) return null
    // If timestamp is a Date object
    if (timestamp instanceof Date) return timestamp.getTime()

    // If timestamp is a string that needs parsing
    if (typeof timestamp === 'string') return dayjs(timestamp).valueOf()

    // If timestamp is already a number (unix timestamp)
    // Check if microseconds (16 digits) and convert to milliseconds
    if (typeof timestamp === 'number') {
      const str = timestamp.toString()
      if (str.length >= 16) return Math.floor(timestamp / 1000)
      return timestamp
    }

    return null
  }

  let startMillis = convertToMillis(dateRange[0])
  let endMillis = convertToMillis(dateRange[1])

  // Default values if not set
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

/**
 * Edge logs query fragment
 *
 * excludes `/rest/` in the path
 */
const getEdgeLogsQuery = (): SafeLogSqlFragment => safeSql`
    select
      id,
      null as source_id,
      el.timestamp as timestamp,
      'edge' as log_type,
      CAST(edge_logs_response.status_code AS STRING) as status,
      CASE
          WHEN edge_logs_response.status_code BETWEEN 200 AND 299 THEN 'success'
          WHEN edge_logs_response.status_code BETWEEN 400 AND 499 THEN 'warning'
          WHEN edge_logs_response.status_code >= 500 THEN 'error'
          ELSE 'success'
      END as level,
      edge_logs_request.path as pathname,
      null as event_message,
      edge_logs_request.method as method,
      null as log_count,
      null as logs
    from edge_logs as el
    cross join unnest(metadata) as edge_logs_metadata
    cross join unnest(edge_logs_metadata.request) as edge_logs_request
    cross join unnest(edge_logs_metadata.response) as edge_logs_response

    -- ONLY include logs where the path does not include /rest/
    WHERE edge_logs_request.path NOT LIKE '%/rest/%'
    AND edge_logs_request.path NOT LIKE '%/storage/%'
  `

// Postgrest logs — WHERE pathname includes `/rest/`
const getPostgrestLogsQuery = (): SafeLogSqlFragment => safeSql`
    select
      id,
      null as source_id,
      el.timestamp as timestamp,
      'postgrest' as log_type,
      CAST(edge_logs_response.status_code AS STRING) as status,
      CASE
          WHEN edge_logs_response.status_code BETWEEN 200 AND 299 THEN 'success'
          WHEN edge_logs_response.status_code BETWEEN 400 AND 499 THEN 'warning'
          WHEN edge_logs_response.status_code >= 500 THEN 'error'
          ELSE 'success'
      END as level,
      edge_logs_request.path as pathname,
      null as event_message,
      edge_logs_request.method as method,
      null as log_count,
      null as logs
    from edge_logs as el
    cross join unnest(metadata) as edge_logs_metadata
    cross join unnest(edge_logs_metadata.request) as edge_logs_request
    cross join unnest(edge_logs_metadata.response) as edge_logs_response

    -- ONLY include logs where the path includes /rest/
    WHERE edge_logs_request.path LIKE '%/rest/%'
  `

/**
 * Postgres logs query fragment
 */
const getPostgresLogsQuery = (): SafeLogSqlFragment => safeSql`
    select
      id,
      null as source_id,
      pgl.timestamp as timestamp,
      'postgres' as log_type,
      CAST(pgl_parsed.sql_state_code AS STRING) as status,
      CASE
          WHEN pgl_parsed.error_severity = 'LOG' THEN 'success'
          WHEN pgl_parsed.error_severity = 'WARNING' THEN 'warning'
          WHEN pgl_parsed.error_severity = 'FATAL' THEN 'error'
          WHEN pgl_parsed.error_severity = 'ERROR' THEN 'error'
          ELSE null
      END as level,
      null as pathname,
      event_message as event_message,
      null as method,
      null as log_count,
      null as logs
    from postgres_logs as pgl
    cross join unnest(pgl.metadata) as pgl_metadata
    cross join unnest(pgl_metadata.parsed) as pgl_parsed
  `

/**
 * Edge function logs query fragment
 */
const getEdgeFunctionLogsQuery = (): SafeLogSqlFragment => safeSql`
    select
      id,
      null as source_id,
      fel.timestamp as timestamp,
      'edge function' as log_type,
      CAST(fel_response.status_code AS STRING) as status,
      CASE
          WHEN fel_response.status_code BETWEEN 200 AND 299 THEN 'success'
          WHEN fel_response.status_code BETWEEN 400 AND 499 THEN 'warning'
          WHEN fel_response.status_code >= 500 THEN 'error'
          ELSE 'success'
      END as level,
      fel_request.pathname as pathname,
      COALESCE(function_logs_agg.last_event_message, '') as event_message,
      fel_request.method as method,
      function_logs_agg.function_log_count as log_count,
      null as logs
    from function_edge_logs as fel
    cross join unnest(metadata) as fel_metadata
    cross join unnest(fel_metadata.response) as fel_response
    cross join unnest(fel_metadata.request) as fel_request
    left join (
    SELECT
        fl_metadata.request_id,
        COUNT(fl.id) as function_log_count,
        ANY_VALUE(fl.event_message) as last_event_message
    FROM function_logs as fl
    CROSS JOIN UNNEST(fl.metadata) as fl_metadata
    WHERE fl_metadata.request_id IS NOT NULL
    GROUP BY fl_metadata.request_id
    ) as function_logs_agg on fel_metadata.request_id = function_logs_agg.request_id
  `

/**
 * Auth logs query fragment
 */
const getAuthLogsQuery = (): SafeLogSqlFragment => safeSql`
    select
      el_in_al.id as id,
      al.id as source_id,
      el_in_al.timestamp as timestamp,
      'auth' as log_type,
      CAST(el_in_al_response.status_code AS STRING) as status,
      CASE
          WHEN el_in_al_response.status_code BETWEEN 200 AND 299 THEN 'success'
          WHEN el_in_al_response.status_code BETWEEN 400 AND 499 THEN 'warning'
          WHEN el_in_al_response.status_code >= 500 THEN 'error'
          ELSE 'success'
      END as level,
      el_in_al_request.path as pathname,
      null as event_message,
      el_in_al_request.method as method,
      null as log_count,
      null as logs
    from auth_logs as al
    cross join unnest(metadata) as al_metadata
    left join (
    edge_logs as el_in_al
        cross join unnest (metadata) as el_in_al_metadata
        cross join unnest (el_in_al_metadata.response) as el_in_al_response
        cross join unnest (el_in_al_response.headers) as el_in_al_response_headers
        cross join unnest (el_in_al_metadata.request) as el_in_al_request
    )
    on al_metadata.request_id = el_in_al_response_headers.cf_ray
    WHERE al_metadata.request_id is not null
  `

/**
 * Supabase storage logs query fragment
 */
const getSupabaseStorageLogsQuery = (): SafeLogSqlFragment => safeSql`
    select
      id,
      null as source_id,
      el.timestamp as timestamp,
      'storage' as log_type,
      CAST(edge_logs_response.status_code AS STRING) as status,
      CASE
          WHEN edge_logs_response.status_code BETWEEN 200 AND 299 THEN 'success'
          WHEN edge_logs_response.status_code BETWEEN 400 AND 499 THEN 'warning'
          WHEN edge_logs_response.status_code >= 500 THEN 'error'
          ELSE 'success'
      END as level,
      edge_logs_request.path as pathname,
      null as event_message,
      edge_logs_request.method as method,
      null as log_count,
      null as logs
    from edge_logs as el
    cross join unnest(metadata) as edge_logs_metadata
    cross join unnest(edge_logs_metadata.request) as edge_logs_request
    cross join unnest(edge_logs_metadata.response) as edge_logs_response
    -- ONLY include logs where the path includes /storage/
    WHERE edge_logs_request.path LIKE '%/storage/%'
  `

const LOG_TYPE_QUERIES: Record<string, () => SafeLogSqlFragment> = {
  edge: getEdgeLogsQuery,
  postgrest: getPostgrestLogsQuery,
  postgres: getPostgresLogsQuery,
  'edge function': getEdgeFunctionLogsQuery,
  auth: getAuthLogsQuery,
  storage: getSupabaseStorageLogsQuery,
}

/**
 * Combine the requested log sources to create the unified logs CTE.
 * Defaults to postgres + postgrest on first load to reduce query cost.
 */
export const getUnifiedLogsCTE = (
  logTypes: string[] = [...DEFAULT_LOG_TYPES]
): SafeLogSqlFragment => {
  const queries = logTypes
    .filter((type) => type in LOG_TYPE_QUERIES)
    .map((type) => LOG_TYPE_QUERIES[type]())

  const effective =
    queries.length > 0 ? queries : DEFAULT_LOG_TYPES.map((t) => LOG_TYPE_QUERIES[t]())

  return safeSql`
WITH unified_logs AS (
    ${joinSqlFragments(effective, ' union all ')}
)
  `
}

/**
 * Unified logs SQL query
 */
export const getUnifiedLogsQuery = (search: QuerySearchParamsType): SafeLogSqlFragment => {
  const conditions = buildConditions(search)
  const effectiveLogTypes = search.log_type?.length ? search.log_type : [...DEFAULT_LOG_TYPES]

  return safeSql`
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
${whereClause(conditions)}
`
}

export const getFacetCountCTE = ({
  search,
  facet,
  facetSearch,
}: {
  search: QuerySearchParamsType
  facet: string
  facetSearch?: string
}): SafeLogSqlFragment => {
  const MAX_FACETS_QUANTITY = 20

  // `facet` is used both as a column reference and to derive a CTE name;
  // quote each appropriately with bqIdent() to reject non-identifier inputs.
  const facetCol = bqIdent(facet)
  const facetCte = bqIdent(facet + '_count')
  const baseConditions = buildConditions(search, facet)
  const facetSearchClause = facetSearch
    ? safeSql`AND ${facetCol} LIKE ${lit('%' + facetSearch + '%')}`
    : safeSql``

  const where =
    baseConditions.length > 0
      ? safeSql`WHERE ${joinSqlFragments(baseConditions, ' AND ')} AND ${facetCol} IS NOT NULL`
      : safeSql`WHERE ${facetCol} IS NOT NULL`

  return safeSql`
${facetCte} AS (
  SELECT ${lit(facet)} as dimension, ${facetCol} as value, COUNT(*) as count
  FROM unified_logs
  ${where}
  ${facetSearchClause}
  GROUP BY ${facetCol}
  LIMIT ${lit(MAX_FACETS_QUANTITY)}
)
`
}

export const getUnifiedLogsCountCTE = (): SafeLogSqlFragment => safeSql`
WITH unified_logs AS (
    -- Single scan of edge_logs covering edge gateway, postgrest, and storage
    select
      id,
      CASE
        WHEN edge_logs_request.path LIKE '%/rest/%' THEN 'postgrest'
        WHEN edge_logs_request.path LIKE '%/storage/%' THEN 'storage'
        ELSE 'edge'
      END as log_type,
      CAST(edge_logs_response.status_code AS STRING) as status,
      CASE
        WHEN edge_logs_response.status_code BETWEEN 200 AND 299 THEN 'success'
        WHEN edge_logs_response.status_code BETWEEN 400 AND 499 THEN 'warning'
        WHEN edge_logs_response.status_code >= 500 THEN 'error'
        ELSE 'success'
      END as level,
      edge_logs_request.path as pathname,
      edge_logs_request.method as method
    from edge_logs as el
    cross join unnest(metadata) as edge_logs_metadata
    cross join unnest(edge_logs_metadata.request) as edge_logs_request
    cross join unnest(edge_logs_metadata.response) as edge_logs_response

    union all

    -- Postgres logs
    select
      id,
      'postgres' as log_type,
      CAST(pgl_parsed.sql_state_code AS STRING) as status,
      CASE
        WHEN pgl_parsed.error_severity = 'LOG' THEN 'success'
        WHEN pgl_parsed.error_severity = 'WARNING' THEN 'warning'
        WHEN pgl_parsed.error_severity = 'FATAL' THEN 'error'
        WHEN pgl_parsed.error_severity = 'ERROR' THEN 'error'
        ELSE null
      END as level,
      null as pathname,
      null as method
    from postgres_logs as pgl
    cross join unnest(pgl.metadata) as pgl_metadata
    cross join unnest(pgl_metadata.parsed) as pgl_parsed

    union all

    -- Edge function logs
    select
      fel.id,
      'edge function' as log_type,
      CAST(fel_response.status_code AS STRING) as status,
      CASE
        WHEN fel_response.status_code BETWEEN 200 AND 299 THEN 'success'
        WHEN fel_response.status_code BETWEEN 400 AND 499 THEN 'warning'
        WHEN fel_response.status_code >= 500 THEN 'error'
        ELSE 'success'
      END as level,
      fel_request.pathname as pathname,
      fel_request.method as method
    from function_edge_logs as fel
    cross join unnest(metadata) as fel_metadata
    cross join unnest(fel_metadata.response) as fel_response
    cross join unnest(fel_metadata.request) as fel_request

    union all

    -- Auth logs
    select
      el_in_al.id as id,
      'auth' as log_type,
      CAST(el_in_al_response.status_code AS STRING) as status,
      CASE
        WHEN el_in_al_response.status_code BETWEEN 200 AND 299 THEN 'success'
        WHEN el_in_al_response.status_code BETWEEN 400 AND 499 THEN 'warning'
        WHEN el_in_al_response.status_code >= 500 THEN 'error'
        ELSE 'success'
      END as level,
      el_in_al_request.path as pathname,
      el_in_al_request.method as method
    from auth_logs as al
    cross join unnest(metadata) as al_metadata
    left join (
    edge_logs as el_in_al
      cross join unnest(metadata) as el_in_al_metadata
      cross join unnest(el_in_al_metadata.response) as el_in_al_response
      cross join unnest(el_in_al_response.headers) as el_in_al_response_headers
      cross join unnest(el_in_al_metadata.request) as el_in_al_request
    )
    on al_metadata.request_id = el_in_al_response_headers.cf_ray
    WHERE al_metadata.request_id is not null
)
  `

export const getLogsCountQuery = (search: QuerySearchParamsType): SafeLogSqlFragment => {
  const effectiveLogTypes = search.log_type?.length ? search.log_type : [...DEFAULT_LOG_TYPES]
  const logTypeConditions = buildConditions(search, 'log_type')
  const levelConditions = buildConditions(search, 'level')
  const logTypeWhere: SafeLogSqlFragment =
    logTypeConditions.length > 0
      ? safeSql`WHERE ${joinSqlFragments(logTypeConditions, ' AND ')}`
      : safeSql`WHERE log_type IS NOT NULL`
  const levelWhere: SafeLogSqlFragment =
    levelConditions.length > 0
      ? safeSql`WHERE ${joinSqlFragments(levelConditions, ' AND ')}`
      : safeSql`WHERE level IS NOT NULL`

  return safeSql`
${getUnifiedLogsCTE(effectiveLogTypes)},

-- Single COUNTIF pass for all log_type buckets + total (no GROUP BY / sort needed)
log_type_counts AS (
  SELECT
    COUNT(*) AS total,
    COUNTIF(log_type = 'edge') AS edge_count,
    COUNTIF(log_type = 'postgrest') AS postgrest_count,
    COUNTIF(log_type = 'storage') AS storage_count,
    COUNTIF(log_type = 'postgres') AS postgres_count,
    COUNTIF(log_type = 'edge function') AS edge_function_count,
    COUNTIF(log_type = 'auth') AS auth_count
  FROM unified_logs
  ${logTypeWhere}
),

-- Single COUNTIF pass for all level buckets
level_counts AS (
  SELECT
    COUNTIF(level = 'success') AS success_count,
    COUNTIF(level = 'warning') AS warning_count,
    COUNTIF(level = 'error') AS error_count
  FROM unified_logs
  ${levelWhere}
),

-- Variable facets: open-ended values still need GROUP BY
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
}

/**
 * Enhanced logs chart query with dynamic bucketing based on time range
 * Incorporates dynamic bucketing from the older implementation
 */
export const getLogsChartQuery = (search: QuerySearchParamsType): SafeLogSqlFragment => {
  const conditions = buildConditions(search)
  const truncationLevel = calculateChartBucketing(search)
  const effectiveLogTypes = search.log_type?.length ? search.log_type : [...DEFAULT_LOG_TYPES]

  return safeSql`
${getUnifiedLogsCTE(effectiveLogTypes)}
SELECT
  TIMESTAMP_TRUNC(timestamp, ${TRUNCATION_LEVEL_SQL[truncationLevel]}) as time_bucket,
  COUNTIF(level = 'success') as success,
  COUNTIF(level = 'warning') as warning,
  COUNTIF(level = 'error') as error,
  COUNT(*) as total_per_bucket
FROM unified_logs
${whereClause(conditions)}
GROUP BY time_bucket
ORDER BY time_bucket ASC
`
}
