import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { ReactNode, useState } from 'react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from 'ui'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import NoDataPlaceholder from 'components/ui/Charts/NoDataPlaceholder'
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
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { WarningIcon } from 'ui'
import { METRIC_THRESHOLDS } from './ReportBlock.constants'
import { ReportBlockContainer } from './ReportBlockContainer'

interface ChartBlockProps {
  label: string
  attribute: string
  provider: 'infra-monitoring' | 'daily-stats'
  startDate: string
  endDate: string
  interval?: AnalyticsInterval
  defaultChartStyle?: 'bar' | 'line'
  isLoading?: boolean
  draggable?: boolean
  actions?: ReactNode
  maxHeight?: number
}

export const ChartBlock = ({
  label,
  attribute,
  provider,
  startDate,
  endDate,
  interval = '1d',
  defaultChartStyle = 'bar',
  isLoading = false,
  draggable = false,
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
    { enabled: provider === 'daily-stats' }
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
      { enabled: provider === 'infra-monitoring' }
    )

  const chartData =
    provider === 'infra-monitoring'
      ? infraMonitoringData
      : provider === 'daily-stats'
        ? dailyStatsData
        : undefined

  const loading =
    isLoading ||
    (provider === 'infra-monitoring'
      ? isFetchingInfraMonitoring
      : provider === 'daily-stats'
        ? isFetchingDailyStats
        : isLoading)

  const metric = METRICS.find((x) => x.key === attribute)
  const metricLabel = metric?.label ?? attribute

  const getCellColor = (attribute: string, value: number) => {
    const threshold = METRIC_THRESHOLDS[attribute as keyof typeof METRIC_THRESHOLDS]
    if (!threshold) return 'var(--chart-1)'
    if (threshold.check === 'gt') {
      return value >= threshold.danger
        ? 'var(--chart-destructive)'
        : value >= threshold.warning
          ? 'var(--chart-warning)'
          : 'var(--chart-1)'
    } else {
      return value <= threshold.danger
        ? 'var(--chart-destructive)'
        : value <= threshold.warning
          ? 'var(--chart-warning)'
          : 'var(--chart-1)'
    }
  }

  const data = (chartData?.data ?? []).map((x: any) => {
    const value = chartData?.format === '%' ? x[attribute].toFixed(1) : x[attribute].toFixed(2)
    const color = getCellColor(attribute, x[attribute])
    return {
      ...x,
      period_start: dayjs(x.period_start).utc().format('YYYY-MM-DD'),
      [attribute]: value,
      [metricLabel]: value,
      fill: color,
      stroke: color,
    }
  })

  return (
    <ReportBlockContainer
      draggable={draggable}
      icon={metric?.category?.icon('text-foreground-muted')}
      label={label}
      actions={
        <>
          <ButtonTooltip
            type="text"
            size="tiny"
            disabled={loading}
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
        </>
      }
    >
      {loading ? (
        <div className="flex flex-grow w-full flex-col items-center justify-center gap-y-2">
          <Loader2 size={18} className="animate-spin text-border-strong" />
          <p className="text-xs text-foreground-lighter">Loading data for {label}</p>
        </div>
      ) : chartData === undefined ? (
        <div className="flex flex-grow w-full flex-col items-center justify-center gap-y-2">
          <WarningIcon />
          <p className="text-xs text-foreground-lighter">Unable to load data for {label}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-grow w-full flex-col items-center justify-center gap-y-2">
          <NoDataPlaceholder
            size="small"
            className="border-0"
            description="It may take up to 24 hours for data to refresh"
          />
        </div>
      ) : (
        <ChartContainer
          className="w-full aspect-auto px-3 py-2"
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
              <Bar dataKey={metricLabel} radius={4} />
            </BarChart>
          ) : (
            <LineChart accessibilityLayer margin={{ left: 0, right: 0 }} data={data}>
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
              <Line dataKey={metricLabel} stroke="var(--chart-1)" radius={4} />
            </LineChart>
          )}
        </ChartContainer>
      )}
    </ReportBlockContainer>
  )
}
