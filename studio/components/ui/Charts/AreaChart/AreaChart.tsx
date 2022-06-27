import { IconBarChart2, Loading } from '@supabase/ui'
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
import { formatBytes } from 'lib/helpers'
import { CHART_COLORS } from 'components/ui/Charts/Charts.constants'
import { AreaChartProps, DataPoint, HeaderType } from './AreaChart.types'
import { CategoricalChartState } from 'recharts/types/chart/generateCategoricalChart'

function dataCheck(data: DataPoint[] | undefined, attribute: string) {
  const hasData = data?.find(record => record[attribute])
  return hasData ? true : false
}

const CustomTooltip = () => null

const DATE_FORMAT__DATE_ONLY = 'MMM D, YYYY'
const DATE_FORMAT__WITH_TIME = `${DATE_FORMAT__DATE_ONLY} hh:mma`

const Header = ({
  attribute,
  focus,
  format,
  highlightedValue,
  data,
  customDateFormat,
  label,
  minimalHeader = false,
  displayDateInUtc = false,
}: HeaderType) => {
  const FOCUS_FORMAT = customDateFormat
    ? customDateFormat
    : format == '%'
    ? DATE_FORMAT__WITH_TIME
    : DATE_FORMAT__DATE_ONLY

  let title = ''

  if (focus) {
    if (format === '%') {
      title = data ? Number(data[focus]?.[attribute]).toFixed(2)  : ''
    } else if (['ingress', 'egress', 'bytes'].some(str =>  attribute.includes(str))) {
      title = data ? formatBytes(data[focus]?.[attribute]) : ''
    } else {
      title = data ? data[focus]?.[attribute]?.toLocaleString() : ''
    }
  } else {
    if ((format === '%') && highlightedValue) {
      title = highlightedValue.toFixed(2)
    } else if (attribute.includes('ingress') || attribute.includes('egress') || attribute.includes('bytes')) {
      title = formatBytes(highlightedValue)
    } else {
      title = highlightedValue?.toLocaleString() as string
    }
  }

  const day = (value: number | string) => (displayDateInUtc ? dayjs(value).utc() : dayjs(value))

  const chartTitle = (
    <h3 className={'text-scale-900 ' + (minimalHeader ? 'text-xs' : 'text-sm')}>
      {label ?? attribute}
    </h3>
  )
  const highlighted = (
    <h5
      className={
        'text-scale-1200 text-xl font-normal ' + (minimalHeader ? 'text-base' : 'text-2xl')
      }
    >
      {title}
      <span className="text-lg">{format}</span>
    </h5>
  )
  const date = (
    <h5 className="text-scale-900 text-xs">
      {focus ? (
        data?.[focus] && day(data[focus].period_start).format(FOCUS_FORMAT)
      ) : (
        <span className="opacity-0">x</span>
      )}
    </h5>
  )

  if (minimalHeader) {
    return (
      <div className="flex flex-row items-center gap-x-4" style={{ minHeight: '1.8rem' }}>
        {chartTitle}
        <div className="flex flex-row items-baseline gap-x-2">
          {highlighted}
          {date}
        </div>
      </div>
    )
  }

  return (
    <>
      {chartTitle}
      {highlighted}
      {date}
    </>
  )
}

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

export default function AreaChart({
  data,
  attribute,
  yAxisLimit,
  format,
  highlightedValue,
  customDateFormat,
  label,
}: AreaChartProps) {
  const hasData = dataCheck(data, attribute)

  const [focusBar, setFocusBar] = useState<any>(null)
  const [mouseLeave, setMouseLeave] = useState(true)

  const onMouseMove = (state: CategoricalChartState) => {
    const {activeTooltipIndex} = state
    setFocusBar(activeTooltipIndex || null)
    setMouseLeave(activeTooltipIndex ? false : true)
  }

  const onMouseLeave = () => {
    setFocusBar(false)
    setMouseLeave(true)
  }

  // For future reference: https://github.com/supabase/supabase/pull/5311#discussion_r800852828
  const chartHeight = 160

  return (
    <Loading active={!data}>
      <Header
        label={label}
        attribute={attribute}
        focus={focusBar}
        highlightedValue={highlightedValue}
        data={data}
        format={format}
        customDateFormat={customDateFormat}
      />
      <div
        style={{
          width: '100%',
          height: `${chartHeight}px`,
        }}
      >
        {hasData ? (
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
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
              >
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.GREEN_1} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={CHART_COLORS.GREEN_1} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="period_start"
                  //interval={size === 'small' ? 5 : 1}
                  interval={data ? data.length - 2 : 0}
                  angle={0}
                  // stroke="#4B5563"
                  tick={{
                    fontSize: '0px',
                    color: CHART_COLORS.TICK,
                  }}
                  axisLine={{
                    stroke: CHART_COLORS.AXIS,
                  }}
                  tickLine={{
                    stroke: CHART_COLORS.AXIS,
                  }}
                />
                {yAxisLimit && <YAxis type="number" domain={[0, yAxisLimit]} hide />}
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={attribute}
                  stroke={CHART_COLORS.GREEN_1}
                  fillOpacity={1}
                  fill="url(#colorUv)"
                />
              </RechartAreaChart>
            </ResponsiveContainer>
            {data && (
              <div className="text-scale-900 -mt-5 flex items-center justify-between text-xs">
                <span>
                  {dayjs(data[0].period_start).format(
                    customDateFormat ? customDateFormat : DATE_FORMAT__WITH_TIME
                  )}
                </span>
                <span>
                  {dayjs(data[data?.length - 1]?.period_start).format(
                    customDateFormat ? customDateFormat : DATE_FORMAT__WITH_TIME
                  )}
                </span>
              </div>
            )}
          </>
        ) : (
          <NoData />
        )}
      </div>
    </Loading>
  )
}
