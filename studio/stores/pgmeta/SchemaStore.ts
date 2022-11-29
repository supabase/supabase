import { observable, makeObservable } from 'mobx'
import { PostgresSchema } from '@supabase/postgres-meta'

import PostgresMetaInterface, { IPostgresMetaInterface } from '../common/PostgresMetaInterface'
import { IRootStore } from '../RootStore'
import { ResponseError } from 'types'

interface SchemaView {
  schema: string
  name: string
}

export interface ISchemaStore extends IPostgresMetaInterface<PostgresSchema> {
  views: SchemaView[]
  loadViews: (schema: string) => Promise<any | { error: ResponseError }>
}
export default class SchemaStore extends PostgresMetaInterface<PostgresSchema> {
  views: SchemaView[]

  constructor(
    rootStore: IRootStore,
    dataUrl: string,
    headers?: {
      [prop: string]: any
    },
    options?: { identifier: string }
  ) {
    super(rootStore, dataUrl, headers, options)
    makeObservable(this, {
      views: observable,
    })
    this.views = []
  }

  async loadViews(schema: string) {
    const query = `
      select schemaname as schema, viewname as name from pg_catalog.pg_views
      where schemaname = '${schema}'
      order by schemaname, viewname;
    `
    const views = await this.rootStore.meta.query(query)
    this.views = views
    return views
  }
}
