import { describe, it, expect, vi } from 'vitest'
import { transformStatementDataToRows } from './WithStatements.utils'

vi.mock('../IndexAdvisor/index-advisor.utils', () => ({
  filterProtectedSchemaIndexAdvisorResult: vi.fn((result) => {
    if (result?._mock_filter_null) return null
    return result
  }),
  queryInvolvesProtectedSchemas: vi.fn((query: string) => {
    return query?.toLowerCase().includes('auth.')
  }),
}))

const makeRow = (overrides: Record<string, any> = {}) => ({
  query: 'SELECT 1',
  rolname: 'postgres',
  calls: 10,
  mean_time: 5.0,
  min_time: 1.0,
  max_time: 20.0,
  total_time: 50.0,
  rows_read: 100,
  cache_hit_rate: 0.95,
  index_advisor_result: null,
  ...overrides,
})

describe('transformStatementDataToRows', () => {
  it('returns empty array for null or empty input', () => {
    expect(transformStatementDataToRows(null as any)).toEqual([])
    expect(transformStatementDataToRows([])).toEqual([])
  })

  it('transforms basic rows correctly', () => {
    const data = [makeRow()]
    const result = transformStatementDataToRows(data)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      query: 'SELECT 1',
      rolname: 'postgres',
      calls: 10,
      mean_time: 5.0,
      min_time: 1.0,
      max_time: 20.0,
      total_time: 50.0,
      rows_read: 100,
      cache_hit_rate: 0.95,
    })
  })

  it('defaults missing numeric fields to 0', () => {
    const data = [{ query: 'SELECT 1' }]
    const result = transformStatementDataToRows(data)

    expect(result).toHaveLength(1)
    expect(result[0].calls).toBe(0)
    expect(result[0].mean_time).toBe(0)
    expect(result[0].min_time).toBe(0)
    expect(result[0].max_time).toBe(0)
    expect(result[0].total_time).toBe(0)
    expect(result[0].rows_read).toBe(0)
    expect(result[0].cache_hit_rate).toBe(0)
  })

  it('sets rolname to undefined when missing', () => {
    const data = [makeRow({ rolname: undefined })]
    const result = transformStatementDataToRows(data)
    expect(result[0].rolname).toBeUndefined()
  })

  it('calculates prop_total_time as percentage of total time', () => {
    const data = [
      makeRow({ query: 'Q1', total_time: 75 }),
      makeRow({ query: 'Q2', total_time: 25 }),
    ]
    const result = transformStatementDataToRows(data)

    expect(result[0].prop_total_time).toBe(75)
    expect(result[1].prop_total_time).toBe(25)
  })

  it('handles prop_total_time when total is zero', () => {
    const data = [makeRow({ total_time: 0 })]
    const result = transformStatementDataToRows(data)
    expect(result[0].prop_total_time).toBe(0)
  })

  it('applies index_advisor_result filtering', () => {
    const data = [
      makeRow({
        index_advisor_result: { index_statements: ['CREATE INDEX ON public.users (id)'] },
      }),
    ]
    const result = transformStatementDataToRows(data)

    expect(result[0].index_advisor_result).toEqual({
      index_statements: ['CREATE INDEX ON public.users (id)'],
    })
  })

  it('sets index_advisor_result to null when source is null', () => {
    const data = [makeRow({ index_advisor_result: null })]
    const result = transformStatementDataToRows(data)
    expect(result[0].index_advisor_result).toBeNull()
  })

  describe('filterIndexAdvisor mode', () => {
    it('keeps rows for non-protected schema queries', () => {
      const data = [makeRow({ query: 'SELECT * FROM public.users' })]
      const result = transformStatementDataToRows(data, true)
      expect(result).toHaveLength(1)
    })

    it('keeps protected-schema rows that have valid recommendations', () => {
      const data = [
        makeRow({
          query: 'SELECT * FROM auth.users',
          index_advisor_result: { index_statements: ['CREATE INDEX ON auth.users (id)'] },
        }),
      ]
      const result = transformStatementDataToRows(data, true)
      expect(result).toHaveLength(1)
    })

    it('filters out protected-schema rows with no valid recommendations', () => {
      const data = [
        makeRow({
          query: 'SELECT * FROM auth.users',
          index_advisor_result: { _mock_filter_null: true },
        }),
      ]
      const result = transformStatementDataToRows(data, true)
      expect(result).toHaveLength(0)
    })

    it('does not filter protected-schema rows when filterIndexAdvisor is false', () => {
      const data = [
        makeRow({
          query: 'SELECT * FROM auth.users',
          index_advisor_result: { _mock_filter_null: true },
        }),
      ]
      const result = transformStatementDataToRows(data, false)
      expect(result).toHaveLength(1)
    })
  })
})
