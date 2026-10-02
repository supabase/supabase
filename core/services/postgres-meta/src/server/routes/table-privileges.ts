import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { PostgresMeta } from '../../lib/index.js'
import {
  postgresTablePrivilegesGrantSchema,
  postgresTablePrivilegesRevokeSchema,
  postgresTablePrivilegesSchema,
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
          200: Type.Array(postgresTablePrivilegesSchema),
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
      const { data, error } = await pgMeta.tablePrivileges.list({
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
        body: Type.Array(postgresTablePrivilegesGrantSchema),
        response: {
          200: Type.Array(postgresTablePrivilegesSchema),
          400: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const config = createConnectionConfig(request)

      const pgMeta = new PostgresMeta(config)
      const { data, error } = await pgMeta.tablePrivileges.grant(request.body)
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
        body: Type.Array(postgresTablePrivilegesRevokeSchema),
        response: {
          200: Type.Array(postgresTablePrivilegesSchema),
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
      const { data, error } = await pgMeta.tablePrivileges.revoke(request.body)
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
