import { Readable } from 'node:stream'
import { buffer } from 'node:stream/consumers'
import { ErrorCode } from '@internal/errors'
import { MAX_OBJECTS_PER_REQUEST } from '@storage/limits'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import type { JSONSchema } from 'json-schema-to-ts'
import { vi } from 'vitest'
import { S3ProtocolHandler } from '../../../storage/protocols/s3/s3-handler'
import { Uploader } from '../../../storage/uploader'
import { blobResponse } from '../../plugins/blob-response'
import { ROUTE_OPERATIONS } from '../operations'
import CompleteMultipartUpload from './commands/complete-multipart-upload'
import ListMultipartUploads from './commands/list-multipart-uploads'
import ListObjects from './commands/list-objects'
import ListParts from './commands/list-parts'
import PutObject from './commands/put-object'
import UploadPart from './commands/upload-part'
import UploadPartCopy from './commands/upload-part-copy'
import { findArraySchemaPaths, getRouter, type RouteQuery, Router, type S3Router } from './router'

afterEach(() => {
  vi.restoreAllMocks()
})

type S3HandlerStorage = ConstructorParameters<typeof S3ProtocolHandler>[0]

describe('S3 schema path discovery', () => {
  it('finds nested array paths through array items', () => {
    const schema = {
      type: 'object',
      properties: {
        Items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              Parts: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    } satisfies JSONSchema

    expect(findArraySchemaPaths([schema])).toEqual(['Items', 'Items.Parts'])
  })
})

function createHandler() {
  return new S3ProtocolHandler({} as unknown as S3HandlerStorage, 'tenant-id')
}

describe('S3 router query matching', () => {
  it('parses key-only query params with an undefined value', () => {
    const router = new Router()

    expect(router.parseQueryMatch('uploads')).toEqual({
      key: 'uploads',
      value: undefined,
    })
  })

  it('matches key-only query params when the property exists', () => {
    const router = new Router()

    router.post(
      '/:Bucket/*?uploads',
      {
        schema: {},
        operation: 'test.operation',
      },
      async () => ({})
    )

    const route = router.routes().get('/:Bucket/*')?.[0]
    expect(route).toBeDefined()

    expect(router.matchRoute(route!, undefined, { uploads: undefined }, {})).toBe(true)
  })

  it('matches valued query params when the value matches', () => {
    const router = new Router()

    router.get(
      '/:Bucket/*?list-type=2',
      {
        schema: {},
        operation: 'test.operation',
      },
      async () => ({})
    )

    const route = router.routes().get('/:Bucket/*')?.[0]
    expect(route).toBeDefined()

    expect(router.matchRoute(route!, undefined, { 'list-type': '2' }, {})).toBe(true)
  })

  it('does not match valued query params when the value differs', () => {
    const router = new Router()

    router.get(
      '/:Bucket/*?list-type=2',
      {
        schema: {},
        operation: 'test.operation',
      },
      async () => ({})
    )

    const route = router.routes().get('/:Bucket/*')?.[0]
    expect(route).toBeDefined()

    expect(router.matchRoute(route!, undefined, { 'list-type': '1' }, {})).toBe(false)
  })

  it('matches wildcard routes even when the request has query params', () => {
    const router = new Router()

    router.get(
      '/:Bucket/*',
      {
        schema: {},
        operation: 'test.operation',
      },
      async () => ({})
    )

    const route = router.routes().get('/:Bucket/*')?.[0]
    expect(route).toBeDefined()

    expect(router.matchRoute(route!, undefined, { uploads: undefined }, {})).toBe(true)
  })

  it('does not enumerate request query keys for wildcard-only routes', () => {
    const router = new Router()

    router.get(
      '/:Bucket/*',
      {
        schema: {},
        operation: 'test.operation',
      },
      async () => ({})
    )

    const route = router.routes().get('/:Bucket/*')?.[0]
    expect(route).toBeDefined()

    const query = new Proxy(
      {},
      {
        ownKeys: () => {
          throw new Error('wildcard-only query match should not enumerate request query keys')
        },
      }
    )

    expect(router.matchRoute(route!, undefined, query, {})).toBe(true)
  })

  it('requires every key-only query matcher to be present', () => {
    const router = new Router()

    router.put(
      '/:Bucket/*?partNumber&uploadId',
      {
        schema: {},
        operation: 'test.operation',
      },
      async () => ({})
    )

    const route = router.routes().get('/:Bucket/*')?.[0]
    expect(route).toBeDefined()

    expect(
      router.matchRoute(route!, undefined, { partNumber: '1', uploadId: 'upload-id' }, {})
    ).toBe(true)
    expect(router.matchRoute(route!, undefined, { partNumber: '1' }, {})).toBe(false)
    expect(router.matchRoute(route!, undefined, { uploadId: 'upload-id' }, {})).toBe(false)
    expect(router.matchRoute(route!, undefined, {}, {})).toBe(false)
  })

  it('allows wildcard query matchers to fall back when valued query matchers miss', () => {
    const router = new Router()

    router.get(
      '/:Bucket/*?list-type=2&*',
      {
        schema: {},
        operation: 'test.operation',
      },
      async () => ({})
    )

    const route = router.routes().get('/:Bucket/*')?.[0]
    expect(route).toBeDefined()

    expect(router.matchRoute(route!, undefined, { 'list-type': '2' }, {})).toBe(true)
    expect(router.matchRoute(route!, undefined, { 'list-type': '1' }, {})).toBe(true)
    expect(router.matchRoute(route!, undefined, {}, {})).toBe(true)
  })
})

describe('S3 router header matching', () => {
  it('matches routes that require a header by presence', () => {
    const router = new Router()

    router.put(
      '/:Bucket/*|x-amz-copy-source',
      {
        schema: {},
        operation: 'test.operation',
      },
      async () => ({})
    )

    const route = router.routes().get('/:Bucket/*')?.[0]
    expect(route).toBeDefined()

    expect(
      router.matchRoute(route!, undefined, {}, { 'x-amz-copy-source': '/source-bucket/source-key' })
    ).toBe(true)
  })

  it('matches routes that require a header value prefix', () => {
    const router = new Router()

    router.post(
      '/:Bucket|content-type=multipart/form-data',
      {
        schema: {},
        operation: 'test.operation',
      },
      async () => ({})
    )

    const route = router.routes().get('/:Bucket')?.[0]
    expect(route).toBeDefined()

    expect(
      router.matchRoute(
        route!,
        undefined,
        {},
        { 'content-type': 'multipart/form-data; boundary=abc123' }
      )
    ).toBe(true)
  })

  it('rejects routes when a required header is missing or has the wrong value', () => {
    const router = new Router()

    router.post(
      '/:Bucket|content-type=multipart/form-data',
      {
        schema: {},
        operation: 'test.operation',
      },
      async () => ({})
    )

    const route = router.routes().get('/:Bucket')?.[0]
    expect(route).toBeDefined()

    expect(router.matchRoute(route!, undefined, {}, {})).toBe(false)
    expect(router.matchRoute(route!, undefined, {}, { 'content-type': 'application/json' })).toBe(
      false
    )
  })

  it('requires query and header matchers to pass together', () => {
    const router = new Router()

    router.put(
      '/:Bucket/*?partNumber&uploadId|x-amz-copy-source',
      {
        schema: {},
        operation: 'test.operation',
      },
      async () => ({})
    )

    const route = router.routes().get('/:Bucket/*')?.[0]
    expect(route).toBeDefined()

    expect(
      router.matchRoute(
        route!,
        undefined,
        { partNumber: '1', uploadId: 'upload-id' },
        { 'x-amz-copy-source': '/source-bucket/source-key' }
      )
    ).toBe(true)
    expect(
      router.matchRoute(
        route!,
        undefined,
        { partNumber: '1' },
        { 'x-amz-copy-source': '/source-bucket/source-key' }
      )
    ).toBe(false)
    expect(
      router.matchRoute(route!, undefined, { partNumber: '1', uploadId: 'upload-id' }, {})
    ).toBe(false)
  })
})

describe('S3 router route resolution', () => {
  it('registers lifecycle subresources for Standard buckets and explicit Iceberg rejection', async () => {
    const routes = getRouter().routes().get('/:Bucket') ?? []
    const cases = [
      ['get', { lifecycle: '' }, ROUTE_OPERATIONS.S3_GET_BUCKET_LIFECYCLE],
      ['put', { lifecycle: '' }, ROUTE_OPERATIONS.S3_PUT_BUCKET_LIFECYCLE],
      ['delete', { lifecycle: '' }, ROUTE_OPERATIONS.S3_DELETE_BUCKET_LIFECYCLE],
    ] as const

    for (const [method, query, operation] of cases) {
      const standard = routes.find(
        (route) => route.method === method && route.matches(undefined, query, {})
      )
      const iceberg = routes.find(
        (route) => route.method === method && route.matches('iceberg', query, {})
      )
      expect(standard?.operation).toBe(operation)
      expect(iceberg?.operation).toBe(operation.replace('storage.s3.', 'storage.s3.iceberg.'))
      await expect(iceberg?.handler?.({} as never, {} as never)).rejects.toMatchObject({
        code: 'InvalidRequest',
        httpStatusCode: 400,
        message: 'Versioning and lifecycle are only supported for Standard buckets',
      })
    }
  })

  it('keeps first-match order for overlapping standard PUT object routes', () => {
    const router = getRouter()
    const routes = router
      .routes()
      .get('/:Bucket/*')
      ?.filter((route) => route.method === 'put' && route.type === undefined)

    expect(routes?.map((route) => route.operation)).toEqual([
      'storage.s3.upload.part_copy',
      'storage.s3.object.copy',
      'storage.s3.upload.part',
      'storage.s3.upload',
    ])

    const findOperation = (
      query: RouteQuery,
      headers: Record<string, string>
    ): string | undefined => {
      return routes?.find((route) => route.matches(undefined, query, headers))?.operation
    }

    expect(
      findOperation(
        { partNumber: '1', uploadId: 'upload-id' },
        { 'x-amz-copy-source': '/source-bucket/source-key' }
      )
    ).toBe('storage.s3.upload.part_copy')
    expect(findOperation({}, { 'x-amz-copy-source': '/source-bucket/source-key' })).toBe(
      'storage.s3.object.copy'
    )
    expect(findOperation({ partNumber: '1', uploadId: 'upload-id' }, {})).toBe(
      'storage.s3.upload.part'
    )
    expect(findOperation({}, {})).toBe('storage.s3.upload')
  })
})

describe('S3 route handler matching', () => {
  function lifecycleConfigurationXml(id: string, noncurrentDays = 1) {
    return `<LifecycleConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
      <Rule>
        <ID>${id}</ID>
        <Status>Enabled</Status>
        <Filter/>
        <NoncurrentVersionExpiration>
          <NoncurrentDays>${noncurrentDays}</NoncurrentDays>
        </NoncurrentVersionExpiration>
      </Rule>
    </LifecycleConfiguration>`
  }

  async function withMockedS3App<T>(
    callback: (app: FastifyInstance) => Promise<T>,
    options: {
      configureRequest?: (request: FastifyRequest) => void
      tracingEnabled?: boolean
      useRealXmlParser?: boolean
    } = {}
  ) {
    const previousS3ProtocolEnabled = process.env.S3_PROTOCOL_ENABLED
    process.env.S3_PROTOCOL_ENABLED = 'true'

    vi.resetModules()
    vi.doMock('../../../config', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../../config')>()

      return {
        ...actual,
        getConfig: (getConfigOptions?: Parameters<typeof actual.getConfig>[0]) => ({
          ...actual.getConfig(getConfigOptions),
          s3ProtocolEnabled: true,
          storageLifecycleEnabled: true,
          tracingEnabled: options.tracingEnabled ?? false,
        }),
      }
    })
    vi.doMock('../../plugins', async () => {
      const { default: fastifyPlugin } = await import('fastify-plugin')
      const { xmlParser } = await import('../../plugins/xml')
      const noopPlugin = fastifyPlugin(async () => {})
      const routeMarkerPlugin = fastifyPlugin(async (fastify: FastifyInstance) => {
        fastify.addHook('preHandler', async (request, reply) => {
          reply.header('x-s3-route-handler-test', '1')
          options.configureRequest?.(request)
        })
      })

      return {
        db: noopPlugin,
        detectS3IcebergBucket: noopPlugin,
        icebergRestCatalog: noopPlugin,
        requireTenantFeature: () => routeMarkerPlugin,
        signatureV4: noopPlugin,
        storage: noopPlugin,
        xmlParser: options.useRealXmlParser ? xmlParser : noopPlugin,
      }
    })

    const { default: fastify } = await import('fastify')
    const { default: routes } = await import('./index')
    const app = fastify()

    try {
      await app.register(blobResponse)
      await app.register(routes)
      await app.ready()
      return await callback(app)
    } finally {
      await app.close()
      vi.doUnmock('../../plugins')
      vi.doUnmock('../../../config')
      vi.resetModules()

      if (previousS3ProtocolEnabled === undefined) {
        delete process.env.S3_PROTOCOL_ENABLED
      } else {
        process.env.S3_PROTOCOL_ENABLED = previousS3ProtocolEnabled
      }
    }
  }

  async function putLifecycleConfigurationThroughS3(id: string, noncurrentDays = 1) {
    const putBucketLifecycle = vi.fn().mockResolvedValue(undefined)
    const response = await withMockedS3App(
      (app) =>
        app.inject({
          method: 'PUT',
          url: '/bucket?lifecycle',
          headers: {
            accept: 'application/json',
            'content-type': 'application/xml',
          },
          payload: lifecycleConfigurationXml(id, noncurrentDays),
        }),
      {
        configureRequest: (request) => {
          Object.assign(request, {
            owner: 'owner-id',
            signals: {
              body: new AbortController(),
              response: new AbortController(),
            },
            storage: {
              db: { hasMigration: vi.fn().mockResolvedValue(true) },
              putBucketLifecycle,
            },
            tenantId: 'tenant-id',
          })
        },
        useRealXmlParser: true,
      }
    )

    return { putBucketLifecycle, response }
  }

  it.each([
    2147483647,
    2147483648,
    Number.MAX_SAFE_INTEGER,
  ])('enforces the S3 NoncurrentDays upper bound for %s through XML', async (noncurrentDays) => {
    const { putBucketLifecycle, response } = await putLifecycleConfigurationThroughS3(
      'expire-history',
      noncurrentDays
    )
    if (noncurrentDays === 2147483647) {
      expect(response.statusCode).toBe(200)
      expect(putBucketLifecycle).toHaveBeenCalledWith('bucket', {
        rules: [expect.objectContaining({ noncurrentVersionExpiration: { noncurrentDays } })],
      })
    } else {
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchObject({
        Error: {
          Code: 'InvalidArgument',
          Message: 'The integer value must be less than or equal to 2147483647.',
        },
      })
      expect(putBucketLifecycle).not.toHaveBeenCalled()
    }
  })

  it('returns 404 from the S3 route handler when no command route matches', async () => {
    await withMockedS3App(async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/bucket/object',
      })

      expect(response.statusCode).toBe(404)
      expect(response.headers['x-s3-route-handler-test']).toBe('1')
    })
  })

  it('sets the S3 operation span attribute when opentelemetry is available', async () => {
    const setAttribute = vi.fn()

    await withMockedS3App(
      async (app) => {
        const response = await app.inject({
          method: 'GET',
          url: '/',
        })

        expect(response.statusCode).toBe(200)
      },
      {
        configureRequest: (request) => {
          Object.assign(request, {
            opentelemetry: () => ({ span: { setAttribute } }),
            owner: 'owner-id',
            signals: {
              body: new AbortController(),
              response: new AbortController(),
            },
            storage: {
              listBuckets: vi.fn().mockResolvedValue([]),
            },
            tenantId: 'tenant-id',
          })
        },
      }
    )

    expect(setAttribute).toHaveBeenCalledWith('http.operation', 'storage.s3.bucket.list')
  })

  it.each([
    { label: 'no Rule attributes', attributes: '', error: undefined },
    {
      label: 'a valid Rule namespace',
      attributes: ' xmlns="http://s3.amazonaws.com/doc/2006-03-01/"',
      error: undefined,
    },
    {
      label: 'an invalid Rule namespace',
      attributes: ' xmlns="urn:not-s3"',
      error: 'Rule 1 has an invalid XML namespace',
    },
    {
      label: 'an unsupported Rule attribute',
      attributes: ' id="unexpected"',
      error: 'Rule 1 attributes contains unsupported field id',
    },
  ])('parses pretty lifecycle XML with $label and an omitted ID', async ({ attributes, error }) => {
    const putBucketLifecycle = vi.fn().mockResolvedValue(undefined)

    await withMockedS3App(
      async (app) => {
        const response = await app.inject({
          method: 'PUT',
          url: '/bucket?lifecycle',
          headers: {
            accept: 'application/json',
            'content-type': 'application/xml',
          },
          payload: `<?xml version="1.0" encoding="UTF-8"?>
            <LifecycleConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
              <Rule${attributes}>
                <Status>Enabled</Status>
                <ID/>
                <Filter>
                  <Prefix></Prefix>
                </Filter>
                <NoncurrentVersionExpiration>
                  <NoncurrentDays>30</NoncurrentDays>
                </NoncurrentVersionExpiration>
              </Rule>
            </LifecycleConfiguration>`,
        })

        if (error) {
          expect(response.statusCode).toBe(400)
          expect(response.json()).toMatchObject({
            Error: { Code: 'MalformedXML', Message: error },
          })
        } else {
          expect(response.statusCode).toBe(200)
        }
      },
      {
        configureRequest: (request) => {
          Object.assign(request, {
            owner: 'owner-id',
            signals: {
              body: new AbortController(),
              response: new AbortController(),
            },
            storage: {
              db: { hasMigration: vi.fn().mockResolvedValue(true) },
              putBucketLifecycle,
            },
            tenantId: 'tenant-id',
          })
        },
        useRealXmlParser: true,
      }
    )

    if (error) {
      expect(putBucketLifecycle).not.toHaveBeenCalled()
      return
    }
    expect(putBucketLifecycle).toHaveBeenCalledWith('bucket', {
      rules: [
        {
          id: expect.stringMatching(/^rule-[0-9a-f]{64}$/),
          status: 'Enabled',
          filter: {},
          noncurrentVersionExpiration: { noncurrentDays: 30 },
        },
      ],
    })
  })

  it.each([
    '<Prefix/>',
    '<Filter/><Prefix/>',
  ])('rejects unsupported legacy lifecycle selectors %s through the XML parser', async (selector) => {
    const putBucketLifecycle = vi.fn()
    await withMockedS3App(
      async (app) => {
        const response = await app.inject({
          method: 'PUT',
          url: '/bucket?lifecycle',
          headers: { accept: 'application/json', 'content-type': 'application/xml' },
          payload: `<LifecycleConfiguration><Rule><Status>Enabled</Status>${selector}<NoncurrentVersionExpiration><NoncurrentDays>30</NoncurrentDays></NoncurrentVersionExpiration></Rule></LifecycleConfiguration>`,
        })
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchObject({
          Error: {
            Code: 'InvalidRequest',
            Message: 'Rule 1 contains unsupported element Prefix; use Filter instead',
          },
        })
      },
      {
        configureRequest: (request) => {
          Object.assign(request, {
            owner: 'owner-id',
            signals: { body: new AbortController(), response: new AbortController() },
            storage: {
              db: { hasMigration: vi.fn().mockResolvedValue(true) },
              putBucketLifecycle,
            },
            tenantId: 'tenant-id',
          })
        },
        useRealXmlParser: true,
      }
    )
    expect(putBucketLifecycle).not.toHaveBeenCalled()
  })

  it.each([
    ['255 ASCII code units', 'a'.repeat(255)],
    ['255 non-ASCII BMP code units', 'é'.repeat(255)],
    ['254 astral code units', '😀'.repeat(127)],
    ['255 mixed astral and ASCII code units', '😀'.repeat(127) + 'a'],
  ])('accepts an S3 lifecycle rule ID with %s', async (_label, id) => {
    const { putBucketLifecycle, response } = await putLifecycleConfigurationThroughS3(id)

    expect(response.statusCode).toBe(200)
    expect(putBucketLifecycle).toHaveBeenCalledWith('bucket', {
      rules: [
        {
          id,
          status: 'Enabled',
          filter: {},
          noncurrentVersionExpiration: { noncurrentDays: 1 },
        },
      ],
    })
  })

  it.each([
    ['256 ASCII code units', 'a'.repeat(256)],
    ['256 non-ASCII BMP code units', 'é'.repeat(256)],
    ['256 mixed astral and ASCII code units', '😀'.repeat(127) + 'aa'],
    ['256 astral code units', '😀'.repeat(128)],
  ])('rejects an S3 lifecycle rule ID with %s', async (_label, id) => {
    const { putBucketLifecycle, response } = await putLifecycleConfigurationThroughS3(id)

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({
      Error: {
        Code: 'InvalidArgument',
        Message: 'Rule 1 ID must be 255 characters or fewer',
      },
    })
    expect(putBucketLifecycle).not.toHaveBeenCalled()
  })

  it.each([
    ['<LifecycleConfiguration><Rule></LifecycleConfiguration>', 'MalformedXML'],
    ['<LifecycleConfiguration/>', 'InvalidRequest'],
    ['<WrongRoot/>', 'InvalidRequest'],
    ['<LifecycleConfiguration><Bogus/></LifecycleConfiguration>', 'InvalidRequest'],
    ['<LifecycleConfiguration><Rule/></LifecycleConfiguration>', 'InvalidRequest'],
  ])('rejects lifecycle payload %s as %s before invoking storage', async (payload, code) => {
    const putBucketLifecycle = vi.fn()

    await withMockedS3App(
      async (app) => {
        const response = await app.inject({
          method: 'PUT',
          url: '/bucket?lifecycle',
          headers: {
            accept: 'application/json',
            'content-type': 'application/xml',
          },
          payload,
        })

        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchObject({ Error: { Code: code } })
      },
      {
        configureRequest: (request) => {
          Object.assign(request, {
            owner: 'owner-id',
            signals: {
              body: new AbortController(),
              response: new AbortController(),
            },
            storage: { putBucketLifecycle },
            tenantId: 'tenant-id',
          })
        },
        useRealXmlParser: true,
      }
    )

    expect(putBucketLifecycle).not.toHaveBeenCalled()
  })

  it.each([
    { size: 0, contentLength: '0' },
    { size: null, contentLength: undefined },
    { size: undefined, contentLength: undefined },
  ])('forwards HeadObject response headers for size $size', async ({ size, contentLength }) => {
    const findObject = vi.fn().mockResolvedValue({
      created_at: '2026-06-25T00:00:00.000Z',
      metadata: {
        eTag: '"etag"',
        mimetype: 'text/plain',
        size,
      },
      updated_at: '2026-06-25T00:00:00.000Z',
      user_metadata: {
        empty: '',
      },
    })

    await withMockedS3App(
      async (app) => {
        const response = await app.inject({
          method: 'HEAD',
          url: '/bucket/object.txt',
        })

        expect(response.statusCode).toBe(200)
        expect(response.headers['content-length']).toBe(contentLength)
        expect(response.headers['x-amz-meta-empty']).toBe('')
        expect(response.headers.expires).toBeUndefined()
        expect(response.headers['cache-control']).toBeUndefined()
      },
      {
        configureRequest: (request) => {
          Object.assign(request, {
            owner: 'owner-id',
            signals: {
              body: new AbortController(),
              response: new AbortController(),
            },
            storage: {
              from: vi.fn(() => ({
                findObject,
              })),
            },
            tenantId: 'tenant-id',
          })
        },
      }
    )
  })

  it('streams Blob object bodies instead of sending object payloads to Fastify', async () => {
    const getObject = vi.fn().mockResolvedValue({
      body: new Blob(['stored']),
      httpStatusCode: 200,
      metadata: {
        cacheControl: 'no-cache',
        contentLength: 6,
        eTag: '"etag"',
        mimetype: 'text/plain',
      },
    })

    await withMockedS3App(
      async (app) => {
        const response = await app.inject({
          method: 'GET',
          url: '/bucket/object.txt',
        })

        expect(response.statusCode).toBe(200)
        expect(response.headers['content-type']).toBe('text/plain')
        expect(response.body).toBe('stored')
      },
      {
        configureRequest: (request) => {
          Object.assign(request, {
            owner: 'owner-id',
            signals: {
              body: new AbortController(),
              response: new AbortController(),
            },
            storage: {
              backend: { getObject },
              from: vi.fn(() => ({
                findObject: vi.fn().mockResolvedValue({
                  user_metadata: null,
                  version: 'version',
                }),
              })),
              location: {
                getKeyLocation: vi.fn().mockReturnValue('tenant-id/bucket/object.txt'),
                getRootLocation: vi.fn().mockReturnValue('root'),
              },
            },
            tenantId: 'tenant-id',
          })
        },
      }
    )

    expect(getObject).toHaveBeenCalled()
  })

  describe.each([false, true])('conditional reads (iceberg: %s)', (isIcebergBucket) => {
    it.each([
      ['not a date', undefined, undefined],
      ['Thu, 01 Jan 2026 00:00:00 GMT', '2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z'],
    ])('passes conditional headers with date %s to the backend as %s', async (header, expected, expectedUnmodified) => {
      const getObject = vi.fn().mockResolvedValue({
        body: new Blob(['stored']),
        httpStatusCode: 200,
        metadata: {
          cacheControl: 'no-cache',
          contentLength: 6,
          eTag: '"etag"',
          mimetype: 'text/plain',
        },
      })

      await withMockedS3App(
        async (app) => {
          const response = await app.inject({
            method: 'GET',
            url: '/bucket/object.txt',
            headers: {
              'if-match': '"expected-etag"',
              'if-modified-since': header,
              'if-unmodified-since': expectedUnmodified ? 'Fri, 02 Jan 2026 00:00:00 GMT' : header,
              range: 'bytes=0-1',
            },
          })

          expect(response.statusCode).toBe(200)
        },
        {
          configureRequest: (request) => {
            Object.assign(request, {
              owner: 'owner-id',
              isIcebergBucket,
              internalIcebergBucketName: 'internal-bucket',
              signals: {
                body: new AbortController(),
                response: new AbortController(),
              },
              storage: {
                backend: { getObject },
                from: vi.fn(() => ({
                  findObject: vi.fn().mockResolvedValue({
                    user_metadata: null,
                    version: 'version',
                  }),
                })),
                location: {
                  getKeyLocation: vi.fn().mockReturnValue('tenant-id/bucket/object.txt'),
                  getRootLocation: vi.fn().mockReturnValue('root'),
                },
              },
              tenantId: 'tenant-id',
            })
          },
        }
      )

      expect(getObject.mock.calls[0][3]).toMatchObject({
        ifMatch: '"expected-etag"',
        ifModifiedSince: expected,
        ifUnmodifiedSince: expectedUnmodified,
        range: 'bytes=0-1',
      })
      expect(getObject.mock.calls[0][2]).toBe(isIcebergBucket ? undefined : 'version')
    })
  })
})

describe('S3 router type matching', () => {
  it('matches iceberg-typed routes only for iceberg requests', () => {
    const router = new Router()

    router.get(
      '/:Bucket/*',
      {
        schema: {},
        operation: 'test.operation',
        type: 'iceberg',
      },
      async () => ({})
    )

    const route = router.routes().get('/:Bucket/*')?.[0]
    expect(route).toBeDefined()

    expect(router.matchRoute(route!, 'iceberg', {}, {})).toBe(true)
    expect(router.matchRoute(route!, undefined, {}, {})).toBe(false)
  })

  it('matches untyped routes only for untyped requests', () => {
    const router = new Router()

    router.get(
      '/:Bucket/*',
      {
        schema: {},
        operation: 'test.operation',
      },
      async () => ({})
    )

    const route = router.routes().get('/:Bucket/*')?.[0]
    expect(route).toBeDefined()

    expect(router.matchRoute(route!, undefined, {}, {})).toBe(true)
    expect(router.matchRoute(route!, 'iceberg', {}, {})).toBe(false)
  })
})

describe('S3 router registration precomputation', () => {
  it('delegates public route matching to the precompiled route matcher', () => {
    const router = new Router()

    router.get(
      '/:Bucket/*?uploads',
      {
        schema: {},
        operation: 'test.operation',
      },
      async () => ({})
    )

    const route = router.routes().get('/:Bucket/*')?.[0]
    expect(route).toBeDefined()

    const query = { uploads: undefined }
    const headers = { 'x-test-header': 'value' }
    route!.matches = vi.fn(() => true)

    expect(router.matchRoute(route!, 'iceberg', query, headers)).toBe(true)
    expect(route!.matches).toHaveBeenCalledTimes(1)
    expect(route!.matches).toHaveBeenCalledWith('iceberg', query, headers)
  })

  it('stores the compiled validator directly on the route', () => {
    const router = new Router()

    router.get(
      '/:Bucket/*?list-type=2',
      {
        schema: {
          Params: {
            type: 'object',
            properties: {
              Bucket: { type: 'string' },
              '*': { type: 'string' },
            },
            required: ['Bucket', '*'],
          },
          Querystring: {
            type: 'object',
            properties: {
              'list-type': { type: 'string', enum: ['2'] },
            },
            required: ['list-type'],
          },
        },
        operation: 'storage.s3.object.list',
      },
      async () => ({})
    )

    const route = router.routes().get('/:Bucket/*')?.[0]
    expect(route).toBeDefined()

    expect(
      route!.validate({
        Params: { Bucket: 'bucket', '*': 'object' },
        Querystring: { 'list-type': '2' },
      })
    ).toBe(true)
    expect(route!.validate.errors).toBeNull()
  })

  it('precomputes typed route operation names', () => {
    const router = new Router()

    router.get(
      '/:Bucket/*',
      {
        schema: {},
        operation: 'storage.s3.object.get',
        type: 'iceberg',
      },
      async () => ({})
    )

    const route = router.routes().get('/:Bucket/*')?.[0]
    expect(route).toBeDefined()

    expect(route!.operation).toBe('storage.s3.iceberg.object.get')
  })
})

describe('S3ProtocolHandler.parseMetadataHeaders', () => {
  it('returns only x-amz-meta headers without the prefix', () => {
    const handler = createHandler()

    expect(
      handler.parseMetadataHeaders({
        'content-type': 'application/json',
        'x-amz-meta-color': 'blue',
        'x-amz-meta-size': 'large',
      })
    ).toEqual({
      color: 'blue',
      size: 'large',
    })
  })

  it('keeps empty string metadata values', () => {
    const handler = createHandler()

    expect(
      handler.parseMetadataHeaders({
        'x-amz-meta-empty': '',
      })
    ).toEqual({
      empty: '',
    })
  })

  it('returns undefined when there are no metadata headers', () => {
    const handler = createHandler()

    expect(
      handler.parseMetadataHeaders({
        authorization: 'token',
        'content-type': 'application/json',
      })
    ).toBeUndefined()
  })

  it('keeps only string metadata values', () => {
    const handler = createHandler()

    expect(
      handler.parseMetadataHeaders({
        'x-amz-meta-color': 'blue',
        'x-amz-meta-count': 1,
        'x-amz-meta-enabled': true,
        'x-amz-meta-tags': ['a', 'b'],
        'x-amz-meta-config': { mode: 'fast' },
      })
    ).toEqual({
      color: 'blue',
    })
  })

  it('returns undefined when metadata headers are present but none are strings', () => {
    const handler = createHandler()

    expect(
      handler.parseMetadataHeaders({
        'x-amz-meta-count': 1,
        'x-amz-meta-enabled': false,
        'x-amz-meta-tags': ['a', 'b'],
      })
    ).toBeUndefined()
  })
})

describe('CompleteMultipartUpload route mapping', () => {
  it.each([
    ['', false],
    [0, false],
    [1, true],
    ['1', true],
    ['  +1  ', true],
    ['007', true],
    ['Infinity', false],
    ['-Infinity', false],
    ['1e999', false],
    [Infinity, false],
    [-Infinity, false],
    [Number.NaN, false],
    ['9'.repeat(400), false],
    ['   ', false],
    [10_000, true],
    [10_001, false],
  ])('validates body PartNumber %s against the S3 range', (partNumber, expected) => {
    const router = new Router()
    CompleteMultipartUpload(router as unknown as S3Router)

    const route = router
      .routes()
      .get('/:Bucket/*')
      ?.find((candidate) => candidate.method === 'post' && candidate.type === undefined)

    expect(route).toBeDefined()
    const input = {
      Params: { Bucket: 'bucket', '*': 'object' },
      Querystring: { uploadId: 'upload-id' },
      Headers: { authorization: 'authorization' },
      Body: {
        CompleteMultipartUpload: {
          Part: [{ PartNumber: partNumber, ETag: 'etag' }],
        },
      },
    }

    expect(route!.validate(input)).toBe(expected)
    if (expected) {
      expect(input.Body.CompleteMultipartUpload.Part[0].PartNumber).toBe(Number(partNumber))
    }
  })

  it.each([[[2, 1]], [[1, 1]]])('rejects out-of-order parts %j on iceberg routes', async (list) => {
    const router = new Router()
    const completeMultipartUpload = vi.fn()

    CompleteMultipartUpload(router as unknown as S3Router)

    const route = router
      .routes()
      .get('/:Bucket/*')
      ?.find((candidate) => candidate.method === 'post' && candidate.type === 'iceberg')

    expect(route).toBeDefined()

    await expect(
      route!.handler!(
        {
          Params: { Bucket: 'public-bucket', '*': 'folder/object.txt' },
          Querystring: { uploadId: 'upload-id' },
          Body: {
            CompleteMultipartUpload: {
              Part: list.map((n) => ({ PartNumber: n, ETag: 'etag' })),
            },
          },
        } as never,
        {
          req: {
            internalIcebergBucketName: 'iceberg-bucket',
            storage: { backend: { completeMultipartUpload } },
          },
        } as never
      )
    ).rejects.toMatchObject({ code: ErrorCode.InvalidPartOrder, httpStatusCode: 400 })
    expect(completeMultipartUpload).not.toHaveBeenCalled()
  })

  it.each([
    [[1]],
    [[2, 10]],
  ])('completes parts %j and maps ChecksumCRC32C on iceberg routes', async (list) => {
    const router = new Router()
    const parts = list.map((PartNumber) => ({ PartNumber, ETag: `part-etag-${PartNumber}` }))
    const completeMultipartUpload = vi.fn().mockResolvedValue({
      ChecksumCRC32: 'crc32-value',
      ChecksumCRC32C: 'crc32c-value',
      ChecksumSHA1: 'sha1-value',
      ChecksumSHA256: 'sha256-value',
      ETag: 'etag-value',
    })

    CompleteMultipartUpload(router as unknown as S3Router)

    const route = router
      .routes()
      .get('/:Bucket/*')
      ?.find((candidate) => candidate.method === 'post' && candidate.type === 'iceberg')

    expect(route).toBeDefined()

    const response = await route!.handler!(
      {
        Params: {
          Bucket: 'public-bucket',
          '*': 'folder/object.txt',
        },
        Querystring: {
          uploadId: 'upload-id',
        },
        Body: {
          CompleteMultipartUpload: {
            Part: parts,
          },
        },
      } as never,
      {
        req: {
          internalIcebergBucketName: 'iceberg-bucket',
          storage: {
            backend: {
              completeMultipartUpload,
            },
          },
        },
      } as never
    )

    expect(completeMultipartUpload).toHaveBeenCalledWith(
      'iceberg-bucket',
      'folder/object.txt',
      'upload-id',
      '',
      parts
    )
    expect(response).toMatchObject({
      responseBody: {
        CompleteMultipartUploadResult: {
          ChecksumCRC32: 'crc32-value',
          ChecksumCRC32C: 'crc32c-value',
          ChecksumSHA1: 'sha1-value',
          ChecksumSHA256: 'sha256-value',
          ETag: 'etag-value',
        },
      },
    })
  })
})

describe('PutObject route validation', () => {
  it.each([
    { size: 9, error: 'EntityTooSmall' },
    { size: 10, error: undefined },
    { size: 100, error: undefined },
    { size: 101, error: 'EntityTooLarge' },
  ])('enforces the authenticated POST range for $size bytes', async ({ size, error }) => {
    const router = new Router()
    PutObject(router as unknown as S3Router)
    const route = router
      .routes()
      .get('/:Bucket')
      ?.find((candidate) => candidate.method === 'post')
    expect(route?.handler).toBeDefined()

    let uploaded: Buffer | undefined
    vi.spyOn(S3ProtocolHandler.prototype, 'putObject').mockImplementation(async ({ Body }) => {
      uploaded = await buffer(Body as Readable)
      return { headers: { etag: 'test-etag' } }
    })
    const bytes = Buffer.alloc(size)
    const controller = new AbortController()
    const result = route!.handler!(
      { Params: { Bucket: 'bucket' } } as never,
      {
        tenantId: 'tenant-id',
        storage: {
          asSuperUser: () => ({
            findBucket: async () => ({ file_size_limit: 1000 }),
          }),
        },
        req: {
          postPolicyContentLengthRange: Object.freeze({ min: 10, max: 100 }),
          multiPartFileStream: {
            fields: { key: { type: 'field', fieldname: 'key', value: 'object' } },
            file: Readable.from([bytes]),
          },
        },
        signals: { body: controller.signal, response: controller.signal },
      } as never
    )

    if (error) {
      await expect(result).rejects.toMatchObject({ code: error })
      expect(uploaded).toBeUndefined()
    } else {
      await result
      expect(uploaded).toEqual(bytes)
    }
  })

  it.each([
    ['0', true],
    ['Infinity', false],
    ['-Infinity', false],
    ['1e999', false],
  ])('validates content-length %s as a finite integer', (contentLength, expected) => {
    const router = new Router()
    PutObject(router as unknown as S3Router)

    const route = router
      .routes()
      .get('/:Bucket/*')
      ?.find((candidate) => candidate.method === 'put' && candidate.type === undefined)

    expect(route).toBeDefined()
    expect(
      route!.validate({
        Params: { Bucket: 'bucket', '*': 'object' },
        Headers: { 'content-length': contentLength },
      })
    ).toBe(expected)
  })
})

describe('UploadPart route validation', () => {
  it.each([
    [0, false],
    [1, true],
    ['1', true],
    ['Infinity', false],
    ['-Infinity', false],
    ['1e999', false],
    [1.5, false],
    ['1.5', false],
    [10_000, true],
    [10_001, false],
  ])('validates query partNumber %s as an integer within the S3 range', (partNumber, expected) => {
    const router = new Router()
    UploadPart(router as unknown as S3Router)

    const route = router
      .routes()
      .get('/:Bucket/*')
      ?.find((candidate) => candidate.method === 'put' && candidate.type === undefined)

    expect(route).toBeDefined()
    expect(
      route!.validate({
        Params: { Bucket: 'bucket', '*': 'object' },
        Querystring: { uploadId: 'upload-id', partNumber },
      })
    ).toBe(expected)
  })

  it.each([
    'content-length',
    'x-amz-decoded-content-length',
  ])('validates %s as a finite integer', (header) => {
    const router = new Router()
    UploadPart(router as unknown as S3Router)

    const route = router
      .routes()
      .get('/:Bucket/*')
      ?.find((candidate) => candidate.method === 'put' && candidate.type === undefined)

    expect(route).toBeDefined()
    for (const [value, expected] of [
      ['0', true],
      ['Infinity', false],
      ['-Infinity', false],
      ['1e999', false],
    ] as const) {
      expect(
        route!.validate({
          Params: { Bucket: 'bucket', '*': 'object' },
          Querystring: { uploadId: 'upload-id', partNumber: 1 },
          Headers: { [header]: value },
        })
      ).toBe(expected)
    }
  })
})

describe('UploadPartCopy route validation', () => {
  it.each([
    [0, false],
    [1, true],
    ['1', true],
    ['Infinity', false],
    ['-Infinity', false],
    ['1e999', false],
    [1.5, false],
    ['1.5', false],
    [10_000, true],
    [10_001, false],
  ])('validates query partNumber %s as an integer within the S3 range', (partNumber, expected) => {
    const router = new Router()
    UploadPartCopy(router as unknown as S3Router)

    const route = router.routes().get('/:Bucket/*')?.[0]

    expect(route).toBeDefined()
    expect(
      route!.validate({
        Params: { Bucket: 'bucket', '*': 'object' },
        Querystring: { uploadId: 'upload-id', partNumber },
        Headers: { 'x-amz-copy-source': '/source-bucket/source-key' },
      })
    ).toBe(expected)
  })
})

describe('ListParts route validation', () => {
  it.each([
    [0, false],
    [1, true],
    ['1', true],
    ['Infinity', false],
    ['-Infinity', false],
    ['1e999', false],
    [1.5, false],
    ['1.5', false],
    [1_000, true],
    [1_001, false],
  ])('validates max-parts %s as an integer within the S3 range', (maxParts, expected) => {
    const router = new Router()
    ListParts(router as unknown as S3Router)

    const route = router
      .routes()
      .get('/:Bucket/*')
      ?.find((candidate) => candidate.method === 'get' && candidate.type === undefined)

    expect(route).toBeDefined()
    expect(
      route!.validate({
        Params: { Bucket: 'bucket', '*': 'object' },
        Querystring: { uploadId: 'upload-id', 'max-parts': maxParts },
      })
    ).toBe(expected)
  })
})

describe('ListMultipartUploads route validation', () => {
  it.each([
    [0, false],
    [1, true],
    ['Infinity', false],
    ['-Infinity', false],
    ['1e999', false],
    [1.5, false],
    [1_000, true],
    [1_001, false],
  ])('validates max-uploads %s against the S3 range', (maxUploads, expected) => {
    const router = new Router()
    ListMultipartUploads(router as unknown as S3Router)

    const route = router.routes().get('/:Bucket')?.[0]

    expect(route).toBeDefined()
    expect(
      route!.validate({
        Params: { Bucket: 'bucket' },
        Querystring: { uploads: '', 'max-uploads': maxUploads },
      })
    ).toBe(expected)
  })
})

describe.each([
  ['V1', false],
  ['V2', true],
])('ListObjects %s route validation', (_version, isV2) => {
  it.each([
    [-1, false],
    [0, true],
    [1, true],
    ['1', true],
    ['Infinity', false],
    ['-Infinity', false],
    ['1e999', false],
    [1.5, false],
    ['1.5', false],
  ])('validates max-keys %s as a non-negative integer', (maxKeys, expected) => {
    const router = new Router()
    ListObjects(router as unknown as S3Router)

    const route = router
      .routes()
      .get('/:Bucket')
      ?.find((candidate) =>
        isV2
          ? candidate.querystringMatches.some((match) => match.key === 'list-type')
          : candidate.querystringMatches.some((match) => match.key === '*')
      )

    expect(route).toBeDefined()
    expect(
      route!.validate({
        Params: { Bucket: 'bucket' },
        Querystring: {
          ...(isV2 ? { 'list-type': '2' } : {}),
          'max-keys': maxKeys,
        },
      })
    ).toBe(expected)
  })
})

describe('DeleteObject route mapping', () => {
  it.each([
    ['true', []],
    ['false', [{ Key: 'object.txt' }]],
  ])('coerces and forwards Quiet=%s for DeleteObjects requests', async (quiet, deleted) => {
    const { default: DeleteObject } = await import('./commands/delete-object')
    const router = new Router()

    DeleteObject(router as unknown as S3Router)

    const route = router
      .routes()
      .get('/:Bucket')
      ?.find(
        (candidate) =>
          candidate.method === 'post' &&
          candidate.querystringMatches.some((match) => match.key === 'delete')
      )

    expect(route).toBeDefined()

    const request = {
      Params: { Bucket: 'bucket' },
      Querystring: { delete: '' },
      Headers: {},
      Body: {
        Delete: {
          Object: [{ Key: 'object.txt' }],
          Quiet: quiet,
        },
      },
    }

    expect(route!.validate(request)).toBe(true)

    const response = await route!.handler!(request, {
      tenantId: 'tenant-id',
      storage: {
        from: () => ({
          deleteObjects: vi.fn().mockResolvedValue([{ name: 'object.txt' }]),
        }),
        asSuperUser: () => ({
          findBucket: vi.fn(),
          from: () => ({ findObjects: vi.fn() }),
        }),
      },
    } as never)

    expect(response).toEqual({
      responseBody: {
        DeleteResult: {
          Deleted: deleted,
          Error: [],
        },
      },
    })
  })

  it('accepts DeleteObjects payloads at the object request cap in router validation', async () => {
    const { default: DeleteObject } = await import('./commands/delete-object')
    const router = new Router()

    DeleteObject(router as unknown as S3Router)

    const route = router
      .routes()
      .get('/:Bucket')
      ?.find(
        (candidate) =>
          candidate.method === 'post' &&
          candidate.querystringMatches.some((match) => match.key === 'delete')
      )

    expect(route).toBeDefined()

    const validate = route!.validate
    const data = {
      Params: { Bucket: 'bucket' },
      Querystring: { delete: '' },
      Body: {
        Delete: {
          Object: [...Array(MAX_OBJECTS_PER_REQUEST).keys()].map((i) => ({
            Key: `object-${i}`,
          })),
        },
      },
    }

    expect(data.Body.Delete.Object).toHaveLength(MAX_OBJECTS_PER_REQUEST)
    expect(validate(data)).toBe(true)
    expect(validate.errors).toBeNull()
  })

  it('accepts DeleteObjects payloads over the object request cap by default', async () => {
    const { default: DeleteObject } = await import('./commands/delete-object')
    const router = new Router()

    DeleteObject(router as unknown as S3Router)

    const route = router
      .routes()
      .get('/:Bucket')
      ?.find(
        (candidate) =>
          candidate.method === 'post' &&
          candidate.querystringMatches.some((match) => match.key === 'delete')
      )

    expect(route).toBeDefined()

    const validate = route!.validate
    const data = {
      Params: { Bucket: 'bucket' },
      Querystring: { delete: '' },
      Body: {
        Delete: {
          Object: [...Array(MAX_OBJECTS_PER_REQUEST + 1).keys()].map((i) => ({
            Key: `object-${i}`,
          })),
        },
      },
    }

    expect(validate(data)).toBe(true)
    expect(validate.errors).toBeNull()
  })

  it('keeps DeleteObjects router validation tenant-agnostic when hard limits are enabled', async () => {
    const previousHardLimitsEnabled = process.env.REQUEST_HARD_LIMITS_ENABLED
    process.env.REQUEST_HARD_LIMITS_ENABLED = 'true'
    vi.resetModules()

    try {
      const [{ Router: FreshRouter }, { default: DeleteObject }] = await Promise.all([
        import('./router'),
        import('./commands/delete-object'),
      ])
      const router = new FreshRouter()

      DeleteObject(router as unknown as S3Router)

      const route = router
        .routes()
        .get('/:Bucket')
        ?.find(
          (candidate) =>
            candidate.method === 'post' &&
            candidate.querystringMatches.some((match) => match.key === 'delete')
        )

      expect(route).toBeDefined()

      const validate = route!.validate
      const data = {
        Params: { Bucket: 'bucket' },
        Querystring: { delete: '' },
        Body: {
          Delete: {
            Object: [...Array(MAX_OBJECTS_PER_REQUEST + 1).keys()].map((i) => ({
              Key: `object-${i}`,
            })),
          },
        },
      }

      expect(validate(data)).toBe(true)
      expect(validate.errors).toBeNull()
    } finally {
      if (previousHardLimitsEnabled === undefined) {
        delete process.env.REQUEST_HARD_LIMITS_ENABLED
      } else {
        process.env.REQUEST_HARD_LIMITS_ENABLED = previousHardLimitsEnabled
      }
      vi.resetModules()
    }
  })

  it('rejects DeleteObjects payloads over the default cap in the handler when hard limits are enabled', async () => {
    const previousHardLimitsEnabled = process.env.REQUEST_HARD_LIMITS_ENABLED
    const previousMultiTenant = process.env.MULTI_TENANT
    process.env.REQUEST_HARD_LIMITS_ENABLED = 'true'
    process.env.MULTI_TENANT = 'false'
    vi.resetModules()

    try {
      const [{ Router: FreshRouter }, { default: DeleteObject }] = await Promise.all([
        import('./router'),
        import('./commands/delete-object'),
      ])
      const router = new FreshRouter()

      DeleteObject(router as unknown as S3Router)

      const route = router
        .routes()
        .get('/:Bucket')
        ?.find(
          (candidate) =>
            candidate.method === 'post' &&
            candidate.querystringMatches.some((match) => match.key === 'delete')
        )

      expect(route).toBeDefined()

      await expect(
        route!.handler!(
          {
            Params: { Bucket: 'bucket' },
            Querystring: { delete: '' },
            Headers: {},
            Body: {
              Delete: {
                Object: [...Array(MAX_OBJECTS_PER_REQUEST + 1).keys()].map((i) => ({
                  Key: `object-${i}`,
                })),
              },
            },
          },
          {
            tenantId: 'tenant-id',
          } as never
        )
      ).rejects.toMatchObject({
        code: 'InvalidRequest',
        message: `Bulk object requests are limited to ${MAX_OBJECTS_PER_REQUEST} objects per request.`,
      })
    } finally {
      if (previousHardLimitsEnabled === undefined) {
        delete process.env.REQUEST_HARD_LIMITS_ENABLED
      } else {
        process.env.REQUEST_HARD_LIMITS_ENABLED = previousHardLimitsEnabled
      }
      if (previousMultiTenant === undefined) {
        delete process.env.MULTI_TENANT
      } else {
        process.env.MULTI_TENANT = previousMultiTenant
      }
      vi.resetModules()
    }
  })

  it('returns 204 from iceberg single-object deletes', async () => {
    const previousIcebergDeleteEnabled = process.env.ICEBERG_S3_DELETE_ENABLED
    process.env.ICEBERG_S3_DELETE_ENABLED = 'true'
    vi.resetModules()

    try {
      const [{ Router: FreshRouter }, { default: DeleteObject }] = await Promise.all([
        import('./router'),
        import('./commands/delete-object'),
      ])
      const router = new FreshRouter()
      const deleteObject = vi.fn().mockResolvedValue(undefined)

      DeleteObject(router as unknown as S3Router)

      const route = router
        .routes()
        .get('/:Bucket/*')
        ?.find((candidate) => candidate.method === 'delete' && candidate.type === 'iceberg')

      expect(route).toBeDefined()

      const response = await route!.handler!(
        {
          Params: {
            Bucket: 'public-bucket',
            '*': 'metadata/file.avro',
          },
          Querystring: {},
        } as never,
        {
          req: {
            internalIcebergBucketName: 'internal-iceberg-bucket',
            storage: {
              backend: {
                deleteObject,
              },
            },
          },
        } as never
      )

      expect(deleteObject).toHaveBeenCalledWith(
        'internal-iceberg-bucket',
        'metadata/file.avro',
        undefined
      )
      expect(response).toEqual({
        statusCode: 204,
      })
    } finally {
      if (previousIcebergDeleteEnabled === undefined) {
        delete process.env.ICEBERG_S3_DELETE_ENABLED
      } else {
        process.env.ICEBERG_S3_DELETE_ENABLED = previousIcebergDeleteEnabled
      }
      vi.resetModules()
    }
  })
})

describe('S3ProtocolHandler multipart completion regressions', () => {
  it('preserves ChecksumCRC32C when completing multipart uploads', async () => {
    const backend = {
      completeMultipartUpload: vi.fn().mockResolvedValue({
        version: 'version-1',
        ChecksumCRC32: 'crc32-value',
        ChecksumCRC32C: 'crc32c-value',
        ChecksumSHA1: 'sha1-value',
        ChecksumSHA256: 'sha256-value',
        ETag: 'etag-value',
      }),
      headObject: vi.fn().mockResolvedValue({
        cacheControl: '',
        contentLength: 1,
        size: 1,
        mimetype: 'text/plain',
        eTag: 'etag-value',
        lastModified: new Date('2026-04-07T00:00:00.000Z'),
      }),
    }
    const superUserDb = {
      findMultipartUpload: vi.fn().mockResolvedValue({
        version: 'version-1',
        user_metadata: null,
        metadata: null,
        bucket_id: 'bucket',
        key: 'object.txt',
      }),
      deleteMultipartUpload: vi.fn().mockResolvedValue(undefined),
    }
    const storage = {
      backend,
      db: {
        asSuperUser: vi.fn(() => superUserDb),
      },
      location: {
        getKeyLocation: vi.fn().mockReturnValue('tenant-id/bucket/object.txt'),
      },
    }

    const completeUploadResult = {} as Awaited<ReturnType<Uploader['completeUpload']>>

    vi.spyOn(Uploader.prototype, 'canUpload').mockResolvedValue(undefined)
    vi.spyOn(Uploader.prototype, 'completeUpload').mockResolvedValue(completeUploadResult)

    const handler = new S3ProtocolHandler(storage as never, 'tenant-id', 'owner-id')
    const response = await handler.completeMultiPartUpload({
      Bucket: 'bucket',
      Key: 'object.txt',
      UploadId: 'upload-id',
      MultipartUpload: {
        Parts: [{ PartNumber: 1, ETag: 'part-etag' }],
      },
    })

    expect(response).toMatchObject({
      responseBody: {
        CompleteMultipartUploadResult: {
          ChecksumCRC32: 'crc32-value',
          ChecksumCRC32C: 'crc32c-value',
          ChecksumSHA1: 'sha1-value',
          ChecksumSHA256: 'sha256-value',
          ETag: 'etag-value',
        },
      },
    })
  })
})

describe('S3ProtocolHandler headObject validation', () => {
  it('reports Key as the missing parameter for headObject', async () => {
    const handler = new S3ProtocolHandler({} as never, 'tenant-id')
    const missingKeyCommand = { Bucket: 'bucket' } as Parameters<S3ProtocolHandler['headObject']>[0]

    await expect(handler.headObject(missingKeyCommand)).rejects.toMatchObject({
      message: 'Missing Required Parameter Key',
    })
  })

  it('reports Key as the missing parameter for dbHeadObject', async () => {
    const handler = new S3ProtocolHandler({} as never, 'tenant-id')
    const missingKeyCommand = {
      Bucket: 'bucket',
    } as Parameters<S3ProtocolHandler['dbHeadObject']>[0]

    await expect(handler.dbHeadObject(missingKeyCommand)).rejects.toMatchObject({
      message: 'Missing Required Parameter Key',
    })
  })
})
