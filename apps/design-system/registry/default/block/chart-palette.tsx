import { ReactNode } from 'react'

const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8]

const STATUS = [
  { name: '--chart-status-success', muted: '--chart-status-success-muted', note: 'Healthy, ok' },
  {
    name: '--chart-status-warning',
    muted: '--chart-status-warning-muted',
    note: 'Threshold breach',
  },
  {
    name: '--chart-status-destructive',
    muted: '--chart-status-destructive-muted',
    note: 'Error, failure',
  },
]

const DEFAULTS = [
  { name: '--chart-in', note: 'Pinned: network in, disk read' },
  { name: '--chart-out', note: 'Pinned: network out, disk write' },
  { name: '--chart-reference', note: 'Reference lines, max values' },
  { name: '--chart-muted', note: 'Headroom, idle, unused capacity' },
]

function Swatch({ token, label }: { token: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <div
        className="border-default h-12 w-full rounded-md border"
        style={{ background: `var(${token})` }}
      />
      <span className="text-foreground-lighter text-xs">{label}</span>
    </div>
  )
}

function TokenCard({
  title,
  token,
  note,
  children,
}: {
  title: ReactNode
  token: string
  note?: string
  children: ReactNode
}) {
  return (
    <div className="border-default bg-surface-100 flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-col gap-1">
        <div className="text-foreground text-sm">{title}</div>
        <code className="text-foreground-lighter break-all font-mono text-xs">{token}</code>
      </div>
      <div className="flex gap-3">{children}</div>
      {note && <p className="text-foreground-lighter text-xs">{note}</p>}
    </div>
  )
}

function Section({
  title,
  description,
  children,
  className,
}: {
  title: string
  description: string
  children: ReactNode
  className: string
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-foreground text-sm">{title}</h3>
        <p className="text-foreground-lighter max-w-prose text-xs">{description}</p>
      </div>
      <div className={className}>{children}</div>
    </section>
  )
}

export default function ChartPalette() {
  return (
    <div className="flex w-full flex-col gap-10 p-6">
      <Section
        title="Categorical slots"
        description="Assigned in fixed order, never cycled. A ninth series folds into “Other”."
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {SLOTS.map((n) => (
          <TokenCard key={n} title={`Slot ${n}`} token={`--chart-${n}`}>
            <Swatch token={`--chart-${n}`} label="Stroke" />
            <Swatch token={`--chart-${n}-fill`} label="Fill" />
          </TokenCard>
        ))}
      </Section>

      <Section
        title="Status"
        description="Reserved meaning. These point at the same tokens the rest of the UI uses and always ship with an icon or label, so state is never carried by color alone. Never assign one to a series."
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {STATUS.map((d) => (
          <TokenCard
            key={d.name}
            title={d.name.replace('--chart-status-', '')}
            token={d.name}
            note={d.note}
          >
            <Swatch token={d.name} label="Base" />
            <Swatch token={d.muted} label="Muted" />
          </TokenCard>
        ))}
      </Section>

      <Section
        title="Pinned pairs and rendering defaults"
        description="Chart authors do not pick these. Reference lines and headroom are applied by the chart."
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {DEFAULTS.map((d) => (
          <TokenCard
            key={d.name}
            title={d.name.replace('--chart-', '')}
            token={d.name}
            note={d.note}
          >
            <Swatch token={d.name} label="Color" />
          </TokenCard>
        ))}
      </Section>
    </div>
  )
}
