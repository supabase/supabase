import { useSingleQueryLatency, useSingleQueryRows, useSingleQueryCalls } from 'data/query-insights/single-query-latency-query'
import { QueryInsightsQuery } from 'data/query-insights/query-insights-query'
import { MetricType } from '../QueryInsights'
import { SparkLine } from './SparkLine'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { useRouter } from 'next/router'

interface SparkLineCellProps {
  query: QueryInsightsQuery
  metric: MetricType
  startTime: string
  endTime: string
}

export function SparkLineCell({ query, metric, startTime, endTime }: SparkLineCellProps) {
  const router = useRouter()

  // Get individual query data based on metric type
  const { data: queryData } = useSingleQueryLatency(
    router.query.ref as string,
    startTime,
    endTime,
    query.query_id.toString(),
    {
      enabled: metric === 'query_latency' && !!query.query_id,
    }
  )

  const { data: rowsData } = useSingleQueryRows(
    router.query.ref as string,
    startTime,
    endTime,
    query.query_id.toString(),
    {
      enabled: metric === 'rows_read' && !!query.query_id,
    }
  )

  const { data: callsData } = useSingleQueryCalls(
    router.query.ref as string,
    startTime,
    endTime,
    query.query_id.toString(),
    {
      enabled: metric === 'calls' && !!query.query_id,
    }
  )

  // Determine which data to show based on metric
  let sparkLineData: Array<{ timestamp: string; value: number }> = []
  let tooltipText = ''
  let sparkLineColor = 'hsl(var(--chart-1))'

  switch (metric) {
    case 'query_latency':
      sparkLineData = (queryData || []).map(item => ({
        timestamp: item.timestamp,
        value: item.value || 0
      }))
      tooltipText = 'Query latency trend over time'
      sparkLineColor = 'hsl(var(--chart-1))'
      break
    case 'rows_read':
      sparkLineData = (rowsData || []).map(item => ({
        timestamp: item.timestamp,
        value: item.value || 0
      }))
      tooltipText = 'Rows read trend over time'
      sparkLineColor = 'hsl(var(--chart-2))'
      break
    case 'calls':
      sparkLineData = (callsData || []).map(item => ({
        timestamp: item.timestamp,
        value: item.value || 0
      }))
      tooltipText = 'Calls trend over time'
      sparkLineColor = 'hsl(var(--chart-3))'
      break
    case 'cache_hits':
      // For cache hits, we don't have individual query data, so show empty
      sparkLineData = []
      tooltipText = 'Cache hits data not available per query'
      sparkLineColor = 'hsl(var(--chart-4))'
      break
    case 'issues':
      // For issues, we don't have individual query data, so show empty
      sparkLineData = []
      tooltipText = 'Issues data not available per query'
      sparkLineColor = 'hsl(var(--chart-5))'
      break
    default:
      sparkLineData = []
      tooltipText = 'No data available'
      sparkLineColor = 'hsl(var(--chart-1))'
  }

  return (
    <div className="flex items-center justify-center h-full w-full">
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <SparkLine 
              data={sparkLineData}
              color={sparkLineColor}
              height={20}
              width={60}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
} 