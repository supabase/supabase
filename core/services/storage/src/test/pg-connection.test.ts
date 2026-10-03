import {
  getPgPostgresConnection,
  getServiceKeyUser,
  PgPoolStrategy,
  PgTenantConnection,
} from '@internal/database'
import { searchPath, type TenantConnectionOptions } from '@internal/database/pool'
import { getConfig } from '../config'

const { databaseURL, databasePoolURL, tenantId } = getConfig()

describe('Pg database foundation', () => {
  function createConnectionSettings(
    superUser: Awaited<ReturnType<typeof getServiceKeyUser>>,
    overrides?: Partial<TenantConnectionOptions>
  ): TenantConnectionOptions {
    return {
      tenantId,
      isExternalPool: true,
      maxConnections: 2,
      dbUrl: databasePoolURL || databaseURL,
      user: superUser,
      superUser,
      headers: { 'x-test-header': 'pg-foundation' },
      method: 'GET',
      path: '/pg-foundation',
      operation: () => 'pg-foundation-test',
      ...overrides,
    }
  }

  async function createConnection() {
    const superUser = await getServiceKeyUser(tenantId)
    const settings = createConnectionSettings(superUser)

    const pool = new PgPoolStrategy(settings)
    const connection = new PgTenantConnection({ value: pool, release: () => {} }, settings)

    return { connection, pool, superUser }
  }

  afterEach(async () => {
    await PgTenantConnection.stop()
  })

  it('reports pool stats from the pg pool', async () => {
    const { pool } = await createConnection()

    try {
      expect(pool.getPoolStats()).toBeNull()

      await pool.acquire().query('SELECT 1')

      expect(pool.getPoolStats()).toEqual(
        expect.objectContaining({
          total: expect.any(Number),
          used: expect.any(Number),
        })
      )
    } finally {
      await pool.dispose('destroy')
    }
  })

  it('returns checked-out clients to the pool after regular SQL query errors', async () => {
    const { pool } = await createConnection()

    try {
      await expect(
        pool.acquire().query('SELECT * FROM pg_connection_missing_table_for_release_test')
      ).rejects.toMatchObject({ code: '42P01' })

      expect(pool.getPoolStats()).toEqual(
        expect.objectContaining({
          total: 1,
          used: 0,
        })
      )

      const result = await pool.acquire().query<{ n: number }>('SELECT 1 AS n')
      expect(result.rows[0].n).toBe(1)
    } finally {
      await pool.dispose('destroy')
    }
  })

  it('stores and returns the request abort signal', async () => {
    const { connection, pool } = await createConnection()

    try {
      expect(connection.getAbortSignal()).toBeUndefined()

      const controller = new AbortController()
      connection.setAbortSignal(controller.signal)

      expect(connection.getAbortSignal()).toBe(controller.signal)
    } finally {
      await pool.dispose('destroy')
    }
  })

  it('sets transaction-local search path, request scope, and statement timeout', async () => {
    const { connection, pool, superUser } = await createConnection()
    const transaction = await connection.transaction({ timeout: 1234 })

    try {
      await connection.setScope(transaction)

      const result = await transaction.query<{
        role: string
        jwt_role: string
        request_path: string
        storage_operation: string
        allow_delete: string
        search_path: string
        statement_timeout: string
      }>({
        text: `
          SELECT
            current_setting('role', true) as role,
            current_setting('request.jwt.claim.role', true) as jwt_role,
            current_setting('request.path', true) as request_path,
            current_setting('storage.operation', true) as storage_operation,
            current_setting('storage.allow_delete_query', true) as allow_delete,
            current_setting('search_path') as search_path,
            current_setting('statement_timeout') as statement_timeout
        `,
      })

      expect(result.rows[0]).toEqual(
        expect.objectContaining({
          role: superUser.payload.role,
          jwt_role: superUser.payload.role,
          request_path: '/pg-foundation',
          storage_operation: 'pg-foundation-test',
          allow_delete: 'true',
          search_path: searchPath.join(','),
          statement_timeout: '1234ms',
        })
      )

      await transaction.commit()
    } catch (e) {
      await transaction.rollback()
      throw e
    } finally {
      await pool.dispose('destroy')
    }
  })

  it('aborts an in-flight query with AbortError shape', async () => {
    const { pool } = await createConnection()
    const controller = new AbortController()

    try {
      const query = pool.acquire().query('SELECT pg_sleep(10)', {
        signal: controller.signal,
      })

      const abortTimeout = setTimeout(() => controller.abort(), 50)

      try {
        await expect(query).rejects.toMatchObject({
          name: 'AbortError',
          code: 'ABORT_ERR',
          message: 'Query was aborted',
        })
      } finally {
        clearTimeout(abortTimeout)
      }
    } finally {
      await pool.dispose('destroy')
    }
  })

  it('rejects before execution when the signal is already aborted', async () => {
    const { pool } = await createConnection()
    const controller = new AbortController()
    controller.abort()

    try {
      await expect(
        pool.acquire().query('SELECT 1', {
          signal: controller.signal,
        })
      ).rejects.toMatchObject({
        name: 'AbortError',
        code: 'ABORT_ERR',
        message: 'Query was aborted',
      })
    } finally {
      await pool.dispose('destroy')
    }
  })

  it('reuses cached pg tenant pools for cacheable settings', async () => {
    const superUser = await getServiceKeyUser(tenantId)
    const settings = createConnectionSettings(superUser, {
      tenantId: 'pg-foundation-cacheable',
      isExternalPool: false,
    })

    const first = PgTenantConnection.create(settings)
    const second = PgTenantConnection.create(settings)

    expect(second.pool).toBe(first.pool)

    await first.pool.acquire().query('SELECT 1')
    expect(first.pool.getPoolStats()).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        used: expect.any(Number),
      })
    )
  })

  it('caches external pg tenant pools and dispose keeps them open for reuse', async () => {
    const superUser = await getServiceKeyUser(tenantId)
    const settings = createConnectionSettings(superUser, {
      tenantId: 'pg-foundation-external-pool',
      isExternalPool: true,
    })

    const first = PgTenantConnection.create(settings)
    const second = PgTenantConnection.create(settings)

    expect(second.pool).toBe(first.pool)

    await first.pool.acquire().query('SELECT 1')
    expect(first.pool.getPoolStats()).not.toBeNull()

    first.dispose()
    expect(first.pool.getPoolStats()).not.toBeNull()
    await expect(first.query('SELECT 1')).rejects.toThrow(
      'Cannot use a disposed PgTenantConnection'
    )

    // The shared pool stays usable for connections that were not disposed.
    await second.pool.acquire().query('SELECT 1')
    second.dispose()
    await PgTenantConnection.poolManager.destroy('pg-foundation-external-pool')
  })

  it('creates pg tenant connections through the shared database settings factory', async () => {
    const superUser = await getServiceKeyUser(tenantId)
    const connection = await getPgPostgresConnection({
      tenantId,
      host: 'localhost',
      user: superUser,
      superUser,
    })

    try {
      const result = await connection.pool.acquire().query<{ n: number }>('SELECT 1 AS n')
      expect(result.rows[0].n).toBe(1)
    } finally {
      connection.dispose()
    }
  })

  it('reuses the single-tenant pool after disposing a request-scoped connection', async () => {
    expect(getConfig().isMultitenant).toBe(false)

    const superUser = await getServiceKeyUser(tenantId)
    const createRequestConnection = () =>
      getPgPostgresConnection({
        tenantId,
        host: 'localhost',
        user: superUser,
        superUser,
      })

    const first = await createRequestConnection()
    await first.query('SELECT 1')
    expect(first.pool.getPoolStats()).toEqual({ total: 1, used: 0 })

    first.dispose()
    expect(first.pool.getPoolStats()).toEqual({ total: 1, used: 0 })

    const second = await createRequestConnection()

    try {
      expect(second).not.toBe(first)
      expect(second.pool).toBe(first.pool)
      expect(second.pool.getPoolStats()).toEqual({ total: 1, used: 0 })
      await expect(first.query('SELECT 1')).rejects.toThrow(
        'Cannot use a disposed PgTenantConnection'
      )
      await expect(second.query<{ n: number }>('SELECT 2 AS n')).resolves.toMatchObject({
        rows: [{ n: 2 }],
      })
      expect(second.pool.getPoolStats()).toEqual({ total: 1, used: 0 })
    } finally {
      second.dispose()
    }
  })
})
