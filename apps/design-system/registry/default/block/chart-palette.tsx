'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8]

const STATUS = [
  { name: '--chart-status-success', muted: '--chart-status-success-muted', note: 'healthy, ok' },
  {
    name: '--chart-status-warning',
    muted: '--chart-status-warning-muted',
    note: 'threshold breach',
  },
  {
    name: '--chart-status-destructive',
    muted: '--chart-status-destructive-muted',
    note: 'error, failure',
  },
]

const DEFAULTS = [
  { name: '--chart-in', note: 'pinned: network in, disk read' },
  { name: '--chart-out', note: 'pinned: network out, disk write' },
  { name: '--chart-reference', note: 'reference lines, max values' },
  { name: '--chart-muted', note: 'headroom, idle, unused capacity' },
]

function useResolvedVars(names: string[]) {
  const { resolvedTheme } = useTheme()
  const [resolved, setResolved] = useState<Record<string, string>>({})

  useEffect(() => {
    const probe = document.createElement('span')
    probe.style.display = 'none'
    document.body.appendChild(probe)

    const next: Record<string, string> = {}
    names.forEach((name) => {
      probe.style.color = ''
      probe.style.color = `var(${name})`
      next[name] = getComputedStyle(probe).color
    })

    document.body.removeChild(probe)
    setResolved(next)
  }, [resolvedTheme, names.join(',')])

  return resolved
}

function Swatch({ token, label }: { token: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="size-8 rounded border border-default shrink-0"
        style={{ background: `var(${token})` }}
      />
      <span className="text-foreground-lighter font-mono text-xs">{label}</span>
    </div>
  )
}

export default function ChartPalette() {
  const names = [
    ...SLOTS.flatMap((n) => [`--chart-series-${n}`, `--chart-series-${n}-fill`]),
    ...DEFAULTS.map((d) => d.name),
    ...STATUS.flatMap((d) => [d.name, d.muted]),
  ]
  const resolved = useResolvedVars(names)

  return (
    <div className="w-full space-y-8 p-6">
      <div className="space-y-3">
        <h3 className="text-foreground text-sm">Categorical slots</h3>
        <p className="text-foreground-lighter text-xs">
          Assigned in fixed order, never cycled. A ninth series folds into &ldquo;Other&rdquo;.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {SLOTS.map((n) => (
            <div
              key={n}
              className="border-default bg-surface-100 flex items-center justify-between gap-4 rounded border p-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-foreground-light w-6 text-xs tabular-nums">{n}</span>
                <Swatch token={`--chart-series-${n}`} label="stroke" />
                <Swatch token={`--chart-series-${n}-fill`} label="fill" />
              </div>
              <code className="text-foreground-muted text-[11px]">
                {resolved[`--chart-series-${n}`] || '—'}
              </code>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-foreground text-sm">Status</h3>
        <p className="text-foreground-lighter text-xs">
          Reserved meaning. These point at the same tokens the rest of the UI uses, and always ship
          with an icon or label — state is never carried by color alone.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {STATUS.map((d) => (
            <div
              key={d.name}
              className="border-default bg-surface-100 flex items-center justify-between gap-4 rounded border p-3"
            >
              <div className="flex items-center gap-3">
                <Swatch token={d.name} label={d.name.replace('--chart-status-', '')} />
                <Swatch token={d.muted} label="muted" />
              </div>
              <div className="text-right">
                <div className="text-foreground-muted text-[11px]">{d.note} — never a series</div>
                <code className="text-foreground-muted text-[11px]">{resolved[d.name] || '—'}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-foreground text-sm">Pinned pairs and rendering defaults</h3>
        <p className="text-foreground-lighter text-xs">
          Chart authors do not pick these. Reference lines and headroom are applied by the chart.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {DEFAULTS.map((d) => (
            <div
              key={d.name}
              className="border-default bg-surface-100 flex items-center justify-between gap-4 rounded border p-3"
            >
              <div className="flex items-center gap-3">
                <Swatch token={d.name} label={d.name.replace('--chart-', '')} />
              </div>
              <div className="text-right">
                <div className="text-foreground-muted text-[11px]">{d.note}</div>
                <code className="text-foreground-muted text-[11px]">{resolved[d.name] || '—'}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
