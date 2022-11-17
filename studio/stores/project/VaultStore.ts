import { Query } from 'components/grid'
import { makeAutoObservable } from 'mobx'
import { IRootStore } from '../RootStore'

export interface IVaultStore {
  isLoading: boolean
  isInitialized: boolean
  isLoaded: boolean
  error: any

  load: () => void
  listKeys: (filter?: any) => EncryptionKey[]
  addKey: (name?: string) => any
  deleteKey: (id: string) => any

  listSecrets: () => Secret[]
  addSecret: (name?: string) => any
  deleteSecret: (id: string) => any
}

interface EncryptionKey {
  id: string
  key_id: number
  comment: string
  created: string
  status: string
}

interface Secret {}

export default class VaultStore implements IVaultStore {
  rootStore: IRootStore

  STATES = {
    INITIAL: 'initial',
    LOADING: 'loading',
    ERROR: 'error',
    LOADED: 'loaded',
  }

  data: { keys: EncryptionKey[]; secrets: Secret[] } = { keys: [], secrets: [] }
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
      return arr
        .filter(filter)
        .sort((a: any, b: any) => Number(new Date(a.created)) - Number(new Date(b.created)))
    } else {
      return arr.sort((a: any, b: any) => Number(new Date(a.created)) - Number(new Date(b.created)))
    }
  }

  async addKey(name?: string) {
    if (name) return await this.rootStore.meta.query(`select * from pgsodium.create_key('${name}')`)
    else return await this.rootStore.meta.query(`select * from pgsodium.create_key()`)
  }

  async deleteKey(id: string) {
    const query = new Query().from('key', 'pgsodium').delete().match({ id }).toSql()
    return await this.rootStore.meta.query(query)
  }

  listSecrets(filter?: any) {
    const arr = this.data.secrets.slice()
    if (!!filter) {
      return arr.filter(filter)
    } else {
      return arr
    }
  }

  async addSecret(name?: string) {}

  async deleteSecret(id: string) {}
}
