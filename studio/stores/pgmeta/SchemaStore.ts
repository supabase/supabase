import { PostgresSchema } from '@supabase/postgres-meta'

import PostgresMetaInterface, { IPostgresMetaInterface } from '../common/PostgresMetaInterface'
import { IRootStore } from '../RootStore'
import { ResponseError } from 'types'

export interface ISchemaStore extends IPostgresMetaInterface<PostgresSchema> {
  getViews: (schema: string) => Promise<any | { error: ResponseError }>
  getEnums: () => Promise<any | { error: ResponseError }>
  // getEnumValues: (id: string) => Promise<any | { error: ResponseError }>
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

  async getEnums() {
    const query = `SELECT "oid" as "id", "typname" as "name" FROM pg_type WHERE typcategory = 'E';`
    return await this.rootStore.meta.query(query)
  }

  // [Joshen] I realised we probably don't need this (yet) for table editor
  // async getEnumValues(id: string) {
  //   const query = `SELECT enumlabel FROM pg_enum WHERE enumtypid = ${id};`
  //   return await this.rootStore.meta.query(query)
  // }
}
