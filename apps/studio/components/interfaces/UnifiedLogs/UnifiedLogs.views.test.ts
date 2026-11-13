import { describe, expect, it } from 'vitest'

import {
  applyView,
  countActiveFilters,
  isViewModified,
  LOGS_VIEW_VERSION,
  serializeView,
  type LogsView,
} from './UnifiedLogs.views'

const baseSearch = {
  filter: ['level:eq:error', 'method:neq:GET'],
  sort: { id: 'date', desc: true },
  show_connection_logs: false,
  edge_auth: true,
  edge_storage: true,
  edge_postgrest: true,
  user: 'user-123',
  latency: [0, 1000],
}

describe('serializeView', () => {
  it('captures filters and known view options, excluding null/undefined options', () => {
    const draft = serializeView({ name: 'My view', logSource: 'edge_logs', search: baseSearch })

    expect(draft.name).toBe('My view')
    expect(draft.logSource).toBe('edge_logs')
    expect(draft.filters).toEqual({
      logicalOperator: 'AND',
      conditions: [
        { propertyName: 'level', operator: '=', value: 'error' },
        { propertyName: 'method', operator: '<>', value: 'GET' },
      ],
    })
    expect(draft.viewOptions).toEqual({
      sort: { id: 'date', desc: true },
      show_connection_logs: false,
      edge_auth: true,
      edge_storage: true,
      edge_postgrest: true,
      user: 'user-123',
      latency: [0, 1000],
    })
  })

  it('omits view options that are null or absent', () => {
    const draft = serializeView({
      name: 'Minimal',
      logSource: 'edge_logs',
      search: { filter: [], user: null },
    })

    expect(draft.viewOptions).toEqual({})
  })
})

const toView = (draft: ReturnType<typeof serializeView>): LogsView => ({
  id: 'view-1',
  type: 'logs_view',
  version: LOGS_VIEW_VERSION,
  ...draft,
})

describe('applyView', () => {
  const filterableNames = new Set(['level', 'method'])

  it('round-trips a view produced by serializeView back into search params', () => {
    const view = toView(
      serializeView({ name: 'My view', logSource: 'edge_logs', search: baseSearch })
    )

    const { params, dropped } = applyView(view, { filterableNames })

    expect(dropped).toEqual([])
    expect(params.filter).toEqual(['level:eq:error', 'method:neq:GET'])
    expect(params).toMatchObject({
      sort: { id: 'date', desc: true },
      show_connection_logs: false,
      user: 'user-123',
    })
  })

  it('drops an unknown filter column and reports it instead of throwing', () => {
    const view = toView({
      name: 'Has unknown column',
      logSource: 'edge_logs',
      filters: {
        logicalOperator: 'AND',
        conditions: [
          { propertyName: 'level', operator: '=', value: 'error' },
          { propertyName: 'invalid column', operator: '=', value: 'x' },
        ],
      },
      viewOptions: {},
    })

    const { params, dropped } = applyView(view, { filterableNames })

    expect(dropped).toContain('invalid column')
    expect(params.filter).toEqual(['level:eq:error'])
  })

  it('drops an unknown viewOptions key and reports it instead of throwing', () => {
    const view = toView({
      name: 'Has unknown option',
      logSource: 'edge_logs',
      filters: { logicalOperator: 'AND', conditions: [] },
      viewOptions: { user: 'user-123', future_option: 'x' },
    })

    const { params, dropped } = applyView(view, { filterableNames })

    expect(dropped).toContain('future_option')
    expect(params).toMatchObject({ user: 'user-123' })
    expect(params).not.toHaveProperty('future_option')
  })

  it('drops a nested filter group and reports it instead of throwing', () => {
    const view = toView({
      name: 'Has nested group',
      logSource: 'edge_logs',
      filters: {
        logicalOperator: 'AND',
        conditions: [
          { propertyName: 'level', operator: '=', value: 'error' },
          { logicalOperator: 'OR', conditions: [] },
        ],
      },
      viewOptions: {},
    })

    const { params, dropped } = applyView(view, { filterableNames })

    expect(dropped).toContain('(nested group)')
    expect(params.filter).toEqual(['level:eq:error'])
  })

  it('round-trips custom attributes and legacy dynamic filters', () => {
    const filter = ['attribute.request.path:eq:%2Fauth%3Fkey%3Dvalue', 'custom_key:neq:other']
    const view = toView(
      serializeView({ name: 'Custom', logSource: 'edge_logs', search: { filter } })
    )
    const { params, dropped } = applyView(view, { filterableNames })
    expect(params.filter).toEqual(filter)
    expect(dropped).toEqual([])
  })

  it('replaces unset options while retaining the current time range', () => {
    const view = toView(
      serializeView({ name: 'Empty', logSource: 'edge_logs', search: { filter: [] } })
    )
    const date = [new Date('2026-01-01'), new Date('2026-01-02')]
    const { params } = applyView(view, { filterableNames })
    expect({ ...baseSearch, date, ...params }).toMatchObject({
      user: null,
      latency: null,
      sort: null,
      date,
    })
  })

  it('never reads or sets the time range', () => {
    const view = toView(
      serializeView({ name: 'My view', logSource: 'edge_logs', search: baseSearch })
    )

    const { params } = applyView(view, { filterableNames })

    expect(params).not.toHaveProperty('date')
  })
})

describe('isViewModified', () => {
  it('is false right after serializing the current state', () => {
    const view = toView(
      serializeView({ name: 'My view', logSource: 'edge_logs', search: baseSearch })
    )

    expect(isViewModified(view, baseSearch)).toBe(false)
  })

  it('is true when a filter changes', () => {
    const view = toView(
      serializeView({ name: 'My view', logSource: 'edge_logs', search: baseSearch })
    )

    expect(isViewModified(view, { ...baseSearch, filter: ['level:eq:warning'] })).toBe(true)
  })

  it('is true when a view option changes', () => {
    const view = toView(
      serializeView({ name: 'My view', logSource: 'edge_logs', search: baseSearch })
    )

    expect(isViewModified(view, { ...baseSearch, show_connection_logs: true })).toBe(true)
  })
})

describe('countActiveFilters', () => {
  it('counts flat conditions', () => {
    const view = toView(
      serializeView({ name: 'My view', logSource: 'edge_logs', search: baseSearch })
    )

    expect(countActiveFilters(view)).toBe(2)
  })

  it('returns 0 for no filters', () => {
    const view = toView(
      serializeView({ name: 'Empty', logSource: 'edge_logs', search: { filter: [] } })
    )

    expect(countActiveFilters(view)).toBe(0)
  })

  it('recurses into nested groups', () => {
    const view = toView({
      name: 'Nested',
      logSource: 'edge_logs',
      filters: {
        logicalOperator: 'AND',
        conditions: [
          { propertyName: 'level', operator: '=', value: 'error' },
          {
            logicalOperator: 'OR',
            conditions: [
              { propertyName: 'method', operator: '=', value: 'GET' },
              { propertyName: 'method', operator: '=', value: 'POST' },
            ],
          },
        ],
      },
      viewOptions: {},
    })

    expect(countActiveFilters(view)).toBe(3)
  })
})
