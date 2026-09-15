import { queryOptions } from '@tanstack/react-query'

import { listBucketObjects } from './bucket-objects-list-mutation'
import { storageKeys } from './keys'
import type { ResponseError } from '@/types'

/** Number of objects requested per folder listing */
const PAGE_LIMIT = 1000
/** Cap on how many listings the crawl issues */
const MAX_LISTINGS = 200
/** Cap on how many folders are collected */
const MAX_FOLDERS = 1000
/** How many listings are issued at a time while crawling */
const CONCURRENCY = 5

export type StorageFolder = {
  name: string
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

/** Pages through a single folder, counting each page fetched against the shared `listingsState` */
const listFolderNames = async (
  { projectRef, bucketId, path }: { projectRef: string; bucketId: string; path: string },
  listingsState: { count: number },
  signal?: AbortSignal
): Promise<{ names: string[]; isTruncated: boolean }> => {
  const names: string[] = []
  let offset = 0

  while (true) {
    if (listingsState.count >= MAX_LISTINGS) {
      return { names, isTruncated: true }
    }

    listingsState.count++
    const objects = await listBucketObjects(
      {
        projectRef,
        bucketId,
        path,
        options: { limit: PAGE_LIMIT, offset, sortBy: { column: 'name', order: 'asc' } },
      },
      signal
    )

    const page = objects ?? []
    // Objects without an id are prefixes (folders) rather than files
    names.push(...page.filter((object) => !object.id).map((object) => object.name))

    if (page.length < PAGE_LIMIT) return { names, isTruncated: false }
    offset += PAGE_LIMIT
  }
}

/** Crawls a bucket breadth first for every folder, stopping early once `MAX_LISTINGS`/`MAX_FOLDERS` is hit */
async function getBucketFolders(
  { projectRef, bucketId }: BucketFoldersVariables,
  signal?: AbortSignal
): Promise<BucketFoldersData> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')

  const folders: StorageFolder[] = []
  let queue = ['']
  const listingsState = { count: 0 }
  let isTruncated = false

  while (queue.length > 0) {
    if (listingsState.count >= MAX_LISTINGS || folders.length >= MAX_FOLDERS) {
      isTruncated = true
      break
    }

    const batch = queue.slice(0, CONCURRENCY)
    queue = queue.slice(CONCURRENCY)

    const results = await Promise.all(
      batch.map(async (path) => {
        const { names, isTruncated: isPathTruncated } = await listFolderNames(
          { projectRef, bucketId, path },
          listingsState,
          signal
        )
        return { path, names, isTruncated: isPathTruncated }
      })
    )

    for (const { path, names, isTruncated: isPathTruncated } of results) {
      if (isPathTruncated) isTruncated = true
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
