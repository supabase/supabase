'use client'
import dayjs from 'dayjs'
import { ReactNode, useMemo, useState } from 'react'
import { Bar, Cell, BarChart as RechartBarChart, XAxis, YAxis } from 'recharts'
import type { CategoricalChartState } from 'recharts/types/chart/types'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, cn } from 'ui'
import { useChartData } from 'hooks/useChartData'
import { useFillTimeseriesSorted } from 'hooks/analytics/useFillTimeseriesSorted'

const CHART_COLORS = {
  TICK: 'hsl(var(--background-overlay-hover))',
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
  EmptyState?: ReactNode
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
    () => [
      { attribute: 'TotalSignUps', provider: 'logs', label: 'Sign Ups', enabled: true } as any,
    ],
    []
  )

  const { data, isLoading } = useChartData({
    attributes: attributes as any,
    startDate,
    endDate,
    interval,
    data: undefined,
    enabled: true,
  })

  // Generate mock data and replace fetched data before rendering (keeps all downstream logic)
  //   const mockData = useMemo(() => {
  //     const points: any[] = []
  //     const from = dayjs(startDate)
  //     const to = dayjs(endDate)
  //     const match = interval.match(/^(\d+)([mhd])$/)
  //     const amount = match ? parseInt(match[1], 10) : 1
  //     const unitMap = { m: 'minute', h: 'hour', d: 'day' } as const
  //     const unit = match ? unitMap[match[2] as 'm' | 'h' | 'd'] : 'hour'

  //     let current = from.startOf(unit as any)
  //     let i = 0
  //     while (current.isBefore(to) || current.isSame(to)) {
  //       const wave = Math.sin(i / 3) * 6 + 6
  //       const noise = Math.random() * 3
  //       const value = Math.max(0, Math.round(wave + noise - 4))
  //       if (value > 0 && Math.random() < 0.65) {
  //         points.push({ period_start: current.toISOString(), TotalSignUps: value })
  //       }
  //       current = current.add(amount, unit as any)
  //       i++
  //     }
  //     return points
  //   }, [startDate, endDate, interval])

  const chartDataArray = Array.isArray(data) ? data : []
  const { data: filledData, isError: isFillError } = useFillTimeseriesSorted(
    chartDataArray,
    'period_start',
    attributes.map((attr: any) => attr.attribute),
    0,
    startDate,
    endDate,
    undefined,
    interval
  )
  // Prefer filled data so we always render consistent intervals, even when original data is empty
  const finalData = !isFillError ? filledData : chartDataArray

  const transformedData: UsersBarChartDatum[] = useMemo(
    () =>
      (finalData || []).map((d: any) => ({
        timestamp: d.period_start,
        count: d.TotalSignUps ?? d.count ?? 0,
      })),
    [finalData]
  )

  // Always render the chart; intervals will be filled to show empty periods as zero
  const startLabel = useMemo(() => {
    if (!transformedData.length) return ''
    return dayjs(transformedData[0]['timestamp']).format(DateTimeFormat)
  }, [transformedData, DateTimeFormat])
  const endLabel = useMemo(() => {
    if (!transformedData.length) return ''
    return dayjs(transformedData[transformedData?.length - 1]?.['timestamp']).format(DateTimeFormat)
  }, [transformedData, DateTimeFormat])

  return (
    <div
      data-testid="users-bar-chart"
      className={cn(
        'flex flex-col gap-y-3',
        className,
        isLoading && 'opacity-60 transition-opacity'
      )}
    >
      <ChartContainer
        config={
          {
            count: { label: 'New users' },
          } as ChartConfig
        }
        className="h-[80px]"
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
      {transformedData && transformedData.length > 0 && (
        <div className="text-foreground-lighter -mt-10 flex items-center justify-between text-[10px] font-mono">
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </div>
      )}
    </div>
  )
}

export default UsersBarChart
