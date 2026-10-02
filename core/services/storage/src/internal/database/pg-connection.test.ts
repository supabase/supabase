import type { Lease } from '@internal/cache'
import { logger, logSchema } from '@internal/monitoring'
import { EventEmitter } from 'events'
import { DatabaseError, Pool as PgPool, type Pool, type PoolClient, types as pgTypes } from 'pg'
// Production cancel requests use this pg internals class; the test spies on
// the same class to keep cancellation pending without opening real sockets.
import PgConnection from 'pg/lib/connection'
import { type Mock, vi } from 'vitest'
import type { DatabaseExecutor } from './connection'
import {
  PgPoolExecutor,
  PgPoolManager,
  PgPoolStrategy,
  PgTenantConnection,
  PgTransaction,
} from './pg-connection'
import { searchPath, type TenantConnectionOptions } from './pool'

class TestablePgPoolStrategy extends PgPoolStrategy {
  getCurrentPoolForTest(): Pool {
    return this.getPool()
  }

  setCurrentPoolForTest(pool: Pool): void {
    this.pool = pool
  }

  getCachedExecutorPoolForTest(): Pool | undefined {
    return Reflect.get(this, 'executorPool') as Pool | undefined
  }
}

function createPoolStrategySettings(
  overrides: Partial<TenantConnectionOptions> = {}
): TenantConnectionOptions {
  return {
    tenantId: 'pg-pool-strategy-test',
    dbUrl: 'postgres://postgres:postgres@localhost:5432/postgres',
    maxConnections: 8,
    numWorkers: 1,
    isExternalPool: true,
    user: {
      jwt: 'jwt',
      payload: {
        role: 'authenticated',
      },
    },
    superUser: {
      jwt: 'service',
      payload: {
        role: 'service_role',
      },
    },
    ...overrides,
  }
}

function createDatabaseError(code: string | undefined, message = 'database error'): DatabaseError {
  const error = new DatabaseError(message, message.length, 'error')
  error.code = code
  return error
}

type TestPoolLease = Lease<PgPoolStrategy> & { release: Mock }

function asPoolLease(pool: PgPoolStrategy): TestPoolLease {
  return { value: pool, release: vi.fn() }
}

type TestPgBeginTransactionOptions = {
  searchPath?: string
  timeout?: number
  statementTimeoutMs?: number
}

function normalizeTestStatementTimeoutMs(
  options?: TestPgBeginTransactionOptions
): number | undefined {
  const timeoutMs = options?.statementTimeoutMs ?? options?.timeout

  if (timeoutMs === undefined || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return undefined
  }

  return timeoutMs
}

function createMockTenantConnectionWithTransaction(
  overrides: Partial<TenantConnectionOptions> = {},
  query = vi.fn().mockResolvedValue({ rows: [] })
) {
  const client = {
    query,
    release: vi.fn(),
  } as unknown as PoolClient
  let transaction: PgTransaction | undefined
  const beginTransaction = vi.fn(
    async (options?: TestPgBeginTransactionOptions): Promise<PgTransaction> => {
      transaction = new PgTransaction(client, undefined, {
        searchPath: options?.searchPath,
        statementTimeoutMs: normalizeTestStatementTimeoutMs(options),
      })
      return transaction
    }
  )
  const pool = {
    acquire: vi.fn().mockReturnValue({
      beginTransaction,
    }),
  } as unknown as PgPoolStrategy
  const connection = new PgTenantConnection(
    asPoolLease(pool),
    createPoolStrategySettings(overrides)
  )

  return {
    beginTransaction,
    client,
    connection,
    query,
    getTransaction() {
      if (!transaction) {
        throw new Error('Expected test transaction to be created')
      }

      return transaction
    },
  }
}

async function expectQueryErrorRelease(error: Error): Promise<ReturnType<typeof vi.fn>> {
  const release = vi.fn()
  const client = Object.assign(new EventEmitter(), {
    query: vi.fn().mockRejectedValue(error),
    release,
  }) as unknown as PoolClient
  const pool = {
    connect: vi.fn().mockResolvedValue(client),
  } as unknown as Pool
  const executor = new PgPoolExecutor(pool)

  await expect(executor.query('SELECT 1')).rejects.toBe(error)

  return release
}

class FakePgPoolClient extends EventEmitter {
  _ending = false
  _poolUseCount = 0
  _queryable = true

  connect(callback: (error?: Error) => void): void {
    setImmediate(() => callback())
  }

  query(
    _statement: string,
    callback?: (error: Error | undefined, result: { rows: unknown[] }) => void
  ): Promise<{ rows: unknown[] }> | void {
    const result = { rows: [] }

    if (callback) {
      setImmediate(() => callback(undefined, result))
      return
    }

    return Promise.resolve(result)
  }

  end(callback?: () => void): void {
    this._ending = true
    setImmediate(() => {
      this.emit('end')
      callback?.()
    })
  }

  ref(): void {
    // no-op
  }

  unref(): void {
    // no-op
  }
}

function createDrainablePoolForTest(
  initialStats: {
    waitingCount?: number
    totalCount?: number
    idleCount?: number
    ending?: boolean
    ended?: boolean
  } = {}
) {
  const stats = {
    waitingCount: 0,
    totalCount: 0,
    idleCount: 0,
    ending: false,
    ended: false,
    ...initialStats,
  }
  const end = vi.fn().mockImplementation(async () => {
    stats.ending = true
    stats.ended = true
  })
  const pool = {
    options: {
      max: 8,
    },
    get waitingCount() {
      return stats.waitingCount
    },
    get totalCount() {
      return stats.totalCount
    },
    get idleCount() {
      return stats.idleCount
    },
    get ending() {
      return stats.ending
    },
    get ended() {
      return stats.ended
    },
    end,
  } as unknown as Pool

  return {
    pool,
    end,
    setStats(nextStats: Partial<typeof stats>) {
      Object.assign(stats, nextStats)
    },
  }
}

async function waitForDrainCheck(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve))
}

async function loadPgConnectionModuleWithConfig(configOverrides: Record<string, unknown>) {
  vi.resetModules()

  const configModule = await import('../../config')
  configModule.getConfig({ reload: true })
  configModule.mergeConfig({
    databaseApplicationName: 'storage-test',
    databaseConnectionTimeout: 3000,
    databaseFreePoolAfterInactivity: 1000,
    databaseMaxConnections: 20,
    databaseSSLRootCert: undefined,
    databaseTlsSessionResumption: false,
    ...configOverrides,
  } as Parameters<typeof configModule.mergeConfig>[0])

  return import('./pg-connection')
}

describe('PgPoolExecutor', () => {
  it('uses the physical pool as cache scope across executor wrappers', () => {
    const pool = {} as Pool
    const otherPool = {} as Pool
    const first = new PgPoolExecutor(pool)
    const second = new PgPoolExecutor(pool)
    const other = new PgPoolExecutor(otherPool)

    expect(first.getCacheScope()).toBe(pool)
    expect(second.getCacheScope()).toBe(pool)
    expect(other.getCacheScope()).toBe(otherPool)
  })

  it('propagates the physical pool cache scope into transactions', async () => {
    const client = Object.assign(new EventEmitter(), {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    }) as unknown as PoolClient
    const pool = {
      connect: vi.fn().mockResolvedValue(client),
    } as unknown as Pool
    const executor = new PgPoolExecutor(pool)

    const transaction = await executor.beginTransaction()

    expect(transaction.getCacheScope()).toBe(pool)
    await transaction.rollback()
  })

  it('tracks checked-out client errors during direct queries', async () => {
    const socketError = new Error('socket reset')
    const client = Object.assign(new EventEmitter(), {
      query: vi.fn(async () => {
        expect(client.listenerCount('error')).toBe(1)
        client.emit('error', socketError)
        return { rows: [] }
      }),
      release: vi.fn(),
    }) as unknown as PoolClient & EventEmitter
    const pool = {
      connect: vi.fn().mockResolvedValue(client),
    } as unknown as Pool
    const executor = new PgPoolExecutor(pool)

    await expect(executor.query('SELECT 1')).rejects.toBe(socketError)

    expect(client.release).toHaveBeenCalledWith(socketError)
    expect(client.listenerCount('error')).toBe(0)
  })

  it('throws tracked checked-out client errors over concurrent direct query errors', async () => {
    const socketError = new Error('socket reset')
    const queryError = new Error('benign query error')
    const client = Object.assign(new EventEmitter(), {
      query: vi.fn(async () => {
        expect(client.listenerCount('error')).toBe(1)
        client.emit('error', socketError)
        throw queryError
      }),
      release: vi.fn(),
    }) as unknown as PoolClient & EventEmitter
    const pool = {
      connect: vi.fn().mockResolvedValue(client),
    } as unknown as Pool
    const executor = new PgPoolExecutor(pool)

    await expect(executor.query('SELECT 1')).rejects.toBe(socketError)

    expect(client.release).toHaveBeenCalledWith(socketError)
    expect(client.listenerCount('error')).toBe(0)
  })

  it('keeps checked-out client error listeners attached through direct query release', async () => {
    const releaseError = new Error('socket reset during release')
    const client = Object.assign(new EventEmitter(), {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(() => {
        expect(client.listenerCount('error')).toBe(1)
        client.emit('error', releaseError)
      }),
    }) as unknown as PoolClient & EventEmitter
    const pool = {
      connect: vi.fn().mockResolvedValue(client),
    } as unknown as Pool
    const executor = new PgPoolExecutor(pool)

    await expect(executor.query('SELECT 1')).resolves.toEqual({ rows: [] })

    expect(client.release).toHaveBeenCalledWith(undefined)
    expect(client.listenerCount('error')).toBe(0)
  })

  it('disposes tracked checked-out client errors before throwing from transaction queries', async () => {
    const socketError = new Error('socket reset')
    const client = Object.assign(new EventEmitter(), {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockImplementationOnce(async () => {
          expect(client.listenerCount('error')).toBe(1)
          client.emit('error', socketError)
          return { rows: [] }
        })
        .mockResolvedValueOnce({ rows: [] }),
      release: vi.fn(),
    }) as unknown as PoolClient & EventEmitter
    const pool = {
      connect: vi.fn().mockResolvedValue(client),
    } as unknown as Pool
    const executor = new PgPoolExecutor(pool)

    const transaction = await executor.beginTransaction()
    await expect(transaction.query('SELECT 1')).rejects.toBe(socketError)

    expect(client.release).toHaveBeenCalledWith(socketError)
    await expect(transaction.rollback()).resolves.toBeUndefined()
    expect(client.query).toHaveBeenCalledTimes(2)
    expect(client.listenerCount('error')).toBe(0)
  })

  it('does not release twice when BEGIN disposes the transaction client', async () => {
    const socketError = new Error('socket reset during begin')
    const client = Object.assign(new EventEmitter(), {
      query: vi.fn(async () => {
        expect(client.listenerCount('error')).toBe(1)
        client.emit('error', socketError)
        return { rows: [] }
      }),
      release: vi.fn(),
    }) as unknown as PoolClient & EventEmitter
    const pool = {
      connect: vi.fn().mockResolvedValue(client),
    } as unknown as Pool
    const executor = new PgPoolExecutor(pool)

    await expect(executor.beginTransaction()).rejects.toBe(socketError)

    expect(client.release).toHaveBeenCalledTimes(1)
    expect(client.release).toHaveBeenCalledWith(socketError)
    expect(client.listenerCount('error')).toBe(0)
  })

  it('keeps checked-out client error listeners attached through transaction release', async () => {
    const releaseError = new Error('socket reset during transaction release')
    const client = Object.assign(new EventEmitter(), {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(() => {
        expect(client.listenerCount('error')).toBe(1)
        client.emit('error', releaseError)
      }),
    }) as unknown as PoolClient & EventEmitter
    const pool = {
      connect: vi.fn().mockResolvedValue(client),
    } as unknown as Pool
    const executor = new PgPoolExecutor(pool)

    const transaction = await executor.beginTransaction()

    await expect(transaction.commit()).resolves.toBeUndefined()
    expect(client.release).toHaveBeenCalledWith(undefined)
    expect(client.listenerCount('error')).toBe(0)
  })

  it('uses transaction timeout with isolation and read-only begin modes', async () => {
    const client = Object.assign(new EventEmitter(), {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    }) as unknown as PoolClient & EventEmitter
    const pool = {
      connect: vi.fn().mockResolvedValue(client),
    } as unknown as Pool
    const executor = new PgPoolExecutor(pool)

    const transaction = await executor.beginTransaction({
      timeout: 4321,
      isolation: 'repeatable read',
      readOnly: true,
    })

    expect(client.query).toHaveBeenCalledTimes(1)
    expect(client.query).toHaveBeenNthCalledWith(
      1,
      'BEGIN ISOLATION LEVEL REPEATABLE READ, READ ONLY',
      undefined
    )

    await transaction.query('SELECT 1')

    expect(client.query).toHaveBeenCalledTimes(3)
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      "SELECT set_config('statement_timeout', $1, true)",
      ['4321ms']
    )
    expect(client.query).toHaveBeenNthCalledWith(3, 'SELECT 1', undefined)

    await transaction.rollback()
  })

  it('returns clients to the pool after regular SQL errors', async () => {
    for (const code of ['42P01', '23505', '23503', '42501', '22P02', '42703']) {
      const error = createDatabaseError(code)
      const release = await expectQueryErrorRelease(error)

      expect(release).toHaveBeenCalledWith(undefined)
    }
  })

  it('returns clients to the pool after statement_timeout errors', async () => {
    const timeoutError = createDatabaseError(
      '57014',
      'canceling statement due to statement timeout'
    )
    const release = await expectQueryErrorRelease(timeoutError)

    expect(release).toHaveBeenCalledWith(undefined)
  })

  it('disposes clients after connection-state query errors', async () => {
    const connectionError = createDatabaseError('08006')
    const connectionErrorRelease = await expectQueryErrorRelease(connectionError)

    expect(connectionErrorRelease).toHaveBeenCalledWith(connectionError)

    const protocolError = createDatabaseError(undefined, 'received invalid response: 58')
    const protocolErrorRelease = await expectQueryErrorRelease(protocolError)

    expect(protocolErrorRelease).toHaveBeenCalledWith(protocolError)
  })

  it('maps pg-pool connection timeouts during query checkout to DatabaseTimeout', async () => {
    const timeoutError = new Error('Connection terminated due to connection timeout')
    const pool = {
      connect: vi.fn().mockRejectedValue(timeoutError),
    } as unknown as Pool
    const executor = new PgPoolExecutor(pool)

    await expect(executor.query('SELECT 1')).rejects.toMatchObject({
      code: 'DatabaseTimeout',
      originalError: timeoutError,
    })
  })

  it('rejects pre-aborted queries before checking out a client', async () => {
    const signal = AbortSignal.abort()
    const client = Object.assign(new EventEmitter(), {
      query: vi.fn(),
      release: vi.fn(),
    }) as unknown as PoolClient & EventEmitter
    const pool = {
      connect: vi.fn().mockResolvedValue(client),
    } as unknown as Pool
    const executor = new PgPoolExecutor(pool)

    await expect(executor.query('SELECT 1', { signal })).rejects.toMatchObject({
      name: 'AbortError',
      code: 'ABORT_ERR',
      message: 'Query was aborted',
    })
    expect(pool.connect).not.toHaveBeenCalled()
  })

  it('rejects aborted queries without waiting for the pg query to settle', async () => {
    const controller = new AbortController()
    const release = vi.fn()
    const client = Object.assign(new EventEmitter(), {
      query: vi.fn(() => {
        controller.abort()
        return new Promise(() => undefined)
      }),
      release,
    }) as unknown as PoolClient & EventEmitter
    const pool = {
      connect: vi.fn().mockResolvedValue(client),
    } as unknown as Pool
    const executor = new PgPoolExecutor(pool)

    const result = await Promise.race([
      executor.query('SELECT pg_sleep(999)', { signal: controller.signal }).then(
        () => ({ status: 'resolved' as const }),
        (error) => ({ status: 'rejected' as const, error })
      ),
      waitForDrainCheck().then(() => ({ status: 'pending' as const })),
    ])

    expect(result).toMatchObject({
      status: 'rejected',
      error: {
        name: 'AbortError',
        code: 'ABORT_ERR',
        message: 'Query was aborted',
      },
    })
    expect(release).toHaveBeenCalledWith(expect.objectContaining({ name: 'AbortError' }))
  })

  it('rejects aborted queries immediately while cancel is still pending', async () => {
    vi.useFakeTimers()
    const connectSpy = vi.spyOn(PgConnection.prototype, 'connect').mockImplementation(() => true)
    const endSpy = vi.spyOn(PgConnection.prototype, 'end').mockImplementation(() => undefined)
    const controller = new AbortController()
    const release = vi.fn()
    const client = Object.assign(new EventEmitter(), {
      processID: 123,
      secretKey: 456,
      host: 'db.example.test',
      port: 5432,
      query: vi.fn(() => {
        controller.abort()
        return new Promise(() => undefined)
      }),
      release,
    }) as unknown as PoolClient & EventEmitter
    const pool = {
      connect: vi.fn().mockResolvedValue(client),
    } as unknown as Pool
    const executor = new PgPoolExecutor(pool)
    const settled = vi.fn()
    const queryPromise = executor.query('SELECT pg_sleep(999)', { signal: controller.signal }).then(
      () => settled('resolved'),
      (error) => settled('rejected', error)
    )

    try {
      await vi.advanceTimersByTimeAsync(0)

      expect(settled).toHaveBeenCalledWith(
        'rejected',
        expect.objectContaining({
          name: 'AbortError',
          code: 'ABORT_ERR',
          message: 'Query was aborted',
        })
      )
      expect(release).toHaveBeenCalledWith(expect.objectContaining({ name: 'AbortError' }))
      expect(connectSpy).toHaveBeenCalled()
      expect(endSpy).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(5000)
      expect(endSpy).toHaveBeenCalled()
      await queryPromise
    } finally {
      connectSpy.mockRestore()
      endSpy.mockRestore()
      vi.useRealTimers()
    }
  })
})

describe('PgTransaction', () => {
  it('applies a pending statement timeout before the first direct query', async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    } as unknown as PoolClient
    const transaction = new PgTransaction(client, undefined, { statementTimeoutMs: 4321 })

    await transaction.query('SELECT 1')
    await transaction.query('SELECT 2')

    expect(client.query).toHaveBeenCalledTimes(3)
    expect(client.query).toHaveBeenNthCalledWith(
      1,
      "SELECT set_config('statement_timeout', $1, true)",
      ['4321ms']
    )
    expect(client.query).toHaveBeenNthCalledWith(2, 'SELECT 1', undefined)
    expect(client.query).toHaveBeenNthCalledWith(3, 'SELECT 2', undefined)
  })

  it('applies a pending search path before the first direct query', async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    } as unknown as PoolClient
    const transaction = new PgTransaction(client, undefined, {
      searchPath: searchPath.join(','),
    })

    await transaction.query('SELECT 1')
    await transaction.query('SELECT 2')

    expect(client.query).toHaveBeenCalledTimes(3)
    expect(client.query).toHaveBeenNthCalledWith(1, "SELECT set_config('search_path', $1, true)", [
      searchPath.join(','),
    ])
    expect(client.query).toHaveBeenNthCalledWith(2, 'SELECT 1', undefined)
    expect(client.query).toHaveBeenNthCalledWith(3, 'SELECT 2', undefined)
  })

  it('applies pending search path and statement timeout together before a direct query', async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    } as unknown as PoolClient
    const transaction = new PgTransaction(client, undefined, {
      searchPath: searchPath.join(','),
      statementTimeoutMs: 4321,
    })

    await transaction.query('SELECT 1')
    await transaction.query('SELECT 2')

    expect(client.query).toHaveBeenCalledTimes(3)
    expect(client.query).toHaveBeenNthCalledWith(
      1,
      "SELECT set_config('statement_timeout', $1, true), set_config('search_path', $2, true)",
      ['4321ms', searchPath.join(',')]
    )
    expect(client.query).toHaveBeenNthCalledWith(2, 'SELECT 1', undefined)
    expect(client.query).toHaveBeenNthCalledWith(3, 'SELECT 2', undefined)
  })

  it('keeps pending settings across setup queries until a direct query applies them', async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    } as unknown as PoolClient
    const transaction = new PgTransaction(client, undefined, {
      searchPath: searchPath.join(','),
      statementTimeoutMs: 4321,
    })

    await transaction.runSetupQuery('BEGIN')
    await transaction.query('SELECT 1')

    expect(client.query).toHaveBeenCalledTimes(3)
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN', undefined)
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      "SELECT set_config('statement_timeout', $1, true), set_config('search_path', $2, true)",
      ['4321ms', searchPath.join(',')]
    )
    expect(client.query).toHaveBeenNthCalledWith(3, 'SELECT 1', undefined)
  })

  it('normalizes invalid constructor statement timeouts as disabled', async () => {
    for (const statementTimeoutMs of [-5, Number.NaN, Number.POSITIVE_INFINITY, 0]) {
      const client = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
        release: vi.fn(),
      } as unknown as PoolClient
      const transaction = new PgTransaction(client, undefined, { statementTimeoutMs })

      await transaction.query('SELECT 1')

      expect(client.query).toHaveBeenCalledTimes(1)
      expect(client.query).toHaveBeenNthCalledWith(1, 'SELECT 1', undefined)
    }
  })

  it('normalizes an empty constructor search path as disabled', async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    } as unknown as PoolClient
    const transaction = new PgTransaction(client, undefined, { searchPath: '' })

    const queryPromise = transaction.query('SELECT 1')

    expect(client.query).toHaveBeenCalledTimes(1)
    expect(client.query).toHaveBeenNthCalledWith(1, 'SELECT 1', undefined)
    await queryPromise
  })

  it('rejects a pre-aborted direct query before applying a pending statement timeout', async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    } as unknown as PoolClient
    const transaction = new PgTransaction(client, undefined, { statementTimeoutMs: 4321 })

    await expect(
      transaction.query('SELECT 1', { signal: AbortSignal.abort() })
    ).rejects.toMatchObject({
      name: 'AbortError',
      code: 'ABORT_ERR',
    })
    expect(client.query).not.toHaveBeenCalled()
    expect(client.release).toHaveBeenCalledWith(expect.objectContaining({ name: 'AbortError' }))

    await expect(transaction.query('SELECT 2')).rejects.toThrow(
      'Cannot query a completed transaction'
    )
    expect(client.query).not.toHaveBeenCalled()
  })

  it('honors abort signals while applying a pending statement timeout', async () => {
    const controller = new AbortController()
    const client = Object.assign(new EventEmitter(), {
      query: vi.fn(() => {
        controller.abort()
        return new Promise(() => undefined)
      }),
      release: vi.fn(),
    }) as unknown as PoolClient & EventEmitter
    const transaction = new PgTransaction(client, undefined, { statementTimeoutMs: 4321 })

    await expect(
      transaction.query('SELECT 1', { signal: controller.signal })
    ).rejects.toMatchObject({
      name: 'AbortError',
      code: 'ABORT_ERR',
    })

    expect(client.query).toHaveBeenCalledTimes(1)
    expect(client.query).toHaveBeenNthCalledWith(
      1,
      "SELECT set_config('statement_timeout', $1, true)",
      ['4321ms']
    )
    expect(client.release).toHaveBeenCalledWith(expect.objectContaining({ name: 'AbortError' }))

    await transaction.rollback()
    expect(client.query).toHaveBeenCalledTimes(1)
  })

  it('rejects queries after commit releases the client', async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    } as unknown as PoolClient
    const transaction = new PgTransaction(client)

    await transaction.commit()

    await expect(transaction.query('SELECT 1')).rejects.toThrow(
      'Cannot query a completed transaction'
    )
    expect(client.query).toHaveBeenCalledTimes(1)
    expect(client.release).toHaveBeenCalledTimes(1)
  })

  it('rejects queries after rollback releases the client', async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    } as unknown as PoolClient
    const transaction = new PgTransaction(client)

    await transaction.rollback()

    await expect(transaction.query('SELECT 1')).rejects.toThrow(
      'Cannot query a completed transaction'
    )
    expect(client.query).toHaveBeenCalledTimes(1)
    expect(client.release).toHaveBeenCalledTimes(1)
  })

  it('disposes the transaction client after an aborted query without queueing rollback', async () => {
    const controller = new AbortController()
    const client = Object.assign(new EventEmitter(), {
      query: vi.fn(() => {
        controller.abort()
        return new Promise(() => undefined)
      }),
      release: vi.fn(),
    }) as unknown as PoolClient & EventEmitter
    const transaction = new PgTransaction(client)

    await expect(
      transaction.query('SELECT pg_sleep(999)', { signal: controller.signal })
    ).rejects.toMatchObject({
      name: 'AbortError',
      code: 'ABORT_ERR',
      message: 'Query was aborted',
    })

    expect(client.release).toHaveBeenCalledWith(expect.objectContaining({ name: 'AbortError' }))
    await transaction.rollback()
    expect(client.query).toHaveBeenCalledTimes(1)
  })
})

describe('PgTenantConnection', () => {
  it('releases only the owning connection lease exactly once', () => {
    const lease = asPoolLease({} as PgPoolStrategy)
    const connection = new PgTenantConnection(lease, createPoolStrategySettings())

    const superUser = connection.asSuperUser()

    superUser.dispose()
    expect(lease.release).not.toHaveBeenCalled()

    connection.dispose()
    connection.dispose()
    expect(lease.release).toHaveBeenCalledTimes(1)
  })

  it('rejects connection use after disposal without disposing the leased pool', async () => {
    const pool = {
      acquire: vi.fn(),
      dispose: vi.fn().mockResolvedValue(undefined),
    } as unknown as PgPoolStrategy
    const connection = new PgTenantConnection(
      asPoolLease(pool),
      createPoolStrategySettings({
        isExternalPool: true,
      })
    )

    connection.dispose()

    await expect(connection.query('SELECT 1')).rejects.toThrow(
      'Cannot use a disposed PgTenantConnection'
    )
    await expect(connection.beginTransaction()).rejects.toThrow(
      'Cannot use a disposed PgTenantConnection'
    )
    await expect(connection.transaction()).rejects.toThrow(
      'Cannot use a disposed PgTenantConnection'
    )
    expect(() => connection.asSuperUser()).toThrow('Cannot use a disposed PgTenantConnection')
    expect(pool.acquire).not.toHaveBeenCalled()
    expect(pool.dispose).not.toHaveBeenCalled()
  })

  it('stops transaction retries after disposal', async () => {
    vi.useFakeTimers()

    const connectionLimitError = createDatabaseError('08P01', 'no more connections allowed')
    const beginTransaction = vi.fn().mockRejectedValue(connectionLimitError)
    const pool = {
      acquire: vi.fn().mockReturnValue({
        beginTransaction,
      }),
      dispose: vi.fn().mockResolvedValue(undefined),
    } as unknown as PgPoolStrategy
    const connection = new PgTenantConnection(
      asPoolLease(pool),
      createPoolStrategySettings({
        isExternalPool: true,
      })
    )

    try {
      const transactionPromise = connection.transaction()
      const transactionErrorPromise = transactionPromise.catch((error) => error)

      await vi.advanceTimersByTimeAsync(0)
      expect(pool.acquire).toHaveBeenCalledTimes(1)

      connection.dispose()
      await vi.advanceTimersByTimeAsync(200)

      await expect(transactionErrorPromise).resolves.toMatchObject({
        message: 'Cannot use a disposed PgTenantConnection',
      })
      expect(pool.acquire).toHaveBeenCalledTimes(1)
      expect(beginTransaction).toHaveBeenCalledTimes(1)
      expect(pool.dispose).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('starts successful transactions without scheduling retry timers', async () => {
    vi.useFakeTimers()

    const transaction = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    } as unknown as PgTransaction
    const pool = {
      acquire: vi.fn().mockReturnValue({
        beginTransaction: vi.fn().mockResolvedValue(transaction),
      }),
    } as unknown as PgPoolStrategy
    const connection = new PgTenantConnection(
      asPoolLease(pool),
      createPoolStrategySettings({
        isExternalPool: false,
      })
    )

    try {
      await expect(connection.transaction()).resolves.toBe(transaction)

      expect(pool.acquire).toHaveBeenCalledTimes(1)
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('retries transaction setup after connection-state errors', async () => {
    vi.useFakeTimers()

    const connectionStateError = createDatabaseError('08006', 'connection failure')
    const transaction = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    } as unknown as PgTransaction
    const beginTransaction = vi
      .fn()
      .mockRejectedValueOnce(connectionStateError)
      .mockResolvedValue(transaction)
    const pool = {
      acquire: vi.fn().mockReturnValue({
        beginTransaction,
      }),
    } as unknown as PgPoolStrategy
    const connection = new PgTenantConnection(
      asPoolLease(pool),
      createPoolStrategySettings({
        isExternalPool: false,
      })
    )

    try {
      const transactionPromise = connection.transaction()
      const transactionResult = transactionPromise.then(
        (value) => ({ status: 'resolved' as const, value }),
        (error) => ({ status: 'rejected' as const, error })
      )

      await vi.advanceTimersByTimeAsync(100) // max of jitter

      await expect(transactionResult).resolves.toEqual({
        status: 'resolved',
        value: transaction,
      })
      expect(pool.acquire).toHaveBeenCalledTimes(2)
      expect(beginTransaction).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('retries transaction setup after socket-level connection errors', async () => {
    vi.useFakeTimers()

    const socketError = new Error('Connection terminated unexpectedly')
    const transaction = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    } as unknown as PgTransaction
    const beginTransaction = vi
      .fn()
      .mockRejectedValueOnce(socketError)
      .mockResolvedValue(transaction)
    const pool = {
      acquire: vi.fn().mockReturnValue({
        beginTransaction,
      }),
    } as unknown as PgPoolStrategy
    const connection = new PgTenantConnection(
      asPoolLease(pool),
      createPoolStrategySettings({
        isExternalPool: false,
      })
    )

    try {
      const transactionPromise = connection.transaction()
      const transactionResult = transactionPromise.then(
        (value) => ({ status: 'resolved' as const, value }),
        (error) => ({ status: 'rejected' as const, error })
      )

      await vi.advanceTimersByTimeAsync(100)

      await expect(transactionResult).resolves.toEqual({
        status: 'resolved',
        value: transaction,
      })
      expect(pool.acquire).toHaveBeenCalledTimes(2)
      expect(beginTransaction).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('retries transaction setup after coded socket errors', async () => {
    vi.useFakeTimers()

    try {
      for (const code of ['ECONNRESET', 'EPIPE']) {
        const socketError = Object.assign(new Error(`write ${code}`), { code })
        const transaction = {
          query: vi.fn().mockResolvedValue({ rows: [] }),
        } as unknown as PgTransaction
        const beginTransaction = vi
          .fn()
          .mockRejectedValueOnce(socketError)
          .mockResolvedValue(transaction)
        const pool = {
          acquire: vi.fn().mockReturnValue({
            beginTransaction,
          }),
        } as unknown as PgPoolStrategy
        const connection = new PgTenantConnection(
          asPoolLease(pool),
          createPoolStrategySettings({
            isExternalPool: false,
          })
        )

        const transactionPromise = connection.transaction()
        const transactionResult = transactionPromise.then(
          (value) => ({ status: 'resolved' as const, value }),
          (error) => ({ status: 'rejected' as const, error })
        )

        await vi.advanceTimersByTimeAsync(100)

        await expect(transactionResult).resolves.toEqual({
          status: 'resolved',
          value: transaction,
        })
        expect(pool.acquire).toHaveBeenCalledTimes(2)
        expect(beginTransaction).toHaveBeenCalledTimes(2)
      }
    } finally {
      vi.useRealTimers()
    }
  })

  it('retries public beginTransaction on connection-state errors', async () => {
    vi.useFakeTimers()

    const connectionStateError = createDatabaseError('08006', 'connection failure')
    const transaction = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    } as unknown as PgTransaction
    const beginTransaction = vi
      .fn()
      .mockRejectedValueOnce(connectionStateError)
      .mockResolvedValue(transaction)
    const pool = {
      acquire: vi.fn().mockReturnValue({
        beginTransaction,
      }),
    } as unknown as PgPoolStrategy
    const connection = new PgTenantConnection(
      asPoolLease(pool),
      createPoolStrategySettings({
        isExternalPool: false,
      })
    )

    try {
      const transactionPromise = connection.beginTransaction()
      const transactionResult = transactionPromise.then(
        (value) => ({ status: 'resolved' as const, value }),
        (error) => ({ status: 'rejected' as const, error })
      )

      await vi.advanceTimersByTimeAsync(100)

      await expect(transactionResult).resolves.toEqual({
        status: 'resolved',
        value: transaction,
      })
      expect(pool.acquire).toHaveBeenCalledTimes(2)
      expect(beginTransaction).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not retry when the eager attempt consumed the setup budget', async () => {
    vi.useFakeTimers()

    const connectionStateError = createDatabaseError('08006', 'connection failure')
    const beginTransaction = vi.fn().mockImplementationOnce(async () => {
      vi.advanceTimersByTime(3500)
      throw connectionStateError
    })
    const pool = {
      acquire: vi.fn().mockReturnValue({
        beginTransaction,
      }),
    } as unknown as PgPoolStrategy
    const connection = new PgTenantConnection(
      asPoolLease(pool),
      createPoolStrategySettings({
        isExternalPool: false,
      })
    )

    try {
      await expect(connection.transaction()).rejects.toBe(connectionStateError)
      expect(pool.acquire).toHaveBeenCalledTimes(1)
      expect(beginTransaction).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('retries transaction setup after connection-limit errors', async () => {
    vi.useFakeTimers()

    const connectionLimitError = createDatabaseError(undefined, 'Max client connections reached')
    const transaction = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    } as unknown as PgTransaction
    const beginTransaction = vi
      .fn()
      .mockRejectedValueOnce(connectionLimitError)
      .mockResolvedValue(transaction)
    const pool = {
      acquire: vi.fn().mockReturnValue({
        beginTransaction,
      }),
    } as unknown as PgPoolStrategy
    const connection = new PgTenantConnection(
      asPoolLease(pool),
      createPoolStrategySettings({
        isExternalPool: false,
      })
    )

    try {
      const transactionPromise = connection.transaction()
      const transactionResult = transactionPromise.then(
        (value) => ({ status: 'resolved' as const, value }),
        (error) => ({ status: 'rejected' as const, error })
      )

      await vi.advanceTimersByTimeAsync(100)

      await expect(transactionResult).resolves.toEqual({
        status: 'resolved',
        value: transaction,
      })
      expect(pool.acquire).toHaveBeenCalledTimes(2)
      expect(beginTransaction).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('fails transaction setup fast on non-retryable errors', async () => {
    const permissionError = createDatabaseError('42501', 'permission denied')
    const beginTransaction = vi.fn().mockRejectedValue(permissionError)
    const pool = {
      acquire: vi.fn().mockReturnValue({
        beginTransaction,
      }),
    } as unknown as PgPoolStrategy
    const connection = new PgTenantConnection(
      asPoolLease(pool),
      createPoolStrategySettings({
        isExternalPool: false,
      })
    )

    await expect(connection.transaction()).rejects.toBe(permissionError)
    expect(pool.acquire).toHaveBeenCalledTimes(1)
    expect(beginTransaction).toHaveBeenCalledTimes(1)
  })

  it('stops transaction retries once the abort signal fires', async () => {
    vi.useFakeTimers()

    const connectionStateError = createDatabaseError('08006', 'connection failure')
    const beginTransaction = vi.fn().mockRejectedValue(connectionStateError)
    const pool = {
      acquire: vi.fn().mockReturnValue({
        beginTransaction,
      }),
    } as unknown as PgPoolStrategy
    const connection = new PgTenantConnection(
      asPoolLease(pool),
      createPoolStrategySettings({
        isExternalPool: false,
      })
    )
    const abortController = new AbortController()
    connection.setAbortSignal(abortController.signal)

    try {
      const transactionPromise = connection.transaction()
      const transactionErrorPromise = transactionPromise.catch((error) => error)

      await vi.advanceTimersByTimeAsync(0)
      expect(pool.acquire).toHaveBeenCalledTimes(1)

      abortController.abort()
      await vi.advanceTimersByTimeAsync(100)

      await expect(transactionErrorPromise).resolves.toMatchObject({
        name: 'AbortError',
        code: 'ABORT_ERR',
      })
      expect(pool.acquire).toHaveBeenCalledTimes(1)
      expect(beginTransaction).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('maps pg-pool acquisition timeouts to DatabaseTimeout', async () => {
    const timeoutError = new Error('timeout exceeded when trying to connect')
    const pool = {
      acquire: vi.fn().mockReturnValue({
        beginTransaction: vi.fn().mockRejectedValue(timeoutError),
      }),
    } as unknown as PgPoolStrategy
    const connection = new PgTenantConnection(asPoolLease(pool), createPoolStrategySettings())

    await expect(connection.transaction()).rejects.toMatchObject({
      code: 'DatabaseTimeout',
      originalError: timeoutError,
    })
  })

  it('maps pg-pool connection-terminated acquisition timeouts to DatabaseTimeout', async () => {
    const timeoutError = new Error('Connection terminated due to connection timeout')
    const pool = {
      acquire: vi.fn().mockReturnValue({
        beginTransaction: vi.fn().mockRejectedValue(timeoutError),
      }),
    } as unknown as PgPoolStrategy
    const connection = new PgTenantConnection(asPoolLease(pool), createPoolStrategySettings())

    await expect(connection.transaction()).rejects.toMatchObject({
      code: 'DatabaseTimeout',
      originalError: timeoutError,
    })
  })

  it('treats non-finite transaction timeouts as disabled', async () => {
    for (const timeout of [Number.NaN, Number.POSITIVE_INFINITY]) {
      const { beginTransaction, connection, query, getTransaction } =
        createMockTenantConnectionWithTransaction({
          isExternalPool: false,
        })

      const transaction = await connection.transaction({ timeout })
      expect(transaction).toBe(getTransaction())
      expect(beginTransaction).toHaveBeenCalledWith({ timeout })
      expect(query).not.toHaveBeenCalled()

      await connection.setScope(getTransaction())

      expect(query).toHaveBeenCalledTimes(1)
      const [scopeStatement, scopeValues] = query.mock.calls[0]
      expect(scopeStatement).toContain("set_config('role', $1, true)")
      expect(scopeStatement).not.toContain("set_config('statement_timeout'")
      expect(scopeValues).toHaveLength(9)
    }
  })

  it('defers statement_timeout for low-level Postgres beginTransaction', async () => {
    const { beginTransaction, connection, query, getTransaction } =
      createMockTenantConnectionWithTransaction({
        isExternalPool: false,
      })

    await expect(
      connection.beginTransaction({
        timeout: 4321,
        isolation: 'serializable',
        readOnly: true,
      })
    ).resolves.toBe(getTransaction())
    expect(beginTransaction).toHaveBeenCalledWith({
      timeout: 4321,
      isolation: 'serializable',
      readOnly: true,
    })
    expect(query).not.toHaveBeenCalled()

    await connection.setScope(getTransaction())

    expect(query).toHaveBeenCalledTimes(1)
    const [scopeStatement, scopeValues] = query.mock.calls[0]
    expect(scopeStatement).toContain("set_config('role', $1, true)")
    expect(scopeStatement).toContain("set_config('statement_timeout', $10, true)")
    expect(scopeValues).toEqual([
      'authenticated',
      'authenticated',
      'jwt',
      '',
      JSON.stringify({ role: 'authenticated' }),
      '{}',
      '',
      '',
      '',
      '4321ms',
    ])
  })

  it('defers statement_timeout setup until the first scope application', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] })
    const client = {
      query,
      release: vi.fn(),
    } as unknown as PoolClient
    let transaction: PgTransaction
    const beginTransaction = vi.fn(
      async (options?: TestPgBeginTransactionOptions): Promise<PgTransaction> => {
        transaction = new PgTransaction(client, undefined, {
          searchPath: options?.searchPath,
          statementTimeoutMs: normalizeTestStatementTimeoutMs(options),
        })
        return transaction
      }
    )
    const pool = {
      acquire: vi.fn().mockReturnValue({
        beginTransaction,
      }),
    } as unknown as PgPoolStrategy
    const connection = new PgTenantConnection(
      asPoolLease(pool),
      createPoolStrategySettings({
        isExternalPool: false,
      })
    )

    await expect(connection.transaction({ timeout: 4321 })).resolves.toBe(transaction!)
    expect(beginTransaction).toHaveBeenCalledWith({ timeout: 4321 })
    expect(query).not.toHaveBeenCalled()

    await connection.setScope(transaction!)

    expect(query).toHaveBeenCalledTimes(1)
    const [statement, values] = query.mock.calls[0]
    expect(statement).toContain("set_config('role', $1, true)")
    expect(statement).toContain("set_config('statement_timeout', $10, true)")
    expect(values).toEqual([
      'authenticated',
      'authenticated',
      'jwt',
      '',
      JSON.stringify({ role: 'authenticated' }),
      '{}',
      '',
      '',
      '',
      '4321ms',
    ])
  })

  it('folds external-pool search_path and statement_timeout into scope setup', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] })
    const client = {
      query,
      release: vi.fn(),
    } as unknown as PoolClient
    let transaction: PgTransaction
    const beginTransaction = vi.fn(
      async (options?: TestPgBeginTransactionOptions): Promise<PgTransaction> => {
        transaction = new PgTransaction(client, undefined, {
          searchPath: options?.searchPath,
          statementTimeoutMs: normalizeTestStatementTimeoutMs(options),
        })
        return transaction
      }
    )
    const pool = {
      acquire: vi.fn().mockReturnValue({
        beginTransaction,
      }),
    } as unknown as PgPoolStrategy
    const connection = new PgTenantConnection(
      asPoolLease(pool),
      createPoolStrategySettings({
        isExternalPool: true,
      })
    )

    await expect(connection.transaction({ timeout: 4321 })).resolves.toBe(transaction!)
    expect(beginTransaction).toHaveBeenCalledWith({
      timeout: 4321,
      searchPath: searchPath.join(','),
    })
    expect(query).not.toHaveBeenCalled()

    await connection.setScope(transaction!)

    expect(query).toHaveBeenCalledTimes(1)
    const [scopeStatement, scopeValues] = query.mock.calls[0]
    expect(scopeStatement).toContain("set_config('role', $1, true)")
    expect(scopeStatement).toContain("set_config('statement_timeout', $10, true)")
    expect(scopeStatement).toContain("set_config('search_path', $11, true)")
    expect(scopeValues).toEqual([
      'authenticated',
      'authenticated',
      'jwt',
      '',
      JSON.stringify({ role: 'authenticated' }),
      '{}',
      '',
      '',
      '',
      '4321ms',
      searchPath.join(','),
    ])
  })

  it('folds external-pool search_path without a positive statement timeout', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] })
    const client = {
      query,
      release: vi.fn(),
    } as unknown as PoolClient
    let transaction: PgTransaction
    const beginTransaction = vi.fn(
      async (options?: TestPgBeginTransactionOptions): Promise<PgTransaction> => {
        transaction = new PgTransaction(client, undefined, {
          searchPath: options?.searchPath,
          statementTimeoutMs: normalizeTestStatementTimeoutMs(options),
        })
        return transaction
      }
    )
    const pool = {
      acquire: vi.fn().mockReturnValue({
        beginTransaction,
      }),
    } as unknown as PgPoolStrategy
    const connection = new PgTenantConnection(
      asPoolLease(pool),
      createPoolStrategySettings({
        isExternalPool: true,
      })
    )

    await expect(connection.transaction({ timeout: 0 })).resolves.toBe(transaction!)
    expect(beginTransaction).toHaveBeenCalledWith({
      timeout: 0,
      searchPath: searchPath.join(','),
    })
    expect(query).not.toHaveBeenCalled()

    await connection.setScope(transaction!)

    expect(query).toHaveBeenCalledTimes(1)
    const [scopeStatement, scopeValues] = query.mock.calls[0]
    expect(scopeStatement).not.toContain("set_config('statement_timeout'")
    expect(scopeStatement).toContain("set_config('search_path', $10, true)")
    expect(scopeValues).toEqual([
      'authenticated',
      'authenticated',
      'jwt',
      '',
      JSON.stringify({ role: 'authenticated' }),
      '{}',
      '',
      '',
      '',
      searchPath.join(','),
    ])
  })

  it('omits statement_timeout setup for low-level beginTransaction without a positive timeout', async () => {
    const cases: Array<{
      options?: { timeout: number }
    }> = [{}, { options: { timeout: 0 } }]

    for (const { options } of cases) {
      const { beginTransaction, connection, query, getTransaction } =
        createMockTenantConnectionWithTransaction({
          isExternalPool: false,
        })

      await connection.beginTransaction(options)
      expect(beginTransaction).toHaveBeenCalledWith(options)
      expect(query).not.toHaveBeenCalled()

      await connection.setScope(getTransaction())

      expect(query).toHaveBeenCalledTimes(1)
      const [scopeStatement, scopeValues] = query.mock.calls[0]
      expect(scopeStatement).toContain("set_config('role', $1, true)")
      expect(scopeStatement).not.toContain("set_config('statement_timeout'")
      expect(scopeValues).toHaveLength(9)
    }
  })

  it('does not re-apply statement_timeout after setScope consumes it', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] })
    const client = {
      query,
      release: vi.fn(),
    } as unknown as PoolClient
    let transaction: PgTransaction
    const beginTransaction = vi.fn(
      async (options?: TestPgBeginTransactionOptions): Promise<PgTransaction> => {
        transaction = new PgTransaction(client, undefined, {
          searchPath: options?.searchPath,
          statementTimeoutMs: normalizeTestStatementTimeoutMs(options),
        })
        return transaction
      }
    )
    const pool = {
      acquire: vi.fn().mockReturnValue({
        beginTransaction,
      }),
    } as unknown as PgPoolStrategy
    const connection = new PgTenantConnection(
      asPoolLease(pool),
      createPoolStrategySettings({
        isExternalPool: false,
      })
    )

    await connection.transaction({ timeout: 4321 })
    await connection.setScope(transaction!)
    await transaction!.query('SELECT 1')

    expect(query).toHaveBeenCalledTimes(2)
    expect(query).toHaveBeenNthCalledWith(2, 'SELECT 1', undefined)
    expect(
      query.mock.calls.filter(([statement]) => String(statement).includes('statement_timeout'))
    ).toHaveLength(1)
  })

  it('does not re-apply search_path after setScope consumes it', async () => {
    const { connection, query, getTransaction } = createMockTenantConnectionWithTransaction({
      isExternalPool: true,
    })

    await connection.transaction({ timeout: 4321 })
    await connection.setScope(getTransaction())
    await getTransaction().query('SELECT 1')

    expect(query).toHaveBeenCalledTimes(2)
    expect(query.mock.calls[0][0]).toContain("set_config('search_path', $11, true)")
    expect(query).toHaveBeenNthCalledWith(2, 'SELECT 1', undefined)
    expect(
      query.mock.calls.filter(([statement]) => String(statement).includes('search_path'))
    ).toHaveLength(1)
  })

  it('reuses scope JSON payloads across repeated scope applications', async () => {
    const pool = {
      acquire: vi.fn(),
    } as unknown as PgPoolStrategy
    const connection = new PgTenantConnection(
      asPoolLease(pool),
      createPoolStrategySettings({
        headers: {
          'x-test-header': 'test-value',
        },
        user: {
          jwt: 'jwt',
          payload: {
            role: 'authenticated',
            sub: 'user-id',
          },
        },
      })
    )
    const executor = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    } as unknown as DatabaseExecutor
    const stringifySpy = vi.spyOn(JSON, 'stringify')

    try {
      await connection.setScope(executor)
      await connection.setScope(executor)

      expect(stringifySpy).toHaveBeenCalledTimes(1)
      expect(stringifySpy).toHaveBeenCalledWith({
        role: 'authenticated',
        sub: 'user-id',
      })
    } finally {
      stringifySpy.mockRestore()
    }
  })
})

describe('PgPoolManager', () => {
  it('caches strategies without retaining request-scoped options', async () => {
    const manager = new PgPoolManager()
    const tenantId = 'pg-pool-manager-prune-test'
    const request = { operation: 'upload' }

    const strategy = manager.getPool(
      createPoolStrategySettings({
        tenantId,
        headers: { authorization: 'Bearer secret' },
        method: 'POST',
        path: '/object/bucket/key',
        operation: () => request.operation,
      })
    ).value

    try {
      const retained = (strategy as unknown as { options: Record<string, unknown> }).options
      expect(Object.keys(retained).sort()).toEqual([
        'clusterSize',
        'dbUrl',
        'isExternalPool',
        'maxConnections',
        'numWorkers',
        'tenantId',
      ])
    } finally {
      await manager.destroy(tenantId)
    }
  })
})

describe('PgPoolStrategy', () => {
  it('installs the Storage int8 parser globally when the direct adapter loads', () => {
    const parseInt8 = pgTypes.getTypeParser(20, 'text')

    expect(parseInt8('42')).toBe(42)
    expect(parseInt8('0x10')).toBe(16)
  })

  it('logs idle pg pool errors without rethrowing them', async () => {
    const strategy = new TestablePgPoolStrategy(createPoolStrategySettings())
    const logSpy = vi.spyOn(logSchema, 'warning').mockImplementation(() => undefined)

    try {
      const pool = strategy.getCurrentPoolForTest()
      const error = Object.assign(new Error('Connection terminated unexpectedly'), {
        client: { ssl: { ca: 'secret root cert' } },
      })

      expect(() => pool.emit('error', error, {})).not.toThrow()
      expect(logSpy).toHaveBeenCalledWith(
        logger,
        '[PgPoolStrategy] Idle pg client error',
        expect.objectContaining({
          type: 'db',
          tenantId: 'pg-pool-strategy-test',
          project: 'pg-pool-strategy-test',
          error,
        })
      )
    } finally {
      logSpy.mockRestore()
      await strategy.dispose('destroy')
    }
  })

  it('documents that pg-pool end does not service already queued acquires', async () => {
    const pool = new PgPool({
      Client: FakePgPoolClient,
      max: 1,
    } as unknown as ConstructorParameters<typeof PgPool>[0])
    const acquirePromises = Array.from({ length: 5 }, () => pool.connect())
    const checkedOutClient = await acquirePromises[0]

    await waitForDrainCheck()
    expect(pool.waitingCount).toBe(4)

    const endPromise = pool.end()
    checkedOutClient.release()
    await endPromise
    await waitForDrainCheck()

    expect(pool.ended).toBe(true)
    expect(pool.waitingCount).toBe(4)
    await expect(
      Promise.race([
        Promise.allSettled(acquirePromises.slice(1)).then(() => 'settled'),
        waitForDrainCheck().then(() => 'pending'),
      ])
    ).resolves.toBe('pending')
  })

  it('drains queued acquires on a real pg-pool before retiring it', async () => {
    const strategy = new TestablePgPoolStrategy(createPoolStrategySettings())
    const pool = new PgPool({
      Client: FakePgPoolClient,
      max: 1,
    } as unknown as ConstructorParameters<typeof PgPool>[0])
    const checkedOutClient = await pool.connect()
    const queuedConnect = pool.connect()

    await waitForDrainCheck()
    expect(pool.waitingCount).toBe(1)

    strategy.setCurrentPoolForTest(pool)
    const retirement = strategy.dispose('destroy')

    checkedOutClient.release()
    const queuedClient = await queuedConnect

    await expect(queuedClient.query('SELECT 1')).resolves.toEqual({ rows: [] })
    queuedClient.release()
    await retirement

    expect(pool.ended).toBe(true)
  })

  it('updates the current pg pool max after cluster-size rebalance', async () => {
    const strategy = new TestablePgPoolStrategy(createPoolStrategySettings())

    try {
      const originalPool = strategy.getCurrentPoolForTest()
      expect(originalPool.options.max).toBe(8)

      strategy.rebalance({ clusterSize: 4 })

      const rebalancedPool = strategy.getCurrentPoolForTest()
      expect(rebalancedPool).toBe(originalPool)
      expect(originalPool.ended).toBe(false)
      expect(rebalancedPool.options.max).toBe(2)
    } finally {
      await strategy.dispose('destroy')
    }
  })

  it('updates the current pg pool max after max-connections rebalance', async () => {
    const strategy = new TestablePgPoolStrategy(createPoolStrategySettings())

    try {
      const originalPool = strategy.getCurrentPoolForTest()
      expect(originalPool.options.max).toBe(8)

      strategy.rebalance({ maxConnections: 12 })

      const rebalancedPool = strategy.getCurrentPoolForTest()
      expect(rebalancedPool).toBe(originalPool)
      expect(originalPool.ended).toBe(false)
      expect(rebalancedPool.options.max).toBe(12)
    } finally {
      await strategy.dispose('destroy')
    }
  })

  it('keeps min at 0 across pg pool rebalances', async () => {
    const strategy = new TestablePgPoolStrategy(createPoolStrategySettings())

    try {
      const pool = strategy.getCurrentPoolForTest()
      expect(pool.options.min).toBe(0)

      strategy.rebalance({ maxConnections: 1 })
      expect(pool.options.min).toBe(0)

      strategy.rebalance({ maxConnections: 50 })
      expect(pool.options.min).toBe(0)

      strategy.rebalance({ clusterSize: 100 })
      expect(pool.options.min).toBe(0)
    } finally {
      await strategy.dispose('destroy')
    }
  })

  it('treats max-connections scale-down as a soft cap for checked-out pg clients', async () => {
    const strategy = new TestablePgPoolStrategy(createPoolStrategySettings())
    const pool = new PgPool({
      Client: FakePgPoolClient,
      max: 4,
    } as unknown as ConstructorParameters<typeof PgPool>[0])

    try {
      strategy.setCurrentPoolForTest(pool)
      const checkedOutClients = await Promise.all(Array.from({ length: 4 }, () => pool.connect()))
      expect(pool.totalCount).toBe(4)

      strategy.rebalance({ maxConnections: 1 })
      expect(pool.options.max).toBe(1)
      expect(pool.totalCount).toBe(4)

      const blockedAcquire = pool.connect()
      await waitForDrainCheck()
      expect(pool.waitingCount).toBe(1)

      checkedOutClients[0].release()
      const queuedClient = await blockedAcquire
      expect(pool.totalCount).toBe(4)

      queuedClient.release()
      checkedOutClients.slice(1).forEach((client) => client.release())
    } finally {
      await pool.end()
    }
  })

  it('serves queued pg acquires immediately after scaling max up', async () => {
    const strategy = new TestablePgPoolStrategy(createPoolStrategySettings())
    const pool = new PgPool({
      Client: FakePgPoolClient,
      max: 1,
    } as unknown as ConstructorParameters<typeof PgPool>[0])

    try {
      strategy.setCurrentPoolForTest(pool)
      const checkedOutClient = await pool.connect()
      const queuedConnect = pool.connect()

      await waitForDrainCheck()
      expect(pool.waitingCount).toBe(1)

      strategy.rebalance({ maxConnections: 2 })

      const queuedClient = await Promise.race([
        queuedConnect,
        waitForDrainCheck().then(() => undefined),
      ])
      expect(queuedClient).toBeDefined()
      expect(pool.waitingCount).toBe(0)

      checkedOutClient.release()
      queuedClient?.release()
    } finally {
      await pool.end()
    }
  })

  it('does not drain the current pg pool after rebalance', async () => {
    const strategy = new TestablePgPoolStrategy(createPoolStrategySettings())
    const error = new Error('pool drain failed')
    const originalPool = {
      options: {
        max: 8,
      },
      end: vi.fn().mockRejectedValue(error),
    } as unknown as Pool
    const logSpy = vi.spyOn(logSchema, 'warning').mockImplementation(() => undefined)

    try {
      strategy.setCurrentPoolForTest(originalPool)
      strategy.rebalance({ clusterSize: 2 })
      await new Promise((resolve) => setImmediate(resolve))

      expect(originalPool.end).not.toHaveBeenCalled()
      expect(originalPool.options.max).toBe(4)
      expect(logSpy).not.toHaveBeenCalledWith(
        logger,
        '[PgPoolStrategy] Failed to drain old pool during rebalance',
        expect.anything()
      )
    } finally {
      logSpy.mockRestore()
    }
  })

  it('keeps queued acquires on the current pg pool after rebalance', async () => {
    vi.useFakeTimers()
    const strategy = new TestablePgPoolStrategy(createPoolStrategySettings())
    const { pool, end, setStats } = createDrainablePoolForTest({
      waitingCount: 1,
      totalCount: 1,
      idleCount: 0,
    })

    try {
      strategy.setCurrentPoolForTest(pool)
      strategy.rebalance({ clusterSize: 2 })

      await vi.advanceTimersByTimeAsync(200)
      expect(end).not.toHaveBeenCalled()

      setStats({
        waitingCount: 0,
        totalCount: 1,
        idleCount: 0,
      })
      await vi.advanceTimersByTimeAsync(200)

      expect(pool.options.max).toBe(4)
      expect(end).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('waits for queued acquires to drain while retiring a pg pool', async () => {
    vi.useFakeTimers()
    const strategy = new TestablePgPoolStrategy(createPoolStrategySettings())
    const { pool, end, setStats } = createDrainablePoolForTest({
      waitingCount: 1,
      totalCount: 1,
      idleCount: 0,
    })

    try {
      strategy.setCurrentPoolForTest(pool)
      const retirement = strategy.dispose('destroy')

      await vi.advanceTimersByTimeAsync(200)
      expect(end).not.toHaveBeenCalled()

      setStats({
        waitingCount: 0,
        totalCount: 1,
        idleCount: 0,
      })
      await vi.advanceTimersByTimeAsync(200)

      await retirement
      expect(end).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('reports live pool stats until an eviction drain finishes', async () => {
    vi.useFakeTimers()
    const strategy = new TestablePgPoolStrategy(createPoolStrategySettings())
    const { pool, end, setStats } = createDrainablePoolForTest({
      waitingCount: 1,
      totalCount: 3,
      idleCount: 1,
    })

    try {
      strategy.setCurrentPoolForTest(pool)
      const disposal = strategy.dispose('evict')

      expect(strategy.getPoolStats()).toEqual({ used: 2, total: 3 })
      expect(() => strategy.acquire()).toThrow(
        expect.objectContaining({
          code: 'InternalError',
          message: 'Cannot acquire from a disposed pool strategy',
        })
      )

      setStats({ waitingCount: 0 })
      await vi.advanceTimersByTimeAsync(200)
      await disposal

      expect(end).toHaveBeenCalledTimes(1)
      expect(strategy.getPoolStats()).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not wait for idle-only pg pools to age out before ending them', async () => {
    const strategy = new TestablePgPoolStrategy(createPoolStrategySettings())
    const { pool, end } = createDrainablePoolForTest({
      waitingCount: 0,
      totalCount: 1,
      idleCount: 1,
    })

    strategy.setCurrentPoolForTest(pool)
    await strategy.dispose('destroy')

    expect(end).toHaveBeenCalledTimes(1)
  })

  it('logs residual work and ends the pg pool when drain timeout elapses', async () => {
    vi.useFakeTimers()

    const strategy = new TestablePgPoolStrategy(createPoolStrategySettings())
    const { pool, end } = createDrainablePoolForTest({
      waitingCount: 2,
      totalCount: 3,
      idleCount: 1,
    })
    const logSpy = vi.spyOn(logSchema, 'warning').mockImplementation(() => undefined)

    try {
      strategy.setCurrentPoolForTest(pool)
      const retirement = strategy.dispose('destroy')

      await vi.advanceTimersByTimeAsync(30_000)
      await retirement

      expect(end).toHaveBeenCalledTimes(1)
      const timeoutLog = logSpy.mock.calls.find(
        ([, message]) => message === '[PgPoolStrategy] Timed out waiting for pg pool to drain'
      )
      expect(timeoutLog).toBeDefined()
      const timeoutPayload = timeoutLog?.[2] as { metadata: string }

      expect(timeoutPayload).toMatchObject({
        type: 'db',
        tenantId: 'pg-pool-strategy-test',
        project: 'pg-pool-strategy-test',
        metadata: expect.any(String),
      })
      expect(JSON.parse(timeoutPayload.metadata)).toMatchObject({
        reason: 'destroy',
        drainTimeoutMs: 30_000,
        waitingCount: 2,
        activeCount: 2,
        totalCount: 3,
        idleCount: 1,
      })
    } finally {
      logSpy.mockRestore()
      vi.useRealTimers()
    }
  })

  it('identifies an eviction-driven pg pool drain timeout', async () => {
    vi.useFakeTimers()

    const strategy = new TestablePgPoolStrategy(createPoolStrategySettings())
    const { pool, end } = createDrainablePoolForTest({
      waitingCount: 1,
      totalCount: 1,
      idleCount: 0,
    })
    const logSpy = vi.spyOn(logSchema, 'warning').mockImplementation(() => undefined)

    try {
      strategy.setCurrentPoolForTest(pool)
      const disposal = strategy.dispose('evict')

      await vi.advanceTimersByTimeAsync(30_000)
      await disposal

      expect(end).toHaveBeenCalledTimes(1)
      const timeoutLog = logSpy.mock.calls.find(
        ([, message]) => message === '[PgPoolStrategy] Timed out waiting for pg pool to drain'
      )
      expect(timeoutLog).toBeDefined()
      expect(JSON.parse((timeoutLog?.[2] as { metadata: string }).metadata)).toMatchObject({
        reason: 'evict',
      })
    } finally {
      logSpy.mockRestore()
      vi.useRealTimers()
    }
  })
})

describe('PgPoolStrategy TLS session resumption wiring', () => {
  afterEach(() => {
    vi.resetModules()
  })

  function createDynamicTestablePgPoolStrategy(PgPoolStrategyCtor: typeof PgPoolStrategy) {
    return class DynamicTestablePgPoolStrategy extends PgPoolStrategyCtor {
      getCurrentPoolForTest(): Pool {
        return this.getPool()
      }
    }
  }

  it('installs the session getter, slot marker, and custom client when enabled with SSL', async () => {
    const { PgPoolStrategy: DynamicPgPoolStrategy } = await loadPgConnectionModuleWithConfig({
      databaseSSLRootCert: '<cert>',
      databaseTlsSessionResumption: true,
    })
    const { TlsSessionResumptionClient } = await import('./tls-session-resumption')
    const DynamicTestablePgPoolStrategy = createDynamicTestablePgPoolStrategy(DynamicPgPoolStrategy)
    const strategy = new DynamicTestablePgPoolStrategy(
      createPoolStrategySettings({
        dbUrl: 'postgres://postgres:postgres@1.2.3.4:5432/postgres',
      })
    )

    try {
      const pool = strategy.getCurrentPoolForTest()
      const ssl = pool.options.ssl as object

      expect(ssl).toBeDefined()
      expect(pool.options.Client).toBe(TlsSessionResumptionClient)

      const sessionDescriptor = Object.getOwnPropertyDescriptor(ssl, 'session')
      expect(sessionDescriptor?.get).toBeInstanceOf(Function)
      expect(sessionDescriptor?.enumerable).toBe(true)
      expect(sessionDescriptor?.configurable).toBe(true)
      expect(sessionDescriptor?.get?.call(ssl)).toBeUndefined()

      expect(Object.getOwnPropertySymbols(ssl)).toHaveLength(1)
      const tlsConnectOptions = Object.assign({}, ssl)
      expect(Object.getOwnPropertySymbols(tlsConnectOptions)).toHaveLength(0)
      expect(Object.prototype.hasOwnProperty.call(tlsConnectOptions, 'session')).toBe(true)
    } finally {
      await strategy.dispose('destroy')
    }
  })

  it('leaves SSL options untouched when the feature flag is disabled', async () => {
    const { PgPoolStrategy: DynamicPgPoolStrategy } = await loadPgConnectionModuleWithConfig({
      databaseSSLRootCert: '<cert>',
      databaseTlsSessionResumption: false,
    })
    const DynamicTestablePgPoolStrategy = createDynamicTestablePgPoolStrategy(DynamicPgPoolStrategy)
    const strategy = new DynamicTestablePgPoolStrategy(
      createPoolStrategySettings({
        dbUrl: 'postgres://postgres:postgres@1.2.3.4:5432/postgres',
      })
    )

    try {
      const pool = strategy.getCurrentPoolForTest()
      const ssl = pool.options.ssl as object

      expect(ssl).toBeDefined()
      expect(pool.options.Client).toBeUndefined()
      expect(Object.getOwnPropertyDescriptor(ssl, 'session')).toBeUndefined()
      expect(Object.getOwnPropertySymbols(ssl)).toHaveLength(0)
    } finally {
      await strategy.dispose('destroy')
    }
  })

  it('does not install the custom client when SSL settings are absent', async () => {
    const { PgPoolStrategy: DynamicPgPoolStrategy } = await loadPgConnectionModuleWithConfig({
      databaseSSLRootCert: undefined,
      databaseTlsSessionResumption: true,
    })
    const DynamicTestablePgPoolStrategy = createDynamicTestablePgPoolStrategy(DynamicPgPoolStrategy)
    const strategy = new DynamicTestablePgPoolStrategy(createPoolStrategySettings())

    try {
      const pool = strategy.getCurrentPoolForTest()

      expect(pool.options.ssl).toBeUndefined()
      expect(pool.options.Client).toBeUndefined()
    } finally {
      await strategy.dispose('destroy')
    }
  })
})

describe('PgTenantConnection payload serialization', () => {
  it('serializes only the payload of a connection that is scoped', async () => {
    const userToJSON = vi.fn(() => ({ role: 'authenticated', sub: 'user-1' }))
    const superUserToJSON = vi.fn(() => ({ role: 'service_role' }))
    const options = createPoolStrategySettings({
      user: {
        jwt: 'user-jwt',
        payload: { role: 'authenticated', sub: 'user-1', toJSON: userToJSON },
      },
      superUser: {
        jwt: 'service-jwt',
        payload: { role: 'service_role', toJSON: superUserToJSON },
      },
    })
    const pool = {} as unknown as PgPoolStrategy

    const parent = new PgTenantConnection(asPoolLease(pool), options)
    const superUser = parent.asSuperUser()

    expect(userToJSON).not.toHaveBeenCalled()
    expect(superUserToJSON).not.toHaveBeenCalled()

    const query = vi.fn().mockResolvedValue({ rows: [] })
    await superUser.setScope({ query } as unknown as DatabaseExecutor)

    expect(userToJSON).not.toHaveBeenCalled()
    expect(superUserToJSON).toHaveBeenCalledTimes(1)
    expect(query.mock.calls[0][0].values[4]).toBe('{"role":"service_role"}')
  })

  it('memoizes shared payload serializations and reuses parent headers for superuser scopes', async () => {
    const headers = { 'x-forwarded-host': 'tenant.example.com' }
    const userPayload = { role: 'authenticated', sub: 'user-1' }
    const superPayload = { role: 'service_role' }
    const expectedUserJson = JSON.stringify(userPayload)
    const expectedSuperJson = JSON.stringify(superPayload)
    const expectedHeadersJson = JSON.stringify(headers)
    const options = createPoolStrategySettings({
      headers,
      user: { jwt: 'user-jwt', payload: userPayload },
      superUser: { jwt: 'service-jwt', payload: superPayload },
    })
    const pool = {} as unknown as PgPoolStrategy

    const stringifySpy = vi.spyOn(JSON, 'stringify')
    try {
      const parent = new PgTenantConnection(asPoolLease(pool), options)
      const afterParent = stringifySpy.mock.calls.length

      const sibling = new PgTenantConnection(asPoolLease(pool), options)
      expect(sibling.role).toBe('authenticated')
      expect(stringifySpy.mock.calls.length).toBe(afterParent + 1)

      const superUser = parent.asSuperUser()
      const afterSuperUser = stringifySpy.mock.calls.length
      expect(afterSuperUser).toBe(afterParent + 1)

      const secondSuperUser = parent.asSuperUser()
      expect(stringifySpy.mock.calls.length).toBe(afterSuperUser)

      const parentQuery = vi.fn().mockResolvedValue({ rows: [] })
      await parent.setScope({ query: parentQuery } as unknown as DatabaseExecutor)
      const afterParentScope = stringifySpy.mock.calls.length
      const siblingQuery = vi.fn().mockResolvedValue({ rows: [] })
      await sibling.setScope({ query: siblingQuery } as unknown as DatabaseExecutor)
      expect(stringifySpy.mock.calls.length).toBe(afterParentScope)

      const superUserQuery = vi.fn().mockResolvedValue({ rows: [] })
      await superUser.setScope({ query: superUserQuery } as unknown as DatabaseExecutor)
      const afterSuperUserScope = stringifySpy.mock.calls.length
      const secondSuperUserQuery = vi.fn().mockResolvedValue({ rows: [] })
      await secondSuperUser.setScope({
        query: secondSuperUserQuery,
      } as unknown as DatabaseExecutor)
      expect(stringifySpy.mock.calls.length).toBe(afterSuperUserScope)
      expect(stringifySpy).toHaveBeenCalledWith(userPayload)
      expect(stringifySpy).toHaveBeenCalledWith(superPayload)

      const parentValues = parentQuery.mock.calls[0][0].values
      const superUserValues = superUserQuery.mock.calls[0][0].values
      expect(parentValues[4]).toBe(expectedUserJson)
      expect(superUserValues[4]).toBe(expectedSuperJson)
      expect(parentValues[5]).toBe(expectedHeadersJson)
      expect(superUserValues[5]).toBe(parentValues[5])
    } finally {
      stringifySpy.mockRestore()
    }
  })
})

describe('PgPoolStrategy executor reuse', () => {
  it('reuses one executor per physical pool and rebuilds it when the pool is replaced', () => {
    const strategy = new TestablePgPoolStrategy(createPoolStrategySettings())
    const poolA = { options: { max: 8 } } as unknown as Pool
    strategy.setCurrentPoolForTest(poolA)

    const first = strategy.acquire()
    expect(strategy.acquire()).toBe(first)

    strategy.rebalance({ maxConnections: 4 })
    expect(strategy.acquire()).toBe(first)

    const poolB = { options: { max: 8 } } as unknown as Pool
    strategy.setCurrentPoolForTest(poolB)
    const replacement = strategy.acquire()
    expect(replacement).not.toBe(first)
    expect(strategy.acquire()).toBe(replacement)
  })

  it('releases the cached executor pool when the strategy is retired', async () => {
    const strategy = new TestablePgPoolStrategy(createPoolStrategySettings())
    const pool = {
      options: { max: 8 },
      end: vi.fn().mockResolvedValue(undefined),
    } as unknown as Pool
    strategy.setCurrentPoolForTest(pool)

    strategy.acquire()
    expect(strategy.getCachedExecutorPoolForTest()).toBe(pool)

    await strategy.dispose('destroy')

    expect(strategy.getCachedExecutorPoolForTest()).toBeUndefined()
  })
})
