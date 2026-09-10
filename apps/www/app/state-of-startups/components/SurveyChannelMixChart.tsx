'use client'

import { useMemo } from 'react'

import { distributionPercent, getDistribution } from '../lib/survey-keys'
import { ChartLegend, SurveyChartShell } from './SurveyChartShell'
import { useYear } from './year-context'

export interface ChannelCohort {
  label: string
  filter: string
  tone: 'accent' | 'muted'
}

export interface ChannelRow {
  target: string
  display: string
}

interface SurveyChannelMixChartProps {
  title: string
  eyebrow?: string
  column: string
  cohortColumn: string
  cohorts: ChannelCohort[]
  rows: ChannelRow[]
}

export function SurveyChannelMixChart({
  title,
  eyebrow,
  column,
  cohortColumn,
  cohorts,
  rows,
}: SurveyChannelMixChartProps) {
  const { year } = useYear()

  const data = useMemo(() => {
    const cohortDists = cohorts.map((c) =>
      getDistribution(year, column, 'multi', { [cohortColumn]: c.filter })
    )
    return rows.map((row) => ({
      display: row.display,
      values: cohorts.map((_, ci) => distributionPercent(cohortDists[ci], row.target)),
    }))
  }, [year, column, cohortColumn, cohorts, rows])

  const hasData = data.some((r) => r.values.some((v) => v !== null))

  return (
    <SurveyChartShell eyebrow={eyebrow} title={title} isEmpty={!hasData} emptyNoun="breakdown">
      <div className="px-8 pb-10 flex flex-col gap-6">
        <ChartLegend
          items={cohorts.map((c) => ({ label: c.label, tone: c.tone, variant: 'dot' }))}
        />

        <div className="flex flex-col gap-6">
          {data.map((row) => (
            <div key={row.display} className="flex flex-col gap-2">
              <span className="text-foreground text-sm font-mono uppercase tracking-widest">
                {row.display}
              </span>
              <div className="flex flex-col gap-1.5">
                {row.values.map((v, ci) => (
                  <div key={ci} className="flex items-center gap-3">
                    <div className="h-3 flex-1 relative overflow-hidden">
                      <div
                        className="absolute inset-0 pointer-events-none bg-foreground-muted/40"
                        style={{
                          maskImage: 'url("/images/state-of-startups/pattern-stipple.svg")',
                          maskSize: '4px',
                          maskRepeat: 'repeat',
                        }}
                      />
                      <div
                        className={`h-full relative ${cohorts[ci].tone === 'accent' ? 'bg-brand' : 'bg-foreground-light'}`}
                        style={{ width: `${v ?? 0}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-sm font-mono tabular-nums text-foreground-light">
                      {v === null ? '—' : `${v}%`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SurveyChartShell>
  )
}
