/**
 * ReportChart
 *
 * A wrapper component that uses the useChartData hook to fetch data for a chart
 * and then passes the data and loading state to the ComposedChartHandler.
 *
 * This component acts as a bridge between the data-fetching logic and the
 * presentational chart component.
 */

import Link from 'next/link'
import { useRef, useState } from 'react'

import type { MultiAttribute } from 'components/ui/Charts/ComposedChart.utils'
import LogChartHandler from 'components/ui/Charts/LogChartHandler'
import Panel from 'components/ui/Panel'
import { useFillTimeseriesSorted } from 'hooks/analytics/useFillTimeseriesSorted'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useChartData } from 'hooks/useChartData'
import type { UpdateDateRange } from 'pages/project/[ref]/reports/database'
import { Button, cn } from 'ui'

const ReportChart = ({
  chart,
  startDate,
  endDate,
  interval,
  updateDateRange,
  functionIds,
  isLoading,
  className,
}: {
  chart: any
  startDate: string
  endDate: string
  interval: string
  updateDateRange: UpdateDateRange
  functionIds?: string[]
  isLoading?: boolean
  className?: string
}) => {
  const org = useSelectedOrganization()
  const { plan: orgPlan } = useCurrentOrgPlan()
  const orgPlanId = orgPlan?.id

  const [isHoveringUpgrade, setIsHoveringUpgrade] = useState(false)
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

  const getExpDemoChartData = () =>
    new Array(20).fill(0).map((_, index) => ({
      period_start: new Date(startDate).getTime() + index * 1000,
      demo: Math.floor(Math.pow(1.25, index) * 10),
      max_demo: 1000,
    }))

  const getDemoChartData = () =>
    new Array(20).fill(0).map((_, index) => ({
      period_start: new Date(startDate).getTime() + index * 1000,
      demo: Math.floor(Math.random() * 10) + 1,
      max_demo: 1000,
    }))

  // [Jordi] useRef to prevent re-rendering making the chart change.
  const demoChartData = useRef(getDemoChartData())
  const exponentialChartData = useRef(getExpDemoChartData())

  const chartData = isHoveringUpgrade ? exponentialChartData.current : demoChartData.current

  if (!isAvailable && !isLoading) {
    return (
      <Panel
        title={<p className="text-sm">{chart.label}</p>}
        className={cn('h-[260px] relative', className)}
      >
        <div className="z-10 flex flex-col items-center justify-center space-y-2 h-full absolute top-0 left-0 w-full bg-surface-100/70 backdrop-blur-md">
          <h2>{chart.label}</h2>
          <p className="text-sm text-foreground-light">
            This chart is available from{' '}
            <span className="capitalize">
              {!!chart.availableIn?.length ? chart.availableIn[0] : 'Pro'}
            </span>{' '}
            plan and above
          </p>
          <Button
            asChild
            type="primary"
            onMouseEnter={() => setIsHoveringUpgrade(true)}
            onMouseLeave={() => setIsHoveringUpgrade(false)}
          >
            <Link href={`/org/${org?.slug}/billing?panel=subscriptionPlan&source=reports`}>
              Upgrade to{' '}
              <span className="capitalize">
                {!!chart.availableIn?.length ? chart.availableIn[0] : 'Pro'}
              </span>
            </Link>
          </Button>
        </div>
        <div className="absolute top-0 left-0 w-full h-full z-0">
          <LogChartHandler
            attributes={[
              {
                attribute: 'demo',
                enabled: true,
                label: 'Demo',
                provider: 'logs',
              },
            ]}
            label={chart.label}
            startDate={startDate}
            endDate={endDate}
            interval={interval}
            data={chartData as any}
            isLoading={false}
            highlightedValue={0}
            updateDateRange={updateDateRange}
          />
        </div>
      </Panel>
    )
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
export default ReportChart
