import {
  type DatabaseExecutor,
  type DatabaseStatement,
  getServiceKeyUser,
  PgPoolStrategy,
  PgTenantConnection,
  PgTransaction,
} from '@internal/database'
import { runMigrationsOnTenant } from '@internal/database/migrations'
import type { TenantConnectionOptions } from '@internal/database/pool'
import { logger, logSchema } from '@internal/monitoring'
import { dbQueryPerformance } from '@internal/monitoring/metrics'
import { StoragePgDB } from '@storage/database'
import { PgMetastore } from '@storage/protocols/iceberg/pg'
import { randomUUID } from 'crypto'
import { DatabaseError, type PoolClient } from 'pg'
import { getConfig } from '../config'

const { databaseURL, tenantId } = getConfig()

function poolLease(pool: PgPoolStrategy) {
  return { value: pool, release: () => {} }
}

describe('StoragePgDB bucket metadata', () => {
  let pool: PgPoolStrategy
  let db: StoragePgDB
  let runId: string
  let superUser: Awaited<ReturnType<typeof getServiceKeyUser>>
  let connectionSettings: TenantConnectionOptions

  beforeAll(async () => {
    await runMigrationsOnTenant({
      databaseUrl: databaseURL!,
      tenantId,
      waitForLock: true,
    })

    superUser = await getServiceKeyUser(tenantId)
    connectionSettings = {
      tenantId,
      dbUrl: databaseURL!,
      isExternalPool: false,
      maxConnections: 2,
      user: superUser,
      superUser,
      headers: { 'x-test-header': 'storage-pg-db' },
      method: 'GET',
      path: '/storage-pg-db',
      operation: () => 'storage-pg-db-test',
    }

    pool = new PgPoolStrategy(connectionSettings)
    db = new StoragePgDB(new PgTenantConnection(poolLease(pool), connectionSettings), {
      tenantId,
      host: 'localhost',
    })
  })

  beforeEach(() => {
    runId = `pg-storage-${Date.now()}-${randomUUID()}`
  })

  afterEach(async () => {
    await cleanupRunRows(runId)
  })

  afterAll(async () => {
    await pool.dispose('destroy')
  })

  it('creates, finds, lists, updates, counts, and deletes buckets through pg', async () => {
    const bucketId = `${runId}-bucket`
    const owner = randomUUID()

    await expect(
      db.createBucket({
        id: bucketId,
        name: bucketId,
        owner,
        public: false,
        file_size_limit: 1024,
        allowed_mime_types: ['image/png'],
      })
    ).resolves.toMatchObject({
      id: bucketId,
      name: bucketId,
      owner,
      owner_id: owner,
      public: false,
      file_size_limit: 1024,
      allowed_mime_types: ['image/png'],
      type: 'STANDARD',
    })

    await expect(
      db.findBucketById(
        bucketId,
        'id, name, owner, owner_id, public, file_size_limit, allowed_mime_types, type'
      )
    ).resolves.toMatchObject({
      id: bucketId,
      name: bucketId,
      owner,
      owner_id: owner,
      public: false,
      file_size_limit: 1024,
      allowed_mime_types: ['image/png'],
      type: 'STANDARD',
    })

    await expect(
      db.listBuckets('id, name, public, file_size_limit, allowed_mime_types, type', {
        search: runId,
        sortColumn: 'name',
        sortOrder: 'asc',
        limit: 10,
      })
    ).resolves.toEqual([
      expect.objectContaining({
        id: bucketId,
        name: bucketId,
        public: false,
        type: 'STANDARD',
      }),
    ])

    await expect(
      db.listBuckets('type', {
        search: runId,
        limit: 1,
      })
    ).resolves.toEqual([
      {
        type: 'STANDARD',
      },
    ])

    await db.withTransaction(async (tx) => {
      await expect(tx.findBucketById(bucketId, 'id', { forUpdate: true })).resolves.toEqual({
        id: bucketId,
      })
    })

    await db.updateBucket(bucketId, {
      public: true,
      file_size_limit: null,
      allowed_mime_types: ['image/jpeg'],
    })

    await expect(
      db.findBucketById(bucketId, 'id, public, file_size_limit, allowed_mime_types')
    ).resolves.toMatchObject({
      id: bucketId,
      public: true,
      file_size_limit: null,
      allowed_mime_types: ['image/jpeg'],
    })

    await insertObject(bucketId, `${runId}-object-a`)
    await insertObject(bucketId, `${runId}-object-b`)

    await expect(db.countObjectsInBucket(bucketId)).resolves.toBe(2)
    await expect(db.countObjectsInBucket(bucketId, 1)).resolves.toBe(1)

    await deleteObjects(bucketId)
    await expect(db.deleteBucket(bucketId)).resolves.toBe(1)
    await expect(
      db.findBucketById(bucketId, 'id', { dontErrorOnEmpty: true })
    ).resolves.toBeUndefined()
  })

  it('times out waitObjectLock through PostgreSQL without waiting for the held lock', async () => {
    const bucketId = `${runId}-lock-timeout-bucket`
    const objectName = `${runId}-lock-timeout-object`
    let releaseLock: (() => void) | undefined
    let markLockReady: (() => void) | undefined
    const lockReady = new Promise<void>((resolve) => {
      markLockReady = resolve
    })
    const lockReleased = new Promise<void>((resolve) => {
      releaseLock = resolve
    })
    const lockHolder = db.withTransaction(async (tx) => {
      await tx.waitObjectLock(bucketId, objectName)
      markLockReady?.()
      await lockReleased
    })

    await lockReady

    const releaseTimer = setTimeout(() => {
      releaseLock?.()
    }, 3_000)
    const start = Date.now()

    try {
      await expect(
        db.waitObjectLock(bucketId, objectName, undefined, { timeout: 200 })
      ).rejects.toMatchObject({
        code: 'LockTimeout',
      })

      expect(Date.now() - start).toBeLessThan(2_000)
      await expect(db.listBuckets('id', { limit: 1 })).resolves.toEqual(expect.any(Array))
    } finally {
      clearTimeout(releaseTimer)
      releaseLock?.()
      await lockHolder
    }
  })

  it('restores lock_timeout before later row locks in the same transaction', async () => {
    const bucketId = `${runId}-lock-timeout-restore`
    let releaseTimer: NodeJS.Timeout | undefined
    let releaseStarted = false
    let holderCompleted = false

    await db.createBucket({
      id: bucketId,
      name: bucketId,
      public: false,
    })

    const rowLockHolder = await pool.acquire().beginTransaction()

    try {
      await rowLockHolder.query({
        text: `
          SELECT id
          FROM storage.buckets
          WHERE id = $1
          FOR UPDATE
        `,
        values: [bucketId],
      })

      const releaseHolder = new Promise<void>((resolve, reject) => {
        releaseTimer = setTimeout(() => {
          releaseStarted = true
          rowLockHolder.commit().then(() => {
            holderCompleted = true
            resolve()
          }, reject)
        }, 300)
      })

      await expect(
        db.withTransaction(async (tx) => {
          await runStorageQuery(tx as StoragePgDB, 'SetPriorLockTimeout', (pg) =>
            pg.query({
              text: `SELECT set_config('lock_timeout', $1, true)`,
              values: ['1500ms'],
            })
          )

          await tx.waitObjectLock(bucketId, `${runId}-restore-lock`, undefined, {
            timeout: 100,
          })

          const result = await runStorageQuery(
            tx as StoragePgDB,
            'RowLockAfterWaitObjectLock',
            (pg) =>
              pg.query<{ id: string }>({
                text: `
                  SELECT id
                  FROM storage.buckets
                  WHERE id = $1
                  FOR UPDATE
                `,
                values: [bucketId],
              })
          )

          return result.rows[0]?.id
        })
      ).resolves.toBe(bucketId)

      await releaseHolder
      expect(releaseStarted).toBe(true)
    } finally {
      if (releaseTimer) {
        clearTimeout(releaseTimer)
      }
      if (!holderCompleted && !rowLockHolder.isCompleted()) {
        await rowLockHolder.rollback()
      }
    }
  })

  it('maps duplicate bucket inserts to BucketAlreadyExists', async () => {
    const bucketId = `${runId}-duplicate`

    await db.createBucket({
      id: bucketId,
      name: bucketId,
      public: false,
    })

    await expect(
      db.createBucket({
        id: bucketId,
        name: bucketId,
        public: false,
      })
    ).rejects.toMatchObject({
      code: 'BucketAlreadyExists',
    })
  })

  it('rolls back pg bucket transactions', async () => {
    const bucketId = `${runId}-rollback`

    await expect(
      db.withTransaction(async (tx) => {
        await tx.createBucket({
          id: bucketId,
          name: bucketId,
          public: false,
        })

        throw new Error('rollback pg bucket transaction')
      })
    ).rejects.toThrow('rollback pg bucket transaction')

    await expect(
      db.findBucketById(bucketId, 'id', { dontErrorOnEmpty: true })
    ).resolves.toBeUndefined()
  })

  it('keeps nested transactions inside the parent transaction', async () => {
    const bucketId = `${runId}-nested-rollback`

    await expect(
      db.withTransaction(async (tx) => {
        await tx.withTransaction(async (nestedTx) => {
          await nestedTx.createBucket({
            id: bucketId,
            name: bucketId,
            public: false,
          })
        })

        await expect(tx.findBucketById(bucketId, 'id')).resolves.toEqual({
          id: bucketId,
        })

        throw new Error('rollback parent transaction')
      })
    ).rejects.toThrow('rollback parent transaction')

    await expect(
      db.findBucketById(bucketId, 'id', { dontErrorOnEmpty: true })
    ).resolves.toBeUndefined()
  })

  it('keeps the caller scope when a service adapter is derived repeatedly', async () => {
    await withAuthenticatedDb('storage-pg-db-repeated-super-user', async (authenticatedDb) => {
      await authenticatedDb.withTransaction(async (tx) => {
        const serviceDb = tx.asSuperUser().asSuperUser()

        await expect(
          runStorageQuery(serviceDb, 'RepeatedSuperUserRole', readCurrentRoleFromExecutor)
        ).resolves.toBe(superUser.payload.role)
        await expect(readCurrentRole(tx)).resolves.toBe('authenticated')

        const failure = new Error('failed repeated super-user query')
        await expect(
          runStorageQuery(serviceDb, 'RepeatedSuperUserFailure', async (pg) => {
            expect(await readCurrentRoleFromExecutor(pg)).toBe(superUser.payload.role)
            throw failure
          })
        ).rejects.toBe(failure)
        await expect(readCurrentRole(tx)).resolves.toBe('authenticated')
      })
    })
  })

  it('restores parent transaction scope after failed super-user queries', async () => {
    await withAuthenticatedDb('storage-pg-db-authenticated-jwt', async (authenticatedDb) => {
      await authenticatedDb.withTransaction(async (tx) => {
        await expect(readCurrentRole(tx)).resolves.toBe('authenticated')

        await expect(
          runStorageQuery(tx.asSuperUser() as StoragePgDB, 'FailAsSuperUser', async (pg) => {
            const role = await readCurrentRoleFromExecutor(pg)
            expect(role).toBe(superUser.payload.role)
            throw new Error('failed super-user query')
          })
        ).rejects.toThrow('failed super-user query')

        await expect(readCurrentRole(tx)).resolves.toBe('authenticated')

        await expect(
          runStorageQuery(
            tx.asSuperUser() as StoragePgDB,
            'FailAsSuperUserWithPgError',
            async (pg) => {
              const role = await readCurrentRoleFromExecutor(pg)
              expect(role).toBe(superUser.payload.role)
              await pg.query('SELECT 1 / 0')
            }
          )
        ).rejects.toMatchObject({
          metadata: expect.objectContaining({
            code: '22012',
          }),
        })

        await expect(readCurrentRole(tx)).resolves.toBe('authenticated')
        const result = await runStorageQuery(tx, 'QueryAfterSuperUserPgError', (pg) =>
          pg.query<{ n: number }>('SELECT 1 AS n')
        )
        expect(result.rows[0].n).toBe(1)
      })
    })
  })

  it('preserves custom statement timeout after nested super-user scope restores', async () => {
    await withAuthenticatedDb('storage-pg-db-timeout-jwt', async (authenticatedDb) => {
      await authenticatedDb.withTransaction(
        async (tx) => {
          await expect(readCurrentRole(tx)).resolves.toBe('authenticated')
          await expect(readCurrentStatementTimeoutMs(tx)).resolves.toBe(4321)

          await expect(
            runStorageQuery(
              tx.asSuperUser() as StoragePgDB,
              'ReadSuperUserStatementTimeout',
              async (pg) => {
                await expect(readCurrentRoleFromExecutor(pg)).resolves.toBe(superUser.payload.role)
                await expect(readStatementTimeoutMs(pg)).resolves.toBe(4321)
              }
            )
          ).resolves.toBeUndefined()

          await expect(readCurrentRole(tx)).resolves.toBe('authenticated')
          await expect(readCurrentStatementTimeoutMs(tx)).resolves.toBe(4321)
        },
        { timeout: 4321 }
      )
    })
  })

  it('preserves custom statement timeout after failed nested super-user scope rolls back', async () => {
    await withAuthenticatedDb('storage-pg-db-timeout-rollback-jwt', async (authenticatedDb) => {
      await authenticatedDb.withTransaction(
        async (tx) => {
          await expect(readCurrentRole(tx)).resolves.toBe('authenticated')
          await expect(readCurrentStatementTimeoutMs(tx)).resolves.toBe(4321)

          await expect(
            runStorageQuery(
              tx.asSuperUser() as StoragePgDB,
              'FailSuperUserStatementTimeout',
              async (pg) => {
                await expect(readCurrentRoleFromExecutor(pg)).resolves.toBe(superUser.payload.role)
                await expect(readStatementTimeoutMs(pg)).resolves.toBe(4321)
                await pg.query("SELECT set_config('statement_timeout', '30s', true)")
                await expect(readStatementTimeoutMs(pg)).resolves.toBe(30000)
                throw new Error('failed nested super-user timeout query')
              }
            )
          ).rejects.toThrow('failed nested super-user timeout query')

          await expect(readCurrentRole(tx)).resolves.toBe('authenticated')
          await expect(readCurrentStatementTimeoutMs(tx)).resolves.toBe(4321)
        },
        { timeout: 4321 }
      )
    })
  })

  it('preserves original errors when best-effort parent scope restoration fails', async () => {
    const originalError = new Error('original query failure')
    const restoreError = new DatabaseError('restore failed', 'restore failed'.length, 'error')
    restoreError.code = '25P02'
    const transaction = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      rollback: vi.fn().mockResolvedValue(undefined),
      isCompleted: vi.fn().mockReturnValue(false),
    } as unknown as PgTransaction
    const parentTnx = {
      isCompleted: vi.fn().mockReturnValue(false),
    } as unknown as PgTransaction
    const parentConnection = {
      role: 'authenticated',
      setScope: vi.fn().mockRejectedValue(restoreError),
    } as unknown as PgTenantConnection
    const connection = {
      role: superUser.payload.role,
      getAbortSignal: vi.fn().mockReturnValue(undefined),
      transaction: vi.fn().mockResolvedValue(transaction),
      setScope: vi.fn().mockResolvedValue(undefined),
    } as unknown as PgTenantConnection
    const storage = new StoragePgDB(connection, {
      tenantId,
      host: 'localhost',
      parentConnection,
      parentTnx,
    })
    const logSpy = vi.spyOn(logSchema, 'error').mockImplementation(() => undefined)

    try {
      await expect(
        runStorageQuery(storage, 'RestoreScopeFailure', async () => {
          throw originalError
        })
      ).rejects.toBe(originalError)

      expect(parentConnection.setScope).toHaveBeenCalledWith(parentTnx)
      expect(logSpy).toHaveBeenCalledWith(
        logger,
        '[StoragePgDB] Failed to restore parent transaction scope',
        expect.objectContaining({
          type: 'db',
          tenantId,
          project: tenantId,
          error: restoreError,
          metadata: expect.stringContaining('"errorCode":"25P02"'),
        })
      )
    } finally {
      logSpy.mockRestore()
    }
  })

  it('skips best-effort parent scope restoration after parent transaction completion', async () => {
    const transaction = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      commit: vi.fn().mockResolvedValue(undefined),
      rollback: vi.fn().mockResolvedValue(undefined),
      isCompleted: vi.fn().mockReturnValue(false),
    } as unknown as PgTransaction
    const parentTnx = {
      isCompleted: vi.fn().mockReturnValue(true),
    } as unknown as PgTransaction
    const parentConnection = {
      role: 'authenticated',
      setScope: vi.fn().mockResolvedValue(undefined),
    } as unknown as PgTenantConnection
    const connection = {
      role: superUser.payload.role,
      getAbortSignal: vi.fn().mockReturnValue(undefined),
      transaction: vi.fn().mockResolvedValue(transaction),
      setScope: vi.fn().mockResolvedValue(undefined),
    } as unknown as PgTenantConnection
    const storage = new StoragePgDB(connection, {
      tenantId,
      host: 'localhost',
      parentConnection,
      parentTnx,
    })

    await expect(
      runStorageQuery(storage, 'SkipCompletedParentScopeRestore', async () => 'ok')
    ).resolves.toBe('ok')

    expect(parentConnection.setScope).not.toHaveBeenCalled()
  })

  it('maps aborted parent transactions when query savepoint creation fails', async () => {
    const savepointError = createPgError('25P02', 'current transaction is aborted')
    const transaction = {
      query: vi.fn().mockRejectedValueOnce(savepointError),
      rollback: vi.fn().mockResolvedValue(undefined),
      isCompleted: vi.fn().mockReturnValue(false),
    } as unknown as PgTransaction
    const parentConnection = {
      role: 'authenticated',
      setScope: vi.fn().mockResolvedValue(undefined),
    } as unknown as PgTenantConnection
    const connection = {
      role: superUser.payload.role,
      getAbortSignal: vi.fn().mockReturnValue(undefined),
      setScope: vi.fn().mockResolvedValue(undefined),
    } as unknown as PgTenantConnection
    const storage = new StoragePgDB(connection, {
      tenantId,
      host: 'localhost',
      tnx: transaction,
      parentTnx: transaction,
      parentConnection,
    })
    const fn = vi.fn()

    await expect(runStorageQuery(storage, 'SavepointCreationFailure', fn)).rejects.toMatchObject({
      code: 'DatabaseTransactionAborted',
      originalError: savepointError,
      metadata: {
        code: '25P02',
        query: expect.stringMatching(/^SAVEPOINT "storage_pg_query_/),
      },
    })

    expect(fn).not.toHaveBeenCalled()
    expect(transaction.query).toHaveBeenCalledTimes(1)
    expect(transaction.query).toHaveBeenCalledWith(
      expect.stringMatching(/^SAVEPOINT "storage_pg_query_/)
    )
    expect(transaction.rollback).not.toHaveBeenCalled()
    expect(connection.setScope).not.toHaveBeenCalled()
    expect(parentConnection.setScope).not.toHaveBeenCalled()
  })

  it('maps aborted parent transactions when nested transaction savepoint creation fails', async () => {
    const savepointError = createPgError('25P02', 'current transaction is aborted')
    const transaction = {
      query: vi.fn().mockRejectedValueOnce(savepointError),
      rollback: vi.fn().mockResolvedValue(undefined),
      isCompleted: vi.fn().mockReturnValue(false),
    } as unknown as PgTransaction
    const connection = {
      role: 'authenticated',
      getAbortSignal: vi.fn().mockReturnValue(undefined),
      setScope: vi.fn().mockResolvedValue(undefined),
    } as unknown as PgTenantConnection
    const storage = new StoragePgDB(connection, {
      tenantId,
      host: 'localhost',
      tnx: transaction,
      parentTnx: transaction,
    })
    const fn = vi.fn()

    await expect(storage.withTransaction(fn)).rejects.toMatchObject({
      code: 'DatabaseTransactionAborted',
      originalError: savepointError,
      metadata: {
        code: '25P02',
        query: expect.stringMatching(/^SAVEPOINT "storage_pg_query_/),
      },
    })

    expect(fn).not.toHaveBeenCalled()
    expect(transaction.query).toHaveBeenCalledTimes(1)
    expect(transaction.query).toHaveBeenCalledWith(
      expect.stringMatching(/^SAVEPOINT "storage_pg_query_/)
    )
    expect(transaction.rollback).not.toHaveBeenCalled()
    expect(connection.setScope).not.toHaveBeenCalled()
  })

  it('preserves original errors when savepoint rollback fails', async () => {
    const originalError = new Error('nested query failed')
    const rollbackError = new Error('rollback savepoint failed')
    const transaction = {
      query: vi.fn().mockResolvedValueOnce({ rows: [] }).mockRejectedValueOnce(rollbackError),
      isCompleted: vi.fn().mockReturnValue(false),
    } as unknown as PgTransaction
    const parentConnection = {
      role: 'authenticated',
    } as unknown as PgTenantConnection
    const connection = {
      role: superUser.payload.role,
      getAbortSignal: vi.fn().mockReturnValue(undefined),
      setScope: vi.fn().mockResolvedValue(undefined),
    } as unknown as PgTenantConnection
    const storage = new StoragePgDB(connection, {
      tenantId,
      host: 'localhost',
      tnx: transaction,
      parentTnx: transaction,
      parentConnection,
    })
    const logSpy = vi.spyOn(logSchema, 'warning').mockImplementation(() => undefined)

    try {
      await expect(
        runStorageQuery(storage, 'SavepointRollbackFailure', async () => {
          throw originalError
        })
      ).rejects.toBe(originalError)

      expect(transaction.query).toHaveBeenCalledTimes(2)
      expect(transaction.query).toHaveBeenNthCalledWith(1, expect.stringMatching(/^SAVEPOINT /))
      expect(transaction.query).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/^ROLLBACK TO SAVEPOINT /)
      )
      expect(logSpy).toHaveBeenCalledWith(
        logger,
        '[StoragePgDB] Failed to rollback savepoint',
        expect.objectContaining({
          type: 'db',
          tenantId,
          project: tenantId,
          error: rollbackError,
        })
      )
    } finally {
      logSpy.mockRestore()
    }
  })

  it('preserves original errors when top-level transaction rollback fails', async () => {
    const originalError = new Error('top-level transaction failed')
    const rollbackError = new Error('rollback failed')
    const transaction = {
      commit: vi.fn().mockResolvedValue(undefined),
      rollback: vi.fn().mockRejectedValue(rollbackError),
    } as unknown as PgTransaction
    const connection = {
      role: superUser.payload.role,
      transaction: vi.fn().mockResolvedValue(transaction),
      setScope: vi.fn().mockResolvedValue(undefined),
    } as unknown as PgTenantConnection
    const storage = new StoragePgDB(connection, {
      tenantId,
      host: 'localhost',
    })
    const logSpy = vi.spyOn(logSchema, 'warning').mockImplementation(() => undefined)

    try {
      await expect(
        storage.withTransaction(async () => {
          throw originalError
        })
      ).rejects.toBe(originalError)

      expect(transaction.rollback).toHaveBeenCalledTimes(1)
      expect(transaction.commit).not.toHaveBeenCalled()
      expect(logSpy).toHaveBeenCalledWith(
        logger,
        '[StoragePgDB] Failed to rollback transaction',
        expect.objectContaining({
          type: 'db',
          tenantId,
          project: tenantId,
          error: rollbackError,
        })
      )
    } finally {
      logSpy.mockRestore()
    }
  })

  it('preserves original runQuery errors when top-level rollback fails', async () => {
    const originalError = new Error('top-level runQuery failed')
    const rollbackError = new Error('rollback failed')
    const transaction = {
      rollback: vi.fn().mockRejectedValue(rollbackError),
      isCompleted: vi.fn().mockReturnValue(false),
    } as unknown as PgTransaction
    const connection = {
      role: superUser.payload.role,
      getAbortSignal: vi.fn().mockReturnValue(undefined),
      transaction: vi.fn().mockResolvedValue(transaction),
      setScope: vi.fn().mockResolvedValue(undefined),
    } as unknown as PgTenantConnection
    const storage = new StoragePgDB(connection, {
      tenantId,
      host: 'localhost',
    })
    const logSpy = vi.spyOn(logSchema, 'warning').mockImplementation(() => undefined)

    try {
      await expect(
        runStorageQuery(storage, 'TopLevelRunQueryRollbackFailure', async () => {
          throw originalError
        })
      ).rejects.toBe(originalError)

      expect(transaction.rollback).toHaveBeenCalledTimes(1)
      expect(logSpy).toHaveBeenCalledWith(
        logger,
        '[StoragePgDB] Failed to rollback transaction',
        expect.objectContaining({
          type: 'db',
          tenantId,
          project: tenantId,
          error: rollbackError,
        })
      )
    } finally {
      logSpy.mockRestore()
    }
  })

  it('maps PostgreSQL lock_timeout from waitObjectLock to LockTimeout', async () => {
    const lockTimeoutError = createPgError('55P03', 'canceling statement due to lock timeout')
    const queries: Array<string | DatabaseStatement> = []
    const transaction = {
      query: vi.fn(async (statement: string | DatabaseStatement) => {
        queries.push(statement)

        const text = typeof statement === 'string' ? statement : statement.text
        if (text.includes('pg_advisory_xact_lock')) {
          throw lockTimeoutError
        }
        if (text.includes(`current_setting('lock_timeout')`)) {
          return { rows: [{ lock_timeout: '0' }] }
        }

        return { rows: [] }
      }),
      commit: vi.fn().mockResolvedValue(undefined),
      rollback: vi.fn().mockResolvedValue(undefined),
      isCompleted: vi.fn().mockReturnValue(false),
    } as unknown as PgTransaction
    const connection = {
      role: superUser.payload.role,
      getAbortSignal: vi.fn().mockReturnValue(undefined),
      transaction: vi.fn().mockResolvedValue(transaction),
      setScope: vi.fn().mockResolvedValue(undefined),
    } as unknown as PgTenantConnection
    const storage = new StoragePgDB(connection, {
      tenantId,
      host: 'localhost',
      databaseEngine: 'postgres',
    })

    await expect(
      storage.waitObjectLock('bucket', 'object', undefined, { timeout: 123 })
    ).rejects.toMatchObject({
      code: 'LockTimeout',
      originalError: lockTimeoutError,
    })

    expect(transaction.commit).not.toHaveBeenCalled()
    expect(transaction.rollback).toHaveBeenCalledTimes(1)
    expect(queries).toHaveLength(1)
    expect(statementText(queries[0])).toContain('WITH previous_lock_timeout AS MATERIALIZED')
    expect(statementText(queries[0])).toContain(`current_setting('lock_timeout')`)
    expect(statementText(queries[0])).toContain(`set_config('lock_timeout', $2, true)`)
    expect(statementText(queries[0])).toContain('pg_advisory_xact_lock($1)')
    expect(statementValues(queries[0])).toEqual([expect.any(Number), '123ms'])
  })

  it('restores the prior transaction-local lock_timeout after waitObjectLock succeeds', async () => {
    const queries: Array<string | DatabaseStatement> = []
    const transaction = {
      query: vi.fn(async (statement: string | DatabaseStatement) => {
        queries.push(statement)

        const text = typeof statement === 'string' ? statement : statement.text
        if (text.includes(`current_setting('lock_timeout')`)) {
          return { rows: [{ lock_timeout: '2s' }] }
        }

        return { rows: [] }
      }),
      commit: vi.fn().mockResolvedValue(undefined),
      rollback: vi.fn().mockResolvedValue(undefined),
      isCompleted: vi.fn().mockReturnValue(false),
    } as unknown as PgTransaction
    const connection = {
      role: superUser.payload.role,
      getAbortSignal: vi.fn().mockReturnValue(undefined),
      transaction: vi.fn().mockResolvedValue(transaction),
      setScope: vi.fn().mockResolvedValue(undefined),
    } as unknown as PgTenantConnection
    const storage = new StoragePgDB(connection, {
      tenantId,
      host: 'localhost',
      databaseEngine: 'postgres',
    })

    await expect(
      storage.waitObjectLock('bucket', 'object', undefined, { timeout: 123 })
    ).resolves.toBe(true)

    expect(transaction.rollback).not.toHaveBeenCalled()
    expect(transaction.commit).toHaveBeenCalledTimes(1)
    expect(queries).toHaveLength(1)
    expect(statementText(queries[0])).toContain('WITH previous_lock_timeout AS MATERIALIZED')
    expect(statementText(queries[0])).toContain(`current_setting('lock_timeout')`)
    expect(statementText(queries[0])).toContain(`set_config('lock_timeout', $2, true)`)
    expect(statementText(queries[0])).toContain('pg_advisory_xact_lock($1)')
    expect(statementText(queries[0])).toContain(`set_config('lock_timeout', value, true)`)
    expect(statementValues(queries[0])).toEqual([expect.any(Number), '123ms'])
  })

  it('uses top-level lock_timeout statements for Multigres waitObjectLock', async () => {
    const queries: Array<string | DatabaseStatement> = []
    const transaction = {
      query: vi.fn(async (statement: string | DatabaseStatement) => {
        queries.push(statement)

        const text = typeof statement === 'string' ? statement : statement.text
        if (text.includes(`current_setting('lock_timeout')`)) {
          return { rows: [{ value: '2s' }] }
        }

        return { rows: [] }
      }),
      commit: vi.fn().mockResolvedValue(undefined),
      rollback: vi.fn().mockResolvedValue(undefined),
      isCompleted: vi.fn().mockReturnValue(false),
    } as unknown as PgTransaction
    const connection = {
      role: superUser.payload.role,
      getAbortSignal: vi.fn().mockReturnValue(undefined),
      transaction: vi.fn().mockResolvedValue(transaction),
      setScope: vi.fn().mockResolvedValue(undefined),
    } as unknown as PgTenantConnection
    const storage = new StoragePgDB(connection, {
      tenantId,
      host: 'localhost',
      databaseEngine: 'multigres',
    } as ConstructorParameters<typeof StoragePgDB>[1])

    await expect(
      storage.waitObjectLock('bucket', 'object', undefined, { timeout: 123 })
    ).resolves.toBe(true)

    expect(transaction.rollback).not.toHaveBeenCalled()
    expect(transaction.commit).toHaveBeenCalledTimes(1)
    expect(queries).toHaveLength(4)
    expect(statementText(queries[0])).toContain(`current_setting('lock_timeout')`)
    expect(statementValues(queries[0])).toEqual([])
    expect(statementText(queries[1])).toContain(`set_config('lock_timeout', $1, true)`)
    expect(statementValues(queries[1])).toEqual(['123ms'])
    expect(statementText(queries[2])).toContain('pg_advisory_xact_lock($1)')
    expect(statementValues(queries[2])).toEqual([expect.any(Number)])
    expect(statementText(queries[3])).toContain(`set_config('lock_timeout', $1, true)`)
    expect(statementValues(queries[3])).toEqual(['2s'])
  })

  it('preserves original metastore errors when top-level rollback fails', async () => {
    const originalError = new Error('metastore failed')
    const rollbackError = new Error('rollback failed')
    const trx = {
      commit: vi.fn().mockResolvedValue(undefined),
      rollback: vi.fn().mockRejectedValue(rollbackError),
    } as unknown as PgTransaction
    const executor = {
      beginTransaction: vi.fn().mockResolvedValue(trx),
    } as never
    const metastore = new PgMetastore(executor, {
      schema: 'storage',
    })
    const logSpy = vi.spyOn(logSchema, 'warning').mockImplementation(() => undefined)

    try {
      await expect(
        metastore.transaction(async () => {
          throw originalError
        })
      ).rejects.toBe(originalError)

      expect(trx.rollback).toHaveBeenCalledTimes(1)
      expect(logSpy).toHaveBeenCalledWith(
        logger,
        '[PgMetastore] Failed to rollback transaction',
        expect.objectContaining({
          type: 'db',
          error: rollbackError,
        })
      )
    } finally {
      logSpy.mockRestore()
    }
  })

  it('rolls back nested metastore transactions to a savepoint', async () => {
    const trx = await pool.acquire().beginTransaction()
    const querySpy = vi.spyOn(trx, 'query')
    const metastore = new PgMetastore(trx, {
      schema: 'storage',
    })

    try {
      await expect(
        metastore.transaction(async () => {
          throw new Error('nested metastore failed')
        })
      ).rejects.toThrow('nested metastore failed')

      expect(querySpy).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/^SAVEPOINT "iceberg_pg_transaction_/)
      )
      expect(querySpy).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/^ROLLBACK TO SAVEPOINT "iceberg_pg_transaction_/)
      )
      expect(querySpy).toHaveBeenNthCalledWith(
        3,
        expect.stringMatching(/^RELEASE SAVEPOINT "iceberg_pg_transaction_/)
      )
    } finally {
      querySpy.mockRestore()
      if (!trx.isCompleted()) {
        await trx.rollback()
      }
    }
  })

  it('maps aborted parent metastore transactions when savepoint creation fails', async () => {
    const savepointError = createPgError('25P02', 'current transaction is aborted')
    const query = vi.fn().mockRejectedValueOnce(savepointError)
    const client = {
      query,
      release: vi.fn(),
    } as unknown as PoolClient
    const trx = new PgTransaction(client)
    const metastore = new PgMetastore(trx, {
      schema: 'storage',
    })
    const fn = vi.fn()

    await expect(metastore.transaction(fn)).rejects.toMatchObject({
      code: 'DatabaseTransactionAborted',
      originalError: savepointError,
      metadata: {
        code: '25P02',
        query: expect.stringMatching(/^SAVEPOINT "iceberg_pg_transaction_/),
      },
    })

    expect(fn).not.toHaveBeenCalled()
    expect(query).toHaveBeenCalledTimes(1)
    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(/^SAVEPOINT "iceberg_pg_transaction_/),
      undefined
    )
  })

  it('tags request-aborted pg query duration metrics', async () => {
    const connection = new PgTenantConnection(poolLease(pool), connectionSettings)
    const storage = new StoragePgDB(connection, {
      tenantId,
      host: 'localhost',
    })
    const controller = new AbortController()
    controller.abort()
    connection.setAbortSignal(controller.signal)
    const recordSpy = vi.spyOn(dbQueryPerformance, 'record')

    try {
      await expect(
        runStorageQuery(storage, 'AbortedStoragePgQueryMetric', async (pg, signal) => {
          await pg.query('SELECT 1', { signal })
        })
      ).rejects.toMatchObject({
        name: 'AbortError',
        code: 'ABORT_ERR',
        message: 'Query was aborted',
      })

      expect(recordSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          name: 'AbortedStoragePgQueryMetric',
          requestAborted: true,
          requestAbortedBeforeStart: true,
          requestAbortedAfterStart: false,
        })
      )
      expect(recordSpy.mock.calls[0]?.[1]).not.toHaveProperty('tenantId')
    } finally {
      recordSpy.mockRestore()
    }
  })

  it('records pg query duration when transaction setup fails', async () => {
    const transactionError = new Error('transaction setup failed')
    const connection = {
      role: superUser.payload.role,
      getAbortSignal: vi.fn().mockReturnValue(undefined),
      transaction: vi.fn().mockRejectedValue(transactionError),
    } as unknown as PgTenantConnection
    const storage = new StoragePgDB(connection, {
      tenantId,
      host: 'localhost',
    })
    const recordSpy = vi.spyOn(dbQueryPerformance, 'record')

    try {
      await expect(
        runStorageQuery(storage, 'TransactionSetupFailureMetric', async () => 'unreachable')
      ).rejects.toBe(transactionError)

      expect(recordSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          name: 'TransactionSetupFailureMetric',
          requestAborted: false,
        })
      )
      expect(recordSpy.mock.calls[0]?.[1]).not.toHaveProperty('tenantId')
    } finally {
      recordSpy.mockRestore()
    }
  })

  it('tags request aborts observed after query start separately', async () => {
    const connection = new PgTenantConnection(poolLease(pool), connectionSettings)
    const storage = new StoragePgDB(connection, {
      tenantId,
      host: 'localhost',
    })
    const controller = new AbortController()
    connection.setAbortSignal(controller.signal)
    const recordSpy = vi.spyOn(dbQueryPerformance, 'record')

    try {
      await expect(
        runStorageQuery(storage, 'RequestAbortAfterStartMetric', async (pg) => {
          const result = await pg.query('SELECT 1')
          controller.abort()
          return result.rows
        })
      ).resolves.toEqual([{ '?column?': 1 }])

      expect(recordSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          name: 'RequestAbortAfterStartMetric',
          requestAborted: true,
          requestAbortedBeforeStart: false,
          requestAbortedAfterStart: true,
        })
      )
      expect(recordSpy.mock.calls[0]?.[1]).not.toHaveProperty('tenantId')
    } finally {
      recordSpy.mockRestore()
    }
  })

  it('creates, finds, lists, updates, locks, and deletes object metadata through pg', async () => {
    const bucketId = `${runId}-objects`
    const owner = randomUUID()
    const objectA = `${runId}-folder/a.txt`
    const objectARenamed = `${runId}-folder/a-renamed.txt`
    const objectB = `${runId}-folder/b.txt`
    const objectC = `${runId}-other/c.txt`
    const objectD = `${runId}-delete/d.txt`
    const objectE = `${runId}-delete/e.txt`

    await db.createBucket({
      id: bucketId,
      name: bucketId,
      public: false,
    })

    await expect(
      db.createObject({
        bucket_id: bucketId,
        name: objectA,
        owner,
        metadata: { size: 1, mimetype: 'text/plain' },
        user_metadata: { cache: 'a' },
        version: 'v1',
      })
    ).resolves.toMatchObject({
      bucket_id: bucketId,
      name: objectA,
      owner,
      owner_id: owner,
      metadata: { size: 1, mimetype: 'text/plain' },
      user_metadata: { cache: 'a' },
      version: 'v1',
    })

    await expect(
      db.createObject({
        bucket_id: bucketId,
        name: objectA,
        metadata: { size: 1 },
      })
    ).rejects.toMatchObject({
      code: 'KeyAlreadyExists',
    })

    await db.upsertObject({
      bucket_id: bucketId,
      name: objectB,
      owner,
      metadata: { size: 2 },
      user_metadata: { cache: 'b' },
      version: 'v1',
    })

    await expect(
      db.upsertObject({
        bucket_id: bucketId,
        name: objectB,
        owner,
        metadata: { size: 22 },
        user_metadata: { cache: 'b2' },
        version: 'v2',
      })
    ).resolves.toMatchObject({
      bucket_id: bucketId,
      name: objectB,
      metadata: { size: 22 },
      user_metadata: { cache: 'b2' },
      version: 'v2',
    })

    await db.createObject({
      bucket_id: bucketId,
      name: objectC,
      metadata: { size: 3 },
      version: 'v1',
    })

    await expect(
      db.findObject(
        bucketId,
        objectA,
        'name,bucket_id,owner,owner_id,metadata,user_metadata,version'
      )
    ).resolves.toMatchObject({
      bucket_id: bucketId,
      name: objectA,
      owner,
      owner_id: owner,
      metadata: { size: 1, mimetype: 'text/plain' },
      user_metadata: { cache: 'a' },
      version: 'v1',
    })

    await db.withTransaction(async (tx) => {
      await expect(tx.findObject(bucketId, objectA, 'name', { forShare: true })).resolves.toEqual({
        name: objectA,
      })
      await expect(tx.waitObjectLock(bucketId, `${runId}-wait-lock`)).resolves.toBe(true)
    })

    let releaseLock: (() => void) | undefined
    let resolveLockReady: (() => void) | undefined
    let rejectLockReady: ((error: unknown) => void) | undefined
    const lockReady = new Promise<void>((resolve, reject) => {
      resolveLockReady = resolve
      rejectLockReady = reject
    })
    const lockHolder = db.withTransaction(async (tx) => {
      try {
        await tx.mustLockObject(bucketId, `${runId}-must-lock`)
        resolveLockReady?.()
      } catch (e) {
        rejectLockReady?.(e)
        throw e
      }
      await new Promise<void>((resolve) => {
        releaseLock = resolve
      })
    })

    try {
      await lockReady
      await expect(db.mustLockObject(bucketId, `${runId}-must-lock`)).rejects.toMatchObject({
        code: 'ResourceLocked',
      })
    } finally {
      releaseLock?.()
      await lockHolder
    }

    await expect(
      db.updateObject(bucketId, objectA, {
        bucket_id: bucketId,
        name: objectARenamed,
        owner,
        metadata: { size: 10 },
        user_metadata: { cache: 'a2' },
        version: 'v2',
      })
    ).resolves.toMatchObject({
      bucket_id: bucketId,
      name: objectARenamed,
      metadata: { size: 10 },
      user_metadata: { cache: 'a2' },
      version: 'v2',
    })

    await expect(db.updateObjectOwner(bucketId, objectB, owner)).resolves.toMatchObject({
      name: objectB,
      owner,
      owner_id: owner,
    })

    await expect(
      db.findObjects(bucketId, [objectARenamed, objectB], 'name,version')
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: objectARenamed, version: 'v2' }),
        expect.objectContaining({ name: objectB, version: 'v2' }),
      ])
    )

    await expect(
      db.findObjectVersions(bucketId, [
        { name: objectARenamed, version: 'v2' },
        { name: objectB, version: 'v2' },
      ])
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: objectARenamed, version: 'v2' }),
        expect.objectContaining({ name: objectB, version: 'v2' }),
      ])
    )

    const firstPage = await db.listObjects(bucketId, 'name', 2)
    expect(firstPage).toHaveLength(2)
    await expect(
      db.listObjects(bucketId, 'name', 10, undefined, firstPage[1].name)
    ).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ name: objectC })]))

    await expect(
      db.listObjectsV2(bucketId, {
        prefix: `${runId}-folder/`,
        maxKeys: 10,
      })
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: objectARenamed }),
        expect.objectContaining({ name: objectB }),
      ])
    )

    await expect(
      db.searchObjects(bucketId, `${runId}-folder/`, {
        limit: 10,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      })
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'a-renamed.txt' }),
        expect.objectContaining({ name: 'b.txt' }),
      ])
    )

    await expect(
      db.deleteObjectVersions(bucketId, [
        { name: objectARenamed, version: 'v2' },
        { name: objectB, version: 'v2' },
      ])
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: objectARenamed }),
        expect.objectContaining({ name: objectB }),
      ])
    )

    await expect(db.deleteObject(bucketId, objectC, 'v1')).resolves.toMatchObject({
      name: objectC,
    })

    await db.createObject({ bucket_id: bucketId, name: objectD, metadata: { size: 4 } })
    await db.createObject({ bucket_id: bucketId, name: objectE, metadata: { size: 5 } })

    await expect(db.deleteObjects(bucketId, [objectD, objectE], 'name')).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: objectD }),
        expect.objectContaining({ name: objectE }),
      ])
    )

    await expect(
      db.findObject(bucketId, objectARenamed, 'id', { dontErrorOnEmpty: true })
    ).resolves.toBeUndefined()
  })

  it('creates, finds, lists, updates, and deletes multipart metadata through pg', async () => {
    const bucketId = `${runId}-multipart`
    const owner = randomUUID()
    const uploadIdA = `${runId}-upload-a`
    const uploadIdB = `${runId}-upload-b`
    const keyA = `${runId}-multi/a/file.txt`
    const keyB = `${runId}-multi/b/file.txt`

    await db.createBucket({
      id: bucketId,
      name: bucketId,
      public: false,
    })

    await expect(
      db.createMultipartUpload(
        uploadIdA,
        bucketId,
        keyA,
        'version-a',
        'signature-a',
        owner,
        { cache: 'a' },
        { mimetype: 'text/plain' }
      )
    ).resolves.toMatchObject({
      id: uploadIdA,
      bucket_id: bucketId,
      key: keyA,
      version: 'version-a',
      upload_signature: 'signature-a',
      owner_id: owner,
      user_metadata: { cache: 'a' },
      metadata: { mimetype: 'text/plain' },
    })

    await db.createMultipartUpload(uploadIdB, bucketId, keyB, 'version-b', 'signature-b', owner)

    await expect(
      db.findMultipartUpload(uploadIdA, 'id,key,version,upload_signature,user_metadata,metadata')
    ).resolves.toMatchObject({
      id: uploadIdA,
      key: keyA,
      version: 'version-a',
      upload_signature: 'signature-a',
      user_metadata: { cache: 'a' },
      metadata: { mimetype: 'text/plain' },
    })

    await db.withTransaction(async (tx) => {
      await expect(
        tx.findMultipartUpload(uploadIdA, 'id,in_progress_size', { forUpdate: true })
      ).resolves.toMatchObject({
        id: uploadIdA,
        in_progress_size: 0,
      })

      await tx.updateMultipartUploadProgress(uploadIdA, 33, 'signature-progress')
    })

    await expect(
      db.findMultipartUpload(uploadIdA, 'id,in_progress_size,upload_signature')
    ).resolves.toMatchObject({
      id: uploadIdA,
      in_progress_size: 33,
      upload_signature: 'signature-progress',
    })

    await expect(
      db.listMultipartUploads(bucketId, {
        prefix: `${runId}-multi/`,
        maxKeys: 10,
      })
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: uploadIdA, key: keyA }),
        expect.objectContaining({ id: uploadIdB, key: keyB }),
      ])
    )

    await expect(
      db.listMultipartUploads(bucketId, {
        prefix: `${runId}-multi/`,
        deltimeter: '/',
        maxKeys: 10,
      })
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: `${runId}-multi/a/` }),
        expect.objectContaining({ key: `${runId}-multi/b/` }),
      ])
    )

    await db.insertUploadPart({
      upload_id: uploadIdA,
      bucket_id: bucketId,
      key: keyA,
      version: 'version-a',
      part_number: 1,
      etag: 'etag-1',
      owner_id: owner,
    })
    await db.insertUploadPart({
      upload_id: uploadIdA,
      bucket_id: bucketId,
      key: keyA,
      version: 'version-a',
      part_number: 2,
      etag: 'etag-2',
      owner_id: owner,
    })

    await expect(db.listParts(uploadIdA, { maxParts: 10 })).resolves.toEqual([
      expect.objectContaining({ upload_id: uploadIdA, part_number: 1, etag: 'etag-1', size: 0 }),
      expect.objectContaining({ upload_id: uploadIdA, part_number: 2, etag: 'etag-2', size: 0 }),
    ])

    await expect(db.listParts(uploadIdA, { afterPart: '1', maxParts: 10 })).resolves.toEqual([
      expect.objectContaining({ upload_id: uploadIdA, part_number: 2, etag: 'etag-2' }),
    ])

    await db.deleteMultipartUpload(uploadIdA)
    await expect(db.findMultipartUpload(uploadIdA, 'id')).rejects.toMatchObject({
      code: 'NoSuchUpload',
    })
    await expect(db.listParts(uploadIdA, { maxParts: 10 })).resolves.toEqual([])
  })

  it.each([
    undefined,
    '/',
  ])('continues same-key multipart uploads when the marker is present or gone with delimiter %s', async (deltimeter) => {
    const bucketId = `${runId}-multipart-cursor`
    const prefix = `${runId}-same-key/`
    const objectName = `${prefix}file.txt`
    const markerUploadId = `f${randomUUID().slice(1)}`
    const remainingOlderUploadId = `8${randomUUID().slice(1)}`
    const remainingNewerUploadId = `0${randomUUID().slice(1)}`

    await db.createBucket({
      id: bucketId,
      name: bucketId,
      public: false,
    })
    await db.createMultipartUpload(
      markerUploadId,
      bucketId,
      objectName,
      'marker-version',
      'marker-signature'
    )
    await db.createMultipartUpload(
      remainingOlderUploadId,
      bucketId,
      objectName,
      'remaining-older-version',
      'remaining-older-signature'
    )
    await db.createMultipartUpload(
      remainingNewerUploadId,
      bucketId,
      objectName,
      'remaining-newer-version',
      'remaining-newer-signature'
    )

    await pool.acquire().query({
      text: `
        UPDATE storage.s3_multipart_uploads
        SET created_at = CASE id
          WHEN $2 THEN '2026-01-01T00:00:00Z'::timestamptz
          WHEN $3 THEN '2026-01-02T00:00:00Z'::timestamptz
          ELSE '2026-01-03T00:00:00Z'::timestamptz
        END
        WHERE bucket_id = $1 AND id = ANY($4::text[])
      `,
      values: [
        bucketId,
        markerUploadId,
        remainingOlderUploadId,
        [markerUploadId, remainingOlderUploadId, remainingNewerUploadId],
      ],
    })

    const listAfterMarker = () =>
      db.listMultipartUploads(bucketId, {
        prefix,
        deltimeter,
        nextUploadKeyToken: objectName,
        nextUploadToken: markerUploadId,
        maxKeys: 10,
      })

    const expectedIds = [remainingOlderUploadId, remainingNewerUploadId]
    const uploadMarkerOnly = await db.listMultipartUploads(bucketId, {
      prefix,
      deltimeter,
      nextUploadToken: markerUploadId,
      maxKeys: 10,
    })
    expect(uploadMarkerOnly.map((upload) => upload.id)).toEqual([markerUploadId, ...expectedIds])

    const keyMarkerOnly = await db.listMultipartUploads(bucketId, {
      prefix,
      deltimeter,
      nextUploadKeyToken: objectName,
      maxKeys: 10,
    })
    expect(keyMarkerOnly).toEqual([])

    expect((await listAfterMarker()).map((upload) => upload.id)).toEqual(expectedIds)

    await db.deleteMultipartUpload(markerUploadId)
    expect((await listAfterMarker()).map((upload) => upload.id)).toEqual(expectedIds)
  })

  it.each([
    '%',
    '_',
    '\\',
  ])('uses the raw multipart prefix for delimiter parsing when it contains %s', async (specialCharacter) => {
    const bucketId = `${runId}-multipart-prefix`
    const prefix = `${runId}-${specialCharacter.repeat(4)}/`
    const objectName = `${prefix}a/file.txt`
    const uploadId = randomUUID()

    await db.createBucket({
      id: bucketId,
      name: bucketId,
      public: false,
    })
    await db.createMultipartUpload(uploadId, bucketId, objectName, 'version', 'signature')

    await expect(
      db.listMultipartUploads(bucketId, {
        prefix,
        deltimeter: '/',
        maxKeys: 10,
      })
    ).resolves.toEqual([
      expect.objectContaining({
        key: `${prefix}a/`,
      }),
    ])
  })

  it('creates, loads, searches, and drops scanner S3 key cache tables through pg', async () => {
    const tableName = `storage._s3_remote_keys_${Date.now()}_${randomUUID().replaceAll('-', '_')}`
    const keyA = `${runId}/a/v1`
    const keyB = `${runId}/b/v2`
    const keyC = `${runId}/c/v3`

    try {
      await db.createS3KeysTempTable(tableName)
      await expect(readTablePersistence(tableName)).resolves.toBe('u')

      await expect(
        db.insertS3KeysIntoTempTable(tableName, [
          { key: keyB, size: 2 },
          { key: keyA, size: 1 },
        ])
      ).resolves.toBeUndefined()

      await expect(
        db.insertS3KeysIntoTempTable(tableName, [
          { key: keyB, size: 20 },
          { key: keyC, size: 3 },
        ])
      ).resolves.toBeUndefined()

      await expect(db.listS3KeysFromTempTable(tableName, '', 2)).resolves.toEqual([
        { key: keyA, size: 1 },
        { key: keyB, size: 2 },
      ])

      await expect(db.listS3KeysFromTempTable(tableName, keyB, 2)).resolves.toEqual([
        { key: keyC, size: 3 },
      ])

      await expect(
        db.findS3KeysInTempTable(tableName, [keyC, `${runId}/missing`])
      ).resolves.toEqual([{ key: keyC }])
    } finally {
      await db.dropS3KeysTempTable(tableName)
    }
  })

  it.each([
    ['createS3KeysTempTable', (table: string) => db.createS3KeysTempTable(table)],
    ['dropS3KeysTempTable', (table: string) => db.dropS3KeysTempTable(table)],
    ['listS3KeysFromTempTable', (table: string) => db.listS3KeysFromTempTable(table, '', 1)],
    ['findS3KeysInTempTable', (table: string) => db.findS3KeysInTempTable(table, ['key'])],
    [
      'insertS3KeysIntoTempTable',
      (table: string) => db.insertS3KeysIntoTempTable(table, [{ key: 'key', size: 1 }]),
    ],
  ])('%s rejects unrelated table names at the scanner database boundary', async (_, call) => {
    const tableName = `storage.advisory_probe_${randomUUID().replaceAll('-', '_')}`
    await pool
      .acquire()
      .query(`CREATE TABLE ${tableName} (key text PRIMARY KEY, size bigint NOT NULL)`)

    try {
      await expect(call(tableName)).rejects.toThrow('Invalid Parameter tmpTable')
      await expect(tableExists(tableName)).resolves.toBe(true)
    } finally {
      await pool.acquire().query(`DROP TABLE IF EXISTS ${tableName}`)
    }
  })

  it('removes stale scanner S3 key cache tables before creating a new one', async () => {
    const staleTableName = `storage._s3_remote_keys_${Date.now() - 25 * 60 * 60 * 1000}_${randomUUID().replaceAll('-', '_')}`
    const freshTableName = `storage._s3_remote_keys_${Date.now()}_${randomUUID().replaceAll('-', '_')}`

    try {
      await db.createS3KeysTempTable(staleTableName)
      await expect(tableExists(staleTableName)).resolves.toBe(true)

      await db.createS3KeysTempTable(freshTableName)

      await expect(tableExists(staleTableName)).resolves.toBe(false)
      await expect(tableExists(freshTableName)).resolves.toBe(true)
    } finally {
      await db.dropS3KeysTempTable(staleTableName)
      await db.dropS3KeysTempTable(freshTableName)
    }
  })

  it('creates, lists, finds, and soft-deletes analytics buckets through pg', async () => {
    const bucketName = `${runId}-analytics`

    const created = await db.createAnalyticsBucket({ name: bucketName })
    expect(created).toMatchObject({
      id: expect.any(String),
      name: bucketName,
    })

    await expect(db.createAnalyticsBucket({ name: bucketName })).rejects.toMatchObject({
      code: 'ResourceAlreadyExists',
    })

    await expect(db.findAnalyticsBucketByName(bucketName)).resolves.toMatchObject({
      id: created.id,
      name: bucketName,
    })

    await expect(
      db.listAnalyticsBuckets('id, name, created_at, updated_at', {
        search: runId,
        sortColumn: 'name',
        sortOrder: 'asc',
        limit: 10,
      })
    ).resolves.toEqual([
      expect.objectContaining({
        id: created.id,
        name: bucketName,
      }),
    ])

    await expect(db.deleteAnalyticsBucket(created.id, { soft: true })).resolves.toMatchObject({
      id: created.id,
      name: bucketName,
      deleted_at: expect.any(Date),
    })

    await expect(db.findAnalyticsBucketByName(bucketName)).rejects.toMatchObject({
      code: 'NoSuchBucket',
    })
  })

  it('creates, finds, counts, and drops Iceberg metastore rows through pg', async () => {
    const bucketName = `${runId}-iceberg`
    const namespaceName = `ns_${Date.now()}`
    const tableName = `table_${Date.now()}`
    const catalog = await db.createAnalyticsBucket({ name: bucketName })
    const metastore = new PgMetastore(pool.acquire(), {
      schema: 'storage',
      multiTenant: false,
    })

    await expect(
      metastore.findCatalogByName({
        tenantId,
        name: bucketName,
      })
    ).resolves.toMatchObject({
      id: catalog.id,
      name: bucketName,
    })

    const namespace = await metastore.createNamespace({
      name: namespaceName,
      bucketId: catalog.id,
      bucketName,
      tenantId,
      metadata: { owner: runId },
    })

    await expect(
      metastore.listNamespaces({
        catalogId: catalog.id,
        tenantId,
      })
    ).resolves.toEqual([expect.objectContaining({ id: namespace.id, name: namespaceName })])

    const table = await metastore.transaction(async (tx) => {
      await tx.lockResource('namespace', namespace.id)
      return tx.createTable({
        name: tableName,
        bucketId: catalog.id,
        bucketName,
        namespaceId: namespace.id,
        tenantId,
        shardKey: 'shard-a',
        shardId: '1',
        location: `s3://${bucketName}/${namespaceName}/${tableName}`,
        remoteTableId: randomUUID(),
      })
    })

    await expect(
      metastore.findTableByName({
        tenantId,
        namespaceId: namespace.id,
        name: tableName,
      })
    ).resolves.toMatchObject({
      id: table.id,
      name: tableName,
      shard_key: 'shard-a',
      shard_id: '1',
    })

    await expect(
      metastore.findTableByLocation({
        tenantId,
        location: `s3://${bucketName}/${namespaceName}/${tableName}`,
      })
    ).resolves.toMatchObject({
      id: table.id,
      name: tableName,
    })

    await expect(
      metastore.countTables({
        namespaceId: namespace.id,
        tenantId,
        limit: 10,
      })
    ).resolves.toBe(1)

    for (let i = 0; i < 2; i++) {
      await metastore.createTable({
        name: `${tableName}_extra_${i}`,
        bucketId: catalog.id,
        bucketName,
        namespaceId: namespace.id,
        tenantId,
        shardKey: 'shard-a',
        shardId: `${i + 2}`,
        location: `s3://${bucketName}/${namespaceName}/${tableName}_extra_${i}`,
        remoteTableId: randomUUID(),
      })
    }

    await expect(
      metastore.countTables({
        namespaceId: namespace.id,
        tenantId,
        limit: 2,
      })
    ).resolves.toBe(2)

    await expect(
      metastore.countResources({
        bucketId: bucketName,
        tenantId,
        limit: 2,
      })
    ).resolves.toMatchObject({
      namespaces: 1,
      tables: 2,
    })

    await metastore.dropTable({
      name: tableName,
      namespaceId: namespace.id,
      catalogId: catalog.id,
      tenantId,
    })
    for (let i = 0; i < 2; i++) {
      await metastore.dropTable({
        name: `${tableName}_extra_${i}`,
        namespaceId: namespace.id,
        catalogId: catalog.id,
        tenantId,
      })
    }
    await metastore.dropNamespace({
      namespace: namespaceName,
      catalogId: catalog.id,
      tenantId,
    })
    await expect(metastore.dropCatalog({ bucketId: catalog.id, tenantId })).resolves.toBe(true)
  })

  async function insertObject(bucketId: string, objectName: string): Promise<void> {
    await pool.acquire().query({
      text: `
        INSERT INTO storage.objects (bucket_id, name, owner, metadata)
        VALUES ($1, $2, $3, $4)
      `,
      values: [bucketId, objectName, randomUUID(), { size: 1 }],
    })
  }

  async function deleteObjects(bucketId: string): Promise<void> {
    const tnx = await pool.acquire().beginTransaction()

    try {
      await tnx.query("SELECT set_config('storage.allow_delete_query', 'true', true)")
      await tnx.query({
        text: `
          DELETE FROM storage.objects
          WHERE bucket_id = $1
        `,
        values: [bucketId],
      })
      await tnx.commit()
    } catch (e) {
      await tnx.rollback()
      throw e
    }
  }

  function runStorageQuery<T>(
    storage: StoragePgDB,
    queryName: string,
    fn: (db: DatabaseExecutor, signal?: AbortSignal) => Promise<T>
  ): Promise<T> {
    return (
      storage as unknown as {
        runQuery<T>(
          queryName: string,
          fn: (db: DatabaseExecutor, signal?: AbortSignal) => Promise<T>
        ): Promise<T>
      }
    ).runQuery(queryName, fn)
  }

  function statementText(statement: string | DatabaseStatement): string {
    return typeof statement === 'string' ? statement : statement.text
  }

  function statementValues(statement: string | DatabaseStatement): unknown[] | undefined {
    return typeof statement === 'string' ? undefined : statement.values
  }

  function createPgError(code: string, message: string): DatabaseError {
    const error = new DatabaseError(message, message.length, 'error')
    error.code = code
    return error
  }

  function readCurrentRole(storage: StoragePgDB): Promise<string> {
    return runStorageQuery(storage, 'ReadCurrentRole', (pg) => readCurrentRoleFromExecutor(pg))
  }

  async function readCurrentRoleFromExecutor(pg: DatabaseExecutor): Promise<string> {
    const result = await pg.query<{ role: string }>(`
      SELECT current_setting('role', true) AS role
    `)

    return result.rows[0].role
  }

  function readCurrentStatementTimeoutMs(storage: StoragePgDB): Promise<number> {
    return runStorageQuery(storage, 'ReadCurrentStatementTimeout', (pg) =>
      readStatementTimeoutMs(pg)
    )
  }

  async function readStatementTimeoutMs(pg: DatabaseExecutor): Promise<number> {
    const result = await pg.query<{ statement_timeout: string }>(`
      SELECT current_setting('statement_timeout') AS statement_timeout
    `)

    return parseStatementTimeoutMs(result.rows[0].statement_timeout)
  }

  function parseStatementTimeoutMs(statementTimeout: string): number {
    const value = statementTimeout.trim()
    if (value === '0') {
      return 0
    }

    const match = /^(\d+(?:\.\d+)?)\s*(ms|s|min|h|d)?$/.exec(value)
    if (!match) {
      throw new Error(`Unexpected statement_timeout value: ${statementTimeout}`)
    }

    const multipliers = {
      ms: 1,
      s: 1000,
      min: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    }
    const amount = Number(match[1])
    const unit = (match[2] ?? 'ms') as keyof typeof multipliers

    return Math.round(amount * multipliers[unit])
  }

  async function withAuthenticatedDb(
    jwt: string,
    fn: (authenticatedDb: StoragePgDB) => Promise<void>
  ): Promise<void> {
    const authenticatedUser = {
      jwt,
      payload: {
        role: 'authenticated',
        sub: randomUUID(),
      },
    }
    const authenticatedSettings = {
      ...connectionSettings,
      user: authenticatedUser,
      superUser,
    }
    const authenticatedPool = new PgPoolStrategy(authenticatedSettings)
    const authenticatedDb = new StoragePgDB(
      new PgTenantConnection(poolLease(authenticatedPool), authenticatedSettings),
      {
        tenantId,
        host: 'localhost',
      }
    )

    try {
      await fn(authenticatedDb)
    } finally {
      await authenticatedPool.dispose('destroy')
    }
  }

  async function tableExists(tableName: string): Promise<boolean> {
    const result = await pool.acquire().query<{ exists: boolean }>({
      text: `SELECT to_regclass($1) IS NOT NULL AS "exists"`,
      values: [tableName],
    })

    return result.rows[0]?.exists === true
  }

  async function readTablePersistence(tableName: string): Promise<string | undefined> {
    const [schemaName, table] = tableName.split('.')
    const result = await pool.acquire().query<{ relpersistence: string }>({
      text: `
        SELECT c.relpersistence
        FROM pg_class c
        INNER JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = $1
          AND c.relname = $2
      `,
      values: [schemaName, table],
    })

    return result.rows[0]?.relpersistence
  }

  async function cleanupRunRows(currentRunId: string): Promise<void> {
    const tnx = await pool.acquire().beginTransaction()

    try {
      await tnx.query("SELECT set_config('storage.allow_delete_query', 'true', true)")
      await tnx.query({
        text: `
          DELETE FROM storage.iceberg_tables
          WHERE bucket_name LIKE $1
        `,
        values: [`${currentRunId}%`],
      })
      await tnx.query({
        text: `
          DELETE FROM storage.iceberg_namespaces
          WHERE bucket_name LIKE $1
        `,
        values: [`${currentRunId}%`],
      })
      await tnx.query({
        text: `
          DELETE FROM storage.s3_multipart_uploads
          WHERE bucket_id LIKE $1
        `,
        values: [`${currentRunId}%`],
      })
      await tnx.query({
        text: `
          DELETE FROM storage.objects
          WHERE bucket_id LIKE $1
        `,
        values: [`${currentRunId}%`],
      })
      await tnx.query({
        text: `
          DELETE FROM storage.buckets
          WHERE id LIKE $1
        `,
        values: [`${currentRunId}%`],
      })
      await tnx.query({
        text: `
          DELETE FROM storage.buckets_analytics
          WHERE name LIKE $1
        `,
        values: [`${currentRunId}%`],
      })
      await tnx.commit()
    } catch (e) {
      await tnx.rollback()
      throw e
    }
  }
})
