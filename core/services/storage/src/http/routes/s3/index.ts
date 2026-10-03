import fastifyMultipart from '@fastify/multipart'
import { ERRORS } from '@internal/errors'
import { FastifyInstance, FastifyRequest, RouteHandlerMethod } from 'fastify'
import { JSONSchema } from 'json-schema-to-ts'
import { getConfig } from '../../../config'
import {
  db,
  detectS3IcebergBucket,
  icebergRestCatalog,
  requireTenantFeature,
  signatureV4,
  storage,
  xmlParser,
} from '../../plugins'
import { formatS3ErrorResponse, s3ErrorHandler } from './error-handler'
import { findArraySchemaPaths, getRouter, RequestInput, RouteQuery } from './router'

const { s3ProtocolEnabled } = getConfig()
const S3_XML_NAMESPACE = 'http://s3.amazonaws.com/doc/2006-03-01/'

const PRESIGN_AUTH_PARAMS = new Set([
  'x-amz-algorithm',
  'x-amz-content-sha256',
  'x-amz-credential',
  'x-amz-date',
  'x-amz-expires',
  'x-amz-security-token',
  'x-amz-signature',
  'x-amz-signedheaders',
])

// Presigners hoist x-amz-* headers into the signed query wins over headers.
function hoistPresignedHeaders(req: FastifyRequest) {
  const query = req.query as Record<string, string | string[] | undefined>
  if (!query?.['X-Amz-Signature']) {
    return
  }

  for (const [key, value] of Object.entries(query)) {
    const name = key.toLowerCase()
    if (name.startsWith('x-amz-') && !PRESIGN_AUTH_PARAMS.has(name)) {
      req.headers[name] = value
    }
  }
}

export default async function routes(fastify: FastifyInstance) {
  if (!s3ProtocolEnabled) {
    return
  }

  fastify.register(async (fastify) => {
    const s3Router = getRouter()
    const s3Routes = s3Router.routes()

    Array.from(s3Routes.keys()).forEach((routePath) => {
      const routes = s3Routes.get(routePath)
      if (!routes || routes?.length === 0) {
        return
      }

      const methods = new Set(routes.map((e) => e.method))

      methods.forEach((method) => {
        const routesByMethod = routes.filter((e) => e.method === method)
        const icebergRoutes = routesByMethod.filter((e) => e.type === 'iceberg')
        const standardRoutes = routesByMethod.filter((e) => e.type === undefined)
        const bodySchemas = routesByMethod.flatMap((route) =>
          route.schema.Body ? [route.schema.Body as JSONSchema] : []
        )

        const routeHandler: RouteHandlerMethod = async (req, reply) => {
          hoistPresignedHeaders(req)

          const matchType = req.isIcebergBucket ? 'iceberg' : undefined
          const matchQuery = (req.query as RouteQuery) || {}
          const matchHeaders = (req.headers as Record<string, string>) || {}
          const candidates = matchType === 'iceberg' ? icebergRoutes : standardRoutes

          for (const route of candidates) {
            if (route.matches(matchType, matchQuery, matchHeaders)) {
              if (!route.handler) {
                throw new Error('no handler found')
              }

              if (!route.acceptMultiformData && req.isMultipart()) {
                return reply.status(400).send({
                  message: 'Multipart form data not supported',
                })
              }

              req.operation = route.operation

              if (req.operation && typeof req.opentelemetry === 'function') {
                req.opentelemetry()?.span?.setAttribute('http.operation', req.operation)
              }

              const data = {
                Params: req.params,
                Body: req.body,
                Headers: req.headers,
                Querystring: req.query,
              } as RequestInput<typeof route.schema>
              const isValid = route.validate(data)

              if (!isValid) {
                const validationError = ERRORS.InvalidRequest('Invalid request') as Error & {
                  validation?: unknown
                }
                // validation property is required to send correct reply in error-handler.ts
                validationError.validation = route.validate.errors
                throw validationError
              }

              const output = await route.handler(data, {
                req,
                storage: req.storage,
                tenantId: req.tenantId,
                owner: req.owner,
                signals: {
                  get body() {
                    return req.signals.body.signal
                  },
                  get response() {
                    return req.signals.response.signal
                  },
                },
              })

              const headers = output.headers

              if (headers) {
                for (const header in headers) {
                  if (!Object.prototype.hasOwnProperty.call(headers, header)) {
                    continue
                  }

                  const value = headers[header]
                  if (value || (value === '' && header.startsWith('x-amz-meta-'))) {
                    reply.header(header, value)
                  }
                }
              }
              return reply.status(output.statusCode || 200).send(output.responseBody)
            }
          }

          return reply.status(404).send()
        }

        fastify.register(async (localFastify) => {
          localFastify.register(
            requireTenantFeature('s3Protocol', {
              formatter: formatS3ErrorResponse,
            })
          )

          const disableContentParser = routesByMethod?.some(
            (route) => route.disableContentTypeParser
          )
          const allowEmptyJsonBody = routesByMethod?.some((route) => route.allowEmptyJsonBody)

          if (disableContentParser) {
            localFastify.addContentTypeParser(
              ['application/json', 'text/plain', 'application/xml'],
              function (request, payload, done) {
                done(null)
              }
            )
          } else if (allowEmptyJsonBody) {
            const defaultJsonParser = localFastify.getDefaultJsonParser(
              localFastify.initialConfig.onProtoPoisoning ?? 'error',
              localFastify.initialConfig.onConstructorPoisoning ?? 'error'
            )

            localFastify.addContentTypeParser(
              'application/json',
              { parseAs: 'string' },
              (request, body, done) => {
                const allowsEmptyBody =
                  (request.query as { uploads?: unknown }).uploads !== undefined

                if (!body && allowsEmptyBody) {
                  done(null, null)
                  return
                }

                const jsonBody = typeof body === 'string' ? body : body.toString('utf8')

                defaultJsonParser(request, jsonBody, done)
              }
            )
          }

          localFastify.register(fastifyMultipart, {
            limits: {
              fields: 20,
              files: 1,
            },
            throwFileSizeLimit: false,
          })

          localFastify.register(signatureV4)
          localFastify.register(xmlParser, {
            disableContentParser,
            parseAsArray: findArraySchemaPaths(bodySchemas),
            responseNamespace: S3_XML_NAMESPACE,
          })

          localFastify.register(db)
          localFastify.register(icebergRestCatalog)
          localFastify.register(detectS3IcebergBucket)
          localFastify.register(storage)

          localFastify[method](
            routePath,
            {
              validatorCompiler: () => () => true,
              exposeHeadRoute: false,
              schema: {
                tags: ['s3'],
              },
              errorHandler: s3ErrorHandler,
            },
            routeHandler
          )

          // handle optional trailing slash
          if (!routePath.endsWith('*') && !routePath.endsWith('/')) {
            localFastify[method](
              routePath + '/',
              {
                validatorCompiler: () => () => true,
                exposeHeadRoute: false,
                schema: {
                  tags: ['s3'],
                },
                errorHandler: s3ErrorHandler,
              },
              routeHandler
            )
          }
        })
      })
    })
  })
}
