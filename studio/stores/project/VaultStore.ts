import { Query } from 'components/grid'
import { makeAutoObservable } from 'mobx'
import { IRootStore } from '../RootStore'

const MOCK_SECRETS = [
  {
    key_id: '095f4bfe-f63c-420b-8849-f1e455ee3a02',
    description: 'Client access key for dashboard',
    created_at: '2022-11-01 06:43:48.492465',
    secret: '74d97ba2-f9e3-4a64-a032-8427cd6bd686', // encrypted secret value
  },
  {
    key_id: '095f4bfe-f63c-420b-8849-f1e455ee3a02',
    description: 'Secret key for server',
    created_at: '2022-11-20 06:43:48.492465',
    secret: '74d97ba2-f9e3-4a64-a032-8427cd6bd686',
  },
  {
    key_id: '57bfa919-e81b-4afc-a3b4-372981b2a39a',
    description: 'This is a bit more of a secret key',
    created_at: '2022-11-18 06:43:48.492465',
    secret: '74d97ba2-f9e3-4a64-a032-8427cd6bd686',
  },
  {
    key_id: '57bfa919-e81b-4afc-a3b4-372981b2a39a',
    description: undefined,
    created_at: '2022-11-05 06:43:48.492465',
    secret: '74d97ba2-f9e3-4a64-a032-8427cd6bd686',
  },
  {
    key_id: '57bfa919-e81b-4afc-a3b4-372981b2a39a',
    description: 'This is a pretty long description that Im testing if it should wrap or not',
    created_at: '2022-11-3 06:43:48.492465',
    secret: '74d97ba2-f9e3-4a64-a032-8427cd6bd686',
  },
]

export interface IVaultStore {
  isLoading: boolean
  isInitialized: boolean
  isLoaded: boolean
  error: any

  load: () => void
  listKeys: (filter?: any) => EncryptionKey[]
  addKey: (name?: string) => any
  deleteKey: (id: string) => any

  listSecrets: (filter?: any) => Secret[]
  addSecret: (name?: string) => any
  updateSecret: (payload: any) => any
  deleteSecret: (id: string) => any
}

interface EncryptionKey {
  id: string
  key_id: number
  comment: string
  created: string
  status: string
}

interface Secret {
  key_id: string
  description: string
  created_at: string
  secret: string
}

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

    const secrets: any = MOCK_SECRETS
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
    const res =
      name !== undefined
        ? await this.rootStore.meta.query(`select * from pgsodium.create_key('${name}')`)
        : await this.rootStore.meta.query(`select * from pgsodium.create_key()`)
    if (!res.error) {
      this.data.keys = this.data.keys.concat(res)
    }
    return res
  }

  async deleteKey(id: string) {
    const query = new Query().from('key', 'pgsodium').delete().match({ id }).toSql()
    const res = await this.rootStore.meta.query(query)
    if (!res.error) {
      this.data.keys = this.data.keys.filter((key) => key.id !== id)
    }
    return res
  }

  listSecrets(filter?: any) {
    const arr = this.data.secrets.slice()

    if (!!filter) {
      return arr
        .filter(filter)
        .sort((a: any, b: any) => Number(new Date(a.created_at)) - Number(new Date(b.created_at)))
    } else {
      return arr.sort(
        (a: any, b: any) => Number(new Date(a.created_at)) - Number(new Date(b.created_at))
      )
    }
  }

  async addSecret(name?: string) {}

  async updateSecret(payload: any) {}

  async deleteSecret(id: string) {}
}
