'use client'

import * as Sentry from '@sentry/nextjs'
import NextError from 'next/error'
import { useEffect, useRef } from 'react'

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  const errorRef = useRef<HTMLElement>(null)

  useEffect(() => {
    errorRef.current?.focus()
    Sentry.captureException(error, { tags: { globalErrorBoundary: true } })
  }, [error])

  return (
    <html lang="en">
      <body>
        <main ref={errorRef} tabIndex={-1} aria-label="Page error">
          <NextError statusCode={0} />
        </main>
      </body>
    </html>
  )
}
