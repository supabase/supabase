import { getPostgresConnection, getServiceKeyUser } from '@internal/database'
import { ErrorCode } from '@internal/errors'
import { StoragePgDB } from '@storage/database'
import { PurgeCdnCache } from '@storage/events'
import { randomUUID } from 'crypto'
import dotenv from 'dotenv'
import { FastifyInstance } from 'fastify'
import app from '../app'
import { getConfig } from '../config'
import { S3Backend } from '../storage/backend'

dotenv.config({ path: '.env.test' })
const anonKey = process.env.ANON_KEY || ''
const authenticatedKey = process.env.AUTHENTICATED_KEY || ''
const serviceKey = process.env.SERVICE_KEY || ''
const { tenantId } = getConfig()

let appInstance: FastifyInstance
let adminDb: StoragePgDB

beforeAll(async () => {
  vi.spyOn(S3Backend.prototype, 'deleteObjects').mockImplementation(() => {
    return Promise.resolve()
  })

  vi.spyOn(S3Backend.prototype, 'getObject').mockImplementation(() => {
    return Promise.resolve({
      metadata: {
        httpStatusCode: 200,
        size: 3746,
        mimetype: 'image/png',
        lastModified: new Date('Thu, 12 Aug 2021 16:00:00 GMT'),
        eTag: 'abc',
        cacheControl: 'no-cache',
        contentLength: 3746,
      },
      httpStatusCode: 200,
      body: Buffer.from(''),
    })
  })

  const serviceKeyUser = await getServiceKeyUser(tenantId)
  const pg = await getPostgresConnection({
    superUser: serviceKeyUser,
    user: serviceKeyUser,
    tenantId,
    host: 'localhost',
  })

  adminDb = new StoragePgDB(pg, {
    host: 'localhost',
    tenantId,
  })
})

beforeEach(() => {
  vi.clearAllMocks()
  appInstance = app()
})

afterEach(async () => {
  await appInstance.close()
})

afterAll(async () => {
  adminDb.destroyConnection()
})

async function createBucket(name: string, authorization = authenticatedKey) {
  const response = await appInstance.inject({
    method: 'POST',
    url: '/bucket',
    headers: {
      authorization: `Bearer ${authorization}`,
    },
    payload: {
      name,
    },
  })

  expect(response.statusCode).toBe(200)
  expect(response.json()).toEqual({
    name,
  })
}

async function seedObjects(bucketId: string, objectNames: string[]) {
  await Promise.all(
    objectNames.map((name) =>
      adminDb.createObject({
        name,
        owner: randomUUID(),
        bucket_id: bucketId,
        metadata: { size: 1 },
        user_metadata: null,
        version: undefined,
      })
    )
  )
}

async function cleanupBucket(bucketId: string, objectNames: string[] = []) {
  if (objectNames.length > 0) {
    await adminDb.deleteObjects(bucketId, objectNames, 'name')
  }

  await adminDb.deleteBucket(bucketId)
}

/*
 * GET /bucket/:id
 */
// @todo add RLS tests for buckets
describe('testing GET bucket', () => {
  test('user is able to get bucket details', async () => {
    const bucketId = 'bucket2'
    const response = await appInstance.inject({
      method: 'GET',
      url: `/bucket/${bucketId}`,
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(200)
    const responseJSON = JSON.parse(response.body)
    expect(responseJSON).toMatchObject({
      id: bucketId,
      name: bucketId,
      public: false,
      file_size_limit: null,
      allowed_mime_types: null,
    })
  })

  test('checking RLS: anon user is not able to get bucket details', async () => {
    const bucketId = 'bucket2'
    const response = await appInstance.inject({
      method: 'GET',
      url: `/bucket/${bucketId}`,
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('user is not able to get bucket details without Auth header', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: '/bucket/bucket2',
    })
    expect(response.statusCode).toBe(400)
  })

  test('return 404 when reading a non existent bucket', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: '/object/notfound',
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
    })
    expect(response.statusCode).toBe(404)
  })
})

/*
 * GET /bucket
 */
describe('testing GET all buckets', () => {
  test('user is able to get all buckets', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: `/bucket`,
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(200)
    const responseJSON = JSON.parse(response.body)
    expect(responseJSON.length).toBeGreaterThanOrEqual(10)
    expect(responseJSON[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      type: expect.any(String),
      public: expect.any(Boolean),
      file_size_limit: null,
      allowed_mime_types: null,
    })
  })

  for (const [headers, shouldIncludeType] of [
    [
      { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/138.0.0.0 Safari/537.36' },
      true,
    ],
    // storage-py (storage3) >= 0.12.1
    [{ 'user-agent': 'supabase-py/storage3 v0.11.9' }, false],
    [{ 'user-agent': 'supabase-py/storage3 v0.12.0' }, false],
    [{ 'user-agent': 'supabase-py/storage3 v0.12.1' }, true],
    [{ 'user-agent': 'supabase-py/storage3 v0.12.2' }, true],
    [{ 'user-agent': 'supabase-py/storage3 v0.13.0' }, true],
    [{ 'user-agent': 'supabase-py/storage3 v1.0.0' }, true],
    // supabase-py >= 2.18.0
    [{ 'x-client-info': 'supabase-py/2.17.3' }, false],
    [{ 'x-client-info': 'supabase-py/2.18.0' }, true],
    [{ 'x-client-info': 'supabase-py/2.18.1' }, true],
    [{ 'x-client-info': 'supabase-py/2.19.0' }, true],
  ]) {
    test(`Should ${shouldIncludeType ? '' : 'NOT '}include type for ${JSON.stringify(
      headers
    )} client`, async () => {
      const response = await appInstance.inject({
        method: 'GET',
        url: `/bucket`,
        headers: {
          authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
          ...(headers as Record<string, string>),
        },
      })
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body[0].type).toBe(shouldIncludeType ? 'STANDARD' : undefined)
    })
  }

  test('checking RLS: anon user is not able to get all buckets', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: `/bucket`,
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
    })
    expect(response.statusCode).toBe(200)
    const responseJSON = JSON.parse(response.body)
    expect(responseJSON.length).toBe(0)
  })

  test('user is not able to all buckets details without Auth header', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: `/bucket`,
    })
    expect(response.statusCode).toBe(400)
  })

  test('user is able to get buckets with limit, offset, search and sorting', async () => {
    const prefix = `list-bucket-${randomUUID()}`
    const bucketIds = ['a', 'b', 'c', 'd'].map((suffix) => `${prefix}-${suffix}`)

    try {
      for (const bucketId of bucketIds) {
        await createBucket(bucketId)
      }

      const response = await appInstance.inject({
        method: 'GET',
        url: `/bucket?limit=1&offset=3&sortColumn=name&sortOrder=asc&search=${encodeURIComponent(
          prefix
        )}`,
        headers: {
          authorization: `Bearer ${authenticatedKey}`,
        },
      })
      expect(response.statusCode).toBe(200)
      const responseJSON = response.json()
      expect(responseJSON).toHaveLength(1)
      expect(responseJSON[0]).toMatchObject({
        id: bucketIds[3],
        name: bucketIds[3],
        type: expect.any(String),
        public: false,
        file_size_limit: null,
        allowed_mime_types: null,
      })
    } finally {
      await Promise.all(bucketIds.map((bucketId) => cleanupBucket(bucketId)))
    }
  })

  test('limit=0 returns 400', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: `/bucket?limit=0`,
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('offset=-1 returns 400', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: `/bucket?offset=-1`,
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(400)
  })
})

/*
 * POST /bucket
 */
describe('testing POST bucket', () => {
  test('user is able to create a bucket', async () => {
    const bucketId = `newbucket-${randomUUID()}`

    try {
      const response = await appInstance.inject({
        method: 'POST',
        url: `/bucket`,
        headers: {
          authorization: `Bearer ${authenticatedKey}`,
        },
        payload: {
          name: bucketId,
        },
      })
      expect(response.statusCode).toBe(200)
      const responseJSON = response.json()
      expect(responseJSON.name).toBe(bucketId)
    } finally {
      await cleanupBucket(bucketId)
    }
  })

  test('user is not able to create a bucket with a /', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: `/bucket`,
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        name: 'newbucket/test',
      },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      error: 'Invalid Input',
      message: 'Bucket name invalid',
      statusCode: '400',
      code: ErrorCode.InvalidBucketName,
    })
  })

  test('checking RLS: anon user is not able to create a bucket', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: `/bucket`,
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
      payload: {
        name: 'newbucket1',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('user is not able to create a bucket without Auth header', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: `/bucket`,
      payload: {
        name: 'newbucket1',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('user is not able to create a bucket with the same name', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: `/bucket`,
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        name: 'bucket2',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('user is not able to create a bucket with a name longer than 100 characters', async () => {
    const longBucketName = 'a'.repeat(101)
    const response = await appInstance.inject({
      method: 'POST',
      url: `/bucket`,
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        name: longBucketName,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('user is not able to create a bucket with the leading and trailing spaces', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: `/bucket`,
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        name: ' startsWithSpace',
      },
    })
    expect(response.statusCode).toBe(400)
    const { statusCode, error } = await response.json()
    expect(statusCode).toBe('400')
    expect(error).toBe('Invalid Input')
  })
})

/*
 * PUT /bucket
 */
describe('testing public bucket functionality', () => {
  test('user is able to make a bucket public and private', async () => {
    const bucketId = 'public-bucket'
    const sendSpy = vi.spyOn(PurgeCdnCache, 'send').mockResolvedValue(undefined)
    const makePublicResponse = await appInstance.inject({
      method: 'PUT',
      url: `/bucket/${bucketId}`,
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        public: true,
      },
    })
    expect(makePublicResponse.statusCode).toBe(200)
    const makePublicJSON = JSON.parse(makePublicResponse.body)
    expect(makePublicJSON.message).toBe('Successfully updated')
    expect(sendSpy).not.toHaveBeenCalled()

    const publicResponse = await appInstance.inject({
      method: 'GET',
      url: `/object/public/public-bucket/favicon.ico`,
    })
    expect(publicResponse.statusCode).toBe(200)
    expect(publicResponse.headers['x-robots-tag']).toBe('none')
    expect(publicResponse.headers['etag']).toBe('abc')
    expect(publicResponse.headers['last-modified']).toBe('Thu, 12 Aug 2021 16:00:00 GMT')

    const mockGetObject = vi.spyOn(S3Backend.prototype, 'getObject')
    mockGetObject.mockRejectedValue({
      $metadata: {
        httpStatusCode: 304,
      },
    })
    const notModifiedResponse = await appInstance.inject({
      method: 'GET',
      url: `/object/public/public-bucket/favicon.ico`,
      headers: {
        'if-modified-since': 'Thu, 12 Aug 2021 16:00:00 GMT',
        'if-none-match': 'abc',
      },
    })
    expect(notModifiedResponse.statusCode).toBe(304)
    expect(mockGetObject.mock.calls[1][3]).toMatchObject({
      ifModifiedSince: 'Thu, 12 Aug 2021 16:00:00 GMT',
      ifNoneMatch: 'abc',
    })

    const makePrivateResponse = await appInstance.inject({
      method: 'PUT',
      url: `/bucket/${bucketId}`,
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        public: false,
      },
    })
    expect(makePrivateResponse.statusCode).toBe(200)
    const makePrivateJSON = JSON.parse(makePrivateResponse.body)
    expect(makePrivateJSON.message).toBe('Successfully updated')
    expect(sendSpy).toHaveBeenCalledTimes(1)
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        purgeOptions: {
          type: 'bucket',
          bucket: bucketId,
          tenant: tenantId,
        },
      })
    )
    sendSpy.mockRestore()

    const privateResponse = await appInstance.inject({
      method: 'GET',
      url: `/object/public/public-bucket/favicon.ico`,
    })
    expect(privateResponse.statusCode).toBe(400)
  })

  test('does not purge the CDN cache when making a private bucket public', async () => {
    const bucketId = `no-purge-make-public-${randomUUID()}`
    const sendSpy = vi.spyOn(PurgeCdnCache, 'send')

    try {
      await createBucket(bucketId)

      const response = await appInstance.inject({
        method: 'PUT',
        url: `/bucket/${bucketId}`,
        headers: {
          authorization: `Bearer ${authenticatedKey}`,
        },
        payload: {
          public: true,
        },
      })
      expect(response.statusCode).toBe(200)
      expect(sendSpy).not.toHaveBeenCalled()
    } finally {
      sendSpy.mockRestore()
      await cleanupBucket(bucketId)
    }
  })

  test('does not purge the CDN cache when updating a bucket without changing public', async () => {
    const bucketId = `no-purge-unrelated-update-${randomUUID()}`
    const sendSpy = vi.spyOn(PurgeCdnCache, 'send')

    try {
      await createBucket(bucketId)

      const response = await appInstance.inject({
        method: 'PUT',
        url: `/bucket/${bucketId}`,
        headers: {
          authorization: `Bearer ${authenticatedKey}`,
        },
        payload: {
          file_size_limit: 1000,
        },
      })
      expect(response.statusCode).toBe(200)
      expect(sendSpy).not.toHaveBeenCalled()
    } finally {
      sendSpy.mockRestore()
      await cleanupBucket(bucketId)
    }
  })

  test('bucket update succeeds even if purging the CDN cache fails', async () => {
    const bucketId = `update-bucket-purge-fails-${randomUUID()}`
    const sendSpy = vi
      .spyOn(PurgeCdnCache, 'send')
      .mockRejectedValueOnce(new Error('purge event failed'))

    try {
      await createBucket(bucketId)

      const makePublicResponse = await appInstance.inject({
        method: 'PUT',
        url: `/bucket/${bucketId}`,
        headers: {
          authorization: `Bearer ${authenticatedKey}`,
        },
        payload: {
          public: true,
        },
      })
      expect(makePublicResponse.statusCode).toBe(200)

      const makePrivateResponse = await appInstance.inject({
        method: 'PUT',
        url: `/bucket/${bucketId}`,
        headers: {
          authorization: `Bearer ${authenticatedKey}`,
        },
        payload: {
          public: false,
        },
      })
      expect(makePrivateResponse.statusCode).toBe(200)
      const responseJSON = JSON.parse(makePrivateResponse.body)
      expect(responseJSON.message).toBe('Successfully updated')
      expect(sendSpy).toHaveBeenCalledTimes(1)
    } finally {
      sendSpy.mockRestore()
      await cleanupBucket(bucketId)
    }
  })

  test('checking RLS: anon user is not able to update a bucket', async () => {
    const bucketId = 'public-bucket'
    const response = await appInstance.inject({
      method: 'PUT',
      url: `/bucket/${bucketId}`,
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
      payload: {
        public: true,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('user is not able to update a bucket without a auth header', async () => {
    const bucketId = 'public-bucket'
    const response = await appInstance.inject({
      method: 'PUT',
      url: `/bucket/${bucketId}`,
      payload: {
        public: true,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('user is not able to update a non-existent bucket', async () => {
    const bucketId = 'notfound'
    const response = await appInstance.inject({
      method: 'PUT',
      url: `/bucket/${bucketId}`,
      payload: {
        public: true,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('user is not able to update a bucket with empty payload', async () => {
    const bucketId = 'public-bucket'
    const response = await appInstance.inject({
      method: 'PUT',
      url: `/bucket/${bucketId}`,
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {},
    })
    expect(response.statusCode).toBe(400)
  })
})

describe('testing count objects in bucket', () => {
  const { tenantId } = getConfig()
  const testObjectCount = 27
  const testOwnerId = randomUUID()
  let db: StoragePgDB
  let testBucketId: string
  let testObjectNames: string[]

  beforeAll(async () => {
    const serviceKeyUser = await getServiceKeyUser(tenantId)
    const pg = await getPostgresConnection({
      superUser: serviceKeyUser,
      user: serviceKeyUser,
      tenantId,
      host: 'localhost',
    })

    db = new StoragePgDB(pg, {
      host: 'localhost',
      tenantId,
    })

    testBucketId = `count-objects-${randomUUID()}`
    testObjectNames = Array.from({ length: testObjectCount }, (_, idx) => {
      return `fixtures/count-object-${idx}`
    })

    await db.createBucket({
      id: testBucketId,
      name: testBucketId,
      public: false,
      owner: testOwnerId,
      file_size_limit: null,
      allowed_mime_types: null,
      type: 'STANDARD',
    })

    await Promise.all(
      testObjectNames.map((name) => {
        return db.createObject({
          name,
          owner: testOwnerId,
          bucket_id: testBucketId,
          metadata: { size: 1 },
          user_metadata: null,
          version: undefined,
        })
      })
    )
  })

  afterAll(async () => {
    await db.deleteObjects(testBucketId, testObjectNames, 'name')
    await db.deleteBucket(testBucketId)
    db.destroyConnection()
  })

  it('should return correct object count', async () => {
    await expect(db.countObjectsInBucket(testBucketId)).resolves.toBe(testObjectCount)
  })
  it('should return limited object count', async () => {
    await expect(db.countObjectsInBucket(testBucketId, 22)).resolves.toBe(22)
  })
  it('should return full object count if limit is greater than total', async () => {
    await expect(db.countObjectsInBucket(testBucketId, 999)).resolves.toBe(testObjectCount)
  })
  it('should return 0 object count if there are no objects with provided bucket id', async () => {
    await expect(db.countObjectsInBucket('this-is-not-a-bucket-at-all', 999)).resolves.toBe(0)
  })
})

describe('testing DELETE bucket', () => {
  test('user is able to delete a bucket', async () => {
    const bucketId = `delete-bucket-${randomUUID()}`
    const sendSpy = vi.spyOn(PurgeCdnCache, 'send').mockResolvedValue(undefined)
    let deleted = false

    try {
      await createBucket(bucketId)

      const response = await appInstance.inject({
        method: 'DELETE',
        url: `/bucket/${bucketId}`,
        headers: {
          authorization: `Bearer ${authenticatedKey}`,
        },
      })
      expect(response.statusCode).toBe(200)
      const responseJSON = response.json()
      expect(responseJSON.message).toBe('Successfully deleted')
      expect(sendSpy).toHaveBeenCalledTimes(1)
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          purgeOptions: {
            type: 'bucket',
            bucket: bucketId,
            tenant: tenantId,
          },
        })
      )
      deleted = true
    } finally {
      sendSpy.mockRestore()
      if (!deleted) {
        await cleanupBucket(bucketId)
      }
    }
  })

  test('bucket deletion succeeds even if purging the CDN cache fails', async () => {
    const bucketId = `delete-bucket-purge-fails-${randomUUID()}`
    const sendSpy = vi
      .spyOn(PurgeCdnCache, 'send')
      .mockRejectedValueOnce(new Error('purge event failed'))
    let deleted = false

    try {
      await createBucket(bucketId)

      const response = await appInstance.inject({
        method: 'DELETE',
        url: `/bucket/${bucketId}`,
        headers: {
          authorization: `Bearer ${authenticatedKey}`,
        },
      })
      expect(response.statusCode).toBe(200)
      const responseJSON = response.json()
      expect(responseJSON.message).toBe('Successfully deleted')
      expect(sendSpy).toHaveBeenCalledTimes(1)
      deleted = true
    } finally {
      sendSpy.mockRestore()
      if (!deleted) {
        await cleanupBucket(bucketId)
      }
    }
  })

  test('checking RLS: anon user is not able to delete a bucket', async () => {
    const bucketId = 'bucket5'
    const response = await appInstance.inject({
      method: 'DELETE',
      url: `/bucket/${bucketId}`,
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('user is not able to delete bucket without Auth header', async () => {
    const bucketId = 'bucket5'
    const response = await appInstance.inject({
      method: 'DELETE',
      url: `/bucket/${bucketId}`,
    })
    expect(response.statusCode).toBe(400)
  })

  test('user is not able to delete bucket a non empty bucket', async () => {
    const bucketId = `delete-non-empty-${randomUUID()}`
    const objectNames = [`fixtures/${randomUUID()}`]

    try {
      await createBucket(bucketId)
      await seedObjects(bucketId, objectNames)

      const response = await appInstance.inject({
        method: 'DELETE',
        url: `/bucket/${bucketId}`,
        headers: {
          authorization: `Bearer ${authenticatedKey}`,
        },
      })
      expect(response.statusCode).toBe(400)
    } finally {
      await cleanupBucket(bucketId, objectNames)
    }
  })

  test('user is not able to delete a non-existent bucket', async () => {
    const bucketId = 'notfound'
    const response = await appInstance.inject({
      method: 'DELETE',
      url: `/bucket/${bucketId}`,
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('user is not able to delete a non-existent bucket with an empty json body', async () => {
    const bucketId = `delete-empty-json-${randomUUID()}`

    const response = await appInstance.inject({
      method: 'DELETE',
      url: `/bucket/${bucketId}`,
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
        'content-type': 'application/json',
      },
      payload: '',
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: '404',
      error: 'Bucket not found',
      message: 'Bucket not found',
      code: ErrorCode.NoSuchBucket,
    })
  })

  test('user is able to delete a bucket with an empty json body', async () => {
    const bucketId = `delete-empty-json-success-${randomUUID()}`
    let created = false
    let deleted = false

    try {
      const createResponse = await appInstance.inject({
        method: 'POST',
        url: '/bucket',
        headers: {
          authorization: `Bearer ${serviceKey}`,
        },
        payload: {
          name: bucketId,
        },
      })

      expect(createResponse.statusCode).toBe(200)
      expect(createResponse.json()).toEqual({
        name: bucketId,
      })
      created = true

      const response = await appInstance.inject({
        method: 'DELETE',
        url: `/bucket/${bucketId}`,
        headers: {
          authorization: `Bearer ${serviceKey}`,
          'content-type': 'application/json',
        },
        payload: '',
      })

      expect(response.statusCode).toBe(200)
      deleted = true
      expect(response.json()).toEqual({
        message: 'Successfully deleted',
      })
    } finally {
      if (created && !deleted) {
        await appInstance.inject({
          method: 'DELETE',
          url: `/bucket/${bucketId}`,
          headers: {
            authorization: `Bearer ${serviceKey}`,
          },
        })
      }
    }
  })
})

describe('testing EMPTY bucket', () => {
  test('user is not able to empty a non existent bucket with an empty json body', async () => {
    const bucketId = `empty-empty-json-${randomUUID()}`

    const response = await appInstance.inject({
      method: 'POST',
      url: `/bucket/${bucketId}/empty`,
      headers: {
        authorization: `Bearer ${serviceKey}`,
        'content-type': 'application/json',
      },
      payload: '',
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: '404',
      error: 'Bucket not found',
      message: 'Bucket not found',
      code: ErrorCode.NoSuchBucket,
    })
  })

  test('user is able to empty a bucket with an empty json body', async () => {
    const bucketId = `empty-empty-json-success-${randomUUID()}`
    let created = false

    try {
      const createResponse = await appInstance.inject({
        method: 'POST',
        url: '/bucket',
        headers: {
          authorization: `Bearer ${serviceKey}`,
        },
        payload: {
          name: bucketId,
        },
      })

      expect(createResponse.statusCode).toBe(200)
      expect(createResponse.json()).toEqual({
        name: bucketId,
      })
      created = true

      const response = await appInstance.inject({
        method: 'POST',
        url: `/bucket/${bucketId}/empty`,
        headers: {
          authorization: `Bearer ${serviceKey}`,
          'content-type': 'application/json',
        },
        payload: '',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        message: 'Empty bucket has been queued. Completion may take up to an hour.',
      })
    } finally {
      if (created) {
        await appInstance.inject({
          method: 'DELETE',
          url: `/bucket/${bucketId}`,
          headers: {
            authorization: `Bearer ${serviceKey}`,
          },
        })
      }
    }
  })

  test('user is not able to empty a bucket without service role', async () => {
    const bucketId = `empty-bucket-${randomUUID()}`
    const objectNames = [`fixtures/${randomUUID()}`]

    try {
      await createBucket(bucketId)
      await seedObjects(bucketId, objectNames)

      const response = await appInstance.inject({
        method: 'POST',
        url: `/bucket/${bucketId}/empty`,
        headers: {
          authorization: `Bearer ${authenticatedKey}`,
        },
      })
      expect(response.statusCode).toBe(403)
      expect(response.json()).toMatchObject({
        error: 'Unauthorized',
        message: 'Access denied: Invalid role',
        code: ErrorCode.AccessDenied,
      })
    } finally {
      await cleanupBucket(bucketId, objectNames)
    }
  })

  test('user is not able to empty a bucket without authentication', async () => {
    const bucketId = `empty-bucket-unauthenticated-${randomUUID()}`

    try {
      await createBucket(bucketId)

      const response = await appInstance.inject({
        method: 'POST',
        url: `/bucket/${bucketId}/empty`,
        headers: {
          authorization: `Bearer invalid-token`,
        },
      })
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchObject({
        error: 'Unauthorized',
        code: ErrorCode.AccessDenied,
      })
    } finally {
      await cleanupBucket(bucketId)
    }
  })

  test('user is able to empty a bucket with a service key', async () => {
    const bucketId = `empty-bucket-service-${randomUUID()}`
    const objectNames = [`service-empty-a-${randomUUID()}`, `service-empty-b-${randomUUID()}`]

    try {
      await createBucket(bucketId, serviceKey)
      await seedObjects(bucketId, objectNames)

      // confirm there are items in the bucket before empty
      const responseList = await appInstance.inject({
        method: 'POST',
        url: '/object/list/' + bucketId,
        headers: {
          authorization: `Bearer ${serviceKey}`,
        },
        payload: {
          prefix: '',
          limit: 10,
          offset: 0,
        },
      })
      expect(responseList.statusCode).toBe(200)
      expect(responseList.json()).toHaveLength(2)

      const response = await appInstance.inject({
        method: 'POST',
        url: `/bucket/${bucketId}/empty`,
        headers: {
          authorization: `Bearer ${serviceKey}`,
        },
      })
      expect(response.statusCode).toBe(200)
      const responseJSON = response.json()
      expect(responseJSON.message).toBe(
        'Empty bucket has been queued. Completion may take up to an hour.'
      )

      // confirm the bucket is actually empty after
      const responseList2 = await appInstance.inject({
        method: 'POST',
        url: '/object/list/' + bucketId,
        headers: {
          authorization: `Bearer ${serviceKey}`,
        },
        payload: {
          prefix: '',
        },
      })
      expect(responseList2.statusCode).toBe(200)
      expect(responseList2.json()).toHaveLength(0)
    } finally {
      await cleanupBucket(bucketId, objectNames)
    }
  })

  test('anon user is not able to empty a bucket', async () => {
    const bucketId = `empty-bucket-anon-${randomUUID()}`

    try {
      await createBucket(bucketId)

      const response = await appInstance.inject({
        method: 'POST',
        url: `/bucket/${bucketId}/empty`,
        headers: {
          authorization: `Bearer ${anonKey}`,
        },
      })
      expect(response.statusCode).toBe(403)
    } finally {
      await cleanupBucket(bucketId)
    }
  })

  test('user is not able to empty a bucket without Auth Header', async () => {
    const bucketId = `empty-bucket-no-auth-${randomUUID()}`

    try {
      await createBucket(bucketId)

      const response = await appInstance.inject({
        method: 'POST',
        url: `/bucket/${bucketId}/empty`,
      })
      expect(response.statusCode).toBe(400)
    } finally {
      await cleanupBucket(bucketId)
    }
  })

  test('user is not able to empty a non existent bucket', async () => {
    const bucketId = 'notfound'
    const response = await appInstance.inject({
      method: 'POST',
      url: `/bucket/${bucketId}/empty`,
      headers: {
        authorization: `Bearer ${serviceKey}`,
      },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({
      error: 'Bucket not found',
      message: 'Bucket not found',
      code: ErrorCode.NoSuchBucket,
    })
  })

  test('service role is able to empty an already empty bucket', async () => {
    const bucketId = `empty-bucket-already-empty-${randomUUID()}`

    try {
      await createBucket(bucketId, serviceKey)

      const response = await appInstance.inject({
        method: 'POST',
        url: `/bucket/${bucketId}/empty`,
        headers: {
          authorization: `Bearer ${serviceKey}`,
        },
      })
      expect(response.statusCode).toBe(200)
    } finally {
      await cleanupBucket(bucketId)
    }
  })
})
