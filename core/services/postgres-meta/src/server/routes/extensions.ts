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
    const { data, error } = await pgMeta.extensions.list({ limit, offset })
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
      name: string
    }
  }>('/:name', async (request, reply) => {
    const config = createConnectionConfig(request)

    const pgMeta = new PostgresMeta(config)
    const { data, error } = await pgMeta.extensions.retrieve({ name: request.params.name })
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
    const { data, error } = await pgMeta.extensions.create(request.body as any)
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
      name: string
    }
    Body: any
  }>('/:name', async (request, reply) => {
    const config = createConnectionConfig(request)

    const pgMeta = new PostgresMeta(config)
    const { data, error } = await pgMeta.extensions.update(request.params.name, request.body as any)
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
      name: string
    }
    Querystring: {
      cascade?: string
    }
  }>('/:name', async (request, reply) => {
    const config = createConnectionConfig(request)
    const cascade = request.query.cascade === 'true'

    const pgMeta = new PostgresMeta(config)
    const { data, error } = await pgMeta.extensions.remove(request.params.name, { cascade })
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
