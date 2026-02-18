import { ChartConfig } from 'components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import NoDataPlaceholder from 'components/ui/Charts/NoDataPlaceholder'
import { checkHasNonPositiveValues, formatLogTick } from 'components/ui/QueryBlock/QueryBlock.utils'
import { AnalyticsInterval } from 'data/analytics/constants'
import { mapMultiResponseToAnalyticsData } from 'data/analytics/infra-monitoring-queries'
import {
  InfraMonitoringAttribute,
  useInfraMonitoringAttributesQuery,
} from 'data/analytics/infra-monitoring-query'
import {
  ProjectDailyStatsAttribute,
  useProjectDailyStatsQuery,
} from 'data/analytics/project-daily-stats-query'
import dayjs from 'dayjs'
import { METRICS } from 'lib/constants/metrics'
import { Activity, BarChartIcon, Loader2 } from 'lucide-react'
import { useRouter } from 'next/router'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import type { Dashboards } from 'types'
import { ChartContainer, ChartTooltip, ChartTooltipContent, WarningIcon } from 'ui'

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
  defaultLogScale?: boolean
  isLoading?: boolean
  actions?: ReactNode
  maxHeight?: number
  onUpdateChartConfig?: ({
    chart,
    chartConfig,
  }: {
    chart?: Partial<Dashboards.Chart>
    chartConfig?: Partial<ChartConfig>
  }) => void
}

export const ChartBlock = ({
  label,
  attribute,
  provider,
  startDate,
  endDate,
  interval = '1d',
  defaultChartStyle = 'bar',
  defaultLogScale = false,
  isLoading = false,
  actions,
  maxHeight,
  onUpdateChartConfig,
}: ChartBlockProps) => {
  const router = useRouter()
  const { ref } = router.query

  const state = useDatabaseSelectorStateSnapshot()
  const [chartStyle, setChartStyle] = useState<string>(defaultChartStyle)
  const logScale = useMemo(() => defaultLogScale, [defaultLogScale])
  const [latestValue, setLatestValue] = useState<string | undefined>()

  const databaseIdentifier = state.selectedDatabaseId

  const {
    data: dailyStatsData,
    isFetching: isFetchingDailyStats,
    isPending: isLoadingDailyStats,
  } = useProjectDailyStatsQuery(
    {
      projectRef: ref as string,
      attribute: attribute as ProjectDailyStatsAttribute,
      startDate: dayjs(startDate).format('YYYY-MM-DD'),
      endDate: dayjs(endDate).format('YYYY-MM-DD'),
    },
    { enabled: provider === 'daily-stats' }
  )

  const {
    data: infraMonitoringRawData,
    isFetching: isFetchingInfraMonitoring,
    isPending: isLoadingInfraMonitoring,
  } = useInfraMonitoringAttributesQuery(
    {
      projectRef: ref as string,
      attributes: [attribute as InfraMonitoringAttribute],
      startDate,
      endDate,
      interval: interval as AnalyticsInterval,
      databaseIdentifier,
    },
    { enabled: provider === 'infra-monitoring' }
  )

  const infraMonitoringData = useMemo(() => {
    if (!infraMonitoringRawData) return undefined
    const mapped = mapMultiResponseToAnalyticsData(infraMonitoringRawData, [
      attribute as InfraMonitoringAttribute,
    ])
    return mapped[attribute]
  }, [infraMonitoringRawData, attribute])

  const chartData =
    provider === 'infra-monitoring'
      ? infraMonitoringData
      : provider === 'daily-stats'
        ? dailyStatsData
        : undefined

  const isFetching =
    provider === 'infra-monitoring'
      ? isFetchingInfraMonitoring
      : provider === 'daily-stats'
        ? isFetchingDailyStats
        : false

  const loading =
    isLoading ||
    attribute.startsWith('new_snippet_') ||
    (provider === 'infra-monitoring'
      ? isLoadingInfraMonitoring
      : provider === 'daily-stats'
        ? isLoadingDailyStats
        : isLoading)

  const metric = METRICS.find((x) => x.key === attribute)
  const metricLabel = metric?.label ?? attribute

  const getCellColor = (attribute: string, value: number) => {
    const threshold = METRIC_THRESHOLDS[attribute as keyof typeof METRIC_THRESHOLDS]
    if (!threshold) return 'hsl(var(--chart-1))'
    if (threshold.check === 'gt') {
      return value >= threshold.danger
        ? 'hsl(var(--chart-destructive))'
        : value >= threshold.warning
          ? 'hsl(var(--chart-warning))'
          : 'hsl(var(--chart-1))'
    } else {
      return value <= threshold.danger
        ? 'hsl(var(--chart-destructive))'
        : value <= threshold.warning
          ? 'hsl(var(--chart-warning))'
          : 'hsl(var(--chart-1))'
    }
  }

  const isPercentage = chartData?.format === '%'
  const data = (chartData?.data ?? []).map((x: any) => {
    const value = isPercentage ? x[attribute] : x[attribute]
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

  const hasNonPositiveValues = useMemo(() => {
    if (!logScale || !data.length) return false
    return checkHasNonPositiveValues(data, metricLabel)
  }, [logScale, data, metricLabel])

  const effectiveLogScale = logScale && !hasNonPositiveValues

  const getInitialHighlightedValue = useCallback(() => {
    if (!chartData?.data?.length) return undefined
    const lastDataPoint = chartData.data[chartData.data.length - 1]
    const value = lastDataPoint[attribute]
    return isPercentage
      ? `${typeof value === 'number' ? value.toFixed(1) : value}%`
      : typeof value === 'number'
        ? value.toLocaleString()
        : value
  }, [chartData?.data, chartData?.format, attribute])

  useEffect(() => {
    if (defaultChartStyle) setChartStyle(defaultChartStyle)
  }, [defaultChartStyle])

  useEffect(() => {
    setLatestValue(getInitialHighlightedValue())
  }, [chartData, getInitialHighlightedValue])

  return (
    <ReportBlockContainer
      draggable
      showDragHandle
      loading={isFetching}
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
            onClick={() => {
              const style = chartStyle === 'bar' ? 'line' : 'bar'
              if (onUpdateChartConfig) onUpdateChartConfig({ chart: { chart_type: style } })
              setChartStyle(style)
            }}
            tooltip={{
              content: {
                side: 'bottom',
                className: 'max-w-56 text-center',
                text: `View as ${chartStyle === 'bar' ? 'line chart' : 'bar chart'}`,
              },
            }}
          />
          <ButtonTooltip
            type={logScale ? 'default' : 'text'}
            size="tiny"
            disabled={loading}
            className="h-7 px-1.5 font-mono text-[10px]"
            icon={<span className="font-mono text-[10px] leading-none">Log</span>}
            onClick={() => {
              const next = !logScale
              if (onUpdateChartConfig) onUpdateChartConfig({ chartConfig: { logScale: next } })
            }}
            tooltip={{
              content: {
                side: 'bottom',
                className: 'max-w-56 text-center',
                text: `Switch to ${logScale ? 'linear' : 'logarithmic'} scale`,
              },
            }}
          />
          {actions}
        </>
      }
    >
      {loading ? (
        <div className="flex flex-grow w-full flex-col items-center justify-center gap-y-2 px-4">
          <Loader2 size={18} className="animate-spin text-border-strong" />
          <p className="text-xs text-foreground-lighter text-center">Loading data for {label}</p>
        </div>
      ) : chartData === undefined ? (
        <div className="flex flex-grow w-full flex-col items-center justify-center gap-y-2 px-4">
          <WarningIcon />
          <p className="text-xs text-foreground-lighter text-center">
            Unable to load data for {label}
          </p>
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
        <>
          {latestValue && (
            <div className="pt-2 px-3 w-full text-left leading-tight">
              <span className="text-xs font-mono uppercase text-foreground-light">
                Most recently
              </span>
              <p className="text-lg text">{latestValue}</p>
            </div>
          )}
          {hasNonPositiveValues && (
            <p className="px-3 pt-1 text-xs text-foreground-light">
              Log scale is unavailable because the data contains zero or negative values.
            </p>
          )}
          <ChartContainer
            className="w-full aspect-auto px-3 py-2"
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
                <YAxis
                  scale={effectiveLogScale ? 'log' : 'auto'}
                  domain={effectiveLogScale ? [1, 'auto'] : isPercentage ? [0, 100] : undefined}
                  allowDataOverflow={effectiveLogScale}
                  width={effectiveLogScale ? 52 : undefined}
                  tickFormatter={effectiveLogScale ? formatLogTick : undefined}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-[200px]"
                      labelSuffix={isPercentage ? '%' : ''}
                      labelFormatter={(x) => dayjs(x).format('DD MMM YYYY')}
                    />
                  }
                />
                <Bar dataKey={metricLabel} radius={[2, 2, 1, 1]} />
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
                <YAxis
                  scale={effectiveLogScale ? 'log' : 'auto'}
                  domain={effectiveLogScale ? [1, 'auto'] : isPercentage ? [0, 100] : undefined}
                  allowDataOverflow={effectiveLogScale}
                  width={effectiveLogScale ? 52 : undefined}
                  tickFormatter={effectiveLogScale ? formatLogTick : undefined}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-[200px]"
                      labelSuffix={chartData?.format === '%' ? '%' : ''}
                      labelFormatter={(x) => dayjs(x).format('DD MMM YYYY')}
                    />
                  }
                />
                <Line dataKey={metricLabel} stroke="hsl(var(--chart-1))" radius={4} />
              </LineChart>
            )}
          </ChartContainer>
        </>
      )}
    </ReportBlockContainer>
  )
}
