import PostgresMetaInterface from '../common/PostgresMetaInterface'
import type { PostgresType } from '@supabase/postgres-meta'
import { IRootStore } from '../RootStore'

export default class TypesStore extends PostgresMetaInterface<PostgresType> {
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
}
