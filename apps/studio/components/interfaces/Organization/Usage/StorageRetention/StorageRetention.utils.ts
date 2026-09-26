import dayjs from 'dayjs'

import { STORAGE_SIZE_SEGMENTS } from './StorageRetention.constants'
import type { DataPoint } from '@/data/analytics/constants'
import type { StorageRetentionDayPoint } from '@/data/storage/versioning/storage-retention-usage-query'

/** Keyed by the same attribute keys the Storage Size list declares, so every bar has a series. */
export const toStorageSizeChartData = (daily: StorageRetentionDayPoint[]): DataPoint[] =>
  daily.map((day) => {
    const segments = Object.fromEntries(
      STORAGE_SIZE_SEGMENTS.map((segment) => [segment.attributeKey, day[segment.totalsKey]])
    )

    return {
      period_start: day.date,
      periodStartFormatted: dayjs(day.date).format('DD MMM'),
      ...segments,
    }
  })
