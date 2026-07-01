import { describe, expect, it } from 'vitest'

import {
  getFacetCountQuery,
  getLogsChartQuery,
  getLogsCountQuery,
  getUnifiedLogsQuery,
} from './UnifiedLogs.queries'
import { getUnifiedLogsQuery as getUnifiedLogsQueryBQ } from './UnifiedLogs.queries.bq'

const baseSearch = {
  date: [new Date('2026-05-08T09:00:00Z'), new Date('2026-05-08T10:00:00Z')],
} as any

// Helper: build a search with extra `filter` URL entries on top of the base.
const withFilters = (...entries: string[]) => ({ ...baseSearch, filter: entries }) as any

describe('UnifiedLogs.queries (OTEL flat)', () => {
  describe('getUnifiedLogsQuery', () => {
    it('defaults to postgres + edge log types when none specified', () => {
      const sql = getUnifiedLogsQuery(baseSearch)
      const where = sql.split(/\bWHERE\b/)[1] ?? ''
      expect(where).toContain(`source = 'postgres_logs'`)
      expect(where).toContain(`source = 'edge_logs'`)
      expect(where).not.toContain(`source = 'postgrest_logs'`)
    })

    it('routes the `postgrest` log type solely to postgrest_logs (mutually exclusive from edge_logs)', () => {
      const sql = getUnifiedLogsQuery(withFilters('log_type:eq:postgrest'))
      const where = sql.split(/\bWHERE\b/)[1] ?? ''
      expect(where).toContain(`source = 'postgrest_logs'`)
      expect(where).not.toContain(`source = 'edge_logs'`)
      expect(where).not.toContain(`log_attributes['request.path'] LIKE '%/rest/%'`)
    })

    it('routes the `storage` log type solely to storage_logs (mutually exclusive from edge_logs)', () => {
      const sql = getUnifiedLogsQuery(withFilters('log_type:eq:storage'))
      const where = sql.split(/\bWHERE\b/)[1] ?? ''
      expect(where).toContain(`source = 'storage_logs'`)
      expect(where).not.toContain(`source = 'edge_logs'`)
      expect(where).not.toContain(`log_attributes['request.path'] LIKE '%/storage/%'`)
    })

    it('escapes single quotes in filter values to prevent SQL injection', () => {
      const sql = getUnifiedLogsQuery(
        withFilters(`method:eq:G'ET`, `pathname:eq:/customers'; DROP TABLE logs --`)
      )
      // Single quotes are doubled (SQL-standard escaping) by pg-meta's
      // literal(); a raw single quote from user input never closes its
      // string literal early.
      expect(sql).toContain(`'G''ET'`)
      expect(sql).toContain(`%/customers''; DROP TABLE logs --%`)
    })

    it('translates method/status/pathname filters to log_attributes predicates', () => {
      const sql = getUnifiedLogsQuery(
        withFilters('method:eq:GET', 'status:eq:401', 'pathname:eq:/customers')
      )
      expect(sql).toContain(`log_attributes['request.method'] IN ('GET')`)
      // Status filter wraps the CASE that picks HTTP code or Postgres SQLSTATE
      // so e.g. '00000' matches postgres success rows.
      expect(sql).toContain(`log_attributes['parsed.sql_state_code']`)
      expect(sql).toMatch(/END\) IN \('401'\)/)
      expect(sql).toContain(`log_attributes['request.path'] LIKE '%/customers%'`)
    })

    it('flips IN to NOT IN when the operator is `<>`', () => {
      const sql = getUnifiedLogsQuery(withFilters('method:neq:GET', 'status:neq:401'))
      expect(sql).toContain(`log_attributes['request.method'] NOT IN ('GET')`)
      expect(sql).toMatch(/END\) NOT IN \('401'\)/)
    })

    it('reads the HTTP status from log_attributes[status] for auth rows', () => {
      // Auth-service logs expose their status under `status`, not the gateway's
      // `response.status_code`, so without this their 4xx/5xx classify as
      // success and the severity filter returns nothing.
      const sql = getUnifiedLogsQuery(withFilters('log_type:eq:auth'))
      expect(sql).toContain(
        `if(source = 'auth_logs', log_attributes['status'], log_attributes['response.status_code'])`
      )
    })

    it('flips LIKE to NOT LIKE when the pathname/host operator is `<>`', () => {
      const sql = getUnifiedLogsQuery(withFilters('pathname:neq:/health', 'host:neq:cdn.foo'))
      expect(sql).toContain(`log_attributes['request.path'] NOT LIKE '%/health%'`)
      expect(sql).toContain(`log_attributes['request.url'] NOT LIKE '%cdn.foo%'`)
    })

    it('emits ILIKE with auto-wrapped `%…%` for event_message `~~*`', () => {
      const sql = getUnifiedLogsQuery(withFilters('event_message:ilike:Permission Denied'))
      expect(sql).toContain(`event_message ILIKE '%Permission Denied%'`)
    })

    it('emits NOT ILIKE for event_message `!~~*` so rows containing the term are excluded', () => {
      const sql = getUnifiedLogsQuery(withFilters('event_message:notilike:cron'))
      expect(sql).toContain(`event_message NOT ILIKE '%cron%'`)
    })

    it('joins multiple NOT ILIKE values with AND (row must contain none)', () => {
      const sql = getUnifiedLogsQuery(
        withFilters('event_message:notilike:cron', 'event_message:notilike:heartbeat')
      )
      expect(sql).toMatch(
        /event_message NOT ILIKE '%cron%' AND event_message NOT ILIKE '%heartbeat%'/
      )
    })

    it('passes through user-supplied `%` wildcards on event_message ILIKE without double-wrapping', () => {
      const sql = getUnifiedLogsQuery(withFilters('event_message:ilike:error%'))
      expect(sql).toContain(`event_message ILIKE 'error%'`)
      expect(sql).not.toContain(`'%error%%'`)
    })

    it('excludes connection log messages when show_connection_logs=false', () => {
      const sql = getUnifiedLogsQuery({ ...baseSearch, show_connection_logs: false } as any)
      expect(sql).toContain("source != 'postgres_logs'")
      expect(sql).toContain("event_message NOT LIKE 'connection received%'")
      expect(sql).toContain("event_message NOT LIKE 'connection authenticated%'")
      expect(sql).toContain("event_message NOT LIKE 'connection authorized%'")
    })

    it('includes connection log messages by default (show_connection_logs=true)', () => {
      const sql = getUnifiedLogsQuery({ ...baseSearch, show_connection_logs: true } as any)
      expect(sql).not.toContain("event_message NOT LIKE 'connection received%'")
    })

    it.each([
      ['edge_auth', '%/auth/%'],
      ['edge_storage', '%/storage/%'],
      ['edge_postgrest', '%/rest/%'],
    ] as const)('excludes %s-pathed requests from edge_logs when %s=false', (key, pathFilter) => {
      const sql = getUnifiedLogsQuery({ ...baseSearch, [key]: false } as any)
      expect(sql).toContain("source != 'edge_logs'")
      expect(sql).toContain(`log_attributes['request.path'] NOT LIKE '${pathFilter}'`)
    })

    it('does not filter edge_logs by service path by default (all edge_* toggles true)', () => {
      const sql = getUnifiedLogsQuery(baseSearch)
      expect(sql).not.toContain("log_attributes['request.path'] NOT LIKE '%/auth/%'")
      expect(sql).not.toContain("log_attributes['request.path'] NOT LIKE '%/storage/%'")
      expect(sql).not.toContain("log_attributes['request.path'] NOT LIKE '%/rest/%'")
    })

    it('leaves dedicated auth_logs/storage_logs/postgrest_logs rows untouched by the edge_* toggles', () => {
      // These toggles only hide traffic nested inside the `edge_logs` (API
      // Gateway) source — the dedicated sources are separate log types now
      // that log types are mutually exclusive, so they shouldn't be scoped by
      // a `source != 'edge_logs' OR ...` guard meant for gateway rows.
      const sql = getUnifiedLogsQuery({
        ...baseSearch,
        edge_auth: false,
        edge_storage: false,
        edge_postgrest: false,
      } as any)
      expect(sql).toContain(
        "(source != 'edge_logs' OR log_attributes['request.path'] NOT LIKE '%/auth/%')"
      )
      expect(sql).toContain(
        "(source != 'edge_logs' OR log_attributes['request.path'] NOT LIKE '%/storage/%')"
      )
      expect(sql).toContain(
        "(source != 'edge_logs' OR log_attributes['request.path'] NOT LIKE '%/rest/%')"
      )
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
    const whereOfBranchContaining = (sql: string, needle: string) => {
      const branch = sql.split(/\bUNION ALL\b/).find((b) => b.includes(needle)) ?? ''
      return branch.split(/\bWHERE\b/)[1]?.split(/\bGROUP BY\b/)[0] ?? ''
    }

    it('folds facets into single-pass arrayJoin scans with a total row', () => {
      const sql = getLogsCountQuery(baseSearch)
      expect(sql).toContain('arrayJoin([')
      expect(sql).toContain('multiIf(')
      expect(sql).toContain(`facet = 'total', 'all'`)
      for (const lt of ['postgrest', 'storage', 'postgres', 'edge function', 'auth']) {
        expect(sql).toContain(`'${lt}'`)
      }
      for (const lvl of ['success', 'warning', 'error']) {
        expect(sql).toContain(`'${lvl}'`)
      }
      expect(sql).toContain(`'pathname'`)
      expect(sql).toContain('LIMIT 20')
      // log_type + base + pathname = 3 scans
      expect(sql.match(/FROM logs/g)?.length ?? 0).toBeLessThanOrEqual(4)
    })

    it('honours an active log_type filter in the total count scan', () => {
      const sql = getLogsCountQuery(withFilters('log_type:eq:storage'))
      // Assert on the WHERE only: value expressions mention other sources inline.
      const totalWhere = whereOfBranchContaining(sql, `'all'`)
      expect(totalWhere).toContain(`source = 'storage_logs'`)
      expect(totalWhere).not.toContain(`source = 'edge_logs'`)
      expect(totalWhere).not.toContain(`source = 'postgres_logs'`)
    })

    it('gives the log_type facet its own scan that excludes the log_type filter', () => {
      const sql = getLogsCountQuery(withFilters('log_type:eq:postgrest'))
      const logTypeWhere = whereOfBranchContaining(sql, `'log_type'`)
      expect(logTypeWhere).not.toContain(`LIKE '%/rest/%'`)
    })

    it('applies the connection-logs filter to every count scan so badges match the list', () => {
      const sql = getLogsCountQuery({ ...baseSearch, show_connection_logs: false } as any)
      const scans = sql.split(/\bUNION ALL\b/)
      expect(scans.length).toBeGreaterThan(1)
      for (const scan of scans) {
        expect(scan).toContain("event_message NOT LIKE 'connection received%'")
      }
    })

    it('applies the edge_* service filters to every count scan so badges match the list', () => {
      const sql = getLogsCountQuery({ ...baseSearch, edge_postgrest: false } as any)
      const scans = sql.split(/\bUNION ALL\b/)
      expect(scans.length).toBeGreaterThan(1)
      for (const scan of scans) {
        expect(scan).toContain("log_attributes['request.path'] NOT LIKE '%/rest/%'")
      }
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

    it('buckets auth rows by their log_attributes[status] so 4xx/5xx are not counted as success', () => {
      const sql = getLogsChartQuery(baseSearch)
      expect(sql).toContain(
        `if(source = 'auth_logs', log_attributes['status'], log_attributes['response.status_code'])`
      )
    })
  })

  describe('getFacetCountQuery', () => {
    it('groups by the requested facet and excludes that facet from the WHERE filters', () => {
      const sql = getFacetCountQuery({
        search: withFilters('method:eq:GET', 'status:eq:200'),
        facet: 'method',
      })
      // Filtered facet is excluded from WHERE; other filters still applied.
      // For facet='method' the SELECT projection doesn't include STATUS_EXPR,
      // so SQLSTATE/IN ('200') must come from the WHERE clause.
      expect(sql).not.toContain(`log_attributes['request.method'] IN ('GET')`)
      expect(sql).toContain(`log_attributes['parsed.sql_state_code']`)
      expect(sql).toMatch(/END\) IN \('200'\)/)
      expect(sql).toContain('GROUP BY value')
      expect(sql).toContain('LIMIT 20')
    })
  })

  describe('analyticsLiteral escaping', () => {
    it('emits ClickHouse / BigQuery escape syntax (doubled `\\\\`, no `E` prefix)', () => {
      // pg-meta's literal() would emit `E'a\\b'` for `a\b` — the `E` prefix is
      // Postgres-only and rejected by both analytics engines. analyticsLiteral
      // doubles the backslash inside plain `'…'` delimiters instead.
      const sql = getUnifiedLogsQuery(withFilters('method:eq:a\\b'))
      expect(sql).toContain(`log_attributes['request.method'] IN ('a\\\\b')`)
      expect(sql).not.toContain(`E'a`)
    })

    it("escapes single quotes by doubling them ('' rather than \\')", () => {
      const sql = getUnifiedLogsQuery(withFilters("method:eq:GET' OR '1'='1"))
      expect(sql).toContain(`log_attributes['request.method'] IN ('GET'' OR ''1''=''1')`)
    })
  })
})

describe('UnifiedLogs.queries.bq', () => {
  it('backtick-quotes column identifiers (BigQuery syntax)', () => {
    const sql = getUnifiedLogsQueryBQ(withFilters('method:eq:GET'))
    expect(sql).toContain("`method` IN ('GET')")
  })

  it('rejects keys with non-identifier characters', () => {
    // A column like "foo; DROP TABLE x" fails the quotedIdent regex (the `;` is not
    // in `[A-Za-z_][A-Za-z0-9_]*`), so the predicate is dropped entirely.
    const sql = getUnifiedLogsQueryBQ(withFilters('foo; DROP TABLE x:eq:y'))
    expect(sql).not.toContain('DROP TABLE')
    expect(sql).not.toContain('foo;')
  })

  it('rejects keys containing spaces', () => {
    const sql = getUnifiedLogsQueryBQ(withFilters('level OR id IS NOT NULL:eq:anything'))
    expect(sql).not.toContain('IS NOT NULL')
    expect(sql).not.toContain('level OR')
  })

  it('escapes injection attempts in filter values via analyticsLiteral', () => {
    const sql = getUnifiedLogsQueryBQ(withFilters("method:eq:GET' OR '1'='1"))
    // The value is single-quote-escaped, so the synthetic OR can't break out
    // of the string literal.
    expect(sql).toContain("`method` IN ('GET'' OR ''1''=''1')")
    expect(sql).not.toMatch(/`method` IN \('GET' OR '1'='1'\)/)
  })

  it('emulates ILIKE with LOWER()/LOWER() since BigQuery has no ILIKE keyword', () => {
    const sql = getUnifiedLogsQueryBQ(withFilters('event_message:ilike:Permission Denied'))
    expect(sql).toContain("LOWER(`event_message`) LIKE LOWER('%Permission Denied%')")
    // Sanity check: never emit a raw ILIKE keyword for BQ.
    expect(sql).not.toMatch(/\bILIKE\b/)
  })

  it('emulates NOT ILIKE with LOWER()/NOT LIKE/LOWER() for event_message `!~~*`', () => {
    const sql = getUnifiedLogsQueryBQ(withFilters('event_message:notilike:cron'))
    expect(sql).toContain("LOWER(`event_message`) NOT LIKE LOWER('%cron%')")
    expect(sql).not.toMatch(/\bILIKE\b/)
  })
})
