import { useReducedMotion } from 'common'
import { useEffect, useState } from 'react'

import {
  getFailoverSimulationDelayMs,
  getFailoverSimulationPhase,
  type FailoverSimulationPhase,
} from './simulateFailover.utils'

/**
 * When `enabled` (the `simulateFailover` query param), plays a one-shot
 * healthy → promoting → failover sequence. Reduced-motion users skip to
 * the completed failover layout.
 */
export const useSimulatedFailover = (enabled: boolean): FailoverSimulationPhase => {
  const prefersReducedMotion = useReducedMotion()
  const [elapsedMs, setElapsedMs] = useState(0)

  useEffect(() => {
    if (!enabled || prefersReducedMotion) {
      setElapsedMs(0)
      return
    }

    const startedAt = Date.now()
    setElapsedMs(0)
    let timeoutId: ReturnType<typeof setTimeout>

    const tick = () => {
      const nextElapsedMs = Date.now() - startedAt
      setElapsedMs(nextElapsedMs)
      const delay = getFailoverSimulationDelayMs(nextElapsedMs)
      if (delay !== undefined) {
        timeoutId = setTimeout(tick, delay)
      }
    }

    timeoutId = setTimeout(tick, getFailoverSimulationDelayMs(0) ?? 0)
    return () => clearTimeout(timeoutId)
  }, [enabled, prefersReducedMotion])

  return getFailoverSimulationPhase({ enabled, elapsedMs, prefersReducedMotion })
}
