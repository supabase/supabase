import { describe, expect, test } from 'vitest'

import { buildFilterFromCellValue, isComplexValue } from './FilterPopoverNew.utils'

describe('isComplexValue', () => {
  test('returns false for null', () => {
    expect(isComplexValue(null)).toBe(false)
  })

  test('returns false for undefined', () => {
    expect(isComplexValue(undefined)).toBe(false)
  })

  test('returns false for strings', () => {
    expect(isComplexValue('hello')).toBe(false)
    expect(isComplexValue('')).toBe(false)
  })

  test('returns false for numbers', () => {
    expect(isComplexValue(42)).toBe(false)
    expect(isComplexValue(0)).toBe(false)
    expect(isComplexValue(-1)).toBe(false)
    expect(isComplexValue(3.14)).toBe(false)
  })

  test('returns false for booleans', () => {
    expect(isComplexValue(true)).toBe(false)
    expect(isComplexValue(false)).toBe(false)
  })

  test('returns true for empty objects', () => {
    expect(isComplexValue({})).toBe(true)
  })

  test('returns true for objects with properties', () => {
    expect(isComplexValue({ key: 'value' })).toBe(true)
    expect(isComplexValue({ nested: { key: 'value' } })).toBe(true)
  })

  test('returns true for empty arrays', () => {
    expect(isComplexValue([])).toBe(true)
  })

  test('returns true for arrays with items', () => {
    expect(isComplexValue([1, 2, 3])).toBe(true)
    expect(isComplexValue(['a', 'b'])).toBe(true)
    expect(isComplexValue([{ key: 'value' }])).toBe(true)
  })
})

describe('buildFilterFromCellValue', () => {
  test('creates filter with equals operator for string values', () => {
    const filter = buildFilterFromCellValue('name', 'Alice')
    expect(filter).toEqual({
      column: 'name',
      operator: '=',
      value: 'Alice',
    })
  })

  test('creates filter with equals operator for empty string', () => {
    const filter = buildFilterFromCellValue('label', '')
    expect(filter).toEqual({
      column: 'label',
      operator: '=',
      value: '',
    })
  })

  test('creates filter with equals operator for numbers', () => {
    const filter = buildFilterFromCellValue('age', 42)
    expect(filter).toEqual({
      column: 'age',
      operator: '=',
      value: '42',
    })
  })

  test('creates filter with equals operator for zero', () => {
    const filter = buildFilterFromCellValue('count', 0)
    expect(filter).toEqual({
      column: 'count',
      operator: '=',
      value: '0',
    })
  })

  test('creates filter with equals operator for negative numbers', () => {
    const filter = buildFilterFromCellValue('balance', -100)
    expect(filter).toEqual({
      column: 'balance',
      operator: '=',
      value: '-100',
    })
  })

  test('creates filter with equals operator for boolean true', () => {
    const filter = buildFilterFromCellValue('active', true)
    expect(filter).toEqual({
      column: 'active',
      operator: '=',
      value: 'true',
    })
  })

  test('creates filter with equals operator for boolean false', () => {
    const filter = buildFilterFromCellValue('active', false)
    expect(filter).toEqual({
      column: 'active',
      operator: '=',
      value: 'false',
    })
  })

  test('creates filter with is operator for null', () => {
    const filter = buildFilterFromCellValue('name', null)
    expect(filter).toEqual({
      column: 'name',
      operator: 'is',
      value: 'null',
    })
  })

  test('creates filter with is operator for undefined', () => {
    const filter = buildFilterFromCellValue('name', undefined)
    expect(filter).toEqual({
      column: 'name',
      operator: 'is',
      value: 'null',
    })
  })

  test('creates filter for date strings', () => {
    const filter = buildFilterFromCellValue('created_at', '2024-01-01')
    expect(filter).toEqual({
      column: 'created_at',
      operator: '=',
      value: '2024-01-01',
    })
  })

  test('creates filter for datetime strings', () => {
    const filter = buildFilterFromCellValue('updated_at', '2024-01-01T12:00:00Z')
    expect(filter).toEqual({
      column: 'updated_at',
      operator: '=',
      value: '2024-01-01T12:00:00Z',
    })
  })
})
