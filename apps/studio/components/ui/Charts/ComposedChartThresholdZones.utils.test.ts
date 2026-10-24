import { describe, expect, it } from 'vitest'

import type { ThresholdZone } from './ComposedChart.utils'
import {
  getHighestCrossedThresholdZone,
  getThresholdZoneChart,
  getThresholdZoneMaximum,
  getThresholdZoneRuns,
  getThresholdZoneValues,
  getThresholdZoneXBounds,
  getThresholdZoneYBounds,
  type ThresholdZoneRun,
} from './ComposedChartThresholdZones.utils'

function boundsAtSamples(runs: ThresholdZoneRun[], count: number) {
  return Array.from({ length: count }, (_, index) => {
    const run = runs.find((run) => run.startIndex <= index && run.endIndex >= index)
    return [run?.lower, run?.upper]
  })
}

describe('historical threshold segments', () => {
  it('keeps a stable threshold continuous across the displayed history', () => {
    const runs = getThresholdZoneRuns([
      [2, 4],
      [2, 4],
      [2, 4],
    ])

    expect(boundsAtSamples(runs, 3)).toEqual([
      [2, 4],
      [2, 4],
      [2, 4],
    ])
  })

  it('moves the threshold when infrastructure capacity changes', () => {
    const runs = getThresholdZoneRuns([
      [2, 4],
      [2, 4],
      [4, 8],
      [4, 8],
    ])

    expect(boundsAtSamples(runs, 4)).toEqual([
      [2, 4],
      [2, 4],
      [4, 8],
      [4, 8],
    ])
  })
})

describe('threshold alignment with chart edges', () => {
  const data = [1000, 2000, 3000, 4000].map((timestamp) => ({ timestamp }))

  it.each([true, false])(
    'draws thresholds to both chart edges when bars are visible: %s',
    (hasVisibleBars) => {
      const run = { startIndex: 0, endIndex: 3, lower: 2, upper: 4 }
      expect(getThresholdZoneXBounds(run, data, hasVisibleBars)).toEqual({
        x1: undefined,
        x2: undefined,
      })
    }
  )

  it('ends bar thresholds at the infrastructure resize boundary', () => {
    const run = { startIndex: 1, endIndex: 2, lower: 2, upper: 4 }
    expect(getThresholdZoneXBounds(run, data, true)).toEqual({ x1: 1, x2: 2 })
  })

  it('steps line thresholds at the infrastructure resize timestamp', () => {
    const run = { startIndex: 1, endIndex: 1, lower: 2, upper: 4 }
    expect(getThresholdZoneXBounds(run, data, false)).toEqual({ x1: 1, x2: 2 })
  })

  it('aligns thresholds with the configured timestamp axis', () => {
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
    'shows only the highest threshold exceeded by a commitment of $value',
    ({ value, expected }) => {
      expect(getHighestCrossedThresholdZone([{ memory: value }], zones, 'memory')).toBe(expected)
    }
  )

  it('keeps a historical Severe warning visible after commitment recovers', () => {
    const data = [{ memory: 95 }, { memory: 40 }]
    expect(getHighestCrossedThresholdZone(data, makeRiskZones([50, 80, 90], 1), 'memory')).toBe(
      SEVERE
    )
  })

  it('evaluates historical risk against capacity at that timestamp', () => {
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

  it('never treats the gray capacity line as a risk warning', () => {
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

  it('keeps earlier high-capacity history visible after downsizing', () => {
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

  it('keeps above-capacity commitment peaks visible', () => {
    expect(
      getThresholdZoneMaximum([
        ...zones,
        { runs: [{ startIndex: 0, endIndex: 0, lower: 90, upper: 120 }] },
      ])
    ).toBe(120)
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

  it('shows the crossed threshold and gray capacity line without shrinking the scale', () => {
    const chart = getThresholdZoneChart(data, zones, 'memory')

    expect(chart.zones.map((zone) => zone.label)).toEqual([
      '50% threshold',
      'Full commitment capacity',
    ])
    expect(chart.selectedZone?.label).toBe('50% threshold')
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

  it.each([
    { capacityValue: 100, expectedThreshold: 80 },
    { capacityValue: 200, expectedThreshold: 160 },
  ])(
    'shows the timestamp-specific threshold value after capacity changes to $capacityValue',
    ({ capacityValue, expectedThreshold }) => {
      expect(getThresholdZoneValues({ capacity: capacityValue }, [threshold, capacity])).toEqual([
        { label: '80% threshold', color: threshold.color, value: expectedThreshold },
        { label: 'Full commitment capacity', color: capacity.color, value: capacityValue },
      ])
    }
  )
})

describe('threshold connections at infrastructure changes', () => {
  it.each([
    { before: 8, after: 2 },
    { before: 2, after: 8 },
  ])(
    'connects adjacent capacity levels from $before to $after so resizing stays visible',
    ({ before, after }) => {
      const previous = { startIndex: 0, endIndex: 1, lower: before, upper: before }
      const current = { startIndex: 2, endIndex: 3, lower: after, upper: after }

      expect(getThresholdZoneYBounds(current, previous)).toEqual({ y1: after, y2: before })
    }
  )

  it('leaves a real gap disconnected instead of implying continuous capacity history', () => {
    const previous = { startIndex: 0, endIndex: 1, lower: 8, upper: 8 }
    const current = { startIndex: 3, endIndex: 4, lower: 2, upper: 2 }

    expect(getThresholdZoneYBounds(current, previous)).toEqual({ y1: 2, y2: 2 })
  })
})
