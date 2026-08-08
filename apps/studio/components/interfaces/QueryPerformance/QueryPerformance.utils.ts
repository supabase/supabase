import * as Sentry from '@sentry/nextjs'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

import { getErrorMessage } from '@/lib/get-error-message'

dayjs.extend(duration)

export const formatDuration = (milliseconds: number, precision: number = 2) => {
  const duration = dayjs.duration(milliseconds, 'milliseconds')

  const days = Math.floor(duration.asDays())
  const hours = duration.hours()
  const minutes = duration.minutes()
  const seconds = duration.seconds()
  const totalSeconds = duration.asSeconds()

  if (totalSeconds < 60) {
    return `${totalSeconds.toFixed(precision)}s`
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
  queryType?: 'hitRate' | 'metrics' | 'mainQuery' | 'slowQueriesCount'
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

const cleanIdentifier = (identifier?: string): string | null => {
  if (!identifier) return null
  return (
    identifier
      .replace(/["`']/g, '')
      .replace(/^[\w]+\./, '')
      .trim() || null
  )
}

export const getTableName = (query: string | undefined | null): string | null => {
  if (!query) return null
  const trimmed = query.trim()

  let match = trimmed.match(
    /FROM\s+(?:(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.table) {
    return cleanIdentifier(match.groups.table)
  }

  match = trimmed.match(
    /INSERT\s+INTO\s+(?:(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.table) {
    return cleanIdentifier(match.groups.table)
  }

  match = trimmed.match(/UPDATE\s+(?:(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>(?:"[^"]+"|[\w]+)))/i)
  if (match?.groups?.table) {
    return cleanIdentifier(match.groups.table)
  }

  match = trimmed.match(
    /DELETE\s+FROM\s+(?:(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.table) {
    return cleanIdentifier(match.groups.table)
  }

  match = trimmed.match(
    /CREATE\s+(?:TEMPORARY\s+|TEMP\s+|UNLOGGED\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.table) {
    return cleanIdentifier(match.groups.table)
  }

  match = trimmed.match(
    /ALTER\s+TABLE\s+(?:(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.table) {
    return cleanIdentifier(match.groups.table)
  }

  match = trimmed.match(
    /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.table) {
    return cleanIdentifier(match.groups.table)
  }

  match = trimmed.match(
    /TRUNCATE\s+(?:TABLE\s+)?(?:(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.table) {
    return cleanIdentifier(match.groups.table)
  }

  if (trimmed.toUpperCase().startsWith('WITH')) {
    match = trimmed.match(
      /WITH\s+[\s\S]*?\s+FROM\s+(?:(?<schema>(?:"[^"]+"|[\w]+)\.)?(?<table>(?:"[^"]+"|[\w]+)))/i
    )
    if (match?.groups?.table) {
      return cleanIdentifier(match.groups.table)
    }
  }

  return null
}

export const getColumnName = (query: string | undefined | null): string | null => {
  if (!query) return null
  const trimmed = query.trim()

  let match = trimmed.match(
    /WHERE\s+(?:(?<table>(?:"[^"]+"|[\w]+)\.)?(?<column>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.column) {
    return cleanIdentifier(match?.groups?.column)
  }

  match = trimmed.match(
    /SELECT\s+(?:\*\s+FROM|(?:(?<table>(?:"[^"]+"|[\w]+)\.)?(?<column>(?:"[^"]+"|[\w]+))(?:\s*,\s*[\w.]+)*)\s+FROM)/i
  )
  if (match?.groups?.column && match.groups.column.toUpperCase() !== '*') {
    return cleanIdentifier(match.groups.column)
  }

  match = trimmed.match(
    /ORDER\s+BY\s+(?:(?<table>(?:"[^"]+"|[\w]+)\.)?(?<column>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.column) {
    return cleanIdentifier(match.groups.column)
  }

  match = trimmed.match(
    /GROUP\s+BY\s+(?:(?<table>(?:"[^"]+"|[\w]+)\.)?(?<column>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.column) {
    return cleanIdentifier(match.groups.column)
  }

  match = trimmed.match(
    /UPDATE\s+[\w.]+\s+SET\s+(?:(?<table>(?:"[^"]+"|[\w]+)\.)?(?<column>(?:"[^"]+"|[\w]+)))/i
  )
  if (match?.groups?.column) {
    return cleanIdentifier(match.groups.column)
  }

  match = trimmed.match(/INSERT\s+INTO\s+[\w.]+\s*\((?<column>(?:"[^"]+"|[\w]+))/i)
  if (match?.groups?.column) {
    return cleanIdentifier(match.groups.column)
  }

  return null
}
