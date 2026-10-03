import { ErrorCode } from '@internal/errors/codes'

interface ErrorWithCode {
  code?: unknown
}

export function isVectorResourceNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as ErrorWithCode).code === ErrorCode.S3VectorNotFoundException
  )
}

export function isVectorResourceConflictError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as ErrorWithCode).code === ErrorCode.S3VectorConflictException
  )
}
