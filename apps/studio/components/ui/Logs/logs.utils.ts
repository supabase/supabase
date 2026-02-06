import type { ChartIntervals } from 'types'

export const LOG_RETENTION = {
  free: 1,
  pro: 7,
  team: 28,
  enterprise: 90,
  platform: 1,
}

export const CHART_INTERVALS: ChartIntervals[] = [
  {
    key: '1hr',
    label: 'Last 60 minutes',
    startValue: 1,
    startUnit: 'hour',
    format: 'MMM D, h:mma',
    availableIn: ['free', 'pro', 'team', 'enterprise', 'platform'],
  },
  {
    key: '1day',
    label: 'Last 24 hours',
    startValue: 24,
    startUnit: 'hour',
    format: 'MMM D, ha',
    availableIn: ['free', 'pro', 'team', 'enterprise', 'platform'],
  },
  {
    key: '7day',
    label: 'Last 7 days',
    startValue: 7,
    startUnit: 'day',
    format: 'MMM D',
    availableIn: ['pro', 'team', 'enterprise'],
  },
]
