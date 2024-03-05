import { makeObservable } from 'mobx'

import { post } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'

import type { IRootStore } from '../RootStore'

export interface IMetaStore {
  projectRef?: string
  connectionString?: string

  query: (value: string) => Promise<any | { error: ResponseError }>
  validateQuery: (value: string) => Promise<any | { error: ResponseError }>
  formatQuery: (value: string) => Promise<any | { error: ResponseError }>

  setProjectDetails: (details: { ref: string; connectionString?: string }) => void
}
export default class MetaStore implements IMetaStore {
  rootStore: IRootStore

  projectRef: string
  connectionString?: string
  baseUrl: string
  headers: { [prop: string]: any }

  constructor(rootStore: IRootStore, options: { projectRef: string; connectionString?: string }) {
    const { projectRef, connectionString } = options
    this.rootStore = rootStore
    this.projectRef = projectRef
    this.baseUrl = `${API_URL}/pg-meta/${projectRef}`

    this.headers = {}
    if (IS_PLATFORM && connectionString) {
      this.connectionString = connectionString
      this.headers['x-connection-encrypted'] = connectionString
    }

    makeObservable(this, {})
  }

  /**
   * Sends a database query
   */
  async query(value: string) {
    try {
      const headers: any = { 'Content-Type': 'application/json' }
      if (this.connectionString) headers['x-connection-encrypted'] = this.connectionString
      const url = `${this.baseUrl}/query`
      const response = await post(url, { query: value }, { headers })
      if (response.error) throw response.error

      return response
    } catch (error: any) {
      return { error }
    }
  }

  async validateQuery(value: string) {
    try {
      const headers: any = { 'Content-Type': 'application/json' }
      if (this.connectionString) headers['x-connection-encrypted'] = this.connectionString
      const url = `${this.baseUrl}/query/validate`
      const response = await post(url, { query: value }, { headers })
      if (response.error) throw response.error

      return response
    } catch (error: any) {
      return { error }
    }
  }

  async formatQuery(value: string) {
    try {
      const headers: any = { 'Content-Type': 'application/json' }
      if (this.connectionString) headers['x-connection-encrypted'] = this.connectionString
      const url = `${this.baseUrl}/query/format`
      const response = await post(url, { query: value }, { headers })
      if (response.error) throw response.error

      return response
    } catch (error: any) {
      return { error }
    }
  }

  setProjectDetails({ ref, connectionString }: { ref: string; connectionString?: string }) {
    this.projectRef = ref
    this.baseUrl = `${API_URL}/pg-meta/${ref}`
    if (IS_PLATFORM && connectionString) {
      this.connectionString = connectionString
      this.headers['x-connection-encrypted'] = connectionString
    }
  }
}
