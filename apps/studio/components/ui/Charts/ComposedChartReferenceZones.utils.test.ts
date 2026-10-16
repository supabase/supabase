import { describe, expect, it } from 'vitest'

import {
  getHighestCrossedReferenceZone,
  getReferenceZoneMaximum,
  getReferenceZoneRuns,
  getReferenceZoneXBounds,
} from './ComposedChartReferenceZones.utils'

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

describe('getHighestCrossedReferenceZone', () => {
  const zonesForThresholds = (thresholds: number[], endIndex = 0) =>
    thresholds.map((lower) => ({
      runs: [{ startIndex: 0, endIndex, lower, upper: lower + 10 }],
    }))
  const zones = zonesForThresholds([100, 180, 190])

  it.each([
    { value: 0, expected: undefined },
    { value: 99, expected: undefined },
    { value: 100, expected: undefined },
    { value: 101, expected: 0 },
    { value: 180, expected: 0 },
    { value: 181, expected: 1 },
    { value: 190, expected: 1 },
    { value: 191, expected: 2 },
  ])(
    'requires a strict crossing and selects only the highest boundary at $value',
    ({ value, expected }) => {
      expect(getHighestCrossedReferenceZone([{ memory: value }], zones, 'memory')).toBe(expected)
    }
  )

  it('keeps the highest historical crossing when the latest sample has recovered', () => {
    const data = [{ memory: 205 }, { memory: 90 }]
    expect(
      getHighestCrossedReferenceZone(data, zonesForThresholds([100, 180, 190], 1), 'memory')
    ).toBe(2)
  })

  it('compares each metric sample to its own compute capacity', () => {
    const historicalZones = [100, 180, 190].map((lower) => ({
      runs: [
        { startIndex: 0, endIndex: 0, lower, upper: 500 },
        { startIndex: 1, endIndex: 1, lower: lower * 2, upper: 500 },
      ],
    }))
    expect(
      getHighestCrossedReferenceZone([{ memory: 95 }, { memory: 250 }], historicalZones, 'memory')
    ).toBe(0)
  })

  it('ignores missing capacity at a sample instead of applying an earlier threshold', () => {
    expect(
      getHighestCrossedReferenceZone([{ memory: 90 }, { memory: 999 }], zones, 'memory')
    ).toBeUndefined()
  })

  it('retains a valid historical crossing when the latest metric is missing', () => {
    expect(
      getHighestCrossedReferenceZone(
        [{ memory: 205 }, {}],
        zonesForThresholds([100, 180, 190], 1),
        'memory'
      )
    ).toBe(2)
  })

  it.each([Number.NaN, Infinity, -Infinity, -1, '999'])(
    'ignores invalid metric readings: %s',
    (memory) => {
      expect(getHighestCrossedReferenceZone([{ memory }], zones, 'memory')).toBeUndefined()
    }
  )

  it('selects no threshold without a metric opt-in or without data', () => {
    expect(getHighestCrossedReferenceZone([{ memory: 999 }], zones)).toBeUndefined()
    expect(getHighestCrossedReferenceZone([], zones, 'memory')).toBeUndefined()
    expect(getHighestCrossedReferenceZone([{ memory: 999 }], [], 'memory')).toBeUndefined()
    expect(getHighestCrossedReferenceZone([{}], zones, 'memory')).toBeUndefined()
  })
})

describe('getReferenceZoneMaximum', () => {
  const zones = [
    { runs: [{ startIndex: 0, endIndex: 0, lower: 5, upper: 7.4 }] },
    { runs: [{ startIndex: 0, endIndex: 0, lower: 7.4, upper: 8.2 }] },
    { runs: [{ startIndex: 0, endIndex: 0, lower: 8.2, upper: 9 }] },
  ]

  it.each([3, 6])(
    'uses full capacity even when the selected warning is absent or acknowledgment at %s',
    (memory) => {
      expect(getHighestCrossedReferenceZone([{ memory }], zones, 'memory')).toBe(
        memory === 3 ? undefined : 0
      )
      expect(getReferenceZoneMaximum(zones)).toBe(9)
    }
  )

  it('retains the largest capacity across historical compute changes', () => {
    expect(
      getReferenceZoneMaximum([
        {
          runs: [
            { startIndex: 0, endIndex: 0, lower: 15.4, upper: 17 },
            { startIndex: 1, endIndex: 1, lower: 8.2, upper: 9 },
          ],
        },
      ])
    ).toBe(17)
  })

  it('includes the extreme range upper bound when commitments exceed capacity', () => {
    expect(
      getReferenceZoneMaximum([
        ...zones,
        { runs: [{ startIndex: 0, endIndex: 0, lower: 8.2, upper: 12 }] },
      ])
    ).toBe(12)
  })

  it('ignores nonfinite bounds and returns zero when no capacity is known', () => {
    expect(
      getReferenceZoneMaximum([
        {
          runs: [
            { startIndex: 0, endIndex: 0, lower: 5, upper: Infinity },
            { startIndex: 1, endIndex: 1, lower: 5, upper: Number.NaN },
          ],
        },
      ])
    ).toBe(0)
    expect(getReferenceZoneMaximum([])).toBe(0)
  })
})

it('excludes the always-visible capacity line from warning selection even when commitments exceed it', () => {
  const zones = [100, 180, 190, 200].map((lower, index) => ({
    runs: [{ startIndex: 0, endIndex: 0, lower, upper: lower }],
    isAlwaysVisible: index === 3,
  }))

  expect(getHighestCrossedReferenceZone([{ memory: 250 }], zones, 'memory')).toBe(2)
  expect(getHighestCrossedReferenceZone([{ memory: 250 }], [zones[3]], 'memory')).toBeUndefined()
})
