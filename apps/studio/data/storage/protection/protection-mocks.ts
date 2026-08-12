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

/**
 * Options that let the mock adapt its version list to the bucket's current
 * lifecycle policy, so the labels rendered against it always make sense in
 * context — e.g. never returning a version older than the retention window
 * (which would render as "Past Nd limit") and never returning more than the
 * configured cap (which would render as "#3 of 2").
 *
 * `null`/omitted means "no limit for that condition" — matches the shape of
 * `BucketProtection.versionExpiryDays` / `maxNoncurrentVersions`.
 */
export interface MockObjectVersionsOptions {
  cap?: number | null
  expiryDays?: number | null
}

/**
 * Noncurrent version templates, newest first. Ages are picked to spread across
 * common retention windows so at least one shows a near-expiry countdown under
 * typical (30d) settings, while tighter policies still leave the freshest
 * couple retained.
 */
const NONCURRENT_VERSION_TEMPLATES: Array<{
  versionId: string
  size: number
  daysAgo: number
  action: ObjectVersionAction
}> = [
  { versionId: '2b7d9153aa9e', size: 790 * KB, daysAgo: 1, action: 'overwrite' },
  { versionId: 'a19c04f7de40', size: 760 * KB, daysAgo: 3, action: 'overwrite' },
  { versionId: '5c0278b3ac7a', size: 744 * KB, daysAgo: 8, action: 'overwrite' },
  { versionId: '9f4e1a2b8c3d', size: 720 * KB, daysAgo: 20, action: 'overwrite' },
  { versionId: '6a1b8d2f5c47', size: 705 * KB, daysAgo: 27, action: 'overwrite' },
  { versionId: '3e7c2b91da85', size: 680 * KB, daysAgo: 60, action: 'initial upload' },
]

export const getMockObjectVersions = (
  _objectName: string,
  options: MockObjectVersionsOptions = {}
): ObjectVersion[] => {
  const cap = options.cap ?? null
  const expiryDays = options.expiryDays ?? null
  const hasCap = cap !== null && cap > 0
  const hasExpiryDays = expiryDays !== null && expiryDays > 0

  const current: ObjectVersion = {
    versionId: '8f3a2c9b41c1',
    size: 812 * KB,
    createdAt: daysAgoFromNow(0),
    isCurrent: true,
    action: 'overwrite',
  }

  let noncurrent = NONCURRENT_VERSION_TEMPLATES
  // Retention: drop templates whose age would render as "Past Nd limit". Keep
  // a 1-day buffer so time-of-day rounding in the indicator can't push a
  // surviving version over the edge.
  if (hasExpiryDays) noncurrent = noncurrent.filter((v) => v.daysAgo < expiryDays - 1)
  // Cap: never return more than the configured maximum so the "#N of cap"
  // label is always valid.
  if (hasCap) noncurrent = noncurrent.slice(0, cap)

  return [
    current,
    ...noncurrent.map((v) => ({
      versionId: v.versionId,
      size: v.size,
      createdAt: daysAgoFromNow(v.daysAgo),
      isCurrent: false,
      action: v.action,
    })),
  ]
}

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
        createdAt: daysAgo(5, '11:00:00'),
        action: 'overwrite',
      },
      {
        versionId: 'v-t1-c',
        size: 940 * KB,
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
        createdAt: daysAgo(6, '16:00:00'),
        action: 'overwrite',
      },
      {
        versionId: 'v-t3-b',
        size: 750 * KB,
        createdAt: daysAgo(12, '10:15:00'),
        action: 'overwrite',
      },
      {
        versionId: 'v-t3-c',
        size: 720 * KB,
        createdAt: daysAgo(18, '14:30:00'),
        action: 'overwrite',
      },
      {
        versionId: 'v-t3-d',
        size: 710 * KB,
        createdAt: daysAgo(25, '08:00:00'),
        action: 'overwrite',
      },
      {
        versionId: 'v-t3-e',
        size: 680 * KB,
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
        createdAt: daysAgo(10, '11:20:00'),
        action: 'overwrite',
      },
      {
        versionId: 'v-t4-b',
        size: 1.95 * MB,
        createdAt: daysAgo(15, '09:10:00'),
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
    noncurrentVersions: [
      {
        versionId: 'v-t5-a',
        size: 498 * KB,
        createdAt: daysAgo(14, '15:30:00'),
        action: 'overwrite',
      },
      {
        versionId: 'v-t5-b',
        size: 480 * KB,
        createdAt: daysAgo(21, '09:00:00'),
        action: 'initial upload',
      },
    ],
  },
  {
    id: 'trash-6',
    name: 'round-2/preview.webp',
    originalPath: 'matches/round-2/thumbnails/',
    deletedAt: daysAgo(2, '19:30:00'),
    deletedBy: 'jane@acme.co',
    size: 96 * KB,
    expiresAt: daysAhead(28),
    noncurrentVersions: [
      {
        versionId: 'v-t6-a',
        size: 88 * KB,
        createdAt: daysAgo(7, '12:00:00'),
        action: 'overwrite',
      },
    ],
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
  {
    id: 'trash-9',
    name: 'hero-v2.mp4',
    originalPath: 'marketing/videos/',
    deletedAt: daysAgo(1, '08:15:00'),
    deletedBy: 'mark@acme.co',
    size: 24.5 * MB,
    expiresAt: daysAhead(29),
    noncurrentVersions: [
      {
        versionId: 'v-t9-a',
        size: 22.1 * MB,
        createdAt: daysAgo(4, '17:00:00'),
        action: 'overwrite',
      },
      {
        versionId: 'v-t9-b',
        size: 20.8 * MB,
        createdAt: daysAgo(9, '10:45:00'),
        action: 'overwrite',
      },
      {
        versionId: 'v-t9-c',
        size: 19.2 * MB,
        createdAt: daysAgo(16, '14:20:00'),
        action: 'initial upload',
      },
    ],
  },
  {
    id: 'trash-10',
    name: 'config.json',
    originalPath: 'settings/',
    deletedAt: daysAgo(0, '11:05:00'),
    deletedBy: 'api key ····b72',
    size: 2.4 * KB,
    expiresAt: daysAhead(30),
    noncurrentVersions: [
      {
        versionId: 'v-t10-a',
        size: 2.2 * KB,
        createdAt: daysAgo(1, '09:00:00'),
        action: 'overwrite',
      },
      {
        versionId: 'v-t10-b',
        size: 2.0 * KB,
        createdAt: daysAgo(3, '16:30:00'),
        action: 'overwrite',
      },
      {
        versionId: 'v-t10-c',
        size: 1.8 * KB,
        createdAt: daysAgo(5, '12:00:00'),
        action: 'overwrite',
      },
      {
        versionId: 'v-t10-d',
        size: 1.5 * KB,
        createdAt: daysAgo(8, '08:00:00'),
        action: 'overwrite',
      },
      {
        versionId: 'v-t10-e',
        size: 1.2 * KB,
        createdAt: daysAgo(12, '14:00:00'),
        action: 'overwrite',
      },
      {
        versionId: 'v-t10-f',
        size: 1.0 * KB,
        createdAt: daysAgo(18, '10:00:00'),
        action: 'initial upload',
      },
    ],
  },
  {
    id: 'trash-11',
    name: 'team-photo.heic',
    originalPath: 'gallery/',
    deletedAt: daysAgo(4, '13:40:00'),
    deletedBy: 'jane@acme.co',
    size: 5.8 * MB,
    expiresAt: daysAhead(26),
    noncurrentVersions: [
      {
        versionId: 'v-t11-a',
        size: 5.5 * MB,
        createdAt: daysAgo(10, '11:00:00'),
        action: 'overwrite',
      },
    ],
  },
  {
    id: 'trash-12',
    name: 'invoice-0042.pdf',
    originalPath: 'billing/',
    deletedAt: daysAgo(6, '22:10:00'),
    deletedBy: 'api key ····a91',
    size: 128 * KB,
    expiresAt: daysAhead(24),
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

/** Permanently deletes a single noncurrent version from a trash object. */
export const deleteNoncurrentVersionPermanently = (
  objectId: string,
  versionId: string
): TrashObject[] => {
  trashObjects = trashObjects.map((obj) => {
    if (obj.id !== objectId) return obj
    return {
      ...obj,
      noncurrentVersions: (obj.noncurrentVersions ?? []).filter((v) => v.versionId !== versionId),
    }
  })
  return [...trashObjects]
}

/**
 * Permanently deletes the version that was live the moment this object was
 * archived — the one row of the merged version list that isn't in
 * `noncurrentVersions` (it's represented by the object's own `size`/
 * `deletedAt` instead, since that's the delete marker's abstracted-away
 * predecessor). The next most recent noncurrent version, if any, is promoted
 * to take its place; if there wasn't one, there's nothing left worth keeping
 * archived, so the whole group is dropped — equivalent to a full permanent
 * delete.
 */
export const deleteCurrentTrashVersionPermanently = (objectId: string): TrashObject[] => {
  trashObjects = trashObjects.flatMap((obj) => {
    if (obj.id !== objectId) return [obj]
    const [next, ...rest] = obj.noncurrentVersions ?? []
    if (!next) return []
    return [{ ...obj, size: next.size, noncurrentVersions: rest }]
  })
  return [...trashObjects]
}

/**
 * Restores a single version from trash. Every version in an archived
 * object's history sits behind the same delete marker, so restoring any one
 * of them — not just the one that was live when it was archived — un-archives
 * the whole group and removes that marker; there's no such thing as
 * restoring just one version while the rest stays archived. `versionId` only
 * distinguishes which version the caller wants surfaced as current in its
 * own toast copy — the mock itself doesn't have a live object store to
 * promote it into, so it's otherwise unused here.
 */
export const restoreNoncurrentVersion = (objectId: string, _versionId: string): TrashObject[] => {
  return restoreMockTrashObjects([objectId])
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
