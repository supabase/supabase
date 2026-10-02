import {
  type DatabaseExecutor,
  type DatabaseTransaction,
  PgPoolExecutor,
  PgTenantConnection,
} from '@internal/database'
import * as migrations from '@internal/database/migrations'
import { DBMigration } from '@internal/database/migrations'
import { normalizeRawError } from '@internal/errors'
import { dbQueryPerformance } from '@internal/monitoring/metrics'
import { EventEmitter } from 'events'
import { DatabaseError, type Pool, type PoolClient } from 'pg'
import { vi } from 'vitest'
import type { BucketLifecycleConfiguration, LifecycleBucket } from '../schemas'
import { DBError } from './errors'
import { escapeLike, StoragePgDB } from './pg'

class TestStoragePgDB extends StoragePgDB {
  runMetricProbe(): Promise<string> {
    return this.runUnscopedQuery('MetricWithoutTenantAttribute', async () => 'ok')
  }

  runScopedMetricProbe(): Promise<string> {
    return this.runQuery('ScopedMetricDuration', async () => 'ok')
  }

  runErrorMappingProbe(): Promise<unknown> {
    return this.runQuery('FindBucketById', (db) => {
      return this.query(db, 'SELECT * FROM storage.buckets WHERE id = $1')
    })
  }

  runUnscopedErrorMappingProbe(): Promise<string> {
    return this.runUnscopedQuery('CreateS3KeysTempTable', async (db) => {
      await db.query('SELECT 1')
      return 'ok'
    })
  }
}

function createQueryCaptureStorage(latestMigration?: keyof typeof DBMigration | null | string) {
  const transaction = {
    commit: vi.fn(),
    rollback: vi.fn(),
    isCompleted: vi.fn().mockReturnValue(false),
    query: vi.fn().mockResolvedValue({ rows: [{ id: 'row' }], rowCount: 1 }),
  }
  const connection = {
    getAbortSignal: vi.fn().mockReturnValue(undefined),
    transaction: vi.fn().mockResolvedValue(transaction),
    setScope: vi.fn(),
  } as unknown as PgTenantConnection
  const storage = new StoragePgDB(connection, {
    tenantId: 'column-selection-tenant',
    host: 'localhost',
    latestMigration,
  } as ConstructorParameters<typeof StoragePgDB>[1])

  return { storage, transaction }
}

describe('escapeLike', () => {
  test('escapes SQL wildcard characters', () => {
    expect(escapeLike('%_abc')).toBe('\\%\\_abc')
    expect(escapeLike('a%b_c')).toBe('a\\%b\\_c')
    expect(escapeLike('plain-text')).toBe('plain-text')
  })

  test('escapes backslashes before SQL wildcard characters', () => {
    expect(escapeLike('path\\name')).toBe(String.raw`path\\name`)
    expect(escapeLike(String.raw`a\%b_c`)).toBe(String.raw`a\\\%b\_c`)
  })
})

describe('StoragePgDB listObjectsV2', () => {
  test('keeps the cursor key for exact-match pagination', async () => {
    const { storage, transaction } = createQueryCaptureStorage('list-objects-with-versions')

    await storage.listObjectsV2('bucket', {
      prefix: 'cursor-key',
      nextToken: 'cursor-key',
      exactMatch: true,
      noncurrentVersions: 'include',
    })

    const query = transaction.query.mock.calls[0]?.[0]
    expect(query.text).toContain('name COLLATE "C" = $3')
    expect(query.values[2]).toBe('cursor-key')
  })

  test('keeps timestamp pagination when the cursor timestamp is absent', async () => {
    const { storage, transaction } = createQueryCaptureStorage('list-objects-with-versions')

    await storage.listObjectsV2('bucket', {
      nextToken: 'cursor-name',
      sortBy: { column: 'created_at', order: 'asc' },
    })

    const query = transaction.query.mock.calls[0]?.[0]
    expect(query.text).toContain(
      'ROW(COALESCE(date_trunc(\'milliseconds\', "created_at"), \'epoch\'::timestamptz), name COLLATE "C"'
    )
    expect(query.text).not.toContain('name COLLATE "C" > $3')
    expect(query.values).toEqual(['bucket', 100, null, 'cursor-name'])
  })
})

describe('StoragePgDB listMultipartUploads', () => {
  test.each([
    {
      name: 'continues after the key marker when it is provided alone',
      options: { nextUploadKeyToken: 'key-marker' },
      condition: 'key COLLATE "C" > $2',
      values: ['bucket', 'key-marker', 100],
    },
    {
      name: 'continues after the key and upload markers when both are provided',
      options: {
        nextUploadKeyToken: 'key-marker',
        nextUploadToken: 'upload-marker',
      },
      condition: 'COALESCE((created_at, id COLLATE "C") > (',
      values: ['bucket', 'key-marker', 'upload-marker', 100],
    },
    {
      name: 'ignores an upload marker without a key marker',
      options: { nextUploadToken: 'upload-marker' },
      condition: undefined,
      values: ['bucket', 100],
    },
  ])('$name', async ({ options, condition, values }) => {
    const { storage, transaction } = createQueryCaptureStorage()

    await storage.listMultipartUploads('bucket', options)

    const query = transaction.query.mock.calls[0]?.[0]
    if (condition) {
      expect(query.text).toContain(condition)
    } else {
      expect(query.text).not.toContain('id COLLATE "C" >')
    }
    expect(query.values).toEqual(values)
  })

  test('passes escaped and raw prefixes to the migrated delimiter function', async () => {
    const { storage, transaction } = createQueryCaptureStorage('list-objects-with-versions')

    await storage.listMultipartUploads('bucket', {
      prefix: 'prefix_%\\',
      deltimeter: '/',
    })

    const query = transaction.query.mock.calls[0]?.[0]
    expect(query.text).toContain(
      'storage.list_multipart_uploads_with_delimiter($1,$2,$3,$4,$5,$6,$7)'
    )
    expect(query.values).toEqual([
      'bucket',
      'prefix\\_\\%\\\\',
      '/',
      undefined,
      '',
      '',
      'prefix_%\\',
    ])
  })

  test('keeps the legacy delimiter signature before the migration', async () => {
    const { storage, transaction } = createQueryCaptureStorage('mark-filename-immutable')

    await storage.listMultipartUploads('bucket', {
      prefix: 'prefix_%\\',
      deltimeter: '/',
    })

    const query = transaction.query.mock.calls[0]?.[0]
    expect(query.text).toContain('storage.list_multipart_uploads_with_delimiter($1,$2,$3,$4,$5,$6)')
    expect(query.values).toEqual(['bucket', 'prefix\\_\\%\\\\', '/', undefined, '', ''])
  })
})

describe('StoragePgDB searchObjects', () => {
  test('caps exact-match results at the storage.search limit', async () => {
    const { storage, transaction } = createQueryCaptureStorage('list-objects-with-versions')

    await storage.searchObjects('bucket', 'object.txt', {
      exactMatch: true,
      limit: 2000,
    })

    const query = transaction.query.mock.calls[0]?.[0]
    expect(query.values).toEqual(['bucket', 'object.txt', 1500, 0])
  })
})

describe('StoragePgDB migration context', () => {
  const connection = {} as PgTenantConnection

  test('uses the supplied request migration version', async () => {
    const storage = new StoragePgDB(connection, {
      tenantId: 'tenant-with-request-context',
      host: 'localhost',
      latestMigration: 'search-v2',
    })

    await expect(storage.hasMigration('custom-metadata')).resolves.toBe(true)
    await expect(storage.hasMigration('add-search-v2-sort-support')).resolves.toBe(false)
  })

  test.each([
    null,
    'unknown-migration',
  ])('probes the tenant for an unusable reported migration: %s', async (latestMigration) => {
    const tenantHasMigrations = vi
      .spyOn(migrations, 'tenantHasMigrations')
      .mockResolvedValueOnce(true)
    const storage = new StoragePgDB(connection, {
      tenantId: 'tenant-with-unusable-request-context',
      host: 'localhost',
      latestMigration,
    } as ConstructorParameters<typeof StoragePgDB>[1])

    await expect(storage.hasMigration('iceberg-catalog-flag-on-buckets')).resolves.toBe(true)
    expect(tenantHasMigrations).toHaveBeenCalledWith(
      'tenant-with-unusable-request-context',
      'iceberg-catalog-flag-on-buckets'
    )
  })
})

function createTestPermissionFixture() {
  const transaction = {
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
  }
  const transactionMock = vi.fn().mockResolvedValue(transaction)
  const connection = {
    role: 'anon',
    transaction: transactionMock,
    setScope: vi.fn().mockResolvedValue(undefined),
  } as unknown as PgTenantConnection
  const storage = new StoragePgDB(connection, {
    tenantId: 'test-permission-tenant',
    host: 'localhost',
  })

  return { connection, storage, transaction, transactionMock }
}

function createNestedTestPermissionFixture() {
  const transaction = {
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
    isCompleted: vi.fn().mockReturnValue(false),
    query: vi.fn().mockResolvedValue({ rows: [] }),
  }
  const connection = {
    role: 'anon',
    transaction: vi.fn(),
    setScope: vi.fn().mockResolvedValue(undefined),
  } as unknown as PgTenantConnection
  const storage = new StoragePgDB(connection, {
    tenantId: 'nested-test-permission-tenant',
    host: 'localhost',
    tnx: transaction as unknown as DatabaseTransaction,
  })

  return { connection, storage, transaction }
}

describe('StoragePgDB testPermission', () => {
  test('returns the callback result after rolling back the transaction', async () => {
    const { connection, storage, transaction } = createTestPermissionFixture()

    const result = await storage.testPermission(async (transactionStorage) => {
      expect(transactionStorage).toBeInstanceOf(StoragePgDB)
      expect(transactionStorage).not.toBe(storage)
      return 'allowed'
    })

    expect(result).toBe('allowed')
    expect(connection.transaction).toHaveBeenCalledWith(undefined)
    expect(connection.setScope).toHaveBeenCalledWith(transaction)
    expect(transaction.rollback).toHaveBeenCalledTimes(1)
    expect(transaction.commit).not.toHaveBeenCalled()
  })

  test('rethrows callback failures without wrapping them', async () => {
    const { storage, transaction } = createTestPermissionFixture()
    const error = new Error('permission denied')

    await expect(
      storage.testPermission(async () => {
        throw error
      })
    ).rejects.toBe(error)

    expect(transaction.rollback).toHaveBeenCalledTimes(1)
    expect(transaction.commit).not.toHaveBeenCalled()
  })

  test('keeps concurrent callback results isolated while rollbacks interleave', async () => {
    const {
      storage,
      transaction: firstTransaction,
      transactionMock,
    } = createTestPermissionFixture()
    const firstRollbackStarted = Promise.withResolvers<void>()
    const releaseFirstRollback = Promise.withResolvers<void>()
    const secondTransaction = {
      commit: vi.fn().mockResolvedValue(undefined),
      rollback: vi.fn().mockResolvedValue(undefined),
    }

    firstTransaction.rollback.mockImplementationOnce(async () => {
      firstRollbackStarted.resolve()
      await releaseFirstRollback.promise
      return undefined
    })
    transactionMock.mockResolvedValueOnce(firstTransaction).mockResolvedValueOnce(secondTransaction)

    const firstResult = storage.testPermission(async () => 'first')
    await firstRollbackStarted.promise
    const secondResult = storage.testPermission(async () => 'second')

    await expect(secondResult).resolves.toBe('second')
    releaseFirstRollback.resolve()
    await expect(firstResult).resolves.toBe('first')
    expect(firstTransaction.rollback).toHaveBeenCalledTimes(1)
    expect(secondTransaction.rollback).toHaveBeenCalledTimes(1)
  })

  test('rolls back successful nested permission tests to a savepoint', async () => {
    const { connection, storage, transaction } = createNestedTestPermissionFixture()

    await expect(storage.testPermission(async () => 'allowed')).resolves.toBe('allowed')

    expect(connection.transaction).not.toHaveBeenCalled()
    expect(transaction.query).toHaveBeenCalledTimes(3)
    expect(transaction.query).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/^SAVEPOINT "storage_pg_query_/)
    )
    expect(transaction.query).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/^ROLLBACK TO SAVEPOINT "storage_pg_query_/)
    )
    expect(transaction.query).toHaveBeenNthCalledWith(
      3,
      expect.stringMatching(/^RELEASE SAVEPOINT "storage_pg_query_/)
    )
    expect(transaction.rollback).not.toHaveBeenCalled()
    expect(transaction.commit).not.toHaveBeenCalled()
  })

  test('rolls back a nested savepoint and rethrows callback failures unchanged', async () => {
    const { connection, storage, transaction } = createNestedTestPermissionFixture()
    const error = new Error('nested permission denied')

    await expect(
      storage.testPermission(async () => {
        throw error
      })
    ).rejects.toBe(error)

    expect(connection.transaction).not.toHaveBeenCalled()
    expect(transaction.query).toHaveBeenCalledTimes(3)
    expect(transaction.query).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/^ROLLBACK TO SAVEPOINT "storage_pg_query_/)
    )
    expect(transaction.query).toHaveBeenNthCalledWith(
      3,
      expect.stringMatching(/^RELEASE SAVEPOINT "storage_pg_query_/)
    )
    expect(transaction.rollback).not.toHaveBeenCalled()
    expect(transaction.commit).not.toHaveBeenCalled()
  })
})

describe('StoragePgDB lifecycle mutation permissions', () => {
  const configuration: BucketLifecycleConfiguration = {
    rules: [
      {
        id: 'expire-history',
        status: 'Enabled',
        filter: {},
        noncurrentVersionExpiration: { noncurrentDays: 30 },
      },
    ],
  }

  function createLifecycleMutationFixture(
    lifecycleConfiguration: BucketLifecycleConfiguration | null,
    inTransaction = true
  ) {
    const bucket: LifecycleBucket = {
      id: 'bucket',
      name: 'bucket',
      type: 'STANDARD',
      lifecycle_configuration: lifecycleConfiguration,
      lifecycle_configuration_generation: lifecycleConfiguration === null ? null : 'generation',
    }
    const transaction = {
      commit: vi.fn(),
      rollback: vi.fn(),
      isCompleted: vi.fn().mockReturnValue(false),
      query: vi.fn(async (_statement: string | { text: string }) => ({
        rows: [bucket],
        rowCount: 1,
      })),
    }
    const connectionMethods = {
      role: 'service_role',
      asSuperUser: vi.fn(),
      getAbortSignal: vi.fn().mockReturnValue(undefined),
      setScope: vi.fn(),
      transaction: vi.fn().mockResolvedValue(transaction),
    }
    connectionMethods.asSuperUser.mockReturnValue(connectionMethods)
    const connection = connectionMethods as unknown as PgTenantConnection
    const storage = new StoragePgDB(connection, {
      tenantId: 'lifecycle-mutation-tenant',
      host: 'localhost',
      latestMigration: 'bucket-lifecycle-configuration',
      tnx: inTransaction ? (transaction as unknown as DatabaseTransaction) : undefined,
    })
    const testPermission = vi.spyOn(storage, 'testPermission').mockResolvedValue(undefined)

    return { bucket, connectionMethods, storage, testPermission, transaction }
  }

  test.each([
    'PUT',
    'DELETE',
  ])('opens and commits one transaction for a standalone %s', async (method) => {
    const { connectionMethods, storage, transaction } = createLifecycleMutationFixture(
      method === 'PUT' ? null : configuration,
      false
    )

    const result =
      method === 'PUT'
        ? await storage.putLifecycleConfiguration('bucket', configuration)
        : await storage.deleteLifecycleConfiguration('bucket')

    expect(result.id).toBe('bucket')
    expect(connectionMethods.transaction).toHaveBeenCalledTimes(1)
    expect(transaction.commit).toHaveBeenCalledTimes(1)
    expect(transaction.rollback).not.toHaveBeenCalled()
    expect(transaction.query).toHaveBeenCalledWith(expect.stringMatching(/^ROLLBACK TO SAVEPOINT/))
  })

  test('reads as the request role, then locks as the service role, then probes permission', async () => {
    const { connectionMethods, storage, testPermission, transaction } =
      createLifecycleMutationFixture(null)

    await storage.putLifecycleConfiguration('bucket', configuration)

    const [visibilityRead, lock] = transaction.query.mock.calls.map((call) => call[0])
    expect(visibilityRead).toMatchObject({ text: expect.not.stringMatching(/FOR UPDATE/) })
    expect(lock).toMatchObject({ text: expect.stringMatching(/FOR UPDATE/) })
    const [readOrder, lockOrder] = transaction.query.mock.invocationCallOrder
    const superUserOrder = connectionMethods.asSuperUser.mock.invocationCallOrder[0]
    expect(readOrder).toBeLessThan(superUserOrder)
    expect(superUserOrder).toBeLessThan(lockOrder)
    expect(lockOrder).toBeLessThan(testPermission.mock.invocationCallOrder[0])
  })

  test('checks request-role permission before a service-owned PUT', async () => {
    const { storage, testPermission, transaction } = createLifecycleMutationFixture(null)

    await expect(storage.putLifecycleConfiguration('bucket', configuration)).resolves.toMatchObject(
      {
        id: 'bucket',
      }
    )
    expect(testPermission).toHaveBeenCalledTimes(1)
    expect(transaction.query).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('UPDATE storage.buckets') }),
      expect.anything()
    )
  })

  test.each([
    {
      code: 'PST01',
      schema: 'storage',
      table: 'buckets',
      constraint: 'protect_bucket_control_update_role',
      accepted: true,
    },
    {
      code: '42501',
      schema: 'storage',
      table: 'buckets',
      constraint: 'protect_bucket_control_update_role',
      accepted: false,
    },
    {
      code: 'PST01',
      schema: 'public',
      table: 'buckets',
      constraint: 'protect_bucket_control_update_role',
      accepted: false,
    },
    {
      code: 'PST01',
      schema: 'storage',
      table: 'objects',
      constraint: 'protect_bucket_control_update_role',
      accepted: false,
    },
    {
      code: 'PST01',
      schema: 'storage',
      table: 'buckets',
      constraint: 'another_trigger',
      accepted: false,
    },
    { code: 'PST01', schema: undefined, table: undefined, constraint: undefined, accepted: false },
  ])('accepts only the lifecycle AFTER guard signal %#', async ({ accepted, ...fields }) => {
    const { storage, testPermission, transaction } = createLifecycleMutationFixture(null)
    const cause = Object.assign(new DatabaseError('role guard', 0, 'error'), fields)
    const error = DBError.fromDBError(cause)
    testPermission.mockRejectedValue(error)

    const write = storage.putLifecycleConfiguration('bucket', configuration)
    if (accepted) {
      await expect(write).resolves.toMatchObject({ id: 'bucket' })
    } else {
      await expect(write).rejects.toBe(error)
      expect(
        transaction.query.mock.calls.some(
          ([statement]) =>
            typeof statement !== 'string' && /UPDATE storage.buckets/.test(statement.text)
        )
      ).toBe(false)
    }
  })

  test('probes and persists the same lifecycle configuration and generated UUID', async () => {
    const { storage, testPermission, transaction } = createLifecycleMutationFixture(null)
    testPermission.mockImplementation(async (fn) => fn(storage))

    await storage.putLifecycleConfiguration('bucket', configuration)

    const updates = transaction.query.mock.calls
      .map(([statement]) => statement)
      .filter(
        (statement) =>
          typeof statement !== 'string' && /UPDATE storage.buckets/.test(statement.text)
      )
    expect(transaction.query).toHaveBeenCalledTimes(4)
    expect(updates).toHaveLength(2)
    expect(updates[0]).toMatchObject({
      values: ['bucket', JSON.stringify(configuration), expect.stringMatching(/^[0-9a-f-]{36}$/)],
    })
    expect(updates[1]).toBe(updates[0])
  })

  test('runs the rollback-only permission check before an equivalent PUT returns', async () => {
    const { storage, testPermission, transaction } = createLifecycleMutationFixture(configuration)

    await expect(storage.putLifecycleConfiguration('bucket', configuration)).resolves.toMatchObject(
      {
        id: 'bucket',
      }
    )
    expect(testPermission).toHaveBeenCalledTimes(1)
    expect(transaction.query).not.toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('UPDATE storage.buckets') }),
      expect.anything()
    )
  })

  test('checks request-role permission before a service-owned DELETE', async () => {
    const { storage, testPermission, transaction } = createLifecycleMutationFixture(configuration)

    await expect(storage.deleteLifecycleConfiguration('bucket')).resolves.toMatchObject({
      id: 'bucket',
    })
    expect(testPermission).toHaveBeenCalledTimes(1)
    expect(transaction.query).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('UPDATE storage.buckets') }),
      expect.anything()
    )
  })

  test.each([
    new Error('lifecycle write failed'),
    undefined,
  ])('propagates a lifecycle PUT failure unchanged %#', async (writeError) => {
    const { bucket, storage, transaction } = createLifecycleMutationFixture(null)
    transaction.query
      .mockResolvedValueOnce({ rows: [bucket], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [bucket], rowCount: 1 })
      .mockRejectedValueOnce(writeError)

    await expect(storage.putLifecycleConfiguration('bucket', configuration)).rejects.toBe(
      writeError
    )
    expect(transaction.query).toHaveBeenCalledTimes(3)
  })

  test('runs the rollback-only permission check before an already-empty DELETE returns', async () => {
    const { storage, testPermission, transaction } = createLifecycleMutationFixture(null)

    await expect(storage.deleteLifecycleConfiguration('bucket')).resolves.toMatchObject({
      id: 'bucket',
    })
    expect(testPermission).toHaveBeenCalledTimes(1)
    expect(transaction.query).not.toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('UPDATE storage.buckets') }),
      expect.anything()
    )
  })
})

describe('StoragePgDB lifecycle reads', () => {
  test('returns the persisted normalized lifecycle configuration', async () => {
    const storedConfiguration: BucketLifecycleConfiguration = {
      rules: [
        {
          id: 'expire-history',
          status: 'Enabled',
          filter: {},
          noncurrentVersionExpiration: { noncurrentDays: 30 },
        },
      ],
    }
    const fixture = createQueryCaptureStorage('bucket-lifecycle-configuration')
    const { storage, transaction } = fixture
    transaction.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'bucket',
          name: 'bucket',
          type: 'STANDARD',
          lifecycle_configuration: storedConfiguration,
          lifecycle_configuration_generation: 'generation',
        },
      ],
      rowCount: 1,
    })

    const bucket = await storage.findLifecycleBucket('bucket')

    expect(bucket.lifecycle_configuration).toBe(storedConfiguration)
  })
})

describe('StoragePgDB column selection', () => {
  test.each([
    ['operation-function', /SELECT "id", "name"\s+FROM/],
    ['iceberg-catalog-flag-on-buckets', /SELECT "id", "type", "name"\s+FROM/],
  ] as const)('uses the precomputed bucket policy for recognized migration %s', async (latestMigration, expectedSqlPattern) => {
    const { storage, transaction } = createQueryCaptureStorage(latestMigration)
    const hasMigration = vi.spyOn(storage, 'hasMigration')

    await storage.findBucketById('bucket', 'id,type,name')

    expect(hasMigration).not.toHaveBeenCalled()
    expect(transaction.query.mock.calls[0]?.[0]).toMatchObject({
      text: expect.stringMatching(expectedSqlPattern),
    })
  })

  test.each([
    undefined,
    null,
    'unknown-migration',
  ])('retains the bucket migration probe for unusable snapshot %s', async (latestMigration) => {
    const { storage, transaction } = createQueryCaptureStorage(latestMigration)
    const hasMigration = vi.spyOn(storage, 'hasMigration').mockResolvedValueOnce(false)

    await storage.findBucketById('bucket', 'id,type,name')

    expect(hasMigration).toHaveBeenCalledWith('iceberg-catalog-flag-on-buckets')
    expect(transaction.query.mock.calls[0]?.[0]).toMatchObject({
      text: expect.stringMatching(/SELECT "id", "name"\s+FROM/),
    })
  })

  test('keeps all requested object columns when their migrations are available', async () => {
    const { storage, transaction } = createQueryCaptureStorage()

    await storage.findObject('bucket', 'object', 'id,user_metadata,metadata')

    expect(transaction.query.mock.calls[0]?.[0]).toMatchObject({
      text: expect.stringMatching(/SELECT "id", "user_metadata", "metadata"\s+FROM/),
    })
  })

  test('strips unavailable object columns directly while compiling the SELECT list', async () => {
    const { storage, transaction } = createQueryCaptureStorage('initialmigration')

    await storage.findObject('bucket', 'object', 'id,user_metadata,metadata')

    expect(transaction.query.mock.calls[0]?.[0]).toMatchObject({
      text: expect.stringMatching(/SELECT "id", "metadata"\s+FROM/),
    })
    expect((transaction.query.mock.calls[0]?.[0] as { text: string }).text).not.toContain(
      '"user_metadata"'
    )
  })

  test('treats an unrecognized migration snapshot conservatively', async () => {
    const { storage, transaction } = createQueryCaptureStorage('unknown-migration')

    await storage.findObject('bucket', 'object', 'id,user_metadata,metadata')
    await storage.findMultipartUpload('upload', 'id,user_metadata,metadata')

    expect(transaction.query.mock.calls[0]?.[0]).toMatchObject({
      text: expect.stringMatching(/SELECT "id", "metadata"\s+FROM/),
    })
    expect(transaction.query.mock.calls[1]?.[0]).toMatchObject({
      text: expect.stringMatching(/SELECT "id"\s+FROM/),
    })
    expect((transaction.query.mock.calls[1]?.[0] as { text: string }).text).not.toContain(
      '"user_metadata"'
    )
    expect((transaction.query.mock.calls[1]?.[0] as { text: string }).text).not.toContain(
      '"metadata"'
    )
  })

  test('strips only multipart metadata after custom metadata is available', async () => {
    const { storage, transaction } = createQueryCaptureStorage('custom-metadata')

    await storage.findMultipartUpload('upload', 'id,user_metadata,metadata')

    expect(transaction.query.mock.calls[0]?.[0]).toMatchObject({
      text: expect.stringMatching(/SELECT "id", "user_metadata"\s+FROM/),
    })
    expect((transaction.query.mock.calls[0]?.[0] as { text: string }).text).not.toContain(
      '"metadata"'
    )
  })

  test('preserves listBuckets synthetic type placement', async () => {
    const { storage, transaction } = createQueryCaptureStorage()

    await storage.listBuckets('type,id,name')

    expect(transaction.query.mock.calls[0]?.[0]).toMatchObject({
      text: expect.stringMatching(/SELECT "id", "name", 'STANDARD' AS "type"\s+FROM/),
    })
  })
})

describe('StoragePgDB metrics', () => {
  test('records DB query duration without tenantId attribute', async () => {
    const connection = {
      getAbortSignal: vi.fn().mockReturnValue(undefined),
      pool: {
        acquire: vi.fn(),
      },
    } as unknown as PgTenantConnection
    const storage = new TestStoragePgDB(connection, {
      tenantId: 'metric-cardinality-tenant',
      host: 'localhost',
    })
    const recordSpy = vi.spyOn(dbQueryPerformance, 'record')
    const performanceNowSpy = vi
      .spyOn(performance, 'now')
      .mockReturnValueOnce(10)
      .mockReturnValueOnce(15)

    try {
      await expect(storage.runMetricProbe()).resolves.toBe('ok')

      expect(recordSpy).toHaveBeenCalledWith(0.005, {
        name: 'MetricWithoutTenantAttribute',
        requestAborted: false,
        requestAbortedBeforeStart: false,
        requestAbortedAfterStart: false,
      })
      expect(recordSpy.mock.calls[0]?.[1]).not.toHaveProperty('tenantId')
    } finally {
      performanceNowSpy.mockRestore()
      recordSpy.mockRestore()
    }
  })

  test('records scoped DB query duration from numeric monotonic timestamps', async () => {
    const transaction = {
      commit: vi.fn(),
      rollback: vi.fn(),
      isCompleted: vi.fn().mockReturnValue(false),
    }
    const connection = {
      getAbortSignal: vi.fn().mockReturnValue(undefined),
      transaction: vi.fn().mockResolvedValue(transaction),
      setScope: vi.fn(),
    } as unknown as PgTenantConnection
    const storage = new TestStoragePgDB(connection, {
      tenantId: 'metric-cardinality-tenant',
      host: 'localhost',
    })
    const recordSpy = vi.spyOn(dbQueryPerformance, 'record')
    const performanceNowSpy = vi
      .spyOn(performance, 'now')
      .mockReturnValueOnce(2)
      .mockReturnValueOnce(9)

    try {
      await expect(storage.runScopedMetricProbe()).resolves.toBe('ok')

      expect(recordSpy).toHaveBeenCalledWith(0.007, {
        name: 'ScopedMetricDuration',
        requestAborted: false,
        requestAbortedBeforeStart: false,
        requestAbortedAfterStart: false,
      })
    } finally {
      performanceNowSpy.mockRestore()
      recordSpy.mockRestore()
    }
  })
})

describe('StoragePgDB healthcheck', () => {
  const probeSql = 'SELECT id from storage.buckets limit 1'
  const expectedAbortError = {
    name: 'AbortError',
    code: 'ABORT_ERR',
    message: 'Query was aborted',
  }
  let UnscopedStoragePgDB: typeof StoragePgDB

  beforeAll(async () => {
    vi.resetModules()
    const configModule = await import('../../config')
    const { databaseHealthcheckUnscoped } = configModule.getConfig()
    configModule.mergeConfig({ databaseHealthcheckUnscoped: true })

    try {
      const pgModule = await import('./pg')
      UnscopedStoragePgDB = pgModule.StoragePgDB
    } finally {
      configModule.mergeConfig({ databaseHealthcheckUnscoped })
    }
  })

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  function createHealthcheckFixture(
    executor: DatabaseExecutor,
    options: {
      requestSignal?: AbortSignal
      StorageClass?: typeof StoragePgDB
    } = {}
  ) {
    const { requestSignal, StorageClass = TestStoragePgDB } = options
    const transaction = {
      commit: vi.fn(),
      rollback: vi.fn(),
      isCompleted: vi.fn().mockReturnValue(false),
      query: vi.fn().mockResolvedValue({ rows: [] }),
    }
    const connection = {
      getAbortSignal: vi.fn().mockReturnValue(requestSignal),
      query: vi.fn((statement, queryOptions) => executor.query(statement, queryOptions)),
      pool: {
        acquire: vi.fn().mockReturnValue(executor),
      },
      transaction: vi.fn().mockResolvedValue(transaction),
      setScope: vi.fn(),
    } as unknown as PgTenantConnection
    const storage = new StorageClass(connection, {
      tenantId: 'healthcheck-tenant',
      host: 'localhost',
    })

    return { connection, storage, transaction }
  }

  function createProbe(requestSignal?: AbortSignal) {
    let finishQuery: (() => void) | undefined
    const executor = {
      query: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            finishQuery = () => resolve({ rows: [] })
          })
      ),
    }
    const fixture = createHealthcheckFixture(executor, {
      requestSignal,
      StorageClass: UnscopedStoragePgDB,
    })

    return {
      ...fixture,
      executor,
      probeSignal: () => executor.query.mock.calls[0]?.[1]?.signal as AbortSignal | undefined,
      finishQuery: () => {
        if (!finishQuery) {
          throw new Error('Probe query has not started')
        }
        finishQuery()
      },
    }
  }

  function createPendingPoolExecutor() {
    const release = vi.fn()
    const client = Object.assign(new EventEmitter(), {
      query: vi.fn(() => new Promise(() => undefined)),
      release,
    }) as unknown as PoolClient & EventEmitter
    const connect = vi.fn().mockResolvedValue(client)
    const pool = { connect } as unknown as Pool

    return { client, connect, executor: new PgPoolExecutor(pool), release }
  }

  test('rejects and disposes the client when the healthcheck timeout elapses', async () => {
    const { client, executor, release } = createPendingPoolExecutor()
    const fixture = createHealthcheckFixture(executor, {
      StorageClass: UnscopedStoragePgDB,
    })
    const probe = fixture.storage.healthcheck()
    const rejection = expect(probe).rejects.toMatchObject(expectedAbortError)

    await vi.advanceTimersByTimeAsync(0)
    expect(client.query).toHaveBeenCalledWith(probeSql, undefined)

    await vi.advanceTimersToNextTimerAsync()

    await rejection
    expect(release).toHaveBeenCalledWith(expect.objectContaining(expectedAbortError))

    expect(fixture.connection.query).toHaveBeenCalledTimes(1)
    expect(fixture.connection.transaction).not.toHaveBeenCalled()
    expect(fixture.connection.setScope).not.toHaveBeenCalled()
  })

  test('rejects and disposes the client when the request is canceled in flight', async () => {
    const requestController = new AbortController()
    const { client, executor, release } = createPendingPoolExecutor()
    const fixture = createHealthcheckFixture(executor, {
      requestSignal: requestController.signal,
      StorageClass: UnscopedStoragePgDB,
    })
    const probe = fixture.storage.healthcheck()
    const rejection = expect(probe).rejects.toMatchObject(expectedAbortError)

    await vi.advanceTimersByTimeAsync(0)
    expect(client.query).toHaveBeenCalledWith(probeSql, undefined)

    requestController.abort()

    await rejection
    expect(release).toHaveBeenCalledWith(expect.objectContaining(expectedAbortError))
    expect(vi.getTimerCount()).toBe(0)
  })

  test('rejects before checkout when the request is already canceled', async () => {
    const requestController = new AbortController()
    requestController.abort()
    const { connect, executor } = createPendingPoolExecutor()
    const fixture = createHealthcheckFixture(executor, {
      requestSignal: requestController.signal,
      StorageClass: UnscopedStoragePgDB,
    })

    await expect(fixture.storage.healthcheck()).rejects.toMatchObject(expectedAbortError)

    expect(connect).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  test('uses the scoped readiness probe by default', async () => {
    const executor = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    } as unknown as DatabaseExecutor
    const fixture = createHealthcheckFixture(executor)

    await expect(fixture.storage.healthcheck()).resolves.toBeUndefined()

    expect(fixture.connection.query).not.toHaveBeenCalled()
    expect(fixture.connection.transaction).toHaveBeenCalledTimes(1)
    expect(fixture.connection.setScope).toHaveBeenCalledWith(fixture.transaction)
    expect(fixture.transaction.query).toHaveBeenCalledWith(probeSql, { signal: undefined })
    expect(fixture.transaction.commit).toHaveBeenCalledTimes(1)
  })

  test('clears the timeout and stops observing the request signal once the probe settles', async () => {
    const requestController = new AbortController()
    const probeFixture = createProbe(requestController.signal)
    const probe = probeFixture.storage.healthcheck()
    probeFixture.finishQuery()
    await expect(probe).resolves.toBeUndefined()

    expect(vi.getTimerCount()).toBe(0)

    requestController.abort()
    expect(probeFixture.probeSignal()?.aborted).toBe(false)
  })
})

describe('StoragePgDB error mapping', () => {
  test('preserves query name for pg errors thrown by inner SQL statements', async () => {
    const error = createPgError('08P01', 'no more connections allowed (max_client_conn)')
    error.severity = 'FATAL'
    error.routine = 'pooler_error'
    const transaction = {
      commit: vi.fn(),
      rollback: vi.fn(),
      isCompleted: vi.fn().mockReturnValue(false),
      query: vi.fn().mockRejectedValue(error),
    }
    const connection = {
      getAbortSignal: vi.fn().mockReturnValue(undefined),
      transaction: vi.fn().mockResolvedValue(transaction),
      setScope: vi.fn(),
    } as unknown as PgTenantConnection
    const storage = new TestStoragePgDB(connection, {
      tenantId: 'tenant-with-protocol-error',
      host: 'localhost',
    })

    const mappedError = await storage.runErrorMappingProbe().catch((error) => error)

    expect(mappedError).toMatchObject({
      code: 'DatabaseError',
      message: 'database error, code: 08P01',
      originalError: error,
      metadata: {
        code: '08P01',
        pgMessage: 'no more connections allowed (max_client_conn)',
        query: 'SELECT * FROM storage.buckets WHERE id = $1',
        queryName: 'FindBucketById',
      },
    })
    // severity/routine are set on the pg error but must not be duplicated into metadata.
    expect(JSON.parse(normalizeRawError(mappedError, 'info').raw).metadata).toEqual({
      code: '08P01',
      pgMessage: 'no more connections allowed (max_client_conn)',
      query: 'SELECT * FROM storage.buckets WHERE id = $1',
      queryName: 'FindBucketById',
    })
  })

  test('preserves query name for pg errors thrown while starting the transaction', async () => {
    const error = createPgError('08P01', 'no more connections allowed (max_client_conn)')
    error.severity = 'FATAL'
    error.routine = 'pooler_error'
    const connection = {
      getAbortSignal: vi.fn().mockReturnValue(undefined),
      transaction: vi.fn().mockRejectedValue(error),
      setScope: vi.fn(),
    } as unknown as PgTenantConnection
    const storage = new TestStoragePgDB(connection, {
      tenantId: 'tenant-with-transaction-setup-error',
      host: 'localhost',
    })

    const mappedError = await storage.runErrorMappingProbe().catch((error) => error)

    expect(mappedError).toMatchObject({
      code: 'DatabaseError',
      message: 'database error, code: 08P01',
      originalError: error,
      metadata: {
        code: '08P01',
        pgMessage: 'no more connections allowed (max_client_conn)',
        queryName: 'FindBucketById',
      },
    })
    expect(JSON.parse(normalizeRawError(mappedError, 'info').raw).metadata).toEqual({
      code: '08P01',
      pgMessage: 'no more connections allowed (max_client_conn)',
      queryName: 'FindBucketById',
    })
  })

  test('preserves query name for pg errors thrown by an unscoped executor', async () => {
    const error = createPgError('08006', 'connection failure')
    error.severity = 'FATAL'
    const connection = {
      getAbortSignal: vi.fn().mockReturnValue(undefined),
      query: vi.fn(() => {
        throw error
      }),
    } as unknown as PgTenantConnection
    const storage = new TestStoragePgDB(connection, {
      tenantId: 'tenant-with-unscoped-acquire-error',
      host: 'localhost',
    })

    const mappedError = await storage.runUnscopedErrorMappingProbe().catch((error) => error)

    expect(mappedError).toMatchObject({
      code: 'DatabaseError',
      originalError: error,
      metadata: {
        code: '08006',
        pgMessage: 'connection failure',
        queryName: 'CreateS3KeysTempTable',
      },
    })
    expect(JSON.parse(normalizeRawError(mappedError, 'info').raw).metadata).toEqual({
      code: '08006',
      pgMessage: 'connection failure',
      queryName: 'CreateS3KeysTempTable',
    })
  })

  test('passes through non-pg errors from transaction setup', async () => {
    const error = new Error('connection setup failed before pg error mapping')
    const connection = {
      getAbortSignal: vi.fn().mockReturnValue(undefined),
      transaction: vi.fn().mockRejectedValue(error),
      setScope: vi.fn(),
    } as unknown as PgTenantConnection
    const storage = new TestStoragePgDB(connection, {
      tenantId: 'tenant-with-non-pg-error',
      host: 'localhost',
    })

    await expect(storage.runErrorMappingProbe()).rejects.toBe(error)
  })

  test('does not attach query name to non-pg storage errors from transaction setup', async () => {
    // transaction() resolving without a handle makes runQuery throw
    // ERRORS.InternalError('Could not create transaction') — a StorageBackendError
    // whose originalError is not a pg error, so the gate must leave it untouched.
    const connection = {
      getAbortSignal: vi.fn().mockReturnValue(undefined),
      transaction: vi.fn().mockResolvedValue(undefined),
      setScope: vi.fn(),
    } as unknown as PgTenantConnection
    const storage = new TestStoragePgDB(connection, {
      tenantId: 'tenant-with-missing-transaction-handle',
      host: 'localhost',
    })

    const mappedError = await storage.runErrorMappingProbe().catch((error) => error)

    expect(mappedError).toMatchObject({
      code: 'InternalError',
      metadata: expect.not.objectContaining({ queryName: expect.anything() }),
    })
  })
})

function createPgError(code: string, message: string): DatabaseError {
  const error = new DatabaseError(message, message.length, 'error')
  error.code = code
  return error
}
