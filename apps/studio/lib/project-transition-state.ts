export const FALLBACK_LONG_RUNNING_STATE_THRESHOLD_MINUTES = 10
// Persist long enough for same-browser reloads, but not so long that a later transition reuses stale state.
export const MAX_PERSISTED_TRANSITION_AGE_HOURS = 24

const MS_PER_MINUTE = 60 * 1000
const MS_PER_HOUR = 60 * MS_PER_MINUTE

export const minutesToMilliseconds = (minutes: number) => minutes * MS_PER_MINUTE
export const hoursToMilliseconds = (hours: number) => hours * MS_PER_HOUR

export const getPersistedTransitionStartTime = (
  storageKey: string,
  now = Date.now(),
  maxAgeMs = Number.POSITIVE_INFINITY
) => {
  if (typeof window === 'undefined') return now

  const existingValue = window.localStorage.getItem(storageKey)

  if (existingValue !== null) {
    const parsedStartTime = Number(existingValue)
    const elapsedMs = now - parsedStartTime

    if (
      Number.isFinite(parsedStartTime) &&
      parsedStartTime > 0 &&
      elapsedMs >= 0 &&
      elapsedMs <= maxAgeMs
    ) {
      return parsedStartTime
    }
  }

  window.localStorage.setItem(storageKey, String(now))
  return now
}

export const clearPersistedTransitionStartTime = (storageKey: string) => {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(storageKey)
}

export const getRemainingTransitionTimeMs = ({
  startTimeMs,
  thresholdMs,
  now = Date.now(),
}: {
  startTimeMs: number
  thresholdMs: number
  now?: number
}) => {
  const elapsedMs = now - startTimeMs
  return Math.max(thresholdMs - elapsedMs, 0)
}
