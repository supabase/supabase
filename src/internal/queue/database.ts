import EventEmitter from 'node:events'
import type { DatabaseExecutor } from '@internal/database/connection'
import { ERRORS } from '@internal/errors'
import pg from 'pg'
import { Db } from 'pg-boss'

export { quoteIdentifier } from '../database/postgres/sql'

export class QueueDB extends EventEmitter implements Db {
  opened = false
  isOurs = true
  events = {
    error: 'error',
  }
  protected config: pg.PoolConfig
  protected pool?: pg.Pool

  constructor(config: pg.PoolConfig) {
    super()
    this.config = config
  }

  async open() {
    this.pool = new pg.Pool({ ...this.config, min: 0 })
    this.pool.on('error', (error) => this.emit('error', error))

    this.opened = true
  }

  async close() {
    this.opened = false
    await this.pool?.end()
  }

  protected async useTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    if (!this.opened || !this.pool) {
      throw ERRORS.InternalError(undefined, `QueueDB not opened ${this.opened}`)
    }

    const client = await this.pool.connect()

    // Create a promise that rejects if the client emits an error
    // (e.g. connection lost, statement_timeout at the backend level)
    let clientError: Error | undefined
    const onError = (e: Error) => {
      clientError = e
    }
    client.on('error', onError)

    try {
      await client.query('BEGIN')

      if (this.config.statement_timeout && this.config.statement_timeout > 0) {
        await client.query(`SET LOCAL statement_timeout = ${this.config.statement_timeout}`)
      }

      const result = await fn(client)

      if (clientError) {
        throw clientError
      }

      await client.query('COMMIT')
      return result
    } catch (err) {
      const rollbackErr = await client.query('ROLLBACK').catch((e) => e as Error)

      const errors = [err as Error, clientError, rollbackErr].filter(
        (e): e is Error => e instanceof Error
      )

      if (errors.length === 1) throw errors[0]
      throw new AggregateError(errors, 'Queue transaction failed')
    } finally {
      client.off('error', onError)
      client.release(clientError)
    }
  }

  async executeSql(text: string, values: unknown[]): Promise<{ rows: unknown[] }> {
    if (this.opened && this.pool) {
      return this.useTransaction((client) => client.query(text, values))
    }

    throw ERRORS.InternalError(undefined, `QueueDB not opened ${this.opened} ${text}`)
  }
}

export class PgQueueDB extends EventEmitter implements Db {
  events = {
    error: 'error',
  }

  constructor(protected readonly db: DatabaseExecutor) {
    super()
  }

  async executeSql(text: string, values: unknown[]): Promise<{ rows: unknown[] }> {
    const result = await this.db.query({
      text,
      values: values.map((value) => (value === undefined ? null : value)),
    })

    return { rows: result.rows }
  }
}
