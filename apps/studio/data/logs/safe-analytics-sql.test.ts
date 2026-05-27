import { describe, expect, it } from 'vitest'

import { executeAnalyticsSql } from './execute-analytics-sql'
import {
  analyticsLiteral,
  bqDottedIdent,
  bqIdent,
  clickhouseDottedIdent,
  clickhouseIdent,
  keyword,
  safeSql,
} from './safe-analytics-sql'

describe('keyword', () => {
  it('returns the matching SafeLogSqlFragment from the allow-list', () => {
    expect(keyword('AND', [safeSql`AND`, safeSql`OR`])).toBe('AND')
    expect(keyword('=', [safeSql`=`, safeSql`!=`, safeSql`LIKE`])).toBe('=')
  })

  it('throws when value is not in the allow-list', () => {
    expect(() => keyword('DROP', [safeSql`AND`, safeSql`OR`])).toThrow(
      '"DROP" is not in the allowed list'
    )
  })

  it('is case-insensitive and returns the allow-listed fragment', () => {
    // 'and' (lowercase) matches 'AND' in the allow-list; the returned value
    // is the allow-listed fragment 'AND', not the raw input 'and'.
    expect(keyword('and', [safeSql`AND`, safeSql`OR`])).toBe('AND')
    expect(keyword('OR', [safeSql`and`, safeSql`or`])).toBe('or')
  })

  it('throws for an empty allow-list', () => {
    expect(() => keyword('AND', [])).toThrow()
  })
})

describe('bqDottedIdent', () => {
  it('wraps a single-segment identifier in backticks', () => {
    expect(bqDottedIdent('status')).toBe('`status`')
  })

  it('wraps the entire two-part dotted path in a single pair of backticks', () => {
    expect(bqDottedIdent('request.method')).toBe('`request.method`')
  })

  it('wraps the entire three-part dotted path in a single pair of backticks', () => {
    expect(bqDottedIdent('a.b.c')).toBe('`a.b.c`')
  })

  it('throws for an empty string', () => {
    expect(() => bqDottedIdent('')).toThrow('invalid BigQuery dotted identifier')
  })

  it('throws when a segment contains disallowed characters', () => {
    expect(() => bqDottedIdent('request.method; DROP TABLE')).toThrow(
      'invalid BigQuery dotted identifier'
    )
  })

  it('throws for an empty segment (double dot)', () => {
    expect(() => bqDottedIdent('a..b')).toThrow('invalid BigQuery dotted identifier')
  })

  it('produces the same result as bqIdent for a single segment', () => {
    expect(bqDottedIdent('col')).toBe(bqIdent('col'))
  })
})

describe('clickhouseDottedIdent', () => {
  it('quotes a single-segment identifier with double-quotes', () => {
    expect(clickhouseDottedIdent('status')).toBe('"status"')
  })

  it('quotes each segment of a two-part dotted identifier', () => {
    expect(clickhouseDottedIdent('request.method')).toBe('"request"."method"')
  })

  it('quotes each segment of a three-part dotted identifier', () => {
    expect(clickhouseDottedIdent('a.b.c')).toBe('"a"."b"."c"')
  })

  it('throws for an empty string', () => {
    expect(() => clickhouseDottedIdent('')).toThrow('invalid ClickHouse dotted identifier')
  })

  it('throws when a segment contains disallowed characters', () => {
    expect(() => clickhouseDottedIdent('col OR 1=1')).toThrow(
      'invalid ClickHouse dotted identifier'
    )
  })

  it('produces the same result as clickhouseIdent for a single segment', () => {
    expect(clickhouseDottedIdent('col')).toBe(clickhouseIdent('col'))
  })
})

describe('executeAnalyticsSql — compile-time boundary', () => {
  it('accepts a SafeLogSqlFragment', () => {
    const sql = safeSql`SELECT 1`
    // SafeLogSqlFragment is accepted — no type error expected here.
    const fn = () =>
      executeAnalyticsSql({
        projectRef: 'test-ref',
        endpoint: '/platform/projects/{ref}/analytics/endpoints/logs.all',
        sql,
        iso_timestamp_start: '2024-01-01T00:00:00Z',
        iso_timestamp_end: '2024-01-02T00:00:00Z',
      })
    expect(fn).toBeDefined()
  })

  it('rejects a plain string at the type level', () => {
    const plainSql: string = 'SELECT 1'
    // Never invoked — compile-time check only. The function is defined so
    // TypeScript type-checks the body, but no network request is made.
    const _check = () =>
      executeAnalyticsSql({
        projectRef: 'test-ref',
        endpoint: '/platform/projects/{ref}/analytics/endpoints/logs.all',
        // @ts-expect-error — plain string must not be assignable to SafeLogSqlFragment
        sql: plainSql,
        iso_timestamp_start: '2024-01-01T00:00:00Z',
        iso_timestamp_end: '2024-01-02T00:00:00Z',
      })
    expect(_check).toBeDefined()
  })

  it('rejects rawSql output cast back to string at the type level', () => {
    const fragment = safeSql`SELECT 1`
    const asString: string = fragment as string
    // Never invoked — compile-time check only.
    const _check = () =>
      executeAnalyticsSql({
        projectRef: 'test-ref',
        endpoint: '/platform/projects/{ref}/analytics/endpoints/logs.all',
        // @ts-expect-error — widened-to-string value must not be assignable to SafeLogSqlFragment
        sql: asString,
        iso_timestamp_start: '2024-01-01T00:00:00Z',
        iso_timestamp_end: '2024-01-02T00:00:00Z',
      })
    expect(_check).toBeDefined()
  })
})

describe('safeSql template tag — existing helpers still compose', () => {
  it('analyticsLiteral output is composable via safeSql', () => {
    const val = analyticsLiteral('hello')
    const query = safeSql`SELECT ${val}`
    expect(query).toBe("SELECT 'hello'")
  })

  it('bqDottedIdent output is composable via safeSql', () => {
    const col = bqDottedIdent('request.method')
    const query = safeSql`SELECT ${col} FROM logs`
    expect(query).toBe('SELECT `request.method` FROM logs')
  })

  it('clickhouseDottedIdent output is composable via safeSql', () => {
    const col = clickhouseDottedIdent('request.method')
    const query = safeSql`SELECT ${col} FROM logs`
    expect(query).toBe('SELECT "request"."method" FROM logs')
  })

  it('keyword output is composable via safeSql', () => {
    const op = keyword('AND', [safeSql`AND`, safeSql`OR`])
    const query = safeSql`WHERE a = 1 ${op} b = 2`
    expect(query).toBe('WHERE a = 1 AND b = 2')
  })
})
