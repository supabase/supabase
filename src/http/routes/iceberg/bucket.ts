import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { createResponse } from '../../routes-helper'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'

const deleteBucketParamsSchema = {
  type: 'object',
  properties: {
    bucketName: { type: 'string', examples: ['avatars'] },
  },
  required: ['bucketName'],
} as const

const createBucketBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', examples: ['avatars'] },
  },
  required: ['name'],
} as const

const listBucketsQuerySchema = {
  type: 'object',
  properties: {
    limit: { type: 'integer', finite: true, minimum: 1, examples: [10] },
    offset: { type: 'integer', finite: true, minimum: 0, examples: [0] },
    sortColumn: { type: 'string', enum: ['id', 'name', 'created_at', 'updated_at'] },
    sortOrder: { type: 'string', enum: ['asc', 'desc'] },
    search: { type: 'string', examples: ['my-bucket'] },
  },
} as const

interface deleteBucketRequestInterface extends AuthenticatedRequest {
  Params: FromSchema<typeof deleteBucketParamsSchema>
}

interface createBucketRequestInterface extends AuthenticatedRequest {
  Body: FromSchema<typeof createBucketBodySchema>
}

interface listBucketRequestInterface extends AuthenticatedRequest {
  Querystring: FromSchema<typeof listBucketsQuerySchema>
}

export default async function routes(fastify: FastifyInstance) {
  fastify.register(async (f) => {
    f.addContentTypeParser('application/json', { bodyLimit: 0 }, (_request, _payload, done) => {
      done(null, null)
    })

    f.delete<deleteBucketRequestInterface>(
      '/bucket/:bucketName',
      {
        schema: {
          params: deleteBucketParamsSchema,
          summary: 'Delete an analytics bucket',
          tags: ['bucket'],
        },
        config: {
          operation: ROUTE_OPERATIONS.DELETE_BUCKET,
        },
      },
      async (request, response) => {
        const { bucketName } = request.params
        await request.storage.deleteIcebergBucket(bucketName)

        return response.status(200).send(createResponse('Successfully deleted'))
      }
    )
  })

  fastify.post<createBucketRequestInterface>(
    '/bucket',
    {
      schema: {
        body: createBucketBodySchema,
        summary: 'Create an analytics bucket',
        tags: ['bucket'],
      },
      config: {
        operation: ROUTE_OPERATIONS.CREATE_BUCKET,
      },
    },
    async (request, response) => {
      const { name } = request.body
      const bucket = await request.storage.createIcebergBucket({
        name,
      })

      return response.status(200).send({
        id: bucket.name,
        name: bucket.name,
        created_at: bucket.created_at,
        updated_at: bucket.updated_at,
      })
    }
  )

  fastify.get<listBucketRequestInterface>(
    '/bucket',
    {
      schema: {
        querystring: listBucketsQuerySchema,
        summary: 'List analytics buckets',
        tags: ['bucket'],
      },
      config: {
        operation: ROUTE_OPERATIONS.LIST_BUCKET,
      },
    },
    async (request, response) => {
      const query = request.query

      const bucket = await request.storage.listAnalyticsBuckets('name,created_at,updated_at', {
        limit: query.limit,
        offset: query.offset,
        sortColumn: query.sortColumn,
        sortOrder: query.sortOrder,
        search: query.search,
      })

      return response.status(200).send(
        bucket.map((b) => ({
          ...b,
          id: b.name,
        }))
      )
    }
  )
}
