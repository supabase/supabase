import PostgresMetaInterface from '../common/PostgresMetaInterface'
import type { PostgresColumn } from '@supabase/postgres-meta'
import { IRootStore } from '../RootStore'

export default class ExtensionsStore extends PostgresMetaInterface<PostgresColumn> {
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

  // loadBySchema is not supported in this store
  async loadBySchema(schema: string) {
    return []
  }
}
