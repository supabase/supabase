import { action, computed, makeObservable, observable } from 'mobx'
import { get, patch, post, delete_ } from 'lib/common/fetch'
import { keyBy } from 'lodash'
import { IRootStore } from '../RootStore'
import { ResponseError } from 'types'

type DataKeys = number | string

export interface IPostgresMetaInterface<T> {
  error: Error | null

  count: number
  hasError: boolean
  isLoading: boolean
  isInitialized: boolean

  load: () => void
  loadBySchema: (schema: string) => Promise<T[] | { error: ResponseError }>
  create: (payload: any) => Promise<T | { error: ResponseError }>
  update: (id: number | string, updates: any) => Promise<T | { error: ResponseError }>
  del: (id: number | string, cascade?: boolean) => Promise<boolean | { error: ResponseError }>
  list: (filter?: any) => T[]
  find: (filter?: any) => T | undefined
  byId: (id: number | string) => T | undefined
  initialDataArray: (value: T[]) => void

  setUrl: (url: string) => void
  setHeaders: (headers: { [prop: string]: any }) => void
}

// [TODO] Need to refactor the logic for 'isInitialized'
// Should avoid page level "loaded" state like TableEditorLayout
// The logic should be - state should be INITIAL at first, and only
// taken as initialized after the first trigger of the load method.
// https://github.com/supabase/supabase/pull/5128#pullrequestreview-860706726
export default class PostgresMetaInterface<T> implements IPostgresMetaInterface<T> {
  STATES = {
    INITIAL: 'initial',
    LOADING: 'loading',
    ERROR: 'error',
    LOADED: 'loaded',
  }
  rootStore: IRootStore
  url: string
  error: Error | null = null
  identifier: string
  state = this.STATES.INITIAL
  data: { [key in DataKeys]: T } = {}
  headers: any = {}

  constructor(
    rootStore: IRootStore,
    dataUrl: string,
    headers?: {
      [prop: string]: any
    },
    options?: { identifier: string }
  ) {
    this.rootStore = rootStore
    this.url = dataUrl
    this.headers = headers
    this.identifier = options?.identifier ?? 'id'

    makeObservable(this, {
      state: observable,
      data: observable,
      error: observable,
      count: computed,
      hasError: computed,
      isLoading: computed,
      load: action,
      create: action,
      update: action,
      del: action,
      setState: action,
      setDataArray: action,
      setError: action,
    })
  }

  get count() {
    return Object.keys(this.data).length
  }

  get hasError() {
    return this.state === this.STATES.ERROR
  }

  get isLoading() {
    return this.state === this.STATES.INITIAL || this.state === this.STATES.LOADING
  }

  get isInitialized() {
    return this.state === this.STATES.LOADED || this.state === this.STATES.ERROR
  }

  async fetchData() {
    const headers = { 'Content-Type': 'application/json', ...this.headers }
    const response = await get<T[]>(this.url, { headers })
    if (response.error) throw response.error

    this.setDataArray(response)
    return response
  }

  async load() {
    let { LOADING, ERROR, LOADED } = this.STATES
    try {
      this.setError(null)
      this.setState(LOADING)
      await this.fetchData()
      this.setState(LOADED)
    } catch (e: any) {
      console.error('Load error message', e.message)
      this.setError(e)
      this.setState(ERROR)
    }
  }

  async loadBySchema(schema: string) {
    let { LOADING, ERROR, LOADED } = this.STATES
    try {
      this.setError(null)
      this.setState(LOADING)

      const url = this.url.includes('?')
        ? `${this.url}&included_schemas=${schema}`
        : `${this.url}?included_schemas=${schema}`
      const response = await get(url, { headers: this.headers })
      if (response.error) throw response.error

      const data = response as T[]
      const formattedData = keyBy(data, this.identifier)

      this.data = { ...this.data, ...formattedData }
      this.setState(LOADED)

      return data
    } catch (error: any) {
      console.error('Error in loadBySchema:', error.message)
      this.setError(error)
      this.setState(ERROR)
      return { error }
    }
  }

  initialDataArray(value: T[]) {
    if (this.state === this.STATES.INITIAL) {
      this.data = keyBy(value, this.identifier)
      this.state = this.STATES.LOADED
    }
  }

  setState(value: string) {
    this.state = value
  }

  setDataArray(value: T[]) {
    this.data = keyBy(value, this.identifier)
  }

  setError(value: any) {
    this.error = value
  }

  list(filter?: any) {
    let arr = Object.values(this.data)
    if (!!filter) {
      return arr.filter(filter).sort((a: any, b: any) => a.name.localeCompare(b.name))
    } else {
      return arr.sort((a: any, b: any) => a.name.localeCompare(b.name))
    }
  }

  find(filter?: any) {
    let arr = Object.values(this.data)
    if (!!filter) {
      return arr.find(filter)
    } else {
      return undefined
    }
  }

  byId(id: number | string) {
    return this.data[id]
  }

  async create(payload: any) {
    try {
      const headers = { 'Content-Type': 'application/json', ...this.headers }
      const response = await post(this.url, payload, { headers })
      if (response.error) throw response.error

      const data = response as T
      const identity = response[this.identifier]
      this.data[identity] = data
      return data
    } catch (error: any) {
      return { data: null, error }
    }
  }

  async update(id: number | string, updates: any) {
    try {
      const headers = { 'Content-Type': 'application/json', ...this.headers }
      let payload = { ...updates, id }
      const url = `${this.url}?id=${id}`
      const response = await patch<T>(url, payload, { headers })
      if (response.error) throw response.error

      this.data[id] = response
      return response
    } catch (error: any) {
      return { error }
    }
  }

  async del(id: number | string, cascade: boolean = false) {
    try {
      const headers = { 'Content-Type': 'application/json', ...this.headers }
      const url = cascade ? `${this.url}?id=${id}&cascade=${cascade}` : `${this.url}?id=${id}`
      const response = await delete_<T>(url, {}, { headers })
      if (response.error) throw response.error

      delete this.data[id]
      return true
    } catch (error: any) {
      return { error }
    }
  }

  setUrl(url: string) {
    this.url = url

    // if the url changes, we need to reset the state
    this.state = this.STATES.INITIAL
    this.data = {}
    this.error = null
  }

  setHeaders(headers: { [prop: string]: any }) {
    this.headers = headers
  }
}
