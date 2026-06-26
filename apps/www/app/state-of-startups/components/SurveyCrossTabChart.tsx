'use client'

import { useMemo } from 'react'

import type { Aggregation } from '../lib/survey-key'
import { distributionPercent, getDistribution } from '../lib/survey-keys'
import { ChartLegend, SurveyChartShell } from './SurveyChartShell'
import { useYear } from './year-context'

export interface CrossTabCohort {
  label: string
  filter: string
}

export interface CrossTabSeries {
  caption: string
  tone: 'accent' | 'muted'
  query: { column: string; aggregation: Aggregation; target: string | string[] }
}

interface SurveyCrossTabChartProps {
  title: string
  eyebrow?: string
  axisColumn: string
  cohorts: CrossTabCohort[]
  series: CrossTabSeries[]
}

// SVG geometry
const W = 640
const H = 280
const PAD_X = 32
const PAD_TOP = 24
const PAD_BOTTOM = 48

export function SurveyCrossTabChart({
  title,
  eyebrow,
  axisColumn,
  cohorts,
  series,
}: SurveyCrossTabChartProps) {
  const { year } = useYear()

  const lines = useMemo(() => {
    return series.map((s) => {
      const points = cohorts.map((cohort) => {
        const dist = getDistribution(year, s.query.column, s.query.aggregation, {
          [axisColumn]: cohort.filter,
        })
        return distributionPercent(dist, s.query.target)
      })
      return { ...s, points }
    })
  }, [series, cohorts, axisColumn, year])

  const hasData = lines.some((l) => l.points.some((p) => p !== null))

  const innerW = W - PAD_X * 2
  const innerH = H - PAD_TOP - PAD_BOTTOM
  const x = (i: number) =>
    cohorts.length <= 1 ? PAD_X + innerW / 2 : PAD_X + (i * innerW) / (cohorts.length - 1)
  const y = (pct: number) => PAD_TOP + (1 - pct / 100) * innerH

  return (
    <SurveyChartShell eyebrow={eyebrow} title={title} isEmpty={!hasData} emptyNoun="comparison">
      <div className="px-8 pb-10 flex flex-col gap-6">
        <ChartLegend
          items={lines.map((l) => ({ label: l.caption, tone: l.tone, variant: 'line' }))}
        />

        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={title}>
          {/* horizontal gridlines at 0/25/50/75/100% */}
          {[0, 25, 50, 75, 100].map((g) => (
            <g key={g}>
              <line
                x1={PAD_X}
                x2={W - PAD_X}
                y1={y(g)}
                y2={y(g)}
                stroke="hsl(var(--border-muted))"
                strokeWidth={1}
              />
              <text x={4} y={y(g) + 3} className="fill-foreground-muted" fontSize={10}>
                {g}%
              </text>
            </g>
          ))}

          {/* series lines */}
          {lines.map((l) => {
            const pts = l.points
              .map((p, i) => (p === null ? null : `${x(i)},${y(p)}`))
              .filter(Boolean)
              .join(' ')
            const stroke =
              l.tone === 'accent' ? 'hsl(var(--brand))' : 'hsl(var(--foreground-muted))'
            return (
              <g key={l.caption}>
                <polyline
                  points={pts}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={l.tone === 'accent' ? 3 : 2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={l.tone === 'muted' ? '6 4' : undefined}
                />
                {l.points.map((p, i) =>
                  p === null ? null : (
                    <circle
                      key={i}
                      cx={x(i)}
                      cy={y(p)}
                      r={l.tone === 'accent' ? 4 : 3}
                      fill={stroke}
                    />
                  )
                )}
              </g>
            )
          })}

          {/* x-axis cohort labels */}
          {cohorts.map((c, i) => (
            <text
              key={c.label}
              x={x(i)}
              y={H - PAD_BOTTOM + 24}
              textAnchor="middle"
              className="fill-foreground-light"
              fontSize={11}
            >
              {c.label}
            </text>
          ))}
        </svg>
      </div>
    </SurveyChartShell>
  )
}
