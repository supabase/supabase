import { randomUUID } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ErrorCode } from '@internal/errors'
import fastify from 'fastify'
import FormData from 'form-data'
import { getConfig, mergeConfig } from '../config'
import { setErrorHandler } from '../http/error-handler'
import createObject from '../http/routes/object/createObject'
import { onCreate } from '../http/routes/tus/lifecycle'
import { authSchema, errorSchema } from '../http/schemas'
import { FileBackend } from './backend/file'
import type { Database } from './database'
import { ObjectCreatedPostEvent } from './events'
import { TenantLocation } from './locator'
import { S3ProtocolHandler } from './protocols/s3/s3-handler'
import { UploadId } from './protocols/tus/upload-id'
import { AssetRenderer } from './renderer/asset'
import { Storage } from './storage'

type SavedObject = Parameters<Database['upsertObject']>[0] & { id: string }

async function createFixture(allowedMimeTypes: string[] | null) {
  const config = getConfig()
  const directory = await mkdtemp(join(tmpdir(), 'storage-mime-test-'))
  mergeConfig({ storageFilePath: directory })
  const backend = new FileBackend()
  const location = new TenantLocation(config.storageS3Bucket)
  let saved: SavedObject | undefined
  const db = {
    tenantId: 'mime-tenant',
    reqId: 'mime-request',
    tenant: () => ({ ref: 'mime-tenant', host: 'localhost' }),
    asSuperUser: (): Database => database,
    findBucketById: async () => ({
      id: 'mime-bucket',
      file_size_limit: 1024,
      allowed_mime_types: allowedMimeTypes,
    }),
    testPermission: vi.fn().mockResolvedValue(undefined),
    connection: { setAbortSignal: vi.fn() },
    withTransaction: async (fn: (transaction: Database) => Promise<unknown>) => fn(database),
    waitObjectLock: vi.fn().mockResolvedValue(true),
    findObject: vi.fn().mockResolvedValue(undefined),
    upsertObject: async (data: Parameters<Database['upsertObject']>[0]) => {
      saved = { id: randomUUID(), ...data }
      return saved
    },
    createMultipartUpload: vi.fn().mockResolvedValue(undefined),
  }
  const database = db as unknown as Database
  vi.spyOn(ObjectCreatedPostEvent, 'sendWebhook').mockResolvedValue(undefined)
  const storage = new Storage(backend, database, location)
  const app = fastify()
  app.addSchema(authSchema)
  app.addSchema(errorSchema)
  setErrorHandler(app)
  app.addContentTypeParser('*', (_request, _payload, done) => done(null))
  app.addHook('onRequest', async (request) => {
    request.storage = storage
    request.tenantId = 'mime-tenant'
    request.signals = { body: new AbortController() } as typeof request.signals
  })
  await app.register(createObject, { prefix: '/object' })
  app.get('/download', (request, reply) => {
    if (!saved) {
      throw new Error('No uploaded object')
    }
    return new AssetRenderer(backend).render(request, reply, {
      bucket: config.storageS3Bucket,
      key: location.getKeyLocation({
        tenantId: 'mime-tenant',
        bucketId: 'mime-bucket',
        objectName: saved.name,
      }),
      version: saved.version,
    })
  })

  return {
    app,
    backend,
    db,
    storage,
    get saved() {
      return saved
    },
    upload(kind: 'binary' | 'multipart', contentType: string, bytes: Buffer) {
      const form = new FormData()
      form.append('contentType', contentType)
      form.append('file', bytes, { filename: 'sample.txt', contentType: 'text/plain' })
      return app.inject({
        method: 'POST',
        url: '/object/mime-bucket/sample.txt',
        headers: {
          authorization: 'Bearer test',
          ...(kind === 'binary' ? { 'content-type': contentType } : form.getHeaders()),
        },
        payload: kind === 'binary' ? bytes : form,
      })
    },
    async close() {
      await app.close()
      await rm(directory, { recursive: true, force: true })
      mergeConfig(config)
      vi.restoreAllMocks()
    },
  }
}

describe.each(['binary', 'multipart'] as const)('%s MIME upload handling', (kind) => {
  it('preserves original parameters and non-UTF-8 bytes through upload and download', async () => {
    const fixture = await createFixture(['TEXT/PLAIN;charset=UTF-8'])
    const contentType = 'Text/Plain; charset=iso-8859-1; note="a,b;c"'
    const bytes = Buffer.from([0x63, 0x61, 0x66, 0xe9])
    try {
      const uploaded = await fixture.upload(kind, contentType, bytes)
      expect(uploaded.statusCode, uploaded.body).toBe(200)
      expect(fixture.saved?.metadata?.mimetype).toBe(contentType)
      const downloaded = await fixture.app.inject({ method: 'GET', url: '/download' })
      expect(downloaded.statusCode, downloaded.body).toBe(200)
      expect(downloaded.headers['content-type']).toBe(contentType)
      expect(downloaded.rawPayload).toEqual(bytes)
    } finally {
      await fixture.close()
    }
  })

  it('keeps HTML downloads as plain text after case-insensitive allow-list matching', async () => {
    const fixture = await createFixture(['text/html'])
    const contentType = 'Text/HTML; charset=UTF-8'
    try {
      const uploaded = await fixture.upload(kind, contentType, Buffer.from('<p>hello</p>'))
      expect(uploaded.statusCode, uploaded.body).toBe(200)
      expect(fixture.saved?.metadata?.mimetype).toBe(contentType)
      const downloaded = await fixture.app.inject({ method: 'GET', url: '/download' })
      expect(downloaded.statusCode, downloaded.body).toBe(200)
      expect(downloaded.headers['content-type']).toBe('text/plain')
      expect(downloaded.body).toBe('<p>hello</p>')
    } finally {
      await fixture.close()
    }
  })

  it.each([
    'image/png;foo=x, application/pdf',
    'image/png/extra',
  ])('rejects %j before uploading bytes', async (contentType) => {
    const fixture = await createFixture(['image/png'])
    const upload = vi.spyOn(fixture.backend, 'uploadObject')
    try {
      const response = await fixture.upload(kind, contentType, Buffer.from('example'))
      expect(response.statusCode, response.body).toBe(400)
      expect(response.json().code).toBe(ErrorCode.InvalidMimeType)
      expect(upload).not.toHaveBeenCalled()
      expect(fixture.saved).toBeUndefined()
    } finally {
      await fixture.close()
    }
  })
})

describe('S3 multipart MIME handling', () => {
  it('preserves valid parameters in backend and upload metadata', async () => {
    const fixture = await createFixture(['text/*'])
    const contentType = 'Text/Plain; charset=iso-8859-1; note="a,b;c"'
    try {
      const initiate = vi
        .spyOn(fixture.backend, 'createMultiPartUpload')
        .mockResolvedValue('upload-id')
      const handler = new S3ProtocolHandler(fixture.storage, 'mime-tenant')
      await handler.createMultiPartUpload({
        Bucket: 'mime-bucket',
        Key: 'sample.txt',
        ContentType: contentType,
      })
      expect(initiate.mock.calls[0][3]).toBe(contentType)
      expect(fixture.db.createMultipartUpload.mock.calls[0][7]).toEqual({ mimetype: contentType })
    } finally {
      await fixture.close()
    }
  })

  it('rejects a combined value before initiating the upload', async () => {
    const fixture = await createFixture(['image/png'])
    try {
      const initiate = vi.spyOn(fixture.backend, 'createMultiPartUpload')
      const handler = new S3ProtocolHandler(fixture.storage, 'mime-tenant')
      await expect(
        handler.createMultiPartUpload({
          Bucket: 'mime-bucket',
          Key: 'sample.png',
          ContentType: 'image/png;foo=x, application/pdf',
        })
      ).rejects.toMatchObject({ code: ErrorCode.InvalidMimeType })
      expect(initiate).not.toHaveBeenCalled()
    } finally {
      await fixture.close()
    }
  })
})

describe('TUS MIME handling', () => {
  it.each([
    {
      contentType: 'Text/Plain; charset=iso-8859-1; note="a,b;c"',
      allowedMimeTypes: ['text/*'],
      valid: true,
    },
    {
      contentType: 'text/plain;foo=x, application/pdf',
      allowedMimeTypes: ['text/*'],
      valid: false,
    },
    { contentType: 'text/plain', allowedMimeTypes: [], valid: true },
    { contentType: 'text/plain', allowedMimeTypes: null, valid: true },
    { contentType: 'text/plain', allowedMimeTypes: ['image/png'], valid: false },
  ])('validates $contentType against $allowedMimeTypes', async ({
    contentType,
    allowedMimeTypes,
    valid,
  }) => {
    const fixture = await createFixture(allowedMimeTypes)
    try {
      const result = onCreate(
        { runtime: { node: { req: { upload: { storage: fixture.storage } } } } } as never,
        {
          id: new UploadId({
            tenant: 'mime-tenant',
            bucket: 'mime-bucket',
            objectName: 'sample.txt',
            version: randomUUID(),
          }).toString(),
          metadata: { contentType },
        } as never
      )
      if (valid) {
        await expect(result).resolves.toMatchObject({ metadata: { contentType } })
      } else {
        await expect(result).rejects.toMatchObject({ code: ErrorCode.InvalidMimeType })
      }
    } finally {
      await fixture.close()
    }
  })
})
