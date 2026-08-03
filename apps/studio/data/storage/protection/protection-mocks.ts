/**
 * PROTOTYPE mock data for Storage Object Versioning & Deleted files.
 *
 * These features don't have a platform API yet — this module returns
 * deterministic, in-memory sample data so the dashboard surfaces can be
 * designed and demoed end-to-end. The query and mutation hooks in this folder
 * are shaped exactly like the real ones so swapping in a real fetcher later is
 * a localized change.
 */

export type ObjectVersionAction = 'initial upload' | 'overwrite' | 'restore'

export interface ObjectVersion {
  versionId: string
  size: number
  createdAt: string
  isCurrent: boolean
  action: ObjectVersionAction
  heldBySnapshot: string | null
}

export interface TrashObject {
  id: string
  name: string
  originalPath: string
  deletedAt: string
  deletedBy: string
  size: number
  expiresAt: string | null
  heldBySnapshot: boolean
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

export const mockDelay = <T>(value: T, ms = 350): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms))
