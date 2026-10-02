import './sentry.js'
import * as Sentry from '@sentry/node'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import { fastify, FastifyInstance, FastifyServerOptions } from 'fastify'
import { PG_META_REQ_HEADER, MAX_BODY_LIMIT } from './constants.js'
import routes from './routes/index.js'
import { extractRequestForLogging } from './utils.js'
// Pseudo package declared only for this module
import pkg from '#package.json' with { type: 'json' }

export const build = (opts: FastifyServerOptions = {}): FastifyInstance => {
  const app = fastify({
    disableRequestLogging: true,
    requestIdHeader: PG_META_REQ_HEADER,
    bodyLimit: MAX_BODY_LIMIT,
    ...opts,
  })
  Sentry.setupFastifyErrorHandler(app)

  app.setErrorHandler((error, request, reply) => {
    app.log.error({ error: error.toString(), request: extractRequestForLogging(request) })
    reply.code(500).send({ error: error.message })
  })

  app.setNotFoundHandler((request, reply) => {
    app.log.error({ error: 'Not found', request: extractRequestForLogging(request) })
    reply.code(404).send({ error: 'Not found' })
  })

  app.register(swagger, {
    openapi: {
      servers: [],
      info: {
        title: 'postgres-meta',
        description: 'A REST API to manage your Postgres database',
        version: pkg.version,
      },
    },
  })

  app.register(cors)

  app.get('/', async (_request, _reply) => {
    return {
      status: 200,
      name: pkg.name,
      version: pkg.version,
      documentation: 'https://github.com/supabase/postgres-meta',
    }
  })

  app.get('/health', async (_request, _reply) => {
    return { date: new Date() }
  })

  app.register(routes)

  return app
}
