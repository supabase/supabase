import dayjs, { Dayjs } from 'dayjs'
import maxBy from 'lodash/maxBy'
import meanBy from 'lodash/meanBy'
import sumBy from 'lodash/sumBy'
import type { ChartIntervals } from 'types'
import type { ChartConfig } from 'ui'

export type EdgeFunctionChartDatum = {
  timestamp: string | number
  success_count?: string | number
  redirect_count?: string | number
  client_err_count?: string | number
  server_err_count?: string | number
  avg_execution_time?: string | number
  max_execution_time?: string | number
  avg_cpu_time_used?: string | number
  max_cpu_time_used?: string | number
  avg_memory_used?: string | number
  avg_heap_memory_used?: string | number
  avg_external_memory_used?: string | number
}

export type InvocationChartDatum = {
  timestamp: string
  ok_count: number
  warning_count: number
  error_count: number
}

export type InvocationUpdateAnnotation = {
  timestamp: string
  position: number
  updatedAt: Dayjs
}

export const EDGE_FUNCTION_CHART_INTERVALS: ChartIntervals[] = [
  {
    key: '15min',
    label: '15 min',
    startValue: 15,
    startUnit: 'minute',
    format: 'MMM D, h:mm:ssa',
  },
  {
    key: '1hr',
    label: '1 hour',
    startValue: 1,
    startUnit: 'hour',
    format: 'MMM D, h:mma',
  },
  {
    key: '3hr',
    label: '3 hours',
    startValue: 3,
    startUnit: 'hour',
    format: 'MMM D, h:mma',
  },
  {
    key: '1day',
    label: '1 day',
    startValue: 1,
    startUnit: 'day',
    format: 'MMM D, h:mma',
  },
]

export const INVOCATION_CHART_CONFIG = {
  ok_count: {
    label: 'Ok',
    color: 'hsl(var(--brand-default))',
  },
  warning_count: {
    label: 'Warnings',
    color: 'hsl(var(--warning-default))',
  },
  error_count: {
    label: 'Errors',
    color: 'hsl(var(--destructive-default))',
  },
} satisfies ChartConfig

export const CPU_TIME_CHART_CONFIG = {
  max_cpu_time_used: {
    label: 'Max CPU Time',
    color: 'hsl(var(--brand-default))',
  },
} satisfies ChartConfig

export const EXECUTION_TIME_CHART_CONFIG = {
  avg_execution_time: {
    label: 'Average Execution Time',
    color: 'hsl(var(--foreground-default))',
  },
  max_execution_time: {
    label: 'Max Execution Time',
    color: 'hsl(var(--brand-default))',
  },
} satisfies ChartConfig

export const MEMORY_CHART_CONFIG = {
  avg_memory_used: {
    label: 'Memory Usage',
    color: 'hsl(var(--brand-default))',
  },
} satisfies ChartConfig

export const getBucketedTimeRange = (
  interval: ChartIntervals,
  now: Dayjs = dayjs()
): [Dayjs, Dayjs] => {
  const start = now
    .subtract(interval.startValue, interval.startUnit as dayjs.ManipulateType)
    .startOf(interval.startUnit as dayjs.ManipulateType)
  const end = now.startOf(interval.startUnit as dayjs.ManipulateType)

  return [start, end]
}

export const getRollingTimeRange = (
  interval: ChartIntervals,
  now: Dayjs = dayjs()
): [Dayjs, Dayjs] => {
  const end = now
  const start = end.subtract(interval.startValue, interval.startUnit as dayjs.ManipulateType)

  return [start, end]
}

export const getInvocationChartData = (data: EdgeFunctionChartDatum[]): InvocationChartDatum[] =>
  data.map((datum) => ({
    timestamp: String(datum.timestamp),
    ok_count: Number(datum.success_count ?? 0),
    warning_count: Number(datum.redirect_count ?? 0) + Number(datum.client_err_count ?? 0),
    error_count: Number(datum.server_err_count ?? 0),
  }))

export const getSegmentedButtonClassName = (index: number, total: number) => {
  if (index === 0) return 'rounded-tr-none rounded-br-none'
  if (index === total - 1) return 'rounded-tl-none rounded-bl-none'
  return 'rounded-none'
}

export const getChartTimeRangeLabels = (
  data: Array<{ timestamp: string }>,
  format: string
): { start: string; end: string } | undefined => {
  if (data.length === 0) return undefined

  return {
    start: formatChartTimestamp(data[0]?.timestamp, format),
    end: formatChartTimestamp(data[data.length - 1]?.timestamp, format),
  }
}

export const formatChartTimestamp = (value: string | number | undefined, format: string) => {
  return dayjs(value === undefined ? '' : String(value)).format(format)
}

export const getInvocationTotals = (data: InvocationChartDatum[]) => {
  const totalInvocationCount = sumBy(data, (datum) => {
    return datum.ok_count + datum.warning_count + datum.error_count
  })

  return {
    totalInvocationCount,
    totalWarningCount: sumBy(data, 'warning_count'),
    totalErrorCount: sumBy(data, 'error_count'),
  }
}

export const getChartEmptyStateCopy = (
  subject: string,
  isError: boolean,
  errorMessage?: string
) => ({
  title: isError ? `Unable to load ${subject}` : 'No data to show',
  description: isError ? errorMessage : undefined,
})

export const getExecutionMetrics = (data: EdgeFunctionChartDatum[]) => ({
  averageExecutionTime: meanBy(data, (datum) => Number(datum.avg_execution_time ?? 0)) ?? 0,
  maxExecutionTime: Number(
    maxBy(data, (datum) => Number(datum.max_execution_time ?? 0))?.max_execution_time ?? 0
  ),
})

export const getUsageMetrics = (data: EdgeFunctionChartDatum[]) => {
  const totalHeapMemory = sumBy(data, (datum) => Number(datum.avg_heap_memory_used ?? 0))
  const totalExternalMemory = sumBy(data, (datum) => Number(datum.avg_external_memory_used ?? 0))

  return {
    averageCpuTime: meanBy(data, (datum) => Number(datum.avg_cpu_time_used ?? 0)) ?? 0,
    maxCpuTime: Number(
      maxBy(data, (datum) => Number(datum.max_cpu_time_used ?? 0))?.max_cpu_time_used ?? 0
    ),
    averageMemoryUsage: meanBy(data, (datum) => Number(datum.avg_memory_used ?? 0)) ?? 0,
    totalHeapMemory,
    totalExternalMemory,
    totalMemoryByType: totalHeapMemory + totalExternalMemory,
  }
}

export const getInvocationUpdateAnnotation = ({
  updatedAt,
  invocationChartData,
  windowStart,
  windowEnd,
}: {
  updatedAt?: string
  invocationChartData: InvocationChartDatum[]
  windowStart: Dayjs
  windowEnd: Dayjs
}): InvocationUpdateAnnotation | undefined => {
  if (!updatedAt || invocationChartData.length === 0) return undefined

  const updatedAtTime = dayjs(updatedAt)
  const updatedAtValue = updatedAtTime.valueOf()

  if (updatedAtValue < windowStart.valueOf() || updatedAtValue > windowEnd.valueOf()) {
    return undefined
  }

  const closestTimestamp = invocationChartData.reduce((closest, datum) => {
    const datumDistance = Math.abs(dayjs(datum.timestamp).valueOf() - updatedAtValue)
    const closestDistance = Math.abs(dayjs(closest.timestamp).valueOf() - updatedAtValue)

    return datumDistance < closestDistance ? datum : closest
  }).timestamp

  const markerIndex = invocationChartData.findIndex((datum) => datum.timestamp === closestTimestamp)
  if (markerIndex < 0) return undefined

  return {
    timestamp: closestTimestamp,
    position: ((markerIndex + 0.5) / invocationChartData.length) * 100,
    updatedAt: updatedAtTime,
  }
}

export const formatMetric = (value?: number, unit?: string) => {
  if (value === undefined || Number.isNaN(value)) return unit ? `0${unit}` : '0'

  const formatted = unit === 'MB' ? value.toFixed(1) : Math.round(value).toLocaleString('en-US')
  return unit ? `${formatted}${unit}` : formatted
}

export const formatRate = (count: number, total: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(total === 0 ? 0 : count / total)

export const formatReferenceDelta = (value: number, reference: number, label = 'average') => {
  const difference = value - reference
  if (Math.abs(difference) < Number.EPSILON) return `At ${label}`
  if (reference === 0) return `${difference > 0 ? 'Above' : 'Below'} ${label}`

  const percentDifference = Math.round(Math.abs((difference / reference) * 100))
  return `${percentDifference}% ${difference > 0 ? 'above' : 'below'} ${label}`
}

export const getMemoryTooltipDetail = (heapMemory: number, externalMemory: number) => {
  return `Heap ${formatMetric(heapMemory, 'MB')} • External ${formatMetric(externalMemory, 'MB')}`
}
