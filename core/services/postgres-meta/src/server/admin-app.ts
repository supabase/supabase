import './sentry.js'
import * as Sentry from '@sentry/node'
import { fastify, FastifyInstance, FastifyServerOptions } from 'fastify'
import fastifyMetrics from 'fastify-metrics'

export function build(opts: FastifyServerOptions = {}): FastifyInstance {
  const app = fastify(opts)
  Sentry.setupFastifyErrorHandler(app)
  app.register(fastifyMetrics.default, {
    endpoint: '/metrics',
    routeMetrics: { enabled: false },
  })
  return app
}
