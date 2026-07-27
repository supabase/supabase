/**
 * PROTOTYPE mock data for Storage Snapshots & Versioning.
 *
 * These features (object versioning, bucket snapshots, trash) don't have a
 * platform API yet — this module returns deterministic, in-memory sample data so
 * the dashboard surfaces can be designed and demoed end-to-end. The query and
 * mutation hooks in this folder are shaped exactly like the real ones
 * (`useQuery`/`useMutation`, query keys, `enabled` gating) so swapping in a real
 * fetcher later is a localized change.
 */

export type ObjectVersionAction = 'initial upload' | 'overwrite' | 'restore'

export interface ObjectVersion {
  /** Opaque version id returned by the storage API. */
  versionId: string
  size: number
  createdAt: string
  isCurrent: boolean
  action: ObjectVersionAction
  /** Name of a snapshot pinning this version, if any (blocks hard-delete). */
  heldBySnapshot: string | null
}

export type SnapshotTrigger = 'pre-backup' | 'manual'
export type SnapshotStatus = 'available' | 'creating' | 'expired'

export interface BucketSnapshot {
  id: string
  bucketId: string
  createdAt: string
  trigger: SnapshotTrigger
  objectCount: number
  /** Total size of objects captured by the snapshot. */
  sizeBytes: number
  /** Bytes retained *only* because this snapshot exists (the extra cost). */
  heldBytes: number
  status: SnapshotStatus
  expiresAt: string | null
}

export interface TrashObject {
  id: string
  name: string
  /** Folder the object lived in before it was deleted. */
  originalPath: string
  deletedAt: string
  deletedBy: string
  size: number
  expiresAt: string | null
  /** True when a snapshot still references this object (blocks hard-delete). */
  heldBySnapshot: boolean
}

export interface BucketRetentionSummary {
  bucket: string
  live: number
  versions: number
  snapshots: number
  isProtected: boolean
}

export interface StorageRetentionUsage {
  totals: { live: number; versions: number; snapshots: number }
  daily: Array<{ date: string; live: number; versions: number; snapshots: number }>
  byBucket: BucketRetentionSummary[]
}

const GB = 1024 * 1024 * 1024
const MB = 1024 * 1024
const KB = 1024

// A stable "now" for the prototype so relative timestamps read sensibly.
const BASE_DATE = '2026-07-24T09:14:00.000Z'

const daysAgo = (days: number, time = '02:00:00') => {
  const base = new Date(BASE_DATE)
  base.setUTCDate(base.getUTCDate() - days)
  const [h, m, s] = time.split(':').map(Number)
  base.setUTCHours(h, m, s, 0)
  return base.toISOString()
}

const daysAhead = (days: number) => daysAgo(-days)

/**
 * Unlike `daysAgo` (anchored to the fixed `BASE_DATE` so relative labels like
 * "2 days ago" stay stable across the versions/snapshots/trash mocks), the usage
 * chart needs to look current *today*, whenever "today" actually is for whoever
 * is viewing the prototype. Anchored to the real clock, evaluated each time the
 * query runs.
 */
const daysAgoFromNow = (days: number) => {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - days)
  date.setUTCHours(2, 0, 0, 0)
  return date.toISOString()
}

/**
 * Deterministic version history for a given object. The prototype returns a rich
 * 4-version history for any object so the Versions tab is demonstrable whatever
 * file is selected in a real bucket.
 */
export const getMockObjectVersions = (_objectName: string): ObjectVersion[] => [
  {
    versionId: '8f3a2c9b41c1',
    size: 812 * KB,
    createdAt: BASE_DATE,
    isCurrent: true,
    action: 'overwrite',
    heldBySnapshot: null,
  },
  {
    versionId: '2b7d9153aa9e',
    size: 790 * KB,
    createdAt: daysAgo(4, '18:02:00'),
    isCurrent: false,
    action: 'overwrite',
    heldBySnapshot: 'snap_8f3a…c1',
  },
  {
    versionId: 'a19c04f7de40',
    size: 760 * KB,
    createdAt: daysAgo(10, '11:40:00'),
    isCurrent: false,
    action: 'overwrite',
    heldBySnapshot: null,
  },
  {
    versionId: '5c0278b3ac7a',
    size: 744 * KB,
    createdAt: daysAgo(22, '08:20:00'),
    isCurrent: false,
    action: 'initial upload',
    heldBySnapshot: 'snap_a19c…40',
  },
]

export const getMockBucketSnapshots = (bucketId: string): BucketSnapshot[] => [
  {
    id: 'snap_8f3a2c9b41c1',
    bucketId,
    createdAt: daysAgo(0),
    trigger: 'pre-backup',
    objectCount: 1204,
    sizeBytes: 4.8 * GB,
    heldBytes: 0.3 * GB,
    status: 'available',
    expiresAt: daysAhead(88),
  },
  {
    id: 'snap_2b7d9153aa9e',
    bucketId,
    createdAt: daysAgo(1),
    trigger: 'pre-backup',
    objectCount: 1198,
    sizeBytes: 4.7 * GB,
    heldBytes: 0.1 * GB,
    status: 'available',
    expiresAt: daysAhead(87),
  },
  {
    id: 'snap_a19c04f7de40',
    bucketId,
    createdAt: daysAgo(2, '16:12:00'),
    trigger: 'manual',
    objectCount: 1190,
    sizeBytes: 4.6 * GB,
    heldBytes: 1.7 * GB,
    status: 'available',
    expiresAt: null,
  },
  {
    id: 'snap_5c0278b3ac7a',
    bucketId,
    createdAt: daysAgo(3),
    trigger: 'pre-backup',
    objectCount: 1175,
    sizeBytes: 4.5 * GB,
    heldBytes: 0.2 * GB,
    status: 'expired',
    expiresAt: daysAgo(-0),
  },
]

export const getMockTrashObjects = (_bucketId: string): TrashObject[] => [
  {
    id: 'trash-1',
    name: 'round-3/final.png',
    originalPath: 'matches/round-3/',
    deletedAt: daysAgo(0, '07:20:00'),
    deletedBy: 'jane@acme.co',
    size: 1.1 * MB,
    expiresAt: daysAhead(30),
    heldBySnapshot: false,
  },
  {
    id: 'trash-2',
    name: 'roster.csv',
    originalPath: 'exports/',
    deletedAt: daysAgo(1, '14:20:00'),
    deletedBy: 'api key ····a91',
    size: 44 * KB,
    expiresAt: daysAhead(29),
    heldBySnapshot: false,
  },
  {
    id: 'trash-3',
    name: 'og/banner.png',
    originalPath: 'og/',
    deletedAt: daysAgo(3, '09:02:00'),
    deletedBy: 'jane@acme.co',
    size: 820 * KB,
    expiresAt: null,
    heldBySnapshot: true,
  },
]

/** Day-over-day growth, oldest first, ending "today" — evaluated at fetch time. */
const RETENTION_DAILY_GROWTH = [
  { daysAgo: 6, live: 4.1 * GB, versions: 1.4 * GB, snapshots: 2.6 * GB },
  { daysAgo: 5, live: 4.3 * GB, versions: 1.5 * GB, snapshots: 2.7 * GB },
  { daysAgo: 4, live: 4.4 * GB, versions: 1.6 * GB, snapshots: 2.7 * GB },
  { daysAgo: 3, live: 4.6 * GB, versions: 1.7 * GB, snapshots: 2.8 * GB },
  { daysAgo: 2, live: 4.7 * GB, versions: 1.8 * GB, snapshots: 2.9 * GB },
  { daysAgo: 1, live: 5.4 * GB, versions: 2.1 * GB, snapshots: 3.0 * GB },
  { daysAgo: 0, live: 6.1 * GB, versions: 2.4 * GB, snapshots: 3.2 * GB },
]

export const getMockRetentionUsage = (): StorageRetentionUsage => {
  const daily = RETENTION_DAILY_GROWTH.map(({ daysAgo: offset, live, versions, snapshots }) => ({
    date: daysAgoFromNow(offset),
    live,
    versions,
    snapshots,
  }))

  // Derive totals from today's entry (the last day) so the usage breakdown and
  // the chart's most recent bar can never drift out of sync with each other.
  const today = daily[daily.length - 1]

  return {
    totals: { live: today.live, versions: today.versions, snapshots: today.snapshots },
    daily,
    byBucket: [
      {
        bucket: 'match-media',
        live: 4.1 * GB,
        versions: 1.9 * GB,
        snapshots: 3.2 * GB,
        isProtected: true,
      },
      { bucket: 'avatars', live: 1.4 * GB, versions: 0.5 * GB, snapshots: 0, isProtected: true },
      { bucket: 'exports', live: 0.6 * GB, versions: 0, snapshots: 0, isProtected: false },
    ],
  }
}

/** Simulate network latency so loading states are demonstrable. */
export const mockDelay = <T>(value: T, ms = 350): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms))
