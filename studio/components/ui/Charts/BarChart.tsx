import { CHART_COLORS, DateTimeFormats } from 'components/ui/Charts/Charts.constants'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useState } from 'react'
import { Bar, BarChart as RechartBarChart, Cell, Tooltip, XAxis } from 'recharts'
import { CategoricalChartState } from 'recharts/types/chart/generateCategoricalChart'
import ChartHeader from './ChartHeader'
import { CommonChartProps, Datum } from './Charts.types'
import { numberFormatter, useChartSize } from './Charts.utils'
import ChartNoData from './NoDataPlaceholder'
dayjs.extend(utc)

export interface BarChartProps<D = Datum> extends CommonChartProps<D> {
  yAxisKey: string
  xAxisKey: string
  customDateFormat?: string
  displayDateInUtc?: boolean
  onBarClick?: (datum: Datum, tooltipData?: CategoricalChartState) => void
}

const BarChart = ({
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
  onBarClick,
}: BarChartProps) => {
  const { Container } = useChartSize(size)
  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)

  if (data.length === 0) return <ChartNoData size={size} className={className} />

  const day = (value: number | string) => (displayDateInUtc ? dayjs(value).utc() : dayjs(value))
  const resolvedHighlightedLabel =
    (focusDataIndex !== null &&
      data &&
      data[focusDataIndex] !== undefined &&
      day(data[focusDataIndex][xAxisKey]).format(customDateFormat)) ||
    highlightedLabel

  const resolvedHighlightedValue =
    focusDataIndex !== null ? data[focusDataIndex]?.[yAxisKey] : highlightedValue

  return (
    <div className={['flex flex-col gap-3', className].join(' ')}>
      <ChartHeader
        title={title}
        format={format}
        customDateFormat={customDateFormat}
        highlightedValue={
          typeof resolvedHighlightedValue === 'number'
            ? numberFormatter(resolvedHighlightedValue, valuePrecision)
            : resolvedHighlightedValue
        }
        highlightedLabel={resolvedHighlightedLabel}
        minimalHeader={minimalHeader}
      />
      <Container>
        <RechartBarChart
          data={data}
          margin={{
            top: 0,
            right: 0,
            left: 0,
            bottom: 0,
          }}
          className="overflow-visible"
          //   mouse hover focusing logic
          onMouseMove={(e: any) => {
            if (e.activeTooltipIndex !== focusDataIndex) {
              setFocusDataIndex(e.activeTooltipIndex)
            }
          }}
          onMouseLeave={() => setFocusDataIndex(null)}
          onClick={(tooltipData) => {
            // receives tooltip data https://github.com/recharts/recharts/blob/2a3405ff64a0c050d2cf94c36f0beef738d9e9c2/src/chart/generateCategoricalChart.tsx
            const datum = tooltipData?.activePayload?.[0]?.payload
            if (onBarClick) onBarClick(datum, tooltipData)
          }}
        >
          <XAxis
            dataKey={xAxisKey}
            interval={data.length - 2}
            angle={0}
            // hide the tick
            tick={false}
            // color the axis
            axisLine={{ stroke: CHART_COLORS.AXIS }}
            tickLine={{ stroke: CHART_COLORS.AXIS }}
          />
          <Tooltip content={() => null} />
          <Bar
            dataKey={yAxisKey}
            fill={CHART_COLORS.GREEN_1}
            animationDuration={300}
            // max bar size required to prevent bars from expanding to max width.
            maxBarSize={48}
          >
            {data?.map((_entry: Datum, index: any) => (
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
        <div className="text-foreground-lighter -mt-9 flex items-center justify-between text-xs">
          <span>{day(data[0][xAxisKey]).format(customDateFormat)}</span>
          <span>{day(data[data?.length - 1]?.[xAxisKey]).format(customDateFormat)}</span>
        </div>
      )}
    </div>
  )
}
export default BarChart
