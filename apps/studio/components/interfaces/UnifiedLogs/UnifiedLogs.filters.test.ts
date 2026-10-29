import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { SEARCH_PARAMS_PARSER } from './UnifiedLogs.constants'
import {
  buildDefaultColumnFilters,
  buildFilterSearchUpdate,
  columnFiltersToLogsFilters,
  groupLogsFiltersByColumn,
  logAttributeFilterId,
  logsFiltersToColumnFilters,
  logsFiltersToUrlParams,
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
