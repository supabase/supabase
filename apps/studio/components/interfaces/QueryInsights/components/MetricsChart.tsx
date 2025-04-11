import { LogsBarChart } from 'ui-patterns/LogsBarChart'
import { QueryInsightsMetric, QueryInsightsQuery } from 'data/query-insights/query-insights-query'
import dayjs from 'dayjs'
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Area, AreaChart } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  cn,
} from 'ui'
import { useState, useMemo } from 'react'
import { useParams } from 'common'
import { Button } from 'ui'
import { MetricType } from '../QueryInsights'
import {
  useSingleQueryLatency,
  useSingleQueryRows,
  useSingleQueryCalls,
} from 'data/query-insights/single-query-latency-query'
import { motion, AnimatePresence } from 'framer-motion'
import { formatLatency, formatMetricValue } from '../QueryInsights.utils'
import {
  getRowsReadConfig,
  getQueryLatencyConfig,
  getGenericMetricConfig,
  getCallsConfig,
  ChartConfigType,
  RowsReadChartData,
  QueryLatencyChartData,
  GenericChartData,
  ChartConfigResult,
  getCacheHitsConfig,
} from '../chartConfigs'

// Chart opacity constants
const CHART_OPACITY = {
  GRADIENT_START: 0.3,
  GRADIENT_END: 0.05,
  FILL_NORMAL: 0.3,
  FILL_SELECTED: 0.05,
  STROKE_NORMAL: 0.8,
  STROKE_SELECTED: 0.2,
  HIGHLIGHT_FILL: 0.6,
  HIGHLIGHT_STROKE: 1,
}

interface MetricsChartProps {
  data: QueryInsightsMetric[]
  metric: MetricType
  isLoading: boolean
  startTime: string
  endTime: string
  selectedQuery: QueryInsightsQuery | null
}

export function MetricsChart({
  data,
  metric,
  isLoading,
  startTime,
  endTime,
  selectedQuery,
}: MetricsChartProps) {
  const { ref } = useParams()
  const [visibleMetrics, setVisibleMetrics] = useState<{
    p50: boolean
    p95: boolean
    p99: boolean
    p99_9: boolean
    query_latency: boolean
    rows: boolean
    query_rows: boolean
    shared_blks_hit: boolean
    shared_blks_read: boolean
    shared_blks_dirtied: boolean
    shared_blks_written: boolean
    cache_hit_ratio: boolean
    cache_miss_ratio: boolean
    calls: boolean
    query_calls: boolean
  }>({
    p50: true,
    p95: true,
    p99: true,
    p99_9: true,
    query_latency: true,
    rows: true,
    query_rows: true,
    shared_blks_hit: true,
    shared_blks_read: true,
    shared_blks_dirtied: true,
    shared_blks_written: true,
    cache_hit_ratio: true,
    cache_miss_ratio: true,
    calls: true,
    query_calls: true,
  })

  // Fetch single query latency data if a query is selected
  const {
    data: queryLatencyData,
    isLoading: isLoadingQueryLatency,
    error: queryLatencyError,
  } = useSingleQueryLatency(ref, selectedQuery?.query_id?.toString(), startTime, endTime, {
    enabled: !!selectedQuery && metric === 'query_latency',
  })

  // Fetch single query rows data if a query is selected
  const {
    data: queryRowsData,
    isLoading: isLoadingQueryRows,
    error: queryRowsError,
  } = useSingleQueryRows(ref, selectedQuery?.query_id?.toString(), startTime, endTime, {
    enabled: !!selectedQuery && metric === 'rows_read',
  })

  // Fetch single query calls data if a query is selected
  const {
    data: queryCallsData,
    isLoading: isLoadingQueryCalls,
    error: queryCallsError,
  } = useSingleQueryCalls(ref, selectedQuery?.query_id?.toString(), startTime, endTime, {
    enabled: !!selectedQuery && metric === 'calls',
  })

  // Derive chart configuration based on the selected metric
  const chartConfig = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return null
    }

    switch (metric) {
      case 'rows_read':
        return getRowsReadConfig(data, queryRowsData)
      case 'query_latency':
        return getQueryLatencyConfig(data, queryLatencyData)
      case 'cache_hits':
        return getCacheHitsConfig(data)
      case 'calls':
        return getCallsConfig(data, queryCallsData)
      default:
        return getGenericMetricConfig(data)
    }
  }, [data, metric, queryLatencyData, queryRowsData, queryCallsData])

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

  if (!Array.isArray(data) || data.length === 0 || !chartConfig) {
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

  // Render charts based on metric type
  if (metric === 'rows_read' || metric === 'query_latency' || metric === 'cache_hits') {
    const config = (chartConfig as ChartConfigResult<any>).config
    const chartData = (chartConfig as ChartConfigResult<any>).chartData

    return (
      <div className="h-[320px] flex flex-col">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex gap-2 px-5 mb-4">
            <AnimatePresence>
              {Object.entries(config).map(([key, value]) => {
                // Only show specific buttons based on conditions
                if ((key === 'query_rows' || key === 'query_latency') && !selectedQuery) {
                  return null
                }

                // Filter out the blocks metrics for cache hits chart
                if (
                  metric === 'cache_hits' &&
                  (key === 'shared_blks_dirtied' || key === 'shared_blks_written')
                ) {
                  return null
                }

                const metricValue = Number(
                  chartData[chartData.length - 1]?.[key as keyof (typeof chartData)[0]]
                )
                const formattedValue = !isNaN(metricValue)
                  ? (value as any).formatter(metricValue)
                  : '0'

                return (
                  <motion.button
                    key={key}
                    initial={{ opacity: 0, scale: 0.95, x: -8 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      'text-xs px-2 py-1 rounded-full transition-colors inline-flex items-center gap-1.5 border',
                      visibleMetrics[key as keyof typeof visibleMetrics]
                        ? 'bg-surface-300'
                        : 'hover:bg-surface-100 border-transparent'
                    )}
                    onClick={() =>
                      setVisibleMetrics((prev) => ({
                        ...prev,
                        [key]: !prev[key as keyof typeof visibleMetrics],
                      }))
                    }
                  >
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        !visibleMetrics[key as keyof typeof visibleMetrics] && 'opacity-50'
                      )}
                      style={{ backgroundColor: (value as any).color }}
                    />
                    <span>
                      {(value as any).label}: {formattedValue}
                    </span>
                  </motion.button>
                )
              })}
            </AnimatePresence>
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
                  tickFormatter={
                    metric === 'cache_hits' ? (value) => `${value}%` : formatMetricValue
                  }
                  domain={
                    metric === 'cache_hits'
                      ? [0, 100]
                      : metric === 'query_latency'
                        ? ['auto', 'auto']
                        : ['dataMin', 'dataMax']
                  }
                  allowDataOverflow={false}
                  width={metric === 'query_latency' ? 80 : undefined}
                  tickCount={metric === 'query_latency' ? 5 : undefined}
                  yAxisId="left"
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" hideLabel />}
                />
                <ChartLegend content={<ChartLegendContent />} />

                {/* Render series based on metric type */}
                {metric === 'rows_read' && (
                  <>
                    {visibleMetrics.rows && (
                      <Area
                        type="monotone"
                        dataKey="rows"
                        fill={`url(#gradient-rows)`}
                        stroke={config.rows.color}
                        strokeWidth={1}
                        dot={false}
                        animationDuration={100}
                        fillOpacity={
                          selectedQuery ? CHART_OPACITY.FILL_SELECTED : CHART_OPACITY.FILL_NORMAL
                        }
                        strokeOpacity={
                          selectedQuery
                            ? CHART_OPACITY.STROKE_SELECTED
                            : CHART_OPACITY.STROKE_NORMAL
                        }
                        yAxisId="left"
                      />
                    )}
                    {selectedQuery && visibleMetrics.query_rows && (
                      <Area
                        type="monotone"
                        dataKey="query_rows"
                        fill={`url(#gradient-query_rows)`}
                        stroke={config.query_rows.color}
                        strokeWidth={2}
                        dot={false}
                        animationDuration={100}
                        fillOpacity={CHART_OPACITY.HIGHLIGHT_FILL}
                        strokeOpacity={CHART_OPACITY.HIGHLIGHT_STROKE}
                        yAxisId="left"
                      />
                    )}
                  </>
                )}

                {metric === 'query_latency' && (
                  <>
                    {visibleMetrics.p99_9 && (
                      <Area
                        type="monotone"
                        dataKey="p99_9"
                        fill={`url(#gradient-p99_9)`}
                        stroke={config.p99_9.color}
                        strokeOpacity={
                          selectedQuery && visibleMetrics.query_latency
                            ? CHART_OPACITY.STROKE_SELECTED
                            : CHART_OPACITY.STROKE_NORMAL
                        }
                        strokeWidth={1}
                        dot={false}
                        animationDuration={100}
                        yAxisId="left"
                      />
                    )}
                    {visibleMetrics.p99 && (
                      <Area
                        type="monotone"
                        dataKey="p99"
                        fill={`url(#gradient-p99)`}
                        stroke={config.p99.color}
                        strokeOpacity={
                          selectedQuery && visibleMetrics.query_latency
                            ? CHART_OPACITY.STROKE_SELECTED
                            : CHART_OPACITY.STROKE_NORMAL
                        }
                        strokeWidth={1}
                        dot={false}
                        animationDuration={100}
                        yAxisId="left"
                      />
                    )}
                    {visibleMetrics.p95 && (
                      <Area
                        type="monotone"
                        dataKey="p95"
                        fill={`url(#gradient-p95)`}
                        stroke={config.p95.color}
                        strokeOpacity={
                          selectedQuery && visibleMetrics.query_latency
                            ? CHART_OPACITY.STROKE_SELECTED
                            : CHART_OPACITY.STROKE_NORMAL
                        }
                        strokeWidth={1}
                        dot={false}
                        animationDuration={100}
                        yAxisId="left"
                      />
                    )}
                    {visibleMetrics.p50 && (
                      <Area
                        type="monotone"
                        dataKey="p50"
                        fill={`url(#gradient-p50)`}
                        stroke={config.p50.color}
                        strokeOpacity={
                          selectedQuery && visibleMetrics.query_latency
                            ? CHART_OPACITY.STROKE_SELECTED
                            : CHART_OPACITY.STROKE_NORMAL
                        }
                        strokeWidth={1}
                        dot={false}
                        animationDuration={100}
                        yAxisId="left"
                      />
                    )}
                    {selectedQuery && visibleMetrics.query_latency && (
                      <Area
                        type="monotone"
                        dataKey="query_latency"
                        fill={`url(#gradient-query_latency)`}
                        stroke={config.query_latency.color}
                        strokeOpacity={CHART_OPACITY.HIGHLIGHT_STROKE}
                        strokeWidth={2.5}
                        dot={false}
                        animationDuration={100}
                        yAxisId="left"
                      />
                    )}
                  </>
                )}

                {metric === 'cache_hits' && (
                  <>
                    {visibleMetrics.cache_hit_ratio && (
                      <Area
                        type="monotone"
                        dataKey="cache_hit_ratio"
                        fill={`url(#gradient-cache_hit_ratio)`}
                        stroke={config.cache_hit_ratio.color}
                        strokeWidth={2}
                        dot={false}
                        animationDuration={100}
                        fillOpacity={CHART_OPACITY.FILL_NORMAL}
                        strokeOpacity={CHART_OPACITY.STROKE_NORMAL}
                        name="Cache Hit Ratio"
                        yAxisId="left"
                      />
                    )}
                    {visibleMetrics.cache_miss_ratio && (
                      <Area
                        type="monotone"
                        dataKey="cache_miss_ratio"
                        fill={`url(#gradient-cache_miss_ratio)`}
                        stroke={config.cache_miss_ratio.color}
                        strokeWidth={2}
                        dot={false}
                        animationDuration={100}
                        fillOpacity={CHART_OPACITY.FILL_NORMAL}
                        strokeOpacity={CHART_OPACITY.STROKE_NORMAL}
                        name="Cache Miss Ratio"
                        yAxisId="left"
                      />
                    )}
                  </>
                )}
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </div>
    )
  }

  // For calls and other metrics, use the bar chart
  if (metric === 'calls') {
    const { chartData, config } = chartConfig as ChartConfigResult<any>

    // Calculate total calls for display
    const totalCalls = chartData.reduce((sum, point) => sum + (point.calls ?? 0), 0)
    const totalQueryCalls = selectedQuery
      ? chartData.reduce((sum, point) => sum + (point.query_calls ?? 0), 0)
      : 0

    return (
      <div className="h-[320px] flex flex-col">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex gap-2 px-5 mb-4">
            <AnimatePresence>
              <motion.button
                key="calls"
                initial={{ opacity: 0, scale: 0.95, x: -8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -8 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'text-xs px-2 py-1 rounded-full transition-colors inline-flex items-center gap-1.5 border',
                  visibleMetrics.calls
                    ? 'bg-surface-300'
                    : 'hover:bg-surface-100 border-transparent'
                )}
                onClick={() =>
                  setVisibleMetrics((prev) => ({
                    ...prev,
                    calls: !prev.calls,
                  }))
                }
              >
                <div
                  className={cn('w-2 h-2 rounded-full', !visibleMetrics.calls && 'opacity-50')}
                  style={{ backgroundColor: config.calls.color }}
                />
                <span>Total Calls: {formatMetricValue(totalCalls)}</span>
              </motion.button>

              {selectedQuery && (
                <motion.button
                  key="query_calls"
                  initial={{ opacity: 0, scale: 0.95, x: -8 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    'text-xs px-2 py-1 rounded-full transition-colors inline-flex items-center gap-1.5 border',
                    visibleMetrics.query_calls
                      ? 'bg-surface-300'
                      : 'hover:bg-surface-100 border-transparent'
                  )}
                  onClick={() =>
                    setVisibleMetrics((prev) => ({
                      ...prev,
                      query_calls: !prev.query_calls,
                    }))
                  }
                >
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      !visibleMetrics.query_calls && 'opacity-50'
                    )}
                    style={{ backgroundColor: config.query_calls.color }}
                  />
                  <span>Query Calls: {formatMetricValue(totalQueryCalls)}</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <div className="flex-1 min-h-0">
            <ChartContainer className="h-full w-full" config={config}>
              <AreaChart
                data={chartData}
                style={{ width: '100%', height: '100%' }}
                margin={{ right: 16 }}
              >
                <defs>
                  <linearGradient id="gradient-calls" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={config.calls.color}
                      stopOpacity={CHART_OPACITY.GRADIENT_START}
                    />
                    <stop
                      offset="95%"
                      stopColor={config.calls.color}
                      stopOpacity={CHART_OPACITY.GRADIENT_END}
                    />
                  </linearGradient>
                  {selectedQuery && (
                    <linearGradient id="gradient-query_calls" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={config.query_calls.color}
                        stopOpacity={CHART_OPACITY.GRADIENT_START}
                      />
                      <stop
                        offset="95%"
                        stopColor={config.query_calls.color}
                        stopOpacity={CHART_OPACITY.GRADIENT_END}
                      />
                    </linearGradient>
                  )}
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
                  tickFormatter={formatMetricValue}
                  domain={[0, 'auto']}
                  allowDataOverflow={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" hideLabel />}
                />
                <ChartLegend content={<ChartLegendContent />} />

                {visibleMetrics.calls && (
                  <Area
                    type="monotone"
                    dataKey="calls"
                    fill="url(#gradient-calls)"
                    stroke={config.calls.color}
                    strokeWidth={1.5}
                    dot={false}
                    animationDuration={100}
                    fillOpacity={
                      selectedQuery ? CHART_OPACITY.FILL_SELECTED : CHART_OPACITY.FILL_NORMAL
                    }
                    strokeOpacity={
                      selectedQuery ? CHART_OPACITY.STROKE_SELECTED : CHART_OPACITY.STROKE_NORMAL
                    }
                  />
                )}

                {selectedQuery && visibleMetrics.query_calls && (
                  <Area
                    type="monotone"
                    dataKey="query_calls"
                    fill="url(#gradient-query_calls)"
                    stroke={config.query_calls.color}
                    strokeWidth={2}
                    dot={false}
                    animationDuration={100}
                    fillOpacity={CHART_OPACITY.HIGHLIGHT_FILL}
                    strokeOpacity={CHART_OPACITY.HIGHLIGHT_STROKE}
                  />
                )}
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </div>
    )
  }

  // For other metrics, use the bar chart
  const { chartData } = chartConfig as { chartData: GenericChartData[] }

  return (
    <div className="h-[320px] flex flex-col">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex gap-2 px-5 mb-4">
          <AnimatePresence>
            <motion.button
              key="generic-metric"
              initial={{ opacity: 0, scale: 0.95, x: -8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -8 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'text-xs px-2 py-1 rounded-full transition-colors inline-flex items-center gap-1.5 border',
                'bg-surface-300'
              )}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'hsl(var(--chart-1))' }}
              />
              <span>{metric}</span>
            </motion.button>
          </AnimatePresence>
        </div>
        <div className="flex-1 min-h-0">
          <ChartContainer
            className="h-full w-full"
            config={{
              ok_count: {
                label: 'Value',
                color: 'hsl(var(--chart-1))',
              },
            }}
          >
            <AreaChart
              data={chartData}
              style={{ width: '100%', height: '100%' }}
              margin={{ right: 16 }}
            >
              <defs>
                <linearGradient id="gradient-generic" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--chart-1))"
                    stopOpacity={CHART_OPACITY.GRADIENT_START}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--chart-1))"
                    stopOpacity={CHART_OPACITY.GRADIENT_END}
                  />
                </linearGradient>
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
                tickFormatter={formatMetricValue}
                domain={[0, 'auto']}
                allowDataOverflow={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" hideLabel />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="ok_count"
                fill="url(#gradient-generic)"
                stroke="hsl(var(--chart-1))"
                strokeWidth={1.5}
                dot={false}
                animationDuration={100}
                fillOpacity={CHART_OPACITY.FILL_NORMAL}
                strokeOpacity={CHART_OPACITY.STROKE_NORMAL}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  )
}
