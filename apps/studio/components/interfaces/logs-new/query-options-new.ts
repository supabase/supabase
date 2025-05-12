import { useQuery } from '@tanstack/react-query'
import { ARRAY_DELIMITER, SORT_DELIMITER } from 'components/interfaces/DataTableDemo/lib/delimiters'
import { post } from 'data/fetchers'
import dayjs from 'dayjs'
import { getLogsChartQuery, getLogsChartQuery2, getUnifiedLogsQuery } from './logs.queries'
import type { BaseChartSchema, FacetMetadataSchema } from './schema'
import { ColumnSchema } from './schema'
import type { SearchParamsType } from './search-params'

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

// Add a new function to fetch chart data for the entire time period
export const useChartData = (search: SearchParamsType, projectRef: string) => {
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

  return useQuery({
    queryKey: [
      'unified-logs-chart',
      projectRef,
      // Use JSON.stringify for a stable key representation
      JSON.stringify(queryKeyParams),
    ],
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

        // Get SQL query from utility function
        const sql = getLogsChartQuery2(search)

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
          console.error('API returned error for chart data:', error)
          throw error
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

          // Create a data point with only the filtered levels
          const dataPoint: any = {
            timestamp: roundedMinute, // Use the minute timestamp
          }

          // Only include the levels that were requested in the filter (or all if no filter)
          const levelFilter = search.level
          // If no level filter is specified or it's empty, include all levels
          if (!levelFilter || levelFilter.length === 0) {
            dataPoint.success = minuteData.success
            dataPoint.warning = minuteData.warning
            dataPoint.error = minuteData.error
          } else {
            // Otherwise only include the selected levels
            if (levelFilter.includes('success')) dataPoint.success = minuteData.success
            if (levelFilter.includes('warning')) dataPoint.warning = minuteData.warning
            if (levelFilter.includes('error')) dataPoint.error = minuteData.error
          }

          // Always push a data point for this minute
          chartData.push(dataPoint)
        }

        return {
          chartData,
        }
      } catch (error) {
        console.error('Error fetching chart data:', error)
        throw error
      }
    },
    // Keep chart data fresh for 5 minutes
    staleTime: 1000 * 60 * 5,
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

        // Get the unified SQL query from utility function
        let sql = getUnifiedLogsQuery(search)

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
        const timestampStart = isPagination
          ? cursorValue
            ? new Date(Number(cursorValue) / 1000).toISOString()
            : isoTimestampEnd
          : isoTimestampStart

        console.log(
          `Query params: isPagination=${isPagination}, cursorValue=${cursorValue}, iso_timestamp_start=${timestampStart}, iso_timestamp_end=${isoTimestampEnd}`
        )

        const { data, error } = await post(
          `/platform/projects/{ref}/analytics/endpoints/logs.all`,
          {
            body: {
              sql,
            },
            params: {
              path: { ref: projectRef },
              query: {
                iso_timestamp_start: timestampStart,
                iso_timestamp_end: isoTimestampEnd,
                project: projectRef,
              },
            },
          }
        )

        if (error) {
          console.error('API returned error:', error)
          throw error
        }

        // Process the results
        const resultData = data?.result || []

        console.log(`Received ${resultData.length} records from API`)

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

        // HACK: Backend uses "timestamp > cursor" which can exclude records with identical timestamps
        // THIS CAN SOMETIMES CAUSE 49 RECORDS INSTEAD OF 50 TO BE RETURNED
        // TODO: Revisit this - ideally the backend should use composite cursors (timestamp+id) for proper pagination
        // For now, we consider 49 records as a "full page" to ensure pagination works correctly
        const hasMore = result.length >= pageLimit - 1 // Consider 49 or 50 records as a full page

        console.log(
          `Pagination info: result.length=${result.length}, hasMore=${hasMore}, nextCursor=${nextCursor}`
        )

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
        console.error('Error fetching unified logs:', error)
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
