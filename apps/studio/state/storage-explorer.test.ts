// @vitest-environment jsdom
import type { platformComponents } from 'api-types'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { createStorageExplorerState } from './storage-explorer'
import {
  STORAGE_ROW_STATUS,
  STORAGE_ROW_TYPES,
} from '@/components/interfaces/Storage/Storage.constants'
import type { StorageItem } from '@/components/interfaces/Storage/Storage.types'
import { EMPTY_FOLDER_PLACEHOLDER_FILE_NAME } from '@/components/interfaces/Storage/StorageExplorer/StorageExplorer.utils'
import { getQueryClient } from '@/data/query-client'
import type { StorageObject } from '@/data/storage/bucket-objects-list-mutation'
import type { Bucket } from '@/data/storage/buckets-query'
import { storageKeys } from '@/data/storage/keys'
import { addAPIMock, mswServer, type APIErrorBody } from '@/tests/lib/msw'

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

describe('fetchMoreFolderContents', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it.each([false, true])(
    'loads each file once across pages (hidden placeholder: %s)',
    async (hasPlaceholder) => {
      const files: StorageObject[] = Array.from({ length: 200 }, (_, index) => ({
        ...BUCKET_A_LISTING[0],
        id: `file-${index}`,
        name: `file-${String(index).padStart(3, '0')}.txt`,
      }))
      const objects = hasPlaceholder
        ? [
            {
              ...BUCKET_A_LISTING[0],
              id: 'placeholder',
              name: EMPTY_FOLDER_PLACEHOLDER_FILE_NAME,
              metadata: { size: 0 },
            },
            ...files,
          ]
        : files
      const requestedOffsets: number[] = []

      addAPIMock({
        method: 'post',
        path: '/platform/storage/:ref/buckets/:id/objects/list',
        response: async ({ request }) => {
          const { options } = z
            .object({ options: z.object({ offset: z.number(), limit: z.number() }) })
            .parse(await request.json())
          requestedOffsets.push(options.offset)
          return HttpResponse.json<StorageObject[]>(
            objects.slice(options.offset, options.offset + options.limit)
          )
        },
      })

      const state = createState(makeBucket('bucket-a'))
      await state.fetchFolderContents({
        bucketId: 'bucket-a',
        folderId: null,
        folderName: 'bucket-a',
        index: -1,
      })

      // A full API page still has a next page when the placeholder is hidden from the UI.
      expect(state.columns[0].items).toHaveLength(hasPlaceholder ? 199 : 200)
      expect(state.columns[0].hasMoreItems).toBe(true)

      await state.fetchMoreFolderContents({ index: 0, column: state.columns[0] })

      expect(state.columns[0].items.map((item) => item.name)).toEqual(
        files.map((file) => file.name)
      )
      expect(requestedOffsets).toEqual([0, 200])
      expect(state.columns[0].hasMoreItems).toBe(false)
    }
  )
})

describe('addNewFolder', () => {
  it('refreshes pagination after creating a folder in a fully loaded listing', async () => {
    localStorage.clear()
    const files: StorageObject[] = Array.from({ length: 201 }, (_, index) => ({
      ...BUCKET_A_LISTING[0],
      id: `file-${index}`,
      name: `file-${String(index).padStart(3, '0')}.txt`,
    }))
    const folder: StorageObject = { ...FOLDER_LISTING[0], name: 'aaa' }
    const objects = [...files]
    const clientEndpoint = 'http://storage.test'

    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/api-keys/temporary',
      response: () =>
        HttpResponse.json<platformComponents['schemas']['TemporaryApiKeyResponse_Output']>({
          api_key: 'test-api-key',
        }),
    })
    mswServer.use(
      http.post(`${clientEndpoint}/storage/v1/object/bucket-a/aaa/.emptyFolderPlaceholder`, () => {
        objects.unshift(folder)
        return HttpResponse.json<{ Key: string; Id: string }>({
          Key: 'bucket-a/aaa/.emptyFolderPlaceholder',
          Id: 'new-folder-placeholder',
        })
      })
    )
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/list',
      response: async ({ request }) => {
        const { path, options } = z
          .object({
            path: z.string(),
            options: z.object({ offset: z.number(), limit: z.number() }),
          })
          .parse(await request.json())
        const listing =
          path === ''
            ? objects
            : [
                {
                  ...BUCKET_A_LISTING[0],
                  name: EMPTY_FOLDER_PLACEHOLDER_FILE_NAME,
                  metadata: { size: 0 },
                },
              ]
        return HttpResponse.json<StorageObject[]>(
          listing.slice(options.offset, options.offset + options.limit)
        )
      },
    })

    const state = createStorageExplorerState({
      projectRef: 'test-ref',
      connectionString: '',
      bucket: makeBucket('bucket-a'),
      resumableUploadUrl: '',
      clientEndpoint,
    })
    await state.fetchFolderContents({
      bucketId: 'bucket-a',
      folderId: null,
      folderName: 'bucket-a',
      index: -1,
    })
    await state.fetchMoreFolderContents({ index: 0, column: state.columns[0] })
    expect(state.columns[0].hasMoreItems).toBe(false)
    expect(state.columns[0].items).toHaveLength(files.length)

    state.addNewFolderPlaceholder(0)
    await state.addNewFolder({ folderName: 'aaa', columnIndex: 0 })

    expect(state.columns[0].hasMoreItems).toBe(true)
    expect(state.columns[0].nextOffset).toBe(200)
    await state.fetchMoreFolderContents({ index: 0, column: state.columns[0] })
    expect(state.columns[0].items.map((item) => item.name)).toEqual(
      [folder, ...files].map((item) => item.name)
    )
    expect(state.columns[0].hasMoreItems).toBe(false)
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

  it.each([false, true])(
    'keeps the loaded rows when a listing fails (searching: %s)',
    async (isSearching) => {
      localStorage.clear()
      let shouldFail = false
      addAPIMock({
        method: 'post',
        path: '/platform/storage/:ref/buckets/:id/objects/list',
        response: () =>
          shouldFail
            ? HttpResponse.json<APIErrorBody>({ message: 'Listing failed' }, { status: 500 })
            : HttpResponse.json<StorageObject[]>(FOLDER_LISTING),
      })

      const state = createState(makeBucket('bucket-a'))
      await state.fetchFoldersByPath({ paths: ['shared'] })
      state.columns[0].hasMoreItems = true
      // A mutation marks its row as loading and relies on the refresh to settle it.
      state.updateRowStatus({ name: 'shared', status: STORAGE_ROW_STATUS.LOADING, columnIndex: 0 })
      if (isSearching) state.itemSearchString = 'sha'

      shouldFail = true
      await state.refetchAllOpenedFolders()

      expect(state.columns).toHaveLength(2)
      expect(state.columns[0].items).toMatchObject([
        { name: 'shared', status: STORAGE_ROW_STATUS.READY },
      ])
      // Offsets kept from before a mutation could skip or repeat items.
      expect(state.columns[0].hasMoreItems).toBe(false)
      expect(state.columns[0].nextOffset).toBe(0)
      expect(state.columns[1].status).toBe(STORAGE_ROW_STATUS.READY)
    }
  )
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
      {
        id: null,
        name: 'bucket-a',
        path: '',
        status: STORAGE_ROW_STATUS.READY,
        items,
        nextOffset: items.length,
      },
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
