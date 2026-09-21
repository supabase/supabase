import { listBucketObjects, type StorageObject } from './bucket-objects-list-mutation'

/** Number of objects requested per folder listing */
export const CRAWL_PAGE_LIMIT = 1000
/** Cap on how many listings a single crawl issues */
export const CRAWL_MAX_LISTINGS = 200
/** How many listings are issued at a time while crawling */
const CRAWL_CONCURRENCY = 5

type CrawlBucketVariables = {
  projectRef: string
  bucketId: string
  /**
   * Called once per listing page, with the objects in it and the folder they came from.
   * Return `false` to stop the crawl — callers use this to cap what they collect.
   */
  onPage: (objects: StorageObject[], parentPath: string) => boolean | void
}

type FolderCrawlResult = {
  /** Names of the subfolders found under the folder, to be crawled next */
  folderNames: string[]
  /** True when the folder's own listings ran into `CRAWL_MAX_LISTINGS` */
  isTruncated: boolean
  /** True when `onPage` asked for the crawl to stop */
  isStopped: boolean
}

/**
 * Pages through a single folder, counting each page against the crawl-wide `listingsState`
 * so concurrent folders share one budget.
 */
const crawlFolder = async (
  {
    projectRef,
    bucketId,
    path,
    onPage,
  }: Omit<CrawlBucketVariables, 'onPage'> & {
    path: string
    onPage: CrawlBucketVariables['onPage']
  },
  listingsState: { count: number },
  signal?: AbortSignal
): Promise<FolderCrawlResult> => {
  const folderNames: string[] = []
  let offset = 0

  while (true) {
    if (listingsState.count >= CRAWL_MAX_LISTINGS) {
      return { folderNames, isTruncated: true, isStopped: false }
    }

    listingsState.count++
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

    if (onPage(objects, path) === false) {
      return { folderNames, isTruncated: false, isStopped: true }
    }
    if (objects.length < CRAWL_PAGE_LIMIT) {
      return { folderNames, isTruncated: false, isStopped: false }
    }
    offset += CRAWL_PAGE_LIMIT
  }
}

/**
 * Walks every folder in a bucket breadth first, handing each listing page to `onPage`.
 * The Storage list endpoint only ever returns one level at a time, so anything that spans
 * a whole bucket — searching it, collecting its folders — has to be assembled client side.
 *
 * Stops early once `CRAWL_MAX_LISTINGS` is reached or `onPage` returns `false`, which is
 * reported back as `isTruncated` so callers can tell the user their view is partial.
 */
export async function crawlBucket(
  { projectRef, bucketId, onPage }: CrawlBucketVariables,
  signal?: AbortSignal
): Promise<{ isTruncated: boolean }> {
  let queue = ['']
  const listingsState = { count: 0 }
  let isTruncated = false

  while (queue.length > 0) {
    if (listingsState.count >= CRAWL_MAX_LISTINGS) {
      isTruncated = true
      break
    }

    const batch = queue.slice(0, CRAWL_CONCURRENCY)
    queue = queue.slice(CRAWL_CONCURRENCY)

    const results = await Promise.all(
      batch.map(async (path) => ({
        path,
        ...(await crawlFolder({ projectRef, bucketId, path, onPage }, listingsState, signal)),
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
