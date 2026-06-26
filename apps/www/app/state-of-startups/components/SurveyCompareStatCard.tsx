'use client'

import { useMemo } from 'react'

import { distributionPercent, getDistribution } from '../lib/survey-keys'
import type { Aggregation, SurveyFilters } from '../lib/survey-keys'
import { useYear } from './year-context'

// Local mirror of the narrative StatQuery shape (avoids a data-file import cycle).
interface CompareQuery {
  column: string
  aggregation: Aggregation
  target: string | string[]
  filters?: SurveyFilters
}

function usePercent(query: CompareQuery): number | null {
  const { year } = useYear()
  return useMemo(() => {
    const dist = getDistribution(year, query.column, query.aggregation, query.filters)
    return distributionPercent(dist, query.target)
  }, [year, query.column, query.aggregation, query.target, query.filters])
}

function CompareValue({ caption, query }: { caption: string; query: CompareQuery }) {
  const percent = usePercent(query)
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
  a: { caption: string; query: CompareQuery }
  b: { caption: string; query: CompareQuery }
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
