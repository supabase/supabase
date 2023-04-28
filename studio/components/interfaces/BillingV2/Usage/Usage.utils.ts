import { DataPoint } from 'data/analytics/constants'

// [Joshen] This is just for development
export const generateUsageData = (attribute: string, days: number): DataPoint[] => {
  const tempArray = new Array(days).fill(0)
  return tempArray.map((x, idx) => {
    return {
      loopId: (idx + 1).toString(),
      period_start: '',
      [attribute]: Math.floor(Math.random() * 100).toString(),
    }
  })
}
