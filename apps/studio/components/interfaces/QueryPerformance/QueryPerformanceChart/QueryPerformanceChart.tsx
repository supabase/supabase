import { useState, useMemo } from 'react'
import { Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'
import { QUERY_PERFORMANCE_CHART_TABS } from './QueryPerformanceChart.constants'
import { Loader2 } from 'lucide-react'
import { ComposedChart } from 'components/ui/Charts/ComposedChart'
import type { MultiAttribute } from 'components/ui/Charts/ComposedChart.utils'
import type { ChartDataPoint } from '../QueryPerformanceData.utils'

interface QueryPerformanceChartProps {
  dateRange?: {
    period_start: { date: string; time_period: string }
    period_end: { date: string; time_period: string }
    interval: string
  }
  onDateRangeChange?: (from: string, to: string) => void
  chartData: ChartDataPoint[]
  isLoading: boolean
  error: any
  currentSelectedQuery: string | null
  parsedLogs: any[]
}

const QueryMetricBlock = ({
  label,
  value,
}: {
  label: string
  value: string | number | undefined
}) => {
  return (
    <div className="flex flex-col gap-0.5 text-xs">
      <span className="font-mono text-xs text-foreground-lighter uppercase">{label}</span>
      <span className="text-lg tabular-nums">{value}</span>
    </div>
  )
}

const formatTimeValue = (value: number): string => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}s`
  }
  return `${value.toFixed(1)}ms`
}

const formatNumberValue = (value: number): string => {
  return value.toLocaleString()
}

export const QueryPerformanceChart = ({
  // dateRange,
  onDateRangeChange,
  chartData,
  isLoading,
  error,
  currentSelectedQuery,
  parsedLogs,
}: QueryPerformanceChartProps) => {
  const [selectedMetric, setSelectedMetric] = useState('query_latency')

  const currentMetrics = useMemo(() => {
    if (!chartData || chartData.length === 0) return []

    switch (selectedMetric) {
      case 'query_latency': {
        const avgP95 = chartData.reduce((sum, d) => sum + d.p95_time, 0) / chartData.length

        return [
          {
            label: 'Average p95',
            value: avgP95 >= 100 ? `${(avgP95 / 1000).toFixed(2)}s` : `${Math.round(avgP95)}ms`,
          },
        ]
      }
      case 'rows_read': {
        const totalRowsRead = chartData.reduce((sum, d) => sum + d.rows_read, 0)

        return [
          {
            label: 'Total Rows Read',
            value: totalRowsRead.toLocaleString(),
          },
        ]
      }
      case 'calls': {
        const totalCalls = chartData.reduce((sum, d) => sum + d.calls, 0)

        return [
          {
            label: 'Total Calls',
            value: totalCalls.toLocaleString(),
          },
        ]
      }
      case 'cache_hits': {
        const totalHits = chartData.reduce((sum, d) => sum + d.cache_hits, 0)
        const totalMisses = chartData.reduce((sum, d) => sum + d.cache_misses, 0)
        const total = totalHits + totalMisses
        const hitRate = total > 0 ? (totalHits / total) * 100 : 0

        return [
          {
            label: 'Cache Hit Rate',
            value: `${hitRate.toFixed(2)}%`,
          },
        ]
      }
      default:
        return []
    }
  }, [chartData, selectedMetric])

  // Add this transformation for the chart data
  const transformedChartData = useMemo(() => {
    if (selectedMetric !== 'query_latency') return chartData

    console.log('🟢 Original chartData:', chartData)

    const transformed = chartData.map((dataPoint) => ({
      ...dataPoint,
      p50_time:
        dataPoint.p50_time >= 1000
          ? parseFloat((dataPoint.p50_time / 1000).toFixed(1))
          : parseFloat(dataPoint.p50_time.toFixed(1)),
      p75_time:
        dataPoint.p75_time >= 1000
          ? parseFloat((dataPoint.p75_time / 1000).toFixed(1))
          : parseFloat(dataPoint.p75_time.toFixed(1)),
      p90_time:
        dataPoint.p90_time >= 1000
          ? parseFloat((dataPoint.p90_time / 1000).toFixed(1))
          : parseFloat(dataPoint.p90_time.toFixed(1)),
      p95_time:
        dataPoint.p95_time >= 1000
          ? parseFloat((dataPoint.p95_time / 1000).toFixed(1))
          : parseFloat(dataPoint.p95_time.toFixed(1)),
      p99_time:
        dataPoint.p99_time >= 1000
          ? parseFloat((dataPoint.p99_time / 1000).toFixed(1))
          : parseFloat(dataPoint.p99_time.toFixed(1)),
      p99_9_time:
        dataPoint.p99_9_time >= 1000
          ? parseFloat((dataPoint.p99_9_time / 1000).toFixed(1))
          : parseFloat(dataPoint.p99_9_time.toFixed(1)),
    }))

    console.log('🟣 Transformed chartData:', transformed)
    return transformed
  }, [chartData, selectedMetric])

  const querySpecificData = useMemo(() => {
    if (!currentSelectedQuery || !parsedLogs.length) return null

    const normalizedSelected = currentSelectedQuery.replace(/\s+/g, ' ').trim()

    // Filter logs for the selected query
    const queryLogs = parsedLogs.filter((log) => {
      const normalized = (log.query || '').replace(/\s+/g, ' ').trim()
      return normalized === normalizedSelected
    })

    // Build a map of timestamp -> meanTime for the selected query
    const queryTimeMap = new Map<number, number>()

    queryLogs.forEach((log) => {
      const timestamps = [log.bucket_start_time, log.bucket, log.timestamp, log.ts]
      const validTimestamp = timestamps.find((t) => t && !isNaN(new Date(t).getTime()))

      if (!validTimestamp) return

      const time = new Date(validTimestamp).getTime()
      const meanTime = log.mean_time ?? log.mean_exec_time ?? log.mean_query_time ?? 0

      queryTimeMap.set(time, parseFloat(String(meanTime)))
    })

    return queryTimeMap
  }, [currentSelectedQuery, parsedLogs])

  // Merge selected query data with the aggregate chart data
  const mergedChartData = useMemo(() => {
    if (!querySpecificData || !currentSelectedQuery) {
      return transformedChartData
    }

    // Add the selected query values to each data point
    return transformedChartData.map((dataPoint) => {
      const queryValue = querySpecificData.get(dataPoint.period_start)

      return {
        ...dataPoint,
        selected_query_time: queryValue !== undefined ? queryValue : null,
      }
    })
  }, [transformedChartData, querySpecificData, currentSelectedQuery])

  // Update the chart attributes to show the correct units
  const getChartAttributes = useMemo((): MultiAttribute[] => {
    const attributeMap: Record<string, MultiAttribute[]> = {
      query_latency: [
        {
          attribute: 'p50_time',
          label: 'p50',
          provider: 'logs',
          type: 'line',
          color: { light: '#10B981', dark: '#10B981' },
        },
        {
          attribute: 'p75_time',
          label: 'p75',
          provider: 'logs',
          type: 'line',
          color: { light: '#3ECF8E', dark: '#3ECF8E' },
        },
        {
          attribute: 'p90_time',
          label: 'p90',
          provider: 'logs',
          type: 'line',
          color: { light: '#65BCD9', dark: '#65BCD9' },
        },
        {
          attribute: 'p95_time',
          label: 'p95',
          provider: 'logs',
          type: 'line',
          color: { light: '#F59E0B', dark: '#F59E0B' },
        },
        {
          attribute: 'p99_time',
          label: 'p99',
          provider: 'logs',
          type: 'line',
          color: { light: '#DA760B', dark: '#DA760B' },
        },
        {
          attribute: 'p99_9_time',
          label: 'p99.9',
          provider: 'logs',
          type: 'line',
          color: { light: '#8B5CF6', dark: '#8B5CF6' },
        },
      ],
      rows_read: [
        {
          attribute: 'rows_read',
          label: 'Rows Read',
          provider: 'logs',
        },
      ],
      calls: [
        {
          attribute: 'calls',
          label: 'Calls',
          provider: 'logs',
        },
      ],
      cache_hits: [
        {
          attribute: 'cache_hits',
          label: 'Cache Hits',
          provider: 'logs',
          type: 'line',
          color: { light: '#10B981', dark: '#10B981' },
        },
        {
          attribute: 'cache_misses',
          label: 'Cache Misses',
          provider: 'logs',
          type: 'line',
          color: { light: '#65BCD9', dark: '#65BCD9' },
        },
      ],
    }

    const baseAttributes = attributeMap[selectedMetric] || []

    // If a query is selected, add it as an additional line
    if (currentSelectedQuery && querySpecificData && selectedMetric === 'query_latency') {
      return [
        ...baseAttributes,
        {
          attribute: 'selected_query_time',
          label: 'Selected Query',
          provider: 'logs',
          type: 'line',
          color: { light: '#DC2626', dark: '#DC2626' },
          strokeWidth: 3, // Make it thicker to stand out
        },
      ]
    }

    return baseAttributes
  }, [selectedMetric, currentSelectedQuery, querySpecificData])

  const updateDateRange = (from: string, to: string) => {
    onDateRangeChange?.(from, to)
  }

  const getYAxisFormatter = useMemo(() => {
    // Only use time formatting for query latency metrics
    if (selectedMetric === 'query_latency') {
      return formatTimeValue
    }
    // For other metrics (rows_read, calls, cache_hits), use number formatting
    return formatNumberValue
  }, [selectedMetric])

  return (
    <div className="bg-surface-200 border-t">
      <Tabs_Shadcn_
        value={selectedMetric}
        onValueChange={(value) => setSelectedMetric(value as string)}
        className="w-full"
      >
        <TabsList_Shadcn_ className="flex justify-start rounded-none gap-x-4 border-b !mt-0 pt-0 px-6">
          {QUERY_PERFORMANCE_CHART_TABS.map((tab) => (
            <TabsTrigger_Shadcn_
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2 text-xs py-3 border-b-[1px] font-mono uppercase"
            >
              {tab.label}
            </TabsTrigger_Shadcn_>
          ))}
        </TabsList_Shadcn_>

        <TabsContent_Shadcn_ value={selectedMetric} className="bg-surface-100 mt-0 h-inherit">
          <div className="w-full flex items-center justify-center min-h-[320px]">
            {isLoading ? (
              <Loader2 size={20} className="animate-spin text-foreground-lighter" />
            ) : error ? (
              <p className="text-sm text-foreground-light text-center h-full flex items-center justify-center">
                Error loading chart data
              </p>
            ) : (
              <div className="w-full flex flex-col h-full px-6 py-4">
                <div className="flex gap-6 mb-4">
                  {currentMetrics.map((metric, index) => (
                    <QueryMetricBlock key={index} label={metric.label} value={metric.value} />
                  ))}
                </div>
                <ComposedChart
                  data={mergedChartData as any}
                  attributes={getChartAttributes}
                  yAxisKey={getChartAttributes[0]?.attribute || ''}
                  xAxisKey="period_start"
                  title=""
                  customDateFormat="MMM D, YYYY hh:mm A"
                  hideChartType={true}
                  hideHighlightArea={true}
                  showTooltip={true}
                  showGrid={true}
                  showLegend={
                    selectedMetric === 'query_latency' ||
                    selectedMetric === 'cache_hits' ||
                    selectedMetric === 'rows_read' ||
                    selectedMetric === 'calls'
                  }
                  showTotal={false}
                  showMaxValue={false}
                  updateDateRange={updateDateRange}
                  YAxisProps={{
                    tick: true,
                    width: 60,
                    tickFormatter: getYAxisFormatter,
                  }}
                  xAxisIsDate={true}
                  className="mt-6"
                />
              </div>
            )}
          </div>
        </TabsContent_Shadcn_>
      </Tabs_Shadcn_>
    </div>
  )
}
