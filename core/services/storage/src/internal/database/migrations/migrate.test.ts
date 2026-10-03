import { AsyncAbortController } from '@internal/concurrency'
import type { BasicPgClient } from 'postgres-migrations/dist/types'
import { vi } from 'vitest'

type MockEvent = {
  payload: Record<string, unknown>
}

type MockBatchSend = (jobs: MockEvent[]) => Promise<void> | void

const {
  mockRunBatchSend,
  mockResetBatchSend,
  mockInfo,
  mockBeginTransaction,
  mockWarning,
  mockQuery,
  mockLastLocalMigrationName,
  mockLoadMigrationFilesCached,
  mockLocalMigrationFiles,
  mockPgClientConstructor,
  mockProgressiveStart,
  mockConfigState,
} = vi.hoisted(() => ({
  mockRunBatchSend: vi.fn<MockBatchSend>(),
  mockResetBatchSend: vi.fn<MockBatchSend>(),
  mockInfo: vi.fn(),
  mockBeginTransaction: vi.fn(),
  mockWarning: vi.fn(),
  mockQuery: vi.fn(),
  mockLastLocalMigrationName: vi.fn(),
  mockLoadMigrationFilesCached: vi.fn(),
  mockLocalMigrationFiles: vi.fn(),
  mockPgClientConstructor: vi.fn(),
  mockProgressiveStart: vi.fn(),
  mockConfigState: {
    migrationStrategy: 'ON_REQUEST',
  },
}))

vi.mock('../../../config', () => ({
  MultitenantMigrationStrategy: {
    ON_REQUEST: 'ON_REQUEST',
    PROGRESSIVE: 'PROGRESSIVE',
    FULL_FLEET: 'FULL_FLEET',
  },
  getConfig: () => ({
    isMultitenant: true,
    multitenantDatabaseUrl: '',
    pgQueueEnable: true,
    databaseSSLRootCert: '',
    dbMigrationStrategy: mockConfigState.migrationStrategy,
    dbAnonRole: 'anon',
    dbAuthenticatedRole: 'authenticated',
    dbSuperUser: 'postgres',
    dbServiceRole: 'service_role',
    dbInstallRoles: false,
    dbRefreshMigrationHashesOnMismatch: false,
    dbMigrationFreezeAt: undefined,
    icebergShards: [],
    multitenantDatabaseQueryTimeout: 1000,
  }),
}))

vi.mock('@storage/events', () => ({
  RunMigrationsOnTenants: class {
    static batchSend = mockRunBatchSend
    payload: MockEvent['payload']

    constructor(payload: MockEvent['payload']) {
      this.payload = payload
    }
  },
  ResetMigrationsOnTenant: class {
    static batchSend = mockResetBatchSend
    payload: MockEvent['payload']

    constructor(payload: MockEvent['payload']) {
      this.payload = payload
    }
  },
}))

vi.mock('../../monitoring', () => ({
  logger: {},
  logSchema: {
    info: mockInfo,
    warning: mockWarning,
    error: vi.fn(),
  },
}))

vi.mock('pg', () => ({
  Client: class {
    constructor(...args: unknown[]) {
      return mockPgClientConstructor(...args)
    }
  },
}))

vi.mock('../multitenant-pg', () => ({
  multitenantPgExecutor: {
    beginTransaction: mockBeginTransaction,
    query: mockQuery,
  },
}))

vi.mock('../tenant', () => ({
  getTenantConfig: vi.fn(),
  TenantMigrationStatus: {
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    FAILED_STALE: 'FAILED_STALE',
  },
}))

vi.mock('../pool', () => ({
  searchPath: ['storage', 'public'],
}))

vi.mock('./files', () => ({
  lastLocalMigrationName: mockLastLocalMigrationName,
  loadMigrationFilesCached: mockLoadMigrationFilesCached,
  localMigrationFiles: mockLocalMigrationFiles,
}))

vi.mock('./progressive', () => ({
  ProgressiveMigrations: class {
    start(...args: unknown[]) {
      return mockProgressiveStart(...args)
    }
  },
}))

import {
  migrate,
  obtainLockOnMultitenantDB,
  resetMigration,
  resetMigrationsOnTenants,
  runMigrationsOnAllTenants,
} from './migrate'

type MockPgClient = {
  connect: ReturnType<typeof vi.fn>
  end: ReturnType<typeof vi.fn>
  on: ReturnType<typeof vi.fn>
  query: ReturnType<typeof vi.fn<(statement: unknown) => Promise<QueryResult>>>
}

type QueryResult = {
  rows: unknown[]
  rowCount?: number
}

function getQueryText(statement: unknown): string {
  if (typeof statement === 'string') {
    return statement
  }

  if (statement && typeof statement === 'object' && 'text' in statement) {
    return String(statement.text)
  }

  return String(statement)
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim()
}

function createMigrationClient(
  migrations: Array<{ id: number; name: string }>,
  resetFloorActive = false
): MockPgClient {
  const client: MockPgClient = {
    connect: vi.fn().mockResolvedValue(undefined),
    end: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    query: vi.fn(async (statement: unknown): Promise<QueryResult> => {
      const text = getQueryText(statement)

      if (text === 'SELECT pg_try_advisory_lock(-8525285245963000605);') {
        return { rows: [{ pg_try_advisory_lock: true }] }
      }

      if (text === 'SELECT * from migrations') {
        return { rows: migrations }
      }

      if (text.includes('AS reset_floor_active')) {
        return { rows: [{ reset_floor_active: resetFloorActive }] }
      }

      return { rows: [], rowCount: 0 }
    }),
  }

  mockPgClientConstructor.mockReturnValue(client)

  return client
}

function createMigrationRunnerClient(
  indexRows: unknown[],
  accessMethod = 'heap',
  generatedRows: unknown[] = []
): MockPgClient & BasicPgClient {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    end: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    query: vi.fn(async (statement: unknown): Promise<QueryResult> => {
      const text = normalizeSql(getQueryText(statement))

      if (text.startsWith('-- storage-migrations generate-sql')) {
        return { rows: generatedRows }
      }

      if (text === 'SHOW default_table_access_method') {
        return { rows: [{ default_table_access_method: accessMethod }] }
      }

      if (text === 'SELECT pg_try_advisory_lock(-8525285245963000605);') {
        return { rows: [{ pg_try_advisory_lock: true }] }
      }

      if (text.includes("c.relkind = 'r'")) {
        return { rows: [{ exists: true }] }
      }

      if (text.startsWith('SELECT * FROM migrations WHERE id <=')) {
        return { rows: [] }
      }

      if (text.includes('pg_catalog.to_regclass')) {
        return { rows: indexRows }
      }

      return { rows: [], rowCount: 1 }
    }),
  } as MockPgClient & BasicPgClient
}

function setPendingConcurrentIndexMigration(
  options: { unique?: boolean; generated?: boolean } = {}
) {
  const sql = `-- postgres-migrations disable-transaction
CREATE ${options.unique ? 'UNIQUE ' : ''}INDEX CONCURRENTLY IF NOT EXISTS idx_objects_test
  ON storage.objects (bucket_id, name);`
  const contents = options.generated
    ? `-- storage-migrations generate-sql\nSELECT $sql$${sql}$sql$ AS sql;`
    : sql

  mockLoadMigrationFilesCached.mockResolvedValue([
    {
      id: 1,
      name: 'objects-test-index',
      fileName: '0001-objects-test-index.sql',
      hash: 'hash-1',
      contents,
      sql: contents,
    },
  ])

  return sql
}

function runTestMigrations(client: BasicPgClient) {
  return migrate({
    client,
    migrationsDirectory: './migrations/test',
    migrationsTableSchema: 'storage',
    waitForLock: false,
  })
}

function migrationQueryTexts(client: MockPgClient) {
  return client.query.mock.calls.map(([statement]) => normalizeSql(getQueryText(statement)))
}

function getMigrationQueryCall(client: MockPgClient, sql: string) {
  return client.query.mock.calls.find(([statement]) => {
    return normalizeSql(getQueryText(statement)).startsWith(sql)
  })
}

function createTenantQueryMock(batches: Array<Array<{ id: string; cursor_id: number }>>) {
  let batchIndex = 0

  return vi.fn(async () => ({
    rows: batches[batchIndex++] ?? [],
  }))
}

function makeTransaction() {
  return {
    query: vi.fn().mockResolvedValue({
      rows: [{ locked: true }],
    }),
    commit: vi.fn(),
    rollback: vi.fn(),
  }
}

async function loadStartAsyncMigrations(
  migrationStrategy: 'ON_REQUEST' | 'PROGRESSIVE' | 'FULL_FLEET'
) {
  mockConfigState.migrationStrategy = migrationStrategy
  vi.resetModules()
  return (await import('./migrate')).startAsyncMigrations
}

const queueStrategies = ['ON_REQUEST', 'PROGRESSIVE'] as const

describe('startAsyncMigrations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfigState.migrationStrategy = 'ON_REQUEST'
  })

  it.each(queueStrategies)('starts queue-driven scheduling for %s', async (strategy) => {
    const signal = new AsyncAbortController().signal
    const startForStrategy = await loadStartAsyncMigrations(strategy)

    startForStrategy(signal)

    expect(mockProgressiveStart).toHaveBeenCalledWith(signal)
  })

  it('lets asynchronous shutdown wait for an in-flight full-fleet enqueue', async () => {
    const deferredBatch = Promise.withResolvers<void>()
    const transaction = makeTransaction()
    mockBeginTransaction.mockResolvedValue(transaction)
    mockLastLocalMigrationName.mockResolvedValue('storage-schema')
    mockQuery.mockImplementation(createTenantQueryMock([[{ id: 'tenant-a', cursor_id: 1 }], []]))
    mockRunBatchSend.mockReturnValueOnce(deferredBatch.promise)
    const startFullFleetMigrations = await loadStartAsyncMigrations('FULL_FLEET')
    const abortController = new AsyncAbortController()

    startFullFleetMigrations(abortController.signal)
    expect(mockProgressiveStart).toHaveBeenCalledWith(abortController.signal)
    await vi.waitFor(() => expect(mockRunBatchSend).toHaveBeenCalledOnce())

    let abortSettled = false
    const abortPromise = abortController.abortAsync().then(() => {
      abortSettled = true
    })
    await Promise.resolve()

    expect(abortSettled).toBe(false)

    deferredBatch.resolve()
    await abortPromise

    expect(abortSettled).toBe(true)
    expect(transaction.commit).toHaveBeenCalledOnce()
  })
})

describe('migration helper request id propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLastLocalMigrationName.mockResolvedValue('storage-schema')
    mockLocalMigrationFiles.mockResolvedValue([])
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 })
  })

  it('passes sbReqId into fleet migration jobs and scheduler logs', async () => {
    const trx = makeTransaction()
    mockBeginTransaction.mockResolvedValue(trx)
    mockQuery.mockImplementation(
      createTenantQueryMock([
        [
          { id: 'tenant-a', cursor_id: 1 },
          { id: 'tenant-b', cursor_id: 2 },
        ],
        [],
      ])
    )

    await expect(
      runMigrationsOnAllTenants({ signal: new AbortController().signal, sbReqId: 'sb-req-123' })
    ).resolves.toBeUndefined()

    expect(mockRunBatchSend).toHaveBeenCalledTimes(1)
    const [[batch]] = mockRunBatchSend.mock.calls
    expect(batch[0].payload).toMatchObject({
      tenantId: 'tenant-a',
      sbReqId: 'sb-req-123',
      tenant: {
        host: '',
        ref: 'tenant-a',
      },
    })
    expect(batch[1].payload).toMatchObject({
      tenantId: 'tenant-b',
      sbReqId: 'sb-req-123',
      tenant: {
        host: '',
        ref: 'tenant-b',
      },
    })
    expect(mockInfo).toHaveBeenCalledWith(
      expect.anything(),
      '[Migrations] Instance acquired the lock',
      expect.objectContaining({
        type: 'migrations',
        sbReqId: 'sb-req-123',
      })
    )
    expect(mockInfo).toHaveBeenCalledWith(
      expect.anything(),
      '[Migrations] Async migrations jobs completed',
      expect.objectContaining({
        type: 'migrations',
        sbReqId: 'sb-req-123',
      })
    )
  })

  it('passes sbReqId into fleet reset jobs and scheduler logs', async () => {
    const trx = makeTransaction()
    mockBeginTransaction.mockResolvedValue(trx)
    mockQuery.mockImplementation(createTenantQueryMock([[{ id: 'tenant-c', cursor_id: 1 }], []]))

    await expect(
      resetMigrationsOnTenants({
        till: 'storage-schema',
        markCompletedTillMigration: 'create-migrations-table',
        signal: new AbortController().signal,
        sbReqId: 'sb-req-123',
      })
    ).resolves.toBeUndefined()

    expect(mockResetBatchSend).toHaveBeenCalledTimes(1)
    const [[batch]] = mockResetBatchSend.mock.calls
    expect(batch[0].payload).toMatchObject({
      tenantId: 'tenant-c',
      untilMigration: 'storage-schema',
      markCompletedTillMigration: 'create-migrations-table',
      sbReqId: 'sb-req-123',
      tenant: {
        host: '',
        ref: 'tenant-c',
      },
    })
    expect(mockInfo).toHaveBeenCalledWith(
      expect.anything(),
      '[Migrations] reset migrations jobs scheduled',
      expect.objectContaining({
        type: 'migrations',
        sbReqId: 'sb-req-123',
      })
    )
  })

  it('preserves lock callback errors when rollback fails', async () => {
    const error = new Error('migration callback failed')
    const rollbackError = new Error('rollback failed')
    const trx = makeTransaction()
    trx.rollback.mockRejectedValue(rollbackError)
    mockBeginTransaction.mockResolvedValue(trx)

    await expect(
      obtainLockOnMultitenantDB(
        async () => {
          throw error
        },
        { sbReqId: 'sb-req-123' }
      )
    ).rejects.toBe(error)

    expect(trx.rollback).toHaveBeenCalledTimes(1)
    expect(mockWarning).toHaveBeenCalledWith(
      expect.anything(),
      '[Migrations] Failed to rollback transaction',
      expect.objectContaining({
        type: 'migrations',
        sbReqId: 'sb-req-123',
        error: rollbackError,
      })
    )
  })
})

describe('concurrent index migration recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    false,
    true,
  ])('repairs an invalid index before creating it (generated=%s)', async (generated) => {
    const sql = setPendingConcurrentIndexMigration({ unique: true, generated })
    const client = createMigrationRunnerClient(
      [
        {
          schema_name: 'storage',
          index_name: 'idx_objects_test',
          indisvalid: false,
          on_table: true,
        },
      ],
      'heap',
      [{ sql }]
    )

    await expect(runTestMigrations(client)).resolves.toHaveLength(1)

    const queryTexts = migrationQueryTexts(client)
    const catalogCheck = queryTexts.findIndex((text) => text.includes('pg_catalog.to_regclass'))
    const invalidIndexDrop = queryTexts.indexOf(
      'DROP INDEX CONCURRENTLY IF EXISTS "storage"."idx_objects_test"'
    )
    const createIndex = queryTexts.indexOf(normalizeSql(sql))
    const recordMigration = queryTexts.findIndex((text) =>
      text.startsWith('INSERT INTO migrations')
    )
    const catalogCall = client.query.mock.calls[catalogCheck]?.[0]

    expect(catalogCheck).toBeGreaterThan(-1)
    expect(catalogCall).toMatchObject({
      values: ['storage.objects', 'idx_objects_test'],
    })
    expect(invalidIndexDrop).toBeGreaterThan(catalogCheck)
    expect(createIndex).toBeGreaterThan(invalidIndexDrop)
    expect(recordMigration).toBeGreaterThan(createIndex)
    expect(queryTexts).not.toContain('START TRANSACTION')
    expect(getMigrationQueryCall(client, 'INSERT INTO migrations')?.[0]).toMatchObject({
      values: [1, 'objects-test-index', 'hash-1'],
    })
    expect(mockWarning).toHaveBeenCalledWith(
      expect.anything(),
      '[Migrations] Removed invalid indexes before retry',
      expect.objectContaining({
        type: 'migrations',
        metadata: JSON.stringify({
          migrationId: 1,
          migrationName: 'objects-test-index',
          indexes: [{ schemaName: 'storage', indexName: 'idx_objects_test' }],
        }),
      })
    )
  })

  it.each([
    false,
    true,
  ])('keeps a valid index when its migration record was lost (generated=%s)', async (generated) => {
    const sql = setPendingConcurrentIndexMigration({ generated })
    const client = createMigrationRunnerClient(
      [
        {
          schema_name: 'storage',
          index_name: 'idx_objects_test',
          indisvalid: true,
          on_table: true,
        },
      ],
      'heap',
      [{ sql }]
    )

    await expect(runTestMigrations(client)).resolves.toHaveLength(1)

    const queryTexts = migrationQueryTexts(client)

    expect(queryTexts.some((text) => text.startsWith('DROP INDEX'))).toBe(false)
    expect(queryTexts).toContain(normalizeSql(sql))
    expect(queryTexts.some((text) => text.startsWith('INSERT INTO migrations'))).toBe(true)
  })

  it('fails closed when the name belongs to an index on another table', async () => {
    const sql = setPendingConcurrentIndexMigration()
    const client = createMigrationRunnerClient([
      {
        schema_name: 'storage',
        index_name: 'idx_objects_test',
        indisvalid: true,
        on_table: false,
      },
    ])

    await expect(runTestMigrations(client)).rejects.toThrow(
      'its name is used by a different relation'
    )

    const queryTexts = migrationQueryTexts(client)

    expect(queryTexts).not.toContain(normalizeSql(sql))
    expect(queryTexts.some((text) => text.startsWith('INSERT INTO migrations'))).toBe(false)
  })

  it.each([
    false,
    true,
  ])('applies Oriole handling before index repair (generated=%s)', async (generated) => {
    const sql = setPendingConcurrentIndexMigration({ generated })
    const client = createMigrationRunnerClient([], 'orioledb', [{ sql }])

    await expect(runTestMigrations(client)).resolves.toHaveLength(1)

    const queryTexts = migrationQueryTexts(client)

    expect(queryTexts.some((text) => text.includes('pg_catalog.to_regclass'))).toBe(false)
    expect(queryTexts).toContain(
      'CREATE INDEX IF NOT EXISTS idx_objects_test ON storage.objects (bucket_id, name);'
    )
    expect(queryTexts).toContain('START TRANSACTION')
    expect(queryTexts).toContain('COMMIT')
  })

  it.each([
    { rows: [] },
    { rows: [{ sql: null }] },
    { rows: [{ sql: 1 }] },
    { rows: [{ sql: '  ' }] },
    { rows: [{ sql: 'SELECT 1' }, { sql: 'SELECT 2' }] },
  ])('does not record a migration with invalid generated SQL: $rows', async ({ rows }) => {
    setPendingConcurrentIndexMigration({ generated: true })
    const client = createMigrationRunnerClient([], 'heap', rows)

    await expect(runTestMigrations(client)).rejects.toThrow(
      'Generated migration must return exactly one non-empty sql string'
    )

    expect(
      migrationQueryTexts(client).some((text) => text.startsWith('INSERT INTO migrations'))
    ).toBe(false)
  })

  it('does not record a generated migration when its index creation fails', async () => {
    const sql = setPendingConcurrentIndexMigration({ generated: true })
    const client = createMigrationRunnerClient([], 'heap', [{ sql }])
    const query = client.query.getMockImplementation()!
    client.query.mockImplementation((statement: unknown) => {
      if (getQueryText(statement) === sql) {
        throw new Error('index build failed')
      }
      return query(statement)
    })

    await expect(runTestMigrations(client)).rejects.toThrow('index build failed')

    expect(
      migrationQueryTexts(client).some((text) => text.startsWith('INSERT INTO migrations'))
    ).toBe(false)
  })
})

describe('resetMigration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLastLocalMigrationName.mockResolvedValue('storage-schema')
    mockLocalMigrationFiles.mockResolvedValue([])
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 })
  })

  it('uses the advisory lock and marks skipped migrations as completed', async () => {
    const client = createMigrationClient([
      { id: 0, name: 'create-migrations-table' },
      { id: 1, name: 'initialmigration' },
      { id: 5, name: 'add-size-functions' },
    ])
    mockLocalMigrationFiles.mockResolvedValue([
      { id: 3, name: 'pathtoken-column', hash: 'hash-3' },
      { id: 4, name: 'add-migrations-rls', hash: 'hash-4' },
    ])

    await expect(
      resetMigration({
        tenantId: 'tenant-reset',
        untilMigration: 'storage-schema',
        markCompletedTillMigration: 'add-migrations-rls',
        databaseUrl: 'postgres://tenant',
      })
    ).resolves.toBe(true)

    const queryTexts = client.query.mock.calls.map(([statement]) =>
      normalizeSql(getQueryText(statement))
    )

    expect(queryTexts).toEqual([
      'SELECT pg_try_advisory_lock(-8525285245963000605);',
      'SET search_path TO storage,public',
      'SELECT * from migrations',
      'BEGIN',
      'DELETE FROM migrations WHERE id > $1',
      'INSERT INTO migrations(id, name, hash, executed_at) VALUES ($1, $2, $3, NOW()),($4, $5, $6, NOW())',
      'COMMIT',
      'SELECT pg_advisory_unlock(-8525285245963000605);',
    ])

    const deleteCall = getMigrationQueryCall(client, 'DELETE FROM migrations WHERE id >')
    expect(deleteCall?.[0]).toMatchObject({
      text: 'DELETE FROM migrations WHERE id > $1',
      values: [2],
    })

    const insertCall = getMigrationQueryCall(client, 'INSERT INTO migrations')
    expect(insertCall?.[0]).toMatchObject({
      values: [3, 'pathtoken-column', 'hash-3', 4, 'add-migrations-rls', 'hash-4'],
    })

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('UPDATE tenants'),
        values: ['COMPLETED', 'add-migrations-rls', 'tenant-reset'],
      }),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    )
    expect(client.end).toHaveBeenCalledTimes(1)
  })

  it('does not open a transaction for no-op resets', async () => {
    const client = createMigrationClient([
      { id: 0, name: 'create-migrations-table' },
      { id: 1, name: 'initialmigration' },
      { id: 2, name: 'storage-schema' },
    ])

    await expect(
      resetMigration({
        tenantId: 'tenant-reset',
        untilMigration: 'storage-schema',
        databaseUrl: 'postgres://tenant',
      })
    ).resolves.toBe(false)

    const queryTexts = client.query.mock.calls.map(([statement]) =>
      normalizeSql(getQueryText(statement))
    )

    expect(queryTexts).toEqual([
      'SELECT pg_try_advisory_lock(-8525285245963000605);',
      'SET search_path TO storage,public',
      'SELECT * from migrations',
      'SELECT pg_advisory_unlock(-8525285245963000605);',
    ])
    expect(mockQuery).not.toHaveBeenCalled()
    expect(client.end).toHaveBeenCalledTimes(1)
  })

  it('rejects resets that would replay storage-schema after object name uniqueness is removed', async () => {
    const client = createMigrationClient([
      { id: 0, name: 'create-migrations-table' },
      { id: 72, name: 'drop-bucketid-objname-index' },
    ])

    await expect(
      resetMigration({
        tenantId: 'tenant-reset',
        untilMigration: 'initialmigration',
        databaseUrl: 'postgres://tenant',
      })
    ).rejects.toThrow(
      'Cannot replay storage-schema: storage.objects exists without the legacy bucketid_objname index; use markCompletedTillMigration to skip it'
    )

    const queryTexts = client.query.mock.calls.map(([statement]) =>
      normalizeSql(getQueryText(statement))
    )

    expect(queryTexts).not.toContain('BEGIN')
    expect(queryTexts).not.toContain('DELETE FROM migrations WHERE id > $1')
    expect(client.end).toHaveBeenCalledTimes(1)
  })

  it('rejects a second unsafe reset after the activation migration row was removed', async () => {
    const client = createMigrationClient(
      [
        { id: 0, name: 'create-migrations-table' },
        { id: 71, name: 'objects-delete-marker-index' },
      ],
      true
    )

    await expect(
      resetMigration({
        tenantId: 'tenant-reset',
        untilMigration: 'initialmigration',
        databaseUrl: 'postgres://tenant',
      })
    ).rejects.toThrow(
      'Cannot replay storage-schema: storage.objects exists without the legacy bucketid_objname index; use markCompletedTillMigration to skip it'
    )

    const queryTexts = client.query.mock.calls.map(([statement]) =>
      normalizeSql(getQueryText(statement))
    )

    expect(queryTexts.some((query) => query.includes('AS reset_floor_active'))).toBe(true)
    expect(queryTexts).not.toContain('BEGIN')
    expect(queryTexts).not.toContain('DELETE FROM migrations WHERE id > $1')
  })

  it('allows resets after storage-schema once object name uniqueness is removed', async () => {
    const client = createMigrationClient([
      { id: 0, name: 'create-migrations-table' },
      { id: 72, name: 'drop-bucketid-objname-index' },
    ])

    await expect(
      resetMigration({
        tenantId: 'tenant-reset',
        untilMigration: 'objects-delete-marker-index',
        databaseUrl: 'postgres://tenant',
      })
    ).resolves.toBe(true)

    const deleteCall = getMigrationQueryCall(client, 'DELETE FROM migrations WHERE id >')
    expect(deleteCall?.[0]).toMatchObject({
      values: [71],
    })
  })

  it('allows resets below storage-schema when it is marked completed', async () => {
    const client = createMigrationClient([
      { id: 0, name: 'create-migrations-table' },
      { id: 72, name: 'drop-bucketid-objname-index' },
    ])
    mockLocalMigrationFiles.mockResolvedValue([
      { id: 1, name: 'initialmigration', hash: 'hash-1' },
      { id: 2, name: 'storage-schema', hash: 'hash-2' },
    ])

    await expect(
      resetMigration({
        tenantId: 'tenant-reset',
        untilMigration: 'create-migrations-table',
        markCompletedTillMigration: 'storage-schema',
        databaseUrl: 'postgres://tenant',
      })
    ).resolves.toBe(true)

    const deleteCall = getMigrationQueryCall(client, 'DELETE FROM migrations WHERE id >')
    expect(deleteCall?.[0]).toMatchObject({
      values: [0],
    })

    const insertCall = getMigrationQueryCall(client, 'INSERT INTO migrations')
    expect(insertCall?.[0]).toMatchObject({
      values: [1, 'initialmigration', 'hash-1', 2, 'storage-schema', 'hash-2'],
    })
  })

  it('rolls back, unlocks, and closes the client when mark-completed migration files are missing', async () => {
    const client = createMigrationClient([
      { id: 0, name: 'create-migrations-table' },
      { id: 1, name: 'initialmigration' },
      { id: 5, name: 'add-size-functions' },
    ])
    mockLocalMigrationFiles.mockResolvedValue([{ id: 3, name: 'pathtoken-column', hash: 'hash-3' }])

    await expect(
      resetMigration({
        tenantId: 'tenant-reset',
        untilMigration: 'storage-schema',
        markCompletedTillMigration: 'add-migrations-rls',
        databaseUrl: 'postgres://tenant',
      })
    ).rejects.toThrow('Migration add-migrations-rls not found')

    const queryTexts = client.query.mock.calls.map(([statement]) =>
      normalizeSql(getQueryText(statement))
    )

    expect(queryTexts).toContain('BEGIN')
    expect(queryTexts).toContain('ROLLBACK')
    expect(queryTexts).not.toContain('COMMIT')
    expect(queryTexts.at(-1)).toBe('SELECT pg_advisory_unlock(-8525285245963000605);')
    expect(mockQuery).not.toHaveBeenCalled()
    expect(client.end).toHaveBeenCalledTimes(1)
  })
})
