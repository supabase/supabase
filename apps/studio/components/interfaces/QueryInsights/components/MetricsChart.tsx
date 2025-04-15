import { useState } from 'react'
import { MetricType } from '../QueryInsights'
import { QueryInsightsMetric, QueryInsightsQuery } from 'data/query-insights/query-insights-query'
import { motion } from 'framer-motion'
import { VisibleMetricsState } from './MetricToggleButtons'
import { MetricToggleButtons } from './MetricToggleButtons'
import { SelectedQueryBadge } from './SelectedQueryBadge'
import {
  useQueryLatencyChart,
  useRowsReadChart,
  useCallsChart,
  useCacheHitsChart,
  CHART_OPACITY,
} from '../hooks/useChartConfig'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import dayjs from 'dayjs'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from 'ui'

interface MetricsChartProps {
  data: QueryInsightsMetric[]
  metric: MetricType
  isLoading: boolean
  startTime: string
  endTime: string
  selectedQuery: QueryInsightsQuery | null
  hoveredQuery: QueryInsightsQuery | null
}

export function MetricsChart(props: MetricsChartProps) {
  const { data, metric, isLoading, startTime, endTime, selectedQuery, hoveredQuery } = props

  const [visibleMetrics, setVisibleMetrics] = useState<VisibleMetricsState>({
    // Old keys for backward compatibility
    p50: true,
    p95: true,
    p99: true,
    p99_9: true,
    // Latency
    latency_p50: true,
    latency_p90: true,
    latency_p99: true,
    query_latency: true,
    // Rows
    rows: true,
    query_rows: true,
    // Cache
    shared_blks_hit: true,
    shared_blks_read: true,
    shared_blks_dirtied: true,
    shared_blks_written: true,
    cache_hit_ratio: true,
    cache_miss_ratio: true,
    // Calls
    calls: true,
    query_calls: true,
  })

  // Handler for clearing the selected query
  const handleClearSelectedQuery = () => {
    const paramsToSend = { clearQuery: true }
    window.dispatchEvent(
      new CustomEvent('clearSelectedQueryInsightsQuery', { detail: paramsToSend })
    )
  }

  // Get the appropriate chart configuration based on metric type
  const chartHookOptions = { data, startTime, endTime, selectedQuery, hoveredQuery, metric }

  // Call all hooks unconditionally to avoid React Hook rules violations
  const queryLatencyResult = useQueryLatencyChart(chartHookOptions)
  const rowsReadResult = useRowsReadChart(chartHookOptions)
  const callsResult = useCallsChart(chartHookOptions)
  const cacheHitsResult = useCacheHitsChart(chartHookOptions)

  // Get the appropriate result based on metric type
  let chartConfig = null
  let metricBadges: { label: string; value: string; color: string }[] = []

  // Get the current hook result based on metric type
  let currentHookResult
  switch (metric) {
    case 'query_latency':
      currentHookResult = queryLatencyResult
      break
    case 'rows_read':
      currentHookResult = rowsReadResult
      break
    case 'calls':
      currentHookResult = callsResult
      break
    case 'cache_hits':
      currentHookResult = cacheHitsResult
      break
    default:
      currentHookResult = {
        chartConfig: null,
        metricBadges: [],
        renderConfig: { yAxisDomain: [0, 'auto'], keyMappings: {} },
      }
  }

  // Extract values
  chartConfig = currentHookResult.chartConfig
  metricBadges = currentHookResult.metricBadges
  const yAxisDomain = currentHookResult.renderConfig.yAxisDomain
  const yAxisFormatter = currentHookResult.renderConfig.yAxisFormatter
  const yAxisWidth = currentHookResult.renderConfig.yAxisWidth
  const yAxisTickCount = currentHookResult.renderConfig.yAxisTickCount
  const keyMappings = currentHookResult.renderConfig.keyMappings

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-sm text-foreground-light">Loading metrics...</div>
        </motion.div>
      </div>
    )
  }

  // No data state
  if (!chartConfig) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-sm text-foreground-light">No data available</div>
        </motion.div>
      </div>
    )
  }

  const { config, chartData } = chartConfig

  // Debug logging to identify why query_rows isn't rendering
  console.log('[MetricsChart] Rendering chart with:', {
    metric,
    selectedQuery: selectedQuery?.query_id,
    chartDataLength: chartData.length,
    configKeys: Object.keys(config),
    querySpecificData: chartData.filter(
      (point) => point.query_rows > 0 || point.query_latency > 0 || point.query_calls > 0
    ),
    visibleMetrics: {
      query_rows: visibleMetrics.query_rows,
      rows: visibleMetrics.rows,
    },
  })

  return (
    <div className="h-[320px] flex flex-col">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex flex-wrap items-center gap-2 px-5 mb-4">
          <MetricToggleButtons
            chartConfig={chartConfig}
            visibleMetrics={visibleMetrics}
            setVisibleMetrics={setVisibleMetrics}
            metric={metric}
            selectedQuery={selectedQuery}
          />

          {selectedQuery && (
            <SelectedQueryBadge
              selectedQuery={selectedQuery}
              onClear={handleClearSelectedQuery}
              metric={metric}
              metrics={metricBadges}
            />
          )}
        </div>

        <div className="flex-1 min-h-0">
          <ChartContainer className="h-full w-full" config={config}>
            <AreaChart
              data={chartData}
              style={{ width: '100%', height: '100%' }}
              margin={{ right: 16 }}
            >
              <defs>
                {Object.entries(config).map(([key, value]) => (
                  <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={(value as any).color}
                      stopOpacity={CHART_OPACITY.GRADIENT_START}
                    />
                    <stop
                      offset="95%"
                      stopColor={(value as any).color}
                      stopOpacity={CHART_OPACITY.GRADIENT_END}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="timestamp"
                interval="preserveStartEnd"
                minTickGap={50}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => dayjs(value).format('HH:mm')}
              />
              <YAxis
                tickFormatter={yAxisFormatter}
                domain={yAxisDomain as any}
                allowDataOverflow={false}
                width={yAxisWidth}
                tickCount={yAxisTickCount}
                yAxisId="left"
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" hideLabel />}
              />
              <ChartLegend content={<ChartLegendContent />} />

              {/* Render data series based on configuration */}
              {Object.entries(config).map(([key, value]) => {
                // Map the key to the corresponding visibleMetrics key
                const visibleMetricsKey = (keyMappings as Record<string, string>)[key] || key

                // Skip series not enabled in visible metrics
                if (!visibleMetrics[visibleMetricsKey] && !visibleMetrics[key]) return null

                // Skip query-specific metrics when not needed
                if (
                  (key === 'query_rows' || key === 'query_latency' || key === 'query_calls') &&
                  !selectedQuery &&
                  !hoveredQuery
                ) {
                  console.log(`[MetricsChart] Skipping ${key} - no selected or hovered query`)
                  return null
                }

                // Skip showing full series data for query-specific metrics
                if (key === 'query_rows' || key === 'query_latency' || key === 'query_calls') {
                  console.log(
                    `[MetricsChart] Rendering ${key} with selectedQuery=${!!selectedQuery}`
                  )

                  // If hovering and not selected, show hover style
                  if (hoveredQuery && !selectedQuery) {
                    return (
                      <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        fill={`url(#gradient-${key})`}
                        stroke={(value as any).color}
                        strokeWidth={1.5}
                        dot={false}
                        animationDuration={100}
                        fillOpacity={CHART_OPACITY.HIGHLIGHT_FILL * 0.7}
                        strokeOpacity={CHART_OPACITY.HIGHLIGHT_STROKE * 0.8}
                        yAxisId="left"
                      />
                    )
                  }
                  // If selected, show selected style
                  else if (selectedQuery) {
                    return (
                      <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        fill={`url(#gradient-${key})`}
                        stroke={(value as any).color}
                        strokeWidth={2}
                        dot={false}
                        animationDuration={100}
                        fillOpacity={CHART_OPACITY.HIGHLIGHT_FILL}
                        strokeOpacity={CHART_OPACITY.HIGHLIGHT_STROKE}
                        yAxisId="left"
                      />
                    )
                  }
                  console.log(`[MetricsChart] Not rendering ${key} - conditions not met`)
                  return null
                }

                // Regular series
                return (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    fill={`url(#gradient-${key})`}
                    stroke={(value as any).color}
                    strokeWidth={key.includes('p99') || key.includes('p95') ? 1.5 : 1.5}
                    dot={false}
                    animationDuration={100}
                    fillOpacity={
                      selectedQuery || hoveredQuery
                        ? CHART_OPACITY.FILL_SELECTED
                        : CHART_OPACITY.FILL_NORMAL
                    }
                    strokeOpacity={
                      selectedQuery || hoveredQuery
                        ? CHART_OPACITY.STROKE_SELECTED
                        : CHART_OPACITY.STROKE_NORMAL
                    }
                    yAxisId="left"
                  />
                )
              })}
            </AreaChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  )
}
