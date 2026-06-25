import { describe, expect, it } from 'vitest'

import { generateRegexpWhereSafe, PRODUCT_FILTER_PATHS } from './Reports.constants'
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
    expect(result).toBe("WHERE `request`.`method` = 'get'")
  })
})

describe('PRODUCT_FILTER_PATHS (REGEXP_CONTAINS product filters) are anchored to the gateway prefix', () => {
  // Product filters match request.path with REGEXP_CONTAINS (a substring match).
  // Each value MUST keep its trailing slash so it matches only the real gateway
  // prefix (e.g. /storage/v1/...) and never a user table whose name merely starts
  // with the service word (e.g. the Data-API path /rest/v1/storage_workers).
  it('every product path value is slash-delimited on both sides', () => {
    for (const value of Object.values(PRODUCT_FILTER_PATHS)) {
      expect(value.startsWith('/')).toBe(true)
      expect(value.endsWith('/')).toBe(true)
    }
  })

  it('emits a trailing-slash REGEXP_CONTAINS for the storage product filter', () => {
    const result = generateRegexpWhereSafe(
      [{ key: 'request.path', value: PRODUCT_FILTER_PATHS.storage, compare: 'matches' }],
      true
    )
    expect(result).toBe("WHERE REGEXP_CONTAINS(`request`.`path`, '/storage/')")
  })

  it('does not bucket a PostgREST request to a `storage_*` table as storage', () => {
    // Regression: `/rest/v1/storage_workers` was counted as a Storage request because
    // the old value `/storage` is a substring of `/storage_workers`.
    const storageRe = new RegExp(PRODUCT_FILTER_PATHS.storage)
    expect(storageRe.test('/rest/v1/storage_workers')).toBe(false)
    expect(storageRe.test('/storage/v1/object/bucket/key')).toBe(true)
  })

  it('does not match a Data-API request to a table named after another service', () => {
    // For every non-rest service, a `/rest/v1/<service>_*` table request must NOT
    // match that service's filter (it is a PostgREST/Data-API request).
    for (const [service, value] of Object.entries(PRODUCT_FILTER_PATHS)) {
      if (service === 'rest') continue
      const re = new RegExp(value)
      expect(re.test(`/rest/v1/${service}_workers`)).toBe(false)
      // ...but the genuine gateway path for that service still matches.
      expect(re.test(`${value}v1/whatever`)).toBe(true)
    }
  })

  it('still matches genuine Data-API traffic for the rest filter', () => {
    const restRe = new RegExp(PRODUCT_FILTER_PATHS.rest)
    expect(restRe.test('/rest/v1/storage_workers')).toBe(true)
    expect(restRe.test('/storage/v1/object/x')).toBe(false)
  })
})
