import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { SEARCH_PARAMS_PARSER } from './UnifiedLogs.constants'
import {
  addLogsColumnFilter,
  buildDefaultColumnFilters,
  buildFilterSearchUpdate,
  columnFiltersToLogsFilters,
  countLogsFilterUrlParams,
  groupLogsFiltersByColumn,
  isLogsFilterGroupColumnFilterId,
  logAttributeFilterId,
  logsFilterGroupsToUrlParams,
  logsFiltersToColumnFilters,
  logsFiltersToUrlParams,
  parseLogsFilterGroupUrlParams,
  parseLogsFilterUrlParams,
} from './UnifiedLogs.filters'
import { serializeUnifiedLogsSearchParams } from './UnifiedLogs.utils'

describe('columnFiltersToLogsFilters', () => {
  it('serializes a bare string[] (defensive fallback for un-wrapped input) using the default `=` operator', () => {
    const filters = columnFiltersToLogsFilters([
      { id: 'log_type', value: ['postgres', 'postgrest'] },
    ])
    expect(filters).toEqual([
      { column: 'log_type', operator: '=', value: 'postgres' },
      { column: 'log_type', operator: '=', value: 'postgrest' },
    ])
    expect(logsFiltersToUrlParams(filters)).toEqual([
      'log_type:eq:postgres',
      'log_type:eq:postgrest',
    ])
  })

  it('preserves the operator from a wrapped value (top filter bar)', () => {
    const filters = columnFiltersToLogsFilters([
      { id: 'method', value: { operator: '<>', values: ['GET'] } },
    ])
    expect(filters).toEqual([{ column: 'method', operator: '<>', value: 'GET' }])
  })

  it('treats a bare non-array scalar as a single `=` value', () => {
    const filters = columnFiltersToLogsFilters([{ id: 'status', value: '500' }])
    expect(filters).toEqual([{ column: 'status', operator: '=', value: '500' }])
  })

  it('excludes columns not in filterableNames (e.g. the `date` timerange brush)', () => {
    const filterable = new Set(['log_type', 'method'])
    const filters = columnFiltersToLogsFilters(
      [
        { id: 'date', value: [new Date('2026-05-08T00:00:00Z'), new Date('2026-05-08T01:00:00Z')] },
        { id: 'log_type', value: ['postgres'] },
      ],
      filterable
    )
    expect(filters).toEqual([{ column: 'log_type', operator: '=', value: 'postgres' }])
  })

  it('skips null/undefined values (cleared filters)', () => {
    const filters = columnFiltersToLogsFilters([
      { id: 'log_type', value: null },
      { id: 'method', value: undefined },
    ])
    expect(filters).toEqual([])
  })
})

describe('logsFiltersToColumnFilters', () => {
  it('seeds an `=` group as { operator, values }, the shape every column filter uses', () => {
    const columnFilters = logsFiltersToColumnFilters([
      { column: 'log_type', operator: '=', value: 'postgres' },
      { column: 'log_type', operator: '=', value: 'postgrest' },
    ])
    expect(columnFilters).toEqual([
      { id: 'log_type', value: { operator: '=', values: ['postgres', 'postgrest'] } },
    ])
  })

  it('keeps non-eq groups wrapped so the operator survives a round-trip', () => {
    const columnFilters = logsFiltersToColumnFilters([
      { column: 'event_message', operator: '~~*', value: 'error' },
    ])
    expect(columnFilters).toEqual([
      { id: 'event_message', value: { operator: '~~*', values: ['error'] } },
    ])
  })

  it.each(['method:eq:GET', 'method:neq:GET'])(
    'round-trips the URL filter %s back to the same param without changing the operator',
    (param) => {
      const seeded = logsFiltersToColumnFilters(parseLogsFilterUrlParams([param]))
      const update = buildFilterSearchUpdate(seeded, [{ value: 'method', type: 'checkbox' }])
      expect(update.filter).toEqual([param])
    }
  )
})

describe('buildFilterSearchUpdate', () => {
  const fields = [
    { value: 'date', type: 'timerange' },
    { value: 'log_type', type: 'checkbox' },
    { value: 'method', type: 'checkbox' },
  ]

  it('serializes a bare string[] into the `filter` param (defensive fallback for un-wrapped input)', () => {
    const update = buildFilterSearchUpdate([{ id: 'log_type', value: ['postgres'] }], fields)
    expect(update.filter).toEqual(['log_type:eq:postgres'])
  })

  it('clears the `filter` param to null when no equality filters are set', () => {
    const update = buildFilterSearchUpdate([{ id: 'log_type', value: null }], fields)
    expect(update.filter).toBeNull()
  })

  it('routes a timerange to its own URL key, never into `filter`', () => {
    const range = [new Date('2026-05-08T00:00:00Z'), new Date('2026-05-08T01:00:00Z')]
    const update = buildFilterSearchUpdate(
      [
        { id: 'date', value: range },
        { id: 'method', value: ['GET'] },
      ],
      fields
    )
    expect(update.filter).toEqual(['method:eq:GET'])
    expect(update.date).toBe(range)
  })

  it('nulls an absent timerange key so a cleared brush is removed from the URL', () => {
    const update = buildFilterSearchUpdate([{ id: 'method', value: ['GET'] }], fields)
    expect(update.date).toBeNull()
  })
})

describe('buildDefaultColumnFilters', () => {
  const fields = [
    { value: 'date', type: 'timerange' },
    { value: 'log_type', type: 'checkbox' },
  ]

  it('seeds a deep-linked `date` range so it survives the debounced sync back to the URL', () => {
    const range = [new Date('2026-05-08T00:00:00Z'), new Date('2026-05-08T01:00:00Z')]
    const columnFilters = buildDefaultColumnFilters({
      filter: ['log_type:eq:postgres'],
      date: range,
    })
    expect(columnFilters).toEqual([
      { id: 'log_type', value: { operator: '=', values: ['postgres'] } },
      { id: 'date', value: range },
    ])

    // Regression guard: without the `date` entry above, this would null out the range.
    const update = buildFilterSearchUpdate(columnFilters, fields)
    expect(update.date).toBe(range)
  })

  it.each([
    ['no range is present', null],
    ['the range is a malformed single element', [new Date('2026-05-08T00:00:00Z')]],
  ])('omits `date` when %s', (_, date) => {
    expect(buildDefaultColumnFilters({ filter: ['log_type:eq:postgres'], date })).toEqual([
      { id: 'log_type', value: { operator: '=', values: ['postgres'] } },
    ])
  })

  it('does not duplicate the `date` id when a hand-crafted `filter` param also targets it', () => {
    const range = [new Date('2026-05-08T00:00:00Z'), new Date('2026-05-08T01:00:00Z')]
    const columnFilters = buildDefaultColumnFilters({ filter: ['date:eq:123'], date: range })
    expect(columnFilters).toEqual([{ id: 'date', value: range }])
  })
})

describe('attribute filter URLs', () => {
  it.each([
    'request_id',
    'attribute.status',
    'attribute.request:header',
    'attribute.a%3Ab',
    '__proto__',
    'constructor',
  ])('preserves %s when changing a builtin filter after reload', (column) => {
    const original = [{ column, operator: '<>' as const, value: "value:with'quotes\\and:colons" }]
    const params = logsFiltersToUrlParams(original)
    const reloaded = buildDefaultColumnFilters({ filter: params })
    const update = buildFilterSearchUpdate(
      [...reloaded, { id: 'method', value: ['POST'] }],
      [
        { value: 'method', type: 'checkbox' },
        { value: 'date', type: 'timerange' },
      ]
    )
    expect(parseLogsFilterUrlParams(z.array(z.string()).nullable().parse(update.filter))).toEqual([
      ...original,
      { column: 'method', operator: '=', value: 'POST' },
    ])
  })

  it('keeps attributes named like builtins and nested attribute prefixes distinct', () => {
    const columns = [
      'status',
      logAttributeFilterId('status'),
      logAttributeFilterId('attribute.status'),
    ]
    const grouped = groupLogsFiltersByColumn(
      columns.map((column, index) => ({ column, operator: '=', value: String(index) }))
    )
    expect(Object.values(grouped).map(({ values }) => values)).toEqual([['0'], ['1'], ['2']])
  })
})

it.each(['comma,value:colon%percent', 'literal%2C:comma,plus+space value'])(
  'round-trips attribute keys and %s through the public logs URL',
  (value) => {
    const original = [
      {
        column: logAttributeFilterId('request.headers.x:custom,%2C'),
        operator: '<>' as const,
        value,
      },
    ]
    const url = serializeUnifiedLogsSearchParams('/project/abc/logs', {
      filter: logsFiltersToUrlParams(original),
    })
    const params = new URL(url, 'https://example.com').searchParams
    const parsed = SEARCH_PARAMS_PARSER.filter.parse(params.get('filter') ?? '')
    expect(parseLogsFilterUrlParams(parsed)).toEqual(original)
  }
)

it('ignores malformed attribute encodings without losing valid neighboring or legacy filters', () => {
  expect(
    parseLogsFilterUrlParams([
      'attribute.request_id:eq:req-1',
      'attribute.broken%:eq:ignored',
      'event_message:ilike:100% ready:now',
      'attribute.trace_id:eq:%C3%28',
      'attribute.span_id:neq:span%3A1',
    ])
  ).toEqual([
    { column: 'attribute.request_id', operator: '=', value: 'req-1' },
    { column: 'event_message', operator: '~~*', value: '100% ready:now' },
    { column: 'attribute.span_id', operator: '<>', value: 'span:1' },
  ])
})

describe('addLogsColumnFilter', () => {
  const pathname = { field: 'pathname', operator: '=', value: '/rest/v1/todos' } as const

  it('adds a filter for a column that has none', () => {
    expect(addLogsColumnFilter([], pathname)).toEqual([
      { id: 'pathname', value: { operator: '=', values: ['/rest/v1/todos'] } },
    ])
  })

  it('keeps values with special characters intact', () => {
    const value = `/rest/v1/todos?name=eq."O'Brien"&x=a:b`
    expect(addLogsColumnFilter([], { ...pathname, value })).toEqual([
      { id: 'pathname', value: { operator: '=', values: [value] } },
    ])
  })

  it('collects a second value under the same operator, in place', () => {
    const current = [
      { id: 'method', value: { operator: '=', values: ['GET'] } },
      { id: 'pathname', value: { operator: '=', values: ['/rest/v1/todos'] } },
    ]
    expect(addLogsColumnFilter(current, { field: 'method', operator: '=', value: 'POST' })).toEqual(
      [{ id: 'method', value: { operator: '=', values: ['GET', 'POST'] } }, current[1]]
    )
  })

  it('leaves an already applied filter untouched rather than duplicating it', () => {
    const current = [{ id: 'pathname', value: { operator: '=', values: ['/rest/v1/todos'] } }]
    expect(addLogsColumnFilter(current, pathname)).toEqual(current)
  })

  it('replaces the values when the operator changes, since a column holds one operator', () => {
    const current = [{ id: 'pathname', value: { operator: '=', values: ['/health'] } }]
    expect(addLogsColumnFilter(current, { ...pathname, operator: '<>' })).toEqual([
      { id: 'pathname', value: { operator: '<>', values: ['/rest/v1/todos'] } },
    ])
  })

  it('replaces an unwrapped legacy value (bare string[]) with the wrapped shape', () => {
    const current = [{ id: 'log_type', value: ['postgres'] }]
    expect(
      addLogsColumnFilter(current, { field: 'log_type', operator: '=', value: 'auth' })
    ).toEqual([{ id: 'log_type', value: { operator: '=', values: ['auth'] } }])
  })

  it('stringifies numeric values so they match the column filter shape', () => {
    expect(addLogsColumnFilter([], { field: 'status', operator: '<>', value: 500 })).toEqual([
      { id: 'status', value: { operator: '<>', values: ['500'] } },
    ])
  })
})

describe('filter groups', () => {
  const group = {
    operator: 'or' as const,
    filters: [
      { column: 'status', operator: '<>' as const, value: '200' },
      { column: 'pathname', operator: '<>' as const, value: '/health' },
    ],
  }
  const encoded = 'group:or:status:neq:200,pathname:neq:%2Fhealth'

  it('serializes a group as one URL entry with encoded values', () => {
    expect(logsFilterGroupsToUrlParams([group])).toEqual([encoded])
  })

  it('round-trips values containing the URL delimiters', () => {
    const tricky = {
      operator: 'or' as const,
      filters: [
        { column: 'attribute.request.headers.x-a:b', operator: '=' as const, value: 'a,b:c%d' },
        { column: 'event_message', operator: '~~*' as const, value: '' },
      ],
    }
    expect(parseLogsFilterGroupUrlParams(logsFilterGroupsToUrlParams([tricky]))).toEqual([tricky])
  })

  it('does not serialize empty groups', () => {
    expect(logsFilterGroupsToUrlParams([{ operator: 'or', filters: [] }])).toEqual([])
  })

  it('keeps group entries out of the flat filter parser, so older readers ignore them', () => {
    expect(parseLogsFilterUrlParams(['level:eq:error', encoded])).toEqual([
      { column: 'level', operator: '=', value: 'error' },
    ])
  })

  it('drops a malformed group whole instead of narrowing it', () => {
    expect(parseLogsFilterGroupUrlParams(['group:or:status:neq:200,pathname:bogus:x'])).toEqual([])
    expect(parseLogsFilterGroupUrlParams(['group:or:status:neq'])).toEqual([])
    expect(parseLogsFilterGroupUrlParams(['group:or:'])).toEqual([])
    expect(parseLogsFilterGroupUrlParams(['group:or:status:neq:%E0%A4%A'])).toEqual([])
  })

  it('rejects operator abbreviations inherited from Object.prototype', () => {
    expect(
      parseLogsFilterGroupUrlParams(['group:or:status:eq:200,pathname:constructor:x'])
    ).toEqual([])
    expect(parseLogsFilterUrlParams(['status:toString:200', 'level:eq:error'])).toEqual([
      { column: 'level', operator: '=', value: 'error' },
    ])
  })

  it('counts a group as an active filter even when no flat filter is set', () => {
    expect(countLogsFilterUrlParams([encoded])).toBe(1)
    expect(countLogsFilterUrlParams(['level:eq:error', encoded])).toBe(2)
    expect(countLogsFilterUrlParams(['group:or:status:bogus:1'])).toBe(0)
    expect(countLogsFilterUrlParams(undefined)).toBe(0)
  })

  it('rejects groups that contain top-level-only columns', () => {
    expect(parseLogsFilterGroupUrlParams(['group:or:log_type:eq:auth,status:neq:200'])).toEqual([])
  })

  it('seeds groups as column filters and writes them back to the URL', () => {
    const columnFilters = buildDefaultColumnFilters({ filter: ['level:eq:error', encoded] })
    expect(columnFilters).toEqual([
      { id: 'level', value: { operator: '=', values: ['error'] } },
      { id: 'group.0', value: { group: 'or', filters: group.filters } },
    ])
    expect(buildFilterSearchUpdate(columnFilters, []).filter).toEqual(['level:eq:error', encoded])
  })

  it('does not treat a group column filter as a flat filter', () => {
    expect(
      columnFiltersToLogsFilters([
        { id: 'group.0', value: { group: 'or', filters: group.filters } },
      ])
    ).toEqual([])
  })

  it('only treats `group.<index>` ids as group filters, not attributes that start with "group."', () => {
    expect(isLogsFilterGroupColumnFilterId('group.0')).toBe(true)
    expect(isLogsFilterGroupColumnFilterId('group.12')).toBe(true)
    expect(isLogsFilterGroupColumnFilterId('group.id')).toBe(false)
    expect(isLogsFilterGroupColumnFilterId('group.0.name')).toBe(false)
    expect(isLogsFilterGroupColumnFilterId('attribute.group.0')).toBe(false)
  })
})
