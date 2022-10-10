import { useState } from 'react'
import {
  AreaChart as RechartAreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import dayjs from 'dayjs'
import { CHART_COLORS, DateTimeFormats } from 'components/ui/Charts/Charts.constants'
import ChartHeader from './ChartHeader'
import { Datum, CommonChartProps } from './Charts.types'
import utc from 'dayjs/plugin/utc'
import ChartNoData from './NoDataPlaceholder'
dayjs.extend(utc)

export interface AreaChartProps<D = Datum> extends CommonChartProps {
  data: D[]
  yAxisLimit?: any
  yAxisKey: string
  xAxisKey: string
  format?: string
  customDateFormat?: string
  displayDateInUtc?: boolean
}

const AreaChart: React.FC<AreaChartProps> = ({
  data,
  yAxisLimit,
  yAxisKey,
  xAxisKey,
  format,
  customDateFormat = DateTimeFormats.FULL,
  title,
  highlightedValue,
  displayDateInUtc,
  minimalHeader,
}) => {
  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)

  // For future reference: https://github.com/supabase/supabase/pull/5311#discussion_r800852828
  const chartHeight = 160

  if (data.length === 0) return <ChartNoData />

  const day = (value: number | string) => (displayDateInUtc ? dayjs(value).utc() : dayjs(value))
  const highlightedLabel =
    (focusDataIndex !== null &&
      data &&
      data[focusDataIndex] &&
      day(data[focusDataIndex][xAxisKey]).format(customDateFormat)) ||
    null

  const resolvedHighlightedValue =
    highlightedValue || (focusDataIndex !== null ? data[focusDataIndex]?.[yAxisKey] : null)

  return (
    <>
      <ChartHeader
        title={title}
        format={format}
        customDateFormat={customDateFormat}
        highlightedValue={resolvedHighlightedValue}
        highlightedLabel={highlightedLabel}
        minimalHeader={minimalHeader}
      />
      <ResponsiveContainer width="100%" height={chartHeight}>
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
            tick={{ fontSize: '0px' }}
            // color the axis
            axisLine={{ stroke: CHART_COLORS.AXIS }}
            tickLine={{ stroke: CHART_COLORS.AXIS }}
          />
          {yAxisLimit && <YAxis type="number" domain={[0, yAxisLimit]} hide />}
          <Tooltip content={() => null} />
          <Area
            type="monotone"
            dataKey={yAxisKey}
            stroke={CHART_COLORS.GREEN_1}
            fillOpacity={1}
            fill="url(#colorUv)"
          />
        </RechartAreaChart>
      </ResponsiveContainer>
      {data && (
        <div className="text-scale-900 -mt-5 flex items-center justify-between text-xs">
          <span>{dayjs(data[0][xAxisKey]).format(customDateFormat)}</span>
          <span>{dayjs(data[data?.length - 1]?.[xAxisKey]).format(customDateFormat)}</span>
        </div>
      )}
    </>
  )
}
export default AreaChart
