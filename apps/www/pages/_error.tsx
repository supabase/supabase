import * as Sentry from '@sentry/nextjs'
import type { NextPageContext } from 'next'
import NextError, { type ErrorProps } from 'next/error'
import { useEffect, useRef } from 'react'

export default function CustomError(props: ErrorProps) {
  const errorRef = useRef<HTMLElement>(null)

  useEffect(() => {
    errorRef.current?.focus()
  }, [])

  return (
    <main ref={errorRef} tabIndex={-1} aria-label="Page error">
      <NextError statusCode={props.statusCode} />
    </main>
  )
}

CustomError.getInitialProps = async (context: NextPageContext) => {
  await Sentry.withScope(async (scope) => {
    scope.setTag('globalErrorBoundary', true)
    await Sentry.captureUnderscoreErrorException(context)
  })

  return NextError.getInitialProps(context)
}
