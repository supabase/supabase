import { describe, expect, it } from 'vitest'

import type { InfraMonitoringMultiData } from './infra-monitoring-query'
import { mapMultiResponseToAnalyticsData } from './infra-monitoring-queries'

const mockResponse: InfraMonitoringMultiData = {
  data: [
    {
      period_start: '2024-01-02 03:04:00',
      values: {
        max_cpu_usage: '1.5',
        ram_usage: undefined,
      },
    },
    {
      period_start: '2024-01-02 04:04:00',
      values: {
        max_cpu_usage: undefined,
        ram_usage: '3',
      },
    },
  ],
  series: {
    max_cpu_usage: { format: 'percent', total: 2.5, totalAverage: 1.25, yAxisLimit: 100 },
    ram_usage: { format: 'bytes', total: 3, totalAverage: 1.5, yAxisLimit: 200 },
  },
}

describe('mapMultiResponseToAnalyticsData', () => {
  it('maps attribute series and coerces values to numbers', () => {
    const result = mapMultiResponseToAnalyticsData(mockResponse, ['max_cpu_usage', 'ram_usage'])

    expect(result.max_cpu_usage?.data).toStrictEqual([
      {
        period_start: '2024-01-02 03:04:00',
        periodStartFormatted: '03:04 02 Jan',
        max_cpu_usage: 1.5,
      },
      {
        period_start: '2024-01-02 04:04:00',
        periodStartFormatted: '04:04 02 Jan',
        max_cpu_usage: 0,
      },
    ])

    expect(result.ram_usage?.data[0].ram_usage).toBe(0)
    expect(result.ram_usage?.data[1].ram_usage).toBe(3)
    expect(result.max_cpu_usage).toMatchObject({
      format: 'percent',
      total: 2.5,
      yAxisLimit: 100,
    })
  })

  it('omits attributes that are missing series metadata', () => {
    const result = mapMultiResponseToAnalyticsData(mockResponse, [
      'max_cpu_usage',
      'ram_usage',
      'pg_stat_database_num_backends',
    ])

    expect(result.max_cpu_usage).toBeDefined()
    expect(result.ram_usage).toBeDefined()
    expect(result.pg_stat_database_num_backends).toBeUndefined()
  })

  it('uses a custom date format when provided', () => {
    const result = mapMultiResponseToAnalyticsData(mockResponse, ['max_cpu_usage'], 'YYYY/MM/DD')

    expect(result.max_cpu_usage?.data[0].periodStartFormatted).toBe('2024/01/02')
  })
})
