import { ResponseError } from 'types'
import { API_URL } from 'lib/constants'
import { get } from 'lib/common/fetch'
import { IRootStore } from '../RootStore'
import { constructHeaders } from 'lib/api/apiHelpers'
import PostgresMetaInterface, { IPostgresMetaInterface } from '../common/PostgresMetaInterface'

export interface IDatabaseStore extends IPostgresMetaInterface<any> {
  getBackups: (
    projectRef: string
  ) => Promise<{ tierId: any; backups: any[] } | { error: ResponseError }>
  getPoolingConfiguration: (projectRef: string) => Promise<any | { error: ResponseError }>
}

export default class DatabaseStore extends PostgresMetaInterface<any> {
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

  async getBackups(projectRef: string) {
    try {
      const url = `${this.url}/${projectRef}/backups`
      const headers = constructHeaders(this.headers)
      const response = await get(url, { headers })
      if (response.error) throw response.error
      return response
    } catch (error: any) {
      return { error }
    }
  }

  async getPoolingConfiguration(projectRef: string) {
    try {
      // Need to use project ref -> shouldn;t need to pass it in via argument
      const url = `${API_URL}/props/pooling/${projectRef}/config`
      const response = await get(url, { headers: this.headers })
      if (response.error) throw response.error
      return response
    } catch (error: any) {
      return { error }
    }
  }
}
