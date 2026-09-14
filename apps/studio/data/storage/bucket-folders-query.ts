import { queryOptions } from '@tanstack/react-query'

import { listBucketObjects } from './bucket-objects-list-mutation'
import { storageKeys } from './keys'
import type { ResponseError } from '@/types'

/** Number of objects requested per folder listing */
const PAGE_LIMIT = 1000
/** Cap on how many listings the crawl issues, to bound the cost on very large buckets */
const MAX_LISTINGS = 200
/** Cap on how many folders are collected, to bound the size of the result */
const MAX_FOLDERS = 1000
/** How many listings are issued at a time while crawling */
const CONCURRENCY = 5

export type StorageFolder = {
  /** Folder name, without any of its parents */
  name: string
  /** Full path to the folder from the root of the bucket, e.g. `photos/2024` */
  path: string
}

export type BucketFoldersVariables = {
  projectRef?: string
  bucketId?: string
}

export type BucketFoldersData = {
  folders: StorageFolder[]
  /** True when the crawl hit its limits, so `folders` is only part of the bucket */
  isTruncated: boolean
}

export type BucketFoldersError = ResponseError

const listFolderNames = async (
  { projectRef, bucketId, path }: { projectRef: string; bucketId: string; path: string },
  signal?: AbortSignal
) => {
  const objects = await listBucketObjects(
    {
      projectRef,
      bucketId,
      path,
      options: { limit: PAGE_LIMIT, offset: 0, sortBy: { column: 'name', order: 'asc' } },
    },
    signal
  )
  // Objects without an id are prefixes (folders) rather than files
  return (objects ?? []).filter((object) => !object.id).map((object) => object.name)
}

/**
 * Crawls a bucket breadth first and returns every folder in it, so that folders can be
 * searched client side. Bounded by `MAX_LISTINGS` and `MAX_FOLDERS` — when either limit is
 * reached the crawl stops early and `isTruncated` is set.
 */
async function getBucketFolders(
  { projectRef, bucketId }: BucketFoldersVariables,
  signal?: AbortSignal
): Promise<BucketFoldersData> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')

  const folders: StorageFolder[] = []
  let queue = ['']
  let listings = 0
  let isTruncated = false

  while (queue.length > 0) {
    if (listings >= MAX_LISTINGS || folders.length >= MAX_FOLDERS) {
      isTruncated = true
      break
    }

    const batch = queue.slice(0, CONCURRENCY)
    queue = queue.slice(CONCURRENCY)
    listings += batch.length

    const results = await Promise.all(
      batch.map(async (path) => ({
        path,
        names: await listFolderNames({ projectRef, bucketId, path }, signal),
      }))
    )

    for (const { path, names } of results) {
      for (const name of names) {
        const folderPath = path.length > 0 ? `${path}/${name}` : name
        folders.push({ name, path: folderPath })
        queue.push(folderPath)
      }
    }
  }

  return { folders: folders.slice(0, MAX_FOLDERS), isTruncated: isTruncated || queue.length > 0 }
}

export const bucketFoldersQueryOptions = ({ projectRef, bucketId }: BucketFoldersVariables) =>
  queryOptions({
    queryKey: storageKeys.folders(projectRef, bucketId),
    queryFn: ({ signal }) => getBucketFolders({ projectRef, bucketId }, signal),
    enabled: typeof projectRef !== 'undefined' && typeof bucketId !== 'undefined',
    // The crawl is expensive, so hold onto the result for the lifetime of a picker session
    staleTime: 60 * 1000,
  })
