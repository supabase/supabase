import { IconBarChart2, Loading } from '@supabase/ui'
import { useState } from 'react'
import {
  BarChart as RechartBarChart,
  AreaChart as RechartAreaChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
  ResponsiveContainer,
} from 'recharts'

import dayjs from 'dayjs'
import { formatBytes } from 'lib/helpers'
import { CHART_COLORS, DateTimeFormats } from 'components/ui/Charts/Charts.constants'
import ChartHeader from './ChartHeader'

function dataCheck(data: any, attribute: any) {
  const hasData = data && data.find((record: any) => record[attribute])
  return hasData ? true : false
}

const CustomTooltip = () => {
  return null
}

const DATE_FORMAT__WITH_TIME = 'MMM D, YYYY, hh:mma'
const DATE_FORMAT__DATE_ONLY = 'MMM D, YYYY'

const NoData = ({ title = 'No data to show', message = 'May take 24 hours for data to show' }) => (
  <div
    className="
      border-scale-600 flex
      h-full w-full flex-col
      items-center justify-center space-y-2 border
      border-dashed text-center
    "
  >
    <IconBarChart2 className="text-scale-800" />
    <div>
      <p className="text-scale-1100 text-xs">{title}</p>
      <p className="text-scale-900 text-xs">{message}</p>
    </div>
  </div>
)
const total = (data: any, format: any, attribute: any) => {
  let total = 0
  data?.map((item: any) => {
    total = total + Number(item[attribute])
  })
  if (format === '%') {
    return Number(total).toFixed(2)
  }
  return numberWithCommas(total)
}

function numberWithCommas(x: any) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

interface Props {
  data: any[]
  yAxisLimit?: any
  yAxisKey: string
  xAxisKey: string
  format?: string
  timeseries?: boolean
  customDateFormat?: string
  title?: string
  highlightedValue?: string | number
  displayDateInUtc?: boolean
}

const AreaChart: React.FC<Props> = ({
  data,
  attribute,
  yAxisLimit,
  yAxisKey,
  xAxisKey,
  format,
  customDateFormat = DateTimeFormats.FULL,
  title,
  highlightedValue,
  displayDateInUtc,
}) => {
  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)

  // For future reference: https://github.com/supabase/supabase/pull/5311#discussion_r800852828
  const chartHeight = 160

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
    <Loading active={!data}>
      {data && (
        <>
          <ChartHeader
            title={title}
            format={format}
            customDateFormat={customDateFormat}
            highlightedValue={resolvedHighlightedValue}
            highlightedLabel={highlightedLabel}
          />
          <div
            style={{
              width: '100%',
              height: `${chartHeight}px`,
            }}
          >
            <>
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
                    //interval={size === 'small' ? 5 : 1}
                    // interval={data ? data.length - 2 : 0}
                    interval={data.length - 2}
                    angle={0}
                    tickCount={2}
                    tickFormatter={(value) =>
                      dayjs(data[0][xAxisKey]).format(
                        customDateFormat ? customDateFormat : DATE_FORMAT__WITH_TIME
                      )
                    }
                    // hide the tick
                    tick={{ fontSize: '0px' }}
                    // color the axis
                    axisLine={{ stroke: CHART_COLORS.AXIS }}
                    tickLine={{ stroke: CHART_COLORS.AXIS }}
                  />
                  {yAxisLimit && <YAxis type="number" domain={[0, yAxisLimit]} hide />}
                  <Tooltip content={<CustomTooltip />} />
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
                  <span>
                    {dayjs(data[0][xAxisKey]).format(
                      customDateFormat ? customDateFormat : DATE_FORMAT__WITH_TIME
                    )}
                  </span>
                  <span>
                    {dayjs(data[data?.length - 1]?.[xAxisKey]).format(
                      customDateFormat ? customDateFormat : DATE_FORMAT__WITH_TIME
                    )}
                  </span>
                </div>
              )}
            </>
          </div>
        </>
      )}
    </Loading>
  )
}
export default AreaChart
