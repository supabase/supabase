'use client'

import { useState, ComponentProps, useMemo } from 'react'
import dayjs from 'dayjs'
import {
  Area,
  Bar,
  ComposedChart as RechartComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  ReferenceArea,
  Tooltip,
} from 'recharts'
import { CategoricalChartState } from 'recharts/types/chart/types'
import { cn } from 'ui'
import ChartHeader from './ChartHeader'
import ChartHighlightActions from './ChartHighlightActions'
import { CHART_COLORS, DateTimeFormats, STACKED_CHART_COLORS } from './Charts.constants'
import { Datum, CommonChartProps } from './Charts.types'
import { useChartSize, numberFormatter } from './Charts.utils'
import { ChartHighlight } from './useChartHighlight'
import type { UpdateDateRange } from 'pages/project/[ref]/reports/database'
import NoDataPlaceholder from './NoDataPlaceholder'
import { MultiAttribute } from './ComposedChartHandler'
import { CustomLabel, CustomTooltip, formatBytes } from './ComposedChart.utils'

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
  chartHighlight?: ChartHighlight
  hideChartType?: boolean
  chartStyle?: string
  onChartStyleChange?: (style: string) => void
  updateDateRange: UpdateDateRange
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
  chartHighlight,
  hideChartType,
  chartStyle,
  onChartStyleChange,
  updateDateRange,
}: BarChartProps) {
  const [_activePayload, setActivePayload] = useState<any>(null)
  const [showMaxValue, setShowMaxValue] = useState(true)
  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)

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

  const resolvedHighlightedLabel = getHeaderLabel()
  const resolvedHighlightedValue = useMemo(() => {
    if (focusDataIndex !== null) {
      // When hovering over a data point, sum all non-maxValue attributes
      const dataPoint = data[focusDataIndex]
      if (!dataPoint) return highlightedValue

      return attributes
        .filter((attr) => !attr.isMaxValue && !attr.omitFromTotal)
        .reduce((sum, attr) => sum + (Number(dataPoint[attr.attribute]) || 0), 0)
    }

    // When not hovering, use the provided highlightedValue or calculate from last data point
    if (highlightedValue !== undefined) return highlightedValue

    const lastDataPoint = Array.isArray(data) ? data[data.length - 1] : undefined
    if (!lastDataPoint) return undefined

    return attributes
      .filter((attr) => !attr.isMaxValue && !attr.omitFromTotal)
      .reduce((sum, attr) => sum + (Number(lastDataPoint[attr.attribute]) || 0), 0)
  }, [focusDataIndex, data, attributes, highlightedValue])

  const showHighlightActions =
    chartHighlight?.coordinates.left &&
    chartHighlight?.coordinates.right &&
    chartHighlight?.coordinates.left !== chartHighlight?.coordinates.right

  const maxAttribute = attributes.find((a) => a.isMaxValue)
  const percentage = useMemo(() => {
    // Only calculate percentage if we have a maxAttribute and a valid highlighted value
    if (!maxAttribute || resolvedHighlightedValue === undefined) return undefined

    // Get the current max value based on focus
    const maxValue =
      focusDataIndex !== null
        ? data[focusDataIndex]?.[maxAttribute.attribute]
        : data[data.length - 1]?.[maxAttribute.attribute]

    if (!maxValue || maxValue === 0) return undefined

    // Calculate percentage
    return typeof resolvedHighlightedValue === 'number' && typeof maxValue === 'number'
      ? (resolvedHighlightedValue / maxValue) * 100
      : undefined
  }, [maxAttribute, resolvedHighlightedValue, focusDataIndex, data])

  const maxAttributeData = {
    name: maxAttribute?.attribute,
    color: '#3ECF8E',
  }
  const chartData = data
    ? Object.entries(data[0])
        .map(([key, value], index) => ({
          name: key,
          value: value,
          color: STACKED_CHART_COLORS[index - (1 % STACKED_CHART_COLORS.length)],
        }))
        .filter((att) => att.name !== 'timestamp' && att.name !== maxAttribute?.attribute)
    : []

  const stackedAttributes = chartData.filter((att) => !att.name.includes('max'))
  const isPercentage = format === '%'
  const isRamChart = chartData?.some((att: any) => att.name.toLowerCase().includes('ram_'))

  if (Array.isArray(data) && data.length === 0) {
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
        showMaxValue={showMaxValue}
        setShowMaxValue={maxAttribute ? setShowMaxValue : undefined}
        percentage={percentage}
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
          onMouseLeave={() => {
            setFocusDataIndex(null)
            setActivePayload(null)
          }}
          onClick={(tooltipData) => {
            const datum = tooltipData?.activePayload?.[0]?.payload
            if (onBarClick) onBarClick(datum, tooltipData)
          }}
        >
          {showGrid && <CartesianGrid stroke={CHART_COLORS.AXIS} />}
          <YAxis
            {..._YAxisProps}
            hide
            domain={isPercentage ? [0, 100] : undefined}
            key={yAxisKey}
          />
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
                  radius={0.75}
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
                  radius={0.75}
                  fillOpacity={0.25}
                  name={
                    attributes?.find((a) => a.attribute === attribute.name)?.label || attribute.name
                  }
                />
              ))}
          {/* Max value, if available */}
          {maxAttribute && showMaxValue && (
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
          showMaxValue={showMaxValue}
        />
      )}
    </div>
  )
}
