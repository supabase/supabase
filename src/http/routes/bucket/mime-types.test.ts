import { ErrorCode } from '@internal/errors'
import type { Database } from '@storage/database'
import type { Bucket } from '@storage/schemas'
import { Storage } from '@storage/storage'
import fastify from 'fastify'
import { setErrorHandler } from '../../error-handler'
import { withFiniteAjv } from '../../finite'
import { authSchema, errorSchema } from '../../schemas'
import createBucket from './createBucket'
import getBucket from './getBucket'
import updateBucket from './updateBucket'

async function createApp() {
  let bucket: Bucket = {
    id: 'mime-bucket',
    name: 'mime-bucket',
    public: false,
    allowed_mime_types: ['image/png'],
  }
  const db: Partial<Database> = {
    createBucket: async (data: Parameters<Database['createBucket']>[0]) => {
      bucket = { ...bucket, ...data }
      return { id: bucket.id }
    },
    updateBucket: async (_id: string, data: Parameters<Database['updateBucket']>[1]) => {
      const previous = bucket
      const fields = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined)
      )
      bucket = { ...bucket, ...fields }
      return { previous }
    },
    findBucketById: vi.fn().mockImplementation(async () => bucket),
  }
  const storage = new Storage({} as never, db as Database, {} as never)
  const app = fastify(withFiniteAjv({}))
  app.addSchema(authSchema)
  app.addSchema(errorSchema)
  app.addHook('onRequest', async (request) => {
    request.storage = storage
  })
  setErrorHandler(app)
  await app.register(createBucket)
  await app.register(updateBucket)
  await app.register(getBucket)
  return app
}

describe.each(['POST', 'PUT'] as const)('bucket MIME configuration through %s', (method) => {
  it('stores normalized base types and removes duplicate restrictions', async () => {
    const app = await createApp()
    try {
      const response = await app.inject({
        method,
        url: method === 'POST' ? '/' : '/mime-bucket',
        headers: { authorization: 'Bearer test' },
        payload: {
          name: 'mime-bucket',
          allowed_mime_types: [
            ' Text/Plain; charset="UTF-8" ',
            'text/plain;charset=iso-8859-1',
            'IMAGE/*',
            'image/*',
            'application/json;profile="a,b;c"',
          ],
        },
      })
      expect(response.statusCode, response.body).toBe(200)
      const stored = await app.inject({
        method: 'GET',
        url: '/mime-bucket',
        headers: { authorization: 'Bearer test' },
      })
      expect(stored.statusCode, stored.body).toBe(200)
      expect(stored.json().allowed_mime_types).toEqual([
        'text/plain',
        'image/*',
        'application/json',
      ])
    } finally {
      await app.close()
    }
  })

  it.each([
    'garbage*',
    '*/*',
    '*/png',
    'image/p*',
    'image/*/extra',
    'image/png/extra',
    'image/png;foo=x, application/pdf',
    `image/png;note=${'a'.repeat(1000)}`,
  ])('rejects an invalid restriction %j', async (value) => {
    const app = await createApp()
    try {
      const response = await app.inject({
        method,
        url: method === 'POST' ? '/' : '/mime-bucket',
        headers: { authorization: 'Bearer test' },
        payload: { name: 'mime-bucket', allowed_mime_types: [value] },
      })
      expect(response.statusCode, response.body).toBe(400)
      expect(response.json().code).toBe(ErrorCode.InvalidMimeType)
    } finally {
      await app.close()
    }
  })

  it.each([null, []])('preserves an unrestricted configuration %j', async (allowedMimeTypes) => {
    const app = await createApp()
    try {
      const response = await app.inject({
        method,
        url: method === 'POST' ? '/' : '/mime-bucket',
        headers: { authorization: 'Bearer test' },
        payload: { name: 'mime-bucket', allowed_mime_types: allowedMimeTypes },
      })
      expect(response.statusCode, response.body).toBe(200)
      const stored = await app.inject({
        method: 'GET',
        url: '/mime-bucket',
        headers: { authorization: 'Bearer test' },
      })
      expect(stored.json().allowed_mime_types).toEqual(allowedMimeTypes)
    } finally {
      await app.close()
    }
  })
})

it('preserves existing restrictions when an update omits allowed_mime_types', async () => {
  const app = await createApp()
  try {
    const response = await app.inject({
      method: 'PUT',
      url: '/mime-bucket',
      headers: { authorization: 'Bearer test' },
      payload: { public: true },
    })
    expect(response.statusCode, response.body).toBe(200)
    const stored = await app.inject({
      method: 'GET',
      url: '/mime-bucket',
      headers: { authorization: 'Bearer test' },
    })
    expect(stored.json().allowed_mime_types).toEqual(['image/png'])
  } finally {
    await app.close()
  }
})
