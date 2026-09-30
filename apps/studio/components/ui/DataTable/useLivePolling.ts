import { useEffect, useRef } from 'react'

import {
  getLivePollDelay,
  isEmptyLivePoll,
  LIVE_MODE_IDLE_TIMEOUT_MS,
  LIVE_POLL_BASE_INTERVAL_MS,
} from './LiveButton.utils'

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'scroll'] as const
const ACTIVITY_THROTTLE_MS = 1_000

interface UseLivePollingOptions {
  isEnabled: boolean
  /** Fetches new rows. Its resolved value is inspected to back off when nothing new arrives. */
  poll: () => Promise<unknown>
  /** Called once the page has been visible with no user activity for the idle timeout. */
  onIdle: () => void
}

/**
 * Runs live-mode polling while `isEnabled`:
 * - Polls every 10s, backing off to 60s while polls find no new rows.
 * - Stops while the tab is hidden, and polls immediately when it becomes visible again.
 * - Calls `onIdle` after 15 minutes of visible time without pointer, key, wheel, or scroll activity.
 * Activity and becoming visible reset the backoff.
 */
export function useLivePolling({ isEnabled, poll, onIdle }: UseLivePollingOptions) {
  // Latest callbacks, so a new function identity doesn't restart the polling loop.
  const pollRef = useRef(poll)
  const onIdleRef = useRef(onIdle)
  useEffect(() => {
    pollRef.current = poll
    onIdleRef.current = onIdle
  }, [poll, onIdle])

  useEffect(() => {
    if (!isEnabled) return

    let isStopped = false
    let isPolling = false
    let consecutiveEmptyPolls = 0
    let pollTimeoutId: ReturnType<typeof setTimeout> | undefined
    let idleTimeoutId: ReturnType<typeof setTimeout> | undefined
    let lastActivityAt = 0

    const isHidden = () => document.visibilityState === 'hidden'

    const schedulePoll = (delay: number) => {
      clearTimeout(pollTimeoutId)
      pollTimeoutId = setTimeout(runPoll, delay)
    }

    async function runPoll() {
      if (isStopped || isHidden() || isPolling) return
      isPolling = true
      try {
        const result = await pollRef.current()
        consecutiveEmptyPolls = isEmptyLivePoll(result) ? consecutiveEmptyPolls + 1 : 0
      } catch {
        // A failed poll shouldn't end live mode; retry at the current backoff.
      } finally {
        isPolling = false
      }
      if (!isStopped && !isHidden()) schedulePoll(getLivePollDelay(consecutiveEmptyPolls))
    }

    const startIdleTimer = () => {
      clearTimeout(idleTimeoutId)
      idleTimeoutId = setTimeout(() => {
        if (!isStopped) onIdleRef.current()
      }, LIVE_MODE_IDLE_TIMEOUT_MS)
    }

    const handleActivity = () => {
      const now = Date.now()
      if (now - lastActivityAt < ACTIVITY_THROTTLE_MS) return
      lastActivityAt = now
      startIdleTimer()
      // Someone is watching again: return to the base interval instead of waiting out a backoff.
      if (consecutiveEmptyPolls > 0) {
        consecutiveEmptyPolls = 0
        if (!isPolling && !isHidden()) schedulePoll(LIVE_POLL_BASE_INTERVAL_MS)
      }
    }

    const handleVisibilityChange = () => {
      if (isHidden()) {
        // Hidden tabs neither poll nor count toward the idle timeout.
        clearTimeout(pollTimeoutId)
        clearTimeout(idleTimeoutId)
        return
      }
      consecutiveEmptyPolls = 0
      startIdleTimer()
      clearTimeout(pollTimeoutId)
      void runPoll()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true, capture: true })
    }

    if (!isHidden()) {
      startIdleTimer()
      void runPoll()
    }

    return () => {
      isStopped = true
      clearTimeout(pollTimeoutId)
      clearTimeout(idleTimeoutId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity, { capture: true })
      }
    }
  }, [isEnabled])
}
