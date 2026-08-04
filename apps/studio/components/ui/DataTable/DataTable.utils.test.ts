import { describe, expect, test } from 'vitest'

import { formatCompactNumber } from './DataTable.utils'

describe('formatCompactNumber', () => {
  test('returns numbers below 1000 as-is', () => {
    expect(formatCompactNumber(0)).toBe('0')
    expect(formatCompactNumber(99)).toBe('99')
    expect(formatCompactNumber(100)).toBe('100')
    expect(formatCompactNumber(999)).toBe('999')
  })

  test('formats thousands with a "k" suffix', () => {
    expect(formatCompactNumber(1000)).toBe('1.0k')
    expect(formatCompactNumber(1500)).toBe('1.5k')
    expect(formatCompactNumber(15310)).toBe('15.3k')
  })

  test('formats millions with an "M" suffix', () => {
    expect(formatCompactNumber(1000000)).toBe('1.0M')
    expect(formatCompactNumber(1500000)).toBe('1.5M')
  })

  // Regression: values that round up to 1000.0k were rendered as "1000.0k"
  // instead of being promoted to "1.0M".
  test('promotes values that round up to 1000k into millions', () => {
    expect(formatCompactNumber(999999)).toBe('1.0M')
    expect(formatCompactNumber(999950)).toBe('1.0M')
  })

  test('does not promote values that round down below 1000k', () => {
    expect(formatCompactNumber(999949)).toBe('999.9k')
  })

  test('boundary between thousands and the rounding guard', () => {
    expect(formatCompactNumber(999900)).toBe('999.9k')
  })
})
