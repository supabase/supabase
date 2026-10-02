import * as fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pathExists, removePath } from '@internal/fs'
import type { Configstore } from '@tus/file-store'
import { Upload } from '@tus/server'
import { ERRORS as TUS_ERRORS } from '@tus/utils'
import { vi } from 'vitest'
import { getConfig } from '../../../config'
import { FileStore, type FileStoreOptions } from './file-store'

describe('TUS FileStore traversal protection', () => {
  let tmpDir: string
  let storeDir: string
  let originalStoragePath: string | undefined
  let originalFilePath: string | undefined

  beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'storage-tus-file-store-'))
    storeDir = path.join(tmpDir, 'tenant-store')
    originalStoragePath = process.env.STORAGE_FILE_BACKEND_PATH
    originalFilePath = process.env.FILE_STORAGE_BACKEND_PATH
    process.env.STORAGE_FILE_BACKEND_PATH = tmpDir
    process.env.FILE_STORAGE_BACKEND_PATH = tmpDir
    getConfig({ reload: true })
  })

  afterEach(async () => {
    if (originalStoragePath === undefined) {
      delete process.env.STORAGE_FILE_BACKEND_PATH
    } else {
      process.env.STORAGE_FILE_BACKEND_PATH = originalStoragePath
    }

    if (originalFilePath === undefined) {
      delete process.env.FILE_STORAGE_BACKEND_PATH
    } else {
      process.env.FILE_STORAGE_BACKEND_PATH = originalFilePath
    }

    getConfig({ reload: true })
    await removePath(tmpDir)
  })

  function createStore(options: Partial<FileStoreOptions> = {}) {
    const store = new FileStore({
      directory: storeDir,
      ...options,
    })

    ;(
      store as unknown as {
        fileAdapter: { setFileMetadata: (filePath: string, metadata: unknown) => Promise<void> }
      }
    ).fileAdapter = {
      setFileMetadata: vi.fn().mockResolvedValue(undefined),
    }

    return store
  }

  function createUpload(
    id: string,
    size?: number,
    options: Partial<{ offset: number; creationDate: string }> = {}
  ) {
    return new Upload({
      id,
      size,
      offset: options.offset ?? 0,
      metadata: {
        cacheControl: 'max-age=60',
        contentType: 'text/plain',
      },
      creation_date: options.creationDate,
    })
  }

  it('creates and reads safe nested upload ids under the configured directory', async () => {
    const store = createStore()
    const upload = createUpload('tenant-a/bucket-a/folder/file.txt/version-a')

    const created = await store.create(upload)
    expect(created.storage).toEqual({
      type: 'file',
      path: path.join(storeDir, 'tenant-a', 'bucket-a', 'folder', 'file.txt', 'version-a'),
    })

    await store.declareUploadLength(upload.id, 5)
    const nextOffset = await store.write(Readable.from(Buffer.from('hello')), upload.id, 0)
    expect(nextOffset).toBe(5)

    const diskContent = await fsp.readFile(created.storage!.path, 'utf8')
    expect(diskContent).toBe('hello')

    const storedUpload = await store.getUpload(upload.id)
    expect(storedUpload.offset).toBe(5)
    expect(storedUpload.size).toBe(5)
    expect(storedUpload.storage).toEqual(created.storage)
  })

  it('rejects traversal upload ids before touching blob or configstore paths', async () => {
    const store = createStore()
    const traversalId = '../escaped/upload'
    const outsideFile = path.join(tmpDir, 'escaped', 'upload')

    await expect(store.create(createUpload(traversalId))).rejects.toMatchObject({
      code: 'InvalidKey',
    })

    expect(() => store.read(traversalId)).toThrow(
      expect.objectContaining({
        code: 'InvalidKey',
      })
    )
    expect(() => store.write(Readable.from(Buffer.from('escape')), traversalId, 0)).toThrow(
      expect.objectContaining({
        code: 'InvalidKey',
      })
    )
    await expect(store.getUpload(traversalId)).rejects.toMatchObject({
      code: 'InvalidKey',
    })
    await expect(store.declareUploadLength(traversalId, 5)).rejects.toMatchObject({
      code: 'InvalidKey',
    })
    await expect(store.remove(traversalId)).rejects.toMatchObject({
      code: 'InvalidKey',
    })

    expect(await pathExists(outsideFile)).toBe(false)
    expect(await pathExists(`${outsideFile}.json`)).toBe(false)
  })

  it('removes stored uploads and metadata on the happy path', async () => {
    const store = createStore()
    const upload = createUpload('tenant-a/bucket-a/folder/file.txt/version-a', 5)

    const created = await store.create(upload)
    const metadataPath = `${created.storage!.path}.json`

    expect(await pathExists(created.storage!.path)).toBe(true)
    expect(await pathExists(metadataPath)).toBe(true)

    await store.remove(upload.id)

    expect(await pathExists(created.storage!.path)).toBe(false)
    expect(await pathExists(metadataPath)).toBe(false)
  })

  it('rethrows non-ENOENT unlink failures from remove', async () => {
    const configstore = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    } satisfies Configstore
    const store = createStore({ configstore })
    const uploadId = 'tenant-a/bucket-a/folder/file.txt/version-a'
    const filePath = path.join(storeDir, 'tenant-a', 'bucket-a', 'folder', 'file.txt', 'version-a')

    await fsp.mkdir(filePath, { recursive: true })

    await expect(store.remove(uploadId)).rejects.toMatchObject({
      code: expect.stringMatching(/^(EISDIR|EPERM)$/),
    })
    expect(configstore.delete).not.toHaveBeenCalled()
  })

  it('remove best-effort deletes orphaned metadata when the blob is missing', async () => {
    const store = createStore()
    const upload = createUpload('tenant-a/bucket-a/folder/file.txt/version-a', 5)

    const created = await store.create(upload)
    const metadataPath = `${created.storage!.path}.json`

    await removePath(created.storage!.path)

    await expect(store.remove(upload.id)).rejects.toBe(TUS_ERRORS.FILE_NOT_FOUND)

    expect(await pathExists(metadataPath)).toBe(false)
  })

  it('remove still returns FILE_NOT_FOUND when best-effort metadata cleanup fails', async () => {
    const uploadId = 'tenant-a/bucket-a/folder/file.txt/version-a'
    const deleteError = new Error('configstore delete failed')
    const configstore = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn().mockRejectedValue(deleteError),
    } satisfies Configstore
    const store = createStore({ configstore })
    const upload = createUpload(uploadId, 5)

    const created = await store.create(upload)

    await removePath(created.storage!.path)

    await expect(store.remove(uploadId)).rejects.toBe(TUS_ERRORS.FILE_NOT_FOUND)
    expect(configstore.delete).toHaveBeenCalledWith(uploadId)
  })

  it('deleteExpired skips invalid upload ids and still cleans up valid expired uploads', async () => {
    const validId = 'tenant-a/bucket-a/folder/file.txt/version-a'
    const invalidId = '../escaped/upload'
    const creationDate = new Date(Date.now() - 60_000).toISOString()
    const uploads = new Map<string, Upload>([
      [validId, createUpload(validId, 5, { creationDate })],
      [invalidId, createUpload(invalidId, 5, { creationDate })],
    ])
    const configstore = {
      get: vi.fn(async (key: string) => uploads.get(key)),
      set: vi.fn(async (key: string, upload: Upload) => {
        uploads.set(key, upload)
      }),
      delete: vi.fn(async (key: string) => {
        uploads.delete(key)
      }),
      list: vi.fn(async () => Array.from(uploads.keys())),
    } satisfies Configstore
    const store = createStore({
      configstore,
      expirationPeriodInMilliseconds: 1_000,
    })

    const created = await store.create(uploads.get(validId)!)

    await expect(store.deleteExpired()).resolves.toBe(1)

    expect(await pathExists(created.storage!.path)).toBe(false)
    expect(configstore.delete).toHaveBeenCalledWith(validId)
    expect(uploads.has(validId)).toBe(false)
    expect(uploads.has(invalidId)).toBe(true)
  })

  it('deleteExpired skips invalid upload ids before configstore.get runs', async () => {
    const validId = 'tenant-a/bucket-a/folder/file.txt/version-a'
    const invalidId = '../escaped/upload'
    const creationDate = new Date(Date.now() - 60_000).toISOString()
    const uploads = new Map<string, Upload>([[validId, createUpload(validId, 5, { creationDate })]])
    const configstore = {
      get: vi.fn(async (key: string) => {
        if (key === invalidId) {
          throw new Error('configstore rejected invalid key')
        }

        return uploads.get(key)
      }),
      set: vi.fn(async (key: string, upload: Upload) => {
        uploads.set(key, upload)
      }),
      delete: vi.fn(async (key: string) => {
        uploads.delete(key)
      }),
      list: vi.fn(async () => [validId, invalidId]),
    } satisfies Configstore
    const store = createStore({
      configstore,
      expirationPeriodInMilliseconds: 1_000,
    })

    const created = await store.create(uploads.get(validId)!)

    await expect(store.deleteExpired()).resolves.toBe(1)

    expect(configstore.get).toHaveBeenCalledWith(validId)
    expect(configstore.get).not.toHaveBeenCalledWith(invalidId)
    expect(await pathExists(created.storage!.path)).toBe(false)
    expect(configstore.delete).toHaveBeenCalledWith(validId)
  })

  it('deleteExpired keeps uploads whose on-disk bytes match the declared size', async () => {
    const uploadId = 'tenant-a/bucket-a/folder/file.txt/version-a'
    const creationDate = new Date(Date.now() - 60_000).toISOString()
    const uploads = new Map<string, Upload>([
      [uploadId, createUpload(uploadId, 5, { creationDate })],
    ])
    const configstore = {
      get: vi.fn(async (key: string) => uploads.get(key)),
      set: vi.fn(async (key: string, upload: Upload) => {
        uploads.set(key, upload)
      }),
      delete: vi.fn(async (key: string) => {
        uploads.delete(key)
      }),
      list: vi.fn(async () => Array.from(uploads.keys())),
    } satisfies Configstore
    const store = createStore({
      configstore,
      expirationPeriodInMilliseconds: 1_000,
    })

    const created = await store.create(uploads.get(uploadId)!)
    await store.write(Readable.from(Buffer.from('hello')), uploadId, 0)

    await expect(store.deleteExpired()).resolves.toBe(0)

    expect(await pathExists(created.storage!.path)).toBe(true)
    expect(configstore.delete).not.toHaveBeenCalled()
    expect(uploads.has(uploadId)).toBe(true)
  })

  it('deleteExpired removes orphaned metadata when the blob is missing', async () => {
    const uploadId = 'tenant-a/bucket-a/folder/file.txt/version-a'
    const creationDate = new Date(Date.now() - 60_000).toISOString()
    const uploads = new Map<string, Upload>([
      [uploadId, createUpload(uploadId, 5, { creationDate })],
    ])
    const configstore = {
      get: vi.fn(async (key: string) => uploads.get(key)),
      set: vi.fn(async (key: string, upload: Upload) => {
        uploads.set(key, upload)
      }),
      delete: vi.fn(async (key: string) => {
        uploads.delete(key)
      }),
      list: vi.fn(async () => Array.from(uploads.keys())),
    } satisfies Configstore
    const store = createStore({
      configstore,
      expirationPeriodInMilliseconds: 1_000,
    })

    const created = await store.create(uploads.get(uploadId)!)
    await removePath(created.storage!.path)

    await expect(store.deleteExpired()).resolves.toBe(0)

    expect(configstore.delete).toHaveBeenCalledWith(uploadId)
    expect(uploads.has(uploadId)).toBe(false)
  })

  it('deleteExpired ignores FILE_NOT_FOUND races from remove and keeps queued count', async () => {
    const racedUploadId = 'tenant-a/bucket-a/folder/raced-file.txt/version-a'
    const removedUploadId = 'tenant-a/bucket-a/folder/removed-file.txt/version-a'
    const creationDate = new Date(Date.now() - 60_000).toISOString()
    const uploads = new Map<string, Upload>([
      [racedUploadId, createUpload(racedUploadId, 5, { creationDate })],
      [removedUploadId, createUpload(removedUploadId, 5, { creationDate })],
    ])
    const configstore = {
      get: vi.fn(async (key: string) => uploads.get(key)),
      set: vi.fn(async (key: string, upload: Upload) => {
        uploads.set(key, upload)
      }),
      delete: vi.fn(async (key: string) => {
        uploads.delete(key)
      }),
      list: vi.fn(async () => Array.from(uploads.keys())),
    } satisfies Configstore
    const store = createStore({
      configstore,
      expirationPeriodInMilliseconds: 1_000,
    })
    const [racedUpload, removedUpload] = await Promise.all([
      store.create(uploads.get(racedUploadId)!),
      store.create(uploads.get(removedUploadId)!),
    ])
    const originalRemove = store.remove.bind(store)

    vi.spyOn(store, 'remove').mockImplementation(async (uploadId) => {
      if (uploadId === racedUploadId) {
        await removePath(racedUpload.storage!.path)
      }

      return originalRemove(uploadId)
    })

    await expect(store.deleteExpired()).resolves.toBe(2)

    expect(await pathExists(racedUpload.storage!.path)).toBe(false)
    expect(await pathExists(removedUpload.storage!.path)).toBe(false)
    expect(uploads.has(racedUploadId)).toBe(false)
    expect(uploads.has(removedUploadId)).toBe(false)
    expect(configstore.delete).toHaveBeenCalledWith(racedUploadId)
    expect(configstore.delete).toHaveBeenCalledWith(removedUploadId)
  })

  it('deleteExpired limits concurrent removals for large expired batches', async () => {
    const creationDate = new Date(Date.now() - 60_000).toISOString()
    const uploadIds = Array.from(
      { length: 96 },
      (_, index) => `tenant-a/bucket-a/folder/file-${index}.txt/version-a`
    )
    const uploads = new Map(
      uploadIds.map((uploadId) => [uploadId, createUpload(uploadId, 5, { creationDate })])
    )
    const configstore = {
      get: vi.fn(async (key: string) => uploads.get(key)),
      set: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(async () => Array.from(uploads.keys())),
    } satisfies Configstore
    const store = createStore({
      configstore,
      expirationPeriodInMilliseconds: 1_000,
    })
    let activeRemovals = 0
    let maxConcurrentRemovals = 0

    await Promise.all(uploadIds.map((uploadId) => store.create(uploads.get(uploadId)!)))

    vi.spyOn(store, 'remove').mockImplementation(async () => {
      activeRemovals += 1
      maxConcurrentRemovals = Math.max(maxConcurrentRemovals, activeRemovals)

      await new Promise((resolve) => setTimeout(resolve, 5))

      activeRemovals -= 1
    })

    await expect(store.deleteExpired()).resolves.toBe(uploadIds.length)

    expect(maxConcurrentRemovals).toBeGreaterThan(0)
    expect(maxConcurrentRemovals).toBeLessThan(uploadIds.length)
  })
})
