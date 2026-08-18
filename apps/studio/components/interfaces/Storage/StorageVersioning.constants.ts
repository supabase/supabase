import type { Bucket } from '@/data/storage/buckets-query'

/**
 * Mirrors the three S3 bucket versioning states. A bucket can never return to
 * `disabled` once enabled — turning versioning off suspends it, which stops new
 * noncurrent versions without touching the ones already retained.
 */
export type BucketVersioningState = 'enabled' | 'suspended' | 'disabled'

/**
 * How the two lifecycle conditions combine: `and` expires a version only once
 * both are true, `or` as soon as either is.
 */
export type ExpirationMode = 'and' | 'or'

/** Prefilled when a user first enables versioning on a bucket. */
export const PROJECT_VERSIONING_DEFAULTS = {
  versionExpiryDays: 30,
  maxNoncurrentVersions: 10,
} as const

/**
 * TODO(storage-versioning): return `bucket.versioning` once the Storage API
 * exposes it. Every bucket reports `disabled` until then.
 */
export const getBucketVersioningState = (_bucket?: Bucket): BucketVersioningState => 'disabled'

/** True only while a bucket is actively creating noncurrent versions. */
export const isBucketVersioned = (bucket?: Bucket) => getBucketVersioningState(bucket) === 'enabled'

/**
 * True once a bucket has ever been versioned, covering `suspended` too — a
 * suspended bucket can still be retaining versions. Surfaces that warn about
 * already-retained data should use this rather than {@link isBucketVersioned}.
 */
export const hasVersioningHistory = (bucket?: Bucket) =>
  getBucketVersioningState(bucket) !== 'disabled'
