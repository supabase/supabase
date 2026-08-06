import { describe, expect, it } from 'vitest'
import { filterPropertySchema, validateFilterGroup } from './filterHelpers'
import type { FilterGroupType } from './filterHelpers'
import type { z } from 'zod'

type FilterProperty = z.infer<typeof filterPropertySchema>

const makeGroup = (
  operator: string,
  propertyName = 'status',
  operators?: string[]
): { group: FilterGroupType; properties: FilterProperty[] } => ({
  group: {
    logicalOperator: 'AND',
    conditions: [{ propertyName, operator, value: 'active' }],
  },
  properties: [
    {
      label: 'Status',
      name: propertyName,
      type: 'string',
      ...(operators !== undefined ? { operators } : {}),
    },
  ],
})

describe('validateFilterGroup', () => {
  it('accepts a valid operator when operators list is provided', () => {
    const { group, properties } = makeGroup('=', 'status', ['=', '<>'])
    expect(validateFilterGroup(group, properties)).toBe(true)
  })

  it('rejects an invalid operator when operators list is provided', () => {
    const { group, properties } = makeGroup('DROP TABLE', 'status', ['=', '<>'])
    expect(validateFilterGroup(group, properties)).toBe(false)
  })

  it('returns false (not true) when property.operators is undefined — fail-closed', () => {
    // Regression: old code returned true here, allowing any operator to bypass
    // the allowlist when the column had no defined operators. New code returns false.
    const { group, properties } = makeGroup('DROP TABLE; --', 'status', undefined)
    expect(validateFilterGroup(group, properties)).toBe(false)
  })

  it('returns false when property.operators is an empty array — fail-closed', () => {
    const { group, properties } = makeGroup('=', 'status', [])
    expect(validateFilterGroup(group, properties)).toBe(false)
  })

  it('returns false when property is not found at all', () => {
    const { group } = makeGroup('=', 'unknown_column', ['='])
    const properties: FilterProperty[] = [{ label: 'Status', name: 'status', type: 'string', operators: ['='] }]
    expect(validateFilterGroup(group, properties)).toBe(false)
  })

  it('validates nested filter groups recursively', () => {
    const group: FilterGroupType = {
      logicalOperator: 'AND',
      conditions: [
        {
          logicalOperator: 'OR',
          conditions: [
            { propertyName: 'status', operator: '=', value: 'active' },
            { propertyName: 'status', operator: 'DROP TABLE', value: 'x' },
          ],
        },
      ],
    }
    const properties: FilterProperty[] = [{ label: 'Status', name: 'status', type: 'string', operators: ['='] }]
    expect(validateFilterGroup(group, properties)).toBe(false)
  })

  it('accepts valid nested groups', () => {
    const group: FilterGroupType = {
      logicalOperator: 'AND',
      conditions: [
        {
          logicalOperator: 'OR',
          conditions: [
            { propertyName: 'status', operator: '=', value: 'active' },
            { propertyName: 'status', operator: '<>', value: 'deleted' },
          ],
        },
      ],
    }
    const properties: FilterProperty[] = [{ label: 'Status', name: 'status', type: 'string', operators: ['=', '<>'] }]
    expect(validateFilterGroup(group, properties)).toBe(true)
  })
})