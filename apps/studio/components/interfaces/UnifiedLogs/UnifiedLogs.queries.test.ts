import { describe, expect, it } from 'vitest'

import {
  getFacetCountQuery,
  getLogsChartQuery,
  getLogsCountQuery,
  getUnifiedLogsQuery,
  isUserFilterUnreachable,
} from './UnifiedLogs.queries'
import {
  getLogsChartQuery as getLogsChartQueryBQ,
  getLogsCountQuery as getLogsCountQueryBQ,
  getUnifiedLogsQuery as getUnifiedLogsQueryBQ,
} from './UnifiedLogs.queries.bq'

const baseSearch = {
  date: [new Date('2026-05-08T09:00:00Z'), new Date('2026-05-08T10:00:00Z')],
} as any

// Helper: build a search with extra `filter` URL entries on top of the base.
const withFilters = (...entries: string[]) => ({ ...baseSearch, filter: entries }) as any

// Helper: build a search with the cross-cutting `user` filter set, plus optional `filter` entries.
const withUser = (user: string, ...entries: string[]) =>
  ({ ...baseSearch, user, filter: entries }) as any

describe('UnifiedLogs.queries (OTEL flat)', () => {
  describe('getUnifiedLogsQuery', () => {
    it('includes supported sources when no log types are selected', () => {
      const where = getUnifiedLogsQuery(baseSearch).split(/\bWHERE\b/)[1]
      expect(where).toContain('source IN (')
      expect(where).toContain("'function_edge_logs'")
      expect(where).not.toContain("'function_logs'")
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

    it('routes the `compute` log type to every worker OTEL stream', () => {
      const sql = getUnifiedLogsQuery(withFilters('log_type:eq:compute'))
      const where = sql.split(/\bWHERE\b/)[1] ?? ''
      expect(where).toContain(
        `log_attributes['source'] IN ('worker_ingress_logs','worker_guest_logs','worker_api_logs')`
      )
      expect(where).not.toContain(`source = 'compute'`)
    })

    it('classifies every worker OTEL stream as compute in the projected log type', () => {
      const sql = getUnifiedLogsQuery(baseSearch)
      expect(sql).toContain(
        `WHEN log_attributes['source'] IN ('worker_ingress_logs','worker_guest_logs','worker_api_logs') THEN 'compute'`
      )
    })

    it('excludes every worker OTEL stream when the compute log type is negated', () => {
      const sql = getUnifiedLogsQuery(withFilters('log_type:neq:compute'))
      const where = sql.split(/\bWHERE\b/)[1] ?? ''
      expect(where).toContain(
        `NOT (log_attributes['source'] IN ('worker_ingress_logs','worker_guest_logs','worker_api_logs'))`
      )
    })

    it('projects only Compute fields that exist on worker logs', () => {
      const sql = getUnifiedLogsQuery(withFilters('log_type:eq:compute'))
      const workerCondition =
        "log_attributes['source'] IN ('worker_ingress_logs','worker_guest_logs','worker_api_logs')"

      expect(sql).toContain(`WHEN ${workerCondition} THEN null`)
      expect(sql).toContain(
        `if(${workerCondition}, null, if(source = 'storage_logs', log_attributes['req.method'], log_attributes['request.method']))`
      )
      expect(sql).toContain(
        `if(${workerCondition}, null, if(source = 'storage_logs', log_attributes['req.url'], log_attributes['request.path']))`
      )
      expect(sql).toContain(`if(${workerCondition}, log_attributes, map()) AS metadata`)
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
      // Method/pathname filters wrap the if() that picks the gateway or
      // storage-service attribute key so storage rows match too.
      expect(sql).toContain(
        `(if(source = 'storage_logs', log_attributes['req.method'], log_attributes['request.method'])) IN ('GET')`
      )
      // Status filter wraps the CASE that picks HTTP code or Postgres SQLSTATE
      // so e.g. '00000' matches postgres success rows.
      expect(sql).toContain(`log_attributes['parsed.sql_state_code']`)
      expect(sql).toMatch(/END\) IN \('401'\)/)
      expect(sql).toContain(
        `(if(source = 'storage_logs', log_attributes['req.url'], log_attributes['request.path'])) LIKE '%/customers%'`
      )
    })

    it('flips IN to NOT IN when the operator is `<>`', () => {
      const sql = getUnifiedLogsQuery(withFilters('method:neq:GET', 'status:neq:401'))
      expect(sql).toContain(
        `(if(source = 'storage_logs', log_attributes['req.method'], log_attributes['request.method'])) NOT IN ('GET')`
      )
      expect(sql).toMatch(/END\) NOT IN \('401'\)/)
    })

    it('reads the HTTP status from log_attributes[status] for auth rows', () => {
      // Auth-service logs expose their status under `status`, not the gateway's
      // `response.status_code`, so without this their 4xx/5xx classify as
      // success and the severity filter returns nothing.
      const sql = getUnifiedLogsQuery(withFilters('log_type:eq:auth'))
      expect(sql).toContain(`WHEN source = 'auth_logs' THEN log_attributes['status']`)
    })

    it('reads the HTTP status from log_attributes[res.statusCode] for storage rows', () => {
      // Storage-service logs expose their status under `res.statusCode`, not the
      // gateway's `response.status_code`.
      const sql = getUnifiedLogsQuery(withFilters('log_type:eq:storage'))
      expect(sql).toContain(`WHEN source = 'storage_logs' THEN log_attributes['res.statusCode']`)
    })

    it('reads the method/pathname from log_attributes[req.method/req.url] for storage rows', () => {
      // Storage-service logs expose method/path under `req.method` / `req.url`,
      // not the gateway's `request.method` / `request.path`.
      const sql = getUnifiedLogsQuery(withFilters('log_type:eq:storage'))
      expect(sql).toContain(
        `if(source = 'storage_logs', log_attributes['req.method'], log_attributes['request.method'])`
      )
      expect(sql).toContain(
        `if(source = 'storage_logs', log_attributes['req.url'], log_attributes['request.path'])`
      )
    })

    it('flips LIKE to NOT LIKE when the pathname/host operator is `<>`', () => {
      const sql = getUnifiedLogsQuery(withFilters('pathname:neq:/health', 'host:neq:cdn.foo'))
      expect(sql).toContain(
        `(if(source = 'storage_logs', log_attributes['req.url'], log_attributes['request.path'])) NOT LIKE '%/health%'`
      )
      expect(sql).toContain(`log_attributes['request.url'] NOT LIKE '%cdn.foo%'`)
    })

    it('emits ILIKE for pathname `~~*`, case-insensitive unlike the `=` LIKE behavior', () => {
      const sql = getUnifiedLogsQuery(withFilters('pathname:ilike:Customers'))
      expect(sql).toContain(
        `(if(source = 'storage_logs', log_attributes['req.url'], log_attributes['request.path'])) ILIKE '%Customers%'`
      )
    })

    it('emits NOT ILIKE for pathname `!~~*` so rows matching the term are excluded', () => {
      const sql = getUnifiedLogsQuery(withFilters('pathname:notilike:health'))
      expect(sql).toContain(
        `(if(source = 'storage_logs', log_attributes['req.url'], log_attributes['request.path'])) NOT ILIKE '%health%'`
      )
    })

    it('joins multiple pathname NOT ILIKE values with AND (row must match none)', () => {
      const sql = getUnifiedLogsQuery(
        withFilters('pathname:notilike:health', 'pathname:notilike:metrics')
      )
      const pathExpr = `(if(source = 'storage_logs', log_attributes['req.url'], log_attributes['request.path']))`
      expect(sql).toContain(
        `${pathExpr} NOT ILIKE '%health%' AND ${pathExpr} NOT ILIKE '%metrics%'`
      )
    })

    it('passes through user-supplied `%` wildcards on pathname ILIKE without double-wrapping', () => {
      const sql = getUnifiedLogsQuery(withFilters('pathname:ilike:foo%'))
      expect(sql).toContain(
        `(if(source = 'storage_logs', log_attributes['req.url'], log_attributes['request.path'])) ILIKE 'foo%'`
      )
      expect(sql).not.toContain(`'%foo%%'`)
    })

    it('passes through user-supplied `_` wildcards on pathname ILIKE without wrapping', () => {
      const sql = getUnifiedLogsQuery(withFilters('pathname:ilike:fo_bar'))
      expect(sql).toContain(
        `(if(source = 'storage_logs', log_attributes['req.url'], log_attributes['request.path'])) ILIKE 'fo_bar'`
      )
      expect(sql).not.toContain(`'%fo_bar%'`)
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

    it('passes through user-supplied `_` wildcards on event_message ILIKE without wrapping', () => {
      const sql = getUnifiedLogsQuery(withFilters('event_message:ilike:foo_bar'))
      expect(sql).toContain(`event_message ILIKE 'foo_bar'`)
      expect(sql).not.toContain(`'%foo_bar%'`)
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
      expect(sql).toContain(`WHEN source = 'auth_logs' THEN log_attributes['status']`)
    })

    it('does not classify Compute rows into a severity bucket', () => {
      const sql = getLogsChartQuery(withFilters('log_type:eq:compute'))
      const workerCondition =
        "log_attributes['source'] IN ('worker_ingress_logs','worker_guest_logs','worker_api_logs')"

      expect(sql).toContain(`WHEN ${workerCondition} THEN null`)
      expect(sql).not.toContain(`WHEN ${workerCondition} THEN 'success'`)
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

  describe('user filter', () => {
    it('restricts to auth_logs/edge_logs when filtering by user', () => {
      const sql = getUnifiedLogsQuery(withUser('user-123'))
      const where = sql.split(/\bWHERE\b/)[1] ?? ''
      expect(where).toContain(
        `(source = 'auth_logs' AND log_attributes['auth_event.actor_id'] = 'user-123')`
      )
      expect(where).toContain(
        `(source = 'edge_logs' AND log_attributes['request.sb.jwt.authorization.payload.subject'] = 'user-123')`
      )
      expect(where).not.toContain(`(source = 'edge_logs') OR (source = 'postgres_logs')`)
    })

    it('does not restrict sources when the user filter is inactive', () => {
      const sql = getUnifiedLogsQuery(baseSearch)
      const where = sql.split(/\bWHERE\b/)[1] ?? ''
      expect(where).not.toContain(`auth_event.actor_id`)
    })

    it('ANDs an explicit non-attributable log_type filter with the user condition (edge case: always zero rows)', () => {
      // Locks in the exact shape `isUserFilterUnreachable` detects — `source = 'edge_logs'`
      // AND `(source = 'auth_logs' ...) OR (source = 'postgres_logs' ...)` can never both hold.
      const sql = getUnifiedLogsQuery(withUser('user-123', 'log_type:eq:edge'))
      const where = sql.split(/\bWHERE\b/)[1] ?? ''
      expect(where).toContain(`source = 'edge_logs'`)
      expect(where).toContain(`log_attributes['auth_event.actor_id'] = 'user-123'`)
    })
  })

  describe('isUserFilterUnreachable', () => {
    it('is false when no user filter is active', () => {
      expect(isUserFilterUnreachable(withFilters('log_type:eq:edge'))).toBe(false)
    })

    it('is false when the user filter is active with no explicit log_type filter', () => {
      expect(isUserFilterUnreachable(withUser('user-123'))).toBe(false)
    })

    it('is false when the explicit log_type filter includes an attributable source (auth)', () => {
      expect(isUserFilterUnreachable(withUser('user-123', 'log_type:eq:auth'))).toBe(false)
    })

    it('is false when the explicit log_type filter includes an attributable source (edge)', () => {
      expect(isUserFilterUnreachable(withUser('user-123', 'log_type:eq:edge'))).toBe(false)
    })

    it('is false when at least one of several selected log types is attributable', () => {
      expect(
        isUserFilterUnreachable(withUser('user-123', 'log_type:eq:edge', 'log_type:eq:auth'))
      ).toBe(false)
    })

    it('is true when the explicit log_type filter restricts to a single non-attributable source', () => {
      expect(isUserFilterUnreachable(withUser('user-123', 'log_type:eq:storage'))).toBe(true)
    })

    it('is true when every selected log type is non-attributable', () => {
      expect(
        isUserFilterUnreachable(withUser('user-123', 'log_type:eq:realtime', 'log_type:eq:storage'))
      ).toBe(true)
    })

    it('(neq) is false when excluding a non-attributable source — the attributable sources remain eligible', () => {
      expect(isUserFilterUnreachable(withUser('user-123', 'log_type:neq:edge'))).toBe(false)
    })

    it('(neq) is true only when both attributable sources are excluded', () => {
      expect(
        isUserFilterUnreachable(withUser('user-123', 'log_type:neq:auth', 'log_type:neq:edge'))
      ).toBe(true)
    })
  })

  describe('analyticsLiteral escaping', () => {
    it('emits ClickHouse / BigQuery escape syntax (doubled `\\\\`, no `E` prefix)', () => {
      // pg-meta's literal() would emit `E'a\\b'` for `a\b` — the `E` prefix is
      // Postgres-only and rejected by both analytics engines. analyticsLiteral
      // doubles the backslash inside plain `'…'` delimiters instead.
      const sql = getUnifiedLogsQuery(withFilters('method:eq:a\\b'))
      expect(sql).toContain(
        `(if(source = 'storage_logs', log_attributes['req.method'], log_attributes['request.method'])) IN ('a\\\\b')`
      )
      expect(sql).not.toContain(`E'a`)
    })

    it("escapes single quotes by doubling them ('' rather than \\')", () => {
      const sql = getUnifiedLogsQuery(withFilters("method:eq:GET' OR '1'='1"))
      expect(sql).toContain(
        `(if(source = 'storage_logs', log_attributes['req.method'], log_attributes['request.method'])) IN ('GET'' OR ''1''=''1')`
      )
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
    const where = sql.split('FROM unified_logs')[1]
    expect(where).not.toContain('IS NOT NULL')
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

  it('emulates ILIKE with LOWER()/LOWER() for pathname `~~*`', () => {
    const sql = getUnifiedLogsQueryBQ(withFilters('pathname:ilike:Customers'))
    expect(sql).toContain("LOWER(`pathname`) LIKE LOWER('%Customers%')")
    expect(sql).not.toMatch(/\bILIKE\b/)
  })

  it('emulates NOT ILIKE with LOWER()/NOT LIKE/LOWER() for pathname `!~~*`', () => {
    const sql = getUnifiedLogsQueryBQ(withFilters('pathname:notilike:health'))
    expect(sql).toContain("LOWER(`pathname`) NOT LIKE LOWER('%health%')")
    expect(sql).not.toMatch(/\bILIKE\b/)
  })

  it('passes through user-supplied `%` wildcards on pathname ILIKE without double-wrapping', () => {
    const sql = getUnifiedLogsQueryBQ(withFilters('pathname:ilike:foo%'))
    expect(sql).toContain("LOWER(`pathname`) LIKE LOWER('foo%')")
    expect(sql).not.toContain("LOWER('%foo%%')")
  })

  it('passes through user-supplied `_` wildcards on pathname ILIKE without wrapping', () => {
    const sql = getUnifiedLogsQueryBQ(withFilters('pathname:ilike:fo_bar'))
    expect(sql).toContain("LOWER(`pathname`) LIKE LOWER('fo_bar')")
    expect(sql).not.toContain("LOWER('%fo_bar%')")
  })
})

describe('pathname ILIKE prefix matching (cross-builder)', () => {
  // Both query builders must treat an explicit `%` the same way — a value
  // like `foo%` is a prefix match, not a "contains" search with a stray
  // trailing wildcard — otherwise switching the `otelUnifiedLogs` flag would
  // silently change what a saved/shared filter matches.
  it('produces equivalent prefix-matching patterns for `pathname:ilike:foo%` on both backends', () => {
    const clickhouseSql = getUnifiedLogsQuery(withFilters('pathname:ilike:foo%'))
    const bqSql = getUnifiedLogsQueryBQ(withFilters('pathname:ilike:foo%'))

    expect(clickhouseSql).toContain(
      `(if(source = 'storage_logs', log_attributes['req.url'], log_attributes['request.path'])) ILIKE 'foo%'`
    )
    expect(bqSql).toContain("LOWER(`pathname`) LIKE LOWER('foo%')")

    // Neither backend should have double-wrapped the wildcard into a
    // "contains" pattern.
    expect(clickhouseSql).not.toContain(`'%foo%%'`)
    expect(bqSql).not.toContain("LOWER('%foo%%')")
  })
})

describe('unified logs without a log type filter', () => {
  const errorFilters = [['level:eq:error'], ['status:eq:500'], ['level:eq:error', 'status:eq:500']]

  describe.each([
    ['rows', getUnifiedLogsQuery],
    ['chart', getLogsChartQuery],
  ] as const)('ClickHouse %s', (_, buildQuery) => {
    it.each(errorFilters)('includes all sources with filters %j', (...filters) => {
      const search = withFilters(...filters)
      const where = buildQuery(search)
        .split(/\bWHERE\b/)[1]
        ?.split(/\bGROUP BY\b/)[0]
        .trim()
      const explicitWhere = buildQuery(withFilters('log_type:eq:edge function', ...filters))
        .split(/\bWHERE\b/)[1]
        ?.split(/\bGROUP BY\b/)[0]
        .trim()

      expect(where).not.toContain("(source = 'postgres_logs')")
      expect(where).not.toContain("(source = 'edge_logs')")
      expect(explicitWhere?.replace("((source = 'function_edge_logs')) AND ", '')).toBe(where)
      if (filters.includes('level:eq:error')) expect(where).toContain("IN ('error')")
      if (filters.includes('status:eq:500')) expect(where).toContain("IN ('500')")
    })
  })

  it('uses the same sources for ClickHouse rows, chart, and sidebar scans', () => {
    const search = withFilters('level:eq:error', 'status:eq:500')
    const rowWhere = getUnifiedLogsQuery(search)
      .split(/\bWHERE\b/)[1]
      .trim()
    const countScans = getLogsCountQuery(search).split(/\bUNION ALL\b/)
    const totalScan = countScans.find((scan) => scan.includes("facet = 'total'")) ?? ''
    const totalWhere = totalScan
      .split(/\bWHERE\b/)[1]
      ?.split(/\bGROUP BY\b/)[0]
      .trim()

    expect(totalWhere).toBe(rowWhere)
    expect(getLogsChartQuery(search)).toContain(rowWhere)
    expect(getFacetCountQuery({ search, facet: 'log_type' })).toContain(rowWhere)
    for (const scan of countScans) {
      const where = scan.split(/\bWHERE\b/)[1]?.split(/\bGROUP BY\b/)[0]
      expect(where).not.toContain("(source = 'postgres_logs')")
      expect(where).not.toContain("(source = 'edge_logs')")
    }
  })

  describe.each([
    ['rows', getUnifiedLogsQueryBQ],
    ['chart', getLogsChartQueryBQ],
    ['sidebar', getLogsCountQueryBQ],
  ] as const)('BigQuery %s', (_, buildQuery) => {
    it('includes Edge Function errors without requiring a log type selection', () => {
      const sql = buildQuery(withFilters('level:eq:error', 'status:eq:500'))
      expect(sql).toContain('from function_edge_logs as fel')
      expect(sql).toContain("WHEN fel_response.status_code >= 500 THEN 'error'")
      expect(sql).toContain("`level` IN ('error')")
      expect(sql).toContain("`status` IN ('500')")
    })

    it('preserves an explicit log type restriction', () => {
      const sql = buildQuery(withFilters('log_type:eq:postgres', 'level:eq:error'))
      expect(sql).toContain('from postgres_logs as pgl')
      expect(sql).not.toContain('from function_edge_logs as fel')
    })
  })

  it('excludes explicitly deselected BigQuery log types while retaining other sources', () => {
    const sql = getUnifiedLogsQueryBQ(withFilters('log_type:neq:edge function', 'level:eq:error'))
    expect(sql).not.toContain('from function_edge_logs as fel')
    expect(sql).toContain('from postgres_logs as pgl')
    expect(sql).toContain('from auth_logs as al')
    expect(sql).toContain("`log_type` NOT IN ('edge function')")
  })
})

describe('unified logs source availability', () => {
  it.each([
    { compute: false, multigres: false },
    { compute: true, multigres: false },
    { compute: false, multigres: true },
    { compute: true, multigres: true },
  ])('applies source visibility %j to every ClickHouse scan', (logTypeVisibility) => {
    const search = {
      ...withFilters('level:eq:error', 'status:eq:500'),
      logTypeVisibility,
    }
    const queries = [
      getUnifiedLogsQuery(search),
      getLogsChartQuery(search),
      getLogsCountQuery(search),
      getFacetCountQuery({ search, facet: 'log_type' }),
    ]
    for (const sql of queries) {
      for (const scan of sql.split(/\bUNION ALL\b/)) {
        const universe = scan.split(/\bWHERE\b/)[1].split(' AND ')[0]
        expect(universe).toContain("'function_edge_logs'")
        expect(universe).not.toContain("'function_logs'")
        expect(universe.includes("'multigres_logs'")).toBe(logTypeVisibility.multigres)
        expect(universe.includes("log_attributes['source'] IN")).toBe(logTypeVisibility.compute)
      }
    }
  })

  it('keeps disabled sources ineligible even with an explicit log type filter', () => {
    const search = {
      ...withFilters('log_type:eq:compute', 'log_type:eq:multigres'),
      logTypeVisibility: { compute: false, multigres: false },
    }
    const where = getUnifiedLogsQuery(search).split(/\bWHERE\b/)[1]
    const universe = where.split(' AND ')[0]
    expect(universe).toContain('source IN (')
    expect(universe).not.toContain("'multigres_logs'")
    expect(universe).not.toContain("log_attributes['source'] IN")
    expect(where).toContain("source = 'multigres_logs'")
  })

  it('requires a matched gateway request for BigQuery Auth row identity and timestamp', () => {
    const sql = getUnifiedLogsQueryBQ(withFilters('log_type:eq:auth'))
    expect(sql).toContain('el_in_al.id as id')
    expect(sql).toContain('el_in_al.timestamp as timestamp')
    expect(sql).toMatch(/inner join \(\s*edge_logs as el_in_al/)
    expect(sql).not.toMatch(/left join \(\s*edge_logs as el_in_al/)
  })
})
