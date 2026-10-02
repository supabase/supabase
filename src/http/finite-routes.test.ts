import fastify, { type FastifyInstance, type InjectOptions } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import { setErrorHandler } from './error-handler'
import { withFiniteAjv } from './finite'
import createBucket from './routes/bucket/createBucket'
import getAllBuckets from './routes/bucket/getAllBuckets'
import bucketLifecycle from './routes/bucket/lifecycle'
import updateBucket from './routes/bucket/updateBucket'
import icebergBuckets from './routes/iceberg/bucket'
import icebergNamespaces from './routes/iceberg/namespace'
import icebergTables from './routes/iceberg/table'
import getSignedURL from './routes/object/getSignedURL'
import getSignedURLs from './routes/object/getSignedURLs'
import listObjects from './routes/object/listObjects'
import listObjectsV2 from './routes/object/listObjectsV2'
import renderPublicImage from './routes/render/renderPublicImage'
import { authSchema, errorSchema } from './schemas'

type RoutePlugin = (fastify: FastifyInstance) => Promise<void>

type JsonContainer = Record<string | number, unknown>

function withValueAtPath<T>(source: T, path: readonly (string | number)[], value: unknown): T {
  if (path.length === 0) {
    throw new Error('Expected a non-empty JSON path')
  }

  const clone = structuredClone(source)
  let target = clone as JsonContainer

  for (const segment of path.slice(0, -1)) {
    target = target[segment] as JsonContainer
  }

  target[path[path.length - 1]] = value
  return clone
}

const createTablePayload = {
  name: 'events',
  schema: {
    type: 'struct',
    fields: [
      { id: 1, name: 'id', type: 'long', required: true },
      {
        id: 2,
        name: 'tags',
        type: {
          type: 'list',
          'element-id': 3,
          element: 'string',
          'element-required': false,
        },
        required: false,
      },
      {
        id: 4,
        name: 'attributes',
        type: {
          type: 'map',
          'key-id': 5,
          key: 'string',
          'value-id': 6,
          value: 'string',
          'value-required': false,
        },
        required: false,
      },
    ],
    'schema-id': 7,
    'identifier-field-ids': [1],
  },
  spec: {
    'spec-id': 8,
    fields: [{ 'field-id': 9, 'source-id': 1, name: 'id', transform: 'identity' }],
  },
  'write-order': {
    'order-id': 10,
    fields: [
      {
        'source-id': 1,
        transform: 'identity',
        direction: 'asc',
        'null-order': 'nulls-first',
      },
    ],
  },
} as const

const createTableIntegerPaths = [
  ['schema', 'fields', 0, 'id'],
  ['schema', 'fields', 1, 'type', 'element-id'],
  ['schema', 'fields', 2, 'type', 'key-id'],
  ['schema', 'fields', 2, 'type', 'value-id'],
  ['schema', 'schema-id'],
  ['schema', 'identifier-field-ids', 0],
  ['spec', 'spec-id'],
  ['spec', 'fields', 0, 'field-id'],
  ['spec', 'fields', 0, 'source-id'],
  ['write-order', 'order-id'],
  ['write-order', 'fields', 0, 'source-id'],
] as const

const commitTablePayload = {
  requirements: [],
  updates: [
    {
      action: 'add-snapshot',
      snapshot: {
        'sequence-number': 1,
        'timestamp-ms': 2,
        'schema-id': 3,
      },
    },
  ],
} as const

const commitTableIntegerPaths = [
  ['updates', 0, 'snapshot', 'sequence-number'],
  ['updates', 0, 'snapshot', 'timestamp-ms'],
  ['updates', 0, 'snapshot', 'schema-id'],
] as const

const cases: Array<{
  name: string
  plugin: RoutePlugin
  request: InjectOptions
  expectedMessage?: string
}> = [
  {
    name: 'bucket list limit query',
    plugin: getAllBuckets,
    request: { method: 'GET', url: '/?limit=Infinity' },
  },
  {
    name: 'bucket list offset query',
    plugin: getAllBuckets,
    request: { method: 'GET', url: '/?offset=1e999' },
  },
  {
    name: 'object list limit body',
    plugin: listObjects,
    request: {
      method: 'POST',
      url: '/list/avatars',
      payload: { prefix: '', limit: '-Infinity' },
    },
  },
  {
    name: 'object list offset body',
    plugin: listObjects,
    request: {
      method: 'POST',
      url: '/list/avatars',
      payload: { prefix: '', offset: '1e999' },
    },
  },
  {
    name: 'object list-v2 limit body',
    plugin: listObjectsV2,
    request: {
      method: 'POST',
      url: '/list-v2/avatars',
      payload: { prefix: '', limit: '1e999' },
    },
  },
  {
    name: 'signed URL expiration body',
    plugin: getSignedURL,
    request: {
      method: 'POST',
      url: '/sign/avatars/cat.png',
      payload: { expiresIn: 'Infinity' },
    },
  },
  {
    name: 'batch signed URL expiration body',
    plugin: getSignedURLs,
    request: {
      method: 'POST',
      url: '/sign/avatars',
      payload: { expiresIn: '-Infinity', paths: ['cat.png'] },
    },
  },
  {
    name: 'image transformation height query',
    plugin: renderPublicImage,
    request: { method: 'GET', url: '/public/avatars/cat.png?height=Infinity' },
  },
  {
    name: 'image transformation width query',
    plugin: renderPublicImage,
    request: { method: 'GET', url: '/public/avatars/cat.png?width=1e999' },
  },
  {
    name: 'image transformation quality query',
    plugin: renderPublicImage,
    request: { method: 'GET', url: '/public/avatars/cat.png?quality=1e999' },
  },
  {
    name: 'image transformation x offset query',
    plugin: renderPublicImage,
    request: { method: 'GET', url: '/public/avatars/cat.png?x_offset=Infinity' },
  },
  {
    name: 'image transformation y offset query',
    plugin: renderPublicImage,
    request: { method: 'GET', url: '/public/avatars/cat.png?y_offset=-Infinity' },
  },
  {
    name: 'bucket lifecycle noncurrent days body',
    plugin: bucketLifecycle,
    expectedMessage: 'must be integer',
    request: {
      method: 'PUT',
      url: '/avatars/lifecycle',
      payload: {
        rules: [
          {
            status: 'Enabled',
            filter: {},
            noncurrentVersionExpiration: { noncurrentDays: 'Infinity' },
          },
        ],
      },
    },
  },
  {
    name: 'bucket lifecycle newer noncurrent versions body',
    plugin: bucketLifecycle,
    expectedMessage: 'must be integer',
    request: {
      method: 'PUT',
      url: '/avatars/lifecycle',
      payload: {
        rules: [
          {
            status: 'Enabled',
            filter: {},
            noncurrentVersionExpiration: {
              noncurrentDays: 1,
              newerNoncurrentVersions: '1e999',
            },
          },
        ],
      },
    },
  },
  {
    name: 'Iceberg bucket offset query',
    plugin: icebergBuckets,
    request: { method: 'GET', url: '/bucket?offset=-Infinity' },
  },
  {
    name: 'Iceberg bucket limit query',
    plugin: icebergBuckets,
    request: { method: 'GET', url: '/bucket?limit=1e999' },
  },
  {
    name: 'Iceberg namespace page size query',
    plugin: icebergNamespaces,
    request: { method: 'GET', url: '/warehouse/namespaces?pageSize=1e999' },
  },
  {
    name: 'Iceberg table page size query',
    plugin: icebergTables,
    request: {
      method: 'GET',
      url: '/warehouse/namespaces/default/tables?pageSize=Infinity',
    },
  },
  ...createTableIntegerPaths.map((path) => ({
    name: `Iceberg create-table ${path.join('.')} body`,
    plugin: icebergTables,
    request: {
      method: 'POST' as const,
      url: '/warehouse/namespaces/default/tables',
      payload: withValueAtPath(createTablePayload, path, 'Infinity'),
    },
  })),
  ...commitTableIntegerPaths.map((path) => ({
    name: `Iceberg commit-table ${path.join('.')} body`,
    plugin: icebergTables,
    request: {
      method: 'POST' as const,
      url: '/warehouse/namespaces/default/tables/events',
      payload: withValueAtPath(commitTablePayload, path, '1e999'),
    },
  })),
]

describe('finite route schemas', () => {
  it.each(cases)('rejects non-finite input for $name', async ({
    plugin,
    request,
    expectedMessage = 'finite',
  }) => {
    const app = fastify(withFiniteAjv({}))
    app.addSchema(authSchema)
    app.addSchema(errorSchema)
    app.register(plugin)
    setErrorHandler(app)

    try {
      const response = await app.inject({
        ...request,
        headers: { authorization: 'Bearer test', ...request.headers },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().message).toContain(expectedMessage)
    } finally {
      await app.close()
    }
  })

  describe('image focal-point gravity', () => {
    it.each([
      ['missing both coordinates', 'gravity=fp'],
      ['missing y coordinate', 'gravity=fp&x_offset=0.5'],
      ['x coordinate below zero', 'gravity=fp&x_offset=-0.1&y_offset=0.5'],
      ['y coordinate above one', 'gravity=fp&x_offset=0.5&y_offset=1.1'],
    ])('rejects %s before entering the route handler', async (_name, query) => {
      const app = fastify(withFiniteAjv({}))
      app.addSchema(authSchema)
      app.addSchema(errorSchema)
      app.register(renderPublicImage)
      setErrorHandler(app)

      try {
        const response = await app.inject({
          method: 'GET',
          url: `/public/avatars/cat.png?${query}`,
          headers: { authorization: 'Bearer test' },
        })

        expect(response.statusCode).toBe(400)
        expect(response.json().message).toContain('querystring')
      } finally {
        await app.close()
      }
    })
  })

  describe.each([
    {
      name: 'create bucket',
      plugin: createBucket,
      operation: 'createBucket' as const,
      request: (fileSizeLimit: unknown): InjectOptions => ({
        method: 'POST',
        url: '/',
        payload: { name: 'avatars', file_size_limit: fileSizeLimit },
      }),
    },
    {
      name: 'update bucket',
      plugin: updateBucket,
      operation: 'updateBucket' as const,
      request: (fileSizeLimit: unknown): InjectOptions => ({
        method: 'PUT',
        url: '/avatars',
        payload: { file_size_limit: fileSizeLimit },
      }),
    },
  ])('$name file_size_limit', ({ plugin, operation, request }) => {
    async function inject(fileSizeLimit: unknown) {
      const storage = {
        createBucket: vi.fn().mockResolvedValue(undefined),
        updateBucket: vi.fn().mockResolvedValue(undefined),
      }
      const app = fastify(withFiniteAjv({}))
      app.decorateRequest('owner')
      app.decorateRequest('storage')
      app.addHook('preHandler', async (routeRequest) => {
        routeRequest.owner = 'owner-id'
        routeRequest.storage = storage as never
      })
      app.addSchema(authSchema)
      app.addSchema(errorSchema)
      app.register(plugin)
      setErrorHandler(app)

      try {
        const response = await app.inject({
          ...request(fileSizeLimit),
          headers: { authorization: 'Bearer test' },
        })

        return { response, storage }
      } finally {
        await app.close()
      }
    }

    it.each([
      [1000, 1000],
      ['100MB', '100MB'],
      ['10kb', '10kb'],
      ['1.5GB', '1.5GB'],
      [null, null],
    ])('accepts %j without changing its meaning', async (input, expected) => {
      const { response, storage } = await inject(input)

      expect(response.statusCode).toBe(200)
      const call = storage[operation].mock.calls[0]
      const options = operation === 'createBucket' ? call[0] : call[1]
      expect(options).toEqual(expect.objectContaining({ fileSizeLimit: expected }))
    })

    it.each([
      'Infinity',
      '1e999',
    ])('rejects %s instead of silently passing null to the handler', async (input) => {
      const { response, storage } = await inject(input)

      expect(response.statusCode).toBe(400)
      expect(response.json().message).toContain('finite')
      expect(storage.createBucket).not.toHaveBeenCalled()
      expect(storage.updateBucket).not.toHaveBeenCalled()
    })
  })

  describe.each([
    {
      name: 'Iceberg namespace',
      plugin: icebergNamespaces,
      url: '/warehouse/namespaces',
      method: 'listNamespaces' as const,
      expectedPageSize: (pageSize: number) => pageSize || 100,
    },
    {
      name: 'Iceberg table',
      plugin: icebergTables,
      url: '/warehouse/namespaces/default/tables',
      method: 'listTables' as const,
      expectedPageSize: (pageSize: number) => pageSize,
    },
  ])('$name pageSize', ({ plugin, url, method, expectedPageSize }) => {
    async function inject(pageSize: string) {
      const catalog = {
        listNamespaces: vi.fn().mockResolvedValue({ namespaces: [] }),
        listTables: vi.fn().mockResolvedValue({ identifiers: [] }),
      }
      const app = fastify(withFiniteAjv({}))
      app.decorateRequest('icebergCatalog')
      app.addHook('preHandler', async (request) => {
        request.icebergCatalog = catalog as never
      })
      app.register(plugin)
      setErrorHandler(app)

      try {
        const response = await app.inject({ method: 'GET', url: `${url}?pageSize=${pageSize}` })

        return { catalog, response }
      } finally {
        await app.close()
      }
    }

    it.each(['0', '1'])('accepts pageSize=%s', async (pageSize) => {
      const { catalog, response } = await inject(pageSize)

      expect(response.statusCode).toBe(200)
      expect(catalog[method]).toHaveBeenCalledWith(
        expect.objectContaining({ pageSize: expectedPageSize(Number(pageSize)) })
      )
    })

    it.each(['1.5', '-1'])('rejects pageSize=%s', async (pageSize) => {
      const { catalog, response } = await inject(pageSize)

      expect(response.statusCode).toBe(400)
      expect(response.json().message).toContain('pageSize')
      expect(catalog[method]).not.toHaveBeenCalled()
    })
  })
})
