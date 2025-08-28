import { useQuery } from '@tanstack/react-query'

import Panel from 'components/ui/Panel'
import { useFillTimeseriesSorted } from 'hooks/analytics/useFillTimeseriesSorted'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { cn } from 'ui'
import type { AnalyticsInterval } from 'data/analytics/constants'
import type { ReportConfig } from 'data/reports/v2/reports.types'
import ComposedChart from 'components/ui/Charts/ComposedChart'
import { ReportChartUpsell } from './ReportChartUpsell'
import { useState } from 'react'

export interface ReportChartV2Props {
  report: ReportConfig
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

export const ReportChartV2 = ({
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
}: ReportChartV2Props) => {
  const { data: org } = useSelectedOrganizationQuery()
  const { plan: orgPlan } = useCurrentOrgPlan()
  const orgPlanId = orgPlan?.id

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
      return await report.dataProvider(
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
  const dynamicAttributes = queryResult?.attributes || []

  const { data: filledChartData, isError: isFillError } = useFillTimeseriesSorted(
    chartData,
    'timestamp',
    (dynamicAttributes as any[]).map((attr: any) => attr.attribute),
    0,
    startDate,
    endDate,
    undefined,
    interval
  )

  const finalChartData =
    filledChartData && filledChartData.length > 0 && !isFillError ? filledChartData : chartData

  // STATE
  const [chartStyle, setChartStyle] = useState<string>(report.defaultChartStyle)

  // UPSELL STATE
  if (!isAvailable && !isLoading && !isLoadingChart) {
    return <ReportChartUpsell report={report} orgSlug={org?.slug ?? ''} />
  }

  // LOADING STATE
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

  // ERROR STATE
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

  // EMPTY STATE
  if (!finalChartData || finalChartData.length === 0) {
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

  return (
    <>
      <Panel
        noMargin
        noHideOverflow
        className={cn('relative w-full overflow-hidden scroll-mt-16', className)}
        wrapWithLoading={false}
        id={report.id}
      >
        <Panel.Content className="flex flex-col gap-4">
          <ComposedChart
            attributes={dynamicAttributes}
            data={finalChartData}
            format={report.format ?? undefined}
            xAxisKey="period_start"
            yAxisKey={dynamicAttributes[0]?.attribute}
            highlightedValue={0}
            title={report.label}
            customDateFormat={undefined}
            chartHighlight={undefined}
            chartStyle={chartStyle}
            showTooltip={report.showTooltip}
            showLegend={report.showLegend}
            showTotal={false}
            showMaxValue={report.showMaxValue}
            onChartStyleChange={setChartStyle}
            updateDateRange={updateDateRange}
            valuePrecision={report.valuePrecision}
            hideChartType={report.hideChartType}
            titleTooltip={report.titleTooltip}
            syncId={syncId}
            sql={queryResult?.query}
          />
        </Panel.Content>
      </Panel>
    </>
  )
}
