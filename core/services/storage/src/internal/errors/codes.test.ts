import { IcebergError, IcebergErrorType } from '@storage/protocols/iceberg/catalog/errors'
import { ErrorCode, getErrorCode, normalizeRawError } from './codes'
import { StorageBackendError } from './storage-error'

describe('normalizeRawError', () => {
  it('includes stack for 5xx errors', () => {
    const error = new StorageBackendError({
      code: ErrorCode.InternalError,
      httpStatusCode: 500,
      message: 'Internal server error',
    })

    const result = normalizeRawError(error, 'info')

    expect(result.statusCode).toBe(500)
    expect(result.errorCode).toBe(ErrorCode.InternalError)
    expect(result.stack).toBeTruthy()
  })

  it('excludes stack for 4xx errors', () => {
    const error = new StorageBackendError({
      code: ErrorCode.InvalidRequest,
      httpStatusCode: 400,
      message: 'Bad request',
    })

    const result = normalizeRawError(error, 'info')

    expect(result.statusCode).toBe(400)
    expect(result.errorCode).toBe(ErrorCode.InvalidRequest)
    expect(result.stack).toBe('')
  })

  it('includes stack for UnknownError regardless of status code', () => {
    const error = new Error('Something unexpected')

    const result = normalizeRawError(error, 'info')

    expect(result.errorCode).toBe(ErrorCode.UnknownError)
    expect(result.stack).toBeTruthy()
  })

  it('includes stack when log level is debug', () => {
    const error = new StorageBackendError({
      code: ErrorCode.InvalidRequest,
      httpStatusCode: 400,
      message: 'Bad request',
    })

    const result = normalizeRawError(error, 'debug')

    expect(result.stack).toBeTruthy()
  })

  it('recognizes error codes by value in KNOWN_ERROR_CODES', () => {
    const error = new Error('test')
    Object.assign(error, { code: ErrorCode.S3InvalidAccessKeyId })

    const result = normalizeRawError(error, 'info')

    expect(result.errorCode).toBe(ErrorCode.S3InvalidAccessKeyId)
  })

  it('falls back to UnknownError when code is not in KNOWN_ERROR_CODES', () => {
    const error = new Error('test')
    Object.assign(error, { code: 'UNKNOWN_CODE' })

    const result = normalizeRawError(error, 'info')

    expect(result.errorCode).toBe(ErrorCode.UnknownError)
  })

  it('maps Fastify error codes to ErrorCode', () => {
    const error = new Error('Validation failed')
    Object.assign(error, { code: 'FST_ERR_VALIDATION', statusCode: 400 })

    const result = normalizeRawError(error, 'info')

    expect(result.errorCode).toBe(ErrorCode.InvalidRequest)
    expect(result.statusCode).toBe(400)
  })

  it('handles IcebergError with error property', () => {
    const error = new IcebergError(
      'Namespace not found',
      IcebergErrorType.NoSuchNamespaceException,
      400
    )

    const result = normalizeRawError(error, 'info')

    expect(result.errorCode).toBe(IcebergErrorType.NoSuchNamespaceException)
    expect(result.statusCode).toBe(400)
  })

  it('handles non-Error objects', () => {
    const result = normalizeRawError({ some: 'object' }, 'info')

    expect(result).toHaveProperty('raw')
    expect(result).not.toHaveProperty('errorCode')
  })

  it('handles unstringifiable errors', () => {
    const circular: { self?: unknown } = {}
    circular.self = circular

    const result = normalizeRawError(circular, 'info')

    expect(result.raw).toBe('Failed to stringify error')
  })

  it('surfaces a nested originalError/cause chain instead of collapsing it to {}', () => {
    const cause = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:443'), {
      code: 'ECONNREFUSED',
    })
    const networkError = new TypeError('fetch failed', { cause })

    const error = new StorageBackendError({
      code: ErrorCode.InternalError,
      httpStatusCode: 500,
      message: 'Error purging cache',
      originalError: networkError,
    })

    const result = normalizeRawError(error, 'info')
    const raw = JSON.parse(result.raw)

    expect(raw.originalError.name).toBe('TypeError')
    expect(raw.originalError.message).toBe('fetch failed')
    expect(raw.originalError.cause.code).toBe('ECONNREFUSED')
    expect(raw.originalError.cause.message).toBe('connect ECONNREFUSED 127.0.0.1:443')
  })

  it('surfaces the individual errors wrapped by a nested AggregateError', () => {
    const aggregate = new AggregateError(
      [new Error('connect ECONNREFUSED 127.0.0.1:443'), new Error('connect ECONNREFUSED ::1:443')],
      'All promises were rejected'
    )

    const error = new StorageBackendError({
      code: ErrorCode.InternalError,
      httpStatusCode: 500,
      message: 'Error purging cache',
      originalError: aggregate,
    })

    const result = normalizeRawError(error, 'info')
    const raw = JSON.parse(result.raw)

    expect(raw.originalError.name).toBe('AggregateError')
    expect(raw.originalError.message).toBe('All promises were rejected')
    expect(raw.originalError.errors).toHaveLength(2)
    expect(raw.originalError.errors[0].message).toBe('connect ECONNREFUSED 127.0.0.1:443')
    expect(raw.originalError.errors[1].message).toBe('connect ECONNREFUSED ::1:443')
  })

  it('includes a nested cause stack for 5xx errors', () => {
    const originalError = new Error('boom')

    const error = new StorageBackendError({
      code: ErrorCode.InternalError,
      httpStatusCode: 500,
      message: 'Error purging cache',
      originalError,
    })

    const result = normalizeRawError(error, 'info')
    const raw = JSON.parse(result.raw)

    expect(raw.originalError.stack).toBeTruthy()
  })

  it('omits a nested cause stack for 4xx errors', () => {
    const originalError = new Error('boom')

    const error = new StorageBackendError({
      code: ErrorCode.InvalidRequest,
      httpStatusCode: 400,
      message: 'Bad request',
      originalError,
    })

    const result = normalizeRawError(error, 'info')
    const raw = JSON.parse(result.raw)

    expect(raw.originalError.stack).toBeUndefined()
  })

  it('omits pg client internals attached to Error objects', () => {
    const error = new Error('Connection terminated unexpectedly') as Error & {
      client?: unknown
      code?: string
    }
    const client: { ssl: { ca: string }; self?: unknown } = {
      ssl: { ca: 'secret root cert' },
    }
    client.self = client
    error.client = client
    error.code = '08006'

    const result = normalizeRawError(error, 'info')

    expect(result.raw).not.toContain('client')
    expect(result.raw).not.toContain('secret root cert')
    expect(JSON.parse(result.raw)).toEqual({ code: '08006' })
  })

  it('handles S3 errors with correct errorCode and statusCode', () => {
    const s3Error = new Error('The specified upload does not exist.')
    s3Error.name = 'NoSuchUpload'
    Object.assign(s3Error, {
      $metadata: {
        httpStatusCode: 404,
      },
    })

    const result = normalizeRawError(s3Error, 'info')

    expect(result.errorCode).toBe(ErrorCode.S3Error)
    expect(result.statusCode).toBe(404)
    expect(result.name).toBe('NoSuchUpload')
    expect(result.message).toBe('The specified upload does not exist.')
  })
})

describe('getErrorCode', () => {
  it.each([
    ['FST_ERR_VALIDATION', ErrorCode.InvalidRequest],
    ['FST_ERR_CTP_EMPTY_JSON_BODY', ErrorCode.InvalidRequest],
    ['FST_ERR_CTP_INVALID_JSON_BODY', ErrorCode.InvalidRequest],
    ['FST_ERR_CTP_INVALID_CONTENT_LENGTH', ErrorCode.InvalidRequest],
    ['FST_ERR_CTP_INVALID_MEDIA_TYPE', ErrorCode.InvalidMimeType],
    ['FST_ERR_CTP_BODY_TOO_LARGE', ErrorCode.EntityTooLarge],
  ])('maps Fastify error code %s to %s', (fastifyCode, expectedErrorCode) => {
    const error = new Error('Fastify error')
    Object.assign(error, { code: fastifyCode })

    expect(getErrorCode(error)).toBe(expectedErrorCode)
  })
})
