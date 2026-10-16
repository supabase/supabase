import { describe, expect, it } from 'vitest'

import type { ThresholdZone } from './ComposedChart.utils'
import {
  getHighestCrossedThresholdZone,
  getThresholdZoneChart,
  getThresholdZoneMaximum,
  getThresholdZoneRuns,
  getThresholdZoneValues,
  getThresholdZoneXBounds,
} from './ComposedChartThresholdZones.utils'

describe('historical threshold segments', () => {
  it('merges stable thresholds into one range covering every sample', () => {
    expect(
      getThresholdZoneRuns([
        [2, 4],
        [2, 4],
        [2, 4],
      ])
    ).toEqual([{ startIndex: 0, endIndex: 2, lower: 2, upper: 4 }])
  })

  it('preserves threshold changes at their historical sample', () => {
    expect(
      getThresholdZoneRuns([
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
    expect(getThresholdZoneRuns([null, [2, 4], null, [2, 4], null])).toEqual([
      { startIndex: 1, endIndex: 1, lower: 2, upper: 4 },
      { startIndex: 3, endIndex: 3, lower: 2, upper: 4 },
    ])
  })

  it('returns no segments for an empty dataset', () => {
    expect(getThresholdZoneRuns([])).toEqual([])
  })
})

describe('threshold alignment with chart edges', () => {
  const data = [1000, 2000, 3000, 4000].map((timestamp) => ({ timestamp }))

  it.each([true, false])(
    'uses the full plot edges for a complete run with visible bars: %s',
    (hasVisibleBars) => {
      const run = { startIndex: 0, endIndex: 3, lower: 2, upper: 4 }
      expect(getThresholdZoneXBounds(run, data, hasVisibleBars)).toEqual({
        x1: undefined,
        x2: undefined,
      })
    }
  )

  it('uses the end of the final categorical bin when bars are visible', () => {
    const run = { startIndex: 1, endIndex: 2, lower: 2, upper: 4 }
    expect(getThresholdZoneXBounds(run, data, true)).toEqual({ x1: 1, x2: 2 })
  })

  it('extends to the next sample on point scales without bridging a missing sample', () => {
    const run = { startIndex: 1, endIndex: 1, lower: 2, upper: 4 }
    expect(getThresholdZoneXBounds(run, data, false)).toEqual({ x1: 1, x2: 2 })
  })

  it('uses configured X-axis values instead of indices when a data key is present', () => {
    const run = { startIndex: 1, endIndex: 2, lower: 2, upper: 4 }
    expect(getThresholdZoneXBounds(run, data, true, 'timestamp')).toEqual({ x1: 2000, x2: 3000 })
    expect(getThresholdZoneXBounds(run, data, false, 'timestamp')).toEqual({ x1: 2000, x2: 4000 })
  })
})

describe('highest risk crossed during the selected range', () => {
  const WARNING = 0
  const PROBLEMATIC = 1
  const SEVERE = 2
  const makeRiskZones = (thresholds: number[], endIndex = 0) =>
    thresholds.map((lower) => ({
      runs: [{ startIndex: 0, endIndex, lower, upper: 100 }],
    }))
  const zones = makeRiskZones([50, 80, 90])

  it.each([
    { value: 0, expected: undefined },
    { value: 49, expected: undefined },
    { value: 50, expected: undefined },
    { value: 51, expected: WARNING },
    { value: 80, expected: WARNING },
    { value: 81, expected: PROBLEMATIC },
    { value: 90, expected: PROBLEMATIC },
    { value: 91, expected: SEVERE },
  ])(
    'requires a value above the boundary and selects the highest risk at $value',
    ({ value, expected }) => {
      expect(getHighestCrossedThresholdZone([{ memory: value }], zones, 'memory')).toBe(expected)
    }
  )

  it('keeps the highest historical crossing when the latest sample has recovered', () => {
    const data = [{ memory: 95 }, { memory: 40 }]
    expect(getHighestCrossedThresholdZone(data, makeRiskZones([50, 80, 90], 1), 'memory')).toBe(
      SEVERE
    )
  })

  it('compares each metric sample to its own compute capacity', () => {
    const historicalZones = [50, 80, 90].map((lower) => ({
      runs: [
        { startIndex: 0, endIndex: 0, lower, upper: 200 },
        { startIndex: 1, endIndex: 1, lower: lower * 2, upper: 200 },
      ],
    }))
    expect(
      getHighestCrossedThresholdZone([{ memory: 45 }, { memory: 125 }], historicalZones, 'memory')
    ).toBe(WARNING)
  })

  it('ignores missing capacity at a sample instead of applying an earlier threshold', () => {
    expect(
      getHighestCrossedThresholdZone([{ memory: 40 }, { memory: 999 }], zones, 'memory')
    ).toBeUndefined()
  })

  it('retains a valid historical crossing when the latest metric is missing', () => {
    expect(
      getHighestCrossedThresholdZone([{ memory: 95 }, {}], makeRiskZones([50, 80, 90], 1), 'memory')
    ).toBe(SEVERE)
  })

  it.each([Number.NaN, Infinity, -Infinity, -1, '999'])(
    'ignores invalid metric readings: %s',
    (memory) => {
      expect(getHighestCrossedThresholdZone([{ memory }], zones, 'memory')).toBeUndefined()
    }
  )

  it('selects no threshold without a metric opt-in or without data', () => {
    expect(getHighestCrossedThresholdZone([{ memory: 999 }], zones)).toBeUndefined()
    expect(getHighestCrossedThresholdZone([], zones, 'memory')).toBeUndefined()
    expect(getHighestCrossedThresholdZone([{ memory: 999 }], [], 'memory')).toBeUndefined()
    expect(getHighestCrossedThresholdZone([{}], zones, 'memory')).toBeUndefined()
  })

  it('excludes the always-visible capacity line from warning selection even when commitments exceed it', () => {
    const zones = [50, 80, 90, 100].map((lower) => ({
      runs: [{ startIndex: 0, endIndex: 0, lower, upper: lower }],
      isAlwaysVisible: lower === 100,
    }))

    expect(getHighestCrossedThresholdZone([{ memory: 125 }], zones, 'memory')).toBe(SEVERE)
    expect(getHighestCrossedThresholdZone([{ memory: 125 }], [zones[3]], 'memory')).toBeUndefined()
  })
})

describe('axis capacity and observed peaks', () => {
  const zones = [
    { runs: [{ startIndex: 0, endIndex: 0, lower: 50, upper: 80 }] },
    { runs: [{ startIndex: 0, endIndex: 0, lower: 80, upper: 90 }] },
    { runs: [{ startIndex: 0, endIndex: 0, lower: 90, upper: 100 }] },
  ]

  it('uses the highest configured capacity of 100', () => {
    expect(getThresholdZoneMaximum(zones)).toBe(100)
  })

  it('retains the largest capacity across historical compute changes', () => {
    expect(
      getThresholdZoneMaximum([
        {
          runs: [
            { startIndex: 0, endIndex: 0, lower: 180, upper: 200 },
            { startIndex: 1, endIndex: 1, lower: 90, upper: 100 },
          ],
        },
      ])
    ).toBe(200)
  })

  it('expands the axis to an observed peak of 120 above the capacity of 100', () => {
    expect(
      getThresholdZoneMaximum([
        ...zones,
        { runs: [{ startIndex: 0, endIndex: 0, lower: 90, upper: 120 }] },
      ])
    ).toBe(120)
  })

  it('ignores nonfinite bounds and returns zero when no capacity is known', () => {
    expect(
      getThresholdZoneMaximum([
        {
          runs: [
            { startIndex: 0, endIndex: 0, lower: 5, upper: Infinity },
            { startIndex: 1, endIndex: 1, lower: 5, upper: Number.NaN },
          ],
        },
      ])
    ).toBe(0)
    expect(getThresholdZoneMaximum([])).toBe(0)
  })
})

describe('visible threshold selection', () => {
  const data = [{ memory: 60 }]
  const zones: ThresholdZone[] = [50, 80, 90, 100].map((threshold) => ({
    label: threshold === 100 ? 'Full commitment capacity' : `${threshold}% threshold`,
    color: 'var(--chart-reference)',
    tooltip: '',
    isAlwaysVisible: threshold === 100,
    getRanges: () => [[threshold, threshold]],
  }))

  it('shows only the crossed threshold and capacity while keeping the full axis range', () => {
    const chart = getThresholdZoneChart(data, zones, 'memory')

    expect(chart.zones.map((zone) => zone.label)).toEqual([
      '50% threshold',
      'Full commitment capacity',
    ])
    expect(chart.selectedZone?.label).toBe('50% threshold')
    expect(chart.maxValue).toBe(100)
  })

  it('keeps all configured reference lines when risk selection is not requested', () => {
    const chart = getThresholdZoneChart(data, zones)

    expect(chart.zones.map((zone) => zone.label)).toEqual([
      '50% threshold',
      '80% threshold',
      '90% threshold',
      'Full commitment capacity',
    ])
    expect(chart.selectedZone).toBeUndefined()
    expect(chart.maxValue).toBe(100)
  })
})

describe('values for a single sample', () => {
  const threshold: ThresholdZone = {
    label: 'Problematic',
    tooltipLabel: '80% threshold',
    color: 'var(--color-orange-900)',
    tooltip: '',
    getRanges: (data) =>
      data.map((point) => [Number(point.capacity) * 0.8, Number(point.capacity)]),
  }
  const capacity: ThresholdZone = {
    label: 'Full commitment capacity',
    color: 'var(--chart-reference)',
    tooltip: '',
    getRanges: (data) => data.map((point) => [Number(point.capacity), Number(point.capacity)]),
  }

  it.each([100, 200])(
    'uses the supplied sample capacity of %s and preserves labels and colors',
    (value) => {
      expect(getThresholdZoneValues({ capacity: value }, [threshold, capacity])).toEqual([
        { label: '80% threshold', color: threshold.color, value: value * 0.8 },
        { label: 'Full commitment capacity', color: capacity.color, value },
      ])
    }
  )

  it('omits unavailable or nonfinite bounds while retaining a real zero', () => {
    const zones: ThresholdZone[] = [
      { ...threshold, getRanges: () => [null] },
      { ...threshold, getRanges: () => [[Infinity, 100]] },
      { ...threshold, getRanges: () => [[Number.NaN, 100]] },
      { ...threshold, getRanges: () => [[0, 100]] },
    ]
    expect(getThresholdZoneValues({ capacity: 100 }, zones)).toEqual([
      { label: '80% threshold', color: threshold.color, value: 0 },
    ])
  })

  it('returns no values without a sample or reference configuration', () => {
    expect(getThresholdZoneValues(undefined, [threshold])).toEqual([])
    expect(getThresholdZoneValues({ capacity: 100 }, undefined)).toEqual([])
    expect(getThresholdZoneValues({ capacity: 100 }, [])).toEqual([])
  })
})
