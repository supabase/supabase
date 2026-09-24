import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import {
  buildColumnFilterValues,
  buildFilterGroup,
  buildFilterProperties,
  filterPropertySchema,
  formatTimeRangeValue,
  getUserFilterValue,
  parseTimeRange,
  serializeTimeRange,
  TIME_RANGE_PROPERTY,
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

  it('includes the time range and appends the synthetic user property last', () => {
    const names = buildFilterProperties({ fields }).map((property) => property.name)
    expect(names).toEqual(['date', 'log_type', 'event_message', 'pathname', USER_PROPERTY])
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

describe('time range filters', () => {
  const range = [new Date('2026-09-22T02:00:00.123Z'), new Date('2026-09-22T03:00:00.456Z')]

  it('uses the custom picker with only the equals operator', () => {
    const options = {
      component: () => {
        throw new Error('Not rendered in this test')
      },
    }
    const properties = buildFilterProperties({
      fields: [{ label: 'Time Range', value: TIME_RANGE_PROPERTY, type: 'timerange' }],
      timeRangeOptions: options,
    })
    expect(properties[0]).toMatchObject({
      label: 'Time range',
      type: 'date',
      options,
      operators: [{ label: 'Equals', value: '=', group: 'comparison' }],
    })
    expect(() => filterPropertySchema.array().parse(properties)).not.toThrow()
  })

  it('round-trips precise dates from the sidebar or timeline through the bar', () => {
    const group = buildFilterGroup(
      [{ id: TIME_RANGE_PROPERTY, value: range }],
      new Set([TIME_RANGE_PROPERTY])
    )
    expect(group.conditions).toEqual([
      { propertyName: TIME_RANGE_PROPERTY, value: serializeTimeRange(range), operator: '=' },
    ])
    expect(parseTimeRange(serializeTimeRange(range))).toEqual(range)
  })

  it.each([
    undefined,
    null,
    '',
    'invalid',
    '2026-09-22T02:00:00Z',
    'invalid – 2026-09-22T03:00:00Z',
    '2026-09-22T03:00:00Z – 2026-09-22T02:00:00Z',
    '2026-09-22T02:00:00Z – 2026-09-22T03:00:00Z – 2026-09-22T04:00:00Z',
  ])('rejects an invalid or incomplete range: %s', (value) => {
    expect(parseTimeRange(value)).toBeUndefined()
  })

  it('does not wrap dates as ordinary log attribute filters', () => {
    const values = buildColumnFilterValues([
      { propertyName: TIME_RANGE_PROPERTY, value: serializeTimeRange(range), operator: '=' },
      { propertyName: 'log_type', value: 'postgres', operator: '=' },
    ])
    expect([...values]).toEqual([['log_type', { operator: '=', values: ['postgres'] }]])
  })

  it('syncs removal while preserving other filters and skipping invalid dates', () => {
    const group = buildFilterGroup(
      [
        { id: 'date', value: [new Date('invalid'), range[1]] },
        { id: 'log_type', value: { operator: '<>', values: ['postgres', 'auth'] } },
        { id: 'external', value: { operator: '=', values: ['value'] } },
      ],
      new Set(['date', 'log_type'])
    )
    expect(group.conditions).toEqual([
      { propertyName: 'log_type', value: 'postgres', operator: '<>' },
      { propertyName: 'log_type', value: 'auth', operator: '<>' },
    ])
    expect(buildFilterGroup([], new Set(['date'])).conditions).toEqual([])
  })
})

describe('time range labels', () => {
  afterEach(() => vi.useRealTimers())

  it('matches the sidebar preset label within its one-minute tolerance', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-22T03:00:30Z'))
    expect(
      formatTimeRangeValue(
        serializeTimeRange([new Date('2026-09-22T02:00:00Z'), new Date('2026-09-22T03:00:00Z')])
      )
    ).toBe('Last 60 minutes')
  })

  it('formats custom ranges in local time just like the sidebar', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 23))
    expect(
      formatTimeRangeValue(
        serializeTimeRange([new Date(2026, 8, 22, 10, 5), new Date(2026, 8, 22, 11, 45)])
      )
    ).toBe('22 Sep, 10:05 - 22 Sep, 11:45')
  })

  it('preserves incomplete values while editing', () => {
    expect(formatTimeRangeValue('unfinished')).toBe('unfinished')
    expect(formatTimeRangeValue(null)).toBe('')
  })
})
