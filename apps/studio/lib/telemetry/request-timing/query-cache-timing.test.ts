import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it } from 'vitest'

import { observeQueryClient } from './query-cache-timing'
import { createRequestTimingCollector } from './request-timing-collector'

let time = 0

const createCollector = (isSampled = true) =>
  createRequestTimingCollector({ isSampled, sampleRate: 1, now: () => time })

// Work done inside a query or mutation moves the clock, so durations are exact
const takes = <T>(ms: number, result: T) =>
  async function work() {
    time += ms
    return result
  }

let client: QueryClient

beforeEach(() => {
  time = 0
  client = new QueryClient()
})

describe('query timing', () => {
  it('records how long a fetch took, under a label with no identifiers in it', async () => {
    const collector = createCollector()
    observeQueryClient(client, collector)

    await client.fetchQuery({
      queryKey: ['projects', 'abcdefghijklmnopqrst', 'tables'],
      queryFn: takes(120, 'rows'),
    })

    expect(collector.finishVisit()).toMatchObject({
      queryFetchCount: 1,
      queryErrorCount: 0,
      querySumMs: 120,
      queries: [{ label: 'projects/tables', count: 1, errorCount: 0, totalMs: 120, maxMs: 120 }],
    })
  })

  it('records a query that failed once, covering every retry', async () => {
    const collector = createCollector()
    observeQueryClient(client, collector)

    await expect(
      client.fetchQuery({
        queryKey: ['profile'],
        retry: 2,
        retryDelay: 0,
        queryFn: async () => {
          time += 50
          throw new Error('boom')
        },
      })
    ).rejects.toThrow('boom')

    expect(collector.finishVisit()).toMatchObject({
      queryFetchCount: 1,
      queryErrorCount: 1,
      querySumMs: 150,
    })
  })

  it('does not count a read from local storage as a fetch', async () => {
    const collector = createCollector()
    observeQueryClient(client, collector)

    await client.fetchQuery({
      queryKey: ['localStorage', 'supabase-ui-theme'],
      queryFn: takes(1, 'dark'),
    })

    expect(collector.finishVisit()).toMatchObject({ queryFetchCount: 0, queries: [] })
  })

  it('counts concurrent requests for the same query as one fetch', async () => {
    const collector = createCollector()
    observeQueryClient(client, collector)
    const options = { queryKey: ['profile'], queryFn: takes(30, 'me') }

    await Promise.all([client.fetchQuery(options), client.fetchQuery(options)])

    expect(collector.finishVisit()?.queryFetchCount).toBe(1)
  })

  it('flags a fetch of a query that already had data as a background refetch', async () => {
    const collector = createCollector()
    observeQueryClient(client, collector)
    const options = { queryKey: ['profile'], queryFn: takes(10, 'me'), staleTime: 0 }

    await client.fetchQuery(options)
    await client.fetchQuery(options)

    expect(collector.finishVisit()).toMatchObject({
      queryFetchCount: 2,
      queryBackgroundRefetchCount: 1,
    })
  })

  it('does not count data written straight into the cache', async () => {
    const collector = createCollector()
    observeQueryClient(client, collector)

    client.setQueryData(['profile'], 'me')

    expect(collector.finishVisit()?.queryFetchCount).toBe(0)
  })

  it('keeps timing a fetch when data is written into the cache while it is in flight', async () => {
    const collector = createCollector()
    observeQueryClient(client, collector)
    let finishFetch = () => {}

    const fetching = client.fetchQuery({
      queryKey: ['profile'],
      queryFn: () => new Promise<string>((resolve) => (finishFetch = () => resolve('me'))),
    })
    await Promise.resolve()
    time += 30
    client.setQueryData(['profile'], 'optimistic')
    time += 70
    finishFetch()
    await fetching

    expect(collector.finishVisit()).toMatchObject({ queryFetchCount: 1, querySumMs: 100 })
  })

  it('does not count a fetch that was cancelled', async () => {
    const collector = createCollector()
    observeQueryClient(client, collector)

    const fetching = client.fetchQuery({
      queryKey: ['profile'],
      retry: false,
      queryFn: ({ signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('aborted')))
        }),
    })
    // Let the fetch start before cancelling it
    await Promise.resolve()
    await client.cancelQueries({ queryKey: ['profile'] })
    await fetching.catch(() => {})

    expect(collector.finishVisit()?.queryFetchCount).toBe(0)
  })

  it('times a refetch from its own start after an earlier fetch was cancelled', async () => {
    const collector = createCollector()
    observeQueryClient(client, collector)

    const cancelled = client.fetchQuery({
      queryKey: ['profile'],
      retry: false,
      queryFn: ({ signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('aborted')))
        }),
    })
    await Promise.resolve()
    await client.cancelQueries({ queryKey: ['profile'] })
    await cancelled.catch(() => {})

    // A long idle gap, then a fresh fetch that takes 20ms
    time += 500
    await client.fetchQuery({ queryKey: ['profile'], queryFn: takes(20, 'me') })

    expect(collector.finishVisit()).toMatchObject({ queryFetchCount: 1, querySumMs: 20 })
  })

  it('records nothing for a page load that was not sampled', async () => {
    const collector = createCollector(false)
    observeQueryClient(client, collector)

    await client.fetchQuery({ queryKey: ['profile'], queryFn: takes(10, 'me') })

    expect(collector.finishVisit()).toBeUndefined()
  })

  it('stops recording once unsubscribed', async () => {
    const collector = createCollector()
    const stop = observeQueryClient(client, collector)
    stop()

    await client.fetchQuery({ queryKey: ['profile'], queryFn: takes(10, 'me') })

    expect(collector.finishVisit()?.queryFetchCount).toBe(0)
  })
})

describe('mutation timing', () => {
  it('records how long a mutation took, and whether it failed', async () => {
    const collector = createCollector()
    observeQueryClient(client, collector)
    const mutations = client.getMutationCache()

    await mutations.build(client, { mutationFn: takes(200, 'ok') }).execute(undefined)
    await mutations
      .build(client, {
        mutationFn: async () => {
          time += 40
          throw new Error('boom')
        },
      })
      .execute(undefined)
      .catch(() => {})

    expect(collector.finishVisit()).toMatchObject({
      mutationCount: 2,
      mutationErrorCount: 1,
      mutationSumMs: 240,
    })
  })

  it('times from when the mutation first started even if onMutate sets a context', async () => {
    const collector = createCollector()
    observeQueryClient(client, collector)

    await client
      .getMutationCache()
      .build(client, {
        onMutate: async () => ({ previous: 1 }),
        mutationFn: takes(75, 'ok'),
      })
      .execute(undefined)

    expect(collector.finishVisit()).toMatchObject({ mutationCount: 1, mutationSumMs: 75 })
  })
})
