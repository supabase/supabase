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

const data: ChartBarTick[] = Array.from({ length: 40 }, (_, i) => {
  const start = new Date('2026-09-10T08:00:00Z')
  start.setUTCMinutes(start.getUTCMinutes() + i * 3)
  const row: ChartBarTick = { timestamp: start.toISOString() }

  const trend = Math.sin((i / 40) * Math.PI * 2)
  SERIES.forEach((s, idx) => {
    const phase = Math.sin(i / 3.5 + idx * 1.7)
    const jitter = Math.sin(i * 2.3 + idx * 0.9) * 1.5
    row[s.key] = Math.max(1, Math.round(5 + idx * 1.8 + phase * 3 + trend * 2 + jitter))
  })
  return row
})

export default function ChartPaletteStress() {
  return (
    <div className="flex flex-col gap-6 w-8/12">
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
                dataKey={SERIES[0].key}
                dataKeys={SERIES.map((s) => s.key)}
                config={config}
                isStacked
                isFullHeight
                showGrid
                showYAxis
                YAxisProps={{ width: 36 }}
              />
            </div>
          </ChartContent>
        </ChartCard>
      </Chart>
    </div>
  )
}
