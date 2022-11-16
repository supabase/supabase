import { Query } from 'components/grid'
import { makeAutoObservable } from 'mobx'
import { IRootStore } from '../RootStore'

export interface IVaultStore {
  isLoading: boolean
  isInitialized: boolean
  isLoaded: boolean
  error: any

  load: () => void
  listKeys: () => any[]
  listSecrets: () => any[]
}

export default class VaultStore implements IVaultStore {
  rootStore: IRootStore

  STATES = {
    INITIAL: 'initial',
    LOADING: 'loading',
    ERROR: 'error',
    LOADED: 'loaded',
  }

  data: any = { keys: [], secrets: [] }
  state = this.STATES.INITIAL
  error = null

  constructor(rootStore: IRootStore) {
    this.rootStore = rootStore
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
    const vault = { keys: [], secrets: [] }

    const query = new Query()
      .from('key', 'pgsodium')
      .select('id,key_id,comment,created,status')
      .toSql()
    const keys = await this.rootStore.meta.query(query)
    if (!keys.error) vault.keys = keys

    const secrets: any = []
    if (!secrets.error) vault.secrets = secrets

    this.data = vault
    return vault
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
      console.error('Failed to load vault data', e.message)
      this.error = e
      this.state = ERROR
    }
  }

  listKeys(filter?: any) {
    const arr = this.data.keys.slice()
    if (!!filter) {
      return arr.filter(filter).sort((a: any, b: any) => b.key_id - a.key_id)
    } else {
      return arr.sort((a: any, b: any) => b.key_id - a.key_id)
    }
  }

  listSecrets(filter?: any) {
    const arr = this.data.secrets.slice()
    if (!!filter) {
      return arr.filter(filter)
    } else {
      return arr
    }
  }
}
