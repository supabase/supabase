import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge, cn } from 'ui'
import { useInterval } from 'react-use'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import meanBy from 'lodash/meanBy'

export enum DateTimeFormats {
  FULL = 'MMM D, YYYY, hh:mma',
  DATE_ONLY = 'MMM D, YYYY',
}

export const CHART_COLORS = {
  TICK: 'hsl(var(--background-overlay-hover))',
  AXIS: 'hsl(var(--background-overlay-hover))',
  GREEN_1: 'hsl(var(--brand-default))', // #3ECF8E
  GREEN_2: 'hsl(var(--brand-500))',
}

const CHART_INTERVALS = [
  {
    key: '5min',
    label: '5 min',
    startValue: 5,
    startUnit: 'minute',
    format: 'MMM D, h:mm:ssa',
  },
  {
    key: '15min',
    label: '15 min',
    startValue: 15,
    startUnit: 'minute',
    format: 'MMM D, h:mma',
  },
  {
    key: '1hr',
    label: '1 hour',
    startValue: 1,
    startUnit: 'hour',
    format: 'MMM D, h:mma',
  },
  {
    key: '1day',
    label: '1 day',
    startValue: 1,
    startUnit: 'hour',
    format: 'MMM D, h:mma',
  },
  {
    key: '7day',
    label: '7 days',
    startValue: 7,
    startUnit: 'day',
    format: 'MMM D',
  },
]

const CustomizedAxisTick = (props: any) => {
  const { x, y, stroke, payload } = props

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={-12}
        dy={16}
        textAnchor="end"
        fill="hsl(var(--foreground-lighter))"
        transform="rotate(-35)"
        className="text-xs"
      >
        {payload.value}
      </text>
    </g>
  )
}

const CustomLabel = () => {
  return <div className="w-full relative">yooo</div>
}

const Metrics = () => {
  const [mounted, setMounted] = useState(false)
  const [interval, setInterval] = useState<string>('15min')
  const selectedInterval = CHART_INTERVALS.find((i) => i.key === interval) || CHART_INTERVALS[1]
  const customDateFormat = DateTimeFormats.FULL

  const data = [
    {
      name: 'Page A',
      timestamp: new Date(),
      uv: 4000,
      pv: 2400,
      amt: 2400,
    },
    {
      name: 'Page B',
      timestamp: new Date(),
      uv: 3000,
      pv: 1398,
      amt: 2210,
    },
    {
      name: 'Page C',
      timestamp: new Date(),
      uv: 2000,
      pv: 9800,
      amt: 2290,
    },
    {
      name: 'Page D',
      timestamp: new Date(),
      uv: 2780,
      pv: 3908,
      amt: 2000,
    },
    {
      name: 'Page E',
      timestamp: new Date(),
      uv: 1890,
      pv: 4800,
      amt: 2181,
    },
    {
      name: 'Page F',
      timestamp: new Date(),
      uv: 2390,
      pv: 3800,
      amt: 2500,
    },
    {
      name: 'Page G',
      timestamp: new Date(),
      uv: 3490,
      pv: 4300,
      amt: 2100,
    },
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="absolute inset-0 bottom-4 overflow-hidden px-4">
      <div
        className="absolute z-20 pointer-events-none inset-0 top-auto h-32"
        style={{
          background:
            'linear-gradient(to top, hsl(var(--background-surface-100)) 0%, transparent 100%)',
        }}
      />
      <div className="relative rounded-md w-full h-full border border-overlay shadow-lg p-4">
        <p className="text-foreground text-sm mb-4">Execution time</p>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart
            className="relative z-20 text-xs"
            data={data}
            margin={{ top: 10, right: 0, left: 0, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--brand-default))" stopOpacity={0.7} />
                <stop offset="95%" stopColor="hsl(var(--brand-default))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              // label={{
              //   // value: 'Latency (ms)',
              //   value: () => <div className="absolute left-0 z-30 bottom-0">asdf</div>,
              //   position: 'outsideBottom',
              //   offset: 32,
              //   fill: 'hsl(var(--foreground-lighter))',
              // }}
              tick={false}
              dataKey="name"
              minTickGap={440}
              tickMargin={8}
              interval={data.length - 2}
              angle={0}
              axisLine={{ stroke: CHART_COLORS.AXIS }}
              tickLine={{ stroke: CHART_COLORS.AXIS }}
            />
            {/* <Legend verticalAlign="top" height={36} /> */}
            {/* <YAxis /> */}
            {/* <CartesianGrid strokeDasharray="3 3" /> */}
            <Tooltip content={() => null} />
            {/* <Area type="monotone" dataKey="uv" stroke="#8884d8" fillOpacity={1} fill="url(#colorUv)" /> */}
            <Area
              type="monotone"
              dataKey="pv"
              stroke="hsl(var(--brand-default))"
              fillOpacity={1}
              fill="url(#colorPv)"
            />
          </AreaChart>
        </ResponsiveContainer>
        {data && (
          <div className="absolute inset-4 top-auto text-foreground-lighter bottom-8 flex items-center justify-between text-xs">
            <span>{dayjs(data[0].timestamp).format(customDateFormat)}</span>
            <span>{dayjs(data[data?.length - 1]?.timestamp).format(customDateFormat)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Metrics
