import { FastifyInstance, FastifyRequest } from 'fastify'
import { PostgresMeta } from '../../lib/index.js'
import * as Parser from '../../lib/Parser.js'
import {
  createConnectionConfig,
  extractRequestForLogging,
  translateErrorToResponseCode,
} from '../utils.js'

const errorOnEmptyQuery = (request: FastifyRequest) => {
  if (!(request.body as any).query) {
    throw new Error('query not found')
  }
}

export default async (fastify: FastifyInstance) => {
  fastify.post<{
    Headers: { pg: string; 'x-pg-application-name'?: string }
    Body: { query: string; parameters?: unknown[] }
    Querystring: { statementTimeoutSecs?: number; queryTimeoutSecs?: number }
  }>('/', async (request, reply) => {
    const statementTimeoutSecs = request.query.statementTimeoutSecs
    errorOnEmptyQuery(request)
    const config = createConnectionConfig(request, request.query.queryTimeoutSecs)
    const pgMeta = new PostgresMeta(config)
    const { data, error } = await pgMeta.query(request.body.query, {
      trackQueryInSentry: true,
      statementQueryTimeout: statementTimeoutSecs,
      parameters: request.body.parameters,
    })
    await pgMeta.end()
    if (error) {
      request.log.error({ error, request: extractRequestForLogging(request) })
      reply.code(translateErrorToResponseCode(error))
      return { error: error.formattedError ?? error.message, ...error }
    }

    return data || []
  })

  fastify.post<{
    Headers: { pg: string; 'x-pg-application-name'?: string }
    Body: { query: string }
  }>('/format', async (request, reply) => {
    errorOnEmptyQuery(request)
    const { data, error } = await Parser.Format(request.body.query)

    if (error) {
      request.log.error({ error, request: extractRequestForLogging(request) })
      reply.code(translateErrorToResponseCode(error))
      return { error: error.message }
    }

    return data
  })

  fastify.post<{
    Headers: { pg: string; 'x-pg-application-name'?: string }
    Body: { query: string }
  }>('/parse', async (request, reply) => {
    errorOnEmptyQuery(request)
    const { data, error } = Parser.Parse(request.body.query)

    if (error) {
      request.log.error({ error, request: extractRequestForLogging(request) })
      reply.code(translateErrorToResponseCode(error))
      return { error: error.message }
    }

    return data
  })

  fastify.post<{
    Headers: { pg: string; 'x-pg-application-name'?: string }
    Body: { ast: object }
  }>('/deparse', async (request, reply) => {
    const { data, error } = await Parser.Deparse(request.body.ast)

    if (error) {
      request.log.error({ error, request: extractRequestForLogging(request) })
      reply.code(translateErrorToResponseCode(error))
      return { error: error.message }
    }

    return data
  })
}
