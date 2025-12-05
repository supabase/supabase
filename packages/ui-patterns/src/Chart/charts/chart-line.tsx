'use client'

import { useState, ReactNode } from 'react'
import {
  Area,
  AreaChart as RechartAreaChart,
  XAxis,
  YAxis,
  ReferenceArea,
  CartesianGrid,
} from 'recharts'
import type { CategoricalChartState } from 'recharts/types/chart/types'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, cn } from 'ui'
import dayjs from 'dayjs'
import { useTheme } from 'next-themes'

const CHART_COLORS = {
  TICK: 'hsl(var(--background-overlay-hover))',
  AXIS: 'hsl(var(--background-overlay-hover))',
  BRAND: 'hsl(var(--brand-default))',
  BRAND_HOVER: 'hsl(var(--brand-500))',
}

export type ChartLineTick = {
  timestamp: string
  [key: string]: string | number
}

export type ChartHighlight = {
  handleMouseDown: (e: { activeLabel?: string; coordinates?: string }) => void
  handleMouseMove: (e: { activeLabel?: string; coordinates?: string }) => void
  handleMouseUp: (e: { chartX?: number; chartY?: number }) => void
  coordinates: { left?: string; right?: string }
  clearHighlight?: () => void
}

export type ChartHighlightAction = {
  id: string
  label: string | ((ctx: { start: string; end: string; clear: () => void }) => string)
  icon?: ReactNode
  isDisabled?: (ctx: { start: string; end: string; clear: () => void }) => boolean
  onSelect: (ctx: { start: string; end: string; clear: () => void }) => void
}

export interface ChartLineProps {
  data: ChartLineTick[]
  dataKey: string
  config?: ChartConfig
  onLineClick?: (datum: ChartLineTick, tooltipData?: CategoricalChartState) => void
  DateTimeFormat?: string
  isFullHeight?: boolean
  className?: string
  color?: string
  hoverColor?: string
  chartHighlight?: ChartHighlight
  updateDateRange?: (from: string, to: string) => void
  highlightActions?: ChartHighlightAction[]
  syncId?: string
  showHighlightArea?: boolean
  cursor?: string
  showGrid?: boolean
  showYAxis?: boolean
  YAxisProps?: {
    tick?: boolean
    tickFormatter?: (value: any) => string
    width?: number
    [key: string]: any
  }
  strokeWidth?: number
}

export const ChartLine = ({
  data,
  dataKey,
  config,
  onLineClick,
  DateTimeFormat = 'MMM D, YYYY, hh:mma',
  isFullHeight = false,
  className,
  color = CHART_COLORS.BRAND,
  hoverColor = CHART_COLORS.BRAND_HOVER,
  chartHighlight,
  updateDateRange,
  highlightActions,
  syncId,
  showHighlightArea = true,
  cursor,
  showGrid = false,
  showYAxis = false,
  YAxisProps,
  strokeWidth = 1.5,
}: ChartLineProps) => {
  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme?.includes('dark')

  if (data.length === 0) {
    return null
  }

  const chartConfig: ChartConfig = config || {
    [dataKey]: {
      label: dataKey,
    },
  }

  const showHighlightActions =
    showHighlightArea &&
    chartHighlight?.coordinates.left &&
    chartHighlight?.coordinates.right &&
    chartHighlight?.coordinates.left !== chartHighlight?.coordinates.right

  const chartCursor = cursor || (chartHighlight ? 'crosshair' : 'default')

  const yAxisConfig = {
    tick: showYAxis,
    hide: !showYAxis,
    tickMargin: showYAxis ? YAxisProps?.tickMargin ?? 4 : 0,
    width: showYAxis ? YAxisProps?.width ?? undefined : 0,
    axisLine: { stroke: CHART_COLORS.AXIS },
    tickLine: { stroke: CHART_COLORS.AXIS },
    ...YAxisProps,
  }

  const margin = {
    top: 0,
    right: 0,
    left: showYAxis ? -40 : 0,
    bottom: 0,
  }

  return (
    <div
      data-testid="chart-line"
      className={cn('flex flex-col gap-y-3 w-full', isFullHeight ? 'h-full' : 'h-24', className)}
    >
      <ChartContainer className="!w-full h-full" config={chartConfig}>
        <RechartAreaChart
          data={data}
          syncId={syncId}
          margin={margin}
          style={{ cursor: chartCursor }}
          onMouseMove={(e: any) => {
            if (e.activeTooltipIndex !== focusDataIndex) {
              setFocusDataIndex(e.activeTooltipIndex)
            }

            if (chartHighlight) {
              const activeTimestamp = data[e.activeTooltipIndex]?.timestamp
              chartHighlight.handleMouseMove({
                activeLabel: activeTimestamp?.toString(),
                coordinates: e.activeLabel,
              })
            }
          }}
          onMouseDown={(e: any) => {
            if (chartHighlight && e.activeTooltipIndex !== undefined) {
              const activeTimestamp = data[e.activeTooltipIndex]?.timestamp
              chartHighlight.handleMouseDown({
                activeLabel: activeTimestamp?.toString(),
                coordinates: e.activeLabel,
              })
            }
          }}
          onMouseUp={(e: any) => {
            if (chartHighlight) {
              chartHighlight.handleMouseUp({
                chartX: e?.chartX,
                chartY: e?.chartY,
              })
            }
          }}
          onMouseLeave={() => {
            setFocusDataIndex(null)
            if (chartHighlight?.clearHighlight) {
              chartHighlight.clearHighlight()
            }
          }}
          onClick={(tooltipData) => {
            const datum = tooltipData?.activePayload?.[0]?.payload
            if (onLineClick) onLineClick(datum, tooltipData)
          }}
        >
          {showGrid && <CartesianGrid vertical={false} stroke={CHART_COLORS.AXIS} />}
          <YAxis {...yAxisConfig} />
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
                className="text-foreground-light -mt-5"
                labelFormatter={(v: string) => dayjs(v).format(DateTimeFormat)}
              />
            }
          />
          {/* Selection highlight area */}
          {showHighlightActions && (
            <ReferenceArea
              x1={chartHighlight?.coordinates.left}
              x2={chartHighlight?.coordinates.right}
              strokeOpacity={0.5}
              stroke={isDarkMode ? '#FFFFFF' : '#0C3925'}
              fill={isDarkMode ? '#FFFFFF' : '#0C3925'}
              fillOpacity={0.2}
            />
          )}
          <Area
            type="step"
            dataKey={dataKey}
            fill={focusDataIndex !== null ? hoverColor : color}
            fillOpacity={0.1}
            stroke={focusDataIndex !== null ? hoverColor : color}
            strokeWidth={strokeWidth}
          />
        </RechartAreaChart>
      </ChartContainer>
      {data && data.length > 0 && (
        <div className="text-foreground-lighter -mt-10 flex items-center justify-between text-[10px] font-mono">
          <span>{dayjs(data[0]['timestamp']).format(DateTimeFormat)}</span>
          <span>{dayjs(data[data.length - 1]?.['timestamp']).format(DateTimeFormat)}</span>
        </div>
      )}
    </div>
  )
}
