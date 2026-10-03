import { ERRORS } from '@internal/errors'
import {
  MAX_PUT_VECTORS,
  MAX_VECTOR_KEY_LENGTH,
  MIN_VECTOR_DIMENSIONS,
} from '@storage/protocols/vector/limits'
import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { sharedErrorResponseSchemas } from '../../schemas/error'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'
import { compileNoCoercionValidator } from './validation'

const metadataPrimitive = {
  anyOf: [{ type: 'string' }, { type: 'boolean' }, { type: 'number' }],
} as const

const putVector = {
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
      vectors: {
        type: 'array',
        minItems: 1,
        maxItems: MAX_PUT_VECTORS,
        items: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                float32: {
                  type: 'array',
                  minItems: MIN_VECTOR_DIMENSIONS,
                  items: { type: 'number' },
                },
              },
              required: ['float32'],
            },
            metadata: {
              type: 'object',
              additionalProperties: {
                anyOf: [
                  metadataPrimitive,
                  {
                    type: 'array',
                    items: metadataPrimitive,
                  },
                ],
              },
            },
            key: { type: 'string', minLength: 1, maxLength: MAX_VECTOR_KEY_LENGTH },
          },
          required: ['data', 'key'],
        },
      },
    },
    required: ['vectorBucketName', 'indexName', 'vectors'],
  },
  summary: 'Put vectors into an index',
} as const

interface putVectorRequest extends AuthenticatedRequest {
  Body: FromSchema<(typeof putVector)['body']>
}

export default async function routes(fastify: FastifyInstance) {
  const putVectorsValidator = compileNoCoercionValidator(putVector.body)

  fastify.post<putVectorRequest>(
    '/PutVectors',
    {
      bodyLimit: 20 * 1024 * 1024, // 20 MB
      validatorCompiler: putVectorsValidator,
      config: {
        operation: ROUTE_OPERATIONS.PUT_VECTORS,
      },
      schema: {
        ...putVector,
        response: sharedErrorResponseSchemas,
        tags: ['vector'],
      },
    },
    async (request, response) => {
      if (!request.s3Vector) {
        throw ERRORS.FeatureNotEnabled('vectorStore', 'Vector service not configured')
      }

      const indexResult = await request.s3Vector.putVectors({
        vectorBucketName: request.body.vectorBucketName,
        indexName: request.body.indexName,
        vectors: request.body.vectors.map((v) => {
          return {
            ...v,
            key: v.key ?? undefined,
          }
        }),
      })

      return response.send(indexResult)
    }
  )
}
