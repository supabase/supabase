import { PostgresMeta } from '../../lib/index.js'
import { createConnectionConfig, extractRequestForLogging } from '../utils.js'
import { Type } from '@sinclair/typebox'
import {
  postgresColumnCreateSchema,
  postgresColumnSchema,
  postgresColumnUpdateSchema,
} from '../../lib/types.js'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'

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
          included_schemas: Type.Optional(Type.String()),
          excluded_schemas: Type.Optional(Type.String()),
          limit: Type.Optional(Type.Integer()),
          offset: Type.Optional(Type.Integer()),
        }),
        response: {
          200: Type.Array(postgresColumnSchema),
          500: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const includeSystemSchemas = request.query.include_system_schemas
      const includedSchemas = request.query.included_schemas?.split(',')
      const excludedSchemas = request.query.excluded_schemas?.split(',')
      const limit = request.query.limit
      const offset = request.query.offset

      const config = createConnectionConfig(request)
      const pgMeta = new PostgresMeta(config)
      const { data, error } = await pgMeta.columns.list({
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
    }
  )

  fastify.get(
    '/:tableId(^\\d+):ordinalPosition',
    {
      schema: {
        headers: Type.Object({
          pg: Type.String(),
          'x-pg-application-name': Type.Optional(Type.String()),
        }),
        params: Type.Object({
          tableId: Type.String(),
          ordinalPosition: Type.String(),
        }),
        querystring: Type.Object({
          include_system_schemas: Type.Optional(Type.Boolean()),
          limit: Type.Optional(Type.Integer()),
          offset: Type.Optional(Type.Integer()),
        }),
        response: {
          200: postgresColumnSchema,
          400: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      if (request.params.ordinalPosition === '') {
        const {
          query: { limit, offset },
          params: { tableId },
        } = request
        const includeSystemSchemas = request.query.include_system_schemas

        const config = createConnectionConfig(request)
        const pgMeta: PostgresMeta = new PostgresMeta(config)
        const { data, error } = await pgMeta.columns.list({
          tableId: Number(tableId),
          includeSystemSchemas,
          limit: Number(limit),
          offset: Number(offset),
        })
        await pgMeta.end()
        if (error) {
          request.log.error({ error, request: extractRequestForLogging(request) })
          reply.code(500)
          return { error: error.message }
        }

        return data[0]
      } else if (/^\.\d+$/.test(request.params.ordinalPosition)) {
        const {
          params: { tableId, ordinalPosition: ordinalPositionWithDot },
        } = request
        const ordinalPosition = ordinalPositionWithDot.slice(1)

        const config = createConnectionConfig(request)
        const pgMeta = new PostgresMeta(config)
        const { data, error } = await pgMeta.columns.retrieve({
          id: `${tableId}.${ordinalPosition}`,
        })
        await pgMeta.end()
        if (error) {
          request.log.error({ error, request: extractRequestForLogging(request) })
          reply.code(400)
          if (error.message.startsWith('Cannot find')) reply.code(404)
          return { error: error.message }
        }

        return data
      } else {
        return reply.callNotFound()
      }
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
        body: postgresColumnCreateSchema,
        response: {
          200: postgresColumnSchema,
          400: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const config = createConnectionConfig(request)
      const pgMeta = new PostgresMeta(config)
      const { data, error } = await pgMeta.columns.create(request.body)
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

  fastify.patch(
    '/:id(\\d+\\.\\d+)',
    {
      schema: {
        headers: Type.Object({
          pg: Type.String(),
          'x-pg-application-name': Type.Optional(Type.String()),
        }),
        params: Type.Object({
          id: Type.String(),
        }),
        body: postgresColumnUpdateSchema,
        response: {
          200: postgresColumnSchema,
          400: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const config = createConnectionConfig(request)
      const pgMeta = new PostgresMeta(config)
      const { data, error } = await pgMeta.columns.update(request.params.id, request.body)
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
    '/:id(\\d+\\.\\d+)',
    {
      schema: {
        headers: Type.Object({
          pg: Type.String(),
          'x-pg-application-name': Type.Optional(Type.String()),
        }),
        params: Type.Object({
          id: Type.String(),
        }),
        querystring: Type.Object({
          cascade: Type.Optional(Type.String()),
        }),
        response: {
          200: postgresColumnSchema,
          400: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const cascade = request.query.cascade === 'true'

      const config = createConnectionConfig(request)
      const pgMeta = new PostgresMeta(config)
      const { data, error } = await pgMeta.columns.remove(request.params.id, { cascade })
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
