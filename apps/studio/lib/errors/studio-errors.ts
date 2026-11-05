import { Data } from 'effect'

import type { ErrorMetadata } from '@/types/base'

export type Fault = 'user' | 'platform' | 'third_party' | 'studio'
export type ClassifiedBy = 'rule' | 'default'
export type StudioService = 'management-api' | 'pg-meta' | 'unknown'

export const DEFAULT_ERROR_MESSAGE =
  'API error happened while trying to communicate with the server.'

export type StudioErrorInput = {
  message?: string
  code?: number
  requestId?: string
  retryAfter?: number
  requestPathname?: string
  metadata?: ErrorMetadata
  formattedError?: string
  reason?: string
  service?: StudioService
  /** OpenAPI path pattern, never a concrete URL */
  endpoint?: string
  method?: string
  /** Query key of the Studio query that ran the SQL, joined with `-`, without the project ref */
  queryKey?: string
  /** Postgres SQLSTATE code (e.g. `42702`), for SQL errors */
  sqlState?: string
  /** 1-based character offset of the Postgres error in the SQL, for SQL errors */
  position?: string
  cause?: unknown
}

type StudioErrorFields = Omit<StudioErrorInput, 'message' | 'reason' | 'service'> & {
  readonly message: string
  readonly reason: string
  readonly service: StudioService
}

type StudioErrorConfig<F extends Fault, C extends ClassifiedBy> = {
  fault: F | ((input: StudioErrorInput) => F)
  classifiedBy: C
  defaultReason: string
  retryable: (input: StudioErrorInput) => boolean
  /**
   * What Sentry shows instead of `message`, for classes whose message can contain user data. Built
   * only from fields that can't. `message` stays intact for the UI.
   */
  sentryMessage?: (input: StudioErrorInput) => string
}

export function getServiceForEndpoint(endpoint?: string): StudioService {
  if (!endpoint) return 'unknown'
  if (endpoint.startsWith('/platform/pg-meta/')) return 'pg-meta'
  if (endpoint.startsWith('/v1/')) return 'management-api'
  if (endpoint.startsWith('/platform/')) return 'management-api'
  return 'unknown'
}

function studioError<const Tag extends string, F extends Fault, C extends ClassifiedBy>(
  tag: Tag,
  config: StudioErrorConfig<F, C>
) {
  return class extends Data.TaggedError(tag)<StudioErrorFields> {
    readonly fault: F
    readonly classifiedBy: C = config.classifiedBy
    readonly retryable: boolean
    /** The message sent to Sentry. Equal to `message` unless the class redacts it. */
    readonly sentryMessage: string
    /** Set by `reportStudioError` when the error is sent to Sentry. Assigned before `beforeSend`, so it may refer to an event that was sampled out. */
    errorEventId?: string

    constructor(input: StudioErrorInput = {}) {
      super({
        ...input,
        message: input.message || DEFAULT_ERROR_MESSAGE,
        reason: input.reason ?? config.defaultReason,
        service: input.service ?? getServiceForEndpoint(input.endpoint ?? input.requestPathname),
      })
      this.fault = typeof config.fault === 'function' ? config.fault(input) : config.fault
      this.retryable = config.retryable(input)
      this.sentryMessage = config.sentryMessage?.(input) ?? this.message
    }
  }
}

export class RequestAbortedError extends studioError('RequestAborted', {
  fault: 'user',
  classifiedBy: 'rule',
  defaultReason: 'request_aborted',
  retryable: () => false,
}) {}

// A fetch failure can't say why it failed, so it's the user's network only when the browser
// reports being offline. Otherwise it may be a gateway error without CORS headers or a dropped
// connection on our side.
export class NetworkUnreachableError extends studioError('NetworkUnreachable', {
  fault: ({ reason }) => (reason === 'offline' ? 'user' : 'platform'),
  classifiedBy: 'rule',
  defaultReason: 'network_unreachable',
  retryable: () => true,
}) {}

// An empty body where the endpoint advertises one. Body shapes are enforced by the generated
// types, not checked at runtime.
export class MalformedResponseError extends studioError('MalformedResponse', {
  fault: 'platform',
  classifiedBy: 'rule',
  defaultReason: 'empty_body',
  retryable: () => true,
}) {}

export class PlatformError extends studioError('PlatformError', {
  fault: 'platform',
  classifiedBy: 'default',
  defaultReason: 'server_error',
  retryable: () => true,
}) {}

export class UnclassifiedApiError extends studioError('UnclassifiedApiError', {
  fault: 'studio',
  classifiedBy: 'default',
  defaultReason: 'client_error',
  retryable: ({ code }) => code === 429,
}) {}

// The cause can be the user's workload, Supabase infrastructure, or rarely Studio, and the message
// can't tell them apart, so default to platform until project health signals can refine it.
export class ConnectionTimeoutError extends studioError('DbConnectionTimeout', {
  fault: 'platform',
  classifiedBy: 'rule',
  defaultReason: 'connection_timeout',
  retryable: () => true,
}) {}

// Postgres rejected SQL the user (or an AI agent acting for them) wrote. The message can echo
// the user's SQL and data, so this error is never sent to Sentry (see `ERROR_ROUTING` and
// `isNeverReportedError`).
export class UserSqlError extends studioError('UserSqlError', {
  fault: 'user',
  classifiedBy: 'rule',
  defaultReason: 'user_sql',
  retryable: () => false,
}) {}

// Postgres rejected SQL that Studio wrote. The Postgres message can still echo user data (row
// values in a constraint violation, a schema name), so Sentry gets only the SQLSTATE and the query
// key.
export class StudioSqlError extends studioError('StudioSqlError', {
  fault: 'studio',
  classifiedBy: 'rule',
  defaultReason: 'studio_sql',
  retryable: () => false,
  sentryMessage: ({ sqlState, queryKey }) =>
    `Postgres error ${sqlState ?? 'without SQLSTATE'} in query ${queryKey ?? 'without key'}`,
}) {}

export class UnexpectedError extends studioError('UnexpectedError', {
  fault: 'studio',
  classifiedBy: 'default',
  defaultReason: 'unexpected',
  retryable: () => false,
}) {}

export type StudioError =
  | RequestAbortedError
  | NetworkUnreachableError
  | MalformedResponseError
  | PlatformError
  | UnclassifiedApiError
  | ConnectionTimeoutError
  | UserSqlError
  | StudioSqlError
  | UnexpectedError

export type StudioErrorTag = StudioError['_tag']

export type ClassifiedError = ConnectionTimeoutError

// A Record (not a Set) so a new tag fails typecheck until it is listed here.
const STUDIO_ERROR_TAGS: Record<StudioErrorTag, true> = {
  RequestAborted: true,
  NetworkUnreachable: true,
  MalformedResponse: true,
  PlatformError: true,
  UnclassifiedApiError: true,
  DbConnectionTimeout: true,
  UserSqlError: true,
  StudioSqlError: true,
  UnexpectedError: true,
}

export function isStudioError(error: unknown): error is StudioError {
  return (
    typeof error === 'object' &&
    error !== null &&
    '_tag' in error &&
    typeof error._tag === 'string' &&
    Object.hasOwn(STUDIO_ERROR_TAGS, error._tag)
  )
}

/**
 * True for errors that must never reach Sentry, even with `alwaysCapture` or when a third-party
 * integration captures them. `beforeSend` drops them as a backstop.
 */
export function isNeverReportedError(error: unknown): boolean {
  return isStudioError(error) && error._tag === 'UserSqlError'
}
