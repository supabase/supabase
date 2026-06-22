'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { useAccent } from './accent-context'
import { useSurveyDataCache } from './survey-data-context'
import { useYear } from './year-context'

const ANIMATION_DURATION = 600

// Stats are written against the 2026 narrative. If a stat declares a
// `source` ({ column, aggregation, target }), the card looks up the live
// percent for the active year in the preloaded stat cache. Otherwise it
// falls back to the static `percent` for 2026 and "—" for other years.
const NARRATIVE_YEAR = 2026

export interface SurveyStatSource {
  column: string
  /**
   * 'single' | 'multi' | 'boolean'. Kept as `string` here so narrative
   * literals don't need `as const` casts; preload-survey-data.ts dispatches
   * on the literal value when calling the matching generic RPC.
   */
  aggregation: string
  /** Bucket label(s) to match in the cached stat rows. Sums when multiple. */
  target: string | string[]
}

interface SurveyStatCardProps {
  label: string
  percent: number
  source?: SurveyStatSource
}

export function SurveyStatCard({ label, percent, source }: SurveyStatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const accent = useAccent()
  const { year } = useYear()
  const { getStat } = useSurveyDataCache()

  const accentBg = 'bg-brand'
  const accentText = 'text-brand'

  // Resolve the percent to display: live value when a source is declared and
  // present in the cache, otherwise fall back to the static 2026 baseline
  // (with "—" on prior years).
  const resolvedPercent: number | null = useMemo(() => {
    if (source) {
      const data = getStat(year, source.column)
      if (data && data.respondentCount > 0) {
        const targets = Array.isArray(source.target) ? source.target : [source.target]
        let count = 0
        let matched = 0
        for (const row of data.rows) {
          if (targets.includes(row.label)) {
            count += row.count
            matched += 1
          }
        }
        if (matched > 0) {
          return Math.round((count / data.respondentCount) * 100)
        }
        // Cache present but target not in this year's rows → option didn't
        // exist that year. Render "—".
        return null
      }
      // No cache entry for this (year, column) — column likely didn't exist
      // that year, or the preload errored. Fall through to the static
      // fallback so the 2026 page still shows something pre-deploy.
    }
    return year === NARRATIVE_YEAR ? percent : null
  }, [source, year, getStat, percent])

  const [displayValue, setDisplayValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [shouldAnimateBar, setShouldAnimateBar] = useState(false)

  // Initial scroll-in animation: count up from 0 to the resolved value the
  // first time the card enters the viewport.
  useEffect(() => {
    if (hasAnimated) return
    if (resolvedPercent === null) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
            setShouldAnimateBar(true)

            const startTime = Date.now()
            const startValue = 0
            const endValue = resolvedPercent

            const animate = () => {
              const elapsed = Date.now() - startTime
              const progress = Math.min(elapsed / ANIMATION_DURATION, 1)
              const easeOutQuart = 1 - Math.pow(1 - progress, 4)
              setDisplayValue(Math.round(startValue + (endValue - startValue) * easeOutQuart))
              if (progress < 1) requestAnimationFrame(animate)
            }

            requestAnimationFrame(animate)
          }
        })
      },
      { threshold: 0.1 }
    )

    const currentCardRef = cardRef.current
    if (currentCardRef) observer.observe(currentCardRef)
    return () => {
      if (currentCardRef) observer.unobserve(currentCardRef)
    }
  }, [resolvedPercent, hasAnimated])

  // After the initial animation, snap to the latest resolved value when the
  // year toggle (or live data) changes.
  useEffect(() => {
    if (!hasAnimated) return
    if (resolvedPercent === null) {
      setDisplayValue(0)
      setShouldAnimateBar(false)
      return
    }
    setDisplayValue(resolvedPercent)
    setShouldAnimateBar(true)
  }, [resolvedPercent, hasAnimated])

  const hasValue = resolvedPercent !== null
  const renderedBarValue = hasValue ? resolvedPercent : 0

  return (
    <div ref={cardRef} className="flex-1 px-8 py-8 flex flex-col gap-4">
      {/* Progress bar */}
      <div
        className="h-2 relative overflow-hidden"
        style={
          {
            '--bar-value': renderedBarValue,
          } as React.CSSProperties
        }
      >
        {/* Background pattern for the entire bar */}
        <div
          className="absolute inset-0 pointer-events-none bg-foreground-muted/80"
          style={{
            maskImage: 'url("/images/state-of-startups/pattern-stipple.svg")',
            maskSize: '4px',
            maskRepeat: 'repeat',
            maskPosition: 'center',
          }}
        />

        {/* Filled portion of the bar (only when there is a value to show) */}
        {hasValue && (
          <div
            className={`h-full relative bg-surface-100`}
            style={{
              width: `calc(max(0.5%, (var(--bar-value) / 100) * 100%))`,
              clipPath: shouldAnimateBar ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
              transition: `clip-path 0.5s steps(${Math.max(2, Math.floor(((resolvedPercent ?? 0) / 100) * 12))}, end)`,
            }}
          >
            <div
              className={`absolute inset-0 pointer-events-none ${accentBg}`}
              style={{
                maskImage: 'url("/images/state-of-startups/pattern-checker.svg")',
                maskSize: '4px',
                maskRepeat: 'repeat',
                maskPosition: 'top left',
              }}
            />
          </div>
        )}
      </div>
      {/* Text */}
      <div className="flex flex-col gap-2">
        {hasValue ? (
          <p
            className={`md:-ml-1 md:mt-8 text-2xl md:text-6xl font-mono tracking-tight inline-block flex flex-row items-baseline ${hasAnimated ? accentText : 'text-foreground-muted'} transition-colors duration-1000`}
          >
            {displayValue}
            <span className="md:text-4xl">%</span>
          </p>
        ) : (
          <p
            className="md:-ml-1 md:mt-8 text-2xl md:text-6xl font-mono tracking-tight inline-block flex flex-row items-baseline text-foreground-muted"
            aria-label={`No ${year} baseline for this stat`}
          >
            —
          </p>
        )}
        <p className="text-foreground-light text-sm text-balance md:mr-6">{label}</p>
      </div>
    </div>
  )
}
