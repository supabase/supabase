import { ERRORS } from '@internal/errors'
import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'

const createNamespaceSchema = {
  type: 'object',
  body: {
    type: 'object',
    properties: {
      namespace: { type: 'string', examples: ['namespace'] },
      properties: { type: 'object', additionalProperties: { type: 'string' } },
    },
    required: ['namespace'],
  },
  params: {
    type: 'object',
    properties: {
      prefix: { type: 'string', examples: ['prefix'] },
    },
    required: ['prefix'],
  },
  summary: 'Create a namespace',
} as const

const listNamespaceSchema = {
  type: 'object',
  querystring: {
    type: 'object',
    properties: {
      pageToken: { type: 'string' },
      pageSize: { type: 'integer', finite: true, minimum: 0 },
      parent: { type: 'string' },
    },
  },
  params: {
    type: 'object',
    properties: {
      prefix: { type: 'string', examples: ['prefix'] },
    },
    required: ['prefix'],
  },
  summary: 'List namespaces',
} as const

const loadNamespaceSchema = {
  type: 'object',
  params: {
    type: 'object',
    properties: {
      prefix: { type: 'string', examples: ['prefix'] },
      namespace: { type: 'string', examples: ['namespace'] },
    },
    required: ['prefix', 'namespace'],
  },
  summary: 'Load a namespace',
} as const

const dropNamespaceSchema = {
  type: 'object',
  params: {
    type: 'object',
    properties: {
      prefix: { type: 'string', examples: ['prefix'] },
      namespace: { type: 'string', examples: ['namespace'] },
    },
    required: ['prefix', 'namespace'],
  },
  summary: 'Drop a namespace',
} as const

interface createNamespaceSchemaRequest extends AuthenticatedRequest {
  Body: FromSchema<(typeof createNamespaceSchema)['body']>
  Params: FromSchema<(typeof createNamespaceSchema)['params']>
}

interface listNamespaceSchemaRequest extends AuthenticatedRequest {
  Querystring: FromSchema<(typeof listNamespaceSchema)['querystring']>
  Params: FromSchema<(typeof listNamespaceSchema)['params']>
}

interface dropNamespaceSchemaRequest extends AuthenticatedRequest {
  Params: FromSchema<(typeof dropNamespaceSchema)['params']>
}

interface loadNamespaceSchemaRequest extends AuthenticatedRequest {
  Params: FromSchema<(typeof loadNamespaceSchema)['params']>
}

export default async function routes(fastify: FastifyInstance) {
  fastify.post<createNamespaceSchemaRequest>(
    '/:prefix/namespaces',
    {
      config: {
        operation: ROUTE_OPERATIONS.ICEBERG_CREATE_NAMESPACE,
      },
      schema: { ...createNamespaceSchema, tags: ['iceberg'] },
    },
    async (request, response) => {
      if (!request.icebergCatalog) {
        throw ERRORS.FeatureNotEnabled('icebergCatalog', 'iceberg_catalog')
      }

      const result = await request.icebergCatalog.createNamespace({
        namespace: [request.body.namespace],
        warehouse: request.params.prefix,
        properties: request.body.properties,
      })

      return response.send(result)
    }
  )

  fastify.get<listNamespaceSchemaRequest>(
    '/:prefix/namespaces',
    {
      config: {
        operation: ROUTE_OPERATIONS.ICEBERG_LIST_NAMESPACES,
      },
      schema: { ...listNamespaceSchema, tags: ['iceberg'] },
    },
    async (request, response) => {
      if (!request.icebergCatalog) {
        throw ERRORS.FeatureNotEnabled('icebergCatalog', 'iceberg_catalog')
      }

      const result = await request.icebergCatalog.listNamespaces({
        warehouse: request.params.prefix,
        pageSize: request.query.pageSize || 100,
        pageToken: request.query.pageToken,
        parent: request.query.parent,
      })

      return response.send(result)
    }
  )

  fastify.head<loadNamespaceSchemaRequest>(
    '/:prefix/namespaces/:namespace',
    {
      config: {
        operation: ROUTE_OPERATIONS.ICEBERG_NAMESPACE_EXISTS,
      },
      schema: { ...loadNamespaceSchema, tags: ['iceberg'] },
    },
    async (request, response) => {
      if (!request.icebergCatalog) {
        throw ERRORS.FeatureNotEnabled('icebergCatalog', 'iceberg_catalog')
      }

      const result = await request.icebergCatalog.namespaceExists({
        namespace: request.params.namespace,
        warehouse: request.params.prefix,
      })

      return response.status(204).send(result)
    }
  )

  fastify.get<loadNamespaceSchemaRequest>(
    '/:prefix/namespaces/:namespace',
    {
      config: {
        operation: ROUTE_OPERATIONS.ICEBERG_LOAD_NAMESPACE,
      },
      schema: { ...loadNamespaceSchema, tags: ['iceberg'] },
    },
    async (request, response) => {
      if (!request.icebergCatalog) {
        throw ERRORS.FeatureNotEnabled('icebergCatalog', 'iceberg_catalog')
      }

      const result = await request.icebergCatalog.loadNamespaceMetadata({
        namespace: request.params.namespace,
        warehouse: request.params.prefix,
      })

      return response.send(result)
    }
  )

  fastify.register(async (f) => {
    f.addContentTypeParser('application/json', { bodyLimit: 0 }, (_request, _payload, done) => {
      done(null, null)
    })

    f.delete<dropNamespaceSchemaRequest>(
      '/:prefix/namespaces/:namespace',
      {
        config: {
          operation: ROUTE_OPERATIONS.ICEBERG_DROP_NAMESPACE,
        },
        schema: { ...dropNamespaceSchema, tags: ['iceberg'] },
      },
      async (request, response) => {
        if (!request.icebergCatalog) {
          throw ERRORS.FeatureNotEnabled('icebergCatalog', 'iceberg_catalog')
        }

        await request.icebergCatalog.dropNamespace({
          namespace: request.params.namespace,
          warehouse: request.params.prefix,
        })
        return response.status(204).send()
      }
    )
  })
}
