import {
  acceptUntrustedSql as pgAcceptUntrustedSql,
  safeSql as pgSafeSql,
  untrustedSql as pgUntrustedSql,
} from '@supabase/pg-meta'
import { describe, expect, it } from 'vitest'

import { executeAnalyticsSql } from './execute-analytics-sql'
import {
  acceptUntrustedLogsSql,
  analyticsLiteral,
  keyword,
  quotedIdent,
  safeSql,
  untrustedLogSql,
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

describe('quotedIdent', () => {
  it('backtick-quotes a single-segment identifier', () => {
    expect(quotedIdent('status')).toBe('`status`')
  })

  it('backtick-quotes each segment of a two-part dotted path individually', () => {
    expect(quotedIdent('request.method')).toBe('`request`.`method`')
  })

  it('backtick-quotes each segment of a three-part dotted path individually', () => {
    expect(quotedIdent('a.b.c')).toBe('`a`.`b`.`c`')
  })

  it('throws for an empty string', () => {
    expect(() => quotedIdent('')).toThrow('invalid identifier')
  })

  it('throws when a segment contains disallowed characters', () => {
    expect(() => quotedIdent('request.method; DROP TABLE')).toThrow('invalid identifier')
  })

  it('throws for an empty segment (double dot)', () => {
    expect(() => quotedIdent('a..b')).toThrow('invalid identifier')
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

describe('untrusted logs SQL brands', () => {
  it('untrustedLogSql preserves the raw text', () => {
    expect(untrustedLogSql('SELECT 1 FROM logs')).toBe('SELECT 1 FROM logs')
  })

  it('acceptUntrustedLogsSql promotes untrusted text to a runnable fragment unchanged', () => {
    const untrusted = untrustedLogSql('SELECT 1 FROM logs')
    const safe = acceptUntrustedLogsSql(untrusted)
    expect(safe).toBe('SELECT 1 FROM logs')
  })

  it('a promoted logs fragment composes via safeSql', () => {
    const safe = acceptUntrustedLogsSql(untrustedLogSql('SELECT 1'))
    expect(safeSql`${safe}`).toBe('SELECT 1')
  })

  it('rejects an unbranded string at the acceptUntrustedLogsSql boundary', () => {
    const plain: string = 'SELECT 1'
    // @ts-expect-error — only UntrustedLogSqlFragment may be promoted
    const _check = () => acceptUntrustedLogsSql(plain)
    expect(_check).toBeDefined()
  })

  it('rejects Postgres-branded fragments at the logs boundary (brands are disjoint)', () => {
    // The logs boundary must not accept Postgres SQL, whether it is still untrusted or
    // already promoted.
    const pgUntrusted = pgUntrustedSql('SELECT 1')
    const pgSafe = pgAcceptUntrustedSql(pgSafeSql`SELECT 1`)
    const _check = () => [
      // @ts-expect-error — pg untrusted brand is not assignable to UntrustedLogSqlFragment
      acceptUntrustedLogsSql(pgUntrusted),
      // @ts-expect-error — pg safe brand is not assignable to UntrustedLogSqlFragment
      acceptUntrustedLogsSql(pgSafe),
    ]
    expect(_check).toBeDefined()
  })
})

describe('safeSql template tag — existing helpers still compose', () => {
  it('analyticsLiteral output is composable via safeSql', () => {
    const val = analyticsLiteral('hello')
    const query = safeSql`SELECT ${val}`
    expect(query).toBe("SELECT 'hello'")
  })

  it('quotedIdent output is composable via safeSql', () => {
    const col = quotedIdent('request.method')
    const query = safeSql`SELECT ${col} FROM logs`
    expect(query).toBe('SELECT `request`.`method` FROM logs')
  })

  it('keyword output is composable via safeSql', () => {
    const op = keyword('AND', [safeSql`AND`, safeSql`OR`])
    const query = safeSql`WHERE a = 1 ${op} b = 2`
    expect(query).toBe('WHERE a = 1 AND b = 2')
  })
})
