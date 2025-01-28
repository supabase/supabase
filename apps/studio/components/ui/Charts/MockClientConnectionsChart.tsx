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

// Function to generate mock data
const generateMockData = (startTime: dayjs.Dayjs, endTime: dayjs.Dayjs) => {
  const data = []
  let maxConnections = 60
  let currentTime = startTime
  const midpoint = startTime.add(endTime.diff(startTime) / 2, 'millisecond')

  while (currentTime.isBefore(endTime) || currentTime.isSame(endTime)) {
    if (currentTime.isAfter(midpoint) || currentTime.isSame(midpoint)) {
      maxConnections = 120
    }

    const totalConnections = Math.floor(maxConnections * 0.75 + Math.random() * 2)
    const postgres = 6 + Math.floor(Math.random() * 1.25)
    const supavisor = currentTime.isAfter(midpoint.add(10, 'minutes'))
      ? 25
      : 15 + Math.floor(Math.random() * 1.25)
    const realtime = currentTime.isAfter(midpoint.add(10, 'minutes'))
      ? 56
      : currentTime.isAfter(midpoint.subtract(10, 'minutes'))
        ? 32
        : 6 + Math.floor(Math.random() * 1.25)

    data.push({
      timestamp: currentTime.valueOf(),
      postgres,
      supavisor,
      realtime,
      maxConnections,
    })

    currentTime = currentTime.add(1, 'minute')
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
  const totalConnections = data?.postgres + data?.supavisor + data?.realtime
  const maxConnections = data?.maxConnections

  const getIcon = (name: string, color: string) => {
    switch (name) {
      case 'Postgres':
      case 'Supavisor':
      case 'Realtime':
        return <CustomIcon color={color} />
      case 'Max Connections':
        return <MaxConnectionsIcon />
      default:
        return null
    }
  }

  const orderedPayload = payload ? [...payload].reverse() : []

  return (
    <div className="flex flex-col gap-0 text-xs w-full h-20 mt-2">
      <div className="flex flex-col md:flex-row gap-0 md:gap-4">
        {orderedPayload.map((entry) => (
          <p key={entry.name} className="flex items-center w-full text-foreground-lighter">
            {getIcon(entry.name, entry.color)}
            <span className="ml-2 text-nowrap flex-grow">{entry.name}</span>
            {active && entry.value && <span className="ml-1 text-foreground">{entry.value}</span>}
            {active && entry.value && entry.name !== 'Max Connections' && (
              <span className="ml-1">({((entry.value / maxConnections) * 100).toFixed(1)}%)</span>
            )}
          </p>
        ))}
        {active ? (
          <p className="flex items-center text-foreground gap-2">
            <span className="flex-grow">Total</span>
            <span className="text-nowrap">
              {totalConnections} ({((totalConnections / maxConnections) * 100).toFixed(1)}%)
            </span>
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
  postgres: number
  supavisor: number
  realtime: number
  maxConnections: number
}

export interface BarChartProps<D = Datum> extends CommonChartProps<D> {
  yAxisKey: string
  xAxisKey: string
  // customDateFormat?: string
  displayDateInUtc?: boolean
  onBarClick?: (datum: Datum, tooltipData?: CategoricalChartState) => void
  // emptyStateMessage?: string
  showLegend?: boolean
  xAxisIsDate?: boolean
  XAxisProps?: ComponentProps<typeof XAxis>
  YAxisProps?: ComponentProps<typeof YAxis>
  showGrid?: boolean
  chartHighlight?: ChartHighlight
  // hideChartType?: boolean
  chartStyle?: string
  onChartStyleChange?: (style: string) => void
  // initialData?: ChartDataPoint[]
}

export default function DatabaseConnectionsChart({
  // initialData,
  data,
  yAxisKey,
  xAxisKey,
  format,
  customDateFormat = DateTimeFormats.FULL,
  // title,
  highlightedValue,
  highlightedLabel,
  displayDateInUtc,
  // minimalHeader,
  valuePrecision,
  className = '',
  size = 'normal',
  // emptyStateMessage,
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
      const total = d.postgres + d.supavisor + d.realtime
      if (total > top) top = total
      if (total < bottom) bottom = total
    })

    return [bottom, Math.max(top, 70)]
  }

  const chartConfig = {
    postgres: {
      label: 'Postgres',
      color: '#4E8967',
    },
    supavisor: {
      label: 'Supavisor',
      color: '#3ECF8E',
    },
    realtime: {
      label: 'Realtime',
      color: '#7DDEB1',
    },
    maxConnections: {
      label: 'Max Connections',
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

  // if (data.length === 0) {
  //   return (
  //     <NoDataPlaceholder
  //       message={emptyStateMessage}
  //       description="It may take up to 24 hours for data to refresh"
  //       size={size}
  //       className={className}
  //       attribute={title}
  //       format={format}
  //     />
  //   )
  // }

  const defaultPayload = Object.values(chartConfig).map((d) => ({
    name: d.label,
    color: d.color,
  }))

  return (
    <div className={cn('flex flex-col gap-y-3', className)}>
      <ChartHeader
        title={'Client Connections'}
        format={format}
        customDateFormat={customDateFormat}
        highlightedValue={
          <CustomLabel
            active={!!resolvedHighlightedLabel}
            payload={_activePayload || defaultPayload}
            label={resolvedHighlightedValue}
          />
        }
        // highlightedLabel={resolvedHighlightedValue}
        // minimalHeader
        chartHighlight={chartHighlight}
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
            const activeTimestamp = data[e.activeTooltipIndex]?.[xAxisKey]
            chartHighlight?.handleMouseMove({
              activeLabel: activeTimestamp?.toString(),
              coordinates: e.activeLabel,
            })
          }}
          onMouseDown={(e: any) => {
            const activeTimestamp = data[e.activeTooltipIndex]?.[xAxisKey]
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
          <Legend content={CustomLegend} />
          {chartStyle === 'bar' ? (
            <>
              <Bar
                dataKey="postgres"
                stackId="1"
                fill={chartConfig.postgres.color}
                name="Postgres"
              />
              <Bar
                dataKey="supavisor"
                stackId="1"
                fill={chartConfig.supavisor.color}
                name="Supavisor"
              />
              <Bar
                dataKey="realtime"
                stackId="1"
                fill={chartConfig.realtime.color}
                name="Realtime"
              />
            </>
          ) : (
            <>
              <Area
                dataKey="postgres"
                stackId="1"
                fill={chartConfig.postgres.color}
                strokeOpacity={0.5}
                stroke={chartConfig.postgres.color}
                fillOpacity={0.5}
                name="Postgres"
              />
              <Area
                dataKey="supavisor"
                stackId="1"
                stroke={chartConfig.supavisor.color}
                fill={chartConfig.supavisor.color}
                strokeOpacity={0.5}
                fillOpacity={0.5}
                name="Supavisor"
              />
              <Area
                dataKey="realtime"
                stackId="1"
                stroke={chartConfig.realtime.color}
                fill={chartConfig.realtime.color}
                strokeOpacity={0.5}
                fillOpacity={0.5}
                name="Realtime"
              />
            </>
          )}
          <Line
            type="stepAfter"
            dataKey="maxConnections"
            stroke={chartConfig.maxConnections.color}
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={false}
            name="Max Connections"
          />
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
        <ChartHighlightActions chartHighlight={chartHighlight} />
      </Container>
      {_data && (
        <div className="text-foreground-lighter -mt-9 flex items-center justify-between text-xs">
          <span>
            {xAxisIsDate ? day(data[0][xAxisKey]).format(customDateFormat) : data[0][xAxisKey]}
          </span>
          <span>
            {xAxisIsDate
              ? day(data[data?.length - 1]?.[xAxisKey]).format(customDateFormat)
              : data[data?.length - 1]?.[xAxisKey]}
          </span>
        </div>
      )}
    </div>
  )
}
