import dayjs from 'dayjs'
import type { LogsBarChartDatum } from './ProjectUsage.metrics'

/**
 * Configuration for chart bucket sizes based on time interval
 */
const BUCKET_CONFIG = {
  '1hr': {
    bucketMinutes: 2, // 2-minute buckets
    expectedBuckets: 30, // 60 minutes / 2 = 30 buckets
  },
  '1day': {
    bucketMinutes: 60, // 1-hour buckets
    expectedBuckets: 24, // 24 hours
  },
  '7day': {
    bucketMinutes: 360, // 6-hour buckets
    expectedBuckets: 28, // 168 hours / 6 = 28 buckets
  },
} as const

type IntervalKey = keyof typeof BUCKET_CONFIG

/**
 * Normalizes chart data to consistent bucket sizes regardless of backend data density.
 *
 * For 1hr interval: Creates 30 buckets of 2 minutes each
 * For 1day interval: Creates 24 buckets of 1 hour each
 * For 7day interval: Creates 28 buckets of 6 hours each
 *
 * This ensures consistent bar width in charts and proper data aggregation.
 *
 * @param data - Raw chart data from backend
 * @param interval - Time interval key ('1hr', '1day', '7day')
 * @param endDate - End date for the chart (defaults to now)
 * @returns Array of exactly the expected number of buckets with aggregated data
 */
export function normalizeChartBuckets(
  data: LogsBarChartDatum[],
  interval: IntervalKey,
  endDate: Date = new Date()
): LogsBarChartDatum[] {
  const config = BUCKET_CONFIG[interval]
  const { bucketMinutes, expectedBuckets } = config

  // Calculate start time based on expected buckets
  const end = dayjs(endDate)
  const start = end.subtract(expectedBuckets * bucketMinutes, 'minute')

  // Create empty buckets
  const buckets: LogsBarChartDatum[] = []
  let currentBucketStart = start

  for (let i = 0; i < expectedBuckets; i++) {
    buckets.push({
      timestamp: currentBucketStart.toISOString(),
      ok_count: 0,
      warning_count: 0,
      error_count: 0,
    })
    currentBucketStart = currentBucketStart.add(bucketMinutes, 'minute')
  }

  // If no data, return empty buckets
  if (!data || data.length === 0) {
    return buckets
  }

  // Aggregate data into buckets
  for (const datum of data) {
    const datumTime = dayjs(datum.timestamp)

    // Find which bucket this datum belongs to
    const bucketIndex = Math.floor(datumTime.diff(start, 'minute') / bucketMinutes)

    // Skip data points outside our time range
    if (bucketIndex < 0 || bucketIndex >= expectedBuckets) {
      continue
    }

    // Aggregate counts into the appropriate bucket
    buckets[bucketIndex].ok_count += datum.ok_count || 0
    buckets[bucketIndex].warning_count += datum.warning_count || 0
    buckets[bucketIndex].error_count += datum.error_count || 0
  }

  return buckets
}
