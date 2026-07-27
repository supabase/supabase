import dayjs from 'dayjs'

import type { DataPoint } from '@/data/analytics/constants'
import type { StorageRetentionUsage } from '@/data/storage/protection/protection-mocks'

export const STORAGE_RETENTION_KEYS = {
  live: 'storage_size_live',
  versions: 'storage_size_versions',
  snapshots: 'storage_size_snapshots',
} as const

/**
 * Maps the mock daily retention series into the `DataPoint[]` shape the shared
 * `UsageBarChart` expects.
 *
 * The platform's real daily-stats endpoint is what the rest of the usage page
 * charts read from, but Storage Size here needs a live/versions/snapshots
 * breakdown that endpoint doesn't report — and in this prototype environment the
 * real endpoint is also sparse, which is what produced the earlier single
 * "Invalid Date" bar (`dayjs` formatting a missing/malformed real date). Reading
 * the chart entirely off the mock daily series (already anchored to the
 * viewer's current date in `protection-mocks.ts`) sidesteps both problems.
 */
export const toStorageSizeChartData = (daily: StorageRetentionUsage['daily']): DataPoint[] =>
  daily.map((day) => ({
    period_start: day.date,
    periodStartFormatted: dayjs(day.date).format('DD MMM'),
    [STORAGE_RETENTION_KEYS.live]: day.live,
    [STORAGE_RETENTION_KEYS.versions]: day.versions,
    [STORAGE_RETENTION_KEYS.snapshots]: day.snapshots,
  }))
