import { describe, expect, it } from 'vitest'

import { getReferenceZoneRuns, getReferenceZoneXBounds } from './ComposedChartReferenceZones.utils'

describe('getReferenceZoneRuns', () => {
  it('merges stable thresholds into one range covering every sample', () => {
    expect(
      getReferenceZoneRuns([
        [2, 4],
        [2, 4],
        [2, 4],
      ])
    ).toEqual([{ startIndex: 0, endIndex: 2, lower: 2, upper: 4 }])
  })

  it('preserves threshold changes at their historical sample', () => {
    expect(
      getReferenceZoneRuns([
        [2, 4],
        [2, 4],
        [4, 8],
        [4, 8],
      ])
    ).toEqual([
      { startIndex: 0, endIndex: 1, lower: 2, upper: 4 },
      { startIndex: 2, endIndex: 3, lower: 4, upper: 8 },
    ])
  })

  it('does not bridge missing threshold data', () => {
    expect(getReferenceZoneRuns([null, [2, 4], null, [2, 4], null])).toEqual([
      { startIndex: 1, endIndex: 1, lower: 2, upper: 4 },
      { startIndex: 3, endIndex: 3, lower: 2, upper: 4 },
    ])
  })

  it.each([{ ranges: [] }, { ranges: [null] }])(
    'returns no runs when no thresholds exist: $ranges',
    ({ ranges }) => {
      expect(getReferenceZoneRuns(ranges)).toEqual([])
    }
  )
})

describe('getReferenceZoneXBounds', () => {
  const data = [1000, 2000, 3000, 4000].map((timestamp) => ({ timestamp }))

  it.each([true, false])(
    'uses the full plot edges for a complete run with visible bars: %s',
    (hasVisibleBars) => {
      const run = { startIndex: 0, endIndex: 3, lower: 2, upper: 4 }
      expect(getReferenceZoneXBounds(run, data, hasVisibleBars)).toEqual({
        x1: undefined,
        x2: undefined,
      })
    }
  )

  it('uses the end of the final categorical bin when bars are visible', () => {
    const run = { startIndex: 1, endIndex: 2, lower: 2, upper: 4 }
    expect(getReferenceZoneXBounds(run, data, true)).toEqual({ x1: 1, x2: 2 })
  })

  it('extends to the next sample on point scales without bridging a missing sample', () => {
    const run = { startIndex: 1, endIndex: 1, lower: 2, upper: 4 }
    expect(getReferenceZoneXBounds(run, data, false)).toEqual({ x1: 1, x2: 2 })
  })

  it('uses configured X-axis values instead of indices when a data key is present', () => {
    const run = { startIndex: 1, endIndex: 2, lower: 2, upper: 4 }
    expect(getReferenceZoneXBounds(run, data, true, 'timestamp')).toEqual({ x1: 2000, x2: 3000 })
    expect(getReferenceZoneXBounds(run, data, false, 'timestamp')).toEqual({ x1: 2000, x2: 4000 })
  })
})
