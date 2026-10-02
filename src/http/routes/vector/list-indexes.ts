import { ERRORS } from '@internal/errors'
import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { sharedErrorResponseSchemas } from '../../schemas/error'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'
import { compileNoCoercionValidator } from './validation'

const listIndex = {
  type: 'object',
  body: {
    type: 'object',
    properties: {
      vectorBucketName: { type: 'string' },
      maxResults: { type: 'number', minimum: 1, maximum: 500, default: 500 },
      nextToken: { type: 'string' },
      prefix: { type: 'string' },
    },
    required: ['vectorBucketName'],
  },
  summary: 'List indexes in a vector bucket',
} as const

interface listIndexRequest extends AuthenticatedRequest {
  Body: FromSchema<(typeof listIndex)['body']>
}

export default async function routes(fastify: FastifyInstance) {
  const listIndexesValidator = compileNoCoercionValidator(listIndex.body)

  fastify.post<listIndexRequest>(
    '/ListIndexes',
    {
      validatorCompiler: listIndexesValidator,
      config: {
        operation: ROUTE_OPERATIONS.LIST_VECTOR_INDEXES,
      },
      schema: {
        ...listIndex,
        response: sharedErrorResponseSchemas,
        tags: ['vector'],
      },
    },
    async (request, response) => {
      if (!request.s3Vector) {
        throw ERRORS.FeatureNotEnabled('vectorStore', 'Vector service not configured')
      }

      const indexResult = await request.s3Vector.listIndexes({
        ...request.body,
        vectorBucketName: request.body.vectorBucketName,
      })

      return response.send(indexResult)
    }
  )
}
