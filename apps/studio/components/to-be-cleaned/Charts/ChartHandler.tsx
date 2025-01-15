import { useRouter } from 'next/router'
import { PropsWithChildren, useState } from 'react'
import { Button, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_, Tooltip_Shadcn_ } from 'ui'

import AreaChart from 'components/ui/Charts/AreaChart'
import BarChart from 'components/ui/Charts/BarChart'
import { AnalyticsInterval } from 'data/analytics/constants'
import {
  InfraMonitoringAttribute,
  useInfraMonitoringQuery,
} from 'data/analytics/infra-monitoring-query'
import {
  ProjectDailyStatsAttribute,
  useProjectDailyStatsQuery,
} from 'data/analytics/project-daily-stats-query'
import { Activity, BarChartIcon, Loader2 } from 'lucide-react'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { WarningIcon } from 'ui'
import type { ChartData } from './ChartHandler.types'

interface ChartHandlerProps {
  id?: string
  label: string
  attribute: string
  provider: 'infra-monitoring' | 'daily-stats'
  startDate: string
  endDate: string
  interval: string
  customDateFormat?: string
  defaultChartStyle?: 'bar' | 'line'
  hideChartType?: boolean
  data?: ChartData
  isLoading?: boolean
  format?: string
  highlightedValue?: string | number
  onBarClick?: (v: any) => void
}

/**
 * Controls chart display state. Optionally fetches static chart data if data is not provided.
 *
 * If the `data` prop is provided, it will disable automatic chart data fetching and pass the data directly to the chart render.
 * - loading state can also be provided through the `isLoading` prop, to display loading placeholders. Ignored if `data` key not provided.
 * - if `isLoading=true` and `data` is `undefined`, loading error message will be shown.
 *
 * Provided data must be in the expected chart format.
 */
const ChartHandler = ({
  label,
  attribute,
  provider,
  startDate,
  endDate,
  interval,
  customDateFormat,
  children = null,
  defaultChartStyle = 'bar',
  hideChartType = false,
  data,
  isLoading,
  format,
  highlightedValue,
  onBarClick,
}: PropsWithChildren<ChartHandlerProps>) => {
  const router = useRouter()
  const { ref } = router.query

  const state = useDatabaseSelectorStateSnapshot()
  const [chartStyle, setChartStyle] = useState<string>(defaultChartStyle)

  const databaseIdentifier = state.selectedDatabaseId

  const { data: dailyStatsData, isLoading: isFetchingDailyStats } = useProjectDailyStatsQuery(
    {
      projectRef: ref as string,
      attribute: attribute as ProjectDailyStatsAttribute,
      startDate,
      endDate,
      interval: interval as AnalyticsInterval,
      databaseIdentifier,
    },
    { enabled: provider === 'daily-stats' && data === undefined }
  )

  const { data: infraMonitoringData, isLoading: isFetchingInfraMonitoring } =
    useInfraMonitoringQuery(
      {
        projectRef: ref as string,
        attribute: attribute as InfraMonitoringAttribute,
        startDate,
        endDate,
        interval: interval as AnalyticsInterval,
        databaseIdentifier,
      },
      { enabled: provider === 'infra-monitoring' && data === undefined }
    )

  const chartData =
    data ||
    (provider === 'infra-monitoring'
      ? infraMonitoringData
      : provider === 'daily-stats'
        ? dailyStatsData
        : undefined)

  const loading =
    isLoading ||
    (provider === 'infra-monitoring'
      ? isFetchingInfraMonitoring
      : provider === 'daily-stats'
        ? isFetchingDailyStats
        : isLoading)

  const shouldHighlightMaxValue =
    provider === 'daily-stats' &&
    !attribute.includes('ingress') &&
    !attribute.includes('egress') &&
    chartData !== undefined &&
    'maximum' in chartData
  const shouldHighlightTotalGroupedValue = chartData !== undefined && 'totalGrouped' in chartData

  const _highlightedValue =
    highlightedValue !== undefined
      ? highlightedValue
      : shouldHighlightMaxValue
        ? chartData?.maximum
        : provider === 'daily-stats'
          ? chartData?.total
          : shouldHighlightTotalGroupedValue
            ? chartData?.totalGrouped?.[attribute]
            : (chartData?.data[chartData?.data.length - 1] as any)?.[attribute as any]

  if (loading) {
    return (
      <div className="flex h-52 w-full flex-col items-center justify-center gap-y-2">
        <Loader2 size={18} className="animate-spin text-border-strong" />
        <p className="text-xs text-foreground-lighter">Loading data for {label}</p>
      </div>
    )
  }

  if (chartData === undefined) {
    return (
      <div className="flex h-52 w-full flex-col items-center justify-center gap-y-2">
        <WarningIcon />
        <p className="text-xs text-foreground-lighter">Unable to load data for {label}</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <div className="absolute right-6 z-50 flex justify-between">
        {!hideChartType && (
          <Tooltip_Shadcn_>
            <TooltipTrigger_Shadcn_ asChild>
              <Button
                type="default"
                className="px-1.5"
                icon={chartStyle === 'bar' ? <Activity /> : <BarChartIcon />}
                onClick={() => setChartStyle(chartStyle === 'bar' ? 'line' : 'bar')}
              />
            </TooltipTrigger_Shadcn_>
            <TooltipContent_Shadcn_ side="left" align="center">
              View as {chartStyle === 'bar' ? 'line chart' : 'bar chart'}
            </TooltipContent_Shadcn_>
          </Tooltip_Shadcn_>
        )}
        {children}
      </div>
      {chartStyle === 'bar' ? (
        <BarChart
          YAxisProps={{ width: 1 }}
          data={(chartData?.data ?? []) as any}
          format={format || chartData?.format}
          xAxisKey={'period_start'}
          yAxisKey={attribute}
          highlightedValue={_highlightedValue}
          title={label}
          customDateFormat={customDateFormat}
        />
      ) : (
        <AreaChart
          data={(chartData?.data ?? []) as any}
          format={format || chartData?.format}
          xAxisKey="period_start"
          yAxisKey={attribute}
          highlightedValue={_highlightedValue}
          title={label}
          customDateFormat={customDateFormat}
        />
      )}
    </div>
  )
}

export default ChartHandler
