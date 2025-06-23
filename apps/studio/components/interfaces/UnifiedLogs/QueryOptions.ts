import { useQuery } from '@tanstack/react-query'

import { get } from 'data/fetchers'
import { getLogsChartQuery } from './UnifiedLogs.queries'
import type { SearchParamsType } from './UnifiedLogs.types'

// Debug mode flag - set to true to enable detailed logs
const DEBUG_MODE = false

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
