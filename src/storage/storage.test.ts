import { afterEach, describe, expect, it, vi } from 'vitest'
import { StorageBackendAdapter } from './backend'
import { Database } from './database'
import { ObjectAdminDeleteAllBefore } from './events'
import { StorageObjectLocator } from './locator'
import { Storage } from './storage'

function createStorage(dbOverrides: Partial<Database> = {}) {
  const deleteObject = vi.fn()
  const testPermission = vi.fn()
  const db = {
    tenantId: 'tenant-id',
    reqId: 'req-id',
    sbReqId: 'sb-req-id',
    tenant: vi.fn(() => ({ ref: 'tenant-id', host: 'localhost' })),
    findBucketById: vi.fn().mockResolvedValue({ name: 'bucket' }),
    testPermission,
    countObjectsInBucket: vi.fn().mockResolvedValue(1),
    listObjects: vi.fn().mockResolvedValue([{ id: 'object-id', name: 'visible.txt' }]),
    deleteObject,
    ...dbOverrides,
  } as unknown as Database
  const storage = new Storage({} as StorageBackendAdapter, db, {} as StorageObjectLocator)

  return {
    db,
    deleteObject,
    storage,
    testPermission,
  }
}

describe('Storage.emptyBucket', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('enqueues deletion without probing object or bucket permissions', async () => {
    const send = vi.spyOn(ObjectAdminDeleteAllBefore, 'send').mockResolvedValue(undefined)
    const { deleteObject, storage, testPermission } = createStorage()

    await storage.emptyBucket('bucket')

    expect(testPermission).not.toHaveBeenCalled()
    expect(deleteObject).not.toHaveBeenCalled()
    expect(send).toHaveBeenCalledOnce()
  })

  it('does not enqueue when the bucket is already empty', async () => {
    const send = vi.spyOn(ObjectAdminDeleteAllBefore, 'send').mockResolvedValue(undefined)
    const { storage } = createStorage({
      listObjects: vi.fn().mockResolvedValue([]),
    })

    await storage.emptyBucket('bucket')

    expect(send).not.toHaveBeenCalled()
  })
})
