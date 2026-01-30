import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { ComposedChart } from 'components/ui/Charts/ComposedChart'
import type { MultiAttribute } from 'components/ui/Charts/ComposedChart.utils'

interface ChartDataPoint {
  period_start: number
  timestamp: string
  calls: number
}

interface SupamonitorChartProps {
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

const formatNumberValue = (value: number): string => {
  return value.toLocaleString()
}

export const SupamonitorChart = ({
  onDateRangeChange,
  chartData,
  isLoading,
  error,
  currentSelectedQuery,
  parsedLogs,
}: SupamonitorChartProps) => {
  const currentMetrics = useMemo(() => {
    if (!chartData || chartData.length === 0) return []

    const totalCalls = chartData.reduce((sum, d) => sum + d.calls, 0)

    return [
      {
        label: 'Total Calls',
        value: totalCalls.toLocaleString(),
      },
    ]
  }, [chartData])

  const querySpecificData = useMemo(() => {
    if (!currentSelectedQuery || !parsedLogs.length) return null

    const normalizedSelected = currentSelectedQuery.replace(/\s+/g, ' ').trim()
    const queryLogs = parsedLogs.filter((log) => {
      const normalized = (log.query || '').replace(/\s+/g, ' ').trim()
      return normalized === normalizedSelected
    })

    const queryDataMap = new Map<number, { calls: number }>()

    queryLogs.forEach((log) => {
      const timestamps = [log.bucket_start_time, log.bucket, log.timestamp, log.ts]
      const validTimestamp = timestamps.find((t) => t && !isNaN(new Date(t).getTime()))

      if (!validTimestamp) return

      const time = new Date(validTimestamp).getTime()
      const calls = log.calls ?? 0

      queryDataMap.set(time, {
        calls: parseFloat(String(calls)),
      })
    })

    return queryDataMap
  }, [currentSelectedQuery, parsedLogs])

  const mergedChartData = useMemo(() => {
    if (!querySpecificData || !currentSelectedQuery) {
      return chartData
    }

    return chartData.map((dataPoint) => {
      const queryData = querySpecificData.get(dataPoint.period_start)

      return {
        ...dataPoint,
        selected_query_calls: queryData?.calls !== undefined ? queryData.calls : null,
      }
    })
  }, [chartData, querySpecificData, currentSelectedQuery])

  const getChartAttributes = useMemo((): MultiAttribute[] => {
    const baseAttributes: MultiAttribute[] = [
      {
        attribute: 'calls',
        label: 'Calls',
        provider: 'logs',
      },
    ]

    if (currentSelectedQuery && querySpecificData) {
      return [
        ...baseAttributes,
        {
          attribute: 'selected_query_calls',
          label: 'Selected Query',
          provider: 'logs',
          type: 'line',
          color: { light: '#EC4899', dark: '#EC4899' },
          strokeWidth: 3,
        },
      ]
    }

    return baseAttributes
  }, [currentSelectedQuery, querySpecificData])

  const updateDateRange = (from: string, to: string) => {
    onDateRangeChange?.(from, to)
  }

  return (
    <div className="bg-surface-200 border-t">
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
              yAxisKey="calls"
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
                tickFormatter: formatNumberValue,
              }}
              xAxisIsDate={true}
              className="mt-2"
            />
          </div>
        )}
      </div>
    </div>
  )
}
