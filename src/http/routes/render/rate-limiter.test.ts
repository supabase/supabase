import { ErrorCode } from '@internal/errors'
import Fastify from 'fastify'
import { setErrorHandler } from '../../error-handler'
import { errorSchema } from '../../schemas/error'

describe('render rate limiter', () => {
  afterEach(() => {
    vi.doUnmock('../../../config')
    vi.resetModules()
  })

  it('returns SlowDown after the request limit is exceeded', async () => {
    vi.doMock('../../../config', () => ({
      getConfig: () => ({
        rateLimiterDriver: 'memory',
        rateLimiterRedisUrl: '',
        rateLimiterSkipOnError: false,
        rateLimiterRedisConnectTimeout: 1,
        rateLimiterRedisCommandTimeout: 1,
        rateLimiterRenderPathMaxReqSec: 1,
      }),
    }))

    const { rateLimiter } = await import('./rate-limiter')
    const app = Fastify()
    app.addSchema(errorSchema)
    setErrorHandler(app)
    await app.register(rateLimiter)
    app.get(
      '/render',
      {
        schema: {
          response: {
            '4xx': { $ref: 'errorSchema#' },
          },
        },
      },
      async () => ({ ok: true })
    )

    try {
      for (let request = 0; request < 4; request++) {
        const response = await app.inject('/render')
        expect(response.statusCode).toBe(200)
      }

      const response = await app.inject('/render')

      expect(response.statusCode).toBe(429)
      expect(response.json()).toMatchObject({
        statusCode: '429',
        error: 'Too Many Requests',
        code: ErrorCode.SlowDown,
        message: expect.stringContaining('Rate limit exceeded'),
      })
    } finally {
      await app.close()
    }
  })
})
