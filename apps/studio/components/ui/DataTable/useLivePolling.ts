import { useEffect, useRef } from 'react'

import {
  getLivePollDelay,
  hasNoNewRows,
  LIVE_MODE_IDLE_TIMEOUT_MS,
  LIVE_POLL_BASE_INTERVAL_MS,
} from './LiveButton.utils'

// No `scroll`: the browser fires it for scroll anchoring when new rows are prepended, which
// would count each poll as activity. Wheel, key, and pointer events cover user scrolling.
const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel'] as const
const ACTIVITY_THROTTLE_MS = 1_000

interface UseLivePollingOptions {
  isEnabled: boolean
  /** Fetches new rows. Its resolved value is inspected to back off when nothing new arrives. */
  poll: () => Promise<unknown>
  /** Called once the page has been visible for the idle timeout with no user activity. */
  onIdle: () => void
}

/**
 * Runs live-mode polling while `isEnabled`:
 * - Polls every 10s, backing off to 60s while polls find no new rows.
 * - Stops while the tab is hidden, and polls immediately when it becomes visible again.
 * - Calls `onIdle` after 15 minutes visible without pointer, key, or wheel activity. Hiding the
 *   tab stops the idle timer, and showing it again restarts the full 15 minutes.
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
    let nextPollAt = 0
    let idleTimeoutId: ReturnType<typeof setTimeout> | undefined
    let lastActivityAt = 0

    const isHidden = () => document.visibilityState === 'hidden'

    const schedulePoll = (delay: number) => {
      clearTimeout(pollTimeoutId)
      nextPollAt = Date.now() + delay
      pollTimeoutId = setTimeout(runPoll, delay)
    }

    async function runPoll() {
      if (isStopped || isHidden() || isPolling) return
      isPolling = true
      try {
        const result = await pollRef.current()
        consecutiveEmptyPolls = hasNoNewRows(result) ? consecutiveEmptyPolls + 1 : 0
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
      // Someone is watching again: return to the base interval instead of waiting out a backoff,
      // without delaying a poll that was already due sooner.
      if (consecutiveEmptyPolls > 0) {
        consecutiveEmptyPolls = 0
        if (!isPolling && !isHidden()) {
          schedulePoll(Math.min(Math.max(nextPollAt - now, 0), LIVE_POLL_BASE_INTERVAL_MS))
        }
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
