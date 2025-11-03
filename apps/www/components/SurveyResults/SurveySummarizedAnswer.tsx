import { useEffect, useState } from 'react'
import './surveyResults.css'

const ROTATION_DURATION = 4000

export function SurveySummarizedAnswer({ label, answers }: { label: string; answers: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isBlinking, setIsBlinking] = useState(false)

  useEffect(() => {
    if (answers.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % answers.length)
    }, ROTATION_DURATION)

    return () => clearInterval(interval)
  }, [answers.length])

  useEffect(() => {
    // First, reset the bar to 0%
    setIsAnimating(false)
    setIsBlinking(false)

    // Then start the animation after a brief delay to ensure the reset is applied
    const startTimer = setTimeout(() => {
      setIsAnimating(true)
    }, 50)

    // Stop the animation after 3 seconds
    const stopTimer = setTimeout(() => {
      setIsAnimating(false)
    }, 4050)

    // Start blinking shortly before text change
    const blinkTimer = setTimeout(() => {
      setIsBlinking(true)
    }, 3700)

    // Stop blinking when text changes
    const stopBlinkTimer = setTimeout(() => {
      setIsBlinking(false)
    }, ROTATION_DURATION)

    return () => {
      clearTimeout(startTimer)
      clearTimeout(stopTimer)
      clearTimeout(blinkTimer)
      clearTimeout(stopBlinkTimer)
    }
  }, [currentIndex])

  return (
    <div className="border-t border-muted flex flex-col gap-6 px-8 py-16 sm:items-center sm:text-center">
      <p
        className="text-foreground text-xl tracking-tight transition-opacity duration-500"
        style={{
          animation: isBlinking ? 'blink 100ms infinite' : 'none',
        }}
      >
        {answers[currentIndex]}
      </p>
      {/* Decorative progress bar */}
      <div aria-hidden="true" className="w-24 h-1 relative overflow-hidden">
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

        {/* Filled portion of the bar - timer-based */}
        <div
          key={currentIndex}
          className={`h-full relative bg-surface-100`}
          style={{
            width: '100%',
            clipPath: isAnimating ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
            transition: isAnimating ? 'clip-path 3s steps(3, end)' : 'clip-path 0s',
          }}
        >
          {/* Foreground pattern for the filled portion */}
          <div
            className={`absolute inset-0 pointer-events-none bg-brand`}
            style={{
              maskImage: 'url("/images/state-of-startups/pattern-checker.svg")',
              maskSize: '4px',
              maskRepeat: 'repeat',
              maskPosition: 'center',
            }}
          />
        </div>
      </div>
      <p className="w-full text-foreground-lighter text-sm font-mono uppercase tracking-wider">
        {label}
      </p>
    </div>
  )
}
