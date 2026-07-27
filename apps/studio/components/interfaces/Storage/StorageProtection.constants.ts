/**
 * Shared constants + gating for the Storage Snapshots & Versioning prototype.
 */

// Prototype flag: force-enabled so the surfaces are visible via `pnpm dev:studio`.
// A real rollout would replace this with `useFlag('storageObjectVersioning')`.
export const STORAGE_PROTECTION_ENABLED = true

export const useIsStorageProtectionEnabled = () => STORAGE_PROTECTION_ENABLED

export type BucketVersioningState = 'enabled' | 'suspended' | 'disabled'

/**
 * Project-wide defaults for object versioning. New buckets inherit these so
 * enabling versioning doesn't require re-deciding retention every time; a bucket
 * can still override them when its churn genuinely differs.
 */
export const PROJECT_VERSIONING_DEFAULTS = {
  versionExpiryDays: 30,
  maxNoncurrentVersions: 100,
} as const

export interface BucketProtection {
  versioning: BucketVersioningState
  /**
   * Whether this bucket is captured in the project's restore points. Frequency
   * and retention are project-level — see RestorePointPolicy.
   */
  isIncludedInRestorePoints: boolean
  /** Expire noncurrent versions after N days (null = keep indefinitely). */
  versionExpiryDays: number | null
  /** Cap on retained newer noncurrent versions (max 100). */
  maxNoncurrentVersions: number | null
  /** True when this bucket's version retention differs from the project default. */
  hasVersioningOverride: boolean
}

const PROTECTED_BUCKETS: Record<string, BucketProtection> = {
  'match-media': {
    versioning: 'enabled',
    isIncludedInRestorePoints: true,
    versionExpiryDays: PROJECT_VERSIONING_DEFAULTS.versionExpiryDays,
    maxNoncurrentVersions: PROJECT_VERSIONING_DEFAULTS.maxNoncurrentVersions,
    hasVersioningOverride: false,
  },
  avatars: {
    versioning: 'enabled',
    isIncludedInRestorePoints: true,
    // Higher-churn bucket that deliberately keeps fewer versions than the default
    versionExpiryDays: 30,
    maxNoncurrentVersions: 10,
    hasVersioningOverride: true,
  },
}

const DEFAULT_PROTECTION: BucketProtection = {
  versioning: 'disabled',
  isIncludedInRestorePoints: false,
  versionExpiryDays: null,
  maxNoncurrentVersions: null,
  hasVersioningOverride: false,
}

/** Prototype: derive a bucket's protection config from its name. */
export const getMockBucketProtection = (bucketName: string | undefined): BucketProtection =>
  (bucketName && PROTECTED_BUCKETS[bucketName]) || DEFAULT_PROTECTION

export const isBucketVersioned = (bucketName: string | undefined) =>
  getMockBucketProtection(bucketName).versioning === 'enabled'
