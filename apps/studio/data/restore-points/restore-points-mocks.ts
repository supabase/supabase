/**
 * PROTOTYPE mock data for platform-wide restore points.
 *
 * A restore point is environment-wide, not per-product. A scheduled database
 * backup only protects what lives in Postgres; object bytes in Storage and
 * config in git are separate primitives that must be covered explicitly.
 *
 * Why this matters: Auth users and Storage *metadata* live in Postgres, so a
 * database restore brings them back for free. The Storage *objects* do not —
 * they live in object storage. Restoring the database without a matching bucket
 * snapshot is what produces rows pointing at files that no longer exist.
 */

export type PrimitiveCoverageStatus = 'covered' | 'uncovered' | 'not-applicable'

export interface PrimitiveCoverage {
  /** Which platform primitive this describes. */
  primitive: 'database' | 'auth' | 'storage' | 'config'
  status: PrimitiveCoverageStatus
  /** Short label for the chip, e.g. "Database", "Storage". */
  label: string
  /** One line explaining exactly what is (or isn't) included. */
  detail: string
}

export interface RestorePointCoverage {
  /** Timestamp of the database backup this coverage belongs to. */
  backupTimestamp: string
  primitives: PrimitiveCoverage[]
  /** Matching bucket snapshot, when Storage is covered. */
  storageSnapshot: {
    id: string
    bucketCount: number
    sizeBytes: number
  } | null
  /** Commit in the linked repo that produced this environment's config. */
  configCommit: string | null
}

export interface PlatformProtectionSummary {
  /** Buckets with snapshots enabled vs total file buckets. */
  bucketsProtected: number
  bucketsTotal: number
  /** Whether config is tracked in a linked git repo. */
  isConfigTracked: boolean
  /** Whether restoring into a preview branch is available. */
  canRestoreToBranch: boolean
}

export interface BucketSyncState {
  name: string
  /** Snapshotted immediately before each scheduled database backup. */
  isIncluded: boolean
  sizeBytes: number
}

/**
 * Project-level storage/backup sync settings.
 *
 * Expressing this per bucket alone is a trap: a bucket added later defaults to
 * unprotected, so a project that was fully recoverable silently degrades. A
 * project-level default with `applyToNewBuckets` keeps the guarantee intact, and
 * per-bucket entries remain the deliberate opt-out (e.g. a large cache bucket
 * not worth snapshotting).
 */
export interface StorageBackupSyncSettings {
  /** Master switch: snapshot storage before each scheduled database backup. */
  isEnabled: boolean
  /** New buckets inherit snapshotting so coverage can't silently regress. */
  applyToNewBuckets: boolean
  buckets: BucketSyncState[]
}

const GB = 1024 * 1024 * 1024

const DATABASE_COVERAGE: PrimitiveCoverage = {
  primitive: 'database',
  status: 'covered',
  label: 'Database',
  detail: 'Postgres schema and data, including Storage metadata.',
}

/**
 * Auth is called out separately even though it comes along with Postgres: users
 * and sessions coming back is a distinct thing people need to know, and stating
 * it makes the Storage gap read as a deliberate exception rather than an
 * oversight.
 */
const AUTH_COVERAGE: PrimitiveCoverage = {
  primitive: 'auth',
  status: 'covered',
  label: 'Auth',
  detail: 'Users, identities, and sessions — they live in Postgres, so they restore with it.',
}

const CONFIG_COVERAGE: PrimitiveCoverage = {
  primitive: 'config',
  status: 'covered',
  label: 'Config',
  detail: 'Buckets, policies, and project config from ./supabase at the matching commit.',
}

const storageCovered = (bucketCount: number): PrimitiveCoverage => ({
  primitive: 'storage',
  status: 'covered',
  label: 'Storage',
  detail: `Object bytes from a bucket snapshot taken at this point in time (${bucketCount} buckets).`,
})

const STORAGE_UNCOVERED: PrimitiveCoverage = {
  primitive: 'storage',
  status: 'uncovered',
  label: 'Storage',
  detail:
    'No bucket snapshot at this time. Restoring will leave rows referencing objects that no longer exist.',
}

/**
 * Coverage for a given backup timestamp. The prototype covers Storage for
 * recent backups and leaves the oldest uncovered, so the drift case is visible.
 */
export const getMockRestorePointCoverage = (
  backupTimestamp: string,
  index: number
): RestorePointCoverage => {
  // Oldest backups predate snapshotting being enabled.
  const hasStorageSnapshot = index < 3

  return {
    backupTimestamp,
    primitives: [
      DATABASE_COVERAGE,
      AUTH_COVERAGE,
      hasStorageSnapshot ? storageCovered(2) : STORAGE_UNCOVERED,
      CONFIG_COVERAGE,
    ],
    storageSnapshot: hasStorageSnapshot
      ? { id: `snap_8f3a2c9b41c${index}`, bucketCount: 2, sizeBytes: 3.1 * GB }
      : null,
    configCommit: `a1b2c3${index}`,
  }
}

export const getMockPlatformProtectionSummary = (): PlatformProtectionSummary => ({
  bucketsProtected: 2,
  bucketsTotal: 3,
  isConfigTracked: true,
  canRestoreToBranch: true,
})

export const getMockStorageBackupSyncSettings = (): StorageBackupSyncSettings => ({
  isEnabled: true,
  applyToNewBuckets: false,
  buckets: [
    { name: 'match-media', isIncluded: true, sizeBytes: 4.1 * GB },
    { name: 'avatars', isIncluded: true, sizeBytes: 1.4 * GB },
    { name: 'exports', isIncluded: false, sizeBytes: 0.6 * GB },
  ],
})

export const mockDelay = <T>(value: T, ms = 300): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms))
