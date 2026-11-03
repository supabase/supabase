import { listBucketObjects, type StorageObject } from './bucket-objects-list-mutation'

/** Max objects fetched per list request */
export const CRAWL_PAGE_LIMIT = 1000
/** Max list requests made in a single crawl */
export const CRAWL_MAX_LISTINGS = 200
/** How many list requests run in parallel while crawling */
const CRAWL_CONCURRENCY = 5

type CrawlBucketVariables = {
  projectRef: string
  bucketId: string
  /**
   * Called once per list request, with the objects in it and the folder they came from.
   * Return `false` to stop the crawl — callers use this to cap what they collect.
   */
  onPage: (objects: StorageObject[], parentPath: string) => boolean | void
  /** Called after every list request with the running totals for the crawl */
  onProgress?: (progress: CrawlProgress) => void
}

export type CrawlProgress = {
  /** Folders whose contents have been fully listed */
  folderCount: number
  /** Objects returned so far, files or folders */
  itemCount: number
}

/** Shared by every folder in a crawl, so concurrent folders share one request */
type CrawlState = CrawlProgress & { requestCount: number }

type FolderCrawlResult = {
  folderNames: string[]
  /** True when the folder's list requests hit `CRAWL_MAX_LISTINGS` */
  isTruncated: boolean
  /** True when `onPage` asked for the crawl to stop */
  isStopped: boolean
}

/** Pages through a single folder, recording each list request on the crawl-wide `crawlState` */
const crawlFolder = async (
  { projectRef, bucketId, path, onPage, onProgress }: CrawlBucketVariables & { path: string },
  crawlState: CrawlState,
  signal?: AbortSignal
): Promise<FolderCrawlResult> => {
  const folderNames: string[] = []
  let offset = 0

  while (true) {
    if (crawlState.requestCount >= CRAWL_MAX_LISTINGS) {
      return { folderNames, isTruncated: true, isStopped: false }
    }

    crawlState.requestCount++
    const objects =
      (await listBucketObjects(
        {
          projectRef,
          bucketId,
          path,
          options: {
            limit: CRAWL_PAGE_LIMIT,
            offset,
            sortBy: { column: 'name', order: 'asc' },
          },
        },
        signal
      )) ?? []

    // Objects without an id are prefixes (folders) rather than files
    folderNames.push(...objects.filter((object) => !object.id).map((object) => object.name))

    const isLastPage = objects.length < CRAWL_PAGE_LIMIT
    crawlState.itemCount += objects.length
    if (isLastPage) crawlState.folderCount++
    onProgress?.({ folderCount: crawlState.folderCount, itemCount: crawlState.itemCount })

    if (onPage(objects, path) === false) {
      return { folderNames, isTruncated: false, isStopped: true }
    }
    if (isLastPage) {
      return { folderNames, isTruncated: false, isStopped: false }
    }
    offset += CRAWL_PAGE_LIMIT
  }
}

/**
 * Lists every folder in a bucket, level by level, and calls `onPage` with each page of objects
 * found. The list endpoint returns one level at a time, so bucket-wide results must be built
 * client side.
 *
 * Stops at `CRAWL_MAX_LISTINGS` or when `onPage` returns `false`, reporting `isTruncated`.
 */
export async function crawlBucket(
  variables: CrawlBucketVariables,
  signal?: AbortSignal
): Promise<{ isTruncated: boolean }> {
  let queue = ['']
  const crawlState: CrawlState = { requestCount: 0, folderCount: 0, itemCount: 0 }
  let isTruncated = false

  while (queue.length > 0) {
    if (crawlState.requestCount >= CRAWL_MAX_LISTINGS) {
      isTruncated = true
      break
    }

    const batch = queue.slice(0, CRAWL_CONCURRENCY)
    queue = queue.slice(CRAWL_CONCURRENCY)

    const results = await Promise.all(
      batch.map(async (path) => ({
        path,
        ...(await crawlFolder({ ...variables, path }, crawlState, signal)),
      }))
    )

    let isStopped = false
    for (const result of results) {
      if (result.isTruncated) isTruncated = true
      if (result.isStopped) isStopped = true
      for (const name of result.folderNames) {
        queue.push(result.path.length > 0 ? `${result.path}/${name}` : name)
      }
    }
    if (isStopped) break
  }

  return { isTruncated: isTruncated || queue.length > 0 }
}
