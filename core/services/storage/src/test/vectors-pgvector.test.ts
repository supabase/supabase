import { createHash } from 'node:crypto'
import { PgPoolExecutor } from '@internal/database'
import { BucketScopedSingleShard } from '@internal/sharding'
import {
  createVectorTransactionPgResolver,
  PgVectorMetadataDB,
  PgVectorStore,
  VectorStoreManager,
} from '@storage/protocols/vector'
import { Pool as PgPool } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

/**
 * Manager-level integration tests for the pgvector backend.
 *
 * Exercises VectorStoreManager → PgVectorStore → real Postgres with the
 * pgvector extension installed. Mirrors the same call shape the HTTP routes
 * use (`request.s3Vector.<method>(...)`), so this covers everything except
 * route schema validation and auth.
 *
 * Skips the suite if pgvector isn't available on the test DB.
 */

const TEST_DATABASE_URL =
  process.env.VECTOR_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@127.0.0.1/postgres'

function quoteIdent(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`
}

function pgvectorTableName(vectorBucketName: string, indexName: string): string {
  const hash = createHash('sha256')
    .update(`${vectorBucketName}\x00${indexName}`)
    .digest('hex')
    .slice(0, 24)
  return `vector_${hash}`
}

let pgvectorAvailable = false
const tenantId = 'pgvector-it-tenant'

describe('Vectors via VectorStoreManager + real pgvector', () => {
  let pool: PgPool
  let executor: PgPoolExecutor
  let metadataDb: PgVectorMetadataDB
  let manager: VectorStoreManager
  const bucketName = `pgvector-it-bucket-${Date.now()}`

  beforeAll(async () => {
    const probe = new PgPool({
      connectionString: TEST_DATABASE_URL,
      connectionTimeoutMillis: 2_000,
      min: 0,
      max: 1,
    })
    try {
      await probe.query('CREATE EXTENSION IF NOT EXISTS vector')
      await probe.query('CREATE SCHEMA IF NOT EXISTS storage_vectors')
      pgvectorAvailable = true
    } catch (e) {
      console.warn(
        '[vectors-pgvector.test] skipping: pgvector unavailable on test DB:',
        (e as Error).message
      )
    } finally {
      await probe.end()
    }

    if (!pgvectorAvailable) return

    pool = new PgPool({
      connectionString: TEST_DATABASE_URL,
      connectionTimeoutMillis: 5_000,
      min: 0,
      max: 4,
    })
    executor = new PgPoolExecutor(pool)
    metadataDb = new PgVectorMetadataDB(executor)
    const adapter = new PgVectorStore(executor)
    const shard = new BucketScopedSingleShard({
      keyPrefix: 'pgvector__',
      capacity: Number.MAX_SAFE_INTEGER,
    })
    manager = new VectorStoreManager(adapter, metadataDb, shard, {
      tenantId,
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })
  })

  afterAll(async () => {
    if (!pgvectorAvailable) return
    await metadataDb
      .withTransaction(async (tx) => {
        await tx.deleteVectorBucket(bucketName)
      })
      .catch(() => undefined)
    await pool.end()
  })

  beforeEach(async (ctx) => {
    if (!pgvectorAvailable) return ctx.skip()
  })

  it('persists metadata when transactional createIndex adopts an existing physical table', async () => {
    const bucket = `pgvector-it-adopt-${Date.now()}`
    const indexName = `it-adopt-${Date.now()}`
    const physicalBucket = `pgvector__${bucket}`
    const physicalIndex = `${tenantId}-${indexName}`
    const physicalTable = pgvectorTableName(physicalBucket, physicalIndex)
    const qualifiedTable = `storage_vectors.${quoteIdent(physicalTable)}`
    const shard = new BucketScopedSingleShard({
      keyPrefix: 'pgvector__',
      capacity: Number.MAX_SAFE_INTEGER,
    })
    const transactionalManager = new VectorStoreManager(
      new PgVectorStore(createVectorTransactionPgResolver(executor)),
      metadataDb,
      shard,
      {
        tenantId,
        maxBucketCount: Infinity,
        maxIndexCount: Infinity,
      }
    )

    try {
      await pool.query(
        `INSERT INTO storage.buckets_vectors (id)
         VALUES ($1)
         ON CONFLICT (id) DO NOTHING`,
        [bucket]
      )
      await pool.query(`CREATE TABLE ${qualifiedTable}
        (
          key text PRIMARY KEY,
          embedding halfvec(4) NOT NULL,
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb
        )`)

      await transactionalManager.createVectorIndex({
        vectorBucketName: bucket,
        indexName,
        dataType: 'float32',
        dimension: 4,
        distanceMetric: 'cosine',
      })

      const metadataRows = await pool.query(
        `SELECT name, bucket_id
         FROM storage.vector_indexes
         WHERE bucket_id = $1
           AND name = $2`,
        [bucket, indexName]
      )

      expect(metadataRows.rows).toEqual([{ name: indexName, bucket_id: bucket }])
    } finally {
      await pool.query(`DROP TABLE IF EXISTS ${qualifiedTable}`)
      await pool.query(`DELETE FROM storage.vector_indexes WHERE bucket_id = $1 AND name = $2`, [
        bucket,
        indexName,
      ])
      await pool.query(`DELETE FROM storage.buckets_vectors WHERE id = $1`, [bucket])
    }
  })

  it('createBucket → createVectorIndex → putVectors → queryVectors → getVectors → deleteVectors → deleteIndex', async () => {
    const indexName = `it-index-${Date.now()}`
    await manager.createBucket(bucketName)

    await manager.createVectorIndex({
      vectorBucketName: bucketName,
      indexName,
      dataType: 'float32',
      dimension: 4,
      distanceMetric: 'cosine',
    })

    await manager.putVectors({
      vectorBucketName: bucketName,
      indexName,
      vectors: [
        {
          key: 'alpha',
          data: { float32: [1, 0, 0, 0] },
          metadata: { category: 'cats', score: 5, active: true, note: 'hello' },
        },
        {
          key: 'beta',
          data: { float32: [0, 1, 0, 0] },
          metadata: { category: 'dogs', score: 3, active: true },
        },
        {
          key: 'gamma',
          data: { float32: [0, 0, 1, 0] },
          metadata: { category: 'cats', score: 9, active: false },
        },
      ],
    })

    const result = await manager.queryVectors({
      vectorBucketName: bucketName,
      indexName,
      queryVector: { float32: [1, 0, 0, 0] },
      topK: 2,
      returnDistance: true,
      returnMetadata: true,
    })
    expect(result.distanceMetric).toBe('cosine')
    expect(result.vectors?.[0].key).toBe('alpha')
    expect(result.vectors).toHaveLength(2)

    const filtered = await manager.queryVectors({
      vectorBucketName: bucketName,
      indexName,
      queryVector: { float32: [1, 0, 0, 0] },
      topK: 5,
      // S3Vectors SDK input type is a generic Document; the manager passes the
      // filter straight to the adapter, which calls the translator at use site.
      filter: { category: 'cats' } as never,
      returnMetadata: true,
    })
    const keys = (filtered.vectors ?? []).map((v) => v.key).sort()
    expect(keys).toEqual(['alpha', 'gamma'])

    const fetched = await manager.getVectors({
      vectorBucketName: bucketName,
      indexName,
      keys: ['alpha', 'missing'],
      returnMetadata: true,
    })
    expect(fetched.vectors).toHaveLength(1)
    expect(fetched.vectors?.[0].key).toBe('alpha')
    expect(fetched.vectors?.[0].metadata).toMatchObject({
      category: 'cats',
      score: 5,
      active: true,
    })

    await manager.deleteVectors({
      vectorBucketName: bucketName,
      indexName,
      keys: ['alpha'],
    })
    const afterDel = await manager.getVectors({
      vectorBucketName: bucketName,
      indexName,
      keys: ['alpha'],
    })
    expect(afterDel.vectors).toHaveLength(0)

    await manager.deleteIndex({
      vectorBucketName: bucketName,
      indexName,
    })
  }, 30_000)

  it('euclidean index uses the L2 operator (<->) and returns L2 distances', async () => {
    const indexName = `it-euclidean-${Date.now()}`
    await manager.createVectorIndex({
      vectorBucketName: bucketName,
      indexName,
      dataType: 'float32',
      dimension: 2,
      distanceMetric: 'euclidean',
    })
    await manager.putVectors({
      vectorBucketName: bucketName,
      indexName,
      vectors: [
        { key: 'origin', data: { float32: [0, 0] } },
        { key: 'near', data: { float32: [3, 4] } }, // L2 distance from [0,0] = 5
        { key: 'far', data: { float32: [10, 10] } }, // L2 distance from [0,0] ≈ 14.14
      ],
    })

    const result = await manager.queryVectors({
      vectorBucketName: bucketName,
      indexName,
      queryVector: { float32: [0, 0] },
      topK: 3,
      returnDistance: true,
    })

    expect(result.distanceMetric).toBe('euclidean')
    expect(result.vectors).toHaveLength(3)
    expect(result.vectors?.[0].key).toBe('origin')
    expect(result.vectors?.[0].distance).toBeCloseTo(0, 5)
    expect(result.vectors?.[1].key).toBe('near')
    expect(result.vectors?.[1].distance).toBeCloseTo(5, 3)
    expect(result.vectors?.[2].key).toBe('far')
    expect(result.vectors?.[2].distance).toBeCloseTo(Math.sqrt(200), 3)

    await manager.deleteIndex({ vectorBucketName: bucketName, indexName })
  }, 30_000)

  it('listVectors paginates over a populated index', async () => {
    const indexName = `it-list-${Date.now()}`
    await manager.createVectorIndex({
      vectorBucketName: bucketName,
      indexName,
      dataType: 'float32',
      dimension: 2,
      distanceMetric: 'euclidean',
    })
    await manager.putVectors({
      vectorBucketName: bucketName,
      indexName,
      vectors: Array.from({ length: 4 }, (_, i) => ({
        key: `k-${i.toString().padStart(2, '0')}`,
        data: { float32: [i, 0] },
        metadata: { i },
      })),
    })

    const firstPage = await manager.listVectors({
      vectorBucketName: bucketName,
      indexName,
      maxResults: 2,
    })
    expect(firstPage.vectors).toHaveLength(2)
    expect(firstPage.nextToken).toBeDefined()

    const secondPage = await manager.listVectors({
      vectorBucketName: bucketName,
      indexName,
      maxResults: 2,
      nextToken: firstPage.nextToken,
    })
    expect(secondPage.vectors).toHaveLength(2)
    expect(secondPage.vectors?.map((vector) => vector.key)).toEqual(['k-02', 'k-03'])
    expect(secondPage.nextToken).toBeUndefined()

    await manager.deleteIndex({ vectorBucketName: bucketName, indexName })
  }, 30_000)

  it('listVectors returns disjoint keysets for parallel segments', async () => {
    const segmentBucketName = `pgvector-it-segments-${Date.now()}`
    const indexName = `it-segments-${Date.now()}`
    const insertedKeys = Array.from({ length: 32 }, (_, i) => `k-${i.toString().padStart(2, '0')}`)

    await manager.createBucket(segmentBucketName)
    await manager.createVectorIndex({
      vectorBucketName: segmentBucketName,
      indexName,
      dataType: 'float32',
      dimension: 2,
      distanceMetric: 'euclidean',
    })

    try {
      await manager.putVectors({
        vectorBucketName: segmentBucketName,
        indexName,
        vectors: insertedKeys.map((key, i) => ({
          key,
          data: { float32: [i, 0] },
        })),
      })

      const segments = await Promise.all(
        [0, 1].map((segmentIndex) =>
          manager.listVectors({
            vectorBucketName: segmentBucketName,
            indexName,
            maxResults: 1000,
            segmentCount: 2,
            segmentIndex,
          })
        )
      )
      const segmentKeys = segments.map(
        (segment) => segment.vectors?.map((vector) => vector.key) ?? []
      )
      const combinedKeys = segmentKeys.flat()

      expect(segmentKeys[0].length).toBeGreaterThan(0)
      expect(segmentKeys[1].length).toBeGreaterThan(0)
      expect(new Set(combinedKeys).size).toBe(combinedKeys.length)
      expect(combinedKeys.sort()).toEqual(insertedKeys)
    } finally {
      await manager
        .deleteIndex({ vectorBucketName: segmentBucketName, indexName })
        .catch(() => undefined)
      await manager.deleteBucket(segmentBucketName).catch(() => undefined)
    }
  }, 30_000)

  it('rejects creating an index inside a missing bucket', async () => {
    await expect(
      manager.createVectorIndex({
        vectorBucketName: 'never-created-bucket',
        indexName: 'whatever',
        dataType: 'float32',
        dimension: 2,
        distanceMetric: 'cosine',
      })
    ).rejects.toMatchObject({ code: expect.stringMatching(/NotFoundException/) })
  })

  it('queryVectors against a missing index surfaces a NotFound error', async () => {
    await expect(
      manager.queryVectors({
        vectorBucketName: bucketName,
        indexName: 'does-not-exist',
        queryVector: { float32: [1, 0] },
        topK: 1,
      })
    ).rejects.toMatchObject({ code: expect.stringMatching(/NotFoundException/) })
  })

  it('isolates per-tenant indexes via tenantId-prefixed names', async () => {
    // Two distinct managers (different tenants) over the same physical DB
    // must not see each other's data.
    const indexName = `it-isolation-${Date.now()}`
    const otherTenantManager = new VectorStoreManager(
      new PgVectorStore(executor),
      metadataDb,
      new BucketScopedSingleShard({
        keyPrefix: 'pgvector__',
        capacity: Number.MAX_SAFE_INTEGER,
      }),
      { tenantId: 'other-tenant', maxBucketCount: Infinity, maxIndexCount: Infinity }
    )

    await manager.createVectorIndex({
      vectorBucketName: bucketName,
      indexName,
      dataType: 'float32',
      dimension: 2,
      distanceMetric: 'cosine',
    })
    await manager.putVectors({
      vectorBucketName: bucketName,
      indexName,
      vectors: [{ key: 'mine', data: { float32: [1, 0] } }],
    })

    // The "other" tenant queries the same logical (bucket, index) → different
    // physical table thanks to the tenantId prefix in getIndexName.
    await expect(
      otherTenantManager.queryVectors({
        vectorBucketName: bucketName,
        indexName,
        queryVector: { float32: [1, 0] },
        topK: 1,
      })
    ).rejects.toMatchObject({ code: expect.stringMatching(/NotFoundException/) })

    await manager.deleteIndex({ vectorBucketName: bucketName, indexName })
  }, 30_000)
})
