import { queryOptions } from '@tanstack/react-query'

import { storageKeys } from '../keys'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

export interface StorageRetentionTotals {
  current: number
  /** Noncurrent versions plus the delete markers behind archived files. */
  noncurrent: number
}

export interface StorageRetentionDayPoint extends StorageRetentionTotals {
  date: string
}

export interface StorageRetentionBucketSummary extends StorageRetentionTotals {
  bucket: string
}

export interface StorageRetentionUsage {
  totals: StorageRetentionTotals
  daily: StorageRetentionDayPoint[]
  byBucket: StorageRetentionBucketSummary[]
}

export type StorageRetentionUsageVariables = {
  orgSlug?: string
}

export type StorageRetentionUsageError = ResponseError

/**
 * `null` means the platform does not report retention usage for this organization. Callers must
 * fall back to the unsegmented Storage Size figures rather than render it as zero retained data.
 */
async function getStorageRetentionUsage(
  { orgSlug }: StorageRetentionUsageVariables,
  _signal?: AbortSignal
): Promise<StorageRetentionUsage | null> {
  if (!orgSlug) throw new Error('orgSlug is required')

  // TODO(storage-versioning): call the real endpoint once the platform reports retention usage.
  return null
}

export type StorageRetentionUsageData = Awaited<ReturnType<typeof getStorageRetentionUsage>>

export const storageRetentionUsageQueryOptions = ({ orgSlug }: StorageRetentionUsageVariables) =>
  queryOptions({
    queryKey: storageKeys.retentionUsage(orgSlug),
    queryFn: ({ signal }) => getStorageRetentionUsage({ orgSlug }, signal),
    enabled: IS_PLATFORM && !!orgSlug,
  })
