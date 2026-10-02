import { ERRORS } from '@internal/errors'
import { objectListEntrySchema } from '@storage/schemas'
import { FastifyInstance } from 'fastify'
import { FastifyRequest } from 'fastify/types/request'
import { FromSchema } from 'json-schema-to-ts'
import { createDefaultSchema } from '../../routes-helper'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'

const searchRequestParamsSchema = {
  type: 'object',
  properties: {
    bucketName: { type: 'string' },
  },
  required: ['bucketName'],
} as const
const searchRequestBodySchema = {
  type: 'object',
  properties: {
    prefix: { type: 'string', examples: ['folder/subfolder'] },
    exactMatch: { type: 'boolean' },
    limit: { type: 'integer', finite: true, minimum: 1, examples: [10] },
    offset: { type: 'integer', finite: true, minimum: 0, examples: [0] },
    sortBy: {
      type: 'object',
      properties: {
        column: { type: 'string', enum: ['name', 'updated_at', 'created_at', 'last_accessed_at'] },
        order: { type: 'string', enum: ['asc', 'desc'] },
      },
      required: ['column'],
    },
    search: {
      type: 'string',
    },
    noncurrentVersions: { type: 'string', enum: ['exclude', 'include', 'only'] },
    deleteMarkers: { type: 'string', enum: ['exclude', 'include', 'only'] },
  },
  required: ['prefix'],
} as const
const successResponseSchema = {
  type: 'array',
  items: objectListEntrySchema,
}
interface searchRequestInterface extends AuthenticatedRequest {
  Body: FromSchema<typeof searchRequestBodySchema>
  Params: FromSchema<typeof searchRequestParamsSchema>
}
export default async function routes(fastify: FastifyInstance) {
  const summary = 'Search for objects under a prefix'

  const schema = createDefaultSchema(successResponseSchema, {
    body: searchRequestBodySchema,
    params: searchRequestParamsSchema,
    summary,
    tags: ['object'],
  })

  fastify.post<searchRequestInterface>(
    '/list/:bucketName',
    {
      schema,
      config: {
        operation: ROUTE_OPERATIONS.LIST_OBJECTS,
        logMetadata: (req: FastifyRequest<searchRequestInterface>) => ({
          prefix: req.body.prefix,
          limit: req.body.limit,
          offset: req.body.offset,
          sortBy: req.body.sortBy,
        }),
      },
    },
    async (request, response) => {
      const { bucketName } = request.params
      const {
        limit,
        offset,
        sortBy,
        search,
        prefix,
        noncurrentVersions,
        deleteMarkers,
        exactMatch,
      } = request.body

      if (
        ((noncurrentVersions !== undefined && noncurrentVersions !== 'exclude') ||
          (deleteMarkers !== undefined && deleteMarkers !== 'exclude')) &&
        !(await request.storage.db.hasMigration('list-objects-with-versions'))
      ) {
        throw ERRORS.FeatureNotEnabled(bucketName, 'object versioning schema')
      }

      const results = await request.storage.from(bucketName).searchObjects(prefix, {
        limit,
        offset,
        search,
        sortBy: {
          column: sortBy?.column,
          order: sortBy?.order,
        },
        noncurrentVersions,
        deleteMarkers,
        exactMatch,
      })

      return response.status(200).send(results)
    }
  )
}
