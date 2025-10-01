export const percentile = (values: number[], p: number) => {
  if (!values.length) return 0
  if (values.length === 1) return values[0]

  const sorted = [...values].sort((a, b) => a - b)
  const lastIndex = sorted.length - 1
  const targetIndex = Math.min(lastIndex, Math.floor(p * lastIndex))
  return sorted[targetIndex]
}
