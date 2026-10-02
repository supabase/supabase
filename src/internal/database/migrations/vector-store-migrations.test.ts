import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockClientConfigs,
  mockPgClients,
  mockLoadMigrationFilesCached,
  mockRunMigrationStep,
  mockValidateMigrationHashes,
} = vi.hoisted(() => ({
  mockClientConfigs: [] as Array<Record<string, unknown>>,
  mockPgClients: [] as MockPgClient[],
  mockLoadMigrationFilesCached: vi.fn(),
  mockRunMigrationStep: vi.fn(),
  mockValidateMigrationHashes: vi.fn(),
}))

vi.mock('../../../config', () => ({
  MultitenantMigrationStrategy: {
    ON_REQUEST: 'ON_REQUEST',
    PROGRESSIVE: 'PROGRESSIVE',
    FULL_FLEET: 'FULL_FLEET',
  },
  getConfig: () => ({
    isMultitenant: false,
    multitenantDatabaseUrl: '',
    pgQueueEnable: false,
    databaseSSLRootCert: '',
    dbMigrationStrategy: 'ON_REQUEST',
    dbAnonRole: 'anon',
    dbAuthenticatedRole: 'authenticated',
    dbSuperUser: 'postgres',
    dbServiceRole: 'service_role',
    dbInstallRoles: false,
    dbRefreshMigrationHashesOnMismatch: false,
    dbMigrationFreezeAt: undefined,
    icebergShards: [],
    multitenantDatabaseQueryTimeout: 1000,
    vectorBucketProvider: 'pgvector',
    vectorDatabaseCreate: false,
    vectorDatabaseURL: 'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
    vectorStoreMigrationsEnabled: true,
  }),
}))

vi.mock('pg', () => ({
  Client: vi.fn(function MockClient(config: Record<string, unknown>) {
    const client = mockPgClients.shift()
    if (!client) {
      throw new Error(`Unexpected pg Client for ${String(config.connectionString)}`)
    }

    mockClientConfigs.push(config)
    return client
  }),
}))

vi.mock('postgres-migrations/dist/run-migration', () => ({
  runMigration: vi.fn(() => async (migration: unknown) => {
    mockRunMigrationStep(migration)
    return migration
  }),
}))

vi.mock('postgres-migrations/dist/validation', () => ({
  validateMigrationHashes: mockValidateMigrationHashes,
}))

vi.mock('@storage/events', () => ({
  RunMigrationsOnTenants: class {
    static batchSend = vi.fn()
  },
  ResetMigrationsOnTenant: class {
    static batchSend = vi.fn()
  },
}))

vi.mock('../../monitoring', () => ({
  logger: {},
  logSchema: {
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('../multitenant-pg', () => ({
  multitenantPgExecutor: {
    query: vi.fn(),
    beginTransaction: vi.fn(),
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
  lastLocalMigrationName: vi.fn(),
  loadMigrationFilesCached: mockLoadMigrationFilesCached,
  localMigrationFiles: vi.fn(),
}))

vi.mock('./progressive', () => ({
  ProgressiveMigrations: class {
    start() {
      return undefined
    }
  },
}))

import { runMigrationsOnTenant, runVectorStoreMigrations } from './migrate'

interface MockPgClient {
  connect: ReturnType<typeof vi.fn>
  end: ReturnType<typeof vi.fn>
  on: ReturnType<typeof vi.fn>
  queries: string[]
  query: ReturnType<typeof vi.fn>
}

function queryText(query: unknown): string {
  if (query && typeof query === 'object') {
    if ('text' in query && typeof query.text === 'string') {
      return query.text
    }
    if ('sql' in query && typeof query.sql === 'string') {
      return query.sql
    }
  }

  return String(query)
}

function createMockPgClient(options: {
  defaultAccessMethod?: string
  databaseExists?: boolean
  migrationTableExists?: boolean
  schemaExists?: boolean
}): MockPgClient {
  const queries: string[] = []

  return {
    connect: vi.fn().mockResolvedValue(undefined),
    end: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    queries,
    query: vi.fn(async (query: unknown) => {
      const text = queryText(query)
      queries.push(text)

      if (text === 'SHOW default_table_access_method') {
        return { rows: [{ default_table_access_method: options.defaultAccessMethod ?? 'heap' }] }
      }

      if (text.includes('SELECT 1 FROM pg_database')) {
        return { rows: options.databaseExists ? [{ exists: 1 }] : [] }
      }

      if (text.includes('pg_try_advisory_lock')) {
        return { rows: [{ pg_try_advisory_lock: true }] }
      }

      if (text.includes('pg_catalog.pg_class')) {
        return { rows: [{ exists: options.migrationTableExists ?? false }] }
      }

      if (text.includes('information_schema.schemata')) {
        return { rows: [{ exists: options.schemaExists ?? false }] }
      }

      return { rows: [] }
    }),
  }
}

describe('runVectorStoreMigrations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClientConfigs.length = 0
    mockPgClients.length = 0
    mockLoadMigrationFilesCached.mockResolvedValue([
      {
        id: 1,
        name: 'create-vector-store',
        hash: 'hash',
        sql: 'CREATE TABLE vector_store_test(id int);',
        contents: 'CREATE TABLE vector_store_test(id int);',
      },
    ])
  })

  it('configures a dedicated vector database for Oriole before running vector migrations', async () => {
    const maintenanceClient = createMockPgClient({
      defaultAccessMethod: 'orioledb',
      databaseExists: false,
    })
    const vectorSetupClient = createMockPgClient({})
    const migrationClient = createMockPgClient({})
    mockPgClients.push(maintenanceClient, vectorSetupClient, migrationClient)

    await runVectorStoreMigrations({
      databaseUrl: 'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
      createDatabase: true,
      waitForLock: false,
    })

    expect(mockClientConfigs.map((config) => config.connectionString)).toEqual([
      'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
      'postgresql://postgres:postgres@127.0.0.1:5432/storage_vectors',
      'postgresql://postgres:postgres@127.0.0.1:5432/storage_vectors',
    ])
    expect(maintenanceClient.queries).toContain('CREATE DATABASE "storage_vectors"')
    expect(vectorSetupClient.queries).toContain('CREATE EXTENSION IF NOT EXISTS orioledb')
    expect(vectorSetupClient.queries).toContain(
      'ALTER DATABASE "storage_vectors" SET default_table_access_method = \'orioledb\''
    )
    expect(migrationClient.queries[0]).toBe("SET statement_timeout TO '12h'")
  })

  it('runs single-tenant vector migrations in the configured database when database creation is disabled', async () => {
    const tenantMigrationClient = createMockPgClient({})
    const vectorMigrationClient = createMockPgClient({})
    mockPgClients.push(tenantMigrationClient, vectorMigrationClient)

    await runMigrationsOnTenant({
      databaseUrl: 'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
      waitForLock: false,
    })

    expect(mockClientConfigs.map((config) => config.connectionString)).toEqual([
      'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
      'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
    ])
    expect(tenantMigrationClient.queries).not.toContain('CREATE DATABASE "storage_vectors"')
    expect(vectorMigrationClient.queries[0]).toBe("SET statement_timeout TO '12h'")
  })
})
