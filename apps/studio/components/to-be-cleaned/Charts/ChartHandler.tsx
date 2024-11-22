import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'
import { Loader2 } from 'lucide-react'
import { WarningIcon } from 'ui'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from 'ui'
import { CartesianGrid, Bar, BarChart, XAxis, YAxis } from 'recharts'
import dayjs from 'dayjs'

import { AnalyticsInterval } from 'data/analytics/constants'
import {
  InfraMonitoringAttribute,
  useInfraMonitoringQuery,
} from 'data/analytics/infra-monitoring-query'
import {
  ProjectDailyStatsAttribute,
  useProjectDailyStatsQuery,
} from 'data/analytics/project-daily-stats-query'
import { Activity } from 'lucide-react'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
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
  data?: ChartData
  isLoading?: boolean
  format?: string
  highlightedValue?: string | number
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
  data,
  isLoading,
  format,
  highlightedValue,
}: PropsWithChildren<ChartHandlerProps>) => {
  const router = useRouter()
  const { ref } = router.query

  const state = useDatabaseSelectorStateSnapshot()

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

  console.log('chart data:', chartData)

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
    <div className="h-full flex flex-col">
      <div className="flex justify-between px-5 py-4 items-center z-10 border-b">
        <div>
          <h3 className="text-sm text-foreground-light">{label}</h3>
          <div>
            {chartData?.format === '%'
              ? `${_highlightedValue.toFixed(1)}%`
              : _highlightedValue?.toLocaleString()}
          </div>
        </div>
        <div className="flex gap-2">{children}</div>
      </div>
      <div className="flex-1 p-2 relative">
        <ChartContainer config={{}} className="aspect-auto h-full">
          <BarChart accessibilityLayer data={chartData?.data ?? []}>
            <CartesianGrid vertical={false} />
            {/* <XAxis
              dataKey="period_start"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => dayjs(value).format(customDateFormat || 'MMM D YYYY')}
            />
            <YAxis
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.toLocaleString()}
            /> */}
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey={attribute} fill="var(--chart-1)" radius={4} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  )
}

export default ChartHandler
