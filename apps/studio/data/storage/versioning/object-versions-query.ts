import { queryOptions } from '@tanstack/react-query'
import { components } from 'api-types'

import { storageKeys } from '../keys'
import { handleError, post } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'

type StorageObject = components['schemas']['StorageObject_Output']

/**
 * A `delete marker` can outlive the delete, so a live file's history can contain them.
 * Restores read as overwrites: the list endpoint carries no provenance field.
 */
export type ObjectVersionAction = 'initial upload' | 'overwrite' | 'delete marker'

export interface ObjectVersion {
  versionId: string
  size: number
  /** An overwrite can change the type, so each version carries its own. */
  mimeType?: string
  createdAt: string
  archivedAt: string | null
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

export type ObjectVersionsError = StudioError

// The ceiling the list endpoint accepts.
const MAX_VERSIONS = 1000

/** Current first, then newest archived version. The oldest upload has no explicit flag. */
export const toObjectVersions = (objects: StorageObject[]): ObjectVersion[] => {
  const versions = objects
    .filter((object) => !!object.version)
    .map((object) => ({
      versionId: object.version as string,
      size: Number(object.metadata?.size ?? 0),
      // `metadata` is an untyped bag, so narrow rather than trust it.
      mimeType:
        typeof object.metadata?.mimetype === 'string' ? object.metadata.mimetype : undefined,
      createdAt: object.created_at ?? object.updated_at ?? '',
      archivedAt: object.archived_at ?? null,
      isCurrent: !object.archived_at,
      isDeleteMarker: !!object.is_delete_marker,
    }))

  const oldestUpload = versions
    .filter((version) => !version.isDeleteMarker)
    .reduce<(typeof versions)[number] | undefined>(
      (oldest, version) =>
        oldest === undefined || version.createdAt < oldest.createdAt ? version : oldest,
      undefined
    )

  return versions
    .sort((a, b) => {
      if (a.archivedAt === null) return b.archivedAt === null ? 0 : -1
      if (b.archivedAt === null) return 1
      return b.archivedAt.localeCompare(a.archivedAt)
    })
    .map(({ isDeleteMarker, ...version }) => {
      if (isDeleteMarker) return { ...version, action: 'delete marker' as const }
      return {
        ...version,
        action:
          version.versionId === oldestUpload?.versionId
            ? ('initial upload' as const)
            : ('overwrite' as const),
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
