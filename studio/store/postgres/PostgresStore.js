import ColumnStore from './ColumnStore'
import ExtensionsStore from './ExtensionsStore'
import PublicationStore from './PublicationStore'
import TableStore from './TableStore'
import RolesStore from './RolesStore'
import PoliciesStore from './PoliciesStore'
import { post } from 'axios'

export default class MetaStore {
  rootStore = null
  connectionString = null
  metaUrl = null

  constructor(rootStore, metaUrl) {
    this.rootStore = rootStore
    this.metaUrl = metaUrl || `http://localhost:1337`
    let options = {}
    this.extensions = new ExtensionsStore(this, `${this.metaUrl}/extensions`, options)
    this.publications = new PublicationStore(this, `${this.metaUrl}/publications`, options)
    this.tables = new TableStore(this, `${this.metaUrl}/tables`, options)
    this.roles = new RolesStore(this, `${this.metaUrl}/roles`, options)
    this.columns = new ColumnStore(this, `${this.metaUrl}/columns`, options)
    this.policies = new PoliciesStore(this, `${this.metaUrl}/policies`, options)
  }

  /**
   * Sends a database query
   */
  async query(query) {
    try {
      const url = `${this.metaUrl}/query`
      const { data } = await post(
        url,
        { query },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      return { data, error: null }
    } catch (err) {
      const error = err.response.data.error
      return { data: null, error }
    }
  }
}
