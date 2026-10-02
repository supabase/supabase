import { spyOnAbortSignalAny, spyOnAbortSignalTimeout } from '../../test/utils/abort-signal'
import type { DatabaseExecutor, DatabaseStatement } from './connection'
import { TenantConfigStorePg } from './tenant-store-pg'

function createTenantStore() {
  const query = vi.fn().mockResolvedValue({
    rows: [],
    rowCount: 1,
  })
  const store = new TenantConfigStorePg({ query } as unknown as DatabaseExecutor)

  return { query, store }
}

function getLastStatement(query: ReturnType<typeof vi.fn>): DatabaseStatement {
  const [statement] = query.mock.calls.at(-1) || []

  if (!statement || typeof statement === 'string') {
    throw new Error('Expected a DatabaseStatement query')
  }

  return statement
}

describe('TenantConfigStorePg', () => {
  it('quotes insert column identifiers', async () => {
    const { query, store } = createTenantStore()

    await store.insert({
      id: 'tenant-id',
      database_url: 'postgres://tenant',
      jwks: { keys: [] },
    })

    const statement = getLastStatement(query)
    expect(statement.text).toContain('INSERT INTO tenants ("id", "database_url", "jwks")')
    expect(statement.text).toContain('VALUES ($1, $2, $3)')
    expect(statement.values).toEqual(['tenant-id', 'postgres://tenant', { keys: [] }])
  })

  it('quotes upsert insert and update column identifiers', async () => {
    const { query, store } = createTenantStore()

    await store.upsert({
      id: 'tenant-id',
      database_url: 'postgres://tenant',
      max_connections: 10,
    })

    const statement = getLastStatement(query)
    expect(statement.text).toContain(
      'INSERT INTO tenants ("id", "database_url", "max_connections")'
    )
    expect(statement.text).toContain(
      'ON CONFLICT ("id") DO UPDATE SET "database_url" = EXCLUDED."database_url", "max_connections" = EXCLUDED."max_connections"'
    )
    expect(statement.values).toEqual(['tenant-id', 'postgres://tenant', 10])
  })

  it('quotes update column identifiers', async () => {
    const { query, store } = createTenantStore()

    await store.update('tenant-id', {
      id: 'ignored',
      database_url: 'postgres://tenant',
      max_connections: 10,
    })

    const statement = getLastStatement(query)
    expect(statement.text).toContain('SET "database_url" = $1, "max_connections" = $2')
    expect(statement.text).toContain('WHERE id = $3')
    expect(statement.values).toEqual(['postgres://tenant', 10, 'tenant-id'])
  })

  it('adds the default internal timeout to normal tenant queries', async () => {
    const { query, store } = createTenantStore()
    const { timeoutSignal, timeoutSpy } = spyOnAbortSignalTimeout()

    await store.findById('tenant-id')

    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Number))
    expect(query).toHaveBeenCalledWith(expect.anything(), { signal: timeoutSignal })
  })

  it('combines the caller signal with a migration listing timeout', async () => {
    const { query, store } = createTenantStore()
    const signal = new AbortController().signal
    const { timeoutSignal, timeoutSpy } = spyOnAbortSignalTimeout()
    const { anySignal, anySpy } = spyOnAbortSignalAny()

    await store.listTenantsToMigrateBatch('storage-schema', 0, ['FAILED'], 200, signal)

    expect(timeoutSpy).toHaveBeenCalledWith(60_000)
    expect(anySpy).toHaveBeenCalledWith([signal, timeoutSignal])
    expect(query).toHaveBeenCalledWith(expect.anything(), { signal: anySignal })
  })

  it('adds a timeout for reset migration listing without a caller signal', async () => {
    const { query, store } = createTenantStore()
    const { timeoutSignal, timeoutSpy } = spyOnAbortSignalTimeout()

    await store.listTenantsToResetMigrationsBatch(['storage-schema'], 0, 200)

    expect(timeoutSpy).toHaveBeenCalledWith(60_000)
    expect(query).toHaveBeenCalledWith(expect.anything(), { signal: timeoutSignal })
  })

  it('allows internal timeout to be disabled with timeoutMs zero', async () => {
    const { query, store } = createTenantStore()
    const signal = new AbortController().signal
    const { timeoutSpy } = spyOnAbortSignalTimeout()

    await (
      store as unknown as {
        query(
          statement: DatabaseStatement,
          options: { signal: AbortSignal; timeoutMs: number }
        ): Promise<unknown>
      }
    ).query({ text: 'SELECT 1' }, { signal, timeoutMs: 0 })

    expect(timeoutSpy).not.toHaveBeenCalled()
    expect(query).toHaveBeenCalledWith(expect.anything(), { signal })
  })

  it('does not shorten migration listing timeout below the configured tenant query timeout', async () => {
    vi.resetModules()
    const configModule = await import('../../config')
    configModule.getConfig({ reload: true })
    configModule.mergeConfig({ multitenantDatabaseQueryTimeout: 120_000 })
    const { TenantConfigStorePg: ConfiguredTenantConfigStorePg } = await import('./tenant-store-pg')
    const query = vi.fn().mockResolvedValue({
      rows: [],
      rowCount: 1,
    })
    const store = new ConfiguredTenantConfigStorePg({
      query,
    } as unknown as DatabaseExecutor)
    const { timeoutSignal, timeoutSpy } = spyOnAbortSignalTimeout()

    try {
      await store.listTenantsToResetMigrationsBatch(['storage-schema'], 0, 200)

      expect(timeoutSpy).toHaveBeenCalledWith(120_000)
      expect(query).toHaveBeenCalledWith(expect.anything(), { signal: timeoutSignal })
    } finally {
      vi.resetModules()
      const resetConfigModule = await import('../../config')
      resetConfigModule.getConfig({ reload: true })
    }
  })
})
