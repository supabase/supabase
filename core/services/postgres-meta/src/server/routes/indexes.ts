import { FastifyInstance } from 'fastify'
import { PostgresMeta } from '../../lib/index.js'
import { createConnectionConfig, extractRequestForLogging } from '../utils.js'

export default async (fastify: FastifyInstance) => {
  fastify.get<{
    Headers: { pg: string; 'x-pg-application-name'?: string }
    Querystring: {
      include_system_schemas?: string
      // Note: this only supports comma separated values (e.g., ".../functions?included_schemas=public,core")
      included_schemas?: string
      excluded_schemas?: string
      limit?: number
      offset?: number
    }
  }>('/', async (request, reply) => {
    const config = createConnectionConfig(request)
    const includeSystemSchemas = request.query.include_system_schemas === 'true'
    const includedSchemas = request.query.included_schemas?.split(',')
    const excludedSchemas = request.query.excluded_schemas?.split(',')
    const limit = request.query.limit
    const offset = request.query.offset

    const pgMeta = new PostgresMeta(config)
    const { data, error } = await pgMeta.indexes.list({
      includeSystemSchemas,
      includedSchemas,
      excludedSchemas,
      limit,
      offset,
    })
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
    Params: {
      id: string
    }
  }>('/:id(\\d+)', async (request, reply) => {
    const config = createConnectionConfig(request)
    const id = Number(request.params.id)

    const pgMeta = new PostgresMeta(config)
    const { data, error } = await pgMeta.indexes.retrieve({ id })
    await pgMeta.end()
    if (error) {
      request.log.error({ error, request: extractRequestForLogging(request) })
      reply.code(404)
      return { error: error.message }
    }

    return data
  })
}
