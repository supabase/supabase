import { describe, expect, it } from 'vitest'

import { generateOtelWhereSafe, generateRegexpWhereSafe, PRESET_CONFIG } from './Reports.constants'
import { Presets } from './Reports.types'
import type { ReportFilterItem, ReportQueryLogs } from './Reports.types'

const sql = (fragment: { toString(): string }) => String(fragment)
const storageQueries = PRESET_CONFIG[Presets.STORAGE].queries as Record<
  'cacheHitRate' | 'topCacheMisses',
  ReportQueryLogs
>

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

describe('generateOtelWhereSafe', () => {
  it('should return empty fragment when no filters provided', () => {
    expect(generateOtelWhereSafe([])).toBe('')
  })

  it('should generate a WHERE clause keyed by the full dotted log_attributes path', () => {
    const filters: ReportFilterItem[] = [
      { key: 'request.path', value: '/api/users', compare: 'is' },
    ]
    expect(generateOtelWhereSafe(filters, true)).toBe(
      "WHERE log_attributes['request.path'] = '/api/users'"
    )
  })

  it('should translate a numeric comparison filter using toInt64OrZero', () => {
    const filters: ReportFilterItem[] = [{ key: 'response.status_code', value: 500, compare: '>=' }]
    expect(generateOtelWhereSafe(filters, true)).toBe(
      "WHERE toInt64OrZero(log_attributes['response.status_code']) >= 500"
    )
  })

  it('should drop a numeric comparison filter with a non-numeric value instead of coercing it', () => {
    const filters: ReportFilterItem[] = [
      { key: 'response.status_code', value: 'not-a-number', compare: '>=' },
    ]
    expect(generateOtelWhereSafe(filters, true)).toBe('')
  })

  it('should keep valid filters when a numeric comparison filter is dropped', () => {
    const filters: ReportFilterItem[] = [
      { key: 'response.status_code', value: 'not-a-number', compare: '>=' },
      { key: 'request.method', value: 'GET', compare: 'is' },
    ]
    expect(generateOtelWhereSafe(filters, true)).toBe(
      "WHERE log_attributes['request.method'] = 'GET'"
    )
  })

  it('should generate an AND clause with prepend=false, for appending after an existing WHERE', () => {
    const filters: ReportFilterItem[] = [{ key: 'request.method', value: 'GET', compare: 'is' }]
    expect(generateOtelWhereSafe(filters, false)).toBe(
      "AND log_attributes['request.method'] = 'GET'"
    )
  })
})

describe('PRESET_CONFIG.storage safeSqlOtel', () => {
  it('scopes cacheHitRate to storage object requests on the single OTEL logs table', () => {
    const out = sql(storageQueries.cacheHitRate.safeSqlOtel!([]))

    expect(out).toContain('from logs')
    expect(out).toContain("where source = 'edge_logs'")
    expect(out).toContain("log_attributes['request.path'] like '/storage/v1/object%'")
    expect(out).toContain("log_attributes['request.method'] = 'GET'")
    expect(out).not.toContain('cross join unnest')
    expect(out).not.toContain('timestamp_trunc')
  })

  it('emits 16-digit unix-microsecond timestamps for cacheHitRate', () => {
    const out = sql(storageQueries.cacheHitRate.safeSqlOtel!([]))
    expect(out).toContain('toUnixTimestamp(toStartOfHour(timestamp)) * 1000000 as timestamp')
  })

  it('buckets cf_cache_status into hit_count/miss_count via countIf', () => {
    const out = sql(storageQueries.cacheHitRate.safeSqlOtel!([]))

    expect(out).toContain(
      "countIf(log_attributes['response.headers.cf_cache_status'] in ('HIT', 'STALE', 'REVALIDATED', 'UPDATING')) as hit_count"
    )
    expect(out).toContain(
      "countIf(log_attributes['response.headers.cf_cache_status'] in ('MISS', 'NONE/UNKNOWN', 'EXPIRED', 'BYPASS', 'DYNAMIC')) as miss_count"
    )
  })

  it('reads path/search dimensions from log_attributes for topCacheMisses', () => {
    const out = sql(storageQueries.topCacheMisses.safeSqlOtel!([]))

    expect(out).toContain('from logs')
    expect(out).toContain("where source = 'edge_logs'")
    expect(out).toContain("log_attributes['request.path'] as path")
    expect(out).toContain("log_attributes['request.search'] as search")
    expect(out).toContain('count() as count')
    expect(out).toContain('limit 12')
  })

  it('filters topCacheMisses to miss statuses only', () => {
    const out = sql(storageQueries.topCacheMisses.safeSqlOtel!([]))
    expect(out).toContain(
      "log_attributes['response.headers.cf_cache_status'] in ('MISS', 'NONE/UNKNOWN', 'EXPIRED', 'BYPASS', 'DYNAMIC')"
    )
  })
})
