import { LRUCache as BaseLruCache } from 'lru-cache'
import type { CacheLookupOptions, DisposableCache } from './adapter'
import { monitorCache, withCacheEvictionMetrics } from './monitoring'
import type { CacheName } from './names'

export type LruCacheSetOptions<K extends {}, V extends {}> = BaseLruCache.SetOptions<K, V, unknown>

export type LruCacheOptions<K extends {}, V extends {}> = BaseLruCache.Options<K, V, unknown> & {
  purgeStaleIntervalMs?: number
  ttlJitterRatio?: number
}

export const DEFAULT_CACHE_PURGE_STALE_INTERVAL_MS = 1000 * 60 // 1 minute
export const DEFAULT_CACHE_TTL_RESOLUTION_MS = 1000 * 30 // 30 seconds
export const DEFAULT_CACHE_TTL_JITTER_RATIO = 0.1

function withDefaultTtlResolution<K extends {}, V extends {}>(
  options: LruCacheOptions<K, V>
): LruCacheOptions<K, V> {
  if (!options.ttl || options.ttlResolution !== undefined) {
    return options
  }

  return {
    ...options,
    ttlResolution: DEFAULT_CACHE_TTL_RESOLUTION_MS,
  }
}

export class LruCache<K extends {}, V extends {}>
  implements DisposableCache<K, V, LruCacheSetOptions<K, V>>
{
  private readonly cache: BaseLruCache<K, V>
  private readonly purgeStaleTimer?: ReturnType<typeof setInterval>
  private readonly ttlJitterRatio?: number
  private readonly defaultTtl?: number

  constructor(options: LruCacheOptions<K, V>) {
    const { purgeStaleIntervalMs, ttlJitterRatio, ...cacheOptions } = options

    if (ttlJitterRatio !== undefined && !(ttlJitterRatio >= 0 && ttlJitterRatio < 1)) {
      throw new Error(`ttlJitterRatio must be in [0, 1), got ${ttlJitterRatio}`)
    }
    this.ttlJitterRatio = ttlJitterRatio
    this.defaultTtl = cacheOptions.ttl

    this.cache = new BaseLruCache<K, V>({
      ...cacheOptions,
    })

    if (purgeStaleIntervalMs) {
      this.purgeStaleTimer = setInterval(() => {
        this.cache.purgeStale()
      }, purgeStaleIntervalMs)
      this.purgeStaleTimer.unref?.()
    }
  }

  get(key: K, options?: CacheLookupOptions): V | undefined {
    return this.cache.get(key)
  }

  set(key: K, value: V, options?: LruCacheSetOptions<K, V>): void {
    const ttl = options?.ttl ?? this.defaultTtl
    if (this.ttlJitterRatio && ttl && Number.isFinite(ttl)) {
      options = {
        ...options,
        ttl: Math.max(1, Math.round(ttl * (1 - this.ttlJitterRatio * Math.random()))),
      }
    }
    this.cache.set(key, value, options)
  }

  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  entries(): IterableIterator<[K, V]> {
    return this.cache.entries()
  }

  values(): IterableIterator<V> {
    return this.cache.values()
  }

  getStats() {
    return {
      entries: this.cache.size,
    }
  }

  dispose(): void {
    if (this.purgeStaleTimer) {
      clearInterval(this.purgeStaleTimer)
    }
  }
}

export function createLruCache<K extends {}, V extends {}>(
  options: LruCacheOptions<K, V>
): LruCache<K, V>
export function createLruCache<K extends {}, V extends {}>(
  name: CacheName,
  options: LruCacheOptions<K, V>
): DisposableCache<K, V, LruCacheSetOptions<K, V>>
export function createLruCache<K extends {}, V extends {}>(
  nameOrOptions: CacheName | LruCacheOptions<K, V>,
  maybeOptions?: LruCacheOptions<K, V>
) {
  if (typeof nameOrOptions !== 'string') {
    return new LruCache(withDefaultTtlResolution(nameOrOptions))
  }

  const cacheName = nameOrOptions
  const options = withDefaultTtlResolution(maybeOptions as LruCacheOptions<K, V>)
  const cache = new LruCache<K, V>({
    ...options,
    disposeAfter: withCacheEvictionMetrics(cacheName, options.disposeAfter),
  })

  return monitorCache(cacheName, cache)
}
