import { useState, useMemo } from 'react'
import { Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'
import { QUERY_PERFORMANCE_CHART_TABS } from './QueryPerformance.constants'
import { Loader2 } from 'lucide-react'
import { ComposedChart } from 'components/ui/Charts/ComposedChart'
import type { MultiAttribute } from 'components/ui/Charts/ComposedChart.utils'
import type { ChartDataPoint } from './QueryPerformance.types'

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
        const totalCalls = chartData.reduce((sum, d) => sum + d.calls, 0)
        const trueP95 =
          totalCalls > 0
            ? chartData.reduce((sum, d) => sum + d.p95_time * d.calls, 0) / totalCalls
            : 0

        return [
          {
            label: 'Average p95',
            value: `${Math.round(trueP95)}ms`,
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

  const transformedChartData = useMemo(() => {
    if (selectedMetric !== 'query_latency') return chartData

    const transformed = chartData.map((dataPoint) => ({
      ...dataPoint,
      p50_time: parseFloat((dataPoint.p50_time / 1000).toFixed(3)),
      p95_time: parseFloat((dataPoint.p95_time / 1000).toFixed(3)),
    }))

    return transformed
  }, [chartData, selectedMetric])

  const querySpecificData = useMemo(() => {
    if (!currentSelectedQuery || !parsedLogs.length) return null

    const normalizedSelected = currentSelectedQuery.replace(/\s+/g, ' ').trim()
    const queryLogs = parsedLogs.filter((log) => {
      const normalized = (log.query || '').replace(/\s+/g, ' ').trim()
      return normalized === normalizedSelected
    })

    const queryDataMap = new Map<
      number,
      {
        time: number
        rows_read: number
        calls: number
        cache_hits: number
      }
    >()

    queryLogs.forEach((log) => {
      const time = new Date(log.timestamp).getTime()
      const meanTime = log.mean_time ?? log.mean_exec_time ?? log.mean_query_time ?? 0
      const rowsRead = log.rows_read ?? log.rows ?? 0
      const calls = log.calls ?? 0
      const cacheHits = log.shared_blks_hit ?? log.cache_hits ?? 0

      queryDataMap.set(time, {
        time: parseFloat(String(meanTime)),
        rows_read: parseFloat(String(rowsRead)),
        calls: parseFloat(String(calls)),
        cache_hits: parseFloat(String(cacheHits)),
      })
    })

    return queryDataMap
  }, [currentSelectedQuery, parsedLogs])

  const mergedChartData = useMemo(() => {
    if (!querySpecificData || !currentSelectedQuery) {
      return transformedChartData
    }

    return transformedChartData.map((dataPoint) => {
      const queryData = querySpecificData.get(dataPoint.period_start)

      return {
        ...dataPoint,
        selected_query_time:
          queryData?.time !== undefined
            ? selectedMetric === 'query_latency'
              ? queryData.time / 1000
              : queryData.time
            : null,
        selected_query_rows_read: queryData?.rows_read !== undefined ? queryData.rows_read : null,
        selected_query_calls: queryData?.calls !== undefined ? queryData.calls : null,
        selected_query_cache_hits:
          queryData?.cache_hits !== undefined ? queryData.cache_hits : null,
      }
    })
  }, [transformedChartData, querySpecificData, currentSelectedQuery, selectedMetric])

  const getChartAttributes = useMemo((): MultiAttribute[] => {
    const attributeMap: Record<string, MultiAttribute[]> = {
      query_latency: [
        {
          attribute: 'p50_time',
          label: 'p50',
          provider: 'logs',
          type: 'line',
          color: { light: '#8B5CF6', dark: '#8B5CF6' },
        },
        {
          attribute: 'p95_time',
          label: 'p95',
          provider: 'logs',
          type: 'line',
          color: { light: '#65BCD9', dark: '#65BCD9' },
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
      ],
    }

    const baseAttributes = attributeMap[selectedMetric] || []

    if (currentSelectedQuery && querySpecificData) {
      const dimmedBaseAttributes = baseAttributes.map((attr) => ({
        ...attr,
        color: attr.color
          ? { light: attr.color.light + '4D', dark: attr.color.dark + '4D' }
          : attr.color,
      }))

      const selectedQueryAttributes: Record<string, MultiAttribute> = {
        query_latency: {
          attribute: 'selected_query_time',
          label: 'Selected Query',
          provider: 'logs',
          type: 'line',
          color: { light: '#10B981', dark: '#10B981' },
          strokeWidth: 3,
        },
        rows_read: {
          attribute: 'selected_query_rows_read',
          label: 'Selected Query',
          provider: 'logs',
          type: 'line',
          color: { light: '#F59E0B', dark: '#F59E0B' },
          strokeWidth: 3,
        },
        calls: {
          attribute: 'selected_query_calls',
          label: 'Selected Query',
          provider: 'logs',
          type: 'line',
          color: { light: '#EC4899', dark: '#EC4899' },
          strokeWidth: 3,
        },
        cache_hits: {
          attribute: 'selected_query_cache_hits',
          label: 'Selected Query',
          provider: 'logs',
          type: 'line',
          color: { light: '#8B5CF6', dark: '#8B5CF6' },
          strokeWidth: 3,
        },
      }

      const selectedQueryAttr = selectedQueryAttributes[selectedMetric]
      if (selectedQueryAttr) {
        return [...dimmedBaseAttributes, selectedQueryAttr]
      }
    }

    return baseAttributes
  }, [selectedMetric, currentSelectedQuery, querySpecificData])

  const updateDateRange = (from: string, to: string) => {
    onDateRangeChange?.(from, to)
  }

  const getYAxisFormatter = useMemo(() => {
    if (selectedMetric === 'query_latency') {
      return formatTimeValue
    }
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

        <TabsContent_Shadcn_ value={selectedMetric} className="bg-surface-200 mt-0 h-inherit">
          <div className="w-full flex items-center justify-center min-h-[282px]">
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
                  showLegend={true}
                  showTotal={false}
                  showMaxValue={false}
                  updateDateRange={updateDateRange}
                  YAxisProps={{
                    tick: true,
                    width: 60,
                    tickFormatter: getYAxisFormatter,
                  }}
                  xAxisIsDate={true}
                  className="mt-2"
                />
              </div>
            )}
          </div>
        </TabsContent_Shadcn_>
      </Tabs_Shadcn_>
    </div>
  )
}
