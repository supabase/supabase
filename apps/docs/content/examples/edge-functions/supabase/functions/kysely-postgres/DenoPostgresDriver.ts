import {
  CompiledQuery,
  DatabaseConnection,
  Driver,
  PostgresCursorConstructor,
  QueryResult,
  TransactionSettings,
} from 'https://esm.sh/kysely@0.23.4'
import { freeze, isFunction } from 'https://esm.sh/kysely@0.23.4/dist/esm/util/object-utils.js'
import { extendStackTrace } from 'https://esm.sh/kysely@0.23.4/dist/esm/util/stack-trace-utils.js'
import { Pool, PoolClient } from 'https://deno.land/x/postgres@v0.17.0/mod.ts'

export interface PostgresDialectConfig {
  pool: Pool | (() => Promise<Pool>)
  cursor?: PostgresCursorConstructor
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>
}

const PRIVATE_RELEASE_METHOD = Symbol()

export class PostgresDriver implements Driver {
  readonly #config: PostgresDialectConfig
  readonly #connections = new WeakMap<PoolClient, DatabaseConnection>()
  #pool?: Pool

  constructor(config: PostgresDialectConfig) {
    this.#config = freeze({ ...config })
  }

  async init(): Promise<void> {
    this.#pool = isFunction(this.#config.pool) ? await this.#config.pool() : this.#config.pool
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    const client = await this.#pool!.connect()
    let connection = this.#connections.get(client)

    if (!connection) {
      connection = new PostgresConnection(client, {
        cursor: this.#config.cursor ?? null,
      })
      this.#connections.set(client, connection)

      // The driver must take care of calling `onCreateConnection` when a new
      // connection is created. The `pg` module doesn't provide an async hook
      // for the connection creation. We need to call the method explicitly.
      if (this.#config?.onCreateConnection) {
        await this.#config.onCreateConnection(connection)
      }
    }

    return connection
  }

  async beginTransaction(
    connection: DatabaseConnection,
    settings: TransactionSettings
  ): Promise<void> {
    if (settings.isolationLevel) {
      await connection.executeQuery(
        CompiledQuery.raw(`start transaction isolation level ${settings.isolationLevel}`)
      )
    } else {
      await connection.executeQuery(CompiledQuery.raw('begin'))
    }
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('commit'))
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('rollback'))
  }

  async releaseConnection(connection: PostgresConnection): Promise<void> {
    connection[PRIVATE_RELEASE_METHOD]()
  }

  async destroy(): Promise<void> {
    if (this.#pool) {
      const pool = this.#pool
      this.#pool = undefined
      await pool.end()
    }
  }
}

interface PostgresConnectionOptions {
  cursor: PostgresCursorConstructor | null
}

class PostgresConnection implements DatabaseConnection {
  #client: PoolClient
  #options: PostgresConnectionOptions

  constructor(client: PoolClient, options: PostgresConnectionOptions) {
    this.#client = client
    this.#options = options
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    try {
      const result = await this.#client.queryObject<O>(compiledQuery.sql, [
        ...compiledQuery.parameters,
      ])

      if (
        result.command === 'INSERT' ||
        result.command === 'UPDATE' ||
        result.command === 'DELETE'
      ) {
        const numAffectedRows = BigInt(result.rowCount || 0)

        return {
          // TODO: remove.
          numUpdatedOrDeletedRows: numAffectedRows,
          numAffectedRows,
          rows: result.rows ?? [],
        } as any
      }

      return {
        rows: result.rows ?? [],
      }
    } catch (err) {
      throw extendStackTrace(err, new Error())
    }
  }

  async *streamQuery<O>(
    _compiledQuery: CompiledQuery,
    chunkSize: number
  ): AsyncIterableIterator<QueryResult<O>> {
    if (!this.#options.cursor) {
      throw new Error(
        "'cursor' is not present in your postgres dialect config. It's required to make streaming work in postgres."
      )
    }

    if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
      throw new Error('chunkSize must be a positive integer')
    }

    // stream not available
    return null
  }

  [PRIVATE_RELEASE_METHOD](): void {
    this.#client.release()
  }
}
