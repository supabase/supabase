import { CHART_COLORS, DateTimeFormats } from 'components/ui/Charts/Charts.constants'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useState } from 'react'
import { Area, AreaChart as RechartAreaChart, Tooltip, XAxis } from 'recharts'
import ChartHeader from './ChartHeader'
import { CommonChartProps, Datum } from './Charts.types'
import { numberFormatter, useChartSize } from './Charts.utils'
import ChartNoData from './NoDataPlaceholder'
dayjs.extend(utc)

export interface AreaChartProps<D = Datum> extends CommonChartProps<D> {
  yAxisKey: string
  xAxisKey: string
  format?: string
  customDateFormat?: string
  displayDateInUtc?: boolean
}

const AreaChart = ({
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
  className = '',
  valuePrecision,
  size = 'normal',
}: AreaChartProps) => {
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
        <RechartAreaChart
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
        >
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.GREEN_1} stopOpacity={0.8} />
              <stop offset="95%" stopColor={CHART_COLORS.GREEN_1} stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey={yAxisKey}
            stroke={CHART_COLORS.GREEN_1}
            fillOpacity={1}
            fill="url(#colorUv)"
          />
        </RechartAreaChart>
      </Container>
      {data && (
        <div className="text-foreground-lighter -mt-2 flex items-center justify-between text-xs">
          <span>{dayjs(data[0][xAxisKey]).format(customDateFormat)}</span>
          <span>{dayjs(data[data?.length - 1]?.[xAxisKey]).format(customDateFormat)}</span>
        </div>
      )}
    </div>
  )
}
export default AreaChart
