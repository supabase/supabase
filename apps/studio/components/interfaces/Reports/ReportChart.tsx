/**
 * ReportChart
 *
 * A wrapper component that uses the useChartData hook to fetch data for a chart
 * and then passes the data and loading state to the ComposedChartHandler.
 *
 * This component acts as a bridge between the data-fetching logic and the
 * presentational chart component.
 */
import LogChartHandler from 'components/ui/Charts/LogChartHandler'
import { useChartData } from 'hooks/useChartData'
import type { UpdateDateRange } from 'pages/project/[ref]/reports/database'
import type { MultiAttribute } from 'components/ui/Charts/ComposedChart.utils'

const ReportChart = ({
  chart,
  startDate,
  endDate,
  interval,
  updateDateRange,
  functionIds,
}: {
  chart: any
  startDate: string
  endDate: string
  interval: string
  updateDateRange: UpdateDateRange
  functionIds?: string[]
}) => {
  const {
    data,
    isLoading: isLoading,
    chartAttributes,
    highlightedValue,
  } = useChartData({
    attributes: chart.attributes,
    startDate,
    endDate,
    interval,
    functionIds,
    data: undefined,
    highlightedValue:
      chart.id === 'client-connections' || chart.id === 'pgbouncer-connections'
        ? true
        : chart.showMaxValue,
  })

  return (
    <LogChartHandler
      {...chart}
      attributes={
        (chartAttributes.length > 0 ? chartAttributes : chart.attributes) as MultiAttribute[]
      }
      data={data}
      isLoading={isLoading}
      highlightedValue={highlightedValue as any}
      updateDateRange={updateDateRange}
    />
  )
}
export default ReportChart
