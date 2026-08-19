import dayjs from 'dayjs'

import { DataPoint } from '@/data/analytics/constants'
import type { RetentionDayPoint } from '@/data/storage/protection/protection-mocks'

/**
 * Converts the mock retention daily series into `DataPoint[]` matching the
 * two stacked attribute keys declared for Storage Size in `Usage.constants`
 * (`current`, `noncurrent`). Keeps chart bars and the inline breakdown in
 * sync — both read the same mock source.
 */
export const toStorageSizeChartData = (daily: RetentionDayPoint[]): DataPoint[] =>
  daily.map((day) => ({
    period_start: day.date,
    periodStartFormatted: dayjs(day.date).format('DD MMM'),
    current: day.current,
    noncurrent: day.noncurrent,
  }))
