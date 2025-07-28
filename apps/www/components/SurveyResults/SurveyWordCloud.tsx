export function SurveyWordCloud({
  answers,
  label,
}: {
  answers: { text: string; count: number }[]
  label: string
}) {
  // Calculate the range within the current context
  const counts = answers.map((answer) => answer.count)
  const minCount = Math.min(...counts)
  const maxCount = Math.max(...counts)
  const range = maxCount - minCount

  // Define font size classes (from smallest to largest)
  const fontSizes = [
    'text-xs', // 12px
    'text-sm', // 14px
    'text-base', // 16px
    'text-lg', // 18px
    'text-xl', // 20px
    'text-2xl', // 24px
    'text-3xl', // 30px
    'text-4xl', // 36px
  ]

  const getFontSize = (count: number) => {
    if (range === 0) {
      // If all counts are the same, use middle size
      return fontSizes[Math.floor(fontSizes.length / 2)]
    }

    // Map count to font size based on its position in the range
    const normalizedPosition = (count - minCount) / range
    const sizeIndex = Math.floor(normalizedPosition * (fontSizes.length - 1))
    return fontSizes[Math.min(sizeIndex, fontSizes.length - 1)]
  }

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-wrap gap-3 items-baseline">
        {answers.map(({ text, count }, index) => (
          <li key={index} className={`font-mono text-brand ${getFontSize(count)}`}>
            {text}
          </li>
        ))}
      </ol>
      <p className="text-foreground-light text-sm">{label}</p>
    </div>
  )
}
