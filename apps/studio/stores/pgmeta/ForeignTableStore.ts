import type { PostgresColumn, PostgresTable } from '@supabase/postgres-meta'
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

  // Customize ForeignTableStore fetchData method to improve request performance
  async fetchData() {
    const headers = { 'Content-Type': 'application/json', ...this.headers }
    // load all foreign tables w/o columns info
    const _url = new URL(this.url)
    _url.searchParams.set('include_columns', 'false')
    const url = `${_url}`
    // load all columns
    const urlColumns = this.url.replace('/foreign-tables', '/columns')
    const [foreignTablesResponse, columnsResponse] = await Promise.all([
      get(url, { headers }),
      get(urlColumns, { headers }),
    ])
    if (foreignTablesResponse.error) throw foreignTablesResponse.error
    if (columnsResponse.error) throw columnsResponse.error

    // merge 2 response to create the final array
    const columnsByTableId = (columnsResponse as PostgresColumn[]).reduce((acc, curr) => {
      acc[curr.table_id] ??= []
      acc[curr.table_id].push(curr)
      return acc
    }, {} as Record<string, PostgresColumn[]>)
    const foreignTables: PostgresTable[] = []
    foreignTablesResponse.forEach((foreignTable: PostgresTable) => {
      const columns = columnsByTableId[foreignTable.id]
      foreignTables.push({ ...foreignTable, columns })
    })

    this.setDataArray(foreignTables)
    return foreignTables as any
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
