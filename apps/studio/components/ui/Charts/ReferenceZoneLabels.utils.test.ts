import { describe, expect, it } from 'vitest'

import { getReferenceZoneLabelPositions } from './ReferenceZoneLabels.utils'

describe('getReferenceZoneLabelPositions', () => {
  it('leaves labels in place when they are already separated', () => {
    expect(getReferenceZoneLabelPositions([15, 50, 95], 10, 110)).toEqual([15, 50, 95])
  })

  it('separates three nearby thresholds while preserving their original order', () => {
    const result = getReferenceZoneLabelPositions([60, 20, 29], 10, 110)

    expect(result[2] - result[1]).toBeGreaterThanOrEqual(24)
    expect(result[0] - result[2]).toBeGreaterThanOrEqual(24)
  })

  it.each([{ positions: [0, 5, 8] }, { positions: [102, 105, 120] }])(
    'keeps labels within plot bounds when they collide near an edge: $positions',
    ({ positions }) => {
      const result = getReferenceZoneLabelPositions(positions, 10, 110)

      expect(Math.min(...result)).toBeGreaterThanOrEqual(10)
      expect(Math.max(...result)).toBeLessThanOrEqual(110)
      expect(result[1] - result[0]).toBeGreaterThanOrEqual(24)
      expect(result[2] - result[1]).toBeGreaterThanOrEqual(24)
    }
  )

  it('uses available space when the plot cannot fit the preferred spacing', () => {
    const result = getReferenceZoneLabelPositions([15, 16, 17], 10, 40)

    expect(result).toEqual([10, 25, 40])
  })

  it('does not mutate the target threshold positions', () => {
    const positions = [20, 21, 22]
    getReferenceZoneLabelPositions(positions, 10, 110)

    expect(positions).toEqual([20, 21, 22])
  })

  it('returns no labels for empty data', () => {
    expect(getReferenceZoneLabelPositions([], 10, 110)).toEqual([])
  })
})
