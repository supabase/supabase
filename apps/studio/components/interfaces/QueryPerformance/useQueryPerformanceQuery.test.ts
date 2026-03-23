import { describe, expect, it } from 'vitest'

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
})
