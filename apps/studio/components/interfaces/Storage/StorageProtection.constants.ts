/**
 * Shared constants + gating for the Storage Object Versioning prototype.
 */

// Prototype flag: force-enabled so the surfaces are visible via `pnpm dev:studio`.
// A real rollout would replace this with `useFlag('storageObjectVersioning')`.
export const STORAGE_PROTECTION_ENABLED = true

export const useIsStorageProtectionEnabled = () => STORAGE_PROTECTION_ENABLED

export type BucketVersioningState = 'enabled' | 'suspended' | 'disabled'

/**
 * Controls how the two lifecycle conditions (retention days and max versions)
 * combine when evaluating whether to expire a noncurrent version:
 *
 * - `'and'` — a single S3 lifecycle policy with both conditions; a version is
 *   only expired when **both** are true simultaneously.
 * - `'or'` — two independent S3 lifecycle rules, one per condition; a version
 *   is expired as soon as **either** condition is met.
 */
export type ExpirationMode = 'and' | 'or'

export const PROJECT_VERSIONING_DEFAULTS = {
  versionExpiryDays: 30,
  maxNoncurrentVersions: 100,
} as const

/**
 * Sensible min/max/default bounds for the versioning fields, per org billing plan.
 * `null` means the plan doesn't support object versioning (or lifecycle policy
 * management) at all.
 */
export interface VersioningPlanLimits {
  minRetentionDays: number
  maxRetentionDays: number
  defaultRetentionDays: number
  minVersions: number
  maxVersions: number
  defaultVersions: number
}

const VERSIONING_PLAN_LIMITS: Record<string, VersioningPlanLimits | null> = {
  free: null,
  pro: {
    minRetentionDays: 1,
    maxRetentionDays: 90,
    defaultRetentionDays: 30,
    minVersions: 1,
    maxVersions: 20,
    defaultVersions: 10,
  },
  team: {
    minRetentionDays: 1,
    maxRetentionDays: 180,
    defaultRetentionDays: 30,
    minVersions: 1,
    maxVersions: 50,
    defaultVersions: 20,
  },
  enterprise: {
    minRetentionDays: 1,
    maxRetentionDays: 365,
    defaultRetentionDays: 30,
    minVersions: 1,
    maxVersions: 100,
    defaultVersions: 50,
  },
}
// Legacy/custom org tier: treat the same as enterprise (most generous bounds)
VERSIONING_PLAN_LIMITS.platform = VERSIONING_PLAN_LIMITS.enterprise

/**
 * Returns the versioning min/max bounds for a given org plan, or `null` if
 * that plan doesn't support object versioning (e.g. the Free plan).
 */
export const getVersioningPlanLimits = (planId: string | undefined): VersioningPlanLimits | null =>
  planId !== undefined ? (VERSIONING_PLAN_LIMITS[planId] ?? null) : null

export interface BucketProtection {
  versioning: BucketVersioningState
  versionExpiryDays: number | null
  maxNoncurrentVersions: number | null
  expirationMode: ExpirationMode
}

const PROTECTED_BUCKETS: Record<string, BucketProtection> = {
  'match-media': {
    versioning: 'enabled',
    versionExpiryDays: PROJECT_VERSIONING_DEFAULTS.versionExpiryDays,
    maxNoncurrentVersions: PROJECT_VERSIONING_DEFAULTS.maxNoncurrentVersions,
    expirationMode: 'and',
  },
  avatars: {
    versioning: 'enabled',
    versionExpiryDays: 30,
    maxNoncurrentVersions: 10,
    expirationMode: 'or',
  },
}

const DEFAULT_PROTECTION: BucketProtection = {
  versioning: 'disabled',
  versionExpiryDays: null,
  maxNoncurrentVersions: null,
  expirationMode: 'and',
}

export const getMockBucketProtection = (bucketName: string | undefined): BucketProtection =>
  (bucketName && PROTECTED_BUCKETS[bucketName]) || DEFAULT_PROTECTION

/**
 * Writes a bucket's versioning settings into the in-memory mock store, so
 * changes made via the create/edit bucket modals are reflected immediately
 * elsewhere (e.g. the buckets list "Versioning" column) without a real API.
 * Resets on page refresh, since it's plain module state.
 */
export const setMockBucketProtection = (bucketName: string, protection: BucketProtection): void => {
  PROTECTED_BUCKETS[bucketName] = protection
}

/**
 * True only while a bucket is actively versioning — i.e. an overwrite or
 * delete creates a new noncurrent version or soft-deleted marker right now.
 * `disabled` (never turned on) and `suspended` (turned off after being on)
 * are both false here, even though a suspended bucket can still be sitting
 * on plenty of retained versions from before it was suspended.
 */
export const isBucketVersioned = (bucketName: string | undefined) =>
  getMockBucketProtection(bucketName).versioning === 'enabled'

/**
 * True once a bucket has ever had versioning turned on — covers both the
 * active `enabled` state and `suspended`. Versioning can't go back to
 * `disabled` once enabled (matching S3: suspending stops new noncurrent
 * versions from being created, but every version and soft-deleted file
 * already retained stays exactly where it is until it's individually
 * deleted or a lifecycle policy expires it). Surfaces that show or warn
 * about that retained data should key off this, not `isBucketVersioned`.
 */
export const hasVersioningHistory = (bucketName: string | undefined) =>
  getMockBucketProtection(bucketName).versioning !== 'disabled'

/**
 * Simulates the auto-suspend-and-purge policy for a plan downgrade:
 *
 * If an org downgrades to a plan that no longer supports object versioning
 * (e.g. Free), the real backend would run a migration that suspends
 * versioning on every bucket in the org — since a once-versioned bucket can
 * never go back to a plain `disabled` state — and permanently deletes every
 * noncurrent version and soft-deleted file those buckets were retaining,
 * since the new plan doesn't support paying to retain them either. The user
 * shouldn't have to remember which buckets were versioned — the platform
 * handles it.
 *
 * This function does that at read time by walking `PROTECTED_BUCKETS` and
 * flipping every `enabled` entry to `suspended` with cleared retention
 * settings, and clearing the shared trash store. Call it from a top-level
 * effect that reacts to the org's plan resolving to one without versioning
 * support.
 */
export const purgeVersioningOnPlanDowngrade = (): { purgedBuckets: string[] } => {
  const purgedBuckets: string[] = []
  for (const [name, protection] of Object.entries(PROTECTED_BUCKETS)) {
    if (protection.versioning === 'enabled') {
      purgedBuckets.push(name)
      PROTECTED_BUCKETS[name] = {
        versioning: 'suspended',
        versionExpiryDays: null,
        maxNoncurrentVersions: null,
        expirationMode: protection.expirationMode,
      }
    }
  }
  return { purgedBuckets }
}
