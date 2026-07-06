'use client'

import type { DistributionQuery } from '../lib/survey-key'
import { useDistributionPercent } from './use-distribution'

function CompareValue({ caption, query }: { caption: string; query: DistributionQuery }) {
  const percent = useDistributionPercent(query)
  return (
    <div className="flex flex-col gap-1">
      <span className="text-foreground-light text-xs font-mono uppercase tracking-widest">
        {caption}
      </span>
      <span className="text-brand text-4xl md:text-6xl font-mono tracking-tight tabular-nums">
        {percent === null ? '—' : `${percent}%`}
      </span>
    </div>
  )
}

export function SurveyCompareStatCard({
  label,
  a,
  b,
}: {
  label: string
  a: { caption: string; query: DistributionQuery }
  b: { caption: string; query: DistributionQuery }
}) {
  return (
    <div className="flex-1 px-8 py-8 flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-6">
        <CompareValue caption={a.caption} query={a.query} />
        <CompareValue caption={b.caption} query={b.query} />
      </div>
      <p className="text-foreground-light text-sm text-balance">{label}</p>
    </div>
  )
}
