import type { Lease } from '@internal/cache'
import { TENANT_POOL_CACHE_NAME } from '@internal/cache/names'
import { captureBatchObserver } from '@internal/testing/metrics'
import { type Mock, vi } from 'vitest'
import type { PoolStrategy, PoolStrategySettings, TenantConnectionOptions } from './pool'

type TestPool = {
  acquire: Mock
  rebalance: Mock
  dispose: Mock<(reason: 'destroy' | 'evict') => Promise<void>>
  getPoolStats: Mock
}

type PoolModule = typeof import('./pool')
type MetricsModule = typeof import('@internal/monitoring/metrics')

function createPoolSettings(tenantId: string): TenantConnectionOptions {
  return {
    tenantId,
    dbUrl: 'postgres://example',
    maxConnections: 10,
    user: { jwt: 'jwt', payload: { role: 'authenticated' } },
    superUser: { jwt: 'service', payload: { role: 'service_role' } },
  }
}

function createTestPool(stats: { used: number; total: number } | null = null): TestPool {
  return {
    acquire: vi.fn(),
    rebalance: vi.fn(),
    dispose: vi.fn().mockResolvedValue(undefined),
    getPoolStats: vi.fn().mockReturnValue(stats),
  }
}

const autoTeardownManagers: { destroyAll(): Promise<unknown> }[] = []

function createTestPoolManager(
  poolModule: PoolModule,
  makePool: (settings: PoolStrategySettings, created: readonly TestPool[]) => TestPool = () =>
    createTestPool()
) {
  const created: TestPool[] = []
  const poolManager = new (class extends poolModule.PoolManager {
    protected newPool(settings: PoolStrategySettings): TestPool {
      const pool = makePool(settings, created)
      created.push(pool)
      return pool
    }
  })()
  autoTeardownManagers.push(poolManager)
  return { poolManager, created }
}

// Checkout without keeping the request lease, for tests that only need the
// cached value or the LRU side effects.
function getReleasedPool<TPool extends PoolStrategy>(
  poolManager: { getPool(settings: TenantConnectionOptions): Lease<TPool> },
  settings: TenantConnectionOptions
): TPool {
  const lease = poolManager.getPool(settings)
  lease.release()
  return lease.value
}

function physicalPoolOf(strategy: { acquire(): { getCacheScope(): object } }) {
  return strategy.acquire().getCacheScope() as { options?: { connectionString?: string } }
}

function expectDisposedStrategy(strategy: { acquire(): unknown }) {
  expect(() => strategy.acquire()).toThrow(
    expect.objectContaining({
      code: 'InternalError',
      message: 'Cannot acquire from a disposed pool strategy',
    })
  )
}

async function loadPoolModule(
  maxEntries?: number,
  configOverrides: Record<string, unknown> = {},
  beforePoolImport?: (metrics: MetricsModule) => void
): Promise<PoolModule> {
  vi.resetModules()

  const configModule = await import('../../config')
  configModule.getConfig({ reload: true })
  configModule.mergeConfig({
    isMultitenant: true,
    ...(maxEntries === undefined ? {} : { tenantPoolCacheMaxEntries: maxEntries }),
    ...configOverrides,
  } as Parameters<typeof configModule.mergeConfig>[0])

  if (beforePoolImport) {
    beforePoolImport(await import('@internal/monitoring/metrics'))
  }

  return import('./pool')
}

describe('PoolManager cache lifecycle', () => {
  beforeAll(() => {
    vi.useFakeTimers()
  })

  beforeEach(() => {
    vi.clearAllTimers()
    vi.setSystemTime(1_000)
  })

  afterEach(async () => {
    for (const poolManager of autoTeardownManagers.splice(0)) {
      await poolManager.destroyAll()
    }
    vi.doUnmock('@internal/cache')
    vi.resetModules()
    vi.restoreAllMocks()
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  test('retains inactive pools until LRU capacity evicts the least recent entry', async () => {
    const poolModule = await loadPoolModule(2)

    const { poolManager, created } = createTestPoolManager(poolModule)
    const first = getReleasedPool(poolManager, createPoolSettings('tenant-a'))
    getReleasedPool(poolManager, createPoolSettings('tenant-b'))

    await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000)
    expect(getReleasedPool(poolManager, createPoolSettings('tenant-a'))).toBe(first)
    expect(created[0].dispose).not.toHaveBeenCalled()
    expect(created[1].dispose).not.toHaveBeenCalled()

    getReleasedPool(poolManager, createPoolSettings('tenant-c'))

    expect(created[0].dispose).not.toHaveBeenCalled()
    expect(created[1].dispose).toHaveBeenCalledExactlyOnceWith('evict')
  })

  test('rebalance does not promote pool LRU recency', async () => {
    const poolModule = await loadPoolModule(2)

    const { poolManager, created } = createTestPoolManager(poolModule)
    getReleasedPool(poolManager, createPoolSettings('tenant-a'))
    getReleasedPool(poolManager, createPoolSettings('tenant-b'))

    poolManager.rebalance('tenant-a', { maxConnections: 20 })
    getReleasedPool(poolManager, createPoolSettings('tenant-c'))

    expect(created[0].rebalance).toHaveBeenCalledWith({ maxConnections: 20 })
    expect(created[0].dispose).toHaveBeenCalledTimes(1)
    expect(created[1].dispose).not.toHaveBeenCalled()
  })

  test('keeps a real evicted strategy usable until every request lease is released', async () => {
    await loadPoolModule(1)
    const { PgPoolManager, PgTenantConnection } = await import('./pg-connection')
    const poolManager = new PgPoolManager()
    const tenantA = createPoolSettings('tenant-real-lease-a')
    const tenantB = createPoolSettings('tenant-real-lease-b')
    const firstLease = poolManager.getPool(tenantA)
    const strategyA = firstLease.value
    const firstConnection = new PgTenantConnection(firstLease, tenantA)
    const secondConnection = new PgTenantConnection(poolManager.getPool(tenantA), tenantA)
    const physicalPool = physicalPoolOf(strategyA)
    const connectionB = new PgTenantConnection(poolManager.getPool(tenantB), tenantB)

    try {
      firstConnection.dispose()
      firstConnection.dispose()
      await Promise.resolve()

      expect(physicalPoolOf(strategyA)).toBe(physicalPool)

      secondConnection.dispose()
      expectDisposedStrategy(strategyA)
    } finally {
      firstConnection.dispose()
      secondConnection.dispose()
      connectionB.dispose()
      await poolManager.destroyAll()
    }
  })

  test('forces a real evicted strategy to retire on explicit invalidation', async () => {
    await loadPoolModule(1)
    const { PgPoolManager, PgTenantConnection } = await import('./pg-connection')
    const poolManager = new PgPoolManager()
    const tenantA = createPoolSettings('tenant-real-force-a')
    const tenantB = createPoolSettings('tenant-real-force-b')
    const leaseA = poolManager.getPool(tenantA)
    const strategyA = leaseA.value
    const connectionA = new PgTenantConnection(leaseA, tenantA)
    strategyA.acquire()
    const connectionB = new PgTenantConnection(poolManager.getPool(tenantB), tenantB)

    try {
      await poolManager.destroy(tenantA.tenantId)
      expectDisposedStrategy(strategyA)
    } finally {
      connectionA.dispose()
      connectionB.dispose()
      await poolManager.destroyAll()
    }
  })

  test('keeps an evicted old-URL strategy isolated from the replacement URL', async () => {
    await loadPoolModule(1)
    const { PgPoolManager, PgTenantConnection } = await import('./pg-connection')
    const poolManager = new PgPoolManager()
    const tenantA = createPoolSettings('tenant-real-reconcile-a')
    const tenantB = createPoolSettings('tenant-real-reconcile-b')
    const leaseA = poolManager.getPool(tenantA)
    const strategyA = leaseA.value
    const connectionA = new PgTenantConnection(leaseA, tenantA)
    const oldPhysicalPool = physicalPoolOf(strategyA)
    const connectionB = new PgTenantConnection(poolManager.getPool(tenantB), tenantB)
    const updatedTenantA = {
      ...tenantA,
      dbUrl: 'postgres://new-host.example.test/new-database',
    }

    try {
      const updatedStrategy = getReleasedPool(poolManager, updatedTenantA)

      expect(updatedStrategy).not.toBe(strategyA)
      expect(physicalPoolOf(strategyA)).toBe(oldPhysicalPool)
      expect(physicalPoolOf(updatedStrategy).options?.connectionString).toBe(updatedTenantA.dbUrl)
    } finally {
      connectionA.dispose()
      connectionB.dispose()
      await poolManager.destroyAll()
    }
  })

  test('does not create a timer for hot pool-cache hits', async () => {
    const poolModule = await loadPoolModule()

    const { poolManager } = createTestPoolManager(poolModule)
    const settings = createPoolSettings('tenant-hot-cache-entry')
    const first = getReleasedPool(poolManager, settings)
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

    setTimeoutSpy.mockClear()
    for (let index = 0; index < 1_000; index++) {
      expect(getReleasedPool(poolManager, settings)).toBe(first)
    }

    expect(setTimeoutSpy).not.toHaveBeenCalled()
  })

  test('forces a deferred eviction and logs when a request lease exceeds its deadline', async () => {
    const poolModule = await loadPoolModule(1)
    const monitoringModule = await import('@internal/monitoring')
    const logSpy = vi
      .spyOn(monitoringModule.logSchema, 'warning')
      .mockImplementation(() => undefined)

    const { poolManager, created } = createTestPoolManager(poolModule)
    const leaseA = poolManager.getPool(createPoolSettings('tenant-lease-deadline-a'))
    getReleasedPool(poolManager, createPoolSettings('tenant-lease-deadline-b'))

    expect(created[0].dispose).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(60 * 60 * 1000)

    expect(created[0].dispose).toHaveBeenCalledExactlyOnceWith('evict')
    expect(logSpy).toHaveBeenCalledWith(
      expect.anything(),
      '[PgPoolStrategy] Timed out waiting for request leases to release',
      expect.objectContaining({
        type: 'db',
        tenantId: 'tenant-lease-deadline-a',
        project: 'tenant-lease-deadline-a',
        metadata: JSON.stringify({
          reason: 'evict',
          leaseTimeoutMs: 60 * 60 * 1000,
          activeLeases: 1,
        }),
      })
    )

    leaseA.release()
    expect(created[0].dispose).toHaveBeenCalledTimes(1)
  })

  test('keeps the single-tenant pool alive until explicit teardown', async () => {
    const poolModule = await loadPoolModule(undefined, { isMultitenant: false })

    const { poolManager, created } = createTestPoolManager(poolModule)
    const settings = createPoolSettings('single-tenant-cache-entry')
    const first = getReleasedPool(poolManager, settings)

    await vi.advanceTimersByTimeAsync(200)

    expect(getReleasedPool(poolManager, settings)).toBe(first)
    expect(created).toHaveLength(1)
    expect(created[0].dispose).not.toHaveBeenCalled()
  })

  test('records logical pool cache misses and hits', async () => {
    const poolModule = await loadPoolModule()
    const metricsModule = await import('@internal/monitoring/metrics')
    const recordSpy = vi.spyOn(metricsModule, 'recordCacheRequest')

    const { poolManager, created } = createTestPoolManager(poolModule)
    const settings = createPoolSettings('tenant-cache-metrics')

    const first = getReleasedPool(poolManager, settings)
    const second = getReleasedPool(poolManager, settings)

    expect(second).toBe(first)
    expect(created).toHaveLength(1)
    expect(recordSpy.mock.calls).toEqual(
      expect.arrayContaining([
        [TENANT_POOL_CACHE_NAME, 'miss'],
        [TENANT_POOL_CACHE_NAME, 'hit'],
      ])
    )
  })

  test('shares cached tenant pools across manager instances', async () => {
    const poolModule = await loadPoolModule()

    const { poolManager: firstManager, created: firstCreated } = createTestPoolManager(poolModule)
    const { poolManager: secondManager, created: secondCreated } = createTestPoolManager(poolModule)
    const settings = createPoolSettings('tenant-shared-manager-cache')

    const first = getReleasedPool(firstManager, settings)
    const second = getReleasedPool(secondManager, settings)

    expect(second).toBe(first)
    expect(firstCreated).toHaveLength(1)
    expect(secondCreated).toHaveLength(0)
  })

  test('uses tenant and database URL as immutable strategy identity', async () => {
    const poolModule = await loadPoolModule()

    const { poolManager, created } = createTestPoolManager(poolModule)
    const originalSettings = createPoolSettings('tenant-pool-identity')
    const first = getReleasedPool(poolManager, originalSettings)
    const currentSettings = {
      ...originalSettings,
      dbUrl: 'postgres://moved',
      isExternalPool: true,
    }
    const second = getReleasedPool(poolManager, currentSettings)

    expect(second).not.toBe(first)
    expect(created).toHaveLength(2)
    expect(created[0].dispose).not.toHaveBeenCalled()
    expect(getReleasedPool(poolManager, originalSettings)).toBe(first)
    expect(getReleasedPool(poolManager, currentSettings)).toBe(second)
    expect(created).toHaveLength(2)

    await poolManager.destroy(originalSettings.tenantId)
    expect(created[0].dispose).toHaveBeenCalledExactlyOnceWith('destroy')
    expect(created[1].dispose).toHaveBeenCalledExactlyOnceWith('destroy')
  })

  test('reuses same-URL strategies and applies capacity changes in place', async () => {
    const poolModule = await loadPoolModule()

    const { poolManager, created } = createTestPoolManager(poolModule)
    const settings = createPoolSettings('tenant-pool-budget')
    const pool = getReleasedPool(poolManager, settings)

    expect(
      getReleasedPool(poolManager, {
        ...settings,
        maxConnections: 20,
        clusterSize: 4,
      })
    ).toBe(pool)
    expect(created).toHaveLength(1)
    expect(created[0].rebalance).toHaveBeenCalledWith({ maxConnections: 20 })

    created[0].rebalance.mockClear()
    poolManager.rebalance(settings.tenantId, {
      maxConnections: 30,
      clusterSize: 5,
    })
    poolManager.rebalanceAll({ clusterSize: 6 })

    expect(created[0].rebalance.mock.calls).toEqual([
      [{ maxConnections: 30, clusterSize: 5 }],
      [{ clusterSize: 6 }],
    ])
  })

  test('releases a checked-out lease when rebalance fails before returning it', async () => {
    const poolModule = await loadPoolModule(1)
    const rebalanceError = new Error('rebalance failed')

    const { poolManager, created } = createTestPoolManager(poolModule, (_settings, pools) => {
      const pool = createTestPool()
      if (pools.length === 0) {
        pool.rebalance.mockImplementationOnce(() => {
          throw rebalanceError
        })
      }
      return pool
    })

    expect(() => poolManager.getPool(createPoolSettings('tenant-rebalance-failure-a'))).toThrow(
      rebalanceError
    )
    getReleasedPool(poolManager, createPoolSettings('tenant-rebalance-failure-b'))

    expect(created[0].dispose).toHaveBeenCalledExactlyOnceWith('evict')
  })

  test('logs a failed deferred retirement once without replaying it during shutdown', async () => {
    const poolModule = await loadPoolModule(1)
    const monitoringModule = await import('@internal/monitoring')
    const retirementError = new Error('capacity retirement failed')
    const logSpy = vi.spyOn(monitoringModule.logSchema, 'error').mockImplementation(() => undefined)

    const { poolManager } = createTestPoolManager(poolModule, (_settings, pools) => {
      const pool = createTestPool()
      if (pools.length === 0) {
        pool.dispose.mockRejectedValue(retirementError)
      }
      return pool
    })
    getReleasedPool(poolManager, createPoolSettings('tenant-capacity-error-a'))
    getReleasedPool(poolManager, createPoolSettings('tenant-capacity-error-b'))

    await vi.waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith(
        expect.anything(),
        'pool was not able to be destroyed',
        expect.objectContaining({ type: 'db', error: retirementError })
      )
    })

    await expect(poolManager.destroyAll()).resolves.toEqual([
      { status: 'fulfilled', value: undefined },
    ])
    expect(logSpy).toHaveBeenCalledTimes(1)
  })

  test('leaves an observed forced-retirement failure for the shutdown caller to report', async () => {
    const poolModule = await loadPoolModule(1)
    const monitoringModule = await import('@internal/monitoring')
    const forcedDisposal = Promise.withResolvers<void>()
    const retirementError = new Error('forced capacity retirement failed')
    const logSpy = vi.spyOn(monitoringModule.logSchema, 'error').mockImplementation(() => undefined)

    const { poolManager } = createTestPoolManager(poolModule, (_settings, pools) => {
      const pool = createTestPool()
      if (pools.length === 0) {
        pool.dispose.mockReturnValue(forcedDisposal.promise)
      }
      return pool
    })
    poolManager.getPool(createPoolSettings('tenant-capacity-forced-error-a'))
    getReleasedPool(poolManager, createPoolSettings('tenant-capacity-forced-error-b'))

    const shutdown = poolManager.destroyAll()
    forcedDisposal.reject(retirementError)
    const results = await shutdown

    expect(results.filter((result) => result.status === 'rejected')).toEqual([
      { status: 'rejected', reason: retirementError },
    ])
    expect(logSpy).not.toHaveBeenCalled()
  })

  test('records pool cache evictions when capacity removes cached pools', async () => {
    const poolModule = await loadPoolModule(1)
    const metricsModule = await import('@internal/monitoring/metrics')
    const evictionSpy = vi.spyOn(metricsModule, 'recordCacheEviction')

    const { poolManager, created } = createTestPoolManager(poolModule)
    getReleasedPool(poolManager, createPoolSettings('tenant-cache-capacity-eviction-a'))
    getReleasedPool(poolManager, createPoolSettings('tenant-cache-capacity-eviction-b'))

    expect(evictionSpy).toHaveBeenCalledWith(TENANT_POOL_CACHE_NAME)
    expect(created[0].dispose).toHaveBeenCalledExactlyOnceWith('evict')
  })

  test('does not record pool cache evictions for explicit destroys', async () => {
    const poolModule = await loadPoolModule()
    const metricsModule = await import('@internal/monitoring/metrics')
    const evictionSpy = vi.spyOn(metricsModule, 'recordCacheEviction')

    const { poolManager, created } = createTestPoolManager(poolModule)
    getReleasedPool(poolManager, createPoolSettings('tenant-cache-explicit-destroy-a'))
    getReleasedPool(poolManager, createPoolSettings('tenant-cache-explicit-destroy-b'))

    await poolManager.destroy('tenant-cache-explicit-destroy-a')
    await poolManager.destroyAll()

    expect(evictionSpy.mock.calls.filter(([cache]) => cache === TENANT_POOL_CACHE_NAME)).toEqual([])
    expect(created[0].dispose).toHaveBeenCalledExactlyOnceWith('destroy')
    expect(created[1].dispose).toHaveBeenCalledExactlyOnceWith('destroy')
  })

  test('caches external pools across lookups and records miss then hit', async () => {
    const poolModule = await loadPoolModule()
    const metricsModule = await import('@internal/monitoring/metrics')
    const recordSpy = vi.spyOn(metricsModule, 'recordCacheRequest')

    const { poolManager, created } = createTestPoolManager(poolModule)
    const settings = {
      ...createPoolSettings('tenant-external-pool-cache'),
      isExternalPool: true,
    }

    const first = getReleasedPool(poolManager, settings)
    const second = getReleasedPool(poolManager, settings)

    expect(second).toBe(first)
    expect(created).toHaveLength(1)
    expect(recordSpy.mock.calls.filter(([cache]) => cache === TENANT_POOL_CACHE_NAME)).toEqual([
      [TENANT_POOL_CACHE_NAME, 'miss'],
      [TENANT_POOL_CACHE_NAME, 'hit'],
    ])
  })

  test('iterates cached pools for monitor snapshots', async () => {
    const poolModule = await loadPoolModule(undefined, {
      otelMetricsEnabled: true,
      prometheusMetricsEnabled: true,
    })
    const metricsModule = await import('@internal/monitoring/metrics')
    const batchObserver = captureBatchObserver(metricsModule)

    const { poolManager, created } = createTestPoolManager(poolModule, (settings) =>
      createTestPool(
        settings.tenantId === 'tenant-a' ? { used: 2, total: 5 } : { used: 3, total: 7 }
      )
    )
    const firstPool = getReleasedPool(poolManager, createPoolSettings('tenant-a'))
    getReleasedPool(poolManager, createPoolSettings('tenant-b'))

    poolManager.monitor()
    await vi.advanceTimersByTimeAsync(15_000)

    expect(batchObserver.spy.mock.calls[0]?.[1]).toEqual([
      metricsModule.dbActivePool,
      metricsModule.dbActiveConnection,
      metricsModule.dbInUseConnection,
      metricsModule.dbPoolsPendingRetirement,
      metricsModule.dbPoolOldestPendingRetirementAge,
    ])

    const observeSpy = vi.fn()
    batchObserver.observe(observeSpy)

    expect(observeSpy).toHaveBeenCalledWith(metricsModule.dbActivePool, 2)
    expect(observeSpy).toHaveBeenCalledWith(metricsModule.dbActiveConnection, 12)
    expect(observeSpy).toHaveBeenCalledWith(metricsModule.dbInUseConnection, 5)

    await vi.advanceTimersByTimeAsync(20_000)

    expect(getReleasedPool(poolManager, createPoolSettings('tenant-a'))).toBe(firstPool)
    expect(created[0].dispose).not.toHaveBeenCalled()
  })

  test('includes lease-deferred evictions in live connection snapshots', async () => {
    const poolModule = await loadPoolModule(1, {
      otelMetricsEnabled: true,
      prometheusMetricsEnabled: true,
    })
    const metricsModule = await import('@internal/monitoring/metrics')
    const batchObserver = captureBatchObserver(metricsModule)

    const { poolManager, created } = createTestPoolManager(poolModule, (_settings, pools) =>
      createTestPool(pools.length === 0 ? { used: 2, total: 5 } : { used: 3, total: 7 })
    )
    poolManager.getPool(createPoolSettings('tenant-deferred-stats-a'))
    getReleasedPool(poolManager, createPoolSettings('tenant-deferred-stats-b'))
    poolManager.monitor()

    await vi.advanceTimersByTimeAsync(15_000)

    const observeSpy = vi.fn()
    batchObserver.observe(observeSpy)
    expect(created[0].dispose).not.toHaveBeenCalled()
    expect(observeSpy).toHaveBeenCalledWith(metricsModule.dbActivePool, 2)
    expect(observeSpy).toHaveBeenCalledWith(metricsModule.dbActiveConnection, 12)
    expect(observeSpy).toHaveBeenCalledWith(metricsModule.dbInUseConnection, 5)
  })

  test('observes pending retirement count and oldest age from lifecycle state', async () => {
    const poolModule = await loadPoolModule(1, {
      otelMetricsEnabled: true,
      prometheusMetricsEnabled: true,
    })
    const metricsModule = await import('@internal/monitoring/metrics')
    const batchObserver = captureBatchObserver(metricsModule)

    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)

    const { poolManager, created } = createTestPoolManager(poolModule, () =>
      createTestPool({ used: 1, total: 2 })
    )

    metricsModule.setMetricsEnabled([
      { name: 'db_active_local_pools', enabled: false },
      { name: 'db_connections', enabled: false },
      { name: 'db_connections_in_use', enabled: false },
    ])
    const leaseA = poolManager.getPool(createPoolSettings('tenant-retirement-age-a'))
    const leaseB = poolManager.getPool(createPoolSettings('tenant-retirement-age-b'))
    poolManager.monitor()

    const observeSpy = vi.fn()
    batchObserver.observe(observeSpy)
    expect(observeSpy).toHaveBeenCalledWith(metricsModule.dbPoolsPendingRetirement, 1)

    now = 5_000
    poolManager.getPool(createPoolSettings('tenant-retirement-age-c'))
    now = 7_000

    observeSpy.mockClear()
    batchObserver.observe(observeSpy)

    expect(observeSpy).toHaveBeenCalledWith(metricsModule.dbPoolsPendingRetirement, 2)
    expect(observeSpy).toHaveBeenCalledWith(metricsModule.dbPoolOldestPendingRetirementAge, 7)
    expect(created.every((pool) => pool.getPoolStats.mock.calls.length === 0)).toBe(true)

    leaseA.release()
    await vi.advanceTimersByTimeAsync(0)
    observeSpy.mockClear()
    batchObserver.observe(observeSpy)

    expect(observeSpy).toHaveBeenCalledWith(metricsModule.dbPoolsPendingRetirement, 1)
    expect(observeSpy).toHaveBeenCalledWith(metricsModule.dbPoolOldestPendingRetirementAge, 2)

    leaseB.release()
    await vi.advanceTimersByTimeAsync(0)
    observeSpy.mockClear()
    batchObserver.observe(observeSpy)

    expect(observeSpy).toHaveBeenCalledWith(metricsModule.dbPoolsPendingRetirement, 0)
    expect(observeSpy).toHaveBeenCalledWith(metricsModule.dbPoolOldestPendingRetirementAge, 0)
  })

  test('collects stable pool stats while cache hits reorder the LRU', async () => {
    const poolModule = await loadPoolModule(undefined, {
      otelMetricsEnabled: true,
      prometheusMetricsEnabled: true,
    })
    const metricsModule = await import('@internal/monitoring/metrics')
    const batchObserver = captureBatchObserver(metricsModule)

    let reordered = false
    const { poolManager } = createTestPoolManager(poolModule, (settings) => {
      const pool = createTestPool({ used: 1, total: 1 })

      if (settings.tenantId === 'tenant-c') {
        pool.getPoolStats.mockImplementation(() => {
          if (!reordered) {
            reordered = true
            getReleasedPool(poolManager, createPoolSettings('tenant-c'))
          }
          return { used: 1, total: 1 }
        })
      }

      return pool
    })
    for (const tenantId of ['tenant-a', 'tenant-b', 'tenant-c', 'tenant-d']) {
      getReleasedPool(poolManager, createPoolSettings(tenantId))
    }

    poolManager.monitor()
    await vi.advanceTimersByTimeAsync(15_000)

    const observeSpy = vi.fn()
    batchObserver.observe(observeSpy)

    expect(observeSpy).toHaveBeenCalledWith(metricsModule.dbActivePool, 4)
    expect(observeSpy).toHaveBeenCalledWith(metricsModule.dbActiveConnection, 4)
    expect(observeSpy).toHaveBeenCalledWith(metricsModule.dbInUseConnection, 4)
  })

  test('collects pool stats only while an exporter and a pool gauge are enabled', async () => {
    const poolModule = await loadPoolModule(undefined, {
      otelMetricsEnabled: true,
      prometheusMetricsEnabled: true,
    })
    const metricsModule = await import('@internal/monitoring/metrics')

    const { poolManager, created } = createTestPoolManager(poolModule, () =>
      createTestPool({ used: 1, total: 2 })
    )
    getReleasedPool(poolManager, createPoolSettings('tenant-gated-pool-stats'))
    metricsModule.setMetricsEnabled([
      { name: 'db_active_local_pools', enabled: false },
      { name: 'db_connections', enabled: false },
      { name: 'db_connections_in_use', enabled: false },
    ])

    poolManager.monitor()
    await vi.advanceTimersByTimeAsync(15_000)

    expect(created[0].getPoolStats).not.toHaveBeenCalled()

    metricsModule.setMetricsEnabled([{ name: 'db_connections', enabled: true }])
    await vi.advanceTimersByTimeAsync(15_000)

    expect(created[0].getPoolStats).toHaveBeenCalledTimes(1)
  })

  test('observes tenant pool LRU entries without scanning pool strategies', async () => {
    let metricsModule: MetricsModule | undefined
    let batchObserver: ReturnType<typeof captureBatchObserver> | undefined
    const poolModule = await loadPoolModule(2, {}, (loadedMetrics) => {
      metricsModule = loadedMetrics
      batchObserver = captureBatchObserver(loadedMetrics, loadedMetrics.cacheEntries)
    })

    if (!metricsModule) {
      throw new Error('metrics module was not loaded')
    }

    const { poolManager, created } = createTestPoolManager(poolModule, () =>
      createTestPool({ used: 1, total: 2 })
    )
    getReleasedPool(poolManager, createPoolSettings('tenant-entries-a'))
    getReleasedPool(poolManager, createPoolSettings('tenant-entries-b'))
    getReleasedPool(poolManager, createPoolSettings('tenant-entries-c'))
    metricsModule.setMetricsEnabled([
      { name: 'cache_entries', enabled: true },
      { name: 'db_active_local_pools', enabled: false },
      { name: 'db_connections', enabled: false },
      { name: 'db_connections_in_use', enabled: false },
    ])

    const observeSpy = vi.fn()
    batchObserver?.observe(observeSpy)

    expect(observeSpy).toHaveBeenCalledWith(metricsModule.cacheEntries, 2, {
      cache: TENANT_POOL_CACHE_NAME,
    })
    expect(created.every((pool) => pool.getPoolStats.mock.calls.length === 0)).toBe(true)

    await poolManager.destroy('tenant-entries-b')
    observeSpy.mockClear()
    batchObserver?.observe(observeSpy)

    expect(observeSpy).toHaveBeenCalledWith(metricsModule.cacheEntries, 1, {
      cache: TENANT_POOL_CACHE_NAME,
    })
    expect(created.every((pool) => pool.getPoolStats.mock.calls.length === 0)).toBe(true)
  })

  test('does not collect pool stats without a metrics exporter', async () => {
    const poolModule = await loadPoolModule(undefined, {
      otelMetricsEnabled: false,
      // This flag alone does not create the Prometheus reader; it is nested
      // under the OTel provider gate in otel-metrics.ts.
      prometheusMetricsEnabled: true,
    })

    const { poolManager, created } = createTestPoolManager(poolModule, () =>
      createTestPool({ used: 1, total: 2 })
    )
    getReleasedPool(poolManager, createPoolSettings('tenant-pool-stats-without-exporter'))
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    poolManager.monitor()

    expect(setIntervalSpy).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(15_000)

    expect(created[0].getPoolStats).not.toHaveBeenCalled()
  })

  test('does not start pool stats without an attached metrics reader', async () => {
    const poolModule = await loadPoolModule(undefined, {
      otelMetricsEnabled: true,
      otlpMetricsEndpoint: undefined,
      prometheusMetricsEnabled: false,
    })

    const { poolManager } = createTestPoolManager(poolModule, () =>
      createTestPool({ used: 1, total: 2 })
    )
    getReleasedPool(poolManager, createPoolSettings('tenant-pool-stats-without-reader'))
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')

    poolManager.monitor()

    expect(setIntervalSpy).not.toHaveBeenCalled()
  })

  test('starts pool stats for an attached OTLP metrics reader', async () => {
    const poolModule = await loadPoolModule(undefined, {
      otelMetricsEnabled: true,
      otlpMetricsEndpoint: 'http://otel-collector:4317',
      prometheusMetricsEnabled: false,
    })

    const { poolManager } = createTestPoolManager(poolModule, () =>
      createTestPool({ used: 1, total: 2 })
    )
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')

    poolManager.monitor()

    expect(setIntervalSpy).toHaveBeenCalledTimes(1)
  })

  test('starts pool monitoring once and unregisters it during teardown', async () => {
    const poolModule = await loadPoolModule(undefined, {
      otelMetricsEnabled: true,
      prometheusMetricsEnabled: true,
    })
    const metricsModule = await import('@internal/monitoring/metrics')
    const addBatchObservableCallbackSpy = vi.spyOn(
      metricsModule.meter,
      'addBatchObservableCallback'
    )
    const removeBatchObservableCallbackSpy = vi.spyOn(
      metricsModule.meter,
      'removeBatchObservableCallback'
    )
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

    const { poolManager } = createTestPoolManager(poolModule)
    poolManager.monitor()
    poolManager.monitor()

    expect(setIntervalSpy).toHaveBeenCalledTimes(1)
    expect(addBatchObservableCallbackSpy).toHaveBeenCalledTimes(1)
    const [callback, observables] = addBatchObservableCallbackSpy.mock.calls[0]

    await poolManager.destroyAll()

    expect(clearIntervalSpy).toHaveBeenCalledTimes(1)
    expect(removeBatchObservableCallbackSpy).toHaveBeenCalledWith(callback, observables)

    poolManager.monitor()
    expect(setIntervalSpy).toHaveBeenCalledTimes(2)
    expect(addBatchObservableCallbackSpy).toHaveBeenCalledTimes(2)
  })

  test('iterates cached pools for rebalanceAll and destroyAll', async () => {
    const poolModule = await loadPoolModule()

    const { poolManager, created } = createTestPoolManager(poolModule)
    const first = getReleasedPool(poolManager, createPoolSettings('tenant-c'))
    getReleasedPool(poolManager, createPoolSettings('tenant-d'))

    poolManager.rebalanceAll({ clusterSize: 4 })

    expect(created[0].rebalance).toHaveBeenCalledWith({ clusterSize: 4 })
    expect(created[1].rebalance).toHaveBeenCalledWith({ clusterSize: 4 })

    await poolManager.destroyAll()

    expect(created[0].dispose).toHaveBeenCalledExactlyOnceWith('destroy')
    expect(created[1].dispose).toHaveBeenCalledExactlyOnceWith('destroy')

    const recreated = getReleasedPool(poolManager, createPoolSettings('tenant-c'))

    expect(recreated).not.toBe(first)
  })

  test('passes all tenant rebalance options to the cached pool', async () => {
    const poolModule = await loadPoolModule()

    const { poolManager, created } = createTestPoolManager(poolModule)
    getReleasedPool(poolManager, createPoolSettings('tenant-rebalance-options'))

    poolManager.rebalance('tenant-rebalance-options', {
      clusterSize: 3,
      maxConnections: 14,
    })

    expect(created[0].rebalance).toHaveBeenCalledWith({
      clusterSize: 3,
      maxConnections: 14,
    })
  })

  test('propagates explicit destroy failures without double-destroying pools', async () => {
    const poolModule = await loadPoolModule()

    const { poolManager, created } = createTestPoolManager(poolModule, (settings) => {
      const pool = createTestPool()
      pool.dispose.mockRejectedValue(new Error(`destroy failed for ${settings.tenantId}`))
      return pool
    })
    const tenantId = 'tenant-destroy-error'

    getReleasedPool(poolManager, createPoolSettings(tenantId))

    await expect(poolManager.destroy(tenantId)).rejects.toThrow(`destroy failed for ${tenantId}`)
    expect(created[0].dispose).toHaveBeenCalledTimes(1)
  })

  test('preserves rejected destroyAll settlements when pool teardown fails', async () => {
    const poolModule = await loadPoolModule()

    const { poolManager, created } = createTestPoolManager(poolModule, (settings) => {
      const pool = createTestPool()

      if (settings.tenantId === 'tenant-destroyall-error') {
        pool.dispose.mockRejectedValue(new Error('destroyAll failed'))
      }

      return pool
    })
    getReleasedPool(poolManager, createPoolSettings('tenant-destroyall-ok'))
    getReleasedPool(poolManager, createPoolSettings('tenant-destroyall-error'))

    const results = await poolManager.destroyAll()
    const rejected = results.find((result) => result.status === 'rejected')

    expect(results).toHaveLength(2)
    expect(rejected).toBeDefined()
    expect(rejected).toMatchObject({
      status: 'rejected',
      reason: expect.objectContaining({ message: 'destroyAll failed' }),
    })
    expect(created[0].dispose).toHaveBeenCalledTimes(1)
    expect(created[1].dispose).toHaveBeenCalledTimes(1)
  })
})
