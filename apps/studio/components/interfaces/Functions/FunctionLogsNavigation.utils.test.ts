import { describe, expect, it } from 'vitest'

import {
  getEdgeFunctionLogsUrl,
  getFunctionOverviewLogsUrl,
} from './EdgeFunctionOverview/EdgeFunctionOverview.utils'
import { getFunctionLogsMigrationUrl } from './FunctionLogsNavigation.utils'

const migrate = (query: Record<string, string | undefined>) =>
  getFunctionLogsMigrationUrl({
    projectRef: 'project-ref',
    functionSlug: 'send-email',
    usesOtelLegacyLogs: true,
    searchParams: new URLSearchParams(
      Object.entries(query).flatMap(([key, value]) => (value === undefined ? [] : [[key, value]]))
    ),
  })

const parameters = (url: string | null) => new URL(url ?? '', 'https://studio.example').searchParams

describe('Function log bookmarks', () => {
  it('keeps the selected log, time range, and ordinary message search when opening unified logs', () => {
    const url = migrate({
      its: '2026-03-20T10:00:00Z',
      ite: '2026-03-20T11:00:00Z',
      log: 'selected-log',
      s: 'Email delivery failed',
    })
    const params = parameters(url)
    expect(url?.split('?')[0]).toBe('/project/project-ref/functions/send-email/logs')
    expect(params.get('id')).toBe('selected-log')
    expect(params.get('date')).toBe('1774000800000-1774004400000')
    expect(params.get('filter')).toBe('event_message:ilike:Email delivery failed')
    expect([...params.keys()].sort()).toEqual(['date', 'filter', 'id'])
  })

  it('preserves existing unified filters, date, and selection over legacy bookmark values', () => {
    const params = parameters(
      migrate({
        date: '1774000800000-1774004400000',
        id: 'unified-selection',
        filter: 'level:eq:error,event_message:ilike:timeout',
        its: '2025-03-20T10:00:00Z',
        ite: '2025-03-20T11:00:00Z',
        log: 'legacy-selection',
        s: 'old message',
      })
    )
    expect(params.get('date')).toBe('1774000800000-1774004400000')
    expect(params.get('id')).toBe('unified-selection')
    expect(params.get('filter')).toBe('level:eq:error,event_message:ilike:timeout')
  })

  it('retains case-sensitive legacy search instead of broadening it to an insensitive filter', () => {
    expect(
      getFunctionLogsMigrationUrl({
        projectRef: 'ref',
        functionSlug: 'slug',
        searchParams: new URLSearchParams({ s: 'Delivery failed' }),
        usesOtelLegacyLogs: false,
      })
    ).toBeNull()
  })

  it('keeps a literal saved search from legacy JSON filters', () => {
    expect(
      parameters(migrate({ f: JSON.stringify({ search_query: 'delivery failed' }) })).get('filter')
    ).toBe('event_message:ilike:delivery failed')
  })

  it.each([
    { s: 'timeout|failed' },
    { its: '2026-03-20T10:00:00Z' },
    { ite: '2026-03-20T11:00:00Z' },
    { s: 'request.*failed' },
    { s: '100% failed' },
    { f: JSON.stringify({ severity: { error: true } }) },
    { f: JSON.stringify({ status_code: { warning: true } }) },
    { f: JSON.stringify({ 'request.method': 'POST' }) },
    { f: '{invalid-json' },
    { f: 'null' },
  ])('retains the legacy view when a bookmark cannot preserve its filter meaning: %j', (query) => {
    expect(migrate(query)).toBeNull()
  })

  it.each([
    { its: 'invalid', ite: '2026-03-20T11:00:00Z' },
    { its: 'invalid' },
    { its: '2026-03-20T11:00:00Z', ite: '2026-03-20T10:00:00Z' },
    { date: 'NaN-NaN' },
    { date: '1774004400000-1774000800000' },
    { date: '9999999999999999999-9999999999999999999' },
  ])('opens safely without an invalid or incomplete bookmark range: %j', (query) => {
    const url = migrate(query)
    expect(url).toBe('/project/project-ref/functions/send-email/logs')
  })

  it.each([
    { start: 'invalid', end: '2026-03-20T11:00:00Z' },
    { start: '2026-03-20T10:00:00Z' },
    { start: '2026-03-20T11:00:00Z', end: '2026-03-20T10:00:00Z' },
  ])('builds chart navigation without serializing invalid dates: %j', (range) => {
    expect(getEdgeFunctionLogsUrl({ projectRef: 'ref', functionSlug: 'slug', ...range })).toBe(
      '/project/ref/functions/slug/logs'
    )
  })
})

describe('Overview chart log navigation', () => {
  it.each([
    { logType: 'edge function', destination: 'invocations' },
    { logType: 'edge function runtime', destination: 'logs' },
  ] as const)(
    'opens the full selected chart period for $logType in unified Logs',
    ({ logType }) => {
      const params = parameters(
        getFunctionOverviewLogsUrl({
          projectRef: 'ref',
          functionSlug: 'slug',
          start: '2026-03-20T10:00:00.000Z',
          end: '2026-03-20T11:00:00.000Z',
          logType,
          isUnifiedLogsEnabled: true,
        })
      )
      expect(params.get('date')).toBe('1774000800000-1774004400000')
      expect(params.get('filter')).toBe(`log_type:eq:${logType}`)
    }
  )

  it.each([
    { logType: 'edge function', destination: 'invocations' },
    { logType: 'edge function runtime', destination: 'logs' },
  ] as const)(
    'keeps preview opt-outs on the legacy $destination link',
    ({ logType, destination }) => {
      expect(
        getFunctionOverviewLogsUrl({
          projectRef: 'ref',
          functionSlug: 'slug',
          start: '2026-03-20T10:00:00.000Z',
          end: '2026-03-20T11:00:00.000Z',
          logType,
          isUnifiedLogsEnabled: false,
        })
      ).toBe(`/project/ref/functions/slug/${destination}?its=2026-03-20T10:00:00.000Z`)
    }
  )
})
