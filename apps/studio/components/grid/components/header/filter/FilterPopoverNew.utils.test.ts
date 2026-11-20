import { describe, expect, test } from 'vitest'

import { buildFilterFromCellValue, isComplexValue } from './FilterPopoverNew.utils'

describe('isComplexValue', () => {
  test.each([null, undefined, 'hello', '', 42, 0, -1, 3.14, true, false])(
    'returns false for primitive %j',
    (value) => {
      expect(isComplexValue(value)).toBe(false)
    }
  )

  test.each([{}, { nested: { key: 'value' } }, [], [1, 2, 3], [{ key: 'value' }]])(
    'returns true for object or array %j',
    (value) => {
      expect(isComplexValue(value)).toBe(true)
    }
  )
})

describe('buildFilterFromCellValue', () => {
  test.each([
    ['Alice', 'Alice'],
    ['', ''],
    ['2024-01-01T12:00:00Z', '2024-01-01T12:00:00Z'],
    [42, '42'],
    [0, '0'],
    [-100, '-100'],
    [true, 'true'],
    [false, 'false'],
  ])('uses the equals operator for %j', (cellValue, expected) => {
    expect(buildFilterFromCellValue('col', cellValue)).toEqual({
      column: 'col',
      operator: '=',
      value: expected,
    })
  })

  test.each([null, undefined])('uses the is operator for %j', (cellValue) => {
    expect(buildFilterFromCellValue('col', cellValue)).toEqual({
      column: 'col',
      operator: 'is',
      value: 'null',
    })
  })
})
