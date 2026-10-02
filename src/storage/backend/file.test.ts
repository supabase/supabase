import fs from 'node:fs'
import * as fsp from 'node:fs/promises'
import { ErrorCode } from '@internal/errors/codes'
import { removePath } from '@internal/fs'
import * as xattr from 'fs-xattr'
import os from 'os'
import path from 'path'
import { Readable } from 'stream'
import { text } from 'stream/consumers'
import { type Mock, vi } from 'vitest'
import { getConfig } from '../../config'
import { type BrowserCacheHeaders, withOptionalVersion } from './adapter'
import { FileBackend } from './file'

vi.mock('fs-xattr', () => ({
  setAttributeSync: vi.fn(() => undefined),
  getAttributeSync: vi.fn(() => undefined),
  removeAttributeSync: vi.fn(() => undefined),
}))

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetAllMocks()
})

function useFileBackend(prefix = 'storage-file-backend-') {
  const ctx = {} as { tmpDir: string; backend: FileBackend }

  beforeEach(async () => {
    ctx.tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), prefix))
    vi.stubEnv('STORAGE_FILE_BACKEND_PATH', ctx.tmpDir)
    getConfig({ reload: true })
    ctx.backend = new FileBackend()
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    getConfig({ reload: true })
    await removePath(ctx.tmpDir)
  })

  return Object.assign(ctx, {
    objectPath: (bucket: string, key: string, version: string) =>
      path.join(ctx.tmpDir, withOptionalVersion(`${bucket}/${key}`, version)),
    upload: (
      bucket: string,
      key: string,
      version: string,
      body: string,
      contentType = 'text/plain',
      cacheControl = 'no-cache'
    ) =>
      ctx.backend.uploadObject(
        bucket,
        key,
        version,
        Readable.from(body),
        contentType,
        cacheControl
      ),
  })
}

function useLinuxPlatform() {
  const platform = Object.getOwnPropertyDescriptor(process, 'platform') as PropertyDescriptor

  beforeEach(() => {
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true })
  })

  afterEach(() => {
    Object.defineProperty(process, 'platform', platform)
  })
}

function mockXattrs(values: Record<string, string>) {
  ;(xattr.getAttributeSync as unknown as Mock).mockImplementation(
    (_file: string, attribute: string) =>
      attribute in values ? Buffer.from(values[attribute]) : undefined
  )
}

describe('FileBackend xattr metadata', () => {
  const ctx = useFileBackend()
  useLinuxPlatform()
  let uploadId: string

  beforeEach(async () => {
    uploadId = (await ctx.backend.createMultiPartUpload(
      'bucket',
      'key',
      'v1',
      'text/plain',
      'no-cache'
    )) as string
  })

  it('uses a distinct linux xattr key for etag', async () => {
    await ctx.backend.uploadPart('bucket', 'key', 'v1', uploadId, 1, Readable.from('hello'))

    expect(xattr.setAttributeSync).toHaveBeenCalledWith(
      expect.any(String),
      'user.supabase.etag',
      expect.any(String)
    )
  })

  it('reads linux etag xattr during multipart completion', async () => {
    const partDir = path.join(
      ctx.tmpDir,
      'multiparts',
      uploadId,
      'bucket',
      withOptionalVersion('key', 'v1')
    )
    const partPath = path.join(partDir, 'part-1')
    await fsp.mkdir(partDir, { recursive: true })
    await fsp.writeFile(partPath, 'hello')

    mockXattrs({ 'user.supabase.etag': 'part-etag' })

    vi.spyOn(ctx.backend, 'uploadObject').mockImplementation(
      async (_bucket, _key, _version, body) => {
        await new Promise<void>((resolve, reject) => {
          body.on('error', reject)
          body.on('end', resolve)
          body.resume()
        })
        return {
          httpStatusCode: 200,
          size: 5,
          cacheControl: 'no-cache',
          mimetype: 'text/plain',
          eTag: '"final"',
          lastModified: new Date(),
          contentLength: 5,
        }
      }
    )

    await expect(
      ctx.backend.completeMultipartUpload('bucket', 'key', uploadId, 'v1', [
        { PartNumber: 1, ETag: 'part-etag' },
      ])
    ).resolves.toMatchObject({
      ETag: '"final"',
    })

    expect(xattr.getAttributeSync).toHaveBeenCalledWith(expect.any(String), 'user.supabase.etag')
  })
})

describe('FileBackend multipart part order', () => {
  const ctx = useFileBackend()
  useLinuxPlatform()

  beforeEach(() => {
    mockXattrs({ 'user.supabase.etag': 'part-etag' })
  })

  it('assembles parts in part-number order when completion lists them out of order', async () => {
    const { backend } = ctx
    const uploadId = (await backend.createMultiPartUpload(
      'bucket',
      'object.txt',
      'v1',
      'text/plain',
      'no-cache'
    )) as string

    await backend.uploadPart('bucket', 'object.txt', 'v1', uploadId, 1, Readable.from('one'))
    await backend.uploadPart('bucket', 'object.txt', 'v1', uploadId, 2, Readable.from('two'))

    await backend.completeMultipartUpload('bucket', 'object.txt', uploadId, 'v1', [
      { PartNumber: 2, ETag: 'part-etag' },
      { PartNumber: 1, ETag: 'part-etag' },
    ])

    const object = await backend.getObject('bucket', 'object.txt', 'v1')
    await expect(text(object.body as Readable)).resolves.toBe('onetwo')
  })
})

describe('FileBackend traversal protection', () => {
  const ctx = useFileBackend()
  let escapePrefix: string

  beforeEach(() => {
    escapePrefix = `storage-traversal-${Date.now()}-${Math.random().toString(36).slice(2)}`
  })

  afterEach(async () => {
    await removePath(path.join('/tmp', escapePrefix))
  })

  const traversalKey = (name: string) => `${'../'.repeat(20)}tmp/${escapePrefix}/${name}`

  it('rejects traversal key in multipart create with InvalidKey', async () => {
    await expect(
      ctx.backend.createMultiPartUpload(
        'bucket',
        traversalKey('multipart-escape.txt'),
        'v1',
        'text/plain',
        'no-cache'
      )
    ).rejects.toMatchObject({
      code: 'InvalidKey',
    })
  })

  it('rejects traversal key in multipart upload-part with InvalidKey', async () => {
    await expect(
      ctx.backend.uploadPart(
        'bucket',
        traversalKey('multipart-escape.txt'),
        'v1',
        'upload-id',
        1,
        Readable.from('escape-part')
      )
    ).rejects.toMatchObject({
      code: 'InvalidKey',
    })
  })

  it('rejects traversal key in object operations with InvalidKey', async () => {
    const { backend } = ctx
    const key = traversalKey('object-escape.txt')

    await expect(
      backend.uploadObject('bucket', key, 'v1', Readable.from('escape'), 'text/plain', 'no-cache')
    ).rejects.toMatchObject({
      code: 'InvalidKey',
    })

    await expect(backend.headObject('bucket', key, 'v1')).rejects.toMatchObject({
      code: 'InvalidKey',
    })

    await expect(backend.getObject('bucket', key, 'v1')).rejects.toMatchObject({
      code: 'InvalidKey',
    })

    await expect(backend.deleteObject('bucket', key, 'v1')).rejects.toMatchObject({
      code: 'InvalidKey',
    })

    await expect(backend.privateAssetUrl('bucket', key, 'v1')).rejects.toMatchObject({
      code: 'InvalidKey',
    })
  })

  it('rejects traversal key in copy/delete list operations with InvalidKey', async () => {
    const key = traversalKey('copy-escape.txt')

    await ctx.upload('bucket', 'safe-source.txt', 'v1', 'safe-source')

    await expect(
      ctx.backend.copyObject('bucket', 'safe-source.txt', 'v1', key, 'v2', {})
    ).rejects.toMatchObject({
      code: 'InvalidKey',
    })

    await expect(ctx.backend.deleteObjects('bucket', [key])).rejects.toMatchObject({
      code: 'InvalidKey',
    })
  })

  it('rejects traversal key in multipart auxiliary operations with InvalidKey', async () => {
    const traversalDestKey = traversalKey('multipart-dest-escape.txt')
    const traversalSourceKey = traversalKey('multipart-source-escape.txt')

    await expect(
      ctx.backend.abortMultipartUpload('bucket', 'key', traversalDestKey)
    ).rejects.toMatchObject({
      code: 'InvalidKey',
    })

    await expect(
      ctx.backend.uploadPartCopy(
        'bucket',
        traversalDestKey,
        'v1',
        'upload-id',
        1,
        'safe-source.txt',
        'v1'
      )
    ).rejects.toMatchObject({
      code: 'InvalidKey',
    })

    await expect(
      ctx.backend.uploadPartCopy(
        'bucket',
        'safe-dest.txt',
        'v1',
        'upload-id',
        1,
        traversalSourceKey,
        'v1'
      )
    ).rejects.toMatchObject({
      code: 'InvalidKey',
    })
  })
})

describe('FileBackend bulk deletion outcomes', () => {
  const ctx = useFileBackend('storage-file-delete-')

  beforeEach(async () => {
    await fsp.mkdir(path.join(ctx.tmpDir, 'bucket', 'folder'), { recursive: true })
    await fsp.writeFile(path.join(ctx.tmpDir, 'bucket', 'folder', 'object'), 'data')
  })

  it('confirms deleted and absent keys while cleaning empty parents', async () => {
    await expect(
      ctx.backend.deleteObjectsDetailed('bucket', ['folder/missing', 'folder/object'])
    ).resolves.toEqual([
      { key: 'folder/missing', outcome: 'DELETED' },
      { key: 'folder/object', outcome: 'DELETED' },
    ])
    await expect(fsp.access(path.join(ctx.tmpDir, 'bucket'))).rejects.toMatchObject({
      code: 'ENOENT',
    })
    await expect(fsp.access(ctx.tmpDir)).resolves.toBeUndefined()
    await expect(ctx.backend.deleteObjects('bucket', ['folder/object'])).resolves.toBeUndefined()
  })

  it('reports filesystem failures without hiding successful deletions', async () => {
    await fsp.writeFile(path.join(ctx.tmpDir, 'bucket', 'blocked'), 'not a directory')

    const results = await ctx.backend.deleteObjectsDetailed('bucket', [
      'blocked/child',
      'folder/object',
    ])

    expect(results).toEqual([
      {
        key: 'blocked/child',
        outcome: 'UNKNOWN',
        error: { code: 'ENOTDIR', message: expect.any(String) },
      },
      { key: 'folder/object', outcome: 'DELETED' },
    ])
    await expect(fsp.access(path.join(ctx.tmpDir, 'bucket', 'folder'))).rejects.toMatchObject({
      code: 'ENOENT',
    })
    await expect(fsp.readFile(path.join(ctx.tmpDir, 'bucket', 'blocked'), 'utf8')).resolves.toBe(
      'not a directory'
    )
  })

  it('rethrows the original filesystem error from the existing wrapper', async () => {
    await fsp.writeFile(path.join(ctx.tmpDir, 'bucket', 'blocked'), 'not a directory')
    const filesystem = await import('@internal/fs')
    const remove = filesystem.removePath
    let originalError: unknown
    vi.spyOn(filesystem, 'removePath').mockImplementation(async (...args) => {
      try {
        await remove(...args)
      } catch (error) {
        originalError = error
        throw error
      }
    })

    const error = await ctx.backend
      .deleteObjects('bucket', ['folder/object', 'blocked/child'])
      .then(
        () => undefined,
        (error: unknown) => error
      )
    expect(error).toBe(originalError)
    expect(error).toMatchObject({
      code: 'ENOTDIR',
      errno: expect.any(Number),
      syscall: expect.any(String),
      path: path.join(ctx.tmpDir, 'bucket', 'blocked', 'child'),
    })
    await expect(fsp.access(path.join(ctx.tmpDir, 'bucket', 'folder'))).rejects.toMatchObject({
      code: 'ENOENT',
    })
  })

  it.skipIf(process.platform === 'win32' || process.getuid?.() === 0)(
    'keeps a recursive permission failure unknown after partially deleting a directory',
    async () => {
      const target = path.join(ctx.tmpDir, 'bucket', 'partial')
      const locked = path.join(target, 'z-locked')
      await fsp.mkdir(locked, { recursive: true })
      await fsp.writeFile(path.join(target, 'a-removable'), 'deleted first')
      await fsp.writeFile(path.join(locked, 'kept'), 'protected')
      await fsp.chmod(locked, 0)
      try {
        await expect(ctx.backend.deleteObjectsDetailed('bucket', ['partial'])).resolves.toEqual([
          {
            key: 'partial',
            outcome: 'UNKNOWN',
            error: { code: 'EACCES', message: expect.any(String) },
          },
        ])
        await vi.waitFor(async () => {
          await expect(fsp.access(path.join(target, 'a-removable'))).rejects.toMatchObject({
            code: 'ENOENT',
          })
        })
      } finally {
        await fsp.chmod(locked, 0o700)
      }
      expect(await fsp.readFile(path.join(locked, 'kept'), 'utf8')).toBe('protected')
    }
  )

  it('validates all paths before deleting a mixed valid and invalid batch', async () => {
    await expect(
      ctx.backend.deleteObjectsDetailed('bucket', ['folder/object', '../../outside'])
    ).rejects.toMatchObject({ code: 'InvalidKey' })
    await expect(
      fsp.readFile(path.join(ctx.tmpDir, 'bucket', 'folder', 'object'), 'utf8')
    ).resolves.toBe('data')
  })

  it('returns an empty result without removing directories', async () => {
    await expect(ctx.backend.deleteObjectsDetailed('bucket', [])).resolves.toEqual([])
    await expect(ctx.backend.deleteObjects('bucket', [])).resolves.toBeUndefined()
    await expect(fsp.access(path.join(ctx.tmpDir, 'bucket', 'folder'))).resolves.toBeUndefined()
  })
})

describe('FileBackend empty directory cleanup', () => {
  const ctx = useFileBackend()
  let siblingDirectory: string | undefined

  class TestFileBackend extends FileBackend {
    async cleanup(dirPath: string) {
      await this.cleanupEmptyDirectories(dirPath)
    }
  }

  afterEach(async () => {
    if (siblingDirectory) {
      await removePath(siblingDirectory)
    }
  })

  it('preserves a directory repopulated by an upload', async () => {
    const backend = new TestFileBackend()
    const objectDirectory = path.join(ctx.tmpDir, 'bucket', 'object.jpg')
    const version = 'new-version'
    await fsp.mkdir(objectDirectory, { recursive: true })
    await fsp.writeFile(path.join(objectDirectory, version), 'new upload')

    await backend.cleanup(objectDirectory)

    await expect(fsp.readFile(path.join(objectDirectory, version), 'utf8')).resolves.toBe(
      'new upload'
    )
  })

  it('removes empty directories recursively up to the storage root', async () => {
    const backend = new TestFileBackend()
    const bucketDirectory = path.join(ctx.tmpDir, 'bucket')
    const objectDirectory = path.join(bucketDirectory, 'nested', 'object.jpg')
    await fsp.mkdir(objectDirectory, { recursive: true })

    await backend.cleanup(objectDirectory)

    await expect(fsp.access(bucketDirectory)).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(fsp.access(ctx.tmpDir)).resolves.toBeUndefined()
  })

  it('continues cleaning parents when the target directory is already absent', async () => {
    const backend = new TestFileBackend()
    const bucketDirectory = path.join(ctx.tmpDir, 'bucket')
    const objectDirectory = path.join(bucketDirectory, 'nested', 'object.jpg')
    await fsp.mkdir(path.dirname(objectDirectory), { recursive: true })

    await backend.cleanup(objectDirectory)

    await expect(fsp.access(bucketDirectory)).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(fsp.access(ctx.tmpDir)).resolves.toBeUndefined()
  })

  it('does not clean a sibling directory that shares the storage-root prefix', async () => {
    const backend = new TestFileBackend()
    siblingDirectory = `${ctx.tmpDir}-sibling`
    await fsp.mkdir(siblingDirectory)

    await backend.cleanup(siblingDirectory)

    await expect(fsp.access(siblingDirectory)).resolves.toBeUndefined()
  })
})

describe('FileBackend copy metadata options', () => {
  const ctx = useFileBackend()
  useLinuxPlatform()

  const copy = (
    destination: string,
    metadata: Parameters<FileBackend['copyObject']>[5],
    copyMetadata: boolean
  ) =>
    ctx.backend.copyObject(
      'bucket',
      'source.txt',
      'v1',
      destination,
      undefined,
      metadata,
      undefined,
      { copyMetadata }
    )

  beforeEach(async () => {
    mockXattrs({
      'user.supabase.cache-control': 'max-age=60',
      'user.supabase.content-type': 'text/plain',
    })

    await ctx.upload('bucket', 'source.txt', 'v1', 'source-body', 'text/plain', 'max-age=60')
    vi.clearAllMocks()
  })

  it('preserves source metadata when copyMetadata is true', async () => {
    const setMetadataSpy = vi.spyOn(ctx.backend, 'setFileMetadata')

    await copy(
      'copy-preserve.txt',
      {
        cacheControl: 'max-age=999',
        mimetype: 'image/gif',
      },
      true
    )

    expect(setMetadataSpy).toHaveBeenCalledWith(expect.any(String), {
      cacheControl: 'max-age=60',
      contentType: 'text/plain',
    })
  })

  it('overwrites file metadata when copyMetadata is false', async () => {
    const setMetadataSpy = vi.spyOn(ctx.backend, 'setFileMetadata')

    await copy(
      'copy-replace.txt',
      {
        cacheControl: 'max-age=999',
        mimetype: 'image/gif',
      },
      false
    )

    expect(setMetadataSpy).toHaveBeenCalledWith(expect.any(String), {
      cacheControl: 'max-age=999',
      contentType: 'image/gif',
    })
  })

  it('removes omitted metadata when copyMetadata is false', async () => {
    const setMetadataSpy = vi.spyOn(ctx.backend, 'setFileMetadata')

    await copy(
      'copy-partial-replace.txt',
      {
        cacheControl: 'max-age=999',
      },
      false
    )

    expect(setMetadataSpy).toHaveBeenCalledWith(expect.any(String), {
      cacheControl: 'max-age=999',
      contentType: undefined,
    })
    expect(xattr.setAttributeSync).toHaveBeenCalledWith(
      expect.any(String),
      'user.supabase.cache-control',
      'max-age=999'
    )
    expect(xattr.removeAttributeSync).toHaveBeenCalledWith(
      expect.any(String),
      'user.supabase.content-type'
    )
  })

  it('removes all metadata when replacement metadata is empty', async () => {
    await copy('copy-empty-replace.txt', {}, false)

    expect(xattr.setAttributeSync).not.toHaveBeenCalled()
    expect(xattr.removeAttributeSync).toHaveBeenCalledTimes(2)
    expect(xattr.removeAttributeSync).toHaveBeenCalledWith(
      expect.any(String),
      'user.supabase.cache-control'
    )
    expect(xattr.removeAttributeSync).toHaveBeenCalledWith(
      expect.any(String),
      'user.supabase.content-type'
    )
  })

  it('preserves absent source metadata when copyMetadata is true', async () => {
    const missingXattr = Object.assign(new Error('missing xattr'), { code: 'ENODATA' })
    vi.mocked(xattr.getAttributeSync).mockImplementation(() => {
      throw missingXattr
    })

    await expect(copy('copy-without-metadata.txt', undefined, true)).resolves.toMatchObject({
      httpStatusCode: 200,
    })

    expect(xattr.removeAttributeSync).toHaveBeenCalledTimes(2)
  })

  it('ignores already absent destination metadata', async () => {
    const missingXattr = Object.assign(new Error('missing xattr'), { code: 'ENOATTR' })
    vi.mocked(xattr.removeAttributeSync).mockImplementation(() => {
      throw missingXattr
    })

    await expect(copy('copy-empty-replace.txt', {}, false)).resolves.toMatchObject({
      httpStatusCode: 200,
    })
  })

  it('propagates genuine source metadata read errors', async () => {
    const readError = Object.assign(new Error('xattr read failed'), { code: 'EIO' })
    vi.mocked(xattr.getAttributeSync).mockImplementation(() => {
      throw readError
    })

    await expect(copy('copy-read-failure.txt', undefined, true)).rejects.toBe(readError)
  })

  it('propagates genuine destination metadata removal errors', async () => {
    const removeError = Object.assign(new Error('xattr removal failed'), { code: 'EIO' })
    vi.mocked(xattr.removeAttributeSync).mockImplementation(() => {
      throw removeError
    })

    await expect(copy('copy-remove-failure.txt', {}, false)).rejects.toBe(removeError)
  })
})

describe('FileBackend lastModified', () => {
  const ctx = useFileBackend()

  it('headObject/getObject should return mtime as lastModified', async () => {
    const bucket = 'test-bucket'
    const key = 'test-file.txt'
    const version = 'v1'

    await ctx.upload(bucket, key, version, 'initial content')

    const filePath = ctx.objectPath(bucket, key, version)
    const stat = await fsp.stat(filePath)
    const knownMtime = new Date(stat.birthtimeMs + 60_000) // mtime must be in the future
    await fsp.utimes(filePath, knownMtime, knownMtime)

    const headResult = await ctx.backend.headObject(bucket, key, version)
    expect(headResult.lastModified).toEqual(knownMtime)

    const getResult = await ctx.backend.getObject(bucket, key, version)
    expect(getResult.metadata.lastModified).toEqual(knownMtime)
  })
})

describe('FileBackend conditional reads', () => {
  const ctx = useFileBackend()
  const bucket = 'conditional-bucket'
  const key = 'conditional.txt'
  const version = 'v1'
  // A realistic mtime with a sub-second component
  const mtime = new Date('2026-01-01T00:00:00.700Z')
  const lastModifiedHeader = mtime.toUTCString()

  beforeEach(async () => {
    await ctx.upload(bucket, key, version, 'body')
    const filePath = ctx.objectPath(bucket, key, version)
    await fsp.utimes(filePath, mtime, mtime)
  })

  async function statusFor(headers: BrowserCacheHeaders) {
    const response = await ctx.backend.getObject(bucket, key, version, headers)
    if (response.body instanceof Readable) {
      response.body.destroy()
    }
    return response.httpStatusCode
  }

  it('returns 304 when if-modified-since echoes the Last-Modified header', async () => {
    const head = await ctx.backend.headObject(bucket, key, version)
    expect(head.lastModified?.toUTCString()).toBe(lastModifiedHeader)

    await expect(statusFor({ ifModifiedSince: lastModifiedHeader })).resolves.toBe(304)
  })

  it('returns 304 when if-modified-since is later than the last modification', async () => {
    await expect(
      statusFor({ ifModifiedSince: new Date(mtime.getTime() + 60_000).toUTCString() })
    ).resolves.toBe(304)
  })

  it('returns 200 when the object changed after if-modified-since', async () => {
    await expect(
      statusFor({ ifModifiedSince: new Date(mtime.getTime() - 1_000).toUTCString() })
    ).resolves.toBe(200)
  })

  it('returns 304 when if-none-match matches the etag', async () => {
    const head = await ctx.backend.headObject(bucket, key, version)
    await expect(statusFor({ ifNoneMatch: head.eTag })).resolves.toBe(304)
  })

  it.each([
    ['a weak tag', (eTag: string) => `W/${eTag}`],
    ['a tag list', (eTag: string) => `"stale-etag", ${eTag}`],
    ['a wildcard', () => '*'],
    ['an unquoted tag', (eTag: string) => eTag.replace(/"/g, '')],
  ])('returns 304 when if-none-match is %s matching the etag', async (_name, toHeader) => {
    const head = await ctx.backend.headObject(bucket, key, version)
    await expect(statusFor({ ifNoneMatch: toHeader(head.eTag) })).resolves.toBe(304)
  })

  it('returns 200 when no tag in an if-none-match list matches', async () => {
    await expect(statusFor({ ifNoneMatch: '"stale-etag", W/"other-etag"' })).resolves.toBe(200)
  })

  it('returns 200 when a quoted if-none-match tag contains commas and a wildcard', async () => {
    await expect(statusFor({ ifNoneMatch: '"stale,*,etag"' })).resolves.toBe(200)
  })

  it('ignores if-modified-since when if-none-match is present and does not match', async () => {
    await expect(
      statusFor({ ifNoneMatch: '"stale-etag"', ifModifiedSince: lastModifiedHeader })
    ).resolves.toBe(200)
    await expect(
      statusFor({
        ifNoneMatch: '"stale-etag"',
        ifModifiedSince: new Date(mtime.getTime() + 60_000).toUTCString(),
      })
    ).resolves.toBe(200)
  })

  it('ignores an invalid if-modified-since date', async () => {
    await expect(statusFor({ ifModifiedSince: 'not a date' })).resolves.toBe(200)
  })

  it.each([
    lastModifiedHeader,
    new Date(mtime.getTime() + 60_000).toUTCString(),
  ])('ignores if-modified-since %s when if-none-match is empty', async (ifModifiedSince) => {
    await expect(statusFor({ ifNoneMatch: '', ifModifiedSince })).resolves.toBe(200)
  })

  it('returns 200 when if-match matches the etag', async () => {
    const head = await ctx.backend.headObject(bucket, key, version)
    await expect(statusFor({ ifMatch: head.eTag })).resolves.toBe(200)
  })

  it.each([
    ['a stale weak tag', (_eTag: string) => 'W/"stale-etag"'],
    ['a quoted wildcard', () => '"stale,*,etag"'],
  ])('rejects if-match with %s before range and cache checks', async (_name, toHeader) => {
    const head = await ctx.backend.headObject(bucket, key, version)
    await expect(
      statusFor({ ifMatch: toHeader(head.eTag), range: 'bytes=0-1' })
    ).rejects.toMatchObject({ httpStatusCode: 412, code: 'PreconditionFailed' })
    await expect(
      statusFor({ ifMatch: toHeader(head.eTag), ifNoneMatch: head.eTag })
    ).rejects.toMatchObject({ httpStatusCode: 412, code: 'PreconditionFailed' })
  })

  it.each([
    ['a wildcard', () => '*'],
    ['a match in a list', (eTag: string) => `W/"stale-etag", ${eTag}`],
    ['an unquoted tag', (eTag: string) => eTag.slice(1, -1)],
    ['a weak tag', (eTag: string) => `W/${eTag}`],
    ['a weak tag in a list', (eTag: string) => `"stale-etag", W/${eTag}`],
  ])('allows a range when if-match has %s', async (_name, toHeader) => {
    const head = await ctx.backend.headObject(bucket, key, version)
    await expect(statusFor({ ifMatch: toHeader(head.eTag), range: 'bytes=0-1' })).resolves.toBe(206)
  })

  it('rejects with 412 when if-match does not match the etag', async () => {
    await expect(statusFor({ ifMatch: '"stale-etag"' })).rejects.toMatchObject({
      httpStatusCode: 412,
      code: 'PreconditionFailed',
      message: 'PreconditionFailed',
    })
  })

  it('rejects an empty if-match even when if-unmodified-since passes', async () => {
    await expect(
      statusFor({ ifMatch: '', ifUnmodifiedSince: lastModifiedHeader })
    ).rejects.toMatchObject({ httpStatusCode: 412, code: 'PreconditionFailed' })
  })

  it('returns 200 when the object was not modified after if-unmodified-since', async () => {
    await expect(statusFor({ ifUnmodifiedSince: lastModifiedHeader })).resolves.toBe(200)
  })

  it('rejects with 412 when the object changed after if-unmodified-since', async () => {
    await expect(
      statusFor({ ifUnmodifiedSince: new Date(mtime.getTime() - 1_000).toUTCString() })
    ).rejects.toMatchObject({ httpStatusCode: 412, code: 'PreconditionFailed' })
  })

  it('ignores an invalid if-unmodified-since date', async () => {
    await expect(statusFor({ ifUnmodifiedSince: 'not a date' })).resolves.toBe(200)
  })

  it('ignores if-unmodified-since when if-match matches', async () => {
    const head = await ctx.backend.headObject(bucket, key, version)
    await expect(
      statusFor({
        ifMatch: head.eTag,
        ifUnmodifiedSince: new Date(mtime.getTime() - 1_000).toUTCString(),
      })
    ).resolves.toBe(200)
  })
})

describe('FileBackend range reads', () => {
  const ctx = useFileBackend()
  const bucket = 'range-bucket'
  const key = 'range.txt'
  const version = 'v1'
  const payload = '0123456789'

  beforeEach(async () => {
    await ctx.upload(bucket, key, version, payload)
  })

  it('returns inclusive explicit byte ranges', async () => {
    const result = await ctx.backend.getObject(bucket, key, version, { range: 'bytes=2-5' })

    await expect(text(result.body as NodeJS.ReadableStream)).resolves.toBe('2345')
    expect(result.httpStatusCode).toBe(206)
    expect(result.metadata.contentRange).toBe('bytes 2-5/10')
    expect(result.metadata.contentLength).toBe(4)
    expect(result.metadata.size).toBe(4)
  })

  it('returns open-ended byte ranges', async () => {
    const result = await ctx.backend.getObject(bucket, key, version, { range: 'bytes=7-' })

    await expect(text(result.body as NodeJS.ReadableStream)).resolves.toBe('789')
    expect(result.metadata.contentRange).toBe('bytes 7-9/10')
    expect(result.metadata.contentLength).toBe(3)
    expect(result.metadata.size).toBe(3)
  })

  it('returns suffix byte ranges', async () => {
    const result = await ctx.backend.getObject(bucket, key, version, { range: 'bytes=-5' })

    await expect(text(result.body as NodeJS.ReadableStream)).resolves.toBe('56789')
    expect(result.metadata.contentRange).toBe('bytes 5-9/10')
    expect(result.metadata.contentLength).toBe(5)
    expect(result.metadata.size).toBe(5)
  })

  it('caps range ends at the object size', async () => {
    const result = await ctx.backend.getObject(bucket, key, version, { range: 'bytes=8-99' })

    await expect(text(result.body as NodeJS.ReadableStream)).resolves.toBe('89')
    expect(result.metadata.contentRange).toBe('bytes 8-9/10')
    expect(result.metadata.contentLength).toBe(2)
    expect(result.metadata.size).toBe(2)
  })

  it.each([
    'bytes=-0',
    'bytes=10-12',
    'bytes=8-4',
    'bytes=-',
    'bytes=a-b',
    'items=0-1',
  ])('rejects invalid byte range %s', async (range) => {
    await expect(ctx.backend.getObject(bucket, key, version, { range })).rejects.toMatchObject({
      code: ErrorCode.InvalidRange,
      error: 'invalid_range',
      httpStatusCode: 416,
      userStatusCode: 416,
      message: 'invalid range provided',
    })
  })
})

describe('FileBackend copy source preconditions', () => {
  const ctx = useFileBackend()
  let sourceETag: string
  let sourceLastModified: Date
  const sourceMtime = new Date('2026-01-01T00:00:00.700Z')

  const filePath = (key: string) => ctx.objectPath('bucket', key, 'v1')

  const copy = (conditions: Parameters<FileBackend['copyObject']>[6]) =>
    ctx.backend.copyObject(
      'bucket',
      'source.txt',
      'v1',
      'destination.txt',
      'v1',
      undefined,
      conditions
    )

  beforeEach(async () => {
    await ctx.upload('bucket', 'source.txt', 'v1', 'source-body')
    await fsp.utimes(filePath('source.txt'), sourceMtime, sourceMtime)
    const source = await ctx.backend.headObject('bucket', 'source.txt', 'v1')
    sourceETag = source.eTag
    sourceLastModified = source.lastModified as Date
  })

  async function expectPreconditionFailed(conditions: Parameters<typeof copy>[0]) {
    await expect(copy(conditions)).rejects.toMatchObject({
      httpStatusCode: 412,
      code: 'PreconditionFailed',
      message: 'PreconditionFailed',
    })
    await expect(fsp.stat(filePath('destination.txt'))).rejects.toMatchObject({ code: 'ENOENT' })
  }

  async function expectCopied(conditions: Parameters<typeof copy>[0]) {
    await expect(copy(conditions)).resolves.toMatchObject({ httpStatusCode: 200 })
    expect(await fsp.readFile(filePath('destination.txt'), 'utf8')).toBe('source-body')
  }

  it('rejects the copy when if-match does not match the source etag', async () => {
    await expectPreconditionFailed({ ifMatch: '"not-the-source-etag"' })
  })

  it('copies when if-match matches the source etag', async () => {
    await expectCopied({ ifMatch: sourceETag })
  })

  it('rejects the copy when if-none-match matches the source etag', async () => {
    await expectPreconditionFailed({ ifNoneMatch: sourceETag })
  })

  it('rejects the copy when the source was modified after if-unmodified-since', async () => {
    await expectPreconditionFailed({
      ifUnmodifiedSince: new Date(sourceLastModified.getTime() - 60_000),
    })
  })

  it('copies when the source was not modified after if-unmodified-since', async () => {
    await expectCopied({
      ifUnmodifiedSince: new Date(sourceLastModified.getTime() + 60_000),
    })
  })

  it('rejects the copy when the source was not modified after if-modified-since', async () => {
    await expectPreconditionFailed({
      ifModifiedSince: new Date(sourceLastModified.getTime() + 60_000),
    })
  })

  it('copies when the source was modified after if-modified-since', async () => {
    await expectCopied({
      ifModifiedSince: new Date(sourceLastModified.getTime() - 60_000),
    })
  })

  it('copies when if-match is true even if if-unmodified-since is false', async () => {
    await expectCopied({
      ifMatch: sourceETag,
      ifUnmodifiedSince: new Date(sourceLastModified.getTime() - 60_000),
    })
  })

  it('rejects the copy when if-none-match is false even if if-modified-since is true', async () => {
    await expectPreconditionFailed({
      ifNoneMatch: sourceETag,
      ifModifiedSince: new Date(sourceLastModified.getTime() - 60_000),
    })
  })

  it('rejects the copy when both if-match and if-none-match match the source', async () => {
    await expectPreconditionFailed({ ifMatch: sourceETag, ifNoneMatch: sourceETag })
  })

  it.each([
    { name: 'absent', conditions: undefined },
    { name: 'empty', conditions: {} },
    {
      name: 'all undefined',
      conditions: {
        ifMatch: undefined,
        ifNoneMatch: undefined,
        ifModifiedSince: undefined,
        ifUnmodifiedSince: undefined,
      },
    },
    {
      name: 'date-only',
      conditions: {
        ifModifiedSince: new Date('2025-01-01T00:00:00.000Z'),
        ifUnmodifiedSince: new Date('2027-01-01T00:00:00.000Z'),
      },
    },
  ])('does not hash the source when conditions are $name', async ({ conditions }) => {
    ctx.backend.etagAlgorithm = 'md5'
    const createReadStream = vi.spyOn(fs, 'createReadStream')

    await expectCopied(conditions)
    expect(createReadStream).toHaveBeenCalledWith(filePath('destination.txt'))
    expect(createReadStream.mock.calls.map(([file]) => file)).not.toContain(filePath('source.txt'))
  })

  it('ignores invalid precondition dates', async () => {
    await expectCopied({
      ifModifiedSince: new Date('invalid'),
      ifUnmodifiedSince: new Date('invalid'),
    })
  })

  it.each([
    { name: 'if-match', conditions: () => ({ ifMatch: '"not-the-source-etag"' }) },
    { name: 'if-none-match', conditions: () => ({ ifNoneMatch: sourceETag }) },
    {
      name: 'if-modified-since',
      conditions: () => ({ ifModifiedSince: new Date(sourceLastModified.getTime() + 60_000) }),
    },
    {
      name: 'if-unmodified-since',
      conditions: () => ({ ifUnmodifiedSince: new Date(sourceLastModified.getTime() - 60_000) }),
    },
  ])('preserves an existing destination when $name fails', async ({ conditions }) => {
    await ctx.upload(
      'bucket',
      'destination.txt',
      'v1',
      'original-destination-body',
      'application/json',
      'max-age=60'
    )
    const originalMetadata = await ctx.backend.headObject('bucket', 'destination.txt', 'v1')
    vi.mocked(xattr.setAttributeSync).mockClear()
    vi.mocked(xattr.removeAttributeSync).mockClear()

    await expect(copy(conditions())).rejects.toMatchObject({
      httpStatusCode: 412,
      message: 'PreconditionFailed',
    })

    expect(await fsp.readFile(filePath('destination.txt'), 'utf8')).toBe(
      'original-destination-body'
    )
    await expect(ctx.backend.headObject('bucket', 'destination.txt', 'v1')).resolves.toEqual(
      originalMetadata
    )
    expect(xattr.setAttributeSync).not.toHaveBeenCalled()
    expect(xattr.removeAttributeSync).not.toHaveBeenCalled()
  })

  it.each([
    ['a wildcard', () => '*'],
    ['a weak etag', () => `W/${sourceETag}`],
    ['an etag list', () => `"not-the-source-etag", ${sourceETag}`],
    ['an unquoted etag', () => sourceETag.replace(/"/g, '')],
  ])('copies when if-match is %s', async (_, ifMatch) => {
    await expectCopied({ ifMatch: ifMatch() })
  })

  it.each([
    'W/"not-the-source-etag"',
    '"not-the-source-etag", "another-etag"',
    'not-the-source-etag',
    '"not-the,*,source-etag"',
  ])('rejects the copy when if-match %s does not match the source', async (ifMatch) => {
    await expectPreconditionFailed({ ifMatch })
  })

  it.each([
    ['a wildcard', () => '*'],
    ['a weak etag', () => `W/${sourceETag}`],
    ['an etag list', () => `"not-the-source-etag", ${sourceETag}`],
    ['an unquoted etag', () => sourceETag.replace(/"/g, '')],
  ])('rejects the copy when if-none-match is %s', async (_, ifNoneMatch) => {
    await expectPreconditionFailed({ ifNoneMatch: ifNoneMatch() })
  })

  it.each([
    'W/"not-the-source-etag"',
    '"not-the-source-etag", "another-etag"',
    'not-the-source-etag',
    '"not-the,*,source-etag"',
  ])('copies when if-none-match %s does not match the source', async (ifNoneMatch) => {
    await expectCopied({ ifNoneMatch })
  })

  it('copies when if-none-match does not match even if the source was not modified after if-modified-since', async () => {
    await expectCopied({
      ifNoneMatch: '"not-the-source-etag"',
      ifModifiedSince: new Date(sourceLastModified.getTime() + 60_000),
    })
  })

  it('rejects the copy when if-modified-since equals the last-modified second', async () => {
    await expectPreconditionFailed({ ifModifiedSince: new Date('2026-01-01T00:00:00.000Z') })
  })

  it('copies when if-unmodified-since equals the last-modified second', async () => {
    await expectCopied({ ifUnmodifiedSince: new Date('2026-01-01T00:00:00.000Z') })
  })

  it('rejects the copy when if-match is empty', async () => {
    await expectPreconditionFailed({ ifMatch: '' })
  })

  it('copies when if-none-match is empty even if the source was not modified after if-modified-since', async () => {
    await expectCopied({
      ifNoneMatch: '',
      ifModifiedSince: new Date(sourceLastModified.getTime() + 60_000),
    })
  })
})
