export const percentile = (values: number[], p: number) => {
  if (!values.length) return 0
  if (values.length === 1) return values[0]

  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))
  return sorted[index]
}
