import { useEffect, useRef, useState } from 'react'

export function SurveyStatCard({
  unit = '%',
  label,
  progressValue,
  maxValue = 100,
}: {
  unit?: string
  label: string
  progressValue?: number
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

  // Format display value to always show two digits
  const formattedValue = displayValue.toString().padStart(2, '0')

  return (
    <div ref={cardRef} className="flex-1 px-6 py-8 flex flex-col gap-4">
      {/* Progress bar */}
      {progressValue !== undefined && (
        <div
          className="h-[6px] flex items-center mr-12"
          style={
            {
              background: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 3px,
                  color-mix(in srgb, hsl(var(--foreground-muted)) 50%, transparent) 3px,
                  color-mix(in srgb, hsl(var(--foreground-muted)) 50%, transparent) 4px
                )`,
            } as React.CSSProperties
          }
        >
          <div
            className="h-full bg-brand origin-left"
            style={{
              width: `calc(max(0.5%, (${progressValue} / ${maxValue}) * 100%))`,
              transform: shouldAnimateBar ? 'scaleX(1)' : 'scaleX(0)',
              transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <p className="-ml-1 md:mt-8 text:2xl md:text-6xl font-mono tracking-tight inline-block flex flex-row items-baseline text-foreground">
          {formattedValue}
          <span className="text-sm md:text-4xl">{unit}</span>
        </p>
        <p className="text-foreground-light text-sm">{label}</p>
      </div>
    </div>
  )
}
