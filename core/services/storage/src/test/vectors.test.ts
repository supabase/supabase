import {
  CreateIndexCommandOutput,
  DeleteVectorsOutput,
  GetVectorsCommandOutput,
  ListVectorsOutput,
  PutVectorsOutput,
  QueryVectorsOutput,
} from '@aws-sdk/client-s3vectors'
import { signJWT } from '@internal/auth'
import { ERRORS, ErrorCode } from '@internal/errors'
import { SingleShard } from '@internal/sharding'
import { PgVectorMetadataDB, VectorStore, VectorStoreManager } from '@storage/protocols/vector'
import { FastifyInstance } from 'fastify'
import type { Mocked } from 'vitest'
import app from '../app'
import { getConfig, mergeConfig } from '../config'
import { useMockObject, useMockQueue } from './common'
import { useStorage } from './utils/storage'

const { serviceKeyAsync, vectorS3Buckets, tenantId, jwtSecret } = getConfig()

const vectorBucketS3 = vectorS3Buckets[0]

let appInstance: FastifyInstance
let serviceToken: string
const storageTest = useStorage()

type ListVectorBucketsResponse = Awaited<ReturnType<VectorStoreManager['listBuckets']>>
type GetVectorBucketResponse = Awaited<ReturnType<VectorStoreManager['getBucket']>>
type ListIndexesResponse = Awaited<ReturnType<VectorStoreManager['listIndexes']>>
type ErrorResponse = {
  error: string
}

function parseJsonBody<Body>(body: string): Body {
  return JSON.parse(body) as Body
}

async function findVectorIndex(bucketId: string, name: string) {
  const result = await storageTest.database.connection.query<{
    data_type: string
    dimension: number
    distance_metric: string
    metadata_configuration: unknown
  }>({
    text: `
      SELECT data_type, dimension, distance_metric, metadata_configuration
      FROM storage.vector_indexes
      WHERE bucket_id = $1
        AND name = $2
      LIMIT 1
    `,
    values: [bucketId, name],
  })

  return result.rows[0]
}

async function findVectorBucket(bucketId: string) {
  const result = await storageTest.database.connection.query<{
    id: string
    created_at: Date
  }>({
    text: `
      SELECT id, created_at
      FROM storage.buckets_vectors
      WHERE id = $1
      LIMIT 1
    `,
    values: [bucketId],
  })

  return result.rows[0]
}

// Use the common mock helpers
useMockObject()
useMockQueue()

const { mockVectorStore } = vi.hoisted(() => ({
  mockVectorStore: {
    deleteVectorIndex: vi.fn().mockResolvedValue({} as CreateIndexCommandOutput),
    createVectorIndex: vi.fn().mockResolvedValue({} as CreateIndexCommandOutput),
    putVectors: vi.fn().mockResolvedValue({} as PutVectorsOutput),
    listVectors: vi.fn().mockResolvedValue({} as ListVectorsOutput),
    queryVectors: vi.fn().mockResolvedValue({} as QueryVectorsOutput),
    deleteVectors: vi.fn().mockResolvedValue({} as DeleteVectorsOutput),
    getVectors: vi.fn().mockResolvedValue({} as GetVectorsCommandOutput),
  } as Mocked<VectorStore>,
}))

vi.mock('@storage/protocols/vector/adapter/s3-vector', () => {
  return {
    S3Vector: vi.fn(function () {
      return mockVectorStore
    }),
    createS3VectorClient: vi.fn().mockReturnValue({}),
    ...mockVectorStore,
  }
})

let vectorBucketName: string
let s3Vector: VectorStoreManager

describe('Vectors API', () => {
  beforeAll(async () => {
    appInstance = app()

    // Create service role token
    serviceToken = await serviceKeyAsync

    // Create real S3Vector instance with mocked client and mock DB
    const shard = new SingleShard({
      shardKey: 'test-bucket',
      capacity: 1000,
    })
    const mockVectorDB = new PgVectorMetadataDB(storageTest.database.connection)
    s3Vector = new VectorStoreManager(mockVectorStore, mockVectorDB, shard, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    // Decorate fastify instance with real S3Vector
    appInstance.decorate('s3Vector', s3Vector)
  })

  afterAll(async () => {
    await appInstance.close()
    storageTest.database.connection.dispose()
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetAllMocks()

    getConfig({ reload: true })
    mergeConfig({ vectorMaxBucketsCount: Infinity, vectorMaxIndexesCount: Infinity })

    vectorBucketName = `test-bucket-${Date.now()}`
    await s3Vector.createBucket(vectorBucketName)
  })

  describe('POST /vector/CreateIndex', () => {
    let validCreateIndexRequest: {
      dataType: 'float32'
      dimension: number
      distanceMetric: 'cosine' | 'euclidean'
      indexName: string
      vectorBucketName: string
      metadataConfiguration?: {
        nonFilterableMetadataKeys: string[]
      }
    }
    beforeEach(async () => {
      validCreateIndexRequest = {
        dataType: 'float32',
        dimension: 1536,
        distanceMetric: 'cosine',
        indexName: 'test-index',
        vectorBucketName,
        metadataConfiguration: {
          nonFilterableMetadataKeys: ['key1', 'key2'],
        },
      }
    })

    it('should create vector index successfully with valid request', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: validCreateIndexRequest,
      })

      expect(response.statusCode).toBe(200)

      // Verify the CreateIndexCommand was called with correct parameters including tenantId prefix
      const createIndexCommand = mockVectorStore.createVectorIndex
      expect(createIndexCommand).toHaveBeenCalledWith({
        ...validCreateIndexRequest,
        vectorBucketName: vectorBucketS3,
        indexName: `${tenantId}-test-index`,
      })

      const indexMetadata = await findVectorIndex(
        validCreateIndexRequest.vectorBucketName,
        validCreateIndexRequest.indexName
      )

      expect(indexMetadata).toBeDefined()
      expect(indexMetadata?.data_type).toBe(validCreateIndexRequest.dataType)
      expect(indexMetadata?.dimension).toBe(validCreateIndexRequest.dimension)
      expect(indexMetadata?.distance_metric).toBe(validCreateIndexRequest.distanceMetric)
      expect(indexMetadata?.metadata_configuration).toEqual(
        validCreateIndexRequest.metadataConfiguration
      )
    })

    it('should allow route validation for S3Vectors create index requests with 4096 dimensions', async () => {
      const request = {
        ...validCreateIndexRequest,
        dimension: 4096,
        indexName: 'test-index-4096',
      }

      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: request,
      })

      expect(response.statusCode).toBe(200)
      expect(mockVectorStore.createVectorIndex).toHaveBeenCalledWith({
        ...request,
        vectorBucketName: vectorBucketS3,
        indexName: `${tenantId}-test-index-4096`,
      })
    })

    it('should require authentication with service role', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        payload: validCreateIndexRequest,
      })

      expect(response.statusCode).toBe(403)
      // Vector service not called when validation fails
    })

    it('should reject request with invalid JWT role', async () => {
      const token = await signJWT({ role: 'auth', sub: '1234' }, jwtSecret, '1h')

      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: validCreateIndexRequest,
      })

      expect(response.statusCode).toBe(403)
      // Vector service not called when validation fails
    })

    it('should validate required fields', async () => {
      const incompleteRequest = {
        dataType: 'float32',
        dimension: 1536,
        // missing required fields
      }

      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: incompleteRequest,
      })

      expect(response.statusCode).toBe(400)
      // Vector service not called when validation fails
    })

    it('should validate dataType enum', async () => {
      const invalidRequest = {
        ...validCreateIndexRequest,
        dataType: 'invalid-type',
      }

      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: invalidRequest,
      })

      expect(response.statusCode).toBe(400)
      // Vector service not called when validation fails
    })

    it('should validate distanceMetric enum', async () => {
      const invalidRequest = {
        ...validCreateIndexRequest,
        distanceMetric: 'invalid-metric',
      }

      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: invalidRequest,
      })

      expect(response.statusCode).toBe(400)
      // Vector service not called when validation fails
    })

    it('should validate dimension is a number', async () => {
      const invalidRequest = {
        ...validCreateIndexRequest,
        dimension: 'not-a-number',
      }

      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: invalidRequest,
      })

      expect(response.statusCode).toBe(400)
      // Vector service not called when validation fails
    })

    it('should reject numeric string dimension without coercing it', async () => {
      const invalidRequest = {
        ...validCreateIndexRequest,
        dimension: '1536',
      }

      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: invalidRequest,
      })

      expect(response.statusCode).toBe(400)
      expect(mockVectorStore.createVectorIndex).not.toHaveBeenCalled()
    })

    it.each([
      ['fractional', 3.5],
      ['too large', 4097],
    ])('should reject %s dimension before creating index metadata', async (_label, dimension) => {
      const invalidRequest = {
        ...validCreateIndexRequest,
        dimension,
      }

      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: invalidRequest,
      })

      expect(response.statusCode).toBe(400)
      expect(mockVectorStore.createVectorIndex).not.toHaveBeenCalled()
    })

    it('should validate metadataConfiguration structure', async () => {
      const invalidRequest = {
        ...validCreateIndexRequest,
        metadataConfiguration: {
          // missing required nonFilterableMetadataKeys
          invalidKey: 'value',
        },
      }

      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: invalidRequest,
      })

      expect(response.statusCode).toBe(400)
      // Vector service not called when validation fails
    })

    it.each([
      ['empty nonFilterableMetadataKeys', []],
      ['duplicate nonFilterableMetadataKeys', ['key1', 'key1']],
      ['too many nonFilterableMetadataKeys', Array.from({ length: 11 }, (_, i) => `key-${i}`)],
      ['empty nonFilterableMetadataKeys item', ['']],
      ['too long nonFilterableMetadataKeys item', ['x'.repeat(64)]],
      ['numeric nonFilterableMetadataKeys item', [123]],
    ])('should validate metadataConfiguration %s', async (_label, nonFilterableMetadataKeys) => {
      const invalidRequest = {
        ...validCreateIndexRequest,
        metadataConfiguration: {
          nonFilterableMetadataKeys,
        },
      }

      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: invalidRequest,
      })

      expect(response.statusCode).toBe(400)
      expect(mockVectorStore.createVectorIndex).not.toHaveBeenCalled()
    })

    it('should handle vector service not configured', async () => {
      mergeConfig({ vectorEnabled: false })

      const appWithoutVector = app()

      try {
        const response = await appWithoutVector.inject({
          method: 'POST',
          url: '/vector/CreateIndex',
          headers: {
            authorization: `Bearer ${serviceToken}`,
          },
          payload: validCreateIndexRequest,
        })

        expect(response.statusCode).toBe(404)
        expect(JSON.parse(response.body)).toEqual({
          statusCode: '404',
          error: 'Not Found',
          message: 'Route POST:/vector/CreateIndex not found',
          code: ErrorCode.InvalidRequest,
        })
      } finally {
        await appWithoutVector.close()
      }
    })

    it('should return FeatureNotEnabled when the vector backend is not configured', async () => {
      mergeConfig({ vectorEnabled: true, vectorS3Buckets: [] })

      const appWithoutVector = app()

      try {
        const response = await appWithoutVector.inject({
          method: 'POST',
          url: '/vector/CreateIndex',
          headers: {
            authorization: `Bearer ${serviceToken}`,
          },
          payload: validCreateIndexRequest,
        })

        expect(response.statusCode).toBe(409)
        expect(JSON.parse(response.body)).toMatchObject({
          statusCode: '409',
          code: 'FeatureNotEnabled',
          error: 'FeatureNotEnabled',
        })
      } finally {
        await appWithoutVector.close()
      }
    })

    it('should handle S3Vector service errors', async () => {
      const s3Error = new Error('S3VectorsClient error')
      // Mock error - need to cast to bypass type restrictions
      mockVectorStore.createVectorIndex.mockRejectedValue(s3Error)

      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: validCreateIndexRequest,
      })

      expect(response.statusCode).toBe(500)
      expect(response.json()).toEqual({
        statusCode: '500',
        error: 'Internal',
        message: 'Internal Server Error',
        code: ErrorCode.InternalError,
      })
      expect(mockVectorStore.createVectorIndex).toHaveBeenCalledTimes(1)
    })

    it('should accept valid request without optional metadataConfiguration', async () => {
      const requestWithoutMetadata = {
        dataType: 'float32' as const,
        dimension: 1536,
        distanceMetric: 'euclidean' as const,
        indexName: 'test-index-2',
        vectorBucketName,
      }

      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: requestWithoutMetadata,
      })

      expect(response.statusCode).toBe(200)
      expect(mockVectorStore.createVectorIndex).toHaveBeenCalledTimes(1)
      expect(mockVectorStore.createVectorIndex).toHaveBeenCalledWith({
        ...requestWithoutMetadata,
        vectorBucketName: vectorBucketS3,
        indexName: `${tenantId}-test-index-2`,
      })
    })
  })

  describe('POST /vector/CreateVectorBucket', () => {
    beforeEach(async () => {})

    it('should create vector bucket successfully with valid request', async () => {
      const newBucketName = `test-bucket-${Date.now()}-new`
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateVectorBucket',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName: newBucketName,
        },
      })

      expect(response.statusCode).toBe(200)

      // Verify bucket was created in database
      const bucketRecord = await findVectorBucket(newBucketName)

      expect(bucketRecord).toBeDefined()
      expect(bucketRecord?.id).toBe(newBucketName)
      expect(bucketRecord?.created_at).toBeDefined()
    })

    it('should require authentication with service role', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateVectorBucket',
        payload: {
          vectorBucketName: 'test-bucket',
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should reject request with invalid JWT role', async () => {
      const token = await signJWT({ role: 'auth', sub: '1234' }, jwtSecret, '1h')

      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateVectorBucket',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          vectorBucketName: 'test-bucket',
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should validate required fields', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateVectorBucket',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {},
      })

      expect(response.statusCode).toBe(400)
    })

    it('should reject numeric bucket names without coercing them', async () => {
      const numericBucketName = Date.now()

      try {
        const response = await appInstance.inject({
          method: 'POST',
          url: '/vector/CreateVectorBucket',
          headers: {
            authorization: `Bearer ${serviceToken}`,
          },
          payload: {
            vectorBucketName: numericBucketName,
          },
        })

        expect(response.statusCode).toBe(400)
      } finally {
        await s3Vector.deleteBucket(String(numericBucketName)).catch(() => undefined)
      }
    })

    it('should return conflict for duplicate bucket creation', async () => {
      // First creation
      const newVectorBucketName = `test-bucket-${Date.now()}-dup`
      const response1 = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateVectorBucket',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName: newVectorBucketName,
        },
      })

      expect(response1.statusCode).toBe(200)

      // Second creation should return conflict
      const response2 = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateVectorBucket',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName: newVectorBucketName,
        },
      })

      expect(response2.statusCode).toBe(409)
    })
  })

  describe('POST /vector/DeleteVectorBucket', () => {
    beforeEach(async () => {})
    it('should delete empty vector bucket successfully', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/DeleteVectorBucket',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
        },
      })

      expect(response.statusCode).toBe(200)

      // Verify bucket was deleted from database
      const bucketRecord = await findVectorBucket(vectorBucketName)

      expect(bucketRecord).toBeUndefined()
    })

    it('should fail when trying to delete bucket with indexes', async () => {
      // First create an index in the bucket
      await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          dataType: 'float32',
          dimension: 1536,
          distanceMetric: 'cosine',
          indexName: 'test-index',
          vectorBucketName,
        },
      })

      // Try to delete the bucket
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/DeleteVectorBucket',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body) as ErrorResponse
      expect(body.error).toBe('VectorBucketNotEmpty')
    })

    it('should require authentication with service role', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/DeleteVectorBucket',
        payload: {
          vectorBucketName,
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should validate required fields', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/DeleteVectorBucket',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {},
      })

      expect(response.statusCode).toBe(400)
    })

    it('should reject numeric bucket names without coercing and deleting them', async () => {
      const numericBucketName = Date.now()
      await s3Vector.createBucket(String(numericBucketName))

      try {
        const response = await appInstance.inject({
          method: 'POST',
          url: '/vector/DeleteVectorBucket',
          headers: {
            authorization: `Bearer ${serviceToken}`,
          },
          payload: {
            vectorBucketName: numericBucketName,
          },
        })

        expect(response.statusCode).toBe(400)

        const bucketRecord = await findVectorBucket(String(numericBucketName))

        expect(bucketRecord).toBeDefined()
      } finally {
        await s3Vector.deleteBucket(String(numericBucketName))
      }
    })

    it('should handle non-existent bucket', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/DeleteVectorBucket',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName: 'non-existent-bucket',
        },
      })

      expect(response.statusCode).toBe(200)
    })
  })

  describe('POST /vector/ListVectorBuckets', () => {
    beforeEach(async () => {
      // Create multiple buckets for listing
      await s3Vector.createBucket(`test-bucket-a-${Date.now()}`)
      await s3Vector.createBucket(`test-bucket-b-${Date.now()}`)
      await s3Vector.createBucket(`test-bucket-c-${Date.now()}`)
    })

    it('should list all vector buckets', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectorBuckets',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {},
      })

      expect(response.statusCode).toBe(200)
      const body = parseJsonBody<ListVectorBucketsResponse>(response.body)
      expect(body.vectorBuckets).toBeDefined()
      expect(Array.isArray(body.vectorBuckets)).toBe(true)
      expect(body.vectorBuckets.length).toBeGreaterThan(0)

      // Verify structure of bucket objects
      body.vectorBuckets.forEach((bucket) => {
        expect(bucket.vectorBucketName).toBeDefined()
        expect(bucket.creationTime).toBeDefined()
        expect(typeof bucket.creationTime).toBe('number')
      })
    })

    it('should support maxResults parameter', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectorBuckets',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          maxResults: 2,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body) as ListVectorBucketsResponse
      expect(body.vectorBuckets.length).toBeLessThanOrEqual(2)
      if (body.vectorBuckets.length === 2) {
        expect(body.nextToken).toBeDefined()
      }
    })

    it('should reject numeric and stringified controls without coercing them', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectorBuckets',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          maxResults: '1',
          nextToken: 123,
          prefix: 456,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should support pagination with nextToken', async () => {
      const response1 = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectorBuckets',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          maxResults: 1,
        },
      })

      const body1 = JSON.parse(response1.body)

      if (body1.nextToken) {
        const response2 = await appInstance.inject({
          method: 'POST',
          url: '/vector/ListVectorBuckets',
          headers: {
            authorization: `Bearer ${serviceToken}`,
          },
          payload: {
            maxResults: 1,
            nextToken: body1.nextToken,
          },
        })

        expect(response2.statusCode).toBe(200)
        const body2 = JSON.parse(response2.body)
        expect(body2.vectorBuckets).toBeDefined()

        // Ensure different buckets are returned
        if (body2.vectorBuckets.length > 0) {
          expect(body1.vectorBuckets[0].vectorBucketName).not.toBe(
            body2.vectorBuckets[0].vectorBucketName
          )
        }
      }
    })

    it('should support prefix filtering', async () => {
      const prefix = 'test-bucket-a'
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectorBuckets',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          prefix,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = parseJsonBody<ListVectorBucketsResponse>(response.body)
      body.vectorBuckets.forEach((bucket) => {
        expect(bucket.vectorBucketName).toMatch(new RegExp(`^${prefix}`))
      })
    })

    it('supports prefix filtering with nextToken for buckets', async () => {
      const runId = Date.now().toString(36)
      const prefix = `page-bucket-${runId}`
      const firstBucket = `${prefix}-a`
      const secondBucket = `${prefix}-b`

      await s3Vector.createBucket(firstBucket)
      await s3Vector.createBucket(secondBucket)
      await s3Vector.createBucket(`other-${runId}-bucket`)

      const page1Response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectorBuckets',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          prefix,
          maxResults: 1,
        },
      })

      expect(page1Response.statusCode).toBe(200)
      const page1 = JSON.parse(page1Response.body)
      expect(page1.vectorBuckets).toHaveLength(1)
      expect(page1.vectorBuckets[0].vectorBucketName.startsWith(prefix)).toBe(true)
      expect(page1.nextToken).toBeDefined()

      const page2Response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectorBuckets',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          prefix,
          maxResults: 1,
          nextToken: page1.nextToken,
        },
      })

      expect(page2Response.statusCode).toBe(200)
      const page2 = JSON.parse(page2Response.body)
      expect(page2.vectorBuckets).toHaveLength(1)
      expect(page2.vectorBuckets[0].vectorBucketName.startsWith(prefix)).toBe(true)
      expect(page2.vectorBuckets[0].vectorBucketName).not.toBe(
        page1.vectorBuckets[0].vectorBucketName
      )
    })

    it('returns nextToken only on truncated bucket pages', async () => {
      const runId = Date.now().toString(36)
      const prefix = `terminal-bucket-${runId}`

      await s3Vector.createBucket(`${prefix}-a`)
      await s3Vector.createBucket(`${prefix}-b`)

      const page1Response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectorBuckets',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          prefix,
          maxResults: 1,
        },
      })

      expect(page1Response.statusCode).toBe(200)
      const page1 = JSON.parse(page1Response.body)
      expect(page1.nextToken).toBeDefined()

      const page2Response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectorBuckets',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          prefix,
          maxResults: 1,
          nextToken: page1.nextToken,
        },
      })

      expect(page2Response.statusCode).toBe(200)
      const page2 = JSON.parse(page2Response.body)
      expect(page2.vectorBuckets).toHaveLength(1)
      expect(page2.nextToken).toBeUndefined()
    })

    it('treats % as a literal character in bucket prefix filtering', async () => {
      const runId = Date.now().toString(36)
      const prefix = `%literal-${runId}`
      const matchingBucket = `${prefix}-bucket`
      const nonMatchingBucket = `x${prefix}-bucket`

      await s3Vector.createBucket(matchingBucket)
      await s3Vector.createBucket(nonMatchingBucket)

      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectorBuckets',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          prefix,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = parseJsonBody<ListVectorBucketsResponse>(response.body)
      const names = body.vectorBuckets.map((bucket) => bucket.vectorBucketName)
      expect(names).toContain(matchingBucket)
      expect(names).not.toContain(nonMatchingBucket)
    })

    it('treats _ as a literal character in bucket prefix filtering', async () => {
      const runId = Date.now().toString(36)
      const prefix = `_literal-${runId}`
      const matchingBucket = `${prefix}-bucket`
      const nonMatchingBucket = `aliteral-${runId}-bucket`

      await s3Vector.createBucket(matchingBucket)
      await s3Vector.createBucket(nonMatchingBucket)

      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectorBuckets',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          prefix,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = parseJsonBody<ListVectorBucketsResponse>(response.body)
      const names = body.vectorBuckets.map((bucket) => bucket.vectorBucketName)
      expect(names).toContain(matchingBucket)
      expect(names).not.toContain(nonMatchingBucket)
    })

    it('should require authentication with service role', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectorBuckets',
        payload: {},
      })

      expect(response.statusCode).toBe(403)
    })
  })

  describe('POST /vector/GetVectorBucket', () => {
    it('should get vector bucket details successfully', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/GetVectorBucket',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body) as GetVectorBucketResponse
      expect(body.vectorBucket).toBeDefined()
      expect(body.vectorBucket.vectorBucketName).toBe(vectorBucketName)
      expect(body.vectorBucket.creationTime).toBeDefined()
      expect(typeof body.vectorBucket.creationTime).toBe('number')
    })

    it('should require authentication with service role', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/GetVectorBucket',
        payload: {
          vectorBucketName,
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should validate required fields', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/GetVectorBucket',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {},
      })

      expect(response.statusCode).toBe(400)
    })

    it('should reject numeric bucket names without coercing them', async () => {
      const numericBucketName = Date.now()
      await s3Vector.createBucket(String(numericBucketName))

      try {
        const response = await appInstance.inject({
          method: 'POST',
          url: '/vector/GetVectorBucket',
          headers: {
            authorization: `Bearer ${serviceToken}`,
          },
          payload: {
            vectorBucketName: numericBucketName,
          },
        })

        expect(response.statusCode).toBe(400)
      } finally {
        await s3Vector.deleteBucket(String(numericBucketName))
      }
    })

    it('should handle non-existent bucket', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/GetVectorBucket',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName: 'non-existent-bucket',
        },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('POST /vector/DeleteIndex', () => {
    let indexName: string

    beforeEach(async () => {
      vectorBucketName = `test-delete-index-${Date.now()}`
      await s3Vector.createBucket(vectorBucketName)

      indexName = `test-index-${Date.now()}`
      // Create an index first

      await s3Vector.createVectorIndex({
        dataType: 'float32',
        dimension: 1536,
        distanceMetric: 'cosine',
        indexName,
        vectorBucketName,
      })
    })

    it('should delete vector index successfully', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/DeleteIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          indexName,
          vectorBucketName,
        },
      })

      expect(response.statusCode).toBe(200)

      // Verify the index was deleted from database
      const indexRecord = await findVectorIndex(vectorBucketName, indexName)

      expect(indexRecord).toBeUndefined()

      // Verify deleteVectorIndex was called with correct parameters
      expect(mockVectorStore.deleteVectorIndex).toHaveBeenCalledWith({
        vectorBucketName: vectorBucketS3,
        indexName: `${tenantId}-${indexName}`,
      })
    })

    it('should require authentication with service role', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/DeleteIndex',
        payload: {
          indexName,
          vectorBucketName,
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should validate required fields', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/DeleteIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          indexName,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should reject numeric index names without coercing and deleting them', async () => {
      const numericIndexName = Date.now()
      await s3Vector.createVectorIndex({
        dataType: 'float32',
        dimension: 1536,
        distanceMetric: 'cosine',
        indexName: String(numericIndexName),
        vectorBucketName,
      })

      try {
        const response = await appInstance.inject({
          method: 'POST',
          url: '/vector/DeleteIndex',
          headers: {
            authorization: `Bearer ${serviceToken}`,
          },
          payload: {
            indexName: numericIndexName,
            vectorBucketName,
          },
        })

        expect(response.statusCode).toBe(400)

        const indexRecord = await findVectorIndex(vectorBucketName, String(numericIndexName))

        expect(indexRecord).toBeDefined()
      } finally {
        await s3Vector
          .deleteIndex({
            indexName: String(numericIndexName),
            vectorBucketName,
          })
          .catch(() => undefined)
      }
    })

    it('should validate indexName pattern', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/DeleteIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          indexName: 'INVALID_NAME',
          vectorBucketName,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle non-existent index', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/DeleteIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          indexName: 'non-existent-index',
          vectorBucketName,
        },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('POST /vector/ListIndexes', () => {
    beforeEach(async () => {
      // Create multiple indexes for listing
      await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          dataType: 'float32',
          dimension: 1536,
          distanceMetric: 'cosine',
          indexName: `index-a-${Date.now()}`,
          vectorBucketName,
        },
      })

      await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          dataType: 'float32',
          dimension: 768,
          distanceMetric: 'euclidean',
          indexName: `index-b-${Date.now()}`,
          vectorBucketName,
        },
      })
    })

    it('should list all indexes in a bucket', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListIndexes',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = parseJsonBody<ListIndexesResponse>(response.body)
      expect(body.indexes).toBeDefined()
      expect(Array.isArray(body.indexes)).toBe(true)
      expect(body.indexes.length).toBeGreaterThanOrEqual(2)

      // Verify structure of index objects
      body.indexes.forEach((index) => {
        expect(index.indexName).toBeDefined()
        expect(index.vectorBucketName).toBe(vectorBucketName)
        expect(index.creationTime).toBeDefined()
        expect(typeof index.creationTime).toBe('number')
      })
    })

    it('should support maxResults parameter', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListIndexes',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          maxResults: 1,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body) as ListIndexesResponse
      expect(body.indexes.length).toBeLessThanOrEqual(1)
    })

    it('should reject numeric and stringified controls without coercing them', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListIndexes',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          maxResults: '1',
          nextToken: 123,
          prefix: 456,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('supports pagination with nextToken for indexes', async () => {
      const page1Response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListIndexes',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          maxResults: 1,
        },
      })

      expect(page1Response.statusCode).toBe(200)
      const page1 = JSON.parse(page1Response.body)
      expect(page1.indexes).toHaveLength(1)
      expect(page1.nextToken).toBeDefined()

      const page2Response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListIndexes',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          maxResults: 1,
          nextToken: page1.nextToken,
        },
      })

      expect(page2Response.statusCode).toBe(200)
      const page2 = JSON.parse(page2Response.body)
      expect(page2.indexes).toHaveLength(1)
      expect(page2.indexes[0].indexName).not.toBe(page1.indexes[0].indexName)
    })

    it('should support prefix filtering', async () => {
      const prefix = 'index-a'
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListIndexes',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          prefix,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = parseJsonBody<ListIndexesResponse>(response.body)
      body.indexes.forEach((index) => {
        expect(index.indexName).toMatch(new RegExp(`^${prefix}`))
      })
    })

    it('supports prefix filtering with nextToken for indexes', async () => {
      const runId = Date.now().toString(36)
      const prefix = `page-index-${runId}`

      const createFirstResponse = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          dataType: 'float32',
          dimension: 128,
          distanceMetric: 'cosine',
          indexName: `${prefix}-a`,
          vectorBucketName,
        },
      })
      expect(createFirstResponse.statusCode).toBe(200)

      const createSecondResponse = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          dataType: 'float32',
          dimension: 128,
          distanceMetric: 'cosine',
          indexName: `${prefix}-b`,
          vectorBucketName,
        },
      })
      expect(createSecondResponse.statusCode).toBe(200)

      const page1Response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListIndexes',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          prefix,
          maxResults: 1,
        },
      })

      expect(page1Response.statusCode).toBe(200)
      const page1 = JSON.parse(page1Response.body)
      expect(page1.indexes).toHaveLength(1)
      expect(page1.indexes[0].indexName.startsWith(prefix)).toBe(true)
      expect(page1.nextToken).toBeDefined()

      const page2Response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListIndexes',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          prefix,
          maxResults: 1,
          nextToken: page1.nextToken,
        },
      })

      expect(page2Response.statusCode).toBe(200)
      const page2 = JSON.parse(page2Response.body)
      expect(page2.indexes).toHaveLength(1)
      expect(page2.indexes[0].indexName.startsWith(prefix)).toBe(true)
      expect(page2.indexes[0].indexName).not.toBe(page1.indexes[0].indexName)
    })

    it('returns nextToken only on truncated index pages', async () => {
      const runId = Date.now().toString(36)
      const prefix = `terminal-index-${runId}`

      const createFirstResponse = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          dataType: 'float32',
          dimension: 128,
          distanceMetric: 'cosine',
          indexName: `${prefix}-a`,
          vectorBucketName,
        },
      })
      expect(createFirstResponse.statusCode).toBe(200)

      const createSecondResponse = await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          dataType: 'float32',
          dimension: 128,
          distanceMetric: 'cosine',
          indexName: `${prefix}-b`,
          vectorBucketName,
        },
      })
      expect(createSecondResponse.statusCode).toBe(200)

      const page1Response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListIndexes',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          prefix,
          maxResults: 1,
        },
      })

      expect(page1Response.statusCode).toBe(200)
      const page1 = JSON.parse(page1Response.body)
      expect(page1.nextToken).toBeDefined()

      const page2Response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListIndexes',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          prefix,
          maxResults: 1,
          nextToken: page1.nextToken,
        },
      })

      expect(page2Response.statusCode).toBe(200)
      const page2 = JSON.parse(page2Response.body)
      expect(page2.indexes).toHaveLength(1)
      expect(page2.nextToken).toBeUndefined()
    })

    it('treats % as a literal character in index prefix filtering', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListIndexes',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          prefix: '%',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.indexes).toHaveLength(0)
    })

    it('treats _ as a literal character in index prefix filtering', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListIndexes',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          prefix: '_',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.indexes).toHaveLength(0)
    })

    it('should require authentication with service role', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListIndexes',
        payload: {
          vectorBucketName,
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should validate required fields', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListIndexes',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {},
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('POST /vector/GetIndex', () => {
    let indexName: string

    beforeEach(async () => {
      indexName = `test-index-${Date.now()}`
      await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          dataType: 'float32',
          dimension: 1536,
          distanceMetric: 'cosine',
          indexName,
          vectorBucketName,
          metadataConfiguration: {
            nonFilterableMetadataKeys: ['key1'],
          },
        },
      })
    })

    it('should get index details successfully', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/GetIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          indexName,
          vectorBucketName,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.index).toBeDefined()
      expect(body.index.indexName).toBe(indexName)
      expect(body.index.vectorBucketName).toBe(vectorBucketName)
      expect(body.index.dataType).toBe('float32')
      expect(body.index.dimension).toBe(1536)
      expect(body.index.distanceMetric).toBe('cosine')
      expect(body.index.metadataConfiguration).toEqual({
        nonFilterableMetadataKeys: ['key1'],
      })
      expect(body.index.creationTime).toBeDefined()
      expect(typeof body.index.creationTime).toBe('number')
    })

    it('should require authentication with service role', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/GetIndex',
        payload: {
          indexName,
          vectorBucketName,
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should validate required fields', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/GetIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          indexName,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should reject numeric index names without coercing them', async () => {
      const numericIndexName = Date.now()
      await s3Vector.createVectorIndex({
        dataType: 'float32',
        dimension: 1536,
        distanceMetric: 'cosine',
        indexName: String(numericIndexName),
        vectorBucketName,
        metadataConfiguration: {
          nonFilterableMetadataKeys: ['key1'],
        },
      })

      try {
        const response = await appInstance.inject({
          method: 'POST',
          url: '/vector/GetIndex',
          headers: {
            authorization: `Bearer ${serviceToken}`,
          },
          payload: {
            indexName: numericIndexName,
            vectorBucketName,
          },
        })

        expect(response.statusCode).toBe(400)
      } finally {
        await s3Vector
          .deleteIndex({
            indexName: String(numericIndexName),
            vectorBucketName,
          })
          .catch(() => undefined)
      }
    })

    it('should validate indexName pattern', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/GetIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          indexName: 'INVALID_NAME',
          vectorBucketName,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle non-existent index', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/GetIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          indexName: 'non-existent-index',
          vectorBucketName,
        },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('POST /vector/PutVectors', () => {
    let indexName: string

    beforeEach(async () => {
      indexName = `test-index-${Date.now()}`
      await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          dataType: 'float32',
          dimension: 3,
          distanceMetric: 'cosine',
          indexName,
          vectorBucketName,
        },
      })

      mockVectorStore.putVectors.mockResolvedValue({
        vectorKeys: [{ key: 'vec1' }, { key: 'vec2' }],
      } as PutVectorsOutput)
    })

    it('should put vector successfully', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/PutVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          vectors: [
            {
              key: 'vec1',
              data: {
                float32: [1.0, 2.0, 3.0],
              },
              metadata: {
                active: true,
                category: 'test',
                score: 0.75,
              },
            },
            {
              key: 'vec2',
              data: {
                float32: [4.0, 5.0, 6.0],
              },
            },
          ],
        },
      })

      expect(response.statusCode).toBe(200)

      // Verify putVectors was called with correct parameters
      expect(mockVectorStore.putVectors).toHaveBeenCalledWith({
        indexName: `${tenantId}-${indexName}`,
        vectors: [
          {
            key: 'vec1',
            data: {
              float32: [1.0, 2.0, 3.0],
            },
            metadata: {
              active: true,
              category: 'test',
              score: 0.75,
            },
          },
          {
            key: 'vec2',
            data: {
              float32: [4.0, 5.0, 6.0],
            },
          },
        ],
        vectorBucketName: vectorBucketS3,
      })
    })

    it('should accept list-valued metadata', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/PutVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          vectors: [
            {
              key: 'vec-list-metadata',
              data: {
                float32: [1.0, 2.0, 3.0],
              },
              metadata: {
                active: true,
                tags: ['docs', 'search', 2026, false],
              },
            },
          ],
        },
      })

      expect(response.statusCode).toBe(200)
      expect(mockVectorStore.putVectors).toHaveBeenCalledWith({
        indexName: `${tenantId}-${indexName}`,
        vectors: [
          {
            key: 'vec-list-metadata',
            data: {
              float32: [1.0, 2.0, 3.0],
            },
            metadata: {
              active: true,
              tags: ['docs', 'search', 2026, false],
            },
          },
        ],
        vectorBucketName: vectorBucketS3,
      })
    })

    it('should require authentication with service role', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/PutVectors',
        payload: {
          vectorBucketName,
          indexName,
          vector: [
            {
              data: {
                float32: [1.0, 2.0, 3.0],
              },
            },
          ],
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should validate required fields', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/PutVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should validate vector data structure', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/PutVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          vector: [
            {
              data: {
                // missing float32
              },
            },
          ],
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return InvalidRequest for route validation failures', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/PutVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          vectors: [
            {
              key: 'invalid-data',
              data: {
                float32: ['1.0', 2.0, 3.0],
              },
            },
          ],
        },
      })

      expect(response.statusCode).toBe(400)
      expect(parseJsonBody(response.body)).toMatchObject({
        statusCode: '400',
        code: 'InvalidRequest',
      })
      expect(mockVectorStore.putVectors).not.toHaveBeenCalled()
    })

    it('should reject empty float32 data before calling the vector store', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/PutVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          vectors: [
            {
              key: 'empty-data',
              data: {
                float32: [],
              },
            },
          ],
        },
      })

      expect(response.statusCode).toBe(400)
      expect(parseJsonBody(response.body)).toMatchObject({
        statusCode: '400',
        code: 'InvalidRequest',
      })
      expect(response.body).toContain('float32')
      expect(mockVectorStore.putVectors).not.toHaveBeenCalled()
    })

    it('should reject missing vector keys before calling the vector store', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/PutVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          vectors: [
            {
              data: {
                float32: [1.0, 2.0, 3.0],
              },
            },
          ],
        },
      })

      expect(response.statusCode).toBe(400)
      expect(parseJsonBody(response.body)).toMatchObject({
        statusCode: '400',
        code: 'InvalidRequest',
      })
      expect(response.body).toContain('key')
      expect(mockVectorStore.putVectors).not.toHaveBeenCalled()
    })

    it('should reject empty vector keys before calling the vector store', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/PutVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          vectors: [
            {
              key: '',
              data: {
                float32: [1.0, 2.0, 3.0],
              },
            },
          ],
        },
      })

      expect(response.statusCode).toBe(400)
      expect(parseJsonBody(response.body)).toMatchObject({
        statusCode: '400',
        code: 'InvalidRequest',
      })
      expect(response.body).toContain('key')
      expect(mockVectorStore.putVectors).not.toHaveBeenCalled()
    })

    it('should reject vector keys above the S3Vectors length limit before calling the vector store', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/PutVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          vectors: [
            {
              key: 'x'.repeat(1025),
              data: {
                float32: [1.0, 2.0, 3.0],
              },
            },
          ],
        },
      })

      expect(response.statusCode).toBe(400)
      expect(parseJsonBody(response.body)).toMatchObject({
        statusCode: '400',
        code: 'InvalidRequest',
      })
      expect(mockVectorStore.putVectors).not.toHaveBeenCalled()
    })

    it('should reject nested metadata objects before calling the vector store', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/PutVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          vectors: [
            {
              key: 'nested-metadata',
              data: {
                float32: [1.0, 2.0, 3.0],
              },
              metadata: {
                nested: {
                  value: 'not supported',
                },
              },
            },
          ],
        },
      })

      expect(response.statusCode).toBe(400)
      expect(parseJsonBody(response.body)).toMatchObject({
        statusCode: '400',
        code: 'InvalidRequest',
      })
      expect(mockVectorStore.putVectors).not.toHaveBeenCalled()
    })

    it('should reject oversized filterable metadata before calling the vector store', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/PutVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          vectors: [
            {
              key: 'vec-large-metadata',
              data: {
                float32: [1.0, 2.0, 3.0],
              },
              metadata: {
                large: 'x'.repeat(2_050),
              },
            },
          ],
        },
      })

      expect(response.statusCode).toBe(400)
      expect(parseJsonBody(response.body)).toMatchObject({
        statusCode: '400',
        code: 'InvalidParameter',
        message:
          "Invalid record for key 'vec-large-metadata': Filterable metadata must have at most 2048 bytes",
      })
      expect(mockVectorStore.putVectors).not.toHaveBeenCalled()
    })

    it('should validate maxItems limit', async () => {
      const tooManyVectors = Array.from({ length: 501 }, (_, i) => ({
        key: `vec-${i}`,
        data: {
          float32: [1.0, 2.0, 3.0],
        },
      }))

      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/PutVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          vectors: tooManyVectors,
        },
      })

      expect(response.statusCode).toBe(400)
      expect(response.body).toContain('must NOT have more than 500 items')
      expect(mockVectorStore.putVectors).not.toHaveBeenCalled()
    })

    it('should handle non-existent index', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/PutVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName: 'non-existent-index',
          vectors: [
            {
              key: 'vec1',
              data: {
                float32: [1.0, 2.0, 3.0],
              },
            },
          ],
        },
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return validation failures from the vector store as HTTP 400', async () => {
      const message =
        "Invalid record for key '5797803-0': Filterable metadata must have at most 2048 bytes"
      mockVectorStore.putVectors.mockRejectedValueOnce(
        ERRORS.InvalidParameter(indexName, { message })
      )

      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/PutVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          vectors: [
            {
              key: '5797803-0',
              data: {
                float32: [1.0, 2.0, 3.0],
              },
            },
          ],
        },
      })

      expect(response.statusCode).toBe(400)
      expect(parseJsonBody(response.body)).toMatchObject({
        statusCode: '400',
        code: 'InvalidParameter',
        error: 'InvalidParameter',
        message,
      })
    })
  })

  describe('POST /vector/QueryVectors', () => {
    let indexName: string

    beforeEach(async () => {
      indexName = `test-index-${Date.now()}`
      await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          dataType: 'float32',
          dimension: 3,
          distanceMetric: 'cosine',
          indexName,
          vectorBucketName,
        },
      })

      mockVectorStore.queryVectors.mockResolvedValue({
        vectors: [
          {
            key: 'vec1',
            distance: 0.95,
          },
        ],
      } as QueryVectorsOutput)
    })

    it('should query vector successfully', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/QueryVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          queryVector: {
            float32: [1.0, 2.0, 3.0],
          },
          topK: 10,
          returnDistance: true,
          returnMetadata: true,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.vectors).toBeDefined()

      // Verify queryVectors was called with correct parameters
      expect(mockVectorStore.queryVectors).toHaveBeenCalledWith({
        vectorBucketName: vectorBucketS3,
        indexName: `${tenantId}-${indexName}`,
        indexArn: undefined,
        nextToken: undefined,
        queryVector: {
          float32: [1.0, 2.0, 3.0],
        },
        topK: 10,
        returnDistance: true,
        returnMetadata: true,
        filter: undefined,
      })
    })

    it('should accept topK at the S3-compatible maximum', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/QueryVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          queryVector: {
            float32: [1.0, 2.0, 3.0],
          },
          topK: 10_000,
        },
      })

      expect(response.statusCode).toBe(200)
      expect(mockVectorStore.queryVectors).toHaveBeenCalledWith(
        expect.objectContaining({ topK: 10_000 })
      )
    })

    it('should forward and return query pagination tokens', async () => {
      const nextToken = 'x'.repeat(4_096)
      mockVectorStore.queryVectors.mockResolvedValueOnce({
        vectors: [],
        distanceMetric: 'cosine',
        nextToken: 'next-page-token',
      } as QueryVectorsOutput)

      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/QueryVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          nextToken,
          queryVector: {
            float32: [1.0, 2.0, 3.0],
          },
          topK: 10_000,
        },
      })

      expect(response.statusCode).toBe(200)
      expect(parseJsonBody<QueryVectorsOutput>(response.body)).toMatchObject({
        vectors: [],
        distanceMetric: 'cosine',
        nextToken: 'next-page-token',
      })
      expect(mockVectorStore.queryVectors).toHaveBeenCalledWith(
        expect.objectContaining({ nextToken, topK: 10_000 })
      )
    })

    it('should support metadata filtering', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/QueryVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          queryVector: {
            float32: [1.0, 2.0, 3.0],
          },
          topK: 5,
          filter: {
            category: 'test',
          },
        },
      })

      expect(response.statusCode).toBe(200)
      expect(mockVectorStore.queryVectors).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: {
            category: 'test',
          },
        })
      )
    })

    it('should support complex logical filters', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/QueryVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          queryVector: {
            float32: [1.0, 2.0, 3.0],
          },
          topK: 5,
          filter: {
            $and: [{ category: 'test' }, { score: { $gt: 0.5 } }],
          },
        },
      })

      expect(response.statusCode).toBe(200)
      expect(mockVectorStore.queryVectors).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: {
            $and: [{ category: 'test' }, { score: { $gt: 0.5 } }],
          },
        })
      )
    })

    it('should reject reserved logical operator keys used as field names', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/QueryVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          queryVector: {
            float32: [1.0, 2.0, 3.0],
          },
          topK: 5,
          filter: {
            $and: true,
          },
        },
      })

      expect(response.statusCode).toBe(400)
      expect(mockVectorStore.queryVectors).not.toHaveBeenCalled()
    })

    it('should reject topK above the documented maximum before calling the vector store', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/QueryVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          queryVector: {
            float32: [1.0, 2.0, 3.0],
          },
          topK: 10_001,
        },
      })

      expect(response.statusCode).toBe(400)
      expect(parseJsonBody(response.body)).toMatchObject({
        statusCode: '400',
        code: 'InvalidRequest',
      })
      expect(response.body).toContain('topK')
      expect(mockVectorStore.queryVectors).not.toHaveBeenCalled()
    })

    it.each([
      { label: 'empty', nextToken: '' },
      { label: 'longer than 4096 characters', nextToken: 'x'.repeat(4_097) },
    ])('should reject a $label nextToken before calling the vector store', async ({
      nextToken,
    }) => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/QueryVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          nextToken,
          queryVector: {
            float32: [1.0, 2.0, 3.0],
          },
          topK: 10,
        },
      })

      expect(response.statusCode).toBe(400)
      expect(response.body).toContain('nextToken')
      expect(mockVectorStore.queryVectors).not.toHaveBeenCalled()
    })

    it('should reject fractional topK before calling the vector store', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/QueryVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          queryVector: {
            float32: [1.0, 2.0, 3.0],
          },
          topK: 1.5,
        },
      })

      expect(response.statusCode).toBe(400)
      expect(parseJsonBody(response.body)).toMatchObject({
        statusCode: '400',
        code: 'InvalidRequest',
      })
      expect(response.body).toContain('topK')
      expect(mockVectorStore.queryVectors).not.toHaveBeenCalled()
    })

    it('should require authentication with service role', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/QueryVectors',
        payload: {
          vectorBucketName,
          indexName,
          queryVector: {
            float32: [1.0, 2.0, 3.0],
          },
          topK: 10,
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should validate required fields', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/QueryVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          queryVector: {
            float32: [1.0, 2.0, 3.0],
          },
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should validate queryVector structure', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/QueryVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          queryVector: {
            // missing float32
          },
          topK: 10,
        },
      })

      expect(response.statusCode).toBe(400)
      const body = parseJsonBody<{ message: string }>(response.body)
      expect(body.message).toContain('queryVector')
      expect(body.message).toContain('float32')
    })

    it('should reject empty queryVector.float32 before calling the vector store', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/QueryVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          queryVector: {
            float32: [],
          },
          topK: 10,
        },
      })

      expect(response.statusCode).toBe(400)
      expect(parseJsonBody(response.body)).toMatchObject({
        statusCode: '400',
        code: 'InvalidRequest',
      })
      expect(response.body).toContain('float32')
      expect(mockVectorStore.queryVectors).not.toHaveBeenCalled()
    })

    it('should handle non-existent index', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/QueryVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName: 'non-existent-index',
          queryVector: {
            float32: [1.0, 2.0, 3.0],
          },
          topK: 10,
        },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('POST /vector/DeleteVectors', () => {
    let indexName: string

    beforeEach(async () => {
      indexName = `test-index-${Date.now()}`
      await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          dataType: 'float32',
          dimension: 3,
          distanceMetric: 'cosine',
          indexName,
          vectorBucketName,
        },
      })

      mockVectorStore.deleteVectors.mockResolvedValue({} as DeleteVectorsOutput)
    })

    it('should delete vector successfully', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/DeleteVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          keys: ['vec1', 'vec2', 'vec3'],
        },
      })

      expect(response.statusCode).toBe(200)

      // Verify deleteVectors was called with correct parameters
      expect(mockVectorStore.deleteVectors).toHaveBeenCalledWith({
        vectorBucketName: vectorBucketS3,
        indexName: `${tenantId}-${indexName}`,
        keys: ['vec1', 'vec2', 'vec3'],
      })
    })

    it('should require authentication with service role', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/DeleteVectors',
        payload: {
          vectorBucketName,
          indexName,
          keys: ['vec1'],
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should validate required fields', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/DeleteVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should reject more than 500 vector keys', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/DeleteVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          keys: Array.from({ length: 501 }, (_, i) => `vec-${i}`),
        },
      })

      expect(response.statusCode).toBe(400)
      expect(mockVectorStore.deleteVectors).not.toHaveBeenCalled()
    })

    it('should reject vector keys above the S3Vectors length limit', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/DeleteVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          keys: ['x'.repeat(1025)],
        },
      })

      expect(response.statusCode).toBe(400)
      expect(mockVectorStore.deleteVectors).not.toHaveBeenCalled()
    })

    it('should reject numeric vector keys without coercing them', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/DeleteVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          keys: [123],
        },
      })

      expect(response.statusCode).toBe(400)
      expect(mockVectorStore.deleteVectors).not.toHaveBeenCalled()
    })

    it('should handle non-existent index', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/DeleteVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName: 'non-existent-index',
          keys: ['vec1'],
        },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('POST /vector/ListVectors', () => {
    let indexName: string

    beforeEach(async () => {
      indexName = `test-index-${Date.now()}`
      await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          dataType: 'float32',
          dimension: 3,
          distanceMetric: 'cosine',
          indexName,
          vectorBucketName,
        },
      })

      mockVectorStore.listVectors.mockResolvedValue({
        vectors: [{ key: 'vec1' }, { key: 'vec2' }, { key: 'vec3' }],
        nextToken: undefined,
      } as ListVectorsOutput)
    })

    it('should list vector successfully', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.vectors).toBeDefined()
      expect(Array.isArray(body.vectors)).toBe(true)

      // Verify listVectors was called with correct parameters
      expect(mockVectorStore.listVectors).toHaveBeenCalledWith(
        expect.objectContaining({
          vectorBucketName: vectorBucketS3,
          indexName: `${tenantId}-${indexName}`,
        })
      )
    })

    it('should support maxResults parameter', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          maxResults: 10,
        },
      })

      expect(response.statusCode).toBe(200)
      expect(mockVectorStore.listVectors).toHaveBeenCalledWith(
        expect.objectContaining({
          maxResults: 10,
        })
      )
    })

    it('should support returnData and returnMetadata flags', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          returnData: true,
          returnMetadata: true,
        },
      })

      expect(response.statusCode).toBe(200)
      expect(mockVectorStore.listVectors).toHaveBeenCalledWith(
        expect.objectContaining({
          returnData: true,
          returnMetadata: true,
        })
      )
    })

    it('should support pagination with nextToken', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          nextToken: 'some-token',
        },
      })

      expect(response.statusCode).toBe(200)
      expect(mockVectorStore.listVectors).toHaveBeenCalledWith(
        expect.objectContaining({
          nextToken: 'some-token',
        })
      )
    })

    it('should support segmentation parameters', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          segmentCount: 4,
          segmentIndex: 2,
        },
      })

      expect(response.statusCode).toBe(200)
      expect(mockVectorStore.listVectors).toHaveBeenCalledWith(
        expect.objectContaining({
          segmentCount: 4,
          segmentIndex: 2,
        })
      )
    })

    it('should require authentication with service role', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectors',
        payload: {
          vectorBucketName,
          indexName,
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should validate required fields', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should allow the S3Vectors maxResults upper bound', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          maxResults: 1000,
        },
      })

      expect(response.statusCode).toBe(200)
      expect(mockVectorStore.listVectors).toHaveBeenCalledWith(
        expect.objectContaining({
          maxResults: 1000,
        })
      )
    })

    it('should reject maxResults above the S3Vectors limit', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          maxResults: 1001,
        },
      })

      expect(response.statusCode).toBe(400)
      expect(mockVectorStore.listVectors).not.toHaveBeenCalled()
    })

    it('should reject numeric and boolean strings without coercing them', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          maxResults: '1000',
          returnData: 'true',
          segmentCount: '2',
          segmentIndex: '1',
        },
      })

      expect(response.statusCode).toBe(400)
      expect(mockVectorStore.listVectors).not.toHaveBeenCalled()
    })

    it('should validate segmentIndex range', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          segmentCount: 4,
          segmentIndex: 16,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should require segmentCount and segmentIndex together', async () => {
      const segmentCountOnly = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          segmentCount: 4,
        },
      })

      expect(segmentCountOnly.statusCode).toBe(400)

      const segmentIndexOnly = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          segmentIndex: 0,
        },
      })

      expect(segmentIndexOnly.statusCode).toBe(400)
      expect(mockVectorStore.listVectors).not.toHaveBeenCalled()
    })

    it('should reject segmentIndex greater than or equal to segmentCount', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          segmentCount: 4,
          segmentIndex: 4,
        },
      })

      expect(response.statusCode).toBe(400)
      expect(mockVectorStore.listVectors).not.toHaveBeenCalled()
    })

    it('should handle non-existent index', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/ListVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName: 'non-existent-index',
        },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('POST /vector/GetVectors', () => {
    let indexName: string

    beforeEach(async () => {
      indexName = `test-index-${Date.now()}`
      await appInstance.inject({
        method: 'POST',
        url: '/vector/CreateIndex',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          dataType: 'float32',
          dimension: 3,
          distanceMetric: 'cosine',
          indexName,
          vectorBucketName,
        },
      })

      mockVectorStore.getVectors.mockResolvedValue({
        vectors: [
          {
            key: 'vec1',
            data: { float32: [1.0, 2.0, 3.0] },
            metadata: { category: 'test' },
          },
          {
            key: 'vec2',
            data: { float32: [4.0, 5.0, 6.0] },
            metadata: { category: 'test2' },
          },
        ],
        $metadata: {
          httpStatusCode: 200,
        },
      } as GetVectorsCommandOutput)
    })

    it('should get vector successfully', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/GetVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          keys: ['vec1', 'vec2'],
          returnData: true,
          returnMetadata: true,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.vectors).toBeDefined()
      expect(Array.isArray(body.vectors)).toBe(true)

      // Verify getVectors was called with correct parameters
      expect(mockVectorStore.getVectors).toHaveBeenCalledWith({
        vectorBucketName: vectorBucketS3,
        indexName: `${tenantId}-${indexName}`,
        keys: ['vec1', 'vec2'],
        returnData: true,
        returnMetadata: true,
      })
    })

    it('should work with default returnData and returnMetadata', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/GetVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          keys: ['vec1'],
        },
      })

      expect(response.statusCode).toBe(200)
      expect(mockVectorStore.getVectors).toHaveBeenCalledWith(
        expect.objectContaining({
          returnData: false,
          returnMetadata: false,
        })
      )
    })

    it('should require authentication with service role', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/GetVectors',
        payload: {
          vectorBucketName,
          indexName,
          keys: ['vec1'],
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should validate required fields', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/GetVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should reject more than 100 vector keys', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/GetVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          keys: Array.from({ length: 101 }, (_, i) => `vec-${i}`),
        },
      })

      expect(response.statusCode).toBe(400)
      expect(mockVectorStore.getVectors).not.toHaveBeenCalled()
    })

    it('should reject vector keys above the S3Vectors length limit', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/GetVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          keys: ['x'.repeat(1025)],
        },
      })

      expect(response.statusCode).toBe(400)
      expect(mockVectorStore.getVectors).not.toHaveBeenCalled()
    })

    it('should reject numeric vector keys and boolean strings without coercing them', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/GetVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName,
          keys: [123],
          returnData: 'true',
        },
      })

      expect(response.statusCode).toBe(400)
      expect(mockVectorStore.getVectors).not.toHaveBeenCalled()
    })

    it('should handle non-existent index', async () => {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/vector/GetVectors',
        headers: {
          authorization: `Bearer ${serviceToken}`,
        },
        payload: {
          vectorBucketName,
          indexName: 'non-existent-index',
          keys: ['vec1'],
        },
      })

      expect(response.statusCode).toBe(404)
    })
  })
})
