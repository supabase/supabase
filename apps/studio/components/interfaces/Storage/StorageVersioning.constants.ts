import type { Bucket } from '@/data/storage/buckets-query'

export type BucketVersioningState = 'enabled' | 'suspended' | 'disabled'
export type ExpirationMode = 'and' | 'or'

export const PROJECT_VERSIONING_DEFAULTS = {
  versionExpiryDays: 30,
  maxNoncurrentVersions: 10,
} as const

/**
 * Buckets created before versioning shipped report no `versioning_status` at all,
 * which is the same thing as never having been versioned.
 */
export const getBucketVersioningState = (bucket?: Bucket): BucketVersioningState => {
  switch (bucket?.versioning_status) {
    case 'ENABLED':
      return 'enabled'
    case 'SUSPENDED':
      return 'suspended'
    default:
      return 'disabled'
  }
}

// True only while a bucket is actively creating noncurrent versions.
export const isBucketVersioned = (bucket?: Bucket) => getBucketVersioningState(bucket) === 'enabled'

// True if a bucket has ever been versioned — a suspended bucket can still be retaining versions.
export const hasVersioningHistory = (bucket?: Bucket) =>
  getBucketVersioningState(bucket) !== 'disabled'
