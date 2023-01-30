import { makeAutoObservable } from 'mobx'
import { keyBy } from 'lodash'

import { uuidv4 } from 'lib/helpers'
import { get, post, patch, delete_ } from 'lib/common/fetch'
import { LogSqlSnippets, UserContent, UserContentMap } from 'types'
import { IRootStore } from '../RootStore'
import { API_URL } from 'lib/constants'

// [Joshen] This will be the new ProjectContentStore
// but use the one under the stores folder projectContentStore first while we transition

type CustomFilter = (content: UserContent) => boolean
export interface IProjectContentStore {
  isLoading: boolean
  isInitialized: boolean
  isLoaded: boolean
  savingState:
    | 'IDLE'
    | 'CREATING'
    | 'CREATING_FAILED'
    | 'UPDATING_REQUIRED'
    | 'UPDATING'
    | 'UPDATING_FAILED'
  error: any
  recentLogSqlSnippets: LogSqlSnippets.Content[]

  baseUrl: string
  projectRef?: string

  load: () => Promise<UserContentMap | undefined>
  loadPersistentData: () => Promise<void>
  save: (
    content: UserContent
  ) => Promise<{ data: UserContent; error: null } | { data: null; error: { message: string } }>
  create: (
    content: UserContent
  ) => Promise<{ data: UserContent; error: null } | { data: null; error: { message: string } }>
  createOptimistically: (content: UserContent) => { data: UserContent; error: null }
  list: (filter?: any) => any[]
  reports: (filter?: any) => any[]
  sqlSnippets: (filter?: any) => any[]
  savedLogSqlSnippets: (filter?: CustomFilter) => UserContent[]
  addRecentLogSqlSnippet: (snippet: Partial<LogSqlSnippets.Content>) => void
  clearRecentLogSqlSnippets: () => void
  setProjectRef: (ref?: string) => void
  update: (
    id: any,
    updates: any,
    type: UserContent['type']
  ) => Promise<
    | {
        data: UserContent
        error: null
      }
    | {
        data: null
        error: unknown
      }
  >
  updateSql: (
    id: any,
    updates: any
  ) => Promise<
    | {
        data: UserContent
        error: null
      }
    | {
        data: null
        error: unknown
      }
  >
  updateReport: (
    id: any,
    updates: any
  ) => Promise<
    | {
        data: UserContent
        error: null
      }
    | {
        data: null
        error: unknown
      }
  >

  del(id: any): Promise<{ data: boolean; error: unknown }>
  delOptimistically(id: string): { data: boolean; error: null }
  setUpdatingRequired(): void
}

export default class ProjectContentStore implements IProjectContentStore {
  rootStore: IRootStore

  STATES = {
    INITIAL: 'initial',
    LOADING: 'loading',
    ERROR: 'error',
    LOADED: 'loaded',
  }

  baseUrl: string
  localStorageKey: string
  recentLogSqlKey: string
  projectRef: string

  data: UserContentMap = {}
  recentLogSqlSnippets: LogSqlSnippets.Content[] = []

  state = this.STATES.INITIAL
  savingState:
    | 'IDLE'
    | 'CREATING'
    | 'CREATING_FAILED'
    | 'UPDATING_REQUIRED'
    | 'UPDATING'
    | 'UPDATING_FAILED'
  error = null

  constructor(rootStore: IRootStore, options: { projectRef: string }) {
    const { projectRef } = options
    this.projectRef = projectRef
    this.rootStore = rootStore
    this.localStorageKey = `project-content-${projectRef}`
    this.recentLogSqlKey = `${this.localStorageKey}-recent-log-sql`
    this.loadPersistentData()
    this.baseUrl = ``
    this.savingState = 'IDLE'
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
    this.data = keyBy(response.data, 'id')
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
      console.error('Failed to load project content', e.message)
      this.error = e
      this.state = ERROR
    }
  }

  async loadPersistentData() {
    this.loadRecentLogSqlSnippets()
  }

  async loadRemotePersistentData(userId: any) {
    const sqlSnippets = this.sqlSnippets((x: any) => x.owner_id === userId)
  }

  loadRecentLogSqlSnippets() {
    if (typeof window === 'undefined' || !window.localStorage) return
    this.recentLogSqlSnippets = JSON.parse(
      window.localStorage.getItem(this.recentLogSqlKey) || '[]'
    )
  }

  list(filter?: any) {
    const arr = Object.values(this.data)
    if (!!filter) {
      return arr.filter(filter).sort((a, b) => a.name.localeCompare(b.name))
    } else {
      return arr.sort((a, b) => a.name.localeCompare(b.name))
    }
  }

  byId(id: any) {
    return this.data[id]
  }

  reports(filter?: any) {
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

  sqlSnippets(filter?: any) {
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

  addRecentLogSqlSnippet(snippet: Partial<LogSqlSnippets.Content>) {
    if (typeof window === 'undefined') return
    const defaults: LogSqlSnippets.Content = {
      schema_version: '1',
      favorite: false,
      sql: '',
      content_id: '',
    }
    this.recentLogSqlSnippets.push({ ...defaults, ...snippet })
    ;(window as any).localStorage.setItem(
      this.recentLogSqlKey,
      JSON.stringify(this.recentLogSqlSnippets)
    )
  }

  clearRecentLogSqlSnippets() {
    if (typeof window === 'undefined') return
    this.recentLogSqlSnippets = []
    ;(window as any).localStorage.setItem(this.recentLogSqlKey, JSON.stringify([]))
  }

  savedLogSqlSnippets(filter?: CustomFilter) {
    let arr = Object.values(this.data) as UserContent[]
    let snippets = arr.filter((c) => c.type === 'log_sql')
    if (filter) {
      snippets = snippets.filter(filter)
    }
    return snippets.sort((a, b) => a.name.localeCompare(b.name))
  }

  /**
   * Creates a new content item, but does not update local store
   */
  async save(payload: UserContent) {
    try {
      this.savingState = 'CREATING'

      const headers = {
        'Content-Type': 'application/json',
      }
      const created = await post<UserContent>(this.baseUrl, payload, { headers })
      if (created.error) throw created.error

      this.savingState = 'IDLE'

      return { data: created as UserContent, error: null }
    } catch (error) {
      this.savingState = 'CREATING_FAILED'

      return { data: null, error: error as { message: string } }
    }
  }

  /**
   * Creates a new content item, and updates local store
   */
  async create(payload: UserContent) {
    const { data, error } = await this.save(payload)

    if (error) {
      return { data: null, error }
    }

    if (data && data['id']) {
      this.data[data['id']] = data
    }

    return { data: data as UserContent, error: null }
  }

  /**
   * Creates a new content item locally in store without saving to the server
   */
  createOptimistically(payload: UserContent) {
    const created = { ...payload, id: uuidv4() }

    this.data[created.id] = created

    return { data: created, error: null }
  }

  async update(id: any, updates: any, type?: UserContent['type']) {
    try {
      this.savingState = 'UPDATING'

      const headers = {
        'Content-Type': 'application/json',
      }
      let payload = {
        ...updates,
        id,
      }
      if (type) {
        payload.type = type
      }

      const url = `${this.baseUrl}?id=${id}`
      const updated = await patch<UserContent[]>(url, payload, { headers })
      if (updated.error) throw updated.error

      const localUpdate = { ...this.data[id], ...payload }
      this.data[id] = localUpdate
      this.savingState = 'IDLE'

      return { data: localUpdate, error: null }
    } catch (error) {
      this.savingState = 'UPDATING_FAILED'

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
      const url = `${this.baseUrl}?id=${id}`
      const deleted = await delete_(url, {}, { headers })
      if (deleted.error) throw deleted.error
      delete this.data[id]
      return { data: true, error: null }
    } catch (error) {
      return { data: false, error }
    }
  }

  delOptimistically(id: string) {
    delete this.data[id]
    return { data: true, error: null }
  }

  setUpdatingRequired() {
    if (this.savingState === 'IDLE' || this.savingState === 'UPDATING_FAILED') {
      this.savingState = 'UPDATING_REQUIRED'
    }
  }

  setProjectRef(ref?: string) {
    if (ref) {
      this.projectRef = ref
      this.baseUrl = `${API_URL}/projects/${ref}/content`
    }
  }
}
