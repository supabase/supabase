import { useTrackExperimentExposure } from 'hooks/misc/useTrackExperimentExposure'
import { usePHFlag } from 'hooks/ui/useFlag'
import { IS_PLATFORM } from 'lib/constants'
import { useMemo } from 'react'

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
  const realtimeButtonVariant = usePHFlag<RealtimeButtonVariant>('realtimeButtonVariant')

  const activeVariant = useMemo(() => {
    if (!IS_PLATFORM) return null
    if (!isTable) return null
    if (!realtimeButtonVariant) return null
    if (realtimeButtonVariant === RealtimeButtonVariant.CONTROL) return null
    return realtimeButtonVariant
  }, [isTable, realtimeButtonVariant])

  const shouldTrack = IS_PLATFORM && isTable && !!realtimeButtonVariant

  useTrackExperimentExposure('realtime', shouldTrack ? realtimeButtonVariant : undefined, {
    table_has_realtime_enabled: isRealtimeEnabled,
  })

  return {
    activeVariant,
  }
}
