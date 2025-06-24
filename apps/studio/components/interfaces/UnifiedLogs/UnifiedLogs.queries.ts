import dayjs from 'dayjs'

import { QuerySearchParamsType, SearchParamsType } from './UnifiedLogs.types'

// Pagination and control parameters
const PAGINATION_PARAMS = ['sort', 'start', 'size', 'uuid', 'cursor', 'direction', 'live'] as const

// Special filter parameters that need custom handling
const SPECIAL_FILTER_PARAMS = ['date'] as const

// Combined list of all parameters to exclude from standard filtering
const EXCLUDED_QUERY_PARAMS = [...PAGINATION_PARAMS, ...SPECIAL_FILTER_PARAMS] as const
const BASE_CONDITIONS_EXCLUDED_PARAMS = [...PAGINATION_PARAMS, 'date', 'level'] as const

/**
 * Builds query conditions from search parameters and returns WHERE clause
 * @param search SearchParamsType object containing query parameters
 * @returns Object with whereConditions array and formatted WHERE clause
 */
const buildQueryConditions = (search: QuerySearchParamsType) => {
  const whereConditions: string[] = []

  // Process all search parameters for filtering
  Object.entries(search).forEach(([key, value]) => {
    // Skip pagination/control parameters
    if (EXCLUDED_QUERY_PARAMS.includes(key as any)) {
      return
    }

    // Handle array filters (IN clause)
    if (Array.isArray(value) && value.length > 0) {
      whereConditions.push(`${key} IN (${value.map((v) => `'${v}'`).join(',')})`)
      return
    }

    // Handle scalar values
    if (value !== null && value !== undefined) {
      whereConditions.push(`${key} = '${value}'`)
    }
  })

  // Create final WHERE clause
  const finalWhere = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

  return { whereConditions, finalWhere }
}

/**
 * Builds level-specific condition for different log types
 */
const buildLevelConditions = (logType: string, levelFilter: string[]) => {
  const conditions = []

  switch (logType) {
    case 'edge':
      if (levelFilter.includes('success'))
        conditions.push('edge_logs_response.status_code BETWEEN 200 AND 299')
      if (levelFilter.includes('warning'))
        conditions.push('edge_logs_response.status_code BETWEEN 400 AND 499')
      if (levelFilter.includes('error')) conditions.push('edge_logs_response.status_code >= 500')
      break
    case 'postgres':
      if (levelFilter.includes('success')) conditions.push("pgl_parsed.error_severity = 'LOG'")
      if (levelFilter.includes('warning')) conditions.push("pgl_parsed.error_severity = 'WARNING'")
      if (levelFilter.includes('error')) conditions.push("pgl_parsed.error_severity = 'ERROR'")
      break
    case 'edge function':
      if (levelFilter.includes('success'))
        conditions.push('fel_response.status_code BETWEEN 200 AND 299')
      if (levelFilter.includes('warning'))
        conditions.push('fel_response.status_code BETWEEN 400 AND 499')
      if (levelFilter.includes('error')) conditions.push('fel_response.status_code >= 500')
      break
    case 'auth':
      if (levelFilter.includes('success'))
        conditions.push('el_in_al_response.status_code BETWEEN 200 AND 299')
      if (levelFilter.includes('warning'))
        conditions.push('el_in_al_response.status_code BETWEEN 400 AND 499')
      if (levelFilter.includes('error')) conditions.push('el_in_al_response.status_code >= 500')
      break
    case 'supavisor':
      if (levelFilter.includes('success'))
        conditions.push("LOWER(svl_metadata.level) NOT IN ('error', 'warn', 'warning')")
      if (levelFilter.includes('warning'))
        conditions.push(
          "(LOWER(svl_metadata.level) = 'warn' OR LOWER(svl_metadata.level) = 'warning')"
        )
      if (levelFilter.includes('error')) conditions.push("LOWER(svl_metadata.level) = 'error'")
      break
  }

  return conditions
}

/**
 * Creates WHERE clause for a specific log type including level filtering
 */
const createFilterWhereClause = (
  logType: string,
  levelFilter: string[],
  baseConditions: string[]
) => {
  const hasLevelFilter = levelFilter.length > 0

  let where = ''

  if (hasLevelFilter) {
    const levelConditions = buildLevelConditions(logType, levelFilter)

    if (levelConditions.length > 0) {
      if (baseConditions.length > 0) {
        where = `WHERE (${levelConditions.join(' OR ')}) AND ${baseConditions.join(' AND ')}`
      } else {
        where = `WHERE (${levelConditions.join(' OR ')})`
      }
    } else if (baseConditions.length > 0) {
      where = `WHERE ${baseConditions.join(' AND ')}`
    }
  } else if (baseConditions.length > 0) {
    where = `WHERE ${baseConditions.join(' AND ')}`
  }

  // Special case for auth logs
  if (logType === 'auth') {
    if (where) {
      where = where.replace('WHERE', 'WHERE al_metadata.request_id is not null AND')
    } else {
      where = 'WHERE al_metadata.request_id is not null'
    }
  }

  return where
}

/**
 * Builds base conditions array from search params
 */
const buildBaseConditions = (search: SearchParamsType): string[] => {
  const baseConditions: string[] = []

  Object.entries(search).forEach(([key, value]) => {
    // Skip pagination/control parameters, date and level (handled separately)
    if (BASE_CONDITIONS_EXCLUDED_PARAMS.includes(key as any)) {
      return
    }

    // Handle array filters (IN clause)
    if (Array.isArray(value) && value.length > 0) {
      baseConditions.push(`${key} IN (${value.map((v) => `'${v}'`).join(', ')})`)
    }
    // Handle scalar values
    else if (value !== null && value !== undefined) {
      baseConditions.push(`${key} = '${value}'`)
    }
  })

  return baseConditions
}

/**
 * Calculates how much the chart start datetime should be offset given the current datetime filter params
 * and determines the appropriate bucketing level (minute, hour, day)
 * Ported from the older implementation (apps/studio/components/interfaces/Settings/Logs/Logs.utils.ts)
 */
const calculateChartBucketing = (search: SearchParamsType | Record<string, any>): string => {
  // Extract start and end times from the date array if available
  const dateRange = search.date || []

  // Handle timestamps that could be in various formats
  const convertToMillis = (timestamp: any) => {
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

  let truncationLevel = 'MINUTE'

  const minuteDiff = endTime.diff(startTime, 'minute')
  const hourDiff = endTime.diff(startTime, 'hour')
  const dayDiff = endTime.diff(startTime, 'day')

  console.log(`Time difference: ${minuteDiff} minutes, ${hourDiff} hours, ${dayDiff} days`)

  // Adjust bucketing based on time range
  if (dayDiff >= 2) {
    truncationLevel = 'DAY'
  } else if (hourDiff >= 12) {
    truncationLevel = 'HOUR'
  } else {
    truncationLevel = 'MINUTE'
  }

  return truncationLevel
}

/**
 * Edge logs query fragment
 *
 * excludes `/rest/` in the path
 */
const getEdgeLogsQuery = () => {
  return `
    select 
      id,
      el.timestamp as timestamp,
      'edge' as log_type,
      CAST(edge_logs_response.status_code AS STRING) as status,
      CASE
          WHEN edge_logs_response.status_code BETWEEN 200 AND 299 THEN 'success'
          WHEN edge_logs_response.status_code BETWEEN 400 AND 499 THEN 'warning'
          WHEN edge_logs_response.status_code >= 500 THEN 'error'
          ELSE 'success'
      END as level,
      edge_logs_request.path as path,
      edge_logs_request.host as host,
      null as event_message,
      edge_logs_request.method as method,
      authorization_payload.role as api_role,
      COALESCE(sb.auth_user, null) as auth_user,
      null as log_count,
      null as logs
    from edge_logs as el
    cross join unnest(metadata) as edge_logs_metadata
    cross join unnest(edge_logs_metadata.request) as edge_logs_request
    cross join unnest(edge_logs_metadata.response) as edge_logs_response
    left join unnest(edge_logs_request.sb) as sb
    left join unnest(sb.jwt) as jwt
    left join unnest(jwt.authorization) as auth
    left join unnest(auth.payload) as authorization_payload

    -- ONLY include logs where the path does not include /rest/
    WHERE edge_logs_request.path NOT LIKE '%/rest/%'
    
  `
}

// Postgrest logs

// WHERE pathname includes `/rest/`
const getPostgrestLogsQuery = () => {
  return `
    select 
      id,
      el.timestamp as timestamp,
      'postgrest' as log_type,
      CAST(edge_logs_response.status_code AS STRING) as status,
      CASE
          WHEN edge_logs_response.status_code BETWEEN 200 AND 299 THEN 'success'
          WHEN edge_logs_response.status_code BETWEEN 400 AND 499 THEN 'warning'
          WHEN edge_logs_response.status_code >= 500 THEN 'error'
          ELSE 'success'
      END as level,
      edge_logs_request.path as path,
      edge_logs_request.host as host,
      null as event_message,
      edge_logs_request.method as method,
      authorization_payload.role as api_role,
      COALESCE(sb.auth_user, null) as auth_user,
      null as log_count,
      null as logs
    from edge_logs as el
    cross join unnest(metadata) as edge_logs_metadata
    cross join unnest(edge_logs_metadata.request) as edge_logs_request
    cross join unnest(edge_logs_metadata.response) as edge_logs_response
    left join unnest(edge_logs_request.sb) as sb
    left join unnest(sb.jwt) as jwt
    left join unnest(jwt.authorization) as auth
    left join unnest(auth.payload) as authorization_payload

    -- ONLY include logs where the path includes /rest/
    WHERE edge_logs_request.path LIKE '%/rest/%'
  `
}

/**
 * Postgres logs query fragment
 */
const getPostgresLogsQuery = () => {
  return `
    select 
      id,
      pgl.timestamp as timestamp,
      'postgres' as log_type,
      pgl_parsed.sql_state_code as status,
      CASE
          WHEN pgl_parsed.error_severity = 'LOG' THEN 'success'
          WHEN pgl_parsed.error_severity = 'WARNING' THEN 'warning'
          WHEN pgl_parsed.error_severity = 'ERROR' THEN 'error'
          ELSE null
      END as level,
      null as path,
      null as host,
      event_message as event_message,
      null as method,
      'api_role' as api_role,
      null as auth_user,
      null as log_count,
      null as logs
    from postgres_logs as pgl
    cross join unnest(pgl.metadata) as pgl_metadata
    cross join unnest(pgl_metadata.parsed) as pgl_parsed
  `
}

/**
 * Edge function logs query fragment
 */
const getEdgeFunctionLogsQuery = () => {
  return `
    select 
      id, 
      fel.timestamp as timestamp,
      'edge function' as log_type,
      CAST(fel_response.status_code AS STRING) as status,
      CASE
          WHEN fel_response.status_code BETWEEN 200 AND 299 THEN 'success'
          WHEN fel_response.status_code BETWEEN 400 AND 499 THEN 'warning'
          WHEN fel_response.status_code >= 500 THEN 'error'
          ELSE 'success'
      END as level,
      fel_request.url as path,
      fel_request.host as host,
      COALESCE(function_logs_agg.last_event_message, '') as event_message,
      fel_request.method as method,
      authorization_payload.role as api_role,
      COALESCE(sb.auth_user, null) as auth_user,
      function_logs_agg.function_log_count as log_count,
      function_logs_agg.logs as logs
    from function_edge_logs as fel
    cross join unnest(metadata) as fel_metadata
    cross join unnest(fel_metadata.response) as fel_response
    cross join unnest(fel_metadata.request) as fel_request
    left join unnest(fel_request.sb) as sb
    left join unnest(sb.jwt) as jwt
    left join unnest(jwt.authorization) as auth
    left join unnest(auth.payload) as authorization_payload
    left join (
    SELECT
        fl_metadata.execution_id,
        COUNT(fl.id) as function_log_count,
        ANY_VALUE(fl.event_message) as last_event_message,
        ARRAY_AGG(STRUCT(fl.id, fl.timestamp, fl.event_message, fl_metadata.level, fl_metadata.event_type)) as logs
    FROM function_logs as fl
    CROSS JOIN UNNEST(fl.metadata) as fl_metadata
    WHERE fl_metadata.execution_id IS NOT NULL
    GROUP BY fl_metadata.execution_id
    ) as function_logs_agg on fel_metadata.execution_id = function_logs_agg.execution_id
  `
}

/**
 * Auth logs query fragment
 */
const getAuthLogsQuery = () => {
  return `
    select
      al.id as id, 
      el_in_al.timestamp as timestamp, 
      'auth' as log_type,
      CAST(el_in_al_response.status_code AS STRING) as status,
      CASE
          WHEN el_in_al_response.status_code BETWEEN 200 AND 299 THEN 'success'
          WHEN el_in_al_response.status_code BETWEEN 400 AND 499 THEN 'warning'
          WHEN el_in_al_response.status_code >= 500 THEN 'error'
          ELSE 'success'
      END as level,
      el_in_al_request.path as path,
      el_in_al_request.host as host,
      null as event_message,
      el_in_al_request.method as method,
      authorization_payload.role as api_role,
      COALESCE(sb.auth_user, null) as auth_user,
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
        left join unnest(el_in_al_request.sb) as sb
        left join unnest(sb.jwt) as jwt
        left join unnest(jwt.authorization) as auth
        left join unnest(auth.payload) as authorization_payload
    )
    on al_metadata.request_id = el_in_al_response_headers.cf_ray
    WHERE al_metadata.request_id is not null
  `
}

/**
 * Supavisor logs query fragment
 */
const getSupavisorLogsQuery = () => {
  return `
    select 
      id, 
      svl.timestamp as timestamp, 
      'supavisor' as log_type,
      'undefined' as status,
      CASE
          WHEN LOWER(svl_metadata.level) = 'error' THEN 'error'
          WHEN LOWER(svl_metadata.level) = 'warn' OR LOWER(svl_metadata.level) = 'warning' THEN 'warning'
          ELSE 'success'
      END as level,
      null as path,
      null as host,
      null as event_message,
      null as method,
      'api_role' as api_role,
      null as auth_user,
      null as log_count,
      null as logs
    from supavisor_logs as svl
    cross join unnest(metadata) as svl_metadata
  `
}

/**
 * Combine all log sources to create the unified logs CTE
 */
const getUnifiedLogsCTE = () => {
  return `
WITH unified_logs AS (
    ${getEdgeLogsQuery()}
    union all
    ${getPostgrestLogsQuery()}
    union all
    ${getPostgresLogsQuery()}
    union all 
    ${getEdgeFunctionLogsQuery()}
    union all
    ${getAuthLogsQuery()}
    union all
    ${getSupavisorLogsQuery()}
)
  `
}

/**
 * Unified logs SQL query
 */
export const getUnifiedLogsQuery = (search: QuerySearchParamsType): string => {
  // Use the buildQueryConditions helper
  const { finalWhere } = buildQueryConditions(search)

  // The unified SQL query with UNION ALL statements
  const sql = `
${getUnifiedLogsCTE()}
SELECT
    id,
    timestamp,
    log_type,
    status,
    level,
    path,
    host,
    event_message,
    method,
    api_role,
    auth_user,
    log_count,
    logs
FROM unified_logs
${finalWhere}
`

  return sql
}

/**
 * Get a count query for the total logs within the timeframe
 * Also returns facets for all filter dimensions
 */
export const getLogsCountQuery = (search: QuerySearchParamsType): string => {
  // Use the buildQueryConditions helper
  const { finalWhere } = buildQueryConditions(search)

  // Create a count query using the same unified logs CTE
  const sql = `
${getUnifiedLogsCTE()}
-- Get total count
SELECT 'total' as dimension, 'all' as value, COUNT(*) as count
FROM unified_logs
${finalWhere}

UNION ALL

-- Get counts by level
SELECT 'level' as dimension, level as value, COUNT(*) as count
FROM unified_logs
${finalWhere}
GROUP BY level

UNION ALL

-- Get counts by log_type
SELECT 'log_type' as dimension, log_type as value, COUNT(*) as count
FROM unified_logs
${finalWhere}
GROUP BY log_type

UNION ALL

-- Get counts by method
SELECT 'method' as dimension, method as value, COUNT(*) as count
FROM unified_logs
${finalWhere}
WHERE method IS NOT NULL
GROUP BY method
`

  return sql
}

/**
 * Enhanced logs chart query with dynamic bucketing based on time range
 * Incorporates dynamic bucketing from the older implementation
 */
export const getLogsChartQuery = (search: QuerySearchParamsType): string => {
  // Use the buildQueryConditions helper
  const { finalWhere } = buildQueryConditions(search)

  // Determine appropriate bucketing level based on time range
  const truncationLevel = calculateChartBucketing(search)

  return `
${getUnifiedLogsCTE()}
SELECT
  TIMESTAMP_TRUNC(timestamp, ${truncationLevel}) as time_bucket,
  COUNTIF(level = 'success') as success,
  COUNTIF(level = 'warning') as warning,
  COUNTIF(level = 'error') as error,
  COUNT(*) as total_per_bucket
FROM unified_logs
${finalWhere}
GROUP BY time_bucket
ORDER BY time_bucket ASC
`
}
