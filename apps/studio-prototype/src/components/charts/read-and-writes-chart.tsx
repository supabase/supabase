'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

const generateLineChartData = () => {
  let reads = 12400
  let writes = 3000

  return Array.from({ length: 20 }, (_, i) => {
    reads = reads + (Math.random() - 0.5) * 5000 // Add variation to reads
    writes = writes + (Math.random() - 0.5) * 1000 // Add variation to writes

    return {
      time: `${14 + Math.floor(i / 4)}:${(i % 4) * 15}`,
      reads: Math.max(0, Math.round(reads)),
      writes: Math.max(0, Math.round(writes)),
    }
  })
}

const ReadAndWritesChart = () => {
  const data = generateLineChartData()

  return (
    <div className="flex flex-col gap-2 grow">
      <div className="flex items-baseline gap-6">
        <div className="flex items-center gap-2">
          <div className="h-2 w-4 rounded-full bg-foreground"></div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-mono font-extralight text-foreground">3,402</h2>
            <span className="text-xs font-mono text-foreground-lighter">Rows read</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-4 rounded-full bg-brand"></div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-mono font-extralight text-foreground">242</h2>
            <span className="text-xs font-mono text-foreground-lighter">Rows write</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart
          data={data}
          className="[&_.recharts-area-dots>circle]:hidden [&_.recharts-area-dots>circle:last-of-type]:block"
        >
          <defs>
            <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>

            <mask id="fadeMask">
              <rect x="0" y="0" width="100%" height="100%" fill="url(#fade)" />
            </mask>

            <pattern
              id="pattern1"
              patternUnits="userSpaceOnUse"
              width="6"
              height="6"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="6"
                stroke="hsl(var(--foreground-default)/10%)"
                strokeWidth="1"
              />
            </pattern>

            <pattern
              id="pattern2"
              patternUnits="userSpaceOnUse"
              width="6"
              height="6"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="6"
                stroke="hsl(var(--brand-default)/10%)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stroke-border-secondary"
          />
          <Tooltip />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="reads"
            stroke="hsl(var(--foreground-default)/50%)"
            fill="url(#pattern1)"
            fillOpacity={1}
            strokeWidth={1.5}
            dot={{
              stroke: 'hsl(var(--foreground-default))',
              strokeWidth: 2,
              className: 'z-10 foreground-foreground',
            }}
          />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="writes"
            stroke="hsl(var(--brand-default))"
            fill="url(#pattern2)"
            fillOpacity={1}
            strokeWidth={1.5}
            dot={{
              stroke: 'hsl(var(--brand-default))',
              strokeWidth: 2,
              className: 'z-10 foreground-brand',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ReadAndWritesChart
