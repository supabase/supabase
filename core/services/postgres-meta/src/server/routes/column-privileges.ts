import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { PostgresMeta } from '../../lib/index.js'
import {
  postgresColumnPrivilegesGrantSchema,
  postgresColumnPrivilegesRevokeSchema,
  postgresColumnPrivilegesSchema,
} from '../../lib/types.js'
import { createConnectionConfig } from '../utils.js'
import { extractRequestForLogging, translateErrorToResponseCode } from '../utils.js'

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
          include_system_schemas: Type.Optional(Type.Boolean()),
          // Note: this only supports comma separated values (e.g., "...?included_schemas=public,core")
          included_schemas: Type.Optional(Type.String()),
          excluded_schemas: Type.Optional(Type.String()),
          limit: Type.Optional(Type.Integer()),
          offset: Type.Optional(Type.Integer()),
        }),
        response: {
          200: Type.Array(postgresColumnPrivilegesSchema),
          500: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const config = createConnectionConfig(request)
      const includeSystemSchemas = request.query.include_system_schemas
      const includedSchemas = request.query.included_schemas?.split(',')
      const excludedSchemas = request.query.excluded_schemas?.split(',')
      const limit = request.query.limit
      const offset = request.query.offset

      const pgMeta = new PostgresMeta(config)
      const { data, error } = await pgMeta.columnPrivileges.list({
        includeSystemSchemas,
        includedSchemas,
        excludedSchemas,
        limit,
        offset,
      })
      await pgMeta.end()
      if (error) {
        request.log.error({ error, request: extractRequestForLogging(request) })
        reply.code(translateErrorToResponseCode(error, 500))
        return { error: error.message }
      }

      return data
    }
  )

  fastify.post(
    '/',
    {
      schema: {
        headers: Type.Object({
          pg: Type.String(),
          'x-pg-application-name': Type.Optional(Type.String()),
        }),
        body: Type.Array(postgresColumnPrivilegesGrantSchema),
        response: {
          200: Type.Array(postgresColumnPrivilegesSchema),
          400: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const config = createConnectionConfig(request)

      const pgMeta = new PostgresMeta(config)
      const { data, error } = await pgMeta.columnPrivileges.grant(request.body)
      await pgMeta.end()
      if (error) {
        request.log.error({ error, request: extractRequestForLogging(request) })
        reply.code(400)
        return { error: error.message }
      }

      return data
    }
  )

  fastify.delete(
    '/',
    {
      schema: {
        headers: Type.Object({
          pg: Type.String(),
          'x-pg-application-name': Type.Optional(Type.String()),
        }),
        body: Type.Array(postgresColumnPrivilegesRevokeSchema),
        response: {
          200: Type.Array(postgresColumnPrivilegesSchema),
          400: Type.Object({
            error: Type.String(),
          }),
          404: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const config = createConnectionConfig(request)

      const pgMeta = new PostgresMeta(config)
      const { data, error } = await pgMeta.columnPrivileges.revoke(request.body)
      await pgMeta.end()
      if (error) {
        request.log.error({ error, request: extractRequestForLogging(request) })
        reply.code(400)
        if (error.message.startsWith('Cannot find')) reply.code(404)
        return { error: error.message }
      }

      return data
    }
  )
}
export default route
