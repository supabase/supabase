import { VERSION_SQL } from './sql/version.sql.js'
import { PostgresMetaResult, PostgresVersion } from './types.js'

export default class PostgresMetaVersion {
  query: (sql: string) => Promise<PostgresMetaResult<any>>

  constructor(query: (sql: string) => Promise<PostgresMetaResult<any>>) {
    this.query = query
  }

  async retrieve(): Promise<PostgresMetaResult<PostgresVersion>> {
    const { data, error } = await this.query(VERSION_SQL())
    if (error) {
      return { data, error }
    }
    return { data: data[0], error }
  }
}
