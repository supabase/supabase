import { AnalyticsInterval } from 'data/analytics/constants'

export type Granularity = 'minute' | 'hour' | 'day' | 'week'
export function analyticsIntervalToGranularity(interval: AnalyticsInterval): Granularity {
  switch (interval) {
    case '1m':
      return 'minute'
    case '5m':
      return 'minute'
    case '10m':
      return 'minute'
    case '30m':
      return 'minute'
    case '1h':
      return 'hour'
    case '1d':
      return 'day'
    default:
      return 'hour'
  }
}
