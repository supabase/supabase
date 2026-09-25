import { queryOptions } from '@tanstack/react-query'
import { components } from 'api-types'

import { storageKeys } from '../keys'
import type { ObjectVersionAction } from './object-versions-query'
import { handleError, post } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

type StorageObjectV2 = components['schemas']['StorageListResponseV2_Output']['objects'][number]

export interface ArchivedObjectVersion {
  versionId: string
  size: number
  createdAt: string
  action: ObjectVersionAction
  /** What the preview renders from. A delete marker carries no metadata. */
  mimeType?: string
}

export interface ArchivedObject {
  id: string
  /** Full path including the file name. Only `getArchivedSegments` splits it. */
  path: string
  archivedAt: string
  /** The version live when the object was archived, i.e. the one under the delete marker. */
  currentVersion: ArchivedObjectVersion
  /** Newest first. */
  noncurrentVersions: ArchivedObjectVersion[]
}

export type ArchivedObjectsVariables = {
  projectRef?: string
  bucketId?: string
}

export type ArchivedObjectsError = ResponseError

const PAGE_SIZE = 1000
// Bounded so a pathological bucket can't page forever.
const MAX_PAGES = 20

const toVersion = (object: StorageObjectV2, action: ObjectVersionAction) => ({
  versionId: object.version as string,
  size: Number(object.metadata?.size ?? 0),
  createdAt: object.created_at ?? object.updated_at ?? '',
  action,
  mimeType: object.metadata?.mimetype ?? undefined,
})

/** An object is archived when the row currently at its path is a delete marker. */
export const toArchivedObjects = (objects: StorageObjectV2[]): ArchivedObject[] => {
  const byPath = new Map<string, StorageObjectV2[]>()
  for (const object of objects) {
    if (!object.version) continue
    const rows = byPath.get(object.name) ?? []
    rows.push(object)
    byPath.set(object.name, rows)
  }

  const archived: ArchivedObject[] = []

  for (const [path, rows] of byPath) {
    const sorted = [...rows].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    const current = sorted.find((row) => !row.archived_at)
    if (!current?.is_delete_marker) continue

    const retained = sorted.filter((row) => row !== current && !row.is_delete_marker)
    const [liveAtArchive, ...rest] = retained
    if (liveAtArchive === undefined) continue

    archived.push({
      id: current.version as string,
      path,
      archivedAt: current.created_at ?? current.updated_at ?? '',
      currentVersion: toVersion(liveAtArchive, rest.length === 0 ? 'initial upload' : 'overwrite'),
      noncurrentVersions: rest.map((row, index) =>
        toVersion(row, index === rest.length - 1 ? 'initial upload' : 'overwrite')
      ),
    })
  }

  return archived.sort((a, b) => b.archivedAt.localeCompare(a.archivedAt))
}

async function getArchivedObjects(
  { projectRef, bucketId }: ArchivedObjectsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')

  const objects: StorageObjectV2[] = []
  let cursor: string | undefined

  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await post('/platform/storage/{ref}/buckets/{id}/objects/list-v2', {
      params: { path: { ref: projectRef, id: bucketId } },
      body: {
        limit: PAGE_SIZE,
        cursor,
        // Flat: the overlay synthesizes folders from full paths, so it needs the whole bucket.
        with_delimiter: false,
        noncurrentVersions: 'include',
        deleteMarkers: 'include',
      },
      signal,
    })

    if (error) handleError(error)
    objects.push(...(data?.objects ?? []))

    if (!data?.hasNext || !data.nextCursor) break
    cursor = data.nextCursor
  }

  return toArchivedObjects(objects)
}

export type ArchivedObjectsData = Awaited<ReturnType<typeof getArchivedObjects>>

export const archivedObjectsQueryOptions = ({ projectRef, bucketId }: ArchivedObjectsVariables) =>
  queryOptions({
    queryKey: storageKeys.archivedObjects(projectRef, bucketId),
    queryFn: ({ signal }) => getArchivedObjects({ projectRef, bucketId }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined' && typeof bucketId !== 'undefined',
  })
