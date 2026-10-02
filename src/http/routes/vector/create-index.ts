import { ERRORS } from '@internal/errors'
import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { sharedErrorResponseSchemas } from '../../schemas/error'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'
import { compileNoCoercionValidator } from './validation'

const createVectorIndex = {
  type: 'object',
  body: {
    type: 'object',
    properties: {
      dataType: { type: 'string', enum: ['float32'] },
      dimension: {
        type: 'integer',
        minimum: 1,
        maximum: 4096,
        description:
          'Vector dimensionality. S3 Vectors supports up to 4096. The local pgvector backend supports up to 4000 and will reject larger values.',
      },
      distanceMetric: { type: 'string', enum: ['cosine', 'euclidean'] },
      indexName: {
        type: 'string',
        minLength: 3,
        maxLength: 45,
        pattern: '^[a-z0-9](?:[a-z0-9.-]{1,61})?[a-z0-9]$',
        description:
          '3-63 chars, lowercase letters, numbers, hyphens, dots; must start/end with letter or number. Must be unique within the vector bucket.',
      },
      metadataConfiguration: {
        type: 'object',
        required: ['nonFilterableMetadataKeys'],
        properties: {
          nonFilterableMetadataKeys: {
            type: 'array',
            minItems: 1,
            maxItems: 10,
            uniqueItems: true,
            items: { type: 'string', minLength: 1, maxLength: 63 },
          },
        },
      },
      vectorBucketName: { type: 'string' },
    },
    required: ['dataType', 'dimension', 'distanceMetric', 'indexName', 'vectorBucketName'],
  },
  summary: 'Create a vector index',
} as const

interface createVectorIndexRequest extends AuthenticatedRequest {
  Body: FromSchema<(typeof createVectorIndex)['body']>
}

export default async function routes(fastify: FastifyInstance) {
  const createVectorIndexValidator = compileNoCoercionValidator(createVectorIndex.body)

  fastify.post<createVectorIndexRequest>(
    '/CreateIndex',
    {
      validatorCompiler: createVectorIndexValidator,
      config: {
        operation: ROUTE_OPERATIONS.CREATE_VECTOR_INDEX,
      },
      schema: {
        ...createVectorIndex,
        response: sharedErrorResponseSchemas,
        tags: ['vector'],
      },
    },
    async (request, response) => {
      if (!request.s3Vector) {
        throw ERRORS.FeatureNotEnabled('vectorStore', 'Vector service not configured')
      }

      await request.s3Vector.createVectorIndex(request.body)

      return response.send()
    }
  )
}
