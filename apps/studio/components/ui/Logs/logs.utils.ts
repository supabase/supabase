import type { ChartIntervals } from '@/types'

export const CHART_INTERVALS: ChartIntervals[] = [
  {
    key: '1hr',
    label: 'Last 60 minutes',
    startValue: 1,
    startUnit: 'hour',
    format: 'MMM D, h:mma',
  },
  {
    key: '1day',
    label: 'Last 24 hours',
    startValue: 24,
    startUnit: 'hour',
    format: 'MMM D, ha',
  },
  {
    key: '7day',
    label: 'Last 7 days',
    startValue: 7,
    startUnit: 'day',
    format: 'MMM D',
  },
]
