import type { Bucket } from '@/data/storage/buckets-query'

export type BucketVersioningState = 'enabled' | 'suspended' | 'disabled'
export type ExpirationMode = 'and' | 'or'

export const PROJECT_VERSIONING_DEFAULTS = {
  versionExpiryDays: 30,
  maxNoncurrentVersions: 10,
} as const

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

export const isBucketVersioned = (bucket?: Bucket) => getBucketVersioningState(bucket) === 'enabled'

/** A suspended bucket can still be retaining versions. */
export const hasVersioningHistory = (bucket?: Bucket) =>
  getBucketVersioningState(bucket) !== 'disabled'
