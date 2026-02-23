import type {
  InfraMonitoringMultiResponse,
  InfraMonitoringSingleResponse,
} from 'data/analytics/infra-monitoring-query'
import { describe, expect, it } from 'vitest'

import {
  parseConnectionsData,
  parseInfrastructureMetrics,
  parseMemoryPressure,
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

describe('parseMemoryPressure', () => {
  const MB = 1024 * 1024 // bytes in 1MB
  const GB = 1024 * MB // bytes in 1GB

  // Helper to create mock data
  const createMockData = (
    ramUsedMB: number,
    ramCacheMB: number,
    ramFreeMB: number,
    swapMB: number
  ) =>
    ({
      data: [],
      series: {
        ram_usage_used: {
          format: 'bytes',
          total: 0,
          totalAverage: ramUsedMB * MB,
          yAxisLimit: 100,
        },
        ram_usage_cache_and_buffers: {
          format: 'bytes',
          total: 0,
          totalAverage: ramCacheMB * MB,
          yAxisLimit: 100,
        },
        ram_usage_free: {
          format: 'bytes',
          total: 0,
          totalAverage: ramFreeMB * MB,
          yAxisLimit: 100,
        },
        swap_usage: { format: 'bytes', total: 0, totalAverage: swapMB * MB, yAxisLimit: 100 },
      },
    }) as InfraMonitoringMultiResponse

  it('returns null for undefined data', () => {
    expect(parseMemoryPressure(undefined)).toBe(null)
  })

  it('returns null when total RAM is 0', () => {
    const mockData = createMockData(0, 0, 0, 0)
    expect(parseMemoryPressure(mockData)).toBe(null)
  })

  describe('Healthy pressure (swap < max(16MB, 0.1% RAM))', () => {
    it('classifies as Healthy with no swap on 1GB RAM', () => {
      const mockData = createMockData(512, 256, 256, 0) // 1GB total, 0 swap
      const result = parseMemoryPressure(mockData)

      expect(result?.level).toBe('Healthy')
      expect(result?.swapUsedMB).toBe(0)
    })

    it('classifies as Healthy with 10MB swap on 1GB RAM (below 64MB threshold)', () => {
      const mockData = createMockData(512, 256, 256, 10) // 1GB total, 10MB swap
      const result = parseMemoryPressure(mockData)

      expect(result?.level).toBe('Healthy')
      expect(result?.swapUsedMB).toBe(10)
    })

    it('classifies as Healthy with 50MB swap on 8GB RAM (below 80MB = 1% threshold)', () => {
      const mockData = createMockData(4096, 2048, 2048, 50) // 8GB total, 50MB swap
      const result = parseMemoryPressure(mockData)

      expect(result?.level).toBe('Healthy')
      expect(result?.swapUsedMB).toBe(50)
    })
  })

  describe('Elevated pressure (swap >= max(64MB, 1% RAM))', () => {
    it('classifies as Elevated with 64MB swap on 1GB RAM (hits absolute threshold)', () => {
      const mockData = createMockData(512, 256, 256, 64) // 1GB total, 64MB swap
      const result = parseMemoryPressure(mockData)

      expect(result?.level).toBe('Elevated')
      expect(result?.swapUsedMB).toBe(64)
    })

    it('classifies as Elevated with 100MB swap on 8GB RAM (1.25% of RAM)', () => {
      const mockData = createMockData(4096, 2048, 2048, 100) // 8GB total, 100MB swap
      const result = parseMemoryPressure(mockData)

      expect(result?.level).toBe('Elevated')
      expect(result?.swapUsedMB).toBe(100)
    })

    it('classifies as Elevated with 200MB swap on 16GB RAM (1.25% of RAM)', () => {
      const mockData = createMockData(8192, 4096, 4096, 200) // 16GB total, 200MB swap
      const result = parseMemoryPressure(mockData)

      expect(result?.level).toBe('Elevated')
      expect(result?.swapUsedMB).toBe(200)
    })
  })

  describe('Unhealthy pressure (swap >= max(256MB, 3% RAM))', () => {
    it('classifies as Unhealthy with 256MB swap on 1GB RAM (hits absolute threshold)', () => {
      const mockData = createMockData(512, 256, 256, 256) // 1GB total, 256MB swap
      const result = parseMemoryPressure(mockData)

      expect(result?.level).toBe('Unhealthy')
      expect(result?.swapUsedMB).toBe(256)
    })

    it('classifies as Unhealthy with 300MB swap on 8GB RAM (3.75% of RAM)', () => {
      const mockData = createMockData(4096, 2048, 2048, 300) // 8GB total, 300MB swap
      const result = parseMemoryPressure(mockData)

      expect(result?.level).toBe('Unhealthy')
      expect(result?.swapUsedMB).toBe(300)
    })

    it('classifies as Unhealthy with 1GB swap on 32GB RAM (3.125% of RAM)', () => {
      const mockData = createMockData(16384, 8192, 8192, 1024) // 32GB total, 1GB swap
      const result = parseMemoryPressure(mockData)

      expect(result?.level).toBe('Unhealthy')
      expect(result?.swapUsedMB).toBe(1024)
    })
  })

  describe('Hybrid threshold behavior', () => {
    it('uses absolute threshold (64MB) for small RAM (1GB)', () => {
      // On 1GB RAM: 1% = 10MB, so 64MB absolute threshold applies
      const healthyMock = createMockData(512, 256, 256, 63) // Just below threshold
      const elevatedMock = createMockData(512, 256, 256, 64) // At threshold

      expect(parseMemoryPressure(healthyMock)?.level).toBe('Healthy')
      expect(parseMemoryPressure(elevatedMock)?.level).toBe('Elevated')
    })

    it('uses percentage threshold (1% RAM) for large RAM (16GB)', () => {
      // On 16GB RAM: 1% = 163.84MB, so percentage threshold applies (not 64MB)
      const healthyMock = createMockData(8192, 4096, 4096, 163) // Just below 1%
      const elevatedMock = createMockData(8192, 4096, 4096, 164) // At 1%

      expect(parseMemoryPressure(healthyMock)?.level).toBe('Healthy')
      expect(parseMemoryPressure(elevatedMock)?.level).toBe('Elevated')
    })
  })

  describe('Additional metrics', () => {
    it('calculates ramUsedPercent correctly', () => {
      const mockData = createMockData(600, 200, 200, 50) // 60% used, 20% cache, 20% free
      const result = parseMemoryPressure(mockData)

      expect(result?.ramUsedPercent).toBeCloseTo(60, 1)
    })

    it('calculates cachePercent correctly', () => {
      const mockData = createMockData(400, 400, 200, 50) // 40% used, 40% cache, 20% free
      const result = parseMemoryPressure(mockData)

      expect(result?.cachePercent).toBeCloseTo(40, 1)
    })

    it('calculates totalRamMB correctly', () => {
      const mockData = createMockData(512, 256, 256, 50) // 1024MB total RAM
      const result = parseMemoryPressure(mockData)

      expect(result?.totalRamMB).toBe(1024)
    })

    it('calculates swapPercent correctly', () => {
      const mockData = createMockData(512, 256, 256, 100) // 1024MB total, 100MB swap = ~9.77%
      const result = parseMemoryPressure(mockData)

      expect(result?.swapPercent).toBeCloseTo(9.77, 1)
    })

    it('handles string values in metrics', () => {
      const mockData = {
        data: [],
        series: {
          ram_usage_used: { format: 'bytes', total: 0, totalAverage: '524288000', yAxisLimit: 100 }, // ~500MB as string
          ram_usage_cache_and_buffers: {
            format: 'bytes',
            total: 0,
            totalAverage: '262144000',
            yAxisLimit: 100,
          }, // ~250MB
          ram_usage_free: { format: 'bytes', total: 0, totalAverage: '262144000', yAxisLimit: 100 }, // ~250MB
          swap_usage: { format: 'bytes', total: 0, totalAverage: '10485760', yAxisLimit: 100 }, // 10MB
        },
      } as InfraMonitoringMultiResponse

      const result = parseMemoryPressure(mockData)

      expect(result?.level).toBe('Healthy')
      expect(result?.swapUsedMB).toBeCloseTo(10, 0)
    })
  })
})
