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
import { useState } from 'react'
import { useParams } from 'common'
import { Button } from 'ui'
import { MetricType } from '../QueryInsights'
import { useSingleQueryLatency } from 'data/query-insights/single-query-latency-query'
import { motion, AnimatePresence } from 'framer-motion'

interface MetricsChartProps {
  data: QueryInsightsMetric[]
  metric: MetricType
  isLoading: boolean
  startTime: string
  endTime: string
  selectedQuery?: QueryInsightsQuery | null
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
  const [visibleMetrics, setVisibleMetrics] = useState({
    p50: true,
    p95: true,
    p99: true,
    p99_9: true,
    query_latency: true,
  })

  // Fetch single query latency data if a query is selected
  const {
    data: queryLatencyData,
    isLoading: isLoadingQueryLatency,
    error: queryLatencyError,
  } = useSingleQueryLatency(ref, selectedQuery?.query_id, startTime, endTime, {
    enabled: !!selectedQuery,
  })

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

  if (!Array.isArray(data) || data.length === 0) {
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

  if (metric === 'query_latency') {
    // Create the baseline chart data from the metrics
    const chartData = data.map((point) => {
      const timestamp = dayjs(point.timestamp).format('HH:mm')
      return {
        timestamp,
        p50: point.p50,
        p95: point.p95,
        p99: point.p99,
        p99_9: point.p99_9,
        // Initialize query latency as 0 instead of null
        query_latency: 0,
      }
    })

    // Sort chart data by timestamp
    chartData.sort((a, b) => {
      return dayjs(a.timestamp, 'HH:mm').diff(dayjs(b.timestamp, 'HH:mm'))
    })

    // If we have query latency data, add it to the chart
    if (selectedQuery && queryLatencyData && queryLatencyData.length > 0) {
      // Create a map of timestamps to query latency values
      const queryLatencyMap = new Map<string, number>()
      queryLatencyData.forEach((point) => {
        const timestamp = dayjs(point.timestamp).format('HH:mm')
        queryLatencyMap.set(timestamp, point.value || 0)
      })

      // Add query latency data to each chart data point
      // Points without data will keep their 0 value
      chartData.forEach((point) => {
        if (queryLatencyMap.has(point.timestamp)) {
          point.query_latency = queryLatencyMap.get(point.timestamp)!
        }
      })
    }

    const config = {
      p50: {
        label: 'p50',
        color: 'hsl(var(--brand-default))',
      },
      p95: {
        label: 'p95',
        color: 'hsl(var(--foreground-default))',
      },
      p99: {
        label: 'p99',
        color: 'hsl(var(--warning-default))',
      },
      p99_9: {
        label: 'p99.9',
        color: 'hsl(var(--destructive-default))',
      },
      query_latency: {
        label: 'Query Latency',
        color: 'hsl(var(--foreground-default))',
      },
    } satisfies ChartConfig

    return (
      <div className="h-[320px] flex flex-col">
        <AnimatePresence>
          {/* {selectedQuery && (
            <motion.div
              className="px-5 mb-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.1 }}
            >
              <div className="text-sm bg-surface-100 rounded p-2 border">
                <strong>Selected Query:</strong>{' '}
                <span className="text-xs font-mono truncate">
                  {selectedQuery.query.substring(0, 80)}...
                </span>
                <div className="flex gap-4 mt-1 text-xs">
                  <span>
                    Mean Time: <strong>{Math.round(selectedQuery.mean_exec_time)} ms</strong>
                  </span>
                  <span>
                    Total Calls: <strong>{selectedQuery.calls.toLocaleString()}</strong>
                  </span>
                  {isLoadingQueryLatency && <span>Loading query latency data...</span>}
                  {Boolean(queryLatencyError) && (
                    <span className="text-red-500">Error loading query latency</span>
                  )}
                </div>
              </div>
            </motion.div>
          )} */}
        </AnimatePresence>
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex gap-2 px-5 mb-4">
            <AnimatePresence>
              {Object.entries(config).map(([key, value]) => {
                // Only show query latency button if we have a selected query
                if (key === 'query_latency' && !selectedQuery) {
                  return null
                }

                const metricValue = Number(
                  chartData[chartData.length - 1]?.[key as keyof (typeof chartData)[0]]
                )
                const formattedValue = !isNaN(metricValue)
                  ? `${Math.round(metricValue)} ms`
                  : '0 ms'

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
                      style={{ backgroundColor: value.color }}
                    />
                    <span>
                      {value.label}: {formattedValue}
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
                      <stop offset="5%" stopColor={value.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={value.color} stopOpacity={0.05} />
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
                />
                <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" hideLabel />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                {visibleMetrics.p50 && (
                  <Area
                    type="monotone"
                    dataKey="p50"
                    fill={config.p50.color}
                    fillOpacity={selectedQuery && visibleMetrics.query_latency ? 0.05 : 0.4}
                    stroke={config.p50.color}
                    strokeOpacity={selectedQuery && visibleMetrics.query_latency ? 0.1 : 0.8}
                    strokeWidth={2}
                    dot={false}
                    animationDuration={100}
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
                    strokeWidth={2}
                    dot={false}
                    animationDuration={100}
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
                    strokeWidth={2}
                    dot={false}
                    animationDuration={100}
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
                    strokeWidth={2}
                    dot={false}
                    animationDuration={100}
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
  const chartData = data.map((point) => ({
    timestamp: dayjs(point.timestamp).toISOString(),
    ok_count: point.value ?? 0,
    warning_count: 0,
    error_count: 0,
  }))

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
