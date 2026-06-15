import { useEffect, useRef } from 'react'
import { useSonner } from 'sonner'

import { categorizeError } from '@/lib/telemetry/categorizeError'
import { useTrack } from '@/lib/telemetry/track'

export const ToastErrorTracker = () => {
  const track = useTrack()
  const { toasts } = useSonner()
  const trackRef = useRef(new Set<string | number>())

  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.type === 'error' && !trackRef.current.has(toast.id)) {
        trackRef.current.add(toast.id)
        if (Math.random() < 0.1) {
          // Only the rendered title is available here and it may contain PII, so
          // categorizeError extracts a PII-free code/type and never the text.
          // Non-string titles (ReactNode) yield `errorType: 'unknown'`.
          const title = typeof toast.title === 'string' ? toast.title : ''
          track('dashboard_error_created', {
            source: 'toast',
            ...categorizeError(title),
          })
        }
      }
    })
  }, [toasts, track])

  return null
}
