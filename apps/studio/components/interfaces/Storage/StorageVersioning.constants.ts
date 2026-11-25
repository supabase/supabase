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

/**
 * The bucket versions writes right now: a delete becomes a recoverable archive and an
 * overwrite becomes a new version. Drives what the actions are called.
 */
export const isVersioningActive = (bucket?: Bucket) =>
  getBucketVersioningState(bucket) === 'enabled'

/** A suspended bucket can still be retaining versions. */
export const hasVersioningHistory = (bucket?: Bucket) =>
  getBucketVersioningState(bucket) !== 'disabled'

/**
 * A suspended bucket retains a copy when the object it replaces
 * was itself written while versioning was enabled.
 */
export const willRetainVersionOnWrite = ({
  versioningState,
  isObjectVersioned,
}: {
  versioningState: BucketVersioningState
  isObjectVersioned?: boolean | null
}) => {
  if (versioningState === 'enabled') return true
  return versioningState === 'suspended' && !!isObjectVersioned
}
