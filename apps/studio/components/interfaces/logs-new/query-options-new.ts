import SuperJSON from 'superjson'
import type { BaseChartSchema, FacetMetadataSchema } from './schema'
import type { SearchParamsType } from './search-params'
import { ARRAY_DELIMITER, SORT_DELIMITER } from 'components/interfaces/DataTableDemo/lib/delimiters'
import { z } from 'zod'
import { useParams } from 'common'
import { get, handleError, post } from 'data/fetchers'
import { ColumnSchema } from './schema'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'

// Define the basic types we need

// -- function event logs
// -- select
// --   id,
// --   fl.timestamp as timestamp,
// --   'function events' as log_type,
// --   'undefined' as status,
// --   CASE
// --     WHEN LOWER(fl_metadata.level) = 'error' THEN 'error'
// --     WHEN LOWER(fl_metadata.level) = 'warn' OR LOWER(fl_metadata.level) = 'warning' THEN 'warning'
// --     ELSE 'success'
// --   END as level,
// --   null as path,
// --   null as host,
// --   fl.event_message as event_message,
// --   null as method,
// --   'api_role' as api_role,
// --   null as auth_user
// -- from function_logs as fl
// -- cross join unnest(metadata) as fl_metadata

// -- union all

// union all

// select
//   id,
//   pgul.timestamp as timestamp,
//   'postgres upgrade' as log_type,
//   'undefined' as status,
//   'undefined' as level,
//   null as path,
//   null as host,
//   null as event_message,
//   null as method,
//   'api_role' as api_role,
//   null as auth_user,
//   null as log_count,
// from pg_upgrade_logs as pgul
export type UnifiedLogSchema = {
  id: string
  timestamp: Date
  log_type: string
  code: string
  level: string
  path: string | null
  event_message: string
  method: string
  api_role: string
  auth_user: string | null
}

export type UnifiedLogsMeta = {
  logTypeCounts: Record<string, number>
  currentPercentiles: Record<string, number>
}

// Extended column schema to include raw timestamp
export type ExtendedColumnSchema = ColumnSchema & {
  timestamp: string // Original database timestamp
  date: Date // Date object for display
}

export type InfiniteQueryMeta<TMeta = Record<string, unknown>> = {
  totalRowCount: number
  filterRowCount: number
  chartData: BaseChartSchema[]
  facets: Record<string, FacetMetadataSchema>
  metadata?: TMeta
}

export type InfiniteQueryResponse<TData, TMeta = unknown> = {
  data: TData
  meta: InfiniteQueryMeta<TMeta>
  prevCursor: number | null
  nextCursor: number | null
}

// Define pageParam type
type PageParam = { cursor: number; direction: 'next' | 'prev' }

// Helper function to create simpler API query string
export const createApiQueryString = (params: Record<string, any>): string => {
  const queryParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue

    if (key === 'date' && Array.isArray(value) && value.length === 2) {
      queryParams.set('dateStart', value[0].getTime().toString())
      queryParams.set('dateEnd', value[1].getTime().toString())
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        queryParams.set(key, value.join(ARRAY_DELIMITER))
      }
    } else if (key === 'sort' && typeof value === 'object' && value !== null) {
      queryParams.set(
        key,
        `${(value as { id: string; desc: boolean }).id}${SORT_DELIMITER}${(value as { id: string; desc: boolean }).desc ? 'desc' : 'asc'}`
      )
    } else if (value instanceof Date) {
      queryParams.set(key, value.getTime().toString())
    } else {
      queryParams.set(key, String(value))
    }
  }
  const queryString = queryParams.toString()
  return queryString ? `?${queryString}` : ''
}

// Build SQL WHERE clause from search params
function buildWhereClause(search: SearchParamsType): string {
  const conditions: string[] = []

  // Extract and handle level filter specially
  const levelFilter = search.level || []
  let levelCondition = ''

  if (levelFilter.length > 0) {
    const sourceLevelConditions = []

    // Edge logs level conditions
    if (levelFilter.includes('success')) {
      sourceLevelConditions.push(
        "(log_type = 'edge' AND edge_logs_response.status_code BETWEEN 200 AND 299)"
      )
    }
    if (levelFilter.includes('warning')) {
      sourceLevelConditions.push(
        "(log_type = 'edge' AND edge_logs_response.status_code BETWEEN 400 AND 499)"
      )
    }
    if (levelFilter.includes('error')) {
      sourceLevelConditions.push("(log_type = 'edge' AND edge_logs_response.status_code >= 500)")
    }

    // Postgres logs level conditions
    if (levelFilter.includes('success')) {
      sourceLevelConditions.push("(log_type = 'postgres' AND pgl_parsed.error_severity = 'LOG')")
    }
    if (levelFilter.includes('warning')) {
      sourceLevelConditions.push(
        "(log_type = 'postgres' AND pgl_parsed.error_severity = 'WARNING')"
      )
    }
    if (levelFilter.includes('error')) {
      sourceLevelConditions.push("(log_type = 'postgres' AND pgl_parsed.error_severity = 'ERROR')")
    }

    // Function logs level conditions
    if (levelFilter.includes('success')) {
      sourceLevelConditions.push(
        "(log_type = 'edge function' AND fel_response.status_code BETWEEN 200 AND 299)"
      )
    }
    if (levelFilter.includes('warning')) {
      sourceLevelConditions.push(
        "(log_type = 'edge function' AND fel_response.status_code BETWEEN 400 AND 499)"
      )
    }
    if (levelFilter.includes('error')) {
      sourceLevelConditions.push("(log_type = 'edge function' AND fel_response.status_code >= 500)")
    }

    // Auth logs level conditions
    if (levelFilter.includes('success')) {
      sourceLevelConditions.push(
        "(log_type = 'auth' AND el_in_al_response.status_code BETWEEN 200 AND 299)"
      )
    }
    if (levelFilter.includes('warning')) {
      sourceLevelConditions.push(
        "(log_type = 'auth' AND el_in_al_response.status_code BETWEEN 400 AND 499)"
      )
    }
    if (levelFilter.includes('error')) {
      sourceLevelConditions.push("(log_type = 'auth' AND el_in_al_response.status_code >= 500)")
    }

    // Supavisor logs level conditions
    if (levelFilter.includes('success')) {
      sourceLevelConditions.push(
        "(log_type = 'supavisor' AND LOWER(svl_metadata.level) NOT IN ('error', 'warn', 'warning'))"
      )
    }
    if (levelFilter.includes('warning')) {
      sourceLevelConditions.push(
        "(log_type = 'supavisor' AND (LOWER(svl_metadata.level) = 'warn' OR LOWER(svl_metadata.level) = 'warning'))"
      )
    }
    if (levelFilter.includes('error')) {
      sourceLevelConditions.push("(log_type = 'supavisor' AND LOWER(svl_metadata.level) = 'error')")
    }

    if (sourceLevelConditions.length > 0) {
      levelCondition = `(${sourceLevelConditions.join(' OR ')})`
      conditions.push(levelCondition)
    }
  }

  // Process all other filters dynamically
  Object.entries(search).forEach(([key, value]) => {
    // Skip pagination/control parameters, date, and level (handled separately)
    if (
      ['sort', 'start', 'size', 'uuid', 'cursor', 'direction', 'live', 'date', 'level'].includes(
        key
      )
    ) {
      return
    }

    // Handle array filters (IN clause)
    if (Array.isArray(value) && value.length > 0) {
      conditions.push(`${key} IN (${value.map((v) => `'${v}'`).join(',')})`)
      return
    }

    // Handle scalar values
    if (value !== null && value !== undefined) {
      conditions.push(`${key} = '${value}'`)
    }
  })

  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
}

// Add a new function to fetch chart data for the entire time period
export const useChartData = (search: SearchParamsType, projectRef: string) => {
  return useQuery({
    queryKey: ['unified-logs-chart', projectRef, search.date],
    queryFn: async () => {
      try {
        // Use a default date range (last hour) if no date range is selected
        let dateStart: string
        let dateEnd: string

        if (search.date && search.date.length === 2) {
          dateStart = new Date(search.date[0]).toISOString()
          dateEnd = new Date(search.date[1]).toISOString()
        } else {
          // Default to last hour
          const now = new Date()
          dateEnd = now.toISOString()
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
          dateStart = oneHourAgo.toISOString()
        }

        // SQL query to get aggregated log counts by minute
        const sql = `
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
  TIMESTAMP_TRUNC(timestamp, MINUTE) as minute,
  COUNTIF(REGEXP_CONTAINS(status, '^2|^3') OR status = 'undefined') as success,
  COUNTIF(REGEXP_CONTAINS(status, '^4')) as warning,
  COUNTIF(REGEXP_CONTAINS(status, '^5')) as error
FROM unified_logs
GROUP BY minute
ORDER BY minute ASC
`

        // Use the get function from data/fetchers for chart data
        const { data, error } = await post(
          `/platform/projects/{ref}/analytics/endpoints/logs.all`,
          {
            body: {
              sql,
            },
            params: {
              path: { ref: projectRef },
              query: {
                iso_timestamp_start: dateStart,
                iso_timestamp_end: dateEnd,
                project: projectRef,
              },
            },
          }
        )

        if (error) {
          // Return default empty chart data rather than throwing
          return {
            chartData: [],
          }
        }

        // Create a Map of the API results
        const apiResultMap = new Map()

        // Only process API results if we have them
        if (data?.result) {
          data.result.forEach((row: any) => {
            // The API returns timestamps in microseconds (needs to be converted to milliseconds for JS Date)
            const microseconds = Number(row.minute)
            const milliseconds = Math.floor(microseconds / 1000)

            // Round to nearest minute (60000ms = 1 minute)
            const roundedToMinute = Math.floor(milliseconds / 60000) * 60000

            // Add to existing data for this minute if it exists
            const existing = apiResultMap.get(roundedToMinute)
            if (existing) {
              apiResultMap.set(roundedToMinute, {
                success: existing.success + (Number(row.success) || 0),
                warning: existing.warning + (Number(row.warning) || 0),
                error: existing.error + (Number(row.error) || 0),
              })
            } else {
              // Store using minute-aligned milliseconds for proper matching
              apiResultMap.set(roundedToMinute, {
                success: Number(row.success) || 0,
                warning: Number(row.warning) || 0,
                error: Number(row.error) || 0,
              })
            }
          })
        }

        // ALWAYS create a complete set of minute buckets for the entire hour
        const startTime = new Date(dateStart).getTime()
        const endTime = new Date(dateEnd).getTime()
        const minuteMs = 60 * 1000
        const chartData = []

        // Generate all minute buckets for the hour (approximately 60 buckets)
        for (let minute = startTime; minute <= endTime; minute += minuteMs) {
          // Round current bucket to minute boundary
          const roundedMinute = Math.floor(minute / minuteMs) * minuteMs

          // Get data for this minute if it exists, otherwise use zeros
          const minuteData = apiResultMap.get(roundedMinute) || { success: 0, warning: 0, error: 0 }

          // Always push a data point for this minute
          chartData.push({
            timestamp: roundedMinute, // Use the minute timestamp
            success: minuteData.success || 0,
            warning: minuteData.warning || 0,
            error: minuteData.error || 0,
          })
        }

        return {
          chartData,
        }
      } catch (error) {
        // Return default empty chart data instead of throwing
        return {
          chartData: [],
        }
      }
    },
    // Keep chart data fresh for 5 minutes
    staleTime: 1000 * 60 * 5,
    retry: 1, // Only retry once to avoid excessive API calls
  })
}

// The existing dataOptions function remains with buildChartData fallback
export const dataOptions = (search: SearchParamsType, projectRef: string) => {
  // Create a stable query key object by removing nulls/undefined, uuid, and live
  const queryKeyParams = Object.entries(search).reduce(
    (acc, [key, value]) => {
      if (!['uuid', 'live'].includes(key) && value !== null && value !== undefined) {
        acc[key] = value
      }
      return acc
    },
    {} as Record<string, any>
  )

  // Simply return the options object
  return {
    queryKey: [
      'unified-logs',
      projectRef,
      // Use JSON.stringify for a stable key representation
      JSON.stringify(queryKeyParams),
    ],
    queryFn: async ({ pageParam }: { pageParam?: PageParam }) => {
      try {
        const cursorValue = pageParam?.cursor // Already in microseconds
        const direction = pageParam?.direction
        const isPagination = pageParam !== undefined

        // Get standard filters
        const baseConditions: string[] = []
        Object.entries(search).forEach(([key, value]) => {
          // Skip pagination/control parameters, date and level (handled separately)
          if (
            [
              'sort',
              'start',
              'size',
              'uuid',
              'cursor',
              'direction',
              'live',
              'date',
              'level',
            ].includes(key)
          ) {
            return
          }

          // Handle array filters (IN clause)
          if (Array.isArray(value) && value.length > 0) {
            baseConditions.push(`${key} IN (${value.map((v) => `'${v}'`).join(',')})`)
            return
          }

          // Handle scalar values
          if (value !== null && value !== undefined) {
            baseConditions.push(`${key} = '${value}'`)
          }
        })

        // Get level filter if exists
        const levelFilter = search.level || []
        const hasLevelFilter = levelFilter.length > 0

        // Create source-specific where clauses with level filters
        let edgeWhere = ''
        let postgresWhere = ''
        let functionWhere = ''
        let authWhere = 'where al_metadata.request_id is not null'
        let supavisorWhere = ''

        // Edge logs level filter
        if (hasLevelFilter) {
          const edgeLevelConditions = []
          if (levelFilter.includes('success'))
            edgeLevelConditions.push('edge_logs_response.status_code BETWEEN 200 AND 299')
          if (levelFilter.includes('warning'))
            edgeLevelConditions.push('edge_logs_response.status_code BETWEEN 400 AND 499')
          if (levelFilter.includes('error'))
            edgeLevelConditions.push('edge_logs_response.status_code >= 500')

          if (edgeLevelConditions.length > 0) {
            if (baseConditions.length > 0) {
              edgeWhere = `WHERE (${edgeLevelConditions.join(' OR ')}) AND ${baseConditions.join(' AND ')}`
            } else {
              edgeWhere = `WHERE (${edgeLevelConditions.join(' OR ')})`
            }
          } else if (baseConditions.length > 0) {
            edgeWhere = `WHERE ${baseConditions.join(' AND ')}`
          }
        } else if (baseConditions.length > 0) {
          edgeWhere = `WHERE ${baseConditions.join(' AND ')}`
        }

        // Postgres logs level filter
        if (hasLevelFilter) {
          const postgresLevelConditions = []
          if (levelFilter.includes('success'))
            postgresLevelConditions.push("pgl_parsed.error_severity = 'LOG'")
          if (levelFilter.includes('warning'))
            postgresLevelConditions.push("pgl_parsed.error_severity = 'WARNING'")
          if (levelFilter.includes('error'))
            postgresLevelConditions.push("pgl_parsed.error_severity = 'ERROR'")

          if (postgresLevelConditions.length > 0) {
            if (baseConditions.length > 0) {
              postgresWhere = `WHERE (${postgresLevelConditions.join(' OR ')}) AND ${baseConditions.join(' AND ')}`
            } else {
              postgresWhere = `WHERE (${postgresLevelConditions.join(' OR ')})`
            }
          } else if (baseConditions.length > 0) {
            postgresWhere = `WHERE ${baseConditions.join(' AND ')}`
          }
        } else if (baseConditions.length > 0) {
          postgresWhere = `WHERE ${baseConditions.join(' AND ')}`
        }

        // Function logs level filter
        if (hasLevelFilter) {
          const functionLevelConditions = []
          if (levelFilter.includes('success'))
            functionLevelConditions.push('fel_response.status_code BETWEEN 200 AND 299')
          if (levelFilter.includes('warning'))
            functionLevelConditions.push('fel_response.status_code BETWEEN 400 AND 499')
          if (levelFilter.includes('error'))
            functionLevelConditions.push('fel_response.status_code >= 500')

          if (functionLevelConditions.length > 0) {
            if (baseConditions.length > 0) {
              functionWhere = `WHERE (${functionLevelConditions.join(' OR ')}) AND ${baseConditions.join(' AND ')}`
            } else {
              functionWhere = `WHERE (${functionLevelConditions.join(' OR ')})`
            }
          } else if (baseConditions.length > 0) {
            functionWhere = `WHERE ${baseConditions.join(' AND ')}`
          }
        } else if (baseConditions.length > 0) {
          functionWhere = `WHERE ${baseConditions.join(' AND ')}`
        }

        // Auth logs level filter (already has a WHERE clause)
        if (hasLevelFilter) {
          const authLevelConditions = []
          if (levelFilter.includes('success'))
            authLevelConditions.push('el_in_al_response.status_code BETWEEN 200 AND 299')
          if (levelFilter.includes('warning'))
            authLevelConditions.push('el_in_al_response.status_code BETWEEN 400 AND 499')
          if (levelFilter.includes('error'))
            authLevelConditions.push('el_in_al_response.status_code >= 500')

          if (authLevelConditions.length > 0) {
            authWhere = `where al_metadata.request_id is not null AND (${authLevelConditions.join(' OR ')})`
            if (baseConditions.length > 0) {
              authWhere += ` AND ${baseConditions.join(' AND ')}`
            }
          } else if (baseConditions.length > 0) {
            authWhere = `where al_metadata.request_id is not null AND ${baseConditions.join(' AND ')}`
          } else {
            authWhere = `where al_metadata.request_id is not null`
          }
        } else if (baseConditions.length > 0) {
          authWhere = `where al_metadata.request_id is not null AND ${baseConditions.join(' AND ')}`
        } else {
          authWhere = `where al_metadata.request_id is not null`
        }

        // Supavisor logs level filter
        if (hasLevelFilter) {
          const supavisorLevelConditions = []
          if (levelFilter.includes('success'))
            supavisorLevelConditions.push(
              "LOWER(svl_metadata.level) NOT IN ('error', 'warn', 'warning')"
            )
          if (levelFilter.includes('warning'))
            supavisorLevelConditions.push(
              "(LOWER(svl_metadata.level) = 'warn' OR LOWER(svl_metadata.level) = 'warning')"
            )
          if (levelFilter.includes('error'))
            supavisorLevelConditions.push("LOWER(svl_metadata.level) = 'error'")

          if (supavisorLevelConditions.length > 0) {
            if (baseConditions.length > 0) {
              supavisorWhere = `WHERE (${supavisorLevelConditions.join(' OR ')}) AND ${baseConditions.join(' AND ')}`
            } else {
              supavisorWhere = `WHERE (${supavisorLevelConditions.join(' OR ')})`
            }
          } else if (baseConditions.length > 0) {
            supavisorWhere = `WHERE ${baseConditions.join(' AND ')}`
          }
        } else if (baseConditions.length > 0) {
          supavisorWhere = `WHERE ${baseConditions.join(' AND ')}`
        }

        // The actual SQL query template with your UNION ALL statements - without timestamp conditions
        let sql = `
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
from edge_logs as el
cross join unnest(metadata) as edge_logs_metadata
cross join unnest(edge_logs_metadata.request) as edge_logs_request
cross join unnest(edge_logs_metadata.response) as edge_logs_response
left join unnest(edge_logs_request.sb) as sb
left join unnest(sb.jwt) as jwt
left join unnest(jwt.authorization) as auth
left join unnest(auth.payload) as authorization_payload
${edgeWhere}

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
  null as log_count,
from postgres_logs as pgl
cross join unnest(pgl.metadata) as pgl_metadata
cross join unnest(pgl_metadata.parsed) as pgl_parsed
${postgresWhere}

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
    ANY_VALUE(fl.event_message) as last_event_message -- TODO: add last event message
  FROM function_logs as fl
  CROSS JOIN UNNEST(fl.metadata) as fl_metadata
  WHERE fl_metadata.execution_id IS NOT NULL
  GROUP BY fl_metadata.execution_id
) as function_logs_agg on fel_metadata.execution_id = function_logs_agg.execution_id
${functionWhere}

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
  null as log_count,
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
${authWhere}

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
  null as log_count,
from supavisor_logs as svl
cross join unnest(metadata) as svl_metadata
${supavisorWhere}
`

        // Add ordering and limit
        sql += `\nORDER BY timestamp DESC, id DESC`
        sql += `\nLIMIT 50`

        // Extract date range from search or use default (last hour)
        let isoTimestampStart: string
        let isoTimestampEnd: string

        if (search.date && search.date.length === 2) {
          isoTimestampStart = new Date(search.date[0]).toISOString()
          isoTimestampEnd = new Date(search.date[1]).toISOString()
        } else {
          // Default to last hour
          const now = new Date()
          isoTimestampEnd = now.toISOString()
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
          isoTimestampStart = oneHourAgo.toISOString()
        }

        // Use get function from data/fetchers for logs
        const { data, error } = await post(
          `/platform/projects/{ref}/analytics/endpoints/logs.all`,
          {
            body: {
              sql,
            },
            params: {
              path: { ref: projectRef },
              query: {
                iso_timestamp_start: isPagination
                  ? cursorValue
                    ? new Date(Number(cursorValue) / 1000).toISOString()
                    : isoTimestampEnd
                  : isoTimestampStart,
                iso_timestamp_end: isPagination ? isoTimestampEnd : isoTimestampEnd,
                project: projectRef,
              },
            },
          }
        )

        if (error) {
          throw error
        }

        // Process the results
        const resultData = data?.result || []

        // Define specific level types
        type LogLevel = 'success' | 'warning' | 'error'

        // Transform results to expected schema
        const result = resultData.map((row: any) => {
          // Create a unique ID using the timestamp
          const uniqueId = `${row.id || 'id'}-${row.timestamp}-${new Date().getTime()}`

          // Create a date object for display purposes
          // The timestamp is in microseconds, need to convert to milliseconds for JS Date
          const date = new Date(Number(row.timestamp) / 1000)

          // Use the level directly from SQL rather than determining it in TypeScript
          const level = row.level as LogLevel

          return {
            id: uniqueId,
            uuid: uniqueId,
            date, // Date object for display purposes
            timestamp: row.timestamp, // Original timestamp from the database
            level,
            status: row.status || 200,
            method: row.method,
            host: row.host,
            pathname: (row.url || '').replace(/^https?:\/\/[^\/]+/, '') || row.path || '',
            event_message: row.event_message || row.body || '',
            headers:
              typeof row.headers === 'string' ? JSON.parse(row.headers || '{}') : row.headers || {},
            regions: row.region ? [row.region] : [],
            log_type: row.log_type || '',
            latency: row.latency || 0,
            log_count: row.log_count || null,
          }
        })

        // Just use the row timestamps directly for cursors
        const lastRow = result.length > 0 ? result[result.length - 1] : null
        const firstRow = result.length > 0 ? result[0] : null
        const nextCursor = lastRow ? lastRow.timestamp : null
        const prevCursor = firstRow ? firstRow.timestamp : null

        // Determine if there might be more data
        const pageLimit = 50
        const hasMore = result.length >= pageLimit

        // Create response with pagination info
        const response = {
          data: result,
          meta: {
            totalRowCount: 10000, // A large number to show total potential logs
            filterRowCount: hasMore ? result.length + 1000 : result.length,
            chartData: buildChartData(result),
            facets: {},
            metadata: {
              currentPercentiles: {},
              logTypeCounts: calculateLogTypeCounts(result),
            },
          },

          nextCursor: hasMore ? nextCursor : null,
          prevCursor,
        }

        return response
      } catch (error) {
        throw error
      }
    },
    // Initial load without any pagination parameters
    initialPageParam: undefined,
    getPreviousPageParam: (
      firstPage: InfiniteQueryResponse<ExtendedColumnSchema[], UnifiedLogsMeta>
    ) => {
      if (!firstPage.prevCursor) return null
      return { cursor: firstPage.prevCursor, direction: 'prev' } as PageParam
    },
    getNextPageParam: (
      lastPage: InfiniteQueryResponse<ExtendedColumnSchema[], UnifiedLogsMeta>,
      allPages: InfiniteQueryResponse<ExtendedColumnSchema[], UnifiedLogsMeta>[]
    ) => {
      // Only return a cursor if we actually have more data to fetch
      if (!lastPage.nextCursor || lastPage.data.length === 0) return null
      // Only trigger fetch when specifically requested, not during column resizing
      return { cursor: lastPage.nextCursor, direction: 'next' } as PageParam
    },
    // Configure React Query to be more stable
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  }
}

// Helper functions for chart data and log type counts
function buildChartData(logs: any[]) {
  // Group logs by minute and count by level
  const chartData = []
  const minuteGroups = new Map()

  // Sort by timestamp ascending
  const sortedLogs = [...logs].sort((a, b) => a.rawTimestamp - b.rawTimestamp)

  for (const log of sortedLogs) {
    const minute = dayjs(log.date).startOf('minute').valueOf()

    if (!minuteGroups.has(minute)) {
      minuteGroups.set(minute, {
        // Use number timestamp instead of Date object
        timestamp: minute,
        success: 0,
        error: 0,
        warning: 0,
      })
    }

    const group = minuteGroups.get(minute)
    // Ensure we're only using valid log levels that match the schema
    const level = ['success', 'error', 'warning'].includes(log.level) ? log.level : 'success'
    group[level] = (group[level] || 0) + 1
  }

  // Convert map to array
  for (const data of minuteGroups.values()) {
    chartData.push(data)
  }

  return chartData.sort((a, b) => a.timestamp - b.timestamp)
}

function calculateLogTypeCounts(logs: any[]) {
  const counts: Record<string, number> = {}

  logs.forEach((log) => {
    const logType = log.log_type
    counts[logType] = (counts[logType] || 0) + 1
  })

  return counts
}
