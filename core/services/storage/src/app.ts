import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { getPublicJwks } from '@internal/database'
import fastify, { FastifyInstance, FastifyServerOptions } from 'fastify'
import { getConfig } from './config'
import { plugins, routes, schemas, setErrorHandler } from './http'
import { finiteSwaggerTransform, withFiniteAjv } from './http/finite'

interface buildOpts extends FastifyServerOptions {
  exposeDocs?: boolean
}

const { version, keepAliveTimeout, headersTimeout, isMultitenant } = getConfig()

const build = (opts: buildOpts = {}): FastifyInstance => {
  const app = fastify(withFiniteAjv(opts))

  app.addContentTypeParser('*', function (request, payload, done) {
    done(null)
  })

  app.server.keepAliveTimeout = keepAliveTimeout * 1000
  app.server.headersTimeout = headersTimeout * 1000

  // kong should take care of cors
  // app.register(fastifyCors)

  if (opts.exposeDocs) {
    app.register(fastifySwagger, {
      exposeHeadRoutes: true,
      transform: finiteSwaggerTransform,
      openapi: {
        info: {
          title: 'Supabase Storage API',
          description: 'API documentation for Supabase Storage',
          version,
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'jwt',
            },
          },
        },
        tags: [
          { name: 'object', description: 'Object end-points' },
          { name: 'bucket', description: 'Bucket end-points' },
          { name: 's3', description: 'S3 end-points' },
          { name: 'transformation', description: 'Image transformation' },
          { name: 'resumable', description: 'Resumable Upload end-points' },
          { name: 'cdn', description: 'CDN cache management' },
          { name: 'health', description: 'Health check end-points' },
          { name: 'iceberg', description: 'Apache Iceberg REST catalog' },
          { name: 'vector', description: 'Vector storage and search' },
        ],
      },
    })

    app.register(fastifySwaggerUi, {
      routePrefix: '/documentation',
    })
  }

  const excludedRoutesFromMonitoring = new Set([
    '/status',
    '/metrics',
    '/health',
    '/healthcheck',
    '/version',
    '/documentation',
  ])

  // add in common schemas
  app.addSchema(schemas.authSchema)
  app.addSchema(schemas.errorSchema)

  app.register(plugins.closeConnectionOnError)
  app.register(plugins.blobResponse)
  app.register(plugins.requestContext)
  app.register(plugins.signals)
  app.register(plugins.tenantId)
  app.register(
    plugins.metrics({
      enabledEndpoint: !isMultitenant,
      excludeRoutes: excludedRoutesFromMonitoring,
    })
  )
  app.register(plugins.tracing)
  app.register(plugins.logRequest({ excludeUrls: excludedRoutesFromMonitoring }))
  app.register(plugins.headerValidator({ excludeUrls: excludedRoutesFromMonitoring }))
  app.register(routes.tus, { prefix: 'upload/resumable' })
  app.register(routes.bucket, { prefix: 'bucket' })
  app.register(routes.object, { prefix: 'object' })
  app.register(routes.render, { prefix: 'render/image' })
  app.register(routes.s3, { prefix: 's3' })
  app.register(routes.cdn, { prefix: 'cdn' })
  app.register(routes.healthcheck, { prefix: 'health' })
  app.register(routes.iceberg, { prefix: 'iceberg' })
  app.register(routes.vector, { prefix: 'vector' })

  setErrorHandler(app)

  app.get('/version', (_, reply) => {
    reply.send(version)
  })
  app.get('/status', async (_, response) => response.status(200).send())
  app.get('/.well-known/jwks.json', async (request, reply) => {
    const keys = await getPublicJwks(request.tenantId)
    reply.header('cache-control', 'public, max-age=600')
    reply.header('vary', 'x-forwarded-host')
    reply.send({ keys })
  })

  return app
}

export default build
