import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useFlag } from 'common'

import { logsKeys } from './keys'
import { logsAllEndpointUrl, pickLogsQueryBuilder } from './logs-endpoint'
import { UNIFIED_LOGS_QUERY_OPTIONS, UnifiedLogsVariables } from './unified-logs-infinite-query'
import { getLogsChartQuery } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries'
import { getLogsChartQuery as getLogsChartQueryBq } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries.bq'
import { handleError, post } from '@/data/fetchers'
import { ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { UseCustomQueryOptions } from '@/types'

export async function getUnifiedLogsChart(
  { projectRef, search, useOtel = false }: UnifiedLogsVariables & { useOtel?: boolean },
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
  const sql = pickLogsQueryBuilder(useOtel, getLogsChartQuery, getLogsChartQueryBq)(search)

  let headers = new Headers(headersInit)

  const endpoint = logsAllEndpointUrl(useOtel)
  const { data, error } = await post(endpoint, {
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
      // Disambiguate by format rather than Number.isFinite — see
      // unified-logs-infinite-query.ts for the reasoning.
      const ts = String(row.time_bucket ?? '')
      const looksLikeIso = /[T-]/.test(ts)
      const milliseconds = looksLikeIso
        ? new Date(/Z$|[+-]\d{2}:?\d{2}$/.test(ts) ? ts : `${ts}Z`).getTime()
        : Math.floor(Number(ts) / 1000)

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
  if (timeRangeHours >= 48) {
    bucketSizeMs = 24 * 60 * 60 * 1000
  } else if (timeRangeHours > 12) {
    bucketSizeMs = 60 * 60 * 1000
  } else {
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
  }: UseCustomQueryOptions<UnifiedLogsChartData, UnifiedLogsChartError, TData> = {}
) => {
  const useOtel = useFlag('otelUnifiedLogs')
  return useQuery<UnifiedLogsChartData, UnifiedLogsChartError, TData>({
    queryKey: [...logsKeys.unifiedLogsChart(projectRef, search), { otel: useOtel }],
    queryFn: ({ signal }) => getUnifiedLogsChart({ projectRef, search, useOtel }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    placeholderData: keepPreviousData,
    ...UNIFIED_LOGS_QUERY_OPTIONS,
    ...options,
  })
}
