import { ResponseError } from 'types'
import PostgresMetaInterface, { IPostgresMetaInterface } from '../common/PostgresMetaInterface'
import { IRootStore } from '../RootStore'

export interface IPublicationStore extends IPostgresMetaInterface<any> {
  recreate: (id: any) => Promise<Partial<any> | { error: ResponseError }>
}

export default class PublicationStore extends PostgresMetaInterface<any> {
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

  /**
   * Will recreate a publication.
   * This is required if switching from "ALL TABLES" to individual tables.
   */
  async recreate(id: any, tables: string[] = []) {
    let currentPublication = this.byId(id)
    let payload: any = {
      name: currentPublication.name,
      publish_insert: currentPublication.publish_insert,
      publish_update: currentPublication.publish_update,
      publish_delete: currentPublication.publish_delete,
      publish_truncate: currentPublication.publish_truncate,
    }
    if (currentPublication.tables === null) {
      // Previously was "ALL TABLES"
      payload.tables = tables
    }
    const deleted: any = await this.del(id)
    if (deleted.error) {
      return deleted // return error
    }
    return await this.create(payload)
  }
}
