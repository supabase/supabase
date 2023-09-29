import { ResponseError, SchemaView } from 'types'
import PostgresMetaInterface, { IPostgresMetaInterface } from '../common/PostgresMetaInterface'
import { IRootStore } from '../RootStore'
import { get } from 'lib/common/fetch'
import { PostgresColumn, PostgresView } from '@supabase/postgres-meta'

export interface IViewStore extends IPostgresMetaInterface<SchemaView> {
  loadById: (id: number | string) => Promise<Partial<SchemaView> | { error: ResponseError }>
}

export default class ViewStore extends PostgresMetaInterface<SchemaView> {
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

  // Customize ViewStore fetchData method to improve request performance
  async fetchData() {
    const headers = { 'Content-Type': 'application/json', ...this.headers }
    // load all views w/o columns info
    const _url = new URL(this.url)
    _url.searchParams.set('include_columns', 'false')
    const url = `${_url}`
    // load all columns
    const urlColumns = this.url.replace('/views', '/columns')
    const [viewsResponse, columnsResponse] = await Promise.all([
      get(url, { headers }),
      get(urlColumns, { headers }),
    ])
    if (viewsResponse.error) throw viewsResponse.error
    if (columnsResponse.error) throw columnsResponse.error

    // merge 2 response to create the final array
    const columnsByTableId = (columnsResponse as PostgresColumn[]).reduce((acc, curr) => {
      acc[curr.table_id] ??= []
      acc[curr.table_id].push(curr)
      return acc
    }, {} as Record<string, PostgresColumn[]>)
    const views: PostgresView[] = []
    viewsResponse.forEach((view: PostgresView) => {
      const columns = columnsByTableId[view.id]
      views.push({ ...view, columns })
    })

    this.setDataArray(views as any)
    return views as any
  }

  async loadById(id: number | string) {
    try {
      const url = `${this.url}?id=${id}`
      const response = await get(url, { headers: this.headers })
      if (response.error) throw response.error

      const data = response as Partial<SchemaView>
      // @ts-ignore
      this.data[id] = data
      return data
    } catch (error: any) {
      return { error }
    }
  }
}
