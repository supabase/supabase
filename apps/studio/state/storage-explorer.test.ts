import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { createStorageExplorerState } from './storage-explorer'
import {
  STORAGE_ROW_STATUS,
  STORAGE_ROW_TYPES,
} from '@/components/interfaces/Storage/Storage.constants'
import type { StorageItem } from '@/components/interfaces/Storage/Storage.types'
import { getQueryClient } from '@/data/query-client'
import type { StorageObject } from '@/data/storage/bucket-objects-list-mutation'
import type { Bucket } from '@/data/storage/buckets-query'
import { storageKeys } from '@/data/storage/keys'
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

describe('refetchAllOpenedFolders', () => {
  it('marks the archived list stale, so an archive or restore shows without a refresh', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/list',
      response: BUCKET_A_LISTING,
    })

    const queryClient = getQueryClient()
    const key = storageKeys.archivedObjects('test-ref', 'bucket-a')
    queryClient.setQueryData(key, [])
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false)

    const state = createState(makeBucket('bucket-a'))
    await state.refetchAllOpenedFolders()

    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
  })
})

describe('selectRangeItems', () => {
  function makeFile(id: string): StorageItem {
    return {
      id,
      name: `${id}.png`,
      type: STORAGE_ROW_TYPES.FILE,
      status: STORAGE_ROW_STATUS.READY,
      metadata: null,
      created_at: null,
      updated_at: null,
      last_accessed_at: null,
      isCorrupted: false,
    }
  }

  function createStateWithColumn(items: StorageItem[]) {
    const state = createState(makeBucket('bucket-a'))
    state.columns = [
      { id: null, name: 'bucket-a', path: '', status: STORAGE_ROW_STATUS.READY, items },
    ]
    return state
  }

  it('resolves the range from the item id, not a rendered row position', () => {
    const items = [makeFile('a'), makeFile('b'), makeFile('c')]
    const state = createStateWithColumn(items)
    state.setSelectedItems([{ ...items[0], columnIndex: 0 }])

    // The rendered column interleaves archived rows, so 'c' sits at a higher index there
    // than it does here. Addressing it by id is what keeps the two in agreement.
    state.selectRangeItems(0, 'c')

    expect(state.selectedItems.map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('ignores an id the column does not hold', () => {
    const items = [makeFile('a'), makeFile('b')]
    const state = createStateWithColumn(items)
    state.setSelectedItems([{ ...items[0], columnIndex: 0 }])

    state.selectRangeItems(0, 'archived-only')

    expect(state.selectedItems.map((item) => item.id)).toEqual(['a'])
  })
})
