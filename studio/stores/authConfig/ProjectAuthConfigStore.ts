import { makeAutoObservable, toJS } from 'mobx'
import { UserContentMap } from 'types'
import { IRootStore } from '../RootStore'
import { API_URL } from 'lib/constants'
import { get, patch } from 'lib/common/fetch'

export interface IProjectAuthConfigStore {
  isLoading: boolean
  isInitialized: boolean
  isLoaded: boolean
  error: any
  config: any

  baseUrl: string
  projectRef: string

  load: () => void
  update: (updates: any) => Promise<any>
  setProjectRef: (ref?: string) => void
}

export default class ProjectAuthConfigStore implements IProjectAuthConfigStore {
  rootStore: IRootStore
  STATES = {
    INITIAL: 'initial',
    LOADING: 'loading',
    ERROR: 'error',
    LOADED: 'loaded',
  }
  baseUrl: string
  projectRef: string
  // @ts-ignore
  data: UserContentMap = []

  state = this.STATES.INITIAL
  error = null

  constructor(rootStore: IRootStore, options: { projectRef: string }) {
    const { projectRef } = options
    this.projectRef = projectRef
    this.rootStore = rootStore
    this.baseUrl = ``
    makeAutoObservable(this)
  }

  get isLoading() {
    return this.state === this.STATES.INITIAL || this.state === this.STATES.LOADING
  }

  get isInitialized() {
    return this.state !== this.STATES.INITIAL
  }

  get isLoaded() {
    return this.state === this.STATES.LOADED
  }

  get config() {
    return this.data
  }

  async fetchData() {
    const headers = {
      'Content-Type': 'application/json',
    }
    const response = await get(this.baseUrl, { headers })
    if (response.error) {
      throw response.error
    }
    this.data = response
    return response
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
      console.error('Failed to load auth config', e.message)
      this.error = e
      this.state = ERROR
    }
  }

  byId(id: any) {
    return toJS(this.data)[id]
  }

  async update(updates: any) {
    try {
      const headers = {
        'Content-Type': 'application/json',
      }
      let payload = {
        ...updates,
      }
      const url = `${this.baseUrl}`
      const updated = await patch(url, payload, { headers })
      if (updated.error) throw updated.error
      this.data = updated
      return { data: updated, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  setProjectRef(ref?: string) {
    if (ref) {
      this.projectRef = ref
      this.baseUrl = `${API_URL}/auth/${ref}/config`
    }
  }
}
