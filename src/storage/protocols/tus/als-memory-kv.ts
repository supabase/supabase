import { MetadataValue } from '@tus/s3-store'
import { KvStore } from '@tus/server'
import { AsyncLocalStorage } from 'async_hooks'

export class AlsMemoryKV implements KvStore<MetadataValue> {
  static localStorage = new AsyncLocalStorage<Map<string, MetadataValue>>()

  async delete(value: string): Promise<void> {
    AlsMemoryKV.localStorage.getStore()?.delete(value)
  }

  async get(value: string): Promise<MetadataValue | undefined> {
    return AlsMemoryKV.localStorage.getStore()?.get(value)
  }

  async set(key: string, value: MetadataValue): Promise<void> {
    AlsMemoryKV.localStorage.getStore()?.set(key, value)
  }
}
