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
