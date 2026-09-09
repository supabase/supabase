'use client'

import * as Sentry from '@sentry/nextjs'
import NextError from 'next/error'
import { useEffect } from 'react'

/**
 * Global root error boundary for the www app.
 * Captures unhandled client-side exceptions with Sentry and auto-reloads
 * on ChunkLoadErrors to seamlessly recover fresh assets after deployments.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  const isChunkError =
    error?.name === 'ChunkLoadError' ||
    Boolean(error?.message && error.message.includes('Loading chunk')) ||
    Boolean(error?.message && error.message.includes('Failed to fetch RSC payload'))

  useEffect(() => {
    if (isChunkError && typeof window !== 'undefined') {
      const storageKey = 'supabase_chunk_reload'
      const lastReload = sessionStorage.getItem(storageKey)
      const now = Date.now()
      // Automatically refresh once to recover if a deploy replaced the chunk hash
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem(storageKey, now.toString())
        window.location.reload()
      }
    }
  }, [isChunkError])

  return (
    <html>
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
