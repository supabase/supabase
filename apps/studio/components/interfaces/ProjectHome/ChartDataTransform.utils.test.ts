import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import { normalizeChartBuckets } from './ChartDataTransform.utils'
import type { LogsBarChartDatum } from './ProjectUsage.metrics'

describe('normalizeChartBuckets', () => {
  const now = dayjs('2024-01-28T12:00:00.000Z')

  it.each([
    ['1hr', 30, 2, 'minute'],
    ['1day', 24, 1, 'hour'],
    ['7day', 28, 6, 'hour'],
  ] as const)(
    'creates %s buckets: %s empty buckets %s %s(s) apart, ending one step before now',
    (interval, count, step, unit) => {
      const result = normalizeChartBuckets([], interval, now.toDate())

      expect(result).toHaveLength(count)
      expect(result[0].timestamp).toBe(now.subtract(count * step, unit).toISOString())
      expect(result[count - 1].timestamp).toBe(now.subtract(step, unit).toISOString())
      result.forEach((bucket, i) => {
        expect(bucket).toMatchObject({ ok_count: 0, warning_count: 0, error_count: 0 })
        if (i > 0) {
          expect(dayjs(bucket.timestamp).diff(dayjs(result[i - 1].timestamp), unit)).toBe(step)
        }
      })
    }
  )

  describe('1hr interval', () => {
    it('should aggregate data points into correct 2-minute buckets', () => {
      const data: LogsBarChartDatum[] = [
        {
          // First bucket starts at -60 minutes, so -60 to -59 minutes is in bucket 0
          timestamp: now.subtract(60, 'minute').toISOString(),
          ok_count: 10,
          warning_count: 1,
          error_count: 2,
        },
        {
          timestamp: now.subtract(59, 'minute').add(30, 'second').toISOString(),
          ok_count: 5,
          warning_count: 0,
          error_count: 1,
        },
        {
          timestamp: now.subtract(30, 'minute').toISOString(),
          ok_count: 20,
          warning_count: 2,
          error_count: 0,
        },
      ]

      const result = normalizeChartBuckets(data, '1hr', now.toDate())

      // First bucket (60-58 minutes ago) should contain aggregated data
      const firstBucket = result[0]
      expect(firstBucket.ok_count).toBe(15) // 10 + 5
      expect(firstBucket.warning_count).toBe(1) // 1 + 0
      expect(firstBucket.error_count).toBe(3) // 2 + 1

      // Bucket at 30 minutes ago
      const bucket15 = result[15] // 30 minutes / 2 minutes per bucket = bucket 15
      expect(bucket15.ok_count).toBe(20)
      expect(bucket15.warning_count).toBe(2)
      expect(bucket15.error_count).toBe(0)
    })
  })

  describe('1day interval', () => {
    it('should aggregate multiple data points into hourly buckets', () => {
      const data: LogsBarChartDatum[] = [
        {
          timestamp: now.subtract(23, 'hour').subtract(30, 'minute').toISOString(),
          ok_count: 100,
          warning_count: 5,
          error_count: 3,
        },
        {
          timestamp: now.subtract(23, 'hour').subtract(15, 'minute').toISOString(),
          ok_count: 50,
          warning_count: 2,
          error_count: 1,
        },
      ]

      const result = normalizeChartBuckets(data, '1day', now.toDate())

      // First bucket should contain aggregated data
      expect(result[0].ok_count).toBe(150)
      expect(result[0].warning_count).toBe(7)
      expect(result[0].error_count).toBe(4)
    })
  })

  describe('7day interval', () => {
    it('should aggregate data points into 6-hour buckets', () => {
      const data: LogsBarChartDatum[] = [
        {
          timestamp: now.subtract(167, 'hour').toISOString(),
          ok_count: 1000,
          warning_count: 10,
          error_count: 5,
        },
        {
          timestamp: now.subtract(165, 'hour').toISOString(),
          ok_count: 500,
          warning_count: 5,
          error_count: 2,
        },
      ]

      const result = normalizeChartBuckets(data, '7day', now.toDate())

      // First bucket should contain aggregated data
      expect(result[0].ok_count).toBe(1500)
      expect(result[0].warning_count).toBe(15)
      expect(result[0].error_count).toBe(7)
    })
  })

  describe('edge cases', () => {
    it('should handle data points outside the time range', () => {
      const data: LogsBarChartDatum[] = [
        {
          timestamp: now.subtract(120, 'minute').toISOString(), // Outside 1hr range
          ok_count: 100,
          warning_count: 10,
          error_count: 5,
        },
        {
          timestamp: now.add(10, 'minute').toISOString(), // Future data
          ok_count: 50,
          warning_count: 5,
          error_count: 2,
        },
        {
          timestamp: now.subtract(30, 'minute').toISOString(), // Within range
          ok_count: 25,
          warning_count: 2,
          error_count: 1,
        },
      ]

      const result = normalizeChartBuckets(data, '1hr', now.toDate())

      // Should only include the data within range
      const validBucket = result[15] // 30 minutes ago
      expect(validBucket.ok_count).toBe(25)
      expect(validBucket.warning_count).toBe(2)
      expect(validBucket.error_count).toBe(1)

      // Other buckets should be empty
      expect(result[0].ok_count).toBe(0)
      expect(result[29].ok_count).toBe(0)
    })

    it('should handle undefined/null values in data', () => {
      const data: LogsBarChartDatum[] = [
        {
          timestamp: now.subtract(30, 'minute').toISOString(),
          ok_count: undefined as any,
          warning_count: null as any,
          error_count: 5,
        },
      ]

      const result = normalizeChartBuckets(data, '1hr', now.toDate())

      const bucket = result[15]
      expect(bucket.ok_count).toBe(0)
      expect(bucket.warning_count).toBe(0)
      expect(bucket.error_count).toBe(5)
    })
  })
})
