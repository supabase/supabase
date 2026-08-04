import { ComponentProps, useMemo, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  BarChart as RechartBarChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CategoricalChartState } from 'recharts/types/chart/types'

import { ChartHeader } from './ChartHeader'
import type { CommonChartProps, Datum } from './Charts.types'
import { numberFormatter, useChartSize } from './Charts.utils'
import NoDataPlaceholder from './NoDataPlaceholder'
import { useChartHoverState } from './useChartHoverState'
import { CHART_COLORS, DateTimeFormats } from '@/components/ui/Charts/Charts.constants'
import { formatDateTime, useFormatDateTime } from '@/lib/datetime'

export interface BarChartProps<D = Datum> extends CommonChartProps<D> {
  yAxisKey: string
  xAxisKey: string
  customDateFormat?: string
  displayDateInUtc?: boolean
  onBarClick?: (datum: D, tooltipData?: CategoricalChartState) => void
  emptyStateMessage?: string
  showLegend?: boolean
  xAxisIsDate?: boolean
  XAxisProps?: ComponentProps<typeof XAxis>
  YAxisProps?: ComponentProps<typeof YAxis>
  showGrid?: boolean
  syncId?: string
}

function BarChart<D extends Datum = Datum>({
  data,
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
  syncId,
}: BarChartProps<D>) {
  const { hoveredIndex, isHovered, isCurrentChart, setHover, clearHover } =
    useChartHoverState('default')
  const { Container } = useChartSize(size)
  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)

  // Transform data to ensure yAxisKey values are numbers
  const transformedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      [yAxisKey]: typeof item[yAxisKey] === 'string' ? Number(item[yAxisKey]) : item[yAxisKey],
    }))
  }, [data, yAxisKey])

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

  // When `displayDateInUtc` is set the chart explicitly wants UTC labels.
  // Otherwise honour the user's selected timezone via the picker, which
  // `useFormatDateTime` reads from context.
  const formatPickerDate = useFormatDateTime()
  const formatChartDate = (value: number | string) =>
    displayDateInUtc
      ? formatDateTime(value, { tz: 'UTC', format: customDateFormat })
      : formatPickerDate(value, customDateFormat)

  function getHeaderLabel() {
    if (!xAxisIsDate) {
      if (!focusDataIndex) return highlightedLabel
      return data[focusDataIndex]?.[xAxisKey]
    }
    return (
      (focusDataIndex !== null &&
        data &&
        data[focusDataIndex] !== undefined &&
        formatChartDate(data[focusDataIndex][xAxisKey] as number | string)) ||
      highlightedLabel
    )
  }

  const resolvedHighlightedLabel = getHeaderLabel()

  const resolvedHighlightedValue =
    focusDataIndex !== null ? data[focusDataIndex]?.[yAxisKey] : highlightedValue

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
    <div className={['flex flex-col gap-y-3', className].join(' ')}>
      <ChartHeader
        title={title}
        format={format}
        customDateFormat={customDateFormat}
        highlightedValue={resolvedHighlightedValue}
        highlightedLabel={resolvedHighlightedLabel}
        minimalHeader={minimalHeader}
        syncId={syncId}
        data={data}
        xAxisKey={xAxisKey}
        yAxisKey={yAxisKey}
        xAxisIsDate={xAxisIsDate}
        displayDateInUtc={displayDateInUtc}
        valuePrecision={valuePrecision}
        attributes={[]}
      />
      <Container>
        <RechartBarChart
          data={transformedData}
          className="overflow-visible"
          onMouseMove={(e: any) => {
            if (e.activeTooltipIndex !== focusDataIndex) {
              setFocusDataIndex(e.activeTooltipIndex)
            }

            setHover(e.activeTooltipIndex)
          }}
          onMouseLeave={() => {
            setFocusDataIndex(null)

            clearHover()
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
          <Tooltip
            content={(_props) =>
              syncId && isHovered && isCurrentChart && hoveredIndex !== null ? (
                <div className="bg-black/90 text-white p-2 rounded-sm text-xs">
                  <div className="font-medium">
                    {formatChartDate(data[hoveredIndex]?.[xAxisKey] as number | string)}
                  </div>
                  <div>
                    {numberFormatter(Number(data[hoveredIndex]?.[yAxisKey]) || 0, valuePrecision)}
                    {typeof format === 'string' ? format : ''}
                  </div>
                </div>
              ) : null
            }
          />
          <Bar
            dataKey={yAxisKey}
            fill={CHART_COLORS.GREEN_1}
            animationDuration={300}
            maxBarSize={48}
          >
            {data?.map((_entry: D, index: number) => (
              <Cell
                key={`cell-${index}`}
                className={`transition-all duration-300 ${onBarClick ? 'cursor-pointer' : ''}`}
                fill={
                  focusDataIndex === index || focusDataIndex === null
                    ? CHART_COLORS.GREEN_1
                    : CHART_COLORS.GREEN_2
                }
                enableBackground={12}
              />
            ))}
          </Bar>
        </RechartBarChart>
      </Container>
      {data && (
        <div className="text-foreground-lighter -mt-10 flex items-center justify-between text-[10px] font-mono">
          <span>
            {xAxisIsDate
              ? formatChartDate(data[0][xAxisKey] as number | string)
              : data[0][xAxisKey]}
          </span>
          <span>
            {xAxisIsDate
              ? formatChartDate(data[data?.length - 1]?.[xAxisKey] as number | string)
              : data[data?.length - 1]?.[xAxisKey]}
          </span>
        </div>
      )}
    </div>
  )
}
export default BarChart
