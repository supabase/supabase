import { queryOptions } from '@tanstack/react-query'
import { components } from 'api-types'

import { storageKeys } from '../keys'
import { handleError, post } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

type StorageObject = components['schemas']['StorageObject_Output']

/**
 * A `delete marker` can outlive the delete, so a live file's history can contain them.
 * Restores read as overwrites: the list endpoint carries no provenance field.
 */
export type ObjectVersionAction = 'initial upload' | 'overwrite' | 'delete marker'

export interface ObjectVersion {
  versionId: string
  size: number
  createdAt: string
  isCurrent: boolean
  action: ObjectVersionAction
}

export interface LifecyclePolicy {
  /** `null` when no age condition is set. */
  expiryDays: number | null
  /** `null` when no version cap is set. */
  maxVersions: number | null
}

export type ObjectVersionsVariables = {
  projectRef?: string
  bucketId?: string
  /** The object's full path within the bucket, not just its leaf name. */
  path?: string
  lifecyclePolicy?: LifecyclePolicy
}

export type ObjectVersionsError = ResponseError

// The ceiling the list endpoint accepts.
const MAX_VERSIONS = 1000

/** Newest first. The oldest surviving row is labelled the initial upload; there is no flag for it. */
export const toObjectVersions = (objects: StorageObject[]): ObjectVersion[] => {
  const versions = objects
    .filter((object) => !!object.version)
    .map((object) => ({
      versionId: object.version as string,
      size: Number(object.metadata?.size ?? 0),
      createdAt: object.created_at ?? object.updated_at ?? '',
      isCurrent: !object.archived_at,
      isDeleteMarker: !!object.is_delete_marker,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const oldestUploadIndex = versions.reduce(
    (oldest, version, index) => (version.isDeleteMarker ? oldest : index),
    -1
  )

  return versions.map(({ isDeleteMarker, ...version }, index) => {
    if (isDeleteMarker) return { ...version, action: 'delete marker' as const }
    return {
      ...version,
      action: index === oldestUploadIndex ? ('initial upload' as const) : ('overwrite' as const),
    }
  })
}

async function getObjectVersions(
  { projectRef, bucketId, path }: ObjectVersionsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')
  if (!path) throw new Error('path is required')

  const { data, error } = await post('/platform/storage/{ref}/buckets/{id}/objects/list', {
    params: { path: { ref: projectRef, id: bucketId } },
    body: {
      path,
      options: {
        limit: MAX_VERSIONS,
        // Without `exactMatch` the path reads as a folder prefix, returning every sibling.
        exactMatch: true,
        noncurrentVersions: 'include',
        deleteMarkers: 'include',
      },
    },
    signal,
  })

  if (error) handleError(error)
  return toObjectVersions(data ?? [])
}

export type ObjectVersionsData = Awaited<ReturnType<typeof getObjectVersions>>

export const objectVersionsQueryOptions = ({
  projectRef,
  bucketId,
  path,
  lifecyclePolicy,
}: ObjectVersionsVariables) =>
  queryOptions({
    queryKey: storageKeys.objectVersions(projectRef, bucketId, path, lifecyclePolicy),
    queryFn: ({ signal }) => getObjectVersions({ projectRef, bucketId, path }, signal),
    enabled:
      IS_PLATFORM &&
      typeof projectRef !== 'undefined' &&
      typeof bucketId !== 'undefined' &&
      typeof path !== 'undefined',
  })
