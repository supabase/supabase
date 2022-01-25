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
  TooltipProps,
} from 'recharts'

import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { formatBytes } from 'lib/helpers'
import { TooltipType } from 'recharts/types/util/types'

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

  return (
    <>
      <Typography.Text className="mb-0" type="secondary">
        {label ?? attribute}
      </Typography.Text>
      <Typography.Title level={3} className="mb-0 font-normal">
        {title}
        <span className="text-lg">{format}</span>
      </Typography.Title>
      <Typography.Text type="secondary" className="opacity-50" small>
        {focus ? (
          data && data[focus] && dayjs(data[focus].period_start).format(FOCUS_FORMAT)
        ) : (
          <span className="opacity-0">x</span>
        )}
      </Typography.Text>
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

export function BarChart({
  data,
  attribute,
  yAxisLimit,
  format,
  highlightedValue,
  customDateFormat,
  label,
  onBarClick,
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

  return (
    <Loading active={!data}>
      <Header
        attribute={attribute}
        focus={focusBar}
        highlightedValue={highlightedValue}
        data={data}
        label={label}
        format={format}
        customDateFormat={customDateFormat}
      />
      <div style={{ width: '100%', height: '160px' }}>
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
                  tick={{ fontSize: '0px', color: '#6B7280' }}
                  axisLine={{ stroke: '#444444' }}
                  tickLine={{ stroke: '#444444' }}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* <YAxis dataKey={attribute} /> */}
                {/* <YAxis type="number" domain={[(0, 100)]} /> */}
                {yAxisLimit && <YAxis type="number" domain={[0, yAxisLimit]} hide />}
                <Bar
                  dataKey={attribute}
                  fill="#3ecf8e"
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
                        focusBar === index || mouseLeave ? '#3ecf8e' : 'rgba(62, 207, 142, 0.2)'
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
                    <stop offset="5%" stopColor="#3ecf8e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3ecf8e" stopOpacity={0} />
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
                    color: '#6B7280',
                  }}
                  axisLine={{
                    stroke: '#444444',
                  }}
                  tickLine={{
                    stroke: '#444444',
                  }}
                />
                {yAxisLimit && <YAxis type="number" domain={[0, yAxisLimit]} hide />}
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={attribute}
                  stroke="#3ecf8e"
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
