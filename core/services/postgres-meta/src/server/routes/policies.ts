import { FastifyInstance } from 'fastify'
import { PostgresMeta } from '../../lib/index.js'
import { createConnectionConfig } from '../utils.js'
import { extractRequestForLogging } from '../utils.js'

export default async (fastify: FastifyInstance) => {
  fastify.get<{
    Headers: { pg: string; 'x-pg-application-name'?: string }
    Querystring: {
      include_system_schemas?: string
      // Note: this only supports comma separated values (e.g., ".../policies?included_schemas=public,core")
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
    const { data, error } = await pgMeta.policies.list({
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
    const { data, error } = await pgMeta.policies.retrieve({ id })
    await pgMeta.end()
    if (error) {
      request.log.error({ error, request: extractRequestForLogging(request) })
      reply.code(404)
      return { error: error.message }
    }

    return data
  })

  fastify.post<{
    Headers: { pg: string; 'x-pg-application-name'?: string }
    Body: any
  }>('/', async (request, reply) => {
    const config = createConnectionConfig(request)

    const pgMeta = new PostgresMeta(config)
    const { data, error } = await pgMeta.policies.create(request.body as any)
    await pgMeta.end()
    if (error) {
      request.log.error({ error, request: extractRequestForLogging(request) })
      reply.code(400)
      return { error: error.message }
    }

    return data
  })

  fastify.patch<{
    Headers: { pg: string; 'x-pg-application-name'?: string }
    Params: {
      id: string
    }
    Body: any
  }>('/:id(\\d+)', async (request, reply) => {
    const config = createConnectionConfig(request)
    const id = Number(request.params.id)

    const pgMeta = new PostgresMeta(config)
    const { data, error } = await pgMeta.policies.update(id, request.body as any)
    await pgMeta.end()
    if (error) {
      request.log.error({ error, request: extractRequestForLogging(request) })
      reply.code(400)
      if (error.message.startsWith('Cannot find')) reply.code(404)
      return { error: error.message }
    }

    return data
  })

  fastify.delete<{
    Headers: { pg: string; 'x-pg-application-name'?: string }
    Params: {
      id: string
    }
  }>('/:id(\\d+)', async (request, reply) => {
    const config = createConnectionConfig(request)
    const id = Number(request.params.id)

    const pgMeta = new PostgresMeta(config)
    const { data, error } = await pgMeta.policies.remove(id)
    await pgMeta.end()
    if (error) {
      request.log.error({ error, request: extractRequestForLogging(request) })
      reply.code(400)
      if (error.message.startsWith('Cannot find')) reply.code(404)
      return { error: error.message }
    }

    return data
  })
}
