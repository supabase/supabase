/**
 * PROTOTYPE mock data for Storage Object Versioning & Deleted files.
 *
 * These features don't have a platform API yet — this module returns
 * deterministic, in-memory sample data so the dashboard surfaces can be
 * designed and demoed end-to-end. The query and mutation hooks in this folder
 * are shaped exactly like the real ones so swapping in a real fetcher later is
 * a localized change.
 *
 * The trash store below lives in a plain module-level variable (not
 * persisted), so restoring/permanently deleting a file during a session is
 * visible immediately across the app, and resets the moment the page is
 * refreshed.
 */

export type ObjectVersionAction = 'initial upload' | 'overwrite' | 'restore'

export interface ObjectVersion {
  versionId: string
  size: number
  createdAt: string
  isCurrent: boolean
  action: ObjectVersionAction
}

/** A noncurrent version attached to a deleted object (or a standalone noncurrent version). */
export interface DeletedObjectVersion {
  versionId: string
  size: number
  createdAt: string
  action: ObjectVersionAction
}

export interface TrashObject {
  id: string
  name: string
  originalPath: string
  deletedAt: string
  deletedBy: string
  size: number
  expiresAt: string | null
  /** Noncurrent versions still retained for this object, oldest last. */
  noncurrentVersions?: DeletedObjectVersion[]
}

const MB = 1024 * 1024
const KB = 1024

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
 * Unlike `daysAgo` (anchored to the fixed `BASE_DATE` so relative labels stay
 * stable across the versions/trash mocks), the usage chart needs to look
 * current whenever "today" actually is for whoever is viewing the prototype —
 * anchored to the real clock, evaluated each time the query runs.
 */
const daysAgoFromNow = (days: number) => {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - days)
  date.setUTCHours(2, 0, 0, 0)
  return date.toISOString()
}

export const getMockObjectVersions = (_objectName: string): ObjectVersion[] => [
  {
    versionId: '8f3a2c9b41c1',
    size: 812 * KB,
    createdAt: BASE_DATE,
    isCurrent: true,
    action: 'overwrite',
  },
  {
    versionId: '2b7d9153aa9e',
    size: 790 * KB,
    createdAt: daysAgo(4, '18:02:00'),
    isCurrent: false,
    action: 'overwrite',
  },
  {
    versionId: 'a19c04f7de40',
    size: 760 * KB,
    createdAt: daysAgo(10, '11:40:00'),
    isCurrent: false,
    action: 'overwrite',
  },
  {
    versionId: '5c0278b3ac7a',
    size: 744 * KB,
    createdAt: daysAgo(22, '08:20:00'),
    isCurrent: false,
    action: 'initial upload',
  },
]

/**
 * Mutable in-memory "deleted files" store. Shared across buckets, mirroring
 * the previous stateless mock's behavior of returning the same list
 * regardless of bucketId — only mutated via restore/delete below.
 */
let trashObjects: TrashObject[] = [
  {
    id: 'trash-1',
    name: 'round-3/final.png',
    originalPath: 'matches/round-3/',
    deletedAt: daysAgo(0, '07:20:00'),
    deletedBy: 'jane@acme.co',
    size: 1.1 * MB,
    expiresAt: daysAhead(30),
    noncurrentVersions: [
      {
        versionId: 'v-t1-a',
        size: 1.05 * MB,
        createdAt: daysAgo(2, '14:00:00'),
        action: 'overwrite',
      },
      {
        versionId: 'v-t1-b',
        size: 980 * KB,
        createdAt: daysAgo(8, '09:30:00'),
        action: 'initial upload',
      },
    ],
  },
  {
    id: 'trash-2',
    name: 'roster.csv',
    originalPath: 'exports/',
    deletedAt: daysAgo(1, '14:20:00'),
    deletedBy: 'api key ····a91',
    size: 44 * KB,
    expiresAt: daysAhead(29),
  },
  {
    id: 'trash-3',
    name: 'og/banner.png',
    originalPath: 'og/',
    deletedAt: daysAgo(3, '09:02:00'),
    deletedBy: 'jane@acme.co',
    size: 820 * KB,
    expiresAt: daysAhead(27),
    noncurrentVersions: [
      {
        versionId: 'v-t3-a',
        size: 790 * KB,
        createdAt: daysAgo(12, '16:00:00'),
        action: 'overwrite',
      },
      {
        versionId: 'v-t3-b',
        size: 750 * KB,
        createdAt: daysAgo(20, '10:15:00'),
        action: 'overwrite',
      },
      {
        versionId: 'v-t3-c',
        size: 710 * KB,
        createdAt: daysAgo(28, '08:00:00'),
        action: 'initial upload',
      },
    ],
  },
  {
    id: 'trash-4',
    name: 'avatars/user-42.jpg',
    originalPath: 'avatars/',
    deletedAt: daysAgo(5, '16:45:00'),
    deletedBy: 'mark@acme.co',
    size: 2.3 * MB,
    expiresAt: daysAhead(25),
    noncurrentVersions: [
      {
        versionId: 'v-t4-a',
        size: 2.1 * MB,
        createdAt: daysAgo(15, '11:20:00'),
        action: 'overwrite',
      },
    ],
  },
  {
    id: 'trash-5',
    name: '2026-06-report.pdf',
    originalPath: 'exports/',
    deletedAt: daysAgo(7, '10:00:00'),
    deletedBy: 'api key ····f21',
    size: 512 * KB,
    expiresAt: daysAhead(23),
  },
  {
    id: 'trash-6',
    name: 'round-2/preview.webp',
    originalPath: 'matches/round-2/thumbnails/',
    deletedAt: daysAgo(2, '19:30:00'),
    deletedBy: 'jane@acme.co',
    size: 96 * KB,
    expiresAt: daysAhead(28),
  },
  {
    id: 'trash-7',
    name: 'debug-2026-07-01.log',
    originalPath: 'logs/',
    deletedAt: daysAgo(14, '03:12:00'),
    deletedBy: 'system',
    size: 3.4 * MB,
    expiresAt: daysAhead(16),
  },
  {
    id: 'trash-8',
    name: 'old-assets.zip',
    originalPath: 'archive/',
    deletedAt: daysAgo(29, '23:55:00'),
    deletedBy: 'jane@acme.co',
    size: 18 * MB,
    expiresAt: daysAhead(1),
  },
]

export const getMockTrashObjects = (_bucketId: string): TrashObject[] => [...trashObjects]

/** Removes the given ids from the trash store, simulating a restore. */
export const restoreMockTrashObjects = (objectIds: string[]): TrashObject[] => {
  trashObjects = trashObjects.filter((object) => !objectIds.includes(object.id))
  return [...trashObjects]
}

/**
 * Removes the given ids from the trash store, simulating a permanent delete.
 * When `objectIds` is omitted, deletes every object (mirrors the "Delete all
 * permanently" action).
 */
export const deleteMockTrashObjectsPermanently = (objectIds?: string[]): TrashObject[] => {
  trashObjects = objectIds ? trashObjects.filter((object) => !objectIds.includes(object.id)) : []
  return [...trashObjects]
}

export interface BucketRetentionSummary {
  bucket: string
  live: number
  noncurrentVersions: number
  softDeleted: number
  isVersioned: boolean
}

export interface RetentionDayPoint {
  date: string
  live: number
  noncurrentVersions: number
  softDeleted: number
}

export interface StorageRetentionUsage {
  totals: { live: number; noncurrentVersions: number; softDeleted: number }
  daily: RetentionDayPoint[]
  byBucket: BucketRetentionSummary[]
}

const GB = 1024 * MB

/**
 * Day-over-day growth for the Storage Size usage chart, oldest first, ending
 * "today". `noncurrentVersions` and `softDeleted` are both the "retained
 * recovery data" driven by versioning — kept separate so the breakdown can
 * show which one is dominating.
 */
const RETENTION_DAILY_GROWTH = [
  { daysAgo: 6, live: 4.1 * GB, noncurrentVersions: 0.9 * GB, softDeleted: 0.5 * GB },
  { daysAgo: 5, live: 4.3 * GB, noncurrentVersions: 1.0 * GB, softDeleted: 0.5 * GB },
  { daysAgo: 4, live: 4.4 * GB, noncurrentVersions: 1.05 * GB, softDeleted: 0.55 * GB },
  { daysAgo: 3, live: 4.6 * GB, noncurrentVersions: 1.1 * GB, softDeleted: 0.6 * GB },
  { daysAgo: 2, live: 4.7 * GB, noncurrentVersions: 1.15 * GB, softDeleted: 0.65 * GB },
  { daysAgo: 1, live: 5.4 * GB, noncurrentVersions: 1.35 * GB, softDeleted: 0.75 * GB },
  { daysAgo: 0, live: 6.1 * GB, noncurrentVersions: 1.55 * GB, softDeleted: 0.85 * GB },
]

export const getMockRetentionUsage = (): StorageRetentionUsage => {
  const daily = RETENTION_DAILY_GROWTH.map(
    ({ daysAgo: offset, live, noncurrentVersions, softDeleted }) => ({
      date: daysAgoFromNow(offset),
      live,
      noncurrentVersions,
      softDeleted,
    })
  )

  // Derive totals from today's entry (the last day) so the breakdown and the
  // chart's most recent bar can never drift out of sync with each other.
  const today = daily[daily.length - 1]

  return {
    totals: {
      live: today.live,
      noncurrentVersions: today.noncurrentVersions,
      softDeleted: today.softDeleted,
    },
    daily,
    byBucket: [
      {
        bucket: 'match-media',
        live: 4.1 * GB,
        noncurrentVersions: 1.2 * GB,
        softDeleted: 0.7 * GB,
        isVersioned: true,
      },
      {
        bucket: 'avatars',
        live: 1.4 * GB,
        noncurrentVersions: 0.35 * GB,
        softDeleted: 0.15 * GB,
        isVersioned: true,
      },
      {
        bucket: 'exports',
        live: 0.6 * GB,
        noncurrentVersions: 0,
        softDeleted: 0,
        isVersioned: false,
      },
    ],
  }
}

export const mockDelay = <T>(value: T, ms = 350): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms))
