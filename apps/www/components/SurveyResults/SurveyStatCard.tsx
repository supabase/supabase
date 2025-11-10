import { useEffect, useRef, useState } from 'react'

const ANIMATION_DURATION = 600

// These values are calculated via static SQL queries under 'Key Stats' and rounded for display in data/surveys/state-of-startups-2025.tsx file
export function SurveyStatCard({ label, percent }: { label: string; percent: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [shouldAnimateBar, setShouldAnimateBar] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!percent || hasAnimated) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
            setShouldAnimateBar(true)

            // Start counting animation
            const startTime = Date.now()
            const duration = ANIMATION_DURATION
            const startValue = 0
            const endValue = percent

            const animate = () => {
              const elapsed = Date.now() - startTime
              const progress = Math.min(elapsed / duration, 1)

              // Easing function for smooth animation
              const easeOutQuart = 1 - Math.pow(1 - progress, 4)
              const currentValue = Math.round(startValue + (endValue - startValue) * easeOutQuart)

              setDisplayValue(currentValue)

              if (progress < 1) {
                requestAnimationFrame(animate)
              }
            }

            requestAnimationFrame(animate)
          }
        })
      },
      { threshold: 0.1 }
    )

    const currentCardRef = cardRef.current
    if (currentCardRef) {
      observer.observe(currentCardRef)
    }

    return () => {
      if (currentCardRef) {
        observer.unobserve(currentCardRef)
      }
    }
  }, [percent, hasAnimated])

  return (
    <div ref={cardRef} className="flex-1 px-8 py-8 flex flex-col gap-4">
      {/* Progress bar */}
      <div
        className="h-2 relative overflow-hidden"
        style={
          {
            '--bar-value': percent,
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

        {/* Filled portion of the bar */}
        <div
          className={`h-full relative bg-surface-100`}
          style={{
            width: `calc(max(0.5%, (var(--bar-value) / 100) * 100%))`,
            clipPath: shouldAnimateBar ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
            transition: `clip-path 0.5s steps(${Math.max(2, Math.floor((percent / 100) * 12))}, end)`,
          }}
        >
          {/* Foreground pattern for the filled portion */}
          <div
            className={`absolute inset-0 pointer-events-none bg-brand`}
            style={{
              maskImage: 'url("/images/state-of-startups/pattern-checker.svg")',
              maskSize: '4px',
              maskRepeat: 'repeat',
              maskPosition: 'top left',
            }}
          />
        </div>
      </div>
      {/* Text */}
      <div className="flex flex-col gap-2">
        <p
          className={`md:-ml-1 md:mt-8 text-2xl md:text-6xl font-mono tracking-tight inline-block flex flex-row items-baseline ${hasAnimated ? 'text-brand' : 'text-foreground-muted'} transition-colors duration-1000`}
        >
          {displayValue}
          <span className="md:text-4xl">%</span>
        </p>
        <p className="text-foreground-light text-sm text-balance md:mr-6">{label}</p>
      </div>
    </div>
  )
}
