import { describe, expect, it } from 'vitest'

import { computeYAxisWidth, formatYAxisTick } from './QueryBlock.utils'

describe('formatYAxisTick', () => {
  it('returns integers as-is when below 1000', () => {
    expect(formatYAxisTick(0)).toBe('0')
    expect(formatYAxisTick(1)).toBe('1')
    expect(formatYAxisTick(999)).toBe('999')
  })

  it('abbreviates thousands with K', () => {
    expect(formatYAxisTick(1_000)).toBe('1K')
    expect(formatYAxisTick(5_000)).toBe('5K')
    expect(formatYAxisTick(999_000)).toBe('999K')
  })

  it('rounds thousands to one decimal place', () => {
    expect(formatYAxisTick(1_500)).toBe('1.5K')
    expect(formatYAxisTick(55_300)).toBe('55.3K')
    expect(formatYAxisTick(1_234)).toBe('1.2K')
  })

  it('abbreviates millions with M', () => {
    expect(formatYAxisTick(1_000_000)).toBe('1M')
    expect(formatYAxisTick(2_000_000)).toBe('2M')
  })

  it('rounds millions to one decimal place', () => {
    expect(formatYAxisTick(1_500_000)).toBe('1.5M')
    expect(formatYAxisTick(3_208_914)).toBe('3.2M')
  })

  it('handles values just below the million threshold', () => {
    expect(formatYAxisTick(999_900)).toBe('999.9K')
  })

  it('handles negative values', () => {
    expect(formatYAxisTick(-1_000)).toBe('-1K')
    expect(formatYAxisTick(-1_500)).toBe('-1.5K')
    expect(formatYAxisTick(-1_000_000)).toBe('-1M')
    expect(formatYAxisTick(-999)).toBe('-999')
  })

  it('rounds small decimals to 2 places', () => {
    expect(formatYAxisTick(0.456)).toBe('0.46')
    expect(formatYAxisTick(0.1)).toBe('0.1')
    expect(formatYAxisTick(-0.123)).toBe('-0.12')
  })

  it('rounds non-integer values between 1 and 1000 to 1 decimal place', () => {
    expect(formatYAxisTick(1.25)).toBe('1.3')
    expect(formatYAxisTick(99.9)).toBe('99.9')
    expect(formatYAxisTick(5.0)).toBe('5')
  })
})

describe('computeYAxisWidth', () => {
  const row = (v: number) => ({ val: v })

  it('returns 52 for log scale regardless of data', () => {
    expect(computeYAxisWidth([row(1_000_000)], 'val', { isLogScale: true })).toBe(52)
  })

  it('returns a fixed width for percentage data', () => {
    const width = computeYAxisWidth([row(99)], 'val', { isPercentage: true })
    // "100" is the longest tick → (3+1)*8 = 32, floor at 36
    expect(width).toBe(36)
  })

  it('returns minimum 36 for small values', () => {
    expect(computeYAxisWidth([row(5)], 'val')).toBe(36)
    expect(computeYAxisWidth([], 'val')).toBe(36)
  })

  it('widens for large values', () => {
    // formatYAxisTick(55_300) = "55.3K" (5 chars) → (5+1)*8 = 48
    expect(computeYAxisWidth([row(55_300)], 'val')).toBe(48)
  })

  it('uses absolute magnitude so negative data is handled correctly', () => {
    const negWidth = computeYAxisWidth([row(-55_300)], 'val')
    const posWidth = computeYAxisWidth([row(55_300)], 'val')
    expect(negWidth).toBe(posWidth)
  })

  it('picks the largest magnitude across all rows', () => {
    const data = [row(100), row(5_000), row(200)]
    // max is 5000 → "5K" (2 chars) → (2+1)*8 = 24, floor at 36
    expect(computeYAxisWidth(data, 'val')).toBe(36)
  })
})
