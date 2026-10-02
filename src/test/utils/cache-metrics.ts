import type { Mock, MockInstance } from 'vitest'

type CacheRequestRecordCall = [string, string]

type AssertLogicalLookupMetricsOptions<T> = {
  recordSpy: MockInstance
  backendCallSpy: Mock | MockInstance
  cacheName: string
  startLookups: () => [Promise<T>, Promise<T>, Promise<T>]
  resolveBackend: () => void
  assertConcurrentResults?: (results: [T, T, T]) => void | Promise<void>
  assertCachedHit: () => Promise<void>
}

async function waitForImmediate(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve))
}

export function getCacheRequestCalls(
  recordSpy: MockInstance,
  cacheName: string
): CacheRequestRecordCall[] {
  return recordSpy.mock.calls.filter((call) => {
    const [cache, outcome] = call as [unknown, unknown]

    return cache === cacheName && typeof outcome === 'string'
  }) as CacheRequestRecordCall[]
}

export async function assertLogicalLookupMetrics<T>({
  recordSpy,
  backendCallSpy,
  cacheName,
  startLookups,
  resolveBackend,
  assertConcurrentResults,
  assertCachedHit,
}: AssertLogicalLookupMetricsOptions<T>): Promise<void> {
  await waitForImmediate()
  recordSpy.mockClear()

  const lookups = startLookups()

  await waitForImmediate()

  // Each caller records its initial logical miss.
  // Concurrent same-key lookups share the
  // same in-flight cache fill, so only these
  // three outer misses are emitted.
  const misses: CacheRequestRecordCall[] = [
    [cacheName, 'miss'],
    [cacheName, 'miss'],
    [cacheName, 'miss'],
  ]
  expect(getCacheRequestCalls(recordSpy, cacheName)).toEqual(misses)
  expect(backendCallSpy).toHaveBeenCalledTimes(1)

  resolveBackend()

  const results = (await Promise.all(lookups)) as [T, T, T]
  await assertConcurrentResults?.(results)

  expect(getCacheRequestCalls(recordSpy, cacheName)).toEqual(misses)

  await assertCachedHit()

  expect(getCacheRequestCalls(recordSpy, cacheName)).toEqual([...misses, [cacheName, 'hit']])
}
