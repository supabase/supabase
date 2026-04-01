export const FALLBACK_LONG_RUNNING_STATE_THRESHOLD_MINUTES = 10

const MS_PER_MINUTE = 60 * 1000

export const minutesToMilliseconds = (minutes: number) => minutes * MS_PER_MINUTE

export const getPersistedTransitionStartTime = (storageKey: string, now = Date.now()) => {
  if (typeof window === 'undefined') return now

  const existingValue = window.localStorage.getItem(storageKey)

  if (existingValue !== null) {
    const parsedStartTime = Number(existingValue)

    if (Number.isFinite(parsedStartTime) && parsedStartTime > 0) {
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
