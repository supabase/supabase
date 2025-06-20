import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'

import { ARRAY_DELIMITER, SORT_DELIMITER } from 'components/ui/DataTable/DataTable.constants'
import { get } from 'data/fetchers'
import { getLogsChartQuery, getLogsCountQuery, getUnifiedLogsQuery } from './UnifiedLogs.queries'
import { BaseChartSchema, ColumnSchema, type FacetMetadataSchema } from './UnifiedLogs.schema'
import type { PageParam, SearchParamsType, UnifiedLogsMeta } from './UnifiedLogs.types'

// Debug mode flag - set to true to enable detailed logs
const DEBUG_MODE = false

export type ExtendedColumnSchema = ColumnSchema & {
  timestamp: string // Original database timestamp
  date: Date // Date object for display
}

type InfiniteQueryMeta<TMeta = Record<string, unknown>> = {
  totalRowCount: number
  filterRowCount: number
  chartData: BaseChartSchema[]
  facets: Record<string, FacetMetadataSchema>
  metadata?: TMeta
}

type InfiniteQueryResponse<TData, TMeta = unknown> = {
  data: TData
  meta: InfiniteQueryMeta<TMeta>
  prevCursor: number | null
  nextCursor: number | null
}

export function createApiQueryString(params: Record<string, any>): string {
  const queryParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue

    if (key === 'date' && Array.isArray(value) && value.length === 2) {
      queryParams.set('dateStart', value[0].getTime().toString())
      queryParams.set('dateEnd', value[1].getTime().toString())
    } else if (
      [
        'latency',
        'timing.dns',
        'timing.connection',
        'timing.tls',
        'timing.ttfb',
        'timing.transfer',
        'status',
      ].includes(key) &&
      Array.isArray(value) &&
      value.length > 0
    ) {
      if (value.length >= 2) {
        queryParams.set(`${key}Start`, value[0].toString())
        queryParams.set(`${key}End`, value[value.length - 1].toString())
      }
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        queryParams.set(key, value.join(ARRAY_DELIMITER))
      }
    } else if (key === 'sort' && typeof value === 'object' && value !== null) {
      queryParams.set(key, `${value.id}${SORT_DELIMITER}${value.desc ? 'desc' : 'asc'}`)
    } else if (value instanceof Date) {
      queryParams.set(key, value.getTime().toString())
    } else {
      queryParams.set(key, String(value))
    }
  }

  const queryString = queryParams.toString()
  return queryString ? `?${queryString}` : ''
}

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
        let startTime: Date
        let endTime: Date

        if (search.date && search.date.length === 2) {
          startTime = new Date(search.date[0])
          endTime = new Date(search.date[1])
          dateStart = startTime.toISOString()
          dateEnd = endTime.toISOString()
        } else {
          // Default to last hour
          endTime = new Date()
          startTime = new Date(endTime.getTime() - 60 * 60 * 1000)
          dateStart = startTime.toISOString()
          dateEnd = endTime.toISOString()
        }

        // Get SQL query from utility function (with dynamic bucketing)
        const sql = getLogsChartQuery(search)

        // Use the get function from data/fetchers for chart data
        const { data, error } = await get(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
          params: {
            path: { ref: projectRef },
            query: {
              iso_timestamp_start: dateStart,
              iso_timestamp_end: dateEnd,
              project: projectRef,
              sql,
            },
          },
        })

        if (error) {
          if (DEBUG_MODE) console.error('API returned error for chart data:', error)
          throw error
        }

        // Process API results directly without additional bucketing
        const chartData: Array<{
          timestamp: number
          success: number
          warning: number
          error: number
        }> = []

        // Create a map to store data points by their timestamp
        const dataByTimestamp = new Map<
          number,
          {
            timestamp: number
            success: number
            warning: number
            error: number
          }
        >()

        // Track the total count from the query results
        // this uses the total_per_bucket field that was added to the chart query
        let totalCount = 0

        // Only process API results if we have them
        if (data?.result) {
          data.result.forEach((row: any) => {
            // The API returns timestamps in microseconds (needs to be converted to milliseconds for JS Date)
            const microseconds = Number(row.time_bucket)
            const milliseconds = Math.floor(microseconds / 1000)

            // Add to total count - this comes directly from the query
            totalCount += Number(row.total_per_bucket || 0)

            // Create chart data point
            const dataPoint = {
              timestamp: milliseconds, // Convert to milliseconds for the chart
              success: Number(row.success) || 0,
              warning: Number(row.warning) || 0,
              error: Number(row.error) || 0,
            }

            // Filter levels if needed
            const levelFilter = search.level
            if (levelFilter && levelFilter.length > 0) {
              // Reset levels not in the filter
              if (!levelFilter.includes('success')) dataPoint.success = 0
              if (!levelFilter.includes('warning')) dataPoint.warning = 0
              if (!levelFilter.includes('error')) dataPoint.error = 0
            }

            dataByTimestamp.set(milliseconds, dataPoint)
          })
        }

        // Determine bucket size based on the truncation level in the SQL query
        // We need to fill in missing data points
        const startTimeMs = startTime.getTime()
        const endTimeMs = endTime.getTime()

        // Calculate appropriate bucket size from the time range
        const timeRangeHours = (endTimeMs - startTimeMs) / (1000 * 60 * 60)

        let bucketSizeMs: number
        if (timeRangeHours > 72) {
          // Day-level bucketing (for ranges > 3 days)
          bucketSizeMs = 24 * 60 * 60 * 1000
        } else if (timeRangeHours > 12) {
          // Hour-level bucketing (for ranges > 12 hours)
          bucketSizeMs = 60 * 60 * 1000
        } else {
          // Minute-level bucketing (for shorter ranges)
          bucketSizeMs = 60 * 1000
        }

        // Fill in any missing buckets
        for (let t = startTimeMs; t <= endTimeMs; t += bucketSizeMs) {
          // Round to the nearest bucket boundary
          const bucketTime = Math.floor(t / bucketSizeMs) * bucketSizeMs

          if (!dataByTimestamp.has(bucketTime)) {
            // Create empty data point for this bucket
            dataByTimestamp.set(bucketTime, {
              timestamp: bucketTime,
              success: 0,
              warning: 0,
              error: 0,
            })
          }
        }

        // Convert map to array
        for (const dataPoint of dataByTimestamp.values()) {
          chartData.push(dataPoint)
        }

        // Sort by timestamp
        chartData.sort((a, b) => a.timestamp - b.timestamp)

        // Add debugging info for totalCount
        if (DEBUG_MODE) console.log(`Total count from chart query: ${totalCount}`)

        return {
          chartData,
          totalCount,
        }
      } catch (error) {
        if (DEBUG_MODE) console.error('Error fetching chart data:', error)
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

  // Calculate the appropriate initial cursor based on the selected date range
  // const getInitialCursor = () => {
  //   if (search.date && search.date.length === 2) {
  //     // Use the end of the selected date range
  //     return new Date(search.date[1]).getTime()
  //   } else {
  //     // Default to current time if no date range is selected
  //     return new Date().getTime()
  //   }
  // }

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

        // Get the unified SQL query for logs data from utility function
        let logsSql = getUnifiedLogsQuery(search)

        // Add ordering and limit
        logsSql += `\nORDER BY timestamp DESC, id DESC`
        logsSql += `\nLIMIT 50`

        // Get SQL query for counts from utility function
        const countsSql = getLogsCountQuery(search)

        // First, fetch the counts data
        const { data: countsData, error: countsError } = await get(
          `/platform/projects/{ref}/analytics/endpoints/logs.all`,
          {
            params: {
              path: { ref: projectRef },
              query: {
                iso_timestamp_start: isoTimestampStart,
                iso_timestamp_end: isoTimestampEnd,
                project: projectRef,
                sql: countsSql,
              },
            },
          }
        )

        if (countsError) {
          if (DEBUG_MODE) console.error('API returned error for counts data:', countsError)
          throw countsError
        }

        // Process count results into facets structure
        const facets: Record<string, FacetMetadataSchema> = {}
        const countsByDimension: Record<string, Map<string, number>> = {}
        let totalCount = 0

        // Group by dimension
        if (countsData?.result) {
          countsData.result.forEach((row: any) => {
            const dimension = row.dimension
            const value = row.value
            const count = Number(row.count || 0)

            // Set total count if this is the total dimension
            if (dimension === 'total' && value === 'all') {
              totalCount = count
            }

            // Initialize dimension map if not exists
            if (!countsByDimension[dimension]) {
              countsByDimension[dimension] = new Map()
            }

            // Add count to the dimension map
            countsByDimension[dimension].set(value, count)
          })
        }

        // Convert dimension maps to facets structure
        Object.entries(countsByDimension).forEach(([dimension, countsMap]) => {
          // Skip the 'total' dimension as it's not a facet
          if (dimension === 'total') return

          const dimensionTotal = Array.from(countsMap.values()).reduce(
            (sum, count) => sum + count,
            0
          )

          facets[dimension] = {
            min: undefined,
            max: undefined,
            total: dimensionTotal,
            rows: Array.from(countsMap.entries()).map(([value, count]) => ({
              value,
              total: count,
            })),
          }
        })

        // Now, fetch the logs data with pagination
        // ONLY convert to ISO when we're about to send to the API
        let timestampStart: string
        let timestampEnd: string

        if (isPagination && direction === 'prev') {
          // Live mode: fetch logs newer than the cursor
          timestampStart = cursorValue
            ? new Date(Number(cursorValue) / 1000).toISOString() // Convert microseconds to ISO for API
            : isoTimestampStart
          timestampEnd = new Date().toISOString() // Current time as ISO for API
        } else if (isPagination && direction === 'next') {
          // Regular pagination: fetch logs older than the cursor
          timestampStart = isoTimestampStart
          timestampEnd = cursorValue
            ? new Date(Number(cursorValue) / 1000).toISOString() // Convert microseconds to ISO for API
            : isoTimestampEnd
        } else {
          // Initial load: use the original date range
          timestampStart = isoTimestampStart
          timestampEnd = isoTimestampEnd
        }

        if (DEBUG_MODE) {
          console.log(
            `🔍 Query function called: isPagination=${isPagination}, cursorValue=${cursorValue}, direction=${direction}, iso_timestamp_start=${timestampStart}, iso_timestamp_end=${timestampEnd}`
          )
          console.log('🔍 Raw pageParam received:', pageParam)
        }

        const { data: logsData, error: logsError } = await get(
          `/platform/projects/{ref}/analytics/endpoints/logs.all`,
          {
            params: {
              path: { ref: projectRef },
              query: {
                iso_timestamp_start: timestampStart,
                iso_timestamp_end: timestampEnd,
                project: projectRef,
                sql: logsSql,
              },
            },
          }
        )

        if (logsError) {
          if (DEBUG_MODE) console.error('API returned error for logs data:', logsError)
          throw logsError
        }

        // Process the logs results
        const resultData = logsData?.result || []

        if (DEBUG_MODE) console.log(`Received ${resultData.length} records from API`)

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
            logs: row.logs || [],
            auth_user: row.auth_user || null,
          }
        })

        // Just use the row timestamps directly for cursors
        const lastRow = result.length > 0 ? result[result.length - 1] : null
        const firstRow = result.length > 0 ? result[0] : null
        const nextCursor = lastRow ? lastRow.timestamp : null

        // FIXED: Always provide prevCursor like DataTableDemo does
        // This ensures live mode never breaks the infinite query chain
        // DataTableDemo uses milliseconds, but our timestamps are in microseconds
        const prevCursor = result.length > 0 ? firstRow!.timestamp : new Date().getTime() * 1000

        // Determine if there might be more data
        const pageLimit = 50

        // HACK: Backend uses "timestamp > cursor" which can exclude records with identical timestamps
        // THIS CAN SOMETIMES CAUSE 49 RECORDS INSTEAD OF 50 TO BE RETURNED
        // TODO: Revisit this - ideally the backend should use composite cursors (timestamp+id) for proper pagination
        // For now, we consider 49 records as a "full page" to ensure pagination works correctly
        const hasMore = result.length >= pageLimit - 1 // Consider 49 or 50 records as a full page

        if (DEBUG_MODE) {
          console.log(
            `Pagination info: result.length=${result.length}, hasMore=${hasMore}, nextCursor=${nextCursor}, prevCursor=${prevCursor}`
          )
        }

        // Create response with pagination info
        const response = {
          data: result,
          meta: {
            // Use the total count from our counts query
            totalRowCount: totalCount,
            filterRowCount: result.length,
            chartData: buildChartData(result),
            facets, // Use the facets from the counts query
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
        if (DEBUG_MODE) console.error('Error fetching unified logs:', error)
        throw error
      }
    },
    // Initial load with proper cursor for live mode pagination
    // Use microseconds format to match database timestamps
    initialPageParam: { cursor: new Date().getTime() * 1000, direction: 'next' } as PageParam,
    getPreviousPageParam: (
      firstPage: InfiniteQueryResponse<ExtendedColumnSchema[], UnifiedLogsMeta>
    ) => {
      if (DEBUG_MODE) {
        console.log('🔍 getPreviousPageParam called with:', {
          hasFirstPage: !!firstPage,
          dataLength: firstPage?.data?.length || 0,
          prevCursor: firstPage?.prevCursor,
          nextCursor: firstPage?.nextCursor,
          firstPageKeys: firstPage ? Object.keys(firstPage) : 'no firstPage',
        })
      }

      // Use the same logic as the working DataTableDemo
      if (!firstPage.prevCursor) {
        if (DEBUG_MODE) console.log('🔍 getPreviousPageParam returning: null (no prevCursor)')
        return null
      }

      const result = { cursor: firstPage.prevCursor, direction: 'prev' } as PageParam
      if (DEBUG_MODE) console.log('🔍 getPreviousPageParam returning:', result)
      return result
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
    refetchInterval: 0,
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
