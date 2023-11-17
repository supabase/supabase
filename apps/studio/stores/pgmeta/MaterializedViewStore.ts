import { PostgresColumn, PostgresMaterializedView } from '@supabase/postgres-meta'
import { ResponseError } from 'types'
import PostgresMetaInterface, { IPostgresMetaInterface } from '../common/PostgresMetaInterface'
import { IRootStore } from '../RootStore'
import { get } from 'lib/common/fetch'

export interface IMaterializedViewStore extends IPostgresMetaInterface<PostgresMaterializedView> {
  loadById: (
    id: number | string
  ) => Promise<Partial<PostgresMaterializedView> | { error: ResponseError }>
}

export default class MaterializedViewStore extends PostgresMetaInterface<PostgresMaterializedView> {
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

  // Customize MaterializedViewStore fetchData method to improve request performance
  async fetchData() {
    const headers = { 'Content-Type': 'application/json', ...this.headers }
    // load all materialized views w/o columns info
    const _url = new URL(this.url)
    _url.searchParams.set('include_columns', 'false')
    const url = `${_url}`
    // load all columns
    const urlColumns = this.url.replace('/materialized-views', '/columns')
    const [materializedViewsResponse, columnsResponse] = await Promise.all([
      get(url, { headers }),
      get(urlColumns, { headers }),
    ])
    if (materializedViewsResponse.error) throw materializedViewsResponse.error
    if (columnsResponse.error) throw columnsResponse.error

    // merge 2 response to create the final array
    const columnsByTableId = (columnsResponse as PostgresColumn[]).reduce((acc, curr) => {
      acc[curr.table_id] ??= []
      acc[curr.table_id].push(curr)
      return acc
    }, {} as Record<string, PostgresColumn[]>)
    const materializedViews: PostgresMaterializedView[] = []
    materializedViewsResponse.forEach((materializedView: PostgresMaterializedView) => {
      const columns = columnsByTableId[materializedView.id]
      materializedViews.push({ ...materializedView, columns })
    })

    this.setDataArray(materializedViews)
    return materializedViews as any
  }

  async loadById(id: number | string) {
    try {
      const url = `${this.url}?id=${id}`
      const response = await get(url, { headers: this.headers })
      if (response.error) throw response.error

      const data = response as Partial<PostgresMaterializedView>
      // @ts-ignore
      this.data[id] = data
      return data
    } catch (error: any) {
      return { error }
    }
  }
}
