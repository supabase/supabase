// @vitest-environment jsdom
import { http, HttpResponse } from 'msw'
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
import { addAPIMock, mswServer } from '@/tests/lib/msw'

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

function createState(bucket: Bucket, clientEndpoint = '') {
  return createStorageExplorerState({
    projectRef: 'test-ref',
    connectionString: '',
    bucket,
    resumableUploadUrl: '',
    clientEndpoint,
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

describe('fetchMoreFolderContents', () => {
  const PAGE_SIZE = 200
  const EMPTY_PLACEHOLDER = '.emptyFolderPlaceholder'

  function makeObject(name: string): StorageObject {
    return {
      id: `id-${name}`,
      name,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      last_accessed_at: '2024-01-01T00:00:00Z',
      metadata: { size: 1, mimetype: 'text/plain' },
    }
  }

  /**
   * Serves `listing` for `listedPath` the way the Storage API does: sliced by the request's
   * offset and limit. Other paths list as empty and are not recorded.
   */
  function mockPaginatedListing(listing: StorageObject[], listedPath = '') {
    const requestedOffsets: number[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/list',
      response: async ({ request }) => {
        const { path, options } = (await request.json()) as {
          path: string
          options: { offset: number; limit: number }
        }
        if (path !== listedPath) return HttpResponse.json<StorageObject[]>([])
        const { offset, limit } = options
        requestedOffsets.push(offset)
        return HttpResponse.json<StorageObject[]>(listing.slice(offset, offset + limit))
      },
    })
    return requestedOffsets
  }

  /** Opens `docs` from the bucket root, then scrolls until the listing is exhausted. */
  async function loadAllPages(state: ReturnType<typeof createState>) {
    state.columns = [
      { id: null, name: 'bucket-a', path: '', status: STORAGE_ROW_STATUS.READY, items: [] },
    ]
    await state.fetchFolderContents({
      bucketId: 'bucket-a',
      folderId: null,
      folderName: 'docs',
      index: 0,
    })
    while (state.columns[1]?.hasMoreItems) {
      await state.fetchMoreFolderContents({ index: 1, column: state.columns[1] })
    }
    return state.columns[1]?.items.map((item) => item.name)
  }

  it('does not repeat a file at the page boundary when the folder holds a hidden placeholder', async () => {
    const files = Array.from({ length: 300 }, (_, i) =>
      makeObject(`file-${String(i).padStart(3, '0')}.txt`)
    )
    // The placeholder sorts first, so it occupies a slot in the first page but is never shown
    const requestedOffsets = mockPaginatedListing([makeObject(EMPTY_PLACEHOLDER), ...files])

    const state = createState(makeBucket('bucket-a'))
    const names = await loadAllPages(state)

    expect(names).toEqual(files.map((file) => file.name))
    expect(requestedOffsets).toEqual([0, PAGE_SIZE])
  })

  it('stays in step with the server after a folder is created in a partly loaded column', async () => {
    const files = Array.from({ length: 300 }, (_, i) =>
      makeObject(`file-${String(i).padStart(3, '0')}.txt`)
    )
    const listing = [makeObject(EMPTY_PLACEHOLDER), ...files]
    const requestedOffsets = mockPaginatedListing(listing)

    const state = createState(makeBucket('bucket-a'))
    state.columns = [
      { id: null, name: 'bucket-a', path: '', status: STORAGE_ROW_STATUS.READY, items: [] },
    ]
    await state.fetchFolderContents({
      bucketId: 'bucket-a',
      folderId: null,
      folderName: 'docs',
      index: 0,
    })

    // The user creates a folder that sorts into the loaded part of the listing: the row
    // appears locally and the server listing gains an entry ahead of the page boundary.
    state.addNewFolderPlaceholder(1)
    state.updateFolderAfterEdit({ folderName: 'aaa', columnIndex: 1 })
    listing.splice(1, 0, { ...makeObject('aaa'), id: null, metadata: null })

    await state.fetchMoreFolderContents({ index: 1, column: state.columns[1]! })

    const names = state.columns[1]?.items.map((item) => item.name)
    expect(names).toEqual(['aaa', ...files.map((file) => file.name)])
    expect(requestedOffsets).toEqual([0, PAGE_SIZE + 1])
  })

  it('counts from the live column when archived rows are overlaid on the rendered one', async () => {
    const files = Array.from({ length: 300 }, (_, i) =>
      makeObject(`file-${String(i).padStart(3, '0')}.txt`)
    )
    const requestedOffsets = mockPaginatedListing([makeObject(EMPTY_PLACEHOLDER), ...files])

    const state = createState(makeBucket('bucket-a'))
    state.columns = [
      { id: null, name: 'bucket-a', path: '', status: STORAGE_ROW_STATUS.READY, items: [] },
    ]
    await state.fetchFolderContents({
      bucketId: 'bucket-a',
      folderId: null,
      folderName: 'docs',
      index: 0,
    })

    // FileExplorer hands over a copy with archived rows merged in; the live listing has no such row
    const liveColumn = state.columns[1]!
    const archivedRow: StorageItem = {
      ...liveColumn.items[0],
      id: 'archived',
      name: 'archived.txt',
    }
    await state.fetchMoreFolderContents({
      index: 1,
      column: { ...liveColumn, items: [...liveColumn.items, archivedRow] },
    })

    expect(requestedOffsets).toEqual([0, PAGE_SIZE])
    expect(state.columns[1]?.items.map((item) => item.name)).toEqual(files.map((file) => file.name))
  })

  it("stays in step when creating a folder deletes the parent's hidden placeholder", async () => {
    const clientEndpoint = 'http://storage.test'
    const files = Array.from({ length: 250 }, (_, i) =>
      makeObject(`file-${String(i).padStart(3, '0')}.txt`)
    )
    const listing = [makeObject(EMPTY_PLACEHOLDER), ...files]
    const requestedOffsets = mockPaginatedListing(listing, 'docs')

    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/api-keys/temporary',
      response: { api_key: 'sb_temp_nonce1234567890ab_payload1' },
    })
    // Creating the folder uploads its own placeholder, which lists as a folder in `docs`
    mswServer.use(
      http.post(`${clientEndpoint}/storage/v1/object/*`, () => {
        listing.splice(1, 0, { ...makeObject('aaa-new'), id: null, metadata: null })
        return HttpResponse.json({ Key: 'bucket-a/docs/aaa-new/.emptyFolderPlaceholder' })
      })
    )
    addAPIMock({
      method: 'delete',
      path: '/platform/storage/:ref/buckets/:id/objects',
      response: () => {
        listing.shift()
        return HttpResponse.json([])
      },
    })

    const state = createState(makeBucket('bucket-a'), clientEndpoint)
    state.columns = [
      { id: null, name: 'bucket-a', path: '', status: STORAGE_ROW_STATUS.READY, items: [] },
    ]
    state.openedFolders = [
      {
        id: null,
        name: 'docs',
        type: STORAGE_ROW_TYPES.FOLDER,
        status: STORAGE_ROW_STATUS.READY,
        metadata: null,
        created_at: null,
        updated_at: null,
        last_accessed_at: null,
        isCorrupted: false,
      },
    ]
    await state.fetchFolderContents({
      bucketId: 'bucket-a',
      folderId: null,
      folderName: 'docs',
      index: 0,
    })

    state.addNewFolderPlaceholder(1)
    await state.addNewFolder({ folderName: 'aaa-new', columnIndex: 1 })
    await state.fetchMoreFolderContents({ index: 1, column: state.columns[1]! })

    expect(state.columns[1]?.items.map((item) => item.name)).toEqual([
      'aaa-new',
      ...files.map((file) => file.name),
    ])
    expect(requestedOffsets).toEqual([0, PAGE_SIZE])
  })

  it('pages by the visible item count when the folder has no placeholder', async () => {
    const files = Array.from({ length: 450 }, (_, i) =>
      makeObject(`file-${String(i).padStart(3, '0')}.txt`)
    )
    const requestedOffsets = mockPaginatedListing(files)

    const state = createState(makeBucket('bucket-a'))
    const names = await loadAllPages(state)

    expect(names).toEqual(files.map((f) => f.name))
    expect(requestedOffsets).toEqual([0, PAGE_SIZE, PAGE_SIZE * 2])
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
