import { ERRORS } from '@internal/errors'
import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { sharedErrorResponseSchemas } from '../../schemas/error'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'
import { compileNoCoercionValidator } from './validation'

const deleteVectorIndex = {
  type: 'object',
  body: {
    type: 'object',
    properties: {
      indexName: {
        type: 'string',
        minLength: 3,
        maxLength: 45,
        pattern: '^[a-z0-9](?:[a-z0-9.-]{1,61})?[a-z0-9]$',
        description:
          '3-63 chars, lowercase letters, numbers, hyphens, dots; must start/end with letter or number. Must be unique within the vector bucket.',
      },
      vectorBucketName: { type: 'string' },
    },
    required: ['indexName', 'vectorBucketName'],
  },
  summary: 'Delete a vector index',
} as const

interface deleteVectorIndexRequest extends AuthenticatedRequest {
  Body: FromSchema<(typeof deleteVectorIndex)['body']>
}

export default async function routes(fastify: FastifyInstance) {
  const deleteVectorIndexValidator = compileNoCoercionValidator(deleteVectorIndex.body)

  fastify.post<deleteVectorIndexRequest>(
    '/DeleteIndex',
    {
      validatorCompiler: deleteVectorIndexValidator,
      config: {
        operation: ROUTE_OPERATIONS.DELETE_VECTOR_INDEX,
      },
      schema: {
        ...deleteVectorIndex,
        response: sharedErrorResponseSchemas,
        tags: ['vector'],
      },
    },
    async (request, response) => {
      if (!request.s3Vector) {
        throw ERRORS.FeatureNotEnabled('vectorStore', 'Vector service not configured')
      }

      await request.s3Vector.deleteIndex(request.body)

      return response.send()
    }
  )
}
