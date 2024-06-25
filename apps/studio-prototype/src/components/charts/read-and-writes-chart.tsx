'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

const generateLineChartData = () => {
  let reads = 12400
  let writes = 300

  return Array.from({ length: 20 }, (_, i) => {
    reads = reads + (Math.random() - 0.5) * 5000 // Add variation to reads
    writes = writes + (Math.random() - 0.5) * 100 // Add variation to writes

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
            <span className="text-xs font-mono text-foreground-lighter">Reads</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-4 rounded-full bg-brand"></div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-mono font-extralight text-foreground">242</h2>
            <span className="text-xs font-mono text-foreground-lighter">Writes</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={data}
          // className="[&_.recharts-area>.recharts-layer>path]:fill-foreground/50
          // "
        >
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--foreground-default))" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--brand-default))" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stroke-border-secondary"
          />
          <XAxis dataKey="time" className="text-xs text-foreground-muted" />
          {/* <YAxis className="text-xs [&_line]:stroke-border-secondary [&_text]:fill-foreground-muted" /> */}
          <Tooltip />
          <Area
            type="monotone"
            dataKey="reads"
            stroke="hsl(var(--foreground-default))"
            fill="url(#colorUv)"
            fillOpacity={1}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="writes"
            stroke="hsl(var(--brand-default))"
            fill="url(#colorPv)"
            fillOpacity={1}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ReadAndWritesChart
