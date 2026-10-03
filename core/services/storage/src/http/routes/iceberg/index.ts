import { FastifyInstance } from 'fastify'
import { getConfig } from '../../../config'
import { setErrorHandler } from '../../error-handler'
import {
  db,
  icebergRestCatalog,
  registerJwtAuth,
  requireTenantFeature,
  storage,
} from '../../plugins'
import bucket from './bucket'
import catalogue from './catalog'
import namespace from './namespace'
import table from './table'

export default async function routes(fastify: FastifyInstance) {
  const { dbServiceRole, icebergEnabled, isMultitenant } = getConfig()

  // Disable iceberg routes if the feature is not enabled
  if (!icebergEnabled && !isMultitenant) {
    return
  }

  fastify.register(async function authenticated(fastify) {
    registerJwtAuth(fastify, {
      enforceJwtRoles: [dbServiceRole],
    })

    if (isMultitenant) {
      fastify.register(requireTenantFeature('icebergCatalog'))
    }

    fastify.register(db)
    fastify.register(storage)
    fastify.register(bucket)
    fastify.register(icebergRestCatalog, { prefix: 'v1' })
    fastify.register(catalogue, { prefix: 'v1' })
    fastify.register(namespace, { prefix: 'v1' })
    fastify.register(table, { prefix: 'v1' })

    setErrorHandler(fastify, {
      respectStatusCode: true,
      formatter: (e) => {
        return {
          error: {
            message: e.message,
            type: e.code,
            code: parseInt(e.statusCode, 10),
          },
        }
      },
    })
  })
}
