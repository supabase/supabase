'use client'

import { useEffect, useRef, useState } from 'react'

import type { DistributionQuery, SurveyFilters } from '../lib/survey-key'
import { useDistributionPercent } from './use-distribution'
import { useYear } from './year-context'

const ANIMATION_DURATION = 600

export interface StatQuery extends DistributionQuery {
  newIn2026?: boolean
}

interface SurveyStatCardProps {
  label: string
  /** Data-driven percent. Omit when `value` is provided. */
  query?: StatQuery
  /** Static percent to display as-is (for derived/combined figures that don't
   *  map to a single column). Overrides `query`. */
  value?: number
  /** Section-level cohort toggle filter, merged on top of the query filters. */
  cohortFilter?: SurveyFilters
}

export function SurveyStatCard({ label, query, value, cohortFilter }: SurveyStatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const { year } = useYear()

  const accentBg = 'bg-brand'
  const accentText = 'text-brand'

  // A static `value` wins; otherwise resolve from the embedded dataset for the
  // active year. Returns null when the option/column has no data that year
  // (e.g. a new-in-2026 question viewed at 2025), which renders an em dash.
  const queried = useDistributionPercent(query, cohortFilter)
  const resolvedPercent = value ?? queried

  const isNewThisYear = resolvedPercent === null && query?.newIn2026 && year < 2026

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
  // year toggle (or cohort toggle) changes.
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
            aria-label={isNewThisYear ? 'New in 2026' : `No ${year} baseline for this stat`}
          >
            {isNewThisYear ? (
              <span className="text-base md:text-2xl self-center">New in 2026</span>
            ) : (
              '—'
            )}
          </p>
        )}
        <p className="text-foreground-light text-sm text-balance md:mr-6">{label}</p>
      </div>
    </div>
  )
}
