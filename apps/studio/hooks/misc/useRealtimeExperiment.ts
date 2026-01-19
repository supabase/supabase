import { useEffect, useMemo, useRef } from 'react'

import { usePHFlag } from 'hooks/ui/useFlag'
import { IS_PLATFORM } from 'lib/constants'
import { useTrack } from 'lib/telemetry/track'

export enum RealtimeButtonVariant {
  CONTROL = 'control',
  HIDE_BUTTON = 'hide-button',
  TRIGGERS = 'triggers',
}

interface UseRealtimeExperimentOptions {
  /** Whether the current context is a table (not a view/foreign table) */
  isTable?: boolean
  /** Whether realtime is currently enabled for the table */
  isRealtimeEnabled?: boolean
}

interface UseRealtimeExperimentResult {
  /** The active variant for this user, or null if not in experiment */
  activeVariant: RealtimeButtonVariant | null
}

/**
 * Hook to manage the realtime button A/B experiment.
 * User targeting is handled via PostHog experiment configuration.
 */
export function useRealtimeExperiment({
  isTable = false,
  isRealtimeEnabled = false,
}: UseRealtimeExperimentOptions): UseRealtimeExperimentResult {
  const track = useTrack()
  const realtimeButtonVariant = usePHFlag<RealtimeButtonVariant>('realtimeButtonVariant')
  const hasTrackedExposure = useRef(false)

  const activeVariant = useMemo(() => {
    if (!IS_PLATFORM) return null
    if (!isTable) return null
    if (!realtimeButtonVariant) return null
    if (realtimeButtonVariant === RealtimeButtonVariant.CONTROL) return null
    return realtimeButtonVariant
  }, [isTable, realtimeButtonVariant])

  useEffect(() => {
    if (!IS_PLATFORM) return
    if (hasTrackedExposure.current) return
    if (!isTable || !realtimeButtonVariant) return

    hasTrackedExposure.current = true

    try {
      track('realtime_experiment_exposed', {
        experiment_id: 'realtimeButtonVariant',
        variant: realtimeButtonVariant,
        table_has_realtime_enabled: isRealtimeEnabled,
      })
    } catch (error) {
      // Reset tracking flag on error to allow retry
      hasTrackedExposure.current = false
      console.error('Failed to track realtime experiment exposure:', error)
    }
  }, [isTable, realtimeButtonVariant, isRealtimeEnabled, track])

  return {
    activeVariant,
  }
}
