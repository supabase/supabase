import dayjs from 'dayjs'
import { formatBytes } from 'lib/helpers'
import { useTheme } from 'next-themes'
import { ComponentProps, useEffect, useState } from 'react'
import {
  Area,
  Bar,
  CartesianGrid,
  Label,
  Line,
  ComposedChart as RechartComposedChart,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  Customized,
} from 'recharts'

import { CategoricalChartState } from 'recharts/types/chart/types'
import { cn } from 'ui'
import { ChartHeader } from './ChartHeader'
import { ChartHighlightAction, ChartHighlightActions } from './ChartHighlightActions'
import {
  CHART_COLORS,
  DateTimeFormats,
  STACKED_CHART_COLORS,
  STACKED_CHART_FILLS,
  updateStackedChartColors,
} from './Charts.constants'
import { CommonChartProps, Datum } from './Charts.types'
import { formatPercentage, numberFormatter, useChartSize } from './Charts.utils'
import {
  CustomLabel,
  CustomTooltip,
  MultiAttribute,
  calculateTotalChartAggregate,
} from './ComposedChart.utils'
import NoDataPlaceholder from './NoDataPlaceholder'
import { ChartHighlight } from './useChartHighlight'
import { useChartHoverState } from './useChartHoverState'

export interface ComposedChartProps<D = Datum> extends CommonChartProps<D> {
  chartId?: string
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
  titleTooltip?: string
  hideYAxis?: boolean
  hideHighlightedValue?: boolean
  hideHighlightedLabel?: boolean
  hideHighlightArea?: boolean
  syncId?: string
  docsUrl?: string
  sql?: string
  highlightActions?: ChartHighlightAction[]
  showNewBadge?: boolean
}

interface CustomizedDotProps {
  formattedGraphicalItems?: Array<{
    props?: {
      points?: Array<{ x: number; y: number }>
      dataKey?: string
    }
    item?: {
      props?: {
        points?: Array<{ x: number; y: number }>
        dataKey?: string
      }
    }
    points?: Array<{ x: number; y: number }>
  }>
}

export function ComposedChart({
  chartId,
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
  hideYAxis,
  hideHighlightedValue,
  hideHighlightedLabel = false,
  hideHighlightArea = false,
  syncId,
  docsUrl,
  sql,
  highlightActions,
  titleTooltip,
  showNewBadge,
}: ComposedChartProps) {
  const { resolvedTheme } = useTheme()
  const { hoveredIndex, syncTooltip, setHover, clearHover } = useChartHoverState(
    syncId || 'default'
  )
  const [_activePayload, setActivePayload] = useState<any>(null)
  const [_showMaxValue, setShowMaxValue] = useState(showMaxValue)
  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)
  const [isActiveHoveredChart, setIsActiveHoveredChart] = useState(false)
  const [hiddenAttributes, setHiddenAttributes] = useState<Set<string>>(new Set())
  const isDarkMode = resolvedTheme?.includes('dark')

  useEffect(() => {
    updateStackedChartColors(isDarkMode ?? false)
  }, [isDarkMode])

  const { Container } = useChartSize(size)

  const day = (value: number | string) => (displayDateInUtc ? dayjs(value).utc() : dayjs(value))

  const formatTimestamp = (ts: unknown) => {
    if (typeof ts !== 'number' && typeof ts !== 'string') {
      return ''
    }

    if (typeof ts === 'number' && ts > 1e14) {
      return day(ts / 1000).format(customDateFormat)
    }

    return day(ts).format(customDateFormat)
  }

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

  function getHeaderLabel() {
    if (!xAxisIsDate) {
      if (!focusDataIndex) return highlightedLabel
      return data[focusDataIndex]?.[xAxisKey]
    }
    return (
      (focusDataIndex !== null &&
        data &&
        data[focusDataIndex] !== undefined &&
        (() => {
          const ts = data[focusDataIndex][xAxisKey]
          return formatTimestamp(ts)
        })()) ||
      highlightedLabel
    )
  }

  function formatHighlightedValue(value: any) {
    if (typeof value !== 'number') {
      return value
    }

    if (shouldFormatBytes) {
      const bytesValue = isNetworkChart ? Math.abs(value) : value
      const formatted = formatBytes(bytesValue, valuePrecision)
      return format === 'bytes-per-second' ? `${formatted}/s` : formatted
    }

    if (format === '%') {
      return formatPercentage(value, valuePrecision)
    }

    if (valuePrecision === 0 && value > 0 && value < 1) {
      return '<1'
    }

    return numberFormatter(value, valuePrecision)
  }

  function computeHighlightedValue() {
    const referenceLines = attributes.filter(
      (attribute) => attribute?.provider === 'reference-line'
    )

    const attributesToIgnore =
      attributes?.filter((a) => a.omitFromTotal)?.map((a) => a.attribute) ?? []
    const attributesToIgnoreFromTotal = [
      ...attributesToIgnore,
      ...(referenceLines?.map((a: MultiAttribute) => a.attribute) ?? []),
      ...(maxAttribute?.attribute ? [maxAttribute?.attribute] : []),
      ...Array.from(hiddenAttributes),
    ]

    const lastDataPoint = data[data.length - 1]
      ? Object.entries(data[data.length - 1])
          .map(([key, value]) => ({
            dataKey: key,
            value: value as number,
          }))
          .filter(
            (entry) =>
              entry.dataKey !== 'timestamp' &&
              entry.dataKey !== 'period_start' &&
              attributes.some((attr) => attr.attribute === entry.dataKey && attr.enabled !== false)
          )
      : undefined

    if (focusDataIndex !== null) {
      return showTotal
        ? calculateTotalChartAggregate(_activePayload, attributesToIgnoreFromTotal)
        : data[focusDataIndex]?.[yAxisKey]
    }

    if (showTotal && lastDataPoint) {
      return calculateTotalChartAggregate(lastDataPoint, attributesToIgnoreFromTotal)
    }

    return highlightedValue
  }

  const maxAttribute = attributes.find((a) => a.isMaxValue)
  const maxAttributeData = {
    name: maxAttribute?.attribute,
    color: CHART_COLORS.REFERENCE_LINE,
  }

  const referenceLines = attributes.filter((attribute) => {
    return attribute?.provider === 'reference-line'
  })

  const resolvedHighlightedLabel = getHeaderLabel()

  const resolvedHighlightedValue = computeHighlightedValue()

  const showHighlightActions =
    chartHighlight?.coordinates.left &&
    chartHighlight?.coordinates.right &&
    chartHighlight?.coordinates.left !== chartHighlight?.coordinates.right

  const chartData =
    data && !!data[0]
      ? Object.entries(data[0])
          ?.map(([key, value]) => ({
            name: key,
            value: value,
          }))
          .filter(
            (att) =>
              att.name !== 'timestamp' &&
              att.name !== 'period_start' &&
              att.name !== maxAttribute?.attribute &&
              !referenceLines.map((a) => a.attribute).includes(att.name) &&
              attributes.some((attr) => attr.attribute === att.name && attr.enabled !== false)
          )
          .map((att, index) => {
            const attribute = attributes.find((attr) => attr.attribute === att.name)
            return {
              ...att,
              color: attribute?.color
                ? isDarkMode
                  ? attribute.color.dark
                  : attribute.color.light
                : STACKED_CHART_COLORS[index % STACKED_CHART_COLORS.length],
              fill: attribute?.fill
                ? isDarkMode
                  ? attribute.fill.dark
                  : attribute.fill.light
                : STACKED_CHART_FILLS[index % STACKED_CHART_FILLS.length],
            }
          })
      : []

  const stackedAttributes = chartData.filter((att) => {
    const attribute = attributes.find((attr) => attr.attribute === att.name)
    return !attribute?.isMaxValue
  })

  const visibleAttributes = stackedAttributes.filter((att) => !hiddenAttributes.has(att.name))

  const isPercentage = format === '%'
  const isRamChart =
    !chartData?.some((att: any) => att.name.toLowerCase() === 'ram_usage') &&
    chartData?.some((att: any) => att.name.toLowerCase().includes('ram_'))
  const isDiskSpaceChart = chartData?.some((att: any) =>
    att.name.toLowerCase().includes('disk_space_')
  )
  const isDBSizeChart = chartData?.some((att: any) =>
    att.name.toLowerCase().includes('pg_database_size')
  )
  const isNetworkChart = chartData?.some((att: any) => att.name.toLowerCase().includes('network_'))
  const isBytesFormat = format === 'bytes' || format === 'bytes-per-second'
  const shouldFormatBytes =
    isBytesFormat || isRamChart || isDiskSpaceChart || isDBSizeChart || isNetworkChart
  //*
  // Set the y-axis domain
  // to the highest value in the chart data for percentage charts
  // to vertically zoom in on the data
  // */
  const yMaxFromVisible = Math.max(
    0,
    ...visibleAttributes.map((att) => (typeof att.value === 'number' ? att.value : 0))
  )
  const yDomain = [0, yMaxFromVisible]

  if (data.length === 0) {
    return (
      <NoDataPlaceholder
        hideTotalPlaceholder={highlightedValue === undefined}
        message={emptyStateMessage}
        description="It may take up to 24 hours for data to refresh"
        size={size}
        className={className}
        attribute={title}
        format={format}
        titleTooltip={titleTooltip}
      />
    )
  }

  return (
    <div className={cn('flex flex-col gap-y-3', className)}>
      <ChartHeader
        hideHighlightedValue={hideHighlightedValue}
        title={title}
        showNewBadge={showNewBadge}
        format={format}
        hideHighlightedLabel={hideHighlightedLabel}
        hideHighlightArea={hideHighlightArea}
        titleTooltip={titleTooltip}
        customDateFormat={customDateFormat}
        highlightedValue={formatHighlightedValue(resolvedHighlightedValue)}
        highlightedLabel={resolvedHighlightedLabel}
        minimalHeader={minimalHeader}
        hideChartType={hideChartType}
        chartStyle={chartStyle}
        onChartStyleChange={onChartStyleChange}
        showMaxValue={_showMaxValue}
        setShowMaxValue={maxAttribute ? setShowMaxValue : undefined}
        docsUrl={docsUrl}
        syncId={syncId}
        data={data}
        xAxisKey={xAxisKey}
        yAxisKey={yAxisKey}
        xAxisIsDate={xAxisIsDate}
        displayDateInUtc={displayDateInUtc}
        valuePrecision={valuePrecision}
        shouldFormatBytes={shouldFormatBytes}
        isNetworkChart={isNetworkChart}
        attributes={attributes}
        sql={sql}
      />
      <Container className="relative z-10">
        <RechartComposedChart
          data={data}
          syncId={syncId}
          style={{ cursor: 'crosshair' }}
          onMouseMove={({ activeLabel, activeTooltipIndex, activePayload }) => {
            if (!activeTooltipIndex) return

            setIsActiveHoveredChart(true)
            if (activeTooltipIndex !== focusDataIndex) {
              setFocusDataIndex(activeTooltipIndex)
              setActivePayload(activePayload ?? [])
            }

            setHover(activeTooltipIndex)

            const activeTimestamp = data[activeTooltipIndex]?.timestamp
            chartHighlight?.handleMouseMove({
              activeLabel: activeTimestamp?.toString(),
              coordinates: activeLabel,
            })
          }}
          onMouseDown={({ activeLabel, activeTooltipIndex }) => {
            if (!activeTooltipIndex) return

            const activeTimestamp = data[activeTooltipIndex]?.timestamp
            chartHighlight?.handleMouseDown({
              activeLabel: activeTimestamp?.toString(),
              coordinates: activeLabel,
            })
          }}
          onMouseUp={chartHighlight?.handleMouseUp}
          onMouseLeave={() => {
            setIsActiveHoveredChart(false)
            setFocusDataIndex(null)
            setActivePayload(null)

            clearHover()
          }}
          onClick={(tooltipData) => {
            const datum = tooltipData?.activePayload?.[0]?.payload
            if (onBarClick) onBarClick(datum, tooltipData)
          }}
        >
          {showGrid && <CartesianGrid stroke={CHART_COLORS.AXIS} />}
          <YAxis
            {..._YAxisProps}
            hide={hideYAxis}
            axisLine={{ stroke: CHART_COLORS.AXIS }}
            tickLine={{ stroke: CHART_COLORS.AXIS }}
            domain={isPercentage && !showMaxValue ? yDomain : ['auto', 'auto']}
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

          <defs>
            {visibleAttributes.map((attribute) => (
              <linearGradient
                key={`gradient-${attribute.name}`}
                id={`gradient-${attribute.name}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={attribute.color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={isDarkMode ? '#131313' : '#FFFFFF'} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          {chartStyle === 'bar'
            ? visibleAttributes.map((attribute) => (
                <Bar
                  key={attribute.name}
                  dataKey={attribute.name}
                  stackId={attributes?.find((a) => a.attribute === attribute?.name)?.stackId ?? '1'}
                  fill={attribute.color}
                  radius={0.75}
                  opacity={1}
                  name={
                    attributes?.find((a) => a.attribute === attribute?.name)?.label ||
                    attribute?.name
                  }
                  maxBarSize={24}
                />
              ))
            : visibleAttributes.map((attribute, i) => (
                <Area
                  key={attribute.name}
                  type="linear"
                  dataKey={attribute.name}
                  stackId="1"
                  fill={`url(#gradient-${attribute.name})`}
                  fillOpacity={1}
                  stroke={attribute.color}
                  radius={20}
                  animationDuration={375}
                  name={
                    attributes?.find((a) => a.attribute === attribute.name)?.label || attribute.name
                  }
                  dot={false}
                  activeDot={false}
                />
              ))}
          {/* Max value, if available */}
          {maxAttribute && _showMaxValue && (
            <Line
              key={maxAttribute.attribute}
              type="linear"
              dataKey={maxAttribute.attribute}
              stroke={CHART_COLORS.REFERENCE_LINE}
              strokeWidth={2}
              strokeDasharray={maxAttribute.strokeDasharray ?? '3 3'}
              dot={false}
              name={maxAttribute.label}
            />
          )}
          {referenceLines
            .filter((line) => {
              return line.isReferenceLine
            })
            .map((line) => (
              <ReferenceLine
                key={line.attribute}
                y={line.value}
                strokeWidth={1}
                stroke={isDarkMode ? line.color?.dark : line.color?.light}
                strokeDasharray={line.strokeDasharray ?? '3 3'}
                label={undefined}
              >
                <Label
                  value={line.label}
                  position="insideTopRight"
                  fill={CHART_COLORS.REFERENCE_LINE_TEXT}
                  className="text-xs"
                  style={{ fill: CHART_COLORS.REFERENCE_LINE_TEXT }}
                />
              </ReferenceLine>
            ))}

          {/* Selection highlight */}
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
          <Tooltip
            content={(props) =>
              showTooltip && !showHighlightActions ? (
                <CustomTooltip
                  {...props}
                  format={format}
                  isPercentage={isPercentage}
                  label={resolvedHighlightedLabel}
                  attributes={attributes}
                  valuePrecision={valuePrecision}
                  showTotal={showTotal}
                  isActiveHoveredChart={
                    isActiveHoveredChart || (!!syncId && syncTooltip && hoveredIndex !== null)
                  }
                />
              ) : null
            }
            cursor={{
              stroke: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
              strokeWidth: 1,
            }}
          />
          <Customized
            component={(props: CustomizedDotProps) => {
              const { formattedGraphicalItems } = props
              if (!formattedGraphicalItems || focusDataIndex === null) return null

              return (
                <g>
                  {formattedGraphicalItems.map((item, index: number) => {
                    const points = item.props?.points || item.item?.props?.points || item.points
                    const dataKey = item.props?.dataKey || item.item?.props?.dataKey

                    if (!points || !points[focusDataIndex]) return null

                    const point = points[focusDataIndex]
                    const attribute = visibleAttributes.find((a) => a.name === dataKey)
                    if (!attribute) return null

                    return (
                      <circle
                        key={`custom-dot-${dataKey}-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r={4}
                        fill={attribute.fill}
                        stroke={attribute.color}
                        strokeWidth={1}
                      />
                    )
                  })}
                </g>
              )
            }}
          />
        </RechartComposedChart>
        <ChartHighlightActions
          chartHighlight={chartHighlight}
          updateDateRange={updateDateRange}
          actions={highlightActions}
          chartId={chartId}
        />
      </Container>
      {data && (
        <div
          className="text-foreground-lighter -mt-9 flex items-center justify-between text-xs"
          style={{ marginLeft: YAxisProps?.width }}
        >
          <span>{xAxisIsDate ? formatTimestamp(data[0]?.[xAxisKey]) : data[0]?.[xAxisKey]}</span>
          <span>
            {xAxisIsDate
              ? formatTimestamp(data[data.length - 1]?.[xAxisKey])
              : data[data.length - 1]?.[xAxisKey]}
          </span>
        </div>
      )}
      {showLegend && (
        <div className="relative z-0">
          <CustomLabel
            payload={[maxAttributeData, ...chartData]}
            attributes={attributes}
            showMaxValue={_showMaxValue}
            onToggleAttribute={(attribute, options) => {
              setHiddenAttributes((prev) => {
                if (options?.exclusive) {
                  const next = new Set<string>()
                  // Hide every attribute except the selected one. If all but one are hidden, clicking again will reset to all visible.
                  const allNames = chartData.map((c) => c.name)
                  const allHiddenExcept = allNames.filter((n) => n !== attribute)
                  const isAlreadyExclusive =
                    allHiddenExcept.every((n) => prev.has(n)) && !prev.has(attribute)
                  return isAlreadyExclusive ? new Set() : new Set(allHiddenExcept)
                }

                const next = new Set(prev)
                if (next.has(attribute)) {
                  next.delete(attribute)
                } else {
                  next.add(attribute)
                }
                return next
              })
            }}
            hiddenAttributes={hiddenAttributes}
          />
        </div>
      )}
    </div>
  )
}
