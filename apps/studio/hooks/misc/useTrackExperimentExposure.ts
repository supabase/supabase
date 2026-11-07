import { hasConsented, posthogClient } from 'common'
import { EXPERIMENTS, type ExperimentKey } from 'common/telemetry-constants'
import { useEffect } from 'react'

/**
 * Captures a PostHog experiment exposure. Looks up the exposure event name
 * from the EXPERIMENTS registry and emits `${exposureName}_experiment_exposed`.
 * Register new experiments in `packages/common/telemetry-constants.ts`
 * before calling this hook.
 */
export function useTrackExperimentExposure(
  experimentKey: ExperimentKey,
  variant: string | undefined,
  extraProperties?: Record<string, any>
) {
  useEffect(() => {
    if (!variant) return

    posthogClient.captureExperimentExposure(
      EXPERIMENTS[experimentKey],
      { variant, ...extraProperties },
      hasConsented()
    )
  }, [experimentKey, variant])
}
