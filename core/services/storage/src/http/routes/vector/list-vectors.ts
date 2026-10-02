import { ERRORS } from '@internal/errors'
import { MAX_LIST_RESULTS, MAX_SEGMENT_COUNT } from '@storage/protocols/vector/limits'
import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { sharedErrorResponseSchemas } from '../../schemas/error'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'
import { compileNoCoercionValidator } from './validation'

const listVectors = {
  type: 'object',
  body: {
    type: 'object',
    properties: {
      vectorBucketName: { type: 'string' },
      indexArn: { type: 'string' },
      indexName: {
        type: 'string',
        minLength: 3,
        maxLength: 45,
        pattern: '^[a-z0-9](?:[a-z0-9.-]{1,61})?[a-z0-9]$',
        description:
          '3-63 chars, lowercase letters, numbers, hyphens, dots; must start/end with letter or number. Must be unique within the vector bucket.',
      },
      maxResults: { type: 'integer', minimum: 1, maximum: MAX_LIST_RESULTS },
      nextToken: { type: 'string' },
      returnData: { type: 'boolean' },
      returnMetadata: { type: 'boolean' },
      segmentCount: { type: 'integer', minimum: 1, maximum: MAX_SEGMENT_COUNT },
      segmentIndex: { type: 'integer', minimum: 0, maximum: MAX_SEGMENT_COUNT - 1 },
    },
    required: ['vectorBucketName', 'indexName'],
  },
  summary: 'List vectors in a vector index',
} as const

interface listVectorsRequest extends AuthenticatedRequest {
  Body: FromSchema<(typeof listVectors)['body']>
}

export default async function routes(fastify: FastifyInstance) {
  const listVectorsValidator = compileNoCoercionValidator(listVectors.body)

  fastify.post<listVectorsRequest>(
    '/ListVectors',
    {
      validatorCompiler: listVectorsValidator,
      config: {
        operation: ROUTE_OPERATIONS.LIST_VECTORS,
      },
      schema: {
        ...listVectors,
        response: sharedErrorResponseSchemas,
        tags: ['vector'],
      },
    },
    async (request, response) => {
      if (!request.s3Vector) {
        throw ERRORS.FeatureNotEnabled('vectorStore', 'Vector service not configured')
      }

      const { segmentCount, segmentIndex } = request.body
      if (
        (segmentCount === undefined && segmentIndex !== undefined) ||
        (segmentCount !== undefined && segmentIndex === undefined)
      ) {
        throw ERRORS.InvalidParameter('segmentCount/segmentIndex', {
          message: 'segmentCount and segmentIndex must be provided together',
        })
      }

      if (
        segmentCount !== undefined &&
        segmentIndex !== undefined &&
        segmentIndex >= segmentCount
      ) {
        throw ERRORS.InvalidParameter('segmentIndex', {
          message: 'segmentIndex must be less than segmentCount',
        })
      }

      const indexResult = await request.s3Vector.listVectors(request.body)

      return response.send(indexResult)
    }
  )
}
