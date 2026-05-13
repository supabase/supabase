import { describe, expect, it } from 'vitest'

import {
  getFacetCountQuery,
  getLogsChartQuery,
  getLogsCountQuery,
  getUnifiedLogsQuery,
} from './UnifiedLogs.queries'

const baseSearch = {
  date: [new Date('2026-05-08T09:00:00Z'), new Date('2026-05-08T10:00:00Z')],
} as any

describe('UnifiedLogs.queries (OTEL flat)', () => {
  describe('getUnifiedLogsQuery', () => {
    it('defaults to postgres + postgrest log types when none specified', () => {
      const sql = getUnifiedLogsQuery(baseSearch)
      expect(sql).toContain(`source = 'postgres_logs'`)
      // postgrest = edge_logs filtered by /rest/ path
      expect(sql).toContain(
        `source = 'edge_logs' AND log_attributes['request.path'] LIKE '%/rest/%'`
      )
    })

    it('routes the `edge` log type to edge_logs without /rest/ or /storage/ paths', () => {
      const sql = getUnifiedLogsQuery({ ...baseSearch, log_type: ['edge'] } as any)
      expect(sql).toContain(`NOT LIKE '%/rest/%'`)
      expect(sql).toContain(`NOT LIKE '%/storage/%'`)
      const where = sql.split(/\bWHERE\b/)[1] ?? ''
      expect(where).not.toContain(`source = 'postgres_logs'`)
    })

    it('routes the `storage` log type to edge_logs filtered by /storage/', () => {
      const sql = getUnifiedLogsQuery({ ...baseSearch, log_type: ['storage'] } as any)
      expect(sql).toContain(
        `source = 'edge_logs' AND log_attributes['request.path'] LIKE '%/storage/%'`
      )
    })

    it('escapes single quotes in filter values to prevent SQL injection', () => {
      const sql = getUnifiedLogsQuery({
        ...baseSearch,
        method: [`G'ET`],
        pathname: `/customers'; DROP TABLE logs --`,
      } as any)
      // Single quotes are doubled (SQL-standard escaping) by pg-meta's
      // literal(); a raw single quote from user input never closes its
      // string literal early.
      expect(sql).toContain(`'G''ET'`)
      expect(sql).toContain(`%/customers''; DROP TABLE logs --%`)
    })

    it('translates method/status/pathname filters to log_attributes predicates', () => {
      const sql = getUnifiedLogsQuery({
        ...baseSearch,
        method: ['GET'],
        status: ['401'],
        pathname: '/customers',
      } as any)
      expect(sql).toContain(`log_attributes['request.method'] IN ('GET')`)
      expect(sql).toContain(`log_attributes['response.status_code'] IN ('401')`)
      expect(sql).toContain(`log_attributes['request.path'] LIKE '%/customers%'`)
    })

    it('does not emit subqueries or CTEs (rejected by the OTEL endpoint)', () => {
      const sql = getUnifiedLogsQuery(baseSearch)
      expect(sql).not.toMatch(/WITH\s+\w+\s+AS\s*\(/i)
      expect(sql).not.toMatch(/FROM\s*\(\s*SELECT/i)
      // Single SELECT * FROM logs (not "SELECT *" wildcard usage either).
      expect(sql).not.toMatch(/SELECT\s+\*/)
    })
  })

  describe('getLogsCountQuery', () => {
    it('emits one UNION ALL branch per log_type bucket and per level', () => {
      const sql = getLogsCountQuery(baseSearch)
      // Per-log-type counts
      for (const lt of ['edge', 'postgrest', 'storage', 'postgres', 'edge function', 'auth']) {
        expect(sql).toContain(`'${lt}'`)
      }
      // Per-level counts
      for (const lvl of ['success', 'warning', 'error']) {
        expect(sql).toContain(`'${lvl}'`)
      }
      // Bundled via UNION ALL — multiple occurrences expected
      expect(sql.match(/UNION ALL/g)?.length ?? 0).toBeGreaterThan(5)
    })

    it('honours an active log_type filter in the total count branch', () => {
      const sql = getLogsCountQuery({ ...baseSearch, log_type: ['edge'] } as any)
      // The first branch is the total — its WHERE must include the edge
      // log_type predicate, otherwise the total badge would over-count
      // when a log_type filter is active.
      const totalBranch = sql.split(/\bUNION ALL\b/)[0]
      expect(totalBranch).toContain(`'total'`)
      expect(totalBranch).toContain(`source = 'edge_logs'`)
      expect(totalBranch).not.toContain(`source = 'postgres_logs'`)
    })
  })

  describe('getLogsChartQuery', () => {
    it('uses minute bucketing for short ranges', () => {
      const sql = getLogsChartQuery(baseSearch)
      expect(sql).toContain('toStartOfMinute(timestamp)')
    })

    it('uses hour bucketing for ranges spanning more than 12 hours', () => {
      const sql = getLogsChartQuery({
        ...baseSearch,
        date: [new Date('2026-05-08T00:00:00Z'), new Date('2026-05-08T18:00:00Z')],
      } as any)
      expect(sql).toContain('toStartOfHour(timestamp)')
    })

    it('uses day bucketing for ranges spanning more than 2 days', () => {
      const sql = getLogsChartQuery({
        ...baseSearch,
        date: [new Date('2026-05-01T00:00:00Z'), new Date('2026-05-08T00:00:00Z')],
      } as any)
      expect(sql).toContain('toStartOfDay(timestamp)')
    })
  })

  describe('getFacetCountQuery', () => {
    it('groups by the requested facet and excludes that facet from the WHERE filters', () => {
      const sql = getFacetCountQuery({
        search: { ...baseSearch, method: ['GET'], status: ['200'] } as any,
        facet: 'method',
      })
      // Filtered facet is excluded from WHERE; other filters still applied
      expect(sql).not.toContain(`log_attributes['request.method'] IN ('GET')`)
      expect(sql).toContain(`log_attributes['response.status_code'] IN ('200')`)
      expect(sql).toContain('GROUP BY value')
      expect(sql).toContain('LIMIT 20')
    })
  })
})
