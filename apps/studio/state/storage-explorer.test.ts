import { toast } from 'sonner'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createStorageExplorerState } from './storage-explorer'
import {
  STORAGE_ROW_STATUS,
  STORAGE_ROW_TYPES,
} from '@/components/interfaces/Storage/Storage.constants'
import type { StorageItemWithColumn } from '@/components/interfaces/Storage/Storage.types'
import { deleteBucketObject } from '@/data/storage/bucket-object-delete-mutation'
import type { Bucket } from '@/data/storage/buckets-query'

vi.mock('@/data/storage/bucket-object-delete-mutation', () => ({
  deleteBucketObject: vi.fn(),
}))

vi.mock('@/data/storage/bucket-objects-list-mutation', () => ({
  // Non-empty listing so validateParentFolderEmpty never uploads a placeholder
  listBucketObjects: vi.fn(async () => [
    {
      id: 'object-1',
      name: 'existing.txt',
      updated_at: '2024-01-01T00:00:00.000Z',
      created_at: '2024-01-01T00:00:00.000Z',
      last_accessed_at: '2024-01-01T00:00:00.000Z',
      metadata: { size: 1, mimetype: 'text/plain' },
    },
  ]),
}))

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    loading: vi.fn(() => 'toast-id'),
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  }),
}))

const mockedDeleteBucketObject = vi.mocked(deleteBucketObject)

function setup() {
  return createStorageExplorerState({
    projectRef: 'default',
    connectionString: '',
    bucket: { id: 'bucket-1', name: 'bucket-1' } as Bucket,
    resumableUploadUrl: '',
    clientEndpoint: '',
  })
}

function makeFile(name: string) {
  return {
    name,
    prefix: 'docs',
    columnIndex: 1,
    type: STORAGE_ROW_TYPES.FILE,
    status: STORAGE_ROW_STATUS.READY,
  } as StorageItemWithColumn & { prefix: string }
}

describe('deleteFiles', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows an error toast when the API reports fewer deletions than requested', async () => {
    mockedDeleteBucketObject.mockResolvedValueOnce([{ name: 'docs/a.txt' }] as never)

    const state = setup()
    await state.deleteFiles({ files: [makeFile('a.txt'), makeFile('b.txt')] })

    expect(toast.error).toHaveBeenCalledWith(
      'Failed to delete 1 of 2 file(s)',
      expect.objectContaining({ id: 'toast-id' })
    )
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('shows an error toast when the API reports no deletions at all', async () => {
    mockedDeleteBucketObject.mockResolvedValueOnce([] as never)

    const state = setup()
    await state.deleteFiles({ files: [makeFile('a.txt')] })

    expect(toast.error).toHaveBeenCalledWith(
      'Failed to delete 1 file(s)',
      expect.objectContaining({ id: 'toast-id' })
    )
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('shows the success toast when every requested path was removed', async () => {
    mockedDeleteBucketObject.mockResolvedValueOnce([
      { name: 'docs/a.txt' },
      { name: 'docs/b.txt' },
    ] as never)

    const state = setup()
    await state.deleteFiles({ files: [makeFile('a.txt'), makeFile('b.txt')] })

    expect(toast.success).toHaveBeenCalledWith(
      'Successfully deleted 2 file(s)',
      expect.objectContaining({ id: 'toast-id' })
    )
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('keeps the success toast when the response has no body (hosted platform)', async () => {
    mockedDeleteBucketObject.mockResolvedValueOnce(undefined as never)

    const state = setup()
    await state.deleteFiles({ files: [makeFile('a.txt')] })

    expect(toast.success).toHaveBeenCalledWith(
      'Successfully deleted 1 file(s)',
      expect.objectContaining({ id: 'toast-id' })
    )
    expect(toast.error).not.toHaveBeenCalled()
  })
})
