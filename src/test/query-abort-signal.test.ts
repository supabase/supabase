import {
  getServiceKeyUser,
  PgPoolExecutor,
  PgPoolManager,
  PgTenantConnection,
} from '@internal/database'
import { getConfig } from '../config'

const { databaseURL, databasePoolURL, tenantId } = getConfig()
type TestPool = ReturnType<PgPoolManager['getPool']>
type TestConnection = PgPoolExecutor

describe('Query Abort Signal', () => {
  let poolManager: PgPoolManager
  let superUser: Awaited<ReturnType<typeof getServiceKeyUser>>

  beforeAll(async () => {
    superUser = await getServiceKeyUser(tenantId)
    poolManager = new PgPoolManager()
  })

  async function withIsolatedConnection<T>(run: (conn: TestConnection) => Promise<T>) {
    await poolManager.destroy(tenantId)

    const pool: TestPool = poolManager.getPool({
      tenantId,
      isExternalPool: true,
      maxConnections: 1,
      dbUrl: databasePoolURL || databaseURL,
      user: superUser,
      superUser,
    })

    const conn = pool.value.acquire()

    try {
      await conn.query('SELECT 1')
      return await run(conn)
    } finally {
      await poolManager.destroy(tenantId)
    }
  }

  it('executes query normally when signal is not aborted', async () => {
    await withIsolatedConnection(async (conn) => {
      const controller = new AbortController()

      const result = await conn.query<{ test: number }>('SELECT 1 as test', {
        signal: controller.signal,
      })

      expect(result.rows[0].test).toEqual(1)
    })
  })

  it('aborts query when signal is aborted before execution', async () => {
    await withIsolatedConnection(async (conn) => {
      const controller = new AbortController()
      controller.abort()
      const abortError = {
        name: 'AbortError',
        code: 'ABORT_ERR',
        message: 'Query was aborted',
      }

      await expect(
        conn.query('SELECT 1 as test', { signal: controller.signal })
      ).rejects.toMatchObject(abortError)
    })
  })

  it('aborts a long-running query when signal is aborted', async () => {
    await withIsolatedConnection(async (conn) => {
      const controller = new AbortController()
      const queryPromise = conn.query('SELECT pg_sleep(10)', { signal: controller.signal })
      const abortTimeout = setTimeout(() => controller.abort(), 100)

      try {
        await expect(queryPromise).rejects.toMatchObject({
          name: 'AbortError',
          code: 'ABORT_ERR',
          message: 'Query was aborted',
        })
      } finally {
        clearTimeout(abortTimeout)
      }
    })
  })

  it('rejects with AbortError containing correct properties', async () => {
    await withIsolatedConnection(async (conn) => {
      const controller = new AbortController()
      const queryPromise = conn.query('SELECT pg_sleep(5)', { signal: controller.signal })
      const abortTimeout = setTimeout(() => controller.abort(), 50)

      try {
        await queryPromise
        throw new Error('Expected query to be aborted')
      } catch (error: unknown) {
        expect(error).toMatchObject({
          name: 'AbortError',
          code: 'ABORT_ERR',
          message: 'Query was aborted',
        })
      } finally {
        clearTimeout(abortTimeout)
      }
    })
  })

  it('throws error for invalid signal parameter', async () => {
    await withIsolatedConnection(async (conn) => {
      const invalidSignal = 'not a signal' as unknown as AbortSignal

      await expect(conn.query('SELECT 1', { signal: invalidSignal })).rejects.toThrow(
        'Expected signal to be an instance of AbortSignal'
      )
    })
  })

  it('works with AbortSignal.timeout', async () => {
    await withIsolatedConnection(async (conn) => {
      await expect(
        conn.query('SELECT pg_sleep(10)', { signal: AbortSignal.timeout(50) })
      ).rejects.toMatchObject({
        name: 'AbortError',
      })
    })
  })
})

describe('Statement Timeout', () => {
  it('applies SET LOCAL statement_timeout in transactions', async () => {
    const superUser = await getServiceKeyUser(tenantId)
    const poolManager = new PgPoolManager()
    const pool = poolManager.getPool({
      tenantId,
      isExternalPool: true,
      maxConnections: 2,
      dbUrl: databasePoolURL || databaseURL,
      user: superUser,
      superUser,
    })

    const connection = new PgTenantConnection(pool, {
      tenantId,
      isExternalPool: true,
      maxConnections: 2,
      dbUrl: databasePoolURL || databaseURL,
      user: superUser,
      superUser,
    })

    const tnx = await connection.transaction()

    try {
      const result = await tnx.query<{ statement_timeout: string }>('SHOW statement_timeout')
      const timeout = result.rows[0].statement_timeout

      expect(timeout).toBeTruthy()
      expect(timeout).not.toBe('0')

      await tnx.commit()
    } catch (e) {
      await tnx.rollback()
      throw e
    } finally {
      connection.dispose()
      await poolManager.destroy(tenantId)
    }
  })
})

describe('PgTenantConnection Abort Signal', () => {
  it('stores and retrieves abort signal', async () => {
    const superUser = await getServiceKeyUser(tenantId)
    const poolManager = new PgPoolManager()
    const pool = poolManager.getPool({
      tenantId,
      isExternalPool: true,
      maxConnections: 2,
      dbUrl: databasePoolURL || databaseURL,
      user: superUser,
      superUser,
    })

    const connection = new PgTenantConnection(pool, {
      tenantId,
      isExternalPool: true,
      maxConnections: 2,
      dbUrl: databasePoolURL || databaseURL,
      user: superUser,
      superUser,
    })

    try {
      expect(connection.getAbortSignal()).toBeUndefined()

      const controller = new AbortController()
      connection.setAbortSignal(controller.signal)

      expect(connection.getAbortSignal()).toBe(controller.signal)
    } finally {
      connection.dispose()
      await poolManager.destroy(tenantId)
    }
  })
})
