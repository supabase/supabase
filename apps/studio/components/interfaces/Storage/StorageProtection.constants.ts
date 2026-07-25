/**
 * Shared constants + gating for the Storage Snapshots & Versioning prototype.
 */

// Prototype flag: force-enabled so the surfaces are visible via `pnpm dev:studio`.
// A real rollout would replace this with `useFlag('storageObjectVersioning')`.
export const STORAGE_PROTECTION_ENABLED = true

export const useIsStorageProtectionEnabled = () => STORAGE_PROTECTION_ENABLED

export type BucketVersioningState = 'enabled' | 'suspended' | 'disabled'

export interface BucketProtection {
  versioning: BucketVersioningState
  snapshots: boolean
  snapshotOnDatabaseBackup: boolean
  /** Expire noncurrent versions after N days (null = keep indefinitely). */
  versionExpiryDays: number | null
  /** Cap on retained newer noncurrent versions (max 100). */
  maxNoncurrentVersions: number | null
  /** Expire snapshots after N days (null = keep indefinitely). */
  snapshotExpiryDays: number | null
}

const PROTECTED_BUCKETS: Record<string, BucketProtection> = {
  'match-media': {
    versioning: 'enabled',
    snapshots: true,
    snapshotOnDatabaseBackup: true,
    versionExpiryDays: 30,
    maxNoncurrentVersions: 100,
    snapshotExpiryDays: 90,
  },
  avatars: {
    versioning: 'enabled',
    snapshots: false,
    snapshotOnDatabaseBackup: false,
    versionExpiryDays: 30,
    maxNoncurrentVersions: 10,
    snapshotExpiryDays: null,
  },
}

const DEFAULT_PROTECTION: BucketProtection = {
  versioning: 'disabled',
  snapshots: false,
  snapshotOnDatabaseBackup: false,
  versionExpiryDays: null,
  maxNoncurrentVersions: null,
  snapshotExpiryDays: null,
}

/** Prototype: derive a bucket's protection config from its name. */
export const getMockBucketProtection = (bucketName: string | undefined): BucketProtection =>
  (bucketName && PROTECTED_BUCKETS[bucketName]) || DEFAULT_PROTECTION

export const isBucketVersioned = (bucketName: string | undefined) =>
  getMockBucketProtection(bucketName).versioning === 'enabled'

// Colours for the retention breakdown (Tailwind-independent so the chart + legend
// stay in lockstep). Live = brand green, versions = amber, snapshots = blue.
export const RETENTION_COLORS = {
  live: 'hsl(var(--brand-default))',
  versions: 'hsl(var(--warning-default))',
  snapshots: 'hsl(217, 91%, 60%)',
} as const
