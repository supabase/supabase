import { useState, useEffect } from 'react'

export function SurveySummarizedAnswer({ label, answers }: { label: string; answers: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (answers.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % answers.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [answers.length])

  if (answers.length <= 1) {
    return (
      <div className="flex flex-col gap-3">
        <p className="font-mono text-brand text-2xl">{answers[0]}</p>
        <p className="text-foreground-light text-sm">{label}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="min-h-[1.5rem] flex items-center">
        <p className="font-mono text-brand text-2xl transition-opacity duration-500">
          {answers[currentIndex]}
        </p>
      </div>
      <p className="text-foreground-light text-sm">{label}</p>
    </div>
  )
}
