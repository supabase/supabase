import {
  createInvalidatableSingleFlightByKey,
  createSingleFlightByKey,
  MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS,
  SingleFlightInvalidationLimitError,
} from '@internal/concurrency'
import { vi } from 'vitest'

describe('createSingleFlightByKey', () => {
  it('shares same-key in-flight work across concurrent callers', async () => {
    const singleFlight = createSingleFlightByKey<string>()
    const firstWork = Promise.withResolvers<string>()
    const work = vi.fn().mockReturnValue(firstWork.promise)

    const first = singleFlight('tenant-a', work)
    const second = singleFlight('tenant-a', work)
    const otherKey = singleFlight('tenant-b', () => Promise.resolve('other'))

    expect(work).toHaveBeenCalledTimes(1)

    firstWork.resolve('shared')

    await expect(Promise.all([first, second, otherKey])).resolves.toEqual([
      'shared',
      'shared',
      'other',
    ])
  })

  it('clears rejected in-flight work so a later caller can retry', async () => {
    const singleFlight = createSingleFlightByKey<string>()
    const failure = new Error('lookup failed')
    const work = vi.fn().mockRejectedValueOnce(failure).mockResolvedValueOnce('recovered')

    await expect(singleFlight('tenant-a', work)).rejects.toBe(failure)
    await expect(singleFlight('tenant-a', work)).resolves.toBe('recovered')

    expect(work).toHaveBeenCalledTimes(2)
  })

  it('shares same-key in-flight rejections across concurrent callers', async () => {
    const singleFlight = createSingleFlightByKey<string>()
    const failure = new Error('shared failure')
    const firstWork = Promise.withResolvers<string>()
    const work = vi.fn().mockReturnValue(firstWork.promise)

    const first = singleFlight('tenant-a', work)
    const second = singleFlight('tenant-a', work)

    expect(work).toHaveBeenCalledTimes(1)

    firstWork.reject(failure)

    await expect(Promise.allSettled([first, second])).resolves.toEqual([
      { status: 'rejected', reason: failure },
      { status: 'rejected', reason: failure },
    ])
  })

  it('clears resolved in-flight work so later callers start new work', async () => {
    const singleFlight = createSingleFlightByKey<string>()
    const work = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second')

    await expect(singleFlight('tenant-a', work)).resolves.toBe('first')
    await expect(singleFlight('tenant-a', work)).resolves.toBe('second')

    expect(work).toHaveBeenCalledTimes(2)
  })

  it('clears synchronously thrown in-flight work so later callers can retry', async () => {
    const singleFlight = createSingleFlightByKey<string>()
    const failure = new Error('sync failure')
    const work = vi.fn(() => {
      throw failure
    })

    await expect(singleFlight('tenant-a', work)).rejects.toBe(failure)
    await expect(singleFlight('tenant-a', () => Promise.resolve('recovered'))).resolves.toBe(
      'recovered'
    )

    expect(work).toHaveBeenCalledTimes(1)
  })
})

describe('createInvalidatableSingleFlightByKey', () => {
  it('retries detached success through the replacement flight without committing stale data', async () => {
    const singleFlight = createInvalidatableSingleFlightByKey<string>()
    const staleWork = Promise.withResolvers<string>()
    const freshWork = Promise.withResolvers<string>()
    const load = vi
      .fn<() => Promise<string>>()
      .mockReturnValueOnce(staleWork.promise)
      .mockReturnValueOnce(freshWork.promise)
      .mockResolvedValueOnce('newer')
    const commit = vi.fn()
    const retry = vi.fn(() => read())
    const read = (): Promise<string> =>
      singleFlight('tenant-a', {
        load,
        retry,
        commit,
      })

    const stale = read()
    expect(singleFlight.invalidate('tenant-a')).toBe(true)
    const fresh = read()
    const joinedFresh = read()

    expect(fresh).not.toBe(stale)
    expect(joinedFresh).toBe(fresh)
    expect(load).toHaveBeenCalledTimes(2)

    staleWork.resolve('stale')
    await Promise.resolve()

    expect(load).toHaveBeenCalledTimes(2)
    expect(retry).toHaveBeenCalledTimes(1)
    expect(commit).not.toHaveBeenCalled()

    freshWork.resolve('fresh')
    await expect(Promise.all([stale, fresh, joinedFresh])).resolves.toEqual([
      'fresh',
      'fresh',
      'fresh',
    ])
    expect(commit).toHaveBeenCalledTimes(1)
    expect(commit).toHaveBeenCalledWith('fresh')
    expect(singleFlight.invalidate('tenant-a')).toBe(false)

    await expect(read()).resolves.toBe('newer')
    expect(load).toHaveBeenCalledTimes(3)
    expect(commit).toHaveBeenLastCalledWith('newer')
  })

  it('retries detached failure through the replacement flight without exposing the stale error', async () => {
    const singleFlight = createInvalidatableSingleFlightByKey<string>()
    const staleWork = Promise.withResolvers<string>()
    const freshWork = Promise.withResolvers<string>()
    const load = vi
      .fn<() => Promise<string>>()
      .mockReturnValueOnce(staleWork.promise)
      .mockReturnValueOnce(freshWork.promise)
    const commit = vi.fn()
    const retry = vi.fn(() => read())
    const read = (): Promise<string> =>
      singleFlight('tenant-a', {
        load,
        retry,
        commit,
      })

    const stale = read()
    expect(singleFlight.invalidate('tenant-a')).toBe(true)
    const fresh = read()
    const joinedFresh = read()

    staleWork.reject(new Error('detached failure'))
    await Promise.resolve()

    expect(load).toHaveBeenCalledTimes(2)
    expect(retry).toHaveBeenCalledTimes(1)
    expect(commit).not.toHaveBeenCalled()

    freshWork.resolve('fresh')
    await expect(Promise.all([stale, fresh, joinedFresh])).resolves.toEqual([
      'fresh',
      'fresh',
      'fresh',
    ])
    expect(commit).toHaveBeenCalledTimes(1)
    expect(commit).toHaveBeenCalledWith('fresh')
  })

  it('propagates a replacement failure to callers of the detached flight', async () => {
    const singleFlight = createInvalidatableSingleFlightByKey<string>()
    const staleWork = Promise.withResolvers<string>()
    const replacementWork = Promise.withResolvers<string>()
    const replacementFailure = new Error('replacement failure')
    const load = vi
      .fn<() => Promise<string>>()
      .mockReturnValueOnce(staleWork.promise)
      .mockReturnValueOnce(replacementWork.promise)
      .mockResolvedValueOnce('recovered')
    const retry = vi.fn(() => read())
    const commit = vi.fn()
    const read = (): Promise<string> => singleFlight('tenant-a', { load, retry, commit })

    const detached = read()
    expect(singleFlight.invalidate('tenant-a')).toBe(true)
    const replacement = read()

    staleWork.resolve('stale')
    await Promise.resolve()
    replacementWork.reject(replacementFailure)

    await expect(Promise.allSettled([detached, replacement])).resolves.toEqual([
      { status: 'rejected', reason: replacementFailure },
      { status: 'rejected', reason: replacementFailure },
    ])
    expect(retry).toHaveBeenCalledTimes(1)
    expect(commit).not.toHaveBeenCalled()
    expect(singleFlight.invalidate('tenant-a')).toBe(false)

    await expect(read()).resolves.toBe('recovered')
    expect(commit).toHaveBeenCalledTimes(1)
    expect(commit).toHaveBeenCalledWith('recovered')
  })

  it('chains two detached generations through the current replacement', async () => {
    const singleFlight = createInvalidatableSingleFlightByKey<string>()
    const work = Array.from({ length: 3 }, () => Promise.withResolvers<string>())
    let loadIndex = 0
    const load = vi.fn(() => work[loadIndex++].promise)
    const retry = vi.fn(() => read())
    const commit = vi.fn()
    const read = (): Promise<string> => singleFlight('tenant-a', { load, retry, commit })

    const first = read()
    expect(singleFlight.invalidate('tenant-a')).toBe(true)
    const second = read()
    expect(singleFlight.invalidate('tenant-a')).toBe(true)
    const current = read()

    work[0].resolve('first-stale')
    work[1].resolve('second-stale')
    await Promise.resolve()

    expect(retry).toHaveBeenCalledTimes(2)
    expect(commit).not.toHaveBeenCalled()

    work[2].resolve('current')

    await expect(Promise.all([first, second, current])).resolves.toEqual([
      'current',
      'current',
      'current',
    ])
    expect(commit).toHaveBeenCalledTimes(1)
    expect(commit).toHaveBeenCalledWith('current')
  })

  it('uses the canonical retry path when no replacement flight exists', async () => {
    const singleFlight = createInvalidatableSingleFlightByKey<string>()
    const staleWork = Promise.withResolvers<string>()
    const retry = vi.fn().mockResolvedValue('fresh')
    const commit = vi.fn()

    const stale = singleFlight('tenant-a', {
      load: () => staleWork.promise,
      retry,
      commit,
    })
    expect(singleFlight.invalidate('tenant-a')).toBe(true)

    staleWork.resolve('stale')

    await expect(stale).resolves.toBe('fresh')
    expect(retry).toHaveBeenCalledTimes(1)
    expect(commit).not.toHaveBeenCalled()
  })

  it('hands off an invalidated caller without waiting for its stale load to settle', async () => {
    const singleFlight = createInvalidatableSingleFlightByKey<string>()
    const staleWork = Promise.withResolvers<string>()
    const retry = vi.fn().mockResolvedValue('fresh')
    const commit = vi.fn()
    let outcome: { status: 'fulfilled'; value: string } | { status: 'rejected'; reason: unknown }

    const detached = singleFlight('tenant-a', {
      load: () => staleWork.promise,
      retry,
      commit,
    })
    void detached.then(
      (value) => {
        outcome = { status: 'fulfilled', value }
      },
      (reason) => {
        outcome = { status: 'rejected', reason }
      }
    )

    expect(singleFlight.invalidate('tenant-a')).toBe(true)
    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(outcome!).toEqual({ status: 'fulfilled', value: 'fresh' })
    expect(retry).toHaveBeenCalledTimes(1)
    expect(commit).not.toHaveBeenCalled()
    expect(singleFlight.invalidate('tenant-a')).toBe(false)

    staleWork.resolve('stale')
    await Promise.resolve()

    expect(retry).toHaveBeenCalledTimes(1)
    expect(commit).not.toHaveBeenCalled()
  })

  it('hands off a hung stale caller to an existing replacement', async () => {
    const singleFlight = createInvalidatableSingleFlightByKey<string>()
    const staleWork = Promise.withResolvers<string>()
    const replacementWork = Promise.withResolvers<string>()
    const load = vi
      .fn<() => Promise<string>>()
      .mockReturnValueOnce(staleWork.promise)
      .mockReturnValueOnce(replacementWork.promise)
    const retry = vi.fn(() => read())
    const commit = vi.fn()
    const read = (): Promise<string> => singleFlight('tenant-a', { load, retry, commit })

    const stale = read()
    expect(singleFlight.invalidate('tenant-a')).toBe(true)
    const replacement = read()

    replacementWork.resolve('fresh')

    await expect(Promise.all([stale, replacement])).resolves.toEqual(['fresh', 'fresh'])
    expect(retry).toHaveBeenCalledTimes(1)
    expect(commit).toHaveBeenCalledTimes(1)
    expect(commit).toHaveBeenCalledWith('fresh')

    staleWork.resolve('stale')
    await Promise.resolve()

    expect(commit).toHaveBeenCalledTimes(1)
  })

  it('cleans up after the canonical retry path throws synchronously', async () => {
    const singleFlight = createInvalidatableSingleFlightByKey<string>()
    const staleWork = Promise.withResolvers<string>()
    const retryFailure = new Error('synchronous retry failure')
    const load = vi.fn().mockReturnValueOnce(staleWork.promise).mockResolvedValueOnce('recovered')
    const retry = vi.fn((): Promise<string> => {
      throw retryFailure
    })
    const commit = vi.fn()
    const read = (): Promise<string> => singleFlight('tenant-a', { load, retry, commit })

    const detached = read()
    expect(singleFlight.invalidate('tenant-a')).toBe(true)
    staleWork.resolve('stale')

    await expect(detached).rejects.toBe(retryFailure)
    expect(retry).toHaveBeenCalledTimes(1)
    expect(commit).not.toHaveBeenCalled()
    expect(singleFlight.invalidate('tenant-a')).toBe(false)

    await expect(read()).resolves.toBe('recovered')
    expect(load).toHaveBeenCalledTimes(2)
    expect(commit).toHaveBeenCalledTimes(1)
    expect(commit).toHaveBeenCalledWith('recovered')
  })

  it('propagates a current failure without retrying or committing it', async () => {
    const singleFlight = createInvalidatableSingleFlightByKey<string>()
    const failure = new Error('current failure')
    const retry = vi.fn().mockResolvedValue('unexpected retry')
    const commit = vi.fn()

    await expect(
      singleFlight('tenant-a', {
        load: vi.fn().mockRejectedValue(failure),
        retry,
        commit,
      })
    ).rejects.toBe(failure)

    expect(retry).not.toHaveBeenCalled()
    expect(commit).not.toHaveBeenCalled()
  })

  it('cleans up the current flight when committing its result throws', async () => {
    const singleFlight = createInvalidatableSingleFlightByKey<string>()
    const commitFailure = new Error('commit failure')
    const load = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('recovered')
    const retry = vi.fn().mockResolvedValue('unexpected retry')
    const commit = vi.fn().mockImplementationOnce(() => {
      throw commitFailure
    })
    const read = (): Promise<string> => singleFlight('tenant-a', { load, retry, commit })

    const first = read()
    const joined = read()

    expect(joined).toBe(first)
    await expect(Promise.allSettled([first, joined])).resolves.toEqual([
      { status: 'rejected', reason: commitFailure },
      { status: 'rejected', reason: commitFailure },
    ])
    expect(singleFlight.invalidate('tenant-a')).toBe(false)

    await expect(read()).resolves.toBe('recovered')
    expect(load).toHaveBeenCalledTimes(2)
    expect(retry).not.toHaveBeenCalled()
    expect(commit).toHaveBeenCalledTimes(2)
    expect(commit).toHaveBeenLastCalledWith('recovered')
  })

  it('bounds consecutive invalidation handoffs and lets a later chain recover', async () => {
    const singleFlight = createInvalidatableSingleFlightByKey<string>()
    const loadCount = MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS + 2
    const work = Array.from({ length: loadCount }, () => Promise.withResolvers<string>())
    let loadIndex = 0
    const load = vi.fn(() => work[loadIndex++].promise)
    const commit = vi.fn()
    const retry = vi.fn(() => read())
    const read = (): Promise<string> =>
      singleFlight('tenant-a', {
        load,
        retry,
        commit,
      })

    const firstOutcome = read().then(
      (value) => ({ status: 'fulfilled' as const, value }),
      (reason) => ({ status: 'rejected' as const, reason })
    )

    for (let handoff = 0; handoff < MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS; handoff++) {
      expect(singleFlight.invalidate('tenant-a')).toBe(true)
      void read()
      work[handoff].resolve(`stale-${handoff}`)
      await Promise.resolve()
    }

    expect(load).toHaveBeenCalledTimes(MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS + 1)
    expect(singleFlight.invalidate('tenant-a')).toBe(true)

    await expect(firstOutcome).resolves.toEqual({
      status: 'rejected',
      reason: expect.any(SingleFlightInvalidationLimitError),
    })

    work[MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS].resolve('exhausted-stale')
    await Promise.resolve()

    expect(retry).toHaveBeenCalledTimes(MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS)
    expect(commit).not.toHaveBeenCalled()

    const recovered = read()
    work[MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS + 1].resolve('fresh')

    await expect(recovered).resolves.toBe('fresh')
    expect(commit).toHaveBeenCalledTimes(1)
    expect(commit).toHaveBeenCalledWith('fresh')
  })

  it('rejects every pending generation when the invalidation handoff limit is exhausted', async () => {
    const singleFlight = createInvalidatableSingleFlightByKey<string>()
    const loadCount = MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS + 1
    const work = Array.from({ length: loadCount }, () => Promise.withResolvers<string>())
    const outcomes: Array<
      { status: 'fulfilled'; value: string } | { status: 'rejected'; reason: unknown }
    > = []
    let loadIndex = 0
    const load = vi.fn(() => work[loadIndex++].promise)
    const retry = vi.fn(() => read())
    const commit = vi.fn()
    const read = (): Promise<string> => singleFlight('tenant-a', { load, retry, commit })

    for (let generation = 0; generation < loadCount; generation++) {
      const flight = read()
      void flight.then(
        (value) => outcomes.push({ status: 'fulfilled', value }),
        (reason) => outcomes.push({ status: 'rejected', reason })
      )
      expect(singleFlight.invalidate('tenant-a')).toBe(true)
    }

    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(load).toHaveBeenCalledTimes(loadCount)
    expect(outcomes).toHaveLength(loadCount)
    expect(outcomes).toEqual(
      Array.from({ length: loadCount }, () => ({
        status: 'rejected',
        reason: expect.any(SingleFlightInvalidationLimitError),
      }))
    )
    expect(retry).not.toHaveBeenCalled()
    expect(commit).not.toHaveBeenCalled()
  })

  it('stops canonical retries after the invalidation handoff limit', async () => {
    const singleFlight = createInvalidatableSingleFlightByKey<string>()
    const loadCount = MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS + 1
    const work = Array.from({ length: loadCount }, () => Promise.withResolvers<string>())
    let loadIndex = 0
    const load = vi.fn(() => work[loadIndex++].promise)
    const commit = vi.fn()
    const retry = vi.fn(() => read())
    const read = (): Promise<string> =>
      singleFlight('tenant-a', {
        load,
        retry,
        commit,
      })

    const first = read()

    for (let handoff = 0; handoff < MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS; handoff++) {
      expect(singleFlight.invalidate('tenant-a')).toBe(true)
      work[handoff].resolve(`stale-${handoff}`)
      await Promise.resolve()
    }

    expect(retry).toHaveBeenCalledTimes(MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS)
    expect(load).toHaveBeenCalledTimes(MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS + 1)
    expect(singleFlight.invalidate('tenant-a')).toBe(true)

    await expect(first).rejects.toBeInstanceOf(SingleFlightInvalidationLimitError)

    work[MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS].resolve('exhausted-stale')
    await Promise.resolve()

    expect(retry).toHaveBeenCalledTimes(MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS)
    expect(commit).not.toHaveBeenCalled()
  })

  it('preserves the handoff limit when retry synchronously invalidates its replacement', async () => {
    const singleFlight = createInvalidatableSingleFlightByKey<string>()
    const reentrantInvalidationCap = MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS + 8
    let reentrantInvalidations = 0
    const load = vi.fn(() => new Promise<string>(() => undefined))
    let read: () => Promise<string>
    const retry = vi.fn(() => {
      const replacement = read()

      if (reentrantInvalidations < reentrantInvalidationCap) {
        reentrantInvalidations++
        expect(singleFlight.invalidate('tenant-a')).toBe(true)
      }

      return replacement
    })
    read = (): Promise<string> => singleFlight('tenant-a', { load, retry })

    const firstOutcome = read().then(
      (value) => ({ status: 'fulfilled' as const, value }),
      (reason) => ({ status: 'rejected' as const, reason })
    )
    expect(singleFlight.invalidate('tenant-a')).toBe(true)

    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(retry).toHaveBeenCalledTimes(MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS)
    expect(reentrantInvalidations).toBe(MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS)
    expect(load).toHaveBeenCalledTimes(MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS + 1)
    await expect(firstOutcome).resolves.toEqual({
      status: 'rejected',
      reason: expect.any(SingleFlightInvalidationLimitError),
    })
    expect(singleFlight.invalidate('tenant-a')).toBe(false)
  })
})
