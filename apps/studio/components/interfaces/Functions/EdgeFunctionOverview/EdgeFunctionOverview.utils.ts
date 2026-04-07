import dayjs from 'dayjs'
import maxBy from 'lodash/maxBy'
import meanBy from 'lodash/meanBy'
import sumBy from 'lodash/sumBy'
import type { ChartConfig } from 'ui'

import type { ChartIntervals } from '@/types'

export type EdgeFunctionChartRawDatum = {
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

export type EdgeFunctionChartDatum = {
  timestamp: string
  success_count: number
  redirect_count: number
  client_err_count: number
  server_err_count: number
  avg_execution_time: number
  max_execution_time: number
  avg_cpu_time_used: number
  max_cpu_time_used: number
  avg_memory_used: number
  avg_heap_memory_used: number
  avg_external_memory_used: number
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
  updatedAt: Date
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

const toManipulateUnit = (unit: ChartIntervals['startUnit']) => unit as dayjs.ManipulateType
const toNumber = (value: string | number | undefined) => Number(value ?? 0)

export const getBucketedTimeRange = (
  interval: ChartIntervals,
  now: Date = new Date()
): [Date, Date] => {
  const currentTime = dayjs(now)
  const unit = toManipulateUnit(interval.startUnit)
  const start = currentTime.subtract(interval.startValue, unit).startOf(unit)
  const end = currentTime.startOf(unit)

  return [start.toDate(), end.toDate()]
}

export const getRollingTimeRange = (
  interval: ChartIntervals,
  now: Date = new Date()
): [Date, Date] => {
  const currentTime = dayjs(now)
  const start = currentTime.subtract(interval.startValue, toManipulateUnit(interval.startUnit))

  return [start.toDate(), currentTime.toDate()]
}

export const formatChartTimestamp = (value: Date | string | number | undefined, format: string) => {
  return dayjs(value === undefined ? '' : value).format(format)
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

export const toEdgeFunctionChartData = (
  rows: EdgeFunctionChartRawDatum[] = []
): EdgeFunctionChartDatum[] =>
  rows.map((row) => ({
    timestamp: String(row.timestamp ?? ''),
    success_count: toNumber(row.success_count),
    redirect_count: toNumber(row.redirect_count),
    client_err_count: toNumber(row.client_err_count),
    server_err_count: toNumber(row.server_err_count),
    avg_execution_time: toNumber(row.avg_execution_time),
    max_execution_time: toNumber(row.max_execution_time),
    avg_cpu_time_used: toNumber(row.avg_cpu_time_used),
    max_cpu_time_used: toNumber(row.max_cpu_time_used),
    avg_memory_used: toNumber(row.avg_memory_used),
    avg_heap_memory_used: toNumber(row.avg_heap_memory_used),
    avg_external_memory_used: toNumber(row.avg_external_memory_used),
  }))

export const getInvocationChartData = (data: EdgeFunctionChartDatum[]): InvocationChartDatum[] =>
  data.map((datum) => ({
    timestamp: datum.timestamp,
    ok_count: datum.success_count,
    warning_count: datum.redirect_count + datum.client_err_count,
    error_count: datum.server_err_count,
  }))

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

export const getExecutionMetrics = (data: EdgeFunctionChartDatum[]) => ({
  averageExecutionTime: meanBy(data, 'avg_execution_time') ?? 0,
  maxExecutionTime: maxBy(data, 'max_execution_time')?.max_execution_time ?? 0,
})

export const getUsageMetrics = (data: EdgeFunctionChartDatum[]) => {
  const totalHeapMemory = sumBy(data, 'avg_heap_memory_used')
  const totalExternalMemory = sumBy(data, 'avg_external_memory_used')

  return {
    averageCpuTime: meanBy(data, 'avg_cpu_time_used') ?? 0,
    maxCpuTime: maxBy(data, 'max_cpu_time_used')?.max_cpu_time_used ?? 0,
    averageMemoryUsage: meanBy(data, 'avg_memory_used') ?? 0,
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
  windowStart: Date
  windowEnd: Date
}): InvocationUpdateAnnotation | undefined => {
  if (!updatedAt || invocationChartData.length === 0) return undefined

  const updatedAtDate = new Date(updatedAt)
  const updatedAtValue = updatedAtDate.valueOf()

  if (Number.isNaN(updatedAtValue)) return undefined
  if (updatedAtValue < windowStart.valueOf() || updatedAtValue > windowEnd.valueOf()) {
    return undefined
  }

  const closestTimestamp = invocationChartData.reduce((closest, datum) => {
    const datumDistance = Math.abs(new Date(datum.timestamp).valueOf() - updatedAtValue)
    const closestDistance = Math.abs(new Date(closest.timestamp).valueOf() - updatedAtValue)

    return datumDistance < closestDistance ? datum : closest
  }).timestamp

  const markerIndex = invocationChartData.findIndex((datum) => datum.timestamp === closestTimestamp)
  if (markerIndex < 0) return undefined

  return {
    timestamp: closestTimestamp,
    position: ((markerIndex + 0.5) / invocationChartData.length) * 100,
    updatedAt: updatedAtDate,
  }
}

export const getSegmentedButtonClassName = (index: number, total: number) => {
  if (index === 0) return 'rounded-tr-none rounded-br-none'
  if (index === total - 1) return 'rounded-tl-none rounded-bl-none'
  return 'rounded-none'
}

export const getChartEmptyStateCopy = (
  subject: string,
  isError: boolean,
  errorMessage?: string
) => ({
  title: isError ? `Unable to load ${subject}` : 'No data to show',
  description: isError ? errorMessage : undefined,
})

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
