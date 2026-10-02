import { ERRORS } from '@internal/errors'
import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { sharedErrorResponseSchemas } from '../../schemas/error'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'
import { compileNoCoercionValidator } from './validation'

const getVectorIndex = {
  type: 'object',
  body: {
    type: 'object',
    properties: {
      vectorBucketName: { type: 'string' },
      indexName: {
        type: 'string',
        minLength: 3,
        maxLength: 45,
        pattern: '^[a-z0-9](?:[a-z0-9.-]{1,61})?[a-z0-9]$',
        description:
          '3-63 chars, lowercase letters, numbers, hyphens, dots; must start/end with letter or number. Must be unique within the vector bucket.',
      },
    },
    required: ['vectorBucketName', 'indexName'],
  },
  summary: 'Get a vector index',
} as const

interface getVectorIndexRequest extends AuthenticatedRequest {
  Body: FromSchema<(typeof getVectorIndex)['body']>
}

export default async function routes(fastify: FastifyInstance) {
  const getVectorIndexValidator = compileNoCoercionValidator(getVectorIndex.body)

  fastify.post<getVectorIndexRequest>(
    '/GetIndex',
    {
      validatorCompiler: getVectorIndexValidator,
      config: {
        operation: ROUTE_OPERATIONS.GET_VECTOR_INDEX,
      },
      schema: {
        ...getVectorIndex,
        response: sharedErrorResponseSchemas,
        tags: ['vector'],
      },
    },
    async (request, response) => {
      if (!request.s3Vector) {
        throw ERRORS.FeatureNotEnabled('vectorStore', 'Vector service not configured')
      }

      const indexResult = await request.s3Vector.getIndex({
        vectorBucketName: request.body.vectorBucketName,
        indexName: request.body.indexName,
      })

      return response.send({
        ...indexResult,
        index: {
          ...indexResult.index,
          creationTime: indexResult.index?.creationTime
            ? Math.floor(indexResult.index?.creationTime?.getTime() / 1000)
            : undefined,
        },
      })
    }
  )
}
