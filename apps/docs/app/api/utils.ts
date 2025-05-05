import { z, type ZodError } from 'zod'

export class ApiError extends Error {
  constructor(message: string) {
    super(message)
  }

  isPrivate() {
    return true
  }

  statusCode() {
    return 500
  }
}

export class InvalidRequestError extends ApiError {
  constructor(message: string, source?: unknown) {
    super(`Invalid request: ${message}`)
  }

  isPrivate() {
    return false
  }

  statusCode() {
    return 400
  }
}

export function convertZodToInvalidRequestError(
  error: ZodError,
  prelude?: string
): InvalidRequestError {
  const issue = error.issues[0]
  const pathStr = issue.path.join('.')
  const message = `${prelude ? `${prelude}: ` : ''}${issue.message} at key "${pathStr}"`

  return new InvalidRequestError(message, error)
}
