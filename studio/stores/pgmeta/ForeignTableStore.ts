import type { PostgresTable } from '@supabase/postgres-meta'
import { get } from 'lib/common/fetch'
import { ResponseError } from 'types'
import PostgresMetaInterface, { IPostgresMetaInterface } from '../common/PostgresMetaInterface'
import { IRootStore } from '../RootStore'

export interface IForeignTableStore extends IPostgresMetaInterface<Partial<PostgresTable>> {
  loadById: (id: number | string) => Promise<Partial<PostgresTable> | { error: ResponseError }>
}

export default class ForeignTableStore extends PostgresMetaInterface<Partial<PostgresTable>> {
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

  async loadById(id: number | string) {
    try {
      const url = this.url.includes('?') ? `${this.url}&id=${id}` : `${this.url}?id=${id}`
      const response = await get(url, { headers: this.headers })
      if (response.error) throw response.error

      const data = response as Partial<PostgresTable>
      // @ts-ignore
      this.data[id] = data
      return data
    } catch (error: any) {
      return { error }
    }
  }
}
