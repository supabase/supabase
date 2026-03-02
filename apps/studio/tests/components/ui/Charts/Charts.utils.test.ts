import { renderHook } from '@testing-library/react'
import {
  compactNumberFormatter,
  formatPercentage,
  isFloat,
  numberFormatter,
  precisionFormatter,
  useStacked,
} from 'components/ui/Charts/Charts.utils'
import { describe, expect, it, test } from 'vitest'

test('isFloat', () => {
  expect(isFloat(123)).toBe(false)
  expect(isFloat(123.123)).toBe(true)
})

describe('numberFormatter', () => {
  it('should format integers without decimals', () => {
    expect(numberFormatter(123)).toBe('123')
    expect(numberFormatter(1000)).toBe('1,000')
  })

  it('should format floats with default precision', () => {
    expect(numberFormatter(123.123)).toBe('123.12')
    expect(numberFormatter(123.456)).toBe('123.45')
    expect(numberFormatter(123.999)).toBe('123.99')
    expect(numberFormatter(123456.78)).toBe('123,456.78')
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

describe('precisionFormatter', () => {
  it('should format regular numbers with precision', () => {
    expect(precisionFormatter(123, 1)).toBe('123.0')
    expect(precisionFormatter(123, 2)).toBe('123.00')
    expect(precisionFormatter(123.123, 2)).toBe('123.12')
    expect(precisionFormatter(123.999, 2)).toBe('123.99')
    expect(precisionFormatter(123.12345, 4)).toBe('123.1234')
    expect(precisionFormatter(123456, 2)).toBe('123,456.00')
    expect(precisionFormatter(123456.78, 2)).toBe('123,456.78')
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

describe('formatPercentage', () => {
  it('should format 100 without decimals', () => {
    expect(formatPercentage(100, 2)).toBe('100%')
    expect(formatPercentage(100, 0)).toBe('100%')
  })

  it('should keep decimals for non-100 values', () => {
    expect(formatPercentage(99.99, 2)).toBe('99.99%')
    expect(formatPercentage(0.5, 2)).toBe('0.50%')
  })

  it('should use numberFormatter for integers below 100', () => {
    expect(formatPercentage(50, 2)).toBe('50%')
    expect(formatPercentage(1, 2)).toBe('1%')
  })
})

describe('compactNumberFormatter', () => {
  it('returns the number as-is below 1000', () => {
    expect(compactNumberFormatter(0)).toBe('0')
    expect(compactNumberFormatter(1)).toBe('1')
    expect(compactNumberFormatter(999)).toBe('999')
  })

  it('formats thousands with K suffix', () => {
    expect(compactNumberFormatter(1000)).toBe('1K')
    expect(compactNumberFormatter(1500)).toBe('1.5K')
    expect(compactNumberFormatter(64000)).toBe('64K')
    expect(compactNumberFormatter(999999)).toBe('1M') // rounds up
  })

  it('formats millions with M suffix', () => {
    expect(compactNumberFormatter(1_000_000)).toBe('1M')
    expect(compactNumberFormatter(1_500_000)).toBe('1.5M')
    expect(compactNumberFormatter(2_500_000)).toBe('2.5M')
  })

  it('formats billions with B suffix', () => {
    expect(compactNumberFormatter(1_000_000_000)).toBe('1B')
    expect(compactNumberFormatter(2_500_000_000)).toBe('2.5B')
  })

  it('handles negative numbers', () => {
    expect(compactNumberFormatter(-1000)).toBe('-1K')
    expect(compactNumberFormatter(-1_500_000)).toBe('-1.5M')
  })
})

test('useStacked', () => {
  const { result } = renderHook(() =>
    useStacked({
      data: [
        { label: 'a', x: 1, y: 2 },
        { label: 'b', x: 1, y: 3 },
      ] as unknown as Array<Record<string, number>>,
      xAxisKey: 'x',
      yAxisKey: 'y',
      stackKey: 'label',
      variant: 'percentages',
    })
  )
  expect(result.current).toMatchObject({
    stackedData: [
      {
        a: 2,
        b: 3,
        x: 1,
      },
    ],
    percentagesStackedData: [
      {
        a: 2 / 5,
        b: 3 / 5,
        x: 1,
      },
    ],
  })
})
