import * as Sentry from '@sentry/nextjs'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

import { getErrorMessage } from 'lib/get-error-message'

dayjs.extend(duration)

export const formatDuration = (milliseconds: number) => {
  const duration = dayjs.duration(milliseconds, 'milliseconds')

  const days = Math.floor(duration.asDays())
  const hours = duration.hours()
  const minutes = duration.minutes()
  const seconds = duration.seconds()
  const totalSeconds = duration.asSeconds()

  if (totalSeconds < 60) {
    return `${totalSeconds.toFixed(2)}s`
  }

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0) parts.push(`${seconds}s`)

  return parts.length > 0 ? parts.join(' ') : '0s'
}

export type QueryPerformanceErrorContext = {
  projectRef?: string
  databaseIdentifier?: string
  queryPreset?: string
  queryType?: 'hitRate' | 'metrics' | 'mainQuery' | 'slowQueriesCount' | 'supamonitor'
  sql?: string
  errorMessage?: string
  postgresVersion?: string
  databaseType?: 'primary' | 'read-replica'
}

export function captureQueryPerformanceError(
  error: unknown,
  context: QueryPerformanceErrorContext
) {
  Sentry.withScope((scope) => {
    scope.setTag('query-performance', 'true')

    scope.setContext('query-performance', {
      projectRef: context.projectRef,
      databaseIdentifier: context.databaseIdentifier,
      queryPreset: context.queryPreset,
      queryType: context.queryType,
      postgresVersion: context.postgresVersion,
      databaseType: context.databaseType,
      errorMessage: context.errorMessage,
    })

    if (error instanceof Error) {
      Sentry.captureException(error)
      return
    }

    const errorMessage = getErrorMessage(error)
    const errorToCapture = new Error(errorMessage || 'Query performance error')

    if (error !== null && error !== undefined) {
      errorToCapture.cause = error
    }

    Sentry.captureException(errorToCapture)
  })
}
