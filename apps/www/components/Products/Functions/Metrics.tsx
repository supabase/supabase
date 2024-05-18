import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { cn } from 'ui'

const CHART_COLORS = {
  TICK: 'hsl(var(--background-overlay-hover))',
  AXIS: 'hsl(var(--background-overlay-hover))',
  GREEN_1: 'hsl(var(--brand-default))', // #3ECF8E
  GREEN_2: 'hsl(var(--brand-500))',
}

const Metrics = ({ isActive }: { isActive?: boolean }) => {
  const [mounted, setMounted] = useState(false)
  const [displayValue, setDisplayValue] = useState<number | null>(null)
  const dateFormat = 'MMM D, h:mma'

  const data = [
    {
      name: '1',
      timestamp: new Date(),
      uv: 4000,
      pv: 537.47,
      amt: 2400,
    },
    {
      name: '2',
      timestamp: new Date(),
      uv: 3000,
      pv: 334.11,
      amt: 2210,
    },
    {
      name: '3',
      timestamp: new Date(),
      uv: 2000,
      pv: 299.2,
      amt: 2290,
    },
    {
      name: '4',
      timestamp: new Date(),
      uv: 2780,
      pv: 459.2,
      amt: 2000,
    },
    {
      name: '5',
      timestamp: new Date(),
      uv: 1890,
      pv: 802,
      amt: 2181,
    },
    {
      name: '6',
      timestamp: new Date(),
      uv: 2390,
      pv: 343.2,
      amt: 2500,
    },
    {
      name: '7',
      timestamp: new Date(),
      uv: 3490,
      pv: 310.08,
      amt: 2100,
    },
  ]

  const highlightedValue = (data.reduce((acc, val) => acc + val.pv, 0) / data.length).toFixed(2)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div
      className={cn(
        'absolute inset-0 bottom-4 px-4 opacity-50 transition-opacity overflow-hidden',
        isActive && 'opacity-100'
      )}
    >
      <div className="relative rounded-md w-full h-full border border-overlay shadow p-4 !min-w-[300px]">
        <p className="text-foreground text-sm mb-2">Execution time</p>
        <p className="text-foreground text-base mb-4">
          {displayValue ? data[displayValue]?.pv : highlightedValue}ms {!displayValue ?? '(Avg)'}
        </p>
        <ResponsiveContainer minWidth={200} minHeight={200} width="100%" height="90%">
          <AreaChart
            className="relative z-20 text-xs"
            data={data}
            margin={{ top: 10, right: 0, left: 0, bottom: 40 }}
            onMouseMove={(e: any) => {
              if (e.activeTooltipIndex !== displayValue) {
                setDisplayValue(e.activeTooltipIndex)
              }
            }}
            onMouseLeave={() => setDisplayValue(null)}
          >
            <defs>
              <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--brand-default))" stopOpacity={0.7} />
                <stop offset="95%" stopColor="hsl(var(--brand-default))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              tick={false}
              dataKey="name"
              minTickGap={440}
              tickMargin={8}
              interval={data.length - 2}
              angle={0}
              axisLine={{ stroke: CHART_COLORS.AXIS }}
              tickLine={{ stroke: CHART_COLORS.AXIS }}
            />
            <Tooltip content={() => null} />
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
          <div className="absolute inset-4 top-auto text-foreground-lighter flex items-center justify-between text-xs">
            <span>{dayjs(data[0].timestamp).subtract(7, 'days').format(dateFormat)}</span>
            <span>{dayjs(data[data?.length - 1]?.timestamp).format(dateFormat)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Metrics
