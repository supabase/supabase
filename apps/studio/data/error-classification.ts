import { z } from 'zod'

import { ERROR_PATTERNS } from './error-patterns'
import {
  isStudioError,
  NetworkUnreachableError,
  PlatformError,
  RequestAbortedError,
  UnclassifiedApiError,
  UnexpectedError,
  type StudioError,
  type StudioErrorInput,
} from '@/lib/errors/studio-errors'
import type { ErrorMetadata } from '@/types/base'

export type RawResponseError = Omit<StudioErrorInput, 'reason' | 'service'>

const CLIENT_ERROR_REASONS: Record<number, string> = {
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  429: 'rate_limited',
}

/** Applies the pattern rules first, then the default rules by HTTP status. */
export function classifyResponseError(raw: RawResponseError): StudioError {
  const { message, code } = raw

  if (message) {
    const matched = ERROR_PATTERNS.find(({ pattern }) => pattern.test(message))
    if (matched) return new matched.ErrorClass(raw)
  }

  if (code !== undefined && code >= 500)
    return new PlatformError({ ...raw, reason: 'server_error' })
  if (code !== undefined && code >= 400) {
    return new UnclassifiedApiError({
      ...raw,
      reason: CLIENT_ERROR_REASONS[code] ?? 'client_error',
    })
  }
  return new UnexpectedError(raw)
}

// fetch rejects with a DOMException, which is not an Error subclass in every runtime
export function isAbortError(err: unknown): err is { name: 'AbortError'; message: string } {
  return typeof err === 'object' && err !== null && 'name' in err && err.name === 'AbortError'
}

// Browsers reject fetch with a TypeError on network failure, but TypeError also covers
// ordinary programming bugs, so match only the fetch-failure messages (Chrome, Firefox, Safari)
const FETCH_FAILURE_MESSAGES = [
  'Failed to fetch',
  'NetworkError when attempting to fetch resource',
  'Load failed',
  'Network request failed',
]

export function isFetchFailure(err: unknown): err is TypeError {
  return (
    err instanceof TypeError &&
    FETCH_FAILURE_MESSAGES.some((message) => err.message.startsWith(message))
  )
}

/**
 * Classifies anything that isn't an API response: an already-tagged error, an abort, a browser
 * fetch failure, or something unrecognized. It knows nothing about API bodies; for those, use
 * `classifyResponseError`.
 */
export function classifyError(
  error: unknown,
  context?: Pick<StudioErrorInput, 'endpoint' | 'method' | 'requestPathname'>
): StudioError {
  if (isStudioError(error)) return error

  if (isAbortError(error)) {
    return new RequestAbortedError({ ...context, message: error.message, cause: error })
  }

  if (isFetchFailure(error)) {
    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false
    return new NetworkUnreachableError({
      ...context,
      message: error.message,
      reason: isOffline ? 'offline' : undefined,
      cause: error,
    })
  }

  return new UnexpectedError({
    ...context,
    message: error instanceof Error ? error.message : undefined,
    cause: error,
  })
}

// Each field falls back to undefined on a wrong type, so one bad field doesn't discard the body.
const optional = <T extends z.ZodTypeAny>(schema: T) => schema.optional().catch(undefined)

const responseErrorBodySchema = z.object({
  msg: optional(z.string()),
  message: optional(z.string()),
  code: optional(z.number()),
  requestId: optional(z.string()),
  retryAfter: optional(z.number()),
  requestPathname: optional(z.string()),
  metadata: optional(z.record(z.string(), z.unknown())),
  formattedError: optional(z.string()),
})

/**
 * Reads the error body the fetch middleware produces for a failed API response. Returns undefined
 * when there is neither a message nor a status code, or for tagged, aborted, and fetch-failure
 * errors that merely carry a message, so the caller can fall back to `classifyError`.
 */
export function parseResponseErrorBody(error: unknown): RawResponseError | undefined {
  if (!error || typeof error !== 'object') return undefined
  if (isStudioError(error) || isAbortError(error) || isFetchFailure(error)) return undefined

  const result = responseErrorBodySchema.safeParse(error)
  if (!result.success) return undefined

  const { msg, message, code, metadata, ...rest } = result.data
  const resolvedMessage = msg ?? message
  if (!resolvedMessage && code === undefined) return undefined

  return {
    ...rest,
    message: resolvedMessage,
    code,
    metadata: metadata as ErrorMetadata | undefined,
    cause: error instanceof Error ? error : undefined,
  }
}
