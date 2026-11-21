import { z } from 'zod'

import { ERROR_PATTERNS } from './error-patterns'
import {
  isStudioError,
  NetworkUnreachableError,
  PlatformError,
  RequestAbortedError,
  StudioSqlError,
  UnclassifiedApiError,
  UnexpectedError,
  UserSqlError,
  type StudioError,
  type StudioErrorInput,
} from '@/lib/errors/studio-errors'
import type { ErrorMetadata } from '@/types/base'

export type RawResponseError = Omit<StudioErrorInput, 'service'>

const CLIENT_ERROR_REASONS: Record<number, UnclassifiedApiError['reason']> = {
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

// pg-meta formats Postgres errors as `Failed to run sql query: ERROR:  42702: <message>`
const SQLSTATE_IN_MESSAGE = /\bERROR:\s+([0-9A-Z]{5}):/

/**
 * Predicate for a Studio SQL caller (`isUserFaultSqlState` in `executeSql`): is a failure with this
 * SQLSTATE the user's fault rather than Studio's? Two are provided; callers can compose them, e.g.
 * `(s) => s !== '42P02' && isUserFaultForSql(s)`.
 */
export type IsUserFaultSqlState = (sqlState: string) => boolean

const USER_FAULT_FOR_VALUES = /^(22|23|P0)|^(42501|57014)$/

/**
 * For SQL that embeds values the user typed (table editor filters and row edits, a cron job's name
 * and schedule): Studio wrote the statement, so only errors about the values are the user's. Class
 * 22 (data exception, e.g. a bad filter value), class 23 (integrity constraint), 42501
 * (insufficient privilege, e.g. under role impersonation or RLS), class P0 (raised by PL/pgSQL in
 * the user's functions and triggers) and 57014 (query canceled, e.g. a statement timeout). Syntax
 * errors and undefined objects stay Studio's.
 */
export const isUserFaultForValues: IsUserFaultSqlState = (sqlState) =>
  USER_FAULT_FOR_VALUES.test(sqlState)

// 57014 (query canceled) is the user's, so it is excluded from the class 57 exception
const SERVER_SQLSTATE = /^(08|53|58|XX)|^57(?!014$)/

/**
 * For SQL that embeds user-written SQL that Postgres parses or runs (policy expressions, function
 * bodies, the user's own functions, queries from `pg_stat_statements`): any SQLSTATE is the user's,
 * except classes that describe the server rather than the SQL: 08 (connection exception), 53
 * (insufficient resources), 57 other than 57014 (operator intervention, e.g. admin shutdown), 58
 * (system error) and XX (internal error).
 */
export const isUserFaultForSql: IsUserFaultSqlState = (sqlState) => !SERVER_SQLSTATE.test(sqlState)

/** Who wrote the SQL sent to the pg-meta query endpoint. */
export type SqlOrigin = 'user' | 'studio'

/**
 * Classifies an error from the pg-meta query endpoint. Postgres rejecting the SQL comes back as a
 * 400, which becomes `UserSqlError` or `StudioSqlError` depending on who wrote the SQL. Studio SQL
 * whose caller passed `isUserFaultSqlState` and gets true for the error's SQLSTATE is a
 * `StudioSqlError` with reason `user_input`, whose fault is the user's.
 *
 * A 400 whose message carries a SQLSTATE came from Postgres, so it is a SQL error before any
 * message-pattern rule runs: user SQL can raise any text, including a pattern's. Other 400s go
 * through the pattern rules first (a connection timeout has no SQLSTATE) and are SQL errors only
 * when no rule matches. A 408 (the query endpoint timed out waiting for the query to finish) on
 * user SQL is a `UserSqlError` too: the user's query ran too long, like a statement timeout
 * (57014). Other statuses keep their usual classification, and anything that isn't a response
 * body goes through `classifyError`.
 */
export function classifySqlResponseError(
  error: unknown,
  {
    origin,
    queryName,
    isUserFaultSqlState,
  }: { origin: SqlOrigin; queryName?: string; isUserFaultSqlState?: IsUserFaultSqlState }
): StudioError {
  const raw = parseResponseErrorBody(error)
  if (!raw) return classifyError(error)

  const sqlState = raw.code === 400 ? raw.message?.match(SQLSTATE_IN_MESSAGE)?.[1] : undefined
  if (origin === 'user' && raw.code === 408) {
    return new UserSqlError({ ...raw, ...(queryName && { queryName }) })
  }
  if (!sqlState) {
    const classified = classifyResponseError(raw)
    if (classified._tag !== 'UnclassifiedApiError' || classified.code !== 400) return classified
  }

  const input = { ...raw, ...(queryName && { queryName }), ...(sqlState && { sqlState }) }
  if (origin === 'user') return new UserSqlError(input)
  if (sqlState && isUserFaultSqlState?.(sqlState))
    return new StudioSqlError({ ...input, reason: 'user_input' })
  return new StudioSqlError(input)
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
  position: optional(z.string()),
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

const HTTP_DATE_MONTH = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/

/**
 * Parses a `Retry-After` header value into a number of seconds from now.
 * Per RFC 9110 it is either delta-seconds (`"120"`) or an HTTP-date
 * (`"Wed, 21 Oct 2015 07:28:00 GMT"`). Returns undefined for anything else.
 */
export function parseRetryAfterSeconds(
  header: string | null | undefined,
  now = Date.now()
): number | undefined {
  const value = header?.trim()
  if (!value) return undefined
  if (/^\d+$/.test(value)) return Number(value)
  if (!HTTP_DATE_MONTH.test(value)) return undefined
  const dateMs = Date.parse(value)
  if (Number.isNaN(dateMs)) return undefined
  return Math.max(0, Math.ceil((dateMs - now) / 1000))
}

/**
 * Parses an `X-RateLimit-Reset` header value into a number of seconds from now.
 * Supabase sends seconds remaining, but many APIs send a Unix epoch timestamp
 * instead. Values >= 1_000_000_000 (an epoch in seconds, after 2001) are treated
 * as epochs; smaller values are treated as delta-seconds.
 */
export function parseRateLimitResetSeconds(
  header: string | null | undefined,
  now = Date.now()
): number | undefined {
  const value = header?.trim()
  if (!value || !/^\d+$/.test(value)) return undefined
  const n = Number(value)
  return n >= 1_000_000_000 ? Math.max(0, Math.ceil(n - now / 1000)) : n
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

  const retryAfter =
    parseRetryAfterSeconds(headers.get('Retry-After')) ??
    parseRateLimitResetSeconds(headers.get('X-RateLimit-Reset'))

  const raw: RawResponseError = {
    message,
    code: status,
    retryAfter,
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
