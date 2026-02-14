import { useQuery } from '@tanstack/react-query'
import type { ChartHighlightAction } from 'components/ui/Charts/ChartHighlightActions'
import { ComposedChart } from 'components/ui/Charts/ComposedChart'
import type { MultiAttribute } from 'components/ui/Charts/ComposedChart.utils'
import { useChartHighlight } from 'components/ui/Charts/useChartHighlight'
import type { AnalyticsInterval } from 'data/analytics/constants'
import type { ReportConfig } from 'data/reports/v2/reports.types'
import { useFillTimeseriesSorted } from 'hooks/analytics/useFillTimeseriesSorted'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, cn } from 'ui'

import { ReportChartUpsell } from './ReportChartUpsell'

export interface ReportChartV2Props {
  report: ReportConfig
  projectRef: string
  startDate: string
  endDate: string
  interval: AnalyticsInterval
  updateDateRange: (from: string, to: string) => void
  /**
   * Group ID used to invalidate React Query caches
   */
  queryGroup?: string
  className?: string
  syncId?: string
  filters?: any
  highlightActions?: ChartHighlightAction[]
}

// Compute total across entire period over unique attribute keys.
// Excludes attributes that are disabled, reference lines, max values, or marked omitFromTotal.
export function computePeriodTotal(
  chartData: Record<string, unknown>[],
  dynamicAttributes: MultiAttribute[]
): number {
  const attributeKeys = Array.from(
    new Set(
      dynamicAttributes
        .filter(
          (a) =>
            a?.enabled !== false &&
            a?.provider !== 'reference-line' &&
            !a?.isMaxValue &&
            !a?.omitFromTotal
        )
        .map((a) => a.attribute)
    )
  )

  return chartData.reduce((sum: number, row: Record<string, unknown>) => {
    const rowTotal = attributeKeys.reduce((acc: number, key: string) => {
      const value = row?.[key]
      return acc + (typeof value === 'number' ? value : 0)
    }, 0)
    return sum + rowTotal
  }, 0)
}

export const ReportChartV2 = ({
  report,
  projectRef,
  startDate,
  endDate,
  interval,
  updateDateRange,
  className,
  syncId,
  filters,
  highlightActions,
  queryGroup,
}: ReportChartV2Props) => {
  const { data: org } = useSelectedOrganizationQuery()
  const { plan: orgPlan } = useCurrentOrgPlan()
  const orgPlanId = orgPlan?.id

  const isAvailable = !report?.availableIn || (orgPlanId && report.availableIn?.includes(orgPlanId))

  const canFetch = orgPlanId !== undefined && isAvailable

  const {
    data: queryResult,
    isLoading: isLoadingChart,
    error,
    isFetching,
  } = useQuery({
    queryKey: [
      'projects',
      projectRef,
      'report-v2',
      { reportId: report.id, queryGroup, startDate, endDate, interval, filters },
    ],
    queryFn: async () => {
      return await report.dataProvider(projectRef, startDate, endDate, interval, filters)
    },
    enabled: Boolean(projectRef && canFetch && isAvailable && !report.hide),
    refetchOnWindowFocus: false,
    staleTime: 0,
  })

  const chartData = queryResult?.data || []
  const dynamicAttributes = queryResult?.attributes || []

  const showSumAsDefaultHighlight = report.showSumAsDefaultHighlight ?? true
  const headerTotal = showSumAsDefaultHighlight
    ? computePeriodTotal(chartData, dynamicAttributes)
    : undefined

  /**
   * Depending on the source the timestamp key could be 'timestamp' or 'period_start'
   */
  const firstItem = chartData[0]
  const timestampKey = firstItem?.hasOwnProperty('timestamp') ? 'timestamp' : 'period_start'

  const { data: filledChartData, isError: isFillError } = useFillTimeseriesSorted({
    data: chartData,
    timestampKey,
    valueKey: dynamicAttributes.map((attr) => attr.attribute),
    defaultValue: 0,
    startDate,
    endDate,
    minPointsToFill: undefined,
    interval,
  })

  const [chartStyle, setChartStyle] = useState<string>(report.defaultChartStyle)
  const chartHighlight = useChartHighlight()

  if (!isAvailable) {
    return <ReportChartUpsell report={report} orgSlug={org?.slug ?? ''} />
  }

  const isErrorState = error && !isLoadingChart

  if (report.hide) return null

  return (
    <Card id={report.id} className={cn('relative w-full overflow-hidden scroll-mt-16', className)}>
      <CardContent
        className={cn(
          'flex flex-col gap-4 min-h-[280px] items-center justify-center',
          isFetching && 'opacity-50'
        )}
      >
        {isLoadingChart ? (
          <Loader2 className="size-5 animate-spin text-foreground-light" />
        ) : isErrorState ? (
          <p className="text-sm text-foreground-light text-center h-full flex items-center justify-center">
            Error loading chart data
          </p>
        ) : (
          <div className="w-full relative">
            <ComposedChart
              chartId={report.id}
              attributes={dynamicAttributes}
              data={filledChartData}
              format={report.format ?? undefined}
              xAxisKey={report.xAxisKey ?? 'timestamp'}
              yAxisKey={report.yAxisKey ?? dynamicAttributes[0]?.attribute}
              hideHighlightedValue={report.hideHighlightedValue}
              highlightedValue={headerTotal}
              title={report.label}
              customDateFormat={undefined}
              chartStyle={chartStyle}
              chartHighlight={chartHighlight}
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
              highlightActions={highlightActions}
              showNewBadge={report.showNewBadge}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
