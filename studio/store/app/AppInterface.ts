import AppStore from './AppStore'
import { makeObservable, action, observable, computed, toJS } from 'mobx'
import axios, { AxiosError } from 'axios'
import { keyBy } from 'lodash'

const { get, patch, post, delete: _delete } = axios
const DEFAULT_HEADERS = { 'Content-Type': 'application/json' }

export default class PostgresMetaInterface<T> {
  STATES = {
    INITIAL: 'initial',
    LOADING: 'loading',
    ERROR: 'error',
    LOADED: 'loaded',
  }
  rootStore: AppStore
  url: string
  state = this.STATES.INITIAL
  data: { [key: string]: Partial<T> } = {}
  error: Error | null = null
  identifier = 'id'
  selectedId: string | null = null

  constructor(rootStore: AppStore, dataUrl: string, { identifier = 'id' } = {}) {
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
    let headers = DEFAULT_HEADERS
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
    } catch (e: any) {
      this.handleError(e)
      this.state = ERROR
    }
  }

  get hasError() {
    return this.state === this.STATES.ERROR
  }

  get isLoading() {
    return this.state === this.STATES.ERROR
  }

  get count() {
    return this.list.length
  }

  get selected() {
    if (this.selectedId && this.data) {
      return this.data[this.selectedId]
    } else {
      return null
    }
  }

  list() {
    return Object.values(this.data)
  }

  byId(id: string) {
    return this.data[id]
  }

  async create(payload: Partial<T>) {
    try {
      let headers = DEFAULT_HEADERS
      const { data: created } = await post(this.url, payload, { headers })
      this.data[created[this.identifier]] = created
      return { data: created, error: null }
    } catch (e: any) {
      this.handleError(e)
      return { data: null, error: e }
    }
  }

  async update(id: string, updates: Partial<T>) {
    try {
      let headers = DEFAULT_HEADERS
      let payload = { ...updates, id }
      const url = `${this.url}?id=${id}`
      const { data: updated } = await patch(url, payload, { headers })
      this.data[id] = updated
      return { data: updated, error: null }
    } catch (e: any) {
      this.handleError(e)
      return { data: null, error: e }
    }
  }

  async del(id: string) {
    try {
      let headers = DEFAULT_HEADERS
      const url = `${this.url}?id=${id}`
      let { data: deleted } = await _delete(url, { headers })
      delete this.data[id]
      return { data: deleted, error: null }
    } catch (e: any) {
      this.handleError(e)
      return { data: false, error: e }
    }
  }

  handleError(error: any) {
    this.error = error
    if (error.isAxiosError) {
      // Access to config, request, and response
      console.log('error', error.message)
    } else {
      // Just a stock error
      console.error('error', error.message)
    }
  }
}
