import { ERRORS, ErrorCode } from '@internal/errors'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StorageBackendAdapter } from './backend'
import { Database } from './database'
import { ObjectRemoved } from './events'
import {
  MAX_KEYS_PER_S3_DELETE,
  MAX_OBJECTS_PER_DELETE_BATCH,
  MAX_OBJECTS_PER_REQUEST,
} from './limits'
import { StorageObjectLocator } from './locator'
import { ObjectStorage } from './object'

function createObjectStorage({
  findObject = vi.fn().mockResolvedValue({
    id: 'object-id',
    version: 'version-1',
  }),
  deleteObject = vi.fn().mockResolvedValue({
    name: 'private/file.txt',
    version: 'version-1',
  }),
}: {
  findObject?: ReturnType<typeof vi.fn>
  deleteObject?: ReturnType<typeof vi.fn>
} = {}) {
  const backend = {
    deleteObject: vi.fn(),
  } as unknown as StorageBackendAdapter
  const superUserDb = {
    findObject,
  }
  const scopedDb = {
    asSuperUser: vi.fn(() => superUserDb),
    deleteObject,
  }
  const db = {
    tenantId: 'tenant-id',
    withTransaction: vi.fn((fn) => fn(scopedDb)),
  } as unknown as Database
  const location = {
    getRootLocation: vi.fn(() => 'root-bucket'),
    getKeyLocation: vi.fn(() => 'tenant-id/bucket/private/file.txt'),
  } as unknown as StorageObjectLocator
  const storage = new ObjectStorage(backend, db, location, 'bucket')

  return {
    backend,
    deleteObject,
    findObject,
    location,
    storage,
  }
}

describe('ObjectStorage.deleteObject', () => {
  it('throws AccessDenied when the object exists but scoped delete is blocked by RLS', async () => {
    const { backend, deleteObject, findObject, storage } = createObjectStorage({
      deleteObject: vi.fn().mockResolvedValue(undefined),
    })

    await expect(storage.deleteObject('private/file.txt')).rejects.toMatchObject({
      code: ErrorCode.AccessDenied,
      httpStatusCode: 403,
      message: 'Access denied',
    })

    expect(findObject).toHaveBeenCalledWith(
      'bucket',
      'private/file.txt',
      'id,version,metadata',
      {
        forUpdate: true,
      },
      undefined
    )
    expect(deleteObject).toHaveBeenCalledWith('bucket', 'private/file.txt', undefined)
    expect(backend.deleteObject).not.toHaveBeenCalled()
  })

  it('keeps true missing objects as NoSuchKey before attempting scoped delete', async () => {
    const { backend, deleteObject, storage } = createObjectStorage({
      findObject: vi.fn().mockRejectedValue(ERRORS.NoSuchKey('missing.txt')),
    })

    await expect(storage.deleteObject('missing.txt')).rejects.toMatchObject({
      code: ErrorCode.NoSuchKey,
      httpStatusCode: 404,
    })

    expect(deleteObject).not.toHaveBeenCalled()
    expect(backend.deleteObject).not.toHaveBeenCalled()
  })
})

describe('ObjectStorage.deleteObjects', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps versioned-object backend deletes within the S3 key limit', async () => {
    const sendWebhook = vi.spyOn(ObjectRemoved, 'sendWebhook').mockResolvedValue(undefined)
    const backend = {
      deleteObjects: vi.fn(),
    } as unknown as StorageBackendAdapter
    const scopedDb = {
      tenantId: 'tenant-id',
      tenant: vi.fn(() => ({ ref: 'tenant-id' })),
      deleteObjects: vi.fn((_bucketId: string, names: string[]) =>
        names.map((name) => ({
          name,
          version: `version-${name}`,
          metadata: {},
        }))
      ),
    }
    const db = {
      tenantId: 'tenant-id',
      reqId: 'req-id',
      sbReqId: 'sb-req-id',
      withTransaction: vi.fn((fn) => fn(scopedDb)),
    } as unknown as Database
    const location = {
      getRootLocation: vi.fn(() => 'root-bucket'),
      getKeyLocation: vi.fn(({ tenantId, bucketId, objectName, version }) =>
        [tenantId, bucketId, objectName, version].filter(Boolean).join('/')
      ),
    } as unknown as StorageObjectLocator
    const storage = new ObjectStorage(backend, db, location, 'bucket')
    const objectNames = [...Array(MAX_OBJECTS_PER_REQUEST).keys()].map((i) => `object-${i}`)

    const results = await storage.deleteObjects(objectNames)

    expect(results).toHaveLength(MAX_OBJECTS_PER_REQUEST)
    expect(scopedDb.deleteObjects).toHaveBeenCalledTimes(
      Math.ceil(MAX_OBJECTS_PER_REQUEST / MAX_OBJECTS_PER_DELETE_BATCH)
    )
    expect(backend.deleteObjects).toHaveBeenCalledTimes(
      Math.ceil(MAX_OBJECTS_PER_REQUEST / MAX_OBJECTS_PER_DELETE_BATCH)
    )
    for (const [, keys] of vi.mocked(backend.deleteObjects).mock.calls) {
      expect(keys).toHaveLength(MAX_KEYS_PER_S3_DELETE)
    }
    expect(sendWebhook).toHaveBeenCalledTimes(MAX_OBJECTS_PER_REQUEST)
  })
})
