import { bucketSchema } from '@storage/schemas'
import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { createDefaultSchema } from '../../routes-helper'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'

const getBucketParamsSchema = {
  type: 'object',
  properties: {
    bucketId: { type: 'string', examples: ['avatars'] },
  },
  required: ['bucketId'],
} as const

const successResponseSchema = bucketSchema
interface getBucketRequestInterface extends AuthenticatedRequest {
  Params: FromSchema<typeof getBucketParamsSchema>
}

export default async function routes(fastify: FastifyInstance) {
  const summary = 'Get details of a bucket'
  const schema = createDefaultSchema(successResponseSchema, {
    params: getBucketParamsSchema,
    summary,
    tags: ['bucket'],
  })
  fastify.get<getBucketRequestInterface>(
    '/:bucketId',
    {
      schema,
      config: {
        operation: ROUTE_OPERATIONS.GET_BUCKET,
      },
    },
    async (request, response) => {
      const { bucketId } = request.params

      const results = await request.storage.findBucket(
        bucketId,
        'id, name, owner, public, created_at, updated_at, file_size_limit, allowed_mime_types'
      )

      return response.send(results)
    }
  )
}
