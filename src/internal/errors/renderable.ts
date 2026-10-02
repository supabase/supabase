import { ErrorCode } from './codes'

export interface StorageErrorOptions {
  code: ErrorCode
  httpStatusCode: number
  message: string
  resource?: string
  originalError?: unknown
  error?: string
}

export type StorageError = {
  statusCode: string
  code: ErrorCode
  error: string
  message: string
  query?: string
}

/**
 * A renderable error is a handled error
 *  that we want to display to our users
 */
export interface RenderableError {
  error?: string
  userStatusCode?: number
  render(): StorageError
  getOriginalError(): unknown
}
