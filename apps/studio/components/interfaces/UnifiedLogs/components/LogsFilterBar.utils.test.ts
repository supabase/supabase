import { afterEach, describe, expect, it, vi } from 'vitest'

import { createUnifiedLogsSearch } from '../UnifiedLogs.utils'
import {
  areFilterGroupsEquivalent,
  buildColumnFilterValues,
  buildFilterGroup,
  buildFilterProperties,
  filterPropertySchema,
  formatTimeRangeValue,
  getLogAttributeSources,
  getUserFilterValue,
  normalizeFilterGroup,
  TIME_RANGE_PROPERTY,
  USER_PROPERTY,
  type FilterableField,
} from './LogsFilterBar.utils'
import {
  parseTimeRange,
  serializeTimeRange,
} from '@/components/interfaces/Settings/Logs/Logs.timeRange'

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

  it.each([
    ['event_message', ['~~*', '!~~*']],
    ['log_type', ['=', '<>']],
    ['pathname', ['=', '<>', '~~*', '!~~*']],
  ])('gives the %s column the %j operators', (name, operators) => {
    const property = buildFilterProperties({ fields }).find((property) => property.name === name)
    const operatorValues = property?.operators?.map((operator) =>
      typeof operator === 'string' ? operator : operator.value
    )
    expect(operatorValues).toEqual(operators)
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
      topLevelOnly: true,
    })
  })

  it('keeps properties that change which sources are queried out of nested groups', () => {
    const topLevelOnly = buildFilterProperties({ fields })
      .filter((property) => property.topLevelOnly)
      .map((property) => property.name)
    expect(topLevelOnly).toEqual(['date', 'log_type', USER_PROPERTY])
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
  it('returns the user condition value', () => {
    const result = getUserFilterValue([
      { propertyName: 'log_type', value: 'postgres', operator: '=' },
      { propertyName: USER_PROPERTY, value: 'abc@example.com', operator: '=' },
    ])
    expect(result).toBe('abc@example.com')
  })

  it('coerces a non-string condition value to a string', () => {
    const result = getUserFilterValue([{ propertyName: USER_PROPERTY, value: 42, operator: '=' }])
    expect(result).toBe('42')
  })

  it('returns undefined when no user condition is present', () => {
    const result = getUserFilterValue([
      { propertyName: 'log_type', value: 'postgres', operator: '=' },
    ])
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

describe('attribute discovery scope', () => {
  it('intersects the selected types with fixed resource scope', () => {
    const search = createUnifiedLogsSearch(
      { filter: ['log_type:neq:edge function runtime'] },
      {
        filters: [
          { column: 'log_type', operator: '=', value: 'edge function' },
          { column: 'log_type', operator: '=', value: 'edge function runtime' },
          { column: 'function_id', operator: '=', value: 'fn-1' },
        ],
      }
    )
    expect(getLogAttributeSources(search)).toEqual(['function_edge_logs'])
  })

  it('does not discover sources that cannot match a scoped user filter', () => {
    const search = createUnifiedLogsSearch(
      { user: 'user-1' },
      {
        filters: [{ column: 'log_type', operator: '=', value: 'edge function' }],
      }
    )
    expect(getLogAttributeSources(search)).toEqual([])
  })
})

describe('filter groups', () => {
  const orGroup = {
    logicalOperator: 'OR' as const,
    conditions: [
      { propertyName: 'status', operator: '<>', value: '200' },
      { propertyName: 'pathname', operator: '<>', value: '/health' },
    ],
  }

  it('renders group column filters as nested OR groups after the flat conditions', () => {
    const group = buildFilterGroup(
      [
        {
          id: 'group.0',
          value: {
            group: 'or',
            filters: [
              { column: 'status', operator: '<>', value: '200' },
              { column: 'pathname', operator: '<>', value: '/health' },
            ],
          },
        },
        { id: 'level', value: { operator: '=', values: ['error'] } },
      ],
      new Set(['level'])
    )
    expect(group).toEqual({
      logicalOperator: 'AND',
      conditions: [{ propertyName: 'level', operator: '=', value: 'error' }, orGroup],
    })
  })

  it('splits the bar into flat conditions and OR groups', () => {
    const normalized = normalizeFilterGroup({
      logicalOperator: 'AND',
      conditions: [{ propertyName: 'level', operator: '=', value: 'error' }, orGroup],
    })
    expect(normalized).toEqual({
      conditions: [{ propertyName: 'level', operator: '=', value: 'error' }],
      groups: [
        {
          group: 'or',
          filters: [
            { column: 'status', operator: '<>', value: '200' },
            { column: 'pathname', operator: '<>', value: '/health' },
          ],
        },
      ],
    })
  })

  it('merges nested AND groups into the root and nested OR groups into their parent OR', () => {
    const normalized = normalizeFilterGroup({
      logicalOperator: 'AND',
      conditions: [
        {
          logicalOperator: 'AND',
          conditions: [{ propertyName: 'level', operator: '=', value: 'error' }],
        },
        {
          logicalOperator: 'OR',
          conditions: [
            { propertyName: 'status', operator: '=', value: '500' },
            {
              logicalOperator: 'OR',
              conditions: [{ propertyName: 'status', operator: '=', value: '502' }],
            },
          ],
        },
      ],
    })
    expect(normalized?.conditions).toHaveLength(1)
    expect(normalized?.groups).toEqual([
      {
        group: 'or',
        filters: [
          { column: 'status', operator: '=', value: '500' },
          { column: 'status', operator: '=', value: '502' },
        ],
      },
    ])
  })

  it.each([
    [
      'a group condition without a value',
      {
        logicalOperator: 'AND' as const,
        conditions: [
          {
            logicalOperator: 'OR' as const,
            conditions: [{ propertyName: 'status', operator: '=', value: '' }],
          },
        ],
      },
    ],
    [
      'an AND group inside an OR group',
      {
        logicalOperator: 'AND' as const,
        conditions: [
          {
            logicalOperator: 'OR' as const,
            conditions: [
              {
                logicalOperator: 'AND' as const,
                conditions: [{ propertyName: 'status', operator: '=', value: '200' }],
              },
            ],
          },
        ],
      },
    ],
    [
      'a top-level-only column inside a group',
      {
        logicalOperator: 'AND' as const,
        conditions: [
          {
            logicalOperator: 'OR' as const,
            conditions: [{ propertyName: 'log_type', operator: '=', value: 'auth' }],
          },
        ],
      },
    ],
    [
      'an OR root',
      {
        logicalOperator: 'OR' as const,
        conditions: [{ propertyName: 'status', operator: '=', value: '200' }],
      },
    ],
  ])('does not apply %s', (_, group) => {
    expect(normalizeFilterGroup(group)).toBeNull()
  })

  it('does not apply a root that uses one column with different operators', () => {
    expect(
      normalizeFilterGroup({
        logicalOperator: 'AND',
        conditions: [
          {
            logicalOperator: 'AND',
            conditions: [
              { propertyName: 'status', operator: '<>', value: '200' },
              { propertyName: 'status', operator: '=', value: '500' },
            ],
          },
        ],
      })
    ).toBeNull()
  })

  it('applies a root that repeats a column with the same operator', () => {
    const conditions = [
      { propertyName: 'status', operator: '<>', value: '200' },
      { propertyName: 'status', operator: '<>', value: '500' },
    ]
    expect(normalizeFilterGroup({ logicalOperator: 'AND', conditions })).toEqual({
      conditions,
      groups: [],
    })
  })

  it('skips an empty group so a group emptied by removing its last condition stops filtering', () => {
    const level = { propertyName: 'level', operator: '=', value: 'error' }
    expect(
      normalizeFilterGroup({
        logicalOperator: 'AND',
        conditions: [level, { logicalOperator: 'OR', conditions: [] }],
      })
    ).toEqual({ conditions: [level], groups: [] })
  })

  describe('areFilterGroupsEquivalent', () => {
    const level = { propertyName: 'level', operator: '=', value: 'error' }
    const status = { propertyName: 'status', operator: '<>', value: '200' }
    const path = { propertyName: 'pathname', operator: '<>', value: '/health' }

    it('treats a nested AND group as equal to the same conditions at the root', () => {
      expect(
        areFilterGroupsEquivalent(
          {
            logicalOperator: 'AND',
            conditions: [level, { logicalOperator: 'AND', conditions: [status, path] }],
          },
          { logicalOperator: 'AND', conditions: [level, status, path] }
        )
      ).toBe(true)
    })

    it('treats an empty group as equal to no group', () => {
      expect(
        areFilterGroupsEquivalent(
          {
            logicalOperator: 'AND',
            conditions: [level, { logicalOperator: 'OR', conditions: [] }],
          },
          { logicalOperator: 'AND', conditions: [level] }
        )
      ).toBe(true)
    })

    it('ignores condition and group order', () => {
      expect(
        areFilterGroupsEquivalent(
          { logicalOperator: 'AND', conditions: [level, { ...orGroup }] },
          {
            logicalOperator: 'AND',
            conditions: [
              { logicalOperator: 'OR', conditions: [...orGroup.conditions].reverse() },
              level,
            ],
          }
        )
      ).toBe(true)
    })

    it('tells an OR group apart from the same conditions ANDed together', () => {
      expect(
        areFilterGroupsEquivalent(
          { logicalOperator: 'AND', conditions: [orGroup] },
          { logicalOperator: 'AND', conditions: [status, path] }
        )
      ).toBe(false)
    })

    it('is false while either side is incomplete', () => {
      const draft = { logicalOperator: 'AND' as const, conditions: [{ ...level, value: '' }] }
      expect(areFilterGroupsEquivalent(draft, draft)).toBe(false)
    })
  })
})
