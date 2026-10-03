import fastifyRateLimit from '@fastify/rate-limit'
import { ErrorCode } from '@internal/errors'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import Redis from 'ioredis'
import { getConfig } from '../../../config'

const {
  rateLimiterDriver,
  rateLimiterRedisUrl,
  rateLimiterSkipOnError,
  rateLimiterRedisConnectTimeout,
  rateLimiterRedisCommandTimeout,
  rateLimiterRenderPathMaxReqSec,
} = getConfig()

export const rateLimiter = fp((fastify: FastifyInstance, _ops: unknown, done: () => void) => {
  fastify.register(fastifyRateLimit, {
    global: true,
    max: rateLimiterRenderPathMaxReqSec * 4,
    timeWindow: 4 * 1000, //4s
    continueExceeding: true,
    nameSpace: 'image-transformation-ratelimit-',
    skipOnError: rateLimiterSkipOnError,
    errorResponseBuilder(_request, context) {
      return Object.assign(new Error(`Rate limit exceeded, retry in ${context.after}`), {
        name: 'Too Many Requests',
        code: ErrorCode.SlowDown,
        statusCode: context.statusCode,
      })
    },
    redis:
      rateLimiterDriver === 'redis'
        ? new Redis(rateLimiterRedisUrl || '', {
            connectTimeout: rateLimiterRedisConnectTimeout * 1000,
            commandTimeout: rateLimiterRedisCommandTimeout * 1000,
          })
        : undefined,
    keyGenerator(request) {
      const tenant = request.tenantId
      const ip = request.headers['x-real-ip'] || request.headers['x-client-ip'] || request.ip

      // exclude query string
      const pathWithoutQuery = request.url.split('?').shift()

      return `${tenant}-${ip}-${pathWithoutQuery}`
    },
    addHeadersOnExceeding: {
      // default show all the response headers when rate limit is not reached
      'x-ratelimit-limit': false,
      'x-ratelimit-remaining': false,
      'x-ratelimit-reset': false,
    },
    addHeaders: {
      'x-ratelimit-limit': false,
      'x-ratelimit-remaining': false,
      'x-ratelimit-reset': false,
      'retry-after': false,
    },
  })

  done()
})
