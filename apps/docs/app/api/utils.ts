import { z } from 'zod'

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
  constructor(message: string) {
    super(`Invalid request: ${message}`)
  }

  isPrivate() {
    return false
  }

  statusCode() {
    return 400
  }
}
