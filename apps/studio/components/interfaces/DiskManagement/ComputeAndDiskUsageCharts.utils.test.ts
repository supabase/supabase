import { describe, expect, test } from 'vitest'

import {
  buildUsageChartData,
  clampPercentage,
  formatUsagePercent,
  getComputeUsageSummary,
  getDiskUsageSummary,
  getPeakChartValue,
  getUsageMetricStatus,
  getWorstUsageMetricStatus,
  toNumber,
  type ComputeUsageChartDatum,
  type DiskUsageChartDatum,
} from './ComputeAndDiskUsageCharts.utils'
import type {
  InfraMonitoringMultiResponse,
  InfraMonitoringSingleResponse,
} from '@/data/analytics/infra-monitoring-query'

const GB = 1024 ** 3

const buildMultiResponse = (
  data: InfraMonitoringMultiResponse['data']
): InfraMonitoringMultiResponse => ({
  data,
  series: {},
})

describe('ComputeAndDiskUsageCharts utils', () => {
  describe('toNumber', () => {
    test('parses numeric strings', () => {
      expect(toNumber('42')).toBe(42)
      expect(toNumber('3.14')).toBe(3.14)
      expect(toNumber('-5')).toBe(-5)
    })

    test('passes through finite numbers', () => {
      expect(toNumber(0)).toBe(0)
      expect(toNumber(99)).toBe(99)
    })

    test('falls back to 0 for undefined, empty, and non-numeric values', () => {
      expect(toNumber(undefined)).toBe(0)
      expect(toNumber('')).toBe(0)
      expect(toNumber('not-a-number')).toBe(0)
    })

    test('falls back to 0 for non-finite values', () => {
      expect(toNumber(Infinity)).toBe(0)
      expect(toNumber('Infinity')).toBe(0)
      expect(toNumber(NaN)).toBe(0)
    })
  })

  describe('clampPercentage', () => {
    test('returns the value when within range', () => {
      expect(clampPercentage(50)).toBe(50)
    })

    test('clamps to the [0, 100] bounds', () => {
      expect(clampPercentage(-10)).toBe(0)
      expect(clampPercentage(150)).toBe(100)
    })

    test('keeps exact boundary values', () => {
      expect(clampPercentage(0)).toBe(0)
      expect(clampPercentage(100)).toBe(100)
    })
  })

  describe('formatUsagePercent', () => {
    test('renders an em dash for undefined', () => {
      expect(formatUsagePercent(undefined)).toBe('—')
    })

    test('renders a rounded whole-number percentage', () => {
      expect(formatUsagePercent(0)).toBe('0%')
      expect(formatUsagePercent(42.4)).toBe('42%')
      expect(formatUsagePercent(42.6)).toBe('43%')
      expect(formatUsagePercent(100)).toBe('100%')
    })
  })

  describe('getUsageMetricStatus', () => {
    test('returns default for undefined', () => {
      expect(getUsageMetricStatus(undefined)).toBe('default')
    })

    test('returns default below the warning threshold', () => {
      expect(getUsageMetricStatus(0)).toBe('default')
      expect(getUsageMetricStatus(74.9)).toBe('default')
    })

    test('returns warning between 75 and 90 (inclusive of 75)', () => {
      expect(getUsageMetricStatus(75)).toBe('warning')
      expect(getUsageMetricStatus(89.9)).toBe('warning')
    })

    test('returns negative at or above 90', () => {
      expect(getUsageMetricStatus(90)).toBe('negative')
      expect(getUsageMetricStatus(100)).toBe('negative')
    })
  })

  describe('getWorstUsageMetricStatus', () => {
    test('returns default with no values or all-default values', () => {
      expect(getWorstUsageMetricStatus()).toBe('default')
      expect(getWorstUsageMetricStatus(10, 20, undefined)).toBe('default')
    })

    test('escalates to warning when any value is in the warning band', () => {
      expect(getWorstUsageMetricStatus(10, 80, 50)).toBe('warning')
    })

    test('escalates to negative when any value is critical, regardless of others', () => {
      expect(getWorstUsageMetricStatus(80, 95, 10)).toBe('negative')
    })
  })

  describe('getPeakChartValue', () => {
    test('returns undefined for an empty array', () => {
      expect(getPeakChartValue([], 'maxCpuUsage')).toBeUndefined()
    })

    test('returns undefined when no values are numbers', () => {
      const data = [{ maxCpuUsage: undefined }, { maxCpuUsage: undefined }] as unknown as Array<
        Record<string, number>
      >
      expect(getPeakChartValue(data, 'maxCpuUsage')).toBeUndefined()
    })

    test('returns the maximum numeric value for the key', () => {
      const data = [{ value: 10 }, { value: 55 }, { value: 30 }]
      expect(getPeakChartValue(data, 'value')).toBe(55)
    })

    test('ignores non-numeric entries when computing the peak', () => {
      const data = [{ value: 10 }, { value: undefined }, { value: 42 }] as unknown as Array<
        Record<string, number>
      >
      expect(getPeakChartValue(data, 'value')).toBe(42)
    })
  })

  describe('buildUsageChartData', () => {
    test('returns empty series for undefined data', () => {
      expect(buildUsageChartData(undefined)).toEqual({
        computeChartData: [],
        diskChartData: [],
      })
    })

    test('returns empty series for the single-attribute response shape', () => {
      const singleResponse = {
        yAxisLimit: 0,
        format: '%',
        total: 0,
        totalAverage: 0,
        data: [{ period_start: '2024-01-01T00:00:00Z', max_cpu_usage: '50' }],
      } satisfies InfraMonitoringSingleResponse

      expect(buildUsageChartData(singleResponse)).toEqual({
        computeChartData: [],
        diskChartData: [],
      })
    })

    test('maps compute attributes and clamps them to [0, 100]', () => {
      const result = buildUsageChartData(
        buildMultiResponse([
          {
            period_start: '2024-01-01T00:00:00Z',
            values: {
              max_cpu_usage: '120', // over 100 -> clamped
              ram_usage: '-5', // under 0 -> clamped
              disk_io_consumption: '33',
            },
          },
        ])
      )

      expect(result.computeChartData).toEqual([
        {
          timestamp: '2024-01-01T00:00:00Z',
          maxCpuUsage: 100,
          ramUsage: 0,
          diskIoConsumption: 33,
        },
      ])
    })

    test('computes disk usage percentages relative to the disk size', () => {
      const result = buildUsageChartData(
        buildMultiResponse([
          {
            period_start: '2024-01-01T00:00:00Z',
            values: {
              pg_database_size: String(25 * GB),
              disk_fs_used_wal: String(25 * GB),
              disk_fs_used_system: String(10 * GB),
              disk_fs_size: String(100 * GB),
            },
          },
        ])
      )

      expect(result.diskChartData).toEqual([
        {
          timestamp: '2024-01-01T00:00:00Z',
          databaseBytes: 25 * GB,
          walBytes: 25 * GB,
          systemBytes: 10 * GB,
          diskSizeBytes: 100 * GB,
          databaseUsagePercent: 25,
          walUsagePercent: 25,
          systemUsagePercent: 10,
        },
      ])
    })

    test('drops disk points without a known disk size', () => {
      const result = buildUsageChartData(
        buildMultiResponse([
          {
            period_start: '2024-01-01T00:00:00Z',
            values: { pg_database_size: String(GB), disk_fs_size: '0' },
          },
          {
            period_start: '2024-01-02T00:00:00Z',
            values: { pg_database_size: String(GB), disk_fs_size: String(10 * GB) },
          },
        ])
      )

      // First point dropped (disk_fs_size = 0), compute still has both timestamps
      expect(result.diskChartData).toHaveLength(1)
      expect(result.diskChartData[0].timestamp).toBe('2024-01-02T00:00:00Z')
      expect(result.computeChartData).toHaveLength(2)
    })

    test('treats missing compute values as 0', () => {
      const result = buildUsageChartData(
        buildMultiResponse([{ period_start: '2024-01-01T00:00:00Z', values: {} }])
      )

      expect(result.computeChartData).toEqual([
        {
          timestamp: '2024-01-01T00:00:00Z',
          maxCpuUsage: 0,
          ramUsage: 0,
          diskIoConsumption: 0,
        },
      ])
    })
  })

  describe('getComputeUsageSummary', () => {
    test('returns undefined peaks and default status for empty data', () => {
      expect(getComputeUsageSummary([])).toEqual({
        peakCpuUsage: undefined,
        peakMemoryUsage: undefined,
        peakDiskIoUsage: undefined,
        peakComputeUsage: undefined,
        status: 'default',
      })
    })

    test('computes per-metric peaks, the overall peak, and the worst status', () => {
      const data: ComputeUsageChartDatum[] = [
        { timestamp: 't1', maxCpuUsage: 40, ramUsage: 92, diskIoConsumption: 10 },
        { timestamp: 't2', maxCpuUsage: 60, ramUsage: 80, diskIoConsumption: 20 },
      ]

      expect(getComputeUsageSummary(data)).toEqual({
        peakCpuUsage: 60,
        peakMemoryUsage: 92,
        peakDiskIoUsage: 20,
        peakComputeUsage: 92,
        status: 'negative', // memory peak of 92 is critical
      })
    })
  })

  describe('getDiskUsageSummary', () => {
    test('returns undefined usage and default status for empty data', () => {
      expect(getDiskUsageSummary([])).toEqual({
        latestDataPoint: undefined,
        usedBytes: 0,
        sizeBytes: 0,
        usagePercent: undefined,
        status: 'default',
      })
    })

    test('summarizes the latest data point and clamps the usage percentage', () => {
      const data: DiskUsageChartDatum[] = [
        {
          timestamp: 't1',
          databaseBytes: 10 * GB,
          walBytes: 0,
          systemBytes: 0,
          diskSizeBytes: 100 * GB,
          databaseUsagePercent: 10,
          walUsagePercent: 0,
          systemUsagePercent: 0,
        },
        {
          timestamp: 't2',
          databaseBytes: 80 * GB,
          walBytes: 10 * GB,
          systemBytes: 5 * GB,
          diskSizeBytes: 100 * GB,
          databaseUsagePercent: 80,
          walUsagePercent: 10,
          systemUsagePercent: 5,
        },
      ]

      const summary = getDiskUsageSummary(data)
      expect(summary.latestDataPoint?.timestamp).toBe('t2')
      expect(summary.usedBytes).toBe(95 * GB)
      expect(summary.sizeBytes).toBe(100 * GB)
      expect(summary.usagePercent).toBe(95)
      expect(summary.status).toBe('negative')
    })

    test('returns undefined usage when the latest disk size is 0', () => {
      const data: DiskUsageChartDatum[] = [
        {
          timestamp: 't1',
          databaseBytes: 0,
          walBytes: 0,
          systemBytes: 0,
          diskSizeBytes: 0,
          databaseUsagePercent: 0,
          walUsagePercent: 0,
          systemUsagePercent: 0,
        },
      ]

      expect(getDiskUsageSummary(data).usagePercent).toBeUndefined()
    })
  })
})
