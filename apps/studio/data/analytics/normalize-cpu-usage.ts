import type { DataPoint } from './constants'

export const normalizeCpuUsageDataPoints = (
  data: DataPoint[],
  attributeNames: string[],
  maxPercentage = 100
) => {
  // Normalize CPU busy series to 0-100% so stacked totals don't exceed 100%.
  if (!attributeNames.length) return data

  return data.map((point) => {
    const total = attributeNames.reduce((sum, attribute) => {
      const value = point[attribute]
      const numericValue = typeof value === 'number' ? value : Number(value) || 0
      return sum + numericValue
    }, 0)

    if (total <= maxPercentage || total <= 0) return point

    const scale = maxPercentage / total
    const normalizedPoint: DataPoint = { ...point }

    attributeNames.forEach((attribute) => {
      const value = point[attribute]
      const numericValue = typeof value === 'number' ? value : Number(value) || 0
      normalizedPoint[attribute] = numericValue * scale
    })

    return normalizedPoint
  })
}
