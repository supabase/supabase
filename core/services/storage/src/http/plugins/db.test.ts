import Fastify, { type FastifyRequest } from 'fastify'
import { vi } from 'vitest'
import { MultitenantMigrationStrategy } from '../../config'

async function loadDbPlugins({
  databaseEnableQueryCancellation = false,
  dbMigration = {},
  dbMigrationStrategy = MultitenantMigrationStrategy.PROGRESSIVE,
  isMultitenant = false,
}: {
  databaseEnableQueryCancellation?: boolean
  dbMigration?: Record<string, number>
  dbMigrationStrategy?: MultitenantMigrationStrategy
  isMultitenant?: boolean
} = {}) {
  vi.resetModules()

  const requestDb = {
    dispose: vi.fn(),
    setAbortSignal: vi.fn(),
  }
  const getPostgresConnection = vi.fn().mockResolvedValue(requestDb)
  const getServiceKeyUser = vi.fn().mockResolvedValue({
    jwt: 'service-jwt',
    payload: {
      role: 'service_role',
    },
  })
  const getTenantConfig = vi.fn()
  const areMigrationsUpToDate = vi.fn()
  const lastLocalMigrationName = vi.fn().mockResolvedValue('initialmigration')
  const runMigrationsOnTenant = vi.fn()
  const updateTenantMigrationsState = vi.fn()
  const progressiveMigrations = {
    addTenant: vi.fn(),
  }

  vi.doMock('@internal/database', () => {
    return {
      getPostgresConnection,
      getServiceKeyUser,
      getTenantConfig,
      PgTenantConnection: class {},
      TenantMigrationStatus: {
        COMPLETED: 'COMPLETED',
      },
    }
  })

  vi.doMock('@internal/database/migrations', () => {
    return {
      areMigrationsUpToDate,
      DBMigration: dbMigration,
      lastLocalMigrationName,
      progressiveMigrations,
      runMigrationsOnTenant,
      updateTenantMigrationsState,
    }
  })

  const configModule = await import('../../config')
  configModule.getConfig({ reload: true })
  configModule.mergeConfig({
    databaseEnableQueryCancellation,
    dbMigrationStrategy,
    isMultitenant,
  })

  const { db, dbSuperUser } = await import('./db')

  return {
    db,
    dbSuperUser,
    areMigrationsUpToDate,
    getPostgresConnection,
    getTenantConfig,
    lastLocalMigrationName,
    progressiveMigrations,
    requestDb,
    runMigrationsOnTenant,
    updateTenantMigrationsState,
  }
}

describe('dbSuperUser plugin', () => {
  afterEach(() => {
    vi.doUnmock('@internal/database')
    vi.doUnmock('@internal/database/migrations')
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('does not forward route-level maxConnections into shared tenant pool settings', async () => {
    const { dbSuperUser, getPostgresConnection } = await loadDbPlugins()
    const app = Fastify()

    app.decorateRequest('tenantId')
    app.addHook('onRequest', async (request) => {
      request.tenantId = 'tenant-id'
    })
    const legacyOptions = { disableHostCheck: true, maxConnections: 5 } as unknown as {
      disableHostCheck: boolean
    }
    await app.register(dbSuperUser, legacyOptions)
    app.get('/test', async () => ({ ok: true }))

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/test',
        headers: {
          'x-forwarded-host': 'tenant.local.test',
        },
      })

      expect(response.statusCode).toBe(200)
      expect(getPostgresConnection).toHaveBeenCalledTimes(1)
      expect(getPostgresConnection.mock.calls[0][0]).not.toHaveProperty('maxConnections')
    } finally {
      await app.close()
    }
  })
})

describe('migrations plugin', () => {
  async function buildMigrationApp(
    plugins: Awaited<ReturnType<typeof loadDbPlugins>>,
    getTenantId: (request: FastifyRequest) => string = () => 'tenant-id'
  ) {
    const app = Fastify()

    app.decorateRequest('tenantId')
    app.addHook('onRequest', async (request) => {
      request.tenantId = getTenantId(request)
    })
    await app.register(plugins.dbSuperUser)
    app.get('/test', async (request) => ({ latestMigration: request.latestMigration }))

    const injectTenant = (headers: Record<string, string> = {}) =>
      app.inject({ method: 'GET', url: '/test', headers })

    return { app, injectTenant }
  }

  function waitForImmediate() {
    return new Promise((resolve) => setImmediate(resolve))
  }

  afterEach(() => {
    vi.doUnmock('@internal/database')
    vi.doUnmock('@internal/database/migrations')
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('refreshes the migration version for the request that completes migrations', async () => {
    const plugins = await loadDbPlugins({
      dbMigrationStrategy: MultitenantMigrationStrategy.ON_REQUEST,
      isMultitenant: true,
    })
    const tenant = {
      databaseUrl: 'postgres://tenant-db',
      migrationVersion: 'initialmigration',
      syncMigrationsDone: false,
    }

    plugins.getTenantConfig.mockResolvedValue(tenant)
    plugins.areMigrationsUpToDate.mockResolvedValue(false)
    plugins.lastLocalMigrationName.mockResolvedValue('search-v2')
    plugins.runMigrationsOnTenant.mockResolvedValue(undefined)
    plugins.updateTenantMigrationsState.mockResolvedValue(undefined)

    const { app, injectTenant } = await buildMigrationApp(plugins)

    try {
      const response = await injectTenant()

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ latestMigration: 'search-v2' })
    } finally {
      await app.close()
    }
  })

  it('keeps an applied migration version ahead of the local freeze target', async () => {
    const plugins = await loadDbPlugins({
      dbMigration: {
        initialmigration: 1,
        'search-v2': 27,
        'search-v2-optimised': 50,
      },
      dbMigrationStrategy: MultitenantMigrationStrategy.ON_REQUEST,
      isMultitenant: true,
    })

    plugins.getTenantConfig.mockResolvedValue({
      databaseUrl: 'postgres://tenant-db',
      migrationVersion: 'search-v2-optimised',
      syncMigrationsDone: true,
    })
    plugins.lastLocalMigrationName.mockResolvedValue('search-v2')

    const { app, injectTenant } = await buildMigrationApp(plugins)

    try {
      const response = await injectTenant()

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ latestMigration: 'search-v2-optimised' })
    } finally {
      await app.close()
    }
  })

  it('persists an applied migration version ahead of the freeze after retrying migrations', async () => {
    const plugins = await loadDbPlugins({
      dbMigration: {
        initialmigration: 1,
        'search-v2': 27,
        'search-v2-optimised': 50,
      },
      dbMigrationStrategy: MultitenantMigrationStrategy.ON_REQUEST,
      isMultitenant: true,
    })
    const tenant = {
      databaseUrl: 'postgres://tenant-db',
      migrationVersion: 'search-v2-optimised',
      migrationStatus: 'FAILED',
      syncMigrationsDone: false,
    }

    plugins.getTenantConfig.mockResolvedValue(tenant)
    plugins.areMigrationsUpToDate.mockResolvedValue(false)
    plugins.lastLocalMigrationName.mockResolvedValue('search-v2')
    plugins.runMigrationsOnTenant.mockResolvedValue(undefined)
    plugins.updateTenantMigrationsState.mockResolvedValue(undefined)

    const { app, injectTenant } = await buildMigrationApp(plugins)

    try {
      const response = await injectTenant()

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ latestMigration: 'search-v2-optimised' })
      expect(plugins.updateTenantMigrationsState).toHaveBeenCalledWith('tenant-id', {
        migration: 'search-v2-optimised',
        state: 'COMPLETED',
      })
    } finally {
      await app.close()
    }
  })

  it('shares migration state refreshed during the flight with every waiting request', async () => {
    const plugins = await loadDbPlugins({
      dbMigration: {
        initialmigration: 1,
        'search-v2': 27,
        'search-v2-optimised': 50,
      },
      dbMigrationStrategy: MultitenantMigrationStrategy.ON_REQUEST,
      isMultitenant: true,
    })
    const initialTenant = {
      databaseUrl: 'postgres://tenant-db',
      migrationVersion: 'initialmigration',
      syncMigrationsDone: false,
    }
    const refreshedTenant = {
      ...initialTenant,
      migrationVersion: 'search-v2-optimised',
    }
    const migration = Promise.withResolvers<void>()
    let migrationFinished = false

    plugins.getTenantConfig.mockImplementation(async () =>
      migrationFinished ? refreshedTenant : initialTenant
    )
    plugins.areMigrationsUpToDate.mockResolvedValue(false)
    plugins.lastLocalMigrationName.mockResolvedValue('search-v2')
    plugins.runMigrationsOnTenant.mockImplementation(async () => {
      await migration.promise
      migrationFinished = true
    })
    plugins.updateTenantMigrationsState.mockResolvedValue(undefined)

    const { app, injectTenant } = await buildMigrationApp(plugins)

    try {
      const first = injectTenant()
      const second = injectTenant()

      await waitForImmediate()
      migration.resolve()

      const responses = await Promise.all([first, second])

      expect(responses.map((response) => response.json())).toEqual([
        { latestMigration: 'search-v2-optimised' },
        { latestMigration: 'search-v2-optimised' },
      ])
      expect(plugins.updateTenantMigrationsState).toHaveBeenCalledWith('tenant-id', {
        migration: 'search-v2-optimised',
        state: 'COMPLETED',
      })
    } finally {
      await app.close()
    }
  })

  it('shares the same on-request migration check across concurrent same-tenant requests', async () => {
    const plugins = await loadDbPlugins({
      dbMigrationStrategy: MultitenantMigrationStrategy.ON_REQUEST,
      isMultitenant: true,
    })
    const tenant = {
      databaseUrl: 'postgres://tenant-db',
      migrationVersion: 'initialmigration',
      syncMigrationsDone: false,
    }
    const migration = Promise.withResolvers<void>()

    plugins.getTenantConfig.mockResolvedValue(tenant)
    plugins.areMigrationsUpToDate.mockResolvedValue(false)
    plugins.runMigrationsOnTenant.mockReturnValue(migration.promise)
    plugins.updateTenantMigrationsState.mockResolvedValue(undefined)

    const { app, injectTenant } = await buildMigrationApp(plugins)

    try {
      const first = injectTenant()
      const second = injectTenant()

      await waitForImmediate()

      expect(plugins.areMigrationsUpToDate).toHaveBeenCalledTimes(1)
      expect(plugins.runMigrationsOnTenant).toHaveBeenCalledTimes(1)

      migration.resolve()

      const responses = await Promise.all([first, second])
      expect(responses).toEqual([
        expect.objectContaining({ statusCode: 200 }),
        expect.objectContaining({ statusCode: 200 }),
      ])
      expect(tenant.syncMigrationsDone).toBe(true)

      const third = await injectTenant()

      expect(third.statusCode).toBe(200)
      expect(plugins.areMigrationsUpToDate).toHaveBeenCalledTimes(1)
      expect(plugins.runMigrationsOnTenant).toHaveBeenCalledTimes(1)
    } finally {
      await app.close()
    }
  })

  it('shares the on-request migration check across route scopes', async () => {
    const plugins = await loadDbPlugins({
      dbMigrationStrategy: MultitenantMigrationStrategy.ON_REQUEST,
      isMultitenant: true,
    })
    const tenant = {
      databaseUrl: 'postgres://tenant-db',
      migrationVersion: 'initialmigration',
      syncMigrationsDone: false,
    }
    const migration = Promise.withResolvers<void>()

    plugins.getTenantConfig.mockResolvedValue(tenant)
    plugins.areMigrationsUpToDate.mockResolvedValue(false)
    plugins.runMigrationsOnTenant.mockReturnValue(migration.promise)
    plugins.updateTenantMigrationsState.mockResolvedValue(undefined)

    // Two separate Fastify apps stand in for two route scopes, each registering
    // its own copy of the migrations plugin against the same module state.
    const firstScope = await buildMigrationApp(plugins)
    const secondScope = await buildMigrationApp(plugins)

    try {
      const first = firstScope.injectTenant()
      const second = secondScope.injectTenant()

      await waitForImmediate()

      expect(plugins.runMigrationsOnTenant).toHaveBeenCalledTimes(1)

      migration.resolve()

      await expect(Promise.all([first, second])).resolves.toEqual([
        expect.objectContaining({ statusCode: 200 }),
        expect.objectContaining({ statusCode: 200 }),
      ])
    } finally {
      await firstScope.app.close()
      await secondScope.app.close()
    }
  })

  it('shares migration failures across concurrent same-tenant requests and retries later', async () => {
    const plugins = await loadDbPlugins({
      dbMigrationStrategy: MultitenantMigrationStrategy.ON_REQUEST,
      isMultitenant: true,
    })
    const tenant = {
      databaseUrl: 'postgres://tenant-db',
      migrationVersion: 'initialmigration',
      syncMigrationsDone: false,
    }
    const migration = Promise.withResolvers<void>()

    plugins.getTenantConfig.mockResolvedValue(tenant)
    plugins.areMigrationsUpToDate.mockResolvedValue(false)
    plugins.runMigrationsOnTenant
      .mockReturnValueOnce(migration.promise)
      .mockResolvedValueOnce(undefined)
    plugins.updateTenantMigrationsState.mockResolvedValue(undefined)

    const { app, injectTenant } = await buildMigrationApp(plugins)

    try {
      const first = injectTenant()
      const second = injectTenant()

      await waitForImmediate()

      expect(plugins.runMigrationsOnTenant).toHaveBeenCalledTimes(1)

      migration.reject(new Error('migration failed'))

      const failedResponses = await Promise.all([first, second])
      expect(failedResponses).toEqual([
        expect.objectContaining({ statusCode: 500 }),
        expect.objectContaining({ statusCode: 500 }),
      ])
      expect(tenant.syncMigrationsDone).toBe(false)

      const retry = await injectTenant()

      expect(retry.statusCode).toBe(200)
      expect(plugins.areMigrationsUpToDate).toHaveBeenCalledTimes(2)
      expect(plugins.runMigrationsOnTenant).toHaveBeenCalledTimes(2)
      expect(tenant.syncMigrationsDone).toBe(true)
    } finally {
      await app.close()
    }
  })

  it('skips on-request migration checks when the tenant is already marked migrated', async () => {
    const plugins = await loadDbPlugins({
      dbMigrationStrategy: MultitenantMigrationStrategy.ON_REQUEST,
      isMultitenant: true,
    })

    plugins.getTenantConfig.mockResolvedValue({
      databaseUrl: 'postgres://tenant-db',
      migrationVersion: 'initialmigration',
      syncMigrationsDone: true,
    })
    plugins.lastLocalMigrationName.mockResolvedValue('search-v2')

    const { app, injectTenant } = await buildMigrationApp(plugins)

    try {
      const response = await injectTenant()

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ latestMigration: 'search-v2' })
      expect(plugins.areMigrationsUpToDate).not.toHaveBeenCalled()
      expect(plugins.runMigrationsOnTenant).not.toHaveBeenCalled()
    } finally {
      await app.close()
    }
  })

  it('skips migration execution when tenant migrations are already up to date', async () => {
    const plugins = await loadDbPlugins({
      dbMigrationStrategy: MultitenantMigrationStrategy.ON_REQUEST,
      isMultitenant: true,
    })

    plugins.getTenantConfig.mockResolvedValue({
      databaseUrl: 'postgres://tenant-db',
      migrationVersion: 'initialmigration',
      syncMigrationsDone: false,
    })
    plugins.areMigrationsUpToDate.mockResolvedValue(true)

    const { app, injectTenant } = await buildMigrationApp(plugins)

    try {
      const response = await injectTenant()

      expect(response.statusCode).toBe(200)
      expect(plugins.areMigrationsUpToDate).toHaveBeenCalledTimes(1)
      expect(plugins.runMigrationsOnTenant).not.toHaveBeenCalled()

      const secondResponse = await injectTenant()

      expect(secondResponse.statusCode).toBe(200)
      expect(plugins.areMigrationsUpToDate).toHaveBeenCalledTimes(1)
      expect(plugins.runMigrationsOnTenant).not.toHaveBeenCalled()
    } finally {
      await app.close()
    }
  })

  it('does not coalesce on-request migrations for different tenants', async () => {
    const plugins = await loadDbPlugins({
      dbMigrationStrategy: MultitenantMigrationStrategy.ON_REQUEST,
      isMultitenant: true,
    })
    const migrations = {
      'tenant-a': Promise.withResolvers<void>(),
      'tenant-b': Promise.withResolvers<void>(),
    }

    plugins.getTenantConfig.mockImplementation(async (tenantId: string) => ({
      databaseUrl: `postgres://${tenantId}`,
      migrationVersion: 'initialmigration',
      syncMigrationsDone: false,
    }))
    plugins.areMigrationsUpToDate.mockResolvedValue(false)
    plugins.runMigrationsOnTenant.mockImplementation(
      ({ tenantId }: { tenantId: keyof typeof migrations }) => migrations[tenantId].promise
    )
    plugins.updateTenantMigrationsState.mockResolvedValue(undefined)

    const { app, injectTenant } = await buildMigrationApp(
      plugins,
      (request) => request.headers['x-tenant-id'] as string
    )

    try {
      const first = injectTenant({ 'x-tenant-id': 'tenant-a' })
      const second = injectTenant({ 'x-tenant-id': 'tenant-b' })

      await waitForImmediate()

      expect(plugins.runMigrationsOnTenant).toHaveBeenCalledTimes(2)
      expect(plugins.runMigrationsOnTenant).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-a' })
      )
      expect(plugins.runMigrationsOnTenant).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-b' })
      )

      migrations['tenant-a'].resolve()
      migrations['tenant-b'].resolve()

      await expect(Promise.all([first, second])).resolves.toEqual([
        expect.objectContaining({ statusCode: 200 }),
        expect.objectContaining({ statusCode: 200 }),
      ])
    } finally {
      await app.close()
    }
  })
})

describe.each([
  {
    name: 'db plugin',
    register: async (
      app: ReturnType<typeof Fastify>,
      plugins: Awaited<ReturnType<typeof loadDbPlugins>>
    ) => {
      app.addHook('onRequest', async (request: FastifyRequest) => {
        request.jwt = 'user-jwt'
        request.jwtPayload = {
          role: 'authenticated',
        }
      })
      await app.register(plugins.db)
    },
  },
  {
    name: 'dbSuperUser plugin',
    register: async (
      app: ReturnType<typeof Fastify>,
      plugins: Awaited<ReturnType<typeof loadDbPlugins>>
    ) => {
      await app.register(plugins.dbSuperUser)
    },
  },
])('$name query cancellation signal wiring', ({ register }) => {
  afterEach(() => {
    vi.doUnmock('@internal/database')
    vi.doUnmock('@internal/database/migrations')
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('does not materialize the disconnect signal when query cancellation is disabled', async () => {
    const plugins = await loadDbPlugins({ databaseEnableQueryCancellation: false })
    const app = Fastify()

    app.decorateRequest('tenantId')
    app.decorateRequest('signals')
    app.addHook('onRequest', async (request) => {
      request.tenantId = 'tenant-id'
      request.signals = {
        get disconnect(): AbortController {
          throw new Error('disconnect signal should stay lazy')
        },
      } as typeof request.signals
    })
    await register(app, plugins)
    app.get('/test', async () => ({ ok: true }))

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/test',
        headers: {
          'x-forwarded-host': 'tenant.local.test',
        },
      })

      expect(response.statusCode).toBe(200)
      expect(plugins.requestDb.setAbortSignal).not.toHaveBeenCalled()
    } finally {
      await app.close()
    }
  })

  it('materializes the disconnect signal when query cancellation is enabled', async () => {
    const plugins = await loadDbPlugins({ databaseEnableQueryCancellation: true })
    const app = Fastify()
    const disconnectController = new AbortController()
    const disconnectGetter = vi.fn(() => disconnectController)

    app.decorateRequest('tenantId')
    app.decorateRequest('signals')
    app.addHook('onRequest', async (request) => {
      request.tenantId = 'tenant-id'
      request.signals = Object.defineProperty({}, 'disconnect', {
        get: disconnectGetter,
      }) as typeof request.signals
    })
    await register(app, plugins)
    app.get('/test', async () => ({ ok: true }))

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/test',
        headers: {
          'x-forwarded-host': 'tenant.local.test',
        },
      })

      expect(response.statusCode).toBe(200)
      expect(disconnectGetter).toHaveBeenCalledTimes(1)
      expect(plugins.requestDb.setAbortSignal).toHaveBeenCalledWith(disconnectController.signal)
    } finally {
      await app.close()
    }
  })

  it('does not require request signals when query cancellation is enabled', async () => {
    const plugins = await loadDbPlugins({ databaseEnableQueryCancellation: true })
    const app = Fastify()

    app.decorateRequest('tenantId')
    app.addHook('onRequest', async (request) => {
      request.tenantId = 'tenant-id'
    })
    await register(app, plugins)
    app.get('/test', async () => ({ ok: true }))

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/test',
        headers: {
          'x-forwarded-host': 'tenant.local.test',
        },
      })

      expect(response.statusCode).toBe(200)
      expect(plugins.requestDb.setAbortSignal).not.toHaveBeenCalled()
    } finally {
      await app.close()
    }
  })
})
