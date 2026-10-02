import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { PostgresMeta } from '../../lib/index.js'
import { postgresMaterializedViewSchema } from '../../lib/types.js'
import { createConnectionConfig } from '../utils.js'
import { extractRequestForLogging } from '../utils.js'

const route: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    '/',
    {
      schema: {
        headers: Type.Object({
          pg: Type.String(),
          'x-pg-application-name': Type.Optional(Type.String()),
        }),
        querystring: Type.Object({
          included_schemas: Type.Optional(Type.String()),
          excluded_schemas: Type.Optional(Type.String()),
          limit: Type.Optional(Type.Integer()),
          offset: Type.Optional(Type.Integer()),
          include_columns: Type.Optional(Type.Boolean()),
        }),
        response: {
          200: Type.Array(postgresMaterializedViewSchema),
          500: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const config = createConnectionConfig(request)
      const includedSchemas = request.query.included_schemas?.split(',')
      const excludedSchemas = request.query.excluded_schemas?.split(',')
      const limit = request.query.limit
      const offset = request.query.offset
      const includeColumns = request.query.include_columns

      const pgMeta = new PostgresMeta(config)
      const { data, error } = await pgMeta.materializedViews.list({
        includedSchemas,
        excludedSchemas,
        limit,
        offset,
        includeColumns,
      })
      await pgMeta.end()
      if (error) {
        request.log.error({ error, request: extractRequestForLogging(request) })
        reply.code(500)
        return { error: error.message }
      }

      return data
    }
  )

  fastify.get(
    '/:id(\\d+)',
    {
      schema: {
        headers: Type.Object({
          pg: Type.String(),
          'x-pg-application-name': Type.Optional(Type.String()),
        }),
        params: Type.Object({
          id: Type.Integer(),
        }),
        response: {
          200: postgresMaterializedViewSchema,
          404: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const config = createConnectionConfig(request)
      const id = request.params.id

      const pgMeta = new PostgresMeta(config)
      const { data, error } = await pgMeta.materializedViews.retrieve({ id })
      await pgMeta.end()
      if (error) {
        request.log.error({ error, request: extractRequestForLogging(request) })
        reply.code(404)
        return { error: error.message }
      }

      return data
    }
  )
}
export default route
