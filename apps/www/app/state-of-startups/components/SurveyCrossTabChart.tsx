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
  xAxisLabel?: string
  yAxisLabel?: string
}

// SVG geometry
const W = 640
const H = 300
const PAD_LEFT = 52
const PAD_RIGHT = 16
const PAD_TOP = 24
const PAD_BOTTOM = 72

const ACCENT = 'hsl(var(--brand-default))'
const MUTED = 'hsl(var(--foreground-light))'

export function SurveyCrossTabChart({
  title,
  eyebrow,
  axisColumn,
  cohorts,
  series,
  xAxisLabel,
  yAxisLabel = '% of respondents',
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

  const innerW = W - PAD_LEFT - PAD_RIGHT
  const innerH = H - PAD_TOP - PAD_BOTTOM
  const x = (i: number) =>
    cohorts.length <= 1 ? PAD_LEFT + innerW / 2 : PAD_LEFT + (i * innerW) / (cohorts.length - 1)
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
                x1={PAD_LEFT}
                x2={W - PAD_RIGHT}
                y1={y(g)}
                y2={y(g)}
                style={{ stroke: 'hsl(var(--border-muted))' }}
                strokeWidth={1}
              />
              <text
                x={PAD_LEFT - 8}
                y={y(g) + 3}
                textAnchor="end"
                className="fill-foreground-muted"
                fontSize={10}
              >
                {g}%
              </text>
            </g>
          ))}

          {/* y-axis title */}
          <text
            transform={`rotate(-90 14 ${PAD_TOP + innerH / 2})`}
            x={14}
            y={PAD_TOP + innerH / 2}
            textAnchor="middle"
            className="fill-foreground-light"
            fontSize={11}
          >
            {yAxisLabel}
          </text>

          {/* series lines */}
          {lines.map((l) => {
            const pts = l.points
              .map((p, i) => (p === null ? null : `${x(i)},${y(p)}`))
              .filter(Boolean)
              .join(' ')
            const stroke = l.tone === 'accent' ? ACCENT : MUTED
            return (
              <g key={l.caption}>
                <polyline
                  points={pts}
                  fill="none"
                  style={{ stroke }}
                  strokeWidth={l.tone === 'accent' ? 3 : 2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={l.tone === 'muted' ? '7 4' : undefined}
                />
                {l.points.map((p, i) =>
                  p === null ? null : (
                    <circle
                      key={i}
                      cx={x(i)}
                      cy={y(p)}
                      r={l.tone === 'accent' ? 4 : 3.5}
                      style={{ fill: stroke }}
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
              y={H - PAD_BOTTOM + 22}
              textAnchor="middle"
              className="fill-foreground-light"
              fontSize={11}
            >
              {c.label}
            </text>
          ))}

          {/* x-axis title */}
          {xAxisLabel && (
            <text
              x={PAD_LEFT + innerW / 2}
              y={H - 14}
              textAnchor="middle"
              className="fill-foreground-muted"
              fontSize={11}
            >
              {xAxisLabel}
            </text>
          )}
        </svg>
      </div>
    </SurveyChartShell>
  )
}
