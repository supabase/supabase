import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { ReactNode, useState } from 'react'
import { ChartContainer, ChartTooltip, ChartTooltipContent, cn } from 'ui'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import AreaChart from 'components/ui/Charts/AreaChart'
import { ChartData } from 'components/ui/Charts/Charts.types'
import { AnalyticsInterval } from 'data/analytics/constants'
import {
  InfraMonitoringAttribute,
  useInfraMonitoringQuery,
} from 'data/analytics/infra-monitoring-query'
import {
  ProjectDailyStatsAttribute,
  useProjectDailyStatsQuery,
} from 'data/analytics/project-daily-stats-query'
import { METRICS } from 'lib/constants/metrics'
import { Activity, BarChartIcon, Loader2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { WarningIcon } from 'ui'

interface ChartBlockProps {
  id?: string
  label: string
  attribute: string
  provider: 'infra-monitoring' | 'daily-stats'
  startDate: string
  endDate: string
  interval: string
  customDateFormat?: string
  defaultChartStyle?: 'bar' | 'line'
  data?: ChartData
  isLoading?: boolean
  format?: string
  highlightedValue?: string | number

  /** Any other actions specific to the parent to be rendered in the header */
  actions?: ReactNode
  /** Max height set to render results / charts (Defaults to 250) */
  maxHeight?: number
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
export const ChartBlock = ({
  label,
  attribute,
  provider,
  startDate,
  endDate,
  interval,
  customDateFormat,
  defaultChartStyle = 'bar',
  data: _data,
  isLoading,
  format,
  highlightedValue,
  actions,
  maxHeight,
}: ChartBlockProps) => {
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
    { enabled: provider === 'daily-stats' && _data === undefined }
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
      { enabled: provider === 'infra-monitoring' && _data === undefined }
    )

  const chartData =
    _data ||
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

  // Joshen - All these are new, see if can clean up anything above
  const metric = METRICS.find((x) => x.key === attribute)
  const metricLabel = metric?.label ?? attribute

  const data = (chartData?.data ?? []).map((x: any) => {
    const value = chartData?.format === '%' ? x[attribute].toFixed(1) : x[attribute].toFixed(2)
    return {
      ...x,
      period_start: dayjs(x.period_start).utc().format('YYYY-MM-DD'),
      [attribute]: value,
      [metricLabel]: value,
    }
  })

  // [Joshen] these states need to be shifted within the card
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
    <div
      className={cn('h-full bg-surface-100 border-overlay group relative rounded border shadow-sm')}
    >
      <div className="flex py-1 pl-3 pr-1 items-center gap-2 z-10 shrink-0">
        {metric?.category?.icon('text-foreground-muted')}
        <h3 className="text-xs font-medium text-foreground-light flex-1">{label}</h3>
        <div className="flex items-center">
          <ButtonTooltip
            type="text"
            size="tiny"
            className="w-7 h-7"
            icon={chartStyle === 'bar' ? <Activity /> : <BarChartIcon />}
            onClick={() => setChartStyle(chartStyle === 'bar' ? 'line' : 'bar')}
            tooltip={{
              content: {
                side: 'bottom',
                className: 'max-w-56 text-center',
                text: `View as ${chartStyle === 'bar' ? 'line chart' : 'bar chart'}`,
              },
            }}
          />
          {actions}
        </div>
      </div>
      <ChartContainer
        className="flex-1 border-t aspect-auto px-3 pb-2"
        config={{}}
        style={{
          height: maxHeight ? `${maxHeight}px` : undefined,
          minHeight: maxHeight ? `${maxHeight}px` : undefined,
        }}
      >
        {chartStyle === 'bar' ? (
          <BarChart accessibilityLayer margin={{ left: 0, right: 0 }} data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="period_start"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            {chartData.format === '%' && <YAxis hide domain={[0, 100]} />}
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[200px]"
                  labelSuffix="%"
                  labelFormatter={(x) => dayjs(x).format('DD MMM YYYY')}
                />
              }
            />
            <Bar dataKey={metricLabel} fill="var(--chart-1)" radius={4} />
          </BarChart>
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
      </ChartContainer>
    </div>
  )
}
