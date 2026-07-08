import { describe, expect, it } from 'vitest'

import {
  buildFilterSearchUpdate,
  columnFiltersToLogsFilters,
  logsFiltersToColumnFilters,
  logsFiltersToUrlParams,
  parseLogsFilterUrlParams,
} from './UnifiedLogs.filters'

describe('columnFiltersToLogsFilters', () => {
  it('serializes a bare string[] (sidebar checkbox) using the default `=` operator', () => {
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
  it('seeds an `=` group as a bare string[] so sidebar checkboxes render ticked', () => {
    const columnFilters = logsFiltersToColumnFilters([
      { column: 'log_type', operator: '=', value: 'postgres' },
      { column: 'log_type', operator: '=', value: 'postgrest' },
    ])
    expect(columnFilters).toEqual([{ id: 'log_type', value: ['postgres', 'postgrest'] }])
  })

  it('keeps non-eq groups wrapped so the operator survives a round-trip', () => {
    const columnFilters = logsFiltersToColumnFilters([
      { column: 'event_message', operator: '~~*', value: 'error' },
    ])
    expect(columnFilters).toEqual([
      { id: 'event_message', value: { operator: '~~*', values: ['error'] } },
    ])
  })

  it('round-trips an eq URL filter back to the same param without flipping the operator', () => {
    const seeded = logsFiltersToColumnFilters(parseLogsFilterUrlParams(['method:eq:GET']))
    const update = buildFilterSearchUpdate(seeded, [{ value: 'method', type: 'checkbox' }])
    expect(update.filter).toEqual(['method:eq:GET'])
  })

  it('round-trips a neq URL filter without downgrading it to eq', () => {
    const seeded = logsFiltersToColumnFilters(parseLogsFilterUrlParams(['method:neq:GET']))
    const update = buildFilterSearchUpdate(seeded, [{ value: 'method', type: 'checkbox' }])
    expect(update.filter).toEqual(['method:neq:GET'])
  })
})

describe('buildFilterSearchUpdate', () => {
  const fields = [
    { value: 'date', type: 'timerange' },
    { value: 'log_type', type: 'checkbox' },
    { value: 'method', type: 'checkbox' },
  ]

  it('serializes a bare sidebar checkbox into the `filter` param (the regression)', () => {
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
