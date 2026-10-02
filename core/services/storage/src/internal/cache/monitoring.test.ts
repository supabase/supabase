import {
  CACHE_LOOKUP_WITHOUT_METRICS,
  createLruCache,
  DEFAULT_CACHE_PURGE_STALE_INTERVAL_MS,
  TENANT_CONFIG_CACHE_NAME,
} from '@internal/cache'
import * as metrics from '@internal/monitoring/metrics'
import { captureBatchObserver } from '@internal/testing/metrics'
import { LRUCache as BaseLruCache } from 'lru-cache'
import { vi } from 'vitest'
import { monitorCache } from './monitoring'

describe('cache telemetry helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  test('records cache hits and misses', () => {
    const recordSpy = vi.spyOn(metrics, 'recordCacheRequest')
    const cache = createLruCache(TENANT_CONFIG_CACHE_NAME, {
      max: 2,
    })

    cache.set('hit', { ok: true })

    expect(cache.get('hit')).toEqual({ ok: true })
    expect(cache.get('miss')).toBeUndefined()

    expect(recordSpy).toHaveBeenNthCalledWith(1, TENANT_CONFIG_CACHE_NAME, 'hit')
    expect(recordSpy).toHaveBeenNthCalledWith(2, TENANT_CONFIG_CACHE_NAME, 'miss')
  })

  test('can read without recording cache request metrics', () => {
    const recordSpy = vi.spyOn(metrics, 'recordCacheRequest')
    const cache = createLruCache(TENANT_CONFIG_CACHE_NAME, {
      max: 2,
    })

    cache.set('hit', { ok: true })

    expect(cache.get('hit', CACHE_LOOKUP_WITHOUT_METRICS)).toEqual({ ok: true })
    expect(cache.get('miss', CACHE_LOOKUP_WITHOUT_METRICS)).toBeUndefined()

    expect(recordSpy).not.toHaveBeenCalled()
  })

  test('recordMetrics false skips telemetry without changing the lookup path', () => {
    const recordSpy = vi.spyOn(metrics, 'recordCacheRequest')
    const inner = createLruCache<string, { ok: boolean }>({
      max: 2,
    })
    const getSpy = vi.spyOn(inner, 'get')
    const cache = monitorCache(TENANT_CONFIG_CACHE_NAME, inner)

    cache.set('hit', { ok: true })

    expect(cache.get('hit', CACHE_LOOKUP_WITHOUT_METRICS)).toEqual({ ok: true })
    expect(getSpy).toHaveBeenCalledTimes(1)
    expect(recordSpy).not.toHaveBeenCalled()

    expect(cache.get('hit')).toEqual({ ok: true })
    expect(getSpy).toHaveBeenCalledTimes(2)
    expect(recordSpy).toHaveBeenCalledWith(TENANT_CONFIG_CACHE_NAME, 'hit')

    cache.dispose()
  })

  test('records any returned cache value as a hit', () => {
    const recordSpy = vi.spyOn(metrics, 'recordCacheRequest')
    const cache = createLruCache(TENANT_CONFIG_CACHE_NAME, {
      max: 2,
      ttl: 10,
      ttlResolution: 0,
      allowStale: true,
      perf: {
        now: () => Date.now(),
      },
    })

    cache.set('stale', { ok: true })
    vi.advanceTimersByTime(11)

    expect(cache.get('stale')).toEqual({ ok: true })
    expect(recordSpy).toHaveBeenCalledWith(TENANT_CONFIG_CACHE_NAME, 'hit')
  })

  test('records evictions', () => {
    const evictionSpy = vi.spyOn(metrics, 'recordCacheEviction')
    const cache = createLruCache(TENANT_CONFIG_CACHE_NAME, {
      max: 1,
    })

    cache.set('first', { ok: true })
    cache.set('second', { ok: false })

    expect(evictionSpy).toHaveBeenCalledWith(TENANT_CONFIG_CACHE_NAME)
  })

  test('chains caller disposeAfter after recording evictions', () => {
    const evictionSpy = vi.spyOn(metrics, 'recordCacheEviction')
    const disposeAfter = vi.fn()
    const cache = createLruCache(TENANT_CONFIG_CACHE_NAME, {
      max: 1,
      disposeAfter,
    })

    cache.set('first', { ok: true })
    cache.set('second', { ok: false })

    expect(evictionSpy).toHaveBeenCalledWith(TENANT_CONFIG_CACHE_NAME)
    expect(disposeAfter).toHaveBeenCalledWith({ ok: true }, 'first', 'evict')
    expect(evictionSpy.mock.invocationCallOrder[0]).toBeLessThan(
      disposeAfter.mock.invocationCallOrder[0]
    )
  })

  test('purges stale entries on the background interval', async () => {
    const cache = createLruCache(TENANT_CONFIG_CACHE_NAME, {
      max: 2,
      ttl: DEFAULT_CACHE_PURGE_STALE_INTERVAL_MS - 1,
      ttlResolution: 0,
      purgeStaleIntervalMs: DEFAULT_CACHE_PURGE_STALE_INTERVAL_MS,
      perf: {
        now: () => Date.now(),
      },
    })

    cache.set('stale', { ok: true })

    expect(cache.getStats()).toEqual({ entries: 1 })

    vi.advanceTimersByTime(DEFAULT_CACHE_PURGE_STALE_INTERVAL_MS)

    expect(cache.getStats()).toEqual({ entries: 0 })
    expect(cache.get('stale')).toBeUndefined()

    cache.set('fresh', { ok: false })

    expect(cache.getStats()).toEqual({ entries: 1 })
    expect(cache.get('fresh')).toEqual({ ok: false })

    vi.advanceTimersByTime(DEFAULT_CACHE_PURGE_STALE_INTERVAL_MS)

    expect(cache.getStats()).toEqual({ entries: 0 })
    expect(cache.get('fresh')).toBeUndefined()
  })

  test('reports occupancy without purging stale entries', () => {
    const batchObserver = captureBatchObserver(metrics)
    const purgeStaleSpy = vi.spyOn(BaseLruCache.prototype, 'purgeStale')
    const cache = createLruCache(TENANT_CONFIG_CACHE_NAME, {
      max: 2,
      ttl: 10,
      ttlResolution: 0,
      perf: {
        now: () => Date.now(),
      },
    })

    cache.set('stale', { ok: true })

    vi.advanceTimersByTime(11)

    expect(cache.getStats()).toEqual({ entries: 1 })

    const observeSpy = vi.fn()
    batchObserver.observe(observeSpy)

    expect(purgeStaleSpy).not.toHaveBeenCalled()
    expect(cache.getStats()).toEqual({ entries: 1 })
    expect(observeSpy).toHaveBeenCalledWith(metrics.cacheEntries, 1, {
      cache: TENANT_CONFIG_CACHE_NAME,
    })

    cache.dispose()
  })

  test('skips occupancy reads when occupancy gauges are disabled', () => {
    const batchObserver = captureBatchObserver(metrics)
    const cache = {
      delete: vi.fn().mockReturnValue(false),
      get: vi.fn(),
      entries: vi.fn(function* () {}),
      values: vi.fn(function* () {}),
      getStats: vi.fn().mockReturnValue({ entries: 1 }),
      set: vi.fn(),
    }

    monitorCache(TENANT_CONFIG_CACHE_NAME, cache)

    try {
      metrics.setMetricsEnabled([{ name: 'cache_entries', enabled: false }])

      const observeSpy = vi.fn()
      batchObserver.observe(observeSpy)

      expect(cache.getStats).not.toHaveBeenCalled()
      expect(observeSpy).not.toHaveBeenCalled()
    } finally {
      metrics.setMetricsEnabled([{ name: 'cache_entries', enabled: true }])
    }
  })

  test('dispose unregisters occupancy callbacks and tears down wrapped caches', () => {
    const addBatchObservableCallbackSpy = vi.spyOn(metrics.meter, 'addBatchObservableCallback')
    const removeBatchObservableCallbackSpy = vi.spyOn(
      metrics.meter,
      'removeBatchObservableCallback'
    )
    const cache = {
      delete: vi.fn().mockReturnValue(false),
      dispose: vi.fn(),
      get: vi.fn(),
      entries: vi.fn(function* () {}),
      values: vi.fn(function* () {}),
      getStats: vi.fn().mockReturnValue({ entries: 1 }),
      set: vi.fn(),
    }

    const monitoredCache = monitorCache(TENANT_CONFIG_CACHE_NAME, cache)
    const [callback, observables] = addBatchObservableCallbackSpy.mock.calls.at(-1) as [
      Parameters<typeof metrics.meter.addBatchObservableCallback>[0],
      Parameters<typeof metrics.meter.addBatchObservableCallback>[1],
    ]

    monitoredCache.dispose()
    monitoredCache.dispose()

    expect(removeBatchObservableCallbackSpy).toHaveBeenCalledTimes(1)
    expect(removeBatchObservableCallbackSpy).toHaveBeenCalledWith(callback, observables)
    expect(cache.dispose).toHaveBeenCalledTimes(1)
  })
})
