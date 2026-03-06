import {
  checkHasNonPositiveValues,
  formatLogTick,
  getCumulativeResults,
} from 'components/ui/QueryBlock/QueryBlock.utils'
import { describe, expect, it } from 'vitest'

describe('checkHasNonPositiveValues', () => {
  it('returns false for an empty array', () => {
    expect(checkHasNonPositiveValues([], 'value')).toBe(false)
  })

  it('returns false when all values are positive', () => {
    const data = [{ value: 1 }, { value: 2 }, { value: 100 }]
    expect(checkHasNonPositiveValues(data, 'value')).toBe(false)
  })

  it('returns true when a value is zero', () => {
    const data = [{ value: 1 }, { value: 0 }, { value: 3 }]
    expect(checkHasNonPositiveValues(data, 'value')).toBe(true)
  })

  it('returns true when a value is negative', () => {
    const data = [{ value: 5 }, { value: -1 }, { value: 3 }]
    expect(checkHasNonPositiveValues(data, 'value')).toBe(true)
  })

  it('returns true when all values are non-positive', () => {
    const data = [{ value: -5 }, { value: 0 }, { value: -1 }]
    expect(checkHasNonPositiveValues(data, 'value')).toBe(true)
  })

  it('checks only the specified key', () => {
    const data = [
      { x: -1, y: 5 },
      { x: 2, y: 10 },
    ]
    expect(checkHasNonPositiveValues(data, 'y')).toBe(false)
    expect(checkHasNonPositiveValues(data, 'x')).toBe(true)
  })

  it('returns false when key is absent (undefined cast to NaN is not <= 0)', () => {
    const data = [{ value: 1 }, { value: 2 }]
    expect(checkHasNonPositiveValues(data, 'missing')).toBe(false)
  })
})

describe('formatLogTick', () => {
  it('formats values below 1,000 as plain locale strings', () => {
    expect(formatLogTick(0)).toBe('0')
    expect(formatLogTick(1)).toBe('1')
    expect(formatLogTick(999)).toBe('999')
    expect(formatLogTick(500)).toBe('500')
  })

  it('formats values >= 1,000 with a "k" suffix', () => {
    expect(formatLogTick(1_000)).toBe('1k')
    expect(formatLogTick(1_500)).toBe('1.5k')
    expect(formatLogTick(10_000)).toBe('10k')
    expect(formatLogTick(999_999)).toBe('1,000k')
  })

  it('formats values >= 1,000,000 with an "M" suffix', () => {
    expect(formatLogTick(1_000_000)).toBe('1M')
    expect(formatLogTick(1_500_000)).toBe('1.5M')
    expect(formatLogTick(10_000_000)).toBe('10M')
    expect(formatLogTick(1_234_567)).toBe('1.2M')
  })

  it('respects maximumFractionDigits of 1', () => {
    // 1,050 → 1.05k, but max 1 decimal → "1.1k" (rounded)
    expect(formatLogTick(1_050)).toBe('1.1k')
    // 1,049 → 1.049k → "1k" (rounded down)
    expect(formatLogTick(1_049)).toBe('1k')
  })
})

describe('getCumulativeResults', () => {
  it('returns empty array when results are empty', () => {
    expect(
      getCumulativeResults(
        { rows: [] },
        { type: 'bar', xKey: 'x', yKey: 'y', cumulative: false, showLabels: false, showGrid: false }
      )
    ).toEqual([])
  })

  it('returns empty array when results are undefined', () => {
    expect(
      getCumulativeResults(undefined as any, {
        type: 'bar',
        xKey: 'x',
        yKey: 'y',
        cumulative: false,
        showLabels: false,
        showGrid: false,
      })
    ).toEqual([])
  })

  it('accumulates yKey values across rows', () => {
    const results = {
      rows: [
        { x: 'a', y: 10 },
        { x: 'b', y: 20 },
        { x: 'c', y: 5 },
      ],
    }
    const config = {
      type: 'bar' as const,
      xKey: 'x',
      yKey: 'y',
      cumulative: true,
      showLabels: false,
      showGrid: false,
    }
    const output = getCumulativeResults(results, config)
    expect(output).toEqual([
      { x: 'a', y: 10 },
      { x: 'b', y: 30 },
      { x: 'c', y: 35 },
    ])
  })

  it('preserves other keys on each row', () => {
    const results = {
      rows: [
        { x: 'a', y: 1, label: 'foo' },
        { x: 'b', y: 2, label: 'bar' },
      ],
    }
    const config = {
      type: 'bar' as const,
      xKey: 'x',
      yKey: 'y',
      cumulative: true,
      showLabels: false,
      showGrid: false,
    }
    const output = getCumulativeResults(results, config)
    expect(output[0]).toMatchObject({ x: 'a', y: 1, label: 'foo' })
    expect(output[1]).toMatchObject({ x: 'b', y: 3, label: 'bar' })
  })

  it('handles a single row', () => {
    const results = { rows: [{ x: 'a', y: 42 }] }
    const config = {
      type: 'bar' as const,
      xKey: 'x',
      yKey: 'y',
      cumulative: true,
      showLabels: false,
      showGrid: false,
    }
    const output = getCumulativeResults(results, config)
    expect(output).toEqual([{ x: 'a', y: 42 }])
  })
})
