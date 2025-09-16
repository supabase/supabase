import dayjs from 'dayjs'
import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar, Cell, BarChart as RechartBarChart, XAxis, YAxis } from 'recharts'
import type { CategoricalChartState } from 'recharts/types/chart/types'

import { MultiAttribute } from 'components/ui/Charts/ComposedChart.utils'
import NoDataPlaceholder from 'components/ui/Charts/NoDataPlaceholder'
import { useFillTimeseriesSorted } from 'hooks/analytics/useFillTimeseriesSorted'
import { useChartData } from 'hooks/useChartData'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, cn } from 'ui'

const CHART_COLORS = {
  AXIS: 'hsl(var(--background-overlay-hover))',
  GREEN_1: 'hsl(var(--brand-default))',
  GREEN_2: 'hsl(var(--brand-500))',
}

export type UsersBarChartDatum = {
  timestamp: string
  count: number
}

export const UsersBarChart = ({
  timestampStart,
  timestampEnd,
  onBarClick,
  DateTimeFormat = 'MMM D, YYYY, hh:mma',
  className,
}: {
  timestampStart?: string
  timestampEnd?: string
  onBarClick?: (datum: UsersBarChartDatum, tooltipData?: CategoricalChartState) => void
  DateTimeFormat?: string
  className?: string
}) => {
  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)

  const startDate = useMemo(
    () => timestampStart || dayjs().subtract(7, 'day').toISOString(),
    [timestampStart]
  )
  const endDate = useMemo(() => timestampEnd || dayjs().toISOString(), [timestampEnd])

  const interval = useMemo(() => {
    const from = dayjs(startDate)
    const to = dayjs(endDate)
    const diffInDays = to.diff(from, 'day', true)
    const diffInHours = to.diff(from, 'hour', true)
    if (diffInHours < 1.1) return '1m'
    if (diffInHours < 3.1) return '5m'
    if (diffInHours < 6.1) return '10m'
    if (diffInHours < 25) return '30m'
    if (diffInDays < 10) return '1h'
    return '1d'
  }, [startDate, endDate])

  const attributes = useMemo(
    () =>
      [
        { attribute: 'TotalSignUps', provider: 'logs', label: 'Sign Ups', enabled: true },
      ] as MultiAttribute[],
    []
  )

  const { data, isLoading } = useChartData({
    attributes: attributes,
    startDate,
    endDate,
    interval,
    data: undefined,
    enabled: true,
  })

  const chartDataArray = Array.isArray(data) ? data : []
  const { data: filledData, isError: isFillError } = useFillTimeseriesSorted(
    chartDataArray,
    'period_start',
    attributes.map((attr) => attr.attribute),
    0,
    startDate,
    endDate,
    undefined,
    interval
  )
  const finalData = !isFillError ? filledData : chartDataArray

  const transformedData: UsersBarChartDatum[] = useMemo(
    () =>
      (finalData || []).map((d: any) => ({
        timestamp: d.period_start,
        count: d.TotalSignUps ?? d.count ?? 0,
      })),
    [finalData]
  )

  const startLabel = useMemo(() => {
    if (!transformedData.length) return ''
    return dayjs(transformedData[0]['timestamp']).format(DateTimeFormat)
  }, [transformedData, DateTimeFormat])
  const endLabel = useMemo(() => {
    if (!transformedData.length) return ''
    return dayjs(transformedData[transformedData?.length - 1]?.['timestamp']).format(DateTimeFormat)
  }, [transformedData, DateTimeFormat])

  const noData = chartDataArray.length === 0

  return (
    <div data-testid="users-bar-chart" className={cn('flex flex-col gap-y-3', className)}>
      {isLoading && (
        <div className="flex items-center justify-center h-[96px]">
          <Loader2 size={18} className="h-24 animate-spin text-border-strong" />
        </div>
      )}

      {noData && !isLoading ? (
        <NoDataPlaceholder
          size="tiny"
          className="border-0 h-[80px] p-0"
          description="It may take up to 24 hours for data to refresh"
        />
      ) : (
        !isLoading && (
          <ChartContainer
            config={
              {
                count: { label: 'New users' },
              } as ChartConfig
            }
            className="h-[96px]"
          >
            <RechartBarChart
              data={transformedData}
              onMouseMove={(e: any) => {
                if (e.activeTooltipIndex !== focusDataIndex) {
                  setFocusDataIndex(e.activeTooltipIndex)
                }
              }}
              onMouseLeave={() => setFocusDataIndex(null)}
              onClick={(tooltipData) => {
                const datum = tooltipData?.activePayload?.[0]?.payload
                if (onBarClick) onBarClick(datum, tooltipData)
              }}
            >
              <YAxis
                tick={false}
                width={0}
                axisLine={{ stroke: CHART_COLORS.AXIS }}
                tickLine={{ stroke: CHART_COLORS.AXIS }}
              />
              <XAxis
                dataKey="timestamp"
                interval={transformedData.length - 2}
                tick={false}
                axisLine={{ stroke: CHART_COLORS.AXIS }}
                tickLine={{ stroke: CHART_COLORS.AXIS }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="text-foreground-light -mt-5"
                    labelFormatter={(v) => dayjs(v).format(DateTimeFormat)}
                  />
                }
              />
              <Bar dataKey="count" fill={CHART_COLORS.GREEN_1} maxBarSize={24}>
                {transformedData?.map((_entry: UsersBarChartDatum, index: number) => (
                  <Cell
                    className="cursor-pointer transition-colors"
                    key={`count-${index}`}
                    fill={
                      focusDataIndex === index || focusDataIndex === null
                        ? CHART_COLORS.GREEN_1
                        : CHART_COLORS.GREEN_2
                    }
                  />
                ))}
              </Bar>
            </RechartBarChart>
          </ChartContainer>
        )
      )}
      {transformedData.length > 0 && (
        <div className="text-foreground-lighter -mt-10 flex items-center justify-between text-[10px] font-mono">
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </div>
      )}
    </div>
  )
}
