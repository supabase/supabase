import { describe, expect, it } from 'vitest'

import { generateOtelWhereSafe, PRESET_CONFIG } from './Reports.constants'
import { Presets } from './Reports.types'
import type { ReportFilterItem, ReportQueryLogs } from './Reports.types'

const sql = (fragment: { toString(): string }) => String(fragment)
const apiQueries = PRESET_CONFIG[Presets.API].queries as Record<
  | 'totalRequests'
  | 'topRoutes'
  | 'errorCounts'
  | 'topErrorRoutes'
  | 'responseSpeed'
  | 'topSlowRoutes'
  | 'networkTraffic'
  | 'requestsByCountry',
  ReportQueryLogs
>
const storageQueries = PRESET_CONFIG[Presets.STORAGE].queries as Record<
  'cacheHitRate' | 'topCacheMisses',
  ReportQueryLogs
>

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

  it('should generate an AND clause with prepend=false, for appending after an existing WHERE', () => {
    const filters: ReportFilterItem[] = [{ key: 'request.method', value: 'GET', compare: 'is' }]
    expect(generateOtelWhereSafe(filters, false)).toBe(
      "AND log_attributes['request.method'] = 'GET'"
    )
  })
})

describe('PRESET_CONFIG.api safeSqlOtel', () => {
  it('queries the single OTEL logs table by source, never a per-service table', () => {
    const out = sql(apiQueries.totalRequests.safeSqlOtel!([]))

    expect(out).toContain('from logs')
    expect(out).toContain("where source = 'edge_logs'")
    expect(out).not.toContain('from edge_logs')
    expect(out).not.toContain('cross join unnest')
  })

  it('emits 16-digit unix-microsecond timestamps bucketed by hour', () => {
    expect(sql(apiQueries.totalRequests.safeSqlOtel!([]))).toContain(
      'toUnixTimestamp(toStartOfHour(timestamp)) * 1000000 as timestamp'
    )
  })

  it('reads route dimensions from log_attributes for topRoutes', () => {
    const out = sql(apiQueries.topRoutes.safeSqlOtel!([]))

    expect(out).toContain("log_attributes['request.path'] as path")
    expect(out).toContain("log_attributes['request.method'] as method")
    expect(out).toContain("log_attributes['request.search'] as search")
    expect(out).toContain("toInt32OrZero(log_attributes['response.status_code']) as status_code")
  })

  it('filters errorCounts/topErrorRoutes to status codes >= 400', () => {
    expect(sql(apiQueries.errorCounts.safeSqlOtel!([]))).toContain(
      "toInt32OrZero(log_attributes['response.status_code']) >= 400"
    )
    expect(sql(apiQueries.topErrorRoutes.safeSqlOtel!([]))).toContain(
      "toInt32OrZero(log_attributes['response.status_code']) >= 400"
    )
  })

  it('averages response.origin_time for responseSpeed/topSlowRoutes', () => {
    expect(sql(apiQueries.responseSpeed.safeSqlOtel!([]))).toContain(
      "avg(toFloat64OrZero(log_attributes['response.origin_time'])) as avg"
    )
    expect(sql(apiQueries.topSlowRoutes.safeSqlOtel!([]))).toContain(
      "avg(toFloat64OrZero(log_attributes['response.origin_time'])) as avg"
    )
  })

  it('sums request/response content_length headers for networkTraffic', () => {
    const out = sql(apiQueries.networkTraffic.safeSqlOtel!([]))
    expect(out).toContain(
      "sum(toInt64OrZero(log_attributes['request.headers.content_length'])) / 1000000 as ingress_mb"
    )
    expect(out).toContain(
      "sum(toInt64OrZero(log_attributes['response.headers.content_length'])) / 1000000 as egress_mb"
    )
  })

  it('reads the country from request.cf.country and excludes empty values for requestsByCountry', () => {
    const out = sql(apiQueries.requestsByCountry.safeSqlOtel!([]))
    expect(out).toContain("log_attributes['request.cf.country'] as country")
    expect(out).toContain("log_attributes['request.cf.country'] != ''")
  })

  it('applies caller-provided filters via generateOtelWhereSafe', () => {
    const out = sql(
      apiQueries.totalRequests.safeSqlOtel!([
        { key: 'request.method', value: 'GET', compare: 'is' },
      ])
    )
    expect(out).toContain("log_attributes['request.method'] = 'GET'")
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
