import {
  getServiceKeyUser,
  type PgPoolExecutor,
  PgPoolStrategy,
  PgTransaction,
} from '@internal/database'
import { runMigrationsOnTenant } from '@internal/database/migrations'
import type { TenantConnectionOptions } from '@internal/database/pool'
import { logger, logSchema } from '@internal/monitoring'
import { PgVectorMetadataDB } from '@storage/protocols/vector'
import { DatabaseError, type PoolClient } from 'pg'
import { getConfig } from '../config'

const { databaseURL, tenantId } = getConfig()

describe('PgVectorMetadataDB', () => {
  let pool: PgPoolStrategy
  let db: PgVectorMetadataDB
  let runId: string

  beforeAll(async () => {
    await runMigrationsOnTenant({
      databaseUrl: databaseURL!,
      tenantId,
      waitForLock: true,
    })

    const superUser = await getServiceKeyUser(tenantId)
    const connectionSettings: TenantConnectionOptions = {
      tenantId,
      dbUrl: databaseURL!,
      isExternalPool: false,
      maxConnections: 2,
      user: superUser,
      superUser,
    }
    pool = new PgPoolStrategy(connectionSettings)
    db = new PgVectorMetadataDB(pool.acquire())
  })

  beforeEach(() => {
    runId = `pg-vector-${Date.now()}-${Math.random().toString(36).slice(2)}`
  })

  afterEach(async () => {
    await pool.acquire().query({
      text: `
        DELETE FROM storage.vector_indexes
        WHERE bucket_id LIKE $1
      `,
      values: [`${runId}%`],
    })
    await pool.acquire().query({
      text: `
        DELETE FROM storage.buckets_vectors
        WHERE id LIKE $1
      `,
      values: [`${runId}%`],
    })
  })

  afterAll(async () => {
    await pool.dispose('destroy')
  })

  it('creates, lists, locks, and deletes vector metadata through pg', async () => {
    const bucketName = `${runId}-bucket`

    await db.withTransaction(async (tx) => {
      await tx.lockResource('bucket', bucketName)
      await tx.createVectorBucket(bucketName)
    })

    await expect(db.findVectorBucket(bucketName)).resolves.toMatchObject({
      id: bucketName,
    })
    await expect(db.countBuckets()).resolves.toBeGreaterThanOrEqual(1)
    await expect(db.createVectorBucket(bucketName)).rejects.toMatchObject({
      code: 'ConflictException',
    })

    const index = await db.createVectorIndex({
      vectorBucketName: bucketName,
      indexName: 'index-a',
      dataType: 'float32',
      dimension: 3,
      distanceMetric: 'cosine',
      metadataConfiguration: {
        nonFilterableMetadataKeys: ['private-key'],
      },
    })

    expect(index).toMatchObject({
      bucket_id: bucketName,
      name: 'index-a',
      data_type: 'float32',
      dimension: 3,
      distance_metric: 'cosine',
    })

    await expect(db.countIndexes(bucketName)).resolves.toBe(1)
    await expect(db.getIndex(bucketName, 'index-a')).resolves.toMatchObject({
      name: 'index-a',
    })
    await expect(
      db.listIndexes({
        bucketId: bucketName,
        prefix: 'index',
        maxResults: 10,
      })
    ).resolves.toMatchObject({
      indexes: [expect.objectContaining({ name: 'index-a' })],
    })
    await expect(
      db.listBuckets({
        prefix: runId,
        maxResults: 10,
      })
    ).resolves.toMatchObject({
      vectorBuckets: [expect.objectContaining({ id: bucketName })],
    })

    await db.deleteVectorIndex(bucketName, 'index-a')
    await expect(db.countIndexes(bucketName)).resolves.toBe(0)

    await db.deleteVectorBucket(bucketName)
    await expect(db.findVectorBucket(bucketName)).rejects.toMatchObject({
      code: 'NotFoundException',
    })
  })

  it('rolls back nested vector metadata transactions to a savepoint', async () => {
    const bucketName = `${runId}-nested`

    await db.withTransaction(async (tx) => {
      await tx.createVectorBucket(bucketName)

      await expect(
        tx.withTransaction(async (nestedTx) => {
          await nestedTx.createVectorIndex({
            vectorBucketName: bucketName,
            indexName: 'rolled-back-index',
            dataType: 'float32',
            dimension: 3,
            distanceMetric: 'cosine',
          })

          throw new Error('rollback nested vector transaction')
        })
      ).rejects.toThrow('rollback nested vector transaction')

      await tx.createVectorIndex({
        vectorBucketName: bucketName,
        indexName: 'committed-index',
        dataType: 'float32',
        dimension: 3,
        distanceMetric: 'cosine',
      })
    })

    await expect(db.countIndexes(bucketName)).resolves.toBe(1)
    await expect(db.getIndex(bucketName, 'committed-index')).resolves.toMatchObject({
      name: 'committed-index',
    })
    await expect(db.getIndex(bucketName, 'rolled-back-index')).rejects.toMatchObject({
      code: 'NotFoundException',
    })
  })

  it('maps aborted parent vector transactions when savepoint creation fails', async () => {
    const savepointError = createDatabaseError('25P02', 'current transaction is aborted')
    const query = vi.fn().mockRejectedValueOnce(savepointError)
    const client = {
      query,
      release: vi.fn(),
    } as unknown as PoolClient
    const trx = new PgTransaction(client)
    const nestedDb = new PgVectorMetadataDB(trx)
    const fn = vi.fn()

    await expect(nestedDb.withTransaction(fn)).rejects.toMatchObject({
      code: 'DatabaseTransactionAborted',
      originalError: savepointError,
      metadata: {
        code: '25P02',
        query: expect.stringMatching(/^SAVEPOINT "vector_metadata_transaction_/),
      },
    })

    expect(fn).not.toHaveBeenCalled()
    expect(query).toHaveBeenCalledTimes(1)
    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(/^SAVEPOINT "vector_metadata_transaction_/),
      undefined
    )
  })

  it('does not retry serialization failures inside nested savepoints', async () => {
    const serializationError = createDatabaseError('40001', 'serialization failure')
    const query = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 })
    const client = {
      query,
      release: vi.fn(),
    } as unknown as PoolClient
    const trx = new PgTransaction(client)
    const nestedDb = new PgVectorMetadataDB(trx)
    const fn = vi.fn().mockRejectedValue(serializationError)

    await expect(nestedDb.withTransaction(fn)).rejects.toBe(serializationError)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(query).toHaveBeenCalledTimes(3)
    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/^SAVEPOINT "vector_metadata_transaction_/),
      undefined
    )
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/^ROLLBACK TO SAVEPOINT "vector_metadata_transaction_/),
      undefined
    )
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.stringMatching(/^RELEASE SAVEPOINT "vector_metadata_transaction_/),
      undefined
    )
  })

  it('preserves original errors when nested savepoint rollback fails', async () => {
    const originalError = new Error('nested vector transaction failed')
    const rollbackError = new Error('rollback savepoint failed')
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockRejectedValueOnce(rollbackError)
    const client = {
      query,
      release: vi.fn(),
    } as unknown as PoolClient
    const trx = new PgTransaction(client)
    const nestedDb = new PgVectorMetadataDB(trx)
    const logSpy = vi.spyOn(logSchema, 'warning').mockImplementation(() => undefined)

    try {
      await expect(
        nestedDb.withTransaction(async () => {
          throw originalError
        })
      ).rejects.toBe(originalError)

      expect(query).toHaveBeenCalledTimes(2)
      expect(query).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/^SAVEPOINT "vector_metadata_transaction_/),
        undefined
      )
      expect(query).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/^ROLLBACK TO SAVEPOINT "vector_metadata_transaction_/),
        undefined
      )
      expect(logSpy).toHaveBeenCalledWith(
        logger,
        '[PgVectorMetadataDB] Failed to rollback savepoint',
        expect.objectContaining({
          type: 'db',
          error: rollbackError,
        })
      )
    } finally {
      logSpy.mockRestore()
    }
  })

  it('preserves original errors when top-level rollback fails', async () => {
    const originalError = new Error('top-level vector transaction failed')
    const rollbackError = new Error('rollback transaction failed')
    const trx = {
      rollback: vi.fn().mockRejectedValue(rollbackError),
      commit: vi.fn().mockResolvedValue(undefined),
    } as unknown as PgTransaction
    const executor = {
      beginTransaction: vi.fn().mockResolvedValue(trx),
    } as unknown as PgPoolExecutor
    const topLevelDb = new PgVectorMetadataDB(executor)
    const logSpy = vi.spyOn(logSchema, 'warning').mockImplementation(() => undefined)

    try {
      await expect(
        topLevelDb.withTransaction(async () => {
          throw originalError
        })
      ).rejects.toBe(originalError)

      expect(trx.rollback).toHaveBeenCalledTimes(1)
      expect(trx.commit).not.toHaveBeenCalled()
      expect(logSpy).toHaveBeenCalledWith(
        logger,
        '[PgVectorMetadataDB] Failed to rollback transaction',
        expect.objectContaining({
          type: 'db',
          error: rollbackError,
        })
      )
    } finally {
      logSpy.mockRestore()
    }
  })

  it('retries serialization failures in top-level transactions', async () => {
    const serializationError = createDatabaseError('40001', 'serialization failure')
    const firstTrx = {
      rollback: vi.fn().mockResolvedValue(undefined),
      commit: vi.fn().mockResolvedValue(undefined),
    } as unknown as PgTransaction
    const secondTrx = {
      rollback: vi.fn().mockResolvedValue(undefined),
      commit: vi.fn().mockResolvedValue(undefined),
    } as unknown as PgTransaction
    const executor = {
      beginTransaction: vi.fn().mockResolvedValueOnce(firstTrx).mockResolvedValueOnce(secondTrx),
    } as unknown as PgPoolExecutor
    const topLevelDb = new PgVectorMetadataDB(executor)
    const fn = vi.fn().mockRejectedValueOnce(serializationError).mockResolvedValueOnce('ok')

    await expect(topLevelDb.withTransaction(fn)).resolves.toBe('ok')

    expect(executor.beginTransaction).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(firstTrx.rollback).toHaveBeenCalledTimes(1)
    expect(firstTrx.commit).not.toHaveBeenCalled()
    expect(secondTrx.rollback).not.toHaveBeenCalled()
    expect(secondTrx.commit).toHaveBeenCalledTimes(1)
  })

  it('throws the final serialization error after top-level retry exhaustion', async () => {
    const firstError = createDatabaseError('40001', 'first serialization failure')
    const secondError = createDatabaseError('40001', 'second serialization failure')
    const finalError = createDatabaseError('40001', 'final serialization failure')
    const firstTrx = {
      rollback: vi.fn().mockResolvedValue(undefined),
      commit: vi.fn().mockResolvedValue(undefined),
    } as unknown as PgTransaction
    const secondTrx = {
      rollback: vi.fn().mockResolvedValue(undefined),
      commit: vi.fn().mockResolvedValue(undefined),
    } as unknown as PgTransaction
    const thirdTrx = {
      rollback: vi.fn().mockResolvedValue(undefined),
      commit: vi.fn().mockResolvedValue(undefined),
    } as unknown as PgTransaction
    const executor = {
      beginTransaction: vi
        .fn()
        .mockResolvedValueOnce(firstTrx)
        .mockResolvedValueOnce(secondTrx)
        .mockResolvedValueOnce(thirdTrx),
    } as unknown as PgPoolExecutor
    const topLevelDb = new PgVectorMetadataDB(executor)
    const fn = vi
      .fn()
      .mockRejectedValueOnce(firstError)
      .mockRejectedValueOnce(secondError)
      .mockRejectedValueOnce(finalError)

    await expect(topLevelDb.withTransaction(fn)).rejects.toBe(finalError)

    expect(executor.beginTransaction).toHaveBeenCalledTimes(3)
    expect(fn).toHaveBeenCalledTimes(3)
    expect(firstTrx.rollback).toHaveBeenCalledTimes(1)
    expect(secondTrx.rollback).toHaveBeenCalledTimes(1)
    expect(thirdTrx.rollback).toHaveBeenCalledTimes(1)
    expect(firstTrx.commit).not.toHaveBeenCalled()
    expect(secondTrx.commit).not.toHaveBeenCalled()
    expect(thirdTrx.commit).not.toHaveBeenCalled()
  })

  it('throws a database error when vector index insert returns no row', async () => {
    const executor = {
      query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    } as unknown as PgPoolExecutor
    const vectorDb = new PgVectorMetadataDB(executor)

    await expect(
      vectorDb.createVectorIndex({
        vectorBucketName: 'bucket-a',
        indexName: 'index-a',
        dataType: 'float32',
        dimension: 3,
        distanceMetric: 'cosine',
      })
    ).rejects.toMatchObject({
      code: 'DatabaseError',
      message: 'Vector index insert returned no rows for index "index-a"',
    })

    expect(executor.query).toHaveBeenCalledWith({
      text: expect.stringContaining('INSERT INTO storage.vector_indexes'),
      values: ['bucket-a', 'float32', 'index-a', 3, 'cosine', null],
    })
  })
})

function createDatabaseError(code: string, message: string): DatabaseError {
  const error = new DatabaseError(message, message.length, 'error')
  error.code = code
  return error
}
