import { FastifyInstance } from 'fastify'
import { PostgresMeta } from '../../lib/index.js'
import { createConnectionConfig } from '../utils.js'
import { extractRequestForLogging } from '../utils.js'
import {
  PostgresRoleCreate,
  PostgresRoleUpdate,
  postgresRoleSchema,
  postgresRoleCreateSchema,
  postgresRoleUpdateSchema,
} from '../../lib/types.js'
import { Type } from '@sinclair/typebox'
export default async (fastify: FastifyInstance) => {
  fastify.get<{
    Headers: { pg: string }
    Querystring: {
      include_default_roles?: string
      limit?: number
      offset?: number
    }
  }>(
    '/',
    {
      schema: {
        headers: Type.Object({
          pg: Type.String(),
          'x-pg-application-name': Type.Optional(Type.String()),
        }),
        querystring: Type.Object({
          include_system_schemas: Type.Optional(Type.String()),
          limit: Type.Optional(Type.String()),
          offset: Type.Optional(Type.String()),
        }),
        response: {
          200: Type.Array(postgresRoleSchema),
          500: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const config = createConnectionConfig(request)
      const includeDefaultRoles = request.query.include_default_roles === 'true'
      const limit = request.query.limit
      const offset = request.query.offset

      const pgMeta = new PostgresMeta(config)
      const { data, error } = await pgMeta.roles.list({
        includeDefaultRoles,
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
    }
  )

  fastify.get<{
    Headers: { pg: string }
    Params: {
      id: string
    }
  }>(
    '/:id(\\d+)',
    {
      schema: {
        headers: Type.Object({
          pg: Type.String(),
          'x-pg-application-name': Type.Optional(Type.String()),
        }),
        params: Type.Object({
          id: Type.RegExp(/\d+/),
        }),
        response: {
          200: postgresRoleSchema,
          404: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const config = createConnectionConfig(request)
      const id = Number(request.params.id)

      const pgMeta = new PostgresMeta(config)
      const { data, error } = await pgMeta.roles.retrieve({ id })
      await pgMeta.end()
      if (error) {
        request.log.error({ error, request: extractRequestForLogging(request) })
        reply.code(404)
        return { error: error.message }
      }

      return data
    }
  )

  fastify.post<{
    Headers: { pg: string }
    Body: PostgresRoleCreate
  }>(
    '/',
    {
      schema: {
        headers: Type.Object({
          pg: Type.String(),
          'x-pg-application-name': Type.Optional(Type.String()),
        }),
        body: postgresRoleCreateSchema,
        response: {
          200: postgresRoleSchema,
          400: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const config = createConnectionConfig(request)

      const pgMeta = new PostgresMeta(config)
      const { data, error } = await pgMeta.roles.create(request.body)
      await pgMeta.end()
      if (error) {
        request.log.error({ error, request: extractRequestForLogging(request) })
        reply.code(400)
        return { error: error.message }
      }

      return data
    }
  )

  fastify.patch<{
    Headers: { pg: string }
    Params: {
      id: string
    }
    Body: PostgresRoleUpdate
  }>(
    '/:id(\\d+)',
    {
      schema: {
        headers: Type.Object({
          pg: Type.String(),
          'x-pg-application-name': Type.Optional(Type.String()),
        }),
        params: Type.Object({
          id: Type.RegExp(/\d+/),
        }),
        body: postgresRoleUpdateSchema,
        response: {
          200: postgresRoleSchema,
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
      const id = Number(request.params.id)

      const pgMeta = new PostgresMeta(config)
      const { data, error } = await pgMeta.roles.update(id, request.body)
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

  fastify.delete<{
    Headers: { pg: string }
    Params: {
      id: string
    }
  }>(
    '/:id(\\d+)',
    {
      schema: {
        headers: Type.Object({
          pg: Type.String(),
          'x-pg-application-name': Type.Optional(Type.String()),
        }),
        params: Type.Object({
          id: Type.RegExp(/\d+/),
        }),
        querystring: Type.Object({
          cascade: Type.Optional(Type.String()),
        }),
        response: {
          200: postgresRoleSchema,
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
      const id = Number(request.params.id)

      const pgMeta = new PostgresMeta(config)
      const { data, error } = await pgMeta.roles.remove(id)
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
