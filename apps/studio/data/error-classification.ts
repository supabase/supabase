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

/**
 * True for a raw abort or for the tagged `RequestAborted` error the fetch layer turns it into.
 * Use this instead of checking `error.name === 'AbortError'`.
 */
export function isRequestAborted(err: unknown): boolean {
  return isAbortError(err) || (isStudioError(err) && err._tag === 'RequestAborted')
}

export const NETWORK_UNREACHABLE_MESSAGE =
  'Unable to reach the server. Please check your network or try again later.'

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
  context?: Pick<StudioErrorInput, 'endpoint' | 'method'>
): StudioError {
  if (isStudioError(error)) return error

  if (isAbortError(error)) {
    return new RequestAbortedError({ ...context, message: error.message, cause: error })
  }

  if (isFetchFailure(error)) {
    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false
    return new NetworkUnreachableError({
      ...context,
      message: NETWORK_UNREACHABLE_MESSAGE,
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
  endpoint: optional(z.string()),
  method: optional(z.string()),
  metadata: optional(z.record(z.string(), z.unknown())),
  formattedError: optional(z.string()),
})

const MAX_TEXT_MESSAGE_LENGTH = 500

const jsonErrorBodySchema = z.object({
  msg: optional(z.string()),
  message: optional(z.string()),
  error: optional(z.string()),
  metadata: optional(z.record(z.string(), z.unknown())),
  formattedError: optional(z.string()),
})

/** Parses `text` as JSON and returns it only when it is a plain object. */
export function parseJsonObject(text: string): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON.parse(text)
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    // not JSON
  }
  return undefined
}

/**
 * The single place that turns an HTTP error response into a `RawResponseError`. A JSON object body
 * supplies the message and extra fields. A short `text/plain` body becomes the message. Other
 * bodies (HTML error pages, empty bodies, JSON arrays) yield no message, so classification falls
 * back to the status.
 */
export function readResponseError({
  status,
  headers,
  text,
  requestId,
  endpoint,
  method,
}: {
  status: number
  headers: Headers
  text: string
  requestId?: string
  endpoint?: string
  method?: string
}): RawResponseError {
  const parsed = parseJsonObject(text)

  let message: string | undefined
  let metadata: ErrorMetadata | undefined
  let formattedError: string | undefined

  if (parsed) {
    const body = jsonErrorBodySchema.parse(parsed)
    message = body.msg ?? body.message ?? body.error
    metadata = body.metadata as ErrorMetadata | undefined
    formattedError = body.formattedError
  } else {
    const trimmed = text.trim()
    const contentType = headers.get('Content-Type') ?? ''
    if (
      trimmed.length > 0 &&
      trimmed.length <= MAX_TEXT_MESSAGE_LENGTH &&
      contentType.toLowerCase().startsWith('text/plain')
    ) {
      message = trimmed
    }
  }

  const retryAfterHeader = headers.get('Retry-After') ?? headers.get('X-RateLimit-Reset')
  const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader) : undefined

  const raw: RawResponseError = {
    message,
    code: status,
    retryAfter: Number.isNaN(retryAfter) ? undefined : retryAfter,
    requestId,
    endpoint,
    method,
    metadata,
    formattedError,
  }
  return Object.fromEntries(
    Object.entries(raw).filter(([, value]) => value !== undefined)
  ) as RawResponseError
}

/**
 * Validates the `RawResponseError` shape of the value `handleError` receives (a body from
 * `readResponseError` or a hand-built `{ message, code }` object). Returns undefined
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
