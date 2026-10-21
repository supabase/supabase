import z from 'zod/v4'

export type WrappedSuccessResult<T> = { data: T; error: undefined }
export type WrappedErrorResult = { data: undefined; error: Error }
export type WrappedResult<R> = WrappedSuccessResult<R> | WrappedErrorResult

export const databaseErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
  formattedError: z.string(),
})

const UPSTREAM_CONNECTION_ERROR_PATTERN = /failed to (?:get|process) upstream connection details/i

const PG_META_CONNECTION_ERROR_MESSAGE =
  "Failed to connect to postgres-meta. Studio's PG_META_CRYPTO_KEY may not match postgres-meta's CRYPTO_KEY."

export class PgMetaDatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public formattedError: string
  ) {
    super(message)
    this.name = 'PgMetaDatabaseError'
  }
}

const getStringProperty = (value: unknown, property: string): string | undefined => {
  if (typeof value !== 'object' || value === null || !(property in value)) return undefined

  const propertyValue = (value as Record<string, unknown>)[property]
  if (typeof propertyValue === 'string') return propertyValue
  if (typeof propertyValue === 'number') return String(propertyValue)

  return undefined
}

export function createPgMetaDatabaseError(
  responseBody: unknown,
  statusCode: number
): PgMetaDatabaseError {
  const parsedError = databaseErrorSchema.safeParse(responseBody)
  if (parsedError.success) {
    const { message, code, formattedError } = parsedError.data
    return new PgMetaDatabaseError(message, code, statusCode, formattedError)
  }

  const responseMessage =
    getStringProperty(responseBody, 'message') ??
    getStringProperty(responseBody, 'msg') ??
    getStringProperty(responseBody, 'error')
  const message = UPSTREAM_CONNECTION_ERROR_PATTERN.test(responseMessage ?? '')
    ? PG_META_CONNECTION_ERROR_MESSAGE
    : (responseMessage ?? 'An unexpected postgres-meta error occurred')
  const code = getStringProperty(responseBody, 'code') ?? 'UNKNOWN_ERROR'
  const formattedError = getStringProperty(responseBody, 'formattedError') ?? message

  return new PgMetaDatabaseError(message, code, statusCode, formattedError)
}
