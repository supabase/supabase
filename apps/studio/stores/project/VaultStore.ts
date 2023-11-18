import type { PostgresColumn } from '@supabase/postgres-meta'
import { Query } from 'components/grid'
import { makeAutoObservable } from 'mobx'
import { SchemaView, VaultSecret } from 'types'
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
  encryptColumn: (column: PostgresColumn, keyId: string) => any

  listSecrets: (filter?: any) => VaultSecret[]
  addSecret: (secret: Partial<VaultSecret>) => any
  updateSecret: (id: string, payload: Partial<VaultSecret>) => any
  deleteSecret: (id: string) => any
  fetchSecretValue: (id: string) => any
  listEncryptedColumns: (schema: string, table: string) => any
}

interface EncryptionKey {
  id: string
  key_id: number
  name: string
  comment: string
  created: string
  status: string
}

export default class VaultStore implements IVaultStore {
  rootStore: IRootStore

  STATES = {
    INITIAL: 'initial',
    LOADING: 'loading',
    ERROR: 'error',
    LOADED: 'loaded',
  }

  data: { keys: EncryptionKey[]; secrets: VaultSecret[] } = { keys: [], secrets: [] }
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

    const keysQuery = new Query()
      .from('key', 'pgsodium')
      .select('id,key_id,name,comment,created,status')
      .toSql()
    const keys = await this.rootStore.meta.query(keysQuery)
    if (!keys.error) vault.keys = keys

    const secretsQuery = new Query()
      .from('secrets', 'vault')
      .select('id,name,description,secret,key_id,created_at,updated_at')
      .toSql()
    const secrets = await this.rootStore.meta.query(secretsQuery)
    if (!secrets.error) vault.secrets = secrets

    this.data = vault
    return vault
  }

  async load() {
    let { LOADING, ERROR, LOADED } = this.STATES
    try {
      this.error = null
      if (this.state !== LOADED) this.state = LOADING
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
        ? await this.rootStore.meta.query(`select * from pgsodium.create_key(name := '${name}')`)
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

  async encryptColumn(column: PostgresColumn, keyId: string) {
    const query = `security label for pgsodium on column "${column.table}"."${column.name}" is 'ENCRYPT WITH KEY ID ${keyId} SECURITY INVOKER';`
    return await this.rootStore.meta.query(query)
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

  async addSecret(newSecret: Partial<VaultSecret>) {
    const { name, description, secret, key_id } = newSecret
    const query = new Query()
      .from('secrets', 'vault')
      .insert([{ name, description, secret, key_id }], { returning: true })
      .toSql()
    const res = await this.rootStore.meta.query(query)
    if (!res.error) {
      this.data.secrets = this.data.secrets.concat(res)
    }
    return res
  }

  async updateSecret(id: string, payload: Partial<VaultSecret>) {
    const query = new Query()
      .from('decrypted_secrets', 'vault')
      .update({ ...payload, updated_at: new Date().toISOString() }, { returning: true })
      .match({ id })
      .toSql()
    const res = await this.rootStore.meta.query(query)
    if (!res.error) {
      this.data.secrets = this.data.secrets.map((secret) => {
        if (secret.id === res[0].id) return res[0]
        else return secret
      })
    }
    return res
  }

  async deleteSecret(id: string) {
    const query = new Query().from('secrets', 'vault').delete().match({ id }).toSql()
    const res = await this.rootStore.meta.query(query)
    if (!res.error) {
      this.data.secrets = this.data.secrets.filter((secret) => secret.id !== id)
    }
    return res
  }

  async fetchSecretValue(id: string) {
    const query = new Query()
      .from('decrypted_secrets', 'vault')
      .select('decrypted_secret')
      .match({ id })
      .toSql()
    const res = await this.rootStore.meta.query(query)
    if (!res.error) {
      this.data.secrets = this.data.secrets.map((secret) => {
        if (secret.id === id) {
          return { ...secret, decryptedSecret: res[0].decrypted_secret }
        } else {
          return secret
        }
      })
    }
    return res[0].decrypted_secret
  }

  async listEncryptedColumns(schema: string, table: string) {
    if (!table) return []

    await this.rootStore.meta.views.loadBySchema(schema)
    const decryptedView = this.rootStore.meta.views.find(
      (view: SchemaView) => view.name === `decrypted_${table}`
    )
    if (!decryptedView) return []

    const encryptedColumns = await this.rootStore.meta.query(
      `SELECT column_name as name FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'decrypted_${table}' and column_name like 'decrypted_%'`
    )
    if (!encryptedColumns.error) {
      return encryptedColumns.map((column: any) => column.name.split('decrypted_')[1])
    } else {
      console.error('Error fetching encrypted columns', encryptedColumns.error)
      return []
    }
  }
}
