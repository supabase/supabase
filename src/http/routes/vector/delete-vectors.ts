import { ERRORS } from '@internal/errors'
import { MAX_DELETE_VECTOR_KEYS, MAX_VECTOR_KEY_LENGTH } from '@storage/protocols/vector/limits'
import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { sharedErrorResponseSchemas } from '../../schemas/error'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'
import { compileNoCoercionValidator } from './validation'

const deleteVector = {
  body: {
    type: 'object',
    properties: {
      vectorBucketName: { type: 'string' },
      indexName: { type: 'string' },
      keys: {
        type: 'array',
        minItems: 1,
        maxItems: MAX_DELETE_VECTOR_KEYS,
        items: { type: 'string', minLength: 1, maxLength: MAX_VECTOR_KEY_LENGTH },
      },
    },
    required: ['vectorBucketName', 'indexName', 'keys'],
  },
  summary: 'Delete vectors from an index',
} as const

interface deleteVectorRequest extends AuthenticatedRequest {
  Body: FromSchema<(typeof deleteVector)['body']>
}

export default async function routes(fastify: FastifyInstance) {
  const deleteVectorsValidator = compileNoCoercionValidator(deleteVector.body)

  fastify.post<deleteVectorRequest>(
    '/DeleteVectors',
    {
      validatorCompiler: deleteVectorsValidator,
      config: {
        operation: ROUTE_OPERATIONS.DELETE_VECTORS,
      },
      schema: {
        ...deleteVector,
        response: sharedErrorResponseSchemas,
        tags: ['vector'],
      },
    },
    async (request, response) => {
      if (!request.s3Vector) {
        throw ERRORS.FeatureNotEnabled('vectorStore', 'Vector service not configured')
      }

      await request.s3Vector.deleteVectors({
        vectorBucketName: request.body.vectorBucketName,
        indexName: request.body.indexName,
        keys: request.body.keys,
      })

      return response.send()
    }
  )
}
