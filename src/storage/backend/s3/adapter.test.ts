import http from 'node:http'
import type { AddressInfo } from 'node:net'
import {
  AbortMultipartUploadCommand,
  CopyObjectCommand,
  DeleteObjectsCommand,
  DeleteObjectsCommandOutput,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  UploadPartCopyCommand,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { ErrorCode, isStorageError, StorageBackendError } from '@internal/errors'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { HttpRequest } from '@smithy/protocol-http'
import { MAX_KEYS_PER_S3_DELETE } from '@storage/limits'
import Fastify from 'fastify'
import { Readable } from 'stream'
import { type Mock, vi } from 'vitest'
import { getConfig } from '../../../config'
import { setErrorHandler } from '../../../http/error-handler'
import { type HeadObjectOptions, isMissingBackendObject, withOptionalVersion } from '../adapter'
import { MAX_PUT_OBJECT_SIZE, S3Backend } from './adapter'

const DEFAULT_S3_UPLOAD_PART_SIZE = 16 * 1024 * 1024

vi.mock('@aws-sdk/client-s3', async () => {
  const originalModule =
    await vi.importActual<typeof import('@aws-sdk/client-s3')>('@aws-sdk/client-s3')
  return {
    ...originalModule,
    S3Client: vi.fn(function () {
      return {
        middlewareStack: {
          remove: vi.fn(),
        },
        send: vi.fn(),
      }
    }),
  }
})

vi.mock('@aws-sdk/lib-storage', async () => {
  const originalModule =
    await vi.importActual<typeof import('@aws-sdk/lib-storage')>('@aws-sdk/lib-storage')
  return {
    ...originalModule,
    Upload: vi.fn(function () {}),
  }
})

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('http://signed.example.com/test-bucket/test-key'),
}))

type UploadOptionsShape = {
  partSize?: number
  queueSize?: number
}

type MockUploadDoneResult = {
  ETag: string
  $metadata: {
    httpStatusCode: number
  }
}

type MockUploadInstance = {
  options: UploadOptionsShape
  abort: Mock
  done: Mock<() => Promise<MockUploadDoneResult>>
  on: Mock
  off: Mock
  emit: (event: string, payload: unknown) => void
}

describe('S3Backend', () => {
  let mockSend: Mock
  let mockUploadDone: Mock<(instance: MockUploadInstance) => Promise<MockUploadDoneResult>>
  let uploadInstances: MockUploadInstance[]

  beforeEach(() => {
    vi.clearAllMocks()
    mockSend = vi.fn()
    mockUploadDone = vi.fn().mockResolvedValue({
      ETag: '"multipart-etag"',
      $metadata: {
        httpStatusCode: 200,
      },
    })
    uploadInstances = []

    ;(S3Client as unknown as Mock).mockImplementation(function () {
      return {
        middlewareStack: {
          remove: vi.fn(),
        },
        send: mockSend,
      }
    })

    ;(Upload as unknown as Mock).mockImplementation(function (options: UploadOptionsShape) {
      const handlers = new Map<string, Set<(payload: unknown) => void>>()
      const instance = {} as MockUploadInstance

      instance.options = options
      instance.abort = vi.fn()
      instance.done = vi.fn(() => mockUploadDone(instance))
      instance.on = vi.fn((event: string, handler: (payload: unknown) => void) => {
        const eventHandlers = handlers.get(event) ?? new Set()
        eventHandlers.add(handler)
        handlers.set(event, eventHandlers)
        return instance
      })
      instance.off = vi.fn((event: string, handler: (payload: unknown) => void) => {
        handlers.get(event)?.delete(handler)
        return instance
      })
      instance.emit = (event: string, payload: unknown) => {
        handlers.get(event)?.forEach((handler) => handler(payload))
      }

      uploadInstances.push(instance)
      return instance
    })
  })

  function createBackend() {
    return new S3Backend({
      region: 'us-east-1',
      endpoint: 'http://localhost:9000',
    })
  }

  describe('client config', () => {
    test('removes the no-op logger middleware from every AWS client', () => {
      new S3Backend({
        region: 'us-east-1',
        endpoint: 'http://127.0.0.1:9000',
        privateAssetEndpoint: 'http://rustfs:9000',
      })

      const s3ClientMock = S3Client as unknown as Mock
      expect(s3ClientMock).toHaveBeenCalledTimes(2)

      for (const result of s3ClientMock.mock.results) {
        expect(result.value.middlewareStack.remove).toHaveBeenCalledWith('loggerMiddleware')
      }
    })

    test('passes split checksum settings independently to the AWS client', async () => {
      const originalRequestChecksum = process.env.STORAGE_S3_REQUEST_CHECKSUM_CALCULATION
      const originalResponseChecksum = process.env.STORAGE_S3_RESPONSE_CHECKSUM_VALIDATION

      try {
        delete process.env.STORAGE_S3_REQUEST_CHECKSUM_CALCULATION
        process.env.STORAGE_S3_RESPONSE_CHECKSUM_VALIDATION = 'WHEN_REQUIRED'

        vi.resetModules()
        const { S3Backend: ReloadedS3Backend } = await import('./adapter')
        const s3ClientMock = S3Client as unknown as Mock

        s3ClientMock.mockClear()

        new ReloadedS3Backend({
          region: 'us-east-1',
          endpoint: 'http://localhost:9000',
        })

        expect(s3ClientMock.mock.calls[0][0]).toMatchObject({
          region: 'us-east-1',
          endpoint: 'http://localhost:9000',
          responseChecksumValidation: 'WHEN_REQUIRED',
        })
        expect(s3ClientMock.mock.calls[0][0].requestChecksumCalculation).toBeUndefined()
      } finally {
        if (originalRequestChecksum === undefined) {
          delete process.env.STORAGE_S3_REQUEST_CHECKSUM_CALCULATION
        } else {
          process.env.STORAGE_S3_REQUEST_CHECKSUM_CALCULATION = originalRequestChecksum
        }

        if (originalResponseChecksum === undefined) {
          delete process.env.STORAGE_S3_RESPONSE_CHECKSUM_VALIDATION
        } else {
          process.env.STORAGE_S3_RESPONSE_CHECKSUM_VALIDATION = originalResponseChecksum
        }

        vi.resetModules()
      }
    })

    test('maps the configured timeout to Smithy socketTimeout and fails stalled requests', async () => {
      const server = http.createServer((_req, res) => {
        setTimeout(() => {
          res.writeHead(200, { 'content-type': 'text/plain' })
          res.end('ok')
        }, 200)
      })
      await new Promise<void>((resolve) => {
        server.listen(0, '127.0.0.1', resolve)
      })
      const port = (server.address() as AddressInfo).port

      const backend = new S3Backend({
        region: 'us-east-1',
        endpoint: `http://127.0.0.1:${port}`,
        socketTimeout: 40,
      })

      try {
        const handler = (S3Client as unknown as Mock).mock.calls[0][0]
          .requestHandler as NodeHttpHandler
        expect(handler).toBeInstanceOf(NodeHttpHandler)

        await expect(
          handler.handle(
            new HttpRequest({
              protocol: 'http:',
              hostname: '127.0.0.1',
              port,
              method: 'GET',
              path: '/',
              headers: { host: `127.0.0.1:${port}` },
            })
          )
        ).rejects.toMatchObject({ name: 'TimeoutError' })

        expect(handler.httpHandlerConfigs()).toMatchObject({
          connectionTimeout: 5000,
          socketTimeout: 40,
        })
        expect(handler.httpHandlerConfigs().requestTimeout).toBeUndefined()
      } finally {
        backend.close()
        backend.agent.httpAgent.destroy()
        backend.agent.httpsAgent.destroy()
        await new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error)
              return
            }
            resolve()
          })
        })
      }
    })
  })

  describe('getObject', () => {
    test('forwards conditional range headers and cancellation to S3', async () => {
      mockSend.mockResolvedValue({ $metadata: { httpStatusCode: 206 } })
      const backend = createBackend()
      const signal = new AbortController().signal
      const date = new Date('2026-01-01T00:00:00Z')

      await backend.getObject(
        'test-bucket',
        'test-key',
        'version',
        {
          ifMatch: '"expected-etag"',
          ifUnmodifiedSince: date.toISOString(),
          range: 'bytes=0-1',
        },
        signal
      )

      expect(mockSend).toHaveBeenCalledWith(expect.any(GetObjectCommand), { abortSignal: signal })
      expect(mockSend.mock.calls[0][0].input).toMatchObject({
        Bucket: 'test-bucket',
        Key: withOptionalVersion('test-key', 'version'),
        IfMatch: '"expected-etag"',
        IfUnmodifiedSince: date,
        Range: 'bytes=0-1',
      })
    })

    test('should return correct default MIME type when S3 returns no ContentType', async () => {
      mockSend.mockResolvedValue({
        Body: Readable.from(['test content']),
        CacheControl: 'max-age=3600',
        ETag: '"abc123"',
        LastModified: new Date('2024-01-01'),
        ContentLength: 12,
        $metadata: {
          httpStatusCode: 200,
        },
      })

      const backend = createBackend()

      const result = await backend.getObject('test-bucket', 'test-key', undefined)

      expect(result.metadata.mimetype).toBe('application/octet-stream')
      expect(result.metadata.cacheControl).toBe('max-age=3600')
      expect(result.metadata.eTag).toBe('"abc123"')
      expect(result.httpStatusCode).toBe(200)
    })

    test('should use ContentType from S3 when provided', async () => {
      mockSend.mockResolvedValue({
        Body: Readable.from(['test content']),
        ContentType: 'image/png',
        CacheControl: 'no-cache',
        ETag: '"def456"',
        LastModified: new Date('2024-01-01'),
        ContentLength: 12,
        $metadata: {
          httpStatusCode: 200,
        },
      })

      const backend = createBackend()

      const result = await backend.getObject('test-bucket', 'test-key', undefined)

      expect(result.metadata.mimetype).toBe('image/png')
    })
  })

  describe('list', () => {
    test('filters listed keys by cutoff date and strips the requested prefix', async () => {
      mockSend.mockResolvedValue({
        Contents: [
          {
            Key: 'tenant/bucket/old.txt',
            LastModified: new Date('2024-01-01T00:00:00.000Z'),
            Size: 12,
          },
          {
            Key: 'tenant/bucket/new.txt',
            LastModified: new Date('2024-01-03T00:00:00.000Z'),
            Size: 34,
          },
          {
            Key: 'tenant/bucket/no-date.txt',
            Size: 56,
          },
          {
            LastModified: new Date('2024-01-01T00:00:00.000Z'),
            Size: 78,
          },
        ],
        NextContinuationToken: 'next-page',
      })

      const backend = createBackend()

      await expect(
        backend.list('test-bucket', {
          prefix: 'tenant/bucket',
          beforeDate: new Date('2024-01-02T00:00:00.000Z'),
        })
      ).resolves.toEqual({
        keys: [{ name: 'old.txt', size: 12 }],
        nextToken: 'next-page',
      })

      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend.mock.calls[0][0]).toBeInstanceOf(ListObjectsV2Command)
      expect(mockSend.mock.calls[0][0].input).toMatchObject({
        Bucket: 'test-bucket',
        Prefix: 'tenant/bucket',
      })
    })
  })

  describe('deleteObjects', () => {
    test('chunks DeleteObjectsCommand payloads to the S3 key limit', async () => {
      mockSend.mockImplementation((command: DeleteObjectsCommand) => {
        return Promise.resolve({
          $metadata: { httpStatusCode: 200 },
          Deleted: command.input.Delete?.Objects,
        })
      })

      const backend = createBackend()
      const keys = [...Array(MAX_KEYS_PER_S3_DELETE + 1).keys()].map((i) => `object-${i}`)

      await backend.deleteObjects('test-bucket', keys)

      expect(mockSend).toHaveBeenCalledTimes(2)
      expect(mockSend.mock.calls[0][0]).toBeInstanceOf(DeleteObjectsCommand)
      expect(mockSend.mock.calls[0][0].input).toMatchObject({
        Bucket: 'test-bucket',
        Delete: {
          Objects: keys.slice(0, MAX_KEYS_PER_S3_DELETE).map((Key) => ({ Key })),
          Quiet: false,
        },
      })
      expect(mockSend.mock.calls[1][0]).toBeInstanceOf(DeleteObjectsCommand)
      expect(mockSend.mock.calls[1][0].input).toMatchObject({
        Bucket: 'test-bucket',
        Delete: {
          Objects: [{ Key: `object-${MAX_KEYS_PER_S3_DELETE}` }],
        },
      })
    })

    test('sends DeleteObjectsCommand chunks concurrently', async () => {
      const firstDelete = Promise.withResolvers<DeleteObjectsCommandOutput>()
      const secondDelete = Promise.withResolvers<DeleteObjectsCommandOutput>()
      mockSend.mockImplementationOnce(() => firstDelete.promise)
      mockSend.mockImplementationOnce(() => secondDelete.promise)

      const backend = createBackend()
      const keys = [...Array(MAX_KEYS_PER_S3_DELETE + 1).keys()].map((i) => `object-${i}`)

      const deletePromise = backend.deleteObjects('test-bucket', keys)

      expect(mockSend).toHaveBeenCalledTimes(2)

      firstDelete.resolve({
        $metadata: {
          httpStatusCode: 200,
        },
        Deleted: keys.slice(0, MAX_KEYS_PER_S3_DELETE).map((Key) => ({ Key })),
      })
      secondDelete.resolve({
        $metadata: {
          httpStatusCode: 200,
        },
        Deleted: [{ Key: keys[MAX_KEYS_PER_S3_DELETE] }],
      })

      await expect(deletePromise).resolves.toBeUndefined()
    })

    test.each([
      'AccessDenied',
      'InternalError',
    ])('preserves request-level success when S3 returns a per-key %s', async (code) => {
      mockSend.mockResolvedValue({
        $metadata: { httpStatusCode: 200 },
        Deleted: [{ Key: 'deleted' }],
        Errors: [{ Key: 'failed', Code: code, Message: 'deletion failed' }],
      })

      await expect(
        createBackend().deleteObjects('test-bucket', ['deleted', 'failed'])
      ).resolves.toBeUndefined()
    })

    test('preserves request-level success when S3 omits a key acknowledgment', async () => {
      mockSend.mockResolvedValue({ $metadata: { httpStatusCode: 200 } })

      await expect(
        createBackend().deleteObjects('test-bucket', ['omitted'])
      ).resolves.toBeUndefined()
    })

    test('rejects a failed chunk after every chunk has settled', async () => {
      const completedChunk = Promise.withResolvers<DeleteObjectsCommandOutput>()
      mockSend.mockRejectedValueOnce(new Error('connection reset'))
      mockSend.mockReturnValueOnce(completedChunk.promise)
      const keys = Array.from({ length: MAX_KEYS_PER_S3_DELETE + 1 }, (_, index) => `key-${index}`)

      const deleting = createBackend().deleteObjects('test-bucket', keys)
      const rejected = expect(deleting).rejects.toThrow('connection reset')
      const completed = vi.fn()
      const completion = deleting.then(completed, completed)
      expect(mockSend).toHaveBeenCalledTimes(2)
      await new Promise<void>((resolve) => setImmediate(resolve))
      expect(completed).not.toHaveBeenCalled()
      completedChunk.resolve({
        $metadata: { httpStatusCode: 200 },
        Deleted: [{ Key: keys[MAX_KEYS_PER_S3_DELETE] }],
      })
      await rejected
      await completion
    })

    test('reports a rejected request even when an earlier chunk has per-key errors', async () => {
      const keys = Array.from({ length: MAX_KEYS_PER_S3_DELETE + 1 }, (_, index) => `key-${index}`)
      const upstreamError = new Error('connection reset')
      mockSend.mockResolvedValueOnce({
        $metadata: { httpStatusCode: 200 },
        Errors: [{ Key: keys[0], Code: 'AccessDenied', Message: 'deletion denied' }],
      })
      mockSend.mockRejectedValueOnce(upstreamError)

      await expect(createBackend().deleteObjects('test-bucket', keys)).rejects.toMatchObject({
        code: ErrorCode.InternalError,
        httpStatusCode: 500,
        error: 'Error',
        message: 'connection reset',
        originalError: upstreamError,
      })
    })

    test('preserves the S3 error code and HTTP status for rejected requests', async () => {
      const upstreamError = Object.assign(new Error('upstream unavailable'), {
        name: 'ServiceUnavailable',
        $metadata: { httpStatusCode: 503 },
      })
      mockSend.mockRejectedValue(upstreamError)

      await expect(createBackend().deleteObjects('test-bucket', ['key'])).rejects.toMatchObject({
        code: ErrorCode.S3Error,
        httpStatusCode: 503,
        message: 'ServiceUnavailable',
        error: 'upstream unavailable',
        originalError: upstreamError,
      })
      await expect(createBackend().deleteObjectsDetailed('test-bucket', ['key'])).resolves.toEqual([
        {
          key: 'key',
          outcome: 'UNKNOWN',
          error: { code: ErrorCode.S3Error, message: 'ServiceUnavailable', httpStatusCode: 503 },
        },
      ])
    })

    test.each([
      {
        upstreamError: Object.assign(new Error('upstream unavailable'), {
          name: 'ServiceUnavailable',
          $metadata: { httpStatusCode: 503 },
        }),
        body: {
          code: ErrorCode.S3Error,
          error: 'upstream unavailable',
          message: 'ServiceUnavailable',
        },
      },
      {
        upstreamError: new Error('connection reset'),
        body: {
          code: ErrorCode.InternalError,
          error: 'Error',
          message: 'connection reset',
        },
      },
    ])('preserves the REST error fields for $body.code', async ({ upstreamError, body }) => {
      mockSend.mockRejectedValue(upstreamError)
      const backend = createBackend()
      const app = Fastify()
      setErrorHandler(app)
      app.delete('/objects', async () => {
        await backend.deleteObjects('test-bucket', ['key'])
      })

      try {
        const response = await app.inject({ method: 'DELETE', url: '/objects' })
        expect(response.json()).toMatchObject(body)
      } finally {
        await app.close()
      }
    })

    test('does not issue requests for an empty key list', async () => {
      await expect(createBackend().deleteObjects('test-bucket', [])).resolves.toBeUndefined()
      expect(mockSend).not.toHaveBeenCalled()
    })
  })

  describe('deleteObjectsDetailed', () => {
    test('returns ordered results for mixed, duplicate, and unacknowledged keys', async () => {
      mockSend.mockResolvedValue({
        $metadata: { httpStatusCode: 200 },
        Deleted: [{ Key: 'deleted' }, { Key: 'conflicted' }, { Key: 'unrequested' }, {}],
        Errors: [{ Key: 'conflicted', Code: 'AccessDenied', Message: 'denied' }, {}],
      })

      await expect(
        createBackend().deleteObjectsDetailed('test-bucket', [
          'conflicted',
          'deleted',
          'omitted',
          'deleted',
        ])
      ).resolves.toEqual([
        {
          key: 'conflicted',
          outcome: 'UNKNOWN',
          error: {
            message: 'S3 delete response contained conflicting results for this requested key',
          },
        },
        { key: 'deleted', outcome: 'DELETED' },
        {
          key: 'omitted',
          outcome: 'UNKNOWN',
          error: { message: 'S3 delete response did not contain this requested key' },
        },
        { key: 'deleted', outcome: 'DELETED' },
      ])
    })

    test('normalizes repeated success acknowledgments for a single requested key', async () => {
      mockSend.mockResolvedValue({
        $metadata: { httpStatusCode: 200 },
        Deleted: [{ Key: 'deleted' }, { Key: 'deleted' }],
      })

      await expect(
        createBackend().deleteObjectsDetailed('test-bucket', ['deleted'])
      ).resolves.toEqual([{ key: 'deleted', outcome: 'DELETED' }])
    })

    test('preserves per-key results across successful and rejected chunks', async () => {
      const firstChunk = Promise.withResolvers<DeleteObjectsCommandOutput>()
      const lastChunk = Promise.withResolvers<DeleteObjectsCommandOutput>()
      mockSend.mockReturnValueOnce(firstChunk.promise)
      mockSend.mockRejectedValueOnce(new Error('connection reset'))
      mockSend.mockReturnValueOnce(lastChunk.promise)
      const keys = Array.from(
        { length: MAX_KEYS_PER_S3_DELETE * 2 + 1 },
        (_, index) => `key-${index}`
      )

      const deleting = createBackend().deleteObjectsDetailed('test-bucket', keys)
      expect(mockSend).toHaveBeenCalledTimes(3)
      lastChunk.resolve({
        $metadata: { httpStatusCode: 200 },
        Errors: [{ Key: keys.at(-1), Code: 'AccessDenied', Message: 'denied' }],
      })
      firstChunk.resolve({
        $metadata: { httpStatusCode: 200 },
        Deleted: keys.slice(0, MAX_KEYS_PER_S3_DELETE).map((Key) => ({ Key })),
      })

      const results = await deleting
      expect(results).toHaveLength(keys.length)
      expect(results.map(({ key }) => key)).toEqual(keys)
      expect(results.slice(0, MAX_KEYS_PER_S3_DELETE)).toEqual(
        keys.slice(0, MAX_KEYS_PER_S3_DELETE).map((key) => ({ key, outcome: 'DELETED' }))
      )
      expect(results.slice(MAX_KEYS_PER_S3_DELETE, -1)).toEqual(
        keys.slice(MAX_KEYS_PER_S3_DELETE, -1).map((key) => ({
          key,
          outcome: 'UNKNOWN',
          error: {
            code: ErrorCode.InternalError,
            message: 'connection reset',
            httpStatusCode: 500,
          },
        }))
      )
      expect(results.at(-1)).toEqual({
        key: keys.at(-1),
        outcome: 'FAILED',
        error: { code: 'AccessDenied', message: 'denied' },
      })
    })

    test('returns an empty result without issuing a request', async () => {
      await expect(createBackend().deleteObjectsDetailed('test-bucket', [])).resolves.toEqual([])
      expect(mockSend).not.toHaveBeenCalled()
    })
  })

  describe('headObject absence confirmation', () => {
    function s3Error(name: string, status: number) {
      return Object.assign(new Error(name), { name, $metadata: { httpStatusCode: status } })
    }

    async function failure(options?: HeadObjectOptions) {
      return createBackend()
        .headObject('test-bucket', 'legacy', null, options)
        .then(
          () => {
            throw new Error('Expected the failed HEAD to remain an error')
          },
          (error: unknown) => {
            if (!(error instanceof StorageBackendError)) throw error
            return error
          }
        )
    }

    test.each([
      ['not requested', undefined],
      ['disabled', { confirmMissing: false }],
    ] as const)('skips missing-object confirmation when %s', async (_label, options) => {
      const headError = s3Error('NotFound', 404)
      mockSend.mockRejectedValueOnce(headError)

      const error = await failure(options)

      expect(error.getOriginalError()).toBe(headError)
      expect(error.httpStatusCode).toBe(404)
      expect(isMissingBackendObject(error)).toBe(false)
      expect(mockSend).toHaveBeenCalledExactlyOnceWith(expect.any(HeadObjectCommand))
    })

    test.each([
      ['NoSuchKey', 404, true],
      ['NoSuchBucket', 404, false],
    ] as const)('requires an explicit missing key from GET: %s', async (name, status, absent) => {
      const confirmationError = s3Error(name, status)
      mockSend.mockRejectedValueOnce(s3Error('NotFound', 404))
      mockSend.mockRejectedValueOnce(confirmationError)

      const error = await failure({ confirmMissing: true })

      expect(isMissingBackendObject(error)).toBe(absent)
      expect(error).toMatchObject({ httpStatusCode: status })
      expect(error.getOriginalError()).toBe(confirmationError)
      expect(mockSend).toHaveBeenCalledTimes(2)
      expect(mockSend.mock.calls[1][0]).toBeInstanceOf(GetObjectCommand)
      expect(mockSend.mock.calls[1][0].input).toEqual({
        Bucket: 'test-bucket',
        Key: 'legacy',
        Range: 'bytes=0-0',
      })
      expect(mockSend.mock.calls[1][1]).toEqual({ abortSignal: expect.any(AbortSignal) })
    })

    test.each([
      ['NotFound', 404],
      ['InvalidRange', 416],
      ['AccessDenied', 403],
      ['SlowDown', 503],
      ['NoSuchKey', 503],
      ['NoSuchBucket', 503],
    ] as const)('preserves the original HEAD error when GET returns %s', async (name, status) => {
      const headError = s3Error('NotFound', 404)
      mockSend.mockRejectedValueOnce(headError)
      mockSend.mockRejectedValueOnce(s3Error(name, status))

      const error = await failure({ confirmMissing: true })

      expect(error.getOriginalError()).toBe(headError)
      expect(error.httpStatusCode).toBe(404)
      expect(isMissingBackendObject(error)).toBe(false)
      expect(mockSend).toHaveBeenCalledTimes(2)
    })

    test.each([
      'NoSuchKey',
      'NoSuchBucket',
    ] as const)('keeps explicit HEAD %s errors without another request', async (name) => {
      mockSend.mockRejectedValueOnce(s3Error(name, 404))

      const error = await failure({ confirmMissing: true })

      expect(isMissingBackendObject(error)).toBe(name === 'NoSuchKey')
      expect(mockSend).toHaveBeenCalledTimes(1)
    })

    test.each([
      Buffer.from('present'),
      Buffer.alloc(0),
    ])('preserves an object that appears after HEAD and disposes its GET body', async (bytes) => {
      const body = Readable.from(bytes)
      mockSend.mockRejectedValueOnce(s3Error('NotFound', 404))
      mockSend.mockResolvedValueOnce({
        $metadata: { httpStatusCode: bytes.length === 0 ? 200 : 206 },
        Body: body,
      })

      const error = await failure({ confirmMissing: true })

      expect(isMissingBackendObject(error)).toBe(false)
      expect(body.destroyed).toBe(true)
    })

    test('cancels a web stream if a compatible client returns one', async () => {
      const cancel = vi.fn()
      const body = new ReadableStream({ cancel })
      mockSend.mockRejectedValueOnce(s3Error('NotFound', 404))
      mockSend.mockResolvedValueOnce({ $metadata: { httpStatusCode: 206 }, Body: body })

      expect(isMissingBackendObject(await failure({ confirmMissing: true }))).toBe(false)
      expect(cancel).toHaveBeenCalledOnce()
    })

    test('bounds an unresponsive GET and preserves ambiguous absence', async () => {
      const createTimeout = AbortSignal.timeout.bind(AbortSignal)
      const timeout = vi
        .spyOn(AbortSignal, 'timeout')
        .mockImplementationOnce(() => createTimeout(10))
      try {
        const headError = s3Error('NotFound', 404)
        mockSend.mockRejectedValueOnce(headError)
        mockSend.mockImplementationOnce(
          (_command: GetObjectCommand, { abortSignal }: { abortSignal: AbortSignal }) =>
            new Promise((_resolve, reject) => {
              abortSignal.addEventListener('abort', () => reject(abortSignal.reason), {
                once: true,
              })
            })
        )

        const error = await failure({ confirmMissing: true })

        expect(timeout).toHaveBeenCalledWith(5000)
        expect(mockSend.mock.calls[1][1].abortSignal.aborted).toBe(true)
        expect(error.getOriginalError()).toBe(headError)
        expect(error.httpStatusCode).toBe(404)
        expect(isMissingBackendObject(error)).toBe(false)
      } finally {
        timeout.mockRestore()
      }
    })
  })

  describe('privateAssetUrl', () => {
    test('uses the primary S3 client when no private asset endpoint is configured', async () => {
      const backend = createBackend()

      await expect(backend.privateAssetUrl('test-bucket', 'test-key', undefined)).resolves.toBe(
        'http://signed.example.com/test-bucket/test-key'
      )

      const s3ClientMock = S3Client as unknown as Mock
      const defaultClient = s3ClientMock.mock.results[0].value
      expect(s3ClientMock).toHaveBeenCalledTimes(1)
      expect(getSignedUrl).toHaveBeenCalledWith(defaultClient, expect.any(GetObjectCommand), {
        expiresIn: 600,
      })
    })

    test('uses the private asset endpoint when signing private asset URLs', async () => {
      const backend = new S3Backend({
        region: 'us-east-1',
        endpoint: 'http://127.0.0.1:9000',
        privateAssetEndpoint: 'http://rustfs:9000',
        forcePathStyle: true,
      })

      await backend.privateAssetUrl('test-bucket', 'test-key', 'version-id')

      const s3ClientMock = S3Client as unknown as Mock
      expect(s3ClientMock).toHaveBeenCalledTimes(2)
      expect(s3ClientMock.mock.calls[0][0]).toMatchObject({
        endpoint: 'http://127.0.0.1:9000',
        forcePathStyle: true,
        region: 'us-east-1',
      })
      expect(s3ClientMock.mock.calls[1][0]).toMatchObject({
        endpoint: 'http://rustfs:9000',
        forcePathStyle: true,
        region: 'us-east-1',
      })

      const privateAssetClient = s3ClientMock.mock.results[1].value
      const privateAssetCommand = (getSignedUrl as Mock).mock.calls[0][1] as GetObjectCommand
      expect(privateAssetCommand.input).toMatchObject({
        Bucket: 'test-bucket',
        Key: withOptionalVersion('test-key', 'version-id'),
      })
      expect(getSignedUrl).toHaveBeenCalledWith(privateAssetClient, privateAssetCommand, {
        expiresIn: 600,
      })
    })
  })

  describe('copyObject', () => {
    test.each([
      ['PreconditionFailed', 412, ErrorCode.PreconditionFailed],
      ['AccessDenied', 403, ErrorCode.S3Error],
    ])('reports an upstream %s as %i with its error code', async (name, httpStatusCode, code) => {
      mockSend.mockRejectedValue(
        Object.assign(new Error('upstream'), { name, $metadata: { httpStatusCode } })
      )

      await expect(
        createBackend().copyObject('test-bucket', 'source', 'v1', 'destination', 'v2')
      ).rejects.toMatchObject({ code, httpStatusCode, message: name })
    })

    test('uses REPLACE metadata directive when metadata should be overwritten', async () => {
      mockSend.mockResolvedValue({
        CopyObjectResult: {
          ETag: '"copy-etag"',
          LastModified: new Date('2026-05-18T00:00:00Z'),
        },
        $metadata: {
          httpStatusCode: 200,
        },
      })

      const backend = createBackend()
      await backend.copyObject(
        'test-bucket',
        'source-key',
        'source-version',
        'destination-key',
        'destination-version',
        {
          cacheControl: 'max-age=999',
          mimetype: 'image/gif',
        },
        undefined,
        { copyMetadata: false }
      )

      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend.mock.calls[0][0]).toBeInstanceOf(CopyObjectCommand)
      const input = mockSend.mock.calls[0][0].input
      expect(input).toMatchObject({
        Bucket: 'test-bucket',
        Key: withOptionalVersion('destination-key', 'destination-version'),
        CacheControl: 'max-age=999',
        ContentType: 'image/gif',
        MetadataDirective: 'REPLACE',
      })
      expect(input.Metadata).toBeUndefined()
    })

    test('uses COPY metadata directive when metadata should be preserved', async () => {
      mockSend.mockResolvedValue({
        CopyObjectResult: {
          ETag: '"copy-etag"',
          LastModified: new Date('2026-05-18T00:00:00Z'),
        },
        $metadata: {
          httpStatusCode: 200,
        },
      })

      const backend = createBackend()
      await backend.copyObject(
        'test-bucket',
        'source-key',
        'source-version',
        'destination-key',
        'destination-version',
        {
          cacheControl: 'max-age=999',
          mimetype: 'image/gif',
        },
        undefined,
        { copyMetadata: true }
      )

      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend.mock.calls[0][0]).toBeInstanceOf(CopyObjectCommand)
      const input = mockSend.mock.calls[0][0].input
      expect(input).toMatchObject({
        Bucket: 'test-bucket',
        Key: withOptionalVersion('destination-key', 'destination-version'),
        MetadataDirective: 'COPY',
      })
      expect(input.CacheControl).toBeUndefined()
      expect(input.ContentType).toBeUndefined()
      expect(input.Metadata).toBeUndefined()
    })

    test('url-encodes the copy source including special characters', async () => {
      mockSend.mockResolvedValue({
        CopyObjectResult: {
          ETag: '"copy-etag"',
          LastModified: new Date('2026-05-18T00:00:00Z'),
        },
        $metadata: {
          httpStatusCode: 200,
        },
      })

      const backend = createBackend()
      await backend.copyObject(
        'test-bucket',
        'folder/my file+1.txt',
        'source-version',
        'destination-key',
        'destination-version'
      )

      expect(mockSend.mock.calls[0][0]).toBeInstanceOf(CopyObjectCommand)
      expect(mockSend.mock.calls[0][0].input.CopySource).toBe(
        encodeURIComponent(
          `test-bucket/${withOptionalVersion('folder/my file+1.txt', 'source-version')}`
        )
      )
    })
  })

  describe('uploadPartCopy', () => {
    test('url-encodes the copy source including special characters', async () => {
      mockSend.mockResolvedValue({
        CopyPartResult: {
          ETag: '"part-etag"',
          LastModified: new Date('2026-05-18T00:00:00Z'),
        },
      })

      const backend = createBackend()
      const result = await backend.uploadPartCopy(
        'test-bucket',
        'dest-key',
        'dest-version',
        'upload-id',
        1,
        'folder/my file+1.txt',
        'source-version',
        { fromByte: 0, toByte: 9 }
      )

      expect(result).toEqual({
        eTag: '"part-etag"',
        lastModified: new Date('2026-05-18T00:00:00Z'),
      })
      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend.mock.calls[0][0]).toBeInstanceOf(UploadPartCopyCommand)
      expect(mockSend.mock.calls[0][0].input).toMatchObject({
        Bucket: 'test-bucket',
        Key: withOptionalVersion('dest-key', 'dest-version'),
        UploadId: 'upload-id',
        PartNumber: 1,
        CopySource: encodeURIComponent(
          `test-bucket/${withOptionalVersion('folder/my file+1.txt', 'source-version')}`
        ),
        CopySourceRange: 'bytes=0-9',
      })
    })
  })

  describe('uploadObject', () => {
    test('uses PutObject for known-size uploads within the single-request limit', async () => {
      mockSend.mockResolvedValue({
        ETag: '"put-etag"',
        $metadata: {
          httpStatusCode: 200,
        },
      })

      const backend = createBackend()
      const result = await backend.uploadObject(
        'test-bucket',
        'test-key',
        undefined,
        Readable.from(['hello']),
        'text/plain',
        'max-age=60',
        undefined,
        5
      )

      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend.mock.calls[0][0]).toBeInstanceOf(PutObjectCommand)
      expect(mockSend.mock.calls[0][0].input).toMatchObject({
        Bucket: 'test-bucket',
        Key: 'test-key',
        ContentType: 'text/plain',
        CacheControl: 'max-age=60',
        ContentLength: 5,
      })
      expect(Upload).not.toHaveBeenCalled()
      expect(result).toMatchObject({
        httpStatusCode: 200,
        cacheControl: 'max-age=60',
        eTag: '"put-etag"',
        mimetype: 'text/plain',
        contentLength: 5,
        size: 5,
      })
    })

    test('uses PutObject for zero-byte uploads when content length is known', async () => {
      mockSend.mockResolvedValue({
        ETag: '"empty-etag"',
        $metadata: {
          httpStatusCode: 200,
        },
      })

      const backend = createBackend()
      const result = await backend.uploadObject(
        'test-bucket',
        'empty-key',
        undefined,
        Readable.from([]),
        'application/octet-stream',
        'no-cache',
        undefined,
        0
      )

      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend.mock.calls[0][0]).toBeInstanceOf(PutObjectCommand)
      expect(mockSend.mock.calls[0][0].input).toMatchObject({
        Bucket: 'test-bucket',
        Key: 'empty-key',
        ContentType: 'application/octet-stream',
        CacheControl: 'no-cache',
        ContentLength: 0,
      })
      expect(Upload).not.toHaveBeenCalled()
      expect(result).toMatchObject({
        httpStatusCode: 200,
        cacheControl: 'no-cache',
        eTag: '"empty-etag"',
        mimetype: 'application/octet-stream',
        contentLength: 0,
        size: 0,
      })
    })

    test('falls back to multipart upload when content length exceeds the single-request limit', async () => {
      const overLimit = MAX_PUT_OBJECT_SIZE + 1
      const lastModified = new Date('2024-01-01T00:00:00.000Z')

      mockUploadDone.mockImplementationOnce(async (instance) => {
        instance.emit('httpUploadProgress', { loaded: 1 })
        return {
          ETag: '"multipart-etag"',
          $metadata: {
            httpStatusCode: 200,
          },
        }
      })
      mockSend.mockResolvedValueOnce({
        CacheControl: 'max-age=60',
        ContentType: 'text/plain',
        ContentLength: overLimit,
        ETag: '"head-etag"',
        LastModified: lastModified,
        $metadata: {
          httpStatusCode: 200,
        },
      })

      const backend = createBackend()
      const result = await backend.uploadObject(
        'test-bucket',
        'test-key',
        undefined,
        Readable.from(['hello']),
        'text/plain',
        'max-age=60',
        undefined,
        overLimit
      )

      expect(Upload).toHaveBeenCalledTimes(1)
      expect(getConfig().storageS3UploadPartSize).toBe(DEFAULT_S3_UPLOAD_PART_SIZE)
      expect(uploadInstances[0].options.partSize).toBe(getConfig().storageS3UploadPartSize)
      expect(uploadInstances[0].options.queueSize).toBe(getConfig().storageS3UploadQueueSize)
      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand)
      expect(result).toMatchObject({
        httpStatusCode: 200,
        cacheControl: 'max-age=60',
        eTag: '"head-etag"',
        mimetype: 'text/plain',
        contentLength: overLimit,
        size: overLimit,
        lastModified,
      })
    })

    test('uses multipart upload when content length is unknown', async () => {
      const backend = createBackend()
      const result = await backend.uploadObject(
        'test-bucket',
        'test-key',
        undefined,
        Readable.from(['hello']),
        'text/plain',
        'max-age=60'
      )

      expect(Upload).toHaveBeenCalledTimes(1)
      expect(getConfig().storageS3UploadPartSize).toBe(DEFAULT_S3_UPLOAD_PART_SIZE)
      expect(uploadInstances[0].options.partSize).toBe(getConfig().storageS3UploadPartSize)
      expect(uploadInstances[0].options.queueSize).toBe(getConfig().storageS3UploadQueueSize)
      expect(mockSend).not.toHaveBeenCalled()
      expect(result).toMatchObject({
        httpStatusCode: 200,
        cacheControl: 'max-age=60',
        eTag: '"multipart-etag"',
        mimetype: 'text/plain',
        contentLength: 0,
        size: 0,
      })
    })

    test('maps PutObject abort errors to AbortedTerminate', async () => {
      mockSend.mockRejectedValueOnce(Object.assign(new Error('aborted'), { name: 'AbortError' }))

      const backend = createBackend()

      try {
        await backend.uploadObject(
          'test-bucket',
          'test-key',
          undefined,
          Readable.from(['hello']),
          'text/plain',
          'max-age=60',
          undefined,
          5
        )
        throw new Error('Expected uploadObject to throw')
      } catch (error) {
        expect(isStorageError(ErrorCode.AbortedTerminate, error)).toBe(true)
        expect((error as Error).message).toBe('Upload was aborted')
      }
    })
  })

  describe('abortMultipartUpload', () => {
    test('includes version in S3 key when version is provided', async () => {
      const backend = createBackend()
      const bucketName = 'test-bucket'
      const key = 'test-folder/test-object.txt'
      const uploadId = 'test-upload-id'
      const version = 'version-123'

      await backend.abortMultipartUpload(bucketName, key, uploadId, version)

      expect(mockSend).toHaveBeenCalledTimes(1)
      const command = mockSend.mock.calls[0][0] as AbortMultipartUploadCommand
      expect(command).toBeInstanceOf(AbortMultipartUploadCommand)
      expect(command.input.Bucket).toBe(bucketName)
      expect(command.input.Key).toBe(`${key}/${version}`)
      expect(command.input.UploadId).toBe(uploadId)
    })

    test('does not include version in S3 key when version is undefined', async () => {
      const backend = createBackend()
      const bucketName = 'test-bucket'
      const key = 'test-folder/test-object.txt'
      const uploadId = 'test-upload-id'

      await backend.abortMultipartUpload(bucketName, key, uploadId, undefined)

      expect(mockSend).toHaveBeenCalledTimes(1)
      const command = mockSend.mock.calls[0][0] as AbortMultipartUploadCommand
      expect(command).toBeInstanceOf(AbortMultipartUploadCommand)
      expect(command.input.Bucket).toBe(bucketName)
      expect(command.input.Key).toBe(key)
      expect(command.input.UploadId).toBe(uploadId)
    })
  })
})
