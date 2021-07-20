import { toJS } from 'mobx'
import PostgresMetaInterface from './MetaInterface'

export default class PublicationStore extends PostgresMetaInterface {
  constructor(rootStore, dataUrl, options) {
    super(rootStore, dataUrl, options)
  }

  /**
   * Will recreate a publication.
   * This is required if switching from "ALL TABLES" to individual tables.
   */
  async recreate(id) {
    let currentPublication = toJS(this.byId(id))
    let payload = {
      name: currentPublication.name,
      publish_insert: currentPublication.publish_insert,
      publish_update: currentPublication.publish_update,
      publish_delete: currentPublication.publish_delete,
      publish_truncate: currentPublication.publish_truncate,
    }
    if (currentPublication.tables == null) {
      // Previously was "ALL TABLES"
      payload.tables = []
    }
    const deleted = await this.del(id)
    if (deleted.error) {
      return deleted // return error
    }
    return await this.create(payload)
  }
}
