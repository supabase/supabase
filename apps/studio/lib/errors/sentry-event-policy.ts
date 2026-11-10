import type { Event } from '@sentry/react'

import { isNeverReportedError, isStudioError } from '@/lib/errors/studio-errors'

/**
 * Applies a Studio error's privacy rules to a Sentry event, whoever captured it:
 * `reportStudioError`, the query cache, or an integration such as the Vercel AI SDK tool capture.
 * Called from `beforeSend` on the client and the server.
 *
 * - Drops errors that are never reported (`isNeverReportedError`).
 * - Replaces the message of errors whose class redacts it (`sentryMessage`). Every exception in the
 *   event is replaced, since the linked causes can carry the same text, and Sentry may have
 *   truncated the values so they can't be matched against the original message.
 * - Groups SQL errors by query name and SQLSTATE: they all share the `executeSql` stack trace.
 */
export function applyStudioErrorPolicy<E extends Event>(
  event: E,
  originalException: unknown
): E | null {
  if (!isStudioError(originalException)) return event
  if (isNeverReportedError(originalException)) return null

  const { message, sentryMessage, queryName, sqlState } = originalException
  if (sentryMessage !== message && event.exception?.values) {
    event.exception.values = event.exception.values.map((exception) => ({
      ...exception,
      value: sentryMessage,
    }))
  }

  if (queryName) {
    event.fingerprint = ['{{ default }}', queryName, sqlState ?? '']
  }

  return event
}
