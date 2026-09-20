import { describe, expect, it } from 'vitest'

import {
  parseConnectionsData,
  parseInfrastructureMetrics,
  parseNumericValue,
} from './DatabaseInfrastructureSection.utils'
import type {
  InfraMonitoringMultiResponse,
  InfraMonitoringSingleResponse,
} from '@/data/analytics/infra-monitoring-query'

describe('parseNumericValue', () => {
  it('returns number value as-is', () => {
    expect(parseNumericValue(42)).toBe(42)
    expect(parseNumericValue(0)).toBe(0)
    expect(parseNumericValue(3.14)).toBe(3.14)
  })

  it('parses valid string numbers', () => {
    expect(parseNumericValue('42')).toBe(42)
    expect(parseNumericValue('3.14')).toBe(3.14)
    expect(parseNumericValue('0')).toBe(0)
  })

  it('returns 0 for invalid string values', () => {
    expect(parseNumericValue('invalid')).toBe(0)
    expect(parseNumericValue('')).toBe(0)
    expect(parseNumericValue('NaN')).toBe(0)
  })

  it('returns 0 for undefined', () => {
    expect(parseNumericValue(undefined)).toBe(0)
  })
})

describe('parseInfrastructureMetrics', () => {
  it('returns null for undefined data', () => {
    expect(parseInfrastructureMetrics(undefined)).toBe(null)
  })

  it('parses valid metrics from response', () => {
    const mockResponse: InfraMonitoringMultiResponse = {
      data: [],
      series: {
        avg_cpu_usage: { format: 'percent', total: 150, totalAverage: 50, yAxisLimit: 100 },
        ram_usage: { format: 'bytes', total: 180, totalAverage: 60, yAxisLimit: 100 },
        disk_fs_used_system: {
          format: 'bytes',
          total: 20,
          totalAverage: 20,
          yAxisLimit: 100,
        },
        disk_fs_used_wal: {
          format: 'bytes',
          total: 10,
          totalAverage: 10,
          yAxisLimit: 100,
        },
        pg_database_size: {
          format: 'bytes',
          total: 30,
          totalAverage: 30,
          yAxisLimit: 100,
        },
        disk_fs_size: {
          format: 'bytes',
          total: 200,
          totalAverage: 200,
          yAxisLimit: 100,
        },
        disk_io_consumption: {
          format: 'percent',
          total: 210,
          totalAverage: 70,
          yAxisLimit: 100,
        },
      },
    }

    const result = parseInfrastructureMetrics(mockResponse)

    expect(result).toEqual({
      cpu: { current: 50, max: 100 },
      ram: { current: 60, max: 100 },
      disk: { current: 30, max: 100 },
      diskIo: { current: 70, max: 100 },
    })
  })

  it('handles string values in metrics', () => {
    const mockResponse: InfraMonitoringMultiResponse = {
      data: [],
      series: {
        avg_cpu_usage: { format: 'percent', total: 150, totalAverage: '50.5', yAxisLimit: 100 },
        ram_usage: { format: 'bytes', total: 180, totalAverage: '60.8', yAxisLimit: 100 },
        disk_fs_used_system: {
          format: 'bytes',
          total: 20,
          totalAverage: '20.4',
          yAxisLimit: 100,
        },
        disk_fs_used_wal: {
          format: 'bytes',
          total: 10,
          totalAverage: '10.2',
          yAxisLimit: 100,
        },
        pg_database_size: {
          format: 'bytes',
          total: 30,
          totalAverage: '30.5',
          yAxisLimit: 100,
        },
        disk_fs_size: {
          format: 'bytes',
          total: 200,
          totalAverage: '200.0',
          yAxisLimit: 100,
        },
        disk_io_consumption: {
          format: 'percent',
          total: 210,
          totalAverage: '70.2',
          yAxisLimit: 100,
        },
      },
    }

    const result = parseInfrastructureMetrics(mockResponse)

    expect(result).toEqual({
      cpu: { current: 50.5, max: 100 },
      ram: { current: 60.8, max: 100 },
      disk: { current: 30.55, max: 100 },
      diskIo: { current: 70.2, max: 100 },
    })
  })

  it('returns 0 for missing metrics', () => {
    const mockResponse: InfraMonitoringMultiResponse = {
      data: [],
      series: {},
    }

    const result = parseInfrastructureMetrics(mockResponse)

    expect(result).toEqual({
      cpu: { current: 0, max: 100 },
      ram: { current: 0, max: 100 },
      disk: { current: 0, max: 100 },
      diskIo: { current: 0, max: 100 },
    })
  })

  it('handles partial metrics data', () => {
    const mockResponse: InfraMonitoringMultiResponse = {
      data: [],
      series: {
        avg_cpu_usage: { format: 'percent', total: 150, totalAverage: 50, yAxisLimit: 100 },
      },
    }

    const result = parseInfrastructureMetrics(mockResponse)

    expect(result).toEqual({
      cpu: { current: 50, max: 100 },
      ram: { current: 0, max: 100 },
      disk: { current: 0, max: 100 },
      diskIo: { current: 0, max: 100 },
    })
  })

  it('handles single-response format (legacy)', () => {
    const mockResponse: InfraMonitoringSingleResponse = {
      data: [],
      format: 'percent',
      total: 150,
      totalAverage: 50,
      yAxisLimit: 100,
    }

    const result = parseInfrastructureMetrics(mockResponse)

    expect(result).toEqual({
      cpu: { current: 0, max: 100 },
      ram: { current: 0, max: 100 },
      disk: { current: 0, max: 100 },
      diskIo: { current: 0, max: 100 },
    })
  })
})

describe('parseConnectionsData', () => {
  const buildResponse = (
    values: Array<string | number | undefined>
  ): InfraMonitoringMultiResponse => ({
    data: values.map((v, i) => ({
      period_start: `2026-05-22T00:0${i}:00.000Z`,
      values: { pg_stat_database_num_backends: v as string | undefined },
    })),
    series: {
      pg_stat_database_num_backends: {
        format: 'number',
        total: 0,
        totalAverage: 0,
        yAxisLimit: 100,
      },
    },
  })

  it('returns zeros when data is undefined', () => {
    expect(parseConnectionsData(undefined, undefined)).toEqual({ peak: 0, max: 0 })
    expect(parseConnectionsData(undefined, { maxConnections: 100 })).toEqual({
      peak: 0,
      max: 100,
    })
  })

  it('returns the peak value across the window, not totalAverage', () => {
    const mockInfraData = buildResponse([4, 4, 6, 4, 5, 4])
    // totalAverage in series is intentionally stale to ensure we ignore it
    mockInfraData.series.pg_stat_database_num_backends.totalAverage = 25

    const result = parseConnectionsData(mockInfraData, { maxConnections: 100 })

    expect(result).toEqual({ peak: 6, max: 100 })
  })

  it('rounds the peak value', () => {
    const mockInfraData = buildResponse([3, 5.6, 4])

    const result = parseConnectionsData(mockInfraData, { maxConnections: 100 })

    expect(result).toEqual({ peak: 6, max: 100 })
  })

  it('handles string values when computing peak', () => {
    const mockInfraData = buildResponse(['4', '7', '5.4'])

    const result = parseConnectionsData(mockInfraData, { maxConnections: 100 })

    expect(result).toEqual({ peak: 7, max: 100 })
  })

  it('skips missing values when computing peak', () => {
    const mockInfraData = buildResponse([5, undefined, 7, undefined])

    const result = parseConnectionsData(mockInfraData, { maxConnections: 100 })

    expect(result).toEqual({ peak: 7, max: 100 })
  })

  it('skips empty-string values when computing peak', () => {
    const mockInfraData = buildResponse(['5', '', '7', ''])

    const result = parseConnectionsData(mockInfraData, { maxConnections: 100 })

    expect(result).toEqual({ peak: 7, max: 100 })
  })

  it('returns peak connections even when maxConnectionsData is undefined', () => {
    const mockInfraData = buildResponse([4, 9, 6])

    const result = parseConnectionsData(mockInfraData, undefined)

    expect(result).toEqual({ peak: 9, max: 0 })
  })

  it('returns 0 max when maxConnections is missing from data object', () => {
    const mockInfraData = buildResponse([4])

    const result = parseConnectionsData(mockInfraData, {})

    expect(result).toEqual({ peak: 4, max: 0 })
  })

  it('returns 0 peak when data array is empty', () => {
    const mockInfraData: InfraMonitoringMultiResponse = {
      data: [],
      series: {},
    }

    const result = parseConnectionsData(mockInfraData, { maxConnections: 100 })

    expect(result).toEqual({ peak: 0, max: 100 })
  })

  it('returns 0 peak when connections metric is missing from data points', () => {
    const mockInfraData: InfraMonitoringMultiResponse = {
      data: [
        {
          period_start: '2026-05-22T00:00:00.000Z',
          values: { avg_cpu_usage: '50' },
        },
      ],
      series: {},
    }

    const result = parseConnectionsData(mockInfraData, { maxConnections: 100 })

    expect(result).toEqual({ peak: 0, max: 100 })
  })

  it('handles single-response format (legacy)', () => {
    const mockInfraData: InfraMonitoringSingleResponse = {
      data: [],
      format: 'number',
      total: 150,
      totalAverage: 25,
      yAxisLimit: 100,
    }

    const result = parseConnectionsData(mockInfraData, { maxConnections: 100 })

    expect(result).toEqual({ peak: 0, max: 100 })
  })
})
