'use client'

import { useState, ComponentProps } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Rectangle, Label } from 'recharts'
import { CHART_COLORS } from './Charts.constants'
import { CommonChartProps } from './Charts.types'
import { useChartSize, numberFormatter } from './Charts.utils'
import ChartHeader from './ChartHeader'
import NoDataPlaceholder from './NoDataPlaceholder'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from 'ui'

export interface TimelineChartDatum {
  id: string | number
  label: string
  start: number
  duration: number
  color?: string
  [key: string]: string | number | undefined
}

export interface TimelineChartProps extends Omit<CommonChartProps<any>, 'data'> {
  data?: TimelineChartDatum[]
  xAxisDomain?: [number, number]
  showGrid?: boolean
  XAxisProps?: ComponentProps<typeof XAxis>
  YAxisProps?: ComponentProps<typeof YAxis>
  labelWidth?: number
  onBarClick?: (entry: TimelineChartDatum) => void
  emptyStateMessage?: string
  barSize?: number
  barGap?: number
  barCategoryGap?: number | string
}

const TimelineChart = ({
  data = [],
  title,
  format,
  highlightedValue,
  highlightedLabel,
  valuePrecision,
  className = '',
  size = 'normal',
  emptyStateMessage,
  xAxisDomain,
  showGrid = true,
  XAxisProps,
  YAxisProps,
  labelWidth = 120,
  onBarClick,
  barSize = 20,
  barGap = 0,
  barCategoryGap = '10%',
}: TimelineChartProps) => {
  const [focusedItemId, setFocusedItemId] = useState<string | number | null>(null)

  // get largest duration value in data
  const maxDuration = Math.max(...data.map((item) => item.duration))

  if (!data || data.length === 0) {
    return <NoDataPlaceholder message={emptyStateMessage} size={size} />
  }

  // Calculate the max end time if domain not provided
  const maxEndTime = xAxisDomain
    ? xAxisDomain[1]
    : Math.max(...data.map((item) => item.start + item.duration))

  // Create chart config for the timeline bars
  const chartConfig: ChartConfig = data.reduce((config, item) => {
    config[`item-${item.id}`] = {
      label: item.label,
      color: item.color || CHART_COLORS.GREEN_1,
    }
    return config
  }, {} as ChartConfig)

  // Custom shape renderer for timeline bars
  const renderTimelineBar = (props: any) => {
    const { x, y, width, height, fill, index } = props

    // Calculate position based on start time and width based on duration
    const item = data[index]
    if (!item) return null

    const barWidth = (item.duration / maxEndTime) * width
    const barX = x + (item.start / maxEndTime) * width

    // Debug width - helps troubleshoot why text might not be showing
    console.log(`Bar ${item.label}: width=${barWidth}px, x=${barX}`)

    // Only show text if bar is wide enough (15px minimum)
    const showText = barWidth > 15

    return (
      <g>
        <Rectangle
          x={barX}
          y={y}
          width={barWidth}
          height={height}
          fill={item.color || fill}
          opacity={focusedItemId === null || focusedItemId === item.id ? 1 : 0.6}
          className={onBarClick ? 'cursor-pointer' : ''}
          rx={2}
          ry={2}
        />

        {/* Add text inside the bar if wide enough */}
        {showText && (
          <text
            x={barX + 5}
            y={y + height / 2 + 5}
            fill="white"
            fontSize={11}
            fontWeight="bold"
            className="font-mono lowercase"
            style={{
              pointerEvents: 'none',
            }}
          >
            {item.label}
          </text>
        )}
      </g>
    )
  }

  return (
    <div className={` ${className}`}>
      {title && (
        <ChartHeader
          title={title}
          format={format}
          highlightedValue={highlightedValue}
          highlightedLabel={highlightedLabel}
        />
      )}
      max duration: {maxDuration}
      <div className="overflow-x-auto">
        <ChartContainer
          config={chartConfig}
          className="w-full overflow-x-auto"
          style={{ height: `${data.length * 32}px`, width: `${maxDuration * 6}px` }}
        >
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 30, left: labelWidth, bottom: 5 }}
            barSize={barSize}
            barGap={barGap}
            barCategoryGap={barCategoryGap}
          >
            {showGrid && <CartesianGrid horizontal={false} stroke="var(--border)" />}
            <XAxis
              {...XAxisProps}
              type="number"
              domain={[0, maxEndTime]}
              tickFormatter={(value) => `${value}${format ? ' ' + format : ''}`}
              tickMargin={5}
            />
            <YAxis
              {...YAxisProps}
              type="category"
              dataKey="label"
              width={labelWidth}
              tickLine={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, entry: any) => {
                    const item = entry.payload as TimelineChartDatum
                    const formatStr = typeof format === 'string' ? format : ''
                    return (
                      <div className="grid gap-1">
                        <div className="flex justify-between">
                          <span className="text-foreground-lighter mr-2">Start:</span>
                          <span>
                            {item.start} {formatStr}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-lighter mr-2">Duration:</span>
                          <span>
                            {item.duration} {formatStr}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-lighter mr-2">End:</span>
                          <span>
                            {item.start + item.duration} {formatStr}
                          </span>
                        </div>
                      </div>
                    )
                  }}
                />
              }
            />
            <Bar
              dataKey="duration"
              shape={renderTimelineBar}
              onClick={(entry: any) => {
                onBarClick && onBarClick(entry as TimelineChartDatum)
              }}
              onMouseEnter={(entry: any) => setFocusedItemId(entry.id)}
              onMouseLeave={() => setFocusedItemId(null)}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  )
}

export default TimelineChart
