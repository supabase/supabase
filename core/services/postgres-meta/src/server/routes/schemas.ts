import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { PostgresMeta } from '../../lib/index.js'
import {
  postgresSchemaSchema,
  postgresSchemaCreateSchema,
  postgresSchemaUpdateSchema,
} from '../../lib/types.js'
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
          include_system_schemas: Type.Optional(Type.Boolean()),
          limit: Type.Optional(Type.Integer()),
          offset: Type.Optional(Type.Integer()),
        }),
        response: {
          200: Type.Array(postgresSchemaSchema),
          500: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const config = createConnectionConfig(request)
      const includeSystemSchemas = request.query.include_system_schemas
      const limit = request.query.limit
      const offset = request.query.offset

      const pgMeta = new PostgresMeta(config)
      const { data, error } = await pgMeta.schemas.list({ includeSystemSchemas, limit, offset })
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
          200: postgresSchemaSchema,
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
      const { data, error } = await pgMeta.schemas.retrieve({ id })
      await pgMeta.end()
      if (error) {
        request.log.error({ error, request: extractRequestForLogging(request) })
        reply.code(404)
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
        body: postgresSchemaCreateSchema,
        response: {
          200: postgresSchemaSchema,
          400: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const config = createConnectionConfig(request)

      const pgMeta = new PostgresMeta(config)
      const { data, error } = await pgMeta.schemas.create(request.body)
      await pgMeta.end()
      if (error) {
        request.log.error({ error, request: extractRequestForLogging(request) })
        reply.code(400)
        return { error: error.message }
      }

      return data
    }
  )

  fastify.patch(
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
        body: postgresSchemaUpdateSchema,
        response: {
          200: postgresSchemaSchema,
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
      const id = request.params.id

      const pgMeta = new PostgresMeta(config)
      const { data, error } = await pgMeta.schemas.update(id, request.body)
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

  fastify.delete(
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
        querystring: Type.Object({
          cascade: Type.Optional(Type.Boolean()),
        }),
        response: {
          200: postgresSchemaSchema,
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
      const id = request.params.id
      const cascade = request.query.cascade

      const pgMeta = new PostgresMeta(config)
      const { data, error } = await pgMeta.schemas.remove(id, { cascade })
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
