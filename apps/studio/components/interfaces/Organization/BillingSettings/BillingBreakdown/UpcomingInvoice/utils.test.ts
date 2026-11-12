import { describe, expect, test } from 'vitest'

import { formatDecimalBytes, formatNumber, formatUsageWithUnit } from './utils'

describe('formatNumber', () => {
  test.each([
    { value: 0, expected: '0' },
    { value: 0.004, expected: '<0.01' },
    { value: 0.01, expected: '0.01' },
    { value: 1234.567, expected: '1,234.57' },
    { value: 999_999, expected: '999,999' },
    { value: 2_200_000, expected: '2.2M' },
  ])('formats $value as $expected', ({ value, expected }) => {
    expect(formatNumber(value)).toBe(expected)
  })
})

describe('formatDecimalBytes', () => {
  test.each([
    { bytes: 0, expected: '0 B' },
    { bytes: 0.5, expected: '0.5 B' },
    { bytes: 999, expected: '999 B' },
    // Billing uses decimal units, so 1024 bytes is not 1 KB
    { bytes: 1024, expected: '1.02 KB' },
    { bytes: 1_500_000_000, expected: '1.5 GB' },
    // Caps at PB instead of indexing past the unit list
    { bytes: 2e18, expected: '2,000 PB' },
  ])('formats $bytes bytes as $expected', ({ bytes, expected }) => {
    expect(formatDecimalBytes(bytes)).toBe(expected)
  })
})

describe('formatUsageWithUnit', () => {
  test.each([
    { usage: 1, unit: 'hour', expected: '1 hour' },
    { usage: 0, unit: 'hour', expected: '0 hours' },
    { usage: 1.5, unit: 'gbhr', expected: '1.5 GB-hours' },
    { usage: 3_500_000, unit: 'iopshr', expected: '3.5M IOPS-hours' },
    { usage: 1, unit: 'gigabyte', expected: '1 GB' },
    { usage: 42, unit: 'count', expected: '42' },
    { usage: 1_500, unit: 'byte', expected: '1.5 KB' },
  ] as const)('formats $usage $unit as $expected', ({ usage, unit, expected }) => {
    expect(formatUsageWithUnit(usage, unit)).toBe(expected)
  })
})
