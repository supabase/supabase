import type { ErrorMetadata } from '@/types/base'

export class StudioError extends Error {
  code?: number
  requestId?: string
  retryAfter?: number
  requestPathname?: string
  metadata?: ErrorMetadata
  errorType?: string
  formattedError?: string

  constructor(
    message: string | undefined,
    code?: number,
    requestId?: string,
    retryAfter?: number,
    requestPathname?: string,
    metadata?: ErrorMetadata,
    formattedError?: string
  ) {
    super(message || 'API error happened while trying to communicate with the server.')
    this.code = code
    this.requestId = requestId
    this.retryAfter = retryAfter
    this.requestPathname = requestPathname
    this.metadata = metadata
    this.formattedError = formattedError
  }
}

export type KnownErrorType = 'connection-timeout'

export class ConnectionTimeoutError extends StudioError {
  readonly errorType = 'connection-timeout' as const

  constructor(
    message: string | undefined,
    code?: number,
    requestId?: string,
    retryAfter?: number,
    requestPathname?: string,
    metadata?: ErrorMetadata,
    formattedError?: string
  ) {
    super(message, code, requestId, retryAfter, requestPathname, metadata, formattedError)
  }
}

export class UnknownAPIResponseError extends StudioError {
  readonly errorType = 'unknown' as const

  constructor(
    message: string | undefined,
    code?: number,
    requestId?: string,
    retryAfter?: number,
    requestPathname?: string,
    metadata?: ErrorMetadata,
    formattedError?: string
  ) {
    super(message, code, requestId, retryAfter, requestPathname, metadata, formattedError)
  }
}

export type ClassifiedError = ConnectionTimeoutError | UnknownAPIResponseError
