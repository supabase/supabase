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

export const isBucketVersioned = (bucketName: string | undefined) =>
  getMockBucketProtection(bucketName).versioning === 'enabled'
