import * as Sentry from '@sentry/nextjs'

import { ERROR_ROUTING, SAMPLE_ALWAYS, SAMPLE_NEVER } from './error-routing'
import type { StudioError } from '@/lib/errors/studio-errors'

export type StudioSentryContext = {
  tags?: Record<string, string | number | boolean>
  extra?: Record<string, unknown>
  contexts?: Record<string, Record<string, unknown>>
}

/**
 * Sends the error to Sentry when its routing sample rate is above zero. The rate is attached as
 * the `sample_rate` tag; `beforeSend` applies it. Records the event id on the error.
 * `force` is for callers that explicitly asked for capture (`alwaysCapture`) and overrides routing.
 */
export function reportStudioError(
  err: StudioError,
  context?: StudioSentryContext,
  { force = false }: { force?: boolean } = {}
) {
  const sampleRate = force ? SAMPLE_ALWAYS : ERROR_ROUTING[err._tag].sentrySampleRate
  if (sampleRate <= SAMPLE_NEVER) return
  if (err.errorEventId) return

  const eventId = Sentry.captureException(err, {
    ...context,
    tags: {
      ...context?.tags,
      error_tag: err._tag,
      sample_rate: sampleRate,
      fault: err.fault,
      classified_by: err.classifiedBy,
      service: err.service,
      ...(err.endpoint && { endpoint: err.endpoint }),
    },
    extra: { ...context?.extra, requestId: err.requestId, status: err.code },
  })
  err.errorEventId = eventId
}
