import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { registerJsonParserAllowingEmptyBody } from '../../plugins'
import { createDefaultSchema, createResponse } from '../../routes-helper'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'

const emptyBucketParamsSchema = {
  type: 'object',
  properties: {
    bucketId: { type: 'string', examples: ['avatars'] },
  },
  required: ['bucketId'],
} as const
const successResponseSchema = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
      examples: ['Empty bucket has been queued. Completion may take up to an hour.'],
    },
  },
}
interface emptyBucketRequestInterface extends AuthenticatedRequest {
  Params: FromSchema<typeof emptyBucketParamsSchema>
}

export default async function routes(fastify: FastifyInstance) {
  const summary = 'Empty a bucket'
  const schema = createDefaultSchema(successResponseSchema, {
    params: emptyBucketParamsSchema,
    summary,
    tags: ['bucket'],
  })

  fastify.register(async (f) => {
    registerJsonParserAllowingEmptyBody(f)

    f.post<emptyBucketRequestInterface>(
      '/:bucketId/empty',
      {
        schema,
        config: {
          operation: ROUTE_OPERATIONS.EMPTY_BUCKET,
        },
      },
      async (request, response) => {
        const { bucketId } = request.params

        await request.storage.emptyBucket(bucketId)

        return response
          .status(200)
          .send(createResponse('Empty bucket has been queued. Completion may take up to an hour.'))
      }
    )
  })
}
