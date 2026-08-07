/**
 * Shared constants + gating for the Storage Snapshots & Versioning prototype.
 */

// Prototype flag: force-enabled so the surfaces are visible via `pnpm dev:studio`.
// A real rollout would replace this with `useFlag('storageObjectVersioning')`.
export const STORAGE_PROTECTION_ENABLED = true

export const useIsStorageProtectionEnabled = () => STORAGE_PROTECTION_ENABLED

export type BucketVersioningState = 'enabled' | 'suspended' | 'disabled'

/**
 * AND = a single S3 lifecycle policy — both expiry-days AND max-versions must
 *       be satisfied before a noncurrent version expires.
 * OR  = two separate S3 lifecycle rules — either condition independently
 *       triggers expiration.
 */
export type ExpirationMode = 'and' | 'or'

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
  /** How the two lifecycle conditions combine — see `ExpirationMode`. */
  expirationMode: ExpirationMode
}

const PROTECTED_BUCKETS: Record<string, BucketProtection> = {
  'match-media': {
    versioning: 'enabled',
    isIncludedInRestorePoints: true,
    versionExpiryDays: PROJECT_VERSIONING_DEFAULTS.versionExpiryDays,
    maxNoncurrentVersions: PROJECT_VERSIONING_DEFAULTS.maxNoncurrentVersions,
    hasVersioningOverride: false,
    expirationMode: 'and',
  },
  avatars: {
    versioning: 'enabled',
    isIncludedInRestorePoints: true,
    // Higher-churn bucket that deliberately keeps fewer versions than the default
    versionExpiryDays: 30,
    maxNoncurrentVersions: 10,
    hasVersioningOverride: true,
    expirationMode: 'or',
  },
}

const DEFAULT_PROTECTION: BucketProtection = {
  versioning: 'disabled',
  // Snapshot participation defaults to in — it's a cost opt-out, not an opt-in,
  // so a new bucket isn't a silent gap in coverage.
  isIncludedInRestorePoints: true,
  versionExpiryDays: null,
  maxNoncurrentVersions: null,
  hasVersioningOverride: false,
  expirationMode: 'and',
}

/** Prototype: derive a bucket's protection config from its name. */
export const getMockBucketProtection = (bucketName: string | undefined): BucketProtection =>
  (bucketName && PROTECTED_BUCKETS[bucketName]) || DEFAULT_PROTECTION

export const isBucketVersioned = (bucketName: string | undefined) =>
  getMockBucketProtection(bucketName).versioning === 'enabled'

/**
 * True when a bucket has (or previously had) versioning — i.e. it may still
 * have noncurrent versions or soft-deleted objects to manage, even if
 * versioning is currently suspended.
 */
export const hasVersioningHistory = (bucketName: string | undefined) => {
  const state = getMockBucketProtection(bucketName).versioning
  return state === 'enabled' || state === 'suspended'
}

/**
 * Prototype: persist bucket protection changes to the in-memory mock store so
 * the UI reflects them immediately during a session.
 */
export const setMockBucketProtection = (bucketName: string, patch: Partial<BucketProtection>) => {
  const existing = PROTECTED_BUCKETS[bucketName] ?? { ...DEFAULT_PROTECTION }
  PROTECTED_BUCKETS[bucketName] = { ...existing, ...patch }
}
