import { queryOptions } from '@tanstack/react-query'

import { crawlBucket } from './bucket-crawl'
import type { StorageObject } from './bucket-objects-list-mutation'
import { EMPTY_FOLDER_PLACEHOLDER_FILE_NAME } from './bucket-util'
import { storageKeys } from './keys'
import type { ResponseError } from '@/types'

/** Maximum number of matches kept for a single search */
export const MAX_SEARCH_RESULTS = 100

export type StorageSearchResult = {
  /** Set for files; folders are prefixes and have no row of their own */
  id: string | null
  name: string
  /** Full path of the item within the bucket, e.g. `images/2024/cat.png` */
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
    // Placeholders are how an empty folder is stored, not a file anyone can act on
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
  /** True when the search covered only part of the bucket, or matched more than it kept */
  isTruncated: boolean
}

export type BucketSearchError = ResponseError

async function getBucketSearchResults(
  { projectRef, bucketId, searchString }: BucketSearchVariables,
  signal?: AbortSignal
): Promise<BucketSearchData> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')
  if (searchString.trim().length === 0) return { results: [], isTruncated: false }

  const matches: ScoredMatch[] = []

  const { isTruncated } = await crawlBucket(
    {
      projectRef,
      bucketId,
      onPage: (objects, parentPath) => {
        matches.push(...collectSearchMatches(objects, parentPath, searchString))
        return matches.length <= MAX_SEARCH_RESULTS
      },
    },
    signal
  )

  return {
    results: rankSearchMatches(matches),
    isTruncated: isTruncated || matches.length > MAX_SEARCH_RESULTS,
  }
}

export const bucketSearchQueryOptions = ({
  projectRef,
  bucketId,
  searchString,
}: BucketSearchVariables) =>
  queryOptions({
    queryKey: storageKeys.search(projectRef, bucketId, searchString.trim()),
    queryFn: ({ signal }) => getBucketSearchResults({ projectRef, bucketId, searchString }, signal),
    enabled:
      typeof projectRef !== 'undefined' &&
      typeof bucketId !== 'undefined' &&
      searchString.trim().length > 0,
    // Crawling the bucket is expensive, so hold onto a term's results while the user
    // browses the matches and comes back for another look
    staleTime: 60 * 1000,
  })
