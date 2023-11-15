import { API_URL } from 'lib/constants'
import { IRootStore } from '../RootStore'
import DatabaseStore, { IDatabaseStore } from './DatabaseStore'

export interface IAppStore {
  database: IDatabaseStore
}
export default class AppStore implements IAppStore {
  rootStore: IRootStore
  database: DatabaseStore

  baseUrl: string

  constructor(rootStore: IRootStore) {
    this.rootStore = rootStore
    this.baseUrl = API_URL || '/api'

    const headers: any = {}
    this.database = new DatabaseStore(rootStore, `${this.baseUrl}/database`, headers)
  }
}
