import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  buildColumnFilterValues,
  buildFilterProperties,
  filterPropertySchema,
  getUserFilterValue,
  USER_PROPERTY,
  type FilterableField,
} from './LogsFilterBar.utils'

describe('buildFilterProperties', () => {
  const fields: FilterableField[] = [
    { label: 'Date', value: 'date', type: 'timerange' },
    {
      label: 'Log type',
      value: 'log_type',
      type: 'checkbox',
      options: [{ label: 'Postgres', value: 'postgres' }],
    },
    { label: 'Event message', value: 'event_message', type: 'input' },
    { label: 'Pathname', value: 'pathname', type: 'checkbox' },
  ]

  it('produces properties that all satisfy the FilterProperty schema', () => {
    const result = buildFilterProperties({ fields })
    expect(() => filterPropertySchema.array().parse(result)).not.toThrow()
  })

  it('drops timerange fields and appends the synthetic user property last', () => {
    const names = buildFilterProperties({ fields }).map((property) => property.name)
    expect(names).not.toContain('date')
    expect(names).toEqual(['log_type', 'event_message', 'pathname', USER_PROPERTY])
  })

  it('gives the event_message column pattern (ILIKE) operators', () => {
    const eventMessage = buildFilterProperties({ fields }).find(
      (property) => property.name === 'event_message'
    )
    expect(eventMessage?.operators).toEqual([
      { label: 'iLike', value: '~~*', group: 'pattern' },
      { label: 'Not iLike', value: '!~~*', group: 'pattern' },
    ])
  })

  it('gives every other column comparison operators', () => {
    const logType = buildFilterProperties({ fields }).find(
      (property) => property.name === 'log_type'
    )
    expect(logType?.operators).toEqual([
      { label: 'Equals', value: '=', group: 'comparison' },
      { label: 'Not equal', value: '<>', group: 'comparison' },
    ])
  })

  it('gives pathname both comparison and pattern (ILIKE) operators', () => {
    const pathname = buildFilterProperties({ fields }).find(
      (property) => property.name === 'pathname'
    )
    expect(pathname?.operators).toEqual([
      { label: 'Equals', value: '=', group: 'comparison' },
      { label: 'Not equal', value: '<>', group: 'comparison' },
      { label: 'iLike', value: '~~*', group: 'pattern' },
      { label: 'Not iLike', value: '!~~*', group: 'pattern' },
    ])
  })

  it('defaults a column without options to an empty array', () => {
    const eventMessage = buildFilterProperties({ fields }).find(
      (property) => property.name === 'event_message'
    )
    expect(eventMessage?.options).toEqual([])
  })

  it('appends a user property limited to the equals operator', () => {
    const user = buildFilterProperties({ fields }).find(
      (property) => property.name === USER_PROPERTY
    )
    expect(user).toEqual({
      label: 'User',
      name: USER_PROPERTY,
      type: 'string',
      options: [],
      operators: [{ label: 'Equals', value: '=', group: 'comparison' }],
    })
  })

  it('wires a provided async options function into the user property', () => {
    const userOptions = async () => []
    const user = buildFilterProperties({ fields, userOptions }).find(
      (property) => property.name === USER_PROPERTY
    )
    expect(user?.options).toBe(userOptions)
  })
})

describe('getUserFilterValue', () => {
  const resultSchema = z.string().optional()

  it('returns the user condition value coerced to a string, validated by schema', () => {
    const result = getUserFilterValue([
      { propertyName: 'log_type', value: 'postgres', operator: '=' },
      { propertyName: USER_PROPERTY, value: 'abc@example.com', operator: '=' },
    ])
    expect(() => resultSchema.parse(result)).not.toThrow()
    expect(result).toBe('abc@example.com')
  })

  it('coerces a non-string condition value to a string', () => {
    const result = getUserFilterValue([{ propertyName: USER_PROPERTY, value: 42, operator: '=' }])
    expect(() => resultSchema.parse(result)).not.toThrow()
    expect(result).toBe('42')
  })

  it('returns undefined when no user condition is present', () => {
    const result = getUserFilterValue([
      { propertyName: 'log_type', value: 'postgres', operator: '=' },
    ])
    expect(() => resultSchema.parse(result)).not.toThrow()
    expect(result).toBeUndefined()
  })

  it('returns the first user condition value when several are present', () => {
    const result = getUserFilterValue([
      { propertyName: USER_PROPERTY, value: 'first', operator: '=' },
      { propertyName: USER_PROPERTY, value: 'second', operator: '=' },
    ])
    expect(result).toBe('first')
  })
})

describe('buildColumnFilterValues', () => {
  it.each(['=', '<>', '~~*', '!~~*'] as const)(
    'wraps a `%s` condition as { operator, values }, the one shape every column filter uses',
    (operator) => {
      const result = buildColumnFilterValues([
        { propertyName: 'log_type', value: 'postgres', operator },
      ])
      expect(result.get('log_type')).toEqual({ operator, values: ['postgres'] })
    }
  )

  it('accumulates multiple `=` conditions on the same column into one group', () => {
    const result = buildColumnFilterValues([
      { propertyName: 'log_type', value: 'postgres', operator: '=' },
      { propertyName: 'log_type', value: 'auth', operator: '=' },
    ])
    expect(result.get('log_type')).toEqual({ operator: '=', values: ['postgres', 'auth'] })
  })

  it('coerces non-string condition values to strings', () => {
    const result = buildColumnFilterValues([
      { propertyName: 'status_code', value: 500, operator: '=' },
    ])
    expect(result.get('status_code')).toEqual({ operator: '=', values: ['500'] })
  })

  it('keeps separate columns independent', () => {
    const result = buildColumnFilterValues([
      { propertyName: 'log_type', value: 'postgres', operator: '=' },
      { propertyName: 'event_message', value: 'error', operator: '~~*' },
    ])
    expect(result.get('log_type')).toEqual({ operator: '=', values: ['postgres'] })
    expect(result.get('event_message')).toEqual({ operator: '~~*', values: ['error'] })
  })

  it('lets the last operator win when a column mixes operators', () => {
    const result = buildColumnFilterValues([
      { propertyName: 'log_type', value: 'postgres', operator: '=' },
      { propertyName: 'log_type', value: 'auth', operator: '<>' },
    ])
    expect(result.get('log_type')).toEqual({ operator: '<>', values: ['postgres', 'auth'] })
  })

  it('excludes the synthetic user condition', () => {
    const result = buildColumnFilterValues([
      { propertyName: USER_PROPERTY, value: 'abc@example.com', operator: '=' },
    ])
    expect(result.has(USER_PROPERTY)).toBe(false)
  })
})
