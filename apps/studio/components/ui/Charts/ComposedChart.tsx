'use client'

import { useState, useEffect, ComponentProps } from 'react'
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
import { cn } from 'ui'
import ChartHeader from './ChartHeader'
import ChartHighlightActions from './ChartHighlightActions'
import { CHART_COLORS, DateTimeFormats } from './Charts.constants'
import { Datum, CommonChartProps } from './Charts.types'
import { useChartSize, numberFormatter } from './Charts.utils'
import { ChartHighlight, useChartHighlight } from './useChartHighlight'
import type { UpdateDateRange } from 'pages/project/[ref]/reports/database'
import NoDataPlaceholder from './NoDataPlaceholder'

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
}

const CustomLabel = ({ active, payload, label }: TooltipProps) => {
  const data = payload && payload[0].payload
  const totalConnections = data?.read + data?.write
  const maxConnections = data?.maxDiskSpace

  const getIcon = (name: string, color: string) => {
    switch (name.toLowerCase().includes('max')) {
      case false:
        return <CustomIcon color={color} />
      default:
        return <MaxConnectionsIcon />
    }
  }

  return (
    <div className="flex flex-col gap-0 text-xs w-full h-20 mt-2">
      <div className="flex flex-col md:flex-wrap justify-start md:flex-row gap-0 md:gap-2">
        {payload?.map((entry) => (
          <p
            key={entry.name}
            className="inline-flex md:flex-col gap-1 md:gap-0 w-fit text-foreground"
          >
            <div className="flex items-center gap-1">
              {getIcon(entry.name, entry.color)}
              <span className="text-nowrap text-foreground-lighter pr-2">
                {entry.name.replace('client_connections_', '').replace('disk_iops_', '')}
              </span>
            </div>
            <div className="ml-3.5 flex items-end gap-1">
              {active && entry.value && (
                <span className="text-base">{numberFormatter(entry.value)}</span>
              )}
              {active && entry.value && !entry.name.includes('max') && (
                <span className="text-[11px] text-foreground-light mb-0.5">
                  ({((entry.value / maxConnections) * 100).toFixed(1)}%)
                </span>
              )}
            </div>
          </p>
        ))}
        {active ? (
          <p className="flex md:flex-col gap-1 md:gap-0 text-foreground font-semibold">
            <span className="flex-grow text-foreground-lighter">Total</span>
            <div className="flex items-end gap-1">
              <span className="text-base">{totalConnections}</span>
              <span className="text-[11px] text-foreground-light mb-0.5">
                ({((totalConnections / maxConnections) * 100).toFixed(1)}%)
              </span>
            </div>
          </p>
        ) : null}
      </div>
      {active && (
        <h5 className="text-foreground-lighter text-xs mt-2">
          {dayjs(label).format('DD MMM YYYY, HH:mm:ss')}
        </h5>
      )}
    </div>
  )
}

type Payload = {
  value: string
  color: string
}

interface CustomLegendProps {
  payload?: Array<Payload>
}

const CustomLegend = (props: any) => {
  const { payload } = props

  if (!payload) return null

  return (
    <ul className="flex justify-center items-center space-x-4 mt-4 select-none text-xs">
      {payload.map((entry: Payload, index: number) => (
        <li key={`item-${index}`} className="flex items-center">
          {entry.value === 'Max Connections' ? (
            <MaxConnectionsIcon />
          ) : (
            <CustomIcon color={entry.color} />
          )}
          <span className="ml-2 text-foreground-lighter">{entry.value}</span>
        </li>
      ))}
    </ul>
  )
}

interface ChartDataPoint {
  timestamp: number
  read: number
  write: number
  maxDiskSpace: number
}

export interface BarChartProps<D = Datum> extends CommonChartProps<D> {
  yAxisKey: string
  xAxisKey: string
  // customDateFormat?: string
  // data: any
  displayDateInUtc?: boolean
  onBarClick?: (datum: Datum, tooltipData?: CategoricalChartState) => void
  emptyStateMessage?: string
  showLegend?: boolean
  xAxisIsDate?: boolean
  XAxisProps?: ComponentProps<typeof XAxis>
  YAxisProps?: ComponentProps<typeof YAxis>
  showGrid?: boolean
  chartHighlight?: ChartHighlight
  // hideChartType?: boolean
  chartStyle?: string
  onChartStyleChange?: (style: string) => void
  updateDateRange: UpdateDateRange
  // initialData?: ChartDataPoint[]
}
const STACKED_CHART_COLORS = [
  '#3ECF8E',
  '#28604A',
  '#1D3F32',
  '#318362',
  '#59D69E',
  '#39A878',
  '#8FE4BE',
  '#74DDAE',
  '#C5F1DD',
  '#AAEACD',
  '#E0F8ED',
]

export default function ComposedChart({
  // initialData,
  data,
  yAxisKey,
  xAxisKey,
  format,
  customDateFormat = DateTimeFormats.FULL,
  title,
  highlightedValue,
  highlightedLabel,
  displayDateInUtc,
  // minimalHeader,
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
  chartHighlight,
  // hideChartType,
  chartStyle,
  onChartStyleChange,
  updateDateRange,
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

  const attributes = data
    ? Object.entries(data[0])
        .map(([key, value], index) => ({
          name: key,
          value: value,
          color: STACKED_CHART_COLORS[index],
        }))
        .filter((att) => att.name !== 'timestamp')
    : []
  console.log('ComposedChart attributes', attributes)

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

  const defaultPayload = attributes

  return (
    <div className={cn('flex flex-col gap-y-3', className)}>
      <ChartHeader
        title={title}
        format={format}
        customDateFormat={customDateFormat}
        highlightedValue={
          <CustomLabel
            active={!!resolvedHighlightedLabel}
            payload={_activePayload || defaultPayload}
            label={resolvedHighlightedValue}
          />
        }
        highlightedLabel={''}
        // minimalHeader
        chartHighlight={chartHighlight}
        // hideChartType={hideChartType}
        chartStyle={chartStyle}
        onChartStyleChange={onChartStyleChange}
      />
      <Container className="relative">
        <RechartComposedChart
          className="overflow-visible"
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
            axisLine={{ stroke: CHART_COLORS.AXIS }}
            tickLine={{ stroke: CHART_COLORS.AXIS }}
            key={yAxisKey}
          />
          <XAxis
            {..._XAxisProps}
            axisLine={{ stroke: CHART_COLORS.AXIS }}
            tickLine={{ stroke: CHART_COLORS.AXIS }}
            key={xAxisKey}
          />
          <Tooltip content={() => null} />
          {attributes
            .filter((attribute) => attribute.name.includes('max'))
            .map((attribute) => (
              <Line
                key={attribute.name}
                type="stepAfter"
                dataKey={attribute.name}
                stroke={STACKED_CHART_COLORS[0]}
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                name={attribute.name}
              />
            ))}
          {chartStyle === 'bar'
            ? attributes.map((attribute) => (
                <Bar
                  key={attribute.name}
                  dataKey={attribute.name}
                  stackId="1"
                  fill={attribute.color}
                  name={attribute.name}
                />
              ))
            : attributes.map((attribute) => (
                <Area
                  key={attribute.name}
                  type="step"
                  dataKey={attribute.name}
                  stackId="1"
                  fill={attribute.color}
                  strokeOpacity={0.5}
                  stroke={attribute.color}
                  fillOpacity={0.25}
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
