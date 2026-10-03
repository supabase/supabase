import { Readable } from 'node:stream'
import { setTimeout as sleep } from 'node:timers/promises'
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CopyObjectCommand,
  CreateBucketCommand,
  CreateMultipartUploadCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetBucketLocationCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  ListMultipartUploadsCommand,
  ListObjectsCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  ListPartsCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
  UploadPartCommand,
  UploadPartCopyCommand,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { wait } from '@internal/concurrency'
import { getPostgresConnection, getServiceKeyUser, type TenantConnection } from '@internal/database'
import { DBMigration } from '@internal/database/migrations'
import { ERRORS } from '@internal/errors'
import { StoragePgDB } from '@storage/database'
import { Uploader } from '@storage/uploader'
import { createHash, createHmac, randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { fetch as undiciFetch } from 'undici'
import { onTestFinished, vi } from 'vitest'
import app from '../app'
import { getConfig, mergeConfig } from '../config'
import type { ObjectMetadata } from '../storage/backend'
import { ObjectCreatedCopyEvent, ObjectCreatedPostEvent, ObjectRemoved } from '../storage/events'
import type { ObjectRemovedEvent } from '../storage/events/lifecycle/object-removed'
import { EMPTY_SHA256_HASH, SignatureV4, SignatureV4Service } from '../storage/protocols/s3'

interface ObjectCreatedEvent {
  name: string
  version: string
  bucketId: string
  metadata: ObjectMetadata
  uploadType: 'standard' | 'resumable' | 's3'
  tenant: { ref: string; host?: string }
  reqId: string
  sbReqId?: string
}

const {
  anonKeyAsync,
  s3ProtocolAccessKeySecret,
  s3ProtocolAccessKeyId,
  storageS3Region,
  tenantId,
} = getConfig()
const STREAMING_PAYLOAD_ALGORITHM = 'STREAMING-AWS4-HMAC-SHA256-PAYLOAD'
const STREAMING_TRAILER_PAYLOAD_ALGORITHM = 'STREAMING-AWS4-HMAC-SHA256-PAYLOAD-TRAILER'

// Node 24's built-in fetch can duplicate Content-Length through npm Undici's dispatcher.
// Keep byte-exact payload requests on npm Undici; FormData requests stay on native fetch.
async function createBucket(client: S3Client, name?: string, publicRead = true) {
  let bucketName: string
  if (!name) {
    bucketName = `TestBucket-${randomUUID()}`
  } else {
    bucketName = `${name}-${randomUUID()}`
  }

  const createBucketRequest = new CreateBucketCommand({
    Bucket: bucketName,
    ACL: publicRead ? 'public-read' : undefined,
  })

  await client.send(createBucketRequest)

  return bucketName
}

async function uploadFile(
  client: S3Client,
  bucketName: string,
  key: string,
  mb: number,
  headers?: Record<string, string>
) {
  const uploader = new Upload({
    client,
    params: {
      Bucket: bucketName,
      Key: key,
      ContentType: 'image/jpg',
      Body: Buffer.alloc(1024 * mb),
      Metadata: headers,
    },
  })

  return await uploader.done()
}

function formatAwsDate(date = new Date()) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '')
}

function hmacSha256(key: string | Buffer, value: string) {
  return createHmac('sha256', key).update(value).digest()
}

function sha256Hex(value: Buffer) {
  return createHash('sha256').update(value).digest('hex')
}

function deriveSigningKey(secretKey: string, shortDate: string, region: string, service: string) {
  const dateKey = hmacSha256(`AWS4${secretKey}`, shortDate)
  const regionKey = hmacSha256(dateKey, region)
  const serviceKey = hmacSha256(regionKey, service)
  return hmacSha256(serviceKey, 'aws4_request')
}

function createSignedChunk(
  payload: Buffer,
  previousSignature: string,
  options: {
    longDate: string
    shortDate: string
    region: string
    service: string
    secretKey: string
  }
) {
  const signingKey = deriveSigningKey(
    options.secretKey,
    options.shortDate,
    options.region,
    options.service
  )
  const scope = `${options.shortDate}/${options.region}/${options.service}/aws4_request`
  const chunkHash = sha256Hex(payload)
  const stringToSign = [
    'AWS4-HMAC-SHA256-PAYLOAD',
    options.longDate,
    scope,
    previousSignature,
    EMPTY_SHA256_HASH,
    chunkHash,
  ].join('\n')
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex')

  return {
    signature,
    encoded: Buffer.concat([
      Buffer.from(`${payload.length.toString(16)};chunk-signature=${signature}\r\n`),
      payload,
      Buffer.from('\r\n'),
    ]),
  }
}

async function sendAwsChunkedRequest(options: {
  baseUrl: string
  path: string
  payload: Buffer
  query?: Record<string, string>
}) {
  const signedRequest = await createSignedS3Request({
    baseUrl: options.baseUrl,
    path: options.path,
    method: 'PUT',
    query: options.query,
    contentSha: STREAMING_PAYLOAD_ALGORITHM,
    headers: {
      'content-encoding': 'aws-chunked',
      'x-amz-decoded-content-length': options.payload.length.toString(),
    },
  })
  const chunk = createSignedChunk(options.payload, signedRequest.signature, {
    longDate: signedRequest.longDate,
    shortDate: signedRequest.shortDate,
    region: storageS3Region,
    service: signedRequest.service,
    secretKey: s3ProtocolAccessKeySecret!,
  })
  const endChunk = createSignedChunk(Buffer.alloc(0), chunk.signature, {
    longDate: signedRequest.longDate,
    shortDate: signedRequest.shortDate,
    region: storageS3Region,
    service: signedRequest.service,
    secretKey: s3ProtocolAccessKeySecret!,
  })
  const encodedBody = Buffer.concat([chunk.encoded, endChunk.encoded])

  const response = await undiciFetch(signedRequest.requestUrl, {
    method: 'PUT',
    headers: {
      ...signedRequest.headers,
      'content-length': encodedBody.length.toString(),
    },
    body: encodedBody,
  })

  return {
    status: response.status,
    data: await response.text(),
  }
}

async function sendAwsChunkedTrailerModeWithoutTrailerRequest(options: {
  baseUrl: string
  path: string
  payload: Buffer
}) {
  const signedRequest = await createSignedS3Request({
    baseUrl: options.baseUrl,
    path: options.path,
    method: 'PUT',
    contentSha: STREAMING_TRAILER_PAYLOAD_ALGORITHM,
    headers: {
      'content-encoding': 'aws-chunked',
      'x-amz-decoded-content-length': options.payload.length.toString(),
      'x-amz-trailer': 'x-amz-checksum-crc32',
    },
  })
  const chunk = createSignedChunk(options.payload, signedRequest.signature, {
    longDate: signedRequest.longDate,
    shortDate: signedRequest.shortDate,
    region: storageS3Region,
    service: signedRequest.service,
    secretKey: s3ProtocolAccessKeySecret!,
  })
  const endChunk = createSignedChunk(Buffer.alloc(0), chunk.signature, {
    longDate: signedRequest.longDate,
    shortDate: signedRequest.shortDate,
    region: storageS3Region,
    service: signedRequest.service,
    secretKey: s3ProtocolAccessKeySecret!,
  })
  const encodedBody = Buffer.concat([chunk.encoded, endChunk.encoded])

  const response = await undiciFetch(signedRequest.requestUrl, {
    method: 'PUT',
    headers: {
      ...signedRequest.headers,
      'content-length': encodedBody.length.toString(),
    },
    body: encodedBody,
  })

  return {
    status: response.status,
    data: await response.text(),
  }
}

async function createSignedS3Request(options: {
  baseUrl: string
  path: string
  method: 'POST' | 'PUT' | 'GET' | 'DELETE'
  body?: string | Buffer
  query?: Record<string, string>
  headers?: Record<string, string>
  contentSha?: string
  includeContentLength?: boolean
}) {
  const longDate = formatAwsDate()
  const shortDate = longDate.slice(0, 8)
  const host = new URL(options.baseUrl).host
  const service = SignatureV4Service.S3
  const payload = options.body ?? Buffer.alloc(0)
  const payloadBuffer = typeof payload === 'string' ? Buffer.from(payload) : payload
  const payloadHash = options.contentSha || sha256Hex(payloadBuffer)
  const normalizedHeaders = Object.fromEntries(
    Object.entries(options.headers || {}).map(([key, value]) => [key.toLowerCase(), value])
  )
  const signer = new SignatureV4({
    enforceRegion: false,
    credentials: {
      accessKey: s3ProtocolAccessKeyId!,
      secretKey: s3ProtocolAccessKeySecret!,
      region: storageS3Region,
      service,
    },
  })

  const headers: Record<string, string> = {
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': longDate,
    ...(options.includeContentLength ? { 'content-length': payloadBuffer.length.toString() } : {}),
    ...normalizedHeaders,
  }

  const signedHeaders = Object.keys(headers)
    .map((header) => header.toLowerCase())
    .sort()

  const clientSignature = {
    credentials: {
      accessKey: s3ProtocolAccessKeyId!,
      shortDate,
      region: storageS3Region,
      service,
    },
    signedHeaders,
    signature: '',
    longDate,
    contentSha: payloadHash,
  }

  const {
    signatures: [signature],
  } = await signer.sign(clientSignature, {
    url: options.path,
    method: options.method,
    headers,
    query: options.query,
    body: options.body,
  })

  const requestUrl = new URL(`${options.baseUrl}${options.path}`)

  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      requestUrl.searchParams.set(key, value)
    }
  }

  return {
    headers: {
      ...headers,
      authorization:
        `AWS4-HMAC-SHA256 Credential=${s3ProtocolAccessKeyId}/${shortDate}/` +
        `${storageS3Region}/${service}/aws4_request, SignedHeaders=${signedHeaders.join(';')}, ` +
        `Signature=${signature}`,
    },
    requestUrl,
    service,
    shortDate,
    longDate,
    signature,
  }
}

async function sendSignedS3Request(options: {
  baseUrl: string
  path: string
  method: 'POST' | 'PUT' | 'GET' | 'DELETE'
  body?: string
  query?: Record<string, string>
  headers?: Record<string, string>
}) {
  const payload = options.body || ''
  const signedRequest = await createSignedS3Request({
    ...options,
    body: payload,
    includeContentLength: true,
  })

  const response = await undiciFetch(signedRequest.requestUrl, {
    method: options.method,
    headers: signedRequest.headers,
    body: payload,
  })

  return {
    status: response.status,
    data: await response.text(),
  }
}

async function expectMultipartUploadToRemainPending(
  client: S3Client,
  options: {
    bucket: string
    key: string
    uploadId: string
    partETag: string
  }
) {
  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: options.bucket,
        Key: options.key,
      })
    )
    throw new Error('Should not reach here')
  } catch (e) {
    expect((e as Error).message).not.toBe('Should not reach here')
    expect((e as S3ServiceException).$metadata.httpStatusCode).toBe(404)
  }

  const listPartsResp = await client.send(
    new ListPartsCommand({
      Bucket: options.bucket,
      Key: options.key,
      UploadId: options.uploadId,
    })
  )

  expect(listPartsResp.Parts).toHaveLength(1)
  expect(listPartsResp.Parts?.[0].PartNumber).toBe(1)
  expect(listPartsResp.Parts?.[0].ETag).toBe(options.partETag)
}

describe('S3 Protocol', () => {
  describe('Bucket', () => {
    let testApp: FastifyInstance
    let client: S3Client
    let baseUrl: string

    beforeAll(async () => {
      testApp = app()
      const listener = await testApp.listen()
      baseUrl = listener.replace('[::1]', 'localhost')
      client = new S3Client({
        endpoint: `${baseUrl}/s3`,
        forcePathStyle: true,
        region: storageS3Region,
        credentials: {
          accessKeyId: s3ProtocolAccessKeyId!,
          secretAccessKey: s3ProtocolAccessKeySecret!,
        },
      })
    })

    afterEach(() => {
      getConfig({ reload: true })
    })

    afterAll(async () => {
      client.destroy()
      await testApp.close()
    })

    describe('CreateBucketCommand', () => {
      it('creates a bucket', async () => {
        const createBucketRequest = new CreateBucketCommand({
          Bucket: `SomeBucket-${randomUUID()}`,
          ACL: 'public-read',
        })

        const { Location } = await client.send(createBucketRequest)

        expect(Location).toBeTruthy()
      })

      it('honors an ACL hoisted into a presigned url query', async () => {
        const bucketName = `SomeBucket-${randomUUID()}`
        const signedUrl = await getSignedUrl(
          client,
          new CreateBucketCommand({ Bucket: bucketName, ACL: 'public-read' }),
          { expiresIn: 100 }
        )
        expect(new URL(signedUrl).searchParams.get('x-amz-acl')).toBe('public-read')

        const resp = await undiciFetch(signedUrl, { method: 'PUT' })
        expect(resp.status).toBe(200)

        const bucket = await testApp.inject({
          method: 'GET',
          url: `/bucket/${bucketName}`,
          headers: { authorization: `Bearer ${process.env.SERVICE_KEY}` },
        })
        expect(bucket.json().public).toBe(true)
      })

      it('can get bucket versioning', async () => {
        const bucket = await createBucket(client)
        const bucketVersioningCommand = new GetBucketVersioningCommand({
          Bucket: bucket,
        })

        const resp = await client.send(bucketVersioningCommand)
        expect(resp.Status).toEqual('Suspended')
        expect(resp.MFADelete).toEqual('Disabled')
      })

      it('can get bucket location', async () => {
        const bucket = await createBucket(client)
        const getBucketLocationCommand = new GetBucketLocationCommand({
          Bucket: bucket,
        })

        const resp = await client.send(getBucketLocationCommand)
        expect(resp.LocationConstraint).toEqual(storageS3Region)

        const signedUrl = await getSignedUrl(client, getBucketLocationCommand, { expiresIn: 100 })
        const rawResponse = await fetch(signedUrl, {
          headers: { accept: 'application/xml' },
        })
        const rawBody = (await rawResponse.text()).replace(/^<\?xml[^>]*\?>/, '')

        expect(rawResponse.status).toBe(200)
        expect(rawBody).toBe(
          '<LocationConstraint xmlns="http://s3.amazonaws.com/doc/2006-03-01/">' +
            `${storageS3Region}</LocationConstraint>`
        )
      })
    })

    describe('DeleteBucketCommand', () => {
      it('can delete an empty bucket', async () => {
        const bucketName = await createBucket(client)
        const deleteBucketRequest = new DeleteBucketCommand({
          Bucket: bucketName,
        })

        const resp = await client.send(deleteBucketRequest)
        expect(resp.$metadata.httpStatusCode).toBe(204)
      })

      it('cannot delete a non empty bucket', async () => {
        const bucketName = await createBucket(client)
        await uploadFile(client, bucketName, 'test-1.jpg', 1)
        const deleteBucketRequest = new DeleteBucketCommand({
          Bucket: bucketName,
        })

        try {
          await client.send(deleteBucketRequest)
          throw new Error('Should not reach here')
        } catch (e) {
          expect((e as Error).message).not.toBe('Should not reach here')
          expect((e as S3ServiceException).$metadata.httpStatusCode).toBe(409)
          expect((e as S3ServiceException).name).toBe('BucketNotEmpty')
          expect((e as S3ServiceException).message).toBe(
            'The bucket you tried to delete is not empty'
          )
        }
      })
    })

    describe('HeadBucketCommand', () => {
      it('return bucket information when exists', async () => {
        const bucketName = await createBucket(client)
        const headBucketRequest = new HeadBucketCommand({
          Bucket: bucketName,
        })

        const resp = await client.send(headBucketRequest)
        expect(resp.$metadata.httpStatusCode).toBe(200)
        expect(resp.BucketRegion).toBe(storageS3Region)
      })

      it('will return bucket not found error', async () => {
        const headBucketRequest = new HeadBucketCommand({
          Bucket: 'dont-exist-bucket',
        })

        try {
          await client.send(headBucketRequest)
          throw new Error('Should not reach here')
        } catch (e) {
          expect((e as S3ServiceException).$metadata.httpStatusCode).toBe(404)
        }
      })
    })

    describe('ListBucketsCommand', () => {
      it('can list buckets', async () => {
        await createBucket(client)
        const listBuckets = new ListBucketsCommand({})

        const resp = await client.send(listBuckets)
        expect(resp.Buckets?.length || 0).toBeGreaterThan(0)
      })
    })

    describe('ListObjectCommand', () => {
      it('list empty bucket', async () => {
        const bucket = await createBucket(client)
        const listBuckets = new ListObjectsCommand({
          Bucket: bucket,
        })

        const resp = await client.send(listBuckets)
        expect(resp.Contents?.length).toBe(undefined)
      })

      it('list all keys', async () => {
        const bucket = await createBucket(client)
        const listBuckets = new ListObjectsCommand({
          Bucket: bucket,
        })

        await Promise.all([
          uploadFile(client, bucket, 'test-1.jpg', 1),
          uploadFile(client, bucket, 'prefix-1/test-1.jpg', 1),
          uploadFile(client, bucket, 'prefix-3/test-1.jpg', 1),
        ])

        const resp = await client.send(listBuckets)
        expect(resp.Contents?.length).toBe(3)
      })

      it('list all keys with pagination', async () => {
        const bucket = await createBucket(client)
        const listObjects = new ListObjectsCommand({
          Bucket: bucket,
          Delimiter: '/',
          MaxKeys: 1,
        })

        await Promise.all([
          uploadFile(client, bucket, 'test-1.jpg', 1),
          uploadFile(client, bucket, 'prefix-1/test-1.jpg', 1),
          uploadFile(client, bucket, 'prefix-3/test-1.jpg', 1),
          uploadFile(client, bucket, 'prefix-4/test-1.jpg', 1),
        ])

        const resp = await client.send(listObjects)
        expect(resp.CommonPrefixes?.length).toBe(1)
        expect(resp.IsTruncated).toBe(true)

        const listObjects2 = new ListObjectsCommand({
          Bucket: bucket,
          Delimiter: '/',
          MaxKeys: 3,
          Marker: resp.NextMarker,
        })
        const resp2 = await client.send(listObjects2)
        expect(resp2.Marker).toBe(resp.NextMarker)
        expect(resp2.CommonPrefixes?.length).toBe(2)
        expect(resp2.Contents?.length).toBe(1)
      })

      it('omits NextMarker when truncated without a delimiter', async () => {
        const bucket = await createBucket(client)

        await Promise.all([
          uploadFile(client, bucket, 'a.jpg', 1),
          uploadFile(client, bucket, 'b.jpg', 1),
          uploadFile(client, bucket, 'c.jpg', 1),
        ])

        const truncated = await client.send(new ListObjectsCommand({ Bucket: bucket, MaxKeys: 2 }))
        expect(truncated.IsTruncated).toBe(true)
        // Per the S3 spec, NextMarker is only returned when the Delimiter
        // request parameter is specified.
        expect(truncated.NextMarker).toBeUndefined()
      })

      it('omits NextMarker when the response is not truncated', async () => {
        const bucket = await createBucket(client)

        await uploadFile(client, bucket, 'only.jpg', 1)

        const resp = await client.send(new ListObjectsCommand({ Bucket: bucket }))
        expect(resp.IsTruncated).toBe(false)
        expect(resp.NextMarker).toBeUndefined()
      })

      it('sets NextMarker when truncated with a delimiter', async () => {
        const bucket = await createBucket(client)

        await Promise.all([
          uploadFile(client, bucket, 'p1/test-1.jpg', 1),
          uploadFile(client, bucket, 'p2/test-1.jpg', 1),
          uploadFile(client, bucket, 'p3/test-1.jpg', 1),
        ])

        const resp = await client.send(
          new ListObjectsCommand({ Bucket: bucket, Delimiter: '/', MaxKeys: 1 })
        )
        expect(resp.IsTruncated).toBe(true)
        expect(resp.NextMarker).toBeDefined()

        const next = await client.send(
          new ListObjectsCommand({
            Bucket: bucket,
            Delimiter: '/',
            MaxKeys: 10,
            Marker: resp.NextMarker,
          })
        )
        expect(next.CommonPrefixes?.length).toBeGreaterThan(0)
      })
    })

    describe('ListObjectsV2Command', () => {
      it('list empty bucket', async () => {
        const bucket = await createBucket(client)
        const listBuckets = new ListObjectsV2Command({
          Bucket: bucket,
        })

        const resp = await client.send(listBuckets)
        expect(resp.Contents?.length).toBe(undefined)
      })

      it('list all keys', async () => {
        const bucket = await createBucket(client)
        const listBuckets = new ListObjectsV2Command({
          Bucket: bucket,
        })

        await Promise.all([
          uploadFile(client, bucket, 'test-1.jpg', 1),
          uploadFile(client, bucket, 'prefix-1/test-1.jpg', 1),
          uploadFile(client, bucket, 'prefix-3/test-1.jpg', 1),
        ])

        const resp = await client.send(listBuckets)
        expect(resp.Contents?.length).toBe(3)
      })

      it('list objects with aws specific uri encoding', async () => {
        const bucket = await createBucket(client)
        const testObject1 = 'test (1).jpg'
        const testObject2 = `prefix-1/test-1!'(123)*.jpg`

        await Promise.all([testObject1, testObject2].map((v) => uploadFile(client, bucket, v, 1)))

        const resp = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
          })
        )
        expect(resp.Contents?.length).toBe(2)

        const resp2 = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: 'test (',
          })
        )
        expect(resp2.Contents?.length).toBe(1)
        expect(resp2.Contents).toEqual([
          expect.objectContaining({
            Key: testObject1,
          }),
        ])

        const resp3 = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: `prefix-1/test-1!'(123)*`,
          })
        )
        expect(resp3.Contents?.length).toBe(1)
        expect(resp3.Contents).toEqual([
          expect.objectContaining({
            Key: testObject2,
          }),
        ])

        const encoded = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: `prefix-1/test-1!'(`,
            Delimiter: '/',
            StartAfter: `prefix-1/test-1!'`,
            EncodingType: 'url',
          })
        )
        expect(encoded.Prefix).toBe('prefix-1%2Ftest-1%21%27%28')
        expect(encoded.Delimiter).toBe('%2F')
        expect(encoded.StartAfter).toBe('prefix-1%2Ftest-1%21%27')
        expect(encoded.Contents).toEqual([
          expect.objectContaining({
            Key: 'prefix-1%2Ftest-1%21%27%28123%29%2A.jpg',
          }),
        ])
      })

      it('list keys and common prefixes', async () => {
        const bucket = await createBucket(client)
        const listBuckets = new ListObjectsV2Command({
          Bucket: bucket,
          Delimiter: '/',
        })

        await Promise.all([
          uploadFile(client, bucket, 'test-1.jpg', 1),
          uploadFile(client, bucket, 'prefix-1/test-1.jpg', 1),
          uploadFile(client, bucket, 'prefix-3/test-1.jpg', 1),
        ])

        const resp = await client.send(listBuckets)
        expect(resp.Contents?.length).toBe(1)
        expect(resp.CommonPrefixes?.length).toBe(2)
        expect(resp.KeyCount).toBe(3)
      })

      it('paginate keys and common prefixes', async () => {
        const bucket = await createBucket(client)
        const listBucketsPage1 = new ListObjectsV2Command({
          Bucket: bucket,
          Delimiter: '/',
          MaxKeys: 1,
        })

        await Promise.all([
          uploadFile(client, bucket, 'test-1.jpg', 1),
          uploadFile(client, bucket, 'prefix-1/test-1.jpg', 1),
          uploadFile(client, bucket, 'prefix-3/test-1.jpg', 1),
        ])

        const objectsPage1 = await client.send(listBucketsPage1)
        expect(objectsPage1.Contents?.length).toBe(undefined)
        expect(objectsPage1.CommonPrefixes?.length).toBe(1)
        expect(objectsPage1.CommonPrefixes?.[0].Prefix).toBe('prefix-1/')

        const listBucketsPage2 = new ListObjectsV2Command({
          Bucket: bucket,
          Delimiter: '/',
          MaxKeys: 1,
          ContinuationToken: objectsPage1.NextContinuationToken,
        })

        const objectsPage2 = await client.send(listBucketsPage2)

        expect(objectsPage2.Contents?.length).toBe(undefined)
        expect(objectsPage2.CommonPrefixes?.length).toBe(1)
        expect(objectsPage2.CommonPrefixes?.[0].Prefix).toBe('prefix-3/')

        const listBucketsPage3 = new ListObjectsV2Command({
          Bucket: bucket,
          Delimiter: '/',
          MaxKeys: 1,
          ContinuationToken: objectsPage2.NextContinuationToken,
        })

        const objectsPage3 = await client.send(listBucketsPage3)

        expect(objectsPage3.Contents?.length).toBe(1)
        expect(objectsPage3.CommonPrefixes?.length).toBe(undefined)
        expect(objectsPage3.Contents?.[0].Key).toBe('test-1.jpg')
      })

      it('paginate keys and common prefixes using StartAfter', async () => {
        const bucket = await createBucket(client)
        const listBucketsPage1 = new ListObjectsV2Command({
          Bucket: bucket,
          Delimiter: '/',
          MaxKeys: 1,
          StartAfter: 'prefix-1/test-1.jpg',
        })

        await Promise.all([
          uploadFile(client, bucket, 'test-1.jpg', 1),
          uploadFile(client, bucket, 'prefix-1/test-1.jpg', 1),
          uploadFile(client, bucket, 'prefix-3/test-1.jpg', 1),
        ])

        const objectsPage1 = await client.send(listBucketsPage1)
        expect(objectsPage1.Contents?.length).toBe(undefined)
        expect(objectsPage1.CommonPrefixes?.length).toBe(1)
        expect(objectsPage1.CommonPrefixes?.[0].Prefix).toBe('prefix-3/')
        expect(objectsPage1.StartAfter).toBe('prefix-1/test-1.jpg')
        expect(objectsPage1.IsTruncated).toBe(true)

        const listBucketsPage2 = new ListObjectsV2Command({
          Bucket: bucket,
          Delimiter: '/',
          MaxKeys: 1,
          ContinuationToken: objectsPage1.NextContinuationToken,
        })

        const objectsPage2 = await client.send(listBucketsPage2)

        expect(objectsPage2.Contents?.length).toBe(1)
        expect(objectsPage2.CommonPrefixes?.length).toBe(undefined)

        const listBucketsPage3 = new ListObjectsV2Command({
          Bucket: bucket,
          Delimiter: '/',
          MaxKeys: 1,
          ContinuationToken: objectsPage2.NextContinuationToken,
          StartAfter: 'prefix-3/test-1.jpg',
        })

        const objectsPage3 = await client.send(listBucketsPage3)

        expect(objectsPage3.Contents?.length).toBe(1)
        expect(objectsPage3.CommonPrefixes?.length).toBe(undefined)
        expect(objectsPage3.Contents?.[0].Key).toBe('test-1.jpg')
        expect(objectsPage3.IsTruncated).toBe(false)
      })

      it('accepts the legacy default sort order and rejects unsupported S3 token fields', async () => {
        const bucket = await createBucket(client)

        const legacyToken = Buffer.from('o:asc').toString('base64')
        const legacyResponse = await client.send(
          new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: legacyToken })
        )
        expect(legacyResponse.$metadata.httpStatusCode).toBe(200)

        for (const tokenPart of [
          'o:desc',
          'c:created_at',
          'a:1970-01-01T00:00:00.000Z',
          'v:version-id',
          'r:infinity',
          'n:include',
          'd:include',
          'e:true',
        ]) {
          const tamperedToken = Buffer.from(tokenPart).toString('base64')

          try {
            await client.send(
              new ListObjectsV2Command({
                Bucket: bucket,
                ContinuationToken: tamperedToken,
              })
            )
            throw new Error('Should not reach here')
          } catch (e) {
            expect((e as Error).message).not.toBe('Should not reach here')
            expect((e as S3ServiceException).$metadata.httpStatusCode).toBe(400)
          }
        }
      })

      it('lists an entity-heavy first page without XML expansion failure', async () => {
        const bucket = await createBucket(client)
        const minEntityExpansions = 2000
        const pageSize = 10
        const entityRefsPerKey = Math.ceil(minEntityExpansions / pageSize)
        const entityRun = '&'.repeat(entityRefsPerKey)
        const names = Array.from({ length: pageSize + 1 }, (_, i) => {
          return `key-${String(i).padStart(2, '0')}-${entityRun}.txt`
        })

        for (let i = 0; i < names.length; i += pageSize) {
          await Promise.all(
            names.slice(i, i + pageSize).map((name) =>
              client.send(
                new PutObjectCommand({
                  Bucket: bucket,
                  Key: name,
                  Body: Buffer.alloc(1),
                  ContentType: 'text/plain',
                })
              )
            )
          )
        }

        const page1 = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            MaxKeys: pageSize,
          })
        )

        expect(page1.Contents).toHaveLength(pageSize)
        expect(page1.IsTruncated).toBe(true)
        expect(page1.NextContinuationToken).toBeTruthy()
        expect(page1.Contents?.map((entry) => entry.Key)).toEqual(names.slice(0, pageSize))

        const page2 = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            ContinuationToken: page1.NextContinuationToken,
            MaxKeys: pageSize,
          })
        )

        expect(page2.Contents).toHaveLength(1)
        expect(page2.IsTruncated).toBe(false)
        expect(page2.Contents?.map((entry) => entry.Key)).toEqual(names.slice(pageSize))
      }, 60000)
    })

    for (const urlEncode of [true, false]) {
      const enc = urlEncode ? 'url' : undefined
      it(`paginate objects in folder with prefix, Encoding=${enc}`, async () => {
        const bucket = await createBucket(client)
        const prefixPath = 'this/is/the/path/'

        await Promise.all(
          new Array(11)
            .fill(1)
            .map((_, i) => uploadFile(client, bucket, prefixPath + `a-video-file-${i}.mp4`, 1))
        )

        const seenTokens = new Set()

        let continuationToken: string | undefined = undefined
        let isTruncated = true
        let totalCount = 0
        let totalPages = 0

        while (isTruncated) {
          const resp: ListObjectsV2CommandOutput = await client.send(
            new ListObjectsV2Command({
              Bucket: bucket,
              Prefix: prefixPath,
              MaxKeys: 3,
              ContinuationToken: continuationToken,
              EncodingType: enc,
              Delimiter: '/',
            })
          )

          isTruncated = resp.IsTruncated ?? false
          totalCount += resp.Contents?.length ?? 0
          totalPages++

          if (isTruncated) {
            expect(resp.Contents?.length ?? 0).toBeGreaterThan(0)
            expect(resp.NextContinuationToken).toBeTruthy()
          }

          expect(seenTokens.has(resp.NextContinuationToken)).toBe(false)
          seenTokens.add(resp.NextContinuationToken)

          continuationToken = resp.NextContinuationToken
        }
        expect(totalCount).toBe(11)
        expect(totalPages).toBe(4)
      })
    }

    describe('MultiPart Form Data Upload', () => {
      // Hand-signs a POST policy with the server's S3 credentials, returning the
      // form fields a client would submit. Lets us craft conditions the AWS SDK
      // won't generate on its own
      function signPostPolicy(policy: Record<string, unknown>) {
        const shortDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const policyB64 = Buffer.from(JSON.stringify(policy)).toString('base64')
        const hmac = (key: Buffer | string, data: string) =>
          createHmac('sha256', key).update(data, 'utf-8').digest()
        const kDate = hmac('AWS4' + s3ProtocolAccessKeySecret!, shortDate)
        const kRegion = hmac(kDate, storageS3Region)
        const kService = hmac(kRegion, 's3')
        const kSigning = hmac(kService, 'aws4_request')
        const signature = hmac(kSigning, policyB64).toString('hex')
        const credential = `${s3ProtocolAccessKeyId}/${shortDate}/${storageS3Region}/s3/aws4_request`
        return { policyB64, signature, credential }
      }

      it('can upload using multipart/form-data', async () => {
        const webhookSpy = vi
          .spyOn(ObjectCreatedPostEvent, 'sendWebhook')
          .mockResolvedValue(undefined)

        try {
          const bucketName = await createBucket(client)
          const signedURL = await createPresignedPost(client, {
            Bucket: bucketName,
            Key: 'test.jpg',
            Expires: 5000,
            Fields: {
              'Content-Type': 'image/jpg',
              'X-Amz-Meta-Custom': 'meta-field',
            },
          })

          const formData = new FormData()
          Object.keys(signedURL.fields).forEach((key) => {
            formData.set(key, signedURL.fields[key])
          })

          const data = Buffer.alloc(1024)
          formData.set('file', new Blob([data]), 'test.jpg')

          const resp = await fetch(signedURL.url, { method: 'POST', body: formData })

          expect(resp.status).toBe(200)

          // Verify webhook was called with correct data
          expect(webhookSpy).toHaveBeenCalledTimes(1)
          const webhookCall = webhookSpy.mock.calls[0][0] as ObjectCreatedEvent
          expect(webhookCall).toMatchObject({
            tenant: expect.objectContaining({ ref: tenantId }),
            name: 'test.jpg',
            version: expect.any(String),
            bucketId: bucketName,
            reqId: expect.any(String),
            metadata: expect.any(Object),
            uploadType: 's3',
          })
          expect(webhookCall.metadata).toBeDefined()
          expect(webhookCall.metadata).toHaveProperty('size')
        } finally {
          webhookSpy.mockRestore()
        }
      })

      it('prevent uploading files larger than the maxFileSize limit', async () => {
        mergeConfig({
          uploadFileSizeLimit: 1024,
        })
        const bucketName = await createBucket(client)
        const signedURL = await createPresignedPost(client, {
          Bucket: bucketName,
          Key: 'test.jpg',
          Expires: 5000,
          Fields: {
            'Content-Type': 'image/jpg',
          },
        })

        const formData = new FormData()
        Object.keys(signedURL.fields).forEach((key) => {
          formData.set(key, signedURL.fields[key])
        })

        const data = Buffer.alloc(1024 * 2)
        formData.set('file', new Blob([data]), 'test.jpg')

        const resp = await fetch(signedURL.url, { method: 'POST', body: formData })

        expect(resp.status).toBe(413)
        expect(resp.statusText).toBe('Payload Too Large')
      })

      describe('with a signed content-length-range', () => {
        const uploadSized = async (
          bucketName: string,
          size: number,
          [min, max]: [number, number] = [10, 100]
        ) => {
          const signedURL = await createPresignedPost(client, {
            Bucket: bucketName,
            Key: 'sized.bin',
            Expires: 5000,
            Conditions: [['content-length-range', min, max]],
          })

          const formData = new FormData()
          Object.keys(signedURL.fields).forEach((key) => {
            formData.set(key, signedURL.fields[key])
          })
          formData.set('file', new Blob([Buffer.alloc(size)]), 'sized.bin')

          return fetch(signedURL.url, { method: 'POST', body: formData })
        }

        it('accepts a file within the range', async () => {
          const bucketName = await createBucket(client)

          const resp = await uploadSized(bucketName, 50)

          expect(resp.status).toBe(200)
        })

        it.each([10, 100])('accepts a file of exactly %d bytes', async (size) => {
          const bucketName = await createBucket(client)

          const resp = await uploadSized(bucketName, size)

          expect(resp.status).toBe(200)
        })

        it('keeps the tenant limit when the range allows more', async () => {
          mergeConfig({ uploadFileSizeLimit: 1024 })
          const bucketName = await createBucket(client)

          const resp = await uploadSized(bucketName, 2048, [0, 4096])

          expect(resp.status).toBe(413)
        })

        it('keeps the bucket limit when the range allows more', async () => {
          const bucketName = await createBucket(client)
          const update = await testApp.inject({
            method: 'PUT',
            url: `/bucket/${bucketName}`,
            headers: { authorization: `Bearer ${process.env.SERVICE_KEY}` },
            payload: { file_size_limit: 1024 },
          })
          expect(update.statusCode, update.body).toBe(200)

          const resp = await uploadSized(bucketName, 2048, [0, 4096])

          expect(resp.status).toBe(413)
        })

        it('rejects a file larger than the range', async () => {
          const bucketName = await createBucket(client)

          const resp = await uploadSized(bucketName, 101)

          expect(resp.status).toBe(413)
          await expect(
            client.send(new HeadObjectCommand({ Bucket: bucketName, Key: 'sized.bin' }))
          ).rejects.toThrow()
        })

        it('rejects a file smaller than the range without storing it', async () => {
          const bucketName = await createBucket(client)

          const resp = await uploadSized(bucketName, 9)

          expect(resp.status).toBe(400)
          expect(await resp.text()).toContain('EntityTooSmall')
          await expect(
            client.send(new HeadObjectCommand({ Bucket: bucketName, Key: 'sized.bin' }))
          ).rejects.toThrow()
        })
      })

      it('rejects a presigned POST replayed against a different bucket', async () => {
        const signedBucket = await createBucket(client)
        const otherBucket = await createBucket(client)

        const signedURL = await createPresignedPost(client, {
          Bucket: signedBucket,
          Key: 'allowed/test.jpg',
          Expires: 5000,
          Fields: { 'Content-Type': 'image/jpg' },
        })

        const formData = new FormData()
        Object.keys(signedURL.fields).forEach((key) => {
          formData.set(key, signedURL.fields[key])
        })
        formData.set('file', new Blob([Buffer.alloc(16)]), 'object.txt')

        const otherUrl = signedURL.url.replace(`/s3/${signedBucket}`, `/s3/${otherBucket}`)
        const resp = await fetch(otherUrl, { method: 'POST', body: formData })

        expect(resp.status).toBe(403)
      })

      it('rejects a presigned POST whose key violates the signed starts-with condition', async () => {
        const bucketName = await createBucket(client)

        const signedURL = await createPresignedPost(client, {
          Bucket: bucketName,
          // ${filename} produces a `["starts-with", "$key", "allowed/"]` condition
          // biome-ignore lint/suspicious/noTemplateCurlyInString: AWS POST uses a literal ${filename} token
          Key: 'allowed/${filename}',
          Expires: 5000,
          Fields: { 'Content-Type': 'image/jpg' },
        })

        const formData = new FormData()
        Object.keys(signedURL.fields).forEach((key) => {
          formData.set(key, signedURL.fields[key])
        })
        formData.set('key', 'outside/object.txt')
        formData.set('file', new Blob([Buffer.alloc(16)]), 'object.txt')

        const resp = await fetch(signedURL.url, { method: 'POST', body: formData })

        expect(resp.status).toBe(403)
      })

      it('rejects a presigned POST whose Content-Type list violates the signed starts-with condition', async () => {
        const bucketName = await createBucket(client)

        const signedURL = await createPresignedPost(client, {
          Bucket: bucketName,
          Key: 'test.jpg',
          Expires: 5000,
          Conditions: [['starts-with', '$Content-Type', 'image/']],
        })

        const formData = new FormData()
        Object.keys(signedURL.fields).forEach((key) => {
          formData.set(key, signedURL.fields[key])
        })
        formData.set('Content-Type', 'image/png,text/html')
        formData.set('file', new Blob([Buffer.alloc(16)]), 'test.jpg')

        const resp = await fetch(signedURL.url, { method: 'POST', body: formData })

        expect(resp.status).toBe(403)
        expect(await resp.text()).toContain('does not start with')
      })

      it('rejects an expired policy even with a far-future X-Amz-Date', async () => {
        const bucketName = await createBucket(client)

        const { policyB64, signature, credential } = signPostPolicy({
          expiration: '2020-01-01T00:00:00Z',
          conditions: [{ bucket: bucketName }, ['starts-with', '$key', '']],
        })

        const formData = new FormData()
        formData.set('key', 'some-key.txt')
        formData.set('Policy', policyB64)
        formData.set('X-Amz-Algorithm', 'AWS4-HMAC-SHA256')
        formData.set('X-Amz-Credential', credential)
        formData.set('X-Amz-Date', '99991231T235959Z')
        formData.set('X-Amz-Signature', signature)
        formData.set('file', new Blob([Buffer.alloc(16)]), 'some-key.txt')

        const resp = await fetch(`${baseUrl}/s3/${bucketName}`, { method: 'POST', body: formData })

        expect(resp.status).toBe(400)
      })

      it('rejects a key that violates an "eq" key condition', async () => {
        const bucketName = await createBucket(client)

        const { policyB64, signature, credential } = signPostPolicy({
          expiration: '2099-01-01T00:00:00Z',
          conditions: [{ bucket: bucketName }, ['eq', '$key', 'allowed/exact.txt']],
        })

        const formData = new FormData()
        formData.set('key', 'allowed/different.txt')
        formData.set('Policy', policyB64)
        formData.set('X-Amz-Algorithm', 'AWS4-HMAC-SHA256')
        formData.set('X-Amz-Credential', credential)
        formData.set('X-Amz-Date', '99991231T235959Z')
        formData.set('X-Amz-Signature', signature)
        formData.set('file', new Blob([Buffer.alloc(16)]), 'object.txt')

        const resp = await fetch(`${baseUrl}/s3/${bucketName}`, { method: 'POST', body: formData })

        expect(resp.status).toBe(403)
      })

      it('accepts (and ignores) a field Storage does not act on, when covered by a condition', async () => {
        const bucketName = await createBucket(client)

        // `acl` is a valid AWS POST field that Storage does not implement. As long
        // as it is covered by a condition (the SDK adds one for every Fields
        // entry) it is accepted and ignored, matching AWS-compatible behavior.
        const signedURL = await createPresignedPost(client, {
          Bucket: bucketName,
          Key: 'test.jpg',
          Expires: 5000,
          Fields: { acl: 'public-read' },
        })

        const formData = new FormData()
        Object.keys(signedURL.fields).forEach((key) => {
          formData.set(key, signedURL.fields[key])
        })
        formData.set('file', new Blob([Buffer.alloc(16)]), 'test.jpg')

        const resp = await fetch(signedURL.url, { method: 'POST', body: formData })

        expect(resp.status).toBe(200)
      })

      it('rejects a submitted field that is not covered by any policy condition', async () => {
        const bucketName = await createBucket(client)

        const signedURL = await createPresignedPost(client, {
          Bucket: bucketName,
          Key: 'test.jpg',
          Expires: 5000,
          Fields: { 'Content-Type': 'image/jpg' },
        })

        const formData = new FormData()
        Object.keys(signedURL.fields).forEach((key) => {
          formData.set(key, signedURL.fields[key])
        })
        // An extra field the signed policy never constrained with a condition.
        formData.set('x-amz-meta-extra', 'value')
        formData.set('file', new Blob([Buffer.alloc(16)]), 'test.jpg')

        const resp = await fetch(signedURL.url, { method: 'POST', body: formData })

        expect(resp.status).toBe(403)
      })

      it('allows an uncovered x-ignore- field (AWS exemption)', async () => {
        // AWS exempts fields prefixed with `x-ignore-` from the "every field must
        // be covered by a condition" rule, so an uncovered x-ignore-* field must
        // NOT be rejected (contrast the x-amz-meta-* case above).
        const bucketName = await createBucket(client)

        const signedURL = await createPresignedPost(client, {
          Bucket: bucketName,
          Key: 'test.jpg',
          Expires: 5000,
          Fields: { 'Content-Type': 'image/jpg' },
        })

        const formData = new FormData()
        Object.keys(signedURL.fields).forEach((key) => {
          formData.set(key, signedURL.fields[key])
        })
        formData.set('x-ignore-toolkit-field', 'anything')
        formData.set('file', new Blob([Buffer.alloc(16)]), 'test.jpg')

        const resp = await fetch(signedURL.url, { method: 'POST', body: formData })

        expect(resp.status).toBe(200)
      })
    })

    describe('MultiPartUpload', () => {
      it('creates a multi part upload', async () => {
        const bucketName = await createBucket(client)
        const createMultiPartUpload = new CreateMultipartUploadCommand({
          Bucket: bucketName,
          Key: 'test-1.jpg',
          ContentType: 'image/jpg',
          CacheControl: 'max-age=2000',
        })
        const resp = await client.send(createMultiPartUpload)
        expect(resp.UploadId).toBeTruthy()
      })

      it('creates a multi part upload for a json object', async () => {
        const bucketName = await createBucket(client)
        const createMultiPartUpload = new CreateMultipartUploadCommand({
          Bucket: bucketName,
          Key: 'test-1.json',
          ContentType: 'application/json',
          CacheControl: 'max-age=2000',
        })

        const resp = await client.send(createMultiPartUpload)
        expect(resp.UploadId).toBeTruthy()
      })

      it('creates a multi part upload for an empty json request with a percent-encoded uploads query name', async () => {
        const bucketName = await createBucket(client)
        const key = 'test-encoded-uploads-query.json'
        let uploadId: string | undefined

        try {
          const signedRequest = await createSignedS3Request({
            baseUrl,
            method: 'POST',
            path: `/s3/${bucketName}/${key}`,
            query: {
              uploads: '',
            },
            headers: {
              'content-type': 'application/json',
            },
            body: '',
            includeContentLength: true,
          })
          signedRequest.requestUrl.search = '?up%6Co%61ds'

          const response = await undiciFetch(signedRequest.requestUrl, {
            method: 'POST',
            headers: signedRequest.headers,
            body: '',
          })
          const data = await response.text()

          expect(response.status).toBe(200)
          expect(data).toContain('<InitiateMultipartUploadResult')
          uploadId = data.match(/<UploadId>([^<]+)<\/UploadId>/)?.[1]
          expect(uploadId).toBeTruthy()
        } finally {
          if (uploadId) {
            await client.send(
              new AbortMultipartUploadCommand({
                Bucket: bucketName,
                Key: key,
                UploadId: uploadId,
              })
            )
          }
        }
      })

      it('rejects an empty json multipart post without uploads query', async () => {
        const bucketName = await createBucket(client)
        const key = 'test-empty-json-without-uploads-query.json'

        const emptyJsonPostResp = await sendSignedS3Request({
          baseUrl,
          method: 'POST',
          path: `/s3/${bucketName}/${key}`,
          headers: {
            'content-type': 'application/json',
          },
        })

        expect(emptyJsonPostResp.status).toBe(400)
        expect(emptyJsonPostResp.data).toContain(
          '<Error xmlns="http://s3.amazonaws.com/doc/2006-03-01/">'
        )
        expect(emptyJsonPostResp.data).toContain('<Code>InvalidRequest</Code>')
        expect(emptyJsonPostResp.data).toContain(
          "<Message>Body cannot be empty when content-type is set to 'application/json'</Message>"
        )
      })

      it('upload a part', async () => {
        const bucketName = await createBucket(client)
        const createMultiPartUpload = new CreateMultipartUploadCommand({
          Bucket: bucketName,
          Key: 'test-1.jpg',
          ContentType: 'image/jpg',
          CacheControl: 'max-age=2000',
        })
        const resp = await client.send(createMultiPartUpload)
        expect(resp.UploadId).toBeTruthy()

        const data = Buffer.alloc(1024 * 5)

        const uploadPart = new UploadPartCommand({
          Bucket: bucketName,
          Key: 'test-1.jpg',
          ContentLength: data.length,
          UploadId: resp.UploadId,
          Body: data,
          PartNumber: 1,
        })

        const partResp = await client.send(uploadPart)
        expect(partResp.ETag).toBeTruthy()
      })

      it('completes a multipart upload', async () => {
        const webhookSpy = vi
          .spyOn(ObjectCreatedPostEvent, 'sendWebhook')
          .mockResolvedValue(undefined)

        try {
          const bucketName = await createBucket(client)
          const createMultiPartUpload = new CreateMultipartUploadCommand({
            Bucket: bucketName,
            Key: 'test-1.jpg',
            ContentType: 'image/jpg',
            CacheControl: 'max-age=2000',
          })
          const resp = await client.send(createMultiPartUpload)
          expect(resp.UploadId).toBeTruthy()

          const data = Buffer.alloc(1024 * 5)
          const uploadPart = new UploadPartCommand({
            Bucket: bucketName,
            Key: 'test-1.jpg',
            ContentLength: data.length,
            UploadId: resp.UploadId,
            Body: data,
            PartNumber: 1,
          })

          const part1 = await client.send(uploadPart)

          const completeMultiPartUpload = new CompleteMultipartUploadCommand({
            Bucket: bucketName,
            Key: 'test-1.jpg',
            UploadId: resp.UploadId,
            MultipartUpload: {
              Parts: [
                {
                  PartNumber: 1,
                  ETag: part1.ETag,
                },
              ],
            },
          })

          const completeResp = await client.send(completeMultiPartUpload)
          expect(completeResp.$metadata.httpStatusCode).toBe(200)
          expect(completeResp.Key).toEqual('test-1.jpg')

          // Verify webhook was called with correct data
          expect(webhookSpy).toHaveBeenCalledTimes(1)
          const webhookCall = webhookSpy.mock.calls[0][0] as ObjectCreatedEvent
          expect(webhookCall).toMatchObject({
            tenant: expect.objectContaining({ ref: tenantId }),
            name: 'test-1.jpg',
            version: expect.any(String),
            bucketId: bucketName,
            reqId: expect.any(String),
            metadata: expect.any(Object),
            uploadType: 's3',
          })
          expect(webhookCall.metadata).toBeDefined()
          expect(webhookCall.metadata).toHaveProperty('size')
        } finally {
          webhookSpy.mockRestore()
        }
      })

      it('does not complete multipart upload on malformed xml body', async () => {
        const bucketName = await createBucket(client)
        const key = 'test-explicit-parts.xml'
        const createMultiPartUpload = new CreateMultipartUploadCommand({
          Bucket: bucketName,
          Key: key,
          ContentType: 'application/xml',
          CacheControl: 'max-age=2000',
        })
        const resp = await client.send(createMultiPartUpload)
        expect(resp.UploadId).toBeTruthy()

        const part1Body = Buffer.alloc(1024 * 5, 'a')

        const part1 = await client.send(
          new UploadPartCommand({
            Bucket: bucketName,
            Key: key,
            ContentLength: part1Body.length,
            UploadId: resp.UploadId,
            Body: part1Body,
            PartNumber: 1,
          })
        )

        const malformedCompleteResp = await sendSignedS3Request({
          baseUrl,
          method: 'POST',
          path: `/s3/${bucketName}/${key}`,
          query: {
            uploadId: resp.UploadId!,
          },
          headers: {
            'Content-Type': 'application/xml',
          },
          body: '<CompleteMultipartUpload><Part></CompleteMultipartUpload>',
        })

        expect(malformedCompleteResp.status).toBe(400)
        expect(malformedCompleteResp.data).toContain(
          '<Error xmlns="http://s3.amazonaws.com/doc/2006-03-01/">'
        )
        expect(malformedCompleteResp.data).toContain('<Code>MalformedXML</Code>')
        expect(malformedCompleteResp.data).toContain('<Message>Invalid XML payload:')

        await expectMultipartUploadToRemainPending(client, {
          bucket: bucketName,
          key,
          uploadId: resp.UploadId!,
          partETag: part1.ETag!,
        })

        const completeResp = await client.send(
          new CompleteMultipartUploadCommand({
            Bucket: bucketName,
            Key: key,
            UploadId: resp.UploadId,
            MultipartUpload: {
              Parts: [
                {
                  PartNumber: 1,
                  ETag: part1.ETag,
                },
              ],
            },
          })
        )

        expect(completeResp.$metadata.httpStatusCode).toBe(200)

        const getResp = await client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
          })
        )

        const data = await getResp.Body?.transformToByteArray()
        expect(Buffer.from(data || [])).toEqual(part1Body)
        expect(part1.ETag).toBeTruthy()
      })

      it('rejects invalid multipart part numbers through route validation', async () => {
        const bucketName = await createBucket(client)
        const key = 'test-non-decimal-part-number.bin'
        const createResp = await client.send(
          new CreateMultipartUploadCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: 'application/octet-stream',
          })
        )
        expect(createResp.UploadId).toBeTruthy()
        onTestFinished(async () => {
          await client.send(
            new AbortMultipartUploadCommand({
              Bucket: bucketName,
              Key: key,
              UploadId: createResp.UploadId,
            })
          )
        })

        const partBody = Buffer.alloc(1024 * 5, 'p')
        const part = await client.send(
          new UploadPartCommand({
            Bucket: bucketName,
            Key: key,
            ContentLength: partBody.length,
            UploadId: createResp.UploadId,
            Body: partBody,
            PartNumber: 1,
          })
        )

        const malformedPartNumbers = [
          '<PartNumber>   </PartNumber>',
          '<PartNumber/>',
          '<PartNumber>Infinity</PartNumber>',
          `<PartNumber>${'9'.repeat(400)}</PartNumber>`,
        ]

        for (const partNumber of malformedPartNumbers) {
          const completeResp = await sendSignedS3Request({
            baseUrl,
            method: 'POST',
            path: `/s3/${bucketName}/${key}`,
            query: {
              uploadId: createResp.UploadId!,
            },
            headers: {
              'Content-Type': 'application/xml',
            },
            body: `<CompleteMultipartUpload><Part>${partNumber}<ETag>${part.ETag}</ETag></Part></CompleteMultipartUpload>`,
          })

          expect(completeResp.status).toBe(400)
          expect(completeResp.data).toContain('<Code>InvalidRequest</Code>')
          expect(completeResp.data).toContain('PartNumber')
        }

        await expectMultipartUploadToRemainPending(client, {
          bucket: bucketName,
          key,
          uploadId: createResp.UploadId!,
          partETag: part.ETag!,
        })
      })

      it('does not complete multipart upload on malformed json body', async () => {
        const bucketName = await createBucket(client)
        const key = 'test-invalid-json-complete.bin'
        const createMultiPartUpload = new CreateMultipartUploadCommand({
          Bucket: bucketName,
          Key: key,
          ContentType: 'application/octet-stream',
          CacheControl: 'max-age=2000',
        })
        const resp = await client.send(createMultiPartUpload)
        expect(resp.UploadId).toBeTruthy()

        const part1Body = Buffer.alloc(1024 * 5, 'b')

        const part1 = await client.send(
          new UploadPartCommand({
            Bucket: bucketName,
            Key: key,
            ContentLength: part1Body.length,
            UploadId: resp.UploadId,
            Body: part1Body,
            PartNumber: 1,
          })
        )

        const malformedCompleteResp = await sendSignedS3Request({
          baseUrl,
          method: 'POST',
          path: `/s3/${bucketName}/${key}`,
          query: {
            uploadId: resp.UploadId!,
          },
          headers: {
            'content-type': 'application/json',
          },
          body: '{"Parts":',
        })

        expect(malformedCompleteResp.status).toBe(400)
        expect(malformedCompleteResp.data).toContain(
          '<Error xmlns="http://s3.amazonaws.com/doc/2006-03-01/">'
        )
        expect(malformedCompleteResp.data).toContain('<Code>InvalidRequest</Code>')
        expect(malformedCompleteResp.data).toContain(
          "<Message>Body is not valid JSON but content-type is set to 'application/json'</Message>"
        )

        await expectMultipartUploadToRemainPending(client, {
          bucket: bucketName,
          key,
          uploadId: resp.UploadId!,
          partETag: part1.ETag!,
        })

        const completeResp = await client.send(
          new CompleteMultipartUploadCommand({
            Bucket: bucketName,
            Key: key,
            UploadId: resp.UploadId,
            MultipartUpload: {
              Parts: [
                {
                  PartNumber: 1,
                  ETag: part1.ETag,
                },
              ],
            },
          })
        )

        expect(completeResp.$metadata.httpStatusCode).toBe(200)

        const getResp = await client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
          })
        )

        const data = await getResp.Body?.transformToByteArray()
        expect(Buffer.from(data || [])).toEqual(part1Body)
        expect(part1.ETag).toBeTruthy()
      })

      it('does not complete multipart upload on empty json body', async () => {
        const bucketName = await createBucket(client)
        const key = 'test-empty-json-complete.bin'
        const createMultiPartUpload = new CreateMultipartUploadCommand({
          Bucket: bucketName,
          Key: key,
          ContentType: 'application/octet-stream',
          CacheControl: 'max-age=2000',
        })
        const resp = await client.send(createMultiPartUpload)
        expect(resp.UploadId).toBeTruthy()

        const part1Body = Buffer.alloc(1024 * 5, 'c')

        const part1 = await client.send(
          new UploadPartCommand({
            Bucket: bucketName,
            Key: key,
            ContentLength: part1Body.length,
            UploadId: resp.UploadId,
            Body: part1Body,
            PartNumber: 1,
          })
        )

        const emptyJsonCompleteResp = await sendSignedS3Request({
          baseUrl,
          method: 'POST',
          path: `/s3/${bucketName}/${key}`,
          query: {
            uploadId: resp.UploadId!,
          },
          headers: {
            'content-type': 'application/json',
          },
        })

        expect(emptyJsonCompleteResp.status).toBe(400)
        expect(emptyJsonCompleteResp.data).toContain(
          '<Error xmlns="http://s3.amazonaws.com/doc/2006-03-01/">'
        )
        expect(emptyJsonCompleteResp.data).toContain('<Code>InvalidRequest</Code>')
        expect(emptyJsonCompleteResp.data).toContain(
          "<Message>Body cannot be empty when content-type is set to 'application/json'</Message>"
        )

        await expectMultipartUploadToRemainPending(client, {
          bucket: bucketName,
          key,
          uploadId: resp.UploadId!,
          partETag: part1.ETag!,
        })

        const completeResp = await client.send(
          new CompleteMultipartUploadCommand({
            Bucket: bucketName,
            Key: key,
            UploadId: resp.UploadId,
            MultipartUpload: {
              Parts: [
                {
                  PartNumber: 1,
                  ETag: part1.ETag,
                },
              ],
            },
          })
        )

        expect(completeResp.$metadata.httpStatusCode).toBe(200)

        const getResp = await client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
          })
        )

        const data = await getResp.Body?.transformToByteArray()
        expect(Buffer.from(data || [])).toEqual(part1Body)
        expect(part1.ETag).toBeTruthy()
      })

      it('aborts a multipart upload', async () => {
        const bucketName = await createBucket(client)
        const createMultiPartUpload = new CreateMultipartUploadCommand({
          Bucket: bucketName,
          Key: 'test-1.jpg',
          ContentType: 'image/jpg',
          CacheControl: 'max-age=2000',
        })
        const resp = await client.send(createMultiPartUpload)
        expect(resp.UploadId).toBeTruthy()

        const data = Buffer.alloc(1024 * 5)
        const uploadPart = new UploadPartCommand({
          Bucket: bucketName,
          Key: 'test-1.jpg',
          ContentLength: data.length,
          UploadId: resp.UploadId,
          Body: data,
          PartNumber: 1,
        })

        await client.send(uploadPart)

        const completeMultiPartUpload = new AbortMultipartUploadCommand({
          Bucket: bucketName,
          Key: 'test-1.jpg',
          UploadId: resp.UploadId,
        })

        const completeResp = await client.send(completeMultiPartUpload)
        expect(completeResp.$metadata.httpStatusCode).toBe(200)
      })

      it('upload a file using putObject', async () => {
        const webhookSpy = vi
          .spyOn(ObjectCreatedPostEvent, 'sendWebhook')
          .mockResolvedValue(undefined)

        try {
          const bucketName = await createBucket(client)

          const putObject = new PutObjectCommand({
            Bucket: bucketName,
            Key: 'test-1-put-object.jpg',
            Body: Buffer.alloc(1024 * 12),
          })

          const resp = await client.send(putObject)
          expect(resp.$metadata.httpStatusCode).toEqual(200)

          // Verify webhook was called with correct data
          expect(webhookSpy).toHaveBeenCalledTimes(1)
          const webhookCall = webhookSpy.mock.calls[0][0] as ObjectCreatedEvent
          expect(webhookCall).toMatchObject({
            tenant: expect.objectContaining({ ref: tenantId }),
            name: 'test-1-put-object.jpg',
            version: expect.any(String),
            bucketId: bucketName,
            reqId: expect.any(String),
            metadata: expect.any(Object),
            uploadType: 's3',
          })
          expect(webhookCall.metadata).toBeDefined()
          expect(webhookCall.metadata).toHaveProperty('size')
        } finally {
          webhookSpy.mockRestore()
        }
      })

      it('upload a broken JSON body using putObject ', async () => {
        const bucketName = await createBucket(client)

        const putObject = new PutObjectCommand({
          Bucket: bucketName,
          Key: 'test-1-put-object.jpg',
          ContentType: 'application/json',
          Body: '{"hello": "world"', // (no-closing tag)
        })

        const resp = await client.send(putObject)
        expect(resp.$metadata.httpStatusCode).toEqual(200)
      })

      it('upload a file using putObject with custom metadata', async () => {
        const bucketName = await createBucket(client)

        const putObject = new PutObjectCommand({
          Bucket: bucketName,
          Key: 'test-1-put-object.jpg',
          Body: Buffer.alloc(1024 * 12),
          Metadata: {
            nice: '1111',
            test2: 'test3',
          },
        })

        const resp = await client.send(putObject)
        expect(resp.$metadata.httpStatusCode).toEqual(200)

        const getObject = new HeadObjectCommand({
          Bucket: bucketName,
          Key: 'test-1-put-object.jpg',
        })

        const headResp = await client.send(getObject)
        expect(headResp.Metadata?.nice).toEqual('1111')
        expect(headResp.Metadata?.test2).toEqual('test3')
      })

      it('it will not allow to upload a file using putObject when exceeding maxFileSize', async () => {
        const bucketName = await createBucket(client)

        mergeConfig({
          uploadFileSizeLimit: 1024 * 10,
        })

        const putObject = new PutObjectCommand({
          Bucket: bucketName,
          Key: 'test-1-put-object.jpg',
          Body: Buffer.alloc(1024 * 12),
        })

        try {
          await client.send(putObject)
          throw new Error('Should not reach here')
        } catch (e) {
          expect((e as Error).message).not.toEqual('Should not reach here')
          expect((e as S3ServiceException).$metadata.httpStatusCode).toEqual(413)
          expect((e as S3ServiceException).message).toEqual(
            'The object exceeded the maximum allowed size'
          )
          expect((e as S3ServiceException).name).toEqual('EntityTooLarge')
        }
      })

      it('accepts aws-chunked putObject bodies when decoded size is within the limit', async () => {
        const bucketName = await createBucket(client)
        const key = 'test-aws-chunked-put-object.jpg'
        const payload = Buffer.alloc(123, 1)

        mergeConfig({
          uploadFileSizeLimit: 150,
        })

        const response = await sendAwsChunkedRequest({
          baseUrl,
          path: `/s3/${bucketName}/${key}`,
          payload,
        })

        expect(response.status).toBe(200)

        const headObject = await client.send(
          new HeadObjectCommand({
            Bucket: bucketName,
            Key: key,
          })
        )

        expect(headObject.ContentLength).toBe(payload.length)
      })

      it('rejects trailer-mode aws-chunked putObject bodies without a trailer block', async () => {
        const bucketName = await createBucket(client)
        const key = 'test-aws-chunked-put-object-empty-trailer.jpg'
        const payload = Buffer.alloc(123, 1)

        mergeConfig({
          uploadFileSizeLimit: 150,
        })

        const response = await sendAwsChunkedTrailerModeWithoutTrailerRequest({
          baseUrl,
          path: `/s3/${bucketName}/${key}`,
          payload,
        })

        expect(response.status).toBeGreaterThanOrEqual(400)

        try {
          await client.send(
            new HeadObjectCommand({
              Bucket: bucketName,
              Key: key,
            })
          )
          throw new Error('Should not reach here')
        } catch (e) {
          expect((e as Error).message).not.toEqual('Should not reach here')
          expect((e as S3ServiceException).$metadata.httpStatusCode).toEqual(404)
        }
      })

      it('will not allow uploading a file that exceeded the maxFileSize', async () => {
        const bucketName = await createBucket(client)

        mergeConfig({
          uploadFileSizeLimit: 1024 * 10,
        })

        const uploader = new Upload({
          client,
          leavePartsOnError: true,

          params: {
            Bucket: bucketName,
            Key: 'test-1.jpg',
            ContentType: 'image/jpg',
            Body: Buffer.alloc(1024 * 12),
          },
        })

        try {
          await uploader.done()
          throw new Error('Should not reach here')
        } catch (e) {
          expect((e as Error).message).not.toEqual('Should not reach here')
          expect((e as S3ServiceException).$metadata.httpStatusCode).toEqual(413)
          expect((e as S3ServiceException).message).toEqual(
            'The object exceeded the maximum allowed size'
          )
          expect((e as S3ServiceException).name).toEqual('EntityTooLarge')
        }
      })

      it('will not allow uploading a part that exceeded the maxFileSize', async () => {
        const bucketName = await createBucket(client, 'try-test-1')

        mergeConfig({
          uploadFileSizeLimit: 1024 * 10,
        })

        const createMultiPartUpload = new CreateMultipartUploadCommand({
          Bucket: bucketName,
          Key: 'test-1.jpg',
          ContentType: 'image/jpg',
          CacheControl: 'max-age=2000',
        })
        const resp = await client.send(createMultiPartUpload)
        expect(resp.UploadId).toBeTruthy()

        const readable = Readable.from(
          (async function* () {
            const buffer = Buffer.alloc(1024 * 12)
            const chunkSize = 1024 * 3
            for (let i = 0; i < buffer.length; i += chunkSize) {
              await sleep(500)
              yield buffer.subarray(i, i + chunkSize)
            }
          })(),
          { objectMode: false }
        )

        const uploadPart = new UploadPartCommand({
          Bucket: bucketName,
          Key: 'test-1.jpg',
          UploadId: resp.UploadId,
          Body: readable,
          PartNumber: 1,
          ContentLength: 1024 * 12,
        })

        try {
          await client.send(uploadPart)
          throw new Error('Should not reach here')
        } catch (e) {
          expect((e as Error).message).not.toEqual('Should not reach here')
          expect((e as S3ServiceException).$metadata.httpStatusCode).toEqual(413)
          expect((e as S3ServiceException).message).toEqual(
            'The object exceeded the maximum allowed size'
          )
          expect((e as S3ServiceException).name).toEqual('EntityTooLarge')
        }
      })

      it('accepts aws-chunked uploadPart bodies when decoded size is within the limit', async () => {
        const bucketName = await createBucket(client, 'chunked-part')
        const payload = Buffer.alloc(123, 2)

        mergeConfig({
          uploadFileSizeLimit: 150,
        })

        const multipart = await client.send(
          new CreateMultipartUploadCommand({
            Bucket: bucketName,
            Key: 'test-aws-chunked-upload-part.jpg',
            ContentType: 'image/jpg',
            CacheControl: 'max-age=2000',
          })
        )

        const response = await sendAwsChunkedRequest({
          baseUrl,
          path: `/s3/${bucketName}/test-aws-chunked-upload-part.jpg`,
          payload,
          query: {
            uploadId: multipart.UploadId!,
            partNumber: '1',
          },
        })

        expect(response.status).toBe(200)

        const listedParts = await client.send(
          new ListPartsCommand({
            Bucket: bucketName,
            Key: 'test-aws-chunked-upload-part.jpg',
            UploadId: multipart.UploadId,
          })
        )

        expect(listedParts.Parts?.map((part) => part.PartNumber)).toEqual([1])
      })

      it('upload a file using multipart upload', async () => {
        const webhookSpy = vi
          .spyOn(ObjectCreatedPostEvent, 'sendWebhook')
          .mockResolvedValue(undefined)

        try {
          const bucketName = await createBucket(client)

          const uploader = new Upload({
            client,
            params: {
              Bucket: bucketName,
              Key: 'test-1.jpg',
              ContentType: 'image/jpg',
              Body: Buffer.alloc(1024 * 12),
            },
          })

          const resp = await uploader.done()

          expect(resp.$metadata).toBeTruthy()

          // Verify webhook was called with correct data
          expect(webhookSpy).toHaveBeenCalledTimes(1)
          const webhookCall = webhookSpy.mock.calls[0][0] as ObjectCreatedEvent
          expect(webhookCall).toMatchObject({
            tenant: expect.objectContaining({ ref: tenantId }),
            name: 'test-1.jpg',
            version: expect.any(String),
            bucketId: bucketName,
            reqId: expect.any(String),
            metadata: expect.any(Object),
            uploadType: 's3',
          })
          expect(webhookCall.metadata).toBeDefined()
          expect(webhookCall.metadata).toHaveProperty('size')
        } finally {
          webhookSpy.mockRestore()
        }
      })

      it('does not mutate in_progress_size when canUpload (RLS) fails', async () => {
        /*
        Calling shouldAllowPartUpload mutates the in_progress_size so we have to ensure
        canUpload is called beforehand or else it can cause issues for valid uploads.

        This test sets the fileSizeLimit to 10kb and each part at 5kb. It simulates
        first request successful, second failed, third passes. If the in_progress_size
        was mutated on the second request it would be at 10kb causing the third to fail.
        */
        const bucketName = await createBucket(client)
        const key = 'rls-ordering-test.jpg'
        const partSize = 1024 * 5

        mergeConfig({ uploadFileSizeLimit: partSize * 2 })

        const createResp = await client.send(
          new CreateMultipartUploadCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: 'image/jpg',
          })
        )
        expect(createResp.UploadId).toBeTruthy()
        const uploadId = createResp.UploadId

        const part1Resp = await client.send(
          new UploadPartCommand({
            Bucket: bucketName,
            Key: key,
            UploadId: uploadId,
            PartNumber: 1,
            Body: Buffer.alloc(partSize),
            ContentLength: partSize,
          })
        )
        expect(part1Resp.ETag).toBeTruthy()

        const canUploadSpy = vi
          .spyOn(Uploader.prototype, 'canUpload')
          .mockRejectedValueOnce(ERRORS.AccessDenied('upload'))

        try {
          await client.send(
            new UploadPartCommand({
              Bucket: bucketName,
              Key: key,
              UploadId: uploadId,
              PartNumber: 2,
              Body: Buffer.alloc(partSize),
              ContentLength: partSize,
            })
          )
          throw new Error('Should not reach here')
        } catch (e) {
          expect((e as Error).message).not.toEqual('Should not reach here')
        } finally {
          canUploadSpy.mockRestore()
        }

        const part2Resp = await client.send(
          new UploadPartCommand({
            Bucket: bucketName,
            Key: key,
            UploadId: uploadId,
            PartNumber: 2,
            Body: Buffer.alloc(partSize),
            ContentLength: partSize,
          })
        )
        expect(part2Resp.ETag).toBeTruthy()
      })
    })

    describe('GetObject', () => {
      it('can get an existing object', async () => {
        const bucketName = await createBucket(client)
        const key = 'test-1.jpg'
        await uploadFile(client, bucketName, key, 1)

        const getObject = new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        })

        const resp = await client.send(getObject)
        const data = await resp.Body?.transformToByteArray()
        expect(data).toBeTruthy()
        expect(resp.ETag).toBeTruthy()
      })

      it('will return an error when object does not exist', async () => {
        const bucketName = await createBucket(client)
        const key = 'test-1.jpg'

        const getObject = new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        })

        try {
          await client.send(getObject)
        } catch (e) {
          expect((e as S3ServiceException).$metadata.httpStatusCode).toEqual(404)
          expect((e as S3ServiceException).message).toEqual('Object not found')
          expect((e as S3ServiceException).name).toEqual('NoSuchKey')
        }
      })

      it('can get an object using range requests', async () => {
        const bucketName = await createBucket(client)
        const key = 'test-1.jpg'
        await uploadFile(client, bucketName, key, 1)

        const getObject = new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
          Range: 'bytes=0-100',
        })

        const resp = await client.send(getObject)
        const data = await resp.Body?.transformToByteArray()
        expect(resp.$metadata.httpStatusCode).toEqual(206)
        expect(data).toBeTruthy()
        expect(resp.ETag).toBeTruthy()
      })

      it('rejects a read with 412 when If-Match does not match the current ETag', async () => {
        const bucketName = await createBucket(client)
        const key = 'test-1.jpg'
        await uploadFile(client, bucketName, key, 1)

        const head = await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }))

        const matching = await client.send(
          new GetObjectCommand({ Bucket: bucketName, Key: key, IfMatch: head.ETag })
        )
        await matching.Body?.transformToByteArray()
        expect(matching.$metadata.httpStatusCode).toEqual(200)

        await expect(
          client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: key,
              IfMatch: '"not-the-current-etag"',
              Range: 'bytes=0-100',
            })
          )
        ).rejects.toMatchObject({ name: 'PreconditionFailed', $metadata: { httpStatusCode: 412 } })
      })

      it('returns 304 with the ETag and no error document when If-None-Match matches', async () => {
        const bucketName = await createBucket(client)
        const key = 'test-1.jpg'
        await uploadFile(client, bucketName, key, 1)

        const head = await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }))

        const error = (await client
          .send(new GetObjectCommand({ Bucket: bucketName, Key: key, IfNoneMatch: head.ETag }))
          .catch((e) => e)) as S3ServiceException

        expect(error.$metadata.httpStatusCode).toBe(304)
        expect(error.$response?.headers.etag).toBe(head.ETag)
        expect(error.$response?.headers['content-type'] ?? '').not.toMatch(/xml/)
      })

      it('rejects a read with 412 when the object changed after If-Unmodified-Since', async () => {
        const bucketName = await createBucket(client)
        const key = 'test-1.jpg'
        await uploadFile(client, bucketName, key, 1)

        const head = await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }))
        const lastModified = head.LastModified as Date

        const unchanged = await client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
            IfUnmodifiedSince: new Date(lastModified.getTime() + 60_000),
          })
        )
        await unchanged.Body?.transformToByteArray()
        expect(unchanged.$metadata.httpStatusCode).toEqual(200)

        await expect(
          client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: key,
              IfUnmodifiedSince: new Date(lastModified.getTime() - 60_000),
            })
          )
        ).rejects.toMatchObject({ name: 'PreconditionFailed', $metadata: { httpStatusCode: 412 } })
      })
    })

    describe('DeleteObjectCommand', () => {
      it('can delete an existing object', async () => {
        const webhookSpy = vi.spyOn(ObjectRemoved, 'sendWebhook').mockResolvedValue(undefined)

        try {
          const bucketName = await createBucket(client)
          const key = 'test-1.jpg'
          await uploadFile(client, bucketName, key, 1)

          const deleteObject = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
          })

          const deleteResp = await client.send(deleteObject)
          expect(deleteResp.$metadata.httpStatusCode).toEqual(204)

          const getObject = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
          })

          try {
            await client.send(getObject)
          } catch (e) {
            expect((e as S3ServiceException).$metadata.httpStatusCode).toEqual(404)
          }

          // Verify webhook was called with correct data
          expect(webhookSpy).toHaveBeenCalledTimes(1)
          const webhookCall = webhookSpy.mock.calls[0][0] as Omit<ObjectRemovedEvent, '$version'>
          expect(webhookCall).toMatchObject({
            tenant: expect.objectContaining({ ref: tenantId }),
            name: key,
            version: expect.any(String),
            bucketId: bucketName,
            reqId: expect.any(String),
            metadata: expect.any(Object),
          })
          expect(webhookCall.metadata).toBeDefined()
          expect(webhookCall.metadata).toHaveProperty('size')
        } finally {
          webhookSpy.mockRestore()
        }
      })

      it('can delete non-existing object', async () => {
        const bucketName = await createBucket(client)

        const deleteObject = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: crypto.randomUUID() + '.jpg',
        })

        const deleteResp = await client.send(deleteObject)
        expect(deleteResp.$metadata.httpStatusCode).toEqual(204)
      })

      it('does not treat a missing bucket as an idempotent object delete', async () => {
        const deleteObject = new DeleteObjectCommand({
          Bucket: `missing-bucket-${randomUUID()}`,
          Key: crypto.randomUUID() + '.jpg',
        })

        try {
          await client.send(deleteObject)
          throw new Error('Should not reach here')
        } catch (e) {
          expect((e as Error).message).not.toBe('Should not reach here')
          expect((e as S3ServiceException).$metadata.httpStatusCode).toEqual(404)
          expect((e as S3ServiceException).name).toEqual('NoSuchBucket')
        }
      })
    })

    describe('DeleteObjectsCommand', () => {
      it('can delete a single object', async () => {
        const webhookSpy = vi.spyOn(ObjectRemoved, 'sendWebhook').mockResolvedValue(undefined)

        try {
          const bucketName = await createBucket(client)
          await Promise.all([uploadFile(client, bucketName, 'test-1.jpg', 1)])

          const deleteObjectsCommand = new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
              Objects: [
                {
                  Key: 'test-1.jpg',
                },
              ],
            },
          })

          const deleteResp = await client.send(deleteObjectsCommand)

          expect(deleteResp.Deleted).toEqual([
            {
              Key: 'test-1.jpg',
            },
          ])

          const listObjectsCommand = new ListObjectsV2Command({
            Bucket: bucketName,
          })

          const resp = await client.send(listObjectsCommand)
          expect(resp.Contents).toBe(undefined)

          // Verify webhook was called with correct data
          expect(webhookSpy).toHaveBeenCalledTimes(1)
          const webhookCall = webhookSpy.mock.calls[0][0] as Omit<ObjectRemovedEvent, '$version'>
          expect(webhookCall).toMatchObject({
            tenant: expect.objectContaining({ ref: tenantId }),
            name: 'test-1.jpg',
            version: expect.any(String),
            bucketId: bucketName,
            reqId: expect.any(String),
            metadata: expect.any(Object),
          })
          expect(webhookCall.metadata).toBeDefined()
          expect(webhookCall.metadata).toHaveProperty('size')
        } finally {
          webhookSpy.mockRestore()
        }
      })

      it('preserves whitespace-only, numeric-looking, and boolean-looking keys in bulk deletes', async () => {
        const webhookSpy = vi.spyOn(ObjectRemoved, 'sendWebhook').mockResolvedValue(undefined)
        const numericReferenceKeys = ['0', '1']
        const keys = [
          '   ',
          ' file ',
          '007',
          '1e3',
          '0x10',
          '12345678901234567890',
          'true',
          'FALSE',
          ...numericReferenceKeys,
        ]

        try {
          const bucketName = await createBucket(client)
          await Promise.all(
            keys.map((Key) =>
              client.send(
                new PutObjectCommand({
                  Bucket: bucketName,
                  Key,
                  Body: 'x',
                })
              )
            )
          )

          const entityDeleteResp = await sendSignedS3Request({
            baseUrl,
            method: 'POST',
            path: `/s3/${bucketName}`,
            query: { delete: '' },
            headers: { 'Content-Type': 'application/xml' },
            body: '<Delete><Object><Key>&#48;</Key></Object><Object><Key>&#x31;</Key></Object></Delete>',
          })

          expect(entityDeleteResp.status).toBe(200)
          expect(entityDeleteResp.data).toContain('<Key>0</Key>')
          expect(entityDeleteResp.data).toContain('<Key>1</Key>')

          const remainingKeys = keys.filter((key) => !numericReferenceKeys.includes(key))
          const remainingResp = await client.send(new ListObjectsV2Command({ Bucket: bucketName }))
          expect(remainingResp.Contents?.map(({ Key }) => Key).sort()).toEqual(
            remainingKeys.toSorted()
          )

          const deleteResp = await client.send(
            new DeleteObjectsCommand({
              Bucket: bucketName,
              Delete: {
                Objects: remainingKeys.map((Key) => ({ Key })),
              },
            })
          )

          expect(deleteResp.Deleted).toEqual(remainingKeys.map((Key) => ({ Key })))

          const listResp = await client.send(
            new ListObjectsV2Command({
              Bucket: bucketName,
            })
          )
          expect(listResp.Contents).toBeUndefined()
        } finally {
          webhookSpy.mockRestore()
        }
      })

      it('can delete multiple objects', async () => {
        const webhookSpy = vi.spyOn(ObjectRemoved, 'sendWebhook').mockResolvedValue(undefined)

        try {
          const bucketName = await createBucket(client)
          await Promise.all([
            uploadFile(client, bucketName, 'test-1.jpg', 1),
            uploadFile(client, bucketName, 'test-2.jpg', 1),
            uploadFile(client, bucketName, 'test-3.jpg', 1),
          ])

          const deleteObjectsCommand = new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
              Objects: [
                {
                  Key: 'test-1.jpg',
                },
                {
                  Key: 'test-2.jpg',
                },
                {
                  Key: 'test-3.jpg',
                },
              ],
            },
          })

          const deleteResp = await client.send(deleteObjectsCommand)

          expect(deleteResp.Deleted).toEqual([
            {
              Key: 'test-1.jpg',
            },
            {
              Key: 'test-2.jpg',
            },
            {
              Key: 'test-3.jpg',
            },
          ])

          const listObjectsCommand = new ListObjectsV2Command({
            Bucket: bucketName,
          })

          const resp = await client.send(listObjectsCommand)
          expect(resp.Contents).toBe(undefined)

          // Verify webhook was called 3 times (once per object)
          expect(webhookSpy).toHaveBeenCalledTimes(3)
          const deletedKeys = webhookSpy.mock.calls.map((call) => call[0].name).sort()
          expect(deletedKeys).toEqual(['test-1.jpg', 'test-2.jpg', 'test-3.jpg'])

          // Verify all calls have the required fields with metadata
          webhookSpy.mock.calls.forEach((call) => {
            const webhookCall = call[0] as Omit<ObjectRemovedEvent, '$version'>
            expect(webhookCall).toMatchObject({
              tenant: expect.objectContaining({ ref: tenantId }),
              name: expect.toBeOneOf(['test-1.jpg', 'test-2.jpg', 'test-3.jpg']),
              version: expect.any(String),
              bucketId: bucketName,
              reqId: expect.any(String),
              metadata: expect.any(Object),
            })
            expect(webhookCall.metadata).toBeDefined()
            expect(webhookCall.metadata).toHaveProperty('size')
          })
        } finally {
          webhookSpy.mockRestore()
        }
      })

      it('try to delete multiple objects that dont exist', async () => {
        const bucketName = await createBucket(client)

        await uploadFile(client, bucketName, 'test-1.jpg', 1)

        const deleteObjectsCommand = new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: {
            Objects: [
              {
                Key: 'test-1.jpg',
              },
              {
                Key: 'test-2.jpg',
              },
              {
                Key: 'test-3.jpg',
              },
            ],
          },
        })

        const deleteResp = await client.send(deleteObjectsCommand)
        expect(deleteResp.Deleted).toEqual([
          {
            Key: 'test-1.jpg',
          },
          {
            Key: 'test-2.jpg',
          },
          {
            Key: 'test-3.jpg',
          },
        ])
        expect(deleteResp.Errors ?? []).toEqual([])

        const listObjectsCommand = new ListObjectsV2Command({
          Bucket: bucketName,
        })

        const resp = await client.send(listObjectsCommand)
        expect(resp.Contents).toBe(undefined)
      })

      it('does not treat a missing bucket as a successful bulk delete', async () => {
        const deleteObjectsCommand = new DeleteObjectsCommand({
          Bucket: `missing-bucket-${randomUUID()}`,
          Delete: {
            Objects: [{ Key: 'test-1.jpg' }],
          },
        })

        try {
          await client.send(deleteObjectsCommand)
          throw new Error('Should not reach here')
        } catch (e) {
          expect((e as Error).message).not.toBe('Should not reach here')
          expect((e as S3ServiceException).$metadata.httpStatusCode).toEqual(404)
          expect((e as S3ServiceException).name).toEqual('NoSuchBucket')
        }
      })

      it('returns AccessDenied for existing objects blocked by RLS', async () => {
        const bucketName = await createBucket(client, 'delete-permission', false)
        const allowedKey = 'allowed/delete-me.jpg'
        const deniedKey = 'denied/keep-me.jpg'
        const missingKey = 'missing/not-there.jpg'
        const policyName = `s3_delete_objects_${randomUUID().replaceAll('-', '_')}`
        const adminUser = await getServiceKeyUser(tenantId)
        const connection = await getPostgresConnection({
          tenantId,
          user: adminUser,
          superUser: adminUser,
          host: 'localhost',
        })
        const db = connection
        const anonKey = await anonKeyAsync
        const anonClient = new S3Client({
          endpoint: `${baseUrl}/s3`,
          forcePathStyle: true,
          region: storageS3Region,
          credentials: {
            accessKeyId: tenantId,
            secretAccessKey: anonKey,
            sessionToken: anonKey,
          },
        })

        try {
          await Promise.all([
            uploadFile(client, bucketName, allowedKey, 1),
            uploadFile(client, bucketName, deniedKey, 1),
          ])

          await db.query(`
            CREATE POLICY "${policyName}_select"
            ON storage.objects
            AS PERMISSIVE
            FOR SELECT
            TO "anon"
            USING (bucket_id = '${bucketName}' AND name = '${allowedKey}')
          `)
          await db.query(`
            CREATE POLICY "${policyName}_delete"
            ON storage.objects
            AS PERMISSIVE
            FOR DELETE
            TO "anon"
            USING (bucket_id = '${bucketName}' AND name = '${allowedKey}')
          `)

          const deleteResp = await anonClient.send(
            new DeleteObjectsCommand({
              Bucket: bucketName,
              Delete: {
                Objects: [{ Key: allowedKey }, { Key: missingKey }, { Key: deniedKey }],
              },
            })
          )

          expect(deleteResp.Deleted).toEqual([{ Key: allowedKey }, { Key: missingKey }])
          expect(deleteResp.Errors).toEqual([
            {
              Key: deniedKey,
              Code: 'AccessDenied',
              Message: 'Access Denied',
            },
          ])

          const allowedListResp = await client.send(
            new ListObjectsV2Command({
              Bucket: bucketName,
              Prefix: allowedKey,
            })
          )
          expect(allowedListResp.Contents).toBe(undefined)

          const deniedListResp = await client.send(
            new ListObjectsV2Command({
              Bucket: bucketName,
              Prefix: deniedKey,
            })
          )
          expect(deniedListResp.Contents?.map((object) => object.Key)).toEqual([deniedKey])
        } finally {
          anonClient.destroy()
          await db.query(`DROP POLICY IF EXISTS "${policyName}_select" ON storage.objects`)
          await db.query(`DROP POLICY IF EXISTS "${policyName}_delete" ON storage.objects`)
          connection.dispose()
          await client
            .send(
              new DeleteObjectsCommand({
                Bucket: bucketName,
                Delete: {
                  Objects: [{ Key: allowedKey }, { Key: deniedKey }],
                },
              })
            )
            .catch(() => undefined)
          await client.send(new DeleteBucketCommand({ Bucket: bucketName })).catch(() => undefined)
        }
      })
    })

    describe('CopyObjectCommand', () => {
      it('will copy an object in the same bucket', async () => {
        const webhookSpy = vi
          .spyOn(ObjectCreatedCopyEvent, 'sendWebhook')
          .mockResolvedValue(undefined)

        try {
          const bucketName = await createBucket(client)
          await uploadFile(client, bucketName, 'test-copy-1.jpg', 1)

          const copyObjectCommand = new CopyObjectCommand({
            Bucket: bucketName,
            Key: 'test-copied-2.jpg',
            CopySource: `${bucketName}/test-copy-1.jpg`,
          })

          const resp = await client.send(copyObjectCommand)
          expect(resp.CopyObjectResult?.ETag).toBeTruthy()

          // Verify webhook was called with correct data
          expect(webhookSpy).toHaveBeenCalledTimes(1)
          const webhookCall = webhookSpy.mock.calls[0][0] as ObjectCreatedEvent
          expect(webhookCall).toMatchObject({
            tenant: expect.objectContaining({ ref: tenantId }),
            name: 'test-copied-2.jpg',
            version: expect.any(String),
            bucketId: bucketName,
            reqId: expect.any(String),
            metadata: expect.any(Object),
            uploadType: 's3',
          })
          expect(webhookCall.metadata).toBeDefined()
          expect(webhookCall.metadata).toHaveProperty('size')
        } finally {
          webhookSpy.mockRestore()
        }
      })

      it('will copy an object in a different bucket', async () => {
        const bucketName1 = await createBucket(client)
        const bucketName2 = await createBucket(client)
        await uploadFile(client, bucketName1, 'test-copy-1.jpg', 1)

        const copyObjectCommand = new CopyObjectCommand({
          Bucket: bucketName2,
          Key: 'test-copied-2.jpg',
          CopySource: `${bucketName1}/test-copy-1.jpg`,
        })

        const resp = await client.send(copyObjectCommand)
        expect(resp.CopyObjectResult?.ETag).toBeTruthy()
      })

      it('will copy an object overwriting the metadata', async () => {
        const bucketName = await createBucket(client)
        await uploadFile(client, bucketName, 'test-copy-1.jpg', 1)

        const copyObjectCommand = new CopyObjectCommand({
          Bucket: bucketName,
          Key: 'test-copied-2.png',
          CopySource: `${bucketName}/test-copy-1.jpg`,
          ContentType: 'image/png',
          CacheControl: 'max-age=2009',
          Metadata: {
            color: 'blue',
          },
          MetadataDirective: 'REPLACE',
        })

        const resp = await client.send(copyObjectCommand)
        expect(resp.CopyObjectResult?.ETag).toBeTruthy()

        const headObjectCommand = new HeadObjectCommand({
          Bucket: bucketName,
          Key: 'test-copied-2.png',
        })

        const headObj = await client.send(headObjectCommand)
        expect(headObj.ContentType).toBe('image/png')
        expect(headObj.CacheControl).toBe('max-age=2009')
        expect(headObj.Metadata).toMatchObject({ color: 'blue' })
      })

      it('will not preserve omitted metadata when replacing it', async () => {
        const bucketName = await createBucket(client)
        await uploadFile(client, bucketName, 'test-copy-1.jpg', 1)

        await client.send(
          new CopyObjectCommand({
            Bucket: bucketName,
            Key: 'test-copied-2.jpg',
            CopySource: `${bucketName}/test-copy-1.jpg`,
            CacheControl: 'max-age=2009',
            MetadataDirective: 'REPLACE',
          })
        )

        const copiedObject = await client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: 'test-copied-2.jpg',
          })
        )
        await copiedObject.Body?.transformToByteArray()

        expect(copiedObject.CacheControl).toBe('max-age=2009')
        // TODO: expect 'binary/octet-stream' (the S3 default) once the backend
        // fallback is changed. RustFS stores no content type on REPLACE, so this
        // currently reflects our own fallback.
        expect(copiedObject.ContentType).toBe('application/octet-stream')
      })

      it('will allow copying an object in the same path, just altering its metadata', async () => {
        const bucketName = await createBucket(client)
        const fileName = 'test-copy-1.jpg'

        await uploadFile(client, bucketName, fileName, 1)

        const copyObjectCommand = new CopyObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          CopySource: `${bucketName}/${fileName}`,
          ContentType: 'image/png',
          CacheControl: 'max-age=2009',
          MetadataDirective: 'REPLACE',
        })

        const resp = await client.send(copyObjectCommand)
        expect(resp.CopyObjectResult?.ETag).toBeTruthy()

        const headObjectCommand = new HeadObjectCommand({
          Bucket: bucketName,
          Key: fileName,
        })

        const headObj = await client.send(headObjectCommand)
        expect(headObj.ContentType).toBe('image/png')
        expect(headObj.CacheControl).toBe('max-age=2009')
      })

      it('will not be able to copy an object that doesnt exist', async () => {
        const bucketName1 = await createBucket(client)
        await uploadFile(client, bucketName1, 'test-copy-1.jpg', 1)

        const copyObjectCommand = new CopyObjectCommand({
          Bucket: bucketName1,
          Key: 'test-copied-2.jpg',
          CopySource: `${bucketName1}/test-doesnt-exist.jpg`,
        })

        try {
          await client.send(copyObjectCommand)
          throw new Error('Should not reach here')
        } catch (e) {
          expect((e as Error).message).not.toEqual('Should not reach here')
          expect((e as S3ServiceException).$metadata.httpStatusCode).toEqual(404)
          expect((e as S3ServiceException).message).toEqual('Object not found')
        }
      })

      it.each(['/', '%2F'])('copies an encoded source with %s separators', async (separator) => {
        const bucketName = await createBucket(client)
        const sourceKey = 'folder/my file+1?.txt'
        const destKey = 'copied.txt'
        const payload = Buffer.from('encoded-copy-source')

        await client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: sourceKey,
            Body: payload,
            ContentType: 'text/plain',
          })
        )

        const signedRequest = await createSignedS3Request({
          baseUrl,
          path: `/s3/${bucketName}/${destKey}`,
          method: 'PUT',
          headers: {
            'x-amz-copy-source': `${bucketName}${separator}folder${separator}my%20file%2B1%3F.txt`,
          },
        })

        const response = await fetch(signedRequest.requestUrl, {
          method: 'PUT',
          headers: signedRequest.headers,
        })

        expect(response.status).toBe(200)

        const copiedObject = await client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: destKey,
          })
        )
        const copiedBytes = await copiedObject.Body?.transformToByteArray()

        expect(Buffer.from(copiedBytes || [])).toEqual(payload)
      })
    })

    describe('ListMultipartUploads', () => {
      it('will list multipart uploads', async () => {
        const bucketName = await createBucket(client)
        const createMultiPartUpload = (key: string) =>
          new CreateMultipartUploadCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: 'image/jpg',
            CacheControl: 'max-age=2000',
          })

        await Promise.all([
          client.send(createMultiPartUpload('test-1.jpg')),
          client.send(createMultiPartUpload('test-2.jpg')),
          client.send(createMultiPartUpload('test-3.jpg')),
          client.send(createMultiPartUpload('nested/test-4.jpg')),
        ])

        const listMultipartUploads = new ListMultipartUploadsCommand({
          Bucket: bucketName,
        })

        const resp = await client.send(listMultipartUploads)
        expect(resp.Uploads?.length).toBe(4)
        expect(resp.Uploads?.[0].Key).toBe('nested/test-4.jpg')
        expect(resp.Uploads?.[1].Key).toBe('test-1.jpg')
        expect(resp.Uploads?.[2].Key).toBe('test-2.jpg')
        expect(resp.Uploads?.[3].Key).toBe('test-3.jpg')
      })

      it('will list multipart uploads with delimiter', async () => {
        const bucketName = await createBucket(client)
        const createMultiPartUpload = (key: string) =>
          new CreateMultipartUploadCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: 'image/jpg',
            CacheControl: 'max-age=2000',
          })

        await Promise.all([
          client.send(createMultiPartUpload('test-1.jpg')),
          client.send(createMultiPartUpload('test-2.jpg')),
          client.send(createMultiPartUpload('test-3.jpg')),
          client.send(createMultiPartUpload('nested/test-4.jpg')),
        ])

        const listMultipartUploads = new ListMultipartUploadsCommand({
          Bucket: bucketName,
          Delimiter: '/',
        })

        const resp = await client.send(listMultipartUploads)
        expect(resp.Uploads?.length).toBe(3)
        expect(resp.CommonPrefixes?.length).toBe(1)
        expect(resp.Uploads?.[0].Key).toBe('test-1.jpg')
        expect(resp.Uploads?.[1].Key).toBe('test-2.jpg')
        expect(resp.Uploads?.[2].Key).toBe('test-3.jpg')
        expect(resp.CommonPrefixes?.[0].Prefix).toBe('nested/')

        const encodedPrefix = `encoded !'()*/`
        await Promise.all([
          client.send(createMultiPartUpload(`${encodedPrefix}file.txt`)),
          client.send(createMultiPartUpload(`${encodedPrefix}folder/file.txt`)),
        ])

        const encoded = await client.send(
          new ListMultipartUploadsCommand({
            Bucket: bucketName,
            Prefix: encodedPrefix,
            Delimiter: '/',
            EncodingType: 'url',
          })
        )
        expect(encoded.Prefix).toBe('encoded%20%21%27%28%29%2A%2F')
        expect(encoded.Delimiter).toBe('%2F')
        expect(encoded.Uploads?.[0].Key).toBe('encoded%20%21%27%28%29%2A%2Ffile.txt')
        expect(encoded.CommonPrefixes?.[0].Prefix).toBe('encoded%20%21%27%28%29%2A%2Ffolder%2F')
      })

      it('treats % as a literal character in multipart prefix filtering with delimiter', async () => {
        const bucketName = await createBucket(client)
        const createMultiPartUpload = (key: string) =>
          new CreateMultipartUploadCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: 'image/jpg',
            CacheControl: 'max-age=2000',
          })

        await Promise.all([
          client.send(createMultiPartUpload(`percent-${randomUUID()}.jpg`)),
          client.send(createMultiPartUpload(`percent-${randomUUID()}.jpg`)),
        ])

        const listMultipartUploads = new ListMultipartUploadsCommand({
          Bucket: bucketName,
          Delimiter: '/',
          Prefix: '%',
        })

        const resp = await client.send(listMultipartUploads)
        expect(resp.Uploads).toBeUndefined()
        expect(resp.CommonPrefixes).toBeUndefined()
      })

      it('treats _ as a literal character in multipart prefix filtering with delimiter', async () => {
        const bucketName = await createBucket(client)
        const runId = randomUUID()
        const literalMatchKey = `wild_${runId}/hit.jpg`
        const wildcardOnlyMatchKey = `wildX${runId}/miss.jpg`
        const createMultiPartUpload = (key: string) =>
          new CreateMultipartUploadCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: 'image/jpg',
            CacheControl: 'max-age=2000',
          })

        await Promise.all([
          client.send(createMultiPartUpload(literalMatchKey)),
          client.send(createMultiPartUpload(wildcardOnlyMatchKey)),
        ])

        const listMultipartUploads = new ListMultipartUploadsCommand({
          Bucket: bucketName,
          Delimiter: '/',
          Prefix: `wild_${runId}/`,
        })

        const resp = await client.send(listMultipartUploads)
        expect(resp.CommonPrefixes).toBeUndefined()
        expect(resp.Uploads?.length).toBe(1)
        expect(resp.Uploads?.[0].Key).toBe(literalMatchKey)
      })

      it.each([
        undefined,
        '/',
      ])('matches multipart upload prefixes case-sensitively with delimiter %s', async (delimiter) => {
        const bucketName = await createBucket(client)
        const runId = randomUUID()
        const prefix = `Case-${runId}/`
        const matchingKey = `${prefix}hit.jpg`
        const differentlyCasedKey = `${prefix.toLowerCase()}miss.jpg`
        const createMultiPartUpload = (key: string) =>
          new CreateMultipartUploadCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: 'image/jpg',
            CacheControl: 'max-age=2000',
          })

        await Promise.all([
          client.send(createMultiPartUpload(matchingKey)),
          client.send(createMultiPartUpload(differentlyCasedKey)),
        ])

        const resp = await client.send(
          new ListMultipartUploadsCommand({
            Bucket: bucketName,
            Prefix: prefix,
            Delimiter: delimiter,
          })
        )

        expect(resp.Uploads?.map((upload) => upload.Key)).toEqual([matchingKey])
        expect(resp.CommonPrefixes).toBeUndefined()
      })
    })

    it('will list multipart uploads with delimiter and pagination', async () => {
      const bucketName = await createBucket(client)
      const createMultiPartUpload = (key: string) =>
        new CreateMultipartUploadCommand({
          Bucket: bucketName,
          Key: key,
          ContentType: 'image/jpg',
          CacheControl: 'max-age=2000',
        })

      await Promise.all([
        client.send(createMultiPartUpload('test-1.jpg')),
        client.send(createMultiPartUpload('test-2.jpg')),
        client.send(createMultiPartUpload('test-3.jpg')),
        client.send(createMultiPartUpload('nested/test-4.jpg')),
      ])

      const listMultipartUploads1 = new ListMultipartUploadsCommand({
        Bucket: bucketName,
        Delimiter: '/',
        MaxUploads: 1,
      })

      const page1 = await client.send(listMultipartUploads1)
      expect(page1.Uploads?.length).toBe(undefined)
      expect(page1.CommonPrefixes?.length).toBe(1)
      expect(page1.CommonPrefixes?.[0].Prefix).toBe('nested/')

      const listMultipartUploads2 = new ListMultipartUploadsCommand({
        Bucket: bucketName,
        Delimiter: '/',
        MaxUploads: 1,
        KeyMarker: page1.NextKeyMarker,
      })

      const page2 = await client.send(listMultipartUploads2)
      expect(page2.CommonPrefixes?.length).toBe(undefined)
      expect(page2.Uploads?.length).toBe(1)
      expect(page2.Uploads?.[0].Key).toBe('test-1.jpg')

      const listMultipartUploads3 = new ListMultipartUploadsCommand({
        Bucket: bucketName,
        Delimiter: '/',
        MaxUploads: 1,
        KeyMarker: page2.NextKeyMarker,
      })

      const page3 = await client.send(listMultipartUploads3)
      expect(page3.CommonPrefixes?.length).toBe(undefined)
      expect(page3.Uploads?.length).toBe(1)
      expect(page3.Uploads?.[0].Key).toBe('test-2.jpg')

      const listMultipartUploads4 = new ListMultipartUploadsCommand({
        Bucket: bucketName,
        Delimiter: '/',
        MaxUploads: 1,
        KeyMarker: page3.NextKeyMarker,
      })

      const page4 = await client.send(listMultipartUploads4)
      expect(page4.CommonPrefixes?.length).toBe(undefined)
      expect(page4.Uploads?.length).toBe(1)
      expect(page4.Uploads?.[0].Key).toBe('test-3.jpg')
    })

    describe('ListParts', () => {
      it('cannot list parts for an upload that doesnt exists', async () => {
        const listParts = new ListPartsCommand({
          Bucket: 'no-bucket',
          Key: 'test-1.jpg',
          UploadId: 'test-upload-id',
        })

        try {
          await client.send(listParts)
          throw new Error('Should not reach here')
        } catch (e) {
          expect((e as Error).message).not.toBe('Should not reach here')
          expect((e as S3ServiceException).$metadata.httpStatusCode).toBe(404)
          expect((e as S3ServiceException).message).toBe('Upload not found')
        }
      })

      it('will list parts of a multipart upload', async () => {
        const bucket = await createBucket(client)
        const createMultiPartUpload = new CreateMultipartUploadCommand({
          Bucket: bucket,
          Key: 'test-1.jpg',
          ContentType: 'image/jpg',
          CacheControl: 'max-age=2000',
        })
        const resp = await client.send(createMultiPartUpload)
        expect(resp.UploadId).toBeTruthy()

        const data = Buffer.alloc(1024 * 5)
        const uploadPart = (partNumber: number) =>
          new UploadPartCommand({
            Bucket: bucket,
            Key: 'test-1.jpg',
            ContentLength: data.length,
            UploadId: resp.UploadId,
            Body: data,
            PartNumber: partNumber,
          })

        await Promise.all([
          client.send(uploadPart(1)),
          client.send(uploadPart(2)),
          client.send(uploadPart(3)),
        ])

        const listParts = new ListPartsCommand({
          Bucket: bucket,
          Key: 'test-1.jpg',
          UploadId: resp.UploadId,
        })

        const parts = await client.send(listParts)
        expect(parts.Parts?.length).toBe(3)
      })

      it('will list parts of a multipart upload with pagination', async () => {
        const bucket = await createBucket(client)
        const createMultiPartUpload = new CreateMultipartUploadCommand({
          Bucket: bucket,
          Key: 'test-1.jpg',
          ContentType: 'image/jpg',
          CacheControl: 'max-age=2000',
        })
        const resp = await client.send(createMultiPartUpload)
        expect(resp.UploadId).toBeTruthy()

        const data = Buffer.alloc(1024 * 5)
        const uploadPart = (partNumber: number) =>
          new UploadPartCommand({
            Bucket: bucket,
            Key: 'test-1.jpg',
            ContentLength: data.length,
            UploadId: resp.UploadId,
            Body: data,
            PartNumber: partNumber,
          })

        await Promise.all([
          client.send(uploadPart(1)),
          client.send(uploadPart(2)),
          client.send(uploadPart(3)),
        ])

        const listParts1 = new ListPartsCommand({
          Bucket: bucket,
          Key: 'test-1.jpg',
          UploadId: resp.UploadId,
          MaxParts: 1,
        })

        const parts1 = await client.send(listParts1)
        expect(parts1.Parts?.length).toBe(1)
        expect(parts1.Parts?.[0].PartNumber).toBe(1)

        const listParts2 = new ListPartsCommand({
          Bucket: bucket,
          Key: 'test-1.jpg',
          UploadId: resp.UploadId,
          MaxParts: 1,
          PartNumberMarker: parts1.NextPartNumberMarker,
        })

        const parts2 = await client.send(listParts2)
        expect(parts2.Parts?.length).toBe(1)
        expect(parts2.Parts?.[0].PartNumber).toBe(2)

        const listParts3 = new ListPartsCommand({
          Bucket: bucket,
          Key: 'test-1.jpg',
          UploadId: resp.UploadId,
          MaxParts: 1,
          PartNumberMarker: parts2.NextPartNumberMarker,
        })

        const parts3 = await client.send(listParts3)
        expect(parts3.Parts?.length).toBe(1)
        expect(parts3.Parts?.[0].PartNumber).toBe(3)
      })

      it('lists only the latest upload of a re-uploaded part number', async () => {
        const bucket = await createBucket(client)
        const key = 'test-1.jpg'
        const resp = await client.send(
          new CreateMultipartUploadCommand({
            Bucket: bucket,
            Key: key,
            ContentType: 'image/jpg',
          })
        )
        expect(resp.UploadId).toBeTruthy()

        const uploadPart = (partNumber: number, fill: string) => {
          const data = Buffer.alloc(1024 * 5, fill)
          return new UploadPartCommand({
            Bucket: bucket,
            Key: key,
            ContentLength: data.length,
            UploadId: resp.UploadId,
            Body: data,
            PartNumber: partNumber,
          })
        }

        await client.send(uploadPart(1, 'a'))
        const reuploaded = await client.send(uploadPart(1, 'b'))
        await client.send(uploadPart(2, 'c'))

        const parts = await client.send(
          new ListPartsCommand({
            Bucket: bucket,
            Key: key,
            UploadId: resp.UploadId,
            MaxParts: 2,
          })
        )

        expect(parts.Parts?.map((part) => part.PartNumber)).toEqual([1, 2])
        expect(parts.Parts?.[0].ETag).toBe(reuploaded.ETag)
        expect(parts.IsTruncated).toBe(false)
      })

      it('completes with the latest upload of a re-uploaded part number when no part list is sent', async () => {
        const bucket = await createBucket(client)
        const key = 'test-1.jpg'
        const resp = await client.send(
          new CreateMultipartUploadCommand({
            Bucket: bucket,
            Key: key,
            ContentType: 'image/jpg',
          })
        )
        expect(resp.UploadId).toBeTruthy()

        const uploadPart = (fill: string) => {
          const data = Buffer.alloc(1024, fill)
          return new UploadPartCommand({
            Bucket: bucket,
            Key: key,
            ContentLength: data.length,
            UploadId: resp.UploadId,
            Body: data,
            PartNumber: 1,
          })
        }

        await client.send(uploadPart('a'))
        await client.send(uploadPart('b'))

        await client.send(
          new CompleteMultipartUploadCommand({
            Bucket: bucket,
            Key: key,
            UploadId: resp.UploadId,
          })
        )

        const getResp = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
        const data = await getResp.Body?.transformToByteArray()
        expect(Buffer.from(data ?? []).equals(Buffer.alloc(1024, 'b'))).toBe(true)
      })
    })

    describe('UploadPartCopyCommand', () => {
      it('returns CopyPartResult as the raw XML root', async () => {
        const bucket = await createBucket(client)
        const sourceKey = `source-${randomUUID()}.txt`
        const targetKey = `copy-${randomUUID()}.txt`

        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: sourceKey,
            Body: 'source',
            ContentType: 'text/plain',
          })
        )

        const multipart = await client.send(
          new CreateMultipartUploadCommand({
            Bucket: bucket,
            Key: targetKey,
            ContentType: 'text/plain',
          })
        )
        onTestFinished(async () => {
          await client.send(
            new AbortMultipartUploadCommand({
              Bucket: bucket,
              Key: targetKey,
              UploadId: multipart.UploadId,
            })
          )
        })

        const signedRequest = await createSignedS3Request({
          baseUrl,
          path: `/s3/${bucket}/${targetKey}`,
          method: 'PUT',
          query: {
            partNumber: '1',
            uploadId: multipart.UploadId!,
          },
          headers: {
            'x-amz-copy-source': `${bucket}/${sourceKey}`,
          },
        })

        const response = await fetch(signedRequest.requestUrl, {
          method: 'PUT',
          headers: signedRequest.headers,
        })
        const body = await response.text()

        expect(response.status).toBe(200)
        expect(response.headers.get('content-type')).toContain('application/xml')
        expect(body).toContain('?><CopyPartResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">')
        expect(body).not.toContain('<responseBody>')
      })

      it('copies inclusive source ranges without dropping boundary bytes', async () => {
        const bucket = await createBucket(client)

        const sourceKey = `source-${randomUUID()}.txt`
        const payload = Buffer.from('0123456789')

        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: sourceKey,
            Body: payload,
            ContentType: 'text/plain',
          })
        )

        const rangeCases: Array<[string, Buffer]> = [
          ['bytes=0-0', Buffer.from('0')],
          ['bytes=9-9', Buffer.from('9')],
          ['bytes=0-9', payload],
          ['bytes=2-5', Buffer.from('2345')],
        ]

        for (const [copySourceRange, expected] of rangeCases) {
          const targetKey = `range-copy-${randomUUID()}.txt`
          const multipart = await client.send(
            new CreateMultipartUploadCommand({
              Bucket: bucket,
              Key: targetKey,
              ContentType: 'text/plain',
            })
          )

          const copiedPart = await client.send(
            new UploadPartCopyCommand({
              Bucket: bucket,
              Key: targetKey,
              UploadId: multipart.UploadId,
              PartNumber: 1,
              CopySource: `${bucket}/${sourceKey}`,
              CopySourceRange: copySourceRange,
            })
          )

          expect(copiedPart.CopyPartResult?.ETag).toBeTruthy()

          await client.send(
            new CompleteMultipartUploadCommand({
              Bucket: bucket,
              Key: targetKey,
              UploadId: multipart.UploadId,
              MultipartUpload: {
                Parts: [
                  {
                    PartNumber: 1,
                    ETag: copiedPart.CopyPartResult?.ETag,
                  },
                ],
              },
            })
          )

          const copiedObject = await client.send(
            new GetObjectCommand({
              Bucket: bucket,
              Key: targetKey,
            })
          )
          const copiedBytes = await copiedObject.Body?.transformToByteArray()

          expect(copiedObject.ContentLength).toBe(expected.length)
          expect(Buffer.from(copiedBytes || [])).toEqual(expected)
        }
      })

      it('accounts source ranges inclusively when enforcing max file size', async () => {
        const bucket = await createBucket(client)
        const sourceKey = `source-${randomUUID()}.txt`
        const targetKey = `range-copy-limit-${randomUUID()}.txt`

        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: sourceKey,
            Body: Buffer.from('0123456789'),
            ContentType: 'text/plain',
          })
        )

        mergeConfig({
          uploadFileSizeLimit: 1,
        })

        const multipart = await client.send(
          new CreateMultipartUploadCommand({
            Bucket: bucket,
            Key: targetKey,
            ContentType: 'text/plain',
          })
        )

        try {
          await client.send(
            new UploadPartCopyCommand({
              Bucket: bucket,
              Key: targetKey,
              UploadId: multipart.UploadId,
              PartNumber: 1,
              CopySource: `${bucket}/${sourceKey}`,
              CopySourceRange: 'bytes=0-1',
            })
          )
          throw new Error('Should not reach here')
        } catch (e) {
          expect((e as Error).message).not.toEqual('Should not reach here')
          expect((e as S3ServiceException).$metadata.httpStatusCode).toEqual(413)
          expect((e as S3ServiceException).message).toEqual(
            'The object exceeded the maximum allowed size'
          )
          expect((e as S3ServiceException).name).toEqual('EntityTooLarge')
        }
      })

      it('will copy a part from an existing object and upload it as a part', async () => {
        const bucket = await createBucket(client)

        const sourceKey = `${randomUUID()}.jpg`
        const newKey = `new-${randomUUID()}.jpg`

        await uploadFile(client, bucket, sourceKey, 12)

        const createMultiPartUpload = new CreateMultipartUploadCommand({
          Bucket: bucket,
          Key: newKey,
          ContentType: 'image/jpg',
          CacheControl: 'max-age=2000',
        })
        const resp = await client.send(createMultiPartUpload)
        expect(resp.UploadId).toBeTruthy()

        const copySource = `${bucket}/${sourceKey}`
        const copySourceRange = `bytes=0-${1024 * 4}`
        const signedRequest = await createSignedS3Request({
          baseUrl,
          path: `/s3/${bucket}/${newKey}`,
          method: 'PUT',
          query: {
            partNumber: '1',
            uploadId: resp.UploadId!,
          },
          headers: {
            'x-amz-copy-source': copySource,
            'x-amz-copy-source-range': copySourceRange,
          },
        })
        const rawResponse = await fetch(signedRequest.requestUrl, {
          method: 'PUT',
          headers: {
            ...signedRequest.headers,
            accept: 'application/xml',
          },
        })
        const rawBody = (await rawResponse.text()).replace(/^<\?xml[^>]*\?>/, '')

        expect(rawResponse.status).toBe(200)
        expect(rawBody).toMatch(/^<CopyPartResult(?:\s[^>]*)?>/)
        expect(rawBody).toContain('<ETag>')
        expect(rawBody).toContain('<LastModified>')
        expect(rawBody).toMatch(/<\/CopyPartResult>$/)

        const listPartsCmd = new ListPartsCommand({
          Bucket: bucket,
          Key: newKey,
          UploadId: resp.UploadId,
        })

        const parts = await client.send(listPartsCmd)
        expect(parts.Parts?.length).toBe(1)
      })

      it.each(['/', '%2F'])('copies a part with %s source separators', async (separator) => {
        const bucket = await createBucket(client)
        const sourceKey = 'folder/my file+1?.txt'
        const targetKey = `copy-${randomUUID()}.txt`
        const payload = Buffer.from('encoded-part-copy-source')

        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: sourceKey,
            Body: payload,
            ContentType: 'text/plain',
          })
        )

        const multipart = await client.send(
          new CreateMultipartUploadCommand({
            Bucket: bucket,
            Key: targetKey,
            ContentType: 'text/plain',
          })
        )
        onTestFinished(async () => {
          await client
            .send(
              new AbortMultipartUploadCommand({
                Bucket: bucket,
                Key: targetKey,
                UploadId: multipart.UploadId,
              })
            )
            .catch(() => undefined)
        })

        const signedRequest = await createSignedS3Request({
          baseUrl,
          path: `/s3/${bucket}/${targetKey}`,
          method: 'PUT',
          query: {
            partNumber: '1',
            uploadId: multipart.UploadId!,
          },
          headers: {
            'x-amz-copy-source': `${bucket}${separator}folder${separator}my%20file%2B1%3F.txt`,
          },
        })

        const response = await fetch(signedRequest.requestUrl, {
          method: 'PUT',
          headers: signedRequest.headers,
        })

        expect(response.status).toBe(200)

        const parts = await client.send(
          new ListPartsCommand({
            Bucket: bucket,
            Key: targetKey,
            UploadId: multipart.UploadId,
          })
        )
        expect(parts.Parts).toHaveLength(1)

        await client.send(
          new CompleteMultipartUploadCommand({
            Bucket: bucket,
            Key: targetKey,
            UploadId: multipart.UploadId,
            MultipartUpload: {
              Parts: [
                {
                  PartNumber: 1,
                  ETag: parts.Parts?.[0].ETag,
                },
              ],
            },
          })
        )

        const copiedObject = await client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: targetKey,
          })
        )
        const copiedBytes = await copiedObject.Body?.transformToByteArray()

        expect(Buffer.from(copiedBytes || [])).toEqual(payload)
      })
    })

    describe('Session token authentication', () => {
      function sessionTokenClient(secretAccessKey: string, sessionToken: string) {
        return new S3Client({
          endpoint: `${baseUrl}/s3`,
          forcePathStyle: true,
          region: storageS3Region,
          credentials: {
            accessKeyId: tenantId,
            secretAccessKey,
            sessionToken,
          },
        })
      }

      it.each([
        { name: 'tenantId', secret: () => tenantId },
        { name: 'anon key', secret: (anonKey: string) => anonKey },
      ])('authenticates a request signed with the $name as secret', async ({ secret }) => {
        const anonKey = await anonKeyAsync
        const sessionClient = sessionTokenClient(secret(anonKey), anonKey)

        try {
          const resp = await sessionClient.send(new ListBucketsCommand({}))
          expect(resp.$metadata.httpStatusCode).toBe(200)
        } finally {
          sessionClient.destroy()
        }
      })

      it('rejects a request signed with an unknown secret', async () => {
        const anonKey = await anonKeyAsync
        const sessionClient = sessionTokenClient('unknown-secret', anonKey)

        try {
          await sessionClient.send(new ListBucketsCommand({}))
          throw new Error('Should not reach here')
        } catch (e) {
          expect((e as Error).message).not.toBe('Should not reach here')
          expect((e as S3ServiceException).$metadata.httpStatusCode).toBe(403)
          expect((e as S3ServiceException).name).toBe('SignatureDoesNotMatch')
        } finally {
          sessionClient.destroy()
        }
      })

      it('rejects a valid signature when the session token is not a valid JWT', async () => {
        const sessionClient = sessionTokenClient(tenantId, 'not-a-jwt')

        try {
          await sessionClient.send(new ListBucketsCommand({}))
          throw new Error('Should not reach here')
        } catch (e) {
          expect((e as Error).message).not.toBe('Should not reach here')
          expect((e as S3ServiceException).$metadata.httpStatusCode).toBe(403)
          expect((e as S3ServiceException).name).toBe('AccessDenied')
        } finally {
          sessionClient.destroy()
        }
      })
    })

    describe('S3 Presigned URL', () => {
      it('can call a simple method with presigned url', async () => {
        const bucket = await createBucket(client)
        const bucketVersioningCommand = new GetBucketVersioningCommand({
          Bucket: bucket,
        })
        const signedUrl = await getSignedUrl(client, bucketVersioningCommand, { expiresIn: 100 })
        const resp = await fetch(signedUrl)

        expect(resp.ok).toBeTruthy()
      })

      it('cannot request a presigned url if expired', async () => {
        const bucket = await createBucket(client)
        const bucketVersioningCommand = new GetBucketVersioningCommand({
          Bucket: bucket,
        })
        const signedUrl = await getSignedUrl(client, bucketVersioningCommand, { expiresIn: 1 })
        await wait(1500)
        const resp = await fetch(signedUrl)

        expect(resp.ok).toBeFalsy()
        expect(resp.status).toBe(400)
      })

      it('doesnt crash when invalid headers returned', async () => {
        const bucket = await createBucket(client)
        const key = 'test-1.jpg'
        await uploadFile(client, bucket, key, 2, {
          'invalid-header-r': Buffer.alloc(1024 * 9, 'a').toString(),
        })

        const headObj = new HeadObjectCommand({
          Bucket: bucket,
          Key: key,
        })

        const r = await client.send(headObj)

        expect(r.$metadata.httpStatusCode).toBe(200)
        expect(r.MissingMeta).toBe(1)
      })

      it('can upload with presigned URL', async () => {
        const bucket = await createBucket(client)
        const key = 'test-1.jpg'
        const body = Buffer.alloc(1024 * 2)

        const uploadUrl = await getSignedUrl(
          client,
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
          }),
          { expiresIn: 100 }
        )

        const resp = await undiciFetch(uploadUrl, {
          method: 'PUT',
          body,
          headers: {
            'Content-Length': body.length.toString(),
          },
        })

        expect(resp.ok).toBeTruthy()
      })

      it('keeps metadata hoisted into a presigned upload url', async () => {
        const bucket = await createBucket(client)
        const key = 'test-meta.jpg'
        const body = Buffer.alloc(1024)

        const uploadUrl = await getSignedUrl(
          client,
          new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, Metadata: { foo: 'bar' } }),
          { expiresIn: 100 }
        )
        expect(new URL(uploadUrl).searchParams.get('x-amz-meta-foo')).toBe('bar')

        const resp = await undiciFetch(uploadUrl, {
          method: 'PUT',
          body,
          headers: { 'Content-Length': body.length.toString() },
        })
        expect(resp.status).toBe(200)

        const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
        expect(head.Metadata).toEqual({ foo: 'bar' })
      })

      it('prefers presigned query metadata over a conflicting header', async () => {
        const bucket = await createBucket(client)
        const key = 'test-meta-conflict.jpg'
        const body = Buffer.alloc(1024)

        const uploadUrl = await getSignedUrl(
          client,
          new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, Metadata: { foo: 'bar' } }),
          { expiresIn: 100 }
        )

        const resp = await undiciFetch(uploadUrl, {
          method: 'PUT',
          body,
          headers: { 'Content-Length': body.length.toString(), 'x-amz-meta-foo': 'baz' },
        })
        expect(resp.status).toBe(200)

        const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
        expect(head.Metadata).toEqual({ foo: 'bar' })
      })

      it('routes a presigned copy url to CopyObject', async () => {
        const bucket = await createBucket(client)
        await uploadFile(client, bucket, 'source.jpg', 1)
        await uploadFile(client, bucket, 'dest.jpg', 2)

        const copyUrl = await getSignedUrl(
          client,
          new CopyObjectCommand({
            Bucket: bucket,
            Key: 'dest.jpg',
            CopySource: `${bucket}/source.jpg`,
            MetadataDirective: 'REPLACE',
            Metadata: { copied: 'yes' },
          }),
          { expiresIn: 100 }
        )
        expect(new URL(copyUrl).searchParams.get('x-amz-copy-source')).toBe(`${bucket}/source.jpg`)

        const resp = await undiciFetch(copyUrl, { method: 'PUT' })
        expect(resp.status).toBe(200)

        const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: 'dest.jpg' }))
        expect(head.ContentLength).toBe(1024)
        expect(head.Metadata).toEqual({ copied: 'yes' })
      })

      it('completes a multipart upload through presigned urls', async () => {
        const bucket = await createBucket(client)
        const key = 'presigned-mpu.jpg'
        const body = Buffer.alloc(1024, 'a')

        const createUrl = await getSignedUrl(
          client,
          new CreateMultipartUploadCommand({ Bucket: bucket, Key: key, Metadata: { foo: 'bar' } }),
          { expiresIn: 100 }
        )
        const createResp = await undiciFetch(createUrl, { method: 'POST' })
        expect(createResp.status).toBe(200)
        const uploadId = (await createResp.text()).match(/<UploadId>([^<]+)<\/UploadId>/)?.[1]
        expect(uploadId).toBeTruthy()

        const partUrl = await getSignedUrl(
          client,
          new UploadPartCommand({ Bucket: bucket, Key: key, UploadId: uploadId, PartNumber: 1 }),
          { expiresIn: 100 }
        )
        const partResp = await undiciFetch(partUrl, {
          method: 'PUT',
          body,
          headers: { 'Content-Length': body.length.toString() },
        })
        expect(partResp.status).toBe(200)

        const completeUrl = await getSignedUrl(
          client,
          new CompleteMultipartUploadCommand({ Bucket: bucket, Key: key, UploadId: uploadId }),
          { expiresIn: 100 }
        )
        const completeResp = await undiciFetch(completeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/xml' },
          body:
            '<CompleteMultipartUpload xmlns="http://s3.amazonaws.com/doc/2006-03-01/">' +
            `<Part><PartNumber>1</PartNumber><ETag>${partResp.headers.get('etag')}</ETag></Part>` +
            '</CompleteMultipartUpload>',
        })
        expect(completeResp.status).toBe(200)

        const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
        expect(head.ContentLength).toBe(1024)
        expect(head.Metadata).toEqual({ foo: 'bar' })
      })

      it('can fetch an asset via presigned URL', async () => {
        const bucket = await createBucket(client)
        const key = 'test-1.jpg'

        await uploadFile(client, bucket, key, 2)

        const getUrl = await getSignedUrl(
          client,
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
          }),
          { expiresIn: 100 }
        )

        const resp = await fetch(getUrl)

        expect(resp.ok).toBeTruthy()
      })

      it('ignores an incidental non-SigV4 Authorization header on a presigned GET', async () => {
        // A presigned URL carries its signature in the query string, so an
        // unrelated Authorization header must not be parsed as an S3 signature
        // and must not override it.
        const bucket = await createBucket(client)
        const key = 'test-1.jpg'

        await uploadFile(client, bucket, key, 2)

        const getUrl = await getSignedUrl(
          client,
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
          }),
          { expiresIn: 100 }
        )

        const resp = await fetch(getUrl, {
          headers: {
            Authorization: 'Bearer not-a-sigv4-value',
          },
        })

        expect(resp.ok).toBeTruthy()
      })

      it('ignores an incidental non-SigV4 Authorization header on a presigned upload', async () => {
        const bucket = await createBucket(client)
        const key = 'test-1.jpg'
        const body = Buffer.alloc(1024 * 2)

        const uploadUrl = await getSignedUrl(
          client,
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
          }),
          { expiresIn: 100 }
        )

        const resp = await undiciFetch(uploadUrl, {
          method: 'PUT',
          body,
          headers: {
            'Content-Length': body.length.toString(),
            Authorization: 'Bearer not-a-sigv4-value',
          },
        })

        expect(resp.ok).toBeTruthy()
      })

      it('rejects a non-SigV4 Authorization header when there is no query signature', async () => {
        // Counterpart to the presigned cases above: with no query-string
        // signature to fall through to, a non-SigV4 Authorization header must
        // be rejected rather than silently accepted.
        const bucket = await createBucket(client)

        const resp = await fetch(`${baseUrl}/s3/${bucket}/test-key`, {
          headers: {
            Authorization: 'Bearer not-a-sigv4-value',
          },
        })

        expect(resp.ok).toBeFalsy()
        expect(resp.status).toBe(403)
        expect(await resp.text()).toContain('AccessDenied')
      })

      it('supports response-content-disposition override', async () => {
        const bucket = await createBucket(client)
        const key = 'test-disposition.jpg'

        await uploadFile(client, bucket, key, 2)

        const response = await client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            ResponseContentDisposition: 'attachment; filename="custom-name.txt"',
          })
        )

        expect(response.ContentDisposition).toBe('attachment; filename="custom-name.txt"')
      })

      it('supports response-content-disposition override via presigned URL', async () => {
        const bucket = await createBucket(client)
        const key = 'test-presigned-disposition.jpg'

        await uploadFile(client, bucket, key, 2)

        const getUrl = await getSignedUrl(
          client,
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            ResponseContentDisposition: 'attachment; filename="presigned.pdf"',
          }),
          { expiresIn: 100 }
        )

        const resp = await fetch(getUrl)

        expect(resp.ok).toBeTruthy()
        expect(resp.headers.get('content-disposition')).toBe('attachment; filename="presigned.pdf"')
      })

      it('supports response-content-type override', async () => {
        const bucket = await createBucket(client)
        const key = 'test-content-type.jpg'

        await uploadFile(client, bucket, key, 2)

        const response = await client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            ResponseContentType: 'text/plain',
          })
        )

        expect(response.ContentType).toBe('text/plain')
      })

      it('supports response-cache-control override', async () => {
        const bucket = await createBucket(client)
        const key = 'test-cache-control.jpg'

        await uploadFile(client, bucket, key, 2)

        const response = await client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            ResponseCacheControl: 'no-cache, no-store',
          })
        )

        expect(response.CacheControl).toBe('no-cache, no-store')
      })

      it('supports multiple response overrides simultaneously', async () => {
        const bucket = await createBucket(client)
        const key = 'test-multiple-overrides.jpg'

        await uploadFile(client, bucket, key, 2)

        const response = await client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            ResponseContentDisposition: 'inline; filename="test.txt"',
            ResponseContentType: 'application/octet-stream',
            ResponseCacheControl: 'max-age=0',
            ResponseContentLanguage: 'en-US',
            ResponseContentEncoding: 'gzip',
          })
        )

        expect(response.ContentDisposition).toBe('inline; filename="test.txt"')
        expect(response.ContentType).toBe('application/octet-stream')
        expect(response.CacheControl).toBe('max-age=0')
        expect(response.ContentLanguage).toBe('en-US')
        expect(response.ContentEncoding).toBe('gzip')
      })

      it('supports response-expires override', async () => {
        const bucket = await createBucket(client)
        const key = 'test-expires.jpg'

        await uploadFile(client, bucket, key, 2)

        const expiresDate = new Date('2030-01-01T00:00:00Z')

        const response = await client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            ResponseExpires: expiresDate,
          })
        )

        expect(response.ExpiresString).toEqual(expiresDate.toUTCString())
      })

      it('rejects response-content-disposition with invalid characters', async () => {
        const bucket = await createBucket(client)
        const key = 'test-disposition-reject.jpg'

        await uploadFile(client, bucket, key, 2)

        const response = await client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            ResponseContentDisposition: 'attachment; filename="test\n\r\0.txt"',
          })
        )
        // invalid content-disposition header removed
        expect(response.ContentDisposition).toBeUndefined()
      })

      it('rejects response-content-type with invalid characters', async () => {
        const bucket = await createBucket(client)
        const key = 'test-content-type-reject.jpg'

        await uploadFile(client, bucket, key, 2)

        const response = await client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            ResponseContentType: 'text/html\nX-Evil: injection\r\0',
          })
        )
        // invalid content-type header rejected, default used
        expect(response.ContentType).toBe('image/jpg')
      })

      it('rejects response-cache-control with invalid characters', async () => {
        const bucket = await createBucket(client)
        const key = 'test-cache-control-reject.jpg'

        await uploadFile(client, bucket, key, 2)

        const response = await client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            ResponseCacheControl: 'no-cache\nX-Evil: header\r\0',
          })
        )
        // invalid cache-control header rejected, default used
        expect(response.CacheControl).toBe('no-cache')
      })

      it('rejects response-content-encoding with invalid characters', async () => {
        const bucket = await createBucket(client)
        const key = 'test-content-encoding-reject.jpg'

        await uploadFile(client, bucket, key, 2)

        const response = await client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            ResponseContentEncoding: 'gzip\nX-Evil: header\r\0',
          })
        )
        // invalid content-encoding header removed
        expect(response.ContentEncoding).toBeUndefined()
      })

      it('rejects response-content-language with invalid characters', async () => {
        const bucket = await createBucket(client)
        const key = 'test-content-language-reject.jpg'

        await uploadFile(client, bucket, key, 2)

        const response = await client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            ResponseContentLanguage: 'en-US\nX-Evil: header\r\0',
          })
        )
        // invalid content-language header removed
        expect(response.ContentLanguage).toBeUndefined()
      })
    })
  })
})

describe('Migration compatibility', () => {
  describe('integration', () => {
    const { tenantId } = getConfig()
    let connection: TenantConnection
    let bucketId: string

    beforeAll(async () => {
      const adminUser = await getServiceKeyUser(tenantId)
      connection = await getPostgresConnection({
        tenantId,
        user: adminUser,
        superUser: adminUser,
        host: 'localhost',
      })

      bucketId = randomUUID()
      const db = new StoragePgDB(connection, { tenantId, host: 'localhost' })
      await db.createBucket({ id: bucketId, name: `migration-test-${bucketId}`, public: false })
    })

    afterAll(async () => {
      const db = new StoragePgDB(connection, { tenantId, host: 'localhost' })
      await db.deleteBucket(bucketId)
      connection.dispose()
    })

    const makeDB = (latestMigration?: keyof typeof DBMigration) =>
      new StoragePgDB(connection, { tenantId, host: 'localhost', latestMigration })

    describe('createMultipartUpload', () => {
      it('does not store metadata when latestMigration is before s3-multipart-uploads-metadata', async () => {
        const db = makeDB('fix-optimized-search-function') // migration 56
        const uploadId = randomUUID()
        try {
          const result = await db.createMultipartUpload(
            uploadId,
            bucketId,
            'test-pre-migration.txt',
            randomUUID(),
            'sig',
            undefined,
            undefined,
            {
              cacheControl: 'no-cache',
              contentLength: 0,
              size: 0,
              mimetype: 'text/plain',
              eTag: 'abc',
            }
          )
          expect(result.metadata).toBeNull()
        } finally {
          await makeDB().deleteMultipartUpload(uploadId)
        }
      })

      it('stores metadata when latestMigration is s3-multipart-uploads-metadata', async () => {
        const db = makeDB('s3-multipart-uploads-metadata') // migration 57
        const uploadId = randomUUID()
        const metadata = {
          cacheControl: 'no-cache',
          contentLength: 0,
          size: 0,
          mimetype: 'text/plain',
          eTag: 'abc',
        }
        try {
          const result = await db.createMultipartUpload(
            uploadId,
            bucketId,
            'test-post-migration.txt',
            randomUUID(),
            'sig',
            undefined,
            undefined,
            metadata
          )
          expect(result.metadata).toEqual(metadata)
        } finally {
          await makeDB().deleteMultipartUpload(uploadId)
        }
      })
    })

    describe('findMultipartUpload', () => {
      let uploadId: string

      beforeAll(async () => {
        uploadId = randomUUID()
        const db = makeDB('s3-multipart-uploads-metadata')
        await db.createMultipartUpload(
          uploadId,
          bucketId,
          'test-find.txt',
          randomUUID(),
          'sig',
          undefined,
          undefined,
          {
            cacheControl: 'no-cache',
            contentLength: 0,
            size: 0,
            mimetype: 'text/plain',
            eTag: 'abc',
          }
        )
      })

      afterAll(async () => {
        await makeDB().deleteMultipartUpload(uploadId)
      })

      it('excludes metadata from result when latestMigration is before s3-multipart-uploads-metadata', async () => {
        const db = makeDB('fix-optimized-search-function') // migration 56
        const result = await db.findMultipartUpload(uploadId, 'id,version,metadata')
        expect(result).not.toHaveProperty('metadata')
      })

      it('includes metadata in result when latestMigration is s3-multipart-uploads-metadata', async () => {
        const db = makeDB('s3-multipart-uploads-metadata') // migration 57
        const result = await db.findMultipartUpload(uploadId, 'id,version,metadata')
        expect(result).toHaveProperty('metadata')
      })
    })
  })
})
