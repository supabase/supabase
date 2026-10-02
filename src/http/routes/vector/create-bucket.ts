import { ERRORS } from '@internal/errors'
import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { sharedErrorResponseSchemas } from '../../schemas/error'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'
import { compileNoCoercionValidator } from './validation'

const createVectorBucket = {
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

interface createVectorBucketRequest extends AuthenticatedRequest {
  Body: FromSchema<(typeof createVectorBucket)['body']>
}

export default async function routes(fastify: FastifyInstance) {
  const createVectorBucketValidator = compileNoCoercionValidator(createVectorBucket.body)

  fastify.post<createVectorBucketRequest>(
    '/CreateVectorBucket',
    {
      validatorCompiler: createVectorBucketValidator,
      config: {
        operation: ROUTE_OPERATIONS.CREATE_VECTOR_BUCKET,
      },
      schema: {
        ...createVectorBucket,
        response: sharedErrorResponseSchemas,
        tags: ['vector'],
      },
    },
    async (request, response) => {
      if (!request.s3Vector) {
        throw ERRORS.FeatureNotEnabled('vectorStore', 'Vector service not configured')
      }

      await request.s3Vector.createBucket(request.body.vectorBucketName)

      return response.send()
    }
  )
}
