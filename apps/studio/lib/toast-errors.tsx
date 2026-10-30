import { useEffect } from 'react'
import { useSonner } from 'sonner'

import { isDashboardErrorSampled } from '@/lib/telemetry/error-sampling'
import type { FunnelErrorClassification, FunnelOrigin } from '@/lib/telemetry/funnel-errors'
import { useTrack } from '@/lib/telemetry/track'

type FunnelErrorProperties = { origin: FunnelOrigin } & FunnelErrorClassification

// Funnel call sites register their toast id (via useTrackFunnelError) so the tracker emits a
// single enriched event for that toast instead of an untagged duplicate.
const funnelErrorToasts = new Map<string | number, FunnelErrorProperties>()
const seenToastIds = new Set<string | number>()

export function registerFunnelErrorToast(
  toastId: string | number,
  properties: FunnelErrorProperties
) {
  funnelErrorToasts.set(toastId, properties)
}

export const ToastErrorTracker = () => {
  const track = useTrack()
  const { toasts } = useSonner()

  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.type !== 'error' || seenToastIds.has(toast.id)) return
      seenToastIds.add(toast.id)
      const funnelProperties = funnelErrorToasts.get(toast.id)
      funnelErrorToasts.delete(toast.id)
      if (isDashboardErrorSampled()) {
        track('dashboard_error_created', {
          source: 'toast',
          ...funnelProperties,
        })
      }
    })
  }, [toasts, track])

  return null
}
