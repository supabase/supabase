import { describe, expect, it } from 'vitest'

import { formatErrorRate } from './EdgeFunctionsListItem.utils'

describe('formatErrorRate', () => {
  it('returns "0%" for exactly 0', () => {
    expect(formatErrorRate(0)).toBe('0%')
  })

  it('returns "100%" for exactly 100', () => {
    expect(formatErrorRate(100)).toBe('100%')
  })

  it('returns "100%" for values above 100', () => {
    expect(formatErrorRate(101)).toBe('100%')
    expect(formatErrorRate(200)).toBe('100%')
  })

  it('returns "<0.1%" for values between 0 and 0.1 (exclusive)', () => {
    expect(formatErrorRate(0.05)).toBe('<0.1%')
    expect(formatErrorRate(0.001)).toBe('<0.1%')
    expect(formatErrorRate(0.099)).toBe('<0.1%')
  })

  it('returns one decimal place for values >= 0.1 and < 100', () => {
    expect(formatErrorRate(0.1)).toBe('0.1%')
    expect(formatErrorRate(1.0)).toBe('1.0%')
    expect(formatErrorRate(1.567)).toBe('1.6%')
    expect(formatErrorRate(50)).toBe('50.0%')
    expect(formatErrorRate(99.9)).toBe('99.9%')
  })

  it('rounds correctly at 0.5 boundary', () => {
    expect(formatErrorRate(1.55)).toBe('1.6%')
    expect(formatErrorRate(1.54)).toBe('1.5%')
  })
})
