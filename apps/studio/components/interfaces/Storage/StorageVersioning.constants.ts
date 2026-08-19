import type { Bucket } from '@/data/storage/buckets-query'

export type BucketVersioningState = 'enabled' | 'suspended' | 'disabled'
export type ExpirationMode = 'and' | 'or'

export const PROJECT_VERSIONING_DEFAULTS = {
  versionExpiryDays: 30,
  maxNoncurrentVersions: 10,
} as const

/**
 * TODO(storage-versioning): return `bucket.versioning` once the API exposes it.
 * Every bucket reports `disabled` until then.
 */
export const getBucketVersioningState = (_bucket?: Bucket): BucketVersioningState => 'disabled'

// True only while a bucket is actively creating noncurrent versions.
export const isBucketVersioned = (bucket?: Bucket) => getBucketVersioningState(bucket) === 'enabled'

// True if a bucket has ever been versioned — a suspended bucket can still be retaining versions.
export const hasVersioningHistory = (bucket?: Bucket) =>
  getBucketVersioningState(bucket) !== 'disabled'
