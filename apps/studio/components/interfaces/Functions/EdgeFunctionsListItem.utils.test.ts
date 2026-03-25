import { describe, expect, it } from 'vitest'

import { formatErrorRate } from './EdgeFunctionsListItem.utils'

describe('formatErrorRate', () => {
  it.each([
    { value: 0, expected: '0%' },
    { value: 100, expected: '100%' },
    { value: 101, expected: '100%' },
    { value: 200, expected: '100%' },
    { value: 0.05, expected: '<0.1%' },
    { value: 0.001, expected: '<0.1%' },
    { value: 0.099, expected: '<0.1%' },
    { value: 0.1, expected: '0.1%' },
    { value: 1.0, expected: '1.0%' },
    { value: 1.567, expected: '1.6%' },
    { value: 50, expected: '50.0%' },
    { value: 99.9, expected: '99.9%' },
    { value: 99.99, expected: '100%' },
    { value: 1.55, expected: '1.6%' },
    { value: 1.54, expected: '1.5%' },
  ])('formats $value as $expected', ({ value, expected }) => {
    expect(formatErrorRate(value)).toBe(expected)
  })
})
