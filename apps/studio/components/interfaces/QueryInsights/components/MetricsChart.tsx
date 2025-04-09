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
import { useSingleQueryRows } from 'data/query-insights/single-query-latency-query'
import { motion, AnimatePresence } from 'framer-motion'
import { formatLatency, formatMetricValue } from '../QueryInsights.utils'

interface MetricsChartProps {
  data: QueryInsightsMetric[]
  metric: MetricType
  isLoading: boolean
  startTime: string
  endTime: string
  selectedQuery: QueryInsightsQuery | null
}

interface ChartConfigType {
  [key: string]: {
    label: string
    color: string
    formatter: (value: number) => string
  }
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
  }>({
    p50: true,
    p95: true,
    p99: true,
    p99_9: true,
    query_latency: true,
    rows: true,
    query_rows: true,
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

  if (metric === 'rows_read') {
    // Create the baseline chart data from the metrics
    const chartData = data.map((point) => ({
      timestamp: point.timestamp,
      rows: Number(point.value) ?? 0,
      query_rows: 0,
    }))

    // Sort chart data by timestamp
    chartData.sort((a, b) => dayjs(a.timestamp).diff(dayjs(b.timestamp)))

    // If we have query rows data, add it to the chart
    if (selectedQuery && queryRowsData && queryRowsData.length > 0) {
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

    return (
      <div className="h-[320px] flex flex-col">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex gap-2 px-5 mb-4">
            <AnimatePresence>
              {Object.entries(config).map(([key, value]) => {
                // Only show query rows button if we have a selected query
                if (key === 'query_rows' && !selectedQuery) {
                  return null
                }

                const metricValue = Number(
                  chartData[chartData.length - 1]?.[key as keyof (typeof chartData)[0]]
                )
                const formattedValue = !isNaN(metricValue) ? value.formatter(metricValue) : '0'

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
                  tickFormatter={(value) => dayjs(value).format('HH:mm')}
                />
                <YAxis
                  tickFormatter={formatMetricValue}
                  domain={['dataMin', 'dataMax']}
                  allowDataOverflow={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" hideLabel />}
                />
                <ChartLegend content={<ChartLegendContent />} />
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
                  />
                )}
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </div>
    )
  }

  if (metric === 'query_latency') {
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
        // Initialize query latency as 0 instead of null
        query_latency: 0,
      }
    })

    // Sort chart data by timestamp
    chartData.sort((a, b) => {
      return dayjs(a.timestamp).diff(dayjs(b.timestamp))
    })

    // If we have query latency data, add it to the chart
    if (selectedQuery && queryLatencyData && queryLatencyData.length > 0) {
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

    const config = {
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
    } satisfies ChartConfigType

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
                  tickFormatter={(value) => dayjs(value).format('HH:mm')}
                />
                <YAxis
                  tickFormatter={formatMetricValue}
                  width={80}
                  tickCount={5}
                  scale="linear"
                  domain={['auto', 'auto']}
                />
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
                    strokeWidth={1}
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
                    strokeWidth={1}
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
                    strokeWidth={1}
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
                    strokeWidth={1}
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

  const toggleButtons = () => {
    switch (metric as MetricType) {
      case 'query_latency':
        return (
          <>
            <Button
              type="text"
              className={cn(
                'flex items-center gap-2 px-3',
                visibleMetrics.p50 ? 'opacity-100' : 'opacity-50'
              )}
              onClick={() => setVisibleMetrics((prev) => ({ ...prev, p50: !prev.p50 }))}
            >
              <div className="h-2 w-2 rounded-full bg-[#4B5563]" />
              <span className="text-xs">p50: {formatLatency(data[data.length - 1]?.p50 ?? 0)}</span>
            </Button>
            <Button
              type="text"
              className={cn(
                'flex items-center gap-2 px-3',
                visibleMetrics.p95 ? 'opacity-100' : 'opacity-50'
              )}
              onClick={() => setVisibleMetrics((prev) => ({ ...prev, p95: !prev.p95 }))}
            >
              <div className="h-2 w-2 rounded-full bg-[#6B7280]" />
              <span className="text-xs">p95: {formatLatency(data[data.length - 1]?.p95 ?? 0)}</span>
            </Button>
            <Button
              type="text"
              className={cn(
                'flex items-center gap-2 px-3',
                visibleMetrics.p99 ? 'opacity-100' : 'opacity-50'
              )}
              onClick={() => setVisibleMetrics((prev) => ({ ...prev, p99: !prev.p99 }))}
            >
              <div className="h-2 w-2 rounded-full bg-[#9CA3AF]" />
              <span className="text-xs">p99: {formatLatency(data[data.length - 1]?.p99 ?? 0)}</span>
            </Button>
            <Button
              type="text"
              className={cn(
                'flex items-center gap-2 px-3',
                visibleMetrics.p99_9 ? 'opacity-100' : 'opacity-50'
              )}
              onClick={() => setVisibleMetrics((prev) => ({ ...prev, p99_9: !prev.p99_9 }))}
            >
              <div className="h-2 w-2 rounded-full bg-[#D1D5DB]" />
              <span className="text-xs">
                p99.9: {formatLatency(data[data.length - 1]?.p99_9 ?? 0)}
              </span>
            </Button>
            {selectedQuery && (
              <Button
                type="text"
                className={cn(
                  'flex items-center gap-2 px-3',
                  visibleMetrics.query_latency ? 'opacity-100' : 'opacity-50'
                )}
                onClick={() =>
                  setVisibleMetrics((prev) => ({ ...prev, query_latency: !prev.query_latency }))
                }
              >
                <div className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                <span className="text-xs">
                  Query latency:{' '}
                  {formatLatency(queryLatencyData?.[queryLatencyData.length - 1]?.value ?? 0)}
                </span>
              </Button>
            )}
          </>
        )

      case 'rows_read':
        return (
          <>
            <Button
              type="text"
              className={cn(
                'flex items-center gap-2 px-3',
                visibleMetrics.rows ? 'opacity-100' : 'opacity-50'
              )}
              onClick={() => setVisibleMetrics((prev) => ({ ...prev, rows: !prev.rows }))}
            >
              <div className="h-2 w-2 rounded-full bg-[#10B981]" />
              <span className="text-xs">
                Rows: {formatMetricValue(data[data.length - 1]?.value ?? 0)}
              </span>
            </Button>
            {selectedQuery && (
              <Button
                type="text"
                className={cn(
                  'flex items-center gap-2 px-3',
                  visibleMetrics.query_rows ? 'opacity-100' : 'opacity-50'
                )}
                onClick={() =>
                  setVisibleMetrics((prev) => ({ ...prev, query_rows: !prev.query_rows }))
                }
              >
                <div className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                <span className="text-xs">
                  Query rows:{' '}
                  {formatMetricValue(queryRowsData?.[queryRowsData.length - 1]?.value ?? 0)}
                </span>
              </Button>
            )}
          </>
        )

      case 'rows_written':
      case 'queries_per_second':
        return (
          <Button
            type="text"
            className={cn(
              'flex items-center gap-2 px-3',
              visibleMetrics.rows ? 'opacity-100' : 'opacity-50'
            )}
            onClick={() => setVisibleMetrics((prev) => ({ ...prev, rows: !prev.rows }))}
          >
            <div className="h-2 w-2 rounded-full bg-[#10B981]" />
            <span className="text-xs">
              Value: {formatMetricValue(data[data.length - 1]?.value ?? 0)}
            </span>
          </Button>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 px-4">{toggleButtons()}</div>
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
    </div>
  )
}
