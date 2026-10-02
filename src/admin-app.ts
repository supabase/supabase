import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { lastLocalMigrationName } from '@internal/database/migrations'
import { handleMetricsRequest } from '@internal/monitoring/otel-metrics'
import fastify, { FastifyInstance, FastifyServerOptions } from 'fastify'
import { getConfig } from './config'
import { plugins, routes, setErrorHandler } from './http'
import { finiteSwaggerTransform, withFiniteAjv } from './http/finite'

interface buildOpts extends FastifyServerOptions {
  exposeDocs?: boolean
}

const { version, prometheusMetricsEnabled } = getConfig()

const build = (opts: buildOpts = {}): FastifyInstance => {
  const app = fastify(withFiniteAjv(opts))

  if (opts.exposeDocs) {
    app.register(fastifySwagger, {
      exposeHeadRoutes: true,
      transform: finiteSwaggerTransform,
      openapi: {
        info: {
          title: 'Supabase Storage Admin API',
          description: 'Admin API documentation for Supabase Storage',
          version,
        },
        components: {
          securitySchemes: {
            apiKeyAuth: {
              type: 'apiKey',
              in: 'header',
              name: 'ApiKey',
            },
          },
        },
        tags: [
          { name: 'tenant', description: 'Tenant management' },
          { name: 'object', description: 'Object management' },
          { name: 'jwks', description: 'JWKS configuration' },
          { name: 'migration', description: 'Database migrations' },
          { name: 's3-credentials', description: 'S3 credentials management' },
          { name: 'queue', description: 'Queue management' },
          {
            name: 'pprof',
            description: 'Runtime profiling, heap snapshots, and archived profiles',
          },
        ],
      },
    })

    app.register(fastifySwaggerUi, {
      routePrefix: '/documentation',
    })
  }

  app.register(plugins.closeConnectionOnError)
  app.register(plugins.blobResponse)
  app.register(plugins.requestContext)
  app.register(plugins.signals)
  app.register(plugins.adminTenantId)
  app.register(
    plugins.logRequest({
      excludeUrls: new Set(['/status', '/metrics', '/health', '/version', '/migration-version']),
    })
  )
  app.register(routes.tenants, { prefix: 'tenants' })
  app.register(routes.objects, { prefix: 'tenants' })
  app.register(routes.jwks, { prefix: 'tenants' })
  app.register(routes.icebergAdmin, { prefix: 'tenants' })
  app.register(routes.migrations, { prefix: 'migrations' })
  app.register(routes.pprof, { prefix: 'debug/pprof' })
  app.register(routes.s3Credentials, { prefix: 's3' })
  app.register(routes.queue, { prefix: 'queue' })

  // Register /metrics endpoint - uses OTel Prometheus exporter
  if (prometheusMetricsEnabled) {
    app.get('/metrics', handleMetricsRequest)
  }

  app.get('/version', (_, reply) => {
    reply.send(version)
  })
  app.register(async (protectedRoutes) => {
    plugins.registerApiKeyAuth(protectedRoutes)
    protectedRoutes.get(
      '/migration-version',
      { schema: { tags: ['migration'] } },
      async (_, reply) => {
        reply.send({ migrationVersion: await lastLocalMigrationName() })
      }
    )
  })
  app.get('/status', async (_, response) => response.status(200).send())

  setErrorHandler(app)

  return app
}

export default build
