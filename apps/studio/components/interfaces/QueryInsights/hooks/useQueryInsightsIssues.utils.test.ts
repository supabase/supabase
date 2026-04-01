import { describe, it, expect, vi } from 'vitest'
import { classifyQuery } from './useQueryInsightsIssues.utils'
import type { QueryPerformanceRow } from '../../QueryPerformance/QueryPerformance.types'

vi.mock('../../QueryPerformance/IndexAdvisor/index-advisor.utils', () => ({
  hasIndexRecommendations: vi.fn(),
}))

import { hasIndexRecommendations } from '../../QueryPerformance/IndexAdvisor/index-advisor.utils'

const baseRow: QueryPerformanceRow = {
  query: 'SELECT * FROM users',
  calls: 10,
  mean_time: 50,
  min_time: 10,
  max_time: 200,
  total_time: 500,
  prop_total_time: 5,
  rows_read: 100,
  cache_hit_rate: 1,
  rolname: 'postgres',
  application_name: 'test',
  index_advisor_result: null,
  _total_cache_hits: 0,
  _total_cache_misses: 0,
}

describe('classifyQuery', () => {
  it('returns error when index_advisor_result has errors', () => {
    const row = {
      ...baseRow,
      index_advisor_result: {
        errors: ['some error'],
        index_statements: [],
        startup_cost_before: 0,
        startup_cost_after: 0,
        total_cost_before: 0,
        total_cost_after: 0,
      },
    }
    const result = classifyQuery(row)
    expect(result.issueType).toBe('error')
    expect(result.hint).toBe('some error')
  })

  it('returns index when hasIndexRecommendations is true', () => {
    vi.mocked(hasIndexRecommendations).mockReturnValue(true)
    const row = {
      ...baseRow,
      index_advisor_result: {
        errors: [],
        index_statements: ['CREATE INDEX ...'],
        startup_cost_before: 0,
        startup_cost_after: 0,
        total_cost_before: 0,
        total_cost_after: 0,
      },
    }
    const result = classifyQuery(row)
    expect(result.issueType).toBe('index')
    expect(result.hint).toContain('Missing index')
    vi.mocked(hasIndexRecommendations).mockReset()
  })

  it('returns slow when mean_time exceeds threshold', () => {
    vi.mocked(hasIndexRecommendations).mockReturnValue(false)
    const row = { ...baseRow, mean_time: 300 }
    const result = classifyQuery(row)
    expect(result.issueType).toBe('slow')
    expect(result.hint).toBe('Abnormally slow query detected')
    vi.mocked(hasIndexRecommendations).mockReset()
  })

  it('returns null issue for healthy queries', () => {
    vi.mocked(hasIndexRecommendations).mockReturnValue(false)
    const row = { ...baseRow, mean_time: 50 }
    const result = classifyQuery(row)
    expect(result.issueType).toBeNull()
    expect(result.hint).toBe('')
    vi.mocked(hasIndexRecommendations).mockReset()
  })

  it('errors take priority over index recommendations', () => {
    vi.mocked(hasIndexRecommendations).mockReturnValue(true)
    const row = {
      ...baseRow,
      index_advisor_result: {
        errors: ['critical error'],
        index_statements: ['CREATE INDEX ...'],
        startup_cost_before: 0,
        startup_cost_after: 0,
        total_cost_before: 0,
        total_cost_after: 0,
      },
    }
    const result = classifyQuery(row)
    expect(result.issueType).toBe('error')
    vi.mocked(hasIndexRecommendations).mockReset()
  })
})
