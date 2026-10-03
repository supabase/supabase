import type { DisposableCache } from './adapter'
import { createLruCache, type LruCacheSetOptions } from './lru'
import type { CacheName } from './names'

export type LeaseDisposeReason = 'destroy' | 'evict'

// A cache value with asynchronous teardown. The cache calls `dispose` at most
// once per entry; the reason records whether capacity eviction or an explicit
// disposal started it.
export interface LeasedDisposable {
  dispose(reason: LeaseDisposeReason): Promise<void>
}

export interface Lease<V> {
  readonly value: V
  release(): void
}

export interface LeasedLruCacheOptions {
  name: CacheName
  max: number
  leaseTimeoutMs: number
  groupOf: (key: string) => string
  onLeaseTimeout: (key: string, activeLeases: number) => void
  onDetachedDisposeFailure: (group: string, error: unknown) => void
}

type EntryLeaseState = 'active' | 'draining' | 'disposing'

// Per-entry lease state machine: capacity eviction drains until the last
// lease releases (bounded by the lease timeout backstop), while an explicit
// disposal starts immediately. Disposal starts at most once.
class LeasedEntry<V extends LeasedDisposable> {
  private activeLeaseCount = 0
  private state: EntryLeaseState = 'active'
  private disposal?: Promise<void>
  private disposalWaiter?: ReturnType<typeof Promise.withResolvers<void>>
  private leaseTimeout?: ReturnType<typeof setTimeout>

  constructor(
    readonly key: string,
    readonly value: V,
    private readonly options: Pick<LeasedLruCacheOptions, 'leaseTimeoutMs' | 'onLeaseTimeout'>
  ) {}

  retain(): boolean {
    if (this.state !== 'active') {
      return false
    }

    this.activeLeaseCount++
    return true
  }

  release(): void {
    if (this.activeLeaseCount === 0) {
      return
    }

    this.activeLeaseCount--
    if (this.activeLeaseCount === 0 && this.state === 'draining') {
      void this.startDisposal('evict')
    }
  }

  disposeWhenReleased(): Promise<void> {
    if (this.disposal) {
      return this.disposal
    }

    this.state = 'draining'
    if (this.activeLeaseCount === 0) {
      return this.startDisposal('evict')
    }

    this.disposalWaiter ??= Promise.withResolvers<void>()
    if (!this.leaseTimeout) {
      this.leaseTimeout = setTimeout(() => {
        this.options.onLeaseTimeout(this.key, this.activeLeaseCount)
        void this.startDisposal('evict')
      }, this.options.leaseTimeoutMs)
      this.leaseTimeout.unref()
    }
    return this.disposalWaiter.promise
  }

  disposeNow(): Promise<void> {
    return this.startDisposal('destroy')
  }

  private startDisposal(reason: LeaseDisposeReason): Promise<void> {
    if (this.disposal) {
      return this.disposal
    }

    this.state = 'disposing'
    if (this.leaseTimeout) {
      clearTimeout(this.leaseTimeout)
      this.leaseTimeout = undefined
    }

    let disposal: Promise<void>
    try {
      disposal = this.value.dispose(reason)
    } catch (error) {
      disposal = Promise.reject(error)
    }
    this.disposal = disposal
    if (this.disposalWaiter) {
      void disposal.then(this.disposalWaiter.resolve, this.disposalWaiter.reject)
    }
    return disposal
  }
}

// Each checkout gets its own handle so a double release cannot consume
// another holder's lease.
class EntryLease<V extends LeasedDisposable> implements Lease<V> {
  private released = false

  constructor(private readonly entry: LeasedEntry<V>) {}

  get value(): V {
    return this.entry.value
  }

  release(): void {
    if (this.released) {
      return
    }

    this.released = true
    this.entry.release()
  }
}

// Keeps group and global lifecycle views derived from one mutation path.
// Global consumers receive snapshots so teardown completion cannot mutate an
// iteration that is already in progress.
class GroupIndexedRegistry<T> {
  private readonly entriesByGroup = new Map<string, Set<T>>()

  add(group: string, value: T): boolean {
    let entries = this.entriesByGroup.get(group)
    if (!entries) {
      entries = new Set()
      this.entriesByGroup.set(group, entries)
    }
    const previousSize = entries.size
    entries.add(value)
    return entries.size !== previousSize
  }

  delete(group: string, value: T): boolean {
    const entries = this.entriesByGroup.get(group)
    if (!entries || !entries.delete(value)) {
      return false
    }
    if (entries.size === 0) {
      this.entriesByGroup.delete(group)
    }
    return true
  }

  get(group: string): ReadonlySet<T> | undefined {
    return this.entriesByGroup.get(group)
  }

  snapshot(): T[] {
    const snapshot: T[] = []
    for (const entries of this.entriesByGroup.values()) {
      snapshot.push(...entries)
    }
    return snapshot
  }
}

// An LRU cache for live resources.
// `checkout` returns the cached value plus a lease
// capacity eviction stays least-accessed. Evicted value `dispose`
// is deferred until its last lease releases (bounded by a timeout backstop).
// Group and global disposal force `dispose` immediately and await
// every disposal still in flight, so values never manage their own cache
// lifecycle.
export class LeasedLruCache<V extends LeasedDisposable> {
  private readonly cache: DisposableCache<
    string,
    LeasedEntry<V>,
    LruCacheSetOptions<string, LeasedEntry<V>>
  >
  private readonly pending = new GroupIndexedRegistry<LeasedEntry<V>>()
  private readonly deferred = new Map<LeasedEntry<V>, number>()
  private readonly observed = new WeakSet<LeasedEntry<V>>()

  constructor(private readonly options: LeasedLruCacheOptions) {
    this.cache = createLruCache<string, LeasedEntry<V>>(options.name, {
      max: options.max,
      disposeAfter: (entry, key, reason) => {
        if (reason === 'evict') {
          this.deferDisposal(entry)
          return
        }

        this.track(this.options.groupOf(key), entry, entry.disposeNow())
      },
    })
  }

  checkout(key: string, create: () => V): Lease<V> {
    let entry = this.cache.get(key)
    if (!entry) {
      entry = new LeasedEntry(key, create(), this.options)
      this.cache.set(key, entry)
    }

    // Cached entries are always leasable: draining and disposing entries left
    // the cache when their eviction or disposal started.
    if (!entry.retain()) {
      throw new Error(`Cannot lease a disposing cache entry for ${key}`)
    }
    return new EntryLease(entry)
  }

  *values(): IterableIterator<V> {
    for (const entry of this.cache.values()) {
      yield entry.value
    }
  }

  *entries(): IterableIterator<[string, V]> {
    for (const [key, entry] of this.cache.entries()) {
      yield [key, entry.value]
    }
  }

  snapshotValues(): V[] {
    const values: V[] = []
    for (const entry of this.cache.values()) {
      values.push(entry.value)
    }
    for (const entry of this.deferred.keys()) {
      values.push(entry.value)
    }
    return values
  }

  get deferredCount(): number {
    return this.deferred.size
  }

  getOldestDeferredAgeSeconds(now = performance.now()): number {
    const oldest = this.deferred.values().next()
    if (oldest.done) {
      return 0
    }
    return Math.max(now - oldest.value, 0) / 1000
  }

  async disposeGroup(group: string): Promise<void> {
    for (const [key] of [...this.cache.entries()]) {
      if (this.options.groupOf(key) !== group) {
        continue
      }

      this.cache.delete(key)
    }

    const pending = this.pending.get(group)
    if (!pending) {
      return
    }

    const results = await this.forceAndObserve([...pending])
    const errors = results.flatMap((result) =>
      result.status === 'rejected' ? [result.reason] : []
    )
    if (errors.length === 1) {
      throw errors[0]
    }
    if (errors.length > 1) {
      throw new AggregateError(errors, `Failed to dispose cache entries for group ${group}`)
    }
  }

  disposeAll(): Promise<PromiseSettledResult<void>[]> {
    for (const [key] of [...this.cache.entries()]) {
      this.cache.delete(key)
    }

    return this.forceAndObserve(this.pending.snapshot())
  }

  private deferDisposal(entry: LeasedEntry<V>): void {
    const group = this.options.groupOf(entry.key)
    if (!this.deferred.has(entry)) {
      this.deferred.set(entry, performance.now())
    }

    const disposal = entry.disposeWhenReleased()
    const cleanup = () => {
      this.deferred.delete(entry)
    }
    void disposal.then(cleanup, cleanup)
    this.track(group, entry, disposal)
  }

  private track(group: string, entry: LeasedEntry<V>, disposal: Promise<void>): void {
    if (!this.pending.add(group, entry)) {
      return
    }

    const removePending = () => {
      this.pending.delete(group, entry)
    }
    // Track only in-flight work. Detached failures are reported immediately,
    // while an explicit waiter owns reporting for disposals it observes.
    void disposal.then(removePending, (error) => {
      removePending()
      if (!this.observed.has(entry)) {
        this.options.onDetachedDisposeFailure(group, error)
      }
    })
  }

  private forceAndObserve(
    entries: readonly LeasedEntry<V>[]
  ): Promise<PromiseSettledResult<void>[]> {
    for (const entry of entries) {
      this.observed.add(entry)
    }
    return Promise.allSettled(entries.map((entry) => entry.disposeNow()))
  }
}
