import { FastifyInstance } from 'fastify'
import { dbSuperUser, registerJwtAuth, storage } from '../../plugins'
import healthcheck from './healthcheck'

export default async function routes(fastify: FastifyInstance) {
  registerJwtAuth(fastify)
  fastify.register(dbSuperUser)
  fastify.register(storage)
  fastify.register(healthcheck)
}
