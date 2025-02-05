'use client'

/**
 * External dependencies for date handling, React core, and charting
 */
import dayjs from 'dayjs'
import { ReactNode, useState } from 'react'
import { Bar, Cell, BarChart as RechartBarChart, XAxis, YAxis } from 'recharts'
import type { CategoricalChartState } from 'recharts/types/chart/types'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, cn } from 'ui'

/**
 * Color constants for the chart elements using CSS variables
 * Includes colors for ticks, axes, and different states (success, warning, error)
 */
const CHART_COLORS = {
  TICK: 'hsl(var(--background-overlay-hover))',
  AXIS: 'hsl(var(--background-overlay-hover))',
  GREEN_1: 'hsl(var(--brand-default))',
  GREEN_2: 'hsl(var(--brand-500))',
  YELLOW_1: 'hsl(var(--warning-default))',
  YELLOW_2: 'hsl(var(--warning-500))',
  RED_1: 'hsl(var(--destructive-default))',
  RED_2: 'hsl(var(--destructive-500))',
}
/**
 * Type definition for a single data point in the logs chart
 * @property timestamp - The time when the log entry was recorded
 * @property error_count - Number of error logs
 * @property warning_count - Number of warning logs
 * @property ok_count - Number of successful logs
 */
type LogsBarChartDatum = {
  timestamp: string
  error_count: number
  warning_count: number
  ok_count: number
}
/**
 * LogsBarChart Component
 * Renders a stacked bar chart showing the distribution of log types (error, warning, ok)
 * over time. Supports hover interactions and click events on bars.
 *
 * @param data - Array of log data points to display
 * @param onBarClick - Optional callback function when a bar is clicked
 * @param EmptyState - Optional component to render when there's no data
 * @param DateTimeFormat - Optional date format string (default: 'MMM D, YYYY, hh:mma')
 */
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
  // Track the currently focused bar index for hover effects
const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)

  if (data.length === 0) {
    if (EmptyState) return EmptyState
    return null
  }

  // Format the start and end dates for the x-axis labels
const startDate = dayjs(data[0]['timestamp']).format(DateTimeFormat)
const endDate = dayjs(data[data?.length - 1]?.['timestamp']).format(DateTimeFormat)

  return (
    <div className={cn('flex flex-col gap-y-3')}>
      {/* Chart container with configuration for different log types */}
      <ChartContainer
        config={
          {
            error_count: {
              label: 'Errors',
            },
            warning_count: {
              label: 'Warnings',
            },
            ok_count: {
              label: 'Ok',
            },
          } satisfies ChartConfig
        }
        className="h-[80px]"
      >
        {/* Main bar chart component with mouse interaction handlers */}
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
          {/* Y-axis configuration - hidden ticks for cleaner look */}
          <YAxis
            tick={false}
            width={0}
            axisLine={{ stroke: CHART_COLORS.AXIS }}
            tickLine={{ stroke: CHART_COLORS.AXIS }}
          />
          {/* X-axis configuration - shows timeline of logs */}
          <XAxis
            dataKey="timestamp"
            interval={data.length - 2}
            tick={false}
            axisLine={{ stroke: CHART_COLORS.AXIS }}
            tickLine={{ stroke: CHART_COLORS.AXIS }}
          />
          {/* Custom tooltip showing detailed information on hover */}
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="text-foreground-light"
                labelFormatter={(v) => dayjs(v).format(DateTimeFormat)}
              />
            }
          />

          {/* Error bars - Stacked bar section showing error logs */}
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

          {/* Warning bars - Stacked bar section showing warning logs */}
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

          {/* Success bars - Stacked bar section showing successful logs */}
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
      {/* Time range display showing start and end dates */}
      {data && (
        <div className="text-foreground-lighter -mt-10 flex items-center justify-between text-[10px] font-mono">
          <span>{startDate}</span>
          <span>{endDate}</span>
        </div>
      )}
    </div>
  )
}
