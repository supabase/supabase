import { useState, useMemo, useEffect } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

import { Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'
import {
  QUERY_PERFORMANCE_CHART_TABS,
  QUERY_PERFORMANCE_TIME_RANGES,
  getPgStatMonitorLogsQuery,
} from './QueryPerformanceChart.constants'
import { transformLogsToJSON } from './QueryPerformanceChart.utils'
import useLogsQuery from 'hooks/analytics/useLogsQuery'
import { useParams } from 'common'
import { Loader2 } from 'lucide-react'
import { ComposedChart } from 'components/ui/Charts/ComposedChart'
import type { MultiAttribute } from 'components/ui/Charts/ComposedChart.utils'

dayjs.extend(utc)

interface QueryPerformanceChartProps {
  dateRange?: {
    period_start: { date: string; time_period: string }
    period_end: { date: string; time_period: string }
    interval: string
  }
  onDateRangeChange?: (from: string, to: string) => void
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

export const QueryPerformanceChart = ({
  dateRange,
  onDateRangeChange,
}: QueryPerformanceChartProps) => {
  const [selectedMetric, setSelectedMetric] = useState('query_latency')

  const { ref: projectRef } = useParams() as { ref: string }

  const effectiveDateRange = useMemo(() => {
    if (dateRange) {
      return {
        iso_timestamp_start: dateRange.period_start.date,
        iso_timestamp_end: dateRange.period_end.date,
      }
    }
    // Fallback to default 24 hours
    const end = dayjs.utc()
    const start = end.subtract(24, 'hours')
    return {
      iso_timestamp_start: start.toISOString(),
      iso_timestamp_end: end.toISOString(),
    }
  }, [dateRange])

  const queryWithTimeRange = useMemo(() => {
    return getPgStatMonitorLogsQuery(
      effectiveDateRange.iso_timestamp_start,
      effectiveDateRange.iso_timestamp_end
    )
  }, [effectiveDateRange])

  const pgStatMonitorLogs = useLogsQuery(projectRef, {
    sql: queryWithTimeRange,
    iso_timestamp_start: effectiveDateRange.iso_timestamp_start,
    iso_timestamp_end: effectiveDateRange.iso_timestamp_end,
  })

  const { logData, isLoading, error } = pgStatMonitorLogs

  const parsedLogs = useMemo(() => {
    if (!logData || logData.length === 0) return []

    const validParsedLogs = logData
      .map((log) => ({
        ...log,
        parsedEventMessage: transformLogsToJSON(log.event_message),
      }))
      .filter((log) => log.parsedEventMessage !== null)

    console.log(`Successfully parsed: ${validParsedLogs.length}/${logData.length}`)

    return validParsedLogs.map((log) => log.parsedEventMessage)
  }, [logData])

  const chartData = useMemo(() => {
    if (!parsedLogs || parsedLogs.length === 0) return []

    if (parsedLogs.length > 0) {
      console.log('Sample parsed log for debugging:', parsedLogs[0])
      console.log('Available timestamp fields:', {
        bucket: parsedLogs[0].bucket,
        timestamp: parsedLogs[0].timestamp,
        bucket_start_time: parsedLogs[0].bucket_start_time,
      })
    }

    return parsedLogs
      .map((log: any) => {
        const possibleTimestamps = [log.bucket_start_time, log.bucket, log.timestamp, log.ts]

        let periodStart: number | null = null

        for (const ts of possibleTimestamps) {
          if (ts) {
            const date = new Date(ts)
            const time = date.getTime()
            if (!isNaN(time) && time > 0 && time > 946684800000) {
              periodStart = time
              break
            }
          }
        }

        if (!periodStart) {
          return null
        }

        return {
          period_start: periodStart,
          timestamp: possibleTimestamps.find((t) => t) || '',
          query_latency:
            parseFloat(log.mean_time || log.mean_exec_time || log.mean_query_time) || 0,
          mean_time: parseFloat(log.mean_time || log.mean_exec_time || log.mean_query_time) || 0,
          min_time: parseFloat(log.min_time || log.min_exec_time || log.min_query_time) || 0,
          max_time: parseFloat(log.max_time || log.max_exec_time || log.max_query_time) || 0,
          stddev_time:
            parseFloat(log.stddev_time || log.stddev_exec_time || log.stddev_query_time) || 0,
          rows_read: parseInt(log.rows) || 0,
          calls: parseInt(log.calls) || 0,
          cache_hits: parseFloat(log.shared_blks_hit) || 0,
          cache_misses: parseFloat(log.shared_blks_read) || 0,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.period_start - b.period_start)
  }, [parsedLogs])

  const currentMetrics = useMemo(() => {
    if (!chartData || chartData.length === 0) return []

    switch (selectedMetric) {
      case 'query_latency': {
        const sortedTimes = chartData.map((d) => d.mean_time).sort((a, b) => a - b)
        const p95Index = Math.floor(sortedTimes.length * 0.95)
        const averageP95 = sortedTimes[p95Index] || 0

        return [
          {
            label: 'Average p95',
            value: `${averageP95.toFixed(2)}ms`,
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
        const missRate = total > 0 ? (totalMisses / total) * 100 : 0

        return [
          {
            label: 'Cache Hit Rate',
            value: `${hitRate.toFixed(2)}%`,
          },
          {
            label: 'Cache Miss Rate',
            value: `${missRate.toFixed(2)}%`,
          },
        ]
      }
      default:
        return []
    }
  }, [chartData, selectedMetric])

  const getChartAttributes = useMemo((): MultiAttribute[] => {
    const attributeMap: Record<string, MultiAttribute[]> = {
      query_latency: [
        {
          attribute: 'mean_time',
          label: 'Mean',
          provider: 'logs',
          type: 'line',
          color: { light: '#3ECF8E', dark: '#3ECF8E' },
        },
        {
          attribute: 'min_time',
          label: 'Min',
          provider: 'logs',
          type: 'line',
          color: { light: '#65BCD9', dark: '#65BCD9' },
        },
        {
          attribute: 'max_time',
          label: 'Max',
          provider: 'logs',
          type: 'line',
          color: { light: '#DA760B', dark: '#DA760B' },
        },
        {
          attribute: 'stddev_time',
          label: 'Std Dev',
          provider: 'logs',
          type: 'line',
          color: { light: '#DB8DF9', dark: '#DB8DF9' },
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
          label: 'Number of Calls',
          provider: 'logs',
        },
      ],
      cache_hits: [
        {
          attribute: 'cache_hits',
          label: 'Cache Hits',
          provider: 'logs',
        },
      ],
    }

    return attributeMap[selectedMetric] || []
  }, [selectedMetric])

  const updateDateRange = (from: string, to: string) => {
    console.log('Date range update:', from, to)
    onDateRangeChange?.(from, to)
  }

  useEffect(() => {
    if (parsedLogs.length > 0) {
      console.log('Parsed logs updated:', parsedLogs)
      console.log('Chart data:', chartData)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedLogs.length])

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
                  data={chartData}
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
                    tickFormatter: (value) => value.toLocaleString(),
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
