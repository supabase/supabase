'use client'

import dayjs from 'dayjs'
import { useTheme } from 'next-themes'
import { ComponentProps, useEffect, useState } from 'react'
import {
  Area,
  Bar,
  CartesianGrid,
  Line,
  ComposedChart as RechartComposedChart,
  ReferenceArea,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CategoricalChartState } from 'recharts/types/chart/types'
import { cn } from 'ui'
import ChartHeader from './ChartHeader'
import ChartHighlightActions from './ChartHighlightActions'
import {
  CHART_COLORS,
  DateTimeFormats,
  STACKED_CHART_COLORS,
  updateStackedChartColors,
} from './Charts.constants'
import { CommonChartProps, Datum } from './Charts.types'
import { numberFormatter, useChartSize } from './Charts.utils'
import {
  calculateTotalChartAggregate,
  CustomLabel,
  CustomTooltip,
  formatBytes,
} from './ComposedChart.utils'
import { MultiAttribute } from './ComposedChartHandler'
import NoDataPlaceholder from './NoDataPlaceholder'
import { ChartHighlight } from './useChartHighlight'

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
  showTotal?: boolean
  showMaxValue?: boolean
  chartHighlight?: ChartHighlight
  hideChartType?: boolean
  chartStyle?: string
  onChartStyleChange?: (style: string) => void
  updateDateRange: any
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
  showTotal = true,
  showMaxValue = false,
  chartHighlight,
  hideChartType,
  chartStyle,
  onChartStyleChange,
  updateDateRange,
}: BarChartProps) {
  const { resolvedTheme } = useTheme()
  const [_activePayload, setActivePayload] = useState<any>(null)
  const [_showMaxValue, setShowMaxValue] = useState(showMaxValue)
  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null)

  // Update chart colors when theme changes
  useEffect(() => {
    updateStackedChartColors(resolvedTheme?.includes('dark') ?? false)
  }, [resolvedTheme])

  const { Container } = useChartSize(size)

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

  const maxAttribute = attributes.find((a) => a.isMaxValue)
  const maxAttributeData = {
    name: maxAttribute?.attribute,
    color: '#3ECF8E',
  }

  const lastDataPoint = !!data[data.length - 1]
    ? Object.entries(data[data.length - 1])
        .map(([key, value]) => ({
          dataKey: key,
          value: value as number,
        }))
        .filter((entry) => entry.dataKey !== 'timestamp')
    : undefined

  const resolvedHighlightedLabel = getHeaderLabel()
  const resolvedHighlightedValue =
    focusDataIndex !== null
      ? showTotal
        ? calculateTotalChartAggregate(
            _activePayload,
            maxAttribute?.attribute ? [maxAttribute?.attribute] : []
          )
        : data[focusDataIndex]?.[yAxisKey]
      : showTotal && lastDataPoint
        ? calculateTotalChartAggregate(
            lastDataPoint,
            maxAttribute?.attribute ? [maxAttribute?.attribute] : []
          )
        : highlightedValue

  const showHighlightActions =
    chartHighlight?.coordinates.left &&
    chartHighlight?.coordinates.right &&
    chartHighlight?.coordinates.left !== chartHighlight?.coordinates.right

  const chartData =
    data && !!data[0]
      ? Object.entries(data[0])
          ?.map(([key, value], index) => ({
            name: key,
            value: value,
            color: STACKED_CHART_COLORS[index - (1 % STACKED_CHART_COLORS.length)],
          }))
          .filter((att) => att.name !== 'timestamp' && att.name !== maxAttribute?.attribute)
      : []

  const stackedAttributes = chartData.filter((att) => !att.name.includes('max'))
  const isPercentage = format === '%'
  const isRamChart = chartData?.some((att: any) => att.name.toLowerCase().includes('ram_'))

  //*
  // Set the y-axis domain
  // to the highest value in the chart data for percentage charts
  // to vertically zoom in on the data
  // */
  const yDomain = [
    0,
    Math.max(...chartData.map((att) => (typeof att.value === 'number' ? att.value : 0))),
  ]

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
          typeof resolvedHighlightedValue === 'number'
            ? isRamChart
              ? formatBytes(resolvedHighlightedValue, valuePrecision)
              : numberFormatter(resolvedHighlightedValue, valuePrecision)
            : resolvedHighlightedValue
        }
        highlightedLabel={resolvedHighlightedLabel}
        minimalHeader={minimalHeader}
        hideChartType={hideChartType}
        chartStyle={chartStyle}
        onChartStyleChange={onChartStyleChange}
        showMaxValue={_showMaxValue}
        setShowMaxValue={maxAttribute ? setShowMaxValue : undefined}
      />
      <Container className="relative z-10">
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
          onMouseLeave={(e) => {
            setFocusDataIndex(null)
            setActivePayload(null)
          }}
          onClick={(tooltipData) => {
            const datum = tooltipData?.activePayload?.[0]?.payload
            if (onBarClick) onBarClick(datum, tooltipData)
          }}
        >
          {showGrid && <CartesianGrid stroke={CHART_COLORS.AXIS} />}
          <YAxis {..._YAxisProps} hide domain={isPercentage ? yDomain : undefined} key={yAxisKey} />
          <XAxis
            {..._XAxisProps}
            axisLine={{ stroke: CHART_COLORS.AXIS }}
            tickLine={{ stroke: CHART_COLORS.AXIS }}
            tickMargin={8}
            minTickGap={3}
            key={xAxisKey}
          />
          <Tooltip
            content={(props) =>
              showTooltip ? (
                <CustomTooltip
                  {...props}
                  isPercentage={isPercentage}
                  label={resolvedHighlightedLabel}
                  attributes={attributes}
                  valuePrecision={valuePrecision}
                  showTotal={showTotal}
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
                  fillOpacity={hoveredLabel && hoveredLabel !== attribute.name ? 0.25 : 1}
                  radius={0.75}
                  opacity={hoveredLabel && hoveredLabel !== attribute.name ? 0.5 : 1}
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
                  strokeOpacity={hoveredLabel && hoveredLabel !== attribute.name ? 0.4 : 1}
                  stroke={attribute.color}
                  radius={20}
                  animationDuration={375}
                  fillOpacity={
                    hoveredLabel && hoveredLabel !== attribute.name
                      ? 0.075
                      : hoveredLabel === attribute.name
                        ? 0.3
                        : 0.25
                  }
                  name={
                    attributes?.find((a) => a.attribute === attribute.name)?.label || attribute.name
                  }
                />
              ))}
          {/* Max value, if available */}
          {maxAttribute && _showMaxValue && (
            <Line
              key={maxAttribute.attribute}
              type="stepAfter"
              dataKey={maxAttribute.attribute}
              stroke="#3ECF8E"
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={false}
              name={maxAttribute.label}
            />
          )}
          {/* Selection highlight */}
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
      {showLegend && (
        <CustomLabel
          payload={[maxAttributeData, ...chartData]}
          attributes={attributes}
          showMaxValue={_showMaxValue}
          onLabelHover={setHoveredLabel}
        />
      )}
    </div>
  )
}
