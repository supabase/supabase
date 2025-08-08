import { useEffect, useState } from 'react'

export function SurveyWordCloud({
  answers,
  label,
}: {
  answers: { text: string; count: number }[]
  label: string
}) {
  const [currentItems, setCurrentItems] = useState<{ text: string; count: number }[]>([])
  const [isRotating, setIsRotating] = useState(false)

  // Calculate the range within the current context
  const counts = answers.map((answer) => answer.count)
  const minCount = Math.min(...counts)
  const maxCount = Math.max(...counts)
  const range = maxCount - minCount

  // Initialize with first 12 items
  useEffect(() => {
    setCurrentItems(answers.slice(0, 12))
  }, [answers])

  // Start rotation after 3 seconds
  useEffect(() => {
    if (answers.length <= 12) return // No need to rotate if we have 12 or fewer items

    const timer = setTimeout(() => {
      setIsRotating(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [answers.length])

  // Simplified rotation logic
  useEffect(() => {
    if (!isRotating || answers.length <= 12) return

    const rotateItems = () => {
      setCurrentItems((prev) => {
        return prev.map((item, index) => {
          // Calculate next item index with wrapping
          const nextItemIndex = (index + Math.floor(Date.now() / 2000)) % answers.length
          return answers[nextItemIndex]
        })
      })
    }

    // Rotate every 4 seconds (slower)
    const interval = setInterval(rotateItems, 4000)

    return () => clearInterval(interval)
  }, [isRotating, answers])

  return (
    <aside className="flex flex-col gap-3 px-6 py-8">
      <p className="text-foreground-light text-sm">{label}</p>
      <ol className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        {currentItems.map(({ text, count }, index) => (
          <li key={`${text}-${index}`} className="py-4 border-t border-muted border-opacity-50">
            <span className="font-mono text-foreground md:text-lg text-center transition-opacity duration-500 ease-in-out">
              {text}
            </span>
          </li>
        ))}
      </ol>
    </aside>
  )
}
