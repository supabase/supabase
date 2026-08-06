/**
 * Shared constants + gating for the Storage Object Versioning prototype.
 */

// Prototype flag: force-enabled so the surfaces are visible via `pnpm dev:studio`.
// A real rollout would replace this with `useFlag('storageObjectVersioning')`.
export const STORAGE_PROTECTION_ENABLED = true

export const useIsStorageProtectionEnabled = () => STORAGE_PROTECTION_ENABLED

export type BucketVersioningState = 'enabled' | 'suspended' | 'disabled'

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
}

const PROTECTED_BUCKETS: Record<string, BucketProtection> = {
  'match-media': {
    versioning: 'enabled',
    versionExpiryDays: PROJECT_VERSIONING_DEFAULTS.versionExpiryDays,
    maxNoncurrentVersions: PROJECT_VERSIONING_DEFAULTS.maxNoncurrentVersions,
  },
  avatars: {
    versioning: 'enabled',
    versionExpiryDays: 30,
    maxNoncurrentVersions: 10,
  },
}

const DEFAULT_PROTECTION: BucketProtection = {
  versioning: 'disabled',
  versionExpiryDays: null,
  maxNoncurrentVersions: null,
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

export const isBucketVersioned = (bucketName: string | undefined) =>
  getMockBucketProtection(bucketName).versioning === 'enabled'
