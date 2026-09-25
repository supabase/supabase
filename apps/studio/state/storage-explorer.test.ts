import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { createStorageExplorerState } from './storage-explorer'
import { STORAGE_ROW_STATUS } from '@/components/interfaces/Storage/Storage.constants'
import type { StorageColumn } from '@/components/interfaces/Storage/Storage.types'
import type { StorageObjectsPage } from '@/data/storage/bucket-objects-infinite-query'
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

const BUCKET_A_LISTING: StorageObjectsPage = {
  folders: [],
  objects: [
    {
      id: 'file-in-bucket-a',
      name: 'only-in-bucket-a.png',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      last_accessed_at: '2024-01-01T00:00:00Z',
      metadata: { size: 1, mimetype: 'image/png' },
    },
  ],
  hasNext: false,
}

const FOLDER_LISTING: StorageObjectsPage = {
  folders: [{ name: 'shared/' }],
  objects: [],
  hasNext: false,
}

const EMPTY_LISTING: StorageObjectsPage = { folders: [], objects: [], hasNext: false }

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
      path: '/platform/storage/:ref/buckets/:id/objects/list-v2',
      response: async () => {
        await listingReleased
        // Belongs to bucket-a, the bucket the request was issued for
        return HttpResponse.json<StorageObjectsPage>(BUCKET_A_LISTING)
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
      path: '/platform/storage/:ref/buckets/:id/objects/list-v2',
      response: async ({ request }) => {
        const { prefix } = (await request.json()) as { prefix: string }
        return HttpResponse.json<StorageObjectsPage>(prefix === '' ? FOLDER_LISTING : EMPTY_LISTING)
      },
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

describe('fetchFolderContents', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('browses with a trailing-slash prefix and stores hasMoreItems/cursor from the response', async () => {
    let requestBody: any
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/list-v2',
      response: async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json<StorageObjectsPage>({
          folders: [{ name: 'inner/' }],
          objects: [
            {
              id: 'placeholder',
              name: '.emptyFolderPlaceholder',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              last_accessed_at: '2024-01-01T00:00:00Z',
              metadata: null,
            },
            {
              id: 'f2',
              name: 'file.png',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              last_accessed_at: '2024-01-01T00:00:00Z',
              metadata: { size: 1, mimetype: 'image/png' },
            },
          ],
          hasNext: true,
          nextCursor: 'cursor-1',
        })
      },
    })

    const state = createState(makeBucket('bucket-a'))
    // index: -1 is the bucket-root convention (see EmptyBucketModal/StorageExplorerNavigation) —
    // pushColumnAtIndex places the result at index + 1, i.e. columns[0]
    await state.fetchFolderContents({
      bucketId: 'bucket-a',
      folderId: null,
      folderName: 'bucket-a',
      index: -1,
    })

    expect(requestBody).toMatchObject({ prefix: '', with_delimiter: true })
    const column = state.columns[0]
    expect(column.hasMoreItems).toBe(true)
    expect(column.cursor).toBe('cursor-1')
    // Bare names, sorted by name (default preference) rather than grouped by folder/file,
    // placeholder dropped
    expect(column.items.map((item) => item.name)).toEqual(['file.png', 'inner'])
  })
})

describe('fetchMoreFolderContents', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  function makeReadyColumn(overrides: Partial<StorageColumn> = {}): StorageColumn {
    return {
      id: 'bucket-a',
      name: 'bucket-a',
      path: '',
      status: STORAGE_ROW_STATUS.READY,
      items: [],
      hasMoreItems: true,
      cursor: 'cursor-1',
      ...overrides,
    }
  }

  it('sends the column cursor and appends the next page', async () => {
    let requestBody: any
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/list-v2',
      response: async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json<StorageObjectsPage>({
          folders: [],
          objects: [
            {
              id: 'f2',
              name: 'page2.png',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              last_accessed_at: '2024-01-01T00:00:00Z',
              metadata: null,
            },
          ],
          hasNext: false,
        })
      },
    })

    const state = createState(makeBucket('bucket-a'))
    const column = makeReadyColumn()
    state.columns = [column]

    await state.fetchMoreFolderContents({ index: 0, column })

    expect(requestBody.cursor).toBe('cursor-1')
    expect(state.columns[0].items.map((item) => item.name)).toEqual(['page2.png'])
    expect(state.columns[0].hasMoreItems).toBe(false)
    expect(state.columns[0].cursor).toBeNull()
  })

  it('drops a page that resolves after the column was replaced', async () => {
    let releaseListing: (() => void) | undefined
    const listingReleased = new Promise<void>((resolve) => {
      releaseListing = resolve
    })
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/list-v2',
      response: async () => {
        await listingReleased
        return HttpResponse.json<StorageObjectsPage>({
          folders: [],
          objects: [
            {
              id: 'stale',
              name: 'stale.png',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              last_accessed_at: '2024-01-01T00:00:00Z',
              metadata: null,
            },
          ],
          hasNext: false,
        })
      },
    })

    const state = createState(makeBucket('bucket-a'))
    const originalColumn = makeReadyColumn()
    state.columns = [originalColumn]

    const loadMore = state.fetchMoreFolderContents({ index: 0, column: originalColumn })

    // A refresh replaces the column (new cursor) while the load-more request is in flight
    state.columns = [makeReadyColumn({ cursor: 'cursor-2', hasMoreItems: false })]

    releaseListing?.()
    await loadMore

    expect(state.columns[0].items).toHaveLength(0)
    expect(state.columns[0].isLoadingMoreItems).toBe(false)
    expect(state.columns[0].cursor).toBe('cursor-2')
  })
})

describe('getAllItemsAlongFolder', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('follows cursor pages and recurses into subfolders, dropping full paths to bare names', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/list-v2',
      response: async ({ request }) => {
        const { prefix, cursor } = (await request.json()) as { prefix: string; cursor?: string }
        if (prefix === 'root/') {
          if (!cursor) {
            return HttpResponse.json<StorageObjectsPage>({
              folders: [{ name: 'root/inner/' }],
              objects: [
                {
                  id: 'f1',
                  name: 'root/a.png',
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-01T00:00:00Z',
                  last_accessed_at: '2024-01-01T00:00:00Z',
                  metadata: null,
                },
              ],
              hasNext: true,
              nextCursor: 'page-2',
            })
          }
          return HttpResponse.json<StorageObjectsPage>({
            folders: [],
            objects: [
              {
                id: 'f2',
                name: 'root/b.png',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
                last_accessed_at: '2024-01-01T00:00:00Z',
                metadata: null,
              },
            ],
            hasNext: false,
          })
        }
        if (prefix === 'root/inner/') {
          return HttpResponse.json<StorageObjectsPage>({
            folders: [],
            objects: [
              {
                id: 'f3',
                name: 'root/inner/c.png',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
                last_accessed_at: '2024-01-01T00:00:00Z',
                metadata: null,
              },
            ],
            hasNext: false,
          })
        }
        return HttpResponse.json<StorageObjectsPage>({ folders: [], objects: [], hasNext: false })
      },
    })

    const state = createState(makeBucket('bucket-a'))
    const items = await state.getAllItemsAlongFolder({ name: 'root', columnIndex: 0 })

    expect(
      items
        .map((item) => ({ name: item.name, prefix: item.prefix }))
        .sort((a, b) => a.name.localeCompare(b.name))
    ).toEqual([
      { name: 'a.png', prefix: 'root' },
      { name: 'b.png', prefix: 'root' },
      { name: 'c.png', prefix: 'root/inner' },
    ])
  })
})
