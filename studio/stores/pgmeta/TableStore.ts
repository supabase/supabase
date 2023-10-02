import { action, makeObservable } from 'mobx'
import type { PostgresColumn, PostgresTable } from '@supabase/postgres-meta'

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

  // Customize TableStore fetchData method to improve request performance
  async fetchData() {
    const headers = { 'Content-Type': 'application/json', ...this.headers }
    // load all tables w/o columns info
    const urlTables = this.url.includes('?')
      ? `${this.url}&include_columns=false`
      : `${this.url}?include_columns=false`
    // load all columns
    const urlColumns = this.url.replace('/tables', '/columns')
    const [tablesResponse, columnsResponse] = await Promise.all([
      get(urlTables, { headers }),
      get(urlColumns, { headers }),
    ])
    if (tablesResponse.error) throw tablesResponse.error
    if (columnsResponse.error) throw columnsResponse.error

    // merge 2 response to create the final array
    const columnsByTableId = (columnsResponse as PostgresColumn[]).reduce((acc, curr) => {
      acc[curr.table_id] ??= []
      acc[curr.table_id].push(curr)
      return acc
    }, {} as Record<string, PostgresColumn[]>)
    const tables: PostgresTable[] = []
    tablesResponse.forEach((table: PostgresTable) => {
      const columns = columnsByTableId[table.id]
      tables.push({ ...table, columns })
    })

    this.setDataArray(tables)
    return tables as any
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
