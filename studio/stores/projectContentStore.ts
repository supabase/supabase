import { makeObservable, action, observable, computed, toJS, makeAutoObservable } from 'mobx'
import { get, patch, post, delete_ } from 'lib/common/fetch'
import { keyBy, isEmpty } from 'lodash'
import { UserContent } from 'types'
import { API_URL } from 'lib/constants'

/**
 * Singleton
 * Usage:
 *   import { useProjectContentStore } from 'stores/userContent/projectContentStore'
 *   const contentStore = useProjectContentStore(projectRef)
 *   contentStore.load() // inside usEffect()
 * @deprecated use content store on RootStore instead.
 */
let store: any = null
let projectRef: any = null
export function useProjectContentStore(ref: any) {
  if (store === null || ref !== projectRef) {
    // set the current ref
    projectRef = ref
    const baseUrl = `${API_URL}/projects/${ref}/content`
    store = new ProjectContent(baseUrl)
  }
  return store
}

/**
 * Local type declarations
 */
interface UserContentMap {
  [key: string]: UserContent
}

/**
 * MobX Store
 * @deprecated
 */
export default class ProjectContent {
  STATES = {
    INITIAL: 'initial',
    LOADING: 'loading',
    ERROR: 'error',
    LOADED: 'loaded',
  }
  rootStore = null
  url = ''
  state = this.STATES.INITIAL
  data: UserContentMap = {}
  error = null

  /**
   * @param connectionString And encrypted database connection string to pass to the API
   */
  constructor(dataUrl: any) {
    this.url = dataUrl
    makeObservable(this, {
      state: observable,
      data: observable,
      list: observable,
      hasError: computed,
      isLoading: computed,
    })
  }

  async fetchData() {
    const headers = {
      'Content-Type': 'application/json',
    }
    const res = await get(this.url, { headers })
    if (res.error) {
      throw res.error
    }
    this.data = res.data.length > 0 ? keyBy(res.data, 'id') : res.data
    return res
  }

  async load() {
    let { LOADING, ERROR, LOADED } = this.STATES
    try {
      this.error = null
      this.state = LOADING
      await this.fetchData()
      this.state = LOADED
      return this.data
    } catch (e: any) {
      console.error('e.message', e.message)
      this.error = e
      this.state = ERROR
    }
  }

  get hasError() {
    return this.state === this.STATES.ERROR
  }

  get isLoading() {
    return this.state === this.STATES.INITIAL || this.state === this.STATES.LOADING
  }

  list(filter: any) {
    let arr = Object.values(this.data)
    if (!!filter) {
      return arr.filter(filter).sort((a, b) => a.name.localeCompare(b.name))
    } else {
      return arr.sort((a, b) => a.name.localeCompare(b.name))
    }
  }

  reports(filter: any) {
    let arr = Object.values(this.data)
    if (!!filter) {
      return arr
        .filter((x) => x.type == 'report')
        .filter(filter)
        .sort((a, b) => a.name.localeCompare(b.name))
    } else {
      return arr.filter((x) => x.type == 'report').sort((a, b) => a.name.localeCompare(b.name))
    }
  }

  sqlSnippets(filter: any) {
    let arr = Object.values(this.data)
    if (!!filter) {
      const arr_filtered = arr
        .filter((x) => x.type == 'sql')
        .filter(filter)
        .sort((a, b) => a.name.localeCompare(b.name))

      return arr_filtered
    } else {
      const arr_filtered = arr
        .filter((x) => x.type == 'sql')
        .sort((a, b) => a.name.localeCompare(b.name))

      return arr_filtered
    }
  }

  byId(id: any) {
    return this.data[id]
  }

  async create(payload: any) {
    try {
      const headers = {
        'Content-Type': 'application/json',
      }
      const created = await post(this.url, payload, { headers })
      if (created.error) throw created.error
      this.data[created['id']] = created
      return { data: created, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async update(id: any, updates: any, type: any) {
    try {
      const headers = {
        'Content-Type': 'application/json',
      }
      let payload = {
        ...updates,
        type,
        id,
      }
      const url = `${this.url}?id=${id}`
      const updated = await patch(url, payload, { headers })
      if (updated.error) throw updated.error
      this.data[id] = updated
      return { data: updated, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async updateSql(id: any, updates: any) {
    return this.update(id, updates, 'sql')
  }

  async updateReport(id: any, updates: any) {
    return this.update(id, updates, 'report')
  }

  async del(id: any) {
    try {
      const headers = {
        'Content-Type': 'application/json',
      }
      const url = `${this.url}?id=${id}`
      const deleted = await delete_(url, {}, { headers })
      if (deleted.error) throw deleted.error
      delete this.data[id]
      return { data: true, error: null }
    } catch (error) {
      return { data: false, error }
    }
  }
}
