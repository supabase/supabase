import { useEffect, useRef } from 'react'
import { useSonner } from 'sonner'
import { useTrack } from 'lib/telemetry/track'

export const ToastErrorTracker = () => {
  const track = useTrack()
  const { toasts } = useSonner()
  const trackRef = useRef(new Set<string | number>())

  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.type === 'error' && !trackRef.current.has(toast.id)) {
        trackRef.current.add(toast.id)
        if (Math.random() < 0.1) {
          track('dashboard_error_created', {
            source: 'toast',
          })
        }
      }
    })
  }, [toasts, track])

  return null
}
