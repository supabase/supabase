import { describe, expect, test } from 'vitest'

import {
  FilterGroupType,
  isFilterGroup,
  serializeOperators,
  serializeOptions,
  validateFilterGroup,
} from './filterHelpers'

describe('isFilterGroup', () => {
  test('returns true for filter groups', () => {
    const group: FilterGroupType = {
      logicalOperator: 'AND',
      conditions: [],
    }
    expect(isFilterGroup(group)).toBe(true)
  })

  test('returns false for filter conditions', () => {
    const condition = {
      propertyName: 'name',
      operator: '=',
      value: 'test',
    }
    expect(isFilterGroup(condition)).toBe(false)
  })
})

describe('serializeOptions', () => {
  test.each([undefined, null, []])('returns undefined for %o', (input) => {
    expect(serializeOptions(input as Parameters<typeof serializeOptions>[0])).toBeUndefined()
  })

  test('serializes strings as-is and objects by label, falling back to value', () => {
    expect(
      serializeOptions([
        'string',
        { label: 'Label' },
        { value: 'value' },
        { label: 'L', value: 'v' },
      ])
    ).toEqual(['string', 'Label', 'value', 'L'])
  })

  test('filters out null values from invalid options', () => {
    expect(serializeOptions(['valid', {} as any, 'also-valid'])).toEqual(['valid', 'also-valid'])
  })
})

describe('serializeOperators', () => {
  test.each([undefined, null, []])('returns default ["="] for %o', (input) => {
    expect(serializeOperators(input as Parameters<typeof serializeOperators>[0])).toEqual(['='])
  })

  test('serializes strings as-is and objects by value, falling back to label', () => {
    expect(
      serializeOperators([
        '=',
        { value: '>' },
        { label: 'less than' },
        { value: '!=', label: 'ne' },
      ])
    ).toEqual(['=', '>', 'less than', '!='])
  })

  test('returns default if all operators are invalid', () => {
    expect(serializeOperators([{} as any, {} as any])).toEqual(['='])
  })
})

describe('validateFilterGroup', () => {
  const properties = [
    { label: 'Name', name: 'name', type: 'string' as const, operators: ['=', '~~*'] },
    { label: 'Age', name: 'age', type: 'number' as const, operators: ['=', '>', '<'] },
    { label: 'Active', name: 'active', type: 'boolean' as const },
  ]

  test('validates simple condition with valid property and operator', () => {
    const group: FilterGroupType = {
      logicalOperator: 'AND',
      conditions: [{ propertyName: 'name', operator: '=', value: 'test' }],
    }
    expect(validateFilterGroup(group, properties)).toBe(true)
  })

  test('rejects condition with invalid property name', () => {
    const group: FilterGroupType = {
      logicalOperator: 'AND',
      conditions: [{ propertyName: 'unknown', operator: '=', value: 'test' }],
    }
    expect(validateFilterGroup(group, properties)).toBe(false)
  })

  test('rejects condition with invalid operator', () => {
    const group: FilterGroupType = {
      logicalOperator: 'AND',
      conditions: [{ propertyName: 'name', operator: '>', value: 'test' }],
    }
    expect(validateFilterGroup(group, properties)).toBe(false)
  })

  test('allows any operator when property has no operators defined', () => {
    const group: FilterGroupType = {
      logicalOperator: 'AND',
      conditions: [{ propertyName: 'active', operator: 'any-operator', value: true }],
    }
    expect(validateFilterGroup(group, properties)).toBe(true)
  })

  test('validates nested filter groups', () => {
    const group: FilterGroupType = {
      logicalOperator: 'AND',
      conditions: [
        { propertyName: 'name', operator: '=', value: 'test' },
        {
          logicalOperator: 'OR',
          conditions: [
            { propertyName: 'age', operator: '>', value: 18 },
            { propertyName: 'age', operator: '<', value: 65 },
          ],
        },
      ],
    }
    expect(validateFilterGroup(group, properties)).toBe(true)
  })

  test('rejects nested group with invalid condition', () => {
    const group: FilterGroupType = {
      logicalOperator: 'AND',
      conditions: [
        { propertyName: 'name', operator: '=', value: 'test' },
        {
          logicalOperator: 'OR',
          conditions: [{ propertyName: 'unknown', operator: '=', value: 'invalid' }],
        },
      ],
    }
    expect(validateFilterGroup(group, properties)).toBe(false)
  })

  test('validates empty conditions array', () => {
    const group: FilterGroupType = {
      logicalOperator: 'AND',
      conditions: [],
    }
    expect(validateFilterGroup(group, properties)).toBe(true)
  })
})
