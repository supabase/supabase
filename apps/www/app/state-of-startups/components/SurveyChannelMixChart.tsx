'use client'

import { useMemo } from 'react'

import { distributionPercent, getDistribution } from '../lib/survey-keys'
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
    <div
      className="w-full bg-200 border-t border-muted"
      style={{
        background: `radial-gradient(circle at center -150%, hsl(var(--brand-300)), transparent 80%), radial-gradient(ellipse at center 230%, hsl(var(--background-surface-200)), transparent 75%)`,
      }}
    >
      <header className="px-8 py-8">
        {eyebrow && (
          <p className="text-foreground/30 text-sm font-mono uppercase tracking-widest">
            {eyebrow}
          </p>
        )}
        <h3 className="text-foreground text-xl tracking-tight text-balance">{title}</h3>
      </header>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 px-8 text-center">
          <p className="text-foreground-light text-balance">No data for {year}.</p>
        </div>
      ) : (
        <div className="px-8 pb-10 flex flex-col gap-6">
          {/* Legend */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {cohorts.map((c) => (
              <div key={c.label} className="flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 ${c.tone === 'accent' ? 'bg-brand' : 'bg-foreground-muted'}`}
                />
                <span className="text-foreground-light text-xs font-mono uppercase tracking-widest">
                  {c.label}
                </span>
              </div>
            ))}
          </div>

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
      )}
    </div>
  )
}
