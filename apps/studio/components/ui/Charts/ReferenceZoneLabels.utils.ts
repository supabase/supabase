export function getReferenceZoneLabelPositions(
  positions: number[],
  minimum: number,
  maximum: number,
  minSpacing = 24
): number[] {
  if (positions.length === 0) return []

  const spacing = Math.min(minSpacing, (maximum - minimum) / Math.max(1, positions.length - 1))
  const ordered = positions
    .map((position, index) => ({ position, index }))
    .sort((a, b) => a.position - b.position)
  const placed = ordered.map(({ position }) => Math.min(maximum, Math.max(minimum, position)))

  for (let index = 1; index < placed.length; index++) {
    placed[index] = Math.max(placed[index], placed[index - 1] + spacing)
  }

  placed[placed.length - 1] = Math.min(maximum, placed[placed.length - 1])
  for (let index = placed.length - 2; index >= 0; index--) {
    placed[index] = Math.min(placed[index], placed[index + 1] - spacing)
  }

  const result = [...positions]
  ordered.forEach(({ index }, orderedIndex) => {
    result[index] = placed[orderedIndex]
  })
  return result
}
