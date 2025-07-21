import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { getLogsChartQuery } from 'components/interfaces/UnifiedLogs/UnifiedLogs.queries'
import { handleError, post } from 'data/fetchers'
import { ExecuteSqlError } from 'data/sql/execute-sql-query'
import { logsKeys } from './keys'
import { UNIFIED_LOGS_QUERY_OPTIONS, UnifiedLogsVariables } from './unified-logs-infinite-query'

export async function getUnifiedLogsChart(
  { projectRef, search }: UnifiedLogsVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit
) {
  if (typeof projectRef === 'undefined') {
    throw new Error('projectRef is required for getUnifiedLogsChart')
  }

  // Use a default date range (last hour) if no date range is selected
  let dateStart: string
  let dateEnd: string
  let startTime: Date
  let endTime: Date

  if (search.date && search.date.length === 2) {
    const parseDate = (d: string | Date) => (d instanceof Date ? d : new Date(d))
    startTime = parseDate(search.date[0])
    endTime = parseDate(search.date[1])
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

  let headers = new Headers(headersInit)

  const { data, error } = await post(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
    params: { path: { ref: projectRef } },
    body: { sql, iso_timestamp_start: dateStart, iso_timestamp_end: dateEnd },
    signal,
    headers,
  })

  if (error) handleError(error)

  const chartData: Array<{
    timestamp: number
    success: number
    warning: number
    error: number
  }> = []

  const dataByTimestamp = new Map<
    number,
    {
      timestamp: number
      success: number
      warning: number
      error: number
    }
  >()

  if (data?.result) {
    data.result.forEach((row: any) => {
      // The API returns timestamps in microseconds (needs to be converted to milliseconds for JS Date)
      const microseconds = Number(row.time_bucket)
      const milliseconds = Math.floor(microseconds / 1000)

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

  return chartData
}

export type UnifiedLogsChartData = Awaited<ReturnType<typeof getUnifiedLogsChart>>
export type UnifiedLogsChartError = ExecuteSqlError

export const useUnifiedLogsChartQuery = <TData = UnifiedLogsChartData>(
  { projectRef, search }: UnifiedLogsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<UnifiedLogsChartData, UnifiedLogsChartError, TData> = {}
) =>
  useQuery<UnifiedLogsChartData, UnifiedLogsChartError, TData>(
    logsKeys.unifiedLogsChart(projectRef, search),
    ({ signal }) => getUnifiedLogsChart({ projectRef, search }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      keepPreviousData: true,
      ...UNIFIED_LOGS_QUERY_OPTIONS,
      ...options,
    }
  )
