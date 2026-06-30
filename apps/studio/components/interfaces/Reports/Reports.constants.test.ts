import { describe, expect, it } from 'vitest'

import { generateOtelWhereSafe, generateRegexpWhereSafe } from './Reports.constants'
import type { ReportFilterItem } from './Reports.types'

// Collapse whitespace so OTEL assertions are resilient to formatting.
const sqlText = (fragment: string) => fragment.replace(/\s+/g, ' ').trim()

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
    expect(result).toBe("WHERE `request`.`method` = 'get'")
  })
})

describe('generateOtelWhereSafe', () => {
  it('returns an empty fragment when no filters provided', () => {
    expect(sqlText(generateOtelWhereSafe([]))).toBe('')
  })

  it('returns an empty fragment for the non-prepend form with no filters', () => {
    // otelWhere relies on this so an empty filter set never emits a dangling `AND`.
    expect(sqlText(generateOtelWhereSafe([], false))).toBe('')
  })

  it('maps `matches` to ClickHouse match() over the log_attributes lookup', () => {
    const filters: ReportFilterItem[] = [
      { key: 'request.path', value: '/auth', compare: 'matches' },
    ]
    expect(sqlText(generateOtelWhereSafe(filters))).toBe(
      "WHERE match(log_attributes['request.path'], '/auth')"
    )
  })

  it('maps `is` to a lowercased string equality against the attribute', () => {
    const filters: ReportFilterItem[] = [{ key: 'request.method', value: 'GET', compare: 'is' }]
    expect(sqlText(generateOtelWhereSafe(filters))).toBe(
      "WHERE log_attributes['request.method'] = 'get'"
    )
  })

  it('casts the attribute to an int for ordering comparisons', () => {
    const filters: ReportFilterItem[] = [
      { key: 'response.status_code', value: '400', compare: '>=' },
    ]
    expect(sqlText(generateOtelWhereSafe(filters))).toBe(
      "WHERE toInt64OrZero(log_attributes['response.status_code']) >= 400"
    )
  })

  it('drops an ordering comparison whose value is not numeric', () => {
    const filters: ReportFilterItem[] = [
      { key: 'response.status_code', value: 'abc', compare: '>' },
    ]
    expect(sqlText(generateOtelWhereSafe(filters))).toBe('')
  })

  it('normalizes a deep key to its last two segments', () => {
    const filters: ReportFilterItem[] = [
      { key: 'metadata.request.path', value: '/rest', compare: 'matches' },
    ]
    expect(sqlText(generateOtelWhereSafe(filters))).toContain("log_attributes['request.path']")
  })

  it('escapes the key inside the log_attributes subscript so it cannot break out', () => {
    const filters: ReportFilterItem[] = [{ key: "x'] = '1", value: 'info', compare: 'is' }]
    // Single quotes in the key are doubled by the literal escaping, keeping the
    // injection attempt confined to the string subscript.
    expect(sqlText(generateOtelWhereSafe(filters))).toContain("log_attributes['x''] = ''1']")
  })

  it('joins multiple conditions with AND and supports the non-prepend form', () => {
    const filters: ReportFilterItem[] = [
      { key: 'request.path', value: '/auth', compare: 'matches' },
      { key: 'request.method', value: 'POST', compare: 'is' },
    ]
    const result = sqlText(generateOtelWhereSafe(filters, false))
    expect(result.startsWith('AND ')).toBe(true)
    expect(result).toContain("match(log_attributes['request.path'], '/auth')")
    expect(result).toContain("log_attributes['request.method'] = 'post'")
  })
})
