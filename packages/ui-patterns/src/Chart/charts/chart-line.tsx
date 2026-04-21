'use client'

import dayjs from 'dayjs'
import { useTheme } from 'next-themes'
import { ReactNode, useState } from 'react'
import {
  Area,
  CartesianGrid,
  AreaChart as RechartAreaChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import type { CategoricalChartState } from 'recharts/types/chart/types'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, cn } from 'ui'

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

export type ChartReferenceLine = {
  y: number
  label?: string
  stroke?: string
  strokeWidth?: number
  strokeDasharray?: string
}

export interface ChartLineProps {
  data: ChartLineTick[]
  dataKey: string
  dataKeys?: string[]
  config?: ChartConfig
  tooltipDetails?: (datum: ChartLineTick, key: string, value: unknown) => ReactNode
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
  referenceLines?: ChartReferenceLine[]
}

export const ChartLine = ({
  data,
  dataKey,
  dataKeys,
  config,
  tooltipDetails,
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
  referenceLines,
}: ChartLineProps) => {
  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme?.includes('dark')

  if (data.length === 0) {
    return null
  }

  const keysToRender = dataKeys || [dataKey]

  const chartConfig: ChartConfig =
    config ||
    keysToRender.reduce((acc, key) => {
      acc[key] = { label: key }
      return acc
    }, {} as ChartConfig)

  const showHighlightActions =
    showHighlightArea &&
    chartHighlight?.coordinates.left &&
    chartHighlight?.coordinates.right &&
    chartHighlight?.coordinates.left !== chartHighlight?.coordinates.right

  const chartCursor = cursor || (chartHighlight ? 'crosshair' : 'default')

  const yAxisConfig = {
    tick: showYAxis,
    hide: !showYAxis,
    tickMargin: showYAxis ? (YAxisProps?.tickMargin ?? 4) : 0,
    width: showYAxis ? (YAxisProps?.width ?? undefined) : 0,
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

  const formatTooltipValue = (value: unknown) => {
    if (typeof value === 'number') {
      return YAxisProps?.tickFormatter ? YAxisProps.tickFormatter(value) : value.toLocaleString()
    }

    return String(value)
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
                formatter={(value, name, item) => {
                  const key = String(item.dataKey || name || dataKey)
                  const itemConfig = chartConfig[key]
                  const indicatorColor = item.payload.fill || item.color || color
                  const detail = tooltipDetails?.(item.payload as ChartLineTick, key, value)

                  return (
                    <>
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: indicatorColor }}
                      />
                      <div className="flex flex-1 justify-between gap-3 leading-none">
                        <div className="grid gap-1">
                          <span className="text-foreground-light">
                            {itemConfig?.label || name || key}
                          </span>
                          {detail}
                        </div>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {formatTooltipValue(value)}
                        </span>
                      </div>
                    </>
                  )
                }}
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
          {referenceLines?.map((line, index) => (
            <ReferenceLine
              key={`${line.y}-${index}`}
              y={line.y}
              stroke={line.stroke ?? CHART_COLORS.TICK}
              strokeWidth={line.strokeWidth ?? 1.5}
              strokeDasharray={line.strokeDasharray ?? '4 4'}
            />
          ))}
          {keysToRender.map((key, index) => {
            const keyConfig = chartConfig[key]
            const lineColor =
              keyConfig?.color ||
              (keyConfig?.theme
                ? isDarkMode
                  ? keyConfig.theme.dark
                  : keyConfig.theme.light
                : color)
            const baseOpacity = 0.2
            const opacityIncrement = 0.1
            const maxOpacity = 0.6
            const fillOpacity = Math.min(baseOpacity + index * opacityIncrement, maxOpacity)

            return (
              <Area
                key={key}
                type="step"
                dataKey={key}
                fill={lineColor}
                fillOpacity={fillOpacity}
                stroke={lineColor}
                strokeWidth={strokeWidth}
                stackId={`stack-${key}`}
              />
            )
          })}
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
