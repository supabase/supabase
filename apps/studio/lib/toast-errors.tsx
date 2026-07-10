import { useEffect, useRef } from 'react'
import { useSonner } from 'sonner'

import { useTrack } from '@/lib/telemetry/track'

const trackedToastIds = new Set<string | number>()

export function markToastAsTracked(toastId: string | number) {
  trackedToastIds.add(toastId)
  return toastId
}

export const ToastErrorTracker = () => {
  const track = useTrack()
  const { toasts } = useSonner()
  const seenToastIds = useRef(new Set<string | number>())

  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.type !== 'error' || seenToastIds.current.has(toast.id)) return
      seenToastIds.current.add(toast.id)
      if (trackedToastIds.has(toast.id)) return
      if (Math.random() < 0.1) {
        track('dashboard_error_created', {
          source: 'toast',
        })
      }
    })
  }, [toasts, track])

  return null
}
