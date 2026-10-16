import { describe, expect, it } from 'vitest'

import {
  getEmphasizedReferenceZones,
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

describe('getEmphasizedReferenceZones', () => {
  const zonesForThresholds = (thresholds: number[], endIndex = 0) =>
    thresholds.map((lower) => ({
      runs: [{ startIndex: 0, endIndex, lower, upper: lower + 10 }],
    }))
  const zones = zonesForThresholds([100, 180, 190])

  it.each([
    { value: 0, expected: [0] },
    { value: 99, expected: [0] },
    { value: 100, expected: [0, 1] },
    { value: 179, expected: [0, 1] },
    { value: 180, expected: [1, 2] },
    { value: 189, expected: [1, 2] },
    { value: 190, expected: [2] },
    { value: 300, expected: [2] },
  ])('emphasizes the current and next boundaries at $value', ({ value, expected }) => {
    expect([...getEmphasizedReferenceZones([{ memory: value }], zones, 'memory')]).toEqual(expected)
  })

  it.each([Number.NaN, Infinity, -Infinity, -1, '99'])(
    'keeps all thresholds readable for invalid latest values: %s',
    (memory) => {
      expect([...getEmphasizedReferenceZones([{ memory }], zones, 'memory')]).toEqual([0, 1, 2])
    }
  )

  it('uses the latest metric and latest compute thresholds without stale fallback', () => {
    const data = [{ memory: 90 }, { memory: 185 }]
    const historicalZones = zonesForThresholds([100, 180, 190], 1)
    historicalZones.forEach((zone) => {
      zone.runs.unshift({ startIndex: 0, endIndex: 0, lower: zone.runs[0].lower * 2, upper: 500 })
    })

    expect([...getEmphasizedReferenceZones(data, historicalZones, 'memory')]).toEqual([1, 2])
    expect([
      ...getEmphasizedReferenceZones([{ memory: 90 }, {}], historicalZones, 'memory'),
    ]).toEqual([0, 1, 2])
  })

  it('keeps every threshold readable if the latest capacity is missing', () => {
    expect([
      ...getEmphasizedReferenceZones([{ memory: 90 }, { memory: 90 }], zones, 'memory'),
    ]).toEqual([0, 1, 2])
  })

  it('leaves generic charts fully emphasized unless they opt in to a metric', () => {
    expect([...getEmphasizedReferenceZones([{ memory: 0 }], zones)]).toEqual([0, 1, 2])
  })

  it('returns no emphasis entries for no zones', () => {
    expect([...getEmphasizedReferenceZones([{ memory: 100 }], [], 'memory')]).toEqual([])
  })
})
