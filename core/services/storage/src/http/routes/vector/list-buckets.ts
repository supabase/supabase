import { ERRORS } from '@internal/errors'
import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { sharedErrorResponseSchemas } from '../../schemas/error'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'
import { compileNoCoercionValidator } from './validation'

const listBucket = {
  type: 'object',
  body: {
    type: 'object',
    properties: {
      maxResults: { type: 'number', minimum: 1, maximum: 500, default: 500 },
      nextToken: { type: 'string' },
      prefix: { type: 'string' },
    },
  },
  summary: 'List vector buckets',
} as const

interface listBucketRequest extends AuthenticatedRequest {
  Body: FromSchema<(typeof listBucket)['body']>
}

export default async function routes(fastify: FastifyInstance) {
  const listBucketsValidator = compileNoCoercionValidator(listBucket.body)

  fastify.post<listBucketRequest>(
    '/ListVectorBuckets',
    {
      validatorCompiler: listBucketsValidator,
      config: {
        operation: ROUTE_OPERATIONS.LIST_VECTOR_BUCKETS,
      },
      schema: {
        ...listBucket,
        response: sharedErrorResponseSchemas,
        tags: ['vector'],
      },
    },
    async (request, response) => {
      if (!request.s3Vector) {
        throw ERRORS.FeatureNotEnabled('vectorStore', 'Vector service not configured')
      }

      const listBucketsResult = await request.s3Vector.listBuckets(request.body)

      return response.send(listBucketsResult)
    }
  )
}
