import dayjs from 'dayjs'
import { useState } from 'react'
import {
  Bar,
  BarChart as RechartBarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Loading } from 'ui'

import { CHART_COLORS } from 'components/ui/Charts/Charts.constants'
import EmptyState from 'components/ui/Charts/EmptyState'
import { formatBytes } from 'lib/helpers'

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
    <h3 className={'text-foreground-lighter ' + (minimalHeader ? 'text-xs' : 'text-sm')}>
      {label ?? attribute}
    </h3>
  )
  const highlighted = (
    <h5
      className={
        'text-xl font-normal text-foreground ' + (minimalHeader ? 'text-base' : 'text-2xl')
      }
    >
      {title}
      <span className="text-lg">{format}</span>
    </h5>
  )
  const date = (
    <h5 className="text-xs text-foreground-lighter">
      {focus ? (
        data && data[focus] && day(data[focus].period_start).format(FOCUS_FORMAT)
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

/**
 * @deprecated please use studio/components/ui/Charts/BarChart.tsx instead
 */
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
  chartSize = 'normal',
  className = '',
  noDataTitle,
  noDataMessage,
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

  // For future reference: https://github.com/supabase/supabase/pull/5311#discussion_r800852828
  const chartHeight = {
    tiny: 76,
    small: 96,
    normal: 160,
  }[chartSize as string] as number

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
        <div style={{ width: '100%', height: `${chartHeight}px` }}>
          {hasData ? (
            <>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <RechartBarChart
                  data={data}
                  margin={{
                    top: 0,
                    right: 0,
                    left: 0,
                    bottom: 0,
                  }}
                  className="cursor-pointer overflow-visible"
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
                    tick={false}
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
                    // max bar size required for LogEventChart, prevents bars from expanding to max width.
                    maxBarSize={48}
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
                <div className="-mt-5 flex items-center justify-between text-xs text-foreground-lighter">
                  <span>
                    {day(data[0].period_start).format(
                      customDateFormat ? customDateFormat : DATE_FORMAT__WITH_TIME
                    )}
                  </span>
                  <span>
                    {day(data[data?.length - 1]?.period_start).format(
                      customDateFormat ? customDateFormat : DATE_FORMAT__WITH_TIME
                    )}
                  </span>
                </div>
              )}
            </>
          ) : (
            <EmptyState title={noDataTitle} message={noDataMessage} />
          )}
        </div>
      </div>
    </Loading>
  )
}
