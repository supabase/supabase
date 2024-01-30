import { makeAutoObservable } from 'mobx'
import { keyBy } from 'lodash'

import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { IRootStore } from '../RootStore'

export interface IProjectBackupsStore {
  isLoading: boolean
  isInitialized: boolean
  isLoaded: boolean
  error: any

  baseUrl: string
  projectRef: string
  configuration: any

  load: () => void
  list: () => any[]
  setProjectRef: (ref?: string) => void
}

export default class ProjectBackupsStore implements IProjectBackupsStore {
  rootStore: IRootStore

  STATES = {
    INITIAL: 'initial',
    LOADING: 'loading',
    ERROR: 'error',
    LOADED: 'loaded',
  }

  baseUrl: string
  projectRef: string
  data: any = []
  configuration: any = {}

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

  async fetchData() {
    const headers = {
      'Content-Type': 'application/json',
    }
    const response = await get(this.baseUrl, { headers })
    if (response.error) {
      throw response.error
    }

    const { backups, ...configuration } = response
    this.data = keyBy(backups, 'id')
    this.configuration = configuration

    return backups
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
      console.error('Failed to load project backups', e.message)
      this.error = e
      this.state = ERROR
    }
  }

  list(filter?: any) {
    const arr = Object.values(this.data)
    if (!!filter) {
      return arr.filter(filter).sort((a: any, b: any) => b.id - a.id)
    } else {
      return arr.sort((a: any, b: any) => b.id - a.id)
    }
  }

  setProjectRef(ref?: string) {
    if (ref) {
      this.projectRef = ref
      this.baseUrl = `${API_URL}/database/${ref}/backups`
    }
  }
}
