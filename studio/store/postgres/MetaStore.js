import ColumnStore from './ColumnStore'
import ExtensionsStore from './ExtensionsStore'
import PublicationStore from './PublicationStore'
import TableStore from './TableStore'
import RolesStore from './RolesStore'
import PoliciesStore from './PoliciesStore'
import { post } from 'axios'


/**
 * Singleton instance of the Postgres MetaStore.
 */
let store = null
export function useMetaStore() {
  if (store === null) store = new MetaStore()
  return store
}

export default class MetaStore {
  connectionString = null
  baseUrl = null

  constructor() {
    this.baseUrl = `http://localhost:1337`
    let options = {}
    this.extensions = new ExtensionsStore(this, `${this.baseUrl}/extensions`, options)
    this.publications = new PublicationStore(this, `${this.baseUrl}/publications`, options)
    this.tables = new TableStore(this, `${this.baseUrl}/tables`, options)
    this.roles = new RolesStore(this, `${this.baseUrl}/roles`, options)
    this.columns = new ColumnStore(this, `${this.baseUrl}/columns`, options)
    this.policies = new PoliciesStore(this, `${this.baseUrl}/policies`, options)
  }

  /**
   * Sends a database query
   */
  async query(query) {
    // let headers = {}
    // // headers['Content-Type'] = 'application/json'
    // const url = `${this.baseUrl}/query`
    // const { data} = await post(url, payload).ca
    // if (data.error) {
    //   throw data.error
    // }
    // return data

    try {
      const url = `${this.baseUrl}/query`
      const { data } = await post(
        url,
        { query },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      return {data, error: null}
    } catch (err) {
      const error = err.response.data.error
      return { data: null, error }
    }

  }
}
