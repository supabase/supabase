import { DBMigration } from '@internal/database/migrations'
import { ERRORS, ErrorCode } from '@internal/errors'
import { FastifyInstance } from 'fastify'
import { FastifyRequest } from 'fastify/types/request'
import { FromSchema } from 'json-schema-to-ts'
import { getConfig } from '../../../config'
import { sharedErrorResponseSchemas } from '../../schemas/error'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'

const { isMultitenant } = getConfig()

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
    cursor: { type: 'string' },
    with_delimiter: { type: 'boolean' },
    sortBy: {
      type: 'object',
      properties: {
        column: { type: 'string', enum: ['name', 'updated_at', 'created_at'] },
        order: { type: 'string', enum: ['asc', 'desc'] },
      },
      required: ['column'],
    },
    noncurrentVersions: { type: 'string', enum: ['exclude', 'include', 'only'] },
    deleteMarkers: { type: 'string', enum: ['exclude', 'include', 'only'] },
  },
} as const
interface searchRequestInterface extends AuthenticatedRequest {
  Body: FromSchema<typeof searchRequestBodySchema>
  Params: FromSchema<typeof searchRequestParamsSchema>
}
export default async function routes(fastify: FastifyInstance) {
  const summary = 'Search for objects under a prefix'

  fastify.post<searchRequestInterface>(
    '/list-v2/:bucketName',
    {
      schema: {
        body: searchRequestBodySchema,
        params: searchRequestParamsSchema,
        response: sharedErrorResponseSchemas,
        summary,
        tags: ['object'],
      },
      config: {
        operation: ROUTE_OPERATIONS.LIST_OBJECTS_V2,
        logMetadata: (req: FastifyRequest<searchRequestInterface>) => ({
          prefix: req.body.prefix,
          limit: req.body.limit,
          cursor: req.body.cursor,
          sortBy: req.body.sortBy,
          with_delimiter: req.body.with_delimiter,
        }),
      },
    },
    async (request, response) => {
      const latestMigration = request.latestMigration
      if (
        isMultitenant &&
        latestMigration &&
        DBMigration[latestMigration] < DBMigration['search-v2']
      ) {
        return response.status(400).send({
          statusCode: '400',
          error: 'FeatureNotEnabled',
          message: 'This feature is not available for your tenant',
          code: ErrorCode.FeatureNotEnabled,
        })
      }

      const { bucketName } = request.params
      const {
        limit,
        with_delimiter,
        cursor,
        prefix,
        sortBy,
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

      const results = await request.storage.from(bucketName).listObjectsV2({
        prefix,
        delimiter: with_delimiter ? '/' : undefined,
        maxKeys: limit,
        cursor,
        sortBy,
        noncurrentVersions,
        deleteMarkers,
        exactMatch,
      })

      return response.status(200).send(results)
    }
  )
}
