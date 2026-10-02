import { FastifyInstance } from 'fastify'
import { getConfig } from '../../../config'
import { setRestNotFoundHandler } from '../../not-found-handler'
import { registerJwtAuth, requireTenantFeature } from '../../plugins'
import purgeCache from './purgeCache'

const { dbServiceRole } = getConfig()

export default async function routes(fastify: FastifyInstance) {
  setRestNotFoundHandler(fastify)

  fastify.register(async function authenticated(fastify) {
    registerJwtAuth(fastify, {
      enforceJwtRoles: [dbServiceRole],
    })
    fastify.register(requireTenantFeature('purgeCache'))

    fastify.register(purgeCache)
  })
}
