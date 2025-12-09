import { describe, expect, it } from 'vitest'

import type {
  InfraMonitoringMultiData,
  InfraMonitoringMultiResponse,
  InfraMonitoringSingleResponse,
} from './infra-monitoring-query'
import {
  mapResponseToAnalyticsData,
  mapMultiResponseToAnalyticsData,
} from './infra-monitoring-queries'

const mockMultiResponse: InfraMonitoringMultiResponse = {
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

// TODO(raulb): Remove this mock once API always returns multi-attribute format
const mockSingleResponse: InfraMonitoringSingleResponse = {
  data: [
    {
      period_start: '2024-01-02 03:04:00',
      disk_io_budget: '75.5',
    },
    {
      period_start: '2024-01-02 04:04:00',
      disk_io_budget: '80.2',
    },
  ],
  format: 'percent',
  total: 155.7,
  totalAverage: 77.85,
  yAxisLimit: 100,
}

describe('mapResponseToAnalyticsData', () => {
  describe('multi-attribute response format', () => {
    it('maps attribute series and coerces values to numbers', () => {
      const result = mapResponseToAnalyticsData(mockMultiResponse, ['max_cpu_usage', 'ram_usage'])

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
      const result = mapResponseToAnalyticsData(mockMultiResponse, [
        'max_cpu_usage',
        'ram_usage',
        'pg_stat_database_num_backends',
      ])

      expect(result.max_cpu_usage).toBeDefined()
      expect(result.ram_usage).toBeDefined()
      expect(result.pg_stat_database_num_backends).toBeUndefined()
    })

    it('handles single attribute the same as multiple attributes', () => {
      const singleResult = mapResponseToAnalyticsData(mockMultiResponse, ['max_cpu_usage'])
      const multiResult = mapResponseToAnalyticsData(mockMultiResponse, [
        'max_cpu_usage',
        'ram_usage',
      ])

      expect(singleResult.max_cpu_usage).toStrictEqual(multiResult.max_cpu_usage)
    })
  })

  // TODO(raulb): Remove this test block once API always returns multi-attribute format
  describe('single-attribute response format (legacy)', () => {
    it('maps single-attribute response and coerces values to numbers', () => {
      const result = mapResponseToAnalyticsData(mockSingleResponse as InfraMonitoringMultiData, [
        'disk_io_budget',
      ])

      expect(result.disk_io_budget?.data).toStrictEqual([
        {
          period_start: '2024-01-02 03:04:00',
          periodStartFormatted: '03:04 02 Jan',
          disk_io_budget: 75.5,
        },
        {
          period_start: '2024-01-02 04:04:00',
          periodStartFormatted: '04:04 02 Jan',
          disk_io_budget: 80.2,
        },
      ])

      expect(result.disk_io_budget).toMatchObject({
        format: 'percent',
        total: 155.7,
        yAxisLimit: 100,
      })
    })

    it('returns empty object when no attributes provided', () => {
      const result = mapResponseToAnalyticsData(mockSingleResponse as InfraMonitoringMultiData, [])

      expect(result).toStrictEqual({})
    })
  })

  describe('output format consistency', () => {
    it('produces the same output structure for both response formats', () => {
      // Create equivalent responses in both formats for the same data
      const multiFormat: InfraMonitoringMultiResponse = {
        data: [{ period_start: '2024-01-02 03:04:00', values: { disk_io_budget: '75.5' } }],
        series: {
          disk_io_budget: { format: 'percent', total: 75.5, totalAverage: 75.5, yAxisLimit: 100 },
        },
      }

      const singleFormat: InfraMonitoringSingleResponse = {
        data: [{ period_start: '2024-01-02 03:04:00', disk_io_budget: '75.5' }],
        format: 'percent',
        total: 75.5,
        totalAverage: 75.5,
        yAxisLimit: 100,
      }

      const multiResult = mapResponseToAnalyticsData(multiFormat, ['disk_io_budget'])
      const singleResult = mapResponseToAnalyticsData(singleFormat as InfraMonitoringMultiData, [
        'disk_io_budget',
      ])

      // Both should produce identical output
      expect(singleResult.disk_io_budget).toStrictEqual(multiResult.disk_io_budget)
    })
  })
})

// Test deprecated alias still works
describe('mapMultiResponseToAnalyticsData (deprecated)', () => {
  it('is an alias for mapResponseToAnalyticsData', () => {
    expect(mapMultiResponseToAnalyticsData).toBe(mapResponseToAnalyticsData)
  })
})
