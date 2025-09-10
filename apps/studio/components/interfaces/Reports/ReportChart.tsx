import type { MultiAttribute } from 'components/ui/Charts/ComposedChart.utils'
import LogChartHandler from 'components/ui/Charts/LogChartHandler'
import { useFillTimeseriesSorted } from 'hooks/analytics/useFillTimeseriesSorted'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useChartData } from 'hooks/useChartData'
import type { UpdateDateRange } from 'pages/project/[ref]/reports/database'
import { ReportChartUpsell } from './v2/ReportChartUpsell'

interface ReportChartProps {
  chart: any
  startDate: string
  endDate: string
  interval: string
  updateDateRange: UpdateDateRange
  functionIds?: string[]
  isLoading?: boolean
}

/**
 * A wrapper component that uses the useChartData hook to fetch data for a chart
 * and then passes the data and loading state to the ComposedChartHandler.
 *
 * This component acts as a bridge between the data-fetching logic and the
 * presentational chart component.
 */
export const ReportChart = ({
  chart,
  startDate,
  endDate,
  interval,
  updateDateRange,
  functionIds,
  isLoading,
}: ReportChartProps) => {
  const { data: org } = useSelectedOrganizationQuery()
  const { plan: orgPlan } = useCurrentOrgPlan()
  const orgPlanId = orgPlan?.id

  const isAvailable =
    chart.availableIn === undefined || (orgPlanId && chart.availableIn.includes(orgPlanId))

  const canFetch = orgPlanId !== undefined
  const {
    data,
    isLoading: isLoadingChart,
    highlightedValue,
  } = useChartData({
    attributes: chart.attributes,
    startDate,
    endDate,
    interval,
    functionIds,
    data: undefined,
    enabled: canFetch,
    highlightedValue:
      chart.id === 'client-connections' || chart.id === 'pgbouncer-connections'
        ? true
        : chart.showMaxValue,
  })

  const isTopListChart = chart.id === 'top-api-routes' || chart.id === 'top-rpc-functions'

  const chartDataArray = Array.isArray(data) ? data : []

  const { data: filledData, isError: isFillError } = useFillTimeseriesSorted(
    chartDataArray,
    'period_start',
    chart.attributes.map((attr: any) => attr.attribute),
    0,
    startDate,
    endDate,
    undefined,
    interval
  )

  const finalData =
    chartDataArray.length > 0 && chartDataArray.length < 20 && !isFillError && !isTopListChart
      ? filledData
      : chartDataArray

  if (!isAvailable && !isLoading) {
    return <ReportChartUpsell report={chart} orgSlug={org?.slug ?? ''} />
  }

  return (
    <LogChartHandler
      {...chart}
      attributes={chart.attributes as MultiAttribute[]}
      data={finalData}
      isLoading={isLoadingChart || isLoading}
      highlightedValue={highlightedValue as any}
      updateDateRange={updateDateRange}
    />
  )
}
