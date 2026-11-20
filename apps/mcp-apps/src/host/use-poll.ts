import { useEffect, useRef, useState } from 'react'

export const POLL_INTERVAL_MS = 5000
export const POLL_TIMEOUT_MS = 10 * 60 * 1000
/** Consecutive failed polls tolerated before giving up with `error`. */
export const POLL_MAX_RETRIES = 2

/**
 * Where polling is. `data` is the latest successful result: always there once
 * done, and there in the other states once any poll has succeeded (after an
 * error, it's the result from before the error).
 */
export type PollState<T> =
  | { status: 'running'; data?: T }
  | { status: 'done'; data: T }
  | { status: 'timeout'; data?: T }
  | { status: 'error'; error: Error; data?: T }

/**
 * Calls `fetcher` immediately and then every `intervalMs` (default
 * `POLL_INTERVAL_MS`) until `isTerminal` returns true, `timeoutMs` (default
 * `POLL_TIMEOUT_MS`) passes, or the component unmounts. A poll that fails
 * (`fetcher` or `isTerminal` throws) is retried on the next tick, up to
 * `maxRetries` (default `POLL_MAX_RETRIES`) times in a row, so one blip doesn't
 * end live progress; after that, polling stops with `error`. `enabled` false
 * pauses everything (e.g. before the host connects).
 *
 * `done` is final. Otherwise, changing `enabled`, `intervalMs`, `timeoutMs` or
 * `maxRetries` starts a new polling session: back to `running` (keeping
 * `data`), with a fresh timeout and retry count, including after `timeout` or
 * `error`, which only mean polling stopped.
 *
 * `fetcher` and `isTerminal` may change identity every render.
 */
export function usePoll<T>({
  fetcher,
  isTerminal,
  enabled = true,
  intervalMs = POLL_INTERVAL_MS,
  timeoutMs = POLL_TIMEOUT_MS,
  maxRetries = POLL_MAX_RETRIES,
  restartKey,
}: {
  fetcher: () => Promise<T>
  isTerminal: (data: T) => boolean
  enabled?: boolean
  intervalMs?: number
  timeoutMs?: number
  maxRetries?: number
  /** Change it to start a new polling session on demand, e.g. from Retry. */
  restartKey?: unknown
}): PollState<T> {
  const [state, setState] = useState<PollState<T>>({ status: 'running' })
  const done = useRef(false)

  const callbacks = useRef({ fetcher, isTerminal })
  useEffect(() => {
    callbacks.current = { fetcher, isTerminal }
  })

  useEffect(() => {
    if (!enabled || done.current) return
    // A new session: leave `timeout` or `error` from the previous one.
    setState((current) =>
      current.status === 'running' ? current : { status: 'running', data: current.data }
    )
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let failures = 0
    const startedAt = Date.now()

    const outOfTime = () => Date.now() - startedAt + intervalMs >= timeoutMs

    const tick = async () => {
      try {
        const next = await callbacks.current.fetcher()
        if (stopped) return
        const terminal = callbacks.current.isTerminal(next)
        failures = 0
        if (terminal) {
          done.current = true
          setState({ status: 'done', data: next })
          return
        }
        if (outOfTime()) {
          setState({ status: 'timeout', data: next })
          return
        }
        setState({ status: 'running', data: next })
      } catch (err) {
        if (stopped) return
        failures += 1
        if (failures > maxRetries) {
          setState((current) => ({
            status: 'error',
            error: err instanceof Error ? err : new Error(String(err)),
            data: current.data,
          }))
          return
        }
        if (outOfTime()) {
          setState((current) => ({ status: 'timeout', data: current.data }))
          return
        }
      }
      timer = setTimeout(tick, intervalMs)
    }
    void tick()

    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [enabled, intervalMs, timeoutMs, maxRetries, restartKey])

  return state
}
