vi.hoisted(() => {
  process.env.PG_QUEUE_ENABLE = 'true'
})

import {
  generateHS512JWK,
  getMaxNumericJWTExpiration,
  SIGNED_URL_SCOPE_DOWNLOAD,
  SIGNED_URL_SCOPE_UPLOAD,
  SignedToken,
  signJWT,
  verifyJWT,
} from '@internal/auth'
import {
  type DatabaseTransaction,
  getPostgresConnection,
  getServiceKeyUser,
} from '@internal/database'
import { ErrorCode, StorageBackendError } from '@internal/errors'
import { StoragePgDB } from '@storage/database'
import { MAX_OBJECTS_PER_REQUEST } from '@storage/limits'
import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import FormData from 'form-data'
import fs from 'fs'
import app from '../app'
import { getConfig, JwksConfig, JwksConfigKeyOCT, mergeConfig } from '../config'
import { backends, Obj } from '../storage'
import { ObjectAdminDelete } from '../storage/events'
import { useMockObject, useMockQueue } from './common'
import { useStorage, withDeleteEnabled } from './utils/storage'

const { jwtSecret, serviceKeyAsync, tenantId } = getConfig()
const anonKey = process.env.ANON_KEY || ''
const S3Backend = backends.S3Backend
let appInstance: FastifyInstance

type SignedUrlResult = {
  error: string | null
  path: string
  signedURL: string | null
}

let tnx: DatabaseTransaction | undefined
async function getSuperuserPostgrestClient() {
  const superUser = await getServiceKeyUser(tenantId)

  const conn = await getPostgresConnection({
    superUser,
    user: superUser,
    tenantId,
    host: 'localhost',
  })
  tnx = await conn.transaction()

  return tnx
}

async function findObject(
  db: DatabaseTransaction,
  bucketId: string,
  name: string
): Promise<Obj | undefined> {
  const result = await db.query<Obj>({
    text: `
      SELECT *
      FROM objects
      WHERE bucket_id = $1
        AND name = $2
      LIMIT 1
    `,
    values: [bucketId, name],
  })

  return result.rows[0]
}

async function insertObjects(
  db: DatabaseTransaction,
  objects:
    | Array<Partial<Obj> & { bucket_id: string; name: string }>
    | (Partial<Obj> & { bucket_id: string; name: string })
) {
  const rows = Array.isArray(objects) ? objects : [objects]

  for (const row of rows) {
    const entries = Object.entries(row)
    await db.query({
      text: `
        INSERT INTO objects (${entries.map(([column]) => column).join(', ')})
        VALUES (${entries.map((_, index) => `$${index + 1}`).join(', ')})
      `,
      values: entries.map(([, value]) => value),
    })
  }
}

async function deleteObjectsByName(
  db: DatabaseTransaction,
  bucketId: string,
  names: string | string[]
) {
  await db.query({
    text: `
      DELETE FROM objects
      WHERE bucket_id = $1
        AND name = ANY($2::text[])
    `,
    values: [bucketId, Array.isArray(names) ? names : [names]],
  })
}

async function insertObjectNames(db: DatabaseTransaction, bucketId: string, names: string[]) {
  const owner = '317eadce-631a-4429-a0bb-f19a7a517b4a'
  const versions = names.map((_, index) => `test-version-${randomUUID()}-${index}`)

  await db.query({
    text: `
      INSERT INTO objects (bucket_id, name, owner, owner_id, version, metadata)
      SELECT $1, seeded.name, $2::uuid, $2::text, seeded.version, $3::jsonb
      FROM unnest($4::text[], $5::text[]) AS seeded(name, version)
    `,
    values: [bucketId, owner, { size: 1234 }, names, versions],
  })
}

async function insertBucket(
  db: DatabaseTransaction,
  bucket: {
    id: string
    name: string
    public: boolean
    file_size_limit: null
    allowed_mime_types: null
    type: string
  }
) {
  await db.query({
    text: `
      INSERT INTO buckets (id, name, public, file_size_limit, allowed_mime_types, type)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    values: [
      bucket.id,
      bucket.name,
      bucket.public,
      bucket.file_size_limit,
      bucket.allowed_mime_types,
      bucket.type,
    ],
  })
}

useMockObject()
useMockQueue()

beforeEach(() => {
  getConfig({ reload: true })
  appInstance = app()
})

afterEach(async () => {
  if (tnx) {
    await tnx.commit()
  }
  await appInstance.close()
})

/*
 * GET /object/:id
 */
describe('testing GET object', () => {
  test('check if RLS policies are respected: authenticated user is able to read authenticated resource', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: '/object/authenticated/bucket2/authenticated/casestudy.png',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(response.headers['etag']).toBe('abc')
    expect(response.headers['x-robots-tag']).toBe('none')
    expect(response.headers['last-modified']).toBe('Thu, 12 Aug 2021 16:00:00 GMT')
    expect(S3Backend.prototype.getObject).toHaveBeenCalled()
  })

  test('check if RLS policies are respected: authenticated user is able to read authenticated resource without /authenticated prefix', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: '/object/bucket2/authenticated/casestudy.png',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(response.headers['etag']).toBe('abc')
    expect(response.headers['last-modified']).toBe('Thu, 12 Aug 2021 16:00:00 GMT')
    expect(S3Backend.prototype.getObject).toHaveBeenCalled()
  })

  test('forward 304 and If-Modified-Since/If-None-Match headers', async () => {
    const mockGetObject = vi.spyOn(S3Backend.prototype, 'getObject')
    mockGetObject.mockRejectedValue({
      $metadata: {
        httpStatusCode: 304,
      },
    })
    const response = await appInstance.inject({
      method: 'GET',
      url: '/object/authenticated/bucket2/authenticated/casestudy.png',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
        'if-modified-since': 'Thu, 12 Aug 2021 16:00:00 GMT',
        'if-none-match': 'abc',
      },
    })
    expect(response.statusCode).toBe(304)
    expect(mockGetObject.mock.calls[0][3]).toMatchObject({
      ifModifiedSince: 'Thu, 12 Aug 2021 16:00:00 GMT',
      ifNoneMatch: 'abc',
    })
  })

  test('get authenticated object info', async () => {
    const response = await appInstance.inject({
      method: 'HEAD',
      url: '/object/authenticated/bucket2/authenticated/casestudy.png',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(response.headers['etag']).toBe('abc')
    expect(response.headers['last-modified']).toBe('Wed, 12 Oct 2022 11:17:02 GMT')
    expect(response.headers['content-length']).toBe('3746')
    expect(response.headers['cache-control']).toBe('no-cache')
  })

  test('get authenticated object info without the /authenticated prefix', async () => {
    const response = await appInstance.inject({
      method: 'HEAD',
      url: '/object/bucket2/authenticated/casestudy.png',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(response.headers['etag']).toBe('abc')
    expect(response.headers['last-modified']).toBe('Wed, 12 Oct 2022 11:17:02 GMT')
    expect(response.headers['content-length']).toBe('3746')
    expect(response.headers['cache-control']).toBe('no-cache')
  })

  test('get authenticated object info returns NoSuchKey for a missing object', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: '/object/info/authenticated/bucket2/authenticated/notfound-info.png',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: '404',
      error: 'not_found',
      message: 'Object not found',
      code: ErrorCode.NoSuchKey,
    })
    expect(S3Backend.prototype.headObject).not.toHaveBeenCalled()
  })

  test('can get an object by an existing version id', async () => {
    const runId = randomUUID()
    const objectName = `authenticated/get-by-version-${runId}.png`
    const version = `get-by-version-${runId}`

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, {
      bucket_id: 'bucket2',
      name: objectName,
      owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
      version,
      metadata: { mimetype: 'image/png', size: 1234 },
    })
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'GET',
        url: `/object/authenticated/bucket2/${objectName}?versionId=${version}`,
        headers: {
          authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
        },
      })
      expect(response.statusCode).toBe(200)
      expect(S3Backend.prototype.getObject).toHaveBeenCalled()
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', [objectName])
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('returns NoSuchKey when getting an object by a version id that does not exist', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: '/object/authenticated/bucket2/authenticated/casestudy.png?versionId=does-not-exist',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: '404',
      error: 'not_found',
      message: 'Object not found',
      code: ErrorCode.NoSuchKey,
    })
  })

  test('can get object info by an existing version id', async () => {
    const runId = randomUUID()
    const objectName = `authenticated/get-info-by-version-${runId}.png`
    const version = `get-info-by-version-${runId}`

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, {
      bucket_id: 'bucket2',
      name: objectName,
      owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
      version,
      metadata: { mimetype: 'image/png', size: 1234 },
    })
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'GET',
        url: `/object/info/authenticated/bucket2/${objectName}?versionId=${version}`,
        headers: {
          authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
        },
      })
      expect(response.statusCode).toBe(200)
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', [objectName])
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('returns NoSuchKey when getting object info by a version id that does not exist', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: '/object/info/authenticated/bucket2/authenticated/casestudy.png?versionId=does-not-exist',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: '404',
      error: 'not_found',
      message: 'Object not found',
      code: ErrorCode.NoSuchKey,
    })
  })

  test('can get a public object by an existing version id', async () => {
    const runId = randomUUID()
    const bucketId = `public-get-by-version-${runId}`
    const objectName = 'get-by-version.png'
    const version = `public-get-by-version-${runId}`

    const superUser = await getServiceKeyUser(tenantId)
    const db = await getPostgresConnection({
      superUser,
      user: superUser,
      tenantId,
      host: 'localhost',
    })
    const setupTx = await db.transaction()
    await insertBucket(setupTx, {
      id: bucketId,
      name: bucketId,
      public: true,
      file_size_limit: null,
      allowed_mime_types: null,
      type: 'STANDARD',
    })
    await insertObjects(setupTx, {
      bucket_id: bucketId,
      name: objectName,
      owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
      version,
      metadata: { mimetype: 'image/png', size: 1234 },
    })
    await setupTx.commit()
    db.dispose()

    const response = await appInstance.inject({
      method: 'GET',
      url: `/object/public/${bucketId}/${objectName}?versionId=${version}`,
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.getObject).toHaveBeenCalled()
  })

  test('returns NoSuchKey when getting a public object by a version id that does not exist', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: '/object/public/public-bucket-2/favicon.ico?versionId=does-not-exist',
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: '404',
      error: 'not_found',
      message: 'Object not found',
      code: ErrorCode.NoSuchKey,
    })
  })

  test('cannot get authenticated object info without the /authenticated prefix if no jwt is provided', async () => {
    const response = await appInstance.inject({
      method: 'HEAD',
      url: '/object/bucket2/authenticated/casestudy.png',
    })
    expect(response.statusCode).toBe(400)
  })

  test('get public object info without using the /public prefix', async () => {
    const response = await appInstance.inject({
      method: 'HEAD',
      url: '/object/public-bucket-2/favicon.ico',
      headers: {
        authorization: ``,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(response.headers['etag']).toBe('abc')
    expect(response.headers['last-modified']).toBe('Wed, 12 Oct 2022 11:17:02 GMT')
    expect(response.headers['content-length']).toBe('3746')
    expect(response.headers['cache-control']).toBe('no-cache')
  })

  test('get public object info', async () => {
    const response = await appInstance.inject({
      method: 'HEAD',
      url: '/object/public-bucket-2/favicon.ico',
      headers: {
        authorization: ``,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(response.headers['etag']).toBe('abc')
    expect(response.headers['last-modified']).toBe('Wed, 12 Oct 2022 11:17:02 GMT')
    expect(response.headers['content-length']).toBe('3746')
    expect(response.headers['cache-control']).toBe('no-cache')
  })

  test('force downloading file with default name', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: '/object/authenticated/bucket2/authenticated/casestudy.png?download',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(S3Backend.prototype.getObject).toHaveBeenCalled()
    expect(response.headers).toEqual(
      expect.objectContaining({
        'content-disposition': `attachment;`,
      })
    )
  })

  test('force downloading file with a custom name', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: '/object/authenticated/bucket2/authenticated/casestudy.png?download=testname.png',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(S3Backend.prototype.getObject).toHaveBeenCalled()
    expect(response.headers).toEqual(
      expect.objectContaining({
        'content-disposition': `attachment; filename=testname.png; filename*=UTF-8''testname.png`,
      })
    )
  })

  test('check if RLS policies are respected: anon user is not able to read authenticated resource', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: '/object/authenticated/bucket2/authenticated/casestudy.png',
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.getObject).not.toHaveBeenCalled()
  })

  test('check if RLS policies are respected: anon user is not able to read authenticated resource without /authenticated prefix', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: '/object/bucket2/authenticated/casestudy.png',
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.getObject).not.toHaveBeenCalled()
  })

  test('user is not able to read a resource without Auth header', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: '/object/authenticated/bucket2/authenticated/casestudy.png',
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.getObject).not.toHaveBeenCalled()
  })

  test('user is not able to read a resource without Auth header without the /authenticated prefix', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: '/object/bucket2/authenticated/casestudy.png',
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.getObject).not.toHaveBeenCalled()
  })

  test('return 400 when reading a non existent object', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: '/object/authenticated/bucket2/authenticated/notfound',
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.getObject).not.toHaveBeenCalled()
  })

  test('return 400 when reading a non existent bucket', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: '/object/authenticated/notfound/authenticated/casestudy.png',
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.getObject).not.toHaveBeenCalled()
  })
})

/*
 * POST /object/:id
 * multipart upload
 */
describe('testing POST object via multipart upload', () => {
  test('check if RLS policies are respected: authenticated user is able to upload authenticated resource', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      'x-upsert': 'true',
    })

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/bucket2/authenticated/casestudy1.png',
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.uploadObject).toHaveBeenCalled()
    expect(await response.json()).toEqual(
      expect.objectContaining({
        Id: expect.any(String),
        Key: 'bucket2/authenticated/casestudy1.png',
      })
    )
  })

  test('check if RLS policies are respected: anon user is not able to upload authenticated resource', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${anonKey}`,
      'x-upsert': 'true',
    })

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/bucket2/authenticated/casestudy.png',
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
    expect(response.body).toBe(
      JSON.stringify({
        statusCode: '403',
        error: 'Unauthorized',
        message: 'new row violates row-level security policy',
        code: ErrorCode.AccessDenied,
      })
    )
  })

  test('check if RLS policies are respected: user is not able to upload a resource without Auth header', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/bucket2/authenticated/casestudy.png',
      headers: form.getHeaders(),
      payload: form,
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('return 400 when uploading to a non existent bucket', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${anonKey}`,
    })

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/notfound/authenticated/casestudy.png',
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('return 400 when uploading to duplicate object', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${anonKey}`,
    })

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/bucket2/public/sadcat-upload23.png',
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('return 200 when uploading an object within bucket max size limit', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${await serviceKeyAsync}`,
      'x-upsert': 'true',
    })

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/public-limit-max-size-2/sadcat-upload25.png',
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.uploadObject).toHaveBeenCalled()
  })

  test('return 400 when uploading an object that exceed bucket level max size', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${await serviceKeyAsync}`,
      'x-upsert': 'true',
    })

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/public-limit-max-size/sadcat-upload23.png',
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Payload too large',
      message: 'The object exceeded the maximum allowed size',
      statusCode: '413',
      code: ErrorCode.EntityTooLarge,
    })
    expect(S3Backend.prototype.uploadObject).toHaveBeenCalled()
  })

  test('successfully uploading an object with a the allowed mime-type', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${await serviceKeyAsync}`,
      'x-upsert': 'true',
      'content-type': 'image/jpeg',
    })

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/public-limit-mime-types/sadcat-upload23.png',
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.uploadObject).toHaveBeenCalled()
  })

  test('successfully uploading an object with custom metadata using form data', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    form.append(
      'metadata',
      JSON.stringify({
        test1: 'test1',
        test2: 'test2',
      })
    )
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${await serviceKeyAsync}`,
      'x-upsert': 'true',
      ...form.getHeaders(),
    })

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/bucket2/sadcat-upload3012.png',
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.uploadObject).toHaveBeenCalled()

    const client = await getSuperuserPostgrestClient()

    const object = await findObject(client, 'bucket2', 'sadcat-upload3012.png')

    expect(object).not.toBeFalsy()
    expect(object?.user_metadata).toEqual({
      test1: 'test1',
      test2: 'test2',
    })
  })

  test('successfully uploading an object with custom metadata using stream', async () => {
    const file = fs.createReadStream(`./src/test/assets/sadcat.jpg`)

    const headers = {
      authorization: `Bearer ${await serviceKeyAsync}`,
      'x-upsert': 'true',
      'x-metadata': Buffer.from(
        JSON.stringify({
          test1: 'test1',
          test2: 'test2',
        })
      ).toString('base64'),
    }

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/bucket2/sadcat-upload3018.png',
      headers,
      payload: file,
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.uploadObject).toHaveBeenCalled()

    const client = await getSuperuserPostgrestClient()

    const object = await findObject(client, 'bucket2', 'sadcat-upload3018.png')

    expect(object).not.toBeFalsy()
    expect(object?.user_metadata).toEqual({
      test1: 'test1',
      test2: 'test2',
    })
  })

  test('fetch object metadata', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    form.append(
      'metadata',
      JSON.stringify({
        test1: 'test1',
        test2: 'test2',
      })
    )
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${await serviceKeyAsync}`,
      'x-upsert': 'true',
    })

    const uploadResponse = await appInstance.inject({
      method: 'POST',
      url: '/object/bucket2/sadcat-upload3019.png',
      headers: {
        ...headers,
        ...form.getHeaders(),
      },
      payload: form,
    })
    expect(uploadResponse.statusCode).toBe(200)

    const response = await appInstance.inject({
      method: 'GET',
      url: '/object/info/bucket2/sadcat-upload3019.png',
      headers,
    })

    const data = await response.json()

    expect(data.metadata).toEqual({
      test1: 'test1',
      test2: 'test2',
    })
  })

  test('can create an empty folder when mime-type is set', async () => {
    const form = new FormData()
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${await serviceKeyAsync}`,
      'x-upsert': 'true',
    })

    form.append('file', Buffer.alloc(0))

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/public-limit-mime-types/nested/.emptyFolderPlaceholder',
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.uploadObject).toHaveBeenCalled()
  })

  test('cannot create an empty folder with more than 0kb', async () => {
    const form = new FormData()
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${await serviceKeyAsync}`,
      'x-upsert': 'true',
    })

    form.append('file', Buffer.alloc(1))

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/public-limit-mime-types/nested-2/.emptyFolderPlaceholder',
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(400)
  })

  test('return 400 when uploading an object with a not allowed mime-type (binary path)', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${await serviceKeyAsync}`,
      'x-upsert': 'true',
      'content-type': 'image/png',
    })

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/public-limit-mime-types/sadcat-upload23.png',
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(400)
    expect(await response.json()).toEqual({
      error: 'invalid_mime_type',
      message: `mime type image/png is not supported`,
      statusCode: '415',
      code: ErrorCode.InvalidMimeType,
    })
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('return 400 when uploading a multipart form-data object with a not allowed mime-type', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    form.append('contentType', 'image/png')
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${await serviceKeyAsync}`,
      'x-upsert': 'true',
    })

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/public-limit-mime-types/sadcat-upload23.png',
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(400)
    expect(await response.json()).toEqual({
      error: 'invalid_mime_type',
      message: `mime type image/png is not supported`,
      statusCode: '415',
      code: ErrorCode.InvalidMimeType,
    })
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('enforces allowed mime types set through bucket update', async () => {
    const bucketId = `allowed-mime-${randomUUID()}`
    const authHeader = { authorization: `Bearer ${await serviceKeyAsync}` }

    try {
      const createBucketResponse = await appInstance.inject({
        method: 'POST',
        url: '/bucket',
        headers: authHeader,
        payload: {
          name: bucketId,
        },
      })
      expect(createBucketResponse.statusCode).toBe(200)

      const updateBucketResponse = await appInstance.inject({
        method: 'PUT',
        url: `/bucket/${bucketId}`,
        headers: authHeader,
        payload: {
          allowed_mime_types: ['image/jpeg'],
        },
      })
      expect(updateBucketResponse.statusCode).toBe(200)

      const form = new FormData()
      form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
      form.append('contentType', 'image/png')

      const response = await appInstance.inject({
        method: 'POST',
        url: `/object/${bucketId}/sadcat-upload23.png`,
        headers: {
          ...form.getHeaders(),
          ...authHeader,
          'x-upsert': 'true',
        },
        payload: form,
      })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({
        error: 'invalid_mime_type',
        message: `mime type image/png is not supported`,
        statusCode: '415',
        code: ErrorCode.InvalidMimeType,
      })
      expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
    } finally {
      const db = await getSuperuserPostgrestClient()
      await withDeleteEnabled(db, async (db) => {
        await db.query({
          text: 'DELETE FROM objects WHERE bucket_id = $1',
          values: [bucketId],
        })
        await db.query({
          text: 'DELETE FROM buckets WHERE id = $1',
          values: [bucketId],
        })
      })
    }
  })

  test('return 400 when uploading an object with a malformed mime-type', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${await serviceKeyAsync}`,
      'x-upsert': 'true',
      'content-type': 'thisisnotarealmimetype',
    })

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/public-limit-mime-types/sadcat-upload23.png',
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(400)
    expect(await response.json()).toEqual({
      error: 'invalid_mime_type',
      message: 'Invalid Content-Type header',
      statusCode: '415',
      code: ErrorCode.InvalidMimeType,
    })
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('return 400 when uploading an object with a content-type header containing tabs', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${await serviceKeyAsync}`,
      'x-upsert': 'true',
      'content-type': 'image/\tjpg',
    })

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/public-limit-mime-types/sadcat-upload23.png',
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(400)
    expect(await response.json()).toEqual({
      error: 'invalid_mime_type',
      message: 'Invalid Content-Type header',
      statusCode: '415',
      code: ErrorCode.InvalidMimeType,
    })
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('return 200 when upserting duplicate object', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${anonKey}`,
      'x-upsert': 'true',
    })

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/bucket2/public/sadcat-upload23.png',
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(200)
  })

  test('return 400 when exceeding file size limit', async () => {
    mergeConfig({
      uploadFileSizeLimit: 1,
    })

    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${anonKey}`,
      // 'x-upsert': 'true',
    })

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/bucket2/public/sadcat55.jpg',
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(400)
    expect(response.body).toBe(
      JSON.stringify({
        statusCode: '413',
        error: 'Payload too large',
        message: 'The object exceeded the maximum allowed size',
        code: ErrorCode.EntityTooLarge,
      })
    )
  })

  test('return 400 when uploading to object with no file name', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${anonKey}`,
    })

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/bucket4/',
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('should not add row to database if upload fails', async () => {
    // Mock S3 upload failure.
    vi.spyOn(S3Backend.prototype, 'uploadObject').mockRejectedValue(
      StorageBackendError.fromError({
        name: 'S3ServiceException',
        message: 'Unknown error',
        $fault: 'server',
        $metadata: {
          httpStatusCode: 500,
        },
      })
    )

    process.env.FILE_SIZE_LIMIT = '1'
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${anonKey}`,
    })

    const BUCKET_ID = 'bucket2'
    const OBJECT_NAME = 'public/should-not-insert/sadcat.jpg'

    const createObjectResponse = await appInstance.inject({
      method: 'POST',
      url: `/object/${BUCKET_ID}/${OBJECT_NAME}`,
      headers,
      payload: form,
    })
    expect(createObjectResponse.statusCode).toBe(500)
    expect(JSON.parse(createObjectResponse.body)).toStrictEqual({
      code: ErrorCode.S3Error,
      statusCode: '500',
      error: 'Unknown error',
      message: 'S3ServiceException',
    })

    // Ensure that row does not exist in database.
    const db = await getSuperuserPostgrestClient()
    const objectResponse = await findObject(db, BUCKET_ID, OBJECT_NAME)

    expect(objectResponse).toBe(undefined)
  })
})

/*
 * POST /object/:id
 * binary upload
 */
describe('testing POST object via binary upload', () => {
  test('check if RLS policies are respected: authenticated user is able to upload authenticated resource', async () => {
    const path = './src/test/assets/sadcat.jpg'
    const { size } = fs.statSync(path)

    const headers = {
      authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      'Content-Length': size,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'true',
    }

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/bucket2/authenticated/binary-casestudy1.png',
      headers,
      payload: fs.createReadStream(path),
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.uploadObject).toHaveBeenCalled()
    expect(await response.json()).toEqual(
      expect.objectContaining({
        Id: expect.any(String),
        Key: 'bucket2/authenticated/binary-casestudy1.png',
      })
    )
  })

  test('check if RLS policies are respected: anon user is not able to upload authenticated resource', async () => {
    const path = './src/test/assets/sadcat.jpg'
    const { size } = fs.statSync(path)

    const headers = {
      authorization: `Bearer ${anonKey}`,
      'Content-Length': size,
      'Content-Type': 'image/jpeg',
    }

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/bucket2/authenticated/binary-casestudy.png',
      headers,
      payload: fs.createReadStream(path),
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
    expect(response.body).toBe(
      JSON.stringify({
        statusCode: '403',
        error: 'Unauthorized',
        message: 'new row violates row-level security policy',
        code: ErrorCode.AccessDenied,
      })
    )
  })

  test('check if RLS policies are respected: user is not able to upload a resource without Auth header', async () => {
    const path = './src/test/assets/sadcat.jpg'
    const { size } = fs.statSync(path)

    const headers = {
      'Content-Length': size,
      'Content-Type': 'image/jpeg',
    }

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/bucket2/authenticated/binary-casestudy1.png',
      headers,
      payload: fs.createReadStream(path),
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('return 400 when uploading to a non existent bucket', async () => {
    const path = './src/test/assets/sadcat.jpg'
    const { size } = fs.statSync(path)

    const headers = {
      authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      'Content-Length': size,
      'Content-Type': 'image/jpeg',
    }

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/notfound/authenticated/binary-casestudy1.png',
      headers,
      payload: fs.createReadStream(path),
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('return 400 when uploading to duplicate object', async () => {
    const path = './src/test/assets/sadcat.jpg'
    const { size } = fs.statSync(path)

    const headers = {
      authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      'Content-Length': size,
      'Content-Type': 'image/jpeg',
    }

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/bucket2/public/sadcat-upload23.png',
      headers,
      payload: fs.createReadStream(path),
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('return 200 when upserting duplicate object', async () => {
    const path = './src/test/assets/sadcat.jpg'
    const { size } = fs.statSync(path)

    const headers = {
      authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      'Content-Length': size,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'true',
    }

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/bucket2/public/sadcat-upload23.png',
      headers,
      payload: fs.createReadStream(path),
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.uploadObject).toHaveBeenCalled()
  })

  test('return 400 when exceeding file size limit', async () => {
    mergeConfig({
      uploadFileSizeLimit: 1,
    })
    const path = './src/test/assets/sadcat.jpg'
    const { size } = fs.statSync(path)

    const headers = {
      authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      'Content-Length': size,
      'Content-Type': 'image/jpeg',
    }

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/bucket2/public/sadcat.jpg',
      headers,
      payload: fs.createReadStream(path),
    })
    expect(response.statusCode).toBe(400)
    expect(response.body).toBe(
      JSON.stringify({
        statusCode: '413',
        error: 'Payload too large',
        message: 'The object exceeded the maximum allowed size',
        code: ErrorCode.EntityTooLarge,
      })
    )
  })

  test('return 400 when a binary upload spoofs x-amz-decoded-content-length', async () => {
    mergeConfig({
      uploadFileSizeLimit: 1,
    })

    const bucketId = `spoof-decoded-${randomUUID()}`
    const superUser = await getServiceKeyUser(tenantId)
    const db = await getPostgresConnection({
      superUser,
      user: superUser,
      tenantId,
      host: 'localhost',
    })
    const setupTx = await db.transaction()
    await insertBucket(setupTx, {
      id: bucketId,
      name: bucketId,
      public: true,
      file_size_limit: null,
      allowed_mime_types: null,
      type: 'STANDARD',
    })
    await setupTx.commit()
    db.dispose()

    const path = './src/test/assets/sadcat.jpg'
    const { size } = fs.statSync(path)

    const headers = {
      authorization: `Bearer ${await serviceKeyAsync}`,
      'Content-Length': size,
      'Content-Type': 'image/jpeg',
      'x-amz-decoded-content-length': '1',
    }

    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/${bucketId}/public/sadcat-spoofed-decoded-length.jpg`,
      headers,
      payload: fs.createReadStream(path),
    })
    expect(response.statusCode).toBe(400)
    expect(response.body).toBe(
      JSON.stringify({
        statusCode: '413',
        error: 'Payload too large',
        message: 'The object exceeded the maximum allowed size',
        code: ErrorCode.EntityTooLarge,
      })
    )
    // Early size check in fileUploadFromRequest rejects before reaching the backend
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('return 400 when uploading to object with no file name', async () => {
    const path = './src/test/assets/sadcat.jpg'
    const { size } = fs.statSync(path)

    const headers = {
      authorization: `Bearer ${anonKey}`,
      'Content-Length': size,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'true',
    }

    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/bucket4/',
      headers,
      payload: fs.createReadStream(path),
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('should not add row to database if upload fails', async () => {
    // Mock S3 upload failure.
    vi.spyOn(S3Backend.prototype, 'uploadObject').mockRejectedValue(
      StorageBackendError.fromError({
        name: 'S3ServiceException',
        message: 'Unknown error',
        $fault: 'server',
        $metadata: {
          httpStatusCode: 500,
        },
      })
    )

    process.env.FILE_SIZE_LIMIT = '1'
    const path = './src/test/assets/sadcat.jpg'
    const { size } = fs.statSync(path)

    const headers = {
      authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      'Content-Length': size,
      'Content-Type': 'image/jpeg',
    }

    const BUCKET_ID = 'bucket2'
    const OBJECT_NAME = 'public/should-not-insert/sadcat.jpg'

    const createObjectResponse = await appInstance.inject({
      method: 'POST',
      url: `/object/${BUCKET_ID}/${OBJECT_NAME}`,
      headers,
      payload: fs.createReadStream(path),
    })
    expect(createObjectResponse.statusCode).toBe(500)
    expect(JSON.parse(createObjectResponse.body)).toStrictEqual({
      statusCode: '500',
      code: ErrorCode.S3Error,
      error: 'Unknown error',
      message: 'S3ServiceException',
    })

    // Ensure that row does not exist in database.
    const db = await getSuperuserPostgrestClient()
    const objectResponse = await findObject(db, BUCKET_ID, OBJECT_NAME)
    expect(objectResponse).toBe(undefined)
  })
})

/**
 * PUT /object/:id
 * multipart upload
 */
describe('testing PUT object', () => {
  test('check if RLS policies are respected: authenticated user is able to update authenticated resource', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
    })

    const response = await appInstance.inject({
      method: 'PUT',
      url: '/object/bucket2/authenticated/cat.jpg',
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.uploadObject).toHaveBeenCalled()
    expect(await response.json()).toEqual(
      expect.objectContaining({
        Id: expect.any(String),
        Key: 'bucket2/authenticated/cat.jpg',
      })
    )
  })

  test('check if RLS policies are respected: anon user is not able to update authenticated resource', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${anonKey}`,
    })

    const response = await appInstance.inject({
      method: 'PUT',
      url: '/object/bucket2/authenticated/cat.jpg',
      headers,
      payload: form,
    })

    expect(response.statusCode).toBe(400)

    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('user is not able to update a resource without Auth header', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))

    const response = await appInstance.inject({
      method: 'PUT',
      url: '/object/bucket2/authenticated/cat.jpg',
      headers: form.getHeaders(),
      payload: form,
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('return 400 when update to a non existent bucket', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${anonKey}`,
    })

    const response = await appInstance.inject({
      method: 'PUT',
      url: '/object/notfound/authenticated/cat.jpg',
      headers,
      payload: form,
    })

    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('return 400 when updating a non existent key', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      authorization: `Bearer ${anonKey}`,
    })

    const response = await appInstance.inject({
      method: 'PUT',
      url: '/object/notfound/authenticated/notfound.jpg',
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })
})

/*
 * PUT /object/:id
 * binary upload
 */
describe('testing PUT object via binary upload', () => {
  test('check if RLS policies are respected: authenticated user is able to update authenticated resource', async () => {
    const path = './src/test/assets/sadcat.jpg'
    const { size } = fs.statSync(path)

    const headers = {
      authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      'Content-Length': size,
      'Content-Type': 'image/jpeg',
    }

    const response = await appInstance.inject({
      method: 'PUT',
      url: '/object/bucket2/authenticated/cat.jpg',
      headers,
      payload: fs.createReadStream(path),
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.uploadObject).toHaveBeenCalled()
    expect(await response.json()).toEqual(
      expect.objectContaining({
        Id: expect.any(String),
        Key: 'bucket2/authenticated/cat.jpg',
      })
    )
  })

  test('replaces custom metadata when updating an object', async () => {
    const path = './src/test/assets/sadcat.jpg'
    const { size } = fs.statSync(path)
    const objectName = `metadata-replace/${randomUUID()}.jpg`
    const initialMetadata = { keep: false, stale: 'removed' }
    const replacementMetadata = { keep: true, fresh: 'present' }

    try {
      const createResponse = await appInstance.inject({
        method: 'POST',
        url: `/object/bucket2/${objectName}`,
        headers: {
          authorization: `Bearer ${await serviceKeyAsync}`,
          'Content-Length': size,
          'Content-Type': 'image/jpeg',
          'x-metadata': Buffer.from(JSON.stringify(initialMetadata)).toString('base64'),
        },
        payload: fs.createReadStream(path),
      })
      expect(createResponse.statusCode).toBe(200)

      const updateResponse = await appInstance.inject({
        method: 'PUT',
        url: `/object/bucket2/${objectName}`,
        headers: {
          authorization: `Bearer ${await serviceKeyAsync}`,
          'Content-Length': size,
          'Content-Type': 'image/jpeg',
          'x-metadata': Buffer.from(JSON.stringify(replacementMetadata)).toString('base64'),
        },
        payload: fs.createReadStream(path),
      })
      expect(updateResponse.statusCode).toBe(200)

      const infoResponse = await appInstance.inject({
        method: 'GET',
        url: `/object/info/bucket2/${objectName}`,
        headers: {
          authorization: `Bearer ${await serviceKeyAsync}`,
        },
      })
      expect(infoResponse.statusCode).toBe(200)
      expect(infoResponse.json().metadata).toEqual(replacementMetadata)
    } finally {
      const db = await getSuperuserPostgrestClient()
      await withDeleteEnabled(db, async (db) => {
        await db.query({
          text: `
            DELETE FROM objects
            WHERE name = $1
              AND bucket_id = $2
          `,
          values: [objectName, 'bucket2'],
        })
      })
    }
  })

  test('check if RLS policies are respected: anon user is not able to update authenticated resource', async () => {
    const path = './src/test/assets/sadcat.jpg'
    const { size } = fs.statSync(path)

    const headers = {
      authorization: `Bearer ${anonKey}`,
      'Content-Length': size,
      'Content-Type': 'image/jpeg',
    }

    const response = await appInstance.inject({
      method: 'PUT',
      url: '/object/bucket2/authenticated/cat.jpg',
      headers,
      payload: fs.createReadStream(path),
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('check if RLS policies are respected: user is not able to upload a resource without Auth header', async () => {
    const path = './src/test/assets/sadcat.jpg'
    const { size } = fs.statSync(path)

    const headers = {
      'Content-Length': size,
      'Content-Type': 'image/jpeg',
    }

    const response = await appInstance.inject({
      method: 'PUT',
      url: '/object/bucket2/authenticated/cat.jpg',
      headers,
      payload: fs.createReadStream(path),
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('return 400 when updating an object in a non existent bucket', async () => {
    const path = './src/test/assets/sadcat.jpg'
    const { size } = fs.statSync(path)

    const headers = {
      authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      'Content-Length': size,
      'Content-Type': 'image/jpeg',
    }

    const response = await appInstance.inject({
      method: 'PUT',
      url: '/object/notfound/authenticated/binary-casestudy1.png',
      headers,
      payload: fs.createReadStream(path),
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('return 400 when updating an object in a non existent key', async () => {
    const path = './src/test/assets/sadcat.jpg'
    const { size } = fs.statSync(path)

    const headers = {
      authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      'Content-Length': size,
      'Content-Type': 'image/jpeg',
    }

    const response = await appInstance.inject({
      method: 'PUT',
      url: '/object/notfound/authenticated/notfound.jpg',
      headers,
      payload: fs.createReadStream(path),
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })
})

/**
 * POST /copy
 */
describe('testing copy object', () => {
  const storageTest = useStorage()

  test('defaults omitted copyMetadata to preserving source metadata', async () => {
    const runId = randomUUID()
    const sourceKey = `authenticated/copy-default-source-${runId}.png`
    const destinationKey = `authenticated/copy-default-destination-${runId}.png`
    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, {
      bucket_id: 'bucket2',
      name: sourceKey,
      owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
      version: `copy-default-source-version-${runId}`,
      metadata: {
        cacheControl: 'max-age=60',
        eTag: `source-${runId}`,
        mimetype: 'image/png',
        size: 1234,
      },
    })
    await seedTx.commit()
    tnx = undefined

    try {
      await storageTest.storage.from('bucket2').copyObject({
        sourceKey,
        destinationBucket: 'bucket2',
        destinationKey,
        uploadType: 'standard',
      })

      expect(S3Backend.prototype.copyObject).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          cacheControl: 'max-age=60',
          mimetype: 'image/png',
        }),
        undefined,
        { copyMetadata: true }
      )
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', [sourceKey, destinationKey])
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('check if RLS policies are respected: authenticated user is able to copy authenticated resource', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/copy',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        bucketId: 'bucket2',
        sourceKey: 'authenticated/casestudy.png',
        destinationKey: 'authenticated/casestudy11.png',
      },
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.copyObject).toHaveBeenCalled()
    const jsonResponse = await response.json()
    expect(jsonResponse.Key).toBe(`bucket2/authenticated/casestudy11.png`)
  })

  test('can copy objects across buckets', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/copy',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        bucketId: 'bucket2',
        sourceKey: 'authenticated/casestudy.png',
        destinationBucket: 'bucket3',
        destinationKey: 'authenticated/casestudy11.png',
      },
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.copyObject).toHaveBeenCalled()
    const jsonResponse = await response.json()

    expect(jsonResponse.Key).toBe(`bucket3/authenticated/casestudy11.png`)
  })

  test('can copy objects keeping their metadata', async () => {
    const copiedKey = 'casestudy-2349.png'
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/copy',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        bucketId: 'bucket2',
        sourceKey: 'authenticated/casestudy.png',
        destinationKey: `authenticated/${copiedKey}`,
        copyMetadata: true,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.copyObject).toHaveBeenCalled()
    expect(S3Backend.prototype.copyObject).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.any(String),
      null,
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        cacheControl: 'no-cache',
      }),
      undefined,
      { copyMetadata: true }
    )
    const jsonResponse = response.json()
    expect(jsonResponse.Key).toBe(`bucket2/authenticated/${copiedKey}`)

    const conn = await getSuperuserPostgrestClient()
    const object = await findObject(conn, 'bucket2', `authenticated/${copiedKey}`)

    expect(object).not.toBeFalsy()
    expect(object!.user_metadata).toEqual({
      test1: 1234,
    })
  })

  test('can copy objects to itself overwriting their metadata', async () => {
    const copiedKey = 'casestudy-2349.png'
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/copy',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
        'x-upsert': 'true',
        'x-metadata': Buffer.from(
          JSON.stringify({
            newMetadata: 'test1',
          })
        ).toString('base64'),
      },
      payload: {
        bucketId: 'bucket2',
        sourceKey: `authenticated/${copiedKey}`,
        destinationKey: `authenticated/${copiedKey}`,
        metadata: {
          cacheControl: 'max-age=999',
          mimetype: 'image/gif',
        },
        copyMetadata: false,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.copyObject).toHaveBeenCalled()
    expect(S3Backend.prototype.copyObject).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        cacheControl: 'max-age=999',
        mimetype: 'image/gif',
      }),
      undefined,
      { copyMetadata: false }
    )
    const parsedBody = JSON.parse(response.body)

    expect(parsedBody.Key).toBe(`bucket2/authenticated/${copiedKey}`)
    expect(parsedBody.name).toBe(`authenticated/${copiedKey}`)
    expect(parsedBody.bucket_id).toBe(`bucket2`)
    expect(parsedBody.metadata).toEqual(
      expect.objectContaining({
        cacheControl: 'max-age=999',
        mimetype: 'image/gif',
      })
    )

    const conn = await getSuperuserPostgrestClient()
    const object = await findObject(conn, 'bucket2', `authenticated/${copiedKey}`)

    expect(object).not.toBeFalsy()
    expect(object!.user_metadata).toEqual({
      newMetadata: 'test1',
    })
    expect(object!.metadata).toEqual(
      expect.objectContaining({
        cacheControl: 'max-age=999',
        mimetype: 'image/gif',
      })
    )
  })

  test('can copy objects excluding their metadata', async () => {
    const copiedKey = 'casestudy-2450.png'
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/copy',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        bucketId: 'bucket2',
        sourceKey: 'authenticated/casestudy.png',
        destinationKey: `authenticated/${copiedKey}`,
        copyMetadata: false,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.copyObject).toHaveBeenCalled()
    const jsonResponse = response.json()
    expect(jsonResponse.Key).toBe(`bucket2/authenticated/${copiedKey}`)

    const conn = await getSuperuserPostgrestClient()
    const object = await findObject(conn, 'bucket2', `authenticated/${copiedKey}`)

    expect(object).not.toBeFalsy()
    expect(object!.user_metadata).toBeNull()
  })

  test('preserves omitted replaceable metadata fields for REST copies', async () => {
    const runId = randomUUID()
    const sourceKey = `authenticated/copy-replace-source-${runId}.png`
    const destinationKey = `authenticated/copy-replace-destination-${runId}.png`
    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, {
      bucket_id: 'bucket2',
      name: sourceKey,
      owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
      version: `copy-replace-source-version-${runId}`,
      metadata: {
        cacheControl: 'max-age=60',
        eTag: `source-${runId}`,
        mimetype: 'image/png',
        size: 1234,
      },
    })
    await seedTx.commit()
    tnx = undefined
    let verificationTx: DatabaseTransaction | undefined

    try {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/object/copy',
        headers: {
          authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
        },
        payload: {
          bucketId: 'bucket2',
          sourceKey,
          destinationKey,
          metadata: {
            cacheControl: 'max-age=999',
          },
          copyMetadata: false,
        },
      })

      expect(response.statusCode).toBe(200)
      expect(S3Backend.prototype.copyObject).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          cacheControl: 'max-age=999',
          mimetype: 'image/png',
        }),
        undefined,
        { copyMetadata: false }
      )

      verificationTx = await getSuperuserPostgrestClient()
      const object = await findObject(verificationTx, 'bucket2', destinationKey)

      expect(object).not.toBeFalsy()
      expect(object!.metadata).toEqual(
        expect.objectContaining({
          cacheControl: 'max-age=999',
          mimetype: 'image/png',
        })
      )
    } finally {
      if (verificationTx) {
        await verificationTx.commit()
        verificationTx = undefined
        tnx = undefined
      }
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', [sourceKey, destinationKey])
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('cannot copy objects across buckets when RLS dont allow it', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/copy',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        bucketId: 'bucket2',
        sourceKey: 'authenticated/casestudy.png',
        destinationBucket: 'bucket3',
        destinationKey: 'somekey/casestudy11.png',
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('check if RLS policies are respected: anon user is not able to update authenticated resource', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/copy',
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
      payload: {
        bucketId: 'bucket2',
        sourceKey: 'authenticated/casestudy.png',
        destinationKey: 'authenticated/casestudy11.png',
      },
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.copyObject).not.toHaveBeenCalled()
  })

  test('user is not able to copy a resource without Auth header', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/copy',
      payload: {
        bucketId: 'bucket2',
        sourceKey: 'authenticated/casestudy.png',
        destinationKey: 'authenticated/casestudy11.png',
      },
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.copyObject).not.toHaveBeenCalled()
  })

  test('return 400 when copy from a non existent bucket', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/copy',
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
      payload: {
        bucketId: 'notfound',
        sourceKey: 'authenticated/casestudy.png',
        destinationKey: 'authenticated/casestudy11.png',
      },
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.copyObject).not.toHaveBeenCalled()
  })

  test('return 400 when copying a non existent key', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/copy',
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
      payload: {
        bucketId: 'bucket2',
        sourceKey: 'authenticated/notfound.png',
        destinationKey: 'authenticated/casestudy11.png',
      },
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.copyObject).not.toHaveBeenCalled()
  })

  test('can copy an object by an existing source version id', async () => {
    const runId = randomUUID()
    const sourceKey = `authenticated/copy-by-version-source-${runId}.png`
    const destinationKey = `authenticated/copy-by-version-destination-${runId}.png`
    const version = `copy-by-version-${runId}`

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, {
      bucket_id: 'bucket2',
      name: sourceKey,
      owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
      version,
      metadata: { mimetype: 'image/png', size: 1234 },
    })
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/object/copy',
        headers: {
          authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
        },
        payload: {
          bucketId: 'bucket2',
          sourceKey,
          sourceVersionId: version,
          destinationKey,
        },
      })
      expect(response.statusCode).toBe(200)
      expect(S3Backend.prototype.copyObject).toHaveBeenCalled()
      const jsonResponse = response.json()
      expect(jsonResponse.Key).toBe(`bucket2/${destinationKey}`)
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', [sourceKey, destinationKey])
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('returns NoSuchKey when copying by a source version id that does not exist', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/copy',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        bucketId: 'bucket2',
        sourceKey: 'authenticated/casestudy.png',
        sourceVersionId: 'does-not-exist',
        destinationKey: 'authenticated/copy-by-version-missing.png',
      },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: '404',
      error: 'not_found',
      message: 'Object not found',
      code: ErrorCode.NoSuchKey,
    })
  })
})

/**
 * DELETE /object
 * */
describe('testing delete object', () => {
  test('check if RLS policies are respected: authenticated user is able to delete authenticated resource', async () => {
    const response = await appInstance.inject({
      method: 'DELETE',
      url: '/object/bucket2/authenticated/delete.png',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.deleteObject).toHaveBeenCalled()
  })

  test('check if RLS policies are respected: anon user is not able to delete authenticated resource', async () => {
    const response = await appInstance.inject({
      method: 'DELETE',
      url: '/object/bucket2/authenticated/delete1.png',
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.deleteObject).not.toHaveBeenCalled()
  })

  test('user is not able to delete a resource without Auth header', async () => {
    const response = await appInstance.inject({
      method: 'DELETE',
      url: '/object/bucket2/authenticated/delete1.png',
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.deleteObject).not.toHaveBeenCalled()
  })

  test('return 400 when delete from a non existent bucket', async () => {
    const response = await appInstance.inject({
      method: 'DELETE',
      url: '/object/notfound/authenticated/delete1.png',
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.deleteObject).not.toHaveBeenCalled()
  })

  test('return 400 when deleting a non existent key', async () => {
    const response = await appInstance.inject({
      method: 'DELETE',
      url: '/object/notfound/authenticated/notfound.jpg',
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.deleteObject).not.toHaveBeenCalled()
  })

  test('can delete an object by an existing version id', async () => {
    const runId = randomUUID()
    const objectName = `authenticated/delete-by-version-${runId}.png`
    const version = `delete-by-version-${runId}`

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, {
      bucket_id: 'bucket2',
      name: objectName,
      owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
      version,
      metadata: { mimetype: 'image/png', size: 1234 },
    })
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'DELETE',
        url: `/object/bucket2/${objectName}?versionId=${version}`,
        headers: {
          authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
        },
      })
      expect(response.statusCode).toBe(200)
      expect(S3Backend.prototype.deleteObject).toHaveBeenCalled()
      expect(response.json()).toMatchObject({
        message: 'Successfully deleted',
      })
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', [objectName])
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('returns NoSuchKey when deleting an object by a version id that does not exist', async () => {
    const response = await appInstance.inject({
      method: 'DELETE',
      url: '/object/bucket2/authenticated/casestudy.png?versionId=does-not-exist',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: '404',
      error: 'not_found',
      message: 'Object not found',
      code: ErrorCode.NoSuchKey,
    })
  })
})

/**
 * DELETE /objects
 * */
describe('testing deleting multiple objects', () => {
  test('authenticated user can bulk delete objects up to the request cap', async () => {
    const runId = randomUUID()
    const bucketName = 'bucket2'
    const objectNames = [...Array(MAX_OBJECTS_PER_REQUEST).keys()].map(
      (i) => `authenticated/bulk-delete-${runId}/${i}`
    )

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjectNames(seedTx, bucketName, objectNames)
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'DELETE',
        url: `/object/${bucketName}`,
        headers: {
          authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
        },
        payload: {
          prefixes: objectNames,
        },
      })
      expect(response.statusCode).toBe(200)
      expect(S3Backend.prototype.deleteObjects).toHaveBeenCalled()

      const result = JSON.parse(response.body)
      expect(result).toHaveLength(MAX_OBJECTS_PER_REQUEST)
      expect(result.map((row: { name: string }) => row.name)).toEqual(
        expect.arrayContaining(objectNames)
      )
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, bucketName, objectNames)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('allows delete requests over the object request cap when hard limits are disabled', async () => {
    const response = await appInstance.inject({
      method: 'DELETE',
      url: '/object/bucket2',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        prefixes: [...Array(MAX_OBJECTS_PER_REQUEST + 1).keys()].map(
          (i) => `authenticated/too-many-${i}`
        ),
      },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual([])
    expect(S3Backend.prototype.deleteObjects).not.toHaveBeenCalled()
  })

  test('check if RLS policies are respected: anon user is not able to delete authenticated resource', async () => {
    const response = await appInstance.inject({
      method: 'DELETE',
      url: '/object/bucket2',
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
      payload: {
        prefixes: ['authenticated/delete-multiple3.png', 'authenticated/delete-multiple4.png'],
      },
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.deleteObjects).not.toHaveBeenCalled()
    const results = JSON.parse(response.body)
    expect(results).toHaveLength(0)
  })

  test('user is not able to delete a resource without Auth header', async () => {
    const response = await appInstance.inject({
      method: 'DELETE',
      url: '/object/bucket2',
      payload: {
        prefixes: ['authenticated/delete-multiple3.png', 'authenticated/delete-multiple4.png'],
      },
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.deleteObjects).not.toHaveBeenCalled()
  })

  test('deleting from a non existent bucket', async () => {
    const response = await appInstance.inject({
      method: 'DELETE',
      url: '/object/notfound',
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
      payload: {
        prefixes: ['authenticated/delete-multiple3.png', 'authenticated/delete-multiple4.png'],
      },
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.deleteObjects).not.toHaveBeenCalled()
  })

  test('deleting a non existent key', async () => {
    const response = await appInstance.inject({
      method: 'DELETE',
      url: '/object/bucket2',
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
      payload: {
        prefixes: ['authenticated/delete-multiple5.png', 'authenticated/delete-multiple6.png'],
      },
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.deleteObjects).not.toHaveBeenCalled()
    const results = JSON.parse(response.body)
    expect(results).toHaveLength(0)
  })

  test('check if RLS policies are respected: user has permission to delete only one of the objects', async () => {
    const response = await appInstance.inject({
      method: 'DELETE',
      url: '/object/bucket2',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        prefixes: ['authenticated/delete-multiple7.png', 'private/sadcat-upload3.png'],
      },
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.deleteObjects).toHaveBeenCalled()
    const results = JSON.parse(response.body)
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('authenticated/delete-multiple7.png')
  })

  test('bulk delete with a mix of plain paths and {path, versionId} entries', async () => {
    const runId = randomUUID()
    const bucketName = 'bucket2'
    const plainObjectName = `authenticated/bulk-delete-mixed-plain-${runId}.png`
    const versionedObjectName = `authenticated/bulk-delete-mixed-versioned-${runId}.png`
    const wrongVersionObjectName = `authenticated/bulk-delete-mixed-wrong-version-${runId}.png`
    const allNames = [plainObjectName, versionedObjectName, wrongVersionObjectName]

    const versionedObjectVersion = `current-${randomUUID()}`
    const wrongVersionObjectVersion = `current-${randomUUID()}`

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, [
      {
        bucket_id: bucketName,
        name: plainObjectName,
        owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
        version: `plain-${randomUUID()}`,
        metadata: { size: 1234 },
      },
      {
        bucket_id: bucketName,
        name: versionedObjectName,
        owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
        version: versionedObjectVersion,
        metadata: { size: 1234 },
      },
      {
        bucket_id: bucketName,
        name: wrongVersionObjectName,
        owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
        version: wrongVersionObjectVersion,
        metadata: { size: 1234 },
      },
    ])
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'DELETE',
        url: `/object/${bucketName}`,
        headers: {
          authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
        },
        payload: {
          prefixes: [
            plainObjectName,
            { path: versionedObjectName, versionId: versionedObjectVersion },
            { path: wrongVersionObjectName, versionId: randomUUID() },
          ],
        },
      })

      expect(response.statusCode).toBe(200)
      expect(S3Backend.prototype.deleteObjects).toHaveBeenCalled()

      const results = JSON.parse(response.body)
      expect(results).toHaveLength(2)
      expect(results.map((row: { name: string }) => row.name)).toEqual(
        expect.arrayContaining([plainObjectName, versionedObjectName])
      )

      const verifyTx = await getSuperuserPostgrestClient()
      const remaining = await findObject(verifyTx, bucketName, wrongVersionObjectName)
      expect(remaining).toBeDefined()
      expect(remaining?.version).toBe(wrongVersionObjectVersion)
      await verifyTx.commit()
      tnx = undefined
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, bucketName, allNames)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })
})

/**
 * POST /sign/:bucketName/*
 */
describe('testing generating signed URL', () => {
  test('check if RLS policies are respected: authenticated user is able to sign URL for an authenticated resource', async () => {
    const assetUrl = 'bucket2/authenticated/cat.jpg'
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/sign/' + assetUrl,
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        expiresIn: 1000,
      },
    })
    expect(response.statusCode).toBe(200)
    const result = JSON.parse(response.body)
    expect(result.signedURL).toBeTruthy()
    expect(result.signedURL).toContain('?token=')

    // verify was correctly signed with jwtSecret
    const token = result.signedURL.split('?token=').pop()
    const jwtData = (await verifyJWT(token, jwtSecret)) as SignedToken
    expect(jwtData.url).toBe(assetUrl)
  })

  test('check if url signing key is used to sign urls (instead of jwtSecret) if it is present', async () => {
    const signingJwk = { ...(await generateHS512JWK()), kid: 'qwerty-09876' } as JwksConfigKeyOCT
    const jwtJWKS: JwksConfig = { keys: [signingJwk], urlSigningKey: signingJwk }
    mergeConfig({ jwtJWKS })

    const assetUrl = 'bucket2/authenticated/cat.jpg'
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/sign/' + assetUrl,
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        expiresIn: 1000,
      },
    })
    expect(response.statusCode).toBe(200)
    const result = JSON.parse(response.body)
    expect(result.signedURL).toBeTruthy()
    expect(result.signedURL).toContain('?token=')

    // verify was correctly signed with url signing key (jwk)
    const token = result.signedURL.split('?token=').pop()
    const jwtData = (await verifyJWT(token, 'invalid-old-jwt-secret', jwtJWKS)) as SignedToken
    expect(jwtData.url).toBe(assetUrl)
  })

  test('check if RLS policies are respected: anon user is not able to generate signedURL for authenticated resource', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/sign/bucket2/authenticated/cat.jpg',
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
      payload: {
        expiresIn: 1000,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('user is not able to generate signedURLs without Auth header', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/sign/bucket2/authenticated/cat.jpg',
      payload: {
        expiresIn: 1000,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('return 400 when generate signed urls from a non existent bucket', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/sign/notfound/authenticated/cat.jpg',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        expiresIn: 1000,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('signing url of a non existent key', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/sign/bucket2/authenticated/notfound.jpg',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        expiresIn: 1000,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('rejects oversized expiresIn values for signed URLs before jwt signing', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/sign/bucket2/authenticated/cat.jpg',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        expiresIn: 1e21,
      },
    })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).message).toContain('expiresIn')
  })

  test('rejects expiresIn values above the current runtime maximum for signed URLs', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/sign/bucket2/authenticated/cat.jpg',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        expiresIn: getMaxNumericJWTExpiration() + 10,
      },
    })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).message).toContain('expiresIn')
  })

  test('can sign a URL by an existing version id', async () => {
    const runId = randomUUID()
    const objectName = `authenticated/sign-by-version-${runId}.png`
    const version = `sign-by-version-${runId}`

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, {
      bucket_id: 'bucket2',
      name: objectName,
      owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
      version,
      metadata: { mimetype: 'image/png', size: 1234 },
    })
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'POST',
        url: `/object/sign/bucket2/${objectName}`,
        headers: {
          authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
        },
        payload: {
          expiresIn: 1000,
          versionId: version,
        },
      })
      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.signedURL).toBeTruthy()

      const token = result.signedURL.split('?token=').pop()
      const jwtData = (await verifyJWT(token, jwtSecret)) as SignedToken
      expect(jwtData.versionId).toBe(version)
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', [objectName])
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('returns NoSuchKey when signing a URL by a version id that does not exist', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/sign/bucket2/authenticated/casestudy.png',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        expiresIn: 1000,
        versionId: 'does-not-exist',
      },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: '404',
      error: 'not_found',
      message: 'Object not found',
      code: ErrorCode.NoSuchKey,
    })
  })
})

/**
 * POST /upload/sign/:bucketName/*
 */
describe('testing generating signed URL for upload', () => {
  test('check if RLS policies are respected: authenticated user is able to sign upload URL for a resource', async () => {
    const BUCKET_ID = 'bucket2'
    const OBJECT_NAME = 'authenticated/cat1.jpg'

    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/upload/sign/${BUCKET_ID}/${OBJECT_NAME}`,
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(200)
    const result = JSON.parse(response.body)
    expect(result.url).toBeTruthy()
    // Ensure that row does not exist in database.
    const db = await getSuperuserPostgrestClient()
    const objectResponse = await findObject(db, BUCKET_ID, OBJECT_NAME)
    expect(objectResponse).toBe(undefined)
  })

  test('check if RLS policies are respected: anon user is not able to sign upload URL for authenticated resource', async () => {
    const BUCKET_ID = 'bucket2'
    const OBJECT_NAME = 'authenticated/cat1.jpg'

    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/upload/sign/${BUCKET_ID}/${OBJECT_NAME}`,
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
    })
    expect(response.statusCode).toBe(400)
    expect(response.body).toBe(
      JSON.stringify({
        statusCode: '403',
        error: 'Unauthorized',
        message: 'new row violates row-level security policy',
        code: ErrorCode.AccessDenied,
      })
    )
    // Ensure that row does not exist in database.
    const db = await getSuperuserPostgrestClient()
    const objectResponse = await findObject(db, BUCKET_ID, OBJECT_NAME)
    expect(objectResponse).toBe(undefined)
  })

  test('user is not able to sign a upload url without Auth header', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/upload/sign/bucket2/authenticated/cat.jpg',
    })
    expect(response.statusCode).toBe(400)
  })

  test('return 400 when generating signed upload urls from a non existent bucket', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/upload/sign/notfound/authenticated/cat.jpg',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('signing upload url of a non existent key', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/upload/sign/bucket2/authenticated/notfound.jpg',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(200)
  })

  test('signing upload url of an existent key', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/upload/sign/bucket2/authenticated/cat.jpg',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).statusCode).toBe('409')
  })
})

/**
 * PUT /upload/sign/:bucketName/*
 */
describe('testing uploading with generated signed upload URL', () => {
  test('upload object with a token', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      'content-type': 'image/jpeg',
    })

    const BUCKET_ID = 'bucket2'
    const OBJECT_NAME = 'public/sadcat-upload1.png'
    const urlToSign = `${BUCKET_ID}/${OBJECT_NAME}`
    const owner = '317eadce-631a-4429-a0bb-f19a7a517b4a'

    const jwtToken = await signJWT(
      { owner, url: urlToSign, scope: SIGNED_URL_SCOPE_UPLOAD },
      jwtSecret,
      100
    )
    const response = await appInstance.inject({
      method: 'PUT',
      url: `/object/upload/sign/${urlToSign}?token=${jwtToken}`,
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.uploadObject).toHaveBeenCalled()

    // check that row has neccessary data
    const db = await getSuperuserPostgrestClient()
    const objectResponse = await findObject(db, BUCKET_ID, OBJECT_NAME)
    expect(objectResponse?.owner).toBe(owner)

    // remove row to not to break other tests
    await withDeleteEnabled(db, async (db) => {
      await deleteObjectsByName(db, BUCKET_ID, OBJECT_NAME)
    })
  })

  test('upload object without a token', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      'content-type': 'image/jpeg',
    })

    const response = await appInstance.inject({
      method: 'PUT',
      url: `/object/upload/sign/bucket2/public/sadcat-upload1.png`,
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('upload object with a malformed JWT', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      'content-type': 'image/jpeg',
    })

    const response = await appInstance.inject({
      method: 'PUT',
      url: `/object/upload/sign/bucket2/public/sadcat-upload1.png?token=xxx`,
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('rejects a download-scoped token on the upload endpoint', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      'content-type': 'image/jpeg',
    })

    const urlToSign = `bucket2/public/sadcat-upload1.png`
    // A token minted by the download-signing flow must not be replayable to upload
    const downloadToken = await signJWT(
      { url: urlToSign, scope: SIGNED_URL_SCOPE_DOWNLOAD },
      jwtSecret,
      100
    )

    const response = await appInstance.inject({
      method: 'PUT',
      url: `/object/upload/sign/${urlToSign}?token=${downloadToken}`,
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ error: ErrorCode.InvalidSignature })
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('rejects a legacy download-shaped token (no upsert) on the upload endpoint', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      'content-type': 'image/jpeg',
    })

    const urlToSign = `bucket2/public/sadcat-upload1.png`
    const owner = '317eadce-631a-4429-a0bb-f19a7a517b4a'
    // No scope claim and no `upsert` claim — i.e. a download-shaped token — is rejected,
    // even though it predates scoping. Only legacy *upload* tokens (with upsert) are honored.
    const unscopedToken = await signJWT({ owner, url: urlToSign }, jwtSecret, 100)

    const response = await appInstance.inject({
      method: 'PUT',
      url: `/object/upload/sign/${urlToSign}?token=${unscopedToken}`,
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ error: ErrorCode.InvalidSignature })
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('accepts a legacy upload token (no scope, with upsert) for backward compatibility', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      'content-type': 'image/jpeg',
    })

    const BUCKET_ID = 'bucket2'
    const OBJECT_NAME = 'public/sadcat-legacy-upload.png'
    const urlToSign = `${BUCKET_ID}/${OBJECT_NAME}`
    const owner = '317eadce-631a-4429-a0bb-f19a7a517b4a'
    // Token shaped exactly like one minted before scoping existed: owner + url + upsert, no scope
    const legacyUploadToken = await signJWT(
      { owner, url: urlToSign, upsert: false },
      jwtSecret,
      100
    )

    const response = await appInstance.inject({
      method: 'PUT',
      url: `/object/upload/sign/${urlToSign}?token=${legacyUploadToken}`,
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.uploadObject).toHaveBeenCalled()

    // cleanup so the test can be re-run against the same dataset
    const db = await getSuperuserPostgrestClient()
    await withDeleteEnabled(db, async (db) => {
      await deleteObjectsByName(db, BUCKET_ID, OBJECT_NAME)
    })
  })

  test('upload object with an expired JWT', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      'content-type': 'image/jpeg',
    })

    const BUCKET_ID = 'bucket2'
    const OBJECT_NAME = 'public/sadcat-upload1.png'
    const urlToSign = `${BUCKET_ID}/${OBJECT_NAME}`
    const owner = '317eadce-631a-4429-a0bb-f19a7a517b4a'

    const jwtToken = await signJWT(
      { owner, url: urlToSign, scope: SIGNED_URL_SCOPE_UPLOAD },
      jwtSecret,
      '-1s'
    )
    const response = await appInstance.inject({
      method: 'PUT',
      url: `/object/upload/sign/${urlToSign}?token=${jwtToken}`,
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  test('upload object with a tampered signed upload token', async () => {
    const form = new FormData()
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      'content-type': 'image/jpeg',
    })

    const BUCKET_ID = 'bucket2'
    const OBJECT_NAME = 'public/sadcat-upload1.png'
    const urlToSign = `${BUCKET_ID}/${OBJECT_NAME}`
    const owner = '317eadce-631a-4429-a0bb-f19a7a517b4a'
    const jwtToken = await signJWT(
      { owner, url: urlToSign, scope: SIGNED_URL_SCOPE_UPLOAD },
      jwtSecret,
      100
    )
    const signatureStart = jwtToken.lastIndexOf('.') + 1
    const signatureChar = jwtToken[signatureStart]
    const tamperedToken = `${jwtToken.slice(0, signatureStart)}${
      signatureChar === 'a' ? 'b' : 'a'
    }${jwtToken.slice(signatureStart + 1)}`

    const response = await appInstance.inject({
      method: 'PUT',
      url: `/object/upload/sign/${urlToSign}?token=${tamperedToken}`,
      headers,
      payload: form,
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({
      statusCode: '400',
      error: ErrorCode.InvalidJWT,
    })
    expect(S3Backend.prototype.uploadObject).not.toHaveBeenCalled()
  })

  it('will allow overwriting a file when the generating a signed upload url with x-upsert:true', async () => {
    function createUpload() {
      const form = new FormData()
      form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
      return form
    }

    const BUCKET_ID = 'bucket2'
    const OBJECT_NAME = 'signed/sadcat-upload-signed-2.png'
    const urlToSign = `${BUCKET_ID}/${OBJECT_NAME}`

    // Upload a file first
    const resp = await appInstance.inject({
      method: 'POST',
      url: `/object/${urlToSign}`,
      payload: createUpload(),
      headers: {
        'x-upsert': 'true',
        authorization: await serviceKeyAsync,
      },
    })

    expect(resp.statusCode).toBe(200)

    // generate signed upload url with upsert
    const signedUrlResp = await appInstance.inject({
      method: 'POST',
      url: `/object/upload/sign/${urlToSign}`,
      headers: {
        'x-upsert': 'true',
        authorization: await serviceKeyAsync,
      },
    })
    expect(signedUrlResp.statusCode).toBe(200)

    const jwtToken = (await signedUrlResp.json()).token
    const response = await appInstance.inject({
      method: 'PUT',
      url: `/object/upload/sign/${urlToSign}?token=${jwtToken}`,
      payload: createUpload(),
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.uploadObject).toHaveBeenCalled()
  })

  it('will allow not be able overwriting a file when the generating a signed upload url without x-upsert header', async () => {
    function createUpload() {
      const form = new FormData()
      form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
      return form
    }

    const BUCKET_ID = 'bucket2'
    const OBJECT_NAME = 'signed/sadcat-upload-signed-3.png'
    const urlToSign = `${BUCKET_ID}/${OBJECT_NAME}`
    const owner = '317eadce-631a-4429-a0bb-f19a7a517b4a'

    // Upload a file first
    const resp = await appInstance.inject({
      method: 'POST',
      url: `/object/${urlToSign}`,
      payload: createUpload(),
      headers: {
        authorization: await serviceKeyAsync,
      },
    })

    expect(resp.statusCode).toBe(200)

    const jwtToken = await signJWT(
      { owner, url: urlToSign, scope: SIGNED_URL_SCOPE_UPLOAD },
      jwtSecret,
      100
    )
    const response = await appInstance.inject({
      method: 'PUT',
      url: `/object/upload/sign/${urlToSign}?token=${jwtToken}`,
      payload: createUpload(),
    })
    expect(response.statusCode).toBe(400)
  })
})

/**
 * POST /sign/:bucketName
 */
describe('testing generating signed URLs', () => {
  test('check if RLS policies are respected: authenticated user is able to sign URLs for an authenticated resource', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/sign/bucket2',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        expiresIn: 1000,
        paths: [...Array(MAX_OBJECTS_PER_REQUEST).keys()].map((i) => `authenticated/${i}`),
      },
    })
    expect(response.statusCode).toBe(200)
    const result = JSON.parse(response.body)
    expect(result).toHaveLength(MAX_OBJECTS_PER_REQUEST)
  })

  test('authenticated user can sign URLs up to the request cap', async () => {
    const runId = randomUUID()
    const bucketName = 'bucket2'
    const objectNames = [...Array(MAX_OBJECTS_PER_REQUEST).keys()].map(
      (i) => `authenticated/bulk-sign-${runId}/${i}`
    )

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjectNames(seedTx, bucketName, objectNames)
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'POST',
        url: `/object/sign/${bucketName}`,
        headers: {
          authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
        },
        payload: {
          expiresIn: 1000,
          paths: objectNames,
        },
      })
      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body) as SignedUrlResult[]
      expect(result).toHaveLength(MAX_OBJECTS_PER_REQUEST)
      expect(
        result.every(({ error, signedURL }) => {
          return error === null && signedURL !== null
        })
      ).toBe(true)
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, bucketName, objectNames)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('check if RLS policies are respected: anon user is not able to generate signedURLs for authenticated resource', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/sign/bucket2',
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
      payload: {
        expiresIn: 1000,
        paths: [...Array(MAX_OBJECTS_PER_REQUEST).keys()].map((i) => `authenticated/${i}`),
      },
    })
    expect(response.statusCode).toBe(200)
    const result = JSON.parse(response.body)
    expect(result[0].error).toBe('Either the object does not exist or you do not have access to it')
  })

  test('user is not able to generate signedURLs without Auth header', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/sign/bucket2',
      payload: {
        expiresIn: 1000,
        paths: [...Array(MAX_OBJECTS_PER_REQUEST).keys()].map((i) => `authenticated/${i}`),
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('rejects signed URL requests over the object request cap', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/sign/bucket2',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        expiresIn: 1000,
        paths: [...Array(MAX_OBJECTS_PER_REQUEST + 1).keys()].map(
          (i) => `authenticated/too-many-${i}`
        ),
      },
    })

    expect(response.statusCode).toBe(400)
  })

  test('return 400 when generate signed urls from a non existent bucket', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/sign/notfound',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        expiresIn: 1000,
        paths: [...Array(MAX_OBJECTS_PER_REQUEST).keys()].map((i) => `authenticated/${i}`),
      },
    })
    expect(response.statusCode).toBe(200)
    const result = JSON.parse(response.body)
    expect(result[0].error).toBe('Either the object does not exist or you do not have access to it')
  })

  test('signing url of a non existent key', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/sign/bucket2clearAllMocks',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        expiresIn: 1000,
        paths: ['authenticated/notfound.jpg'],
      },
    })
    expect(response.statusCode).toBe(200)
    const result = JSON.parse(response.body)
    expect(result[0].error).toBe('Either the object does not exist or you do not have access to it')
  })

  test('rejects oversized expiresIn values for batch signed URLs before jwt signing', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/sign/bucket2',
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
      payload: {
        expiresIn: 1e21,
        paths: ['authenticated/cat.jpg'],
      },
    })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).message).toContain('expiresIn')
  })
})

/**
 * GET /public/
 */
// these tests are written in bucket.test.ts since its easier

/**
 * signObjectUrl payload hardening (signing-oracle defense)
 */
describe('signObjectUrl token claim hardening', () => {
  const h = useStorage()

  test('attacker-controlled metadata cannot override url/scope or inject upload claims', async () => {
    const objectName = 'public/sadcat-upload.png'
    const signedURL = await h.storage
      .from('bucket2')
      .signObjectUrl(objectName, `/object/sign/bucket2/${objectName}`, 100, {
        // a future caller passing these must never be able to forge the token
        url: 'other-bucket/secret.png',
        scope: SIGNED_URL_SCOPE_UPLOAD,
        role: 'service_role',
        upsert: true,
        owner: 'attacker',
      } as never)

    const token = signedURL.split('?token=').pop() as string
    const payload = (await verifyJWT(token, jwtSecret)) as Record<string, unknown>

    // url stays pinned to the real object path, scope stays 'download'
    expect(payload.url).toBe(`bucket2/${objectName}`)
    expect(payload.scope).toBe(SIGNED_URL_SCOPE_DOWNLOAD)
    // role and the upload-discriminating claims are stripped entirely
    expect(payload.role).toBeUndefined()
    expect(payload.upsert).toBeUndefined()
    expect(payload.owner).toBeUndefined()
  })
})

/**
 * GET /sign/
 */
describe('testing retrieving signed URL', () => {
  test('get object with a token', async () => {
    const urlToSign = 'bucket2/public/sadcat-upload.png'
    const jwtToken = await signJWT({ url: urlToSign }, jwtSecret, 100)
    const response = await appInstance.inject({
      method: 'GET',
      url: `/object/sign/${urlToSign}?token=${jwtToken}`,
    })
    expect(response.statusCode).toBe(200)
    expect(response.headers['x-robots-tag']).toBe('none')
    expect(response.headers['etag']).toBe('abc')
    expect(response.headers['last-modified']).toBe('Thu, 12 Aug 2021 16:00:00 GMT')
  })

  test('get object with jwk generated token', async () => {
    const signingJwk = { ...(await generateHS512JWK()), kid: 'abc-123' } as JwksConfigKeyOCT
    mergeConfig({ jwtJWKS: { keys: [signingJwk] } })

    const urlToSign = 'bucket2/public/sadcat-upload.png'
    const jwtToken = await signJWT({ url: urlToSign }, signingJwk, 100)
    const response = await appInstance.inject({
      method: 'GET',
      url: `/object/sign/${urlToSign}?token=${jwtToken}`,
    })
    expect(response.statusCode).toBe(200)
    expect(response.headers['etag']).toBe('abc')
    expect(response.headers['last-modified']).toBe('Thu, 12 Aug 2021 16:00:00 GMT')
  })

  test('forward 304 and If-Modified-Since/If-None-Match headers', async () => {
    const mockGetObject = vi.spyOn(S3Backend.prototype, 'getObject')
    mockGetObject.mockRejectedValue({
      $metadata: {
        httpStatusCode: 304,
      },
    })
    const urlToSign = 'bucket2/public/sadcat-upload.png'
    const jwtToken = await signJWT({ url: urlToSign }, jwtSecret, 100)
    const response = await appInstance.inject({
      method: 'GET',
      url: `/object/sign/${urlToSign}?token=${jwtToken}`,
      headers: {
        'if-modified-since': 'Thu, 12 Aug 2021 16:00:00 GMT',
        'if-none-match': 'abc',
      },
    })
    expect(response.statusCode).toBe(304)
    expect(mockGetObject.mock.calls[0][3]).toMatchObject({
      ifModifiedSince: 'Thu, 12 Aug 2021 16:00:00 GMT',
      ifNoneMatch: 'abc',
    })
  })

  test('rejects an upload-scoped token on the download endpoint', async () => {
    const urlToSign = 'bucket2/public/sadcat-upload.png'
    const owner = '317eadce-631a-4429-a0bb-f19a7a517b4a'
    // A token minted by the upload-signing flow must not be replayable to download
    const uploadToken = await signJWT(
      { owner, url: urlToSign, upsert: false, scope: SIGNED_URL_SCOPE_UPLOAD },
      jwtSecret,
      100
    )
    const response = await appInstance.inject({
      method: 'GET',
      url: `/object/sign/${urlToSign}?token=${uploadToken}`,
    })
    expect(response.statusCode).toBe(400)
    expect(response.json<{ error: string }>().error).toBe('InvalidSignature')
  })

  test('still serves a legacy unscoped download token', async () => {
    const urlToSign = 'bucket2/public/sadcat-upload.png'
    // Tokens issued before scoping existed (no scope claim, no upsert) remain valid for download
    const legacyToken = await signJWT({ url: urlToSign }, jwtSecret, 100)
    const response = await appInstance.inject({
      method: 'GET',
      url: `/object/sign/${urlToSign}?token=${legacyToken}`,
    })
    expect(response.statusCode).toBe(200)
  })

  test('rejects a legacy upload-shaped token (with upsert) on the download endpoint', async () => {
    const urlToSign = 'bucket2/public/sadcat-upload.png'
    const owner = '317eadce-631a-4429-a0bb-f19a7a517b4a'
    // A legacy upload token (no scope, but carrying upsert) must not be replayable to read
    const legacyUploadToken = await signJWT(
      { owner, url: urlToSign, upsert: false },
      jwtSecret,
      100
    )
    const response = await appInstance.inject({
      method: 'GET',
      url: `/object/sign/${urlToSign}?token=${legacyUploadToken}`,
    })
    expect(response.statusCode).toBe(400)
    expect(response.json<{ error: string }>().error).toBe('InvalidSignature')
  })

  test('get object with incorrect url in jwt', async () => {
    const urlToSign = 'bucket2/public/sadcat-upload.png'
    const jwtToken = await signJWT({ url: 'some/other/weird-path.png' }, jwtSecret, 100)
    const response = await appInstance.inject({
      method: 'GET',
      url: `/object/sign/${urlToSign}?token=${jwtToken}`,
    })
    expect(response.statusCode).toBe(400)
    const body = response.json<{ error: string }>()
    expect(body.error).toBe('InvalidSignature')
  })

  test('get object without a token', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: '/object/sign/bucket2/public/sadcat-upload.png',
    })
    expect(response.statusCode).toBe(400)
  })

  test('get object with a malformed JWT', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: '/object/sign/bucket2/public/sadcat-upload.png?token=xxx',
    })
    expect(response.statusCode).toBe(400)
  })

  test('get object with an expired JWT', async () => {
    const urlToSign = 'bucket2/public/sadcat-upload.png'
    const expiredJWT = await signJWT({ url: urlToSign }, jwtSecret, '-1s')
    const response = await appInstance.inject({
      method: 'GET',
      url: `/object/sign/${urlToSign}?token=${expiredJWT}`,
    })
    expect(response.statusCode).toBe(400)
  })

  test('get object with a token pinned to an existing version id', async () => {
    const runId = randomUUID()
    const objectName = `authenticated/redeem-by-version-${runId}.png`
    const version = `redeem-by-version-${runId}`
    const urlToSign = `bucket2/${objectName}`

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, {
      bucket_id: 'bucket2',
      name: objectName,
      owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
      version,
      metadata: { mimetype: 'image/png', size: 1234 },
    })
    await seedTx.commit()
    tnx = undefined

    try {
      const jwtToken = await signJWT({ url: urlToSign, versionId: version }, jwtSecret, 100)
      const response = await appInstance.inject({
        method: 'GET',
        url: `/object/sign/${urlToSign}?token=${jwtToken}`,
      })
      expect(response.statusCode).toBe(200)
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', [objectName])
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('returns NoSuchKey for a token pinned to a version id that does not exist', async () => {
    const urlToSign = 'bucket2/authenticated/casestudy.png'
    const jwtToken = await signJWT({ url: urlToSign, versionId: 'does-not-exist' }, jwtSecret, 100)
    const response = await appInstance.inject({
      method: 'GET',
      url: `/object/sign/${urlToSign}?token=${jwtToken}`,
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: '404',
      error: 'not_found',
      message: 'Object not found',
      code: ErrorCode.NoSuchKey,
    })
  })
})

describe('testing move object', () => {
  test('check if RLS policies are respected: authenticated user is able to move an authenticated object', async () => {
    const objectAdminDeleteSendSpy = vi.spyOn(ObjectAdminDelete, 'send')
    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/move`,
      payload: {
        sourceKey: 'authenticated/move-orig.png',
        destinationKey: 'authenticated/move-new.png',
        bucketId: 'bucket2',
      },
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.copyObject).toHaveBeenCalled()
    expect(objectAdminDeleteSendSpy).toHaveBeenCalled()
  })

  test('can move objects across buckets respecting RLS', async () => {
    const objectAdminDeleteSendSpy = vi.spyOn(ObjectAdminDelete, 'send')
    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/move`,
      payload: {
        bucketId: 'bucket2',
        sourceKey: 'authenticated/move-orig-4.png',
        destinationBucket: 'bucket3',
        destinationKey: 'authenticated/move-new.png',
      },
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(S3Backend.prototype.copyObject).toHaveBeenCalled()
    expect(objectAdminDeleteSendSpy).toHaveBeenCalled()
  })

  test('cross-bucket move rollback should cleanup destination bucket object', async () => {
    const runId = randomUUID()
    const sourceKey = `authenticated/move-orig-rollback-${runId}.png`
    const destinationKey = `authenticated/move-new-rollback-${runId}.png`
    const destinationBucket = 'bucket3'
    const objectAdminDeleteSendSpy = vi.spyOn(ObjectAdminDelete, 'send')

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, {
      bucket_id: 'bucket2',
      name: sourceKey,
      owner: '317eadce-631a-4429-a0bb-f19a7a517b4a',
      version: `rollback-version-${runId}`,
      metadata: { mimetype: 'image/png', size: 1234 },
    })
    await seedTx.commit()
    tnx = undefined

    vi.spyOn(S3Backend.prototype, 'headObject').mockRejectedValueOnce(
      new Error('forced move failure')
    )

    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/move`,
      payload: {
        bucketId: 'bucket2',
        sourceKey,
        destinationBucket,
        destinationKey,
      },
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })

    expect(response.statusCode).toBeGreaterThanOrEqual(400)
    expect(S3Backend.prototype.copyObject).toHaveBeenCalled()
    expect(objectAdminDeleteSendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: destinationKey,
        bucketId: destinationBucket,
      })
    )
  })

  test('cannot move objects across buckets because RLS checks', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/move`,
      payload: {
        bucketId: 'bucket2',
        sourceKey: 'authenticated/move-orig-5.png',
        destinationBucket: 'bucket3',
        destinationKey: 'somekey/move-new.png',
      },
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.copyObject).not.toHaveBeenCalled()
    expect(S3Backend.prototype.deleteObjects).not.toHaveBeenCalled()
  })

  test('check if RLS policies are respected: anon user is not able to move an authenticated object', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/move`,
      payload: {
        sourceKey: 'authenticated/move-orig-2.png',
        destinationKey: 'authenticated/move-new-2.png',
        bucketId: 'bucket2',
      },
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.copyObject).not.toHaveBeenCalled()
    expect(S3Backend.prototype.deleteObject).not.toHaveBeenCalled()
  })

  test('user is not able to move an object without auth header', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/move`,
      payload: {
        sourceKey: 'authenticated/move-orig-3.png',
        destinationKey: 'authenticated/move-orig-new-3.png',
        bucketId: 'bucket2',
      },
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.copyObject).not.toHaveBeenCalled()
    expect(S3Backend.prototype.deleteObject).not.toHaveBeenCalled()
  })

  test('user is not able to move an object in a non existent bucket', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/move`,
      payload: {
        sourceKey: 'authenticated/move-orig-3.png',
        destinationKey: 'authenticated/move-orig-new-3.png',
        bucketId: 'notfound',
      },
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.copyObject).not.toHaveBeenCalled()
    expect(S3Backend.prototype.deleteObject).not.toHaveBeenCalled()
  })

  test('user is not able to move an non existent object', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/move`,
      payload: {
        sourceKey: 'authenticated/notfound',
        destinationKey: 'authenticated/move-orig-new-3.png',
        bucketId: 'bucket2',
      },
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.copyObject).not.toHaveBeenCalled()
    expect(S3Backend.prototype.deleteObject).not.toHaveBeenCalled()
  })

  test('user is not able to move to an existing key', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/move`,
      payload: {
        sourceKey: 'authenticated/move-orig-2.png',
        destinationKey: 'authenticated/move-orig-3.png',
        bucketId: 'bucket2',
      },
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(400)
    expect(S3Backend.prototype.copyObject).not.toHaveBeenCalled()
    expect(S3Backend.prototype.deleteObject).not.toHaveBeenCalled()
  })

  test('can move an object by an existing source version id', async () => {
    const objectAdminDeleteSendSpy = vi.spyOn(ObjectAdminDelete, 'send')
    const runId = randomUUID()
    const sourceKey = `authenticated/move-by-version-source-${runId}.png`
    const destinationKey = `authenticated/move-by-version-destination-${runId}.png`
    const version = `move-by-version-${runId}`

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, {
      bucket_id: 'bucket2',
      name: sourceKey,
      owner: '317eadce-631a-4429-a0bb-f19a7a517b4a',
      version,
      metadata: { mimetype: 'image/png', size: 1234 },
    })
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'POST',
        url: `/object/move`,
        payload: {
          bucketId: 'bucket2',
          sourceKey,
          sourceVersionId: version,
          destinationKey,
        },
        headers: {
          authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
        },
      })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({ message: 'Successfully moved' })
      expect(S3Backend.prototype.copyObject).toHaveBeenCalled()
      expect(objectAdminDeleteSendSpy).toHaveBeenCalled()

      const conn = await getSuperuserPostgrestClient()
      const destinationObject = await findObject(conn, 'bucket2', destinationKey)
      expect(destinationObject).not.toBeFalsy()
      const sourceObject = await findObject(conn, 'bucket2', sourceKey)
      expect(sourceObject).toBeFalsy()
      await conn.commit()
      tnx = undefined
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', [sourceKey, destinationKey])
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('returns NoSuchKey when moving by a source version id that does not exist', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/move`,
      payload: {
        bucketId: 'bucket2',
        sourceKey: 'authenticated/casestudy.png',
        sourceVersionId: 'does-not-exist',
        destinationKey: 'authenticated/move-by-version-missing.png',
      },
      headers: {
        authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
      },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      statusCode: '404',
      error: 'not_found',
      message: 'Object not found',
      code: ErrorCode.NoSuchKey,
    })
  })
})

describe('testing list objects', () => {
  test('list-v1 deleteMarkers=only advances in descending name order', async () => {
    const runId = randomUUID()
    const bucketName = 'bucket2'
    const prefix = `delete-marker-desc-${runId}/`
    const objectNames = ['a.txt', 'b.txt', 'c.txt', 'd.txt', 'e.txt', 'f.txt'].map(
      (name) => `${prefix}${name}`
    )
    const markerNames = new Set(['b.txt', 'd.txt', 'f.txt'])
    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(
      seedTx,
      objectNames.map((name) => ({
        bucket_id: bucketName,
        name,
        version: `${runId}-${name}`,
        is_delete_marker: markerNames.has(name.slice(prefix.length)),
        is_versioned: true,
      }))
    )
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'POST',
        url: `/object/list/${bucketName}`,
        headers: {
          authorization: `Bearer ${await serviceKeyAsync}`,
        },
        payload: {
          prefix,
          limit: 10,
          offset: 0,
          noncurrentVersions: 'exclude',
          deleteMarkers: 'only',
          sortBy: { column: 'name', order: 'desc' },
        },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json<{ name: string }[]>().map((object) => object.name)).toEqual([
        'f.txt',
        'd.txt',
        'b.txt',
      ])
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, bucketName, objectNames)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('list-v1 deleteMarkers=only advances in ascending name order without duplicating rows', async () => {
    const runId = randomUUID()
    const bucketName = 'bucket2'
    const prefix = `delete-marker-asc-${runId}/`
    const objectNames = ['a.txt', 'b.txt', 'c.txt', 'd.txt', 'e.txt', 'f.txt'].map(
      (name) => `${prefix}${name}`
    )
    const markerNames = new Set(['b.txt', 'd.txt', 'f.txt'])
    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(
      seedTx,
      objectNames.map((name) => ({
        bucket_id: bucketName,
        name,
        version: `${runId}-${name}`,
        is_delete_marker: markerNames.has(name.slice(prefix.length)),
        is_versioned: true,
      }))
    )
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'POST',
        url: `/object/list/${bucketName}`,
        headers: {
          authorization: `Bearer ${await serviceKeyAsync}`,
        },
        payload: {
          prefix,
          limit: 10,
          offset: 0,
          noncurrentVersions: 'exclude',
          deleteMarkers: 'only',
          sortBy: { column: 'name', order: 'asc' },
        },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json<{ name: string }[]>().map((object) => object.name)).toEqual([
        'b.txt',
        'd.txt',
        'f.txt',
      ])
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, bucketName, objectNames)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('searching the bucket root folder', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/list/bucket2',
      headers: {
        authorization: `Bearer ${await serviceKeyAsync}`,
      },
      payload: {
        prefix: '',
        limit: 10,
        offset: 0,
      },
    })
    expect(response.statusCode).toBe(200)
    const responseJSON = JSON.parse(response.body) as { name: string }[]
    expect(responseJSON).toHaveLength(9)
    const names = responseJSON.map((ele) => ele.name)
    expect(names).toContain('curlimage.jpg')
    expect(names).toContain('private')
    expect(names).toContain('folder')
    expect(names).toContain('authenticated')
    expect(names).toContain('public')
  })

  test('searching a subfolder', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/list/bucket2',
      headers: {
        authorization: `Bearer ${await serviceKeyAsync}`,
      },
      payload: {
        prefix: 'folder',
        limit: 10,
        offset: 0,
      },
    })
    expect(response.statusCode).toBe(200)
    const responseJSON = JSON.parse(response.body) as { name: string }[]
    expect(responseJSON).toHaveLength(3)
    const names = responseJSON.map((ele) => ele.name)
    expect(names).toContain('only_uid.jpg')
    expect(names).toContain('subfolder')
    expect(names).toContain('UPPER-folder')
  })

  test('searching a non existent prefix', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/list/bucket2',
      headers: {
        authorization: `Bearer ${await serviceKeyAsync}`,
      },
      payload: {
        prefix: 'notfound',
        limit: 10,
        offset: 0,
      },
    })
    expect(response.statusCode).toBe(200)
    const responseJSON = JSON.parse(response.body)
    expect(responseJSON).toHaveLength(0)
  })

  test('checking if limit works', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/list/bucket2',
      headers: {
        authorization: `Bearer ${await serviceKeyAsync}`,
      },
      payload: {
        prefix: '',
        limit: 2,
        offset: 0,
      },
    })
    expect(response.statusCode).toBe(200)
    const responseJSON = JSON.parse(response.body)
    expect(responseJSON).toHaveLength(2)
  })

  test('listobjects: checking if RLS policies are respected', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/list/bucket2',
      headers: {
        authorization: `Bearer ${anonKey}`,
      },
      payload: {
        prefix: '',
        limit: 10,
        offset: 0,
      },
    })
    expect(response.statusCode).toBe(200)
    const responseJSON = JSON.parse(response.body)
    expect(responseJSON).toHaveLength(2)
  })

  test('return 400 without Auth Header', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/list/bucket2',
      payload: {
        prefix: '',
        limit: 10,
        offset: 0,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('case insensitive search should work', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/list/bucket2',
      payload: {
        prefix: 'PUBLIC/',
        limit: 10,
        offset: 0,
      },
      headers: {
        authorization: `Bearer ${await serviceKeyAsync}`,
      },
    })
    expect(response.statusCode).toBe(200)
    const responseJSON = JSON.parse(response.body)
    expect(responseJSON).toHaveLength(2)
  })

  test('test ascending search sorting', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/list/bucket2',
      payload: {
        prefix: 'public/',
        sortBy: {
          column: 'name',
          order: 'asc',
        },
      },
      headers: {
        authorization: `Bearer ${await serviceKeyAsync}`,
      },
    })
    expect(response.statusCode).toBe(200)
    const responseJSON = JSON.parse(response.body)
    expect(responseJSON).toHaveLength(2)
    // Byte order (COLLATE "C"): '.' (46) < '2' (50), so sadcat-upload.png < sadcat-upload23.png
    expect(responseJSON[0].name).toBe('sadcat-upload.png')
    expect(responseJSON[1].name).toBe('sadcat-upload23.png')
  })

  test('test descending search sorting', async () => {
    const response = await appInstance.inject({
      method: 'POST',
      url: '/object/list/bucket2',
      payload: {
        prefix: 'public/',
        sortBy: {
          column: 'name',
          order: 'desc',
        },
      },
      headers: {
        authorization: `Bearer ${await serviceKeyAsync}`,
      },
    })
    expect(response.statusCode).toBe(200)
    const responseJSON = JSON.parse(response.body)
    expect(responseJSON).toHaveLength(2)
    // Byte order (COLLATE "C"): sadcat-upload23.png > sadcat-upload.png
    expect(responseJSON[0].name).toBe('sadcat-upload23.png')
    expect(responseJSON[1].name).toBe('sadcat-upload.png')
  })

  test('list-v1 should treat % as a literal character when using non-name sorting', async () => {
    const runId = randomUUID()
    const bucketName = 'bucket2'
    const objectNames = [`percent-${runId}/first.txt`, `percent-${runId}/second.txt`]

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(
      seedTx,
      objectNames.map((name, idx) => ({
        bucket_id: bucketName,
        name,
        owner: '317eadce-631a-4429-a0bb-f19a7a517b4a',
        version: `${runId}-${idx}`,
        metadata: {
          eTag: `${runId}-${idx}`,
          size: idx + 1,
          mimetype: 'text/plain',
        },
      }))
    )
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/object/list/bucket2',
        payload: {
          prefix: '%',
          limit: 100,
          offset: 0,
          sortBy: {
            column: 'created_at',
            order: 'asc',
          },
        },
        headers: {
          authorization: `Bearer ${await serviceKeyAsync}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const responseJSON = response.json()
      expect(responseJSON).toHaveLength(0)
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, bucketName, objectNames)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('list-v1 should treat _ as a literal character when using non-name sorting', async () => {
    const runId = randomUUID()
    const bucketName = 'bucket2'
    const literalMatch = `wild_${runId}/hit.txt`
    const wildcardOnlyMatch = `wildX${runId}/miss.txt`

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, [
      {
        bucket_id: bucketName,
        name: literalMatch,
        owner: '317eadce-631a-4429-a0bb-f19a7a517b4a',
        version: `${runId}-literal`,
        metadata: {
          eTag: `${runId}-literal`,
          size: 1,
          mimetype: 'text/plain',
        },
      },
      {
        bucket_id: bucketName,
        name: wildcardOnlyMatch,
        owner: '317eadce-631a-4429-a0bb-f19a7a517b4a',
        version: `${runId}-wildcard`,
        metadata: {
          eTag: `${runId}-wildcard`,
          size: 2,
          mimetype: 'text/plain',
        },
      },
    ])
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/object/list/bucket2',
        payload: {
          prefix: `wild_${runId}/`,
          limit: 100,
          offset: 0,
          sortBy: {
            column: 'created_at',
            order: 'asc',
          },
        },
        headers: {
          authorization: `Bearer ${await serviceKeyAsync}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const responseJSON = response.json<{ name: string }[]>()
      expect(responseJSON.map((obj) => obj.name)).toEqual(['hit.txt'])
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, bucketName, [literalMatch, wildcardOnlyMatch])
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('searching a nested path with a trailing slash returns the file', async () => {
    const runId = randomUUID()
    const bucketName = 'bucket2'
    const objectName = `search-${runId}/blah/blah/blah/file.png`

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, {
      bucket_id: bucketName,
      name: objectName,
      owner: '317eadce-631a-4429-a0bb-f19a7a517b4a',
      version: `${runId}-file`,
      metadata: {
        eTag: `${runId}-file`,
        size: 42,
        mimetype: 'image/png',
      },
    })
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/object/list/bucket2',
        payload: {
          prefix: '',
          search: `search-${runId}/blah/blah/blah/`,
          limit: 100,
          offset: 0,
          sortBy: {
            column: 'name',
            order: 'asc',
          },
        },
        headers: {
          authorization: `Bearer ${await serviceKeyAsync}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const responseJSON = response.json<{ name: string; id: string | null; metadata: unknown }[]>()
      expect(responseJSON).toHaveLength(1)
      expect(responseJSON[0].name).toBe(objectName)
      expect(responseJSON[0].id).not.toBeNull()
      expect(responseJSON[0].metadata).toMatchObject({
        eTag: `${runId}-file`,
        size: 42,
        mimetype: 'image/png',
      })
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, bucketName, objectName)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('searching a nested path with the full file name returns the file', async () => {
    const runId = randomUUID()
    const bucketName = 'bucket2'
    const objectName = `search-${runId}/blah/blah/blah/file.png`

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, {
      bucket_id: bucketName,
      name: objectName,
      owner: '317eadce-631a-4429-a0bb-f19a7a517b4a',
      version: `${runId}-file`,
      metadata: {
        eTag: `${runId}-file`,
        size: 42,
        mimetype: 'image/png',
      },
    })
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/object/list/bucket2',
        payload: {
          prefix: '',
          search: `search-${runId}/blah/blah/blah/file.png`,
          limit: 100,
          offset: 0,
          sortBy: {
            column: 'name',
            order: 'asc',
          },
        },
        headers: {
          authorization: `Bearer ${await serviceKeyAsync}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const responseJSON = response.json<{ name: string; id: string | null; metadata: unknown }[]>()
      expect(responseJSON).toHaveLength(1)
      expect(responseJSON[0].name).toBe(objectName)
      expect(responseJSON[0].id).not.toBeNull()
      expect(responseJSON[0].metadata).toMatchObject({
        eTag: `${runId}-file`,
        size: 42,
        mimetype: 'image/png',
      })
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, bucketName, objectName)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('prefix and search combine to find a nested file', async () => {
    const runId = randomUUID()
    const bucketName = 'bucket2'
    const objectName = `search-${runId}/a/b/c/file.png`

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, {
      bucket_id: bucketName,
      name: objectName,
      owner: '317eadce-631a-4429-a0bb-f19a7a517b4a',
      version: `${runId}-file`,
      metadata: {
        eTag: `${runId}-file`,
        size: 42,
        mimetype: 'image/png',
      },
    })
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/object/list/bucket2',
        payload: {
          prefix: `search-${runId}/a`,
          search: 'b/c/file.png',
          limit: 100,
          offset: 0,
          sortBy: {
            column: 'name',
            order: 'asc',
          },
        },
        headers: {
          authorization: `Bearer ${await serviceKeyAsync}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const responseJSON = response.json<{ name: string; id: string | null; metadata: unknown }[]>()
      expect(responseJSON).toHaveLength(1)
      expect(responseJSON[0].name).toBe('b/c/file.png')
      expect(responseJSON[0].id).not.toBeNull()
      expect(responseJSON[0].metadata).toMatchObject({
        eTag: `${runId}-file`,
        size: 42,
        mimetype: 'image/png',
      })
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, bucketName, objectName)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('prefix and search combine to return nothing without a match', async () => {
    const runId = randomUUID()
    const bucketName = 'bucket2'
    const objectName = `search-${runId}/a/b/c/file.png`

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, {
      bucket_id: bucketName,
      name: objectName,
      owner: '317eadce-631a-4429-a0bb-f19a7a517b4a',
      version: `${runId}-file`,
      metadata: {
        eTag: `${runId}-file`,
        size: 42,
        mimetype: 'image/png',
      },
    })
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/object/list/bucket2',
        payload: {
          prefix: `search-${runId}/a`,
          search: 'x/y/file.png',
          limit: 100,
          offset: 0,
          sortBy: {
            column: 'name',
            order: 'asc',
          },
        },
        headers: {
          authorization: `Bearer ${await serviceKeyAsync}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const responseJSON = response.json<{ name: string; id: string | null; metadata: unknown }[]>()
      expect(responseJSON).toHaveLength(0)
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, bucketName, objectName)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('search spanning multiple folders returns the relative folder path', async () => {
    const runId = randomUUID()
    const bucketName = 'bucket2'
    const objectName = `search-${runId}/folder/sub1/file.png`

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, {
      bucket_id: bucketName,
      name: objectName,
      owner: '317eadce-631a-4429-a0bb-f19a7a517b4a',
      version: `${runId}-file`,
      metadata: {
        eTag: `${runId}-file`,
        size: 42,
        mimetype: 'image/png',
      },
    })
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/object/list/bucket2',
        payload: {
          prefix: '',
          search: `search-${runId}/folder/`,
          limit: 100,
          offset: 0,
          sortBy: {
            column: 'name',
            order: 'asc',
          },
        },
        headers: {
          authorization: `Bearer ${await serviceKeyAsync}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const responseJSON = response.json<{ name: string; id: string | null; metadata: unknown }[]>()
      expect(responseJSON).toEqual([
        {
          name: `search-${runId}/folder/sub1`,
          id: null,
          updated_at: null,
          created_at: null,
          last_accessed_at: null,
          metadata: null,
          version: null,
          archived_at: null,
          is_delete_marker: null,
          is_versioned: null,
        },
      ])
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, bucketName, objectName)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('prefix and search combine to find a nested file when sorting by a non-name column', async () => {
    const runId = randomUUID()
    const bucketName = 'bucket2'
    const objectName = `search-${runId}/a/b/c/file.png`

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, {
      bucket_id: bucketName,
      name: objectName,
      owner: '317eadce-631a-4429-a0bb-f19a7a517b4a',
      version: `${runId}-file`,
      metadata: {
        eTag: `${runId}-file`,
        size: 42,
        mimetype: 'image/png',
      },
    })
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/object/list/bucket2',
        payload: {
          prefix: `search-${runId}/a`,
          search: 'b/c/file.png',
          limit: 100,
          offset: 0,
          sortBy: {
            column: 'created_at',
            order: 'asc',
          },
        },
        headers: {
          authorization: `Bearer ${await serviceKeyAsync}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const responseJSON = response.json<{ name: string; id: string | null; metadata: unknown }[]>()
      expect(responseJSON).toHaveLength(1)
      expect(responseJSON[0].name).toBe('b/c/file.png')
      expect(responseJSON[0].id).not.toBeNull()
      expect(responseJSON[0].metadata).toMatchObject({
        eTag: `${runId}-file`,
        size: 42,
        mimetype: 'image/png',
      })
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, bucketName, objectName)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('applies noncurrentVersions and deleteMarkers filters on the v1 list route', async () => {
    const runId = randomUUID()
    const objectName = `authenticated/v1-versions-${runId}.png`
    const baseTime = Date.parse('2024-01-01T00:00:00.000Z')

    function buildVersionRows(
      bucketId: string,
      name: string,
      count: number,
      baseTime: number
    ): Array<Partial<Obj> & { bucket_id: string; name: string }> {
      const rows: Array<Partial<Obj> & { bucket_id: string; name: string }> = []
      for (let i = 0; i < count; i++) {
        const isCurrent = i === count - 1
        const createdAt = new Date(baseTime + i * 1000).toISOString()
        rows.push({
          bucket_id: bucketId,
          name,
          owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
          version: `v${i}-${randomUUID()}`,
          metadata: { mimetype: 'image/png', size: 1000 + i },
          created_at: createdAt,
          archived_at: isCurrent ? null : createdAt,
          is_versioned: true,
          is_delete_marker: false,
        })
      }
      return rows
    }

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, [
      ...buildVersionRows('bucket2', objectName, 3, baseTime),
      {
        bucket_id: 'bucket2',
        name: objectName,
        owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
        version: `delete-marker-${runId}`,
        created_at: new Date(baseTime + 3000).toISOString(),
        archived_at: new Date(baseTime + 3000).toISOString(),
        is_versioned: true,
        is_delete_marker: true,
      },
    ])
    await seedTx.commit()
    tnx = undefined

    try {
      const exclude = await appInstance.inject({
        method: 'POST',
        url: '/object/list/bucket2',
        headers: { authorization: `Bearer ${await serviceKeyAsync}` },
        payload: { prefix: objectName, exactMatch: true, limit: 10, offset: 0 },
      })
      expect(exclude.statusCode).toBe(200)
      expect(exclude.json<Obj[]>()).toHaveLength(1)

      const include = await appInstance.inject({
        method: 'POST',
        url: '/object/list/bucket2',
        headers: { authorization: `Bearer ${await serviceKeyAsync}` },
        payload: {
          prefix: objectName,
          exactMatch: true,
          noncurrentVersions: 'include',
          limit: 10,
          offset: 0,
        },
      })
      expect(include.statusCode).toBe(200)
      expect(include.json<Obj[]>()).toHaveLength(3)

      const archivedMarkers = await appInstance.inject({
        method: 'POST',
        url: '/object/list/bucket2',
        headers: { authorization: `Bearer ${await serviceKeyAsync}` },
        payload: {
          prefix: objectName,
          exactMatch: true,
          noncurrentVersions: 'only',
          deleteMarkers: 'only',
          limit: 10,
          offset: 0,
        },
      })
      expect(archivedMarkers.statusCode).toBe(200)
      const markerRows = archivedMarkers.json<Obj[]>()
      expect(markerRows).toHaveLength(1)
      expect(markerRows[0].version).toBe(`delete-marker-${runId}`)
      expect(markerRows[0].is_delete_marker).toBe(true)

      const allRows = await appInstance.inject({
        method: 'POST',
        url: '/object/list/bucket2',
        headers: { authorization: `Bearer ${await serviceKeyAsync}` },
        payload: {
          prefix: objectName,
          exactMatch: true,
          noncurrentVersions: 'include',
          deleteMarkers: 'include',
          limit: 10,
          offset: 0,
        },
      })
      expect(allRows.statusCode).toBe(200)
      expect(allRows.json<Obj[]>()).toHaveLength(4)
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', objectName)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test.each([
    'asc',
    'desc',
  ] as const)('v1 list resumes within a key when versions cross its internal batch boundary (%s)', async (order) => {
    const runId = randomUUID()
    const prefix = `authenticated/v1-version-batch-${runId}/`
    const objectName = `${prefix}file.png`
    const baseTime = Date.parse('2024-07-01T00:00:00.000Z')
    const rows = Array.from({ length: 101 }, (_, index) => ({
      bucket_id: 'bucket2',
      name: objectName,
      owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
      version: `v-${String(index).padStart(3, '0')}`,
      created_at: new Date(baseTime + index * 1000).toISOString(),
      archived_at: index === 100 ? null : new Date(baseTime + index * 1000).toISOString(),
      is_versioned: true,
      is_delete_marker: false,
    }))
    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, rows)
    await seedTx.commit()
    tnx = undefined

    try {
      // limit=1 makes storage.search's internal batch size 100. Skipping the
      // first 100 rows forces it to resume the same key in a second batch.
      const response = await appInstance.inject({
        method: 'POST',
        url: '/object/list/bucket2',
        headers: { authorization: `Bearer ${await serviceKeyAsync}` },
        payload: {
          prefix,
          noncurrentVersions: 'include',
          deleteMarkers: 'include',
          limit: 1,
          offset: 100,
          sortBy: { column: 'name', order },
        },
      })

      expect(response.statusCode).toBe(200)
      const result = response.json<Obj[]>()
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('file.png')
      expect(result[0].version).toBe('v-000')
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', objectName)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('v1 multi-version name listing matches the reference model across filters, directions, and offsets', async () => {
    type VersionMode = 'include' | 'only'
    type MarkerMode = 'exclude' | 'include' | 'only'
    type ModelRow = {
      name: string
      version: string
      archived_at: string | null
      is_delete_marker: boolean
    }

    const runId = randomUUID()
    const prefix = `authenticated/v1-reference-${runId}/`
    const baseTime = Date.parse('2024-10-01T00:00:00.000Z')
    const modelRows: ModelRow[] = [
      { name: 'alpha.txt', version: 'alpha-current', archived_at: null, is_delete_marker: false },
      {
        name: 'alpha.txt',
        version: 'alpha-old-b',
        archived_at: new Date(baseTime + 2).toISOString(),
        is_delete_marker: false,
      },
      {
        name: 'alpha.txt',
        version: 'alpha-old-a',
        archived_at: new Date(baseTime + 1).toISOString(),
        is_delete_marker: true,
      },
      {
        name: 'beta-file',
        version: 'beta-current',
        archived_at: null,
        is_delete_marker: false,
      },
      {
        name: 'beta/child.txt',
        version: 'beta-child-old',
        archived_at: new Date(baseTime + 3).toISOString(),
        is_delete_marker: false,
      },
      {
        name: 'folder-a/child.txt',
        version: 'folder-marker',
        archived_at: new Date(baseTime + 4).toISOString(),
        is_delete_marker: true,
      },
      { name: 'middle.txt', version: 'middle-current', archived_at: null, is_delete_marker: false },
      {
        name: 'zulu.txt',
        version: 'zulu-old',
        archived_at: new Date(baseTime + 5).toISOString(),
        is_delete_marker: false,
      },
    ]

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(
      seedTx,
      modelRows.map((row) => ({
        bucket_id: 'bucket2',
        name: `${prefix}${row.name}`,
        owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
        version: row.version,
        archived_at: row.archived_at,
        is_versioned: true,
        is_delete_marker: row.is_delete_marker,
      }))
    )
    await seedTx.commit()
    tnx = undefined

    const identity = (row: { id?: string | null; name: string; version?: string | null }) =>
      `${row.id == null ? 'folder' : 'file'}:${row.name}:${row.version ?? ''}`

    const reference = (
      noncurrentVersions: VersionMode,
      deleteMarkers: MarkerMode,
      order: 'asc' | 'desc'
    ) => {
      const filtered = modelRows.filter(
        (row) =>
          (noncurrentVersions !== 'only' || row.archived_at !== null) &&
          (deleteMarkers !== 'exclude' || !row.is_delete_marker) &&
          (deleteMarkers !== 'only' || row.is_delete_marker)
      )
      const folders = [
        ...new Set(
          filtered.flatMap((row) => {
            const delimiter = row.name.indexOf('/')
            return delimiter === -1 ? [] : [row.name.slice(0, delimiter)]
          })
        ),
      ].map((name) => ({
        name,
        sortName: `${name}/`,
        version: null,
        archived_at: null,
        id: null,
        isPrefix: true,
      }))
      const leaves = filtered
        .filter((row) => !row.name.includes('/'))
        .map((row) => ({ ...row, sortName: row.name, id: row.version, isPrefix: false }))

      return [...folders, ...leaves]
        .sort((left, right) => {
          const leftName = left.sortName.toLowerCase()
          const rightName = right.sortName.toLowerCase()
          const nameOrder = leftName === rightName ? 0 : leftName < rightName ? -1 : 1
          if (nameOrder !== 0) return order === 'asc' ? nameOrder : -nameOrder
          if (left.isPrefix !== right.isPrefix) {
            return Number(left.isPrefix) - Number(right.isPrefix)
          }
          const leftTime =
            left.archived_at === null ? Number.POSITIVE_INFINITY : Date.parse(left.archived_at)
          const rightTime =
            right.archived_at === null ? Number.POSITIVE_INFINITY : Date.parse(right.archived_at)
          if (leftTime !== rightTime) return rightTime - leftTime
          return (left.version ?? '').localeCompare(right.version ?? '', 'en')
        })
        .map(identity)
    }

    try {
      for (const order of ['asc', 'desc'] as const) {
        for (const noncurrentVersions of ['include', 'only'] as const) {
          for (const deleteMarkers of ['exclude', 'include', 'only'] as const) {
            const expected = reference(noncurrentVersions, deleteMarkers, order)
            const offsets = [...new Set([0, 1, 3, Math.max(expected.length - 1, 0)])]

            for (const offset of offsets) {
              const response = await appInstance.inject({
                method: 'POST',
                url: '/object/list/bucket2',
                headers: { authorization: `Bearer ${await serviceKeyAsync}` },
                payload: {
                  prefix,
                  noncurrentVersions,
                  deleteMarkers,
                  limit: 3,
                  offset,
                  sortBy: { column: 'name', order },
                },
              })

              expect(response.statusCode).toBe(200)
              expect(
                response.json<Obj[]>().map(identity),
                JSON.stringify({ order, noncurrentVersions, deleteMarkers, offset })
              ).toEqual(expected.slice(offset, offset + 3))
            }
          }
        }
      }
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(
          db,
          'bucket2',
          modelRows.map((row) => `${prefix}${row.name}`)
        )
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  }, 15_000)

  test.each([
    'asc',
    'desc',
  ] as const)('v1 list terminates after exhausting the final multi-version key (%s)', async (order) => {
    const runId = randomUUID()
    const prefix = `authenticated/v1-final-version-key-${runId}/`
    const objectName = `${prefix}file.png`
    const baseTime = Date.parse('2024-08-01T00:00:00.000Z')
    const rows = Array.from({ length: 300 }, (_, index) => ({
      bucket_id: 'bucket2',
      name: objectName,
      owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
      version: `v-${String(index).padStart(3, '0')}`,
      created_at: new Date(baseTime + index * 1000).toISOString(),
      archived_at: index === 299 ? null : new Date(baseTime + index * 1000).toISOString(),
      is_versioned: true,
      is_delete_marker: false,
    }))
    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, rows)
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/object/list/bucket2',
        headers: { authorization: `Bearer ${await serviceKeyAsync}` },
        payload: {
          prefix,
          noncurrentVersions: 'include',
          deleteMarkers: 'include',
          limit: 500,
          offset: 0,
          sortBy: { column: 'name', order },
        },
      })

      expect(response.statusCode).toBe(200)
      const result = response.json<Obj[]>()
      expect(result).toHaveLength(300)
      expect(new Set(result.map((object) => object.version)).size).toBe(300)
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', objectName)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  }, 5000)

  test('v1 desc listing advances to the next key after exhausting a key at a batch boundary', async () => {
    const runId = randomUUID()
    const prefix = `authenticated/v1-desc-next-key-${runId}/`
    const deepKey = `${prefix}zzz-deep.bin`
    const targetKey = `${prefix}aaa-target.bin`
    const baseTime = Date.parse('2024-09-01T00:00:00.000Z')
    const deepRows = Array.from({ length: 100 }, (_, index) => ({
      bucket_id: 'bucket2',
      name: deepKey,
      owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
      version: `deep-${String(index).padStart(3, '0')}`,
      created_at: new Date(baseTime + index * 1000).toISOString(),
      archived_at: index === 99 ? null : new Date(baseTime + index * 1000).toISOString(),
      is_versioned: true,
      is_delete_marker: false,
    }))
    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, [
      ...deepRows,
      {
        bucket_id: 'bucket2',
        name: targetKey,
        owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
        version: 'target',
        archived_at: null,
        is_versioned: true,
        is_delete_marker: false,
      },
    ])
    await seedTx.commit()
    tnx = undefined

    try {
      // limit=2 gives an internal batch size of 100. DESC visits the 100
      // deep-key versions first; offset consumes them, so the next batch
      // must advance to aaa-target instead of replaying zzz-deep.
      const response = await appInstance.inject({
        method: 'POST',
        url: '/object/list/bucket2',
        headers: { authorization: `Bearer ${await serviceKeyAsync}` },
        payload: {
          prefix,
          noncurrentVersions: 'include',
          deleteMarkers: 'include',
          limit: 2,
          offset: 100,
          sortBy: { column: 'name', order: 'desc' },
        },
      })

      expect(response.statusCode).toBe(200)
      const result = response.json<Obj[]>()
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('aaa-target.bin')
      expect(result[0].version).toBe('target')
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', [deepKey, targetKey])
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  }, 5000)

  test('v1 asc listing advances to the next key after exhausting a key at a batch boundary', async () => {
    const runId = randomUUID()
    const prefix = `authenticated/v1-asc-next-key-${runId}/`
    const deepKey = `${prefix}aaa-deep.bin`
    const siblingKey = `${deepKey}!`
    const targetKey = `${prefix}zzz-target.bin`
    const baseTime = Date.parse('2024-09-01T00:00:00.000Z')
    const deepRows = Array.from({ length: 100 }, (_, index) => ({
      bucket_id: 'bucket2',
      name: deepKey,
      owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
      version: `deep-${String(index).padStart(3, '0')}`,
      created_at: new Date(baseTime + index * 1000).toISOString(),
      archived_at: index === 99 ? null : new Date(baseTime + index * 1000).toISOString(),
      is_versioned: true,
      is_delete_marker: false,
    }))
    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, [
      ...deepRows,
      {
        bucket_id: 'bucket2',
        name: siblingKey,
        owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
        version: 'sibling',
        archived_at: null,
        is_versioned: true,
        is_delete_marker: false,
      },
      {
        bucket_id: 'bucket2',
        name: targetKey,
        owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
        version: 'target',
        archived_at: null,
        is_versioned: true,
        is_delete_marker: false,
      },
    ])
    await seedTx.commit()
    tnx = undefined

    try {
      // limit=2 gives an internal batch size of 100. ASC visits the 100
      // deep-key versions first; offset consumes them, so the next batch
      // must advance to the immediate sibling. `!` sorts after the exhausted
      // key but before the `/` previously appended to advance the seek, so
      // using `deepKey || '/'` here would silently skip this row.
      const response = await appInstance.inject({
        method: 'POST',
        url: '/object/list/bucket2',
        headers: { authorization: `Bearer ${await serviceKeyAsync}` },
        payload: {
          prefix,
          noncurrentVersions: 'include',
          deleteMarkers: 'include',
          limit: 2,
          offset: 100,
          sortBy: { column: 'name', order: 'asc' },
        },
      })

      expect(response.statusCode).toBe(200)
      const result = response.json<Obj[]>()
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('aaa-deep.bin!')
      expect(result[0].version).toBe('sibling')
      expect(result[1].name).toBe('zzz-target.bin')
      expect(result[1].version).toBe('target')
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', [deepKey, siblingKey, targetKey])
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  }, 5000)
})

describe('testing GET object info response fields gated on migration', () => {
  const BEFORE_MIGRATION = 'mark-filename-immutable'

  test('info response includes archived_at/is_delete_marker/is_versioned for a fully migrated tenant', async () => {
    const runId = randomUUID()
    const objectName = `authenticated/info-fields-${runId}.png`

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, {
      bucket_id: 'bucket2',
      name: objectName,
      owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
      version: `info-fields-${runId}`,
      metadata: { mimetype: 'image/png', size: 1234 },
      archived_at: null,
      is_delete_marker: false,
      is_versioned: true,
    })
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'GET',
        url: `/object/info/authenticated/bucket2/${objectName}`,
        headers: {
          authorization: `Bearer ${process.env.AUTHENTICATED_KEY}`,
        },
      })
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.archived_at).toBeNull()
      expect(body.is_delete_marker).toBe(false)
      expect(body.is_versioned).toBe(true)
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', [objectName])
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('info column selection omits archived_at/is_delete_marker/is_versioned for a tenant pinned before object-versioning-core', async () => {
    const runId = randomUUID()
    const objectName = `authenticated/info-fields-gate-${runId}.png`

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, {
      bucket_id: 'bucket2',
      name: objectName,
      owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
      version: `info-fields-gate-${runId}`,
      metadata: { mimetype: 'image/png', size: 1234 },
      archived_at: null,
      is_delete_marker: false,
      is_versioned: true,
    })
    await seedTx.commit()
    tnx = undefined

    const adminUser = await getServiceKeyUser(tenantId)
    const connection = await getPostgresConnection({
      tenantId,
      user: adminUser,
      superUser: adminUser,
      host: 'localhost',
    })

    try {
      const pinnedDb = new StoragePgDB(connection, {
        host: 'localhost',
        tenantId,
        latestMigration: BEFORE_MIGRATION,
      })
      expect(await pinnedDb.hasMigration('object-versioning-core')).toBe(false)

      const preMigrationColumns =
        'id,name,version,bucket_id,metadata,user_metadata,updated_at,created_at'
      const obj = await pinnedDb.findObject('bucket2', objectName, preMigrationColumns)
      expect(obj).not.toHaveProperty('archived_at')
      expect(obj).not.toHaveProperty('is_delete_marker')
      expect(obj).not.toHaveProperty('is_versioned')

      const currentDb = new StoragePgDB(connection, { host: 'localhost', tenantId })
      expect(await currentDb.hasMigration('object-versioning-core')).toBe(true)

      const postMigrationColumns =
        'id,name,version,bucket_id,metadata,user_metadata,updated_at,created_at,archived_at,is_delete_marker,is_versioned'
      const migratedObj = await currentDb.findObject('bucket2', objectName, postMigrationColumns)
      expect(migratedObj).toHaveProperty('archived_at', null)
      expect(migratedObj).toHaveProperty('is_delete_marker', false)
      expect(migratedObj).toHaveProperty('is_versioned', true)
    } finally {
      connection.dispose()
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', [objectName])
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })
})

describe('x-robots-tag header', () => {
  const X_ROBOTS_TEST_BUCKET = 'X_ROBOTS_TEST_BUCKET'
  beforeAll(async () => {
    appInstance = app()
    await appInstance.inject({
      method: 'POST',
      url: `/bucket`,
      headers: {
        authorization: `Bearer ${await serviceKeyAsync}`,
      },
      payload: {
        name: X_ROBOTS_TEST_BUCKET,
      },
    })
    await appInstance.close()
  })

  afterAll(async () => {
    appInstance = app()
    await appInstance.inject({
      method: 'POST',
      url: `/bucket/${X_ROBOTS_TEST_BUCKET}/empty`,
      headers: {
        authorization: `Bearer ${await serviceKeyAsync}`,
      },
    })
    await appInstance.inject({
      method: 'DELETE',
      url: `/bucket/${X_ROBOTS_TEST_BUCKET}`,
      headers: {
        authorization: `Bearer ${await serviceKeyAsync}`,
      },
    })
    await appInstance.close()
  })

  test('defaults x-robots-tag header to none if not specified', async () => {
    const objPath = `${X_ROBOTS_TEST_BUCKET}/test-file-1.txt`

    const createResponse = await appInstance.inject({
      method: 'POST',
      url: `/object/${objPath}`,
      payload: new File(['test'], 'file.txt'),
      headers: {
        authorization: `Bearer ${await serviceKeyAsync}`,
      },
    })
    expect(createResponse.statusCode).toBe(200)

    const response = await appInstance.inject({
      method: 'GET',
      url: `/object/authenticated/${objPath}`,
      headers: {
        authorization: `Bearer ${await serviceKeyAsync}`,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(response.headers['x-robots-tag']).toBe('none')
  })

  test('uses provided x-robots-tag header if set', async () => {
    const objPath = `${X_ROBOTS_TEST_BUCKET}/test-file-2.txt`

    const createResponse = await appInstance.inject({
      method: 'POST',
      url: `/object/${objPath}`,
      payload: new File(['test'], 'file.txt'),
      headers: {
        authorization: `Bearer ${await serviceKeyAsync}`,
        'x-robots-tag': 'all',
      },
    })
    expect(createResponse.statusCode).toBe(200)

    const response = await appInstance.inject({
      method: 'GET',
      url: `/object/authenticated/${objPath}`,
      headers: {
        authorization: `Bearer ${await serviceKeyAsync}`,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(response.headers['x-robots-tag']).toBe('all')
  })

  test('updates x-robots-tag header on upsert', async () => {
    const objPath = `${X_ROBOTS_TEST_BUCKET}/test-file-3.txt`

    const createResponse = await appInstance.inject({
      method: 'POST',
      url: `/object/${objPath}`,
      payload: new File(['test'], 'file.txt'),
      headers: {
        authorization: `Bearer ${await serviceKeyAsync}`,
        'x-robots-tag': 'max-snippet: 10, notranslate',
      },
    })
    expect(createResponse.statusCode).toBe(200)

    const response = await appInstance.inject({
      method: 'GET',
      url: `/object/authenticated/${objPath}`,
      headers: {
        authorization: `Bearer ${await serviceKeyAsync}`,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(response.headers['x-robots-tag']).toBe('max-snippet: 10, notranslate')

    const createResponse2 = await appInstance.inject({
      method: 'POST',
      url: `/object/${objPath}`,
      payload: new File(['test'], 'file.txt'),
      headers: {
        authorization: `Bearer ${await serviceKeyAsync}`,
        'x-upsert': 'true',
        'x-robots-tag': 'nofollow',
      },
    })
    expect(createResponse2.statusCode).toBe(200)

    const response2 = await appInstance.inject({
      method: 'GET',
      url: `/object/authenticated/${objPath}`,
      headers: {
        authorization: `Bearer ${await serviceKeyAsync}`,
      },
    })
    expect(response2.statusCode).toBe(200)
    expect(response2.headers['x-robots-tag']).toBe('nofollow')
  })

  test('rejects invalid x-robots-tag header with proper error', async () => {
    const objPath = `${X_ROBOTS_TEST_BUCKET}/test-file-invalid.txt`

    const createResponse = await appInstance.inject({
      method: 'POST',
      url: `/object/${objPath}`,
      payload: new File(['test'], 'file.txt'),
      headers: {
        authorization: `Bearer ${await serviceKeyAsync}`,
        'x-robots-tag': 'invalidrule',
      },
    })

    expect(createResponse.statusCode).toBe(400)
    expect(createResponse.json()).toMatchObject({
      statusCode: '400',
      error: 'invalid_x_robots_tag',
      message: 'Invalid X-Robots-Tag header: Invalid X-Robots-Tag rule: "invalidrule"',
    })
  })
})
