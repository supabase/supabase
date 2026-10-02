import type { FastifyInstance } from 'fastify'
import { PostgresMeta } from '../../../lib/index.js'
import { createConnectionConfig, extractRequestForLogging } from '../../utils.js'
import { type AccessControl, generateSwift } from '@supabase/postgrest-typegen'
import { getGeneratorMetadata } from '../../../lib/generators.js'

export default async (fastify: FastifyInstance) => {
  fastify.get<{
    Headers: { pg: string; 'x-pg-application-name'?: string }
    Querystring: {
      excluded_schemas?: string
      included_schemas?: string
      access_control?: AccessControl
    }
  }>('/', async (request, reply) => {
    const config = createConnectionConfig(request)
    const excludedSchemas =
      request.query.excluded_schemas?.split(',').map((schema) => schema.trim()) ?? []
    const includedSchemas =
      request.query.included_schemas?.split(',').map((schema) => schema.trim()) ?? []
    const accessControl = request.query.access_control ?? 'internal'

    const pgMeta: PostgresMeta = new PostgresMeta(config)
    const { data: generatorMeta, error: generatorMetaError } = await getGeneratorMetadata(pgMeta, {
      includedSchemas,
      excludedSchemas,
    })
    if (generatorMetaError) {
      request.log.error({ error: generatorMetaError, request: extractRequestForLogging(request) })
      reply.code(500)
      return { error: generatorMetaError.message }
    }

    return generateSwift(generatorMeta!, { accessControl })
  })
}
