import { CONFIG_SQL } from './sql/config.sql.js'
import { PostgresMetaResult, PostgresConfig } from './types.js'

export default class PostgresMetaConfig {
  query: (sql: string) => Promise<PostgresMetaResult<any>>

  constructor(query: (sql: string) => Promise<PostgresMetaResult<any>>) {
    this.query = query
  }

  async list({
    limit,
    offset,
  }: {
    limit?: number
    offset?: number
  } = {}): Promise<PostgresMetaResult<PostgresConfig[]>> {
    const sql = CONFIG_SQL({ limit, offset })
    return await this.query(sql)
  }
}
