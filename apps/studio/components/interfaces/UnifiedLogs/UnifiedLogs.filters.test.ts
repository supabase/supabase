import { describe, expect, it } from 'vitest'

import { columnFiltersToLogsFilters, logsFiltersToUrlParams } from './UnifiedLogs.filters'

describe('columnFiltersToLogsFilters', () => {
  it('serializes a bare string[] (sidebar checkbox) using the default `=` operator', () => {
    // The shared DataTable checkbox writes a plain array via setFilterValue.
    // It must still round-trip into the `filter` URL param, otherwise clicking
    // a sidebar facet never re-runs the query (the reported regression).
    const filters = columnFiltersToLogsFilters([{ id: 'log_type', value: ['postgres', 'postgrest'] }])
    expect(filters).toEqual([
      { column: 'log_type', operator: '=', value: 'postgres' },
      { column: 'log_type', operator: '=', value: 'postgrest' },
    ])
    expect(logsFiltersToUrlParams(filters)).toEqual(['log_type:eq:postgres', 'log_type:eq:postgrest'])
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
    // `date` is a plain [start, end] array; it round-trips through its own URL
    // key, so it must not leak into the `filter` param now that bare arrays are
    // normalized.
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
