import { IMetaService } from '.'
import {
  getColumnsSql,
  getPrimaryKeysSql,
  getRelationshipsSql,
  getTableSql,
} from './SqlMetaService.sqls'

export class SqlMetaService implements IMetaService {
  constructor(protected onSqlQuery: (query: string) => Promise<{ data?: any; error?: any }>) {}

  async fetchInfo(name: string, schema?: string | undefined) {
    const sql = getTableSql(schema ?? 'public', name)
    const { data, error } = await this.onSqlQuery(sql)
    if (error) {
      return { error }
    } else {
      if (data?.length == 1) {
        return { data: data[0] }
      } else {
        return { error: { message: 'fetch table info failed' } }
      }
    }
  }
  async fetchColumns(name: string, schema?: string | undefined) {
    const sql = getColumnsSql(schema ?? 'public', name)
    const { data, error } = await this.onSqlQuery(sql)
    if (error) {
      return { error }
    } else {
      return { data }
    }
  }
  async fetchPrimaryKeys(name: string, schema?: string | undefined) {
    const sql = getPrimaryKeysSql(schema ?? 'public', name)
    const { data, error } = await this.onSqlQuery(sql)
    if (error) {
      return { error }
    } else {
      return { data }
    }
  }
  async fetchRelationships(name: string, schema?: string | undefined) {
    const sql = getRelationshipsSql(schema ?? 'public', name)
    const { data, error } = await this.onSqlQuery(sql)
    if (error) {
      return { error }
    } else {
      return { data }
    }
  }
}
