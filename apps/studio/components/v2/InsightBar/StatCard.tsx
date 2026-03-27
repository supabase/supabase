'use client'

import { MiniSparkline } from './MiniSparkline'

export function StatCard({
  label,
  value,
  unit,
  points,
  color,
}: {
  label: string
  value: string
  unit?: string
  points: number[]
  color: string
}) {
  return (
    <div className="rounded-md border border-border bg-surface-100 p-2 flex gap-2 items-end">
      <div>
        <div className="text-xs uppercase tracking-tight leading-3 text-foreground-lighter font-mono">
          {label}
        </div>
        <div className="mt-0.5 flex items-baseline gap-1">
          <span className="text-sm font-mono text-foreground">{value}</span>
          {unit && <span className="text-xs text-foreground-lighter">{unit}</span>}
        </div>
      </div>
      <div className="mt-1 flex-1 flex justify-end">
        <MiniSparkline points={points} color={color} height={20} width={56} />
      </div>
    </div>
  )
}
