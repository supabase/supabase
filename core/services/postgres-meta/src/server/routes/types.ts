import { FastifyInstance } from 'fastify'
import { PostgresMeta } from '../../lib/index.js'
import { createConnectionConfig } from '../utils.js'
import { extractRequestForLogging } from '../utils.js'

export default async (fastify: FastifyInstance) => {
  fastify.get<{
    Headers: { pg: string; 'x-pg-application-name'?: string }
    Querystring: {
      include_array_types?: string
      include_system_schemas?: string
      // Note: this only supports comma separated values (e.g., ".../types?included_schemas=public,core")
      included_schemas?: string
      excluded_schemas?: string
      limit?: number
      offset?: number
    }
  }>('/', async (request, reply) => {
    const config = createConnectionConfig(request)
    const includeArrayTypes = request.query.include_array_types === 'true'
    const includeSystemSchemas = request.query.include_system_schemas === 'true'
    const includedSchemas = request.query.included_schemas?.split(',')
    const excludedSchemas = request.query.excluded_schemas?.split(',')
    const limit = request.query.limit
    const offset = request.query.offset

    const pgMeta = new PostgresMeta(config)
    const { data, error } = await pgMeta.types.list({
      includeArrayTypes,
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
}
