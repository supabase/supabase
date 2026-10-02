import type { AsyncAbortController } from '@internal/concurrency'
import { vi } from 'vitest'

type Deferred = ReturnType<typeof Promise.withResolvers<void>>

const bootOrder = vi.hoisted((): string[] => [])
const shutdownOrder = vi.hoisted((): string[] => [])
const startupState = vi.hoisted((): { shutdownController: AsyncAbortController | undefined } => ({
  shutdownController: undefined,
}))
const migrationDrainState = vi.hoisted((): { deferred: Deferred } => ({
  deferred: Promise.withResolvers<void>(),
}))
const mockAdminListen = vi.hoisted(() => vi.fn())
const serverConfigState = vi.hoisted(() => ({ isMultitenant: false }))

vi.mock('./tracing', () => ({}))
vi.mock('@internal/monitoring/otel-metrics', () => ({}))
vi.mock('@internal/monitoring', () => ({
  logger: { info: vi.fn() },
  logSchema: { info: vi.fn(), error: vi.fn() },
}))
vi.mock('@internal/cluster/cluster', () => ({
  Cluster: {
    size: 0,
    init: vi.fn(async (signal: AbortSignal) => {
      bootOrder.push('cluster.init')
      signal.addEventListener('abort', () => shutdownOrder.push('cluster'))
    }),
    on: vi.fn(() => {
      bootOrder.push('cluster.on')
    }),
  },
}))
vi.mock('@internal/database', () => ({
  listenForTenantUpdate: vi.fn(async () => {}),
  multitenantPgExecutor: {},
  PgTenantConnection: {
    poolManager: {
      setNumWorkers: vi.fn(() => {
        bootOrder.push('poolManager.setNumWorkers')
      }),
      monitor: vi.fn(() => {
        bootOrder.push('poolManager.monitor')
      }),
      rebalanceAll: vi.fn(),
    },
  },
  PubSub: {
    start: vi.fn(async ({ signal }: { signal: AbortSignal }) => {
      signal.addEventListener('abort', () => shutdownOrder.push('pubsub'))
    }),
  },
}))
vi.mock('@internal/database/migrations', () => ({
  runMigrationsOnTenant: vi.fn(async () => {}),
  runMultitenantMigrations: vi.fn(async () => {}),
  startAsyncMigrations: vi.fn((signal: AbortSignal) => {
    signal.addEventListener('abort', () => {
      shutdownOrder.push('migrations')
      return migrationDrainState.deferred.promise
    })
  }),
}))
vi.mock('@internal/queue', () => ({
  Queue: {
    start: vi.fn(async ({ signal }: { signal: AbortSignal }) => {
      bootOrder.push('queue.start')
      signal.addEventListener('abort', () => shutdownOrder.push('queue'))
    }),
  },
  SYSTEM_TENANT: 'system',
}))
vi.mock('@internal/sharding', () => ({
  PgShardStoreFactory: class {},
  ShardCatalog: class {
    createShards = vi.fn(async () => {})
  },
}))
vi.mock('@platformatic/globals', () => ({ getGlobal: () => undefined }))
vi.mock('@storage/events', () => ({ registerWorkers: vi.fn() }))
vi.mock('@storage/events/upgrades/sync-catalog-ids', () => ({
  SyncCatalogIds: { invoke: vi.fn(async () => {}) },
}))
vi.mock('fastify', () => ({ LogController: class {} }))
vi.mock('../admin-app', () => ({
  default: vi.fn(() => ({
    server: {},
    listen: mockAdminListen.mockImplementation(async ({ signal }: { signal: AbortSignal }) => {
      signal.addEventListener('abort', () => shutdownOrder.push('admin'))
    }),
  })),
}))
vi.mock('../app', () => ({
  default: vi.fn(() => ({
    server: {},
    listen: vi.fn(async ({ signal }: { signal: AbortSignal }) => {
      signal.addEventListener('abort', () => shutdownOrder.push('api'))
    }),
  })),
}))
vi.mock('../config', () => ({
  getConfig: () => ({
    databaseURL: 'postgres://example',
    isMultitenant: serverConfigState.isMultitenant,
    pgQueueEnable: true,
    dbMigrationFreezeAt: undefined,
    vectorBucketProvider: 's3',
    vectorDatabaseURL: undefined,
    vectorEnabled: false,
    vectorStoreMigrationsEnabled: false,
    vectorS3Buckets: [],
    icebergShards: [],
    numWorkers: 4,
    exposeDocs: false,
    requestTraceHeader: undefined,
    port: 0,
    host: '127.0.0.1',
  }),
}))
vi.mock('./shutdown', () => ({
  bindShutdownSignals: vi.fn((controller: AsyncAbortController) => {
    startupState.shutdownController = controller
  }),
  createServerClosedPromise: vi.fn(() => Promise.resolve()),
  shutdown: vi.fn(async () => {}),
}))

describe('server boot order', () => {
  beforeEach(() => {
    serverConfigState.isMultitenant = false
    migrationDrainState.deferred = Promise.withResolvers<void>()
  })

  afterEach(() => {
    migrationDrainState.deferred.resolve()
    bootOrder.length = 0
    shutdownOrder.length = 0
    startupState.shutdownController = undefined
    vi.restoreAllMocks()
    vi.clearAllMocks()
    vi.resetModules()
  })

  test('initializes pool sizing and cluster discovery before queue workers start', async () => {
    // Track exit to find out mock gaps and silently pass the test.
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('server unexpectedly called process.exit()')
    })

    await import('./server')
    await vi.waitFor(() => expect(bootOrder).toContain('queue.start'))

    expect(bootOrder).toEqual([
      'poolManager.setNumWorkers',
      'poolManager.monitor',
      'cluster.init',
      'cluster.on',
      'queue.start',
    ])
    expect(exitSpy).not.toHaveBeenCalled()
  })

  test('drains migration producers before stopping the queue and its dependencies', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('server unexpectedly called process.exit()')
    })
    serverConfigState.isMultitenant = true

    await import('./server')
    await vi.waitFor(() => expect(startupState.shutdownController).toBeDefined())
    await vi.waitFor(() => expect(bootOrder).toContain('queue.start'))
    await vi.waitFor(() => expect(mockAdminListen).toHaveBeenCalledOnce())

    const shutdownController = startupState.shutdownController
    expect(shutdownController).toBeDefined()
    if (!shutdownController) {
      throw new Error('Server did not register its shutdown controller')
    }

    const abortPromise = shutdownController.abortAsync()
    await vi.waitFor(() => {
      expect(shutdownOrder).toEqual(['api', 'admin', 'migrations'])
    })

    migrationDrainState.deferred.resolve()
    await abortPromise

    expect(shutdownOrder).toEqual(['api', 'admin', 'migrations', 'queue', 'cluster', 'pubsub'])
    expect(exitSpy).not.toHaveBeenCalled()
  })
})
