import { describe, expect, test } from 'vitest'

import {
  enforceAndLogicalOperator,
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
  test('returns undefined for undefined input', () => {
    expect(serializeOptions(undefined)).toBeUndefined()
  })

  test('returns undefined for non-array input', () => {
    expect(serializeOptions(null as any)).toBeUndefined()
  })

  test('returns undefined for empty array', () => {
    expect(serializeOptions([])).toBeUndefined()
  })

  test('handles string options', () => {
    expect(serializeOptions(['option1', 'option2'])).toEqual(['option1', 'option2'])
  })

  test('extracts label from object options', () => {
    expect(serializeOptions([{ label: 'Label 1' }, { label: 'Label 2' }])).toEqual([
      'Label 1',
      'Label 2',
    ])
  })

  test('falls back to value when label is not present', () => {
    expect(serializeOptions([{ value: 'value1' }, { value: 'value2' }])).toEqual([
      'value1',
      'value2',
    ])
  })

  test('prefers label over value', () => {
    expect(serializeOptions([{ label: 'Label', value: 'value' }])).toEqual(['Label'])
  })

  test('handles mixed option types', () => {
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
  test('returns default ["="] for undefined input', () => {
    expect(serializeOperators(undefined)).toEqual(['='])
  })

  test('returns default ["="] for empty array', () => {
    expect(serializeOperators([])).toEqual(['='])
  })

  test('returns default ["="] for non-array input', () => {
    expect(serializeOperators(null as any)).toEqual(['='])
  })

  test('handles string operators', () => {
    expect(serializeOperators(['=', '>', '<'])).toEqual(['=', '>', '<'])
  })

  test('extracts value from object operators', () => {
    expect(
      serializeOperators([
        { value: '=', label: 'equals' },
        { value: '>', label: 'greater than' },
      ])
    ).toEqual(['=', '>'])
  })

  test('falls back to label when value is not present', () => {
    expect(serializeOperators([{ label: 'equals' }, { label: 'greater than' }])).toEqual([
      'equals',
      'greater than',
    ])
  })

  test('prefers value over label', () => {
    expect(serializeOperators([{ value: '=', label: 'equals' }])).toEqual(['='])
  })

  test('handles mixed operator types', () => {
    expect(serializeOperators(['=', { value: '>' }, { label: 'less than' }])).toEqual([
      '=',
      '>',
      'less than',
    ])
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

describe('enforceAndLogicalOperator', () => {
  test('converts OR to AND at root level', () => {
    const group: FilterGroupType = {
      logicalOperator: 'OR',
      conditions: [{ propertyName: 'name', operator: '=', value: 'test' }],
    }
    const result = enforceAndLogicalOperator(group)
    expect(result.logicalOperator).toBe('AND')
  })

  test('preserves conditions when converting', () => {
    const condition = { propertyName: 'name', operator: '=', value: 'test' }
    const group: FilterGroupType = {
      logicalOperator: 'OR',
      conditions: [condition],
    }
    const result = enforceAndLogicalOperator(group)
    expect(result.conditions).toEqual([condition])
  })

  test('recursively converts nested groups to AND', () => {
    const group: FilterGroupType = {
      logicalOperator: 'OR',
      conditions: [
        { propertyName: 'name', operator: '=', value: 'test' },
        {
          logicalOperator: 'OR',
          conditions: [
            { propertyName: 'age', operator: '>', value: 18 },
            {
              logicalOperator: 'OR',
              conditions: [{ propertyName: 'active', operator: '=', value: true }],
            },
          ],
        },
      ],
    }
    const result = enforceAndLogicalOperator(group)

    expect(result.logicalOperator).toBe('AND')
    expect((result.conditions[1] as FilterGroupType).logicalOperator).toBe('AND')
    expect(
      ((result.conditions[1] as FilterGroupType).conditions[1] as FilterGroupType).logicalOperator
    ).toBe('AND')
  })

  test('handles empty conditions array', () => {
    const group: FilterGroupType = {
      logicalOperator: 'OR',
      conditions: [],
    }
    const result = enforceAndLogicalOperator(group)
    expect(result).toEqual({ logicalOperator: 'AND', conditions: [] })
  })
})
