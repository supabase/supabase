import { ResponseError, SchemaView } from 'types'
import PostgresMetaInterface, { IPostgresMetaInterface } from '../common/PostgresMetaInterface'
import { IRootStore } from '../RootStore'
import { get } from 'lib/common/fetch'

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
