import { useCallback } from 'react'

import { isDashboardErrorSampled } from '@/lib/telemetry/error-sampling'
import type { FunnelErrorClassification, FunnelOrigin } from '@/lib/telemetry/funnel-errors'
import { useTrack } from '@/lib/telemetry/track'
import { registerFunnelErrorToast } from '@/lib/toast-errors'

interface TrackFunnelError {
  /**
   * Toast-sourced errors are emitted by ToastErrorTracker as a single enriched
   * dashboard_error_created event. Pass the id returned by toast.error() so the tracker
   * attaches the funnel properties instead of firing an untagged duplicate.
   *
   * Call this in the same synchronous block that created the toast — the tracker processes
   * new toasts in an effect on the next render, so registering after an await could be too
   * late and the event would go out untagged.
   */
  (
    origin: FunnelOrigin,
    classification: FunnelErrorClassification,
    source: 'toast',
    toastId: string | number
  ): void
  (origin: FunnelOrigin, classification: FunnelErrorClassification, source: 'form'): void
}

export function useTrackFunnelError() {
  const track = useTrack()
  return useCallback<TrackFunnelError>(
    (
      origin: FunnelOrigin,
      classification: FunnelErrorClassification,
      source: 'toast' | 'form',
      toastId?: string | number
    ) => {
      const properties = {
        origin,
        errorCategory: classification.errorCategory,
        errorReason: classification.errorReason,
        ...(classification.errorCode !== undefined && { errorCode: classification.errorCode }),
      }
      if (source === 'toast') {
        if (toastId !== undefined) registerFunnelErrorToast(toastId, properties)
        return
      }
      // Form-sourced events are sampled here — toast-sourced events are sampled once by
      // ToastErrorTracker, which is the sole emitter for them.
      if (!isDashboardErrorSampled()) return
      track('dashboard_error_created', { source, ...properties })
    },
    [track]
  )
}
