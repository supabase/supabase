import { logger, logSchema } from '@internal/monitoring'
import { Pool, PoolConfig } from 'pg'
import { getConfig } from '../../config'
import type { DatabaseTransactionalExecutor } from './connection'
import { PgPoolExecutor } from './pg-connection'
import { attachPoolErrorHandler } from './postgres/pool-errors'

function buildMultitenantPgPoolConfig(config: ReturnType<typeof getConfig>): PoolConfig {
  const {
    databaseApplicationName,
    multitenantDatabasePoolUrl,
    multitenantDatabaseUrl,
    multitenantMaxConnections,
  } = config

  const connectionString = multitenantDatabasePoolUrl || multitenantDatabaseUrl
  const poolSize = multitenantDatabasePoolUrl
    ? multitenantMaxConnections * 10
    : multitenantMaxConnections

  return {
    connectionString,
    connectionTimeoutMillis: 5000,
    application_name: databaseApplicationName,
    min: 0,
    max: poolSize,
    idleTimeoutMillis: 5000,
  }
}

type PgPoolState = {
  readonly pool: Pool
  readonly executor: PgPoolExecutor
  readonly config: ReturnType<typeof getConfig>
  readonly configSignature: string
}

class MultitenantPgPoolOwner {
  private state?: PgPoolState
  private closePromise?: Promise<void>
  private shutdownPromise?: Promise<void>

  getPool(): Pool {
    return this.getState().pool
  }

  getExecutor(): PgPoolExecutor {
    return this.getState().executor
  }

  private getState(): PgPoolState {
    if (this.shutdownPromise) {
      throw new Error('MultitenantPgPool is shut down')
    }

    if (this.closePromise) {
      throw new Error('MultitenantPgPool is closing')
    }

    const currentConfig = getConfig()

    if (this.state && this.state.config === currentConfig) {
      return this.state
    }

    const poolConfig = buildMultitenantPgPoolConfig(currentConfig)
    const configSignature = getPoolConfigSignature(poolConfig)

    if (this.state && this.state.configSignature === configSignature) {
      // Same connection params, only the config object reference rotated.
      // Refresh the cached reference so subsequent calls hit the fast path.
      this.state = { ...this.state, config: currentConfig }
      return this.state
    }

    const oldState = this.state
    const pool = attachPoolErrorHandler(new Pool(poolConfig), (error) => {
      logSchema.warning(logger, '[MultitenantPg] Idle pg client error', {
        type: 'db',
        error,
      })
    })
    this.state = {
      pool,
      executor: new PgPoolExecutor(pool),
      config: currentConfig,
      configSignature,
    }

    if (oldState) {
      void oldState.pool.end().catch((error) => {
        logSchema.warning(logger, '[MultitenantPg] Failed to close replaced pg pool', {
          type: 'db',
          error,
        })
      })
    }

    return this.state
  }

  // Transient, lazily rebuilt if accessed after close.
  close(): Promise<void> {
    if (this.closePromise) {
      return this.closePromise
    }

    if (this.shutdownPromise) {
      return this.shutdownPromise
    }

    const pool = this.state?.pool
    this.state = undefined

    if (!pool) {
      return Promise.resolve()
    }

    this.closePromise = pool.end().finally(() => {
      this.closePromise = undefined
    })
    return this.closePromise
  }

  // Terminal, pool is gone and cannot be re-created without a restart.
  shutdown(): Promise<void> {
    if (this.shutdownPromise) {
      return this.shutdownPromise
    }

    if (this.closePromise) {
      this.shutdownPromise = this.closePromise
      return this.shutdownPromise
    }

    const state = this.state
    this.state = undefined

    this.shutdownPromise = state ? state.pool.end() : Promise.resolve()
    return this.shutdownPromise
  }
}

function getPoolConfigSignature(config: PoolConfig): string {
  return JSON.stringify({
    application_name: config.application_name,
    connectionString: config.connectionString,
    connectionTimeoutMillis: config.connectionTimeoutMillis,
    idleTimeoutMillis: config.idleTimeoutMillis,
    max: config.max,
    min: config.min,
  })
}

const multitenantPgPoolOwner = new MultitenantPgPoolOwner()

export const multitenantPgExecutor: DatabaseTransactionalExecutor = {
  async query(statement, options) {
    return multitenantPgPoolOwner.getExecutor().query(statement, options)
  },
  async beginTransaction(options) {
    return multitenantPgPoolOwner.getExecutor().beginTransaction(options)
  },
}

export function closeMultitenantPg(): Promise<void> {
  return multitenantPgPoolOwner.close()
}

export function shutdownMultitenantPg(): Promise<void> {
  return multitenantPgPoolOwner.shutdown()
}
