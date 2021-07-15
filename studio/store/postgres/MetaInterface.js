import { makeObservable, action, observable, computed, toJS } from 'mobx'
import { get, patch, post, delete as _delete } from 'axios'
import { keyBy } from 'lodash'

export default class PostgresMetaInterface {
  STATES = {
    INITIAL: 'initial',
    LOADING: 'loading',
    ERROR: 'error',
    LOADED: 'loaded',
  }
  rootStore = null
  url = null
  state = this.STATES.INITIAL
  data = {}
  error = null
  identifier = 'id'

  constructor(rootStore, dataUrl, { identifier = 'id' } = {}) {
    this.rootStore = rootStore
    this.url = dataUrl
    this.identifier = identifier
    makeObservable(this, {
      state: observable,
      data: observable,
      list: observable,
      count: computed,
      hasError: computed,
      isLoading: computed,
    })
  }

  async fetchData() {
    let headers = {}
    headers['Content-Type'] = 'application/json'
    const { data } = await get(this.url, { headers })
    if (data.error) {
      throw data.error
    }
    this.data = keyBy(data, this.identifier)
    return data
  }

  async load() {
    let { LOADING, ERROR, LOADED } = this.STATES
    try {
      this.error = null
      this.state = LOADING
      await this.fetchData()
      this.state = LOADED
      return this.data
    } catch (e) {
      console.log('e.message', e.message)
      this.error = e
      this.state = ERROR
    }
  }

  get hasError() {
    this.state === this.STATES.ERROR
  }

  get isLoading() {
    this.state === this.STATES.ERROR
  }

  get count() {
    return this.list.length
  }

  get selected() {
    if (this.selectedId) {
      return this.data.get(this.selectedId)
    } else {
      return null
    }
  }

  list(filter) {
    let arr = Object.values(this.data)
    if (!!filter) {
      return arr.filter(filter).sort((a, b) => a.name.localeCompare(b.name))
    } else {
      return arr.sort((a, b) => a.name.localeCompare(b.name))
    }
  }

  byId(id) {
    return this.data[id]
  }

  async create(payload) {
    try {
      let headers = {}
      headers['Content-Type'] = 'application/json'
      const created = await post(this.url, payload, { headers })
      if (created.error) throw created.error
      this.data[created[this.identifier]] = created
      return { data: created, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async update(id, updates) {
    try {
      let headers = {}
      headers['Content-Type'] = 'application/json'
      let payload = { ...updates, id }
      const url = `${this.url}?id=${id}`
      const updated = await patch(url, payload, { headers })
      if (updated.error) throw updated.error
      this.data[id] = updated
      return { data: updated, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async del(id) {
    try {
      let headers = {}
      headers['Content-Type'] = 'application/json'
      let deleted = await _delete(url, {}, { headers })
      if (deleted.error) throw deleted.error
      delete this.data[id]
      return { data: true, error: null }
    } catch (error) {
      return { data: false, error }
    }
  }
}
