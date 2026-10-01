import { hasConsented, posthogClient } from 'common'
import { useEffect } from 'react'

export function useTrackExperimentExposure(experimentId: string, variant: string | undefined) {
  useEffect(() => {
    if (!variant) return

    posthogClient.captureExperimentExposure(experimentId, { variant }, hasConsented())
  }, [experimentId, variant])
}
