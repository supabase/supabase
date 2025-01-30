'use client'

import { useState, useEffect, ComponentProps } from 'react'
import dayjs from 'dayjs'
import {
  Area,
  Bar,
  ComposedChart,
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

// Function to generate mock data
const generateMockData = (startTime: dayjs.Dayjs, endTime: dayjs.Dayjs) => {
  const data = []
  let currentTime = startTime
  const maxDiskSpace = 10000 // 10,000 IOps as max disk IOps

  while (currentTime.isBefore(endTime) || currentTime.isSame(endTime)) {
    const readIOps = Math.floor(Math.random() * 1000) // Random value between 0 and 1000
    const writeIOps = Math.floor(Math.random() * 1000) // Random value between 0 and 1000

    data.push({
      timestamp: currentTime.valueOf(),
      maxDiskSpace: maxDiskSpace,
      read: readIOps,
      write: writeIOps,
    })

    currentTime = currentTime.add(15, 'second')
  }

  return data
}

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
    switch (name) {
      case 'read':
      case 'write':
        return <CustomIcon color={color} />
      case 'Max Disk IOps':
        return <MaxConnectionsIcon />
      default:
        return null
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
              <span className="text-nowrap text-foreground-lighter pr-2">{entry.name}</span>
            </div>
            <div className="ml-3.5 flex items-end gap-1">
              {active && entry.value && (
                <span className="text-base">{numberFormatter(entry.value)}</span>
              )}
              {active && entry.value && entry.name !== 'Max Disk IOps' && (
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

export default function MockDiskSpaceUsedChart({
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
  const [_data, setData] = useState<ChartDataPoint[]>([])
  const [refData, setRefData] = useState<ChartDataPoint[]>([])
  const [_activePayload, setActivePayload] = useState<any>(null)
  const {
    left,
    right,
    coordinates,
    isSelecting,
    popoverPosition,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearHighlight,
  } = useChartHighlight()

  const { Container } = useChartSize(size)

  useEffect(() => {
    const endTime = dayjs()
    const startTime = endTime.subtract(1, 'hour')
    const mockData = generateMockData(startTime, endTime)
    setData(mockData)
    setRefData(mockData)
  }, [])

  const getAxisYDomain = (from: number, to: number) => {
    const refData = _data.slice(from, to)
    let [bottom, top] = [0, 0]

    refData.forEach((d) => {
      const total = d.read + d.write
      if (total > top) top = total
      if (total < bottom) bottom = total
    })

    return [bottom, Math.max(top, 70)]
  }

  const chartConfig = {
    write: {
      label: 'write',
      color: '#3ECF8E',
    },
    read: {
      label: 'read',
      color: '#2e6e2a',
    },
    maxDiskSpace: {
      label: 'Max Disk IOps',
      color: '#2BA572',
    },
  }

  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)

  // Default props
  const _XAxisProps = XAxisProps || {
    interval: _data.length - 2,
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
      return _data[focusDataIndex]?.timestamp
    }
    return (
      (focusDataIndex !== null &&
        _data &&
        _data[focusDataIndex] !== undefined &&
        day(_data[focusDataIndex].timestamp).format(customDateFormat)) ||
      highlightedLabel
    )
  }

  const resolvedHighlightedLabel = getHeaderLabel()

  const resolvedHighlightedValue =
    focusDataIndex !== null ? _data[focusDataIndex]?.timestamp : highlightedValue

  const showHighlightActions =
    chartHighlight?.coordinates.left &&
    chartHighlight?.coordinates.right &&
    chartHighlight?.coordinates.left !== chartHighlight?.coordinates.right

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

  console.log('Disk IOps mock data', _data)

  const defaultPayload = Object.values(chartConfig)
    .map((d) => ({
      name: d.label,
      color: d.color,
    }))
    .reverse()

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
        // hideChartType={hideChartType}
        chartStyle={chartStyle}
        onChartStyleChange={onChartStyleChange}
      />
      <Container className="relative">
        <ComposedChart
          className="overflow-visible"
          data={_data}
          onMouseMove={(e: any) => {
            console.log('e', e)
            if (e.activeTooltipIndex !== focusDataIndex) {
              setFocusDataIndex(e.activeTooltipIndex)
              setActivePayload(e.activePayload)
            }
            const activeTimestamp = _data[e.activeTooltipIndex]?.timestamp
            chartHighlight?.handleMouseMove({
              activeLabel: activeTimestamp?.toString(),
              coordinates: e.activeLabel,
            })
          }}
          onMouseDown={(e: any) => {
            const activeTimestamp = _data[e.activeTooltipIndex]?.timestamp
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
          {/* <Tooltip content={(props: TooltipProps) => CustomTooltip(props)} /> */}
          {/* <Tooltip content={CustomTooltip} /> */}
          {/* <Legend content={CustomLegend} /> */}
          <Line
            type="stepAfter"
            dataKey="maxDiskSpace"
            stroke={chartConfig.maxDiskSpace.color}
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={false}
            name="Max Disk IOps"
          />
          {chartStyle === 'bar' ? (
            <>
              <Bar dataKey="read" stackId="1" fill={chartConfig.read.color} name="read" />
              <Bar dataKey="write" stackId="1" fill={chartConfig.write.color} name="write" />
            </>
          ) : (
            <>
              <Area
                dataKey="read"
                stackId="1"
                fill={chartConfig.read.color}
                strokeOpacity={0.5}
                stroke={chartConfig.read.color}
                fillOpacity={0.25}
                name="read"
              />
              <Area
                dataKey="write"
                stackId="1"
                stroke={chartConfig.write.color}
                fill={chartConfig.write.color}
                strokeOpacity={0.5}
                fillOpacity={0.25}
                name="write"
              />
            </>
          )}
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
        </ComposedChart>
        <ChartHighlightActions chartHighlight={chartHighlight} updateDateRange={updateDateRange} />
      </Container>
      {_data && (
        <div className="text-foreground-lighter -mt-9 flex items-center justify-between text-xs">
          <span>
            {xAxisIsDate ? day(_data[0]?.timestamp).format(customDateFormat) : _data[0]?.timestamp}
          </span>
          <span>
            {xAxisIsDate
              ? day(_data[data?.length - 1]?.timestamp).format(customDateFormat)
              : _data[data?.length - 1]?.timestamp}
          </span>
        </div>
      )}
    </div>
  )
}
