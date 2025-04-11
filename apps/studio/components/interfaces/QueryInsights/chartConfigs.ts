import { QueryInsightsMetric } from 'data/query-insights/query-insights-query'
import { formatLatency, formatMetricValue } from './QueryInsights.utils'
import dayjs from 'dayjs'

export interface ChartConfigType {
  [key: string]: {
    label: string
    color: string
    formatter: (value: number) => string
  }
}

// Define return types for each chart configuration
export interface RowsReadChartData {
  timestamp: string
  rows: number
  query_rows: number
}

export interface QueryLatencyChartData {
  timestamp: string
  p50: number | undefined
  p95: number | undefined
  p99: number | undefined
  p99_9: number | undefined
  query_latency: number
}

export interface CacheHitsChartData {
  timestamp: string
  cache_hit_ratio: number
  cache_miss_ratio: number
  shared_blks_hit: number
  shared_blks_read: number
  shared_blks_dirtied: number
  shared_blks_written: number
}

export interface GenericChartData {
  timestamp: string
  ok_count: number
  warning_count: number
  error_count: number
}

export interface ChartConfigResult<T> {
  chartData: T[]
  config: ChartConfigType
}

/**
 * Prepares data and configuration for the Rows Read chart
 */
export function getRowsReadConfig(
  data: QueryInsightsMetric[],
  queryRowsData?: QueryInsightsMetric[]
): ChartConfigResult<RowsReadChartData> {
  // Create the baseline chart data from the metrics
  const chartData = data.map((point) => ({
    timestamp: point.timestamp,
    rows: Number(point.value) ?? 0,
    query_rows: 0,
  }))

  // Sort chart data by timestamp
  chartData.sort((a, b) => dayjs(a.timestamp).diff(dayjs(b.timestamp)))

  // If we have query rows data, add it to the chart
  if (queryRowsData && queryRowsData.length > 0) {
    // Create a map of timestamps to query rows values
    const queryRowsMap = new Map<string, number>()
    queryRowsData.forEach((point) => {
      queryRowsMap.set(point.timestamp, Number(point.value) || 0)
    })

    // Add query rows data to each chart data point
    chartData.forEach((point) => {
      if (queryRowsMap.has(point.timestamp)) {
        point.query_rows = queryRowsMap.get(point.timestamp)!
      }
    })

    // Add any missing query rows points
    queryRowsData.forEach((point) => {
      if (!chartData.find((d) => d.timestamp === point.timestamp)) {
        chartData.push({
          timestamp: point.timestamp,
          rows: 0,
          query_rows: Number(point.value) || 0,
        })
      }
    })

    // Re-sort chart data by timestamp
    chartData.sort((a, b) => dayjs(a.timestamp).diff(dayjs(b.timestamp)))
  }

  const config: ChartConfigType = {
    rows: {
      label: 'Rows Read',
      color: '#3ECF8E',
      formatter: formatMetricValue,
    },
    query_rows: {
      label: 'Query Rows',
      color: '#9BA6B0',
      formatter: formatMetricValue,
    },
  }

  return { chartData, config }
}

/**
 * Prepares data and configuration for the Query Latency chart
 */
export function getQueryLatencyConfig(
  data: QueryInsightsMetric[],
  queryLatencyData?: QueryInsightsMetric[]
): ChartConfigResult<QueryLatencyChartData> {
  // Create the baseline chart data from the metrics
  const chartData = data.map((point) => {
    // Keep the original timestamp to maintain 5-minute intervals
    const timestamp = point.timestamp
    return {
      timestamp,
      p50: point.p50,
      p95: point.p95,
      p99: point.p99,
      p99_9: point.p99_9,
      // Initialize query latency as 0
      query_latency: 0,
    }
  })

  // Sort chart data by timestamp
  chartData.sort((a, b) => {
    return dayjs(a.timestamp).diff(dayjs(b.timestamp))
  })

  // If we have query latency data, add it to the chart
  if (queryLatencyData && queryLatencyData.length > 0) {
    // Create a map of timestamps to query latency values
    const queryLatencyMap = new Map<string, number>()
    queryLatencyData.forEach((point) => {
      queryLatencyMap.set(point.timestamp, point.value || 0)
    })

    // Add query latency data to each chart data point
    chartData.forEach((point) => {
      if (queryLatencyMap.has(point.timestamp)) {
        point.query_latency = queryLatencyMap.get(point.timestamp)!
      }
    })

    // Add any missing query latency points
    queryLatencyData.forEach((point) => {
      if (!chartData.find((d) => d.timestamp === point.timestamp)) {
        chartData.push({
          timestamp: point.timestamp,
          p50: 0,
          p95: 0,
          p99: 0,
          p99_9: 0,
          query_latency: point.value || 0,
        })
      }
    })

    // Re-sort chart data by timestamp
    chartData.sort((a, b) => dayjs(a.timestamp).diff(dayjs(b.timestamp)))
  }

  const config: ChartConfigType = {
    p50: {
      label: 'p50',
      color: '#4B5563',
      formatter: formatLatency,
    },
    p95: {
      label: 'p95',
      color: '#6B7280',
      formatter: formatLatency,
    },
    p99: {
      label: 'p99',
      color: '#9CA3AF',
      formatter: formatLatency,
    },
    p99_9: {
      label: 'p99.9',
      color: '#D1D5DB',
      formatter: formatLatency,
    },
    query_latency: {
      label: 'Query latency',
      color: '#3B82F6',
      formatter: formatLatency,
    },
  }

  return { chartData, config }
}

/**
 * Prepares data and configuration for the Cache Hits chart
 */
export function getCacheHitsConfig(
  data: QueryInsightsMetric[],
  queryCacheData?: QueryInsightsMetric[]
): ChartConfigResult<CacheHitsChartData> {
  // Create the baseline chart data from the metrics
  const chartData = data.map((point) => {
    const hit = point.shared_blks_hit ?? 0
    const read = point.shared_blks_read ?? 0
    const total = hit + read

    // Calculate percentages, handling division by zero
    const cache_hit_ratio = total > 0 ? (hit / total) * 100 : 0
    // Cache miss is the inverse of cache hit
    const cache_miss_ratio = total > 0 ? 100 - cache_hit_ratio : 0

    return {
      timestamp: point.timestamp,
      shared_blks_hit: hit,
      shared_blks_read: read,
      shared_blks_dirtied: point.shared_blks_dirtied ?? 0,
      shared_blks_written: point.shared_blks_written ?? 0,
      cache_hit_ratio,
      cache_miss_ratio,
    }
  })

  // Sort chart data by timestamp
  chartData.sort((a, b) => dayjs(a.timestamp).diff(dayjs(b.timestamp)))

  // Format percentages with % sign
  const percentFormatter = (value: number) => `${value.toFixed(1)}%`

  const config: ChartConfigType = {
    cache_hit_ratio: {
      label: 'Cache Hit Ratio',
      color: '#3ECF8E', // Green
      formatter: percentFormatter,
    },
    cache_miss_ratio: {
      label: 'Cache Miss Ratio',
      color: '#EF4444', // Red/danger
      formatter: percentFormatter,
    },
    shared_blks_dirtied: {
      label: 'Blocks Modified',
      color: '#9BA6B0', // Gray
      formatter: formatMetricValue,
    },
    shared_blks_written: {
      label: 'Blocks Written',
      color: '#6366F1', // Indigo
      formatter: formatMetricValue,
    },
  }

  return { chartData, config }
}

/**
 * Prepares data and configuration for generic metric charts like rows_written and queries_per_second
 */
export function getGenericMetricConfig(data: QueryInsightsMetric[]): {
  chartData: GenericChartData[]
} {
  // For other metrics, prepare data for the bar chart
  const chartData = data.map((point) => ({
    timestamp: dayjs(point.timestamp).toISOString(),
    ok_count: point.value ?? 0,
    warning_count: 0,
    error_count: 0,
  }))

  return { chartData }
}
