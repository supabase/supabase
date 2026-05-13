import { describe, expect, it } from 'vitest'

import { QueryPerformanceSort } from './QueryPerformance.types'
import { generateQueryPerformanceSql } from './useQueryPerformanceQuery'

describe('generateQueryPerformanceSql', () => {
  it('generates sql with no filters', () => {
    const result = generateQueryPerformanceSql({ preset: 'mostFrequentlyInvoked' })
    expect(result.sql).toBeDefined()
    expect(result.whereSql).toBe('')
    expect(result.orderBySql).toBeUndefined()
  })

  it('generates ORDER BY clause', () => {
    const result = generateQueryPerformanceSql({
      preset: 'mostFrequentlyInvoked',
      orderBy: { column: 'calls', order: 'desc' },
    })
    expect(result.orderBySql).toBe('ORDER BY calls desc')
  })

  it('filters by roles', () => {
    const result = generateQueryPerformanceSql({
      preset: 'mostFrequentlyInvoked',
      roles: ['postgres', 'anon'],
    })
    expect(result.whereSql).toContain("auth.rolname in ('postgres', 'anon')")
  })

  it('filters by search query', () => {
    const result = generateQueryPerformanceSql({
      preset: 'mostFrequentlyInvoked',
      searchQuery: 'SELECT',
    })
    expect(result.whereSql).toContain("statements.query ~* 'SELECT'")
  })

  it('filters by dashboard source only', () => {
    const result = generateQueryPerformanceSql({
      preset: 'mostFrequentlyInvoked',
      sources: ['dashboard'],
    })
    expect(result.whereSql).toContain("statements.query ~* 'source: dashboard'")
  })

  it('filters by non-dashboard source only', () => {
    const result = generateQueryPerformanceSql({
      preset: 'mostFrequentlyInvoked',
      sources: ['non-dashboard'],
    })
    expect(result.whereSql).toContain("statements.query !~* 'source: dashboard'")
  })

  it('does not add source filter when both sources are selected', () => {
    const result = generateQueryPerformanceSql({
      preset: 'mostFrequentlyInvoked',
      sources: ['dashboard', 'non-dashboard'],
    })
    expect(result.whereSql).not.toContain('source: dashboard')
  })

  it('filters by minimum calls', () => {
    const result = generateQueryPerformanceSql({
      preset: 'mostFrequentlyInvoked',
      minCalls: 10,
    })
    expect(result.whereSql).toContain('statements.calls >= 10')
  })

  it('does not filter by minCalls when 0', () => {
    const result = generateQueryPerformanceSql({
      preset: 'mostFrequentlyInvoked',
      minCalls: 0,
    })
    expect(result.whereSql).not.toContain('statements.calls')
  })

  it('filters by minimum total time', () => {
    const result = generateQueryPerformanceSql({
      preset: 'mostFrequentlyInvoked',
      minTotalTime: 500,
    })
    expect(result.whereSql).toContain(
      '(statements.total_exec_time + statements.total_plan_time) >= 500'
    )
  })

  it('combines multiple WHERE conditions with AND', () => {
    const result = generateQueryPerformanceSql({
      preset: 'mostFrequentlyInvoked',
      roles: ['postgres'],
      searchQuery: 'SELECT',
      minCalls: 5,
    })
    expect(result.whereSql).toContain("auth.rolname in ('postgres')")
    expect(result.whereSql).toContain("statements.query ~* 'SELECT'")
    expect(result.whereSql).toContain('statements.calls >= 5')
    expect(result.whereSql.split(' AND ').length).toBe(3)
  })

  it('passes WHERE clause to base sql function', () => {
    const result = generateQueryPerformanceSql({
      preset: 'mostFrequentlyInvoked',
      roles: ['postgres'],
    })
    expect(result.sql).toContain('WHERE')
  })

  it('does not include user-defined WHERE conditions when no filters set', () => {
    const result = generateQueryPerformanceSql({ preset: 'mostFrequentlyInvoked' })
    expect(result.whereSql).toBe('')
    // The base SQL may still contain its own WHERE clause (e.g. statements.calls > 0)
    // but the user-defined whereSql should be empty
  })

  it('passes runIndexAdvisor and filterIndexAdvisor flags', () => {
    const resultWithAdvisor = generateQueryPerformanceSql({
      preset: 'mostFrequentlyInvoked',
      runIndexAdvisor: true,
      filterIndexAdvisor: true,
    })
    expect(resultWithAdvisor.sql).toBeDefined()
  })

  it('works with different presets', () => {
    const presets = [
      'mostFrequentlyInvoked',
      'mostTimeConsuming',
      'slowestExecutionTime',
      'queryHitRate',
      'unified',
    ] as const

    for (const preset of presets) {
      const result = generateQueryPerformanceSql({ preset })
      expect(result.sql).toBeDefined()
    }
  })

  it('clamps page=0 to page=1 (no negative offset)', () => {
    const result = generateQueryPerformanceSql({ preset: 'unified', page: 0, pageSize: 20 })
    expect(result.sql).toContain('offset 0')
    expect(result.sql).not.toMatch(/offset -\d/)
  })

  it('clamps negative page to page=1', () => {
    const result = generateQueryPerformanceSql({ preset: 'unified', page: -5, pageSize: 20 })
    expect(result.sql).toContain('offset 0')
  })

  it('clamps pageSize above 100 to 100', () => {
    const result = generateQueryPerformanceSql({ preset: 'unified', page: 1, pageSize: 9999 })
    expect(result.sql).toContain('limit 100')
    expect(result.sql).not.toContain('limit 9999')
  })

  it('applies LIMIT and OFFSET for page 2', () => {
    const result = generateQueryPerformanceSql({ preset: 'unified', page: 2, pageSize: 20 })
    expect(result.sql).toContain('limit 20 offset 20')
  })

  it('does not produce NaN in SQL when page is NaN', () => {
    const result = generateQueryPerformanceSql({ preset: 'unified', page: NaN, pageSize: 20 })
    expect(result.sql).not.toContain('NaN')
    expect(result.sql).toContain('offset 0')
  })

  it('does not produce NaN in SQL when pageSize is NaN', () => {
    const result = generateQueryPerformanceSql({ preset: 'unified', page: 1, pageSize: NaN })
    expect(result.sql).not.toContain('NaN')
    expect(result.sql).toContain('limit 20')
  })
})

describe('generateQueryPerformanceSql - ORDER BY column validation', () => {
  it('rejects invalid orderBy column containing colon (old URL format)', () => {
    const result = generateQueryPerformanceSql({
      preset: 'mostFrequentlyInvoked',
      orderBy: { column: 'created_at:asc' as any, order: 'desc' },
    })
    expect(result.orderBySql).toBeUndefined()
  })

  it('rejects SQL injection in orderBy column', () => {
    const result = generateQueryPerformanceSql({
      preset: 'mostFrequentlyInvoked',
      orderBy: { column: 'calls; DROP TABLE users--' as any, order: 'asc' },
    })
    expect(result.orderBySql).toBeUndefined()
    expect(result.sql).not.toContain('DROP TABLE')
  })

  it('falls back to default ORDER BY when column is invalid', () => {
    const result = generateQueryPerformanceSql({
      preset: 'mostFrequentlyInvoked',
      orderBy: { column: 'created_at:asc' as any, order: 'asc' },
    })
    expect(result.sql).toContain('order by statements.calls desc')
  })

  it('accepts all valid sort columns', () => {
    const columns: QueryPerformanceSort['column'][] = [
      'query',
      'rolname',
      'total_time',
      'prop_total_time',
      'calls',
      'avg_rows',
      'max_time',
      'mean_time',
      'min_time',
    ]
    for (const column of columns) {
      const result = generateQueryPerformanceSql({
        preset: 'mostFrequentlyInvoked',
        orderBy: { column, order: 'asc' },
      })
      expect(result.orderBySql).toBe(`ORDER BY ${column} asc`)
    }
  })
})
