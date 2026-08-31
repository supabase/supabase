import { queryOptions } from '@tanstack/react-query'

import { storageKeys } from '../keys'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

/** Storage bytes split by what is keeping them around */
export interface StorageRetentionTotals {
  /** The version served when an object is fetched without a version ID. */
  current: number
  /**
   * Everything still billable that isn't the current object: noncurrent versions
   * plus the empty delete-marker placeholders behind archived files.
   */
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

const EMPTY_USAGE: StorageRetentionUsage = {
  totals: { current: 0, noncurrent: 0 },
  daily: [],
  byBucket: [],
}

async function getStorageRetentionUsage(
  { orgSlug }: StorageRetentionUsageVariables,
  _signal?: AbortSignal
): Promise<StorageRetentionUsage> {
  if (!orgSlug) throw new Error('orgSlug is required')

  // TODO(storage-versioning): replace with the real endpoint once the platform
  // reports retention usage. The breakdown renders zeros until then.
  return EMPTY_USAGE
}

export type StorageRetentionUsageData = Awaited<ReturnType<typeof getStorageRetentionUsage>>

export const storageRetentionUsageQueryOptions = ({ orgSlug }: StorageRetentionUsageVariables) =>
  queryOptions({
    queryKey: storageKeys.retentionUsage(orgSlug),
    queryFn: ({ signal }) => getStorageRetentionUsage({ orgSlug }, signal),
    enabled: IS_PLATFORM && typeof orgSlug !== 'undefined',
  })
