import { useQuery, useQueries } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo } from 'react'

import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import type { AnalyticsInterval } from 'data/analytics/constants'
import { get } from 'data/fetchers'
import { useFillTimeseriesSorted } from './useFillTimeseriesSorted'
import useTimeseriesUnixToIso from './useTimeseriesUnixToIso'
import {
  genCountQuery,
  genChartQuery,
  getErrorCondition,
  getWarningCondition,
  genCrossJoinUnnests,
} from 'components/interfaces/Settings/Logs/Logs.utils'

// Define the log sources we want to combine initially
const ALL_LOG_SOURCES: LogsTableName[] = [
  LogsTableName.AUTH,
  LogsTableName.FN_EDGE,
  LogsTableName.POSTGREST,
  LogsTableName.REALTIME,
  LogsTableName.STORAGE,
]

// Define allowed filter values (including individual tables and 'all')
export type LogSource = LogsTableName | 'all'

// Define the structure returned by the hook
interface CombinedLogStatsData {
  timestamp: string
  ok_count: number
  error_count: number
  warning_count: number
}

interface CombinedLogStats {
  totalCount: number
  previousTotalCount?: number
  chartData: CombinedLogStatsData[]
  error: any
  isLoading: boolean
  isSuccess: boolean
  totalOkCount?: number
  totalWarningCount?: number
  totalErrorCount?: number
  previousTotalOkCount?: number
  previousTotalWarningCount?: number
  previousTotalErrorCount?: number
}

// Type for individual query results from API
type CountResult = { result: { count: number }[] }
type ChartResult = {
  result: {
    timestamp: number // Unix timestamp (ms)
    ok_count?: number
    error_count?: number
    warning_count?: number
  }[]
}

// Helper function to map interval to BigQuery date parts
const mapAnalyticsIntervalToBigQuery = (interval: AnalyticsInterval): string => {
  // Adjust cases based on assumed AnalyticsInterval definition
  switch (interval) {
    case '1m':
    case '5m':
      // case '15m': // Assuming not in AnalyticsInterval
      return 'MINUTE'
    case '1h':
      // case '60m': // Use 1h instead
      return 'HOUR'
    case '1d':
      return 'DAY'
    // case '7d': // Assuming not in AnalyticsInterval
    //   return 'WEEK'
    default:
      // Use exhaustive check if possible, or log unhandled
      console.warn(`Unhandled AnalyticsInterval: ${interval}, defaulting to HOUR`)
      return 'HOUR' // Default fallback
  }
}

/**
 * Hook to fetch combined log statistics (total count and chart data)
 * for selected log sources.
 */
export function useCombinedLogsStats({
  projectRef,
  startDate,
  endDate,
  interval,
  selectedSource = 'all', // Add selectedSource parameter with default
}: {
  projectRef: string
  startDate: string
  endDate: string
  interval: AnalyticsInterval
  selectedSource?: LogSource // Make parameter optional or provide default
}): CombinedLogStats {
  console.log('[useCombinedLogsStats] Hook called with:', {
    projectRef,
    startDate,
    endDate,
    interval,
    selectedSource,
  })

  // Determine which log sources to query based on the filter
  const LOG_SOURCES_TO_QUERY = useMemo(() => {
    if (selectedSource === 'all') {
      return ALL_LOG_SOURCES
    } else {
      // Check if selectedSource is a valid LogsTableName
      const isValidTable = Object.values(LogsTableName).includes(selectedSource as LogsTableName)
      return isValidTable ? [selectedSource as LogsTableName] : [] // Return empty if invalid
    }
  }, [selectedSource])
  console.log('[useCombinedLogsStats] Querying sources:', LOG_SOURCES_TO_QUERY)

  const enabled = !!projectRef && !!startDate && !!endDate && LOG_SOURCES_TO_QUERY.length > 0
  console.log('[useCombinedLogsStats] Queries enabled:', enabled)

  // Calculate previous time range
  const { previousStartDate, previousEndDate } = useMemo(() => {
    if (!startDate || !endDate) {
      return { previousStartDate: undefined, previousEndDate: undefined }
    }
    const start = dayjs(startDate)
    const end = dayjs(endDate)
    const diff = end.diff(start)
    const previousStartDate = start.subtract(diff).toISOString()
    const previousEndDate = start.toISOString() // Previous period ends when current period starts
    console.log('[useCombinedLogsStats] Previous Period:', { previousStartDate, previousEndDate })
    return { previousStartDate, previousEndDate }
  }, [startDate, endDate])

  const prevEnabled = enabled && !!previousStartDate && !!previousEndDate
  console.log('[useCombinedLogsStats] Previous Period Queries enabled:', prevEnabled)

  // Setup queries for current period counts and charts
  const currentQueries = useMemo(() => {
    if (!enabled) return []
    // Use LOG_SOURCES_TO_QUERY instead of LOG_SOURCES
    return LOG_SOURCES_TO_QUERY.flatMap((table) => {
      const baseParams = {
        project: projectRef,
        iso_timestamp_start: startDate,
        iso_timestamp_end: endDate,
      }
      const countSql = genCountQuery(table, {})
      return [
        {
          // Include selectedSource in queryKey if it's not 'all'
          queryKey: ['log-count', projectRef, table, startDate, endDate, selectedSource],
          queryFn: async ({ signal }: { signal?: AbortSignal }) => {
            console.log(`[useCombinedLogsStats] Attempting Count Fetch for ${table}`)
            const { data: rawData, error } = await get(
              `/platform/projects/{ref}/analytics/endpoints/logs.all`,
              {
                params: {
                  path: { ref: projectRef },
                  query: { ...baseParams, sql: countSql },
                },
                signal,
              }
            )
            if (error) {
              console.error(`[useCombinedLogsStats] Count Fetch GET Error for ${table}:`, error)
              throw error
            }
            return rawData as CountResult
          },
          enabled: enabled,
          refetchOnWindowFocus: false,
          refetchOnMount: true,
        },
        {
          // Include selectedSource in queryKey if it's not 'all'
          queryKey: ['log-chart', projectRef, table, startDate, endDate, interval, selectedSource],
          queryFn: async ({ signal }: { signal?: AbortSignal }) => {
            console.log(`[useCombinedLogsStats] Attempting Chart Fetch for ${table}`)
            // Construct specific chart SQL ensuring the correct interval is used
            const joins = genCrossJoinUnnests(table)
            const errorCondition = getErrorCondition(table)
            const warningCondition = getWarningCondition(table)
            // Apply interval and date range directly in the WHERE/GROUP BY
            const bigQueryInterval = mapAnalyticsIntervalToBigQuery(interval)
            const specificChartSql = `
              SELECT
                timestamp_trunc(t.timestamp, ${bigQueryInterval}) as timestamp,
                count(CASE WHEN NOT (${errorCondition} OR ${warningCondition}) THEN 1 END) as ok_count,
                count(CASE WHEN ${errorCondition} THEN 1 END) as error_count,
                count(CASE WHEN ${warningCondition} THEN 1 END) as warning_count
              FROM ${table} t ${joins}
              WHERE t.timestamp >= '${startDate}' AND t.timestamp <= '${endDate}'
              GROUP BY timestamp ORDER BY timestamp ASC
            `

            const { data: rawData, error } = await get(
              `/platform/projects/{ref}/analytics/endpoints/logs.all`,
              {
                params: {
                  path: { ref: projectRef },
                  query: { ...baseParams, sql: specificChartSql }, // Use specifically constructed SQL
                },
                signal,
              }
            )
            if (error) {
              console.error(`[useCombinedLogsStats] Chart Fetch GET Error for ${table}:`, error)
              throw error
            }
            return rawData as ChartResult
          },
          enabled: enabled,
          refetchOnWindowFocus: false,
          refetchOnMount: true,
        },
      ]
    })
  }, [projectRef, startDate, endDate, interval, enabled, LOG_SOURCES_TO_QUERY, selectedSource]) // Add dependencies

  // Setup queries for previous period counts AND CHARTS
  const previousQueries = useMemo(() => {
    if (!prevEnabled) return []
    // Use LOG_SOURCES_TO_QUERY instead of LOG_SOURCES
    return LOG_SOURCES_TO_QUERY.flatMap((table) => {
      const baseParams = {
        project: projectRef,
        iso_timestamp_start: previousStartDate!,
        iso_timestamp_end: previousEndDate!,
      }
      const countSql = genCountQuery(table, {})
      return [
        {
          // Include selectedSource in queryKey if it's not 'all'
          queryKey: [
            'log-count-prev',
            projectRef,
            table,
            previousStartDate,
            previousEndDate,
            selectedSource,
          ],
          queryFn: async ({ signal }: { signal?: AbortSignal }) => {
            console.log(`[useCombinedLogsStats] Attempting Previous Count Fetch for ${table}`)
            const { data: rawData, error } = await get(
              `/platform/projects/{ref}/analytics/endpoints/logs.all`,
              {
                params: {
                  path: { ref: projectRef },
                  query: { ...baseParams, sql: countSql },
                },
                signal,
              }
            )
            if (error) {
              console.error(
                `[useCombinedLogsStats] Previous Count Fetch GET Error for ${table}:`,
                error
              )
              throw error
            }
            return rawData as CountResult
          },
          enabled: prevEnabled,
          refetchOnWindowFocus: false,
          refetchOnMount: true,
        },
        {
          // Include selectedSource in queryKey if it's not 'all'
          queryKey: [
            'log-chart-prev',
            projectRef,
            table,
            previousStartDate,
            previousEndDate,
            interval,
            selectedSource,
          ],
          queryFn: async ({ signal }: { signal?: AbortSignal }) => {
            console.log(`[useCombinedLogsStats] Attempting Previous Chart Fetch for ${table}`)
            const joins = genCrossJoinUnnests(table)
            const errorCondition = getErrorCondition(table)
            const warningCondition = getWarningCondition(table)
            const bigQueryInterval = mapAnalyticsIntervalToBigQuery(interval)
            const specificChartSql = `
              SELECT
                timestamp_trunc(t.timestamp, ${bigQueryInterval}) as timestamp,
                count(CASE WHEN NOT (${errorCondition} OR ${warningCondition}) THEN 1 END) as ok_count,
                count(CASE WHEN ${errorCondition} THEN 1 END) as error_count,
                count(CASE WHEN ${warningCondition} THEN 1 END) as warning_count
              FROM ${table} t ${joins}
              WHERE t.timestamp >= '${previousStartDate}' AND t.timestamp <= '${previousEndDate}'
              GROUP BY timestamp ORDER BY timestamp ASC
            `
            const { data: rawData, error } = await get(
              `/platform/projects/{ref}/analytics/endpoints/logs.all`,
              {
                params: {
                  path: { ref: projectRef },
                  query: { ...baseParams, sql: specificChartSql },
                },
                signal,
              }
            )
            if (error) {
              console.error(
                `[useCombinedLogsStats] Previous Chart Fetch GET Error for ${table}:`,
                error
              )
              throw error
            }
            return rawData as ChartResult
          },
          enabled: prevEnabled,
          refetchOnWindowFocus: false,
          refetchOnMount: true,
        },
      ]
    })
  }, [
    projectRef,
    previousStartDate,
    previousEndDate,
    interval,
    prevEnabled,
    LOG_SOURCES_TO_QUERY,
    selectedSource, // Add dependencies
  ])

  // Run all queries
  const currentResults = useQueries({ queries: currentQueries })
  const previousResults = useQueries({ queries: previousQueries })

  // Process results for current period
  const {
    totalCount,
    combinedRawChart,
    currentCombinedError,
    currentIsLoading,
    currentIsSuccess,
    totalOkCount,
    totalWarningCount,
    totalErrorCount,
  } = useMemo(() => {
    let currentTotalCount = 0
    const errors: any[] = []
    let currentIsLoading = false
    let currentIsSuccess = true
    const combinedTimestamps: { [timestamp: string]: CombinedLogStatsData } = {}

    // Handle case where there are no queries to run
    if (currentQueries.length === 0) {
      return {
        totalCount: 0,
        combinedRawChart: [],
        currentCombinedError: null,
        currentIsLoading: false,
        currentIsSuccess: true,
        totalOkCount: 0,
        totalWarningCount: 0,
        totalErrorCount: 0,
      }
    }

    currentResults.forEach((result, index) => {
      const queryType = index % 2 === 0 ? 'count' : 'chart'
      // Use LOG_SOURCES_TO_QUERY to get the correct table
      const table = LOG_SOURCES_TO_QUERY[Math.floor(index / 2)]

      console.log(`[useCombinedLogsStats] CURRENT Result for ${table} (${queryType}):`, {
        status: result.status,
        isFetching: result.isFetching,
        error: result.error,
      })

      if (result.isLoading || result.isFetching) {
        currentIsLoading = true
      }
      if (result.error) {
        errors.push({ period: 'current', table, type: queryType, error: result.error })
        currentIsSuccess = false
      }
      if (result.isSuccess && result.data) {
        if (queryType === 'count') {
          const countResult = result.data as CountResult
          if (countResult.result && countResult.result.length > 0) {
            currentTotalCount += countResult.result[0].count || 0
          }
        } else {
          const chartResult = result.data as ChartResult
          chartResult.result?.forEach((item) => {
            const tsMilli = item.timestamp > 1e12 ? item.timestamp : item.timestamp * 1000
            const ts = dayjs(tsMilli).toISOString()
            if (!combinedTimestamps[ts]) {
              combinedTimestamps[ts] = {
                timestamp: ts,
                ok_count: 0,
                error_count: 0,
                warning_count: 0,
              }
            }
            combinedTimestamps[ts].ok_count += item.ok_count || 0
            combinedTimestamps[ts].error_count += item.error_count || 0
            combinedTimestamps[ts].warning_count += item.warning_count || 0
          })
        }
      } else if (!result.isLoading && !result.isFetching && !result.isSuccess) {
        if (enabled) currentIsSuccess = false
      }
    })
    const processedChartData = Object.values(combinedTimestamps)

    let currentTotalOkCount = 0
    let currentTotalWarningCount = 0
    let currentTotalErrorCount = 0
    processedChartData.forEach((datum) => {
      currentTotalOkCount += datum.ok_count
      currentTotalWarningCount += datum.warning_count
      currentTotalErrorCount += datum.error_count
    })

    return {
      totalCount: currentTotalCount,
      combinedRawChart: processedChartData,
      currentCombinedError: errors.length > 0 ? errors : null,
      currentIsLoading,
      currentIsSuccess: !currentIsLoading && currentIsSuccess,
      totalOkCount: currentTotalOkCount,
      totalWarningCount: currentTotalWarningCount,
      totalErrorCount: currentTotalErrorCount,
    }
  }, [currentResults, enabled, LOG_SOURCES_TO_QUERY]) // Add dependency

  // Process results for previous period counts AND CHARTS
  const {
    previousTotalCount,
    previousCombinedError,
    previousIsLoading,
    previousIsSuccess,
    previousTotalOkCount,
    previousTotalWarningCount,
    previousTotalErrorCount,
  } = useMemo(() => {
    let previousTotalCount = 0
    const errors: any[] = []
    let previousIsLoading = false
    let previousIsSuccess = true
    const previousCombinedTimestamps: { [timestamp: string]: CombinedLogStatsData } = {}

    // Handle case where there are no queries to run
    if (previousQueries.length === 0) {
      return {
        previousTotalCount: 0,
        previousCombinedError: null,
        previousIsLoading: false,
        previousIsSuccess: true,
        previousTotalOkCount: 0,
        previousTotalWarningCount: 0,
        previousTotalErrorCount: 0,
      }
    }

    previousResults.forEach((result, index) => {
      const queryType = index % 2 === 0 ? 'count' : 'chart'
      // Use LOG_SOURCES_TO_QUERY to get the correct table
      const table = LOG_SOURCES_TO_QUERY[Math.floor(index / 2)]

      console.log(`[useCombinedLogsStats] PREVIOUS Result for ${table} (${queryType}):`, {
        status: result.status,
        isFetching: result.isFetching,
        error: result.error,
      })

      if (result.isLoading || result.isFetching) {
        previousIsLoading = true
      }
      if (result.error) {
        errors.push({ period: 'previous', table, type: queryType, error: result.error })
        previousIsSuccess = false
      }
      if (result.isSuccess && result.data) {
        if (queryType === 'count') {
          const countResult = result.data as CountResult
          if (countResult.result && countResult.result.length > 0) {
            previousTotalCount += countResult.result[0].count || 0
          }
        } else {
          const chartResult = result.data as ChartResult
          chartResult.result?.forEach((item) => {
            const tsMilli = item.timestamp > 1e12 ? item.timestamp : item.timestamp * 1000
            const ts = dayjs(tsMilli).toISOString()
            if (!previousCombinedTimestamps[ts]) {
              previousCombinedTimestamps[ts] = {
                timestamp: ts,
                ok_count: 0,
                error_count: 0,
                warning_count: 0,
              }
            }
            previousCombinedTimestamps[ts].ok_count += item.ok_count || 0
            previousCombinedTimestamps[ts].error_count += item.error_count || 0
            previousCombinedTimestamps[ts].warning_count += item.warning_count || 0
          })
        }
      } else if (!result.isLoading && !result.isFetching && !result.isSuccess) {
        if (prevEnabled) previousIsSuccess = false
      }
    })

    const previousProcessedChartData = Object.values(previousCombinedTimestamps)
    let prevTotalOkCount = 0
    let prevTotalWarningCount = 0
    let prevTotalErrorCount = 0
    previousProcessedChartData.forEach((datum) => {
      prevTotalOkCount += datum.ok_count
      prevTotalWarningCount += datum.warning_count
      prevTotalErrorCount += datum.error_count
    })

    return {
      previousTotalCount,
      previousCombinedError: errors.length > 0 ? errors : null,
      previousIsLoading,
      previousIsSuccess: !previousIsLoading && previousIsSuccess,
      previousTotalOkCount: prevTotalOkCount,
      previousTotalWarningCount: prevTotalWarningCount,
      previousTotalErrorCount: prevTotalErrorCount,
    }
  }, [previousResults, prevEnabled, LOG_SOURCES_TO_QUERY]) // Add dependency

  // Fill gaps in timeseries data for CURRENT period chart
  const { data: filledChartData, error: fillError } = useFillTimeseriesSorted(
    combinedRawChart, // only fill current chart data
    'timestamp',
    ['ok_count', 'error_count', 'warning_count'],
    0,
    startDate,
    endDate
  )
  console.log('[useCombinedLogsStats] Timeseries Fill Error:', fillError)

  // Combine loading, success, and error states
  const isLoading = currentIsLoading || previousIsLoading
  // Overall success requires both periods to succeed (or be appropriately disabled)
  const isSuccess = currentIsSuccess && previousIsSuccess
  const finalError = currentCombinedError || previousCombinedError || fillError

  console.log('[useCombinedLogsStats] Final Hook state:', {
    totalCount,
    previousTotalCount,
    totalOkCount,
    totalWarningCount,
    totalErrorCount,
    previousTotalOkCount, // log previous breakdown
    previousTotalWarningCount,
    previousTotalErrorCount,
    chartData: filledChartData,
    finalError,
    isLoading,
    isSuccess,
  })

  if (finalError) {
    console.error('[useCombinedLogsStats] Encountered error:', {
      currentError: currentCombinedError,
      previousError: previousCombinedError,
      fillError: fillError,
    })
  }

  return {
    totalCount,
    previousTotalCount,
    chartData: (filledChartData as CombinedLogStatsData[]) || [],
    error: finalError,
    isLoading,
    isSuccess,
    totalOkCount,
    totalWarningCount,
    totalErrorCount,
    // Return previous breakdown counts
    previousTotalOkCount,
    previousTotalWarningCount,
    previousTotalErrorCount,
  }
}
