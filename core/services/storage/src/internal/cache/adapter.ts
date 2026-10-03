export type CacheLookupOptions = {
  recordMetrics?: boolean
}

export const CACHE_LOOKUP_WITHOUT_METRICS = Object.freeze<CacheLookupOptions>({
  recordMetrics: false,
})

export type CacheLookupOutcome = 'hit' | 'miss'

export type CacheStats = {
  entries: number
}

export interface Cache<K, V, SetOptions = undefined> {
  get(key: K, options?: CacheLookupOptions): V | undefined
  set(key: K, value: V, options?: SetOptions): void
  delete(key: K): boolean
}

export interface InspectableCache<K, V, SetOptions = undefined> extends Cache<K, V, SetOptions> {
  entries(): IterableIterator<[K, V]>
  values(): IterableIterator<V>
  getStats(): CacheStats
}

export interface Disposable {
  dispose(): void
}

export interface DisposableCache<K, V, SetOptions = undefined>
  extends InspectableCache<K, V, SetOptions>,
    Disposable {}
