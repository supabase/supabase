import { describe, expect, it } from 'vitest'

import { extractServiceRows } from './useServiceHealthMetrics'
import type { ServiceHealthResultRow } from '@/data/analytics/service-health-query'

const makeRow = (overrides?: Partial<ServiceHealthResultRow>): ServiceHealthResultRow => ({
  timestamp: '2026-05-20T10:00:00',
  postgres_logs: { ok: 10, warning: 1, error: 2, total: 13 },
  auth_logs: { ok: 5, warning: 0, error: 1, total: 6 },
  function_edge_logs: { ok: 20, warning: 2, error: 0, total: 22 },
  storage_logs: { ok: 3, warning: 0, error: 0, total: 3 },
  realtime_logs: { ok: 0, warning: 0, error: 0, total: 0 },
  postgrest_logs: { ok: 7, warning: 1, error: 1, total: 9 },
  edge_logs: { ok: 100, warning: 5, error: 3, total: 108 },
  supavisor_logs: { ok: 0, warning: 0, error: 0, total: 0 },
  function_logs: { ok: 15, warning: 0, error: 0, total: 15 },
  etl_replication_logs: { ok: 0, warning: 0, error: 0, total: 0 },
  ...overrides,
})

describe('extractServiceRows', () => {
  it('maps postgres_logs fields to ok_count/warning_count/error_count for db', () => {
    const rows = [makeRow()]
    const result = extractServiceRows(rows, 'db')
    expect(result).toEqual([
      { timestamp: '2026-05-20T10:00:00', ok_count: 10, warning_count: 1, error_count: 2 },
    ])
  })

  it('maps the correct service field for each service key', () => {
    const row = makeRow()
    expect(extractServiceRows([row], 'auth')[0]).toMatchObject({
      ok_count: 5,
      error_count: 1,
    })
    expect(extractServiceRows([row], 'functions')[0]).toMatchObject({
      ok_count: 20,
      error_count: 0,
    })
    expect(extractServiceRows([row], 'storage')[0]).toMatchObject({ ok_count: 3 })
    expect(extractServiceRows([row], 'postgrest')[0]).toMatchObject({
      ok_count: 7,
      warning_count: 1,
      error_count: 1,
    })
  })

  it('returns an empty array when given no rows', () => {
    expect(extractServiceRows([], 'db')).toEqual([])
  })

  it('preserves the timestamp from each row', () => {
    const rows = [
      makeRow({ timestamp: '2026-05-20T09:00:00' }),
      makeRow({ timestamp: '2026-05-20T10:00:00' }),
    ]
    const result = extractServiceRows(rows, 'db')
    expect(result.map((r) => r.timestamp)).toEqual(['2026-05-20T09:00:00', '2026-05-20T10:00:00'])
  })

  it('handles multiple rows and maps each independently', () => {
    const rows = [
      makeRow({ postgres_logs: { ok: 100, warning: 0, error: 0, total: 100 } }),
      makeRow({ postgres_logs: { ok: 50, warning: 5, error: 10, total: 65 } }),
    ]
    const result = extractServiceRows(rows, 'db')
    expect(result[0]).toMatchObject({ ok_count: 100, warning_count: 0, error_count: 0 })
    expect(result[1]).toMatchObject({ ok_count: 50, warning_count: 5, error_count: 10 })
  })

  it('defaults to 0 when the service field is missing from the row', () => {
    const row = makeRow()
    // Simulate a backend response that omits a service field
    const partial = { ...row } as Partial<ServiceHealthResultRow> & { timestamp: string }
    delete (partial as any).realtime_logs
    const result = extractServiceRows([partial as ServiceHealthResultRow], 'realtime')
    expect(result[0]).toEqual({
      timestamp: row.timestamp,
      ok_count: 0,
      warning_count: 0,
      error_count: 0,
    })
  })
})
