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

export interface BucketParticipation {
  name: string
  /** Whether this bucket is captured in the project's restore points. */
  isIncluded: boolean
  sizeBytes: number
}

/**
 * How often snapshots are captured.
 *
 * Fixed to `with-database-backup`, not user-configurable. An independent cadence
 * (e.g. daily or hourly) would produce storage snapshots with no matching
 * database backup — you could restore the files but not the database state that
 * referenced them, or restore a backup that predates the nearest snapshot by up
 * to a full cadence interval. That gap is a footgun, not a useful knob, so there
 * is only one option.
 */
export type SnapshotFrequency = 'with-database-backup'

export const SNAPSHOT_FREQUENCY_LABELS: Record<SnapshotFrequency, string> = {
  'with-database-backup': 'With every database backup',
}

/**
 * Project-level restore point policy.
 *
 * Frequency and retention are deliberately project-level, not per bucket. A
 * restore point's value is being consistent *across* buckets — the database
 * references objects in all of them. If one bucket kept snapshots for 30 days and
 * another for 90, then on day 31 the older restore points silently degrade into
 * partial ones: restorable for one bucket, gone for the other. Per bucket you
 * choose participation only, which is the cost escape hatch.
 */
export interface RestorePointPolicy {
  /** Master switch for capturing storage in restore points. */
  isEnabled: boolean
  frequency: SnapshotFrequency
  /** Single project-wide retention so restore points can't become partial. */
  retentionDays: number
  /** New buckets inherit participation so coverage can't silently regress. */
  applyToNewBuckets: boolean
  buckets: BucketParticipation[]
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

export const getMockRestorePointPolicy = (): RestorePointPolicy => ({
  isEnabled: true,
  frequency: 'with-database-backup',
  retentionDays: 90,
  applyToNewBuckets: false,
  buckets: [
    { name: 'match-media', isIncluded: true, sizeBytes: 4.1 * GB },
    { name: 'avatars', isIncluded: true, sizeBytes: 1.4 * GB },
    { name: 'exports', isIncluded: false, sizeBytes: 0.6 * GB },
  ],
})

export const mockDelay = <T>(value: T, ms = 300): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms))
