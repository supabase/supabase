import { QueryClient } from '@tanstack/react-query'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import type { StorageObject } from './bucket-objects-list-mutation'
import {
  bucketSearchQueryOptions,
  collectSearchMatches,
  MAX_SEARCH_RESULTS,
  rankSearchMatches,
  scoreStorageMatch,
} from './bucket-search-query'
import { addAPIMock } from '@/tests/lib/msw'

const makeFile = (name: string): StorageObject => ({
  id: `id-${name}`,
  name,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  last_accessed_at: '2024-01-01T00:00:00Z',
  metadata: { mimetype: 'image/png', size: 2048 },
})

/** Folders come back from a listing as prefixes: no id, no metadata */
const makeFolder = (name: string): StorageObject => ({
  id: null,
  name,
  created_at: null,
  updated_at: null,
  last_accessed_at: null,
  metadata: null,
})

describe('scoreStorageMatch', () => {
  it('ranks an exact name above a prefix, a substring, and a path match', () => {
    const exact = scoreStorageMatch({ name: 'cat', path: 'cat' }, 'cat')
    const prefix = scoreStorageMatch({ name: 'cat.png', path: 'cat.png' }, 'cat')
    const substring = scoreStorageMatch({ name: 'my-cat.png', path: 'my-cat.png' }, 'cat')
    const inPath = scoreStorageMatch({ name: 'a.png', path: 'cats/a.png' }, 'cat')

    expect(exact).toBeLessThan(prefix!)
    expect(prefix).toBeLessThan(substring!)
    expect(substring).toBeLessThan(inPath!)
  })

  it('ignores case and surrounding whitespace', () => {
    expect(scoreStorageMatch({ name: 'Cat.PNG', path: 'Cat.PNG' }, '  cat ')).toBe(1)
  })

  it('returns undefined for a non-match and for an empty search', () => {
    expect(scoreStorageMatch({ name: 'dog.png', path: 'pets/dog.png' }, 'cat')).toBeUndefined()
    expect(scoreStorageMatch({ name: 'dog.png', path: 'pets/dog.png' }, '  ')).toBeUndefined()
  })
})

describe('collectSearchMatches', () => {
  it('builds full paths from the folder the listing came from', () => {
    const matches = collectSearchMatches([makeFile('cat.png')], 'images/2024', 'cat')
    expect(matches.map((match) => match.result.path)).toEqual(['images/2024/cat.png'])
  })

  it('marks objects without an id as folders', () => {
    const matches = collectSearchMatches([makeFolder('cats'), makeFile('cats.png')], '', 'cats')
    expect(matches.map((match) => match.result.isFolder)).toEqual([true, false])
  })

  it('leaves out the empty folder placeholder', () => {
    const matches = collectSearchMatches([makeFile('.emptyFolderPlaceholder')], 'empty', 'empty')
    expect(matches).toEqual([])
  })

  it('drops items that do not match', () => {
    const matches = collectSearchMatches([makeFile('dog.png')], 'pets', 'cat')
    expect(matches).toEqual([])
  })
})

describe('rankSearchMatches', () => {
  const asMatch = (path: string, score: number) => ({
    score,
    result: { id: path, name: path.split('/').pop()!, path, isFolder: false },
  })

  it('orders by score, then by path', () => {
    const ranked = rankSearchMatches([
      asMatch('b/cat.png', 2),
      asMatch('z/cat', 0),
      asMatch('a/cat.png', 2),
    ])
    expect(ranked.map((result) => result.path)).toEqual(['z/cat', 'a/cat.png', 'b/cat.png'])
  })

  it('caps the list', () => {
    const matches = Array.from({ length: MAX_SEARCH_RESULTS + 10 }, (_, index) =>
      asMatch(`folder/cat-${index}.png`, 1)
    )
    expect(rankSearchMatches(matches)).toHaveLength(MAX_SEARCH_RESULTS)
  })
})

describe('bucketSearchQueryOptions', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  const search = (searchString: string) =>
    queryClient.fetchQuery(
      bucketSearchQueryOptions({ projectRef: 'test-ref', bucketId: 'my-bucket', searchString })
    )

  /** Serves a bucket laid out as `{ folder: [objects] }`, keyed by the listing's path */
  const mockBucket = (bucket: Record<string, StorageObject[]>) => {
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/list',
      response: async ({ request }) => {
        const { path } = (await request.json()) as { path: string }
        return HttpResponse.json(bucket[path] ?? [])
      },
    })
  }

  it('finds matches in nested folders, not just the bucket root', async () => {
    mockBucket({
      '': [makeFolder('images'), makeFile('readme.md')],
      images: [makeFolder('2024')],
      'images/2024': [makeFile('cat.png'), makeFile('dog.png')],
    })

    const { results, isTruncated } = await search('cat')

    expect(results).toEqual([
      expect.objectContaining({ name: 'cat.png', path: 'images/2024/cat.png', isFolder: false }),
    ])
    expect(isTruncated).toBe(false)
  })

  it('matches folders by name and carries their path', async () => {
    mockBucket({
      '': [makeFolder('archive')],
      archive: [makeFolder('invoices')],
      'archive/invoices': [],
    })

    const { results } = await search('invoices')

    expect(results).toEqual([
      expect.objectContaining({ name: 'invoices', path: 'archive/invoices', isFolder: true }),
    ])
  })

  it('returns nothing without hitting the API for a blank search', async () => {
    const { results, isTruncated } = await search('   ')

    expect(results).toEqual([])
    expect(isTruncated).toBe(false)
  })
})
