import { action, makeObservable } from 'mobx'
import type { PostgresTable } from '@supabase/postgres-meta'

import PostgresMetaInterface, { IPostgresMetaInterface } from '../common/PostgresMetaInterface'
import { IRootStore } from '../RootStore'
import { get } from 'lib/common/fetch'
import { ResponseError } from 'types'

export interface ITableStore extends IPostgresMetaInterface<PostgresTable> {
  loadById: (id: number | string) => Promise<Partial<PostgresTable> | { error: ResponseError }>
}

export default class TableStore extends PostgresMetaInterface<PostgresTable> {
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
      loadById: action,
    })
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
