import { describe, expect, it } from 'vitest'

import { PRESET_CONFIG } from '@/components/interfaces/Reports/Reports.constants'
import type { ReportFilterItem } from '@/components/interfaces/Reports/Reports.types'
import { getLogsSql } from '@/components/interfaces/Reports/Reports.utils'
import { getSharedAPIReportSql } from '@/components/interfaces/Reports/SharedAPIReport/SharedAPIReport.constants'

const timeSeries = ['totalRequests', 'errorCounts', 'responseSpeed', 'networkTraffic'] as const
const filters: ReportFilterItem[] = [
  { key: 'request.path', value: '/rest', compare: 'matches' },
  { key: 'request.method', value: 'GET', compare: 'is' },
]
const start = '2026-10-22T12:00:00.000Z'

for (const useOtel of [false, true]) {
  describe(`Shared API Report ${useOtel ? 'OTEL' : 'BigQuery'} time buckets`, () => {
    it.each([
      ['last 10 minutes', '2026-10-22T12:10:00.000Z', 'minute'],
      ['last 60 minutes', '2026-10-22T13:00:00.000Z', 'minute'],
      ['last 60 minutes with clock drift', '2026-10-22T13:00:00.500Z', 'minute'],
      ['61 minutes', '2026-10-22T13:01:00.000Z', 'hour'],
      ['last 24 hours', '2026-10-23T12:00:00.000Z', 'hour'],
    ] as const)('uses the expected resolution for %s', (_label, end, granularity) => {
      for (const name of timeSeries) {
        const sql = getSharedAPIReportSql(name, filters, { start, end, useOtel })
        if (useOtel) {
          const bucketFunction = granularity === 'minute' ? 'toStartOfMinute' : 'toStartOfHour'
          const bucket = `toUnixTimestamp(${bucketFunction}(logs.timestamp)) * 1000000`
          expect(sql).toContain(`${bucket} as timestamp`)
          expect(sql).toContain(`group by ${bucket}`)
          expect(sql).toContain(`order by ${bucket} asc`)
          expect(sql).toContain("match(log_attributes['request.path'], '/rest')")
          expect(sql).toContain("log_attributes['request.method'] = 'GET'")
        } else {
          expect(sql).toContain(`timestamp_trunc(t.timestamp, ${granularity})`)
          expect(sql).toContain("REGEXP_CONTAINS(`request`.`path`, '/rest')")
          expect(sql).toContain("`request`.`method` = 'GET'")
        }
        if (name === 'errorCounts') {
          expect(sql).toContain(
            useOtel
              ? "toInt32OrZero(log_attributes['response.status_code']) >= 400"
              : 'response.status_code >= 400'
          )
        }
      }
    })

    it.each(['topRoutes', 'topErrorRoutes', 'topSlowRoutes'] as const)(
      'keeps %s summaries independent of bucket size',
      (name) => {
        expect(
          getSharedAPIReportSql(name, filters, {
            start,
            end: '2026-10-22T13:00:00.000Z',
            useOtel,
          })
        ).toBe(
          getSharedAPIReportSql(name, filters, {
            start,
            end: '2026-10-23T12:00:00.000Z',
            useOtel,
          })
        )
      }
    )

    it.each(timeSeries)('preserves hourly defaults for other %s consumers', (name) => {
      const sql = getLogsSql(PRESET_CONFIG.api.queries[name], filters, useOtel)
      expect(sql).toContain(
        useOtel ? 'toStartOfHour(logs.timestamp)' : 'timestamp_trunc(t.timestamp, hour)'
      )
    })
  })
}
