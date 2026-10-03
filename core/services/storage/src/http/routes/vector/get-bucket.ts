import { ERRORS } from '@internal/errors'
import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { sharedErrorResponseSchemas } from '../../schemas/error'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'
import { compileNoCoercionValidator } from './validation'

const getVectorBucket = {
  type: 'object',
  body: {
    type: 'object',
    properties: {
      vectorBucketName: { type: 'string' },
    },
    required: ['vectorBucketName'],
  },
  summary: 'Create a vector bucket',
} as const

interface getVectorBucketRequest extends AuthenticatedRequest {
  Body: FromSchema<(typeof getVectorBucket)['body']>
}

export default async function routes(fastify: FastifyInstance) {
  const getVectorBucketValidator = compileNoCoercionValidator(getVectorBucket.body)

  fastify.post<getVectorBucketRequest>(
    '/GetVectorBucket',
    {
      validatorCompiler: getVectorBucketValidator,
      config: {
        operation: ROUTE_OPERATIONS.GET_VECTOR_BUCKET,
      },
      schema: {
        ...getVectorBucket,
        response: sharedErrorResponseSchemas,
        tags: ['vector'],
      },
    },
    async (request, response) => {
      if (!request.s3Vector) {
        throw ERRORS.FeatureNotEnabled('vectorStore', 'Vector service not configured')
      }

      const bucketResult = await request.s3Vector.getBucket(request.body)

      return response.send(bucketResult)
    }
  )
}
