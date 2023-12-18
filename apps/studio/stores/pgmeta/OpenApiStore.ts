import { makeAutoObservable } from 'mobx'
import { get, isResponseOk } from 'lib/common/fetch'
import { IRootStore } from '../RootStore'
import { OpenAPIV2 } from 'openapi-types'

export interface IOpenApiStore {
  data?: {
    data: OpenAPIV2.Document
    tables: { [key: string]: any }[]
    functions: { [key: string]: any }[]
  }
  error: Error | null

  hasError: boolean
  isLoading: boolean

  load: () => void

  setUrl: (url: string) => void
  setHeaders: (headers: { [prop: string]: any }) => void
}
export default class OpenApiStore implements IOpenApiStore {
  STATES = {
    INITIAL: 'initial',
    LOADING: 'loading',
    ERROR: 'error',
    LOADED: 'loaded',
  }
  rootStore: IRootStore
  url: string
  error: Error | null = null
  state = this.STATES.INITIAL
  data?: {
    data: OpenAPIV2.Document
    tables: { [key: string]: any }[]
    functions: { [key: string]: any }[]
  }
  headers: any = {}

  constructor(
    rootStore: IRootStore,
    dataUrl: string,
    headers?: {
      [prop: string]: any
    }
  ) {
    this.rootStore = rootStore
    this.url = dataUrl
    this.headers = headers

    makeAutoObservable(this)
  }

  async fetchData() {
    const response = await get<OpenAPIV2.Document>(this.url)
    if (!isResponseOk(response)) {
      throw response.error
    }

    const tables = response.definitions
      ? Object.entries(response.definitions).map(([key, table]) => ({
          ...table,
          name: key,
          fields: Object.entries(table.properties || {}).map(([key, field]) => ({
            ...field,
            name: key,
          })),
        }))
      : []

    const functions = response.paths
      ? Object.entries(response.paths)
          .map(([path, value]: any) => ({
            ...value,
            path,
            name: path.replace('/rpc/', ''),
          }))
          .filter((x) => x.path.includes('/rpc'))
          .sort((a, b) => a.name.localeCompare(b.name))
      : []

    const payload = { data: response, tables, functions }
    this.setData(payload)
    return payload
  }

  async load() {
    let { LOADING, ERROR, LOADED } = this.STATES
    try {
      this.setError(null)
      this.setState(LOADING)
      await this.fetchData()
      this.setState(LOADED)
    } catch (e: any) {
      console.error('load e.message', e.message)
      this.setError(e)
      this.setState(ERROR)
    }
  }

  get hasError() {
    return this.state === this.STATES.ERROR
  }

  get isLoading() {
    return this.state === this.STATES.INITIAL || this.state === this.STATES.LOADING
  }

  setState(value: string) {
    this.state = value
  }

  setData(value: {
    data: OpenAPIV2.Document
    tables: { [key: string]: any }[]
    functions: { [key: string]: any }[]
  }) {
    this.data = value
  }

  setError(value: any) {
    this.error = value
  }

  setUrl(url: string) {
    this.url = url

    // if the url changes, we need to reset the state
    this.state = this.STATES.INITIAL
    this.data = undefined
    this.error = null
  }

  setHeaders(headers: { [prop: string]: any }) {
    this.headers = headers
  }
}
