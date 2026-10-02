import {
  cacheEntries,
  isMetricEnabled,
  meter,
  recordCacheEviction,
  recordCacheRequest,
} from '@internal/monitoring/metrics'
import type { Attributes, BatchObservableCallback } from '@opentelemetry/api'
import type { CacheLookupOptions, Disposable, DisposableCache, InspectableCache } from './adapter'
import type { CacheName } from './names'

type CacheDisposeHandler<K, V, R extends string> = (value: V, key: K, reason: R) => void

const CACHE_OCCUPANCY_OBSERVABLES = [cacheEntries]

function isDisposable(value: unknown): value is Disposable {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'dispose' in value &&
      typeof (value as { dispose?: unknown }).dispose === 'function'
  )
}

export function withCacheEvictionMetrics<K, V, R extends string>(
  cacheName: CacheName,
  dispose?: CacheDisposeHandler<K, V, R>
): CacheDisposeHandler<K, V, R> {
  return (value, key, reason) => {
    // Track capacity-pressure evictions only.
    // TTL expiry/removal reasons are excluded on purpose.
    if (reason === 'evict') {
      recordCacheEviction(cacheName)
    }

    dispose?.(value, key, reason)
  }
}

class MonitoredCache<K, V, SetOptions = undefined> implements DisposableCache<K, V, SetOptions> {
  private disposed = false
  private readonly cacheAttributes: Attributes
  private readonly observeOccupancy: BatchObservableCallback = (observer) => {
    if (!isMetricEnabled('cache_entries')) {
      return
    }

    const stats = this.cache.getStats()

    observer.observe(cacheEntries, stats.entries, this.cacheAttributes)
  }

  constructor(
    private readonly name: CacheName,
    private readonly cache: InspectableCache<K, V, SetOptions>
  ) {
    this.cacheAttributes = { cache: name }
    meter.addBatchObservableCallback(this.observeOccupancy, CACHE_OCCUPANCY_OBSERVABLES)
  }

  get(key: K, options?: CacheLookupOptions): V | undefined {
    if (options?.recordMetrics === false) {
      return this.cache.get(key, options)
    }

    const value = this.cache.get(key, options)
    recordCacheRequest(this.name, value === undefined ? 'miss' : 'hit')

    return value
  }

  set(key: K, value: V, options?: SetOptions): void {
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
    return this.cache.getStats()
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true
    meter.removeBatchObservableCallback(this.observeOccupancy, CACHE_OCCUPANCY_OBSERVABLES)

    if (isDisposable(this.cache)) {
      this.cache.dispose()
    }
  }
}

export function monitorCache<K, V, SetOptions = undefined>(
  cacheName: CacheName,
  cache: InspectableCache<K, V, SetOptions>
): DisposableCache<K, V, SetOptions> {
  return new MonitoredCache(cacheName, cache)
}
