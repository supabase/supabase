import { describe, it, expect } from 'vitest'
import { generateRegexpWhere } from './Reports.constants'
import type { ReportFilterItem } from './Reports.types'

describe('generateRegexpWhere', () => {
  it('should return empty string when no filters provided', () => {
    const result = generateRegexpWhere([])
    expect(result).toBe('')
  })

  it('should generate WHERE clause for single filter', () => {
    const filters: ReportFilterItem[] = [
      {
        key: 'request.path',
        value: '/api/users',
        compare: 'is',
      },
    ]
    const result = generateRegexpWhere(filters, true)
    expect(result).toBe("WHERE request.path = '/api/users'")
  })

  it('should generate AND clause for single filter with prepend=false', () => {
    const filters: ReportFilterItem[] = [
      {
        key: 'request.path',
        value: '/api/users',
        compare: 'is',
      },
    ]
    const result = generateRegexpWhere(filters, false)
    expect(result).toBe("AND request.path = '/api/users'")
  })

  it('should handle different comparison operators', () => {
    const filters: ReportFilterItem[] = [
      {
        key: 'request.path',
        value: '/api/*',
        compare: 'matches',
      },
      {
        key: 'response.status_code',
        value: 404,
        compare: 'is',
      },
    ]
    const result = generateRegexpWhere(filters, true)
    expect(result).toBe(
      "WHERE REGEXP_CONTAINS(request.path, '/api/*') AND response.status_code = 404"
    )
  })

  it('should handle values with quotes', () => {
    const filters: ReportFilterItem[] = [
      {
        key: 'request.path',
        value: '"/api/users"',
        compare: 'is',
      },
    ]

    const result = generateRegexpWhere(filters, true)
    expect(result).toBe(`WHERE request.path = "/api/users"`)
  })

  it('should handle values without quotes', () => {
    const filters: ReportFilterItem[] = [
      {
        key: 'request.path',
        value: '/api/users',
        compare: 'is',
      },
    ]

    const result = generateRegexpWhere(filters, true)
    expect(result).toBe("WHERE request.path = '/api/users'")
  })

  it('should handle values with quotes and lowercase', () => {
    const filters: ReportFilterItem[] = [
      {
        key: 'request.path',
        value: '"/Api/Users"',
        compare: 'is',
      },
    ]

    const result = generateRegexpWhere(filters, true)
    expect(result).toBe(`WHERE request.path = "/api/users"`)
  })

  it('should handle numbers', () => {
    const filters: ReportFilterItem[] = [
      {
        key: 'request.status_code',
        value: 200,
        compare: 'is',
      },
    ]

    const result = generateRegexpWhere(filters, true)
    expect(result).toBe(`WHERE request.status_code = 200`)
  })
})
