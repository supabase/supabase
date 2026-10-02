import { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { getConfig } from '../../config'

const apiKeyPlugin = fastifyPlugin(
  async (fastify) => {
    const { adminApiKeys } = getConfig()
    const apiKeys = new Set(adminApiKeys.split(',').filter(Boolean))
    fastify.addHook('onRequest', (request, reply, done) => {
      if (typeof request.headers.apikey !== 'string' || !apiKeys.has(request.headers.apikey)) {
        reply.status(401).send()
        return
      }

      done()
    })
  },
  { name: 'auth-admin-api-key' }
)

export function registerApiKeyAuth(fastify: FastifyInstance) {
  fastify.addHook('onRoute', (routeOptions) => {
    routeOptions.schema = routeOptions.schema || {}
    routeOptions.schema.security = [{ apiKeyAuth: [] }]
  })
  fastify.register(apiKeyPlugin)
}
