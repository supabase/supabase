import Link from 'next/link'
import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import type { MultiAttribute } from 'components/ui/Charts/ComposedChart.utils'
import LogChartHandler from 'components/ui/Charts/LogChartHandler'
import Panel from 'components/ui/Panel'
import { useFillTimeseriesSorted } from 'hooks/analytics/useFillTimeseriesSorted'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Button, cn } from 'ui'
import type { AnalyticsInterval } from 'data/analytics/constants'
import type { Report } from 'data/reports/v2/edge-functions.config'

export interface ReportV2ChartProps {
  report: Report
  projectRef: string
  startDate: string
  endDate: string
  interval: AnalyticsInterval
  updateDateRange: (from: string, to: string) => void
  functionIds?: string[]
  edgeFnIdToName?: (id: string) => string | undefined
  isLoading?: boolean
  className?: string
  syncId?: string
}

export const ReportV2ChartComponent = ({
  report,
  projectRef,
  startDate,
  endDate,
  interval,
  updateDateRange,
  functionIds,
  edgeFnIdToName,
  isLoading,
  className,
  syncId,
}: ReportV2ChartProps) => {
  const { data: org } = useSelectedOrganizationQuery()
  const { plan: orgPlan } = useCurrentOrgPlan()
  const orgPlanId = orgPlan?.id

  const [isHoveringUpgrade, setIsHoveringUpgrade] = useState(false)
  const isAvailable =
    report.availableIn === undefined || (orgPlanId && report.availableIn.includes(orgPlanId))

  const canFetch = orgPlanId !== undefined

  const {
    data: queryResult,
    isLoading: isLoadingChart,
    error,
  } = useQuery(
    ['report-v2', report.id, projectRef, startDate, endDate, interval, functionIds],
    async () => {
      return await report.fetchFunction(
        projectRef,
        startDate,
        endDate,
        interval,
        functionIds,
        edgeFnIdToName
      )
    },
    {
      enabled: Boolean(projectRef && canFetch && isAvailable),
      refetchOnWindowFocus: false,
    }
  )

  const chartData = queryResult?.data || []

  console.log('chartData', queryResult)

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

  const demoChartData = useRef(getDemoChartData())
  const exponentialChartData = useRef(getExpDemoChartData())

  const demoData = isHoveringUpgrade ? exponentialChartData.current : demoChartData.current

  // Show upgrade prompt if not available
  if (!isAvailable && !isLoading) {
    return (
      <Panel
        title={<p className="text-sm">{report.label}</p>}
        className={cn('h-[260px] relative', className)}
      >
        <div className="z-10 flex flex-col items-center justify-center space-y-2 h-full absolute top-0 left-0 w-full bg-surface-100/70 backdrop-blur-md">
          <h2>{report.label}</h2>
          <p className="text-sm text-foreground-light">
            This chart is available from{' '}
            <span className="capitalize">
              {!!report.availableIn?.length ? report.availableIn[0] : 'Pro'}
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
                {!!report.availableIn?.length ? report.availableIn[0] : 'Pro'}
              </span>
            </Link>
          </Button>
        </div>
        <div className="absolute top-0 left-0 w-full h-full z-0">
          <LogChartHandler
            {...report}
            attributes={
              [
                {
                  attribute: 'demo',
                  enabled: true,
                  label: 'Demo',
                  provider: 'logs',
                },
              ] as MultiAttribute[]
            }
            label={report.label}
            startDate={startDate}
            endDate={endDate}
            interval={interval}
            data={demoData as any}
            isLoading={false}
            highlightedValue={0}
            updateDateRange={updateDateRange}
          />
        </div>
      </Panel>
    )
  }

  // Show loading state
  if (isLoadingChart || isLoading) {
    return (
      <Panel
        title={<p className="text-sm">{report.label}</p>}
        className={cn('h-[260px]', className)}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-foreground-light">Loading...</div>
        </div>
      </Panel>
    )
  }

  // Show error state
  if (error) {
    return (
      <Panel
        title={<p className="text-sm">{report.label}</p>}
        className={cn('h-[260px]', className)}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-destructive">Error loading chart data</div>
        </div>
      </Panel>
    )
  }

  // Show empty state
  if (!chartData || chartData.length === 0) {
    return (
      <Panel
        title={<p className="text-sm">{report.label}</p>}
        className={cn('h-[260px]', className)}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-foreground-light">
            No data available for the selected time range
          </div>
        </div>
      </Panel>
    )
  }

  // Render the actual chart
  return (
    <>
      <LogChartHandler
        {...report}
        attributes={report.attributes}
        data={chartData}
        isLoading={false}
        highlightedValue={undefined}
        updateDateRange={updateDateRange}
        startDate={startDate}
        endDate={endDate}
        interval={interval}
        syncId={syncId}
      />
      {/* <pre className="text-xs max-h-80 overflow-y-auto">{JSON.stringify(chartData, null, 2)}</pre> */}
    </>
  )
}
