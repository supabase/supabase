import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { createStorageExplorerState } from './storage-explorer'
import type { StorageObject } from '@/data/storage/bucket-objects-list-mutation'
import type { Bucket } from '@/data/storage/buckets-query'
import { addAPIMock } from '@/tests/lib/msw'

function makeBucket(id: string): Bucket {
  return {
    id,
    name: id,
    owner: 'owner',
    public: false,
    type: 'STANDARD',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  } as Bucket
}

const BUCKET_A_LISTING: StorageObject[] = [
  {
    id: 'file-in-bucket-a',
    name: 'only-in-bucket-a.png',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_accessed_at: '2024-01-01T00:00:00Z',
    metadata: { size: 1, mimetype: 'image/png' },
  },
]

/** Objects with a null id are prefixes, i.e. folders. */
const FOLDER_LISTING: StorageObject[] = [
  {
    id: null,
    name: 'shared',
    created_at: null,
    updated_at: null,
    last_accessed_at: null,
    metadata: null,
  },
]

function createState(bucket: Bucket) {
  return createStorageExplorerState({
    projectRef: 'test-ref',
    connectionString: '',
    bucket,
    resumableUploadUrl: '',
    clientEndpoint: '',
  })
}

describe('fetchFoldersByPath', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('discards a restore that resolves after the bucket changed', async () => {
    let releaseListing: (() => void) | undefined
    const listingReleased = new Promise<void>((resolve) => {
      releaseListing = resolve
    })

    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/list',
      response: async () => {
        await listingReleased
        // Belongs to bucket-a, the bucket the request was issued for
        return HttpResponse.json<StorageObject[]>(BUCKET_A_LISTING)
      },
    })

    const state = createState(makeBucket('bucket-a'))
    const restore = state.fetchFoldersByPath({ paths: ['shared'], showLoading: true })

    // The user switches buckets while the listing is still in flight. Same `?path`, so
    // nothing about the requested location changes — only the bucket underneath it.
    state.selectedBucket = makeBucket('bucket-b')

    releaseListing?.()
    const { missingPaths } = await restore

    // bucket-a's contents must not be committed, and must not be relabelled as bucket-b
    const allItems = state.columns.flatMap((column) => column.items)
    expect(allItems).toHaveLength(0)
    expect(state.columns[0]?.name).toBe('bucket-a')
    expect(missingPaths).toEqual([])
  })

  it('commits the restore when the bucket is unchanged', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/list',
      response: FOLDER_LISTING,
    })

    const state = createState(makeBucket('bucket-a'))
    const { missingPaths } = await state.fetchFoldersByPath({
      paths: ['shared'],
      showLoading: true,
    })

    expect(missingPaths).toEqual([])
    expect(state.columns[0]?.items.map((item) => item.name)).toEqual(['shared'])
    expect(state.openedFolders.map((folder) => folder.name)).toEqual(['shared'])
  })
})
