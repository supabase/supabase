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

const readString = (obj: object, key: string) => {
  const value = (obj as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : undefined
}

const readNumber = (obj: object, key: string) => {
  const value = (obj as Record<string, unknown>)[key]
  return typeof value === 'number' ? value : undefined
}

/**
 * Reads the error body the fetch middleware produces for a failed API response. Returns undefined
 * without a message, or for tagged, aborted, and fetch-failure errors that merely carry one, so the
 * caller can fall back to `classifyError`.
 */
export function parseResponseErrorBody(error: unknown): RawResponseError | undefined {
  if (!error || typeof error !== 'object') return undefined
  if (isStudioError(error) || isAbortError(error) || isFetchFailure(error)) return undefined

  const message = readString(error, 'msg') ?? readString(error, 'message')
  if (!message) return undefined

  const metadata = (error as Record<string, unknown>).metadata
  return {
    message,
    code: readNumber(error, 'code'),
    requestId: readString(error, 'requestId'),
    retryAfter: readNumber(error, 'retryAfter'),
    requestPathname: readString(error, 'requestPathname'),
    metadata:
      typeof metadata === 'object' && metadata !== null ? (metadata as ErrorMetadata) : undefined,
    formattedError: readString(error, 'formattedError'),
    cause: error instanceof Error ? error : undefined,
  }
}
