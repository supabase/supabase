import type {
  InfraMonitoringMultiResponse,
  InfraMonitoringSingleResponse,
} from 'data/analytics/infra-monitoring-query'
import { describe, expect, it } from 'vitest'

import {
  parseConnectionsData,
  parseInfrastructureMetrics,
  parseNumericValue,
} from './DatabaseInfrastructureSection.utils'

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
      disk: { current: 70, max: 100 },
    })
  })

  it('handles string values in metrics', () => {
    const mockResponse: InfraMonitoringMultiResponse = {
      data: [],
      series: {
        avg_cpu_usage: { format: 'percent', total: 150, totalAverage: '50.5', yAxisLimit: 100 },
        ram_usage: { format: 'bytes', total: 180, totalAverage: '60.8', yAxisLimit: 100 },
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
      disk: { current: 70.2, max: 100 },
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
    })
  })
})

describe('parseConnectionsData', () => {
  it('returns zeros when data is undefined', () => {
    expect(parseConnectionsData(undefined, undefined)).toEqual({ current: 0, max: 0 })
    expect(parseConnectionsData(undefined, { maxConnections: 100 })).toEqual({
      current: 0,
      max: 0,
    })
  })

  it('parses connections data correctly', () => {
    const mockInfraData: InfraMonitoringMultiResponse = {
      data: [],
      series: {
        pg_stat_database_num_backends: {
          format: 'number',
          total: 150,
          totalAverage: 25.5,
          yAxisLimit: 100,
        },
      },
    }

    const mockMaxData = { maxConnections: 100 }

    const result = parseConnectionsData(mockInfraData, mockMaxData)

    expect(result).toEqual({ current: 26, max: 100 }) // 25.5 rounded to 26
  })

  it('handles string values for connections', () => {
    const mockInfraData: InfraMonitoringMultiResponse = {
      data: [],
      series: {
        pg_stat_database_num_backends: {
          format: 'number',
          total: 150,
          totalAverage: '30.7',
          yAxisLimit: 100,
        },
      },
    }

    const mockMaxData = { maxConnections: 100 }

    const result = parseConnectionsData(mockInfraData, mockMaxData)

    expect(result).toEqual({ current: 31, max: 100 }) // 30.7 rounded to 31
  })

  it('returns current connections even when maxConnectionsData is undefined', () => {
    const mockInfraData: InfraMonitoringMultiResponse = {
      data: [],
      series: {
        pg_stat_database_num_backends: {
          format: 'number',
          total: 150,
          totalAverage: 25,
          yAxisLimit: 100,
        },
      },
    }

    const result = parseConnectionsData(mockInfraData, undefined)

    expect(result).toEqual({ current: 25, max: 0 })
  })

  it('returns 0 max when maxConnections is missing from data object', () => {
    const mockInfraData: InfraMonitoringMultiResponse = {
      data: [],
      series: {
        pg_stat_database_num_backends: {
          format: 'number',
          total: 150,
          totalAverage: 25,
          yAxisLimit: 100,
        },
      },
    }

    const mockMaxData = {}

    const result = parseConnectionsData(mockInfraData, mockMaxData)

    expect(result).toEqual({ current: 25, max: 0 })
  })

  it('returns 0 current when connections metric is missing', () => {
    const mockInfraData: InfraMonitoringMultiResponse = {
      data: [],
      series: {},
    }

    const mockMaxData = { maxConnections: 100 }

    const result = parseConnectionsData(mockInfraData, mockMaxData)

    expect(result).toEqual({ current: 0, max: 100 })
  })

  it('handles single-response format (legacy)', () => {
    const mockInfraData: InfraMonitoringSingleResponse = {
      data: [],
      format: 'number',
      total: 150,
      totalAverage: 25,
      yAxisLimit: 100,
    }

    const mockMaxData = { maxConnections: 100 }

    const result = parseConnectionsData(mockInfraData, mockMaxData)

    expect(result).toEqual({ current: 0, max: 100 })
  })
})
