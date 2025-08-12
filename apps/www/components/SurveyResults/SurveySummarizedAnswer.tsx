import { useEffect, useState } from 'react'

export function SurveySummarizedAnswer({ label, answers }: { label: string; answers: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (answers.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % answers.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [answers.length])

  useEffect(() => {
    // First, reset the bar to 0%
    setIsAnimating(false)

    // Then start the animation after a brief delay to ensure the reset is applied
    const startTimer = setTimeout(() => {
      setIsAnimating(true)
    }, 50)

    // Stop the animation after 3 seconds
    const stopTimer = setTimeout(() => {
      setIsAnimating(false)
    }, 4050)

    return () => {
      clearTimeout(startTimer)
      clearTimeout(stopTimer)
    }
  }, [currentIndex])

  return (
    <div className="flex flex-col gap-6 px-8 py-16 sm:items-center sm:text-center">
      <p className="text-foreground text-xl transition-opacity duration-500">
        {answers[currentIndex]}
      </p>
      {/* Decorative progress bar */}
      <div aria-hidden="true" className="w-24 h-1 relative overflow-hidden">
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

        {/* Filled portion of the bar - timer-based */}
        <div
          key={currentIndex}
          className={`h-full relative bg-surface-100`}
          style={{
            width: '100%',
            transform: isAnimating ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin: 'left',
            transition: isAnimating ? 'transform 3s steps(3, end)' : 'transform 0s',
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
      <p className="w-full text-foreground-lighter text-sm font-mono uppercase">{label}</p>
    </div>
  )
}
