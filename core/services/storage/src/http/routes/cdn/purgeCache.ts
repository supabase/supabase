import { CdnCacheManager } from '@storage/cdn/cdn-cache-manager'
import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { createDefaultSchema, createResponse } from '../../routes-helper'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'

const purgeObjectParamsSchema = {
  type: 'object',
  properties: {
    bucketName: { type: 'string', examples: ['avatars'] },
    '*': { type: 'string', examples: ['folder/cat.png'], minLength: 1 },
  },
  required: ['bucketName', '*'],
} as const

const purgeBucketParamsSchema = {
  type: 'object',
  properties: {
    bucketName: { type: 'string', examples: ['avatars'] },
  },
  required: ['bucketName'],
} as const

const purgeQuerySchema = {
  type: 'object',
  properties: {
    transformations: { type: 'boolean' },
  },
} as const

const successResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string', examples: ['success'] },
  },
}

interface PurgeObjectRequestInterface extends AuthenticatedRequest {
  Params: FromSchema<typeof purgeObjectParamsSchema>
  Querystring: FromSchema<typeof purgeQuerySchema>
}

interface PurgeBucketRequestInterface extends AuthenticatedRequest {
  Params: FromSchema<typeof purgeBucketParamsSchema>
  Querystring: FromSchema<typeof purgeQuerySchema>
}

interface PurgeTenantRequestInterface extends AuthenticatedRequest {
  Querystring: FromSchema<typeof purgeQuerySchema>
}

export default async function routes(fastify: FastifyInstance) {
  const cdnCache = new CdnCacheManager()

  // Purge tenant cache
  fastify.delete<PurgeTenantRequestInterface>(
    '/',
    {
      schema: createDefaultSchema(successResponseSchema, {
        querystring: purgeQuerySchema,
        summary: 'Purge cache for entire tenant or tenant transformations',
        tags: ['cdn'],
      }),
      config: {
        operation: ROUTE_OPERATIONS.PURGE_TENANT_CACHE,
      },
    },
    async (request, response) => {
      const { transformations } = request.query

      await cdnCache.purge({
        type: transformations ? 'tenant-transforms' : 'tenant',
        tenant: request.tenantId,
      })

      return response.status(200).send(createResponse('success', '200'))
    }
  )

  // Purge bucket cache
  fastify.delete<PurgeBucketRequestInterface>(
    '/:bucketName',
    {
      schema: createDefaultSchema(successResponseSchema, {
        params: purgeBucketParamsSchema,
        querystring: purgeQuerySchema,
        summary: 'Purge cache for an entire bucket or bucket transformations',
        tags: ['cdn'],
      }),
      config: {
        operation: ROUTE_OPERATIONS.PURGE_BUCKET_CACHE,
      },
    },
    async (request, response) => {
      const { bucketName } = request.params
      const { transformations } = request.query

      await cdnCache.purge({
        type: transformations ? 'bucket-transforms' : 'bucket',
        bucket: bucketName,
        tenant: request.tenantId,
      })

      return response.status(200).send(createResponse('success', '200'))
    }
  )

  // Purge object cache
  fastify.delete<PurgeObjectRequestInterface>(
    '/:bucketName/*',
    {
      schema: createDefaultSchema(successResponseSchema, {
        params: purgeObjectParamsSchema,
        querystring: purgeQuerySchema,
        summary: 'Purge cache for an object or object transformations',
        tags: ['cdn'],
      }),
      config: {
        operation: ROUTE_OPERATIONS.PURGE_OBJECT_CACHE,
      },
    },
    async (request, response) => {
      const { bucketName } = request.params
      const objectName = request.params['*']
      const { transformations } = request.query

      await cdnCache.purge({
        type: transformations ? 'object-transforms' : 'object',
        bucket: bucketName,
        objectName,
        tenant: request.tenantId,
      })

      return response.status(200).send(createResponse('success', '200'))
    }
  )
}
