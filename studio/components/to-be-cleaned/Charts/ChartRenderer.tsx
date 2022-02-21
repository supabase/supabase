import { IconBarChart2, Loading, Typography } from '@supabase/ui'
import { useState } from 'react'
import {
  BarChart as RechartBarChart,
  AreaChart as RechartAreaChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'

import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { formatBytes } from 'lib/helpers'
import { CHART_COLORS } from 'components/ui/ChartComponents/Charts.constants'

dayjs.extend(customParseFormat)
dayjs.extend(timezone)
dayjs.extend(utc)

function dataCheck(data: any, attribute: any) {
  const hasData = data && data.find((record: any) => record[attribute])
  return hasData ? true : false
}

const CustomTooltip = () => {
  return null
}

const DATE_FORMAT__WITH_TIME = 'MMM D, YYYY, hh:mma'
const DATE_FORMAT__DATE_ONLY = 'MMM D, YYYY'

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
}: any) => {
  let FOCUS_FORMAT = customDateFormat
    ? customDateFormat
    : format == '%'
    ? DATE_FORMAT__WITH_TIME
    : DATE_FORMAT__DATE_ONLY

  let title = ''

  if (focus) {
    if (!data) {
      title = ''
    } else if (format === '%') {
      title = Number(data[focus]?.[attribute]).toFixed(2)
    } else {
      if (
        attribute.includes('ingress') ||
        attribute.includes('egress') ||
        attribute.includes('bytes')
      ) {
        title = formatBytes(data[focus]?.[attribute])
      } else {
        title = data[focus]?.[attribute]?.toLocaleString()
      }
    }
  } else {
    if (format === '%' && highlightedValue) {
      title = highlightedValue.toFixed(2)
    } else {
      if (
        attribute.includes('ingress') ||
        attribute.includes('egress') ||
        attribute.includes('bytes')
      ) {
        title = formatBytes(highlightedValue)
      } else {
        title = highlightedValue?.toLocaleString()
      }
    }
  }
  const day = (value: number | string) => (displayDateInUtc ? dayjs(value).utc() : dayjs(value))

  const chartTitle = (
    <Typography.Text small={minimalHeader ? true : false} className="mb-0" type="secondary">
      {label ?? attribute}
    </Typography.Text>
  )
  const highlighted = (
    <Typography.Title level={minimalHeader ? 5 : 3} className="my-0 font-normal">
      {title}
      <span className="text-lg">{format}</span>
    </Typography.Title>
  )
  const date = (
    <Typography.Text type="secondary" className="opacity-50" small>
      {focus ? (
        data && data[focus] && day(data[focus].period_start).format(FOCUS_FORMAT)
      ) : (
        <span className="opacity-0">x</span>
      )}
    </Typography.Text>
  )

  if (minimalHeader) {
    return (
      <div className="flex flex-row gap-x-4 items-center" style={{ minHeight: '1.8rem' }}>
        {chartTitle}
        <div className="flex flex-row gap-x-2 items-baseline">
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

const NoData = () => (
  <div
    className="
      h-full w-full
      border border-dashed dark:border-dark
      flex flex-col items-center justify-center
    "
  >
    <Typography.Text className="mb-2">
      <IconBarChart2 />
    </Typography.Text>
    <Typography.Text>No data to show</Typography.Text>
  </div>
)

export function BarChart({
  data,
  attribute,
  yAxisLimit,
  format,
  highlightedValue,
  customDateFormat,
  displayDateInUtc = false,
  label,
  onBarClick,
  minimalHeader,
  minmalChart,
  className = '',
}: any) {
  const hasData = data ? dataCheck(data, attribute) : true

  const [focusBar, setFocusBar] = useState<any>(null)
  const [mouseLeave, setMouseLeave] = useState<any>(true)

  const onMouseMove = (state: any) => {
    if (state?.activeTooltipIndex) {
      setFocusBar(state.activeTooltipIndex)
      setMouseLeave(false)
    } else {
      setFocusBar(null)
      setMouseLeave(true)
    }
  }

  const onMouseLeave = () => {
    setFocusBar(false)
    setMouseLeave(true)
  }

  const day = (value: number | string) => (displayDateInUtc ? dayjs(value).utc() : dayjs(value))

  return (
    <Loading active={!data}>
      <div className={className}>
        <Header
          minimalHeader={minimalHeader}
          attribute={attribute}
          focus={focusBar}
          highlightedValue={highlightedValue}
          data={data}
          label={label}
          format={format}
          customDateFormat={customDateFormat}
          displayDateInUtc={displayDateInUtc}
        />
        <div style={{ width: '100%', height: minmalChart ? '96px' : '160px' }}>
          {hasData ? (
            <>
              <ResponsiveContainer>
                <RechartBarChart
                  data={data}
                  margin={{
                    top: 0,
                    right: 0,
                    left: 0,
                    bottom: 0,
                  }}
                  className="overflow-visible cursor-pointer"
                  onMouseMove={onMouseMove}
                  onMouseLeave={onMouseLeave}
                  onClick={(tooltipData: any) => {
                    // receives tooltip data https://github.com/recharts/recharts/blob/2a3405ff64a0c050d2cf94c36f0beef738d9e9c2/src/chart/generateCategoricalChart.tsx
                    if (onBarClick) onBarClick(tooltipData)
                  }}
                >
                  <XAxis
                    dataKey="period_start"
                    //interval={size === 'small' ? 5 : 1}
                    interval={data ? data.length - 2 : 0}
                    angle={0}
                    // stroke="#4B5563"
                    tick={{ fontSize: '0px', color: CHART_COLORS.TICK }}
                    axisLine={{ stroke: CHART_COLORS.AXIS }}
                    tickLine={{ stroke: CHART_COLORS.AXIS }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {/* <YAxis dataKey={attribute} /> */}
                  {/* <YAxis type="number" domain={[(0, 100)]} /> */}
                  {yAxisLimit && <YAxis type="number" domain={[0, yAxisLimit]} hide />}
                  <Bar
                    dataKey={attribute}
                    fill={CHART_COLORS.GREEN_1}
                    // barSize={2}
                    animationDuration={300}
                  >
                    {data?.map((entry: any, index: any) => (
                      <Cell
                        key={`cell-${index}`}
                        className={`transition-all duration-300 ${
                          onBarClick ? 'cursor-pointer' : ''
                        }`}
                        fill={
                          focusBar === index || mouseLeave
                            ? CHART_COLORS.GREEN_1
                            : CHART_COLORS.GREEN_2
                        }
                        enableBackground={12}
                        // for this, we make the hovered colour #2B5CE7, else its opacity decreases to 20%
                      />
                    ))}
                  </Bar>
                </RechartBarChart>
              </ResponsiveContainer>
              {data && (
                <div className="flex items-center justify-between -mt-5">
                  <Typography.Text type="secondary" className="opacity-50" small>
                    {day(data[0].period_start).format(
                      customDateFormat ? customDateFormat : DATE_FORMAT__WITH_TIME
                    )}
                  </Typography.Text>
                  <Typography.Text type="secondary" className="opacity-50" small>
                    {day(data[data?.length - 1]?.period_start).format(
                      customDateFormat ? customDateFormat : DATE_FORMAT__WITH_TIME
                    )}
                  </Typography.Text>
                </div>
              )}
            </>
          ) : (
            <NoData />
          )}
        </div>
      </div>
    </Loading>
  )
}

export function AreaChart({
  data,
  attribute,
  yAxisLimit,
  format,
  highlightedValue,
  customDateFormat,
  label,
}: any) {
  const hasData = dataCheck(data, attribute)

  const [focusBar, setFocusBar] = useState<any>(null)
  const [mouseLeave, setMouseLeave] = useState<any>(true)

  const onMouseMove = (state: any) => {
    if (state?.activeTooltipIndex) {
      setFocusBar(state.activeTooltipIndex)
      setMouseLeave(false)
    } else {
      setFocusBar(null)
      setMouseLeave(true)
    }
  }

  const onMouseLeave = () => {
    setFocusBar(false)
    setMouseLeave(true)
  }

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
          height: '160px',
        }}
      >
        {hasData ? (
          <>
            <ResponsiveContainer>
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
              <div className="flex items-center justify-between -mt-5">
                <Typography.Text type="secondary" className="opacity-50" small>
                  {dayjs(data[0].period_start).format(
                    customDateFormat ? customDateFormat : DATE_FORMAT__WITH_TIME
                  )}
                </Typography.Text>
                <Typography.Text type="secondary" className="opacity-50" small>
                  {dayjs(data[data?.length - 1]?.period_start).format(
                    customDateFormat ? customDateFormat : DATE_FORMAT__WITH_TIME
                  )}
                </Typography.Text>
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
