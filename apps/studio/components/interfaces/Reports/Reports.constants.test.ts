import { describe, expect, it } from 'vitest'

import { generateRegexpWhereSafe } from './Reports.constants'
import type { ReportFilterItem } from './Reports.types'

describe('generateRegexpWhereSafe', () => {
  it('should return empty fragment when no filters provided', () => {
    const result = generateRegexpWhereSafe([])
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
    const result = generateRegexpWhereSafe(filters, true)
    expect(result).toBe("WHERE `request`.`path` = '/api/users'")
  })

  it('should generate AND clause for single filter with prepend=false', () => {
    const filters: ReportFilterItem[] = [
      {
        key: 'request.path',
        value: '/api/users',
        compare: 'is',
      },
    ]
    const result = generateRegexpWhereSafe(filters, false)
    expect(result).toBe("AND `request`.`path` = '/api/users'")
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
    const result = generateRegexpWhereSafe(filters, true)
    expect(result).toBe(
      "WHERE REGEXP_CONTAINS(`request`.`path`, '/api/*') AND `response`.`status_code` = 404"
    )
  })

  it('should handle numbers', () => {
    const filters: ReportFilterItem[] = [
      {
        key: 'request.status_code',
        value: 200,
        compare: 'is',
      },
    ]
    const result = generateRegexpWhereSafe(filters, true)
    expect(result).toBe('WHERE `request`.`status_code` = 200')
  })

  it('should escape single quotes in string values', () => {
    const filters: ReportFilterItem[] = [
      {
        key: 'request.path',
        value: "/it's/here",
        compare: 'is',
      },
    ]
    const result = generateRegexpWhereSafe(filters, true)
    expect(result).toBe("WHERE `request`.`path` = '/it''s/here'")
  })

  it('should drop filters with injection-attempt keys (OR injection)', () => {
    const filters: ReportFilterItem[] = [
      {
        key: 'level OR id IS NOT NULL',
        value: 'info',
        compare: 'is',
      },
    ]
    // Key contains spaces — quotedIdent rejects it, predicate is dropped entirely
    const result = generateRegexpWhereSafe(filters, true)
    expect(result).toBe('')
  })

  it('should drop filters with injection-attempt keys (semicolon injection)', () => {
    const filters: ReportFilterItem[] = [
      {
        key: 'request.method); DROP TABLE edge_logs; --',
        value: 'GET',
        compare: 'is',
      },
    ]
    // Key fails ident validation — predicate dropped entirely, no SQL emitted
    const result = generateRegexpWhereSafe(filters, true)
    expect(result).toBe('')
  })

  it('should drop invalid keys but keep valid ones', () => {
    const filters: ReportFilterItem[] = [
      {
        key: 'bad key!',
        value: 'anything',
        compare: 'is',
      },
      {
        key: 'request.method',
        value: 'GET',
        compare: 'is',
      },
    ]
    const result = generateRegexpWhereSafe(filters, true)
    expect(result).toBe("WHERE `request`.`method` = 'GET'")
  })

  it('should preserve value casing so uppercase HTTP methods match', () => {
    const filters: ReportFilterItem[] = [
      {
        key: 'request.method',
        value: 'DELETE',
        compare: 'is',
      },
    ]
    const result = generateRegexpWhereSafe(filters, true)
    expect(result).toBe("WHERE `request`.`method` = 'DELETE'")
  })
})
