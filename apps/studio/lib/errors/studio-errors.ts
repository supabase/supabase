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
  metadata?: ErrorMetadata
  formattedError?: string
  service?: StudioService
  /** OpenAPI path pattern, never a concrete URL */
  endpoint?: string
  method?: string
  /** Static name of the Studio query that ran the SQL, passed to `executeSql` */
  queryName?: string
  /** Postgres SQLSTATE code (e.g. `42702`), for SQL errors */
  sqlState?: string
  /** 1-based character offset of the Postgres error in the SQL, for SQL errors */
  position?: string
  cause?: unknown
}

/** What a class's constructor takes: the shared fields plus its own reasons. */
type StudioErrorInputFor<R extends string> = StudioErrorInput & { reason?: R }

type StudioErrorFields<R extends string> = Omit<StudioErrorInput, 'message' | 'service'> & {
  readonly message: string
  readonly reason: R
  readonly service: StudioService
}

type StudioErrorConfig<F extends Fault, C extends ClassifiedBy, R extends string> = {
  fault: F | ((input: StudioErrorInputFor<R>) => F)
  classifiedBy: C
  /** The reasons this class can have, so a mistyped one fails typecheck. The first is the default. */
  reasons: readonly [R, ...R[]]
  retryable: (input: StudioErrorInputFor<R>) => boolean
  /**
   * What Sentry shows instead of `message`, for classes whose message can contain user data. Built
   * only from fields that can't. `message` stays intact for the UI.
   */
  sentryMessage?: (input: StudioErrorInputFor<R>) => string
}

export function getServiceForEndpoint(endpoint?: string): StudioService {
  if (!endpoint) return 'unknown'
  if (endpoint.startsWith('/platform/pg-meta/')) return 'pg-meta'
  if (endpoint.startsWith('/v1/')) return 'management-api'
  if (endpoint.startsWith('/platform/')) return 'management-api'
  return 'unknown'
}

function studioError<
  const Tag extends string,
  F extends Fault,
  C extends ClassifiedBy,
  R extends string,
>(tag: Tag, config: StudioErrorConfig<F, C, R>) {
  return class extends Data.TaggedError(tag)<StudioErrorFields<R>> {
    readonly fault: F
    readonly classifiedBy: C = config.classifiedBy
    readonly retryable: boolean
    /** The message sent to Sentry. Equal to `message` unless the class redacts it. */
    readonly sentryMessage: string
    /** Set by `reportStudioError` when the error is sent to Sentry. Assigned before `beforeSend`, so it may refer to an event that was sampled out. */
    errorEventId?: string

    constructor(input: StudioErrorInputFor<R> = {}) {
      super({
        ...input,
        message: input.message || DEFAULT_ERROR_MESSAGE,
        reason: input.reason ?? config.reasons[0],
        service: input.service ?? getServiceForEndpoint(input.endpoint),
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
  reasons: ['request_aborted'],
  retryable: () => false,
}) {}

// A fetch failure can't say why it failed, so it's the user's network only when the browser
// reports being offline. Otherwise it may be a gateway error without CORS headers or a dropped
// connection on our side.
export class NetworkUnreachableError extends studioError('NetworkUnreachable', {
  fault: ({ reason }) => (reason === 'offline' ? 'user' : 'platform'),
  classifiedBy: 'rule',
  reasons: ['network_unreachable', 'offline'],
  retryable: () => true,
}) {}

// An empty body where the endpoint advertises one. Body shapes are enforced by the generated
// types, not checked at runtime.
export class MalformedResponseError extends studioError('MalformedResponse', {
  fault: 'platform',
  classifiedBy: 'rule',
  reasons: ['empty_body'],
  retryable: () => true,
}) {}

export class PlatformError extends studioError('PlatformError', {
  fault: 'platform',
  classifiedBy: 'default',
  reasons: ['server_error'],
  retryable: () => true,
}) {}

export class UnclassifiedApiError extends studioError('UnclassifiedApiError', {
  fault: 'studio',
  classifiedBy: 'default',
  reasons: ['client_error', 'unauthorized', 'forbidden', 'not_found', 'rate_limited'],
  retryable: ({ code }) => code === 429,
}) {}

// The cause can be the user's workload, Supabase infrastructure, or rarely Studio, and the message
// can't tell them apart, so default to platform until project health signals can refine it.
export class ConnectionTimeoutError extends studioError('DbConnectionTimeout', {
  fault: 'platform',
  classifiedBy: 'rule',
  reasons: ['connection_timeout'],
  retryable: () => true,
}) {}

// Postgres rejected SQL the user (or an AI agent acting for them) wrote. The message can echo
// the user's SQL and data, so this error is never sent to Sentry (see `ERROR_ROUTING` and
// `isNeverReportedError`).
export class UserSqlError extends studioError('UserSqlError', {
  fault: 'user',
  classifiedBy: 'rule',
  reasons: ['user_sql'],
  retryable: () => false,
}) {}

// Postgres rejected SQL that Studio wrote. The Postgres message can still echo user data (row
// values in a constraint violation, a schema name), so Sentry gets only the SQLSTATE and the query
// name. When the SQL embeds user input and the caller's `isUserFaultSqlState` accepts the SQLSTATE,
// the reason is `user_input` and the fault is the user's, which gives it a lower Sentry sample rate (see
// `getErrorRouting`).
export class StudioSqlError extends studioError('StudioSqlError', {
  fault: ({ reason }) => (reason === 'user_input' ? 'user' : 'studio'),
  classifiedBy: 'rule',
  reasons: ['studio_sql', 'user_input'],
  retryable: () => false,
  sentryMessage: ({ sqlState, queryName }) =>
    `Postgres error ${sqlState ?? 'without SQLSTATE'} in query ${queryName ?? 'without name'}`,
}) {}

export class UnexpectedError extends studioError('UnexpectedError', {
  fault: 'studio',
  classifiedBy: 'default',
  reasons: ['unexpected'],
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
export type StudioErrorReason = StudioError['reason']

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
 * True for errors whose fault is the user's, so the user can fix them. Says nothing about whether
 * the error is reported; use `isNeverReportedError` for that.
 */
export function isUserError(error: unknown): error is StudioError {
  return isStudioError(error) && error.fault === 'user'
}

/**
 * True for errors that must never reach Sentry, even with `alwaysCapture` or when a third-party
 * integration captures them. `beforeSend` drops them as a backstop.
 */
export function isNeverReportedError(error: unknown): boolean {
  return isStudioError(error) && error._tag === 'UserSqlError'
}
