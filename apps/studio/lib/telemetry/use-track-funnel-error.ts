import { useCallback } from 'react'

import type { FunnelErrorClassification, FunnelOrigin } from '@/lib/telemetry/funnel-errors'
import { useTrack } from '@/lib/telemetry/track'

// Matches the existing dashboard_error_created capture rate; keeps PostHog volume bounded.
const SAMPLE_RATE = 0.1

export function useTrackFunnelError() {
  const track = useTrack()
  return useCallback(
    (
      origin: FunnelOrigin,
      classification: FunnelErrorClassification,
      source: 'toast' | 'form' = 'toast'
    ) => {
      if (Math.random() >= SAMPLE_RATE) return
      track('dashboard_error_created', {
        source,
        origin,
        errorCategory: classification.errorCategory,
        errorReason: classification.errorReason,
        ...(classification.errorCode !== undefined && { errorCode: classification.errorCode }),
      })
    },
    [track]
  )
}
