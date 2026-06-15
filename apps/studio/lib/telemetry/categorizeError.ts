import { ResponseError } from '@/types/base'

/**
 * PII-free telemetry properties derived from an error.
 *
 * `errorCode` is an HTTP status (e.g. 403, 500) or a transport category when no
 * status is available (`'network'`, `'timeout'`). `errorType` is always a value
 * from a fixed taxonomy. Neither field ever contains the raw error message, so
 * the result is safe to send to PostHog where messages (which may contain SQL,
 * table names, emails, etc.) must not be stored.
 */
export type ErrorTelemetryProps = {
  errorCode?: number | string
  errorType?: string
}

const CANCELED_PATTERNS = ['canceled', 'cancelled', 'aborted', 'aborterror']
const NETWORK_PATTERNS = [
  'networkerror',
  'failed to fetch',
  'load failed',
  'network request failed',
]
const TIMEOUT_PATTERNS = ['timeout', 'timed out']

function errorTypeFromStatus(code: number): string | undefined {
  switch (code) {
    case 401:
      return 'unauthorized'
    case 403:
      return 'forbidden'
    case 404:
      return 'not-found'
    case 413:
      return 'payload-too-large'
    case 429:
      return 'rate-limited'
  }
  if (code >= 500) return 'server-error'
  if (code >= 400) return 'client-error'
  return undefined
}

function getMessage(error: unknown): string {
  if (typeof error === 'string') return error
  const hasStringMessage =
    !!error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  return hasStringMessage ? (error as { message: string }).message : ''
}

function getNumericCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const candidate = (error as { code?: unknown; status?: unknown }).code ??
    (error as { status?: unknown }).status
  return typeof candidate === 'number' ? candidate : undefined
}

/**
 * Best-effort classification from a message string only. Matches known transport
 * phrases and any embedded 4xx/5xx status. Returns a number/category, never the
 * message itself.
 */
function categorizeFromMessage(message: string): ErrorTelemetryProps {
  const lower = message.toLowerCase()

  if (CANCELED_PATTERNS.some((pattern) => lower.includes(pattern))) {
    return { errorType: 'canceled' }
  }
  if (NETWORK_PATTERNS.some((pattern) => lower.includes(pattern))) {
    return { errorCode: 'network', errorType: 'network-error' }
  }
  if (TIMEOUT_PATTERNS.some((pattern) => lower.includes(pattern))) {
    return { errorCode: 'timeout', errorType: 'timeout' }
  }

  const statusMatch = message.match(/\b(4\d{2}|5\d{2})\b/)
  if (statusMatch) {
    const status = Number(statusMatch[1])
    return { errorCode: status, errorType: errorTypeFromStatus(status) }
  }

  return {}
}

/**
 * Derives PII-free `{ errorCode, errorType }` telemetry properties from an error
 * of unknown shape, for use on the `dashboard_error_created` event.
 *
 * Precedence:
 *   1. Classified API errors (`ConnectionTimeoutError`, etc.) carry an explicit
 *      `errorType` and an HTTP `code`.
 *   2. Otherwise, a numeric `code`/`status` on the object maps to a status-class
 *      taxonomy.
 *   3. Otherwise, the message is matched against known transport phrases and any
 *      embedded status code.
 *   4. Falls back to `errorType: 'unknown'`.
 */
export function categorizeError(error: unknown): ErrorTelemetryProps {
  if (error instanceof ResponseError) {
    const classifiedType = (error as ResponseError & { errorType?: string }).errorType
    const statusType = error.code !== undefined ? errorTypeFromStatus(error.code) : undefined
    const fromMessage = categorizeFromMessage(error.message)
    return {
      errorCode: error.code ?? fromMessage.errorCode,
      errorType: classifiedType ?? statusType ?? fromMessage.errorType ?? 'unknown',
    }
  }

  const numericCode = getNumericCode(error)
  const fromMessage = categorizeFromMessage(getMessage(error))
  const statusType = numericCode !== undefined ? errorTypeFromStatus(numericCode) : undefined

  return {
    errorCode: numericCode ?? fromMessage.errorCode,
    errorType: statusType ?? fromMessage.errorType ?? 'unknown',
  }
}
