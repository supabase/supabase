import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import type {
  InfraMonitoringMultiData,
  InfraMonitoringMultiResponse,
  InfraMonitoringSingleResponse,
} from './infra-monitoring-query'
import {
  aggregate1MinTo2Min,
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

describe('2m interval aggregation', () => {
  it('aggregates 1m data points into 2m buckets for multi-attribute response', () => {
    const mock1MinData: InfraMonitoringMultiResponse = {
      data: [
        {
          period_start: '2024-01-02 03:00:00',
          values: { max_cpu_usage: '10', ram_usage: '100' },
        },
        {
          period_start: '2024-01-02 03:01:00',
          values: { max_cpu_usage: '20', ram_usage: '200' },
        },
        {
          period_start: '2024-01-02 03:02:00',
          values: { max_cpu_usage: '15', ram_usage: '150' },
        },
        {
          period_start: '2024-01-02 03:03:00',
          values: { max_cpu_usage: '25', ram_usage: '250' },
        },
      ],
      series: {
        max_cpu_usage: { format: 'percent', total: 70, totalAverage: 17.5, yAxisLimit: 100 },
        ram_usage: { format: 'bytes', total: 700, totalAverage: 175, yAxisLimit: 200 },
      },
    }

    const responseWith2m = {
      ...mock1MinData,
      _originalInterval: '2m',
    } as InfraMonitoringMultiData & { _originalInterval?: string }

    const result = mapResponseToAnalyticsData(responseWith2m, ['max_cpu_usage', 'ram_usage'])

    expect(result.max_cpu_usage?.data).toHaveLength(2)
    // Check that values are correctly averaged
    expect(result.max_cpu_usage?.data[0].max_cpu_usage).toBe(15) // (10 + 20) / 2
    expect(result.max_cpu_usage?.data[1].max_cpu_usage).toBe(20) // (15 + 25) / 2
    // Check that buckets are on even minutes
    expect(dayjs(result.max_cpu_usage?.data[0].period_start).minute() % 2).toBe(0)
    expect(dayjs(result.max_cpu_usage?.data[1].period_start).minute() % 2).toBe(0)

    expect(result.ram_usage?.data[0].ram_usage).toBe(150) // (100 + 200) / 2
    expect(result.ram_usage?.data[1].ram_usage).toBe(200) // (150 + 250) / 2
  })

  it('aggregates 1m data points into 2m buckets for single-attribute response', () => {
    const mock1MinData: InfraMonitoringSingleResponse = {
      data: [
        { period_start: '2024-01-02 03:00:00', disk_io_budget: '10' },
        { period_start: '2024-01-02 03:01:00', disk_io_budget: '20' },
        { period_start: '2024-01-02 03:02:00', disk_io_budget: '15' },
        { period_start: '2024-01-02 03:03:00', disk_io_budget: '25' },
      ],
      format: 'percent',
      total: 70,
      totalAverage: 17.5,
      yAxisLimit: 100,
    }

    const responseWith2m = {
      ...mock1MinData,
      _originalInterval: '2m',
    } as InfraMonitoringMultiData & { _originalInterval?: string }

    const result = mapResponseToAnalyticsData(responseWith2m, ['disk_io_budget'])

    expect(result.disk_io_budget?.data).toHaveLength(2)
    // Check that values are correctly averaged
    expect(result.disk_io_budget?.data[0].disk_io_budget).toBe(15) // (10 + 20) / 2
    expect(result.disk_io_budget?.data[1].disk_io_budget).toBe(20) // (15 + 25) / 2
    // Check that buckets are on even minutes
    expect(dayjs(result.disk_io_budget?.data[0].period_start).minute() % 2).toBe(0)
    expect(dayjs(result.disk_io_budget?.data[1].period_start).minute() % 2).toBe(0)
  })

  it('does not aggregate when interval is not 2m', () => {
    const result = mapResponseToAnalyticsData(mockMultiResponse, ['max_cpu_usage', 'ram_usage'])

    expect(result.max_cpu_usage?.data).toHaveLength(2)
    expect(result.max_cpu_usage?.data[0].max_cpu_usage).toBe(1.5)
    expect(result.max_cpu_usage?.data[1].max_cpu_usage).toBe(0)
  })

  it('handles odd number of 1m data points', () => {
    const mock1MinData: InfraMonitoringMultiResponse = {
      data: [
        {
          period_start: '2024-01-02 03:00:00',
          values: { max_cpu_usage: '10' },
        },
        {
          period_start: '2024-01-02 03:01:00',
          values: { max_cpu_usage: '20' },
        },
        {
          period_start: '2024-01-02 03:02:00',
          values: { max_cpu_usage: '15' },
        },
      ],
      series: {
        max_cpu_usage: { format: 'percent', total: 45, totalAverage: 15, yAxisLimit: 100 },
      },
    }

    const responseWith2m = {
      ...mock1MinData,
      _originalInterval: '2m',
    } as InfraMonitoringMultiData & { _originalInterval?: string }

    const result = mapResponseToAnalyticsData(responseWith2m, ['max_cpu_usage'])

    expect(result.max_cpu_usage?.data).toHaveLength(2)
    expect(result.max_cpu_usage?.data[0].max_cpu_usage).toBe(15) // (10 + 20) / 2
    expect(result.max_cpu_usage?.data[1].max_cpu_usage).toBe(15) // single point in second bucket
  })
})

describe('aggregate1MinTo2Min', () => {
  it('aggregates 1-minute data points into 2-minute buckets with correct averages', () => {
    const dataPoints = [
      {
        period_start: '2024-01-02T03:00:00Z',
        periodStartFormatted: '03:00 02 Jan',
        max_cpu_usage: 10,
        ram_usage: 100,
      },
      {
        period_start: '2024-01-02T03:01:00Z',
        periodStartFormatted: '03:01 02 Jan',
        max_cpu_usage: 20,
        ram_usage: 200,
      },
      {
        period_start: '2024-01-02T03:02:00Z',
        periodStartFormatted: '03:02 02 Jan',
        max_cpu_usage: 15,
        ram_usage: 150,
      },
      {
        period_start: '2024-01-02T03:03:00Z',
        periodStartFormatted: '03:03 02 Jan',
        max_cpu_usage: 25,
        ram_usage: 250,
      },
    ]

    const result = aggregate1MinTo2Min(dataPoints)

    expect(result).toHaveLength(2)
    // Check that first bucket contains 03:00 and 03:01 data averaged
    expect(result[0].max_cpu_usage).toBe(15) // (10 + 20) / 2
    expect(result[0].ram_usage).toBe(150) // (100 + 200) / 2
    expect(result[0].periodStartFormatted).toBeDefined()
    expect(dayjs(result[0].period_start).minute() % 2).toBe(0) // Should be even minute

    // Check that second bucket contains 03:02 and 03:03 data averaged
    expect(result[1].max_cpu_usage).toBe(20) // (15 + 25) / 2
    expect(result[1].ram_usage).toBe(200) // (150 + 250) / 2
    expect(result[1].periodStartFormatted).toBeDefined()
    expect(dayjs(result[1].period_start).minute() % 2).toBe(0) // Should be even minute
  })

  it('handles odd number of data points correctly', () => {
    const dataPoints = [
      {
        period_start: '2024-01-02T03:00:00Z',
        max_cpu_usage: 10,
      },
      {
        period_start: '2024-01-02T03:01:00Z',
        max_cpu_usage: 20,
      },
      {
        period_start: '2024-01-02T03:02:00Z',
        max_cpu_usage: 15,
      },
    ]

    const result = aggregate1MinTo2Min(dataPoints)

    expect(result).toHaveLength(2)
    expect(result[0].max_cpu_usage).toBe(15) // (10 + 20) / 2
    expect(result[1].max_cpu_usage).toBe(15) // single point in second bucket
  })

  it('handles single data point', () => {
    const dataPoints = [
      {
        period_start: '2024-01-02T03:00:00Z',
        max_cpu_usage: 10,
      },
    ]

    const result = aggregate1MinTo2Min(dataPoints)

    expect(result).toHaveLength(1)
    expect(result[0].max_cpu_usage).toBe(10)
    expect(result[0].periodStartFormatted).toBeDefined()
  })

  it('handles empty array', () => {
    const result = aggregate1MinTo2Min([])
    expect(result).toHaveLength(0)
  })

  it('handles multiple attributes correctly', () => {
    const dataPoints = [
      {
        period_start: '2024-01-02T03:00:00Z',
        attr1: 5,
        attr2: 10,
        attr3: 15,
      },
      {
        period_start: '2024-01-02T03:01:00Z',
        attr1: 10,
        attr2: 20,
        attr3: 30,
      },
      {
        period_start: '2024-01-02T03:02:00Z',
        attr1: 15,
        attr2: 30,
        attr3: 45,
      },
    ]

    const result = aggregate1MinTo2Min(dataPoints)

    expect(result).toHaveLength(2)
    expect(result[0].attr1).toBe(7.5) // (5 + 10) / 2
    expect(result[0].attr2).toBe(15) // (10 + 20) / 2
    expect(result[0].attr3).toBe(22.5) // (15 + 30) / 2
    expect(result[1].attr1).toBe(15) // single point
    expect(result[1].attr2).toBe(30)
    expect(result[1].attr3).toBe(45)
  })

  it('ignores non-numeric values when aggregating', () => {
    const dataPoints = [
      {
        period_start: '2024-01-02T03:00:00Z',
        max_cpu_usage: 10,
        label: 'test', // string value
      },
      {
        period_start: '2024-01-02T03:01:00Z',
        max_cpu_usage: 20,
        label: 'test2',
      },
    ]

    const result = aggregate1MinTo2Min(dataPoints)

    expect(result).toHaveLength(1)
    expect(result[0].max_cpu_usage).toBe(15)
    expect(result[0].label).toBeUndefined()
  })

  it('handles data points across different 2-minute buckets', () => {
    const dataPoints = [
      {
        period_start: '2024-01-02T03:00:00Z',
        value: 10,
      },
      {
        period_start: '2024-01-02T03:01:00Z',
        value: 20,
      },
      {
        period_start: '2024-01-02T03:02:00Z',
        value: 15,
      },
      {
        period_start: '2024-01-02T03:03:00Z',
        value: 25,
      },
      {
        period_start: '2024-01-02T03:04:00Z',
        value: 30,
      },
      {
        period_start: '2024-01-02T03:05:00Z',
        value: 35,
      },
    ]

    const result = aggregate1MinTo2Min(dataPoints)

    expect(result).toHaveLength(3)
    // First bucket: 03:00 and 03:01
    expect(result[0].value).toBe(15) // (10 + 20) / 2
    expect(dayjs(result[0].period_start).minute() % 2).toBe(0)
    // Second bucket: 03:02 and 03:03
    expect(result[1].value).toBe(20) // (15 + 25) / 2
    expect(dayjs(result[1].period_start).minute() % 2).toBe(0)
    // Third bucket: 03:04 and 03:05
    expect(result[2].value).toBe(32.5) // (30 + 35) / 2
    expect(dayjs(result[2].period_start).minute() % 2).toBe(0)
  })

  it('sorts results by period_start', () => {
    const dataPoints = [
      {
        period_start: '2024-01-02T03:02:00Z',
        value: 15,
      },
      {
        period_start: '2024-01-02T03:00:00Z',
        value: 10,
      },
      {
        period_start: '2024-01-02T03:01:00Z',
        value: 20,
      },
    ]

    const result = aggregate1MinTo2Min(dataPoints)

    expect(result).toHaveLength(2)
    expect(dayjs(result[0].period_start).isBefore(dayjs(result[1].period_start))).toBe(true)
  })

  it('always includes periodStartFormatted in result', () => {
    const dataPoints = [
      {
        period_start: '2024-01-02T03:00:00Z',
        max_cpu_usage: 10,
      },
    ]

    const result = aggregate1MinTo2Min(dataPoints)

    expect(result[0].periodStartFormatted).toBeDefined()
    expect(typeof result[0].periodStartFormatted).toBe('string')
  })
})
