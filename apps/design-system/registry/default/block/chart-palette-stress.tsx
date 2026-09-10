'use client'

import {
  Chart,
  ChartBar,
  ChartCard,
  ChartContent,
  ChartHeader,
  ChartTitle,
  type ChartBarTick,
  type ChartConfig,
} from 'ui-patterns/Chart'

const SERIES = [
  { key: 'postgres', label: 'Postgres' },
  { key: 'postgrest', label: 'PostgREST' },
  { key: 'reserved', label: 'Reserved' },
  { key: 'auth', label: 'Auth' },
  { key: 'storage', label: 'Storage' },
  { key: 'realtime', label: 'Realtime' },
  { key: 'cron', label: 'Cron' },
  { key: 'other', label: 'Other roles' },
]

const config: ChartConfig = Object.fromEntries(
  SERIES.map((s, i) => [s.key, { label: s.label, color: `var(--chart-series-${i + 1})` }])
)

const data: ChartBarTick[] = Array.from({ length: 14 }, (_, i) => {
  const row: ChartBarTick = { time: `${String(8 + i).padStart(2, '0')}:00` }
  SERIES.forEach((s, idx) => {
    row[s.key] = Math.round(6 + idx * 2 + Math.sin(i / 2.2 + idx) * 3.5)
  })
  return row
})

export default function ChartPaletteStress() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Chart>
        <ChartCard>
          <ChartHeader>
            <ChartTitle tooltip="Every categorical slot on screen at once">
              Client connections by role
            </ChartTitle>
          </ChartHeader>
          <ChartContent>
            <div className="h-40">
              <ChartBar
                data={data}
                xKey="time"
                dataKey={SERIES[0].key}
                dataKeys={SERIES.map((s) => s.key)}
                config={config}
                isStacked
                isFullHeight
                showGrid
                showYAxis
                showXAxis
                YAxisProps={{ width: 36 }}
                XAxisProps={{ interval: 3 }}
                margin={{ top: 4, right: 8 }}
              />
            </div>
          </ChartContent>
        </ChartCard>
      </Chart>
    </div>
  )
}
