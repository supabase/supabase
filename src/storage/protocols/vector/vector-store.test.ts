import {
  CreateIndexCommandOutput,
  DeleteIndexCommandOutput,
  DeleteVectorsOutput,
  GetVectorsCommandOutput,
  ListVectorsOutput,
  PutVectorsOutput,
  QueryVectorsOutput,
} from '@aws-sdk/client-s3vectors'
import { ERRORS } from '@internal/errors'
import { logSchema } from '@internal/monitoring'
import { Sharder } from '@internal/sharding'
import { VectorBucket } from '@storage/schemas'
import { type Mocked, vi } from 'vitest'
import { type VectorStore } from './adapter/s3-vector'
import { type VectorLockResourceType, type VectorMetadataDB } from './metadata'
import { createVectorTransactionPgResolver, PgVectorMetadataDB } from './pg'
import { VECTOR_BUCKET_COUNT_LOCK, VectorStoreManager } from './vector-store'

function createMockVectorStore(): Mocked<VectorStore> {
  return {
    createVectorIndex: vi.fn().mockResolvedValue({} as CreateIndexCommandOutput),
    deleteVectorIndex: vi.fn().mockResolvedValue({} as DeleteIndexCommandOutput),
    putVectors: vi.fn().mockResolvedValue({} as PutVectorsOutput),
    listVectors: vi.fn().mockResolvedValue({} as ListVectorsOutput),
    queryVectors: vi.fn().mockResolvedValue({} as QueryVectorsOutput),
    deleteVectors: vi.fn().mockResolvedValue({} as DeleteVectorsOutput),
    getVectors: vi.fn().mockResolvedValue({} as GetVectorsCommandOutput),
  }
}

function createTransactionalMockVectorStore(): Mocked<VectorStore> {
  return Object.assign(createMockVectorStore(), {
    transactionalIndexOperations: true,
  })
}

function createMockSharder(): Mocked<Sharder> {
  return {
    createShard: vi.fn(),
    setShardStatus: vi.fn(),
    reserve: vi.fn(),
    confirm: vi.fn(),
    cancel: vi.fn(),
    expireLeases: vi.fn(),
    freeByLocation: vi.fn(),
    freeByResource: vi.fn(),
    shardStats: vi.fn(),
    findShardByResourceId: vi.fn(),
    listShardByKind: vi.fn(),
    withTnx: vi.fn(),
  } as unknown as Mocked<Sharder>
}

function createMockVectorDb(): Mocked<VectorMetadataDB> {
  return {
    withTransaction: vi.fn(),
    lockResource: vi.fn(),
    findVectorBucket: vi.fn(),
    createVectorBucket: vi.fn(),
    deleteVectorBucket: vi.fn(),
    listBuckets: vi.fn(),
    countBuckets: vi.fn(),
    countIndexes: vi.fn(),
    createVectorIndex: vi.fn(),
    getIndex: vi.fn(),
    listIndexes: vi.fn(),
    deleteVectorIndex: vi.fn(),
    findVectorIndexForBucket: vi.fn(),
  } as unknown as Mocked<VectorMetadataDB>
}

function createVectorBucketRecord(bucketName: string): VectorBucket {
  return {
    id: bucketName,
    created_at: new Date(),
    updated_at: new Date().toISOString(),
  } as unknown as VectorBucket
}

function createVectorIndexRecord(
  overrides: Partial<Awaited<ReturnType<VectorMetadataDB['findVectorIndexForBucket']>>> = {}
): Awaited<ReturnType<VectorMetadataDB['findVectorIndexForBucket']>> {
  return {
    bucket_id: 'bucket-a',
    created_at: new Date(),
    data_type: 'float32',
    dimension: 4,
    distance_metric: 'cosine',
    id: 'index-id-a',
    metadata_configuration: undefined,
    name: 'index-a',
    updated_at: new Date(),
    ...overrides,
  } as Awaited<ReturnType<VectorMetadataDB['findVectorIndexForBucket']>>
}

function metadataWithJsonByteLength(key: string, byteLength: number): Record<string, string> {
  const emptyByteLength = Buffer.byteLength(JSON.stringify({ [key]: '' }), 'utf8')
  const valueByteLength = byteLength - emptyByteLength

  if (valueByteLength < 0) {
    throw new Error(`Cannot build ${byteLength}-byte metadata for key "${key}"`)
  }

  return { [key]: 'x'.repeat(valueByteLength) }
}

function metadataWithKeyCount(count: number): Record<string, string> {
  return Object.fromEntries(Array.from({ length: count }, (_, i) => [`key-${i}`, 'value']))
}

function createDeterministicVectorDb(options: {
  bucketCount: number
  existingBuckets?: string[]
  onLockResource?: (
    resourceType: VectorLockResourceType,
    resourceId: string
  ) => Promise<void> | void
  onCreateVectorBucket?: (bucketName: string) => Promise<void> | void
  onDeleteVectorBucket?: (bucketName: string) => Promise<void> | void
}): VectorMetadataDB {
  const state = {
    bucketCount: options.bucketCount,
    existingBuckets: new Set(options.existingBuckets ?? []),
    countLockHeld: false,
    countLockWaiters: [] as Array<() => void>,
  }

  async function acquireCountLock() {
    if (!state.countLockHeld) {
      state.countLockHeld = true
      return
    }

    await new Promise<void>((resolve) => {
      state.countLockWaiters.push(resolve)
    })
  }

  function releaseCountLock() {
    const next = state.countLockWaiters.shift()
    if (next) {
      next()
      return
    }

    state.countLockHeld = false
  }

  return {
    async withTransaction<T>(fn: (db: VectorMetadataDB) => Promise<T> | T): Promise<T> {
      let holdsCountLock = false

      const tx: Partial<VectorMetadataDB> = {
        lockResource: async (resourceType: VectorLockResourceType, resourceId: string) => {
          await options.onLockResource?.(resourceType, resourceId)

          if (resourceType === 'global' && resourceId === VECTOR_BUCKET_COUNT_LOCK) {
            await acquireCountLock()
            holdsCountLock = true
          }
        },
        findVectorBucket: async (bucketName: string) => {
          if (state.existingBuckets.has(bucketName)) {
            return createVectorBucketRecord(bucketName)
          }

          throw ERRORS.S3VectorNotFoundException('vector bucket', bucketName)
        },
        countBuckets: async () => state.bucketCount,
        createVectorBucket: async (bucketName: string) => {
          await options.onCreateVectorBucket?.(bucketName)

          if (state.existingBuckets.has(bucketName)) {
            throw ERRORS.S3VectorConflictException('vector bucket', bucketName)
          }

          state.existingBuckets.add(bucketName)
          state.bucketCount += 1
        },
        listIndexes: async () => ({ indexes: [] }),
        deleteVectorBucket: async (bucketName: string) => {
          await options.onDeleteVectorBucket?.(bucketName)

          if (state.existingBuckets.delete(bucketName)) {
            state.bucketCount -= 1
          }
        },
      }

      try {
        return await fn(tx as VectorMetadataDB)
      } finally {
        if (holdsCountLock) {
          releaseCountLock()
        }
      }
    },
    lockResource: async () => undefined,
    findVectorBucket: async () => {
      throw new Error('not implemented')
    },
    createVectorBucket: async () => undefined,
    deleteVectorBucket: async () => undefined,
    listBuckets: async () => ({ vectorBuckets: [] }),
    countBuckets: async () => state.bucketCount,
    countIndexes: async () => 0,
    createVectorIndex: async () => {
      throw new Error('not implemented')
    },
    getIndex: async () => {
      throw new Error('not implemented')
    },
    listIndexes: async () => ({ indexes: [] }),
    deleteVectorIndex: async () => undefined,
    findVectorIndexForBucket: async () => {
      throw new Error('not implemented')
    },
  }
}

describe('VectorStoreManager bucket lifecycle', () => {
  it('exposes the active metadata transaction through a scoped pg resolver', async () => {
    const trx = {
      query: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
    }
    const rootPg = {
      query: vi.fn(),
      beginTransaction: vi.fn().mockResolvedValue(trx),
    }
    const db = new PgVectorMetadataDB(rootPg as never)
    const resolver = createVectorTransactionPgResolver(rootPg as never)
    const resolved: unknown[] = []

    await db.withTransaction(async () => {
      resolved.push(resolver.resolve())
    })
    resolved.push(resolver.resolve())

    expect(resolved).toEqual([trx, rootPg])
    expect(trx.commit).toHaveBeenCalledTimes(1)
  })

  it('serializes concurrent creates for the final bucket slot', async () => {
    const releaseFirstCreate = Promise.withResolvers<void>()
    const firstCreateStarted = Promise.withResolvers<void>()

    const db = createDeterministicVectorDb({
      bucketCount: 1,
      existingBuckets: ['existing-bucket'],
      onCreateVectorBucket: async (bucketName) => {
        if (bucketName === 'bucket-a') {
          firstCreateStarted.resolve()
          await releaseFirstCreate.promise
        }
      },
    })

    const manager = new VectorStoreManager(createMockVectorStore(), db, createMockSharder(), {
      tenantId: 'test-tenant',
      maxBucketCount: 2,
      maxIndexCount: Infinity,
    })

    const createA = manager.createBucket('bucket-a')
    await firstCreateStarted.promise

    const createB = manager.createBucket('bucket-b')
    releaseFirstCreate.resolve()

    const results = await Promise.allSettled([createA, createB])

    expect(results).toEqual([
      { status: 'fulfilled', value: undefined },
      {
        status: 'rejected',
        reason: expect.objectContaining({ code: 'S3VectorMaxBucketsExceeded' }),
      },
    ])
  })

  it('returns conflict for an existing bucket even when at capacity', async () => {
    const db = createDeterministicVectorDb({
      bucketCount: 1,
      existingBuckets: ['bucket-a'],
    })

    const manager = new VectorStoreManager(createMockVectorStore(), db, createMockSharder(), {
      tenantId: 'test-tenant',
      maxBucketCount: 1,
      maxIndexCount: Infinity,
    })

    await expect(manager.createBucket('bucket-a')).rejects.toMatchObject({
      code: 'ConflictException',
    })
    await expect(manager.createBucket('bucket-b')).rejects.toMatchObject({
      code: 'S3VectorMaxBucketsExceeded',
    })
  })

  it('returns conflict for an existing bucket when capacity is available', async () => {
    const db = createDeterministicVectorDb({
      bucketCount: 1,
      existingBuckets: ['bucket-a'],
    })

    const manager = new VectorStoreManager(createMockVectorStore(), db, createMockSharder(), {
      tenantId: 'test-tenant',
      maxBucketCount: 2,
      maxIndexCount: Infinity,
    })

    await expect(manager.createBucket('bucket-a')).rejects.toMatchObject({
      code: 'ConflictException',
    })
  })

  it('shares the bucket-count lock between delete and create so capacity is observed after delete commits', async () => {
    const releaseDelete = Promise.withResolvers<void>()
    const deleteReachedRemoval = Promise.withResolvers<void>()

    const db = createDeterministicVectorDb({
      bucketCount: 1,
      existingBuckets: ['bucket-to-delete'],
      onDeleteVectorBucket: async (bucketName) => {
        if (bucketName === 'bucket-to-delete') {
          deleteReachedRemoval.resolve()
          await releaseDelete.promise
        }
      },
    })

    const manager = new VectorStoreManager(createMockVectorStore(), db, createMockSharder(), {
      tenantId: 'test-tenant',
      maxBucketCount: 1,
      maxIndexCount: Infinity,
    })

    const deletePromise = manager.deleteBucket('bucket-to-delete')
    await deleteReachedRemoval.promise

    const createPromise = manager.createBucket('bucket-new')
    releaseDelete.resolve()

    await expect(deletePromise).resolves.toBeUndefined()
    await expect(createPromise).resolves.toBeUndefined()
  })

  it('serializes deleting and recreating the same bucket through the global count lock', async () => {
    const releaseDelete = Promise.withResolvers<void>()
    const deleteReachedRemoval = Promise.withResolvers<void>()
    const events: string[] = []

    const db = createDeterministicVectorDb({
      bucketCount: 1,
      existingBuckets: ['bucket-a'],
      onLockResource: (resourceType, resourceId) => {
        events.push(`lock:${resourceType}:${resourceId}`)
      },
      onDeleteVectorBucket: async (bucketName) => {
        events.push(`delete:start:${bucketName}`)
        deleteReachedRemoval.resolve()
        await releaseDelete.promise
        events.push(`delete:end:${bucketName}`)
      },
      onCreateVectorBucket: (bucketName) => {
        events.push(`create:${bucketName}`)
      },
    })

    const manager = new VectorStoreManager(createMockVectorStore(), db, createMockSharder(), {
      tenantId: 'test-tenant',
      maxBucketCount: 1,
      maxIndexCount: Infinity,
    })

    const deletePromise = manager.deleteBucket('bucket-a')
    await deleteReachedRemoval.promise

    const recreatePromise = manager.createBucket('bucket-a')
    await Promise.resolve()

    expect(events).toEqual([
      'lock:bucket:bucket-a',
      `lock:global:${VECTOR_BUCKET_COUNT_LOCK}`,
      'delete:start:bucket-a',
      `lock:global:${VECTOR_BUCKET_COUNT_LOCK}`,
    ])

    releaseDelete.resolve()

    await expect(deletePromise).resolves.toBeUndefined()
    await expect(recreatePromise).resolves.toBeUndefined()
    expect(events).toEqual([
      'lock:bucket:bucket-a',
      `lock:global:${VECTOR_BUCKET_COUNT_LOCK}`,
      'delete:start:bucket-a',
      `lock:global:${VECTOR_BUCKET_COUNT_LOCK}`,
      'delete:end:bucket-a',
      'create:bucket-a',
    ])
  })

  it('does not block unrelated creates while delete waits on the target bucket lock', async () => {
    const releaseBucketLock = Promise.withResolvers<void>()
    const deleteWaitingOnBucketLock = Promise.withResolvers<void>()

    const db = createDeterministicVectorDb({
      bucketCount: 1,
      existingBuckets: ['bucket-a'],
      onLockResource: async (resourceType, resourceId) => {
        if (resourceType === 'bucket' && resourceId === 'bucket-a') {
          deleteWaitingOnBucketLock.resolve()
          await releaseBucketLock.promise
        }
      },
    })

    const manager = new VectorStoreManager(createMockVectorStore(), db, createMockSharder(), {
      tenantId: 'test-tenant',
      maxBucketCount: 2,
      maxIndexCount: Infinity,
    })

    const deletePromise = manager.deleteBucket('bucket-a')
    await deleteWaitingOnBucketLock.promise

    await expect(manager.createBucket('bucket-b')).resolves.toBeUndefined()

    releaseBucketLock.resolve()
    await expect(deletePromise).resolves.toBeUndefined()
  })

  it('takes the per-bucket lock before the global count lock during bucket deletion', async () => {
    const callOrder: string[] = []
    const db = createDeterministicVectorDb({
      bucketCount: 1,
      existingBuckets: ['bucket-a'],
      onLockResource: (resourceType, resourceId) => {
        callOrder.push(`${resourceType}:${resourceId}`)
      },
      onDeleteVectorBucket: () => {
        callOrder.push('delete')
      },
    })

    const manager = new VectorStoreManager(createMockVectorStore(), db, createMockSharder(), {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await manager.deleteBucket('bucket-a')

    expect(callOrder).toEqual(['bucket:bucket-a', `global:${VECTOR_BUCKET_COUNT_LOCK}`, 'delete'])
  })

  it('re-checks bucket existence after taking the bucket lock before creating an index', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    db.findVectorBucket
      .mockResolvedValueOnce(createVectorBucketRecord('bucket-a'))
      .mockRejectedValueOnce(ERRORS.S3VectorNotFoundException('vector bucket', 'bucket-a'))
    db.withTransaction.mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) =>
      fn(db as unknown as VectorMetadataDB)
    )

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.createVectorIndex({
        dataType: 'float32',
        dimension: 4,
        distanceMetric: 'cosine',
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
      })
    ).rejects.toMatchObject({ code: 'NotFoundException' })

    expect(db.lockResource).toHaveBeenCalledWith('bucket', 'bucket-a')
    expect(db.findVectorBucket).toHaveBeenCalledTimes(2)
    expect(db.countIndexes).not.toHaveBeenCalled()
    expect(db.createVectorIndex).not.toHaveBeenCalled()
    expect(sharder.reserve).not.toHaveBeenCalled()
    expect(vectorStore.createVectorIndex).not.toHaveBeenCalled()
  })

  it('rejects dimensions above the backend limit before metadata or shard work', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = Object.assign(createMockVectorStore(), {
      maxDimensions: 4_000,
    })

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.createVectorIndex({
        dataType: 'float32',
        dimension: 4096,
        distanceMetric: 'cosine',
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
      })
    ).rejects.toMatchObject({
      code: 'InvalidParameter',
      message: 'dimension must be an integer in [1, 4000] for this vector backend, got: 4096',
    })

    expect(db.findVectorBucket).not.toHaveBeenCalled()
    expect(db.withTransaction).not.toHaveBeenCalled()
    expect(db.createVectorIndex).not.toHaveBeenCalled()
    expect(sharder.reserve).not.toHaveBeenCalled()
    expect(vectorStore.createVectorIndex).not.toHaveBeenCalled()
  })

  it('creates the physical vector index inside the metadata transaction', async () => {
    const callOrder: string[] = []
    let inMetadataTransaction = false
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createTransactionalMockVectorStore()

    db.findVectorBucket.mockResolvedValue(createVectorBucketRecord('bucket-a'))
    db.countIndexes.mockResolvedValue(0)
    db.createVectorIndex.mockResolvedValue(
      {} as Awaited<ReturnType<VectorMetadataDB['createVectorIndex']>>
    )
    db.withTransaction.mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) => {
      callOrder.push('metadata:start')
      inMetadataTransaction = true
      try {
        return await fn(db as unknown as VectorMetadataDB)
      } finally {
        inMetadataTransaction = false
        callOrder.push('metadata:end')
      }
    })
    sharder.reserve.mockResolvedValue({
      leaseExpiresAt: '',
      reservationId: 'reservation-a',
      shardId: '1',
      shardKey: 'shard-a',
      slotNo: 0,
    })
    sharder.confirm.mockImplementation(async () => {
      callOrder.push('confirm')
    })
    vectorStore.createVectorIndex.mockImplementation(async () => {
      callOrder.push(`physical:${inMetadataTransaction ? 'inside' : 'outside'}`)
      return {} as CreateIndexCommandOutput
    })

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await manager.createVectorIndex({
      dataType: 'float32',
      dimension: 4,
      distanceMetric: 'cosine',
      indexName: 'index-a',
      vectorBucketName: 'bucket-a',
    })

    expect(callOrder).toEqual(['metadata:start', 'physical:inside', 'confirm', 'metadata:end'])
    expect(vectorStore.createVectorIndex).toHaveBeenCalledWith({
      dataType: 'float32',
      dimension: 4,
      distanceMetric: 'cosine',
      indexName: 'test-tenant-index-a',
      vectorBucketName: 'shard-a',
    })
  })

  it('rejects duplicate vector index metadata before reserving a shard or creating the physical index', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    db.findVectorBucket.mockResolvedValue(createVectorBucketRecord('bucket-a'))
    db.countIndexes.mockResolvedValue(0)
    db.createVectorIndex.mockRejectedValue(
      ERRORS.S3VectorConflictException('vector index', 'index-a')
    )
    db.withTransaction.mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) =>
      fn(db as unknown as VectorMetadataDB)
    )

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.createVectorIndex({
        dataType: 'float32',
        dimension: 4,
        distanceMetric: 'cosine',
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
      })
    ).rejects.toMatchObject({ code: 'ConflictException' })

    expect(sharder.reserve).not.toHaveBeenCalled()
    expect(vectorStore.createVectorIndex).not.toHaveBeenCalled()
    expect(sharder.cancel).not.toHaveBeenCalled()
    expect(db.deleteVectorIndex).not.toHaveBeenCalled()
  })

  it('returns conflict for an existing index even when the bucket is at index capacity', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    db.findVectorBucket.mockResolvedValue(createVectorBucketRecord('bucket-a'))
    db.countIndexes.mockResolvedValue(1)
    db.findVectorIndexForBucket.mockResolvedValue(createVectorIndexRecord())
    db.withTransaction.mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) =>
      fn(db as unknown as VectorMetadataDB)
    )

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: 1,
    })

    await expect(
      manager.createVectorIndex({
        dataType: 'float32',
        dimension: 4,
        distanceMetric: 'cosine',
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
      })
    ).rejects.toMatchObject({ code: 'ConflictException' })

    expect(sharder.reserve).not.toHaveBeenCalled()
    expect(vectorStore.createVectorIndex).not.toHaveBeenCalled()
  })

  it('serializes concurrent creates for the same index and leaves the duplicate without cleanup work', async () => {
    const firstMetadataInserted = Promise.withResolvers<void>()
    const releaseFirstMetadata = Promise.withResolvers<void>()
    const physicalCreateStarted = Promise.withResolvers<void>()
    const releasePhysicalCreate = Promise.withResolvers<void>()
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()
    const indexes = new Set<string>()
    const bucketLockWaiters: Array<() => void> = []
    let bucketLockHeld = false

    async function acquireBucketLock() {
      if (!bucketLockHeld) {
        bucketLockHeld = true
        return
      }

      await new Promise<void>((resolve) => {
        bucketLockWaiters.push(resolve)
      })
    }

    function releaseBucketLock() {
      const next = bucketLockWaiters.shift()
      if (next) {
        next()
        return
      }

      bucketLockHeld = false
    }

    db.findVectorBucket.mockResolvedValue(createVectorBucketRecord('bucket-a'))
    db.countIndexes.mockImplementation(async () => indexes.size)
    db.createVectorIndex.mockImplementation(async (data) => {
      const key = `${data.vectorBucketName}/${data.indexName}`
      if (indexes.has(key)) {
        throw ERRORS.S3VectorConflictException('vector index', data.indexName)
      }

      indexes.add(key)
      firstMetadataInserted.resolve()
      await releaseFirstMetadata.promise
      return {} as Awaited<ReturnType<VectorMetadataDB['createVectorIndex']>>
    })
    db.withTransaction.mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) => {
      let holdsBucketLock = false
      const tx: Partial<VectorMetadataDB> = {
        ...db,
        lockResource: async (resourceType, resourceId) => {
          if (resourceType === 'bucket' && resourceId === 'bucket-a') {
            await acquireBucketLock()
            holdsBucketLock = true
          }
        },
      }

      try {
        return await fn(tx as VectorMetadataDB)
      } finally {
        if (holdsBucketLock) {
          releaseBucketLock()
        }
      }
    })
    sharder.reserve.mockResolvedValue({
      leaseExpiresAt: '',
      reservationId: 'reservation-a',
      shardId: '1',
      shardKey: 'shard-a',
      slotNo: 0,
    })
    sharder.confirm.mockResolvedValue()
    vectorStore.createVectorIndex.mockImplementation(async () => {
      physicalCreateStarted.resolve()
      await releasePhysicalCreate.promise
      return {} as CreateIndexCommandOutput
    })

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })
    const command = {
      dataType: 'float32' as const,
      dimension: 4,
      distanceMetric: 'cosine' as const,
      indexName: 'index-a',
      vectorBucketName: 'bucket-a',
    }

    const firstCreate = manager.createVectorIndex(command)
    await firstMetadataInserted.promise

    const duplicateCreate = manager.createVectorIndex(command)
    releaseFirstMetadata.resolve()
    await physicalCreateStarted.promise
    releasePhysicalCreate.resolve()

    const results = await Promise.allSettled([firstCreate, duplicateCreate])

    expect(results).toEqual([
      { status: 'fulfilled', value: undefined },
      {
        status: 'rejected',
        reason: expect.objectContaining({ code: 'ConflictException' }),
      },
    ])
    expect(db.createVectorIndex).toHaveBeenCalledTimes(2)
    expect(sharder.reserve).toHaveBeenCalledTimes(1)
    expect(sharder.confirm).toHaveBeenCalledTimes(1)
    expect(vectorStore.createVectorIndex).toHaveBeenCalledTimes(1)
    expect(vectorStore.deleteVectorIndex).not.toHaveBeenCalled()
    expect(db.deleteVectorIndex).not.toHaveBeenCalled()
    expect(sharder.cancel).not.toHaveBeenCalled()
  })

  it('cleans up the physical index and cancels the shard reservation when physical creation fails before commit', async () => {
    const createError = new Error('DDL failed')
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    db.findVectorBucket.mockResolvedValue(createVectorBucketRecord('bucket-a'))
    db.countIndexes.mockResolvedValue(0)
    db.createVectorIndex.mockResolvedValue(
      {} as Awaited<ReturnType<VectorMetadataDB['createVectorIndex']>>
    )
    db.deleteVectorIndex.mockResolvedValue()
    db.withTransaction.mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) =>
      fn(db as unknown as VectorMetadataDB)
    )
    sharder.reserve.mockResolvedValue({
      leaseExpiresAt: '',
      reservationId: 'reservation-a',
      shardId: '1',
      shardKey: 'shard-a',
      slotNo: 0,
    })
    sharder.cancel.mockResolvedValue()
    vectorStore.createVectorIndex.mockRejectedValue(createError)

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.createVectorIndex({
        dataType: 'float32',
        dimension: 4,
        distanceMetric: 'cosine',
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
      })
    ).rejects.toBe(createError)

    expect(db.deleteVectorIndex).not.toHaveBeenCalled()
    expect(vectorStore.deleteVectorIndex).toHaveBeenCalledWith({
      indexName: 'test-tenant-index-a',
      vectorBucketName: 'shard-a',
    })
    expect(sharder.freeByResource).toHaveBeenCalledWith('1', {
      bucketName: 'bucket-a',
      kind: 'vector',
      logicalName: 'index-a',
      tenantId: 'test-tenant',
    })
    expect(sharder.cancel).toHaveBeenCalledWith('reservation-a')
    expect(sharder.confirm).not.toHaveBeenCalled()
  })

  it('deletes the physical index, metadata row, and shard reservation when shard confirmation fails after creation', async () => {
    const confirmError = new Error('confirm failed')
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    db.findVectorBucket.mockResolvedValue(createVectorBucketRecord('bucket-a'))
    db.countIndexes.mockResolvedValue(0)
    db.createVectorIndex.mockResolvedValue(
      {} as Awaited<ReturnType<VectorMetadataDB['createVectorIndex']>>
    )
    db.deleteVectorIndex.mockResolvedValue()
    db.withTransaction.mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) =>
      fn(db as unknown as VectorMetadataDB)
    )
    sharder.reserve.mockResolvedValue({
      leaseExpiresAt: '',
      reservationId: 'reservation-a',
      shardId: '1',
      shardKey: 'shard-a',
      slotNo: 0,
    })
    sharder.confirm.mockRejectedValue(confirmError)
    sharder.cancel.mockResolvedValue()

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.createVectorIndex({
        dataType: 'float32',
        dimension: 4,
        distanceMetric: 'cosine',
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
      })
    ).rejects.toBe(confirmError)

    expect(vectorStore.createVectorIndex).toHaveBeenCalledWith({
      dataType: 'float32',
      dimension: 4,
      distanceMetric: 'cosine',
      indexName: 'test-tenant-index-a',
      vectorBucketName: 'shard-a',
    })
    expect(vectorStore.deleteVectorIndex).toHaveBeenCalledWith({
      indexName: 'test-tenant-index-a',
      vectorBucketName: 'shard-a',
    })
    expect(db.deleteVectorIndex).not.toHaveBeenCalled()
    expect(sharder.freeByResource).toHaveBeenCalledWith('1', {
      bucketName: 'bucket-a',
      kind: 'vector',
      logicalName: 'index-a',
      tenantId: 'test-tenant',
    })
    expect(sharder.cancel).toHaveBeenCalledWith('reservation-a')
  })

  it('does not delete the physical index or free a failed create reservation after the same index was recreated', async () => {
    const confirmError = new Error('confirm failed')
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createTransactionalMockVectorStore()

    db.findVectorBucket.mockResolvedValue(createVectorBucketRecord('bucket-a'))
    db.findVectorIndexForBucket.mockResolvedValue(createVectorIndexRecord())
    db.countIndexes.mockResolvedValue(0)
    db.createVectorIndex.mockResolvedValue(
      {} as Awaited<ReturnType<VectorMetadataDB['createVectorIndex']>>
    )
    db.withTransaction.mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) =>
      fn(db as unknown as VectorMetadataDB)
    )
    sharder.reserve.mockResolvedValue({
      leaseExpiresAt: '',
      reservationId: 'reservation-a',
      shardId: '1',
      shardKey: 'shard-a',
      slotNo: 0,
    })
    sharder.confirm.mockRejectedValue(confirmError)

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.createVectorIndex({
        dataType: 'float32',
        dimension: 4,
        distanceMetric: 'cosine',
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
      })
    ).rejects.toBe(confirmError)

    expect(vectorStore.deleteVectorIndex).not.toHaveBeenCalled()
    expect(sharder.freeByResource).not.toHaveBeenCalled()
    expect(sharder.cancel).toHaveBeenCalledWith('reservation-a')
  })

  it('does not replay nontransactional physical creation when the metadata transaction callback is retried', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = Object.assign(createMockVectorStore(), {
      transactionalIndexOperations: false,
    })

    db.findVectorBucket.mockResolvedValue(createVectorBucketRecord('bucket-a'))
    db.countIndexes.mockResolvedValue(0)
    db.createVectorIndex.mockResolvedValue(createVectorIndexRecord())
    db.withTransaction.mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) => {
      await fn(db as unknown as VectorMetadataDB)
      await fn(db as unknown as VectorMetadataDB)
    })
    sharder.reserve.mockResolvedValue({
      leaseExpiresAt: '',
      reservationId: 'reservation-a',
      shardId: '1',
      shardKey: 'shard-a',
      slotNo: 0,
    })
    sharder.confirm.mockResolvedValue()

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await manager.createVectorIndex({
      dataType: 'float32',
      dimension: 4,
      distanceMetric: 'cosine',
      indexName: 'index-a',
      vectorBucketName: 'bucket-a',
    })

    expect(db.createVectorIndex).toHaveBeenCalledTimes(2)
    expect(vectorStore.createVectorIndex).toHaveBeenCalledTimes(1)
    expect(sharder.confirm).toHaveBeenCalledTimes(1)
  })

  it('waits for failed index creation cleanup to delete the physical index before freeing the shard', async () => {
    const confirmError = new Error('confirm failed')
    const physicalDeleteStarted = Promise.withResolvers<void>()
    const allowPhysicalDelete = Promise.withResolvers<void>()
    const callOrder: string[] = []
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    db.findVectorBucket.mockResolvedValue(createVectorBucketRecord('bucket-a'))
    db.countIndexes.mockResolvedValue(0)
    db.createVectorIndex.mockResolvedValue(
      {} as Awaited<ReturnType<VectorMetadataDB['createVectorIndex']>>
    )
    db.deleteVectorIndex.mockResolvedValue()
    db.withTransaction.mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) =>
      fn(db as unknown as VectorMetadataDB)
    )
    sharder.reserve.mockResolvedValue({
      leaseExpiresAt: '',
      reservationId: 'reservation-a',
      shardId: '1',
      shardKey: 'shard-a',
      slotNo: 0,
    })
    sharder.confirm.mockRejectedValue(confirmError)
    sharder.cancel.mockImplementation(async () => {
      callOrder.push('cancel')
    })
    vectorStore.deleteVectorIndex.mockImplementation(async () => {
      callOrder.push('physical:start')
      physicalDeleteStarted.resolve()
      await allowPhysicalDelete.promise
      callOrder.push('physical:end')
      return {} as DeleteIndexCommandOutput
    })

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    const createResult = manager.createVectorIndex({
      dataType: 'float32',
      dimension: 4,
      distanceMetric: 'cosine',
      indexName: 'index-a',
      vectorBucketName: 'bucket-a',
    })

    await physicalDeleteStarted.promise

    expect(callOrder).toEqual(['physical:start'])

    allowPhysicalDelete.resolve()

    await expect(createResult).rejects.toBe(confirmError)
    expect(callOrder).toEqual(['physical:start', 'physical:end', 'cancel'])
    expect(db.deleteVectorIndex).not.toHaveBeenCalled()
    expect(sharder.freeByResource).toHaveBeenCalledWith('1', {
      bucketName: 'bucket-a',
      kind: 'vector',
      logicalName: 'index-a',
      tenantId: 'test-tenant',
    })
  })

  it('confirms the shard reservation when nontransactional physical creation finds an existing index', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = Object.assign(createMockVectorStore(), {
      transactionalIndexOperations: false,
    })

    db.findVectorBucket.mockResolvedValue(createVectorBucketRecord('bucket-a'))
    db.countIndexes.mockResolvedValue(0)
    db.createVectorIndex.mockResolvedValue(createVectorIndexRecord())
    db.withTransaction.mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) =>
      fn(db as unknown as VectorMetadataDB)
    )
    sharder.reserve.mockResolvedValue({
      leaseExpiresAt: '',
      reservationId: 'reservation-a',
      shardId: '1',
      shardKey: 'shard-a',
      slotNo: 0,
    })
    sharder.confirm.mockResolvedValue()
    vectorStore.createVectorIndex.mockRejectedValue(
      ERRORS.S3VectorConflictException('vector-index', 'index-a')
    )

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.createVectorIndex({
        dataType: 'float32',
        dimension: 4,
        distanceMetric: 'cosine',
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
      })
    ).resolves.toBeUndefined()

    expect(sharder.confirm).toHaveBeenCalledWith('reservation-a', {
      bucketName: 'bucket-a',
      kind: 'vector',
      logicalName: 'index-a',
      tenantId: 'test-tenant',
    })
    expect(vectorStore.deleteVectorIndex).not.toHaveBeenCalled()
    expect(db.deleteVectorIndex).not.toHaveBeenCalled()
    expect(sharder.freeByResource).not.toHaveBeenCalled()
    expect(sharder.cancel).not.toHaveBeenCalled()
  })

  it('does not delete an existing physical index when nontransactional conflict adoption fails confirmation', async () => {
    const confirmError = new Error('confirm failed')
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = Object.assign(createMockVectorStore(), {
      transactionalIndexOperations: false,
    })
    const index = createVectorIndexRecord({ id: 'created-index-id' })

    db.findVectorBucket.mockResolvedValue(createVectorBucketRecord('bucket-a'))
    db.countIndexes.mockResolvedValue(0)
    db.createVectorIndex.mockResolvedValue(index)
    db.findVectorIndexForBucket.mockResolvedValue(index)
    db.deleteVectorIndex.mockResolvedValue()
    db.withTransaction.mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) =>
      fn(db as unknown as VectorMetadataDB)
    )
    sharder.reserve.mockResolvedValue({
      leaseExpiresAt: '',
      reservationId: 'reservation-a',
      shardId: '1',
      shardKey: 'shard-a',
      slotNo: 0,
    })
    sharder.confirm.mockRejectedValue(confirmError)
    sharder.cancel.mockResolvedValue()
    vectorStore.createVectorIndex.mockRejectedValue(
      ERRORS.S3VectorConflictException('vector-index', 'index-a')
    )

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.createVectorIndex({
        dataType: 'float32',
        dimension: 4,
        distanceMetric: 'cosine',
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
      })
    ).rejects.toBe(confirmError)

    expect(sharder.confirm).toHaveBeenCalledWith('reservation-a', {
      bucketName: 'bucket-a',
      kind: 'vector',
      logicalName: 'index-a',
      tenantId: 'test-tenant',
    })
    expect(db.deleteVectorIndex).toHaveBeenCalledWith('bucket-a', 'index-a')
    expect(vectorStore.deleteVectorIndex).not.toHaveBeenCalled()
    expect(sharder.freeByResource).toHaveBeenCalledWith('1', {
      bucketName: 'bucket-a',
      kind: 'vector',
      logicalName: 'index-a',
      tenantId: 'test-tenant',
    })
    expect(sharder.cancel).toHaveBeenCalledWith('reservation-a')
  })

  it('rejects filters that reference non-filterable metadata keys before querying the vector backend', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    db.findVectorIndexForBucket.mockResolvedValue(
      createVectorIndexRecord({
        metadata_configuration: {
          nonFilterableMetadataKeys: ['private-note'],
        },
      })
    )
    sharder.findShardByResourceId.mockResolvedValue({
      capacity: 1,
      created_at: new Date().toISOString(),
      id: 1,
      kind: 'vector',
      next_slot: 1,
      shard_key: 'shard-a',
      status: 'active',
    })

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.queryVectors({
        filter: {
          $and: [{ 'private-note': 'hidden' }],
        } as never,
        indexName: 'index-a',
        queryVector: { float32: [1, 0] },
        topK: 1,
        vectorBucketName: 'bucket-a',
      })
    ).rejects.toMatchObject({
      code: 'InvalidParameter',
    })

    expect(vectorStore.queryVectors).not.toHaveBeenCalled()
  })

  it('rejects sibling non-filterable keys when a logical filter is present', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    db.findVectorIndexForBucket.mockResolvedValue(
      createVectorIndexRecord({
        metadata_configuration: {
          nonFilterableMetadataKeys: ['private-note'],
        },
      })
    )
    sharder.findShardByResourceId.mockResolvedValue({
      capacity: 1,
      created_at: new Date().toISOString(),
      id: 1,
      kind: 'vector',
      next_slot: 1,
      shard_key: 'shard-a',
      status: 'active',
    })

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.queryVectors({
        filter: {
          $or: [{ category: 'public' }],
          'private-note': 'hidden',
        } as never,
        indexName: 'index-a',
        queryVector: { float32: [1, 0] },
        topK: 1,
        vectorBucketName: 'bucket-a',
      })
    ).rejects.toMatchObject({
      code: 'InvalidParameter',
      message: 'Metadata key "private-note" is configured as non-filterable',
    })

    expect(vectorStore.queryVectors).not.toHaveBeenCalled()
  })

  it('confirms the shard reservation when transactional physical creation finds an existing index', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = Object.assign(createMockVectorStore(), {
      transactionalIndexOperations: true,
    })

    db.findVectorBucket.mockResolvedValue(createVectorBucketRecord('bucket-a'))
    db.findVectorIndexForBucket.mockRejectedValue(
      ERRORS.S3VectorNotFoundException('vector-index', 'index-a')
    )
    db.countIndexes.mockResolvedValue(0)
    db.createVectorIndex.mockResolvedValue(
      {} as Awaited<ReturnType<VectorMetadataDB['createVectorIndex']>>
    )
    db.withTransaction.mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) =>
      fn(db as unknown as VectorMetadataDB)
    )
    sharder.reserve.mockResolvedValue({
      leaseExpiresAt: '',
      reservationId: 'reservation-a',
      shardId: '1',
      shardKey: 'shard-a',
      slotNo: 0,
    })
    sharder.confirm.mockResolvedValue()
    vectorStore.createVectorIndex.mockRejectedValue(
      ERRORS.S3VectorConflictException('vector-index', 'index-a')
    )

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.createVectorIndex({
        dataType: 'float32',
        dimension: 4,
        distanceMetric: 'cosine',
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
      })
    ).resolves.toBeUndefined()

    expect(sharder.confirm).toHaveBeenCalledWith('reservation-a', {
      bucketName: 'bucket-a',
      kind: 'vector',
      logicalName: 'index-a',
      tenantId: 'test-tenant',
    })
    expect(vectorStore.deleteVectorIndex).not.toHaveBeenCalled()
    expect(db.deleteVectorIndex).not.toHaveBeenCalled()
    expect(sharder.freeByResource).not.toHaveBeenCalled()
    expect(sharder.cancel).not.toHaveBeenCalled()
  })

  it('cleans up the physical index and confirmed shard when metadata commit fails after creation', async () => {
    const commitError = new Error('commit failed')
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createTransactionalMockVectorStore()

    db.findVectorBucket.mockResolvedValue(createVectorBucketRecord('bucket-a'))
    db.countIndexes.mockResolvedValue(0)
    db.createVectorIndex.mockResolvedValue(
      {} as Awaited<ReturnType<VectorMetadataDB['createVectorIndex']>>
    )
    db.findVectorIndexForBucket.mockRejectedValue(
      ERRORS.S3VectorNotFoundException('vector-index', 'index-a')
    )
    db.withTransaction
      .mockImplementationOnce(async (fn: (db: VectorMetadataDB) => unknown) => {
        await fn(db as unknown as VectorMetadataDB)
        throw commitError
      })
      .mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) =>
        fn(db as unknown as VectorMetadataDB)
      )
    sharder.reserve.mockResolvedValue({
      leaseExpiresAt: '',
      reservationId: 'reservation-a',
      shardId: '1',
      shardKey: 'shard-a',
      slotNo: 0,
    })
    sharder.cancel.mockResolvedValue()
    sharder.freeByResource.mockResolvedValue()

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.createVectorIndex({
        dataType: 'float32',
        dimension: 4,
        distanceMetric: 'cosine',
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
      })
    ).rejects.toBe(commitError)

    expect(vectorStore.createVectorIndex).toHaveBeenCalledWith({
      dataType: 'float32',
      dimension: 4,
      distanceMetric: 'cosine',
      indexName: 'test-tenant-index-a',
      vectorBucketName: 'shard-a',
    })
    expect(sharder.confirm).toHaveBeenCalledWith('reservation-a', {
      bucketName: 'bucket-a',
      kind: 'vector',
      logicalName: 'index-a',
      tenantId: 'test-tenant',
    })
    expect(vectorStore.deleteVectorIndex).toHaveBeenCalledWith({
      indexName: 'test-tenant-index-a',
      vectorBucketName: 'shard-a',
    })
    expect(db.deleteVectorIndex).not.toHaveBeenCalled()
    expect(sharder.freeByResource).toHaveBeenCalledWith('1', {
      bucketName: 'bucket-a',
      kind: 'vector',
      logicalName: 'index-a',
      tenantId: 'test-tenant',
    })
    expect(sharder.cancel).not.toHaveBeenCalled()
  })

  it('does not clean up a confirmed create when post-failure recheck sees committed metadata', async () => {
    const commitError = new Error('commit failed')
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createTransactionalMockVectorStore()

    db.findVectorBucket.mockResolvedValue(createVectorBucketRecord('bucket-a'))
    db.countIndexes.mockResolvedValue(0)
    db.createVectorIndex.mockResolvedValue(
      {} as Awaited<ReturnType<VectorMetadataDB['createVectorIndex']>>
    )
    db.findVectorIndexForBucket.mockResolvedValue(createVectorIndexRecord())
    db.withTransaction
      .mockImplementationOnce(async (fn: (db: VectorMetadataDB) => unknown) => {
        await fn(db as unknown as VectorMetadataDB)
        throw commitError
      })
      .mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) =>
        fn(db as unknown as VectorMetadataDB)
      )
    sharder.reserve.mockResolvedValue({
      leaseExpiresAt: '',
      reservationId: 'reservation-a',
      shardId: '1',
      shardKey: 'shard-a',
      slotNo: 0,
    })
    sharder.confirm.mockResolvedValue()

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.createVectorIndex({
        dataType: 'float32',
        dimension: 4,
        distanceMetric: 'cosine',
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
      })
    ).rejects.toBe(commitError)

    expect(vectorStore.deleteVectorIndex).not.toHaveBeenCalled()
    expect(db.deleteVectorIndex).not.toHaveBeenCalled()
    expect(sharder.freeByResource).not.toHaveBeenCalled()
    expect(sharder.cancel).not.toHaveBeenCalled()
  })

  it('does not log cleanup failure when rollback cleanup finds metadata already gone', async () => {
    const commitError = new Error('commit failed')
    const cleanupLogSpy = vi.spyOn(logSchema, 'error').mockImplementation(() => undefined)
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createTransactionalMockVectorStore()

    db.findVectorBucket.mockResolvedValue(createVectorBucketRecord('bucket-a'))
    db.countIndexes.mockResolvedValue(0)
    db.createVectorIndex.mockResolvedValue(
      {} as Awaited<ReturnType<VectorMetadataDB['createVectorIndex']>>
    )
    db.findVectorIndexForBucket.mockRejectedValue(
      ERRORS.S3VectorNotFoundException('vector-index', 'index-a')
    )
    db.withTransaction
      .mockImplementationOnce(async (fn: (db: VectorMetadataDB) => unknown) => {
        await fn(db as unknown as VectorMetadataDB)
        throw commitError
      })
      .mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) =>
        fn(db as unknown as VectorMetadataDB)
      )
    sharder.reserve.mockResolvedValue({
      leaseExpiresAt: '',
      reservationId: 'reservation-a',
      shardId: '1',
      shardKey: 'shard-a',
      slotNo: 0,
    })
    sharder.freeByResource.mockResolvedValue()

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    try {
      await expect(
        manager.createVectorIndex({
          dataType: 'float32',
          dimension: 4,
          distanceMetric: 'cosine',
          indexName: 'index-a',
          vectorBucketName: 'bucket-a',
        })
      ).rejects.toBe(commitError)

      expect(vectorStore.deleteVectorIndex).toHaveBeenCalledWith({
        indexName: 'test-tenant-index-a',
        vectorBucketName: 'shard-a',
      })
      expect(sharder.freeByResource).toHaveBeenCalledWith('1', {
        bucketName: 'bucket-a',
        kind: 'vector',
        logicalName: 'index-a',
        tenantId: 'test-tenant',
      })
      const loggedCleanupFailure = cleanupLogSpy.mock.calls.some(
        ([, message]) => message === 'Vector index creation cleanup failed'
      )
      expect(loggedCleanupFailure).toBe(false)
    } finally {
      cleanupLogSpy.mockRestore()
    }
  })

  it('deletes metadata, physical index, and shard allocation in one bucket-locked transaction', async () => {
    const callOrder: string[] = []
    let inMetadataTransaction = false
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    db.findVectorIndexForBucket.mockResolvedValue(
      {} as Awaited<ReturnType<VectorMetadataDB['findVectorIndexForBucket']>>
    )
    db.deleteVectorIndex.mockResolvedValue()
    db.withTransaction.mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) => {
      callOrder.push('metadata:start')
      inMetadataTransaction = true
      try {
        const result = await fn(db as unknown as VectorMetadataDB)
        callOrder.push('metadata:commit')
        return result
      } finally {
        inMetadataTransaction = false
        callOrder.push('metadata:end')
      }
    })
    sharder.findShardByResourceId.mockResolvedValue({
      capacity: 1,
      created_at: new Date().toISOString(),
      id: 1,
      kind: 'vector',
      next_slot: 1,
      shard_key: 'shard-a',
      status: 'active',
    })
    sharder.freeByResource.mockImplementation(async () => {
      callOrder.push(`free:${inMetadataTransaction ? 'inside' : 'outside'}`)
    })
    vectorStore.deleteVectorIndex.mockImplementation(async () => {
      callOrder.push(`physical:${inMetadataTransaction ? 'inside' : 'outside'}`)
      return {} as DeleteIndexCommandOutput
    })

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await manager.deleteIndex({
      indexName: 'index-a',
      vectorBucketName: 'bucket-a',
    })

    expect(callOrder).toEqual([
      'metadata:start',
      'physical:inside',
      'free:inside',
      'metadata:commit',
      'metadata:end',
    ])
    expect(vectorStore.deleteVectorIndex).toHaveBeenCalledWith({
      indexName: 'test-tenant-index-a',
      vectorBucketName: 'shard-a',
    })
    expect(db.deleteVectorIndex).toHaveBeenCalledWith('bucket-a', 'index-a')
    expect(sharder.freeByResource).toHaveBeenCalledWith(1, {
      bucketName: 'bucket-a',
      kind: 'vector',
      logicalName: 'index-a',
      tenantId: 'test-tenant',
    })
  })

  it('deletes transactional physical vector index before metadata delete commits', async () => {
    const callOrder: string[] = []
    let inMetadataTransaction = false
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = Object.assign(createMockVectorStore(), {
      transactionalIndexOperations: true,
    })

    db.findVectorIndexForBucket.mockResolvedValue(
      {} as Awaited<ReturnType<VectorMetadataDB['findVectorIndexForBucket']>>
    )
    db.deleteVectorIndex.mockResolvedValue()
    db.withTransaction.mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) => {
      callOrder.push('metadata:start')
      inMetadataTransaction = true
      try {
        const result = await fn(db as unknown as VectorMetadataDB)
        callOrder.push('metadata:commit')
        return result
      } finally {
        inMetadataTransaction = false
        callOrder.push('metadata:end')
      }
    })
    sharder.findShardByResourceId.mockResolvedValue({
      capacity: 1,
      created_at: new Date().toISOString(),
      id: 1,
      kind: 'vector',
      next_slot: 1,
      shard_key: 'shard-a',
      status: 'active',
    })
    sharder.freeByResource.mockImplementation(async () => {
      callOrder.push(`free:${inMetadataTransaction ? 'inside' : 'outside'}`)
    })
    vectorStore.deleteVectorIndex.mockImplementation(async () => {
      callOrder.push(`physical:${inMetadataTransaction ? 'inside' : 'outside'}`)
      return {} as DeleteIndexCommandOutput
    })

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await manager.deleteIndex({
      indexName: 'index-a',
      vectorBucketName: 'bucket-a',
    })

    expect(callOrder).toEqual([
      'metadata:start',
      'physical:inside',
      'free:inside',
      'metadata:commit',
      'metadata:end',
    ])
    expect(vectorStore.deleteVectorIndex).toHaveBeenCalledWith({
      indexName: 'test-tenant-index-a',
      vectorBucketName: 'shard-a',
    })
    expect(db.deleteVectorIndex).toHaveBeenCalledWith('bucket-a', 'index-a')
    expect(sharder.freeByResource).toHaveBeenCalledWith(1, {
      bucketName: 'bucket-a',
      kind: 'vector',
      logicalName: 'index-a',
      tenantId: 'test-tenant',
    })
  })

  it('removes metadata and frees the shard when the physical vector index was already deleted', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    db.findVectorIndexForBucket
      .mockResolvedValueOnce(
        {} as Awaited<ReturnType<VectorMetadataDB['findVectorIndexForBucket']>>
      )
      .mockRejectedValueOnce(ERRORS.S3VectorNotFoundException('vector-index', 'index-a'))
    db.deleteVectorIndex.mockResolvedValue()
    db.withTransaction.mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) =>
      fn(db as unknown as VectorMetadataDB)
    )
    sharder.findShardByResourceId.mockResolvedValue({
      capacity: 1,
      created_at: new Date().toISOString(),
      id: 1,
      kind: 'vector',
      next_slot: 1,
      shard_key: 'shard-a',
      status: 'active',
    })
    sharder.freeByResource.mockResolvedValue()
    vectorStore.deleteVectorIndex.mockRejectedValue(
      ERRORS.S3VectorNotFoundException('vector-index', 'index-a')
    )

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.deleteIndex({
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
      })
    ).resolves.toBeUndefined()

    expect(db.deleteVectorIndex).toHaveBeenCalledWith('bucket-a', 'index-a')
    expect(sharder.freeByResource).toHaveBeenCalledWith(1, {
      bucketName: 'bucket-a',
      kind: 'vector',
      logicalName: 'index-a',
      tenantId: 'test-tenant',
    })
  })

  it('returns not found before physical delete or shard free when metadata is missing', async () => {
    const missingIndex = ERRORS.S3VectorNotFoundException('vector-index', 'index-a')
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    db.findVectorIndexForBucket.mockRejectedValue(missingIndex)
    db.withTransaction.mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) =>
      fn(db as unknown as VectorMetadataDB)
    )

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.deleteIndex({
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
      })
    ).rejects.toBe(missingIndex)

    expect(db.deleteVectorIndex).not.toHaveBeenCalled()
    expect(vectorStore.deleteVectorIndex).not.toHaveBeenCalled()
    expect(sharder.freeByResource).not.toHaveBeenCalled()
  })

  it('matches master sequencing by doing physical delete and shard free before commit can fail', async () => {
    const commitError = new Error('commit failed')
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    db.findVectorIndexForBucket.mockResolvedValue(
      {} as Awaited<ReturnType<VectorMetadataDB['findVectorIndexForBucket']>>
    )
    db.deleteVectorIndex.mockResolvedValue()
    db.withTransaction.mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) => {
      await fn(db as unknown as VectorMetadataDB)
      throw commitError
    })
    sharder.findShardByResourceId.mockResolvedValue({
      capacity: 1,
      created_at: new Date().toISOString(),
      id: 1,
      kind: 'vector',
      next_slot: 1,
      shard_key: 'shard-a',
      status: 'active',
    })
    sharder.freeByResource.mockResolvedValue()

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.deleteIndex({
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
      })
    ).rejects.toBe(commitError)

    expect(db.deleteVectorIndex).toHaveBeenCalledWith('bucket-a', 'index-a')
    expect(vectorStore.deleteVectorIndex).toHaveBeenCalledWith({
      indexName: 'test-tenant-index-a',
      vectorBucketName: 'shard-a',
    })
    expect(sharder.freeByResource).toHaveBeenCalledWith(1, {
      bucketName: 'bucket-a',
      kind: 'vector',
      logicalName: 'index-a',
      tenantId: 'test-tenant',
    })
  })

  it('rejects oversized filterable metadata before calling the vector backend', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    db.findVectorIndexForBucket.mockResolvedValue(createVectorIndexRecord())
    sharder.findShardByResourceId.mockResolvedValue({
      capacity: 1,
      created_at: new Date().toISOString(),
      id: 1,
      kind: 'vector',
      next_slot: 1,
      shard_key: 'shard-a',
      status: 'active',
    })

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.putVectors({
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
        vectors: [
          {
            key: 'vec-a',
            data: { float32: [1, 0, 0, 0] },
            metadata: { large: 'x'.repeat(2_050) },
          },
        ],
      })
    ).rejects.toMatchObject({
      code: 'InvalidParameter',
      message: "Invalid record for key 'vec-a': Filterable metadata must have at most 2048 bytes",
    })

    expect(vectorStore.putVectors).not.toHaveBeenCalled()
  })

  it('rejects a PutVectors batch with duplicate keys before calling the vector backend', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    db.findVectorIndexForBucket.mockResolvedValue(createVectorIndexRecord())
    sharder.findShardByResourceId.mockResolvedValue({
      capacity: 1,
      created_at: new Date().toISOString(),
      id: 1,
      kind: 'vector',
      next_slot: 1,
      shard_key: 'shard-a',
      status: 'active',
    })

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.putVectors({
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
        vectors: [
          { key: 'dup', data: { float32: [1, 0, 0, 0] } },
          { key: 'other', data: { float32: [0, 1, 0, 0] } },
          { key: 'dup', data: { float32: [0, 0, 1, 0] } },
        ],
      })
    ).rejects.toMatchObject({
      code: 'InvalidParameter',
      message: 'Request must not contain duplicate keys',
    })

    expect(vectorStore.putVectors).not.toHaveBeenCalled()
  })

  it('rejects PutVectors keys above the S3Vectors length limit before calling the vector backend', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    db.findVectorIndexForBucket.mockResolvedValue(createVectorIndexRecord())
    sharder.findShardByResourceId.mockResolvedValue({
      capacity: 1,
      created_at: new Date().toISOString(),
      id: 1,
      kind: 'vector',
      next_slot: 1,
      shard_key: 'shard-a',
      status: 'active',
    })

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.putVectors({
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
        vectors: [{ key: 'x'.repeat(1025), data: { float32: [1, 0, 0, 0] } }],
      })
    ).rejects.toMatchObject({
      code: 'InvalidParameter',
    })

    expect(vectorStore.putVectors).not.toHaveBeenCalled()
  })

  it('rejects PutVectors batches above the S3Vectors count limit before metadata lookup', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.putVectors({
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
        vectors: Array.from({ length: 501 }, (_, i) => ({
          key: `vec-${i}`,
          data: { float32: [1, 0, 0, 0] },
        })),
      })
    ).rejects.toMatchObject({
      code: 'InvalidParameter',
    })

    expect(db.findVectorIndexForBucket).not.toHaveBeenCalled()
    expect(sharder.findShardByResourceId).not.toHaveBeenCalled()
    expect(vectorStore.putVectors).not.toHaveBeenCalled()
  })

  it('rejects PutVectors entries without keys before metadata lookup', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.putVectors({
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
        vectors: [{ data: { float32: [1, 0, 0, 0] } } as never],
      })
    ).rejects.toMatchObject({
      code: 'MissingParameter',
    })

    expect(db.findVectorIndexForBucket).not.toHaveBeenCalled()
    expect(sharder.findShardByResourceId).not.toHaveBeenCalled()
    expect(vectorStore.putVectors).not.toHaveBeenCalled()
  })

  it('rejects GetVectors keys above the S3Vectors length limit before metadata lookup', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.getVectors({
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
        keys: ['x'.repeat(1025)],
      })
    ).rejects.toMatchObject({
      code: 'InvalidParameter',
    })

    expect(db.findVectorIndexForBucket).not.toHaveBeenCalled()
    expect(sharder.findShardByResourceId).not.toHaveBeenCalled()
    expect(vectorStore.getVectors).not.toHaveBeenCalled()
  })

  it('rejects DeleteVectors keys above the S3Vectors length limit before metadata lookup', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.deleteVectors({
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
        keys: ['x'.repeat(1025)],
      })
    ).rejects.toMatchObject({
      code: 'InvalidParameter',
    })

    expect(db.findVectorIndexForBucket).not.toHaveBeenCalled()
    expect(sharder.findShardByResourceId).not.toHaveBeenCalled()
    expect(vectorStore.deleteVectors).not.toHaveBeenCalled()
  })

  it('allows filterable metadata exactly at the 2 KB boundary', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()
    const metadata = metadataWithJsonByteLength('boundary', 2_048)

    db.findVectorIndexForBucket.mockResolvedValue(createVectorIndexRecord())
    sharder.findShardByResourceId.mockResolvedValue({
      capacity: 1,
      created_at: new Date().toISOString(),
      id: 1,
      kind: 'vector',
      next_slot: 1,
      shard_key: 'shard-a',
      status: 'active',
    })

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.putVectors({
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
        vectors: [{ key: 'vec-a', data: { float32: [1, 0, 0, 0] }, metadata }],
      })
    ).resolves.toBeUndefined()

    expect(vectorStore.putVectors).toHaveBeenCalledWith({
      indexName: 'test-tenant-index-a',
      vectorBucketName: 'shard-a',
      vectors: [{ key: 'vec-a', data: { float32: [1, 0, 0, 0] }, metadata }],
    })
  })

  it('rejects total metadata above 40 KB even when it is non-filterable', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    db.findVectorIndexForBucket.mockResolvedValue(
      createVectorIndexRecord({
        metadata_configuration: {
          nonFilterableMetadataKeys: ['large'],
        },
      })
    )
    sharder.findShardByResourceId.mockResolvedValue({
      capacity: 1,
      created_at: new Date().toISOString(),
      id: 1,
      kind: 'vector',
      next_slot: 1,
      shard_key: 'shard-a',
      status: 'active',
    })

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.putVectors({
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
        vectors: [
          {
            key: 'vec-a',
            data: { float32: [1, 0, 0, 0] },
            metadata: metadataWithJsonByteLength('large', 40 * 1_024 + 1),
          },
        ],
      })
    ).rejects.toMatchObject({
      code: 'InvalidParameter',
      message: "Invalid record for key 'vec-a': Total metadata must have at most 40960 bytes",
    })

    expect(vectorStore.putVectors).not.toHaveBeenCalled()
  })

  it('allows total metadata exactly at the 40 KB boundary', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()
    const metadata = metadataWithJsonByteLength('large', 40 * 1_024)

    db.findVectorIndexForBucket.mockResolvedValue(
      createVectorIndexRecord({
        metadata_configuration: {
          nonFilterableMetadataKeys: ['large'],
        },
      })
    )
    sharder.findShardByResourceId.mockResolvedValue({
      capacity: 1,
      created_at: new Date().toISOString(),
      id: 1,
      kind: 'vector',
      next_slot: 1,
      shard_key: 'shard-a',
      status: 'active',
    })

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.putVectors({
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
        vectors: [{ key: 'vec-a', data: { float32: [1, 0, 0, 0] }, metadata }],
      })
    ).resolves.toBeUndefined()

    expect(vectorStore.putVectors).toHaveBeenCalledWith({
      indexName: 'test-tenant-index-a',
      vectorBucketName: 'shard-a',
      vectors: [{ key: 'vec-a', data: { float32: [1, 0, 0, 0] }, metadata }],
    })
  })

  it('rejects metadata with more than 50 keys before calling the vector backend', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    db.findVectorIndexForBucket.mockResolvedValue(createVectorIndexRecord())
    sharder.findShardByResourceId.mockResolvedValue({
      capacity: 1,
      created_at: new Date().toISOString(),
      id: 1,
      kind: 'vector',
      next_slot: 1,
      shard_key: 'shard-a',
      status: 'active',
    })

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.putVectors({
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
        vectors: [
          {
            key: 'vec-a',
            data: { float32: [1, 0, 0, 0] },
            metadata: metadataWithKeyCount(51),
          },
        ],
      })
    ).rejects.toMatchObject({
      code: 'InvalidParameter',
      message: "Invalid record for key 'vec-a': Metadata must have at most 50 keys",
    })

    expect(vectorStore.putVectors).not.toHaveBeenCalled()
  })

  it('allows metadata with exactly 50 keys before calling the vector backend', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()
    const metadata = metadataWithKeyCount(50)

    db.findVectorIndexForBucket.mockResolvedValue(createVectorIndexRecord())
    sharder.findShardByResourceId.mockResolvedValue({
      capacity: 1,
      created_at: new Date().toISOString(),
      id: 1,
      kind: 'vector',
      next_slot: 1,
      shard_key: 'shard-a',
      status: 'active',
    })

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.putVectors({
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
        vectors: [{ key: 'vec-a', data: { float32: [1, 0, 0, 0] }, metadata }],
      })
    ).resolves.toBeUndefined()

    expect(vectorStore.putVectors).toHaveBeenCalledWith({
      indexName: 'test-tenant-index-a',
      vectorBucketName: 'shard-a',
      vectors: [{ key: 'vec-a', data: { float32: [1, 0, 0, 0] }, metadata }],
    })
  })

  it('allows oversized non-filterable metadata before calling the vector backend', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    db.findVectorIndexForBucket.mockResolvedValue(
      createVectorIndexRecord({
        metadata_configuration: {
          nonFilterableMetadataKeys: ['large'],
        },
      })
    )
    sharder.findShardByResourceId.mockResolvedValue({
      capacity: 1,
      created_at: new Date().toISOString(),
      id: 1,
      kind: 'vector',
      next_slot: 1,
      shard_key: 'shard-a',
      status: 'active',
    })

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.putVectors({
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
        vectors: [
          {
            key: 'vec-a',
            data: { float32: [1, 0, 0, 0] },
            metadata: { large: 'x'.repeat(2_050), category: 'small' },
          },
        ],
      })
    ).resolves.toBeUndefined()

    expect(vectorStore.putVectors).toHaveBeenCalledWith({
      indexName: 'test-tenant-index-a',
      vectorBucketName: 'shard-a',
      vectors: [
        {
          key: 'vec-a',
          data: { float32: [1, 0, 0, 0] },
          metadata: { large: 'x'.repeat(2_050), category: 'small' },
        },
      ],
    })
  })

  it('deletes the physical vector index and frees the shard in the metadata delete transaction', async () => {
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    db.findVectorIndexForBucket.mockResolvedValue(
      {} as Awaited<ReturnType<VectorMetadataDB['findVectorIndexForBucket']>>
    )
    db.withTransaction.mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) =>
      fn(db as unknown as VectorMetadataDB)
    )
    sharder.findShardByResourceId.mockResolvedValue({
      capacity: 1,
      created_at: new Date().toISOString(),
      id: 1,
      kind: 'vector',
      next_slot: 1,
      shard_key: 'shard-a',
      status: 'active',
    })
    sharder.freeByResource.mockResolvedValue()

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.deleteIndex({
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
      })
    ).resolves.toBeUndefined()

    expect(vectorStore.deleteVectorIndex).toHaveBeenCalledWith({
      indexName: 'test-tenant-index-a',
      vectorBucketName: 'shard-a',
    })
    expect(db.deleteVectorIndex).toHaveBeenCalledWith('bucket-a', 'index-a')
    expect(sharder.freeByResource).toHaveBeenCalledWith(1, {
      bucketName: 'bucket-a',
      kind: 'vector',
      logicalName: 'index-a',
      tenantId: 'test-tenant',
    })
  })

  it('keeps the metadata row and shard allocated when physical delete fails so retry starts from the index row', async () => {
    const deleteError = new Error('delete failed')
    const db = createMockVectorDb()
    const sharder = createMockSharder()
    const vectorStore = createMockVectorStore()

    db.findVectorIndexForBucket.mockResolvedValue(
      {} as Awaited<ReturnType<VectorMetadataDB['findVectorIndexForBucket']>>
    )
    db.withTransaction.mockImplementation(async (fn: (db: VectorMetadataDB) => unknown) =>
      fn(db as unknown as VectorMetadataDB)
    )
    sharder.findShardByResourceId.mockResolvedValue({
      capacity: 1,
      created_at: new Date().toISOString(),
      id: 1,
      kind: 'vector',
      next_slot: 1,
      shard_key: 'shard-a',
      status: 'active',
    })
    vectorStore.deleteVectorIndex.mockRejectedValueOnce(deleteError).mockResolvedValueOnce({
      $metadata: {},
    } as DeleteIndexCommandOutput)

    const manager = new VectorStoreManager(vectorStore, db, sharder, {
      tenantId: 'test-tenant',
      maxBucketCount: Infinity,
      maxIndexCount: Infinity,
    })

    await expect(
      manager.deleteIndex({
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
      })
    ).rejects.toBe(deleteError)

    expect(db.withTransaction).toHaveBeenCalledTimes(1)
    expect(db.deleteVectorIndex).toHaveBeenCalledWith('bucket-a', 'index-a')
    expect(vectorStore.deleteVectorIndex).toHaveBeenCalledTimes(1)
    expect(sharder.freeByResource).not.toHaveBeenCalled()

    await expect(
      manager.deleteIndex({
        indexName: 'index-a',
        vectorBucketName: 'bucket-a',
      })
    ).resolves.toBeUndefined()

    expect(db.withTransaction).toHaveBeenCalledTimes(2)
    expect(db.deleteVectorIndex).toHaveBeenCalledTimes(2)
    expect(vectorStore.deleteVectorIndex).toHaveBeenCalledTimes(2)
    expect(sharder.freeByResource).toHaveBeenCalledWith(1, {
      bucketName: 'bucket-a',
      kind: 'vector',
      logicalName: 'index-a',
      tenantId: 'test-tenant',
    })
  })
})
