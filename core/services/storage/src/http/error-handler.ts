import { FastifyError } from '@fastify/error'
import { ErrorCode, getErrorCode, isRenderableError, StorageError } from '@internal/errors'
import { isDatabaseSlowDownError } from '@internal/errors/database-error'
import { FastifyInstance } from 'fastify'

/**
 * The global error handler for all the uncaught exceptions within a request.
 * We try our best to display meaningful information to our users
 * and log any error that occurs
 * @param app
 * @param options
 */
export const setErrorHandler = (
  app: FastifyInstance,
  options?: {
    respectStatusCode?: boolean
    formatter?: (error: StorageError) => Record<string, unknown>
  }
) => {
  app.setErrorHandler<Error>(function (error, request, reply) {
    const formatter = options?.formatter || ((e) => e)
    // We assign the error received.
    // it will be logged in the request log plugin
    request.executionError = error

    // database error
    if (isDatabaseSlowDownError(error)) {
      return reply.status(429).send(
        formatter({
          statusCode: `429`,
          error: 'too_many_connections',
          code: ErrorCode.SlowDown,
          message: 'Too many connections issued to the database',
        })
      )
    }

    if (isRenderableError(error)) {
      const renderableError = error.render()
      const statusCode = options?.respectStatusCode
        ? parseInt(renderableError.statusCode, 10)
        : error.userStatusCode
          ? error.userStatusCode
          : renderableError.statusCode === '500'
            ? 500
            : 400

      return reply.status(statusCode).send(
        formatter({
          ...renderableError,
          error: error.error || renderableError.code,
        })
      )
    }

    // Fastify errors
    if ('statusCode' in error) {
      const err = error as FastifyError

      if (err.code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE') {
        return reply.status(400).send(
          formatter({
            statusCode: '415',
            code: ErrorCode.InvalidMimeType,
            error: 'invalid_mime_type',
            message: 'Invalid Content-Type header',
          })
        )
      }

      const errorCode = getErrorCode(err)
      const responseErrorCode = (
        errorCode === ErrorCode.UnknownError ? ErrorCode.InternalError : errorCode
      ) as ErrorCode
      const responseStatusCode = err.statusCode || 500

      return reply.status(responseStatusCode).send(
        formatter({
          statusCode: `${responseStatusCode}`,
          error: err.name,
          code: responseErrorCode,
          message: err.message,
        })
      )
    }

    return reply.status(500).send(
      formatter({
        statusCode: '500',
        error: 'Internal',
        message: 'Internal Server Error',
        code: ErrorCode.InternalError,
      })
    )
  })
}
