import { PostgresSchema } from '@supabase/postgres-meta'

import PostgresMetaInterface, { IPostgresMetaInterface } from '../common/PostgresMetaInterface'
import { IRootStore } from '../RootStore'
import { ResponseError } from 'types'

export interface ISchemaStore extends IPostgresMetaInterface<PostgresSchema> {
  getViews: (schema: string) => Promise<any | { error: ResponseError }>
}
export default class SchemaStore extends PostgresMetaInterface<PostgresSchema> {
  constructor(
    rootStore: IRootStore,
    dataUrl: string,
    headers?: {
      [prop: string]: any
    },
    options?: { identifier: string }
  ) {
    super(rootStore, dataUrl, headers, options)
  }

  async getViews(schema: string) {
    const query = `
      select schemaname as schema, viewname as name from pg_catalog.pg_views
      where schemaname = '${schema}'
      order by schemaname, viewname;
    `
    return await this.rootStore.meta.query(query)
  }
}
