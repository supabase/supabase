import { useEffect, useRef, useState } from 'react'

import {
  getPersistedTransitionStartTime,
  getRemainingTransitionTimeMs,
  hoursToMilliseconds,
  MAX_PERSISTED_TRANSITION_AGE_HOURS,
} from '@/lib/project-transition-state'

interface UseLongRunningTransitionStateParams {
  storageKey: string | null
  thresholdMs: number
}

export const useLongRunningTransitionState = ({
  storageKey,
  thresholdMs,
}: UseLongRunningTransitionStateParams) => {
  const [isTakingLongerThanExpected, setIsTakingLongerThanExpected] = useState(false)
  const fallbackStartTimeRef = useRef<number | null>(null)

  useEffect(() => {
    const now = Date.now()
    const fallbackStartTime = fallbackStartTimeRef.current ?? now
    fallbackStartTimeRef.current = fallbackStartTime

    const startTime = storageKey
      ? getPersistedTransitionStartTime(
          storageKey,
          now,
          hoursToMilliseconds(MAX_PERSISTED_TRANSITION_AGE_HOURS)
        )
      : fallbackStartTime

    const remainingThresholdMs = getRemainingTransitionTimeMs({
      startTimeMs: startTime,
      thresholdMs,
      now,
    })

    if (remainingThresholdMs === 0) {
      setIsTakingLongerThanExpected(true)
      return
    }

    setIsTakingLongerThanExpected(false)
    const timeoutId = setTimeout(() => setIsTakingLongerThanExpected(true), remainingThresholdMs)
    return () => clearTimeout(timeoutId)
  }, [storageKey, thresholdMs])

  return isTakingLongerThanExpected
}
