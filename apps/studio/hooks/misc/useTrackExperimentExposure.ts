import { useEffect } from 'react'

import { hasConsented, posthogClient } from 'common'

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
