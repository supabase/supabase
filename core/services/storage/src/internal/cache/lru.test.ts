import { createLruCache, DEFAULT_CACHE_TTL_RESOLUTION_MS } from '@internal/cache'
import { vi } from 'vitest'

describe('lru cache wrapper', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  test('defaults ttl clock resolution for caches with a ttl', () => {
    let now = 1
    const perf = { now: vi.fn(() => now) }
    const cache = createLruCache<string, { bytes: number }>({
      max: 2,
      ttl: DEFAULT_CACHE_TTL_RESOLUTION_MS * 2,
      perf,
    })

    cache.set('entry', { bytes: 1 })
    expect(cache.get('entry')).toEqual({ bytes: 1 })
    expect(perf.now).toHaveBeenCalledTimes(2)

    now += DEFAULT_CACHE_TTL_RESOLUTION_MS - 1
    vi.advanceTimersByTime(DEFAULT_CACHE_TTL_RESOLUTION_MS - 1)

    expect(cache.get('entry')).toEqual({ bytes: 1 })
    expect(perf.now).toHaveBeenCalledTimes(2)

    now += 1
    vi.advanceTimersByTime(1)

    expect(cache.get('entry')).toEqual({ bytes: 1 })
    expect(perf.now).toHaveBeenCalledTimes(3)
  })

  test('respects an explicit ttl clock resolution override', () => {
    let now = 1
    const perf = { now: vi.fn(() => now) }
    const cache = createLruCache<string, { bytes: number }>({
      max: 2,
      ttl: 10,
      ttlResolution: 0,
      perf,
    })

    cache.set('entry', { bytes: 1 })
    expect(cache.get('entry')).toEqual({ bytes: 1 })

    now = 12

    expect(cache.get('entry')).toBeUndefined()
    expect(perf.now).toHaveBeenCalledTimes(3)
    expect(vi.getTimerCount()).toBe(0)
  })

  test('plain get returns hits misses and stale values according to allowStale', () => {
    const staleCache = createLruCache<string, { bytes: number }>({
      max: 2,
      ttl: 10,
      ttlResolution: 0,
      allowStale: true,
      perf: {
        now: () => Date.now(),
      },
    })

    staleCache.set('entry', { bytes: 1 })

    expect(staleCache.get('entry')).toEqual({ bytes: 1 })
    expect(staleCache.get('missing')).toBeUndefined()

    vi.advanceTimersByTime(11)

    expect(staleCache.get('entry')).toEqual({ bytes: 1 })

    const expiringCache = createLruCache<string, { bytes: number }>({
      max: 2,
      ttl: 10,
      ttlResolution: 0,
      allowStale: false,
      perf: {
        now: () => Date.now(),
      },
    })

    expiringCache.set('entry', { bytes: 1 })

    vi.advanceTimersByTime(11)

    expect(expiringCache.get('entry')).toBeUndefined()
  })

  test('purges timer-driven stale entries from raw cache stats', () => {
    const cache = createLruCache<string, { bytes: number }>({
      max: 2,
      ttl: 10,
      ttlResolution: 0,
      purgeStaleIntervalMs: 20,
      perf: {
        now: () => Date.now(),
      },
    })

    cache.set('stale', { bytes: 1 })

    expect(cache.getStats()).toEqual({ entries: 1 })

    vi.advanceTimersByTime(20)

    expect(cache.getStats()).toEqual({ entries: 0 })
    expect(cache.get('stale')).toBeUndefined()
  })

  test('tracks entries as values are replaced deleted and expired', () => {
    const cache = createLruCache<string, { bytes: number }>({
      max: 2,
      ttl: 15,
      ttlResolution: 0,
      perf: {
        now: () => Date.now(),
      },
    })

    cache.set('a', { bytes: 3 })
    cache.set('b', { bytes: 5 })

    expect(cache.getStats()).toEqual({ entries: 2 })

    cache.set('a', { bytes: 7 })

    expect(cache.getStats()).toEqual({ entries: 2 })

    cache.delete('b')

    expect(cache.getStats()).toEqual({ entries: 1 })

    vi.advanceTimersByTime(16)

    expect(cache.get('a')).toBeUndefined()
    expect(cache.getStats()).toEqual({ entries: 0 })
  })

  test('expires entries at an absolute ttl even when read continuously', () => {
    const cache = createLruCache<string, { bytes: number }>({
      max: 2,
      ttl: 10,
      ttlResolution: 0,
      allowStale: false,
      perf: {
        now: () => Date.now(),
      },
    })

    cache.set('entry', { bytes: 1 })

    vi.advanceTimersByTime(4)
    expect(cache.get('entry')).toEqual({ bytes: 1 })

    vi.advanceTimersByTime(4)
    expect(cache.get('entry')).toEqual({ bytes: 1 })

    vi.advanceTimersByTime(3)
    expect(cache.get('entry')).toBeUndefined()
  })

  test('ttl jitter shortens the effective ttl by up to the configured ratio', () => {
    const random = vi.spyOn(Math, 'random')
    const cache = createLruCache<string, { bytes: number }>({
      max: 2,
      ttl: 10,
      ttlResolution: 0,
      ttlJitterRatio: 0.5,
      perf: {
        now: () => Date.now(),
      },
    })

    random.mockReturnValue(1)
    cache.set('full-jitter', { bytes: 1 })
    random.mockReturnValue(0)
    cache.set('no-jitter', { bytes: 1 })

    vi.advanceTimersByTime(6)
    expect(cache.get('full-jitter')).toBeUndefined()
    expect(cache.get('no-jitter')).toEqual({ bytes: 1 })

    vi.advanceTimersByTime(5)
    expect(cache.get('no-jitter')).toBeUndefined()
    random.mockRestore()
  })

  test('rejects a jitter ratio outside [0, 1)', () => {
    expect(() => createLruCache({ max: 2, ttl: 10, ttlJitterRatio: 1 })).toThrow()
    expect(() => createLruCache({ max: 2, ttl: 10, ttlJitterRatio: -0.1 })).toThrow()
    expect(() => createLruCache({ max: 2, ttl: 10, ttlJitterRatio: NaN })).toThrow()
  })

  test('clears the stale purge timer on dispose', () => {
    const cache = createLruCache<string, { bytes: number }>({
      max: 2,
      ttl: 10,
      ttlResolution: 0,
      purgeStaleIntervalMs: 20,
      perf: {
        now: () => Date.now(),
      },
    })

    cache.set('stale', { bytes: 1 })
    cache.dispose()

    vi.advanceTimersByTime(20)

    expect(cache.getStats()).toEqual({ entries: 1 })

    cache.dispose()
  })
})
