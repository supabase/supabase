import { ResponseError } from './base'
import type { ErrorMetadata } from './base'

export type KnownErrorType = 'connection-timeout'

export class ConnectionTimeoutError extends ResponseError {
  readonly errorType = 'connection-timeout' as const

  constructor(
    message: string | undefined,
    code?: number,
    requestId?: string,
    retryAfter?: number,
    requestPathname?: string,
    metadata?: ErrorMetadata
  ) {
    super(message, code, requestId, retryAfter, requestPathname, metadata)
  }
}

export class UnknownAPIResponseError extends ResponseError {
  readonly errorType = 'unknown' as const

  constructor(
    message: string | undefined,
    code?: number,
    requestId?: string,
    retryAfter?: number,
    requestPathname?: string,
    metadata?: ErrorMetadata
  ) {
    super(message, code, requestId, retryAfter, requestPathname, metadata)
  }
}

export type ClassifiedError = ConnectionTimeoutError | UnknownAPIResponseError
