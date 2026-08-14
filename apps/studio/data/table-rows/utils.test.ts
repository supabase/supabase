import { describe, expect, it } from 'vitest'

import { formatFilterValue } from './utils'
import type { Filter } from '@/components/grid/types'

const table = {
  columns: [
    { name: 'id', format: 'int8' },
    { name: 'count', format: 'int4' },
    { name: 'name', format: 'text' },
    { name: 'price', format: 'numeric' },
  ],
}

const makeFilter = (column: string, value: any): Filter => ({
  column,
  operator: '=',
  value,
})

describe('formatFilterValue', () => {
  it('returns the value untouched for non-numerical columns', () => {
    expect(formatFilterValue(table, makeFilter('name', '123'))).toBe('123')
  })

  it('coerces in-range numerical values to a number', () => {
    expect(formatFilterValue(table, makeFilter('count', '42'))).toBe(42)
    expect(formatFilterValue(table, makeFilter('id', '-42'))).toBe(-42)
  })

  it('returns the original string when the value is not a valid number', () => {
    expect(formatFilterValue(table, makeFilter('count', 'abc'))).toBe('abc')
  })

  it('preserves large positive bigints as strings to avoid precision loss', () => {
    const int8Max = '9223372036854775807'
    expect(formatFilterValue(table, makeFilter('id', int8Max))).toBe(int8Max)
  })

  // Regression: the previous implementation only guarded the upper bound
  // (numberValue > MAX_SAFE_INTEGER), so large negative bigints were converted
  // through Number() and silently rounded, producing a wrong filter value.
  it('preserves large negative bigints as strings to avoid precision loss', () => {
    const int8Min = '-9223372036854775808'
    expect(formatFilterValue(table, makeFilter('id', int8Min))).toBe(int8Min)

    const justBelowSafe = '-9007199254740993'
    expect(formatFilterValue(table, makeFilter('id', justBelowSafe))).toBe(justBelowSafe)
  })

  it('keeps the exact safe-integer bounds as numbers', () => {
    expect(formatFilterValue(table, makeFilter('id', String(Number.MAX_SAFE_INTEGER)))).toBe(
      Number.MAX_SAFE_INTEGER
    )
    expect(formatFilterValue(table, makeFilter('id', String(Number.MIN_SAFE_INTEGER)))).toBe(
      Number.MIN_SAFE_INTEGER
    )
  })
})
