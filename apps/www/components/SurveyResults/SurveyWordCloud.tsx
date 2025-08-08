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
    }, 3000)

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
        const nextItemIndex = (index + Math.floor(Date.now() / 3000)) % answers.length
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
    const interval = setInterval(rotateItems, 3000)

    return () => clearInterval(interval)
  }, [isRotating, answers, scramblingTexts, currentItems])

  return (
    <aside className="flex flex-col gap-4 px-3 md:px-6">
      <ol className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        {currentItems.map(({ text, count }, index) => (
          <li
            key={`${text}-${index}`}
            className={`py-4 border-t border-muted border-opacity-50 [&:nth-child(-n+2)]:border-t-0 sm:[&:nth-child(-n+3)]:border-t-0 md:[&:nth-child(-n+4)]:border-t-0`}
          >
            <span className="font-mono md:text-lg text-center text-foreground">
              {scramblingTexts[index].toUpperCase() || text.toUpperCase()}
            </span>
          </li>
        ))}
      </ol>

      <p className="text-foreground-lighter text-sm">{label}</p>
    </aside>
  )
}
