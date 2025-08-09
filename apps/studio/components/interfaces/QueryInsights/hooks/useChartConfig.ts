import { useMemo } from 'react'
import { useParams } from 'common'
import {
  getQueryLatencyConfig,
  getRowsReadConfig,
  getCallsConfig,
  getCacheHitsConfig,
  ChartConfigResult,
} from '../chartConfigs'
import { QueryInsightsMetric, QueryInsightsQuery } from 'data/query-insights/query-insights-query'
import {
  useSingleQueryLatency,
  useSingleQueryRows,
  useSingleQueryCalls,
} from 'data/query-insights/single-query-latency-query'
import { formatLatency, formatMetricValue } from '../QueryInsights.utils'
import { MetricType } from '../QueryInsights'

// Shared opacity settings for all charts
export const CHART_OPACITY = {
  GRADIENT_START: 0.3,
  GRADIENT_END: 0.05,
  FILL_NORMAL: 0.3,
  FILL_SELECTED: 0.05,
  STROKE_NORMAL: 0.8,
  STROKE_SELECTED: 0.2,
  HIGHLIGHT_FILL: 0.6,
  HIGHLIGHT_STROKE: 1,
}

interface ChartHookOptions {
  data: QueryInsightsMetric[]
  startTime: string
  endTime: string
  selectedQuery: QueryInsightsQuery | null
  hoveredQuery: QueryInsightsQuery | null
}

interface ChartHookResult<T = any> {
  chartConfig: ChartConfigResult<T> | null
  metricBadges: { label: string; value: string; color: string }[]
  renderConfig: {
    yAxisDomain: [number, string | number]
    yAxisFormatter?: (value: number) => string
    yAxisWidth?: number
    yAxisTickCount?: number
    keyMappings: { [key: string]: string } // Maps config keys to visibleMetrics keys
  }
}

/**
 * Hook for Query Latency chart configuration
 */
export function useQueryLatencyChart({
  data,
  startTime,
  endTime,
  selectedQuery,
  hoveredQuery,
  metric,
}: ChartHookOptions & { metric: MetricType }): ChartHookResult {
  const { ref } = useParams()
  const isActive = metric === 'query_latency'

  console.log(
    '[useQueryLatencyChart] selectedQuery:',
    selectedQuery?.query_id,
    'hoveredQuery:',
    hoveredQuery?.query_id
  )

  // Fetch single query latency data
  const { data: queryLatencyData } = useSingleQueryLatency(
    ref,
    startTime,
    endTime,
    (selectedQuery?.query_id || hoveredQuery?.query_id)?.toString() || '',
    {
      // Only fetch data if this is the current metric and we have a query selected/hovered
      enabled: isActive && !!(selectedQuery || hoveredQuery),
    }
  )

  // Generate chart configuration
  const chartConfig = useMemo(() => {
    if (!isActive || !Array.isArray(data) || data.length === 0) {
      return null
    }
    return getQueryLatencyConfig(data, queryLatencyData)
  }, [data, queryLatencyData, isActive])

  // Get metrics for the selected query badge
  const metricBadges = useMemo(() => {
    if (!isActive || !selectedQuery || !chartConfig) return []

    const { chartData, config } = chartConfig

    // Calculate average latency across all data points that have query_latency
    const queryLatencyPoints = chartData.filter((point) => point.query_latency > 0)
    const avgLatency =
      queryLatencyPoints.length > 0
        ? queryLatencyPoints.reduce((sum, point) => sum + (point.query_latency ?? 0), 0) /
          queryLatencyPoints.length
        : 0

    console.log('[useQueryLatencyChart] Calculating metric badge:', {
      avgLatency,
      pointsWithLatency: queryLatencyPoints.length,
      totalPoints: chartData.length,
    })

    return [
      {
        label: 'Query latency',
        value: formatLatency(avgLatency),
        color: config.query_latency?.color || 'hsl(var(--chart-1))',
      },
    ]
  }, [selectedQuery, chartConfig, isActive])

  // Provide rendering configuration
  const renderConfig = {
    yAxisDomain: [0, 'auto'] as [number, string | number],
    yAxisWidth: 80,
    yAxisTickCount: 5,
    keyMappings: {
      p50: 'latency_p50',
      p95: 'latency_p90',
      p99: 'latency_p99',
    },
  }

  return { chartConfig, metricBadges, renderConfig }
}

/**
 * Hook for Rows Read chart configuration
 */
export function useRowsReadChart({
  data,
  startTime,
  endTime,
  selectedQuery,
  hoveredQuery,
  metric,
}: ChartHookOptions & { metric: MetricType }): ChartHookResult {
  const { ref } = useParams()
  const isActive = metric === 'rows_read'

  console.log(
    '[useRowsReadChart] selectedQuery:',
    selectedQuery?.query_id,
    'hoveredQuery:',
    hoveredQuery?.query_id
  )

  // Fetch single query rows data
  const { data: queryRowsData } = useSingleQueryRows(
    ref,
    startTime,
    endTime,
    (selectedQuery?.query_id || hoveredQuery?.query_id)?.toString() || '',
    {
      // Only fetch data if this is the current metric and we have a query selected/hovered
      enabled: isActive && !!(selectedQuery || hoveredQuery),
    }
  )

  console.log('[useRowsReadChart] queryRowsData:', queryRowsData)

  // Generate chart configuration
  const chartConfig = useMemo(() => {
    if (!isActive || !Array.isArray(data) || data.length === 0) {
      return null
    }
    const config = getRowsReadConfig(data, queryRowsData)
    console.log('[useRowsReadChart] chartConfig result:', {
      chartDataLength: config.chartData.length,
      hasQueryRows: config.chartData.some((point) => point.query_rows > 0),
      firstFewPoints: config.chartData.slice(0, 3),
      queryRowsPoints: config.chartData.filter((point) => point.query_rows > 0),
    })
    return config
  }, [data, queryRowsData, isActive])

  // Get metrics for the selected query badge
  const metricBadges = useMemo(() => {
    if (!isActive || !selectedQuery || !chartConfig) return []

    const { chartData, config } = chartConfig

    // Calculate total rows for display - sum across all data points
    const totalQueryRows = chartData.reduce((sum, point) => sum + (point.query_rows ?? 0), 0)

    console.log('[useRowsReadChart] Calculating metric badge:', {
      totalQueryRows,
      chartDataPoints: chartData.length,
      hasQueryRows: chartData.some((point) => point.query_rows > 0),
    })

    // Show the total rows rather than just the latest point
    return [
      {
        label: 'Rows',
        value: formatMetricValue(totalQueryRows),
        color: config.query_rows?.color || 'hsl(var(--chart-2))',
      },
    ]
  }, [selectedQuery, chartConfig, isActive])

  // Provide rendering configuration
  const renderConfig = {
    yAxisDomain: [0, 'auto'] as [number, string | number],
    keyMappings: {},
  }

  return { chartConfig, metricBadges, renderConfig }
}

/**
 * Hook for Calls chart configuration
 */
export function useCallsChart({
  data,
  startTime,
  endTime,
  selectedQuery,
  hoveredQuery,
  metric,
}: ChartHookOptions & { metric: MetricType }): ChartHookResult {
  const { ref } = useParams()
  const isActive = metric === 'calls'

  console.log(
    '[useCallsChart] selectedQuery:',
    selectedQuery?.query_id,
    'hoveredQuery:',
    hoveredQuery?.query_id
  )

  // Fetch single query calls data
  const { data: queryCallsData } = useSingleQueryCalls(
    ref,
    startTime,
    endTime,
    (selectedQuery?.query_id || hoveredQuery?.query_id)?.toString() || '',
    {
      // Only fetch data if this is the current metric and we have a query selected/hovered
      enabled: isActive && !!(selectedQuery || hoveredQuery),
    }
  )

  // Generate chart configuration
  const chartConfig = useMemo(() => {
    if (!isActive || !Array.isArray(data) || data.length === 0) {
      return null
    }
    return getCallsConfig(data, queryCallsData)
  }, [data, queryCallsData, isActive])

  // Get metrics for the selected query badge
  const metricBadges = useMemo(() => {
    if (!isActive || !selectedQuery || !chartConfig) return []

    const { chartData, config } = chartConfig

    // Calculate total calls for display
    const totalQueryCalls = chartData.reduce((sum, point) => sum + (point.query_calls ?? 0), 0)

    return [
      {
        label: 'Calls',
        value: formatMetricValue(totalQueryCalls),
        color: config.query_calls?.color || 'hsl(var(--chart-3))',
      },
    ]
  }, [selectedQuery, chartConfig, isActive])

  // Provide rendering configuration
  const renderConfig = {
    yAxisDomain: [0, 'auto'] as [number, string | number],
    keyMappings: {},
  }

  return { chartConfig, metricBadges, renderConfig }
}

/**
 * Hook for Cache Hits chart configuration
 */
export function useCacheHitsChart({
  data,
  metric,
}: ChartHookOptions & { metric: MetricType }): ChartHookResult {
  const isActive = metric === 'cache_hits'

  // Generate chart configuration
  const chartConfig = useMemo(() => {
    if (!isActive || !Array.isArray(data) || data.length === 0) {
      return null
    }
    return getCacheHitsConfig(data)
  }, [data, isActive])

  // Provide rendering configuration
  const renderConfig = {
    yAxisDomain: [0, 100] as [number, string | number],
    yAxisFormatter: (value: number) => `${value}%`,
    keyMappings: {},
  }

  // Cache hits don't have query-specific metrics
  return { chartConfig, metricBadges: [], renderConfig }
}
