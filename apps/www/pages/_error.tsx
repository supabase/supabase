import * as Sentry from '@sentry/nextjs'
import type { NextPageContext } from 'next'
import NextError, { type ErrorProps } from 'next/error'

export default function CustomError(props: ErrorProps) {
  return <NextError statusCode={props.statusCode} />
}

CustomError.getInitialProps = async (context: NextPageContext) => {
  await Sentry.withScope(async (scope) => {
    scope.setTag('globalErrorBoundary', true)
    await Sentry.captureUnderscoreErrorException(context)
  })

  return NextError.getInitialProps(context)
}
