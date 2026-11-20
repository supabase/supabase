import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { usePoll } from './use-poll'

const INTERVAL = 1000

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

/** Lets the pending fetch settle, then advances to the next poll. */
const nextPoll = () => act(() => vi.advanceTimersByTimeAsync(INTERVAL))
const flush = () => act(() => vi.advanceTimersByTimeAsync(0))

function setup(
  fetcher: () => Promise<number>,
  opts: {
    isTerminal?: (n: number) => boolean
    enabled?: boolean
    timeoutMs?: number
    maxRetries?: number
  } = {}
) {
  return renderHook(() =>
    usePoll({
      fetcher,
      isTerminal: opts.isTerminal ?? ((n) => n >= 3),
      intervalMs: INTERVAL,
      timeoutMs: opts.timeoutMs,
      enabled: opts.enabled,
      maxRetries: opts.maxRetries,
    })
  )
}

describe('usePoll', () => {
  it('starts running with no data', () => {
    const { result } = setup(() => new Promise(() => {}))
    expect(result.current).toEqual({ status: 'running' })
  })

  it('keeps running with the latest data until terminal, then is done', async () => {
    let n = 0
    const fetcher = vi.fn(async () => ++n)
    const { result } = setup(fetcher)

    await flush()
    expect(result.current).toEqual({ status: 'running', data: 1 })
    await nextPoll()
    expect(result.current).toEqual({ status: 'running', data: 2 })
    await nextPoll()
    expect(result.current).toEqual({ status: 'done', data: 3 })

    await nextPoll()
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  it('retries a failing fetcher and recovers, keeping data', async () => {
    const fetcher = vi
      .fn<() => Promise<number>>()
      .mockResolvedValueOnce(1)
      .mockRejectedValueOnce(new Error('blip'))
      .mockRejectedValueOnce(new Error('blip'))
      .mockResolvedValueOnce(2)
    const { result } = setup(fetcher, { maxRetries: 2 })

    await flush()
    await nextPoll()
    expect(result.current).toEqual({ status: 'running', data: 1 })
    await nextPoll()
    expect(result.current).toEqual({ status: 'running', data: 1 })
    await nextPoll()
    expect(result.current).toEqual({ status: 'running', data: 2 })
  })

  it('errors after more than maxRetries consecutive failures, keeping data', async () => {
    const fetcher = vi
      .fn<() => Promise<number>>()
      .mockResolvedValueOnce(1)
      .mockRejectedValue(new Error('down'))
    const { result } = setup(fetcher, { maxRetries: 2 })

    await flush()
    await nextPoll()
    await nextPoll()
    expect(result.current.status).toBe('running')
    await nextPoll()
    expect(result.current).toMatchObject({
      status: 'error',
      error: new Error('down'),
      data: 1,
    })

    await nextPoll()
    expect(fetcher).toHaveBeenCalledTimes(4)
  })

  it('wraps non-Error rejections', async () => {
    const { result } = setup(() => Promise.reject('nope'), { maxRetries: 0 })
    await flush()
    expect(result.current).toMatchObject({
      status: 'error',
      error: new Error('nope'),
    })
  })

  it('counts a throwing isTerminal as a failure', async () => {
    const isTerminal = vi.fn((n: number) => {
      if (n === 2) throw new Error('bad data')
      return n >= 3
    })
    let n = 0
    const { result } = setup(async () => ++n, { isTerminal, maxRetries: 1 })

    await flush()
    expect(result.current).toEqual({ status: 'running', data: 1 })
    await nextPoll() // n=2 throws: first failure, retried
    expect(result.current).toEqual({ status: 'running', data: 1 })
    await nextPoll() // n=3 succeeds and is terminal
    expect(result.current).toEqual({ status: 'done', data: 3 })
  })

  it('ends in error when isTerminal keeps throwing', async () => {
    const { result } = setup(async () => 1, {
      isTerminal: () => {
        throw new Error('always')
      },
      maxRetries: 1,
    })
    await flush()
    await nextPoll()
    expect(result.current).toMatchObject({
      status: 'error',
      error: new Error('always'),
    })
  })

  it('times out once timeoutMs passes, keeping data', async () => {
    let n = 0
    const { result } = setup(async () => ++n, {
      isTerminal: () => false,
      timeoutMs: 3 * INTERVAL,
    })
    await flush()
    await nextPoll()
    expect(result.current.status).toBe('running')
    await nextPoll()
    expect(result.current).toEqual({ status: 'timeout', data: 3 })
  })

  it('times out while retrying a failing fetcher', async () => {
    const { result } = setup(() => Promise.reject(new Error('x')), {
      timeoutMs: 2 * INTERVAL,
      maxRetries: 10,
    })
    await flush()
    await nextPoll()
    expect(result.current.status).toBe('timeout')
  })

  it('never calls the fetcher when disabled', async () => {
    const fetcher = vi.fn(async () => 1)
    const { result } = setup(fetcher, { enabled: false })
    await nextPoll()
    await nextPoll()
    expect(fetcher).not.toHaveBeenCalled()
    expect(result.current).toEqual({ status: 'running' })
  })

  it('stays done when a dependency changes', async () => {
    const fetcher = vi.fn(async () => 1)
    const { result, rerender } = renderHook(
      ({ timeoutMs }) =>
        usePoll({
          fetcher,
          isTerminal: () => true,
          intervalMs: INTERVAL,
          timeoutMs,
        }),
      { initialProps: { timeoutMs: 10 * INTERVAL } }
    )
    await flush()
    expect(result.current).toEqual({ status: 'done', data: 1 })

    rerender({ timeoutMs: 20 * INTERVAL })
    await nextPoll()
    expect(result.current).toEqual({ status: 'done', data: 1 })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('starts a new session when a dependency changes after error', async () => {
    let fail = true
    const fetcher = vi.fn(async () => {
      if (fail) throw new Error('down')
      return 3
    })
    const { result, rerender } = renderHook(
      ({ maxRetries }) =>
        usePoll({
          fetcher,
          isTerminal: (x) => x >= 3,
          intervalMs: INTERVAL,
          maxRetries,
        }),
      { initialProps: { maxRetries: 0 } }
    )
    await flush()
    expect(result.current).toMatchObject({ status: 'error' })

    fail = false
    rerender({ maxRetries: 1 })
    expect(result.current).toEqual({ status: 'running', data: undefined })
    await flush()
    expect(result.current).toEqual({ status: 'done', data: 3 })
  })

  it('resumes after error when restartKey changes', async () => {
    let fail = true
    let n = 0
    const fetcher = vi.fn(async () => {
      if (fail) throw new Error('down')
      return ++n
    })
    const { result, rerender } = renderHook(
      ({ restartKey }) =>
        usePoll({
          fetcher,
          isTerminal: (x) => x >= 2,
          intervalMs: INTERVAL,
          maxRetries: 0,
          restartKey,
        }),
      { initialProps: { restartKey: 0 } }
    )
    await flush()
    expect(result.current).toMatchObject({ status: 'error' })

    fail = false
    rerender({ restartKey: 1 })
    await flush()
    expect(result.current).toEqual({ status: 'running', data: 1 })
    await nextPoll()
    expect(result.current).toEqual({ status: 'done', data: 2 })
  })

  it('stops polling on unmount', async () => {
    const fetcher = vi.fn(async () => 1)
    const { unmount } = setup(fetcher, { isTerminal: () => false })
    await flush()
    expect(fetcher).toHaveBeenCalledTimes(1)
    unmount()
    await nextPoll()
    await nextPoll()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
