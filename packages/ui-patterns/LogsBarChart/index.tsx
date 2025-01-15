'use client'
import dayjs from 'dayjs'
import { ReactNode, useState } from 'react'
import { Bar, Cell, BarChart as RechartBarChart, XAxis, YAxis } from 'recharts'
import type { CategoricalChartState } from 'recharts/types/chart/types'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, cn } from 'ui'

const CHART_COLORS = {
  TICK: 'hsl(var(--background-overlay-hover))',
  AXIS: 'hsl(var(--background-overlay-hover))',
  GREEN_1: 'hsl(var(--brand-default))',
  GREEN_2: 'hsl(var(--brand-500))',
  RED_1: 'hsl(var(--destructive-default))',
  RED_2: 'hsl(var(--destructive-500))',
}
type LogsBarChartDatum = {
  timestamp: string
  error_count: number
  ok_count: number
}
export const LogsBarChart = ({
  data,
  onBarClick,
  EmptyState,
  DateTimeFormat = 'MMM D, YYYY, hh:mma',
}: {
  data: LogsBarChartDatum[]
  onBarClick?: (datum: LogsBarChartDatum, tooltipData?: CategoricalChartState) => void
  EmptyState?: ReactNode
  DateTimeFormat?: string
}) => {
  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)

  if (data.length === 0) {
    if (EmptyState) return EmptyState
    return null
  }

  const startDate = dayjs(data[0]['timestamp']).format(DateTimeFormat)
  const endDate = dayjs(data[data?.length - 1]?.['timestamp']).format(DateTimeFormat)

  return (
    <div className={cn('flex flex-col gap-y-3')}>
      <ChartContainer
        config={
          {
            error_count: {
              label: 'Errors',
            },
            ok_count: {
              label: 'Ok',
            },
          } satisfies ChartConfig
        }
        className="h-[80px]"
      >
        <RechartBarChart
          data={data}
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
            interval={data.length - 2}
            tick={false}
            axisLine={{ stroke: CHART_COLORS.AXIS }}
            tickLine={{ stroke: CHART_COLORS.AXIS }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="text-foreground-light"
                labelFormatter={(v) => dayjs(v).format(DateTimeFormat)}
              />
            }
          />

          {/* Error bars */}
          <Bar dataKey="error_count" fill={CHART_COLORS.RED_1} maxBarSize={24} stackId="stack">
            {data?.map((_entry: LogsBarChartDatum, index: number) => (
              <Cell
                className="cursor-pointer transition-colors"
                key={`error-${index}`}
                fill={
                  focusDataIndex === index || focusDataIndex === null
                    ? CHART_COLORS.RED_1
                    : CHART_COLORS.RED_2
                }
              />
            ))}
          </Bar>

          {/* Success bars */}
          <Bar dataKey="ok_count" fill={CHART_COLORS.GREEN_1} maxBarSize={24} stackId="stack">
            {data?.map((_entry: LogsBarChartDatum, index: number) => (
              <Cell
                className="cursor-pointer transition-colors"
                key={`success-${index}`}
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
      {data && (
        <div className="text-foreground-lighter -mt-10 flex items-center justify-between text-[10px] font-mono">
          <span>{startDate}</span>
          <span>{endDate}</span>
        </div>
      )}
    </div>
  )
}
