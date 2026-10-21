import { queryOptions, experimental_streamedQuery as streamedQuery } from '@tanstack/react-query'

import { crawlBucket, type CrawlProgress } from './bucket-crawl'
import type { StorageObject } from './bucket-objects-list-mutation'
import { EMPTY_FOLDER_PLACEHOLDER_FILE_NAME } from './bucket-util'
import { storageKeys } from './keys'
import type { ResponseError } from '@/types'

/** Maximum number of matches kept for a single search */
export const MAX_SEARCH_RESULTS = 250

export type StorageSearchResult = {
  /** Set for files; folders are prefixes and have no row of their own */
  id: string | null
  name: string
  path: string
  isFolder: boolean
  mimetype?: string
  size?: number
}

type ScoredMatch = { result: StorageSearchResult; score: number }

/**
 * How closely an item matches a search: exact name first, then names starting with the
 * search string, then names containing it, and finally a match somewhere in the path.
 * `undefined` when the item doesn't match at all.
 */
export function scoreStorageMatch(
  { name, path }: { name: string; path: string },
  searchString: string
): number | undefined {
  const query = searchString.trim().toLowerCase()
  if (query.length === 0) return undefined

  const lowerCasedName = name.toLowerCase()
  if (lowerCasedName === query) return 0
  if (lowerCasedName.startsWith(query)) return 1
  if (lowerCasedName.includes(query)) return 2
  if (path.toLowerCase().includes(query)) return 3
  return undefined
}

/** Narrows one listing page down to the items in it that match `searchString` */
export function collectSearchMatches(
  objects: StorageObject[],
  parentPath: string,
  searchString: string
): ScoredMatch[] {
  return objects.flatMap((object) => {
    if (object.name === EMPTY_FOLDER_PLACEHOLDER_FILE_NAME) return []

    const path = parentPath.length > 0 ? `${parentPath}/${object.name}` : object.name
    const score = scoreStorageMatch({ name: object.name, path }, searchString)
    if (score === undefined) return []

    const metadata = object.metadata as { mimetype?: string; size?: number } | null
    return [
      {
        score,
        result: {
          id: object.id ?? null,
          name: object.name,
          path,
          isFolder: !object.id,
          mimetype: metadata?.mimetype,
          size: metadata?.size,
        },
      },
    ]
  })
}

/** Orders matches by how closely they match, then by path, and caps the list */
export function rankSearchMatches(matches: ScoredMatch[]): StorageSearchResult[] {
  return [...matches]
    .sort((a, b) => a.score - b.score || a.result.path.localeCompare(b.result.path))
    .slice(0, MAX_SEARCH_RESULTS)
    .map((match) => match.result)
}

export type BucketSearchVariables = {
  projectRef?: string
  bucketId?: string
  searchString: string
}

export type BucketSearchData = {
  results: StorageSearchResult[]
  /**
   * Why `results` may be incomplete: more matches than `MAX_SEARCH_RESULTS`, or the crawl
   * ran out of list requests before covering the bucket. `null` when the search is complete.
   */
  truncation: 'match-limit' | 'request-limit' | null
  progress: CrawlProgress
  /** False while the crawl is still running and `results` is not filled in yet */
  isComplete: boolean
}

const EMPTY_PROGRESS: CrawlProgress = { folderCount: 0, itemCount: 0 }

const PENDING_SEARCH: BucketSearchData = {
  results: [],
  truncation: null,
  progress: EMPTY_PROGRESS,
  isComplete: false,
}

function getSearchTruncation(
  matchCount: number,
  isCrawlTruncated: boolean
): BucketSearchData['truncation'] {
  // Checked first: stopping at the match cap leaves folders unvisited, so the crawl
  // reports itself truncated too
  if (matchCount > MAX_SEARCH_RESULTS) return 'match-limit'
  if (isCrawlTruncated) return 'request-limit'
  return null
}

export type BucketSearchError = ResponseError

/**
 * Searches the bucket, yielding a progress snapshot after each list request and the ranked
 * results once the crawl ends. Snapshots arriving faster than they're consumed collapse into
 * the latest one.
 */
async function* streamBucketSearchResults(
  { projectRef, bucketId, searchString }: BucketSearchVariables,
  signal?: AbortSignal
): AsyncGenerator<BucketSearchData> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')
  if (searchString.trim().length === 0) {
    yield { ...PENDING_SEARCH, isComplete: true }
    return
  }

  const matches: ScoredMatch[] = []
  let progress = EMPTY_PROGRESS
  let hasNewProgress = false
  let isCrawlDone = false
  let wake: (() => void) | undefined

  const crawl = crawlBucket(
    {
      projectRef,
      bucketId,
      onPage: (objects, parentPath) => {
        matches.push(...collectSearchMatches(objects, parentPath, searchString))
        return matches.length <= MAX_SEARCH_RESULTS
      },
      onProgress: (nextProgress) => {
        progress = nextProgress
        hasNewProgress = true
        wake?.()
      },
    },
    signal
  ).finally(() => {
    isCrawlDone = true
    wake?.()
  })
  // Rejections surface through the `await crawl` below; this only keeps them from being
  // reported as unhandled while the loop is still waiting
  crawl.catch(() => {})

  while (true) {
    if (!hasNewProgress && !isCrawlDone) {
      await new Promise<void>((resolve) => (wake = resolve))
    }
    if (isCrawlDone) break
    hasNewProgress = false
    yield { ...PENDING_SEARCH, progress }
  }

  const { isTruncated } = await crawl
  yield {
    results: rankSearchMatches(matches),
    truncation: getSearchTruncation(matches.length, isTruncated),
    progress,
    isComplete: true,
  }
}

export const bucketSearchQueryOptions = ({
  projectRef,
  bucketId,
  searchString,
}: BucketSearchVariables) => {
  const term = searchString.trim()

  return queryOptions({
    queryKey: storageKeys.search(projectRef, bucketId, term),
    queryFn: streamedQuery<BucketSearchData, BucketSearchData>({
      streamFn: ({ signal }) =>
        streamBucketSearchResults({ projectRef, bucketId, searchString: term }, signal),
      // Every chunk is a full snapshot, so the latest one replaces what came before
      reducer: (_, chunk) => chunk,
      initialValue: PENDING_SEARCH,
    }),
    enabled:
      typeof projectRef !== 'undefined' && typeof bucketId !== 'undefined' && term.length > 0,
    // Crawling the bucket is expensive, so hold onto a term's results while the user
    // browses the matches and comes back for another look
    staleTime: 60 * 1000,
  })
}
