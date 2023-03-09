import { ReportWidgetProps } from '../ReportWidget'
import BarChart from 'components/ui/Charts/BarChart'

export const renderTotalRequests = (
  props: ReportWidgetProps<{
    timestamp: string
    count: number
  }>
) => {
  const total = props.data.reduce((acc, datum) => {
    return acc + datum.count
  }, 0)
  return (
    <BarChart
      size="small"
      minimalHeader
      highlightedValue={total}
      className="w-full"
      data={props.data}
      yAxisKey="count"
      xAxisKey="timestamp"
      displayDateInUtc
    />
  )
}

export const renderErrorCounts = (
  props: ReportWidgetProps<{
    timestamp: string
    count: number
  }>
) => {
  const total = props.data.reduce((acc, datum) => {
    return acc + datum.count
  }, 0)
  return (
    <BarChart
      size="small"
      minimalHeader
      className="w-full"
      highlightedValue={total}
      data={props.data}
      yAxisKey="count"
      xAxisKey="timestamp"
      displayDateInUtc
    />
  )
}

export const renderResponseSpeed = (
  props: ReportWidgetProps<{
    timestamp: string
    avg: number
    quantiles: number[]
  }>
) => {
  const transformedData = props.data.map((datum) => ({
    timestamp: datum.timestamp,
    avg: datum.avg,
    median: datum.quantiles[49],
  }))
  const lastAvg = props.data[props.data.length - 1]?.avg
  return (
    <BarChart
      size="small"
      highlightedValue={lastAvg}
      format="ms"
      minimalHeader
      className="w-full"
      data={transformedData}
      yAxisKey="avg"
      xAxisKey="timestamp"
      displayDateInUtc
    />
  )
}
