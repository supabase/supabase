import { describe, expect, it } from 'vitest'

import { generateOtelWhereSafe, PRESET_CONFIG } from './Reports.constants'
import { Presets, type ReportFilterItem } from './Reports.types'

function getOtelSql(preset: Presets, queryName: string, filters: ReportFilterItem[] = []): string {
  const query = PRESET_CONFIG[preset].queries[queryName]
  if (query.queryType !== 'logs' || query.safeSqlOtel === undefined) {
    throw new Error(`Missing OTEL logs query for ${preset}.${queryName}`)
  }
  return query.safeSqlOtel(filters)
}

describe('generateOtelWhereSafe', () => {
  it.each([
    ['matches', 'api.*', "match(log_attributes['request.path'], 'api.*')"],
    ['is', 'GET', "log_attributes['request.path'] = 'GET'"],
    ['!=', 'GET', "log_attributes['request.path'] != 'GET'"],
    ['>=', '400', "toFloat64OrNull(log_attributes['request.path']) >= 400"],
    ['<=', '400', "toFloat64OrNull(log_attributes['request.path']) <= 400"],
    ['>', '400', "toFloat64OrNull(log_attributes['request.path']) > 400"],
    ['<', '400', "toFloat64OrNull(log_attributes['request.path']) < 400"],
  ] as const)('builds a safe %s predicate', (compare, value, expected) => {
    expect(generateOtelWhereSafe([{ key: 'request.path', value, compare }])).toBe(
      `WHERE ${expected}`
    )
  })

  it('preserves dotted keys and escapes key and value input', () => {
    expect(
      generateOtelWhereSafe([
        {
          key: "request.headers.user_agent'] OR 1=1 --",
          value: "agent' OR 1=1 --",
          compare: 'is',
        },
      ])
    ).toBe("WHERE log_attributes['request.headers.user_agent''] OR 1=1 --'] = 'agent'' OR 1=1 --'")
  })

  it('omits invalid numeric comparisons without dropping valid filters', () => {
    expect(
      generateOtelWhereSafe(
        [
          { key: 'response.status_code', value: 'not-a-number', compare: '>=' },
          { key: 'request.method', value: 'GET', compare: 'is' },
        ],
        false
      )
    ).toBe("AND log_attributes['request.method'] = 'GET'")
  })
})

describe('Report OTEL queries', () => {
  it.each([
    ['totalRequests', 50000],
    ['topRoutes', 10],
    ['errorCounts', 50000],
    ['topErrorRoutes', 10],
    ['responseSpeed', 50000],
    ['topSlowRoutes', 10],
    ['networkTraffic', 50000],
    ['requestsByCountry', 250],
  ])('uses edge_logs and a fixed limit for API query %s', (queryName, limit) => {
    const sql = getOtelSql(Presets.API, queryName)

    expect(sql).toContain('from logs')
    expect(sql).toContain("source = 'edge_logs'")
    expect(sql).toContain(`limit ${limit}`)
    expect(sql).not.toContain('from edge_logs')
    expect(sql).not.toContain('cross join unnest')
  })

  it.each(['totalRequests', 'errorCounts'])(
    'emits numeric counts and explicit unix-microsecond buckets for %s',
    (queryName) => {
      const sql = getOtelSql(Presets.API, queryName)
      const bucket = 'toUnixTimestamp(toStartOfHour(logs.timestamp)) * 1000000'

      expect(sql).toContain(`${bucket} as timestamp`)
      expect(sql).toContain('toFloat64(count()) as count')
      expect(sql).toContain(`group by ${bucket}`)
      expect(sql).toContain(`order by ${bucket} asc`)
    }
  )

  it('uses exact route attributes and numeric response values', () => {
    const routesSql = getOtelSql(Presets.API, 'topRoutes')
    const speedSql = getOtelSql(Presets.API, 'responseSpeed')
    const trafficSql = getOtelSql(Presets.API, 'networkTraffic')
    const countrySql = getOtelSql(Presets.API, 'requestsByCountry')

    expect(routesSql).toContain("log_attributes['request.path'] as path")
    expect(routesSql).toContain("log_attributes['request.method'] as method")
    expect(routesSql).toContain("log_attributes['request.search'] as search")
    expect(routesSql).toContain(
      "toInt32OrZero(log_attributes['response.status_code']) as status_code"
    )
    expect(routesSql).toContain('toFloat64(count()) as count')
    expect(speedSql).toContain(
      "avg(toFloat64OrNull(log_attributes['response.origin_time'])) as avg"
    )
    expect(trafficSql).toContain(
      "sum(toFloat64OrZero(log_attributes['request.headers.content_length'])) / 1000000 as ingress_mb"
    )
    expect(trafficSql).toContain(
      "sum(toFloat64OrZero(log_attributes['response.headers.content_length'])) / 1000000 as egress_mb"
    )
    expect(countrySql).toContain("log_attributes['request.cf.country'] as country")
    expect(countrySql).toContain("notEmpty(log_attributes['request.cf.country'])")
  })

  it('builds numeric Storage cache results from exact OTEL attributes', () => {
    const hitRateSql = getOtelSql(Presets.STORAGE, 'cacheHitRate')
    const missesSql = getOtelSql(Presets.STORAGE, 'topCacheMisses')

    expect(hitRateSql).toContain("where source = 'edge_logs'")
    expect(hitRateSql).toContain("startsWith(log_attributes['request.path'], '/storage/v1/object')")
    expect(hitRateSql).toContain(
      "toFloat64(countIf(log_attributes['response.headers.cf_cache_status'] in ('HIT', 'STALE', 'REVALIDATED', 'UPDATING'))) as hit_count"
    )
    expect(hitRateSql).toContain(
      "toFloat64(countIf(log_attributes['response.headers.cf_cache_status'] in ('MISS', 'NONE/UNKNOWN', 'EXPIRED', 'BYPASS', 'DYNAMIC'))) as miss_count"
    )
    expect(hitRateSql).toContain('limit 50000')
    expect(missesSql).toContain('toFloat64(count()) as count')
    expect(missesSql).toContain(
      "log_attributes['response.headers.cf_cache_status'] in ('MISS', 'NONE/UNKNOWN', 'EXPIRED', 'BYPASS', 'DYNAMIC')"
    )
    expect(missesSql).toContain('limit 12')
  })
})
