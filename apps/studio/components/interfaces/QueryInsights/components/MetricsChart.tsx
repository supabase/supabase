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
import { useSingleQueryLatency } from 'data/query-insights/single-query-latency-query'
import { useSingleQueryRows } from 'data/query-insights/single-query-latency-query'
import { motion, AnimatePresence } from 'framer-motion'
import { formatLatency, formatMetricValue } from '../QueryInsights.utils'
import {
  getRowsReadConfig,
  getQueryLatencyConfig,
  getGenericMetricConfig,
  ChartConfigType,
  RowsReadChartData,
  QueryLatencyChartData,
  GenericChartData,
  ChartConfigResult,
  getCacheHitsConfig,
} from '../chartConfigs'

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
      case 'rows_written':
      case 'queries_per_second':
        return getGenericMetricConfig(data)
      default:
        return null
    }
  }, [data, metric, queryLatencyData, queryRowsData])

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
                      <stop offset="5%" stopColor={(value as any).color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={(value as any).color} stopOpacity={0.05} />
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
                {metric === 'cache_hits' && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={formatMetricValue}
                    domain={['auto', 'auto']}
                    allowDataOverflow={false}
                    width={50}
                  />
                )}
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
                        fillOpacity={selectedQuery ? 0.1 : 0.3}
                        strokeOpacity={selectedQuery ? 0.3 : 1}
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
                        yAxisId="left"
                      />
                    )}
                  </>
                )}

                {metric === 'query_latency' && (
                  <>
                    {visibleMetrics.p50 && (
                      <Area
                        type="monotone"
                        dataKey="p50"
                        fill={config.p50.color}
                        fillOpacity={selectedQuery && visibleMetrics.query_latency ? 0.05 : 0.4}
                        stroke={config.p50.color}
                        strokeOpacity={selectedQuery && visibleMetrics.query_latency ? 0.1 : 0.8}
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
                        fill={config.p95.color}
                        fillOpacity={selectedQuery && visibleMetrics.query_latency ? 0.05 : 0.4}
                        stroke={config.p95.color}
                        strokeOpacity={selectedQuery && visibleMetrics.query_latency ? 0.1 : 0.8}
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
                        fill={config.p99.color}
                        fillOpacity={selectedQuery && visibleMetrics.query_latency ? 0.05 : 0.4}
                        stroke={config.p99.color}
                        strokeOpacity={selectedQuery && visibleMetrics.query_latency ? 0.1 : 0.8}
                        strokeWidth={1}
                        dot={false}
                        animationDuration={100}
                        yAxisId="left"
                      />
                    )}
                    {visibleMetrics.p99_9 && (
                      <Area
                        type="monotone"
                        dataKey="p99_9"
                        fill={config.p99_9.color}
                        fillOpacity={selectedQuery && visibleMetrics.query_latency ? 0.05 : 0.4}
                        stroke={config.p99_9.color}
                        strokeOpacity={selectedQuery && visibleMetrics.query_latency ? 0.1 : 0.8}
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
                        fill={config.query_latency.color}
                        fillOpacity={0.6}
                        stroke={config.query_latency.color}
                        strokeOpacity={1}
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
                        fillOpacity={0.3}
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
                        fillOpacity={0.3}
                        name="Cache Miss Ratio"
                        yAxisId="left"
                      />
                    )}
                    {visibleMetrics.shared_blks_dirtied && (
                      <Line
                        type="monotone"
                        dataKey="shared_blks_dirtied"
                        stroke={config.shared_blks_dirtied.color}
                        strokeWidth={1.5}
                        dot={false}
                        animationDuration={100}
                        name="Blocks Modified"
                        yAxisId="right"
                      />
                    )}
                    {visibleMetrics.shared_blks_written && (
                      <Line
                        type="monotone"
                        dataKey="shared_blks_written"
                        stroke={config.shared_blks_written.color}
                        strokeWidth={1.5}
                        dot={false}
                        animationDuration={100}
                        name="Blocks Written"
                        yAxisId="right"
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

  // For other metrics, use the bar chart
  const { chartData } = chartConfig as { chartData: GenericChartData[] }

  return (
    <div className="h-[320px]">
      <motion.div
        className="h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <LogsBarChart
          data={chartData}
          DateTimeFormat="HH:mm"
          EmptyState={
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-foreground-light">No data available</div>
            </div>
          }
        />
      </motion.div>
    </div>
  )
}
