import {
  CompleteMultipartUploadCommand,
  CreateBucketCommand,
  CreateMultipartUploadCommand,
  S3Client,
  S3ServiceException,
  UploadPartCommand,
} from '@aws-sdk/client-s3'
import { signJWT } from '@internal/auth'
import { wait } from '@internal/concurrency'
import { getPostgresConnection, getServiceKeyUser } from '@internal/database'
import { createStorageBackend } from '@storage/backend'
import { StoragePgDB } from '@storage/database'
import { TenantLocation } from '@storage/locator'
import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import FormData from 'form-data'
import fs from 'fs'
import yaml from 'js-yaml'
import path from 'path'
import { Pool } from 'pg'
import * as tus from 'tus-js-client'
import { DetailedError } from 'tus-js-client'
import app from '../app'
import { getConfig } from '../config'
import { Storage } from '../storage'
import { checkBucketExists } from './utils/storage'

interface Policy {
  name: string
  permissions: string | string[]
  roles: string | string[]
  content: string
  tables: string | string[]
}

interface TestCase {
  description: string
  policies: string[]
  asserts: TestCaseAssert[]
  setup?: {
    create_bucket?: boolean
  }
}

interface TestCaseAssert {
  operation:
    | 'upload'
    | 'upload.upsert'
    | 'upload.tus'
    | 'upload.signed'
    | 'upload.s3.multipart'
    | 'bucket.create'
    | 'bucket.empty'
    | 'bucket.get'
    | 'bucket.list'
    | 'bucket.delete'
    | 'bucket.update'
    | 'object.delete'
    | 'object.get'
    | 'object.list'
    | 'object.seed'
    | 'object.move'
    | 'object.copy'

  objectName?: string
  bucketName?: string
  useExistingBucketName?: string
  role?: string
  policies?: string[]
  userMetadata?: Record<string, unknown>
  mimeType?: string
  contentLength?: number
  copyMetadata?: boolean
  destinationObjectName?: string
  status: number
  error?: string
}

interface RlsTestSpec {
  policies: Policy[]
  tests: TestCase[]
}

function renderRlsTemplate(template: string, values: Record<string, string>) {
  const rendered = template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key: string) => {
    if (!Object.prototype.hasOwnProperty.call(values, key)) {
      throw new Error(`Unknown RLS template variable: ${key}`)
    }

    return values[key]
  })

  if (rendered.includes('{{')) {
    throw new Error('Unsupported template tag in rls_tests.yaml')
  }

  return rendered
}

const testSpec = yaml.load(
  fs.readFileSync(path.resolve(__dirname, 'rls_tests.yaml'), 'utf8')
) as RlsTestSpec

const {
  serviceKeyAsync,
  anonKeyAsync,
  tenantId,
  jwtSecret,
  databaseURL,
  storageS3Bucket,
  storageBackendType,
  storageS3Region,
} = getConfig()
const backend = createStorageBackend(storageBackendType)
const client = backend.client
let appInstance: FastifyInstance
let currentUserId: string
let currentStorage: Storage

describe('RLS policies', () => {
  let db: Pool

  beforeAll(async () => {
    // parse yaml file
    if (client instanceof S3Client) {
      const bucketExists = await checkBucketExists(client, storageS3Bucket)

      if (!bucketExists) {
        const createBucketCommand = new CreateBucketCommand({
          Bucket: storageS3Bucket,
        })
        await client.send(createBucketCommand)
      }
    }

    db = new Pool({ connectionString: databaseURL })
  })

  let jwt: string
  beforeEach(async () => {
    appInstance = app()
    currentUserId = randomUUID()
    jwt = (await signJWT({ sub: currentUserId, role: 'authenticated' }, jwtSecret, '1h')) as string

    await db.query({
      text: `
        INSERT INTO auth.users (instance_id, id, aud, role, email)
        VALUES ($1, $2, $3, $4, $5)
      `,
      values: [
        '00000000-0000-0000-0000-000000000000',
        currentUserId,
        'authenticated',
        'authenticated',
        currentUserId + '@supabase.io',
      ],
    })

    const adminUser = await getServiceKeyUser(tenantId)

    const pg = await getPostgresConnection({
      tenantId,
      user: adminUser,
      superUser: adminUser,
      host: 'localhost',
    })

    const storageDb = new StoragePgDB(pg, {
      host: 'localhost',
      tenantId,
    })

    currentStorage = new Storage(backend, storageDb, new TenantLocation(storageS3Bucket))
  })

  afterEach(async () => {
    await appInstance.close()
    vi.clearAllMocks()
  })

  afterAll(async () => {
    await db.end()
    ;(currentStorage.db as StoragePgDB).connection.dispose()
  })

  testSpec.tests.forEach((_test, index) => {
    it(_test.description, async () => {
      const content = fs.readFileSync(path.resolve(__dirname, 'rls_tests.yaml'), 'utf8')

      const runId = randomUUID()
      let bucketName: string = randomUUID()
      let objectName: string = randomUUID()
      const originalBucketName = bucketName

      const testScopedSpec = yaml.load(
        renderRlsTemplate(content, {
          uid: currentUserId,
          bucketName,
          objectName,
          runId,
        })
      ) as RlsTestSpec

      const test = testScopedSpec.tests[index]

      // Create requested policies
      const allPolicies = await Promise.all(
        test.policies.map(async (policyName) => {
          const policy = testScopedSpec.policies.find((policy) => policy.name === policyName)

          if (!policy) {
            throw new Error(`Policy ${policyName} not found`)
          }

          console.log(`Creating policy ${policyName}`)
          return await createPolicy(db, policy)
        })
      )

      // Prepare
      if (test.setup?.create_bucket !== false) {
        await currentStorage.createBucket({
          name: bucketName,
          id: bucketName,
          public: false,
          owner: currentUserId,
        })
        console.log(`Created bucket ${bucketName}`)
      }

      try {
        // Run Operations
        for (const assert of test.asserts) {
          if (assert.bucketName) {
            bucketName = assert.bucketName
            await currentStorage.createBucket({
              name: bucketName,
              id: bucketName,
              public: false,
              owner: currentUserId,
            })
            console.log(`Created bucket ${bucketName}`)
          }

          if (assert.useExistingBucketName) {
            bucketName = assert.useExistingBucketName
          }

          if (assert.objectName) {
            objectName = assert.objectName
          }

          let localPolicies: { name: string; table: string }[][] = []
          if (assert.policies && assert.policies.length > 0) {
            localPolicies = await Promise.all(
              assert.policies.map(async (policyName) => {
                const policy = testScopedSpec.policies.find((policy) => policy.name === policyName)

                if (!policy) {
                  throw new Error(`Policy ${policyName} not found`)
                }

                console.log(`Creating inline policy ${policyName}`)
                return await createPolicy(db, policy)
              })
            )
          }

          console.log(
            `Running operation ${assert.operation} with role ${assert.role || 'authenticated'}`
          )

          try {
            const response = await runOperation(assert.operation, {
              bucket: bucketName,
              objectName,
              jwt: assert.role === 'service' ? await serviceKeyAsync : jwt,
              userMetadata: assert.userMetadata,
              mimeType: assert.mimeType,
              contentLength: assert.contentLength,
              copyMetadata: assert.copyMetadata,
              destinationObjectName: assert.destinationObjectName,
            })

            console.log(
              `Operation ${assert.operation} with role ${assert.role || 'authenticated'} returned ${
                response.statusCode
              }`
            )

            bucketName = originalBucketName

            try {
              expect(response.statusCode).toBe(assert.status)
            } catch (e) {
              console.log(`Operation ${assert.operation} failed`, response.body)
              throw e
            }

            if (assert.error) {
              const body = response.json()
              expect(body.message).toBe(assert.error)
            }
          } finally {
            console.log('deleting local policies')
            await Promise.all([
              ...localPolicies.map((policies) => {
                return Promise.all(
                  policies.map(async (policy) => {
                    console.log(
                      `RUNNING QUERY DROP POLICY IF EXISTS "${policy.name}" ON ${policy.table};`
                    )
                    await db.query(`DROP POLICY "${policy.name}" ON ${policy.table};`)
                  })
                )
              }),
            ])
          }
        }
      } catch (e) {
        console.error('error', e)
        throw e
      } finally {
        await wait(2000)
        const policiesToDelete = allPolicies.reduce(
          (acc, policy) => {
            acc.push(...policy)
            return acc
          },
          [] as { name: string; table: string }[]
        )

        for (const policy of policiesToDelete) {
          await db.query(`DROP POLICY IF EXISTS "${policy.name}" ON ${policy.table};`)
        }
      }
    })
  })
})

async function runOperation(
  operation: TestCaseAssert['operation'],
  options: {
    bucket: string
    jwt: string
    objectName: string
    userMetadata?: Record<string, unknown>
    mimeType?: string
    contentLength?: number
    copyMetadata?: boolean
    destinationObjectName?: string
  }
) {
  const {
    jwt,
    bucket,
    objectName,
    userMetadata,
    mimeType,
    contentLength,
    copyMetadata,
    destinationObjectName,
  } = options

  switch (operation) {
    case 'upload':
      return uploadFile(bucket, objectName, jwt, false, userMetadata, mimeType, contentLength)
    case 'upload.upsert':
      return uploadFile(bucket, objectName, jwt, true, userMetadata, mimeType, contentLength)
    case 'upload.tus':
      return tusUploadFile(bucket, objectName, jwt, userMetadata, mimeType, contentLength)
    case 'upload.signed':
      return signUploadUrl(bucket, objectName, jwt, userMetadata)
    case 'upload.s3.multipart':
      return s3MultipartUpload(bucket, objectName, jwt, userMetadata)
    case 'bucket.list':
      return appInstance.inject({
        method: 'GET',
        url: `/bucket`,
        headers: {
          authorization: `Bearer ${jwt}`,
        },
      })
    case 'bucket.get':
      return appInstance.inject({
        method: 'GET',
        url: `/bucket/${bucket}`,
        headers: {
          authorization: `Bearer ${jwt}`,
        },
      })
    case 'bucket.create':
      return appInstance.inject({
        method: 'POST',
        url: `/bucket`,
        headers: {
          authorization: `Bearer ${jwt}`,
        },
        payload: {
          name: bucket,
        },
      })
    case 'bucket.empty':
      return appInstance.inject({
        method: 'POST',
        url: `/bucket/${bucket}/empty`,
        headers: {
          authorization: `Bearer ${jwt}`,
        },
      })
    case 'bucket.update':
      console.log(`updating bucket ${bucket}`)
      return appInstance.inject({
        method: 'PUT',
        url: `/bucket/${bucket}`,
        headers: {
          authorization: `Bearer ${jwt}`,
        },
        payload: {
          public: true,
        },
      })
    case 'bucket.delete':
      return appInstance.inject({
        method: 'DELETE',
        url: `/bucket/${bucket}`,
        headers: {
          authorization: `Bearer ${jwt}`,
        },
      })
    case 'object.delete':
      return appInstance.inject({
        method: 'DELETE',
        url: `/object/${bucket}/${objectName}`,
        headers: {
          authorization: `Bearer ${jwt}`,
        },
      })
    case 'object.get':
      return appInstance.inject({
        method: 'GET',
        url: `/object/authenticated/${bucket}/${objectName}`,
        headers: {
          authorization: `Bearer ${jwt}`,
        },
      })
    case 'object.list':
      return appInstance.inject({
        method: 'POST',
        url: `/object/list/${bucket}`,
        headers: {
          authorization: `Bearer ${jwt}`,
        },
        payload: {
          prefix: '',
          sortBy: {
            column: 'name',
            order: 'asc',
          },
        },
      })
    case 'object.seed':
      await currentStorage.db.createObject({
        bucket_id: bucket,
        name: objectName,
        owner: currentUserId,
        metadata: { size: 1 },
        user_metadata: null,
        version: randomUUID(),
      })

      return { statusCode: 200, body: '{}', json: () => ({}) }
    case 'object.move':
      return appInstance.inject({
        method: 'POST',
        url: `/object/move`,
        headers: {
          authorization: `Bearer ${jwt}`,
        },
        payload: {
          bucketId: bucket,
          sourceKey: objectName,
          destinationKey: 'moved_' + objectName,
        },
      })
    case 'object.copy':
      return appInstance.inject({
        method: 'POST',
        url: `/object/copy`,
        headers: {
          authorization: `Bearer ${jwt}`,
          ...(userMetadata
            ? { 'x-metadata': Buffer.from(JSON.stringify(userMetadata)).toString('base64') }
            : {}),
        },
        payload: {
          bucketId: bucket,
          sourceKey: objectName,
          destinationKey: destinationObjectName ?? 'copied_' + objectName,
          copyMetadata: copyMetadata ?? true,
        },
      })
    default:
      throw new Error(`Operation ${operation} not supported`)
  }
}

async function createPolicy(db: Pool, policy: Policy) {
  const { name, content } = policy
  let { tables, roles, permissions } = policy

  if (!Array.isArray(roles)) {
    roles = [roles]
  }

  if (!Array.isArray(tables)) {
    tables = [tables]
  }

  if (!Array.isArray(permissions)) {
    permissions = [permissions]
  }

  const created: Promise<{ table: string; name: string }>[] = []

  tables.forEach((table) => {
    ;(roles as string[]).forEach((role) => {
      ;(permissions as string[]).forEach((permission) => {
        console.log(
          'RUNNING QUERY ' +
            `CREATE POLICY "${name}_${permission}" ON ${table} FOR ${permission} TO "${role}" ${content}`
        )
        created.push(
          db
            .query(
              `CREATE POLICY "${name}_${permission}" ON ${table} AS PERMISSIVE FOR ${permission} TO "${role}" ${content}`
            )
            .then(() => ({
              name: `${name}_${permission}`,
              table,
            }))
        )
      })
    })
  })

  return Promise.all(created)
}

async function uploadFile(
  bucket: string,
  fileName: string,
  jwt: string,
  upsert?: boolean,
  userMetadata?: Record<string, unknown>,
  mimeType?: string,
  contentLength?: number
) {
  const testFile = fs.createReadStream(path.resolve(__dirname, 'assets', 'sadcat.jpg'))
  const form = new FormData()
  form.append('file', testFile)

  if (userMetadata) {
    form.append('metadata', JSON.stringify(userMetadata))
  }

  if (mimeType) {
    form.append('contentType', mimeType)
  }

  const headers = Object.assign({}, form.getHeaders(), {
    authorization: `Bearer ${jwt}`,
    ...(upsert ? { 'x-upsert': 'true' } : {}),
    ...(contentLength ? { 'content-length': contentLength.toString() } : {}),
  })

  return appInstance.inject({
    method: 'POST',
    url: `/object/${bucket}/${fileName}`,
    headers,
    payload: form,
  })
}

async function tusUploadFile(
  bucket: string,
  objectName: string,
  jwt: string,
  userMetadata?: Record<string, unknown>,
  mimeType?: string,
  contentLength?: number
) {
  if (!appInstance.server.listening) {
    await appInstance.listen({ port: 0 })
  }

  const addressInfo = appInstance.server.address()
  if (!addressInfo || typeof addressInfo === 'string') {
    throw new Error('Unable to resolve local server address')
  }

  const localServerAddress = `http://127.0.0.1:${addressInfo.port}`

  const file = fs.createReadStream(path.resolve(__dirname, 'assets', 'sadcat.jpg'))

  let statusCode = 200
  let message = ''

  try {
    await new Promise((resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: `${localServerAddress}/upload/resumable`,
        uploadSize: contentLength || undefined,
        onShouldRetry: () => false,
        uploadDataDuringCreation: false,
        headers: {
          authorization: `Bearer ${jwt}`,
        },
        metadata: {
          bucketName: bucket,
          objectName,
          contentType: mimeType || 'application/octet-stream',
          cacheControl: '3600',
          ...(userMetadata ? { metadata: JSON.stringify(userMetadata) } : {}),
        },
        onError(error) {
          console.log('Failed because: ' + error)
          reject(error)
        },
        onSuccess: () => {
          resolve(true)
        },
      })

      upload.start()
    })
  } catch (e) {
    if (!(e instanceof DetailedError)) throw e

    const response = e.originalResponse
    if (!response) throw e

    statusCode = response.getStatus()
    message = response.getBody()
  }

  const body = message ? { message } : {}
  return { statusCode, body: JSON.stringify(body), json: () => body }
}

async function signUploadUrl(
  bucket: string,
  objectName: string,
  jwt: string,
  userMetadata?: Record<string, unknown>
) {
  const metadata = userMetadata
    ? Buffer.from(JSON.stringify(userMetadata)).toString('base64')
    : undefined

  return appInstance.inject({
    method: 'POST',
    url: `/object/upload/sign/${bucket}/${objectName}`,
    headers: {
      authorization: `Bearer ${jwt}`,
      ...(metadata ? { 'x-metadata': metadata } : {}),
    },
  })
}

async function s3MultipartUpload(
  bucket: string,
  objectName: string,
  jwt: string,
  userMetadata?: Record<string, unknown>
) {
  if (!appInstance.server.listening) {
    await appInstance.listen({ port: 0 })
  }

  const listener = appInstance.server.address() as { port: number }
  const anonKey = await anonKeyAsync
  const s3Client = new S3Client({
    endpoint: `http://127.0.0.1:${listener.port}/s3`,
    forcePathStyle: true,
    region: storageS3Region,
    credentials: {
      accessKeyId: tenantId,
      secretAccessKey: anonKey,
      sessionToken: jwt,
    },
  })

  let statusCode = 200
  let message = ''

  try {
    const s3Metadata = userMetadata
      ? Object.fromEntries(Object.entries(userMetadata).map(([k, v]) => [k, String(v)]))
      : undefined

    const createResp = await s3Client.send(
      new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: objectName,
        ContentType: 'image/jpg',
        ...(s3Metadata ? { Metadata: s3Metadata } : {}),
      })
    )

    const data = Buffer.alloc(5 * 1024)
    const partResp = await s3Client.send(
      new UploadPartCommand({
        Bucket: bucket,
        Key: objectName,
        UploadId: createResp.UploadId,
        PartNumber: 1,
        Body: data,
        ContentLength: data.length,
      })
    )

    await s3Client.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: objectName,
        UploadId: createResp.UploadId,
        MultipartUpload: { Parts: [{ PartNumber: 1, ETag: partResp.ETag }] },
      })
    )
  } catch (e: unknown) {
    if (!(e instanceof S3ServiceException)) throw e

    statusCode = e.$metadata.httpStatusCode ?? 400
    message = e.message
  } finally {
    s3Client.destroy()
  }
  const body = message ? { message } : {}
  return { statusCode, body: JSON.stringify(body), json: () => body }
}
