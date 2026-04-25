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
  YELLOW_1: 'hsl(var(--warning-default))',
  YELLOW_2: 'hsl(var(--warning-500))',
}

type LogsBarChartDatum = {
  timestamp: string
  error_count: number
  ok_count: number
  warning_count: number
}

export const LogsBarChart = ({
  data,
  onBarClick,
  EmptyState,
  DateTimeFormat = 'MMM D, YYYY, hh:mma',
  isFullHeight = false,
  chartConfig,
  hideZeroValues = false,
}: {
  data: LogsBarChartDatum[]
  onBarClick?: (datum: LogsBarChartDatum, tooltipData?: CategoricalChartState) => void
  EmptyState?: ReactNode
  DateTimeFormat?: string
  isFullHeight?: boolean
  chartConfig?: ChartConfig
  hideZeroValues?: boolean
}) => {
  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)

  if (data.length === 0) {
    if (EmptyState) return EmptyState
    return null
  }

  const startDate = dayjs(data[0]['timestamp']).format(DateTimeFormat)
  const endDate = dayjs(data[data?.length - 1]?.['timestamp']).format(DateTimeFormat)

  const defaultChartConfig = {
    error_count: {
      label: 'Errors',
    },
    ok_count: {
      label: 'Ok',
    },
    warning_count: {
      label: 'Warnings',
    },
  } satisfies ChartConfig

  return (
    <div
      data-testid="logs-bar-chart"
      className={cn('flex flex-col gap-y-3', isFullHeight ? 'h-full' : 'h-24')}
    >
      <ChartContainer className="h-full" config={chartConfig ?? defaultChartConfig}>
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
            animationDuration={0}
            position={{ y: 16 }}
            content={(props) => {
              if (!props.active || !props.payload || props.payload.length === 0) {
                return null
              }

              // Filter payload based on hideZeroValues
              const filteredPayload = hideZeroValues
                ? props.payload.filter((item) => Number(item.value) !== 0)
                : props.payload

              // Don't show tooltip if all values are filtered out
              if (filteredPayload.length === 0) {
                return null
              }

              return (
                <ChartTooltipContent
                  active={props.active}
                  payload={filteredPayload}
                  label={props.label}
                  className="text-foreground-light -mt-5 !transition-none"
                  labelFormatter={(v: string) => dayjs(v).format(DateTimeFormat)}
                />
              )
            }}
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

          {/* Warning bars */}
          <Bar dataKey="warning_count" fill={CHART_COLORS.YELLOW_1} maxBarSize={24} stackId="stack">
            {data?.map((_entry: LogsBarChartDatum, index: number) => (
              <Cell
                className="cursor-pointer transition-colors"
                key={`warning-${index}`}
                fill={
                  focusDataIndex === index || focusDataIndex === null
                    ? CHART_COLORS.YELLOW_1
                    : CHART_COLORS.YELLOW_2
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
