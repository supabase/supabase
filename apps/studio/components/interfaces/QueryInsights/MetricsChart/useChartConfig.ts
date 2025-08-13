import { useMemo } from 'react'
import { useParams } from 'common'
import {
  getQueryLatencyConfig,
  getRowsReadConfig,
  getCallsConfig,
  getCacheHitsConfig,
  getIssuesConfig,
  ChartConfigResult,
} from './MetricsChart.config'
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
      p95: 'latency_p95',
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



  // Generate chart configuration
  const chartConfig = useMemo(() => {
    if (!isActive || !Array.isArray(data) || data.length === 0) {
      return null
    }
    const config = getRowsReadConfig(data, queryRowsData)

    return config
  }, [data, queryRowsData, isActive])

  // Get metrics for the selected query badge
  const metricBadges = useMemo(() => {
    if (!isActive || !selectedQuery || !chartConfig) {
      return []
    }

    const { chartData, config } = chartConfig

    // Calculate total rows for display - sum across all data points
    const totalQueryRows = chartData.reduce((sum, point) => sum + (point.query_rows ?? 0), 0)

    // Show the total rows rather than just the latest point
    const formattedValue = formatMetricValue(totalQueryRows)
    
    return [
      {
        label: 'Rows',
        value: formattedValue,
        color: config.query_rows?.color || 'hsl(var(--chart-2))',
      },
    ]
  }, [selectedQuery, chartConfig, isActive])

  // Provide rendering configuration
  const renderConfig = {
    yAxisDomain: [0, 'auto'] as [number, string | number],
    keyMappings: {
      rows: 'rows',
      query_rows: 'query_rows',
    },
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

  // Get metrics for the selected query badge
  const metricBadges = useMemo(() => {
    if (!isActive || !chartConfig) return []

    const { chartData } = chartConfig

    // Calculate cache hit ratio
    const totalHits = chartData.reduce((sum, point) => sum + point.shared_blks_hit, 0)
    const totalReads = chartData.reduce((sum, point) => sum + point.shared_blks_read, 0)
    const cacheHitRatio = totalReads > 0 ? (totalHits / totalReads) * 100 : 0

    return [
      {
        label: 'Cache Hit Ratio',
        value: `${cacheHitRatio.toFixed(1)}%`,
        color: '#10b981',
      },
    ]
  }, [chartConfig, isActive])

  return {
    chartConfig,
    metricBadges,
    renderConfig: {
      yAxisDomain: [0, 100],
      yAxisFormatter: (value: number) => `${value.toFixed(0)}%`,
      yAxisWidth: 60,
      yAxisTickCount: 6,
      keyMappings: {
        cache_hit_ratio: 'cache_hit_ratio',
        cache_miss_ratio: 'cache_miss_ratio',
        shared_blks_hit: 'shared_blks_hit',
        shared_blks_read: 'shared_blks_read',
        shared_blks_dirtied: 'shared_blks_dirtied',
        shared_blks_written: 'shared_blks_written',
      },
    },
  }
}

/**
 * Hook for Issues chart configuration
 */
export function useIssuesChart({
  data,
  metric,
}: ChartHookOptions & { metric: MetricType }): ChartHookResult {
  const isActive = metric === 'issues'

  // Generate chart configuration
  const chartConfig = useMemo(() => {
    if (!isActive || !Array.isArray(data) || data.length === 0) {
      return null
    }
    return getIssuesConfig(data)
  }, [data, isActive])

  // Get metrics for the selected query badge
  const metricBadges = useMemo(() => {
    if (!isActive || !chartConfig) return []

    const { chartData } = chartConfig

    // Calculate total issues
    const totalIssues = chartData.reduce((sum, point) => sum + point.issues, 0)

    return [
      {
        label: 'Total Issues',
        value: totalIssues.toString(),
        color: '#ef4444',
      },
    ]
  }, [chartConfig, isActive])

  return {
    chartConfig,
    metricBadges,
    renderConfig: {
      yAxisDomain: [0, 'auto'],
      yAxisFormatter: (value: number) => value.toString(),
      yAxisWidth: 60,
      yAxisTickCount: 6,
      keyMappings: {
        issues: 'issues',
        query_issues: 'query_issues',
      },
    },
  }
}
