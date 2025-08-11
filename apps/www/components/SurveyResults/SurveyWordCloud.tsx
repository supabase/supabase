import { useEffect, useState } from 'react'

const TIMER_DURATION = 3000

export function SurveyWordCloud({
  answers,
  label,
}: {
  answers: { text: string; count: number }[]
  label: string
}) {
  const [currentItems, setCurrentItems] = useState<{ text: string; count: number }[]>([])
  const [isRotating, setIsRotating] = useState(false)
  const [scramblingTexts, setScramblingTexts] = useState<string[]>([])

  // Calculate the range within the current context
  const counts = answers.map((answer) => answer.count)
  const minCount = Math.min(...counts)
  const maxCount = Math.max(...counts)
  const range = maxCount - minCount

  // Initialize with first 12 items
  useEffect(() => {
    const initialItems = answers.slice(0, 12)
    setCurrentItems(initialItems)
    setScramblingTexts(initialItems.map((item) => item.text))
  }, [answers])

  // Start rotation after 3 seconds
  useEffect(() => {
    if (answers.length <= 12) return // No need to rotate if we have 12 or fewer items

    const timer = setTimeout(() => {
      setIsRotating(true)
    }, TIMER_DURATION)

    return () => clearTimeout(timer)
  }, [answers.length])

  // Airport board scramble effect
  useEffect(() => {
    if (!isRotating || answers.length <= 12 || scramblingTexts.length === 0) return

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const characterDelay = 50 // 50ms between each character change

    const rotateItems = () => {
      const newItems = currentItems.map((item, index) => {
        // Calculate next item index with wrapping
        const nextItemIndex = (index + Math.floor(Date.now() / TIMER_DURATION)) % answers.length
        return answers[nextItemIndex]
      })

      setCurrentItems(newItems)

      // Start scramble animation for each item
      newItems.forEach((newItem, index) => {
        const oldText = scramblingTexts[index] || ''
        const newText = newItem.text
        const maxLength = Math.max(oldText.length, newText.length)

        for (let charIndex = 0; charIndex < maxLength; charIndex++) {
          setTimeout(() => {
            const newChar = newText[charIndex]

            // If we're past the old text length, just show the new char
            if (charIndex >= oldText.length) {
              if (newChar) {
                // Only animate if there's actually a character to show
                setScramblingTexts((prev) => {
                  const updated = [...prev]
                  updated[index] = (updated[index] || '').substring(0, charIndex) + newChar
                  return updated
                })
              }
              return
            }

            // If we're past the new text length, remove the character
            if (charIndex >= newText.length) {
              setScramblingTexts((prev) => {
                const updated = [...prev]
                updated[index] = (updated[index] || '').substring(0, charIndex)
                return updated
              })
              return
            }

            // Scramble through alphabet for existing characters that are being replaced
            let scrambleCount = 0
            const scrambleInterval = setInterval(() => {
              const randomChar = alphabet[Math.floor(Math.random() * alphabet.length)]

              setScramblingTexts((prev) => {
                const updated = [...prev]
                const currentText = updated[index] || ''
                updated[index] =
                  currentText.substring(0, charIndex) +
                  randomChar +
                  currentText.substring(charIndex + 1)
                return updated
              })

              scrambleCount++
              if (scrambleCount >= 8) {
                // Scramble 8 times before settling
                clearInterval(scrambleInterval)
                setScramblingTexts((prev) => {
                  const updated = [...prev]
                  const currentText = updated[index] || ''
                  updated[index] =
                    currentText.substring(0, charIndex) +
                    newChar +
                    currentText.substring(charIndex + 1)
                  return updated
                })
              }
            }, characterDelay)
          }, charIndex * 100) // Stagger each character
        }
      })
    }

    // Rotate every 3 seconds
    const interval = setInterval(rotateItems, TIMER_DURATION)

    return () => clearInterval(interval)
  }, [isRotating, answers, scramblingTexts, currentItems])

  return (
    <aside className="flex flex-col gap-8 px-3 md:px-6">
      <p className="text-foreground-lighter text-sm">{label}</p>
      <ol className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-16 gap-y-10">
        {currentItems.map(({ text, count }, index) => (
          <li key={`${text}-${index}`} className={`flex flex-col gap-2 items-start`}>
            {/* Progress bar */}
            {count && (
              <div
                className="h-[2px] flex items-center w-full"
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
                    width: `calc(max(0.5%, (${count} / ${maxCount}) * 100%))`,
                    transform: isRotating ? 'scaleX(1)' : 'scaleX(0)',
                    transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  }}
                />
              </div>
            )}
            <span className="font-mono md:text-lg text-center text-foreground">
              {scramblingTexts[index].toUpperCase() || text.toUpperCase()}
            </span>
          </li>
        ))}
      </ol>
    </aside>
  )
}
