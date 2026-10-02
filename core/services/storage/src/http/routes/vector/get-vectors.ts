import { ERRORS } from '@internal/errors'
import { MAX_GET_VECTOR_KEYS, MAX_VECTOR_KEY_LENGTH } from '@storage/protocols/vector/limits'
import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { sharedErrorResponseSchemas } from '../../schemas/error'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'
import { compileNoCoercionValidator } from './validation'

const getVectors = {
  type: 'object',
  body: {
    type: 'object',
    properties: {
      indexName: { type: 'string' },
      keys: {
        type: 'array',
        minItems: 1,
        maxItems: MAX_GET_VECTOR_KEYS,
        items: { type: 'string', minLength: 1, maxLength: MAX_VECTOR_KEY_LENGTH },
      },
      returnData: { type: 'boolean', default: false },
      returnMetadata: { type: 'boolean', default: false },
      vectorBucketName: { type: 'string' },
    },
    required: ['indexName', 'keys', 'vectorBucketName'],
  },
  summary: 'Returns vector attributes',
} as const

interface getVectorsRequest extends AuthenticatedRequest {
  Body: FromSchema<(typeof getVectors)['body']>
}

export default async function routes(fastify: FastifyInstance) {
  const getVectorsValidator = compileNoCoercionValidator(getVectors.body)

  fastify.post<getVectorsRequest>(
    '/GetVectors',
    {
      validatorCompiler: getVectorsValidator,
      config: {
        operation: ROUTE_OPERATIONS.GET_VECTORS,
      },
      schema: {
        ...getVectors,
        response: sharedErrorResponseSchemas,
        tags: ['vector'],
      },
    },
    async (request, response) => {
      if (!request.s3Vector) {
        throw ERRORS.FeatureNotEnabled('vectorStore', 'Vector service not configured')
      }

      const indexResult = await request.s3Vector.getVectors(request.body)

      return response.send(indexResult)
    }
  )
}
