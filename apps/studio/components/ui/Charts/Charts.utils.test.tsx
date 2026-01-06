import { describe, expect, it } from 'vitest'
import { numberFormatter, precisionFormatter } from './Charts.utils'

describe('precisionFormatter', () => {
  it('should format regular numbers with precision', () => {
    expect(precisionFormatter(123, 2)).toBe('123.00')
    expect(precisionFormatter(123.123, 2)).toBe('123.12')
    expect(precisionFormatter(123.999, 2)).toBe('123.99')
  })

  it('should show "<0.01" for small positive numbers below threshold', () => {
    expect(precisionFormatter(0.00123, 2)).toBe('<0.01')
    expect(precisionFormatter(0.005, 2)).toBe('<0.01')
    expect(precisionFormatter(0.009, 2)).toBe('<0.01')
  })

  it('should show ">-0.01" for small negative numbers below threshold', () => {
    expect(precisionFormatter(-0.00123, 2)).toBe('>-0.01')
    expect(precisionFormatter(-0.005, 2)).toBe('>-0.01')
    expect(precisionFormatter(-0.009, 2)).toBe('>-0.01')
  })

  it('should format numbers at or above threshold normally', () => {
    expect(precisionFormatter(0.01, 2)).toBe('0.01')
    expect(precisionFormatter(0.02, 2)).toBe('0.02')
    expect(precisionFormatter(-0.01, 2)).toBe('-0.01')
    expect(precisionFormatter(-0.02, 2)).toBe('-0.02')
  })

  it('should handle different precision values', () => {
    expect(precisionFormatter(0.0001, 3)).toBe('<0.001')
    expect(precisionFormatter(0.001, 3)).toBe('0.001')
    expect(precisionFormatter(-0.0001, 3)).toBe('>-0.001')
  })

  it('should handle precision 0', () => {
    expect(precisionFormatter(123.456, 0)).toBe('123')
    expect(precisionFormatter(0.5, 0)).toBe('1')
  })

  it('should format exactly zero normally', () => {
    expect(precisionFormatter(0, 2)).toBe('0.00')
  })
})

describe('numberFormatter', () => {
  it('should format integers without decimals', () => {
    expect(numberFormatter(123)).toBe('123')
    expect(numberFormatter(1000)).toBe('1,000')
  })

  it('should format floats with default precision', () => {
    expect(numberFormatter(123.456)).toBe('123.45')
    expect(numberFormatter(123.999)).toBe('123.99')
  })

  it('should show "<0.01" for small positive floats', () => {
    expect(numberFormatter(0.00123)).toBe('<0.01')
    expect(numberFormatter(0.005)).toBe('<0.01')
  })

  it('should show ">-0.01" for small negative floats', () => {
    expect(numberFormatter(-0.00123)).toBe('>-0.01')
    expect(numberFormatter(-0.005)).toBe('>-0.01')
  })

  it('should respect custom precision', () => {
    expect(numberFormatter(0.0001, 3)).toBe('<0.001')
    expect(numberFormatter(123.456789, 4)).toBe('123.4567')
  })
})
