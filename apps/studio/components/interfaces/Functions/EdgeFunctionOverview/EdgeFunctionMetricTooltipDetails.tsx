import type { ChartLineProps } from 'ui-patterns/Chart'

import type { EdgeFunctionChartDatum } from './EdgeFunctionOverview.utils'
import { formatReferenceDelta, getMemoryTooltipDetail } from './EdgeFunctionOverview.utils'

export const ExecutionTooltipDetail = ({
  averageExecutionTime,
  metricKey,
  value,
}: {
  averageExecutionTime: number
  metricKey: string
  value: unknown
}) => {
  if (metricKey !== 'max_execution_time') return null

  return (
    <span className="text-foreground">
      {formatReferenceDelta(Number(value ?? 0), averageExecutionTime)}
    </span>
  )
}

export const CpuTooltipDetail = ({
  averageCpuTime,
  value,
}: {
  averageCpuTime: number
  value: unknown
}) => {
  return (
    <span className="text-foreground">
      {formatReferenceDelta(Number(value ?? 0), averageCpuTime)}
    </span>
  )
}

export const MemoryTooltipDetail = ({
  averageMemoryUsage,
  datum,
  value,
}: {
  averageMemoryUsage: number
  datum: EdgeFunctionChartDatum
  value: unknown
}) => {
  return (
    <>
      <span className="text-foreground">
        {formatReferenceDelta(Number(value ?? 0), averageMemoryUsage)}
      </span>
      <span className="text-foreground-light">
        {getMemoryTooltipDetail(datum.avg_heap_memory_used, datum.avg_external_memory_used)}
      </span>
    </>
  )
}

export const getExecutionTooltipDetails = (
  averageExecutionTime: number
): NonNullable<ChartLineProps['tooltipDetails']> => {
  return function renderExecutionTooltipDetails(_, key, value) {
    return (
      <ExecutionTooltipDetail
        averageExecutionTime={averageExecutionTime}
        metricKey={key}
        value={value}
      />
    )
  }
}

export const getCpuTooltipDetails = (
  averageCpuTime: number
): NonNullable<ChartLineProps['tooltipDetails']> => {
  return function renderCpuTooltipDetails(_, __, value) {
    return <CpuTooltipDetail averageCpuTime={averageCpuTime} value={value} />
  }
}

export const getMemoryTooltipDetails = (
  averageMemoryUsage: number
): NonNullable<ChartLineProps['tooltipDetails']> => {
  return function renderMemoryTooltipDetails(datum, _, value) {
    return (
      <MemoryTooltipDetail
        averageMemoryUsage={averageMemoryUsage}
        datum={datum as EdgeFunctionChartDatum}
        value={value}
      />
    )
  }
}
