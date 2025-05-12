/**
 * Reusable SQL queries for logs
 */

import { SearchParamsType } from './search-params'
import { BASE_CONDITIONS_EXCLUDED_PARAMS, EXCLUDED_QUERY_PARAMS } from './constants/query-params'
import dayjs from 'dayjs'

// Types for plan IDs - import actual type if available
type PlanId = 'free' | 'pro' | 'team' | 'enterprise'

/**
 * Builds query conditions from search parameters and returns WHERE clause
 * @param search SearchParamsType object containing query parameters
 * @returns Object with whereConditions array and formatted WHERE clause
 */
export const buildQueryConditions = (search: SearchParamsType) => {
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
export const buildLevelConditions = (logType: string, levelFilter: string[]) => {
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
export const createFilterWhereClause = (
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
export const buildBaseConditions = (search: SearchParamsType): string[] => {
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
 * Determine if we should show the user an upgrade prompt while browsing logs
 * Ported from the older implementation (apps/studio/components/interfaces/Settings/Logs/Logs.utils.ts)
 */
export const maybeShowUpgradePrompt = (from: string | null | undefined, planId?: PlanId) => {
  const day = Math.abs(dayjs().diff(dayjs(from), 'day'))

  return (
    (day > 1 && planId === 'free') ||
    (day > 7 && planId === 'pro') ||
    (day > 28 && planId === 'team') ||
    (day > 90 && planId === 'enterprise')
  )
}

/**
 * Calculates how much the chart start datetime should be offset given the current datetime filter params
 * and determines the appropriate bucketing level (minute, hour, day)
 * Ported from the older implementation (apps/studio/components/interfaces/Settings/Logs/Logs.utils.ts)
 */
export const calculateChartBucketing = (search: SearchParamsType | Record<string, any>): string => {
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
 * Unified logs SQL query
 */
export const getUnifiedLogsQuery = (search: SearchParamsType): string => {
  // Use the buildQueryConditions helper
  const { finalWhere } = buildQueryConditions(search)

  // The unified SQL query with UNION ALL statements
  const sql = `
WITH unified_logs AS (

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
      null as log_count
    from edge_logs as el
    cross join unnest(metadata) as edge_logs_metadata
    cross join unnest(edge_logs_metadata.request) as edge_logs_request
    cross join unnest(edge_logs_metadata.response) as edge_logs_response
    left join unnest(edge_logs_request.sb) as sb
    left join unnest(sb.jwt) as jwt
    left join unnest(jwt.authorization) as auth
    left join unnest(auth.payload) as authorization_payload

    union all

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
      null as log_count
    from postgres_logs as pgl
    cross join unnest(pgl.metadata) as pgl_metadata
    cross join unnest(pgl_metadata.parsed) as pgl_parsed

    union all 

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
      function_logs_agg.function_log_count as log_count
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
        ANY_VALUE(fl.event_message) as last_event_message
    FROM function_logs as fl
    CROSS JOIN UNNEST(fl.metadata) as fl_metadata
    WHERE fl_metadata.execution_id IS NOT NULL
    GROUP BY fl_metadata.execution_id
    ) as function_logs_agg on fel_metadata.execution_id = function_logs_agg.execution_id

    union all

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
      null as log_count
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

    union all

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
      null as log_count
    from supavisor_logs as svl
    cross join unnest(metadata) as svl_metadata
)

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
    log_count
FROM unified_logs
${finalWhere}
`

  return sql
}

/**
 * Enhanced logs chart query with dynamic bucketing based on time range
 * Incorporates dynamic bucketing from the older implementation
 */
export const getLogsChartQuery2 = (search: SearchParamsType | Record<string, any>): string => {
  // Use the buildQueryConditions helper
  const { finalWhere } = buildQueryConditions(search as SearchParamsType)

  // Determine appropriate bucketing level based on time range
  const truncationLevel = calculateChartBucketing(search)

  return `
WITH unified_logs AS (

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
    null as log_count
    from edge_logs as el
    cross join unnest(metadata) as edge_logs_metadata
    cross join unnest(edge_logs_metadata.request) as edge_logs_request
    cross join unnest(edge_logs_metadata.response) as edge_logs_response
    left join unnest(edge_logs_request.sb) as sb
    left join unnest(sb.jwt) as jwt
    left join unnest(jwt.authorization) as auth
    left join unnest(auth.payload) as authorization_payload

    union all

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
    null as log_count
    from postgres_logs as pgl
    cross join unnest(pgl.metadata) as pgl_metadata
    cross join unnest(pgl_metadata.parsed) as pgl_parsed

    union all 

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
    function_logs_agg.function_log_count as log_count
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
        ANY_VALUE(fl.event_message) as last_event_message
    FROM function_logs as fl
    CROSS JOIN UNNEST(fl.metadata) as fl_metadata
    WHERE fl_metadata.execution_id IS NOT NULL
    GROUP BY fl_metadata.execution_id
    ) as function_logs_agg on fel_metadata.execution_id = function_logs_agg.execution_id

    union all

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
    null as log_count
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

    union all

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
        null as log_count
    from supavisor_logs as svl
    cross join unnest(metadata) as svl_metadata
)

SELECT
  TIMESTAMP_TRUNC(timestamp, ${truncationLevel}) as time_bucket,
  COUNTIF(level = 'success') as success,
  COUNTIF(level = 'warning') as warning,
  COUNTIF(level = 'error') as error
FROM unified_logs
${finalWhere}
GROUP BY time_bucket
ORDER BY time_bucket ASC
`
}

/**
 * Chart data query for logs time series with dynamic bucketing
 * Adapted from the older implementation to use dynamic bucketing
 */
export const getLogsChartQuery = (search?: Record<string, any>): string => {
  // Determine appropriate bucketing level based on time range
  const truncationLevel = calculateChartBucketing(search || {})

  // Build where clause if search params are provided
  const { finalWhere } =
    search && Object.keys(search).length > 0
      ? buildQueryConditions(search as SearchParamsType)
      : { finalWhere: '' }

  return `
WITH unified_logs AS (
  -- edge logs
  SELECT
    el.timestamp,
    'edge' as log_type,
    CAST(edge_logs_response.status_code AS STRING) as status
  FROM edge_logs as el
  CROSS JOIN UNNEST(metadata) as edge_logs_metadata
  CROSS JOIN UNNEST(edge_logs_metadata.response) as edge_logs_response

  UNION ALL

  -- postgres logs
  SELECT
    pgl.timestamp,
    'postgres' as log_type,
    pgl_parsed.sql_state_code as status
  FROM postgres_logs as pgl
  CROSS JOIN UNNEST(pgl.metadata) as pgl_metadata
  CROSS JOIN UNNEST(pgl_metadata.parsed) as pgl_parsed

  UNION ALL 

  -- function event logs
  SELECT
    fl.timestamp,
    'function events' as log_type,
    'undefined' as status
  FROM function_logs as fl

  UNION ALL

  -- function edge logs
  SELECT
    fel.timestamp,
    'edge function' as log_type,
    CAST(fel_response.status_code as STRING) as status
  FROM function_edge_logs as fel
  CROSS JOIN UNNEST(metadata) as fel_metadata
  CROSS JOIN UNNEST(fel_metadata.response) as fel_response

  UNION ALL

  -- auth logs
  SELECT
    el_in_al.timestamp,
    'auth' as log_type,
    CAST(el_in_al_response.status_code as STRING) as status
  FROM auth_logs as al
  CROSS JOIN UNNEST(metadata) as al_metadata 
  LEFT JOIN (
    edge_logs as el_in_al
    CROSS JOIN UNNEST(metadata) as el_in_al_metadata 
    CROSS JOIN UNNEST(el_in_al_metadata.response) as el_in_al_response 
    CROSS JOIN UNNEST(el_in_al_response.headers) as el_in_al_response_headers 
  )
  ON al_metadata.request_id = el_in_al_response_headers.cf_ray
  WHERE al_metadata.request_id is not null

  UNION ALL

  -- supavisor logs
  SELECT
    svl.timestamp,
    'supavisor' as log_type,
    'undefined' as status
  FROM supavisor_logs as svl

  UNION ALL

  -- pg_upgrade logs
  SELECT
    pgul.timestamp,
    'postgres upgrade' as log_type,
    'undefined' as status
  FROM pg_upgrade_logs as pgul
)
SELECT
  TIMESTAMP_TRUNC(timestamp, ${truncationLevel}) as time_bucket,
  COUNTIF(REGEXP_CONTAINS(status, '^2|^3') OR status = 'undefined') as success,
  COUNTIF(REGEXP_CONTAINS(status, '^4')) as warning,
  COUNTIF(REGEXP_CONTAINS(status, '^5')) as error
FROM unified_logs
${finalWhere}
GROUP BY time_bucket
ORDER BY time_bucket ASC
`
}
