/**
 * SCRATCH PAGE — DELETE BEFORE PROD (FE-3578)
 *
 * Visual harness for eyeballing the semantic chart colour roles in both themes.
 * Route: /dev/chart-colors
 *
 * The swatch grid hardcodes the light/dark surfaces side-by-side so both themes
 * are visible at once without toggling. The live charts below render the real
 * ComposedChart with mock data and follow the app's current theme.
 */
import { useState } from 'react'

import { CHART_OVERHEAD_RAMP, CHART_ROLE_COLORS } from '@/components/ui/Charts/Charts.constants'
import { ComposedChart } from '@/components/ui/Charts/ComposedChart'
import type { MultiAttribute } from '@/components/ui/Charts/ComposedChart.utils'

// Representative surface tokens (neutral greys) for each theme, so we can judge
// contrast of each role against the canvas the charts actually sit on.
const LIGHT_SURFACE = '#FFFFFF'
const DARK_SURFACE = '#1C1C1C'

type Role = {
  key: string
  color: { light: string; dark: string }
  fill: { light: string; dark: string }
}

const ROLES: Role[] = [
  { key: 'used', ...CHART_ROLE_COLORS.used },
  { key: 'overhead', ...CHART_ROLE_COLORS.overhead },
  { key: 'headroom', ...CHART_ROLE_COLORS.headroom },
  { key: 'limit', ...CHART_ROLE_COLORS.limit },
  { key: 'in', ...CHART_ROLE_COLORS.in },
  { key: 'out', ...CHART_ROLE_COLORS.out },
  { key: 'alert', ...CHART_ROLE_COLORS.alert },
  ...CHART_OVERHEAD_RAMP.map((r, i) => ({ key: `ramp[${i}]`, ...r })),
]

function SwatchPanel({ surface, theme }: { surface: string; theme: 'light' | 'dark' }) {
  const onDark = theme === 'dark'
  return (
    <div style={{ background: surface, padding: 24, borderRadius: 8, flex: 1 }}>
      <h3 style={{ color: onDark ? '#fff' : '#111', marginBottom: 16, fontSize: 13 }}>
        {theme} surface
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ROLES.map((role) => {
          const color = role.color[theme]
          const fill = role.fill[theme]
          return (
            <div key={role.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* solid color = line/bar */}
              <div style={{ width: 80, height: 24, background: color, borderRadius: 3 }} />
              {/* fill = area / focus dot tint */}
              <div style={{ width: 40, height: 24, background: fill, borderRadius: 3 }} />
              <span
                style={{ color: onDark ? '#ddd' : '#222', fontSize: 12, fontFamily: 'monospace' }}
              >
                {role.key.padEnd(10)} {color} / {fill}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- mock data + attributes for a couple of live charts ---------------------

const roleAttr = (
  attribute: string,
  label: string,
  role: Role,
  extra: Partial<MultiAttribute> = {}
): MultiAttribute => ({
  attribute,
  label,
  provider: 'infra-monitoring',
  color: role.color,
  fill: role.fill,
  ...extra,
})

const points = (n: number, fn: (i: number) => Record<string, number>) =>
  Array.from({ length: n }, (_, i) => ({ timestamp: Date.now() - (n - i) * 3_600_000, ...fn(i) }))

const memoryData = points(16, (i) => ({
  used: 3.2e9 + Math.sin(i / 2) * 6e8,
  cache: 1.4e9 + Math.cos(i / 3) * 3e8,
  free: 2e9 - Math.sin(i / 2) * 4e8,
}))

const cpuData = points(16, (i) => {
  const user = 30 + Math.sin(i / 2) * 12
  const system = 10 + Math.cos(i / 3) * 4
  const iowait = 5 + Math.sin(i / 4) * 3
  const irqs = 3
  const other = 2
  return { user, system, iowait, irqs, other, idle: 100 - user - system - iowait - irqs - other }
})

const iopsData = points(16, (i) => ({
  read: 800 + Math.sin(i / 2) * 300,
  write: 500 + Math.cos(i / 2) * 200,
}))

const ChartColorsDevPage = () => {
  const [tick, setTick] = useState(0)
  return (
    <div className="p-8 space-y-10">
      <div className="rounded border border-warning-500 bg-warning-200 p-3 text-sm text-warning-600">
        SCRATCH PAGE — delete before prod (FE-3578). Toggle the app theme (light/dark) to check the
        live charts; the swatch grid shows both themes at once.
      </div>

      <section>
        <h2 className="text-lg mb-4">Role swatches — solid (line/bar) + fill, on each surface</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          <SwatchPanel surface={LIGHT_SURFACE} theme="light" />
          <SwatchPanel surface={DARK_SURFACE} theme="dark" />
        </div>
      </section>

      <section className="space-y-8" key={tick}>
        <h2 className="text-lg">Live charts (follow current app theme)</h2>

        <div style={{ height: 280 }}>
          <ComposedChart
            chartId="dev-memory"
            title="Memory usage (used / overhead / headroom)"
            data={memoryData}
            xAxisKey="timestamp"
            yAxisKey="used"
            chartStyle="bar"
            showLegend
            showGrid
            showTooltip
            updateDateRange={() => {}}
            attributes={[
              roleAttr('used', 'Used', { key: 'used', ...CHART_ROLE_COLORS.used }),
              roleAttr('cache', 'Cache + Buffers', {
                key: 'overhead',
                ...CHART_ROLE_COLORS.overhead,
              }),
              roleAttr('free', 'Free', { key: 'headroom', ...CHART_ROLE_COLORS.headroom }),
            ]}
          />
        </div>

        <div style={{ height: 280 }}>
          <ComposedChart
            chartId="dev-cpu"
            title="CPU usage (used + overhead ramp + headroom + limit)"
            data={cpuData}
            xAxisKey="timestamp"
            yAxisKey="user"
            chartStyle="bar"
            format="%"
            showLegend
            showGrid
            showTooltip
            showMaxValue
            updateDateRange={() => {}}
            attributes={[
              roleAttr('user', 'User', { key: 'used', ...CHART_ROLE_COLORS.used }),
              roleAttr('system', 'System', { key: 'r0', ...CHART_OVERHEAD_RAMP[0] }),
              roleAttr('iowait', 'IOwait', { key: 'r1', ...CHART_OVERHEAD_RAMP[1] }),
              roleAttr('irqs', 'IRQs', { key: 'r2', ...CHART_OVERHEAD_RAMP[2] }),
              roleAttr('other', 'Other', { key: 'r3', ...CHART_OVERHEAD_RAMP[3] }),
              roleAttr(
                'idle',
                'Idle',
                { key: 'headroom', ...CHART_ROLE_COLORS.headroom },
                {
                  omitFromTotal: true,
                }
              ),
              {
                attribute: 'cpu_max',
                label: 'Max',
                provider: 'reference-line',
                value: 100,
                isMaxValue: true,
                color: CHART_ROLE_COLORS.limit.color,
                fill: CHART_ROLE_COLORS.limit.fill,
              },
            ]}
          />
        </div>

        <div style={{ height: 280 }}>
          <ComposedChart
            chartId="dev-iops"
            title="Disk IOPS (in / out)"
            data={iopsData}
            xAxisKey="timestamp"
            yAxisKey="read"
            chartStyle="stackedAreaLine"
            showLegend
            showGrid
            showTooltip
            updateDateRange={() => {}}
            attributes={[
              roleAttr('read', 'Read IOPS', { key: 'in', ...CHART_ROLE_COLORS.in }),
              roleAttr('write', 'Write IOPS', { key: 'out', ...CHART_ROLE_COLORS.out }),
            ]}
          />
        </div>
      </section>

      <button className="text-xs underline" onClick={() => setTick((t) => t + 1)}>
        re-render charts
      </button>
    </div>
  )
}

export default ChartColorsDevPage
