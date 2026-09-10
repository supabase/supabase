'use client'

import dayjs from 'dayjs'
import { useTheme } from 'next-themes'
import { ReactNode, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  Cell,
  BarChart as RechartBarChart,
  ReferenceArea,
  XAxis,
  YAxis,
} from 'recharts'
import type { CategoricalChartState } from 'recharts/types/chart/types'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, cn } from 'ui'

// Applied to every bar outside the hovered column, matching the dimming
// LogsBarChart does with its muted per-series colours. Opacity is used instead
// so it works for any ChartConfig, not just hues with a hand-picked muted step.
const DIMMED_FILL_OPACITY = 0.35

const CHART_COLORS = {
  TICK: 'var(--background-overlay-hover)',
  AXIS: 'var(--background-overlay-hover)',
  BRAND: 'hsl(var(--brand-default))',
  BRAND_HOVER: 'hsl(var(--brand-500))',
}

export type ChartBarTick =
  | {
      timestamp: string
      [key: string]: string | number
    }
  | {
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

export interface ChartBarProps {
  data: ChartBarTick[]
  xKey?: string
  dataKey: string
  dataKeys?: string[]
  config?: ChartConfig
  onBarClick?: (datum: ChartBarTick, tooltipData?: CategoricalChartState) => void
  DateTimeFormat?: string
  isFullHeight?: boolean
  className?: string
  color?: string
  hoverColor?: string
  chartHighlight?: ChartHighlight
  syncId?: string
  showHighlightArea?: boolean
  cursor?: string
  showGrid?: boolean
  showYAxis?: boolean
  showXAxis?: boolean
  isStacked?: boolean
  margin?: { top?: number; right?: number; bottom?: number; left?: number }
  XAxisProps?: {
    tick?: boolean
    tickFormatter?: (value: any) => string
    height?: number
    [key: string]: any
  }
  YAxisProps?: {
    tick?: boolean
    tickFormatter?: (value: any) => string
    width?: number
    [key: string]: any
  }
}

// [Joshen] JFYI - shouldn't rely on xKey's value to determine if its a time-based format
// Preferably provide an additional param like xFormat to be more deterministic

export const ChartBar = ({
  data,
  xKey = 'timestamp',
  dataKey,
  dataKeys,
  config,
  onBarClick,
  DateTimeFormat = 'MMM D, YYYY, hh:mma',
  isFullHeight = false,
  className,
  color = CHART_COLORS.BRAND,
  hoverColor = CHART_COLORS.BRAND_HOVER,
  chartHighlight,
  syncId,
  showHighlightArea = true,
  cursor,
  showGrid = false,
  showYAxis = false,
  showXAxis = false,
  isStacked = false,
  margin: marginProp,
  XAxisProps,
  YAxisProps,
}: ChartBarProps) => {
  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme?.includes('dark')

  if (data.length === 0) {
    return null
  }

  const keysToRender = dataKeys || [dataKey]
  const isMultiSeries = keysToRender.length > 1

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

  const xAxisConfig = {
    angle: 0,
    dataKey: xKey,
    tick: showXAxis
      ? { fill: 'var(--color-foreground-lighter)', fontSize: 10, fontFamily: 'var(--font-mono)' }
      : false,
    hide: !showXAxis,
    interval: 'preserveStartEnd' as const,
    tickMargin: showXAxis ? (XAxisProps?.tickMargin ?? 4) : 0,
    height: showXAxis ? (XAxisProps?.height ?? 24) : 0,
    axisLine: { stroke: CHART_COLORS.AXIS },
    tickLine: { stroke: CHART_COLORS.AXIS },
    ...XAxisProps,
  }

  // Recharts reserves this much horizontal space for the y axis. The faux x axis
  // below is plain HTML outside the SVG, so it has to be indented by the same
  // amount to line up with where the plot actually starts.
  const yAxisWidth = showYAxis ? (YAxisProps?.width ?? 60) : 0

  const yAxisConfig = {
    tick: showYAxis
      ? { fill: 'var(--color-foreground-lighter)', fontSize: 10, fontFamily: 'var(--font-mono)' }
      : false,
    hide: !showYAxis,
    tickMargin: showYAxis ? (YAxisProps?.tickMargin ?? 4) : 0,
    width: yAxisWidth,
    axisLine: { stroke: CHART_COLORS.AXIS },
    tickLine: { stroke: CHART_COLORS.AXIS },
    ...YAxisProps,
  }

  // The faux x axis below sits outside the plot, in normal flow. Its 16px height
  // plus the column's 12px gap is subtracted from the chart so the component's
  // overall height is unchanged. Kept as a definite height rather than flex-1:
  // Recharts' ResponsiveContainer measures its parent and renders nothing if it
  // reads 0 before layout settles.
  const hasDateRangeFooter = xKey === 'timestamp' && data.length > 0

  const margin = {
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    ...marginProp,
  }

  return (
    <div
      data-testid="chart-bar"
      className={cn('flex flex-col gap-y-3 w-full', isFullHeight ? 'h-full' : 'h-24', className)}
    >
      <ChartContainer
        className={cn('w-full!', hasDateRangeFooter ? 'h-[calc(100%-28px)]' : 'h-full')}
        config={chartConfig}
      >
        <RechartBarChart
          data={data}
          syncId={syncId}
          margin={margin}
          style={{ cursor: chartCursor }}
          onMouseMove={(e: any) => {
            if (e.activeTooltipIndex !== focusDataIndex) {
              setFocusDataIndex(e.activeTooltipIndex)
            }

            if (chartHighlight) {
              const activeTimestamp = data[e.activeTooltipIndex]?.[xKey]
              chartHighlight.handleMouseMove({
                activeLabel: activeTimestamp?.toString(),
                coordinates: e.activeLabel,
              })
            }
          }}
          onMouseDown={(e: any) => {
            if (chartHighlight && e.activeTooltipIndex !== undefined) {
              const activeTimestamp = data[e.activeTooltipIndex]?.[xKey]
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
            if (onBarClick) onBarClick(datum, tooltipData)
          }}
        >
          {showGrid && <CartesianGrid vertical={false} stroke={CHART_COLORS.AXIS} />}
          <YAxis {...yAxisConfig} />
          <XAxis {...xAxisConfig} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="text-foreground-light -mt-5"
                labelFormatter={(v: string) =>
                  xKey === 'timestamp' ? dayjs(v).format(DateTimeFormat) : 'Value'
                }
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
          {isMultiSeries ? (
            keysToRender.map((key) => {
              const keyConfig = chartConfig[key]
              const barColor =
                keyConfig?.color ||
                (keyConfig?.theme
                  ? isDarkMode
                    ? keyConfig.theme.dark
                    : keyConfig.theme.light
                  : color)
              return (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={barColor}
                  maxBarSize={24}
                  stackId={isStacked ? 'stack' : undefined}
                >
                  {data.map((_entry: ChartBarTick, dataIndex: number) => (
                    <Cell
                      key={`${key}-${dataIndex}`}
                      className="cursor-pointer transition-opacity"
                      fill={barColor}
                      fillOpacity={
                        focusDataIndex === null || focusDataIndex === dataIndex
                          ? 1
                          : DIMMED_FILL_OPACITY
                      }
                    />
                  ))}
                </Bar>
              )
            })
          ) : (
            <Bar dataKey={dataKey} fill={color} maxBarSize={24}>
              {data?.map((_entry: ChartBarTick, index: number) => (
                <Cell
                  className="cursor-pointer transition-colors"
                  key={`bar-${index}`}
                  fill={focusDataIndex === index || focusDataIndex === null ? color : hoverColor}
                />
              ))}
            </Bar>
          )}
        </RechartBarChart>
      </ChartContainer>

      {hasDateRangeFooter && (
        <div
          className="text-foreground-lighter flex h-4 items-center justify-between text-[10px] font-mono"
          style={{ paddingLeft: yAxisWidth + margin.left }}
        >
          <span>{dayjs(data[0][xKey]).format(DateTimeFormat)}</span>
          <span>{dayjs(data[data.length - 1]?.[xKey]).format(DateTimeFormat)}</span>
        </div>
      )}
    </div>
  )
}
