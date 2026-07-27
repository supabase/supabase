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
  primitive: 'database' | 'storage' | 'config'
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

const GB = 1024 * 1024 * 1024

const DATABASE_COVERAGE: PrimitiveCoverage = {
  primitive: 'database',
  status: 'covered',
  label: 'Database',
  detail: 'Postgres schema and data. Auth users and Storage metadata restore with it.',
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

export const mockDelay = <T>(value: T, ms = 300): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms))
