// @vitest-environment jsdom
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createStorageExplorerState } from './storage-explorer'
import {
  STORAGE_ROW_STATUS,
  STORAGE_ROW_TYPES,
} from '@/components/interfaces/Storage/Storage.constants'
import { addAPIMock, mswServer } from '@/tests/lib/msw'

vi.mock('@zip.js/zip.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@zip.js/zip.js')>()
  return {
    ...actual,
    ZipWriter: class {
      add = vi.fn()
      close = vi.fn(async () => new Blob())
    },
  }
})

const STORAGE_URL = 'http://localhost:54321'

describe('downloadFolder public object URLs', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal(
      'URL',
      class extends URL {
        static createObjectURL = vi.fn(() => 'blob:folder-download')
      }
    )
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it.each([
    { folderName: 'docs', fileName: 'report.txt', expectedPath: 'docs/report.txt' },
    { folderName: 'docs', fileName: 'report?.txt', expectedPath: 'docs/report%3F.txt' },
    { folderName: 'docs?', fileName: 'report.txt', expectedPath: 'docs%3F/report.txt' },
  ])(
    'encodes the object path for $folderName/$fileName',
    async ({ folderName, fileName, expectedPath }) => {
      addAPIMock({
        method: 'post',
        path: '/platform/storage/:ref/buckets/:id/objects/list',
        response: [
          {
            id: 'test-file',
            name: fileName,
            created_at: null,
            updated_at: null,
            last_accessed_at: null,
            metadata: { size: 4, mimetype: 'text/plain' },
          },
        ],
      })

      const requestedUrls: string[] = []
      mswServer.use(
        http.get(`${STORAGE_URL}/storage/v1/object/public/*`, ({ request }) => {
          requestedUrls.push(request.url)
          return HttpResponse.text('test')
        })
      )

      const state = createStorageExplorerState({
        projectRef: 'test-ref',
        connectionString: '',
        bucket: {
          id: 'test-bucket',
          name: 'test-bucket',
          owner: 'owner',
          public: true,
          type: 'STANDARD',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        resumableUploadUrl: '',
        clientEndpoint: STORAGE_URL,
      })

      await state.downloadFolder({
        id: null,
        name: folderName,
        type: STORAGE_ROW_TYPES.FOLDER,
        status: STORAGE_ROW_STATUS.READY,
        metadata: null,
        created_at: null,
        updated_at: null,
        last_accessed_at: null,
        isCorrupted: false,
        columnIndex: 0,
      })

      expect(requestedUrls).toEqual([
        `${STORAGE_URL}/storage/v1/object/public/test-bucket/${expectedPath}`,
      ])
    }
  )
})
