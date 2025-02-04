'use client'

import { useState, ComponentProps } from 'react'
import dayjs from 'dayjs'
import {
  Area,
  Bar,
  ComposedChart as RechartComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Line,
  ReferenceArea,
  Tooltip,
} from 'recharts'
import { CategoricalChartState } from 'recharts/types/chart/types'
import { ChartContainer, ChartTooltip, ChartTooltipContent, cn } from 'ui'
import ChartHeader from './ChartHeader'
import ChartHighlightActions from './ChartHighlightActions'
import { CHART_COLORS, DateTimeFormats, STACKED_CHART_COLORS } from './Charts.constants'
import { Datum, CommonChartProps } from './Charts.types'
import { useChartSize, numberFormatter } from './Charts.utils'
import { ChartHighlight } from './useChartHighlight'
import type { UpdateDateRange } from 'pages/project/[ref]/reports/database'
import NoDataPlaceholder from './NoDataPlaceholder'
import { MultiAttribute } from './ComposedChartHandler'

interface CustomIconProps {
  color: string
}

const CustomIcon = ({ color }: CustomIconProps) => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="5" cy="5" r="3" fill={color} />
  </svg>
)

const MaxConnectionsIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="2" y1="6" x2="12" y2="6" stroke="#3ECF8E" strokeWidth="2" strokeDasharray="2 2" />
  </svg>
)

interface TooltipProps {
  active?: boolean
  payload?: any[]
  label?: string | number
  attributes?: MultiAttribute[]
}

const formatLargeNumber = (num: number, precision: number = 0) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(precision)}MiB`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(precision)}KiB`
  } else {
    return num.toString()
  }
}

const CustomTooltip = ({ active, payload, label, attributes }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const totalConnections = data.postgres + data.supavisor + data.realtime
    const maxConnections = data.maxConnections

    const getIcon = (name: string, color: string) => {
      switch (name.toLowerCase().includes('max')) {
        case false:
          return <CustomIcon color={color} />
        default:
          return <MaxConnectionsIcon />
      }
    }

    const isRamChart = payload?.some((p: any) => p.name.toLowerCase().includes('ram_'))

    const LabelItem = ({ entry }: { entry: any }) => {
      const attribute = attributes?.find((a: MultiAttribute) => a.attribute === entry.name)

      return (
        <p key={entry.name} className="flex items-center w-full">
          {getIcon(entry.name, entry.color)}
          <span className="text-foreground-lighter ml-1 flex-grow">
            {attribute?.label ||
              entry.name
                .replace('client_connections_', '')
                .replace('disk_iops_', '')
                .replace('ram_usage_', '')}
          </span>
          <span className="ml-2.5">
            {isRamChart ? formatLargeNumber(entry.value, 1) : numberFormatter(entry.value)}
          </span>
          {entry.name !== 'Max Connections' && (
            <span className="ml-1">({((entry.value / maxConnections) * 100).toFixed(1)}%)</span>
          )}
        </p>
      )
    }

    return (
      <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg px-2.5 py-1.5 text-xs shadow-xl">
        <p className="font-medium">{dayjs(label).format('DD MMM YYYY, HH:mm:ss')}</p>
        <div className="grid gap-0">
          {payload.map((entry: any) => (
            <LabelItem key={entry.name} entry={entry} />
          ))}
        </div>
        {active && (
          <p className="text-foreground-lighter text-xs">
            {dayjs(label).format('DD MMM YYYY, HH:mm:ss')}
          </p>
        )}
      </div>
    )
  }

  return null
}

const CustomLabel = ({ active, payload, label, attributes }: TooltipProps) => {
  const items = payload ?? []
  const totalConnections = payload?.reduce((acc, curr) => acc + curr.value, 0)
  const maxConnections = payload?.find((p: any) => p.name.toLowerCase().includes('max'))

  const isRamChart = payload?.some((p: any) => p.name.toLowerCase().includes('ram_'))

  const getIcon = (name: string, color: string) => {
    switch (name.toLowerCase().includes('max')) {
      case false:
        return <CustomIcon color={color} />
      default:
        return <MaxConnectionsIcon />
    }
  }

  const LabelItem = ({ entry }: { entry: any }) => {
    const attribute = attributes?.find((a) => a.attribute === entry.name)

    return (
      <p key={entry.name} className="inline-flex md:flex-col gap-1 md:gap-0 w-fit text-foreground">
        <div className="flex items-center gap-1">
          {getIcon(entry.name, entry.color)}
          <span className="text-nowrap text-foreground-lighter pr-2">
            {attribute?.label ||
              entry.name
                .replace('client_connections_', '')
                .replace('disk_iops_', '')
                .replace('ram_usage_', '')}
          </span>
        </div>
        <div className="ml-3.5 flex items-end gap-1">
          {active && (
            <span className="text-base">
              {isRamChart ? formatLargeNumber(entry.value, 1) : numberFormatter(entry.value)}
            </span>
          )}
          {active &&
            !entry.name.toLowerCase().includes('max') &&
            !isNaN(entry.value / maxConnections?.value) &&
            isFinite(entry.value / maxConnections?.value) && (
              <span className="text-[11px] text-foreground-light mb-0.5">
                ({numberFormatter((entry.value / maxConnections?.value) * 100)}%)
              </span>
            )}
        </div>
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1 text-xs w-full min-h-16 mt-2">
      <div className="flex flex-col md:flex-wrap justify-start md:flex-row gap-0 md:gap-2">
        {items?.map((entry) => <LabelItem key={entry.name} entry={entry} />)}
        {active && (
          <p className="flex md:flex-col gap-1 md:gap-0 text-foreground font-semibold">
            <span className="flex-grow text-foreground-lighter">Total</span>
            <div className="flex items-end gap-1">
              <span className="text-base">
                {isRamChart
                  ? formatLargeNumber(totalConnections, 1)
                  : numberFormatter(totalConnections)}
              </span>
              {!isNaN(totalConnections / maxConnections?.value) &&
                isFinite(totalConnections / maxConnections?.value) && (
                  <span className="text-[11px] text-foreground-light mb-0.5">
                    ({numberFormatter((totalConnections / maxConnections?.value) * 100)}%)
                  </span>
                )}
            </div>
          </p>
        )}
      </div>
      {active && (
        <p className="text-foreground-lighter text-xs">
          {dayjs(label).format('DD MMM YYYY, HH:mm:ss')}
        </p>
      )}
    </div>
  )
}

export interface BarChartProps<D = Datum> extends CommonChartProps<D> {
  attributes: MultiAttribute[]
  yAxisKey: string
  xAxisKey: string
  displayDateInUtc?: boolean
  onBarClick?: (datum: Datum, tooltipData?: CategoricalChartState) => void
  emptyStateMessage?: string
  showLegend?: boolean
  xAxisIsDate?: boolean
  XAxisProps?: ComponentProps<typeof XAxis>
  YAxisProps?: ComponentProps<typeof YAxis>
  showGrid?: boolean
  showTooltip?: boolean
  chartHighlight?: ChartHighlight
  hideChartType?: boolean
  chartStyle?: string
  onChartStyleChange?: (style: string) => void
  updateDateRange: UpdateDateRange
  maxHeight?: number
}

export default function ComposedChart({
  data,
  attributes,
  yAxisKey,
  xAxisKey,
  format,
  customDateFormat = DateTimeFormats.FULL,
  title,
  highlightedValue,
  highlightedLabel,
  displayDateInUtc,
  minimalHeader,
  valuePrecision,
  className = '',
  size = 'normal',
  emptyStateMessage,
  onBarClick,
  showLegend = false,
  xAxisIsDate = true,
  XAxisProps,
  YAxisProps,
  showGrid = false,
  showTooltip = false,
  chartHighlight,
  hideChartType,
  chartStyle,
  onChartStyleChange,
  updateDateRange,
  maxHeight,
}: BarChartProps) {
  const [_activePayload, setActivePayload] = useState<any>(null)
  const { Container } = useChartSize(size)

  const getAxisYDomain = (from: number, to: number) => {
    const refData = data.slice(from, to)
    let [bottom, top] = [0, 0]

    refData.forEach((d) => {
      // const total = d.read + d.write
      const total = 0
      if (total > top) top = total
      if (total < bottom) bottom = total
    })

    return [bottom, Math.max(top, 70)]
  }

  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)

  // Default props
  const _XAxisProps = XAxisProps || {
    interval: data.length - 2,
    angle: 0,
    tick: false,
  }

  const _YAxisProps = YAxisProps || {
    tickFormatter: (value) => numberFormatter(value, valuePrecision),
    tick: false,
    width: 0,
  }

  const day = (value: number | string) => (displayDateInUtc ? dayjs(value).utc() : dayjs(value))

  function getHeaderLabel() {
    if (!xAxisIsDate) {
      if (!focusDataIndex) return highlightedLabel
      return data[focusDataIndex]?.timestamp
    }
    return (
      (focusDataIndex !== null &&
        data &&
        data[focusDataIndex] !== undefined &&
        day(data[focusDataIndex].timestamp).format(customDateFormat)) ||
      highlightedLabel
    )
  }

  const resolvedHighlightedLabel = getHeaderLabel()
  const resolvedHighlightedValue =
    focusDataIndex !== null ? data[focusDataIndex]?.timestamp : highlightedValue

  const showHighlightActions =
    chartHighlight?.coordinates.left &&
    chartHighlight?.coordinates.right &&
    chartHighlight?.coordinates.left !== chartHighlight?.coordinates.right

  const defaultAttributes = data
    ? Object.entries(data[0])
        .map(([key, value], index) => ({
          name: key,
          value: value,
          color: STACKED_CHART_COLORS[index],
        }))
        .filter((att) => att.name !== 'timestamp')
    : []

  const stackedAttributes = defaultAttributes.filter((att) => !att.name.includes('max'))
  const isPercentage = format === 'percentage'

  if (data.length === 0) {
    return (
      <NoDataPlaceholder
        message={emptyStateMessage}
        description="It may take up to 24 hours for data to refresh"
        size={size}
        className={className}
        attribute={title}
        format={format}
      />
    )
  }

  return (
    <div className={cn('flex flex-col gap-y-3', className)}>
      <ChartHeader
        title={title}
        format={format}
        customDateFormat={customDateFormat}
        highlightedValue={
          <CustomLabel
            active={!!resolvedHighlightedLabel}
            payload={_activePayload || defaultAttributes}
            label={resolvedHighlightedValue}
            attributes={attributes}
          />
        }
        highlightedLabel={''}
        minimalHeader={minimalHeader}
        hideChartType={hideChartType}
        chartStyle={chartStyle}
        onChartStyleChange={onChartStyleChange}
      />
      <Container className="relative">
        <RechartComposedChart
          data={data}
          onMouseMove={(e: any) => {
            if (e.activeTooltipIndex !== focusDataIndex) {
              setFocusDataIndex(e.activeTooltipIndex)
              setActivePayload(e.activePayload)
            }
            const activeTimestamp = data[e.activeTooltipIndex]?.timestamp
            chartHighlight?.handleMouseMove({
              activeLabel: activeTimestamp?.toString(),
              coordinates: e.activeLabel,
            })
          }}
          onMouseDown={(e: any) => {
            const activeTimestamp = data[e.activeTooltipIndex]?.timestamp
            chartHighlight?.handleMouseDown({
              activeLabel: activeTimestamp?.toString(),
              coordinates: e.activeLabel,
            })
          }}
          onMouseUp={chartHighlight?.handleMouseUp}
          onMouseLeave={() => {
            setFocusDataIndex(null)
            setActivePayload(null)
          }}
          onClick={(tooltipData) => {
            const datum = tooltipData?.activePayload?.[0]?.payload
            if (onBarClick) onBarClick(datum, tooltipData)
          }}
        >
          {showLegend && <Legend />}
          {showGrid && <CartesianGrid stroke={CHART_COLORS.AXIS} />}
          <YAxis
            {..._YAxisProps}
            // axisLine={{ stroke: CHART_COLORS.AXIS }}
            // tickLine={{ stroke: CHART_COLORS.AXIS }}
            hide
            domain={isPercentage ? [0, 100] : undefined}
            key={yAxisKey}
          />
          <XAxis
            {..._XAxisProps}
            axisLine={{ stroke: CHART_COLORS.AXIS }}
            tickLine={{ stroke: CHART_COLORS.AXIS }}
            // tickLine={false}
            // axisLine={false}
            tickMargin={8}
            minTickGap={3}
            key={xAxisKey}
          />
          <Tooltip
            content={(props) =>
              true ? (
                <CustomTooltip
                  {...props}
                  label={resolvedHighlightedValue}
                  attributes={attributes}
                />
              ) : null
            }
          />
          {chartStyle === 'bar'
            ? stackedAttributes.map((attribute) => (
                <Bar
                  key={attribute.name}
                  dataKey={attribute.name}
                  stackId="1"
                  fill={attribute.color}
                  name={
                    attributes?.find((a) => a.attribute === attribute.name)?.label || attribute.name
                  }
                />
              ))
            : stackedAttributes.map((attribute) => (
                <Area
                  key={attribute.name}
                  type="step"
                  dataKey={attribute.name}
                  stackId="1"
                  fill={attribute.color}
                  strokeOpacity={1}
                  stroke={attribute.color}
                  fillOpacity={0.25}
                  name={
                    attributes?.find((a) => a.attribute === attribute.name)?.label || attribute.name
                  }
                />
              ))}
          {defaultAttributes
            .filter((attribute) => attribute.name.includes('max'))
            .map((attribute) => (
              <Line
                key={attribute.name}
                type="stepAfter"
                dataKey={attribute.name}
                stroke="#3ECF8E"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                name={attribute.name}
              />
            ))}
          {showHighlightActions && (
            <ReferenceArea
              x1={chartHighlight?.coordinates.left}
              x2={chartHighlight?.coordinates.right}
              strokeOpacity={0.5}
              stroke="#3ECF8E"
              fill="#3ECF8E"
              fillOpacity={0.3}
            />
          )}
        </RechartComposedChart>
        <ChartHighlightActions chartHighlight={chartHighlight} updateDateRange={updateDateRange} />
      </Container>
      {data && (
        <div className="text-foreground-lighter -mt-9 flex items-center justify-between text-xs">
          <span>
            {xAxisIsDate ? day(data[0]?.timestamp).format(customDateFormat) : data[0]?.timestamp}
          </span>
          <span>
            {xAxisIsDate
              ? day(data[data?.length - 1]?.timestamp).format(customDateFormat)
              : data[data?.length - 1]?.timestamp}
          </span>
        </div>
      )}
    </div>
  )
}
