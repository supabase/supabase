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

const SparkChart = () => {
  const data = generateLineChartData()

  return (
    <ResponsiveContainer width="100%" height={32}>
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
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border-secondary" />
        <Area
          isAnimationActive={false}
          type="monotone"
          dataKey="reads"
          stroke="hsl(var(--foreground-default)/50%)"
          fill="url(#pattern1)"
          fillOpacity={1}
          strokeWidth={1.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default SparkChart
