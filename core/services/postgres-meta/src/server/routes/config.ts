import { FastifyInstance } from 'fastify'
import { PostgresMeta } from '../../lib/index.js'
import { createConnectionConfig } from '../utils.js'
import { extractRequestForLogging } from '../utils.js'

export default async (fastify: FastifyInstance) => {
  fastify.get<{
    Headers: { pg: string; 'x-pg-application-name'?: string }
    Querystring: {
      limit?: number
      offset?: number
    }
  }>('/', async (request, reply) => {
    const config = createConnectionConfig(request)
    const limit = request.query.limit
    const offset = request.query.offset

    const pgMeta = new PostgresMeta(config)
    const { data, error } = await pgMeta.config.list({ limit, offset })
    await pgMeta.end()
    if (error) {
      request.log.error({ error, request: extractRequestForLogging(request) })
      reply.code(500)
      return { error: error.message }
    }

    return data
  })

  fastify.get<{
    Headers: { pg: string; 'x-pg-application-name'?: string }
  }>('/version', async (request, reply) => {
    const config = createConnectionConfig(request)

    const pgMeta = new PostgresMeta(config)
    const { data, error } = await pgMeta.version.retrieve()
    await pgMeta.end()
    if (error) {
      request.log.error({ error, request: extractRequestForLogging(request) })
      reply.code(500)
      return { error: error.message }
    }

    return data
  })
}
