import type { DataPoint } from '@/data/analytics/constants'

export const STORAGE_RETENTION_KEYS = {
  live: 'storage_size_live',
  versions: 'storage_size_versions',
  snapshots: 'storage_size_snapshots',
} as const

export type StorageRetentionTotals = { live: number; versions: number; snapshots: number }

/**
 * Splits each Storage Size data point into live / prior-version / snapshot
 * segments so the usage chart can stack what is driving the total.
 *
 * The platform API reports Storage Size as a single number today, so the split
 * is derived from the retention totals' ratio. The per-day total is preserved
 * exactly — only its attribution is inferred.
 */
export const splitStorageSizeByRetention = (
  dataPoints: DataPoint[],
  totalKey: string,
  totals: StorageRetentionTotals | undefined
): DataPoint[] => {
  const sum = (totals?.live ?? 0) + (totals?.versions ?? 0) + (totals?.snapshots ?? 0)

  return dataPoints.map((point) => {
    const total = Number(point[totalKey] ?? 0)

    // Without retention data (or an empty day) attribute everything to live objects
    // so the chart still renders the real total.
    if (!totals || sum <= 0 || total <= 0) {
      return {
        ...point,
        [STORAGE_RETENTION_KEYS.live]: total,
        [STORAGE_RETENTION_KEYS.versions]: 0,
        [STORAGE_RETENTION_KEYS.snapshots]: 0,
      }
    }

    const versions = (total * totals.versions) / sum
    const snapshots = (total * totals.snapshots) / sum

    return {
      ...point,
      // Give live the remainder so the three segments always add back to `total`
      [STORAGE_RETENTION_KEYS.live]: total - versions - snapshots,
      [STORAGE_RETENTION_KEYS.versions]: versions,
      [STORAGE_RETENTION_KEYS.snapshots]: snapshots,
    }
  })
}
