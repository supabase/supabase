import { describe, expect, it } from 'vitest'

import { PRESET_CONFIG } from './Reports.constants'
import { Presets } from './Reports.types'

const queries = PRESET_CONFIG[Presets.QUERY_PERFORMANCE].queries as Record<
  string,
  { sql: (...args: any[]) => string }
>

const queryNames = [
  'mostFrequentlyInvoked',
  'mostTimeConsuming',
  'slowestExecutionTime',
  'unified',
  'slowQueriesCount',
  'queryMetrics',
] as const

describe('QUERY_PERFORMANCE SQL queries', () => {
  describe('calls > 0 base filter', () => {
    it.each(queryNames)('%s includes calls > 0 without user filters', (name) => {
      const sql = queries[name].sql([], undefined, undefined)
      expect(sql).toContain('calls > 0')
    })

    it.each(queryNames)('%s still includes calls > 0 when user filters are provided', (name) => {
      const sql = queries[name].sql([], "WHERE auth.rolname in ('postgres')", undefined)
      expect(sql).toContain('calls > 0')
    })
  })

  describe('WHERE clause composition with user filters', () => {
    const userWhere = "WHERE auth.rolname in ('postgres')"

    it.each([
      'mostFrequentlyInvoked',
      'mostTimeConsuming',
      'slowestExecutionTime',
      'unified',
    ] as const)('%s: user filters appended with AND (no duplicate WHERE)', (name) => {
      const sql = queries[name].sql([], userWhere, undefined)
      // Should not have two WHERE keywords in a row / duplicate WHERE
      expect(sql).not.toMatch(/WHERE\s+.*WHERE/s)
      // User filter condition should be present
      expect(sql).toContain("auth.rolname in ('postgres')")
      // Should use AND to join base filter and user filter
      expect(sql).toMatch(/calls > 0\s+AND/)
    })

    it('queryMetrics: user filters appended with AND (no duplicate WHERE in FROM clause)', () => {
      const sql = queries.queryMetrics.sql([], userWhere, undefined)
      // queryMetrics uses COUNT(*) FILTER (WHERE ...) which is valid SQL and not a duplicate
      // Just verify the base filter + user filter are correctly composed
      expect(sql).toContain("auth.rolname in ('postgres')")
      expect(sql).toMatch(/calls > 0\s+AND/)
      // Should not have two WHERE keywords after the FROM keyword
      expect(sql).not.toMatch(/FROM[\s\S]*WHERE[\s\S]*WHERE[\s\S]*WHERE/s)
    })

    it.each([
      'mostFrequentlyInvoked',
      'mostTimeConsuming',
      'slowestExecutionTime',
      'unified',
      'queryMetrics',
    ] as const)('%s: no trailing junk when no user filters', (name) => {
      const sql = queries[name].sql([], undefined, undefined)
      // Should not have a dangling undefined or 'WHERE' with nothing after the base filter
      expect(sql).not.toContain('undefined')
      expect(sql).not.toMatch(/calls > 0\s+AND\s+(ORDER|LIMIT|$)/im)
    })
  })

  describe('slowQueriesCount bug fix', () => {
    it('uses table alias "statements"', () => {
      const sql = queries.slowQueriesCount.sql()
      expect(sql).toContain('pg_stat_statements as statements')
    })

    it('filters by mean_exec_time using the alias', () => {
      const sql = queries.slowQueriesCount.sql()
      expect(sql).toContain('statements.mean_exec_time > 1000')
    })
  })

  describe('window function elimination', () => {
    it('unified uses grand_total CTE instead of OVER()', () => {
      const sql = queries.unified.sql([], undefined, undefined)
      expect(sql).toContain('grand_total')
      expect(sql).not.toContain('OVER()')
    })

    it('mostTimeConsuming uses grand_total CTE instead of OVER()', () => {
      const sql = queries.mostTimeConsuming.sql([], undefined, undefined)
      expect(sql).toContain('grand_total')
      expect(sql).not.toContain('OVER()')
    })

    it('grand_total CTE references calls > 0', () => {
      const sql = queries.unified.sql([], undefined, undefined)
      expect(sql).toMatch(/grand_total[\s\S]*calls > 0/)
    })
  })

  describe('multiple user filters', () => {
    it('handles multiple user filter conditions', () => {
      const multiWhere = "WHERE auth.rolname in ('postgres') AND statements.calls >= 10"
      const sql = queries.mostFrequentlyInvoked.sql([], multiWhere, undefined)
      expect(sql).toContain('calls > 0')
      expect(sql).toContain("auth.rolname in ('postgres')")
      expect(sql).toContain('statements.calls >= 10')
      expect(sql).not.toMatch(/WHERE\s+.*WHERE/s)
    })
  })
})
