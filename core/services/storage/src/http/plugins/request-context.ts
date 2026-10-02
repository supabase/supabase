import { getSbReqId } from '@internal/monitoring'
import fastifyPlugin from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyRequest {
    sbReqId?: string
  }
}

export const requestContext = fastifyPlugin(
  async (fastify) => {
    fastify.decorateRequest('sbReqId', undefined)
    fastify.addHook('onRequest', (request, _reply, done) => {
      request.sbReqId = getSbReqId(request.headers)
      done()
    })
  },
  { name: 'request-context' }
)
