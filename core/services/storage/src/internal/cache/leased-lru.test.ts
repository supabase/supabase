import { afterEach, describe, expect, it, type Mock, vi } from 'vitest'
import { type LeaseDisposeReason, LeasedLruCache, type LeasedLruCacheOptions } from './leased-lru'
import { TENANT_POOL_CACHE_NAME } from './names'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

type TestValue = { dispose: Mock<(reason: LeaseDisposeReason) => Promise<void>> }

function createValue(disposal: Promise<void> = Promise.resolve()): TestValue {
  return { dispose: vi.fn((_reason: LeaseDisposeReason) => disposal) }
}

function createSynchronouslyFailingValue(error: Error): TestValue {
  return {
    dispose: vi.fn(() => {
      throw error
    }),
  }
}

function createCache(overrides: Partial<LeasedLruCacheOptions> = {}) {
  const onLeaseTimeout = vi.fn()
  const onDetachedDisposeFailure = vi.fn()
  const cache = new LeasedLruCache<TestValue>({
    name: TENANT_POOL_CACHE_NAME,
    max: 1,
    leaseTimeoutMs: 1_000,
    groupOf: (key) => key.split(':')[0],
    onLeaseTimeout,
    onDetachedDisposeFailure,
    ...overrides,
  })
  return { cache, onLeaseTimeout, onDetachedDisposeFailure }
}

function evictByInserting(cache: LeasedLruCache<TestValue>, key = 'b:1'): TestValue {
  const incoming = createValue()
  cache.checkout(key, () => incoming).release()
  return incoming
}

async function expectPending(promise: Promise<unknown>) {
  const pending = Symbol('pending')
  await expect(Promise.race([promise, Promise.resolve(pending)])).resolves.toBe(pending)
}

describe('LeasedLruCache', () => {
  it('creates a value once per key and shares it across leases', () => {
    const { cache } = createCache({ max: 2 })
    const create = vi.fn(() => createValue())

    const first = cache.checkout('a:1', create)
    const second = cache.checkout('a:1', () => {
      throw new Error('cache hits must not create')
    })

    expect(create).toHaveBeenCalledOnce()
    expect(second.value).toBe(first.value)

    first.release()
    second.release()
  })

  it('iterates live values and entries without the deferred ones', () => {
    const { cache } = createCache()
    const evicted = createValue()
    const lease = cache.checkout('a:1', () => evicted)
    const live = evictByInserting(cache)

    expect([...cache.values()]).toEqual([live])
    expect([...cache.entries()]).toEqual([['b:1', live]])

    lease.release()
  })

  it('waits for every active lease before eviction disposal', () => {
    const { cache } = createCache()
    const value = createValue()
    const first = cache.checkout('a:1', () => value)
    const second = cache.checkout('a:1', () => value)

    evictByInserting(cache)
    expect(value.dispose).not.toHaveBeenCalled()

    first.release()
    expect(value.dispose).not.toHaveBeenCalled()

    second.release()
    expect(value.dispose).toHaveBeenCalledExactlyOnceWith('evict')
  })

  it('keeps a double release of one lease from consuming another lease', () => {
    const { cache } = createCache()
    const value = createValue()
    const first = cache.checkout('a:1', () => value)
    const second = cache.checkout('a:1', () => value)
    evictByInserting(cache)

    first.release()
    first.release()
    expect(value.dispose).not.toHaveBeenCalled()

    second.release()
    expect(value.dispose).toHaveBeenCalledExactlyOnceWith('evict')
  })

  it('forces a deferred disposal with destroy provenance', async () => {
    const { cache } = createCache()
    const disposal = Promise.withResolvers<void>()
    const value = createValue(disposal.promise)
    const lease = cache.checkout('a:1', () => value)
    evictByInserting(cache)

    const shutdown = cache.disposeAll()

    expect(value.dispose).toHaveBeenCalledExactlyOnceWith('destroy')

    disposal.resolve()
    await expect(shutdown).resolves.toEqual([
      { status: 'fulfilled', value: undefined },
      { status: 'fulfilled', value: undefined },
    ])

    lease.release()
    expect(value.dispose).toHaveBeenCalledOnce()
  })

  it('disposeGroup forces a deferred eviction immediately', async () => {
    const { cache } = createCache()
    const value = createValue()
    const lease = cache.checkout('a:1', () => value)
    evictByInserting(cache)

    expect(value.dispose).not.toHaveBeenCalled()

    await cache.disposeGroup('a')
    expect(value.dispose).toHaveBeenCalledExactlyOnceWith('destroy')

    lease.release()
    expect(value.dispose).toHaveBeenCalledOnce()
  })

  it('uses the lease deadline as an eviction backstop', async () => {
    vi.useFakeTimers()
    const { cache, onLeaseTimeout } = createCache()
    const value = createValue()
    const lease = cache.checkout('a:1', () => value)
    evictByInserting(cache)

    await vi.advanceTimersByTimeAsync(1_000)

    expect(onLeaseTimeout).toHaveBeenCalledWith('a:1', 1)
    expect(value.dispose).toHaveBeenCalledExactlyOnceWith('evict')

    lease.release()
    expect(value.dispose).toHaveBeenCalledOnce()
  })

  it('reports a detached disposal failure once and does not replay it during shutdown', async () => {
    const { cache, onDetachedDisposeFailure } = createCache()
    const disposal = Promise.withResolvers<void>()
    const value = createValue(disposal.promise)
    const error = new Error('disposal failed')

    cache.checkout('a:1', () => value).release()
    evictByInserting(cache)
    disposal.reject(error)

    await vi.waitFor(() => {
      expect(onDetachedDisposeFailure).toHaveBeenCalledWith('a', error)
    })
    await expect(cache.disposeAll()).resolves.toEqual([{ status: 'fulfilled', value: undefined }])
    expect(onDetachedDisposeFailure).toHaveBeenCalledOnce()
  })

  it('tracks synchronous eviction disposal failures without failing the replacement checkout', async () => {
    const { cache, onDetachedDisposeFailure } = createCache()
    const error = new Error('synchronous disposal failed')
    const value = createSynchronouslyFailingValue(error)

    cache.checkout('a:1', () => value).release()
    const replacement = cache.checkout('b:1', () => createValue())

    expect(replacement.value).not.toBe(value)
    replacement.release()
    await vi.waitFor(() => {
      expect(onDetachedDisposeFailure).toHaveBeenCalledWith('a', error)
    })
    expect(cache.deferredCount).toBe(0)
    expect(onDetachedDisposeFailure).toHaveBeenCalledOnce()
  })

  it('continues explicit group disposal after a synchronous failure', async () => {
    const { cache, onDetachedDisposeFailure } = createCache({ max: 2 })
    const error = new Error('synchronous group disposal failed')
    const failing = createSynchronouslyFailingValue(error)
    const succeeding = createValue()

    cache.checkout('a:1', () => failing).release()
    cache.checkout('a:2', () => succeeding).release()

    await expect(cache.disposeGroup('a')).rejects.toBe(error)
    expect(failing.dispose).toHaveBeenCalledExactlyOnceWith('destroy')
    expect(succeeding.dispose).toHaveBeenCalledExactlyOnceWith('destroy')
    expect(onDetachedDisposeFailure).not.toHaveBeenCalled()
  })

  it('leaves observed forced-disposal failures for the shutdown caller', async () => {
    const { cache, onDetachedDisposeFailure } = createCache()
    const disposal = Promise.withResolvers<void>()
    const value = createValue(disposal.promise)
    const lease = cache.checkout('a:1', () => value)
    evictByInserting(cache)

    const shutdown = cache.disposeAll()
    const error = new Error('observed failure')
    disposal.reject(error)

    const results = await shutdown
    expect(results).toHaveLength(2)
    expect(results.filter((result) => result.status === 'rejected')).toEqual([
      { status: 'rejected', reason: error },
    ])
    expect(onDetachedDisposeFailure).not.toHaveBeenCalled()
    expect(value.dispose).toHaveBeenCalledExactlyOnceWith('destroy')

    lease.release()
  })

  it('aggregates every pending disposal failure for one group', async () => {
    const { cache, onDetachedDisposeFailure } = createCache({ max: 4 })
    const firstDisposal = Promise.withResolvers<void>()
    const secondDisposal = Promise.withResolvers<void>()
    const firstValue = createValue(firstDisposal.promise)
    const secondValue = createValue(secondDisposal.promise)
    const untouchedValue = createValue()

    cache.checkout('t:1', () => firstValue).release()
    cache.checkout('t:2', () => secondValue).release()
    cache.checkout('u:1', () => untouchedValue).release()

    const result = cache.disposeGroup('t').catch((error: unknown) => error)
    const firstError = new Error('first failure')
    const secondError = new Error('second failure')
    firstDisposal.reject(firstError)
    secondDisposal.reject(secondError)

    const error = await result
    expect(error).toBeInstanceOf(AggregateError)
    expect((error as AggregateError).errors).toHaveLength(2)
    expect((error as AggregateError).errors).toEqual(
      expect.arrayContaining([firstError, secondError])
    )
    expect(onDetachedDisposeFailure).not.toHaveBeenCalled()
    expect(untouchedValue.dispose).not.toHaveBeenCalled()
  })

  it('disposeAll waits for an in-flight disposeGroup', async () => {
    const { cache } = createCache({ max: 2 })
    const disposal = Promise.withResolvers<void>()
    const value = createValue(disposal.promise)
    cache.checkout('a:1', () => value).release()

    const group = cache.disposeGroup('a')
    const shutdown = cache.disposeAll()
    await expectPending(shutdown)

    disposal.resolve()
    await group
    await expect(shutdown).resolves.toEqual([{ status: 'fulfilled', value: undefined }])
    expect(value.dispose).toHaveBeenCalledExactlyOnceWith('destroy')
  })

  it('concurrent disposeAll calls wait for the same in-flight teardown', async () => {
    const { cache } = createCache({ max: 2 })
    const disposal = Promise.withResolvers<void>()
    const value = createValue(disposal.promise)
    cache.checkout('a:1', () => value).release()

    const first = cache.disposeAll()
    const second = cache.disposeAll()
    await expectPending(second)

    disposal.resolve()
    await expect(first).resolves.toEqual([{ status: 'fulfilled', value: undefined }])
    await expect(second).resolves.toEqual([{ status: 'fulfilled', value: undefined }])
    expect(value.dispose).toHaveBeenCalledExactlyOnceWith('destroy')
  })

  it('a later disposeGroup waits for the group remaining teardowns', async () => {
    const { cache } = createCache({ max: 2 })
    const firstDisposal = Promise.withResolvers<void>()
    const secondDisposal = Promise.withResolvers<void>()
    const firstValue = createValue(firstDisposal.promise)
    const secondValue = createValue(secondDisposal.promise)

    cache.checkout('a:1', () => firstValue).release()
    const first = cache.disposeGroup('a').catch((error: unknown) => error)
    cache.checkout('a:2', () => secondValue).release()
    const second = cache.disposeGroup('a')
    await expectPending(second)

    firstDisposal.reject(new Error('first destroy failed'))
    await first
    await expectPending(second)
    secondDisposal.resolve()
    await expect(second).rejects.toThrow('first destroy failed')
    expect(firstValue.dispose).toHaveBeenCalledExactlyOnceWith('destroy')
    expect(secondValue.dispose).toHaveBeenCalledExactlyOnceWith('destroy')
  })

  it('keeps disposeGroup waits isolated while disposeAll snapshots every pending teardown', async () => {
    const { cache } = createCache({ max: 2 })
    const firstDisposal = Promise.withResolvers<void>()
    const secondDisposal = Promise.withResolvers<void>()
    cache.checkout('a:1', () => createValue(firstDisposal.promise)).release()
    cache.checkout('b:1', () => createValue(secondDisposal.promise)).release()

    const disposeA = cache.disposeGroup('a')
    const disposeB = cache.disposeGroup('b')
    const shutdown = cache.disposeAll()
    await expectPending(disposeB)
    await expectPending(shutdown)

    firstDisposal.resolve()
    await disposeA
    await expectPending(disposeB)
    await expectPending(shutdown)

    secondDisposal.resolve()
    await disposeB
    await expect(shutdown).resolves.toEqual([
      { status: 'fulfilled', value: undefined },
      { status: 'fulfilled', value: undefined },
    ])
  })

  it('exposes deferred value snapshots, count, and oldest age', async () => {
    let now = 1_000
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const { cache } = createCache()
    const disposal = Promise.withResolvers<void>()
    const value = createValue(disposal.promise)
    const lease = cache.checkout('a:1', () => value)
    const live = evictByInserting(cache)

    now = 3_500

    expect(cache.snapshotValues()).toEqual([live, value])
    expect(cache.deferredCount).toBe(1)
    expect(cache.getOldestDeferredAgeSeconds()).toBe(2.5)

    lease.release()
    disposal.resolve()
    await vi.waitFor(() => {
      expect(cache.deferredCount).toBe(0)
    })
    expect(cache.getOldestDeferredAgeSeconds()).toBe(0)
  })
})
