import { describe, expect, it } from 'vitest'

import { getTracedLogsQuery } from './UnifiedLogs.queries.traced'

const baseSearch = {
  date: [new Date('2026-05-08T09:00:00Z'), new Date('2026-05-08T10:00:00Z')],
} as any

const withFilters = (...entries: string[]) => ({ ...baseSearch, filter: entries }) as any

describe('getTracedLogsQuery', () => {
  it('scopes to edge/auth/storage sources regardless of any log_type filter', () => {
    const sql = getTracedLogsQuery(withFilters('log_type:eq:postgres'))
    const where = sql.split(/\bWHERE\b/)[1]?.split(/\bGROUP BY\b/)[0] ?? ''
    expect(where).toContain(`source IN ('edge_logs', 'auth_logs', 'storage_logs')`)
    // The `log_type:eq:postgres` filter is dropped entirely in traced mode — it
    // never contributes its own `source = 'postgres_logs'` WHERE condition.
    expect(where).not.toContain(`source = 'postgres_logs'`)
  })

  it('requires a non-empty request_id', () => {
    const sql = getTracedLogsQuery(baseSearch)
    expect(sql).toContain(`log_attributes['request_id'] != ''`)
  })

  it('groups by request_id and aggregates a count + representative fields', () => {
    const sql = getTracedLogsQuery(baseSearch)
    expect(sql).toContain(`log_attributes['request_id'] AS id`)
    expect(sql).toContain('min(timestamp) AS timestamp')
    expect(sql).toContain('count() AS log_count')
    expect(sql).toContain('GROUP BY id')
    expect(sql).toMatch(/argMin\([\s\S]*\) AS log_type/)
    expect(sql).toMatch(/argMin\([\s\S]*\) AS status/)
    expect(sql).toMatch(/argMin\([\s\S]*\) AS level/)
    expect(sql).toMatch(/argMin\(log_attributes\['request\.path'\][\s\S]*\) AS pathname/)
    expect(sql).toMatch(/argMin\(log_attributes\['request\.method'\][\s\S]*\) AS method/)
    expect(sql).toMatch(/argMin\(event_message[\s\S]*\) AS event_message/)
    expect(sql).toMatch(/argMin\([\s\S]*\) AS auth_user/)
  })

  it('prioritizes edge_logs, then storage_logs, then auth_logs as the representative row', () => {
    const sql = getTracedLogsQuery(baseSearch)
    expect(sql).toContain(
      `CASE source\n      WHEN 'edge_logs' THEN 0\n      WHEN 'storage_logs' THEN 1\n      ELSE 2\n    END`
    )
  })

  it('still applies non-log_type filters (e.g. level, method) on top of the source scope', () => {
    const sql = getTracedLogsQuery(withFilters('method:eq:GET'))
    expect(sql).toContain(`log_attributes['request.method'] IN ('GET')`)
  })

  it('does not emit subqueries or CTEs (rejected by the OTEL endpoint)', () => {
    const sql = getTracedLogsQuery(baseSearch)
    expect(sql).not.toMatch(/WITH\s+\w+\s+AS\s*\(/i)
    expect(sql).not.toMatch(/FROM\s*\(\s*SELECT/i)
    expect(sql).not.toMatch(/SELECT\s+\*/)
  })
})
