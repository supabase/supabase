import { ERRORS, ErrorCode } from '@internal/errors'
import { DBError } from '@storage/database/errors'
import Fastify from 'fastify'
import { DatabaseError } from 'pg'
import { setErrorHandler } from './error-handler'
import { errorSchema, sharedErrorResponseSchemas } from './schemas/error'

describe('setErrorHandler', () => {
  it('preserves service codes through the shared 4xx response schema', async () => {
    const app = Fastify()
    app.addSchema(errorSchema)
    setErrorHandler(app)

    app.get(
      '/missing',
      {
        schema: {
          response: {
            '4xx': { $ref: 'errorSchema#' },
          },
        },
      },
      async () => {
        throw ERRORS.NoSuchKey('missing.txt')
      }
    )

    try {
      const response = await app.inject('/missing')

      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({
        statusCode: '404',
        error: 'not_found',
        code: ErrorCode.NoSuchKey,
        message: 'Object not found',
      })
    } finally {
      await app.close()
    }
  })

  it('preserves service codes through the shared 5xx response schema', async () => {
    const app = Fastify()
    app.addSchema(errorSchema)
    setErrorHandler(app)

    app.get(
      '/internal-error',
      {
        schema: {
          response: sharedErrorResponseSchemas,
        },
      },
      async () => {
        throw ERRORS.InternalError()
      }
    )

    try {
      const response = await app.inject('/internal-error')

      expect(response.statusCode).toBe(500)
      expect(response.json()).toEqual({
        statusCode: '500',
        error: ErrorCode.InternalError,
        code: ErrorCode.InternalError,
        message: 'Internal server error',
      })
    } finally {
      await app.close()
    }
  })

  it('maps Fastify schema validation failures to InvalidRequest', async () => {
    const app = Fastify()
    setErrorHandler(app)

    app.post(
      '/validated',
      {
        schema: {
          body: {
            type: 'object',
            properties: {
              count: { type: 'number' },
            },
            required: ['count'],
            additionalProperties: false,
          },
        },
      },
      async () => ({ ok: true })
    )

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/validated',
        payload: { count: 'not-a-number' },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchObject({
        statusCode: '400',
        code: ErrorCode.InvalidRequest,
      })
    } finally {
      await app.close()
    }
  })

  it('uses the fallback status code in Fastify error payloads when statusCode is undefined', async () => {
    const app = Fastify()
    setErrorHandler(app)

    app.get('/undefined-status-code', async () => {
      const error = new Error('boom') as Error & { statusCode?: number }
      error.statusCode = undefined
      throw error
    })

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/undefined-status-code',
      })

      expect(response.statusCode).toBe(500)
      expect(response.json()).toMatchObject({
        statusCode: '500',
        code: ErrorCode.InternalError,
        message: 'boom',
      })
    } finally {
      await app.close()
    }
  })

  it('maps wrapped database slowdown errors to 429', async () => {
    const app = Fastify()
    setErrorHandler(app)

    app.get('/wrapped-slowdown', async () => {
      throw DBError.fromDBError(
        createPgError('08P01', 'no more connections allowed (max_client_conn)')
      )
    })

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/wrapped-slowdown',
      })

      expect(response.statusCode).toBe(429)
      expect(response.json()).toMatchObject({
        statusCode: '429',
        code: ErrorCode.SlowDown,
        error: 'too_many_connections',
      })
    } finally {
      await app.close()
    }
  })

  it('keeps wrapped non-slowdown connection errors as database errors', async () => {
    const app = Fastify()
    setErrorHandler(app)

    app.get('/wrapped-protocol-error', async () => {
      throw DBError.fromDBError(createPgError('08P01', 'received invalid response: 58'))
    })

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/wrapped-protocol-error',
      })

      expect(response.statusCode).toBe(500)
      expect(response.json()).toMatchObject({
        statusCode: '500',
        code: ErrorCode.DatabaseError,
        error: ErrorCode.DatabaseError,
      })
    } finally {
      await app.close()
    }
  })
})

function createPgError(code: string, message: string): DatabaseError {
  const error = new DatabaseError(message, message.length, 'error')
  error.code = code
  return error
}
