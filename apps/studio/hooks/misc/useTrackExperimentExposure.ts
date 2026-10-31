import { hasConsented, posthogClient } from 'common'
import { useEffect } from 'react'

export function useTrackExperimentExposure(
  experimentId: string,
  variant: string | undefined,
  extraProperties?: Record<string, any>
) {
  useEffect(() => {
    if (!variant) return

    posthogClient.captureExperimentExposure(
      experimentId,
      { variant, ...extraProperties },
      hasConsented()
    )
  }, [experimentId, variant])
}
