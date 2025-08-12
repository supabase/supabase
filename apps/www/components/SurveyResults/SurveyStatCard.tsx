import { useEffect, useRef, useState } from 'react'

export function SurveyStatCard({
  unit = '%',
  label,
  progressValue,
  maxValue = 100,
}: {
  unit?: string
  label: string
  progressValue: number
  maxValue?: number
}) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [shouldAnimateBar, setShouldAnimateBar] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!progressValue || hasAnimated) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
            setShouldAnimateBar(true)

            // Start counting animation
            const startTime = Date.now()
            const duration = 600
            const startValue = 0
            const endValue = progressValue

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

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current)
      }
    }
  }, [progressValue, hasAnimated])

  return (
    <div ref={cardRef} className="flex-1 px-6 py-8 flex flex-col gap-4">
      {/* Progress bar */}
      {/* Entire bar (including background) */}
      <div
        className="h-2 relative overflow-hidden"
        style={
          {
            '--bar-value': progressValue,
            '--reference': maxValue,
          } as React.CSSProperties
        }
      >
        {/* Background pattern for the entire bar */}
        <div
          className="absolute inset-0 pointer-events-none bg-foreground-muted"
          style={{
            maskImage: 'url("/survey/pattern-back.svg")',
            maskSize: '15px 15px',
            maskRepeat: 'repeat',
            maskPosition: 'center',
          }}
        />

        {/* Filled portion of the bar */}
        <div
          className={`h-full relative bg-surface-100`}
          style={{
            width: `calc(max(0.5%, (var(--bar-value) / var(--reference)) * 100%))`,
            transform: shouldAnimateBar ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin: 'left',
            transition: `transform 0.5s steps(${Math.max(2, Math.floor((progressValue / maxValue) * 12))}, end)`,
          }}
        >
          {/* Foreground pattern for the filled portion */}
          <div
            className={`absolute inset-0 pointer-events-none bg-brand`}
            style={{
              maskImage: 'url("/survey/pattern-front.svg")',
              maskSize: '14.5px 15px',
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
          <span className="md:text-4xl">{unit}</span>
        </p>
        <p className="text-foreground-light text-sm text-balance md:mr-6">{label}</p>
      </div>
    </div>
  )
}
