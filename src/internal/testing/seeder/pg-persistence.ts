import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg'
import { quoteIdentifier } from '../../database/postgres/sql'
import { Persistence } from './persistence'

export class PgPersistence implements Persistence {
  private pool: Pool
  private trx: PoolClient | null = null

  constructor(poolConfig: PoolConfig | string | Pool) {
    this.pool =
      poolConfig instanceof Pool
        ? poolConfig
        : new Pool(typeof poolConfig === 'string' ? { connectionString: poolConfig } : poolConfig)
  }

  async insertBatch<T extends object>(table: string, records: T[]): Promise<void> {
    for (const record of records) {
      const entries = Object.entries(record)
      await this.query(
        `
          INSERT INTO ${quoteIdentifier(table)} (${entries.map(([column]) => quoteIdentifier(column)).join(', ')})
          VALUES (${entries.map((_, index) => `$${index + 1}`).join(', ')})
        `,
        entries.map(([, value]) => value)
      )
    }
  }

  async beginTransaction(): Promise<void> {
    this.trx = await this.pool.connect()
    await this.trx.query('BEGIN')
  }

  async commitTransaction(): Promise<void> {
    if (this.trx) {
      await this.trx.query('COMMIT')
      this.trx.release()
      this.trx = null
    }
  }

  async rollbackTransaction(): Promise<void> {
    if (this.trx) {
      await this.trx.query('ROLLBACK')
      this.trx.release()
      this.trx = null
    }
  }

  async rawQuery(query: string, bindings: object[] = []): Promise<QueryResult> {
    return this.query(query, bindings)
  }

  async destroy(): Promise<void> {
    await this.pool.end()
  }

  private query(query: string, bindings: unknown[] = []) {
    return this.trx ? this.trx.query(query, bindings) : this.pool.query(query, bindings)
  }
}
